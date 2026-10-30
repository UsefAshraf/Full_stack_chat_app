import "./App.css";
import io from "socket.io-client";
import { useCallback, useEffect, useState, useRef } from "react";
import SignUp from "./components/SignUp";
import SignIn from "./components/SignIn";
import { API_URL } from "./config";

// Connect only after authentication, so the JWT can be sent in the handshake
const socket = io(API_URL, { autoConnect: false });

const formatTime = (date = new Date()) =>
  new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const systemMessage = (text) => ({ type: "system", text, time: formatTime() });

function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [token, setToken] = useState(null);

  // User State
  const [username, setUsername] = useState("");
  // Socket listeners are registered once, so they read the username from a ref
  const usernameRef = useRef("");

  // Room State
  const [room, setRoom] = useState("");
  const [isInRoom, setIsInRoom] = useState(false);

  // Messages States
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  // Online Users State
  const [onlineUsers, setOnlineUsers] = useState([]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    usernameRef.current = username;
  }, [username]);

  const handleAuth = (userData, authToken) => {
    setToken(authToken);
    setUsername(userData.username);
    setIsAuthenticated(true);
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    socket.disconnect();
    setIsAuthenticated(false);
    setIsInRoom(false);
    setRoom("");
    setOnlineUsers([]);
    setMessages([]);
    setToken(null);
    setUsername("");
  }, []);

  // Check for existing authentication on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      try {
        handleAuth(JSON.parse(storedUser), storedToken);
      } catch {
        handleLogout();
      }
    }
  }, [handleLogout]);

  // Open the socket connection once authenticated
  useEffect(() => {
    if (!token) return;

    socket.auth = { token };
    socket.connect();

    const onConnectError = (err) => {
      console.error("Socket connection error:", err.message);
      // Token expired or invalid - force the user to sign in again
      if (err.message === "Invalid token") {
        handleLogout();
      }
    };
    socket.on("connect_error", onConnectError);

    return () => {
      socket.off("connect_error", onConnectError);
      socket.disconnect();
    };
  }, [token, handleLogout]);

  const joinRoom = async () => {
    const roomName = room.trim();
    if (roomName === "") return;

    setRoom(roomName);
    socket.emit("join_room", { room: roomName });
    setIsInRoom(true);
    setMessages([systemMessage(`Welcome to room ${roomName}!`)]);

    // Load message history from database
    try {
      const response = await fetch(
        `${API_URL}/api/messages/${encodeURIComponent(roomName)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        handleLogout();
        return;
      }

      if (response.ok) {
        const data = await response.json();
        const loadedMessages = data.messages.map((msg) => ({
          type: msg.username === username ? "sent" : "received",
          text: msg.message,
          username: msg.username,
          time: formatTime(msg.timestamp),
        }));

        // Keep any live messages that arrived while history was loading
        setMessages((prev) => [prev[0], ...loadedMessages, ...prev.slice(1)]);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const leaveRoom = () => {
    socket.emit("leave_room");
    setIsInRoom(false);
    setRoom("");
    setOnlineUsers([]);
    setMessages([]);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    const text = message.trim();
    if (text !== "") {
      socket.emit("send_message", { message: text });

      setMessages((prev) => [
        ...prev,
        { type: "sent", text, username, time: formatTime() },
      ]);
      setMessage("");
    }
  };

  useEffect(() => {
    socket.on("receive_message", (data) => {
      setMessages((prev) => [
        ...prev,
        {
          type: "received",
          text: data.message,
          username: data.username,
          time: formatTime(data.timestamp),
        },
      ]);
    });

    socket.on("user_joined", (data) => {
      setOnlineUsers(data.onlineUsers);
      if (data.username !== usernameRef.current) {
        setMessages((prev) => [
          ...prev,
          systemMessage(`${data.username} joined the room`),
        ]);
      }
    });

    socket.on("user_left", (data) => {
      setOnlineUsers(data.onlineUsers);
      setMessages((prev) => [
        ...prev,
        systemMessage(`${data.username} left the room`),
      ]);
    });

    return () => {
      socket.off("receive_message");
      socket.off("user_joined");
      socket.off("user_left");
    };
  }, []);

  // Authentication Screen
  if (!isAuthenticated) {
    if (showSignUp) {
      return (
        <SignUp
          onSignUp={handleAuth}
          onSwitchToSignIn={() => setShowSignUp(false)}
        />
      );
    } else {
      return (
        <SignIn
          onSignIn={handleAuth}
          onSwitchToSignUp={() => setShowSignUp(true)}
        />
      );
    }
  }

  // Room Selection Screen
  if (!isInRoom) {
    return (
      <div className="App">
        <div className="room-container">
          <div className="room-card">
            <div className="user-badge">
              <span className="user-avatar">
                {username.charAt(0).toUpperCase()}
              </span>
              <span className="user-name">{username}</span>
            </div>
            <button
              className="btn-logout"
              onClick={handleLogout}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                padding: "8px 16px",
                background: "#e53e3e",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Logout
            </button>
            <h2>Join a Chat Room</h2>
            <p>Enter a room number to connect with others</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                joinRoom();
              }}
            >
              <input
                type="text"
                className="room-input"
                placeholder="Room number..."
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                autoFocus
              />
              <button type="submit" className="btn-primary">
                Join Room
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Chat Screen
  return (
    <div className="App">
      <div className="chat-container">
        {/* Chat Header */}
        <div className="chat-header">
          <div className="header-left">
            <div className="room-info">
              <span className="room-badge">Room {room}</span>
              <span className="online-indicator">
                ● {onlineUsers.length} Online
              </span>
            </div>
          </div>
          <div className="header-right">
            <span className="current-user">{username}</span>
            <button className="btn-leave" onClick={leaveRoom}>
              Leave Room
            </button>
          </div>
        </div>

        <div className="chat-main">
          {/* Online Users Sidebar */}
          <div className="online-users-sidebar">
            <h3>Online Users ({onlineUsers.length})</h3>
            <div className="users-list">
              {onlineUsers.map((user, index) => (
                <div key={index} className="user-item">
                  <span className="user-status-dot">●</span>
                  <span className="user-name">
                    {user === username ? `${user} (You)` : user}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Messages Area */}
          <div className="messages-area">
            <div className="messages-container">
              {messages.map((msg, index) => (
                <div key={index} className={`message-wrapper ${msg.type}`}>
                  {msg.type === "system" ? (
                    <div className="system-message">{msg.text}</div>
                  ) : (
                    <div className={`message ${msg.type}`}>
                      {msg.type === "received" && (
                        <div className="message-username">{msg.username}</div>
                      )}
                      <div className="message-content">
                        <span className="message-text">{msg.text}</span>
                      </div>
                      <div className="message-time">{msg.time}</div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="message-input-container">
              <form onSubmit={sendMessage} className="message-form">
                <input
                  type="text"
                  className="message-input"
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  autoFocus
                />
                <button type="submit" className="btn-send">
                  <span className="send-icon">➤</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
