package main

import (
    "log"
    "net/http"
    "sync"

    "github.com/gorilla/websocket"
)

type MessageHistory struct {
    messages []string
    mu       sync.Mutex
}

func (mh *MessageHistory) AddMessage(msg string) {
    mh.mu.Lock()
    defer mh.mu.Unlock()
    if len(mh.messages) >= 5 {
        mh.messages = mh.messages[1:]
    }
    mh.messages = append(mh.messages, msg)
}

func (mh *MessageHistory) GetHistory() []string {
    mh.mu.Lock()
    defer mh.mu.Unlock()
    return append([]string{}, mh.messages...)
}

var upgrader = websocket.Upgrader{
    CheckOrigin: func(r *http.Request) bool { return true }, // Allow all origins
}

func main() {
    history := &MessageHistory{}

    http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
        conn, err := upgrader.Upgrade(w, r, nil)
        if err != nil {
            log.Println("Upgrade error:", err)
            return
        }
        defer conn.Close()

        for {
            _, msg, err := conn.ReadMessage()
            if err != nil {
                log.Println("Read error:", err)
                break
            }

            message := string(msg)
            if message == "history" {
                conn.WriteJSON(history.GetHistory())
            } else {
                reversed := reverseString(message)
                history.AddMessage(message)
                conn.WriteMessage(websocket.TextMessage, []byte(reversed))
            }
        }
    })

    log.Println("WebSocket server started on :8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}

func reverseString(s string) string {
    runes := []rune(s)
    for i, j := 0, len(runes)-1; i < j; i, j = i+1, j-1 {
        runes[i], runes[j] = runes[j], runes[i]
    }
    return string(runes)
}
