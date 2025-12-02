# Gesture Arcade: Step-by-Step Project Walkthrough

This document explains the logical flow of the application, from the moment the user opens the website to playing a game.

---

## Phase 1: Application Initialization

### 1. Entry Point (`src/main.tsx`)
- The browser loads the `index.html` file.
- React takes over and mounts the root component (`<App />`) into the DOM.
- Global styles (Tailwind CSS) are applied here.

### 2. The Arcade Menu (`src/App.tsx` & `src/components/ArcadeMenu.tsx`)
- The user is greeted with the **Arcade Menu**.
- This component displays the available games (Flappy, CyberSlice, Dino Surfer).
- **State Management**: The app tracks which game is currently selected using a simple state variable (e.g., `activeGame`).
- **Action**: When a user clicks "START" on a game card, the app unmounts the menu and mounts the specific Game Component.

---

## Phase 2: The Vision System (The "Brain")

Before any game starts, the system must see the user. This is handled by a shared custom hook.

### 3. Hand Tracking Hook (`src/hooks/useHandTracking.ts`)
This is the most critical part of the project. It runs in the background of every game.

- **Step A: Camera Access**: It calls `navigator.mediaDevices.getUserMedia` to switch on the webcam.
- **Step B: Model Loading**: It loads the **MediaPipe HandLandmarker** model (a large binary file) from Google's servers.
- **Step C: The Detection Loop**:
    1.  It grabs the latest video frame from the webcam.
    2.  It passes this frame to the AI model.
    3.  The AI returns coordinates for 21 hand landmarks.
- **Step D: Data Output**: It exposes variables like `y` (vertical hand position) and `x` (horizontal position) to the game components.

---

## Phase 3: The Game Lifecycle

Let's use **Cyber Flappy** as an example of how a game runs.

### 4. Game Container (`src/flappy/FlappyGame.tsx`)
This component manages the "High-Level" state of the game. It acts like a state machine:
- **State: INTRO**: Shows the "Ready?" screen.
- **State: PLAYING**: Mounts the actual game canvas (`CyberRunner`).
- **State: GAME_OVER**: Shows the score and "Restart" button.

### 5. The Game Loop (`src/flappy/components/CyberRunner.tsx`)
Once the game enters the **PLAYING** state, this component takes over. It uses an HTML5 `<canvas>` to draw graphics.

- **The Loop (`requestAnimationFrame`)**:
    - This function runs ~60 times every second.
    - In every single frame, it does three things:
        1.  **Update**: Calculates new positions for the player and obstacles.
        2.  **Draw**: Clears the screen and paints the player and obstacles at their new positions.
        3.  **Repeat**: Schedules the next frame.

### 6. Controlling the Game (Gesture Logic)
Inside the Game Loop, we connect the Vision System to the Game Physics.

- **Reading Input**:
    ```typescript
    const { y } = useHandTracking(); // Get hand position (0.0 to 1.0)
    ```
- **Applying Physics**:
    - **Gravity**: We constantly add a small value to the player's vertical speed (`vy += GRAVITY`).
    - **Jump/Flap**: We check if the hand position `y` crosses a specific threshold (e.g., `< 0.5`).
        - If **YES**: We set the vertical speed to a negative value (upward force).
        - This makes the character "jump" on the screen.

### 7. Collision & Scoring
- **Collision**: We check if the player's box overlaps with any pipe's box.
    - If they touch -> Set state to **GAME_OVER**.
- **Scoring**: If a pipe moves past the left side of the screen without hitting the player -> **Score +1**.

---

## Phase 4: Game Over & Restart

### 8. The Game Over Screen (`src/flappy/components/GameOverView.tsx`)
- When the game ends, the `FlappyGame` component switches to the **GAME_OVER** state.
- It displays the final score and saves it to `localStorage` (so high scores persist after refresh).
- **Auto-Restart**: A timer counts down (3, 2, 1). If the user doesn't exit, it calls the restart function, resetting the state to **PLAYING** and clearing all obstacles.
