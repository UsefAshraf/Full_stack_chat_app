require("dotenv").config();
const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const connectDB = require("./config/db");
const Message = require("./models/Message");

// Validate required environment variables
const missingEnv = ["MONGODB_URI", "JWT_SECRET"].filter(
  (key) => !process.env[key]
);
if (missingEnv.length > 0) {
  console.error(
    `Missing required environment variables: ${missingEnv.join(", ")}`
  );
  console.error("Copy server/.env.example to server/.env and fill it in.");
  process.exit(1);
}

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// Middleware
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

// Connect to Database
connectDB();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

// API Routes
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Track online users per room
const roomUsers = new Map(); // { roomId: [{ socketId, username }] }

// Remove a socket from a room's tracking and notify remaining users
const removeFromRoom = (socket, room) => {
  if (!roomUsers.has(room)) return;

  const users = roomUsers.get(room).filter((u) => u.socketId !== socket.id);
  if (users.length === 0) {
    roomUsers.delete(room);
  } else {
    roomUsers.set(room, users);
  }

  // Get updated online users list (unique, in case of multiple tabs)
  const onlineUsers = [...new Set(users.map((u) => u.username))];

  // Notify remaining users
  io.to(room).emit("user_left", { username: socket.username, onlineUsers });
};

// Authenticate socket connections with the JWT issued at sign in
io.use((socket, next) => {
  try {
    const { token } = socket.handshake.auth || {};
    if (!token) {
      return next(new Error("Authentication required"));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.username = decoded.username;
    next();
  } catch (error) {
    next(new Error("Invalid token"));
  }
});

// Socket.IO Connection Handler
io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.username} (${socket.id})`);

  socket.on("join_room", (data) => {
    const room = String(data?.room || "").trim();
    if (!room) return;

    // Leave the previous room, if any
    if (socket.currentRoom && socket.currentRoom !== room) {
      socket.leave(socket.currentRoom);
      removeFromRoom(socket, socket.currentRoom);
    }

    socket.join(room);
    socket.currentRoom = room;

    // Add user to room tracking
    if (!roomUsers.has(room)) {
      roomUsers.set(room, []);
    }
    const users = roomUsers.get(room);
    if (!users.some((u) => u.socketId === socket.id)) {
      users.push({ socketId: socket.id, username: socket.username });
    }

    // Get list of online users in this room
    const onlineUsers = [...new Set(users.map((u) => u.username))];

    // Notify all users in room about the new user
    io.to(room).emit("user_joined", { username: socket.username, onlineUsers });

    console.log(`User ${socket.username} (${socket.id}) joined room: ${room}`);
  });

  socket.on("send_message", async (data) => {
    const room = socket.currentRoom;
    const text = String(data?.message || "").trim();
    if (!room || !text) return;

    try {
      // Save message to database
      const newMessage = new Message({
        room,
        username: socket.username,
        message: text,
      });

      await newMessage.save();

      // Broadcast to room
      socket.to(room).emit("receive_message", {
        room,
        username: newMessage.username,
        message: newMessage.message,
        timestamp: newMessage.timestamp,
      });
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  socket.on("leave_room", () => {
    const room = socket.currentRoom;
    if (!room) return;

    socket.leave(room);
    removeFromRoom(socket, room);
    socket.currentRoom = null;

    console.log(`User ${socket.username} (${socket.id}) left room: ${room}`);
  });

  socket.on("disconnect", () => {
    // Handle user disconnect - remove from current room
    if (socket.currentRoom) {
      removeFromRoom(socket, socket.currentRoom);
    }

    console.log(`User Disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`SERVER IS RUNNING ON PORT ${PORT}`);
});
