import { WebSocketServer, WebSocket } from "ws";

interface User {
  username: string;
  socket: WebSocket;
}

const PORT = 8080;
const users: User[] = [];

const wss = new WebSocketServer({ port: PORT });
console.log(`Server started on port ${PORT}`);

wss.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("message", (data) => {
    console.log(`Received message: ${data}`);
    const message = JSON.parse(data.toString());

    switch (message.type) {
      case "join":
        handleJoin(message.username, socket);
        break;
      case "message":
        handleMessage(message.username, message.text);
        break;
      default:
        console.log(`Unknown message type: ${message.type}`);
    }
  });

  socket.on("close", () => {
    console.log("Client disconnected");
    handleDisconnect(socket);
  });
});

function handleJoin(username: string, socket: WebSocket) {
  console.log(`Handling join for username: ${username}`);

  if (users.find((user) => user.username === username)) {
    console.log(`Username ${username} is already taken.`);
    socket.send(
      JSON.stringify({ type: "error", message: "Username is already taken" }),
    );
  } else {
    users.push({ username, socket });
    console.log(`User ${username} added. Total users: ${users.length}`);
    broadcast({ type: "notification", message: `${username} joined the chat` });
  }
}

function handleMessage(username: string, text: string) {
  console.log(`Handling message from ${username}: ${text}`);
  broadcast({ type: "message", username, text });
}

function handleDisconnect(socket: WebSocket) {
  const userIndex = users.findIndex((user) => user.socket === socket);
  if (userIndex !== -1) {
    const username = users[userIndex].username;
    console.log(`User ${username} disconnected.`);
    users.splice(userIndex, 1);
    console.log(`User ${username} removed. Total users: ${users.length}`);
    broadcast({ type: "notification", message: `${username} left the chat` });
  }
}

function broadcast(message: object) {
  console.log(`Broadcasting message: ${JSON.stringify(message)}`);
  users.forEach((user) => {
    user.socket.send(JSON.stringify(message));
  });
}
