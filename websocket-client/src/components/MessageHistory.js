// Import the React library
import React from 'react';

// Functional component to display the history of messages
const MessageHistory = ({ history }) => (
  <div className="message-history-container">
    {/* Title for the message history section */}
    <h3 className="message-history-title">Message History:</h3>
    {/* Map through the message history array and render each message */}
    {history.map((msg, index) => (
      <div key={index} className="message-history-item">
        {msg}
      </div>
    ))}
  </div>
);

// Exporting the component wrapped in React.memo for performance optimization
export default React.memo(MessageHistory);
