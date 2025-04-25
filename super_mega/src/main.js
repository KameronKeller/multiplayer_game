import kaplay from "kaplay";
import { Player } from "./player";

const DEBUG = true;

const LOCAL_SERVER_BASE_URL = "http://localhost:8080";
const PROD_SERVER_BASE_URL =
  "https://super-mega-backend-512263420060.us-central1.run.app";

const LOCAL_DEV = true;

const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get("token");
const character = urlParams.get("character");

if (!token || !character) {
  console.log("=== not found");
  //   // Redirect back to landing page if no token
  window.location.href = "landingpage.html";
  //   return;
}

console.log(`Starting game with token: ${token}`);

const serverBaseUrl = LOCAL_DEV ? LOCAL_SERVER_BASE_URL : PROD_SERVER_BASE_URL;

const ws = new WebSocket(`${serverBaseUrl}/?token=${token}`);

const k = kaplay({
  background: [0, 0, 0], // Set to white background
  // Or use any color: [r, g, b]
  // Or set to null for transparent: null
});

k.loadSprite("background", "background.png");

// Add background image
k.add([
  k.sprite("background"),
  k.pos(k.width() / 2, k.height() / 2),
  k.anchor("center"),
  k.scale(0.8), // Adjust as needed
  k.z(-1),
]);

// Define game boundaries - consider moving these to constants at the top of your file
const GAME_WIDTH = 819;
const GAME_HEIGHT = 819;
const BOUNDARY_THICKNESS = 10;

// You could simplify your boundary creation with a function
function createBoundaries() {
  // Top wall
  k.add([
    k.rect(GAME_WIDTH, BOUNDARY_THICKNESS),
    k.pos(k.width() / 2, k.height() / 2 - GAME_HEIGHT / 2),
    k.anchor("center"),
    k.area(),
    k.body({ isStatic: true }),
    k.opacity(DEBUG ? 0.3 : 0), // Make visible in debug mode
    "wall",
  ]);

  // Bottom wall
  k.add([
    k.rect(GAME_WIDTH, BOUNDARY_THICKNESS),
    k.pos(k.width() / 2, k.height() / 2 + GAME_HEIGHT / 2),
    k.anchor("center"),
    k.area(),
    k.body({ isStatic: true }),
    k.opacity(DEBUG ? 0.3 : 0),
    "wall",
  ]);

  // Left wall
  k.add([
    k.rect(BOUNDARY_THICKNESS, GAME_HEIGHT),
    k.pos(k.width() / 2 - GAME_WIDTH / 2, k.height() / 2),
    k.anchor("center"),
    k.area(),
    k.body({ isStatic: true }),
    k.opacity(DEBUG ? 0.3 : 0),
    "wall",
  ]);

  // Right wall
  k.add([
    k.rect(BOUNDARY_THICKNESS, GAME_HEIGHT),
    k.pos(k.width() / 2 + GAME_WIDTH / 2, k.height() / 2),
    k.anchor("center"),
    k.area(),
    k.body({ isStatic: true }),
    k.opacity(DEBUG ? 0.3 : 0),
    "wall",
  ]);
}

// Call this function after initializing kaplay
createBoundaries();

const players = new Map();
let localPlayer = null;

ws.onopen = () => {
  console.log("Connected to game server");

  localPlayer = new Player(k, ws, character, true);
  players.set(token, localPlayer);
  localPlayer.setupControls();

  // Send initial join message
  ws.send(
    JSON.stringify({
      type: "game_action",
      action: "join",
      character: character,
      position: localPlayer.getPosition(),
    })
  );
};

ws.onmessage = (event) => {
  try {
    const update = JSON.parse(event.data);
    console.log("Received message from server:", update);

    // Handle different message types
    if (update.type === "game_update") {
      switch (update.message.action) {
        case "kaboom":
          // Create explosion at the specified position
          k.addKaboom(
            k.vec2(update.message.position.x, update.message.position.y)
          );
          break;

        case "move":
          // Update other player's position
          if (update.from && update.from !== character) {
            if (!players.has(update.from)) {
              // Create a new player if we don't have them yet
              const newPlayer = new Player(k, ws, update.from, false);
              players.set(update.from, newPlayer);
            }

            // Update the player's position
            const player = players.get(update.from);
            player.setPosition(
              update.message.position.x,
              update.message.position.y
            );
          }
          break;

        case "join":
          // A new player has joined
          if (
            update.from &&
            update.from !== character &&
            !players.has(update.from)
          ) {
            const newPlayer = new Player(k, ws, update.from, false);
            players.set(update.from, newPlayer);

            if (update.message.position) {
              newPlayer.setPosition(
                update.message.position.x,
                update.message.position.y
              );
            }
          }
          break;
      }
    } else if (update.type === "player_list") {
      //   // Server sent a list of all connected players
      //   update.players.forEach((playerInfo) => {
      //     if (
      //       playerInfo.character !== character &&
      //       !players.has(playerInfo.character)
      //     ) {
      //       const newPlayer = new Player(k, playerInfo.character, false);
      //       players.set(playerInfo.character, newPlayer);
      //       if (playerInfo.position) {
      //         newPlayer.setPosition(playerInfo.position.x, playerInfo.position.y);
      //       }
      //     }
      //   });
    }
  } catch (error) {
    console.error("Error parsing message:", error);
  }
};

k.loadRoot("./"); // A good idea for Itch.io publishing later
// k.loadSprite("bean", "sprites/test.png");

// k.add([k.pos(120, 80), k.sprite("bean")]);

// const player = new Player(k, ws, character, true);
// player.setupControls();

if (DEBUG) {
  k.add([k.pos(10, 10), k.text(`Token: ${token}`, { size: 16 })]);
  k.add([k.pos(10, 30), k.text(`Character: ${character}`, { size: 16 })]);
}

k.onClick(() => {
  ws.send(
    JSON.stringify({
      type: "game_action",
      action: "kaboom",
      position: k.mousePos(),
    })
  );
  k.addKaboom(k.mousePos());
});
