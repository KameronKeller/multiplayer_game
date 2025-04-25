import kaplay from "kaplay";
import { Player } from "./player";
import { Enemy } from "./enemy";
import { initArena } from "./arena";
import { Bullet } from "./bullet.js";

const DEBUG = false;

const LOCAL_SERVER_BASE_URL = "http://localhost:8080";
const PROD_SERVER_BASE_URL =
  "https://super-mega-backend-512263420060.us-central1.run.app";

const LOCAL_DEV = false;

const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get("token");
const character = urlParams.get("character");

if (!token || !character) {
  window.location.href = "landingpage.html";
}

console.log(`Starting game with token: ${token}`);

const serverBaseUrl = LOCAL_DEV ? LOCAL_SERVER_BASE_URL : PROD_SERVER_BASE_URL;

const ws = new WebSocket(`${serverBaseUrl}/?token=${token}`);

const k = kaplay({
  background: [0, 0, 0],
});

initArena(k, DEBUG);

const players = new Map();
const enemies = new Map();
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
        // case "kaboom":
        //   // Create explosion at the specified position
        //   k.addKaboom(
        //     k.vec2(update.message.position.x, update.message.position.y)
        //   );
        //   break;
        case "enemy_spawn":
          const newEnemy = new Enemy(
            k,
            ws,
            update.message.enemy.position,
            update.message.enemy.id
          );
          enemies.set(update.message.enemy.id, newEnemy);
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

        case "rotate_gun":
          // Update other player's gun rotation
          if (update.from && update.from !== character) {
            if (players.has(update.from)) {
              const player = players.get(update.from);
              player.setGunAngle(update.message.angle);
            }
          }
          break;

        case "shoot":
          // Another player is shooting
          if (update.from && update.from !== character) {
            if (players.has(update.from)) {
              const player = players.get(update.from);
              const bulletPos = k.vec2(
                update.message.position.x,
                update.message.position.y
              );
              new Bullet(k, ws, bulletPos, update.message.angle, update.from);
            }
          }
          break;

        case "hit_enemy":
          // A player hit an enemy
          if (enemies.has(update.message.enemyId)) {
            // Create explosion at the hit position
            k.addKaboom(
              k.vec2(update.message.position.x, update.message.position.y)
            );

            // Remove the enemy
            const enemy = enemies.get(update.message.enemyId);
            if (enemy && enemy.gameObj) {
              enemy.gameObj.destroy();
            }
            enemies.delete(update.message.enemyId);
          }
          break;
      }
    } else if (update.type === "player_list") {
      // Server sent a list of all connected players
      update.players.forEach((playerInfo) => {
        if (
          playerInfo.character !== character &&
          !players.has(playerInfo.character)
        ) {
          const newPlayer = new Player(k, ws, playerInfo.character, false);
          players.set(playerInfo.character, newPlayer);
          if (playerInfo.position) {
            newPlayer.setPosition(playerInfo.position.x, playerInfo.position.y);
          }
        }
      });
    } else if (update.type === "enemy_list") {
      // Handle the enemy list message
      console.log("Received enemy list:", update.enemies);
      update.enemies.forEach((enemy) => {
        if (!enemies.has(enemy.id)) {
          const newEnemy = new Enemy(k, ws, enemy.position);
          enemies.set(enemy.id, newEnemy);
        }
      });
    }
  } catch (error) {
    console.error("Error parsing message:", error);
  }
};

k.loadRoot("./");

if (DEBUG) {
  k.add([k.pos(10, 10), k.text(`Token: ${token}`, { size: 16 })]);
  k.add([k.pos(10, 30), k.text(`Character: ${character}`, { size: 16 })]);
}

// k.onClick(() => {
//   ws.send(
//     JSON.stringify({
//       type: "game_action",
//       action: "kaboom",
//       position: k.mousePos(),
//     })
//   );
//   k.addKaboom(k.mousePos());
// });
