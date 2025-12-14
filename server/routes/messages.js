const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const auth = require("../middleware/auth");

// Get all messages for a specific room
router.get("/:room", auth, async (req, res) => {
  try {
    const { room } = req.params;

    // Find all messages for this room, sorted by timestamp
    const messages = await Message.find({ room })
      .sort({ timestamp: 1 })
      .limit(100); // Limit to last 100 messages

    res.json({
      messages: messages.map((msg) => ({
        username: msg.username,
        message: msg.message,
        time: new Date(msg.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        timestamp: msg.timestamp,
      })),
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
      data: {
        username: newMessage.username,
        message: newMessage.message,
        time: new Date(newMessage.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    });
  } catch (error) {
    console.error("Save message error:", error);
    res.status(500).json({ error: "Server error saving message" });
  }
});

module.exports = router;
