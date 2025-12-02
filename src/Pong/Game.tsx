// Game.tsx
import React, { useEffect, useRef, useState } from "react";
import { useHandTracking } from "../hooks/useHandTracking";
import IntroView from "./components/IntroView";
import GameOverView from "./components/GameOverView";
import { audioService } from "../flappy/services/audioService";

const WIDTH = 800;
const HEIGHT = 480;

const APP_STATE = {
  INTRO: "INTRO",
  PLAYING: "PLAYING",
  GAME_OVER: "GAME_OVER",
} as const;

type AppState = (typeof APP_STATE)[keyof typeof APP_STATE];

type GameProps = {
  onBack?: () => void;
  cameraId?: string;
  cameraLabel?: string;
};

const Game: React.FC<GameProps> = ({ onBack, cameraId, cameraLabel }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [appState, setAppState] = useState<AppState>(APP_STATE.INTRO);
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
  const gameActive = useRef(false);

  useEffect(() => {
    if (typeof x === "number") {
      paddleX.current = x * WIDTH;
    }
  }, [x]);

  useEffect(() => {
    setFrameSrc(frame ?? null);
  }, [frame]);

  const startGame = () => {
    audioService.init();
    audioService.resume();
    setAppState(APP_STATE.PLAYING);
    setScore(0);
    setMisses(0);
    scoreRef.current = 0;
    missesRef.current = 0;
    ballX.current = WIDTH / 2;
    ballY.current = HEIGHT / 2;
    ballVx.current = (Math.random() > 0.5 ? 1 : -1) * 4;
    ballVy.current = -4;
    gameActive.current = true;
  };

  const handleGameOver = () => {
    gameActive.current = false;
    audioService.playCrash(); // Play crash sound on game over
    setAppState(APP_STATE.GAME_OVER);
  };

  const handleReturnToIntro = () => {
    gameActive.current = false;
    setAppState(APP_STATE.INTRO);
  };

  const handleExitToArcade = () => {
    handleReturnToIntro();
    onBack?.();
  };

  useEffect(() => {
    if (appState !== APP_STATE.PLAYING) return;

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
      if (!gameActive.current) {
        // If game is not active, we don't loop anymore.
        // The cleanup function will handle cancelling the current frame if needed,
        // but here we just stop the loop.
        return;
      }

      // update ball physics
      ballX.current += ballVx.current;
      ballY.current += ballVy.current;

      // walls
      if (ballX.current < BALL_RADIUS || ballX.current > WIDTH - BALL_RADIUS) {
        ballVx.current *= -1;
        audioService.playPong(); // Wall hit sound
      }
      if (ballY.current < BALL_RADIUS) {
        ballVy.current *= -1;
        audioService.playPong(); // Ceiling hit sound
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
          audioService.playPing(); // Paddle hit sound

          // Speed up slightly
          const speedMultiplier = 1.05;
          ballVx.current *= speedMultiplier;
          ballVy.current *= speedMultiplier;
        }
      }

      // missed paddle -> reset ball
      if (ballY.current > HEIGHT + BALL_RADIUS) {
        missesRef.current += 1;
        setMisses(missesRef.current);
        audioService.playMiss(); // Miss sound
        resetBall();

        // Game Over condition (e.g., 3 misses)
        if (missesRef.current >= 3) {
          handleGameOver();
          return; // Stop loop immediately
        }
      }

      // clear screen
      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      // Draw Grid Background (Cyber style)
      ctx.strokeStyle = "rgba(6, 182, 212, 0.1)"; // Cyan low opacity
      ctx.lineWidth = 1;
      const gridSize = 40;
      ctx.beginPath();
      for (let x = 0; x <= WIDTH; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, HEIGHT);
      }
      for (let y = 0; y <= HEIGHT; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(WIDTH, y);
      }
      ctx.stroke();

      // draw paddle
      ctx.fillStyle = "#22d3ee"; // Cyan-400
      ctx.shadowBlur = 20;
      ctx.shadowColor = "#22d3ee";
      ctx.fillRect(
        paddleX.current - PADDLE_WIDTH / 2,
        PADDLE_Y - PADDLE_HEIGHT / 2,
        PADDLE_WIDTH,
        PADDLE_HEIGHT
      );
      ctx.shadowBlur = 0;

      // draw ball
      ctx.fillStyle = "#f472b6"; // Pink-400
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#f472b6";
      ctx.beginPath();
      ctx.arc(ballX.current, ballY.current, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      requestAnimationFrame(loop);
    };

    const animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [appState]);

  const trackingStatus = error
    ? { text: "Camera unavailable", className: "text-red-500" }
    : frameSrc
      ? { text: "Tracking", className: "text-emerald-500" }
      : { text: "Awaiting camera", className: "text-amber-500" };

  return (
    <main className="w-full h-[100dvh] bg-black overflow-hidden relative font-sans">
      {appState === APP_STATE.INTRO && (
        <IntroView
          onEnter={startGame}
          onBack={onBack ? handleExitToArcade : undefined}
          cameraLabel={cameraLabel}
        />
      )}

      {appState === APP_STATE.PLAYING && (
        <div className="relative w-full h-full flex flex-col items-center justify-center bg-[#050505]">
          {/* Background Grid */}
          <div className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(rgba(6, 182, 212, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.05) 1px, transparent 1px)`,
              backgroundSize: "40px 40px"
            }}
          />

          {/* HUD */}
          <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-10 pointer-events-none">
            <div className="flex flex-col gap-1">
              <span className="text-cyan-500 font-mono text-xs tracking-widest uppercase">Score</span>
              <span className="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">{score}</span>
            </div>
            <div className="flex flex-col gap-1 items-end">
              <span className="text-amber-500 font-mono text-xs tracking-widest uppercase">Misses</span>
              <div className="flex gap-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className={`w-3 h-3 rounded-full ${i < misses ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" : "bg-slate-800"}`} />
                ))}
              </div>
            </div>
          </div>

          {/* Game Canvas */}
          <div className="relative z-0 w-full max-w-[800px] aspect-[5/3] px-4 md:px-0">
            <div className="w-full h-full border-2 border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/10">
              <canvas
                ref={canvasRef}
                width={WIDTH}
                height={HEIGHT}
                className="w-full h-full object-contain bg-black/50 backdrop-blur-sm"
              />
            </div>
          </div>

          {/* Webcam Overlay */}
          <div className="absolute top-6 right-6 w-32 h-24 border border-white/20 bg-black/50 rounded-lg overflow-hidden z-20">
            <img
              src={frameSrc || undefined}
              alt="Cam"
              className={`w-full h-full object-cover transition-opacity duration-200 ${frameSrc ? "opacity-80" : "opacity-0"}`}
            />
            {!frameSrc && (
              <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-500 font-mono">
                {error ? "CAMERA ERROR" : "CONNECTING..."}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent animate-scan" />
          </div>

          {/* Controls */}
          <div className="absolute bottom-6 right-6 flex gap-4 pointer-events-auto z-20">
            <button
              onClick={handleReturnToIntro}
              className="px-4 py-2 border border-white/20 text-[10px] font-mono tracking-[0.3em] uppercase bg-black/40 text-white hover:border-cyan-500 hover:text-cyan-500 transition-colors"
            >
              Abort Game
            </button>
          </div>
        </div>
      )}

      {appState === APP_STATE.GAME_OVER && (
        <GameOverView
          score={score}
          misses={misses}
          onRestart={startGame}
          onHome={handleReturnToIntro}
          onExit={onBack ? handleExitToArcade : undefined}
        />
      )}
    </main>
  );
};

export default Game;
