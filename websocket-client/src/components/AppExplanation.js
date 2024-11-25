// Import the React library
import React from 'react';

// Functional component to explain the application features and purpose
const AppExplanation = () => {
  return (
    <div className="app-explanation">
      {/* Application title */}
      <h1>Real-time WebSocket Chat</h1>
      
      {/* Brief description of the application */}
      <p>
        Welcome to this real-time chat application! This app demonstrates the power of WebSocket
        technology, allowing instant message exchange between connected users.
      </p>
      
      {/* Features section to highlight key functionalities */}
      <div className="features">
        <h2>Features:</h2>
        <ul>
          <li>Real-time messaging with WebSocket technology</li>
          <li>Message history preservation</li>
          <li>Connection status indicator</li>
          <li>Clean and responsive interface</li>
        </ul>
      </div>
    </div>
  );
};

// Exporting the AppExplanation component for use in other parts of the application
export default AppExplanation;
