export interface Point {
  x: number;
  y: number;
  life?: number; // For trail fading
}

export const ENTITY_TYPE = {
  FRUIT: "FRUIT",
  BOMB: "BOMB",
  PARTICLE: "PARTICLE",
  TEXT_FLOAT: "TEXT_FLOAT",
} as const;

export type EntityType = (typeof ENTITY_TYPE)[keyof typeof ENTITY_TYPE];

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

export type CyberSliceDifficulty = "calm" | "standard" | "overdrive";

export interface DifficultyConfig {
  id: CyberSliceDifficulty;
  label: string;
  tagline: string;
  description: string;
  metrics: string[];
  bombChance: number;
  spawnRateBase: number;
  gravity: number;
}

export interface NormalizedPoint {
  x: number;
  y: number;
}
