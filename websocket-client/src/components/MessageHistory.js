import React from 'react';

const MessageHistory = ({ history }) => (
  <div>
    <h3>Message History:</h3>
    {history.map((msg, index) => (
      <div
        key={index}
        style={{
          marginBottom: "5px",
          padding: "8px",
          backgroundColor: "#f5f5f5",
          borderRadius: "4px"
        }}
      >
        {msg}
      </div>
    ))}
  </div>
);

export default React.memo(MessageHistory);