# 💬 Real-Time Chat Application

A modern, full-stack real-time chat application built with React, Node.js, Socket.IO, and MongoDB. Features include user authentication, message persistence, and online/offline user presence tracking.

![Chat Application](https://img.shields.io/badge/React-17.0.2-blue) ![Node.js](https://img.shields.io/badge/Node.js-Express-green) ![Socket.IO](https://img.shields.io/badge/Socket.IO-4.4.1-black) ![MongoDB](https://img.shields.io/badge/MongoDB-Database-brightgreen)

## ✨ Features

### 🔐 Authentication System

- **User Registration**: Sign up with username, email, and password
- **Secure Login**: JWT-based authentication with bcrypt password hashing
- **Session Persistence**: Stay logged in across browser refreshes
- **Token Management**: Automatic token storage and validation

### 💬 Real-Time Messaging

- **Instant Messaging**: Send and receive messages in real-time using Socket.IO
- **Multiple Rooms**: Join different chat rooms by room number
- **Message History**: All messages are persisted to MongoDB
- **Auto-Load History**: Previous messages load automatically when joining a room

### 👥 User Presence Tracking

- **Online Users Sidebar**: See who's currently in the room
- **User Count**: Real-time count of online users
- **Join/Leave Notifications**: System messages when users join or leave
- **Disconnect Handling**: Automatic cleanup when users close their browser

### 🎨 Modern UI/UX

- **Beautiful Design**: Gradient backgrounds and smooth animations
- **Responsive Layout**: Works on desktop and mobile devices
- **Message Bubbles**: Distinct styling for sent and received messages
- **System Messages**: Clear notifications for room events

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v14 or higher)
- **MongoDB** (local installation or MongoDB Atlas)
- **npm** or **yarn**

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/chat-application.git
   cd chat-application
   ```

2. **Install server dependencies**

   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**

   ```bash
   cd ../client
   npm install
   ```

4. **Configure environment variables**

   Create a `.env` file in the `server` directory:

   ```env
   MONGODB_URI=mongodb://localhost:27017/chatapp
   JWT_SECRET=your_secure_jwt_secret_key
   PORT=3000
   ```

5. **Start MongoDB**

   ```bash
   mongod --dbpath C:\data\db
   ```

   Or use MongoDB Atlas and update the `MONGODB_URI` in `.env`

6. **Start the backend server**

   ```bash
   cd server
   npm start
   ```

   Server will run on `http://localhost:3000`

7. **Start the frontend**

   ```bash
   cd client
   npm start
   ```

   Client will run on `http://localhost:3002`

8. **Open your browser**

   Navigate to `http://localhost:3002`

---

## 📁 Project Structure

```
chat-application/
├── client/                    # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── SignUp.js    # Registration component
│   │   │   ├── SignIn.js    # Login component
│   │   │   └── Auth.css     # Auth styling
│   │   ├── App.js           # Main app component
│   │   ├── App.css          # Main styling
│   │   └── index.js         # Entry point
│   └── package.json
│
└── server/                    # Node.js backend
    ├── config/
    │   └── db.js             # MongoDB connection
    ├── models/
    │   ├── User.js           # User schema
    │   └── Message.js        # Message schema
    ├── routes/
    │   ├── auth.js           # Authentication routes
    │   └── messages.js       # Message routes
    ├── middleware/
    │   └── auth.js           # JWT middleware
    ├── index.js              # Server entry point
    ├── .env                  # Environment variables
    └── package.json
```

---

## 🔧 Tech Stack

### Frontend

- **React** - UI library
- **Socket.IO Client** - Real-time communication
- **CSS3** - Modern styling with animations

### Backend

- **Node.js** - Runtime environment
- **Express** - Web framework
- **Socket.IO** - WebSocket library
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing

---

## 📡 API Endpoints

### Authentication

#### Sign Up

```http
POST /api/auth/signup
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "message": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

#### Sign In

```http
POST /api/auth/signin
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

### Messages

#### Get Room Messages

```http
GET /api/messages/:room
Authorization: Bearer <token>
```

**Response:**

```json
{
  "messages": [
    {
      "username": "john_doe",
      "message": "Hello everyone!",
      "time": "10:30 AM",
      "timestamp": "2024-12-14T08:30:00.000Z"
    }
  ]
}
```

---

## 🔌 Socket.IO Events

### Client → Server

| Event          | Data                                | Description       |
| -------------- | ----------------------------------- | ----------------- |
| `join_room`    | `{ room, username }`                | Join a chat room  |
| `send_message` | `{ room, username, message, time }` | Send a message    |
| `leave_room`   | `{ room, username }`                | Leave a chat room |

### Server → Client

| Event             | Data                          | Description           |
| ----------------- | ----------------------------- | --------------------- |
| `receive_message` | `{ message, username, time }` | Receive a new message |
| `user_joined`     | `{ username, onlineUsers }`   | User joined the room  |
| `user_left`       | `{ username, onlineUsers }`   | User left the room    |

---

## 🎯 Usage

1. **Sign Up**: Create a new account with username, email, and password
2. **Sign In**: Log in with your credentials
3. **Join Room**: Enter a room number (e.g., "room1", "33", etc.)
4. **Chat**: Send messages and see them appear in real-time
5. **See Online Users**: View who's currently in the room in the sidebar
6. **Message History**: Refresh the page and see all previous messages
7. **Leave Room**: Click "Leave Room" to exit the chat

---

## 🛠️ Development

### Running in Development Mode

**Backend (with nodemon):**

```bash
cd server
npm run start  # Uses nodemon for auto-restart
```

**Frontend:**

```bash
cd client
npm start
```

### Building for Production

```bash
cd client
npm run build
```

---

## 🐛 Troubleshooting

### MongoDB Connection Error

- Ensure MongoDB is running: `mongod --dbpath C:\data\db`
- Check the `MONGODB_URI` in `.env`
- For MongoDB Atlas, use the connection string provided

### Port Already in Use

- Kill existing Node processes: `Get-Process -Name node | Stop-Process -Force`
- Change the port in `server/.env`

### Authentication Errors

- Clear browser localStorage
- Check JWT_SECRET is set in `.env`
- Verify token is being sent in Authorization header

---

## 📝 Environment Variables

| Variable      | Description               | Example                             |
| ------------- | ------------------------- | ----------------------------------- |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/chatapp` |
| `JWT_SECRET`  | Secret key for JWT tokens | `your_secure_secret_key`            |
| `PORT`        | Server port number        | `3000`                              |

---

## 🔒 Security Features

- **Password Hashing**: Bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Protected Routes**: Middleware validation
- **Input Validation**: Server-side validation
- **CORS Configuration**: Controlled origins

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Your Name**

- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your Name](https://linkedin.com/in/yourprofile)

---

## 🙏 Acknowledgments

- Socket.IO for real-time communication
- MongoDB for data persistence
- React for the amazing UI library
- The open-source community

---

## 📸 Screenshots

### Sign In Page

Beautiful gradient design with modern authentication

### Chat Interface

Real-time messaging with online users sidebar

### Message History

All messages persisted and loaded automatically

---

## 🚀 Future Enhancements

- [ ] Private messaging between users
- [ ] File sharing and image uploads
- [ ] Typing indicators
- [ ] Message reactions and emojis
- [ ] User profiles with avatars
- [ ] Push notifications
- [ ] Message search functionality
- [ ] Dark mode theme

---

**⭐ If you like this project, please give it a star on GitHub!**
