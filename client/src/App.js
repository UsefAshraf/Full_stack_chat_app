import "./App.css";
import io from "socket.io-client";
import { useEffect, useState, useRef } from "react";
import SignUp from "./components/SignUp";
import SignIn from "./components/SignIn";

const socket = io.connect("http://localhost:3000");

function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // User State
  const [username, setUsername] = useState("");
  const [isUsernameSet, setIsUsernameSet] = useState(false);

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

  // Check for existing authentication on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setUsername(JSON.parse(storedUser).username);
      setIsAuthenticated(true);
      setIsUsernameSet(true);
    }
  }, []);

  const handleSignUp = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    setUsername(userData.username);
    setIsAuthenticated(true);
    setIsUsernameSet(true);
  };

  const handleSignIn = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    setUsername(userData.username);
    setIsAuthenticated(true);
    setIsUsernameSet(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setIsUsernameSet(false);
    setUser(null);
    setToken(null);
    setUsername("");
    if (isInRoom) {
      leaveRoom();
    }
  };

  const joinRoom = async () => {
    if (room !== "") {
      socket.emit("join_room", { room, username });
      setIsInRoom(true);

      // Load message history from database
      try {
        const response = await fetch(
          `http://localhost:3000/api/messages/${room}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const loadedMessages = data.messages.map((msg) => ({
            type: msg.username === username ? "sent" : "received",
            text: msg.message,
            username: msg.username,
            time: msg.time,
          }));

          setMessages([
            {
              type: "system",
              text: `Welcome to room ${room}!`,
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
            ...loadedMessages,
          ]);
        }
      } catch (error) {
        console.error("Error loading messages:", error);
        setMessages([
          {
            type: "system",
            text: `Welcome to room ${room}!`,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
      }
    }
  };

  const leaveRoom = () => {
    socket.emit("leave_room", { room, username });
    setIsInRoom(false);
    setRoom("");
    setOnlineUsers([]);
    setMessages([]);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim() !== "") {
      const messageData = {
        message,
        room,
        username,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      socket.emit("send_message", messageData);

      setMessages((prev) => [
        ...prev,
        { ...messageData, type: "sent", text: message },
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
          time: data.time,
        },
      ]);
    });

    socket.on("user_joined", (data) => {
      setOnlineUsers(data.onlineUsers);
      if (data.username !== username) {
        setMessages((prev) => [
          ...prev,
          {
            type: "system",
            text: `${data.username} joined the room`,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
      }
    });

    socket.on("user_left", (data) => {
      setOnlineUsers(data.onlineUsers);
      setMessages((prev) => [
        ...prev,
        {
          type: "system",
          text: `${data.username} left the room`,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
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
          onSignUp={handleSignUp}
          onSwitchToSignIn={() => setShowSignUp(false)}
        />
      );
    } else {
      return (
        <SignIn
          onSignIn={handleSignIn}
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
