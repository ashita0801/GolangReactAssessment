import React from 'react';

const MessageList = ({ messages }) => (
  <div>
    <h3>Messages:</h3>
    {messages.map((msg, index) => (
      <div
        key={index}
        style={{
          marginBottom: "5px",
          padding: "8px",
          backgroundColor: msg.type === "sent" ? "#e3f2fd" : "#f1f8e9",
          borderRadius: "4px",
          maxWidth: "80%",
          marginLeft: msg.type === "sent" ? "auto" : "0",
        }}
      >
        {msg.text}
      </div>
    ))}
  </div>
);

export default React.memo(MessageList);