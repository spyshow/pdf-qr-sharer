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
    cb(null, file.originalname); // Keep original file name
  },
});

const upload = multer({ storage: storage });

// POST route for file upload
app.post("/upload", upload.single("pdfFile"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded." });
  }

  try {
    const serverIp = ip.address();
    // Ensure req.file.originalname is properly encoded for URL
    const encodedFilename = encodeURIComponent(req.file.originalname);
    const pdfUrl = `http://192.168.0.48:${PORT}/pdfs/${encodedFilename}`;
    const qrCodeDataUrl = await qrcode.toDataURL(pdfUrl);

    res.json({
      message: "File uploaded successfully",
      filename: req.file.originalname,
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
