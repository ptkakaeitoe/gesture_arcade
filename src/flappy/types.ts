
export interface Point {
  x: number;
  y: number;
  life?: number;
}

export const ENTITY_TYPE = {
  FRUIT: "FRUIT",
  BOMB: "BOMB",
  PARTICLE: "PARTICLE",
  TEXT_FLOAT: "TEXT_FLOAT",
} as const;

export type EntityType = (typeof ENTITY_TYPE)[keyof typeof ENTITY_TYPE];

export const GAME_MODE = {
  RUNNER: "RUNNER",
  FLAPPY: "FLAPPY",
  TRANSMIT: "TRANSMIT",
} as const;

export type GameMode = (typeof GAME_MODE)[keyof typeof GAME_MODE];

export const GAME_VARIANT = {
  RUNNER_ONLY: "RUNNER_ONLY",
  FLAPPY_ONLY: "FLAPPY_ONLY",
  HYBRID: "HYBRID",
} as const;

export type GameVariant = (typeof GAME_VARIANT)[keyof typeof GAME_VARIANT];

export interface Player {
  y: number;
  vy: number;
  width: number;
  height: number;
  isGrounded: boolean;
  color: string;
}

export interface Obstacle {
  x: number;
  y: number;
  w: number;
  h: number;
  passed: boolean;
  type: 'BLOCK' | 'PIPE_UP' | 'PIPE_DOWN';
}

export interface Entity {
  id: string;
  type: EntityType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  emoji: string;
  sliced: boolean;
  markedForDeletion: boolean;
  scale: number;
  opacity: number;
  scoreValue?: number;
  life?: number;
}

export interface GameStats {
  score: number;
  highScore: number;
  combo: number;
  maxCombo: number;
}
