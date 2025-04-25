import { v4 as uuidv4 } from "uuid";
import { broadcastToAll } from "./server.js";

// Add enemies tracking and export it
export const enemies = new Map();
// const SPAWN_INTERVAL = 5000; // Spawn enemies every 5 seconds
const SPAWN_INTERVAL = 500;
const MAX_ENEMIES = 10; // Maximum number of enemies at once
const ARENA_SIZE = { width: 820, height: 820 }; // Match your arena size

// Function to generate a random position within arena bounds
const getRandomPosition = () => {
  return {
    x: Math.floor(Math.random() * 150 + ARENA_SIZE.width / 2),
    y: Math.floor(Math.random() * 150 + ARENA_SIZE.height / 2 - 100),
  };
};

const spawnEnemy = () => {
  if (enemies.size >= MAX_ENEMIES) return;

  const enemyId = uuidv4();
  const position = getRandomPosition();

  enemies.set(enemyId, {
    position,
    createdAt: new Date(),
  });

  // Broadcast the new enemy to all clients
  broadcastToAll({
    type: "game_update",
    message: {
      action: "enemy_spawn",
      enemy: {
        id: enemyId,
        position,
      },
    },
  });

  //   console.log(`Spawned enemy at position:`, position);
};

// Start enemy spawning if there are clients connected

export const startEnemySpawner = () => {
  const interval = setInterval(spawnEnemy, SPAWN_INTERVAL);
//   console.log("Enemy spawner started");
  return interval;
};

export const stopEnemySpawner = (interval) => {
  if (interval) {
    clearInterval(interval);
    // console.log("Enemy spawner stopped");
  }
};
