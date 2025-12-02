
import React, { useState, useEffect } from "react";
import IntroView from "./components/IntroView";
import CyberRunner from "./components/CyberRunner";
import GameOverView from "./components/GameOverView";
import type { GameStats } from "./types";
import { audioService } from "./services/audioService";

const APP_STATE = {
  INTRO: "INTRO",
  PLAYING: "PLAYING",
  GAME_OVER: "GAME_OVER",
} as const;

type AppState = (typeof APP_STATE)[keyof typeof APP_STATE];

const STORAGE_KEY = "cyberFlappy_highScore";

const readStoredHighScore = () => {
  if (typeof window === "undefined") return 0;
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved ? parseInt(saved, 10) : 0;
};

type FlappyGameProps = {
  onBack?: () => void;
  cameraId?: string;
  cameraLabel?: string;
};

const FlappyGame: React.FC<FlappyGameProps> = ({
  onBack,
  cameraId,
  cameraLabel,
}) => {
  const [appState, setAppState] = useState<AppState>(APP_STATE.INTRO);
  const [currentScore, setCurrentScore] = useState(0);
  const [highScore, setHighScore] = useState(() => readStoredHighScore());
  const [lastGameStats, setLastGameStats] = useState<GameStats>({
    score: 0,
    highScore: 0,
    combo: 0,
    maxCombo: 0,
  });
  const [dimensions, setDimensions] = useState(() => ({
    width: typeof window !== "undefined" ? window.innerWidth : 1280,
    height: typeof window !== "undefined" ? window.innerHeight : 720,
  }));
  const [cameraReady, setCameraReady] = useState(false);
  const [startPending, setStartPending] = useState(false);
  const [gameplayActive, setGameplayActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    return () => {
      audioService.stopBGM();
    };
  }, []);

  useEffect(() => {
    if (appState !== APP_STATE.PLAYING) {
      setCameraReady(false);
      setGameplayActive(false);
      setStartPending(false);
    }
  }, [appState]);

  const persistHighScore = (score: number) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, score.toString());
    }
  };

  const beginGameplay = () => {
    audioService.init();
    audioService.resume();
    audioService.playBGM();
    setCurrentScore(0);
    setGameplayActive(true);
    setStartPending(false);
  };

  useEffect(() => {
    if (startPending && cameraReady && !gameplayActive) {
      beginGameplay();
    }
  }, [startPending, cameraReady, gameplayActive]);

  const requestStart = () => {
    setStartPending(true);
    setGameplayActive(false);
    setCameraError(false);
    setAppState(APP_STATE.PLAYING);
    setCurrentScore(0);
  };

  const handleGameOver = (score: number) => {
    audioService.stopBGM();
    setGameplayActive(false);
    setStartPending(false);

    if (score > highScore) {
      setHighScore(score);
      persistHighScore(score);
    }
    setLastGameStats({
      score,
      highScore: Math.max(score, highScore),
      combo: 0,
      maxCombo: 0,
    });
    setAppState(APP_STATE.GAME_OVER);
  };

  const handleUpdateScore = (score: number) => {
    setCurrentScore(score);
  };

  const handleReturnToIntro = () => {
    audioService.stopBGM();
    setGameplayActive(false);
    setStartPending(false);
    setCameraReady(false);
    setCameraError(false);
    setAppState(APP_STATE.INTRO);
    setCurrentScore(0);
  };

  const handleExitToArcade = () => {
    handleReturnToIntro();
    onBack?.();
  };

  const handleCameraReady = () => {
    setCameraReady(true);
    setCameraError(false);
  };
  const handleCameraLost = () => setCameraReady(false);

  const handleCameraFailure = () => {
    setCameraReady(false);
    setGameplayActive(false);
    setCameraError(true);
  };

  const runEnabled = gameplayActive && cameraReady;
  const waitingForCameraOverlay = startPending && !cameraReady && !cameraError;

  return (
    <main className="w-full h-[100dvh] bg-black overflow-hidden relative font-sans">
      {appState === APP_STATE.INTRO && (
        <IntroView
          onEnter={requestStart}
          onBack={onBack ? handleExitToArcade : undefined}
          cameraLabel={cameraLabel}
        />
      )}

      {appState === APP_STATE.PLAYING && (
        <div className="relative w-full h-full flex flex-col">
          <div className="absolute top-0 left-0 w-full p-4 sm:p-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between pointer-events-none z-10">
            <div className="flex flex-col">
              <span className="text-slate-500 font-mono text-[10px] sm:text-xs tracking-widest uppercase">
                Distance
              </span>
              <span className="text-3xl sm:text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                {currentScore}m
              </span>
            </div>
            <div className="flex flex-col items-start lg:items-end gap-2 sm:gap-3">
              <div className="flex flex-col items-start lg:items-end">
                <span className="text-slate-500 font-mono text-[10px] sm:text-xs tracking-widest uppercase">
                  Best Run
                </span>
                <span className="text-xl sm:text-2xl font-bold text-brand-green">
                  {highScore}m
                </span>
                <span className="text-[8px] sm:text-[10px] font-mono tracking-[0.3em] text-slate-400 uppercase">
                  Input: {cameraLabel?.toUpperCase() ?? "DEFAULT SENSOR"}
                </span>
                {!cameraReady && (
                  <span className="text-[8px] sm:text-[10px] font-mono tracking-[0.3em] text-amber-300 uppercase">
                    Waiting for camera feed...
                  </span>
                )}
                {cameraError && (
                  <span className="text-[8px] sm:text-[10px] font-mono tracking-[0.3em] text-red-400 uppercase">
                    Camera error detected
                  </span>
                )}
              </div>
              <div className="flex flex-wrap justify-start lg:justify-end gap-2 sm:gap-3 pointer-events-auto">
                <button
                  onClick={handleReturnToIntro}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 border border-white/20 text-[8px] sm:text-[10px] font-mono tracking-[0.3em] uppercase bg-black/40 text-white hover:border-brand-green hover:text-brand-green transition-colors"
                >
                  Reset Run
                </button>
                {onBack && (
                  <button
                    onClick={handleExitToArcade}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 border border-white/20 text-[8px] sm:text-[10px] font-mono tracking-[0.3em] uppercase bg-white/10 text-white hover:bg-white hover:text-black transition-colors"
                  >
                    Exit to Arcade
                  </button>
                )}
              </div>
            </div>
          </div>

          <CyberRunner
            onGameOver={handleGameOver}
            updateScore={handleUpdateScore}
            width={dimensions.width}
            height={dimensions.height}
            cameraId={cameraId}
            onCameraError={handleCameraFailure}
            onCameraReady={handleCameraReady}
            onCameraLost={handleCameraLost}
            isRunning={runEnabled}
          />
          {waitingForCameraOverlay && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm text-center text-xs font-mono tracking-[0.3em] text-white uppercase pointer-events-none">
              Waiting for camera feed...
            </div>
          )}
          {cameraError && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm text-center text-xs font-mono tracking-[0.3em] text-red-300 uppercase pointer-events-none px-6">
              Camera stream failed. Return to the arcade to select another device.
            </div>
          )}
        </div>
      )}

      {appState === APP_STATE.GAME_OVER && (
        <GameOverView
          score={lastGameStats.score}
          highScore={lastGameStats.highScore}
          maxCombo={lastGameStats.maxCombo}
          onRestart={requestStart}
          onHome={handleReturnToIntro}
          onExit={onBack ? handleExitToArcade : undefined}
        />
      )}
    </main>
  );
};

export default FlappyGame;
