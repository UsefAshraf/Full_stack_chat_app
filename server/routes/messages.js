const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const auth = require("../middleware/auth");

const formatMessage = (msg) => ({
  username: msg.username,
  message: msg.message,
  timestamp: msg.timestamp,
});

// Get the most recent messages for a specific room
router.get("/:room", auth, async (req, res) => {
  try {
    const { room } = req.params;

    // Take the latest 100 messages, then return them oldest first
    const messages = await Message.find({ room })
      .sort({ timestamp: -1 })
      .limit(100);

    res.json({
      messages: messages.reverse().map(formatMessage),
    });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ error: "Server error fetching messages" });
  }
});

// Save a new message
router.post("/", auth, async (req, res) => {
  try {
    const { room, message } = req.body;
    const { username } = req.user;

    if (!room || !message) {
      return res.status(400).json({ error: "Room and message are required" });
    }

    const newMessage = new Message({
      room,
      username,
      message,
    });

    await newMessage.save();

    res.status(201).json({
      message: "Message saved successfully",
      data: formatMessage(newMessage),
    });
  } catch (error) {
    console.error("Save message error:", error);
    res.status(500).json({ error: "Server error saving message" });
  }
});

module.exports = router;
