# 💬 Real-Time Chat Application

A full-stack, real-time chat application built with **React**, **Node.js / Express**, **Socket.IO** and **MongoDB**. Users sign up, sign in, join chat rooms and exchange messages instantly. Messages are stored in MongoDB and online presence is tracked live.

![React](https://img.shields.io/badge/React-17-61DAFB?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?logo=socket.io&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Available Scripts](#-available-scripts)
- [Project Structure](#-project-structure)
- [REST API](#-rest-api)
- [Socket.IO Events](#-socketio-events)
- [Security](#-security)
- [Troubleshooting](#-troubleshooting)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

**🔐 Authentication**
- Sign up with username, email and password
- Passwords hashed with **bcrypt**; sessions use **JWT** (valid for 24h)
- Session persists across page refreshes; expired tokens log the user out automatically

**💬 Real-time messaging**
- Instant messaging over WebSockets (Socket.IO)
- Any number of named chat rooms
- Messages saved to MongoDB; the latest 100 load when you join a room
- Times shown in each user's local timezone

**👥 Presence**
- Live sidebar of users online in the current room
- Join / leave notifications
- Automatic cleanup when a user closes the tab or loses connection

**🎨 UI**
- Gradient design with smooth animations
- Distinct bubbles for sent and received messages
- Responsive layout for desktop and mobile

---

## 🔧 Tech Stack

| Layer     | Technology                                                    |
| --------- | ------------------------------------------------------------- |
| Frontend  | React 17 (Create React App), Socket.IO Client, CSS3           |
| Backend   | Node.js, Express 4, Socket.IO 4                               |
| Database  | MongoDB with Mongoose ODM                                     |
| Auth      | JSON Web Tokens (`jsonwebtoken`), `bcryptjs`                  |
| Dev tools | nodemon, Docker Compose (local MongoDB)                       |

---

## 🏗 Architecture

```
┌────────────────────┐   REST (auth, history)   ┌────────────────────┐        ┌───────────┐
│   React client     │ ───────────────────────▶ │  Express server    │ ─────▶ │  MongoDB  │
│ localhost:3000     │ ◀──── WebSocket ───────▶ │  + Socket.IO       │        │  :27017   │
└────────────────────┘   (JWT in handshake)     │ localhost:3001     │        └───────────┘
                                                └────────────────────┘
```

1. The client signs in over REST and gets a JWT.
2. The client opens a Socket.IO connection and sends the JWT in the handshake. The server verifies it and takes the username from the token, so users cannot impersonate each other.
3. On joining a room, the client loads that room's history over REST. New messages are saved to MongoDB and broadcast to everyone in the room.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) **18 or newer** (and npm)
- **MongoDB**, from one of:
  - [Docker Desktop](https://www.docker.com/products/docker-desktop/) (easiest, a `docker-compose.yml` is included)
  - A local [MongoDB Community](https://www.mongodb.com/try/download/community) install
  - A free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

### 1. Clone the repository

```bash
git clone https://github.com/UsefAshraf/Full_stack_chat_app.git
cd Full_stack_chat_app
```

### 2. Start MongoDB

Using Docker (recommended):

```bash
docker compose up -d
```

This starts MongoDB 7 on `localhost:27017`, with data kept in a Docker volume. If you use a local install or Atlas instead, skip this step and set `MONGODB_URI` in the next step.

### 3. Configure and start the server

```bash
cd server
cp .env.example .env      # Windows PowerShell: Copy-Item .env.example .env
npm install
npm run dev               # or: npm start
```

Open `server/.env` and set `JWT_SECRET` to a long random string. One way to generate one:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

You should see:

```
SERVER IS RUNNING ON PORT 3001
MongoDB Connected Successfully
```

### 4. Configure and start the client

In a **second terminal**:

```bash
cd client
cp .env.example .env      # optional, the defaults work out of the box
npm install
npm start
```

### 5. Open the app

Go to **http://localhost:3000**, create an account, and join a room such as `general`.
To test real-time chat, open a second browser window (or an incognito window) and sign in as another user.

---

## 🔑 Environment Variables

### `server/.env`

| Variable      | Required | Default                 | Description                                  |
| ------------- | :------: | ----------------------- | -------------------------------------------- |
| `MONGODB_URI` |    ✅    | —                       | MongoDB connection string                    |
| `JWT_SECRET`  |    ✅    | —                       | Secret used to sign and verify JWTs          |
| `PORT`        |          | `3001`                  | Port for the API and Socket.IO server        |
| `CLIENT_URL`  |          | `http://localhost:3000` | Allowed CORS origin (URL of the React app)   |

The server will not start if a required variable is missing.

### `client/.env`

| Variable            | Default                 | Description                         |
| ------------------- | ----------------------- | ----------------------------------- |
| `REACT_APP_API_URL` | `http://localhost:3001` | Base URL of the backend server      |

> `.env` files are gitignored. Only the `.env.example` templates are committed.

---

## 📜 Available Scripts

| Location  | Command         | Description                                      |
| --------- | --------------- | ------------------------------------------------ |
| `server/` | `npm start`     | Start the server with Node                       |
| `server/` | `npm run dev`   | Start the server with nodemon (restarts on changes) |
| `client/` | `npm start`     | Start the React dev server on port 3000          |
| `client/` | `npm run build` | Create an optimized production build in `build/` |
| `client/` | `npm test`      | Run the client test runner                       |
| root      | `docker compose up -d` / `down` | Start / stop the MongoDB container |

---

## 📁 Project Structure

```
Full_stack_chat_app/
├── docker-compose.yml          # Local MongoDB container
├── client/                     # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SignIn.js       # Login form
│   │   │   ├── SignUp.js       # Registration form
│   │   │   └── Auth.css        # Auth screen styles
│   │   ├── App.js              # Room selection, chat UI, socket logic
│   │   ├── App.css             # Chat styles
│   │   ├── config.js           # API URL configuration
│   │   └── index.js            # Entry point
│   ├── .env.example
│   └── package.json
│
└── server/                     # Node.js backend
    ├── config/db.js            # MongoDB connection
    ├── middleware/auth.js      # JWT verification for REST routes
    ├── models/
    │   ├── User.js             # User schema (with password hashing)
    │   └── Message.js          # Message schema (indexed by room + time)
    ├── routes/
    │   ├── auth.js             # /api/auth/signup, /api/auth/signin
    │   └── messages.js         # /api/messages
    ├── index.js                # Express + Socket.IO server
    ├── .env.example
    └── package.json
```

---

## 📡 REST API

Base URL: `http://localhost:3001`

| Method | Endpoint             | Auth | Description                          |
| ------ | -------------------- | :--: | ------------------------------------ |
| GET    | `/api/health`        |      | Health check, returns `{ "status": "ok" }` |
| POST   | `/api/auth/signup`   |      | Register a new user                  |
| POST   | `/api/auth/signin`   |      | Log in and receive a JWT             |
| GET    | `/api/messages/:room`|  ✅  | Latest 100 messages in a room        |
| POST   | `/api/messages`      |  ✅  | Save a message (REST alternative to sockets) |

Authenticated routes need the header `Authorization: Bearer <token>`.

<details>
<summary><b>POST /api/auth/signup</b></summary>

```http
POST /api/auth/signup
Content-Type: application/json

{ "username": "john_doe", "email": "john@example.com", "password": "password123" }
```

`201 Created`

```json
{
  "message": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "507f1f77bcf86cd799439011", "username": "john_doe", "email": "john@example.com" }
}
```

Errors: `400` for missing fields, a password under 6 characters, or an email/username that is already taken.
</details>

<details>
<summary><b>POST /api/auth/signin</b></summary>

```http
POST /api/auth/signin
Content-Type: application/json

{ "email": "john@example.com", "password": "password123" }
```

`200 OK`: same shape as signup, with `"message": "Login successful"`.
Errors: `400` for missing fields, `401` for invalid credentials.
</details>

<details>
<summary><b>GET /api/messages/:room</b></summary>

```http
GET /api/messages/general
Authorization: Bearer <token>
```

`200 OK`

```json
{
  "messages": [
    { "username": "john_doe", "message": "Hello everyone!", "timestamp": "2026-10-30T08:30:00.000Z" }
  ]
}
```

Errors: `401` if the token is missing, invalid or expired.
</details>

---

## 🔌 Socket.IO Events

The client must connect with a valid JWT:

```js
io("http://localhost:3001", { auth: { token } });
```

Connections without a valid token are rejected with `"Authentication required"` or `"Invalid token"`. The sender's username always comes from the token, never from the event payload.

### Client → Server

| Event          | Payload       | Description                                   |
| -------------- | ------------- | --------------------------------------------- |
| `join_room`    | `{ room }`    | Join a room (leaves the previous room, if any) |
| `send_message` | `{ message }` | Send a message to the current room            |
| `leave_room`   | —             | Leave the current room                        |

### Server → Client

| Event             | Payload                                   | Description                    |
| ----------------- | ----------------------------------------- | ------------------------------ |
| `receive_message` | `{ room, username, message, timestamp }`  | New message from another user  |
| `user_joined`     | `{ username, onlineUsers }`               | A user joined the room         |
| `user_left`       | `{ username, onlineUsers }`               | A user left or disconnected    |

---

## 🔒 Security

- Passwords hashed with bcrypt (10 salt rounds) and never returned by the API
- JWT authentication on both protected REST routes and the Socket.IO handshake
- Message author comes from the verified token, which prevents impersonation
- CORS restricted to the configured `CLIENT_URL`
- Server-side validation of sign-up input and message content
- Secrets come from environment variables and are never committed

> **Production note:** use a strong `JWT_SECRET`, serve over HTTPS, and consider adding rate limiting (e.g. `express-rate-limit`) to the auth routes.

---

## 🐛 Troubleshooting

| Problem | Solution |
| ------- | -------- |
| `Missing required environment variables` | Create `server/.env` from `server/.env.example`. |
| `MongoDB Connection Error` | Make sure MongoDB is running (`docker compose ps`) and `MONGODB_URI` is correct. For Atlas, add your IP to the network access list. |
| `EADDRINUSE` / port already in use | Another process is using port 3000 or 3001. Stop it, or change `PORT` (server) and `REACT_APP_API_URL` / `CLIENT_URL` to match. |
| CORS error in the browser console | `CLIENT_URL` in `server/.env` must exactly match the URL the client runs on. |
| Sent back to the sign-in screen | Your token expired (24h). Sign in again. |
| Changes to `client/.env` have no effect | Restart `npm start`, because CRA reads env variables only at startup. |

---

## 🗺 Roadmap

- [ ] Private (direct) messages
- [ ] Typing indicators
- [ ] File and image sharing
- [ ] Message reactions and emoji picker
- [ ] User profiles and avatars
- [ ] Dark mode
- [ ] Message search
- [ ] Automated tests and CI

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m "Add amazing feature"`
4. Push the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

Please open an issue first to discuss major changes.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 👨‍💻 Author

**Yousef Ashraf Abdelmoez**

- GitHub: [@UsefAshraf](https://github.com/UsefAshraf)

⭐ If you find this project useful, please give it a star!
