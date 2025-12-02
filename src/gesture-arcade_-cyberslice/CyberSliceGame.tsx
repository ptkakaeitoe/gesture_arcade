import React, { useState, useEffect, useRef } from "react";
import IntroView from "./components/IntroView";
import GameCanvas from "./components/GameCanvas";
import GameOverView from "./components/GameOverView";
import type {
  CyberSliceDifficulty,
  DifficultyConfig,
  GameStats,
  NormalizedPoint,
} from "./types";
import { audioService } from "./services/audioService";
import { useHandTracking } from "../hooks/useHandTracking";

const APP_STATE = {
  SELECT: "SELECT",
  PLAYING: "PLAYING",
  GAME_OVER: "GAME_OVER",
} as const;

type AppState = (typeof APP_STATE)[keyof typeof APP_STATE];

const DIFFICULTY_ORDER: CyberSliceDifficulty[] = [
  "calm",
  "standard",
  "overdrive",
];

const DIFFICULTY_CONFIGS: Record<CyberSliceDifficulty, DifficultyConfig> = {
  calm: {
    id: "calm",
    label: "Calibration Run",
    tagline: "Low Threat",
    description:
      "Slower fruit arcs, generous airtime, and minimal bombs. Perfect for warm-up and onboarding new pilots.",
    metrics: ["Bombs 8%", "Spawn 60f", "Gravity .11"],
    bombChance: 0.08,
    spawnRateBase: 60,
    gravity: 0.11,
  },
  standard: {
    id: "standard",
    label: "Arcade Protocol",
    tagline: "Balanced",
    description:
      "Classic CyberSlice pacing. Bomb ratio ramps with score, demanding clean slices to fuel your combo meter.",
    metrics: ["Bombs 15%", "Spawn 50f", "Gravity .12"],
    bombChance: 0.15,
    spawnRateBase: 50,
    gravity: 0.12,
  },
  overdrive: {
    id: "overdrive",
    label: "Overdrive Siege",
    tagline: "High Threat",
    description:
      "Relentless fruit storms with aggressive bomb cadence. Built for tournament reflexes and fearless slicers.",
    metrics: ["Bombs 22%", "Spawn 35f", "Gravity .135"],
    bombChance: 0.22,
    spawnRateBase: 35,
    gravity: 0.135,
  },
};

type CyberSliceGameProps = {
  onBack?: () => void;
  cameraId?: string;
  cameraLabel?: string;
  onCameraError?: () => void;
};

