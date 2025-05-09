import { Bullet } from "./bullet.js";

export class Player {
  constructor(k, ws, character, isLocalCharacter) {
    this.k = k;
    this.ws = ws;
    this.character = character;
    this.isLocalCharacter = isLocalCharacter;
    this.speed = 200;
    this.lastShot = 0;
    this.shootCooldown = 50; // 50ms cooldown between shots

    const r = Math.random() * 255;
    const g = Math.random() * 255;
    const b = Math.random() * 255;

    // Generate random starting position between 400 and 600
    const randomX = 400 + Math.random() * 200;
    const randomY = 400 + Math.random() * 200;

    this.gameObj = k.add([
      k.pos(randomX, randomY),
      k.circle(10), // Add a circle with radius 20
      k.color(r, g, b),
      k.outline(4, k.rgb(0, 0.2, 0.8)), // Optional: add outline
      k.area(), // For collisions if needed
      k.body(), // Add physics body
      k.anchor("center"), // Center the circle
      "player", // Tag for collision detection
      {
        character: character,
        speed: 200,
      },
    ]);

    this.nameTag = k.add([
      k.pos(0, -30),
      k.text(character, { size: 12 }),
      k.anchor("center"),
      k.color(255, 255, 255),
      {
        follow: this.gameObj,
      },
    ]);

    // Add a gun object
    this.gun = k.add([
      k.pos(0, 0),
      k.rect(15, 5), // Simple rectangle for the gun
      k.color(100, 100, 100), // Gray color
      k.anchor("left"), // Anchor at the left side so it points outward
      k.rotate(0), // Initial rotation
      {
        follow: this.gameObj,
        offset: k.vec2(10, 0), // Offset from player center
      },
    ]);

    this.nameTag.onUpdate(() => {
      if (this.nameTag.follow) {
        this.nameTag.pos = this.gameObj.pos.add(0, -30);
      }
    });

    // Update gun position and rotation
    this.gun.onUpdate(() => {
      if (this.gun.follow) {
        // Position the gun at the player with the offset
        this.gun.pos = this.gameObj.pos.add(this.gun.offset);

        // If this is the local player, make the gun point toward the mouse
        if (this.isLocalCharacter) {
          const mousePos = k.mousePos();
          // Calculate angle between player and mouse
          const angle = Math.atan2(
            mousePos.y - this.gameObj.pos.y,
            mousePos.x - this.gameObj.pos.x
          );
          this.gun.angle = angle * (180 / Math.PI); // Convert to degrees

          // Update the offset based on the angle to keep the gun at the edge of the player
          this.gun.offset = k.vec2(Math.cos(angle) * 10, Math.sin(angle) * 10);

          // Send gun rotation update to other players (throttled to avoid too many messages)
          if (
            !this.lastRotationUpdate ||
            Date.now() - this.lastRotationUpdate > 100
          ) {
            this.sendGunRotationUpdate();
            this.lastRotationUpdate = Date.now();
          }
        }
      }
    });

    // Set up shooting controls for local player
    if (this.isLocalCharacter) {
      k.onMousePress(() => {
        this.shoot();
      });
    }
  }

  shoot() {
    const now = Date.now();
    // Check if cooldown has passed
    if (now - this.lastShot < this.shootCooldown) {
      return;
    }

    this.lastShot = now;

    // Calculate bullet spawn position at the end of the gun
    const radians = this.gun.angle * (Math.PI / 180);
    const spawnOffset = this.k.vec2(
      Math.cos(radians) * 20,
      Math.sin(radians) * 20
    );
    const bulletPos = this.gameObj.pos.add(spawnOffset);

    // Create a new bullet
    new Bullet(this.k, this.ws, bulletPos, this.gun.angle, this.character);

    // Send shoot message to server
    this.sendShootUpdate(bulletPos, this.gun.angle);
  }

  sendShootUpdate(position, angle) {
    this.ws.send(
      JSON.stringify({
        type: "game_action",
        action: "shoot",
        position: { x: position.x, y: position.y },
        angle: angle,
      })
    );
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

  sendGunRotationUpdate() {
    this.ws.send(
      JSON.stringify({
        type: "game_action",
        action: "rotate_gun",
        angle: this.gun.angle,
      })
    );
  }

  setGunAngle(angle) {
    if (this.gun) {
      this.gun.angle = angle;

      // Update the offset based on the angle to keep the gun at the edge of the player
      const radians = angle * (Math.PI / 180);
      this.gun.offset = this.k.vec2(
        Math.cos(radians) * 10,
        Math.sin(radians) * 10
      );

      // Immediately update the gun position to reflect the new offset
      this.gun.pos = this.gameObj.pos.add(this.gun.offset);
    }
  }
}
