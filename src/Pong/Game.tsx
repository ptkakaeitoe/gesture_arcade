// Game.tsx
import React, { useEffect, useRef, useState } from "react";
import { useHandTracking } from "../hooks/useHandTracking";

const WIDTH = 800;
const HEIGHT = 480;

type GameProps = {
  onBack?: () => void;
  cameraId?: string;
};

const Game: React.FC<GameProps> = ({ onBack, cameraId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [frameSrc, setFrameSrc] = useState<string | null>(null);
  const { x, frame, error } = useHandTracking(cameraId);

  // game state refs (no re-render)
  const paddleX = useRef(WIDTH / 2);
  const ballX = useRef(WIDTH / 2);
  const ballY = useRef(HEIGHT / 2);
  const ballVx = useRef(4);
  const ballVy = useRef(4);
  const scoreRef = useRef(0);
  const missesRef = useRef(0);

  useEffect(() => {
    if (typeof x === "number") {
      paddleX.current = x * WIDTH;
    }
  }, [x]);

  useEffect(() => {
    setFrameSrc(frame ?? null);
  }, [frame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const PADDLE_WIDTH = 120;
    const PADDLE_HEIGHT = 20;
    const PADDLE_Y = HEIGHT - 40;
    const BALL_RADIUS = 10;

    const resetBall = () => {
      ballX.current = WIDTH / 2;
      ballY.current = HEIGHT / 2;
      ballVx.current = (Math.random() > 0.5 ? 1 : -1) * 4;
      ballVy.current = -4;
    };

    const loop = () => {
      // update ball physics
      ballX.current += ballVx.current;
      ballY.current += ballVy.current;

      // walls
      if (ballX.current < BALL_RADIUS || ballX.current > WIDTH - BALL_RADIUS) {
        ballVx.current *= -1;
      }
      if (ballY.current < BALL_RADIUS) {
        ballVy.current *= -1;
      }

      // paddle collision
      if (
        ballVy.current > 0 &&
        ballY.current > PADDLE_Y - BALL_RADIUS &&
        ballY.current < PADDLE_Y + BALL_RADIUS
      ) {
        const dx = Math.abs(ballX.current - paddleX.current);
        if (dx < PADDLE_WIDTH / 2) {
          ballVy.current *= -1;
          ballY.current = PADDLE_Y - BALL_RADIUS;
          scoreRef.current += 1;
          setScore(scoreRef.current);
        }
      }

      // missed paddle -> reset ball
      if (ballY.current > HEIGHT + BALL_RADIUS) {
        missesRef.current += 1;
        setMisses(missesRef.current);
        resetBall();
      }

      // clear screen
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // draw paddle
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(
        paddleX.current - PADDLE_WIDTH / 2,
        PADDLE_Y - PADDLE_HEIGHT / 2,
        PADDLE_WIDTH,
        PADDLE_HEIGHT
      );

      // draw ball
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(ballX.current, ballY.current, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      requestAnimationFrame(loop);
    };

    const animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, []);

  const trackingStatus = error
    ? { text: "Camera unavailable", className: "text-red-500" }
    : frameSrc
      ? { text: "Tracking", className: "text-emerald-500" }
      : { text: "Awaiting camera", className: "text-amber-500" };

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
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pink-500">
              Gesture Arcade
            </p>
            <h1 className="text-3xl font-semibold text-slate-900">
              Hand-Controlled Pong
            </h1>
            <p className="text-sm text-slate-500">
              Steer the paddle with your hand just like a futuristic Zoom call
              mini-game.
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
            <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:24px_24px]" />
              <canvas
                ref={canvasRef}
                width={WIDTH}
                height={HEIGHT}
                className="relative block w-full rounded-[28px] bg-transparent"
              />
              <div className="pointer-events-none absolute left-6 top-6 flex flex-col gap-2 text-left text-white drop-shadow">
                <div className="rounded-2xl border border-white/30 bg-white/10 px-4 py-2">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-white/70">
                    Score
                  </p>
                  <p className="text-3xl font-semibold text-cyan-300">
                    {score}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/30 bg-white/10 px-4 py-2">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-white/70">
                    Misses
                  </p>
                  <p className="text-3xl font-semibold text-amber-300">
                    {misses}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/30 bg-white/10 px-4 py-2">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-white/70">
                    Pace
                  </p>
                  <p className="text-3xl font-semibold text-emerald-300">
                    {Math.max(score - misses, 0)}
                  </p>
                </div>
              </div>
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
              <p className="text-lg font-semibold text-slate-900">Playbook</p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
                <li>Frame yourself and raise your index finger.</li>
                <li>Slide left/right to mirror the paddle track.</li>
                <li>Chase streaks—drops reset the neon ball.</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/80">
              <p className="text-lg font-semibold text-slate-900">
                Session Notes
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Improve accuracy by keeping the camera stable and ensuring even
                lighting on your hand.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;
