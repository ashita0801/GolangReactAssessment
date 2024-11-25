# WebSocket Connection Management Notes

The useWebSocket hook has been updated to properly handle connection lifecycle:

1. Component Mount:
   - Initializes mounted flag
   - Sets up clean unmount handler

2. URL Changes:
   - Triggers clean disconnect of existing connection
   - Resets connection state
   - Initiates new connection with proper cleanup

3. Connection States:
   - Initial Connection: Uses shorter retry delay and separate retry counter
   - Reconnection: Uses longer retry delay and main retry counter
   - URL Change: Clean disconnect and immediate new connection

4. Cleanup Handling:
   - Component unmount
   - URL changes
   - Connection timeouts
   - Socket event listeners

This implementation ensures proper cleanup and prevents:
- Memory leaks
- Duplicate connections
- Stale callbacks
- Unnecessary reconnection attempts