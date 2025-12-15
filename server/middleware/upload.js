const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = "others";

    if (file.mimetype.startsWith("image/")) {
      folder = "images";
    } else if (file.mimetype === "application/pdf") {
      folder = "documents";
    } else if (file.mimetype.startsWith("video/")) {
      folder = "videos";
    }

    const destPath = path.join(uploadDir, folder);
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }

    cb(null, destPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  const allowedDocTypes = ["application/pdf"];
  const allowedVideoTypes = ["video/mp4", "video/webm", "video/quicktime"];

  const allowedTypes = [
    ...allowedImageTypes,
    ...allowedDocTypes,
    ...allowedVideoTypes,
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only images (jpg, png, gif, webp), PDFs, and videos (mp4, webm, mov) are allowed."
      ),
      false
    );
  }
};

// File size limits
const limits = {
  fileSize: 50 * 1024 * 1024, // 50MB max (will be checked per type in route)
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits,
});

module.exports = upload;
