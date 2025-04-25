import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());

const gameSessions = new Map();

// Add a clients map to track all active connections
const clients = new Map();

const server = createServer(app);
const wss = new WebSocketServer({ server });

app.get("/", (req, res) => {
  res.send("WebSocket server is running");
});

app.post("/join-game", (req, res) => {
  const { character } = req.body;
  console.log("Character selected:", character);

  if (!character) {
    return res.status(400).json({
      status: "error",
      message: "Character selection is required",
    });
  }

  // Generate a unique token for this session
  const token = uuidv4();

  // Store the session data
  gameSessions.set(token, {
    character,
    createdAt: new Date(),
  });

  res.json({
    status: "success",
    token,
    message: "Successfully joined the game",
  });
});

// WebSocket connection handling
wss.on("connection", function connection(ws, req) {
  console.log("New client connected");

  // Extract token from URL query parameters
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get("token");

  if (!token || !gameSessions.has(token)) {
    console.log("Invalid or missing token");
    ws.close(1008, "Invalid token");
    return;
  }

  // Store token and session data with the connection
  ws.token = token;
  ws.sessionData = gameSessions.get(token);
  console.log(`Client connected with character: ${ws.sessionData.character}`);

  // Add this client to our clients map
  clients.set(token, ws);

  ws.on("error", console.error);

  ws.on("close", function () {
    // Remove client when they disconnect
    clients.delete(token);
    console.log(`Client disconnected: ${token}`);
  });

  ws.on("message", function message(data) {
    console.log("received: %s", data);

    try {
      const message = JSON.parse(data);
      console.log("=== message", message);

      // Handle different message types
      if (message.type === "game_action") {
        // Broadcast this message to all other connected clients
        clients.forEach((client, clientToken) => {
          console.log("=== here");
          if (clientToken !== token) {
            client.send(
              JSON.stringify({
                type: "game_update",
                from: ws.sessionData.character,
                //   action: message.action,
                message: message,
                // Include any other relevant data
              })
            );
          }
        });
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  ws.send(
    JSON.stringify({
      type: "connection_established",
      character: ws.sessionData.character,
    })
  );
});

// Start the server
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
