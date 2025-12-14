require("dotenv").config();
const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const connectDB = require("./config/db");
const Message = require("./models/Message");

// Middleware
app.use(cors());
app.use(express.json());

// Connect to Database
connectDB();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3002",
    methods: ["GET", "POST"],
  },
});

// API Routes
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Track online users per room
const roomUsers = new Map(); // { roomId: [{ socketId, username }] }

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
        message: data.message,
      });

      await newMessage.save();
      console.log(`Message saved to DB: ${data.message}`);

      // Broadcast to room
      socket.to(data.room).emit("receive_message", data);
    } catch (error) {
      console.error("Error saving message:", error);
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
