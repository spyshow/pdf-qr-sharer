const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const qrcode = require("qrcode");
const ip = require("ip");
const cors = require("cors"); // Require CORS

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors()); // Add CORS middleware

// Ensure uploads directory exists
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

  try {
    const tags = req.body.tags || "";
    // const serverIp = ip.address(); // serverIp is not used in pdfUrl construction directly for now
    // req.file.filename is the name set by multer's filename function
    const encodedFilename = encodeURIComponent(req.file.filename); 
    const pdfUrl = `http://192.168.0.48:${PORT}/pdfs/${encodedFilename}`;
    const qrCodeDataUrl = await qrcode.toDataURL(pdfUrl);

    res.json({
      message: "File uploaded successfully",
      filename: req.file.filename, // This is the (potentially customized and sanitized) name
      originalName: req.file.originalname, // Original name for reference
      tags: tags,
      pdfUrl: pdfUrl,
      qrCodeDataUrl: qrCodeDataUrl,
    });
  } catch (error) {
    console.error("Error generating QR code or processing file:", error);
    res.status(500).json({
      message: "Error processing file or generating QR code",
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
