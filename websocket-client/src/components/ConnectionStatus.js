// Import the React library
import React from 'react';

// Functional component to display the connection status
const ConnectionStatus = ({ isConnected, error, connectionAttempt }) => {
  // Function to determine the status indicator color based on the connection state
  const getStatusColor = () => {
    if (error) return '#f44336'; // Red for error
    if (isConnected) return '#4caf50'; // Green for connected
    return '#ff9800'; // Orange for connecting
  };

  return (
    <div className="connection-status">
      {/* Status indicator circle */}
      <div
        className="status-indicator"
        style={{ backgroundColor: getStatusColor() }}
      />
      {/* Status text */}
      <span>
        {error ? (
          <span className="status-error">{error}</span>
        ) : (
          <span
            className={`status-text ${
              isConnected ? 'status-connected' : 'status-connecting'
            }`}
          >
            {isConnected ? 'Connected' : 'Connecting...'}
            {!isConnected && connectionAttempt > 0 && ` (Attempt ${connectionAttempt})`}
          </span>
        )}
      </span>
    </div>
  );
};

// Exporting the component wrapped in React.memo for performance optimization
export default React.memo(ConnectionStatus);
