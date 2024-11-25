import { useState, useEffect, useCallback, useRef } from 'react';

// Constants for connection and retry settings
const MAX_RETRIES = 3; // Maximum number of reconnection attempts
const RETRY_INTERVAL = 5000; // Delay (in ms) between reconnection attempts
const INITIAL_CONNECTION_RETRIES = 3; // Number of attempts for initial connection
const CONNECTION_TIMEOUT = 5000; // Timeout (in ms) for initial connection attempt
const INITIAL_RETRY_DELAY = 1000; // Delay (in ms) between initial connection retries

/**
 * Custom hook to manage a WebSocket connection.
 * @param {string} url - The WebSocket server URL.
 * @returns {object} - An object containing the socket, connection state, error state, and sendMessage function.
 */
export const useWebSocket = (url) => {
  // State for connection status and error messages
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  // References to manage WebSocket state and lifecycle
  const socketRef = useRef(null); // Reference to the WebSocket instance
  const retryCount = useRef(0); // Tracks the number of reconnection attempts
  const initialConnectionAttempts = useRef(0); // Tracks initial connection attempts
  const reconnectTimeout = useRef(null); // Reference for managing reconnection timeout
  const mounted = useRef(true); // Tracks if the component is mounted
  const connecting = useRef(false); // Prevents simultaneous connection attempts

  /**
   * Establishes a WebSocket connection.
   * Handles reconnection logic and state updates for connection status and errors.
   */
  const connect = useCallback(() => {
    if (!mounted.current || !url) return; // Ensure the component is mounted and URL is provided
    if (connecting.current) {
      console.log('Already attempting to connect');
      return;
    }

    connecting.current = true;
    console.log('Attempting connection to:', url);

    // Reset retry count on first connection
    if (!socketRef.current?._hasConnected) {
      retryCount.current = 0;
    }

    // Clean up any existing WebSocket connection
    if (socketRef.current) {
      if (socketRef.current.readyState === WebSocket.OPEN ||
          socketRef.current.readyState === WebSocket.CONNECTING) {
        socketRef.current.close();
      }
      socketRef.current = null;
    }

    try {
      const currentUrl = url; // Store URL to validate during async operations
      const ws = new WebSocket(currentUrl);
      let connectionTimeout;

      // Set timeout for the initial connection
      connectionTimeout = setTimeout(() => {
        if (mounted.current && ws.readyState === WebSocket.CONNECTING) {
          console.log('Connection attempt timed out');
          connecting.current = false;
          ws.close();
        }
      }, CONNECTION_TIMEOUT);

      // Handle successful connection
      ws.onopen = () => {
        if (!mounted.current || url !== currentUrl) {
          ws.close();
          return;
        }
        clearTimeout(connectionTimeout);
        connecting.current = false;
        initialConnectionAttempts.current = 0;
        retryCount.current = 0;
        ws._hasConnected = true; // Mark the socket as having connected
        setIsConnected(true);
        setError(null);
      };

      // Handle connection closure
      ws.onclose = (event) => {
        if (!mounted.current || url !== currentUrl) return;

        clearTimeout(connectionTimeout);
        connecting.current = false;
        setIsConnected(false);

        // If closure is normal, do not attempt reconnection
        if (event.code === 1000 || event.code === 1001) {
          setError(null);
          return;
        }

        // Handle initial connection failures
        if (!ws._hasConnected) {
          if (initialConnectionAttempts.current < INITIAL_CONNECTION_RETRIES) {
            initialConnectionAttempts.current += 1;
            const attemptNum = initialConnectionAttempts.current;
            console.log(`Initial connection attempt ${attemptNum}`);
            setError(`Connecting... (Attempt ${attemptNum}/${INITIAL_CONNECTION_RETRIES})`);
            reconnectTimeout.current = setTimeout(connect, INITIAL_RETRY_DELAY);
            return;
          } else {
            setError('Unable to establish connection. Please check your internet connection and try again.');
            return;
          }
        }

        // Handle disconnection after successful connection
        if (retryCount.current < MAX_RETRIES) {
          retryCount.current += 1;
          setError(`Connection lost. Retrying... (${retryCount.current}/${MAX_RETRIES})`);
          reconnectTimeout.current = setTimeout(connect, RETRY_INTERVAL);
        } else {
          setError('Connection lost. Please refresh the page to reconnect.');
        }
      };

      // Handle WebSocket errors
      ws.onerror = (event) => {
        if (!mounted.current || url !== currentUrl) return;
        console.error("WebSocket error:", event);
        connecting.current = false;
      };

      socketRef.current = ws;
    } catch (err) {
      console.error("WebSocket creation error:", err);
      connecting.current = false;

      if (initialConnectionAttempts.current < INITIAL_CONNECTION_RETRIES) {
        initialConnectionAttempts.current += 1;
        const attemptNum = initialConnectionAttempts.current;
        setError(`Connecting... (Attempt ${attemptNum}/${INITIAL_CONNECTION_RETRIES})`);
        reconnectTimeout.current = setTimeout(connect, INITIAL_RETRY_DELAY);
      } else {
        setError('Unable to establish connection. Please check your internet connection and try again.');
      }
    }
  }, [url]);

  /**
   * Handles WebSocket lifecycle: initializes, connects, and cleans up.
   */
  useEffect(() => {
    mounted.current = true;
    connecting.current = false;

    // Initialize connection
    setError(null);
    setIsConnected(false);
    connect();

    // Cleanup function to handle unmounting
    return () => {
      mounted.current = false;
      connecting.current = false;

      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }

      if (socketRef.current) {
        const socket = socketRef.current;
        socketRef.current = null;
        socket.onclose = null;
        socket.onerror = null;
        socket.onopen = null;
        socket.close();
      }
    };
  }, [connect]);

  /**
   * Sends a message over the WebSocket connection.
   * @param {string} message - The message to send.
   * @returns {boolean} - Whether the message was sent successfully.
   */
  const sendMessage = useCallback((message) => {
    if (!socketRef.current || !isConnected) {
      setError('Cannot send message: No connection to server');
      return false;
    }
    try {
      socketRef.current.send(message);
      return true;
    } catch (err) {
      setError(`Failed to send message: ${err.message}`);
      return false;
    }
  }, [isConnected]);

  // Return WebSocket-related states and functions
  return {
    socket: socketRef.current,
    isConnected,
    error,
    sendMessage,
  };
};
