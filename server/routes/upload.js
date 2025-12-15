const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const path = require("path");

// Upload file endpoint
router.post("/", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Determine file type
    let fileType = "none";
    if (req.file.mimetype.startsWith("image/")) {
      fileType = "image";
    } else if (req.file.mimetype === "application/pdf") {
      fileType = "document";
    } else if (req.file.mimetype.startsWith("video/")) {
      fileType = "video";
    }

    // Check file size limits per type
    const maxSizes = {
      image: 10 * 1024 * 1024, // 10MB
      document: 25 * 1024 * 1024, // 25MB
      video: 50 * 1024 * 1024, // 50MB
    };

    if (req.file.size > maxSizes[fileType]) {
      // Delete the uploaded file
      const fs = require("fs");
      fs.unlinkSync(req.file.path);

      return res.status(400).json({
        error: `File too large. Maximum size for ${fileType}s is ${
          maxSizes[fileType] / (1024 * 1024)
        }MB`,
      });
    }

    // Get relative path for URL
    const relativePath = req.file.path.split("uploads")[1].replace(/\\/g, "/");
    const fileUrl = `/uploads${relativePath}`;

    res.json({
      success: true,
      fileUrl: fileUrl,
      fileType: fileType,
      fileName: req.file.originalname,
      fileSize: req.file.size,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "File upload failed" });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File is too large" });
    }
    return res.status(400).json({ error: error.message });
  }

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  next();
});

module.exports = router;
