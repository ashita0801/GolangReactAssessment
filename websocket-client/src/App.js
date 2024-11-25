import React, { useState, useEffect, useCallback } from "react";
import MessageList from './components/MessageList';
import MessageHistory from './components/MessageHistory';
import ConnectionStatus from './components/ConnectionStatus';
import AppExplanation from './components/AppExplanation';
import { useWebSocket } from './hooks/useWebSocket';
import './App.css';

/**
 * Main App component for managing WebSocket communication and rendering the UI.
 */
const App = () => {
  // State for the message currently being typed by the user.
  const [message, setMessage] = useState("");

  // State for storing real-time messages received or sent.
  const [messages, setMessages] = useState([]);

  // State for storing the message history fetched from the server.
  const [history, setHistory] = useState([]);

  // State to indicate whether data (messages/history) is being loaded.
  const [isLoading, setIsLoading] = useState(true);

  // State to toggle the visibility of the history panel.
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);

  // Custom WebSocket hook for managing WebSocket connection and communication.
  const { socket, isConnected, error, sendMessage } = useWebSocket("ws://localhost:8080/ws");

  /**
   * Effect to handle incoming WebSocket messages.
   */
  useEffect(() => {
    // Skip if the WebSocket connection is not active.
    if (!socket) return;

    // Set the loading state while waiting for incoming messages.
    setIsLoading(true);

    // Event handler to process received WebSocket messages.
    const messageHandler = (event) => {
      const data = event.data;

      try {
        // If the message is JSON, treat it as history data.
        const parsedData = JSON.parse(data);
        setHistory(parsedData);
      } catch {
        // Otherwise, treat it as a real-time message.
        setMessages((prev) => [...prev, { type: "received", text: data }]);
      }
      // Stop the loading state once messages are processed.
      setIsLoading(false);
    };

    // Add an event listener for WebSocket messages.
    socket.addEventListener('message', messageHandler);

    // Cleanup: Remove the event listener when the component unmounts or the socket changes.
    return () => {
      socket.removeEventListener('message', messageHandler);
    };
  }, [socket]);

  /**
   * Handles sending a message via WebSocket.
   */
  const handleSendMessage = useCallback(() => {
    if (isConnected && message.trim()) {
      // Add the sent message to the real-time messages list locally.
      setMessages((prev) => [...prev, { type: "sent", text: message }]);
      // Send the message to the server via WebSocket.
      sendMessage(message);
      // Clear the input field after sending the message.
      setMessage("");

      // Fetch updated history if the history panel is visible.
      if (isHistoryVisible) {
        getHistory();
      }
    }
  }, [isConnected, message, sendMessage, isHistoryVisible]);

  /**
   * Requests the message history from the server.
   */
  const getHistory = useCallback(() => {
    if (socket) {
      socket.send("history"); // Send a request for history to the server.
    }
  }, [socket]);

  /**
   * Toggles the visibility of the history panel.
   */
  const handleViewHistory = useCallback(() => {
    setIsHistoryVisible((prev) => !prev); // Toggle visibility state.
    getHistory(); // Fetch the history whenever toggled.
  }, [getHistory]);

  return (
    <div className="App">
      {/* Explanation of the app's purpose */}
      <AppExplanation />

      {/* Display WebSocket connection status */}
      <ConnectionStatus isConnected={isConnected} />

      {/* Show error messages, if any */}
      {error && <div className="error-message">Error: {error}</div>}

      {/* Show a connecting message when not connected */}
      {!isConnected && <div className="connecting-message">Connecting... Please wait</div>}

      {/* Input section for sending messages */}
      <div className="message-input-container">
        <input
          className="message-input"
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} // Send message on Enter key press.
          placeholder="Type a message..."
          disabled={!isConnected} // Disable input if not connected.
        />
        <button
          className="send-button"
          onClick={handleSendMessage}
          disabled={!isConnected || !message.trim()} // Disable if input is empty or not connected.
        >
          Send
        </button>
        <button
          className={`history-button ${isHistoryVisible ? 'active' : ''}`}
          onClick={handleViewHistory}
          disabled={!isConnected} // Disable if not connected.
        >
          {isHistoryVisible ? 'Hide History' : 'View History'}
        </button>
      </div>

      {/* Split-panel layout for messages and history */}
      <div className="split-panel-container">
        {/* Left panel: Real-time messages */}
        <div className="left-panel">
          <div className="panel-header">Real-time Messages</div>
          {messages.length > 0 ? (
            <MessageList messages={messages} />
          ) : (
            <div className="empty-state">No messages yet. Start a conversation!</div>
          )}
        </div>

        {/* Right panel: Message history */}
        {isHistoryVisible && (
          <div className="right-panel">
            <div className="panel-header">
              Message History
              {/* Close button for the history panel */}
              <button
                className="close-history-button"
                onClick={() => setIsHistoryVisible(false)}
                aria-label="Close history"
              >
                ×
              </button>
            </div>
            {isLoading ? (
              <div className="loading-state">Loading history...</div>
            ) : history.length > 0 ? (
              <MessageHistory history={history} />
            ) : (
              <div className="empty-state">No message history available</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
