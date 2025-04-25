// Constants
const GAME_WIDTH = 819;
const GAME_HEIGHT = 819;
const BOUNDARY_THICKNESS = 10;

// Initialize the arena
export const initArena = (k, debug) => {
  addBackground(k);
  createBoundaries(k, debug);
};

// Add background image
const addBackground = (k) => {
  k.loadSprite("background", "background.png");
  k.add([
    k.sprite("background"),
    k.pos(k.width() / 2, k.height() / 2),
    k.anchor("center"),
    k.scale(0.8), // Adjust as needed
    k.z(-1),
  ]);
};

// Create game boundaries
const createBoundaries = (k, debug) => {
  // Top wall
  k.add([
    k.rect(GAME_WIDTH, BOUNDARY_THICKNESS),
    k.pos(k.width() / 2, k.height() / 2 - GAME_HEIGHT / 2),
    k.anchor("center"),
    k.area(),
    k.body({ isStatic: true }),
    k.opacity(debug ? 0.3 : 0), // Make visible in debug mode
    "wall",
  ]);

  // Bottom wall
  k.add([
    k.rect(GAME_WIDTH, BOUNDARY_THICKNESS),
    k.pos(k.width() / 2, k.height() / 2 + GAME_HEIGHT / 2),
    k.anchor("center"),
    k.area(),
    k.body({ isStatic: true }),
    k.opacity(debug ? 0.3 : 0),
    "wall",
  ]);

  // Left wall
  k.add([
    k.rect(BOUNDARY_THICKNESS, GAME_HEIGHT),
    k.pos(k.width() / 2 - GAME_WIDTH / 2, k.height() / 2),
    k.anchor("center"),
    k.area(),
    k.body({ isStatic: true }),
    k.opacity(debug ? 0.3 : 0),
    "wall",
  ]);

  // Right wall
  k.add([
    k.rect(BOUNDARY_THICKNESS, GAME_HEIGHT),
    k.pos(k.width() / 2 + GAME_WIDTH / 2, k.height() / 2),
    k.anchor("center"),
    k.area(),
    k.body({ isStatic: true }),
    k.opacity(debug ? 0.3 : 0),
    "wall",
  ]);
};

// Export constants for use in other files
export { GAME_WIDTH, GAME_HEIGHT, BOUNDARY_THICKNESS };
