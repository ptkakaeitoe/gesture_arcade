export type PlayableGameId = "flappy" | "pong" | "surfer" | "cyberslice";

export interface CameraOption {
  id: string;
  label: string;
}

export interface GameCardData {
  id: PlayableGameId;
  title: string;
  subtitle: string;
  description: string;
  actions: string[]; // Changed to array for better UI mapping
  accentColor: "green" | "blue" | "orange" | "pink";
}
