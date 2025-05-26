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

  try {
    // Database operations within a transaction
    const transaction = db.transaction(() => {
      // Insert into files table
      const fileStmt = db.prepare(`
        INSERT INTO files (original_name, custom_name, saved_filename, file_url) 
        VALUES (?, ?, ?, ?)
      `);
      const fileInsertResult = fileStmt.run(original_name, custom_name, saved_filename, file_url);
      const file_id = fileInsertResult.lastInsertRowid;

      if (!file_id) {
        throw new Error("Failed to insert file record into database.");
      }

      // Process tags
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
        upsertTagStmt.run(tagName); // Attempt to insert, does nothing if conflict
        const tag = selectTagStmt.get(tagName); // Get the ID, whether existing or newly inserted
        if (tag && tag.id) {
          insertFileTagStmt.run(file_id, tag.id);
        } else {
          // This case should ideally not happen if upsert and select are correct
          console.error(`Failed to find or create tag: ${tagName}`);
          // Optionally throw an error or handle as per application requirements
        }
      }
      return { file_id }; // Return relevant data from transaction if needed
    });

    const dbResult = transaction(); // Execute the transaction

    // Generate QR code
    const qrCodeDataUrl = await qrcode.toDataURL(file_url);

    res.json({
      message: "File uploaded and processed successfully",
      filename: finalFileName,
      originalName: original_name,
      tags: tagsString, // Return the original tags string as per previous behavior
      pdfUrl: file_url,
      qrCodeDataUrl: qrCodeDataUrl,
    });

  } catch (error) {
    console.error("Error during file upload processing or database operation:", error);
    res.status(500).json({
      message: "Error processing file or database operation",
      error: error.message,
    });
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
