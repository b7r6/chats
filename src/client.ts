import WebSocket from "ws";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function promptUsername(): Promise<string> {
  return new Promise((resolve) => {
    rl.question("Enter your username: ", (username) => {
      console.log(`Username entered: ${username}`);
      resolve(username);
    });
  });
}

async function main() {
  const serverUrl = "ws://localhost:8080";
  console.log(`Connecting to server at ${serverUrl}`);
  const ws = new WebSocket(serverUrl);

  ws.on("open", async () => {
    console.log("Connected to server");
    const username = await promptUsername();
    console.log(`Sending join request for username: ${username}`);
    ws.send(JSON.stringify({ type: "join", username }));

    rl.on("line", (line) => {
      console.log(`Sending message: ${line}`);
      ws.send(JSON.stringify({ type: "message", username, text: line }));
    }).on("close", () => {
      console.log("Readline input closed");
      ws.close();
    });
  });

  ws.on("message", (data) => {
    console.log(`Received message: ${data}`);
    const message = JSON.parse(data.toString());

    switch (message.type) {
      case "notification":
        console.log(`Notification: ${message.message}`);
        break;
      case "message":
        console.log(`${message.username}: ${message.text}`);
        break;
      case "error":
        console.log(`Error: ${message.message}`);
        rl.question("Enter a different username: ", async (newUsername) => {
          console.log(`New username entered: ${newUsername}`);
          ws.send(JSON.stringify({ type: "join", username: newUsername }));
        });
        break;
      default:
        console.log(`Unknown message type: ${message.type}`);
    }
  });

  ws.on("close", () => {
    console.log("Disconnected from server");
    rl.close();
  });

  ws.on("error", (error) => {
    console.error(`WebSocket error: ${error}`);
  });
}

main().catch((err) => console.error(`Error in main: ${err}`));
