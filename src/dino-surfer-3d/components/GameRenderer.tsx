import React, { useRef, useEffect, useCallback } from "react";
import { GameState, Lane, EntityType, GameDifficulty } from "../types";
import type { GameObject, PlayerState } from "../types";
import {
  LANE_WIDTH,
  CAMERA_Z_OFFSET,
  CAMERA_Y_OFFSET,
  GRAVITY,
  JUMP_FORCE,
  LANE_SWITCH_SPEED,
  INITIAL_GAME_SPEED,
  SPAWN_DISTANCE,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  MAX_GAME_SPEED,
  SPEED_INCREMENT,
  HORIZON_Y,
} from "../constants";
import { audioManager } from "../audio";

interface GameRendererProps {
  gameState: GameState;
  gameDifficulty: GameDifficulty;
  onGameOver: (score: number) => void;
  onScoreUpdate: (score: number) => void;
  onLivesUpdate: (lives: number) => void;
  zoomLevel: number;
  gestureLane?: Lane | null;
  gestureJumpToggle?: boolean;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

const GameRenderer: React.FC<GameRendererProps> = ({
  gameState,
  gameDifficulty,
  onGameOver,
  onScoreUpdate,
  onLivesUpdate,
  zoomLevel,
  gestureLane,
  gestureJumpToggle,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);

  // Game State Refs
  const scoreRef = useRef(0);
  const speedRef = useRef(INITIAL_GAME_SPEED);
  const objectsRef = useRef<GameObject[]>([]);
  const nextSpawnZRef = useRef(SPAWN_DISTANCE);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const lastSpeedUpRef = useRef(0);

  // Lives & Invincibility
  const livesRef = useRef(1);
  const invincibleUntilRef = useRef(0);
  const damageFlashRef = useRef(0);
  const gestureJumpPrevRef = useRef<boolean>(gestureJumpToggle ?? false);

  const playerRef = useRef<PlayerState>({
    lane: Lane.CENTER,
    x: 0,
    y: 0,
    z: 0,
    verticalVelocity: 0,
    isJumping: false,
    isDucking: false,
  });

  // Controls State
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Initialize Game
  const resetGame = useCallback(() => {
    scoreRef.current = 0;
    objectsRef.current = [];
    nextSpawnZRef.current = SPAWN_DISTANCE;
    floatingTextsRef.current = [];

    // Difficulty Settings
    let initialLives = 1;
    let initialSpeed = INITIAL_GAME_SPEED;

    switch (gameDifficulty) {
      case GameDifficulty.EASY:
        initialLives = 3;
        initialSpeed = 10;
        break;
      case GameDifficulty.MEDIUM:
        initialLives = 2;
        initialSpeed = 12;
        break;
      case GameDifficulty.HARD:
        initialLives = 1;
        initialSpeed = 15;
        break;
    }

    speedRef.current = initialSpeed;
    livesRef.current = initialLives;
    invincibleUntilRef.current = 0;
    onLivesUpdate(initialLives);

    playerRef.current = {
      lane: Lane.CENTER,
      x: 0,
      y: 0,
      z: 0,
      verticalVelocity: 0,
      isJumping: false,
      isDucking: false,
    };
    onScoreUpdate(0);
  }, [onScoreUpdate, onLivesUpdate, gameDifficulty]);

  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      resetGame();
    }
  }, [gameState, resetGame]);

  useEffect(() => {
    if (gameState !== GameState.PLAYING) return;
    if (gestureLane == null) return;
    playerRef.current.lane = gestureLane;
  }, [gestureLane, gameState]);

  useEffect(() => {
    if (gameState !== GameState.PLAYING) {
      if (typeof gestureJumpToggle !== "undefined") {
        gestureJumpPrevRef.current = gestureJumpToggle;
      }
      return;
    }
    if (typeof gestureJumpToggle === "undefined") return;
    if (gestureJumpPrevRef.current === gestureJumpToggle) return;
    gestureJumpPrevRef.current = gestureJumpToggle;
    const p = playerRef.current;
    if (!p.isJumping) {
      p.verticalVelocity = JUMP_FORCE;
      p.isJumping = true;
      audioManager.play("jump");
    }
  }, [gestureJumpToggle, gameState]);

  // Input Handlers
  const handleInput = useCallback(
    (action: "LEFT" | "RIGHT" | "UP" | "DOWN") => {
      if (gameState !== GameState.PLAYING) return;

      const p = playerRef.current;

      switch (action) {
        case "LEFT":
          if (p.lane > Lane.LEFT) p.lane--;
          break;
        case "RIGHT":
          if (p.lane < Lane.RIGHT) p.lane++;
          break;
        case "UP":
          if (!p.isJumping) {
            p.verticalVelocity = JUMP_FORCE;
            p.isJumping = true;
            audioManager.play("jump");
          }
          break;
        case "DOWN":
          if (p.isJumping) {
            p.verticalVelocity = -JUMP_FORCE;
          }
          break;
      }
    },
    [gameState]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
        case "a":
          handleInput("LEFT");
          break;
        case "ArrowRight":
        case "d":
          handleInput("RIGHT");
          break;
        case "ArrowUp":
        case "w":
        case " ":
          handleInput("UP");
          break;
        case "ArrowDown":
        case "s":
          handleInput("DOWN");
          break;
      }
    },
    [handleInput]
  );

  // Touch Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
    };

    const diffX = touchEnd.x - touchStartRef.current.x;
    const diffY = touchEnd.y - touchStartRef.current.y;
    const absDiffX = Math.abs(diffX);
    const absDiffY = Math.abs(diffY);

    // Tap detection (movement less than 10px)
    if (absDiffX < 10 && absDiffY < 10) {
      handleInput("UP"); // Tap to jump
    }
    // Swipe detection
    else if (absDiffX > absDiffY) {
      if (absDiffX > 30) {
        handleInput(diffX > 0 ? "RIGHT" : "LEFT");
      }
    } else {
      if (absDiffY > 30) {
        handleInput(diffY > 0 ? "DOWN" : "UP");
      }
    }
    touchStartRef.current = null;
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Game Logic Helper: 3D to 2D Projection
  const project = (
    x: number,
    y: number,
    z: number,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    // Use zoomLevel from props as FOV
    const scale = zoomLevel / (zoomLevel + z + CAMERA_Z_OFFSET);
    const x2d = canvasWidth / 2 + x * scale;
    const y2d = canvasHeight * HORIZON_Y - y * scale + CAMERA_Y_OFFSET * scale;
    return { x: x2d, y: y2d, scale };
  };

  const addFloatingText = (
    text: string,
    x: number,
    y: number,
    color: string
  ) => {
    floatingTextsRef.current.push({
      id: Date.now() + Math.random(),
      text,
      x,
      y,
      color,
      life: 60,
      maxLife: 60,
    });
  };

  // --- SPAWNING LOGIC ---
  const spawnPattern = (zStart: number) => {
    const r = Math.random();
    const newObjects: GameObject[] = [];

    // Difficulty Modifiers
    let gapModifier = 1.0;
    if (gameDifficulty === GameDifficulty.EASY) gapModifier = 1.5; // More space
    if (gameDifficulty === GameDifficulty.MEDIUM) gapModifier = 1.2;
    if (gameDifficulty === GameDifficulty.HARD) gapModifier = 0.9; // Less space

    let gap = 1200 * gapModifier;

    // 1. Train Pattern (High Danger) - Less frequent in Easy
    const trainThreshold = gameDifficulty === GameDifficulty.EASY ? 0.9 : 0.85;

    if (r > trainThreshold) {
      // Spawn a train in a random lane
      const trainLane = [Lane.LEFT, Lane.CENTER, Lane.RIGHT][
        Math.floor(Math.random() * 3)
      ];
      newObjects.push({
        id: Date.now() + Math.random(),
        type: EntityType.TRAIN,
        lane: trainLane,
        z: zStart + 400, // Push center point back because it's long
        width: 100,
        height: 120,
        depth: 800, // Much deeper
        yOffset: 0,
        active: true,
      });

      // Coins in safe lane
      if (Math.random() > 0.5) {
        const otherLane = trainLane === Lane.CENTER ? Lane.LEFT : Lane.CENTER;
        newObjects.push({
          id: Date.now() + Math.random(),
          type: EntityType.COIN,
          lane: otherLane,
          z: zStart + 200,
          width: 30,
          height: 30,
          depth: 10,
          yOffset: 20,
          active: true,
        });
      }
      gap = 1800 * gapModifier; // Extra gap after train
    }
    // 2. Barrier Pattern (Jumpable)
    else if (r > 0.6) {
      const isTriple =
        gameDifficulty === GameDifficulty.HARD && Math.random() > 0.8;
      const lanes = isTriple
        ? [Lane.LEFT, Lane.CENTER, Lane.RIGHT]
        : [Math.floor(Math.random() * 3) - 1];

      lanes.forEach((lane, idx) => {
        newObjects.push({
          id: Date.now() + Math.random() + idx,
          type: EntityType.BARRIER,
          lane: lane as Lane,
          z: zStart,
          width: 100,
          height: 45, // Jumpable height
          depth: 20,
          yOffset: 0,
          active: true,
        });
      });
      gap = 1100 * gapModifier;
    }
    // 3. Mixed Obstacles (Signs, Cactus, Rocks)
    else if (r > 0.3) {
      const lanes = [Lane.LEFT, Lane.CENTER, Lane.RIGHT];
      // Ensure one lane is free
      const freeLaneIndex = Math.floor(Math.random() * 3);
      lanes.splice(freeLaneIndex, 1);

      lanes.forEach((lane) => {
        const typeR = Math.random();
        let type: EntityType = EntityType.CACTUS_SMALL;
        let h = 50;
        let w = 40;
        let yOff = 0;

        if (typeR > 0.7) {
          type = EntityType.SIGN;
          w = 60;
          h = 100;
        } else if (typeR > 0.4) {
          type = EntityType.ROCK;
          w = 50;
          h = 40;
        } else {
          type = EntityType.CACTUS_TALL;
          w = 30;
          h = 90;
        }

        newObjects.push({
          id: Date.now() + Math.random(),
          type: type,
          lane: lane as Lane,
          z: zStart,
          width: w,
          height: h,
          depth: 30,
          yOffset: yOff,
          active: true,
        });
      });

      // Add coins to free lane
      const freeLane = [Lane.LEFT, Lane.CENTER, Lane.RIGHT][freeLaneIndex];
      newObjects.push({
        id: Date.now() + Math.random(),
        type: EntityType.COIN,
        lane: freeLane,
        z: zStart,
        width: 30,
        height: 30,
        depth: 10,
        yOffset: 20,
        active: true,
      });
      gap = 1200 * gapModifier;
    }
    // 4. Coin Run (Rewards)
    else {
      const lane = Math.floor(Math.random() * 3) - 1;
      for (let i = 0; i < 5; i++) {
        newObjects.push({
          id: Date.now() + Math.random() + i,
          type: EntityType.COIN,
          lane: lane as Lane,
          z: zStart + i * 80,
          width: 30,
          height: 30,
          depth: 10,
          yOffset: 20,
          active: true,
        });
      }
      gap = 1000 * gapModifier;
    }

    return { newObjects, gap };
  };

  // Main Game Loop
  const animate = useCallback(
    (_time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Handle High DPI
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (
        canvas.width !== rect.width * dpr ||
        canvas.height !== rect.height * dpr
      ) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
      }
      const width = rect.width;
      const height = rect.height;

      const isInvincible = Date.now() < invincibleUntilRef.current;

      // --- LOGIC UPDATES ---
      if (gameState === GameState.PLAYING) {
        const p = playerRef.current;

        // Update Physics
        const targetX = p.lane * LANE_WIDTH;
        p.x += (targetX - p.x) * LANE_SWITCH_SPEED;

        if (p.isJumping) {
          p.y += p.verticalVelocity;
          p.verticalVelocity -= GRAVITY;
          if (p.y <= 0) {
            p.y = 0;
            p.isJumping = false;
            p.verticalVelocity = 0;
          }
        }

        // Move Objects
        const objects = objectsRef.current;
        const gameSpeed = speedRef.current;

        let activeObjects = objects.filter(
          (obj) => obj.z + obj.depth / 2 > -500 && obj.active
        );
        activeObjects.forEach((obj) => {
          obj.z -= gameSpeed;
        });

        // Collision Detection
        for (const obj of activeObjects) {
          // Z-Collision using Depth
          const objFront = obj.z - obj.depth / 2;
          const objBack = obj.z + obj.depth / 2;

          // Player is at Z=0, depth approx 20
          const playerZMin = -10;
          const playerZMax = 10;

          const zCollision = playerZMax > objFront && playerZMin < objBack;

          if (zCollision && obj.active) {
            // X-Collision
            const laneX = obj.lane * LANE_WIDTH;
            const xCollision = Math.abs(p.x - laneX) < LANE_WIDTH / 2;

            if (xCollision) {
              // Y-Collision (Height check)
              if (obj.type === EntityType.COIN) {
                obj.active = false;
                scoreRef.current += 50;
                audioManager.play("coin");
                // Add floating text
                const pProj = project(
                  p.x,
                  p.y + PLAYER_HEIGHT,
                  0,
                  width,
                  height
                );
                addFloatingText("+50", pProj.x, pProj.y, "#fbbf24");
              } else {
                let hit = true;

                // Vertical check
                if (obj.yOffset > 0) {
                  if (p.y < obj.yOffset - 20) hit = false;
                } else {
                  if (p.y > obj.height) hit = false;
                }

                if (hit) {
                  if (!isInvincible) {
                    // Damage Logic
                    damageFlashRef.current = 10; // Frames of red flash
                    if (livesRef.current > 1) {
                      audioManager.play("hit");
                      livesRef.current -= 1;
                      onLivesUpdate(livesRef.current);
                      invincibleUntilRef.current = Date.now() + 1500; // 1.5s invincibility
                      // Knockback/Visual shake could go here
                      const pProj = project(
                        p.x,
                        p.y + PLAYER_HEIGHT,
                        0,
                        width,
                        height
                      );
                      addFloatingText("-1 LIFE", pProj.x, pProj.y, "#ef4444");
                    } else {
                      livesRef.current = 0;
                      onLivesUpdate(0);
                      audioManager.play("gameover");
                      onGameOver(Math.floor(scoreRef.current));
                      return;
                    }
                  }
                }
              }
            }
          }
        }

        objectsRef.current = activeObjects;

        // Spawning
        nextSpawnZRef.current -= gameSpeed;
        if (nextSpawnZRef.current <= SPAWN_DISTANCE - 300) {
          const lastObj = objectsRef.current[objectsRef.current.length - 1];
          // Safe check if no objects
          const lastZ = lastObj ? lastObj.z + lastObj.depth / 2 : 0;

          if (lastZ < SPAWN_DISTANCE - 500) {
            // Added more buffer here
            const { newObjects } = spawnPattern(SPAWN_DISTANCE);
            objectsRef.current.push(...newObjects);
          }
        }

        // Difficulty & Speed Up
        scoreRef.current += gameSpeed * 0.1;
        if (speedRef.current < MAX_GAME_SPEED) {
          speedRef.current += SPEED_INCREMENT;
          // Notify speed up every 5 units
          if (
            Math.floor(speedRef.current) > lastSpeedUpRef.current &&
            Math.floor(speedRef.current) % 5 === 0
          ) {
            lastSpeedUpRef.current = Math.floor(speedRef.current);
            audioManager.play("levelup");
            addFloatingText("SPEED UP!", width / 2, height / 3, "#3b82f6");
          }
        }
        onScoreUpdate(Math.floor(scoreRef.current));
      }

      // --- RENDER ---

      // Sky (Cyberpunk Void)
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "#050505"); // Deep Black
      gradient.addColorStop(HORIZON_Y, "#1e1b4b"); // Dark Indigo at horizon
      gradient.addColorStop(HORIZON_Y, "#270a0a"); // Dark Red/Orange Ground
      gradient.addColorStop(1, "#451a03"); // Darker Orange Ground

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Track (Neon Grid)
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(249, 115, 22, 0.5)"; // Brand Orange
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#f97316";

      [-1.5, -0.5, 0.5, 1.5].forEach((laneBoundary) => {
        const p1 = project(laneBoundary * LANE_WIDTH, 0, 0, width, height);
        const p2 = project(laneBoundary * LANE_WIDTH, 0, 5000, width, height);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      });

      // Reset shadow for other elements
      ctx.shadowBlur = 0;

      // Speed Lines (Ground Grid Effect)
      const speedOffset = (Date.now() * (speedRef.current / 10)) % 500;
      for (let z = 0; z < 4000; z += 500) {
        const drawZ = z - speedOffset;
        if (drawZ < 10) continue;
        const p1 = project(-1.5 * LANE_WIDTH, 0, drawZ, width, height);
        const p2 = project(1.5 * LANE_WIDTH, 0, drawZ, width, height);
        ctx.strokeStyle = "rgba(249, 115, 22, 0.2)"; // Faint Orange
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }

      // Draw Function
      const drawObject = (obj: GameObject) => {
        if (!obj.active) return;
        const laneX = obj.lane * LANE_WIDTH;

        // Calculate projections for front and back faces
        const zFront = obj.z - obj.depth / 2;
        const zBack = obj.z + obj.depth / 2;

        const pFront = project(laneX, obj.yOffset, zFront, width, height);
        const pBack = project(laneX, obj.yOffset, zBack, width, height);

        const sFront = pFront.scale;
        const sBack = pBack.scale;

        // Skip if object is behind camera or scale is invalid
        if (sFront <= 0 || sBack <= 0) return;

        const wFront = obj.width * sFront;
        const hFront = obj.height * sFront;

        const wBack = obj.width * sBack;
        const hBack = obj.height * sBack;

        // Shadow (simple blob at y=0)
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.beginPath();
        ctx.ellipse(
          pFront.x,
          pFront.y + 10 * sFront,
          Math.abs(wFront / 2),
          Math.abs(wFront / 5),
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();

        if (obj.type === EntityType.TRAIN) {
          // Draw 3D Box for Train
          ctx.fillStyle = "#991b1b"; // Dark Red Top
          ctx.beginPath();
          ctx.moveTo(pFront.x - wFront / 2, pFront.y - hFront);
          ctx.lineTo(pFront.x + wFront / 2, pFront.y - hFront);
          ctx.lineTo(pBack.x + wBack / 2, pBack.y - hBack);
          ctx.lineTo(pBack.x - wBack / 2, pBack.y - hBack);
          ctx.fill();

          // Right Side
          if (pFront.x < width / 2) {
            ctx.fillStyle = "#7f1d1d";
            ctx.beginPath();
            ctx.moveTo(pFront.x + wFront / 2, pFront.y - hFront);
            ctx.lineTo(pFront.x + wFront / 2, pFront.y);
            ctx.lineTo(pBack.x + wBack / 2, pBack.y);
            ctx.lineTo(pBack.x + wBack / 2, pBack.y - hBack);
            ctx.fill();
          }
          // Left Side
          if (pFront.x > width / 2) {
            ctx.fillStyle = "#7f1d1d";
            ctx.beginPath();
            ctx.moveTo(pFront.x - wFront / 2, pFront.y - hFront);
            ctx.lineTo(pFront.x - wFront / 2, pFront.y);
            ctx.lineTo(pBack.x - wBack / 2, pBack.y);
            ctx.lineTo(pBack.x - wBack / 2, pBack.y - hBack);
            ctx.fill();
          }

          // Front Face
          ctx.fillStyle = "#b91c1c"; // Red Body
          ctx.fillRect(
            pFront.x - wFront / 2,
            pFront.y - hFront,
            wFront,
            hFront
          );

          // Windows
          ctx.fillStyle = "#93c5fd"; // Glass
          ctx.fillRect(
            pFront.x - wFront * 0.3,
            pFront.y - hFront * 0.8,
            wFront * 0.6,
            hFront * 0.4
          );

          // Lights
          ctx.fillStyle = "#fcd34d";
          ctx.beginPath();
          ctx.arc(
            pFront.x - wFront * 0.3,
            pFront.y - hFront * 0.2,
            wFront * 0.1,
            0,
            Math.PI * 2
          );
          ctx.arc(
            pFront.x + wFront * 0.3,
            pFront.y - hFront * 0.2,
            wFront * 0.1,
            0,
            Math.PI * 2
          );
          ctx.fill();
        } else if (obj.type === EntityType.BARRIER) {
          ctx.fillStyle = "#4b5563";
          ctx.fillRect(
            pFront.x - wFront / 2,
            pFront.y - hFront,
            wFront * 0.1,
            hFront
          );
          ctx.fillRect(
            pFront.x + wFront / 2 - wFront * 0.1,
            pFront.y - hFront,
            wFront * 0.1,
            hFront
          );

          const barH = hFront * 0.5;
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(pFront.x - wFront / 2, pFront.y - hFront, wFront, barH);

          ctx.fillStyle = "#ffffff";
          for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(
              pFront.x - wFront / 2 + (i * wFront) / 5,
              pFront.y - hFront
            );
            ctx.lineTo(
              pFront.x - wFront / 2 + (i * wFront) / 5 + 10 * sFront,
              pFront.y - hFront
            );
            ctx.lineTo(
              pFront.x - wFront / 2 + (i * wFront) / 5 - 10 * sFront,
              pFront.y - hFront + barH
            );
            ctx.lineTo(
              pFront.x - wFront / 2 + (i * wFront) / 5 - 20 * sFront,
              pFront.y - hFront + barH
            );
            ctx.fill();
          }
        } else if (obj.type === EntityType.SIGN) {
          ctx.fillStyle = "#9ca3af";
          ctx.fillRect(
            pFront.x - wFront * 0.1,
            pFront.y - hFront,
            wFront * 0.2,
            hFront
          );
          ctx.fillStyle = "#facc15";
          ctx.beginPath();
          const signSize = wFront * 0.8;
          const signY = pFront.y - hFront;
          ctx.moveTo(pFront.x, signY - signSize / 2);
          ctx.lineTo(pFront.x + signSize / 2, signY);
          ctx.lineTo(pFront.x, signY + signSize / 2);
          ctx.lineTo(pFront.x - signSize / 2, signY);
          ctx.fill();
          ctx.fillStyle = "black";
          ctx.font = `${20 * sFront}px Arial`;
          ctx.textAlign = "center";
          ctx.fillText("!", pFront.x, signY + 10 * sFront);
        } else if (obj.type === EntityType.COIN) {
          const spin = Math.sin(Date.now() / 100);
          const cw = wFront * Math.abs(spin);
          ctx.fillStyle = "#fbbf24";
          ctx.beginPath();
          ctx.ellipse(
            pFront.x,
            pFront.y - hFront / 2,
            cw / 2,
            hFront / 2,
            0,
            0,
            Math.PI * 2
          );
          ctx.fill();
          ctx.strokeStyle = "#f59e0b";
          ctx.lineWidth = 2 * sFront;
          ctx.stroke();
        } else if (
          obj.type === EntityType.CACTUS_SMALL ||
          obj.type === EntityType.CACTUS_TALL
        ) {
          ctx.fillStyle = "#166534";
          ctx.fillRect(
            pFront.x - wFront / 2,
            pFront.y - hFront,
            wFront,
            hFront
          );
          ctx.fillStyle = "#15803d";
          ctx.fillRect(
            pFront.x - wFront / 4,
            pFront.y - hFront + 5 * sFront,
            wFront / 2,
            hFront - 5 * sFront
          );
        } else if (obj.type === EntityType.ROCK) {
          ctx.fillStyle = "#57534e";
          ctx.beginPath();
          ctx.moveTo(pFront.x - wFront / 2, pFront.y);
          ctx.lineTo(pFront.x - wFront / 4, pFront.y - hFront);
          ctx.lineTo(pFront.x + wFront / 4, pFront.y - hFront);
          ctx.lineTo(pFront.x + wFront / 2, pFront.y);
          ctx.fill();
        }
      };

      const drawPlayer = () => {
        if (gameState !== GameState.GAME_OVER) {
          // Invincibility Effect
          if (isInvincible) {
            // 50% opacity pulse instead of disappearing
            if (Math.floor(Date.now() / 100) % 2 === 0) {
              ctx.globalAlpha = 0.5;
            } else {
              ctx.globalAlpha = 0.8;
            }
          } else {
            ctx.globalAlpha = 1.0;
          }

          const p = playerRef.current;
          const pProj = project(p.x, p.y, p.z, width, height);
          const ps = pProj.scale;
          const pw = PLAYER_WIDTH * ps;
          const ph = PLAYER_HEIGHT * ps;

          // Shadow
          ctx.fillStyle = "rgba(0,0,0,0.5)";
          ctx.beginPath();
          const shadowScale = Math.max(0.5, 1 - p.y / 200);
          ctx.ellipse(
            pProj.x,
            pProj.y + 10 * ps + p.y * ps,
            (pw / 2) * shadowScale,
            (pw / 5) * shadowScale,
            0,
            0,
            Math.PI * 2
          );
          ctx.fill();

          // Dino Drawing
          const bounce = p.isJumping ? 0 : Math.sin(Date.now() / 50) * 5 * ps;
          const dinoY = pProj.y - bounce;

          // Tail
          ctx.fillStyle = "#15803d"; // Dark Green
          ctx.beginPath();
          ctx.moveTo(pProj.x, dinoY - ph * 0.4);
          ctx.lineTo(pProj.x, dinoY - ph * 0.1);
          ctx.lineTo(pProj.x - pw, dinoY - ph * 0.6); // Tail tip
          ctx.fill();

          // Legs
          ctx.fillStyle = "#166534";
          if (p.isJumping) {
            // Tucked
            ctx.fillRect(
              pProj.x - pw * 0.3,
              dinoY - ph * 0.2,
              pw * 0.2,
              ph * 0.2
            );
            ctx.fillRect(
              pProj.x + pw * 0.1,
              dinoY - ph * 0.2,
              pw * 0.2,
              ph * 0.2
            );
          } else {
            // Running
            const legL = Math.sin(Date.now() / 50) * 10 * ps;
            ctx.fillRect(
              pProj.x - pw * 0.3,
              dinoY - ph * 0.2,
              pw * 0.2,
              ph * 0.2 + legL
            );
            ctx.fillRect(
              pProj.x + pw * 0.1,
              dinoY - ph * 0.2,
              pw * 0.2,
              ph * 0.2 - legL
            );
          }

          // Body
          ctx.fillStyle = "#22c55e"; // Bright Green
          ctx.fillRect(pProj.x - pw / 2, dinoY - ph * 0.9, pw, ph * 0.7);

          // Head
          ctx.fillStyle = "#22c55e";
          ctx.fillRect(
            pProj.x - pw * 0.2,
            dinoY - ph * 1.3,
            pw * 0.9,
            ph * 0.5
          );

          // Eye
          ctx.fillStyle = "white";
          ctx.fillRect(
            pProj.x + pw * 0.3,
            dinoY - ph * 1.2,
            pw * 0.2,
            pw * 0.2
          );
          ctx.fillStyle = "black";
          ctx.fillRect(
            pProj.x + pw * 0.4,
            dinoY - ph * 1.15,
            pw * 0.1,
            pw * 0.1
          );

          // Arms
          ctx.fillStyle = "#166534";
          ctx.fillRect(
            pProj.x + pw * 0.2,
            dinoY - ph * 0.7,
            pw * 0.3,
            pw * 0.1
          );

          ctx.globalAlpha = 1.0; // Reset opacity
        }
      };

      // --- DRAW LOOP ---
      // 1. Clear & Background
      // (Already done in Sky section)

      // Damage Flash
      if (damageFlashRef.current > 0) {
        ctx.fillStyle = `rgba(255, 0, 0, ${damageFlashRef.current / 20})`;
        ctx.fillRect(0, 0, width, height);
        damageFlashRef.current--;
      }

      // Sort objects from Far (Positive Z) to Near (Negative Z)
      const objectsToDraw = [...objectsRef.current].sort((a, b) => b.z - a.z);

      // Split objects into Background (Z > 0) and Foreground (Z <= 0)
      objectsToDraw.forEach((obj) => {
        if (obj.z > 0) drawObject(obj);
      });

      drawPlayer();

      objectsToDraw.forEach((obj) => {
        if (obj.z <= 0) drawObject(obj);
      });

      // Draw Floating Text
      const texts = floatingTextsRef.current;
      texts.forEach((t) => {
        ctx.fillStyle = t.color;
        ctx.font = "bold 30px Arial";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 3;
        ctx.textAlign = "center";

        // Float up
        t.y -= 1;
        t.life--;

        ctx.globalAlpha = t.life / 20; // Fade out
        if (ctx.globalAlpha > 1) ctx.globalAlpha = 1;

        ctx.strokeText(t.text, t.x, t.y);
        ctx.fillText(t.text, t.x, t.y);
        ctx.globalAlpha = 1.0;
      });
      // Cleanup dead texts
      floatingTextsRef.current = texts.filter((t) => t.life > 0);

      requestRef.current = requestAnimationFrame(animate);
    },
    [
      gameState,
      onGameOver,
      onScoreUpdate,
      zoomLevel,
      gameDifficulty,
      onLivesUpdate,
    ]
  );

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    />
  );
};

export default GameRenderer;
