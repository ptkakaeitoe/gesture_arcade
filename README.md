# Gesture Arcade

https://gesturearcade.vercel.app/

Gesture Arcade is a browser-based collection of touchless mini games that use computer-vision-powered hand tracking instead of traditional controllers. Players move their hands in front of a webcam to deflect balls in Pong, slice neon fruit, surf across dunes, fly through cyber tunnels, or trigger playful meme scenes. The entire experience runs locally in the browser using React, Vite, and MediaPipe, so no native installs or external services are required.

## Highlights

- **Gesture-first gameplay** – the shared `useHandTracking` hook streams webcam frames to MediaPipe HandLandmarker, normalizes and smooths landmark data, and exposes consistent gestures to every game.
- **Multiple arcade titles** – currently includes Cyber Pong, CyberSlice (Fruit Ninja style), Dino Surfer, Cyber Runner / Flappy variants, and an intermission Monkey Meme experience.
- **Responsive React UI** – game launcher, onboarding flows, camera selection, and HUD elements are built with Tailwind-style utility classes for rapid iteration.
- **Real-time audio/visual polish** – Canvas-based rendering loops, glow/shadow styling, and custom audio cues make the experience feel like a cohesive cyber arcade cabinet.

## Tech Stack

- **Framework**: React 19, TypeScript, Vite
- **Computer Vision**: `@mediapipe/tasks-vision` HandLandmarker
- **Styling**: Tailwind CSS 4 utility classes + custom CSS modules
- **Audio**: Web Audio API helpers in `src/flappy/services/audioService.ts`
- **Tooling**: ESLint, TypeScript strict mode, npm scripts

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Start the development server**
   ```bash
   npm run dev
   ```
   Visit the printed URL (default `http://localhost:5173`) and grant camera permissions when prompted.
3. **Build for production**
   ```bash
   npm run build
   ```
4. **Preview the production build**
   ```bash
   npm run preview
   ```

## Project Structure

```
src/
├─ App.tsx                 # View/state router for the arcade
├─ hooks/useHandTracking.ts# Shared MediaPipe + smoothing logic
├─ Pong/                   # Cyber Pong implementation
├─ flappy/                 # Cyber Runner + Flappy variants
├─ cyberslice/             # CyberSlice (Fruit Ninja-inspired) game
├─ dino_game/              # Pseudo-3D endless runner
├─ views/                  # Intro, dashboard, HUD components
└─ services/               # Camera selection helpers, audio utilities
```

## Hand Tracking Pipeline

1. **Capture** – `navigator.mediaDevices.getUserMedia` streams webcam frames into an off-screen video element.
2. **Inference** – MediaPipe HandLandmarker detects 21 landmarks per frame directly in the browser (no server round trips).
3. **Normalization & Filtering** – Positions are normalized to `[0, 1]` space and passed through a One Euro Filter to reduce jitter without adding noticeable latency.
4. **Game Integration** – Each game consumes the shared hook to map normalized coordinates to physics (e.g., paddle X in Pong, slice trails in CyberSlice, jump gestures in Dino Surfer).

## Development Notes

- The camera selector persists the last-used device key in `localStorage` to streamline re-entry.
- HUD elements expose tracking status and error states so players know when the webcam feed is unavailable.
- When renaming or adding games, export them from `src/App.tsx` and register them in `src/views/GameDashboard.tsx` alongside their metadata entries.

Gesture Arcade demonstrates that full-body interaction can be achieved with standard web technologies. Plug in any webcam, wave your hands, and the cabinet springs to life.
