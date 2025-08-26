// backend/routes/upload.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });

router.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ msg: "No file uploaded" });
  }

  console.log("File received:", req.file);

  // Extract file extension for fallback type detection
  const fileExtension = path.extname(req.file.originalname).toLowerCase();
  
  // Send back file info including MIME type
  res.json({
    fileUrl: `http://localhost:9000/uploads/${req.file.filename}`,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype, // ← This is the key addition!
    size: req.file.size,
    fileExtension: fileExtension // Optional: for additional fallback detection
  });
});

module.exports = router;