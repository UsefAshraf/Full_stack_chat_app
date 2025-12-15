const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  room: {
    type: String,
    required: true,
    trim: true,
  },
  username: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: false, // Made optional since file-only messages are allowed
  },
  fileUrl: {
    type: String,
    default: null,
  },
  fileType: {
    type: String,
    enum: ["image", "document", "video", "none"],
    default: "none",
  },
  fileName: {
    type: String,
    default: null,
  },
  fileSize: {
    type: Number,
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster queries by room
messageSchema.index({ room: 1, timestamp: 1 });

module.exports = mongoose.model("Message", messageSchema);
