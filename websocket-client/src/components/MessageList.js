// Import the React library
import React from 'react';

// Functional component to display a list of messages
const MessageList = ({ messages }) => (
  <div className="message-list-container">
    {/* Title for the messages section */}
    <h3 className="message-list-title">Messages:</h3>
    {/* Map through the messages array to render each message */}
    {messages.map((msg, index) => (
      <div
        key={index}
        className={`message-item ${msg.type === "sent" ? "message-sent" : "message-received"}`}
      >
        {msg.text}
      </div>
    ))}
  </div>
);

// Exporting the component wrapped in React.memo for performance optimization
export default React.memo(MessageList);
