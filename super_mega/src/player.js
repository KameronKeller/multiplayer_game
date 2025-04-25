export class Player {
  constructor(k, ws, character) {
    this.k = k;
    this.ws = ws;
    this.character = character;
    this.speed = 200;

    this.gameObj = k.add([
      k.pos(120, 80),
      k.circle(20), // Add a circle with radius 20
      k.color(0, 0.5, 1), // Blue color (RGB values from 0-1)
      k.outline(4, k.rgb(0, 0.2, 0.8)), // Optional: add outline
      k.area(), // For collisions if needed
      k.anchor("center"), // Center the circle
      {
        character: character,
        speed: 200,
      },
    ]);

    this.nameTag = k.add([
      k.pos(0, -30),
      k.text(character, { size: 12 }),
      k.anchor("center"),
      k.color(1, 1, 1),
      {
        follow: this.gameObj,
      },
    ]);

    this.nameTag.onUpdate(() => {
      if (this.nameTag.follow) {
        this.nameTag.pos = this.gameObj.pos.add(0, -30);
      }
    });
  }

  move(x, y) {
    this.gameObj.move(x, y);
  }

  setupControls() {
    const k = this.k;

    k.onKeyDown("a", () => {
      this.move(-this.speed, 0);
      this.sendPositionUpdate();
    });

    k.onKeyDown("d", () => {
      this.move(this.speed, 0);
      this.sendPositionUpdate();
    });

    k.onKeyDown("w", () => {
      this.move(0, -this.speed);
      this.sendPositionUpdate();
    });

    k.onKeyDown("s", () => {
      this.move(0, this.speed);
      this.sendPositionUpdate();
    });
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
