import kaplay from "kaplay";
import { Player } from "./player";

const DEBUG = true;

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

const ws = new WebSocket(`ws://localhost:8080/?token=${token}`);

const k = kaplay();

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
