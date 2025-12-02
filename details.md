# Gesture Arcade: System Architecture & Technical Explanation

## 1. Project Overview
**Gesture Arcade** is a web-based gaming platform that uses computer vision to allow players to control games using hand gestures. Unlike traditional games that use a keyboard or mouse, this application processes a live webcam feed to detect the player's hand position in real-time.

**Tech Stack:**
- **Frontend Framework**: React (TypeScript)
- **Computer Vision**: Google MediaPipe (HandLandmarker)
- **Rendering**: HTML5 Canvas API

---

## 2. The Core Pipeline: How It Works
The application follows a continuous loop of **Capture -> Process -> Render**.

### Step 1: Video Capture
The application requests access to the user's webcam using the browser's `navigator.mediaDevices.getUserMedia()` API. This provides a raw video stream that is displayed in a hidden video element and also drawn to the screen for the user to see.

### Step 2: Hand Detection (The AI Part)
We use **MediaPipe HandLandmarker**, a machine learning model optimized for the web.
- **Input**: The raw video frame from the webcam.
- **Processing**: The model analyzes the frame to find 21 specific "landmarks" on the hand (wrist, fingertips, knuckles, etc.).
- **Output**: A list of 3D coordinates (x, y, z) for each landmark.

**Key File**: `src/hooks/useHandTracking.ts`
This custom hook manages the entire pipeline. It initializes the AI model and runs a loop that constantly sends video frames to the model.

### Step 3: Coordinate Normalization & Smoothing
Raw data from the AI can be jittery. To make the game feel smooth:
1.  **Normalization**: We convert the raw coordinates (which might be in video resolution pixels) into a normalized `0.0` to `1.0` range.
    - `0.0` = Top of screen
    - `1.0` = Bottom of screen
2.  **Smoothing**: We apply a **OneEuroFilter** (a signal processing algorithm) to the coordinates. This removes high-frequency noise (jitter) while keeping the response fast (low latency).

---

## 3. Game Logic & Physics

Each game runs its own "Game Loop" using `requestAnimationFrame`. This is a standard web API that tells the browser to update the screen roughly 60 times per second (60 FPS).

### A. CyberRunner (Flappy / Runner Mode)
**File**: `src/flappy/components/CyberRunner.tsx`
- **Physics Engine**: A custom physics simulation runs every frame.
- **Gravity**: A constant downward force (`vy += gravity`) is applied to the player.
- **Input Mapping**:
    - The normalized Hand Y-position is tracked.
    - **Runner Mode**: If the hand moves quickly **down** (below a threshold), it triggers a "Jump" (upward velocity).
    - **Bird Mode**: If the hand moves **up**, it triggers a "Flap" (upward velocity).
- **Collision Detection**: We use **AABB (Axis-Aligned Bounding Box)** collision. We check if the player's rectangle overlaps with any pipe or block rectangle.
    ```typescript
    if (playerRight > obstacleLeft && playerLeft < obstacleRight && ...) {
        // Collision detected!
    }
    ```

### B. CyberSlice (Fruit Ninja Style)
**File**: `src/gesture-arcade_-cyberslice/components/GameCanvas.tsx`
- **Blade Trail**: We store a history of the last N hand positions. We draw lines connecting them to create the glowing "slicer" trail.
- **Vector Math**: To check if a fruit is sliced, we calculate the distance between the fruit's center and the blade's line segment.
- **Spawning**: Fruits and bombs are spawned with random velocities (`vx`, `vy`) to create parabolic arcs (projectile motion).

### C. Dino Surfer
**File**: `src/dino-surfer-3d/DinoSurferGame.tsx`
- **Perspective Trick**: Although it looks 3D, it uses 2D canvas drawing with scaling tricks. Objects further away are drawn smaller and move slower (parallax effect) to create the illusion of depth.

---

## 4. Summary for Presentation
If you are presenting this to a professor, here is the "Elevator Pitch":

> "We built a touchless arcade platform using React and Computer Vision. Instead of simple key-presses, we integrated Google's MediaPipe AI to track hand landmarks in real-time directly in the browser. We built a custom hook to process these signals, smooth them out using signal filtering, and map them to game physics. This allows for a natural, controller-free gaming experience where the user's physical movements directly manipulate the game state."
