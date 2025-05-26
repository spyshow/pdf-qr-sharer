const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const qrcode = require("qrcode");
const ip = require("ip");
const cors = require("cors"); // Require CORS
const db = require('./database'); // Import db from database.js

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors()); // Add CORS middleware

// Root GET endpoint for diagnostic purposes
app.get('/', (req, res) => {
  res.send('Backend server is running and responsive!');
});

// Ensure uploads directory exists
// db connection is already initialized and tables created when database.js is imported.
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Set up multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    let customName = req.body.fileName;
    let sanitizedName = "";

    if (customName) {
      // Remove extension from customName before sanitizing, if present
      const originalExt = path.extname(customName); // e.g. .pdf
      const nameWithoutExt = originalExt ? customName.substring(0, customName.length - originalExt.length) : customName;
      sanitizedName = nameWithoutExt.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, ''); // Allow hyphens and underscores
    }

    // Fallback to original filename if customName is empty or results in empty sanitizedName
    if (!sanitizedName) {
      const originalNameWithoutExt = path.basename(file.originalname, path.extname(file.originalname));
      sanitizedName = originalNameWithoutExt.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
    }
    
    // Ultimate fallback if somehow still empty (e.g. originalname was only invalid chars)
    if (!sanitizedName) {
      sanitizedName = `upload_${Date.now()}`;
    }

    // Ensure extension is present
    const fileExt = path.extname(file.originalname) || '.pdf'; // Default to .pdf if original has no extension
    cb(null, sanitizedName + fileExt);
  },
});

const upload = multer({ storage: storage });

// POST route for file upload
app.post("/upload", upload.single("pdfFile"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded." });
  }

  // finalFileName is the name set by multer's filename function
  const finalFileName = req.file.filename;
  const original_name = req.file.originalname;
  const custom_name = req.body.fileName || null; // Use null if not provided
  const saved_filename = finalFileName;
  
  // Construct file_url
  const encodedFinalFileName = encodeURIComponent(finalFileName);
  const file_url = `${req.protocol}://${req.get('host')}/pdfs/${encodedFinalFileName}`;

  // Process tags
  const tagsString = req.body.tags || "";
  const processedTags = tagsString.split(',')
                                .map(tag => tag.trim())
                                .filter(tag => tag !== "");

  let successfulFileId = null;

  try {
    const dbOperation = () => {
      // 1. Insert into files table
      const fileStmt = db.prepare(`
        INSERT INTO files (original_name, custom_name, saved_filename, file_url) 
        VALUES (?, ?, ?, ?)
      `);
      const fileInsertResult = fileStmt.run(original_name, custom_name, saved_filename, file_url);
      const file_id = fileInsertResult.lastInsertRowid;

      if (!file_id) {
        // This error will be caught by the outer catch block
        throw new Error("Failed to insert file record into database, no lastInsertRowid returned.");
      }

      // 2. Process tags
      const upsertTagStmt = db.prepare(`
        INSERT INTO tags (name) VALUES (?) ON CONFLICT(name) DO NOTHING
      `);
      const selectTagStmt = db.prepare(`
        SELECT id FROM tags WHERE name = ?
      `);
      const insertFileTagStmt = db.prepare(`
        INSERT INTO file_tags (file_id, tag_id) VALUES (?, ?)
      `);

      for (const tagName of processedTags) {
        upsertTagStmt.run(tagName);
        const tag = selectTagStmt.get(tagName);
        if (tag && tag.id) {
          insertFileTagStmt.run(file_id, tag.id);
        } else {
          // Log this, but don't necessarily rollback the transaction unless strictness demands it.
          // If this is critical, an error should be thrown here.
          console.error(`Failed to find or create tag: ${tagName} for file_id: ${file_id}. Continuing with other tags.`);
        }
      }
      return { fileId: file_id }; // Return relevant data on success
    };

    const { fileId } = db.transaction(dbOperation)(); // Execute transaction
    successfulFileId = fileId; // Set if transaction was successful

  } catch (error) { // This catch block now handles all errors from the transaction
    let statusCode = 500;
    let responseMessage = "Error processing file or database operation";

    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      if (error.message && error.message.includes('files.file_url')) {
        statusCode = 409;
        responseMessage = "This file name (or a resulting URL) already exists. Please use a different name or upload a different file.";
      } else if (error.message && error.message.includes('files.saved_filename')) {
        statusCode = 409;
        responseMessage = "This file's sanitized name conflicts with an existing one. Try a different custom name.";
      } else {
        // Another unique constraint violation
        statusCode = 409; // Or 500 if not considered a client-fixable conflict
        responseMessage = `A unique data conflict occurred: ${error.message}`;
      }
    } else {
      // For other errors, keep it as a general server error or use error.message
      responseMessage = error.message || responseMessage;
    }

    // Ensure physical file is deleted on any error during DB operations
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error("Error deleting file after DB operation failure:", unlinkErr);
      });
    }
    
    console.error("Error during file upload processing or database operation:", error);
    return res.status(statusCode).json({ message: responseMessage, error: error.message });
  }
  
  // The successful path, if no error was caught:
  if (successfulFileId) {
      try {
          const qrCodeDataUrl = await qrcode.toDataURL(file_url);
          res.json({
              message: "File uploaded and processed successfully",
              filename: finalFileName,
              originalName: original_name,
              tags: tagsString,
              pdfUrl: file_url,
              qrCodeDataUrl: qrCodeDataUrl,
          });
      } catch (qrError) {
          console.error("Error generating QR code:", qrError);
          // File is in DB, but QR code failed.
          res.status(500).json({ 
              message: "File uploaded but QR code generation failed.", 
              error: qrError.message,
              // Include file_id and pdfUrl so client knows where the file is despite QR failure
              file_id: successfulFileId, 
              pdfUrl: file_url
          });
      }
  } else {
      // This 'else' should ideally not be reached if the try-catch logic for DB ops is comprehensive.
      // It implies the try block completed without error, but successfulFileId was not set.
      console.error("Reached unexpected state: No DB error, but no successfulFileId. This indicates a logic flaw.");
      if (req.file && req.file.path) {
         fs.unlink(req.file.path, (unlinkErr) => {
           if (unlinkErr) console.error("Error deleting file in unexpected no-error, no-success state:", unlinkErr);
         });
      }
      return res.status(500).json({ message: "An unknown error occurred during processing. File not saved." });
  }
});

// GET route for fetching all tags
app.get('/api/tags', async (req, res) => {
  try {
    const stmt = db.prepare('SELECT name FROM tags ORDER BY name ASC');
    const tagObjects = stmt.all(); // Returns an array of objects, e.g., [{name: 'tag1'}, {name: 'tag2'}]
    const tagNames = tagObjects.map(tagObj => tagObj.name); // Extract just the names

    res.json(tagNames);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ message: 'Failed to fetch tags', error: error.message });
  }
});

// Serve static files from the 'uploads' directory
// Make sure this is also correctly handling potential special characters in filenames if necessary
// express.static by default uses 'send' which handles Content-Disposition and ETag, and should be fine.
app.use("/pdfs", express.static(uploadsDir));

// Start the server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on http://${ip.address()}:${PORT}`);
  console.log(`Allowing requests from all origins (CORS enabled)`);
});
