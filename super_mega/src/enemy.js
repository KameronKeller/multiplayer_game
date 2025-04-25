export class Enemy {
  constructor(k, ws, position) {
    this.k = k;
    this.ws = ws;
    this.speed = 200;

    this.gameObj = k.add([
      k.pos(position.x, position.y),
      k.circle(10), // Add a circle with radius 10
      k.color(0, 255, 0), // Green color (RGB values from 0-255)
      k.outline(4, k.rgb(0, 0.2, 0.8)), // Optional: add outline
      k.area(), // For collisions if needed
      k.body(), // Add physics body
      k.anchor("center"), // Center the circle
      {
        speed: 200,
      },
    ]);
  }

  move(x, y) {
    this.gameObj.move(x, y);
  }

  getPosition() {
    return { x: this.gameObj.pos.x, y: this.gameObj.pos.y };
  }

  setPosition(x, y) {
    this.gameObj.pos.x = x;
    this.gameObj.pos.y = y;
  }

  sendPositionUpdate() {
    this.ws.send(
      JSON.stringify({
        type: "game_action",
        action: "move",
        position: this.getPosition(),
      })
    );
  }
}
