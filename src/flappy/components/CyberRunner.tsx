import React, { useRef, useEffect, useCallback } from "react";
import { useHandTracking } from "../../hooks/useHandTracking";
import type { GameMode, Player, Obstacle } from "../types";
import { GAME_MODE } from "../types";
import { audioService } from "../services/audioService";

interface CyberRunnerProps {
  onGameOver: (score: number) => void;
  updateScore: (score: number) => void;
  width?: number;
  height?: number;
  cameraId?: string;
  onCameraError?: () => void;
  onCameraReady?: () => void;
  onCameraLost?: () => void;
  isRunning?: boolean;
}

const CyberRunner: React.FC<CyberRunnerProps> = ({
  onGameOver,
  updateScore,
  width = 800,
  height = 400,
  cameraId,
  onCameraError,
  onCameraReady,
  onCameraLost,
  isRunning = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reportedFrameRef = useRef(false);
  const runEnabledRef = useRef<boolean>(Boolean(isRunning));
  const cameraErrorRef = useRef(onCameraError);
  const { y, frame, error } = useHandTracking(cameraId);
  const hasFrame = Boolean(frame);

  useEffect(() => {
    cameraErrorRef.current = onCameraError;
  }, [onCameraError]);

  useEffect(() => {
    runEnabledRef.current = Boolean(isRunning);
  }, [isRunning]);

  useEffect(() => {
    if (hasFrame && !reportedFrameRef.current) {
      onCameraReady?.();
    } else if (!hasFrame && reportedFrameRef.current) {
      onCameraLost?.();
    }
    reportedFrameRef.current = hasFrame;
  }, [hasFrame, onCameraReady, onCameraLost]);

  // --- Game State Refs ---
  const requestRef = useRef<number | null>(null);
  const gameActive = useRef(true);
  const score = useRef(0);
  const mode = useRef<GameMode>(GAME_MODE.RUNNER);
  const frameCount = useRef(0);

  // Physics Constants
  const GRAVITY_RUNNER = 1;
  const GRAVITY_FLAPPY = 0.4;
  const JUMP_STRENGTH_RUNNER = -28;
  const JUMP_STRENGTH_FLAPPY = -11;
  const GROUND_HEIGHT = 60;
  const SPEED_BASE = 6;
  const INPUT_SMOOTHING_WEIGHT = 0.6;
  const RUNNER_TRIGGER_THRESHOLD = 0.45;
  const FLAPPY_TRIGGER_THRESHOLD = 0.55;
  const FLAPPY_FLAP_INTERVAL_MS = 160;

  // Phase Management
  const phaseTimer = useRef(0);
  const PHASE_DURATION = 1200; // Frames per phase (~20 seconds)

  // Player
  const player = useRef<Player>({
    y: height - GROUND_HEIGHT,
    vy: 0,
    width: 40,
    height: 40,
    isGrounded: true,
    color: "#10b981",
  });

  // Obstacles
  const obstacles = useRef<Obstacle[]>([]);

  // Input State
  const inputY = useRef(1.0); // 0.0 (top) to 1.0 (bottom)
  const isJumping = useRef(false);
  const lastFlapTime = useRef(0);

  useEffect(() => {
    if (typeof y === "number") {
      const weight = INPUT_SMOOTHING_WEIGHT;
      inputY.current = inputY.current * (1 - weight) + y * weight;
    }
  }, [y]);

  useEffect(() => {
    if (error) {
      cameraErrorRef.current?.();
    }
  }, [error]);

  // --- Game Logic Helpers ---

  const spawnObstacle = () => {
    // Don't spawn during transmission
    if (mode.current === GAME_MODE.TRANSMIT) return;

    if (mode.current === GAME_MODE.RUNNER) {
      // Ground blocks
      const h = 40 + Math.random() * 40;
      obstacles.current.push({
        x: width + 50,
        y: height - GROUND_HEIGHT - h,
        w: 30 + Math.random() * 20,
        h: h,
        passed: false,
        type: "BLOCK",
      });
    } else if (mode.current === GAME_MODE.FLAPPY) {
      // Pipes
      const gap = 140;
      const minPipe = 50;
      const availableHeight = height - GROUND_HEIGHT;
      const topH =
        minPipe + Math.random() * (availableHeight - gap - minPipe * 2);

      // Top Pipe
      obstacles.current.push({
        x: width + 50,
        y: 0,
        w: 50,
        h: topH,
        passed: false,
        type: "PIPE_DOWN",
      });

      // Bottom Pipe
      obstacles.current.push({
        x: width + 50,
        y: topH + gap,
        w: 50,
        h: height - (topH + gap) - GROUND_HEIGHT,
        passed: false,
        type: "PIPE_UP",
      });
    }
  };

  const switchMode = (newMode: GameMode) => {
    audioService.playPhaseSwitch();
    mode.current = newMode;
    phaseTimer.current = 0;

    // Mode specific resets
    if (newMode === GAME_MODE.TRANSMIT) {
      // Clear obstacles for clean transition
      obstacles.current = [];
      player.current.vy = 0;
    }
  };

  const checkCollision = (p: Player, o: Obstacle) => {
    // Simple AABB
    const pLeft = 100; // Player is fixed at x=100
    const pRight = 100 + p.width;
    const pTop = p.y;
    const pBottom = p.y + p.height;

    const oLeft = o.x;
    const oRight = o.x + o.w;
    const oTop = o.y;
    const oBottom = o.y + o.h;

    return pRight > oLeft && pLeft < oRight && pBottom > oTop && pTop < oBottom;
  };

  // --- Main Loop ---
  const loop = useCallback(() => {
    if (!canvasRef.current || !gameActive.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Background Grid Effect
    ctx.strokeStyle = "rgba(16, 185, 129, 0.1)";
    ctx.lineWidth = 1;
    const gridSize = 40;
    const offset = (frameCount.current * SPEED_BASE) % gridSize;

    ctx.beginPath();
    // Vertical moving lines
    for (let x = -offset; x < width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    // Horizontal perspective lines
    const horizon = height * 0.2;
    let horizonLine = height;
    while (horizonLine > horizon + 2) {
      ctx.moveTo(0, horizonLine);
      ctx.lineTo(width, horizonLine);
      const step = Math.max(2, gridSize * ((horizonLine - horizon) / 200));
      horizonLine -= step;
    }
    ctx.stroke();

    if (!runEnabledRef.current) {
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "bold 20px JetBrains Mono";
      ctx.textAlign = "center";
      ctx.fillText("Awaiting camera feed...", width / 2, height / 2);
      requestRef.current = requestAnimationFrame(loop);
      return;
    }

    // --- Physics & Update ---

    // Input Processing
    // Threshold based input:
    // Runner: < 0.4 triggers jump
    // Flappy: < 0.5 triggers fly up force
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    const threshold =
      mode.current === GAME_MODE.RUNNER
        ? RUNNER_TRIGGER_THRESHOLD
        : mode.current === GAME_MODE.FLAPPY
          ? FLAPPY_TRIGGER_THRESHOLD
          : RUNNER_TRIGGER_THRESHOLD;
    const inputTrigger = inputY.current < threshold;

    let jumpPressed = false;
    if (mode.current === GAME_MODE.RUNNER) {
      jumpPressed = inputTrigger && !isJumping.current;
      isJumping.current = inputTrigger;
      // Jump Logic
      if (jumpPressed && player.current.isGrounded) {
        player.current.vy = JUMP_STRENGTH_RUNNER;
        player.current.isGrounded = false;
        audioService.playJump();
      }

      // Gravity
      player.current.vy += GRAVITY_RUNNER;
      player.current.y += player.current.vy;

      // Ground Collision
      const floor = height - GROUND_HEIGHT - player.current.height;
      if (player.current.y >= floor) {
        player.current.y = floor;
        player.current.vy = 0;
        player.current.isGrounded = true;
      }
    } else if (mode.current === GAME_MODE.FLAPPY) {
      const readyForNextFlap =
        now - lastFlapTime.current >= FLAPPY_FLAP_INTERVAL_MS;
      jumpPressed = inputTrigger && readyForNextFlap;
      if (jumpPressed) {
        player.current.vy = JUMP_STRENGTH_FLAPPY;
        lastFlapTime.current = now;
        audioService.playJump();
      }

      // Flap Logic (Continuous force or Tap?)
      // Let's do Tap-to-flap for control, or Hover.
      // If input is High, add Upward force. If Low, Gravity.
      // To make it distinct from Runner, let's use Hover mechanics:
      // Hand Height maps to Target Velocity or Force.
      // Actually, classic Flappy "Tap" is best.

      player.current.vy += GRAVITY_FLAPPY;
      player.current.y += player.current.vy;

      // Ceiling/Floor
      if (player.current.y < 0) {
        player.current.y = 0;
        player.current.vy = 0;
      }
      const floor = height - GROUND_HEIGHT - player.current.height;
      if (player.current.y > floor) {
        // Crash in flappy mode on floor? Or just slide? Let's crash.
        // audioService.playCrash();
        // gameActive.current = false;
        // For leniency, let's just slide but you can't jump well
        player.current.y = floor;
        player.current.vy = 0;
      }
    } else if (mode.current === GAME_MODE.TRANSMIT) {
      // Transition Mode: Player floats to center
      const targetY = height / 2 - player.current.height / 2;
      player.current.y += (targetY - player.current.y) * 0.1;
      player.current.vy = 0;

      // Speed up timer
      phaseTimer.current += 5;
    }

    // Obstacle Spawning & Logic
    frameCount.current++;
    phaseTimer.current++;

    // Phase Switching Logic
    if (
      phaseTimer.current > PHASE_DURATION &&
      mode.current !== GAME_MODE.TRANSMIT
    ) {
      switchMode(GAME_MODE.TRANSMIT);
    } else if (
      mode.current === GAME_MODE.TRANSMIT &&
      phaseTimer.current > PHASE_DURATION + 300
    ) {
      // Switch to next mode
      // Cycle: Runner -> Transmit -> Flappy -> Transmit -> Runner
      // We need to know previous mode, or just toggle.
      // Simple toggle based on randomness or framecount, but let's toggle.
      // Actually, let's look at previous state logic?
      // Let's just randomize for fun or alternate.
      const next = Math.random() > 0.5 ? GAME_MODE.RUNNER : GAME_MODE.FLAPPY;
      switchMode(next);
    }

    // Spawn Obstacles
    const spawnRate = mode.current === GAME_MODE.RUNNER ? 100 : 120; // Frames between spawn
    if (frameCount.current % spawnRate === 0) {
      spawnObstacle();
    }

    // Move & Cull Obstacles
    obstacles.current.forEach((obs) => {
      obs.x -= SPEED_BASE;

      // Score counting
      if (!obs.passed && obs.x + obs.w < 100) {
        obs.passed = true;
        score.current += 1;
        updateScore(score.current);
      }

      // Collision
      if (checkCollision(player.current, obs)) {
        audioService.playCrash();
        gameActive.current = false;
        onGameOver(score.current);
      }
    });

    obstacles.current = obstacles.current.filter((o) => o.x + o.w > -100);

    // --- Draw ---

    // Draw Floor Line
    ctx.fillStyle = "#334155"; // Dark slate
    ctx.fillRect(0, height - GROUND_HEIGHT, width, GROUND_HEIGHT);
    // Neon line on top of floor
    ctx.fillStyle = mode.current === GAME_MODE.TRANSMIT ? "#ec4899" : "#10b981"; // Pink in transmit, Green normal
    ctx.shadowBlur = 10;
    ctx.shadowColor = ctx.fillStyle;
    ctx.fillRect(0, height - GROUND_HEIGHT, width, 2);
    ctx.shadowBlur = 0;

    // Draw Player
    ctx.save();
    ctx.translate(
      100 + player.current.width / 2,
      player.current.y + player.current.height / 2
    );
    // Rotate based on velocity
    const rot = Math.min(Math.max(player.current.vy * 0.05, -0.5), 0.5);
    ctx.rotate(rot);

    ctx.fillStyle = player.current.color;
    ctx.shadowBlur = 20;
    ctx.shadowColor = player.current.color;
    ctx.fillRect(
      -player.current.width / 2,
      -player.current.height / 2,
      player.current.width,
      player.current.height
    );

    // Player inner detail
    ctx.fillStyle = "#000";
    ctx.fillRect(
      -player.current.width / 4,
      -player.current.height / 4,
      player.current.width / 2,
      player.current.height / 2
    );
    ctx.restore();

    // Draw Obstacles
    obstacles.current.forEach((obs) => {
      ctx.fillStyle = "#ef4444"; // Red
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#ef4444";
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);

      // Glitch effect on obstacles
      if (Math.random() < 0.1) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(
          obs.x + Math.random() * obs.w,
          obs.y + Math.random() * obs.h,
          5,
          2
        );
      }
    });

    // Draw UI Overlay for Mode
    ctx.shadowBlur = 0;
    ctx.font = "bold 20px JetBrains Mono";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText(`MODE: ${mode.current}`, 20, 30);

    // Draw Input Indicator
    const indicatorY = height * 0.2 + inputY.current * (height * 0.6);
    ctx.fillStyle = inputTrigger ? "#10b981" : "#64748b";
    ctx.beginPath();
    ctx.arc(30, indicatorY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText("HAND", 40, indicatorY + 5);

    requestRef.current = requestAnimationFrame(loop);
  }, [updateScore, onGameOver, width, height]);

  // Input Listeners (Keyboard fallback)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        inputY.current = 0.0; // Simulate hand up
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        inputY.current = 1.0; // Simulate hand down
      }
    };

    // Mouse click also works
    const onMouseDown = () => (inputY.current = 0.0);
    const onMouseUp = () => (inputY.current = 1.0);

    // Touch controls
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault(); // Prevent scrolling
      inputY.current = 0.0;
    };
    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      inputY.current = 1.0;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    // Add touch listeners to window to catch touches anywhere
    window.addEventListener("touchstart", onTouchStart, { passive: false });
    window.addEventListener("touchend", onTouchEnd);

    // Start Loop
    requestRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [loop]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-full object-contain bg-[#050505]"
      />

      {/* Webcam Preview Overlay */}
      <div className="absolute top-4 right-4 w-24 h-16 md:w-32 md:h-24 border border-white/20 bg-black/50 rounded-lg overflow-hidden">
        <img
          src={frame ?? ""}
          alt="Cam"
          className={`w-full h-full object-cover transition-opacity duration-200 ${hasFrame ? "opacity-80" : "opacity-0"
            }`}
        />
        {!hasFrame && (
          <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-500 font-mono">
            {error ? "CAMERA ERROR" : "CONNECTING..."}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent animate-scan" />
      </div>
    </div>
  );
};

export default CyberRunner;
