package main

import (
    "context"
    "log"
    "net/http"
    "os"
    "os/signal"
    "sync"
    "time"

    "github.com/gorilla/websocket"
)

const (
    // MaxHistorySize is the maximum number of messages to keep in history
    MaxHistorySize = 5
    
    // WriteTimeout is the maximum time to wait for a write operation
    WriteTimeout = 10 * time.Second
)

// MessageHistory stores the last N messages
type MessageHistory struct {
    messages []string
    mu       sync.Mutex
}

// AddMessage adds a new message to the history, maintaining max size
func (mh *MessageHistory) AddMessage(msg string) {
    mh.mu.Lock()
    defer mh.mu.Unlock()
    if len(mh.messages) >= MaxHistorySize {
        mh.messages = mh.messages[1:]
    }
    mh.messages = append(mh.messages, msg)
}

// GetHistory returns a copy of the message history
func (mh *MessageHistory) GetHistory() []string {
    mh.mu.Lock()
    defer mh.mu.Unlock()
    return append([]string{}, mh.messages...)
}

var upgrader = websocket.Upgrader{
    CheckOrigin: func(r *http.Request) bool { return true }, // Allow all origins
}

// handleWebSocket manages a single WebSocket connection
func handleWebSocket(conn *websocket.Conn, history *MessageHistory) {
    defer conn.Close()

    // Set read deadline for first message
    conn.SetReadDeadline(time.Now().Add(WriteTimeout))

    for {
        messageType, msg, err := conn.ReadMessage()
        if err != nil {
            if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
                log.Printf("Unexpected WebSocket error: %v", err)
            }
            break
        }

        // Reset deadline for next message
        conn.SetReadDeadline(time.Now().Add(WriteTimeout))

        message := string(msg)
        if messageType != websocket.TextMessage {
            log.Printf("Unsupported message type: %d", messageType)
            continue
        }

        // Handle different message types
        switch message {
        case "history":
            if err := conn.WriteJSON(history.GetHistory()); err != nil {
                log.Printf("Error sending history: %v", err)
                return
            }
        default:
            reversed := reverseString(message)
            history.AddMessage(message)
            
            if err := conn.WriteMessage(websocket.TextMessage, []byte(reversed)); err != nil {
                log.Printf("Error sending message: %v", err)
                return
            }
        }
    }
}

func main() {
    history := &MessageHistory{}

    // Create server with timeouts
    server := &http.Server{
        Addr:              ":8080",
        ReadTimeout:       15 * time.Second,
        WriteTimeout:      15 * time.Second,
        IdleTimeout:       60 * time.Second,
        ReadHeaderTimeout: 5 * time.Second,
    }

    // Handle WebSocket connections
    http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
        conn, err := upgrader.Upgrade(w, r, nil)
        if err != nil {
            log.Printf("WebSocket upgrade error: %v", err)
            return
        }
        go handleWebSocket(conn, history)
    })

    // Handle graceful shutdown
    stop := make(chan os.Signal, 1)
    signal.Notify(stop, os.Interrupt)

    go func() {
        log.Println("WebSocket server started on :8080")
        if err := server.ListenAndServe(); err != http.ErrServerClosed {
            log.Fatalf("Server error: %v", err)
        }
    }()

    <-stop
    log.Println("Shutting down server...")

    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    if err := server.Shutdown(ctx); err != nil {
        log.Fatalf("Server shutdown error: %v", err)
    }
    log.Println("Server gracefully stopped")
}

func reverseString(s string) string {
    runes := []rune(s)
    for i, j := 0, len(runes)-1; i < j; i, j = i+1, j-1 {
        runes[i], runes[j] = runes[j], runes[i]
    }
    return string(runes)
}
