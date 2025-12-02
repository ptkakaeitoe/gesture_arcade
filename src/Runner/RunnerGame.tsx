import React, { useEffect, useRef, useState } from "react";
import { useHandTracking } from "../hooks/useHandTracking";

const WIDTH = 800;
const HEIGHT = 400;

type RunnerGameProps = {
  onBack?: () => void;
  cameraId?: string;
};

const RunnerGame: React.FC<RunnerGameProps> = ({ onBack, cameraId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [frameSrc, setFrameSrc] = useState<string | null>(null);
  const [scoreDisplay, setScoreDisplay] = useState(0);
  const [statusDisplay, setStatusDisplay] = useState<"Running" | "Game Over">(
    "Running"
  );
  const { y, frame, error } = useHandTracking(cameraId);

  // --- gesture state (from MediaPipe) ---
  const shouldJump = useRef(false);

  // --- player (dino) state ---
  const dinoX = 100;
  const groundY = HEIGHT - 60; // baseline for feet
  const dinoY = useRef(groundY);
  const dinoVy = useRef(0); // vertical velocity
  const isOnGround = useRef(true);

  // --- physics ---
  const gravity = 0.8;
  const jumpStrength = -16;

  // --- obstacles ---
  type Obstacle = { x: number; y: number; w: number; h: number };
  const obstaclesRef = useRef<Obstacle[]>([]);
  const obstacleTimer = useRef(0);
  const obstacleInterval = 120; // frames between spawns
  const obstacleSpeed = 6;

  // --- game state ---
  const score = useRef(0);
  const isGameOver = useRef(false);

  useEffect(() => {
    if (typeof y === "number") {
      shouldJump.current = y < 0.5;
    }
  }, [y]);

  useEffect(() => {
    setFrameSrc(frame ?? null);
  }, [frame]);

  const trackingStatus = error
    ? { text: "Camera unavailable", className: "text-rose-500" }
    : frameSrc
      ? { text: "Tracking", className: "text-emerald-500" }
      : { text: "Awaiting camera", className: "text-amber-500" };

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dinoWidth = 40;
    const dinoHeight = 50;

    const resetGame = () => {
      dinoY.current = groundY;
      dinoVy.current = 0;
      isOnGround.current = true;
      obstaclesRef.current = [];
      obstacleTimer.current = 0;
      score.current = 0;
      isGameOver.current = false;
      setScoreDisplay(0);
      setStatusDisplay("Running");
    };

    const spawnObstacle = () => {
      const w = 30 + Math.random() * 20;
      const h = 40 + Math.random() * 40;
      obstaclesRef.current.push({
        x: WIDTH + w,
        y: groundY - h,
        w,
        h,
      });
    };

    const checkCollision = (obs: Obstacle) => {
      const dinoLeft = dinoX - dinoWidth / 2;
      const dinoRight = dinoX + dinoWidth / 2;
      const dinoTop = dinoY.current - dinoHeight;
      const dinoBottom = dinoY.current;

      const obsLeft = obs.x;
      const obsRight = obs.x + obs.w;
      const obsTop = obs.y;
      const obsBottom = obs.y + obs.h;

      const overlapX = dinoRight > obsLeft && dinoLeft < obsRight;
      const overlapY = dinoBottom > obsTop && dinoTop < obsBottom;

      return overlapX && overlapY;
    };

    let frameId: number;

    const loop = () => {
      // update
      if (!isGameOver.current) {
        // Jump if hand is up and dino is on ground
        if (shouldJump.current && isOnGround.current) {
          dinoVy.current = jumpStrength;
          isOnGround.current = false;
        }

        // Apply gravity
        dinoVy.current += gravity;
        dinoY.current += dinoVy.current;

        // Ground collision
        if (dinoY.current >= groundY) {
          dinoY.current = groundY;
          dinoVy.current = 0;
          isOnGround.current = true;
        }

        // Obstacles
        obstacleTimer.current += 1;
        if (obstacleTimer.current >= obstacleInterval) {
          spawnObstacle();
          obstacleTimer.current = 0;
        }

        obstaclesRef.current = obstaclesRef.current
          .map((obs) => ({
            ...obs,
            x: obs.x - obstacleSpeed,
          }))
          .filter((obs) => obs.x + obs.w > 0); // keep if on screen

        // Collision detection
        for (const obs of obstaclesRef.current) {
          if (checkCollision(obs)) {
            isGameOver.current = true;
            break;
          }
        }

        // Score
        score.current += 1;
      }

      // draw
      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      // sky background
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // ground line
      ctx.strokeStyle = "#4b5563";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, groundY + 1);
      ctx.lineTo(WIDTH, groundY + 1);
      ctx.stroke();

      // dino
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(
        dinoX - dinoWidth / 2,
        dinoY.current - dinoHeight,
        dinoWidth,
        dinoHeight
      );

      // obstacles
      ctx.fillStyle = "#ef4444";
      obstaclesRef.current.forEach((obs) => {
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
      });

      // score
      ctx.fillStyle = "#111827";
      ctx.font = "20px sans-serif";
      ctx.fillText(`Score: ${score.current}`, 20, 30);

      // instructions
      ctx.font = "16px sans-serif";
      ctx.fillText("Raise your hand to jump", 20, 60);

      if (isGameOver.current) {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        ctx.fillStyle = "#f9fafb";
        ctx.font = "36px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", WIDTH / 2, HEIGHT / 2 - 20);

        ctx.font = "20px sans-serif";
        ctx.fillText(
          "Raise your hand and press R to restart",
          WIDTH / 2,
          HEIGHT / 2 + 20
        );
        ctx.textAlign = "start";
      }

      frameId = requestAnimationFrame(loop);
    };

    resetGame();
    frameId = requestAnimationFrame(loop);

    // keyboard restart
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "r") {
        resetGame();
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setScoreDisplay(score.current);
      setStatusDisplay(isGameOver.current ? "Game Over" : "Running");
    }, 250);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className="min-h-screen px-6 py-10 text-slate-900"
      style={{
        backgroundColor: "#fdfdfd",
        backgroundImage:
          "linear-gradient(90deg, rgba(15,23,42,0.05) 1px, transparent 1px), linear-gradient(rgba(15,23,42,0.05) 1px, transparent 1px)",
        backgroundSize: "26px 26px",
      }}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-8 font-sans">
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-200/80 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">
              Gesture Arcade
            </p>
            <h1 className="text-3xl font-semibold text-slate-900">
              Hand-Controlled Runner
            </h1>
            <p className="text-sm text-slate-500">
              Raise your hand to vault over obstacles and keep the neon dino
              sprinting.
            </p>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-500 hover:bg-slate-100"
            >
              ← Back to Dashboard
            </button>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
          <div className="relative rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-2xl shadow-slate-200/90">
            <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-100 via-slate-50 to-white">
              <canvas
                ref={canvasRef}
                width={WIDTH}
                height={HEIGHT}
                className="relative block w-full rounded-[28px] bg-transparent"
              />
            </div>
            <div className="absolute right-4 top-4 flex w-28 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 p-2 shadow-md shadow-slate-300/60 sm:right-6 sm:top-6 sm:w-36">
              {frameSrc ? (
                <img
                  src={frameSrc}
                  alt="Live webcam"
                  className="h-20 w-full rounded-xl border border-slate-200 object-cover sm:h-24"
                />
              ) : (
                <div className="flex h-28 w-full items-center justify-center rounded-xl border border-dashed border-slate-300 text-[10px] uppercase tracking-wide text-slate-400">
                  {error ? "Camera Error" : "Webcam"}
                </div>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
              <p className="font-semibold text-slate-800">Live Tracking</p>
              <span className={trackingStatus.className}>
                {trackingStatus.text}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/80">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Current Run
              </p>
              <h2 className="mt-2 text-4xl font-semibold text-slate-900">
                {scoreDisplay}
              </h2>
              <p className="text-sm text-slate-500">
                Higher score = longer survival.
              </p>
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                Status:{" "}
                <span
                  className={
                    statusDisplay === "Game Over"
                      ? "text-rose-500"
                      : "text-emerald-500"
                  }
                >
                  {statusDisplay}
                </span>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/80">
              <p className="text-lg font-semibold text-slate-900">Playbook</p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
                <li>Keep your index fingertip visible to the camera.</li>
                <li>Raise your hand (lower y value) to trigger a jump.</li>
                <li>Press R to reset after a collision.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RunnerGame;
