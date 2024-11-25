WebSocket Server and Client Application
This project demonstrates a WebSocket server implemented in Golang and a client-side application built using React. The application allows users to send messages, receive reversed messages, and retrieve the last 5 messages sent to the server.

Features

Server
Accepts WebSocket connections.
Reverses the string sent by the client and sends it back.
Maintains a history of the last 5 messages received.
Responds to a history command by sending the last 5 messages.

Client
Allows users to send messages via an input box.
Displays sent and received messages in real-time.
Provides a button to retrieve the last 5 messages from the server.

Technologies Used

Backend: Golang with gorilla/websocket

Frontend: React (JavaScript)

Setup Instructions

Prerequisites

Install Go.

Install Node.js.

Server Setup

Clone the repository:

git clone <repository-url>

cd websocket-server

Install dependencies:

go mod tidy

Run the server:

go run main.go

The server will run on http://localhost:8080/ws.

Client Setup

Navigate to the client folder:

cd websocket-client

Install dependencies:

npm install

Start the client:

npm start

The client will open in your browser at http://localhost:3000.

Usage
Open the client application in your browser.
Enter a message in the input box and click Send.
View the reversed message in the message list.
Click Get History to see the last 5 messages sent to the server.

Examples

Sending a Message

Input: Hello

Server Response: olleH

Requesting Message History

Command: history

Server Response: ["Hello", "World", "WebSocket"]

Contributing
Contributions are welcome! Feel free to submit a pull request or open an issue for improvements.
