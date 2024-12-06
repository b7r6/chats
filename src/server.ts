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
    broadcastToAll({ type: "notification", message: `${username} joined the chat` });
  }
}

function handleMessage(sender: string, text: string) {
  console.log(`Handling message from ${sender}: ${text}`);
  console.log('debugging', shouldBroadcastAll(text), sender, extractReceiver(text));
  if (shouldBroadcastAll(text)) {
    broadcastToAll({ type: "message", username: sender, text });
  } else {
    const receiver = extractReceiver(text);
    broadcaseToUser(sender, receiver, { type: "message", receiver, text });
  }
  
}

function handleDisconnect(socket: WebSocket) {
  const userIndex = users.findIndex((user) => user.socket === socket);
  if (userIndex !== -1) {
    const username = users[userIndex].username;
    console.log(`User ${username} disconnected.`);
    users.splice(userIndex, 1);
    console.log(`User ${username} removed. Total users: ${users.length}`);
    broadcastToAll({ type: "notification", message: `${username} left the chat` });
  }
}

function broadcastToAll(message: object) {
  console.log(`Broadcasting message: ${JSON.stringify(message)}`);
  users.forEach((user) => {
    user.socket.send(JSON.stringify(message));
  });
}

function broadcaseToUser(sender:string, receiver: string, message: object) {
  console.log(`Broadcasting message to ${receiver}: ${JSON.stringify(message)}`);
  const user = users.find((user) => user.username === receiver);
  if (user) {
    user.socket.send(JSON.stringify(message));
  } else {
    const senderUser = users.find((user) => user.username === sender);
    senderUser && senderUser.socket.send(JSON.stringify({ type: "notification", message: `User ${receiver} not found` }));
  }
}

function shouldBroadcastAll(message: string) {
  return !message.startsWith("/");
}

function extractReceiver(text: string): string {
  const spaceIndex = text.indexOf(' ');
  
  // If there's no space, the entire remaining part after '/' is the user.
  if (spaceIndex === -1) {
    return text.slice(1);
  }
  
  // Extract the substring between '/' and the first space
  return text.slice(1, spaceIndex);
}
