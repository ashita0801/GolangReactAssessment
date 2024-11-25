import React, { useState, useEffect } from "react";

const App = () => {
  const [socket, setSocket] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080/ws");
    setSocket(ws);

    ws.onmessage = (event) => {
      const data = event.data;
      try {
        const parsedData = JSON.parse(data); // Handle history command
        setHistory(parsedData);
      } catch {
        setMessages((prev) => [...prev, { type: "received", text: data }]);
      }
    };

    return () => ws.close();
  }, []);

  const sendMessage = () => {
    if (socket && message) {
      setMessages((prev) => [...prev, { type: "sent", text: message }]);
      socket.send(message);
      setMessage("");
    }
  };

  const getHistory = () => {
    if (socket) {
      socket.send("history");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>WebSocket Client</h2>
      <div style={{ marginBottom: "10px" }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          style={{ padding: "10px", width: "300px" }}
        />
        <button onClick={sendMessage} style={{ marginLeft: "10px" }}>
          Send
        </button>
        <button onClick={getHistory} style={{ marginLeft: "10px" }}>
          Get History
        </button>
      </div>
      <div>
        <h3>Messages</h3>
        <ul>
          {messages.map((msg, idx) => (
            <li key={idx} style={{ color: msg.type === "sent" ? "blue" : "green" }}>
              {msg.type === "sent" ? "You: " : "Server: "} {msg.text}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3>Message History</h3>
        <ul>
          {history.map((h, idx) => (
            <li key={idx}>{h}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default App;
