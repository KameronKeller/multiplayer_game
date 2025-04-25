import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";
import {
  startEnemySpawner,
  stopEnemySpawner,
  enemies,
} from "./enemy_spawner.js";
const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());

const gameSessions = new Map();

// Add a clients map to track all active connections
const clients = new Map();

// Add a map to track player positions
const playerPositions = new Map();

const server = createServer(app);
const wss = new WebSocketServer({ server });

app.get("/", (req, res) => {
  res.send("WebSocket server is running");
});

app.post("/join-game", (req, res) => {
  const { character } = req.body;
  //   console.log("Character selected:", character);

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
  //   console.log("New client connected");

  // Extract token from URL query parameters
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get("token");

  if (!token || !gameSessions.has(token)) {
    // console.log("Invalid or missing token");
    ws.close(1008, "Invalid token");
    return;
  }

  // Store token and session data with the connection
  ws.token = token;
  ws.sessionData = gameSessions.get(token);
  //   console.log(`Client connected with character: ${ws.sessionData.character}`);

  // Add this client to our clients map
  clients.set(token, ws);

  ws.on("error", console.error);

  ws.on("close", function () {
    // Remove client when they disconnect
    clients.delete(token);
    // console.log(`Client disconnected: ${token}`);
  });

  ws.on("message", function message(data) {
    // console.log("received: %s", data);

    try {
      const message = JSON.parse(data);
      //   console.log("=== message", message);

      // Handle different message types
      if (message.type === "game_action") {
        // Store player position if this is a move or join action
        if (
          (message.action === "move" || message.action === "join") &&
          message.position
        ) {
          playerPositions.set(ws.sessionData.character, message.position);
        }

        // Broadcast this message to all other connected clients
        broadcastToAll(
          {
            type: "game_update",
            from: ws.sessionData.character,
            message: message,
          },
          token
        );
      }
    } catch (error) {
      //   console.error("Error processing message:", error);
    }
  });

  // Send connection established message
  ws.send(
    JSON.stringify({
      type: "connection_established",
      character: ws.sessionData.character,
    })
  );

  // Send all existing enemies to the new player
  if (enemies.size > 0) {
    const enemyList = [];
    enemies.forEach((enemyData, enemyId) => {
      enemyList.push({
        id: enemyId,
        position: enemyData.position,
      });
    });

    ws.send(
      JSON.stringify({
        type: "enemy_list",
        enemies: enemyList,
      })
    );
  }
});

export const broadcastToAll = (message, excludeToken = null) => {
  clients.forEach((client, clientToken) => {
    if (clientToken !== excludeToken && client.readyState === 1) {
      client.send(JSON.stringify(message));
    }
  });
};

let enemySpawnInterval = null;

// Monitor client connections to start/stop enemy spawner
setInterval(() => {
  //   console.log("clients.size", clients.size);
  if (clients.size > 0 && enemySpawnInterval === null) {
    enemySpawnInterval = startEnemySpawner();
  } else if (clients.size === 0 && enemySpawnInterval !== null) {
    stopEnemySpawner(enemySpawnInterval);
    enemySpawnInterval = null;
    // Clear all enemies when no players are connected
    enemies.clear();
  }
}, 1000);

// Function to send player list to all clients
function broadcastPlayerList() {
  if (clients.size === 0) return;

  const playerList = [];

  clients.forEach((client, clientToken) => {
    const playerInfo = {
      character: client.sessionData.character,
      position: playerPositions.get(client.sessionData.character) || null,
    };
    playerList.push(playerInfo);
  });

  const message = {
    type: "player_list",
    players: playerList,
  };

  clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(message));
    }
  });
}

// Send player list every 5 seconds
setInterval(broadcastPlayerList, 5000);

// Start the server
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
