package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"time"

	"github.com/gorilla/websocket"
	"websocket-server/websocket" // Custom package for WebSocket connection management
)

// Upgrader is used to upgrade HTTP connections to WebSocket connections.
// It specifies buffer sizes and allows all origins (for testing purposes).
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for testing; adjust for production.
	},
}

func main() {
	// Create a new WebSocket connection manager.
	manager := websocket.NewConnectionManager()

	// Start the connection manager's routine to handle WebSocket connections.
	go manager.Run()

	// Create an HTTP server with timeouts to enhance reliability and prevent hanging connections.
	server := &http.Server{
		Addr:              ":8080",           // Server listens on port 8080.
		ReadTimeout:       15 * time.Second,  // Maximum duration for reading a request.
		WriteTimeout:      15 * time.Second,  // Maximum duration for writing a response.
		IdleTimeout:       60 * time.Second,  // Maximum time for idle connections.
		ReadHeaderTimeout: 5 * time.Second,   // Timeout for reading HTTP headers.
	}

	// Define the WebSocket endpoint handler.
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		// Upgrade the incoming HTTP connection to a WebSocket connection.
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("WebSocket upgrade error: %v", err) // Log the error if upgrade fails.
			return
		}

		// Pass the WebSocket connection to the manager for handling.
		go manager.HandleWebSocket(conn)
	})

	// Create a channel to listen for OS interrupt signals for graceful shutdown.
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt)

	// Start the server in a separate goroutine to allow graceful shutdown.
	go func() {
		log.Println("WebSocket server started on :8080")
		if err := server.ListenAndServe(); err != http.ErrServerClosed {
			// Log if the server encounters a critical error.
			log.Fatalf("Server error: %v", err)
		}
	}()

	// Wait for an interrupt signal (e.g., Ctrl+C) to initiate shutdown.
	<-stop
	log.Println("Shutting down server...")

	// Create a context with a 5-second timeout for server shutdown.
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Attempt to gracefully shut down the server.
	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Server shutdown error: %v", err)
	}
	log.Println("Server gracefully stopped")
}
