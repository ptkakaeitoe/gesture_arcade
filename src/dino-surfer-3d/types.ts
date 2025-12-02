
export const GameState = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  GAME_OVER: 'GAME_OVER',
} as const;
export type GameState = (typeof GameState)[keyof typeof GameState];

export const Lane = {
  LEFT: -1,
  CENTER: 0,
  RIGHT: 1,
} as const;
export type Lane = (typeof Lane)[keyof typeof Lane];

export const EntityType = {
  CACTUS_SMALL: 'CACTUS_SMALL',
  CACTUS_TALL: 'CACTUS_TALL',
  ROCK: 'ROCK',
  BIRD: 'BIRD',
  COIN: 'COIN',
  TRAIN: 'TRAIN',
  BARRIER: 'BARRIER',
  SIGN: 'SIGN',
} as const;
export type EntityType = (typeof EntityType)[keyof typeof EntityType];

export const GameDifficulty = {
  EASY: 'EASY',
  MEDIUM: 'MEDIUM',
  HARD: 'HARD',
} as const;
export type GameDifficulty = (typeof GameDifficulty)[keyof typeof GameDifficulty];

export interface Coordinates {
  x: number; // Lane position (interpolated)
  y: number; // Vertical position (0 is ground)
  z: number; // Depth position
}

export interface GameObject {
  id: number;
  type: EntityType;
  lane: Lane;
  z: number;
  width: number;
  height: number;
  depth: number; // For collision length (Z-axis)
  yOffset: number; // For flying enemies
  active: boolean;
  collected?: boolean; // For coins
}

export interface PlayerState {
  lane: Lane;
  x: number; // Interpolated X for smooth lane changing
  y: number; // Vertical position (jumping)
  z: number; // Always 0 relative to camera, but logically exists
  verticalVelocity: number;
  isJumping: boolean;
  isDucking: boolean;
}
