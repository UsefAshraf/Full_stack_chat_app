require("dotenv").config();
const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const Message = require("./models/Message");

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Connect to Database
connectDB();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"],
  },
});

// API Routes
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const uploadRoutes = require("./routes/upload");

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/upload", uploadRoutes);

// Track online users per room
const roomUsers = new Map(); // { roomId: [{ socketId, username }] }

// Track typing users per room
const typingUsers = new Map(); // { roomId: Set of usernames }

// Socket.IO Connection Handler
io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join_room", async (data) => {
    const { room, username } = data;
    socket.join(room);

    // Store user info with socket
    socket.username = username;
    socket.currentRoom = room;

    // Add user to room tracking
    if (!roomUsers.has(room)) {
      roomUsers.set(room, []);
    }
    roomUsers.get(room).push({ socketId: socket.id, username });

    // Get list of online users in this room
    const onlineUsers = roomUsers.get(room).map((u) => u.username);

    // Notify all users in room about the new user
    io.to(room).emit("user_joined", { username, onlineUsers });

    console.log(`User ${username} (${socket.id}) joined room: ${room}`);
    console.log(`Online users in ${room}:`, onlineUsers);
  });

  socket.on("send_message", async (data) => {
    try {
      // Save message to database
      const newMessage = new Message({
        room: data.room,
        username: data.username,
        message: data.message || null,
        fileUrl: data.fileUrl || null,
        fileType: data.fileType || "none",
        fileName: data.fileName || null,
        fileSize: data.fileSize || null,
      });

      await newMessage.save();
      console.log(`Message saved to DB from ${data.username}`);

      // Broadcast to room
      socket.to(data.room).emit("receive_message", data);
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  // Typing indicator events
  socket.on("typing_start", (data) => {
    const { room, username } = data;

    if (!typingUsers.has(room)) {
      typingUsers.set(room, new Set());
    }
    typingUsers.get(room).add(username);

    // Broadcast to others in room
    socket.to(room).emit("user_typing", {
      username,
      typingUsers: Array.from(typingUsers.get(room)),
    });
  });

  socket.on("typing_stop", (data) => {
    const { room, username } = data;

    if (typingUsers.has(room)) {
      typingUsers.get(room).delete(username);

      // Broadcast to others in room
      socket.to(room).emit("user_stopped_typing", {
        username,
        typingUsers: Array.from(typingUsers.get(room)),
      });

      // Clean up empty sets
      if (typingUsers.get(room).size === 0) {
        typingUsers.delete(room);
      }
    }
  });

  socket.on("leave_room", (data) => {
    const { room, username } = data;
    socket.leave(room);

    // Remove user from room tracking
    if (roomUsers.has(room)) {
      const users = roomUsers.get(room).filter((u) => u.socketId !== socket.id);
      if (users.length === 0) {
        roomUsers.delete(room);
      } else {
        roomUsers.set(room, users);
      }

      // Get updated online users list
      const onlineUsers = users.map((u) => u.username);

      // Notify remaining users
      io.to(room).emit("user_left", { username, onlineUsers });
    }

    console.log(`User ${username} (${socket.id}) left room: ${room}`);
  });

  socket.on("disconnect", () => {
    // Handle user disconnect - remove from all rooms
    const username = socket.username;
    const room = socket.currentRoom;

    if (room && roomUsers.has(room)) {
      const users = roomUsers.get(room).filter((u) => u.socketId !== socket.id);
      if (users.length === 0) {
        roomUsers.delete(room);
      } else {
        roomUsers.set(room, users);
      }

      // Get updated online users list
      const onlineUsers = users.map((u) => u.username);

      // Remove from typing users
      if (typingUsers.has(room)) {
        typingUsers.get(room).delete(username);
        if (typingUsers.get(room).size === 0) {
          typingUsers.delete(room);
        }
      }

      // Notify remaining users
      io.to(room).emit("user_left", { username, onlineUsers });
    }

    console.log(`User Disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`SERVER IS RUNNING ON PORT ${PORT}`);
});
