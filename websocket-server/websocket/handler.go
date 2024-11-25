package websocket

import (
	"log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// Connection represents a single WebSocket connection
type Connection struct {
	conn     *websocket.Conn       // Underlying WebSocket connection
	send     chan string           // Channel for outgoing messages
	manager  *ConnectionManager    // Reference to the connection manager
	history  *MessageHistory       // Stores the message history for the connection
}

// ConnectionManager handles multiple WebSocket connections
type ConnectionManager struct {
	connections map[*Connection]bool // Active WebSocket connections
	broadcast   chan string          // Channel for broadcasting messages to all connections
	register    chan *Connection     // Channel for registering new connections
	unregister  chan *Connection     // Channel for unregistering disconnected connections
	mutex       sync.RWMutex         // Mutex for thread-safe access to connections
}

// NewConnectionManager creates a new instance of the connection manager
func NewConnectionManager() *ConnectionManager {
	return &ConnectionManager{
		connections: make(map[*Connection]bool),
		broadcast:   make(chan string),
		register:    make(chan *Connection),
		unregister:  make(chan *Connection),
	}
}

// Run starts the main loop of the connection manager, handling registration,
// unregistration, and broadcasting of messages.
func (cm *ConnectionManager) Run() {
	for {
		select {
		case conn := <-cm.register:
			// Register a new connection
			cm.mutex.Lock()
			cm.connections[conn] = true
			cm.mutex.Unlock()
		case conn := <-cm.unregister:
			// Unregister an existing connection
			cm.mutex.Lock()
			if _, ok := cm.connections[conn]; ok {
				delete(cm.connections, conn)
				close(conn.send)
			}
			cm.mutex.Unlock()
		case message := <-cm.broadcast:
			// Broadcast a message to all active connections
			cm.mutex.RLock()
			for conn := range cm.connections {
				select {
				case conn.send <- message:
				default:
					// Close and remove the connection if sending fails
					close(conn.send)
					delete(cm.connections, conn)
				}
			}
			cm.mutex.RUnlock()
		}
	}
}

// HandleWebSocket handles an incoming WebSocket connection and registers it
func (cm *ConnectionManager) HandleWebSocket(conn *websocket.Conn) {
	// Create a new connection instance
	c := &Connection{
		conn:    conn,
		send:    make(chan string, 256), // Buffered channel for outgoing messages
		manager: cm,
		history: &MessageHistory{},     // Initialize message history
	}

	// Register the connection with the manager
	cm.register <- c

	// Ensure cleanup when the connection is closed
	defer func() {
		cm.unregister <- c
		conn.Close()
	}()

	// Start write pump to send messages
	go c.writePump()

	// Start read pump to receive messages
	c.readPump()
}

// readPump reads messages from the WebSocket connection
func (c *Connection) readPump() {
	defer func() {
		// Unregister the connection and close it on exit
		c.manager.unregister <- c
		c.conn.Close()
	}()

	// Set an initial read deadline
	c.conn.SetReadDeadline(time.Now().Add(WriteTimeout))

	// Handle Pong messages to keep the connection alive
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(WriteTimeout))
		return nil
	})

	// Read messages from the connection
	for {
		messageType, message, err := c.conn.ReadMessage()
		if err != nil {
			// Log unexpected WebSocket errors
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("Unexpected WebSocket error: %v", err)
			}
			break
		}

		// Reset the read deadline for the next message
		c.conn.SetReadDeadline(time.Now().Add(WriteTimeout))

		// Handle only text messages
		if messageType != websocket.TextMessage {
			log.Printf("Unsupported message type: %d", messageType)
			continue
		}

		// Process incoming message
		msg := string(message)
		switch msg {
		case "history":
			// Send message history back to the client
			if err := c.conn.WriteJSON(c.history.GetHistory()); err != nil {
				log.Printf("Error sending history: %v", err)
				return
			}
		default:
			// Reverse the message and broadcast it
			reversed := reverseString(msg)
			c.history.AddMessage(msg) // Add the original message to history
			c.manager.broadcast <- reversed
		}
	}
}

// writePump writes messages to the WebSocket connection
func (c *Connection) writePump() {
	// Create a ticker to send periodic Ping messages
	ticker := time.NewTicker(WriteTimeout / 2)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			// Send a message from the send channel
			c.conn.SetWriteDeadline(time.Now().Add(WriteTimeout))
			if !ok {
				// If the channel is closed, close the WebSocket connection
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			// Write the message as a WebSocket TextMessage
			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write([]byte(message))
			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			// Send a Ping message to keep the connection alive
			c.conn.SetWriteDeadline(time.Now().Add(WriteTimeout))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// reverseString reverses the order of characters in a string
func reverseString(s string) string {
	runes := []rune(s)
	for i, j := 0, len(runes)-1; i < j; i, j = i+1, j-1 {
		runes[i], runes[j] = runes[j], runes[i]
	}
	return string(runes)
}
