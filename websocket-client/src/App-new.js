import React, { useState, useEffect, useCallback } from "react";
import MessageList from './components/MessageList';
import MessageHistory from './components/MessageHistory';

// Custom hook for WebSocket functionality
const useWebSocket = (url) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ws;
    const connect = () => {
      ws = new WebSocket(url);
      
      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Attempt to reconnect after 3 seconds
        setTimeout(connect, 3000);
      };

      ws.onerror = (event) => {
        setError("WebSocket error occurred");
        console.error("WebSocket error:", event);
      };

      setSocket(ws);
    };

    connect();
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [url]);

  const sendMessage = useCallback((message) => {
    if (socket && isConnected) {
      socket.send(message);
    }
  }, [socket, isConnected]);

  return { socket, isConnected, error, sendMessage };
};

const App = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { socket, isConnected, error, sendMessage } = useWebSocket("ws://localhost:8080/ws");

  useEffect(() => {
    if (!socket) return;

    setIsLoading(true);
    
    const messageHandler = (event) => {
      const data = event.data;
      try {
        const parsedData = JSON.parse(data);
        setHistory(parsedData);
      } catch {
        setMessages((prev) => [...prev, { type: "received", text: data }]);
      }
      setIsLoading(false);
    };

    socket.addEventListener('message', messageHandler);

    return () => {
      socket.removeEventListener('message', messageHandler);
    };
  }, [socket]);

  const handleSendMessage = useCallback(() => {
    if (isConnected && message.trim()) {
      setMessages((prev) => [...prev, { type: "sent", text: message }]);
      sendMessage(message);
      setMessage("");
    }
  }, [isConnected, message, sendMessage]);

  const getHistory = () => {
    if (socket) {
      socket.send("history");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>WebSocket Client</h2>
      {error && (
        <div style={{ color: "red", marginBottom: "10px" }}>
          Error: {error}
        </div>
      )}
      {!isConnected && (
        <div style={{ color: "orange", marginBottom: "10px" }}>
          Connecting... Please wait
        </div>
      )}
      <div style={{ marginBottom: "10px" }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type a message..."
          style={{ padding: "10px", width: "300px" }}
          disabled={!isConnected}
        />
        <button 
          onClick={handleSendMessage}
          disabled={!isConnected || !message.trim()}
          style={{
            marginLeft: "10px",
            opacity: (!isConnected || !message.trim()) ? 0.5 : 1
          }}
        >
          Send
        </button>
        <button 
          onClick={getHistory}
          disabled={!isConnected}
          style={{
            marginLeft: "10px",
            opacity: !isConnected ? 0.5 : 1
          }}
        >
          Get History
        </button>
      </div>
      {isLoading ? (
        <div style={{ margin: "20px 0", color: "#666" }}>Loading messages...</div>
      ) : (
        <>
          <MessageList messages={messages} />
          <MessageHistory history={history} />
        </>
      )}
    </div>
  );
};

export default App;