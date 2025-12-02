// World Dimensions
export const LANE_WIDTH = 120;
export const HORIZON_Y = 0.4; // 40% down the screen
export const FOV = 400; // Field of view scaling factor
export const CAMERA_Z_OFFSET = 500; // How far the camera is behind the player (roughly)
export const CAMERA_Y_OFFSET = 200; // Camera height

// Physics
export const GRAVITY = 0.8;
export const JUMP_FORCE = 18;
export const LANE_SWITCH_SPEED = 0.3; // 0.0 to 1.0 interpolation factor per frame
export const INITIAL_GAME_SPEED = 12;
export const MAX_GAME_SPEED = 35;
export const SPEED_INCREMENT = 0.005;

// Gameplay
export const SPAWN_DISTANCE = 3000;
export const RENDER_DISTANCE = 2500;
export const PLAYER_WIDTH = 50;
export const PLAYER_HEIGHT = 80;
export const OBSTACLE_SPAWN_RATE_INITIAL = 60; // Frames between spawns

// Visuals
export const COLORS = {
  SKY_TOP: '#3b82f6', // blue-500
  SKY_BOTTOM: '#93c5fd', // blue-300
  GROUND_NEAR: '#fcd34d', // amber-300
  GROUND_FAR: '#d97706', // amber-600
  LANE_MARKER: 'rgba(255, 255, 255, 0.3)',
};
