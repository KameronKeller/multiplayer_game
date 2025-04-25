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

ws.onopen = () => {
  console.log("Connected to game server");
};

const k = kaplay();

ws.onmessage = (event) => {
  try {
    const update = JSON.parse(event.data);
    console.log("Received message from server:", update);

    // Check if this is a game_update with a kaboom action
    if (update.type === "game_update" && update.message.action === "kaboom") {
      // Use the position from the message
      k.addKaboom(k.vec2(update.message.position.x, update.message.position.y));
    }

    // You can uncomment and adapt the switch statement for different message types
    // as your game grows more complex
  } catch (error) {
    console.error("Error parsing message:", error);
  }
};

k.loadRoot("./"); // A good idea for Itch.io publishing later
// k.loadSprite("bean", "sprites/test.png");

// k.add([k.pos(120, 80), k.sprite("bean")]);

const player = new Player(k, ws, character);
player.setupControls();

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