const CyberSliceGame: React.FC<CyberSliceGameProps> = ({
  onBack,
  cameraLabel,
  cameraId,
  onCameraError,
}) => {
  const [appState, setAppState] = useState<AppState>(APP_STATE.SELECT);
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<CyberSliceDifficulty>("standard");
  const [currentScore, setCurrentScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lastGameStats, setLastGameStats] = useState<GameStats>({
    score: 0,
    highScore: 0,
    combo: 0,
    maxCombo: 0,
  });
  const [handPosition, setHandPosition] = useState<NormalizedPoint | null>(null);
  const [frameSrc, setFrameSrc] = useState<string | null>(null);
  const [trackingStatus, setTrackingStatus] = useState<
    "idle" | "connecting" | "tracking" | "lost"
  >("idle");
  const [cameraReady, setCameraReady] = useState(false);
  const [pendingDifficulty, setPendingDifficulty] =
    useState<CyberSliceDifficulty | null>(null);
  const [gameplayActive, setGameplayActive] = useState(false);
  const cameraErrorRef = useRef(onCameraError);
  const { x, y, frame, error } = useHandTracking(cameraId);

  useEffect(() => {
    cameraErrorRef.current = onCameraError;
  }, [onCameraError]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("cyberSlice_highScore");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const activateGame = (_difficulty: CyberSliceDifficulty) => {
    audioService.init();
    audioService.resume();
    audioService.playStart();
    audioService.playBGM();
    setCurrentScore(0);
    setHandPosition(null);
    setFrameSrc(null);
    setGameplayActive(true);
    setPendingDifficulty(null);
  };

  const queueGameStart = (difficulty: CyberSliceDifficulty) => {
    setSelectedDifficulty(difficulty);
    setPendingDifficulty(difficulty);
    setGameplayActive(false);
    setAppState(APP_STATE.PLAYING);
  };

  useEffect(() => {
    if (
      pendingDifficulty &&
      cameraReady &&
      appState === APP_STATE.PLAYING &&
      !gameplayActive
    ) {
      activateGame(pendingDifficulty);
    }
  }, [pendingDifficulty, cameraReady, appState, gameplayActive]);

  const handleGameOver = (score: number, maxCombo: number) => {
    audioService.stopBGM();
    setGameplayActive(false);
    setPendingDifficulty(null);
    if (score > highScore) {
      setHighScore(score);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("cyberSlice_highScore", score.toString());
      }
    }
    setLastGameStats({
      score,
      highScore: Math.max(score, highScore),
      combo: 0,
      maxCombo,
    });
    setAppState(APP_STATE.GAME_OVER);
  };

  const handleUpdateScore = (score: number) => {
    setCurrentScore(score);
  };

  const handleReturnToMenu = () => {
    audioService.stopBGM();
    setAppState(APP_STATE.SELECT);
    setCurrentScore(0);
    setHandPosition(null);
    setTrackingStatus("idle");
    setGameplayActive(false);
    setPendingDifficulty(null);
    setCameraReady(false);
  };

  const handleExitToArcade = () => {
    handleReturnToMenu();
    onBack?.();
  };

  const handleRestart = () => {
    queueGameStart(selectedDifficulty);
  };

  const orderedDifficulties = DIFFICULTY_ORDER.map(
    (id) => DIFFICULTY_CONFIGS[id]
  );
  const activeDifficulty = DIFFICULTY_CONFIGS[selectedDifficulty];
  const trackingVisual = {
    idle: {
      label: "IDLE",
      dot: "bg-slate-700",
    },
    connecting: {
      label: "CONNECTING",
      dot: "bg-amber-300 animate-pulse",
    },
    tracking: {
      label: "LOCKED",
      dot: "bg-brand-green animate-pulse",
    },
    lost: {
      label: "SIGNAL LOST",
      dot: "bg-red-500 animate-pulse",
    },
  } as const;
  const trackingDisplay = trackingVisual[trackingStatus];

  useEffect(() => {
    if (appState !== APP_STATE.PLAYING) {
      setHandPosition(null);
      setTrackingStatus("idle");
      setCameraReady(false);
      setFrameSrc(null);
      return;
    }
    setTrackingStatus("connecting");
    setCameraReady(false);
  }, [appState]);

  useEffect(() => {
    if (appState !== APP_STATE.PLAYING) return;
    if (typeof x === "number" && typeof y === "number") {
      setHandPosition({ x, y });
      setTrackingStatus("tracking");
    }
  }, [x, y, appState]);

  useEffect(() => {
    if (appState !== APP_STATE.PLAYING) return;
    setFrameSrc(frame ?? null);
    if (frame) {
      setCameraReady(true);
    } else if (!error) {
      setCameraReady(false);
      setHandPosition(null);
      setTrackingStatus("connecting");
    }
  }, [frame, appState, error]);

  useEffect(() => {
    if (!error || appState !== APP_STATE.PLAYING) return;
    setTrackingStatus("lost");
    setCameraReady(false);
    setHandPosition(null);
    cameraErrorRef.current?.();
  }, [error, appState]);

  const runEnabled = gameplayActive && cameraReady;
  const waitingForCamera =
    appState === APP_STATE.PLAYING && (!cameraReady || pendingDifficulty);

  return (
    <main className="w-full h-screen bg-black overflow-hidden relative font-sans">
      {appState === APP_STATE.SELECT && (
        <IntroView
          difficulties={orderedDifficulties}
          selectedDifficulty={selectedDifficulty}
          onSelectDifficulty={queueGameStart}
          onBack={onBack ? handleExitToArcade : undefined}
          cameraLabel={cameraLabel}
        />
      )}

      {appState === APP_STATE.PLAYING && (
        <div className="relative w-full h-full">
          <div className="absolute top-0 left-0 w-full p-4 sm:p-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between z-10 pointer-events-none">
            <div className="flex flex-col gap-1 text-white">
              <span className="text-slate-500 font-mono text-[10px] sm:text-xs tracking-widest uppercase">
                Current Score
              </span>
              <span className="text-4xl sm:text-5xl font-black drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                {currentScore}
              </span>
            </div>
            <div className="flex flex-col lg:items-end gap-2 sm:gap-3 text-right">
              <div className="flex flex-col lg:items-end gap-1 text-white">
                <span className="text-slate-500 font-mono text-[10px] sm:text-xs tracking-widest uppercase">
                  Best
                </span>
                <span className="text-xl sm:text-2xl font-bold text-brand-green">
                  {highScore}
                </span>
                <span className="text-[8px] sm:text-xs font-mono tracking-[0.4em] text-slate-500 uppercase">
                  {activeDifficulty.label} · {cameraLabel ?? "Default Sensor"}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 pointer-events-auto">
                <div className="flex items-center gap-2 border border-white/20 bg-black/40 px-2 py-1 sm:px-3 sm:py-2">
                  <span
                    className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${trackingDisplay.dot}`}
                  />
                  <span className="text-[8px] sm:text-[10px] font-mono tracking-[0.3em] uppercase text-slate-300">
                    {trackingDisplay.label}
                  </span>
                </div>
                {frameSrc && (
                  <div className="hidden sm:block border border-white/20 bg-black/30">
                    <img
                      src={frameSrc}
                      alt="Camera feed"
                      className="w-24 h-16 sm:w-32 sm:h-20 object-cover opacity-70"
                    />
                  </div>
                )}
                {!cameraReady && (
                  <div className="text-[8px] sm:text-[10px] font-mono tracking-[0.3em] uppercase text-amber-300">
                    Waiting for camera feed...
                  </div>
                )}
                <button
                  onClick={handleReturnToMenu}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 border border-white/20 text-[8px] sm:text-xs font-mono tracking-[0.3em] uppercase bg-black/40 text-white hover:border-brand-green hover:text-brand-green transition-colors"
                >
                  Change Difficulty
                </button>
                {onBack && (
                  <button
                    onClick={handleExitToArcade}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 border border-white/20 text-[8px] sm:text-xs font-mono tracking-[0.3em] uppercase bg-white/10 text-white hover:bg-white hover:text-black transition-colors"
                  >
                    Exit to Arcade
                  </button>
                )}
              </div>
            </div>
          </div>

          <div
            className="absolute inset-0 z-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)`,
              backgroundSize: "50px 50px",
            }}
          />

          {waitingForCamera && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm text-center text-xs font-mono tracking-[0.3em] text-white uppercase pointer-events-none">
              Waiting for camera feed...
            </div>
          )}

          <GameCanvas
            onGameOver={handleGameOver}
            updateScore={handleUpdateScore}
            difficulty={activeDifficulty}
            handPosition={handPosition}
            isActive={runEnabled}
          />
        </div>
      )}

      {appState === APP_STATE.GAME_OVER && (
        <GameOverView
          score={lastGameStats.score}
          highScore={lastGameStats.highScore}
          maxCombo={lastGameStats.maxCombo}
          difficultyLabel={activeDifficulty.label}
          onRestart={handleRestart}
          onMenu={handleReturnToMenu}
          onExit={onBack ? handleExitToArcade : undefined}
        />
      )}
    </main>
  );
};

export default CyberSliceGame;
