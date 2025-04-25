export class Bullet {
  constructor(k, ws, position, angle, fromPlayer) {
    this.k = k;
    this.ws = ws;
    this.speed = 400;
    this.fromPlayer = fromPlayer;

    // Calculate velocity based on angle
    const radians = angle * (Math.PI / 180);
    this.velocity = {
      x: Math.cos(radians) * this.speed,
      y: Math.sin(radians) * this.speed,
    };

    this.gameObj = k.add([
      k.pos(position.x, position.y),
      k.circle(3), // Small circle for the bullet
      k.color(255, 255, 0), // Yellow color
      k.outline(1, k.rgb(1, 1, 0.5)), // Light outline
      k.area(), // For collisions
      k.move(this.velocity.x, this.velocity.y), // Set initial velocity
      "cleanup", // Automatically destroy when off screen
      k.opacity(1), // Required for lifespan component
      k.lifespan(5), // Destroy after 5 seconds
      "bullet", // Tag for collision detection
      {
        fromPlayer: fromPlayer,
      },
    ]);

    // Set up collision detection
    this.gameObj.onCollide("enemy", (enemy) => {
      // Create explosion effect
      k.addKaboom(this.gameObj.pos);

      // Send message to server about the hit
      this.sendHitUpdate(enemy.id);

      // Destroy the bullet
      this.gameObj.destroy();
    });
  }

  getPosition() {
    return { x: this.gameObj.pos.x, y: this.gameObj.pos.y };
  }

  sendHitUpdate(enemyId) {
    this.ws.send(
      JSON.stringify({
        type: "game_action",
        action: "hit_enemy",
        enemyId: enemyId,
        position: this.getPosition(),
      })
    );
  }
}
