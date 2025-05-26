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

  let conflictFound = false;
  let successfulFileId = null;
  let transactionErrorOccurred = false;
  let transactionErrorMessage = "";

  try {
    const result = db.transaction(() => {
      // 1. Check for existing file_url WITHIN the transaction
      const checkUrlStmt = db.prepare('SELECT id FROM files WHERE file_url = ?');
      const existingFile = checkUrlStmt.get(file_url);

      if (existingFile) {
        return { conflict: true, fileId: null, error: null }; // Signal conflict
      }

      // 2. Insert into files table (if no conflict)
      const fileStmt = db.prepare(`
        INSERT INTO files (original_name, custom_name, saved_filename, file_url) 
        VALUES (?, ?, ?, ?)
      `);
      const fileInsertResult = fileStmt.run(original_name, custom_name, saved_filename, file_url);
      const file_id = fileInsertResult.lastInsertRowid;

      if (!file_id) {
        // This specific error within the transaction might be hard to trigger if other constraints are met
        // but good to have as a safeguard.
        throw new Error("Failed to insert file record into database, no lastInsertRowid returned.");
      }

      // 3. Process tags
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
          // This indicates a problem with tag creation or retrieval logic
          console.error(`Failed to find or create tag: ${tagName} for file_id: ${file_id}`);
          // Depending on strictness, might want to throw an error here to rollback the transaction
          // For now, logging it. If this needs to be stricter, an error should be thrown.
        }
      }
      return { conflict: false, fileId: file_id, error: null }; // Signal success
    })(); // Execute the transaction

    if (result.conflict) {
      conflictFound = true;
    } else if (result.fileId) {
      successfulFileId = result.fileId;
    } else {
      // This case implies the transaction returned something unexpected (e.g. no fileId and no conflict flag)
      // It might be an error thrown and caught by the outer catch, or an issue with transaction return logic.
      // The outer catch block will handle actual thrown errors.
      console.error("Transaction resulted in an unexpected state (no conflict, no fileId).");
      // We will rely on the outer catch for actual errors; if it was not an error, this is a logic flaw.
      // To be safe, treat as an error for file cleanup.
      transactionErrorOccurred = true;
      transactionErrorMessage = "Transaction completed without error, but no successful file ID and no conflict.";
    }

  } catch (transactionError) {
    console.error("Error during database transaction:", transactionError);
    transactionErrorOccurred = true;
    transactionErrorMessage = transactionError.message;
  }

  // Handle outcome
  if (conflictFound) {
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) {
          console.error("Error deleting conflicting uploaded file:", err);
        }
      });
    }
    return res.status(409).json({ message: "A file resulting in this URL already exists. Please use a different name or upload a different file." });
  }

  if (transactionErrorOccurred) {
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error("Error deleting file after transaction failure:", unlinkErr);
      });
    }
    return res.status(500).json({ message: "Database operation failed.", error: transactionErrorMessage });
  }

  if (successfulFileId) {
    try {
      // Generate QR code
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
      // Note: File is already saved in DB. This is an error in a subsequent step.
      // Depending on requirements, you might want to leave the file as is,
      // or attempt to "roll back" by deleting the DB entry and file (which is more complex).
      // For now, returning a 500 but acknowledging the file was saved.
      res.status(500).json({ 
        message: "File uploaded but QR code generation failed.", 
        error: qrError.message,
        file_id: successfulFileId, // Optionally return file_id
        pdfUrl: file_url
      });
    }
  } else {
    // Fallback for any unhandled scenarios. This should ideally not be reached if logic above is correct.
    console.error("File processing resulted in an unknown state.");
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error("Error deleting file in unexpected outcome scenario:", unlinkErr);
      });
    }
    return res.status(500).json({ message: "An unexpected error occurred during file processing." });
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
