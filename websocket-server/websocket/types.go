package websocket

import (
	"sync"
	"time"
)

const (
	// MaxHistorySize is the maximum number of messages to retain in the history
	// If the history exceeds this size, the oldest message will be removed.
	MaxHistorySize = 5

	// WriteTimeout is the maximum duration allowed for a write operation
	// to complete before timing out.
	WriteTimeout = 10 * time.Second
)

// MessageHistory maintains a thread-safe list of recent messages.
type MessageHistory struct {
	messages []string // Slice to store the messages
	mu       sync.Mutex // Mutex to ensure thread-safe access to the messages slice
}

// AddMessage adds a new message to the history.
//
// This method is thread-safe and ensures that the history does not exceed
// the maximum allowed size (`MaxHistorySize`). When the size limit is reached,
// the oldest message is removed to make room for the new message.
func (mh *MessageHistory) AddMessage(msg string) {
	mh.mu.Lock() // Lock the mutex to ensure exclusive access
	defer mh.mu.Unlock() // Unlock the mutex when the function exits

	// Append the new message to the history
	mh.messages = append(mh.messages, msg)

	// If the history exceeds the maximum size, remove the oldest message
	if len(mh.messages) > MaxHistorySize {
		mh.messages = mh.messages[1:]
	}
}

// GetHistory retrieves all messages currently stored in the history.
//
// This method is thread-safe and returns a copy of the messages to ensure
// that the original slice is not modified by the caller.
func (mh *MessageHistory) GetHistory() []string {
	mh.mu.Lock() // Lock the mutex to ensure safe access to the messages slice
	defer mh.mu.Unlock() // Unlock the mutex when the function exits

	// Create a copy of the messages slice to avoid unintended modifications
	history := make([]string, len(mh.messages))
	copy(history, mh.messages)
	return history
}
