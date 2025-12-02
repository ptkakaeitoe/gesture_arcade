import React, { useState, useEffect, useRef } from 'react';
import GameRenderer from './components/GameRenderer';
import { GameState, GameDifficulty, Lane } from './types';
import { audioManager } from './audio';
import { useHandTracking } from '../hooks/useHandTracking';

const IconRefresh = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 12"></path><path d="M3 3v9h9"></path></svg>
);
const IconTrophy = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>
);
const IconHeart = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>
);
const IconVolume = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
);
const IconMute = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
);

const LANE_LEFT_THRESHOLD = 0.33;
const LANE_RIGHT_THRESHOLD = 0.66;
const JUMP_TRIGGER_THRESHOLD = 0.60; // Easier to trigger (was 0.55)
const JUMP_RESET_THRESHOLD = 0.65; // Easier to reset (was 0.70)

const GameOverOverlay: React.FC<{
  score: number;
  highScore: number;
  onRestart: () => void;
  onMenu: () => void;
}> = ({ score, highScore, onRestart, onMenu }) => {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (countdown === 0) {
      onRestart();
    }
  }, [countdown, onRestart]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-lg p-6">
      <div className="max-w-2xl w-full text-center space-y-12 animate-in fade-in zoom-in duration-500">
        <div className="space-y-4">
          <div className="inline-block px-4 py-1 border border-red-500/30 bg-red-500/10 text-red-500 text-[10px] font-mono uppercase tracking-widest rounded-sm">
            System Failure
          </div>
          <h2 className="text-4xl md:text-9xl font-black text-white tracking-tighter uppercase drop-shadow-[0_0_30px_rgba(220,38,38,0.5)]">
            CRASHED
          </h2>
        </div>

        <div className="flex justify-center gap-8">
          <div className="flex flex-col items-center p-6 bg-white/5 border border-white/10 w-48 skew-x-[-6deg]">
            <span className="text-slate-500 text-xs font-mono uppercase tracking-widest mb-2">Final Score</span>
            <span className="text-5xl font-black text-brand-orange">{Math.floor(score)}</span>
          </div>
          <div className="flex flex-col items-center p-6 bg-white/5 border border-white/10 w-48 skew-x-[-6deg]">
            <span className="text-slate-500 text-xs font-mono uppercase tracking-widest mb-2 flex items-center gap-2">
              <IconTrophy /> Best
            </span>
            <span className="text-5xl font-black text-white">{highScore}</span>
          </div>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-md mx-auto">
          <button
            onClick={onRestart}
            className={`group relative w-full py-5 bg-transparent overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95`}
          >
            <div className={`absolute inset-0 bg-white/10 skew-x-[-12deg] border border-white/20 transition-all duration-300 group-hover:bg-brand-orange group-hover:border-brand-orange`} />
            <div
              className="absolute bottom-0 left-0 h-1 bg-brand-orange transition-all duration-1000 ease-linear z-20"
              style={{ width: `${(countdown / 3) * 100}%` }}
            />
            <span className="relative z-10 font-black text-xl tracking-[0.2em] group-hover:text-black transition-colors duration-300 flex items-center justify-center gap-4 uppercase">
              <IconRefresh />
              REBOOT SYSTEM ({countdown})
            </span>
          </button>

          <button
            onClick={onMenu}
            className="text-xs font-mono text-slate-500 hover:text-white transition-colors py-4 uppercase tracking-widest"
          >
            [ Return to Main Menu ]
          </button>
        </div>
      </div>
    </div>
  );
};

type DinoSurferGameProps = {
  onBack?: () => void;
  cameraId?: string;
  cameraLabel?: string;
};

const DinoSurferGame: React.FC<DinoSurferGameProps> = ({ onBack, cameraId, cameraLabel }) => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(1);
  const [highScore, setHighScore] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(500); // Default 400
  const [gameDifficulty, setGameDifficulty] = useState<GameDifficulty>(GameDifficulty.MEDIUM);
  const [isMuted, setIsMuted] = useState(false);
  const [frameSrc, setFrameSrc] = useState<string | null>(null);
  const [trackingStatus, setTrackingStatus] = useState<'connecting' | 'tracking' | 'error'>('connecting');
  const [gestureLane, setGestureLane] = useState<Lane | null>(null);
  const [gestureJumpToggle, setGestureJumpToggle] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [pendingDifficulty, setPendingDifficulty] = useState<GameDifficulty | null>(null);
  const [waitingForCamera, setWaitingForCamera] = useState(false);

  const lastGestureLaneRef = useRef<Lane | null>(null);
  const jumpReadyRef = useRef(true);
  const { x, y, frame, error } = useHandTracking(cameraId);

  useEffect(() => {
    const saved = localStorage.getItem('dino-surfer-highscore');
    if (saved) setHighScore(parseInt(saved, 10));

    // Optimize zoom for mobile
    if (window.innerWidth < 768) {
      setZoomLevel(300);
    }
  }, []);

  useEffect(() => {
    setTrackingStatus('connecting');
    setFrameSrc(null);
    setCameraReady(false);
    setGestureLane(null);
    lastGestureLaneRef.current = null;
    jumpReadyRef.current = true;
  }, [cameraId]);

  useEffect(() => {
    if (typeof x === 'number') {
      const lane = x < LANE_LEFT_THRESHOLD
        ? Lane.LEFT
        : x > LANE_RIGHT_THRESHOLD
          ? Lane.RIGHT
          : Lane.CENTER;
      if (lane !== lastGestureLaneRef.current) {
        lastGestureLaneRef.current = lane;
        setGestureLane(lane);
      }
      setTrackingStatus('tracking');
    }
  }, [x]);

  useEffect(() => {
    if (typeof y === 'number') {
      if (y < JUMP_TRIGGER_THRESHOLD && jumpReadyRef.current) {
        jumpReadyRef.current = false;
        setGestureJumpToggle((prev) => !prev);
      } else if (y > JUMP_RESET_THRESHOLD) {
        jumpReadyRef.current = true;
      }
    }
  }, [y]);

  useEffect(() => {
    setFrameSrc(frame ?? null);
    if (frame) {
      setCameraReady(true);
    } else {
      setCameraReady(false);
      if (!error) {
        setTrackingStatus('connecting');
      }
    }
  }, [frame, error]);

  useEffect(() => {
    if (!error) return;
    setTrackingStatus('error');
    setCameraReady(false);
  }, [error]);

  const handleGameOver = React.useCallback((finalScore: number) => {
    setGameState(GameState.GAME_OVER);
    setHighScore((prev) => {
      if (finalScore > prev) {
        localStorage.setItem('dino-surfer-highscore', finalScore.toString());
        return finalScore;
      }
      return prev;
    });
  }, []);

  const startGameNow = React.useCallback((difficulty: GameDifficulty) => {
    audioManager.init(); // Unlock AudioContext on user gesture
    setGameDifficulty(difficulty);
    setScore(0);
    setGameState(GameState.PLAYING);
    setPendingDifficulty(null);
    setWaitingForCamera(false);
  }, []);

  const queueStartGame = (difficulty: GameDifficulty) => {
    if (cameraReady) {
      startGameNow(difficulty);
    } else {
      setPendingDifficulty(difficulty);
      setWaitingForCamera(true);
    }
  };

  useEffect(() => {
    if (pendingDifficulty && cameraReady) {
      startGameNow(pendingDifficulty);
    }
  }, [pendingDifficulty, cameraReady]);

  const toggleMute = () => {
    const muted = audioManager.toggleMute();
    setIsMuted(muted);
  };

  const cameraDisplayLabel = cameraLabel ?? 'Default Camera';
  const gestureStatusText = trackingStatus === 'tracking'
    ? 'TRACKING ACTIVE'
    : trackingStatus === 'error'
      ? 'SIGNAL LOST'
      : 'CONNECTING...';
  const gestureStatusClass = trackingStatus === 'tracking'
    ? 'text-brand-green'
    : trackingStatus === 'error'
      ? 'text-red-500'
      : 'text-brand-orange';

  // Theme constants
  const theme = {
    bg: "from-brand-orange/20",
    text: "text-brand-orange",
    border: "border-brand-orange",
    glow: "shadow-[0_0_40px_rgba(249,115,22,0.3)]",
    btn: "bg-brand-orange text-white hover:bg-white hover:text-brand-orange",
    gradient: "bg-gradient-to-r from-brand-orange to-red-600",
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0B0C15] font-sans text-slate-200 select-none selection:bg-brand-orange/30">
      {/* Dynamic Background Glow */}
      <div
        className={`absolute -top-[50%] -right-[20%] w-[80vw] h-[80vw] rounded-full bg-gradient-to-b ${theme.bg} to-transparent blur-[120px] transition-all duration-700 opacity-40 pointer-events-none`}
      />

      {/* Background Grid */}
      <div
        className="absolute inset-0 z-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
          maskImage:
            "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)",
        }}
      />

      {onBack && (
        <button
          onClick={onBack}
          className="absolute left-6 top-6 z-30 group flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-sm text-xs font-mono uppercase tracking-widest hover:bg-white/10 transition-all"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> BACK TO DASHBOARD
        </button>
      )}

      {/* Game Canvas Layer */}
      <div className="absolute inset-0 z-0">
        <GameRenderer
          gameState={gameState}
          gameDifficulty={gameDifficulty}
          onGameOver={handleGameOver}
          onScoreUpdate={setScore}
          onLivesUpdate={setLives}
          zoomLevel={zoomLevel}
          gestureLane={gestureLane}
          gestureJumpToggle={gestureJumpToggle}
        />
      </div>

      {/* Visual Overlay (Vignette) */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.6)_100%)] z-0"></div>

      {/* HUD Layer */}
      {gameState === GameState.PLAYING && (
        <>
          <div className="absolute top-0 left-0 right-0 p-4 md:p-8 flex justify-between items-start z-10 pointer-events-none">
            <div className="flex flex-col gap-1 md:gap-2">
              <div className="flex items-center gap-2 md:gap-3">
                <span className="text-[8px] md:text-[10px] font-mono uppercase tracking-widest text-slate-500">Current Score</span>
              </div>
              <div className={`text-3xl md:text-5xl font-black tracking-tighter ${theme.text} drop-shadow-2xl`}>
                {Math.floor(score).toString().padStart(6, '0')}
              </div>

              <div className="flex items-center gap-2 mt-1">
                {/* Lives Display */}
                <div className="flex space-x-1 text-red-500 drop-shadow-md">
                  {[...Array(lives)].map((_, i) => (
                    <div key={i} className="animate-in fade-in zoom-in duration-300 scale-75 md:scale-100 origin-left">
                      <IconHeart />
                    </div>
                  ))}
                  {lives === 0 && <span className="text-red-500 font-mono font-bold text-[10px] md:text-xs tracking-widest animate-pulse">CRITICAL FAILURE</span>}
                </div>
              </div>
            </div>

            {highScore > 0 && (
              <div className="flex flex-col gap-1 text-right">
                <span className="text-[8px] md:text-[10px] font-mono uppercase tracking-widest text-slate-500">High Score</span>
                <div className="text-xl md:text-2xl font-black text-white/80">{highScore}</div>
              </div>
            )}
          </div>

          {/* Controls Container (Top Right) */}
          <div className="absolute top-4 right-4 md:top-6 md:right-6 z-20 flex flex-col gap-3 items-end">
            {/* Mute Button */}
            <button
              onClick={toggleMute}
              className="bg-black/40 hover:bg-white/10 backdrop-blur-md p-2 md:p-3 border border-white/10 text-white transition-colors clip-path-polygon scale-90 md:scale-100 origin-top-right"
              style={{ clipPath: "polygon(20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%, 0 20%)" }}
            >
              {isMuted ? <IconMute /> : <IconVolume />}
            </button>

            {/* Zoom Control - Hidden on mobile to save space, or could be made smaller */}
            <div className="hidden md:block w-48 bg-black/40 backdrop-blur-md p-4 border border-white/10 shadow-lg clip-path-polygon"
              style={{ clipPath: "polygon(10% 0, 100% 0, 100% 90%, 90% 100%, 0 100%, 0 10%)" }}>
              <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-2 block">Camera Zoom</label>
              <input
                type="range"
                min="200"
                max="1000"
                value={zoomLevel}
                onChange={(e) => setZoomLevel(Number(e.target.value))}
                className="w-full accent-brand-orange h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-2 uppercase tracking-wider">
                <span>Wide</span>
                <span>Close</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Touch Hints */}
      {gameState === GameState.PLAYING && (
        <div className="absolute bottom-24 md:bottom-32 left-0 right-0 text-center opacity-40 pointer-events-none z-10 px-4">
          <p className="text-[10px] md:text-xs font-mono uppercase tracking-widest text-white animate-pulse">
            <span className="md:hidden">Swipe Left/Right to Steer • Tap/Swipe Up to Jump</span>
            <span className="hidden md:inline">Move hand left/right to steer • Raise hand to jump</span>
          </p>
        </div>
      )}

      {/* Menu Overlay */}
      {gameState === GameState.MENU && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm p-6">
          <div className="max-w-4xl w-full flex flex-col items-center gap-12 animate-in fade-in zoom-in duration-500">

            {/* Title Group */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-3 px-4 py-1.5 border border-white/10 rounded-full bg-white/5 backdrop-blur-sm mb-4">
                <span className={`w-2 h-2 rounded-full bg-brand-orange animate-pulse ${theme.glow}`} />
                <span className="text-xs font-mono tracking-[0.3em] text-slate-300">
                  SYSTEM ONLINE
                </span>
              </div>
              <h1 className="text-5xl md:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-600 drop-shadow-2xl">
                DINO
                <br />
                <span className={`${theme.text} drop-shadow-[0_0_30px_rgba(249,115,22,0.4)]`}>
                  SURFER
                </span>
              </h1>
              <p className="max-w-md mx-auto text-slate-400 font-mono text-sm md:text-base leading-relaxed tracking-wide">
                EXPEDITION PROTOCOL // 3D INFINITE RUNNER
              </p>
            </div>

            {/* Difficulty Selection */}
            <div className="flex flex-col md:flex-row gap-6 w-full justify-center items-center">
              {[
                { diff: GameDifficulty.EASY, label: "EASY", lives: 3, color: "text-emerald-400", border: "hover:border-emerald-500" },
                { diff: GameDifficulty.MEDIUM, label: "MEDIUM", lives: 2, color: "text-brand-orange", border: "hover:border-brand-orange" },
                { diff: GameDifficulty.HARD, label: "HARD", lives: 1, color: "text-red-500", border: "hover:border-red-500" }
              ].map((mode) => (
                <button
                  key={mode.diff}
                  onClick={() => queueStartGame(mode.diff)}
                  className={`group relative w-full md:w-64 h-24 bg-transparent overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95`}
                >
                  {/* Button Background Shape */}
                  <div className={`absolute inset-0 bg-white/5 skew-x-[-12deg] border border-white/10 transition-all duration-300 group-hover:bg-white/10 ${mode.border}`} />

                  <div className="relative z-10 flex flex-col items-center justify-center h-full gap-1">
                    <span className={`font-black text-2xl tracking-[0.1em] ${mode.color} transition-colors duration-300 flex items-center gap-2`}>
                      {mode.label}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 tracking-widest uppercase">
                      {mode.lives} LIVES // AUTO-REVIVE
                    </span>
                  </div>
                </button>
              ))}
            </div>
            {waitingForCamera && !cameraReady && (
              <p className="text-xs font-mono tracking-[0.3em] text-amber-300 uppercase">
                Waiting for camera feed...
              </p>
            )}

            {/* Instructions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl mt-8">
              {[
                { key: "← / →", action: "STEER" },
                { key: "SPACE", action: "JUMP" },
                { key: "HAND L/R", action: "STEER" },
                { key: "HAND UP", action: "JUMP" },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center p-4 bg-white/5 border border-white/5 rounded-sm backdrop-blur-sm">
                  <span className="text-xs font-mono text-slate-500 mb-1">INPUT</span>
                  <span className="font-bold text-white tracking-wider">{item.key}</span>
                  <span className="text-[10px] font-mono text-brand-orange mt-1 tracking-widest">{item.action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Game Over Overlay */}
      {gameState === GameState.GAME_OVER && (
        <GameOverOverlay
          score={score}
          highScore={highScore}
          onRestart={() => queueStartGame(gameDifficulty)}
          onMenu={() => setGameState(GameState.MENU)}
        />
      )}

      {/* Gesture + Camera Overlay (Tech Frame Style) */}
      <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 z-30 max-w-[150px] md:max-w-sm transition-all duration-300">
        <div className="relative p-1 bg-black/60 backdrop-blur-md border border-white/10 clip-path-polygon"
          style={{ clipPath: "polygon(10% 0, 100% 0, 100% 90%, 90% 100%, 0 100%, 0 10%)" }}>

          {/* Decorative Corner Accents */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/50" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/50" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/50" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/50" />

          <div className="flex flex-col gap-2 md:gap-3 p-2 md:p-3 sm:flex-row sm:items-center">
            <div className="relative h-16 w-24 md:h-20 md:w-32 overflow-hidden bg-black/80 border border-white/10">
              {frameSrc ? (
                <img
                  src={frameSrc}
                  alt="Live webcam preview"
                  className="h-full w-full object-cover opacity-80"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[8px] md:text-[10px] font-mono uppercase tracking-widest text-white/20">
                  {trackingStatus === 'error' ? 'NO SIGNAL' : 'STANDBY'}
                </div>
              )}
              {/* Scanline overlay on camera */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] opacity-50 pointer-events-none" style={{ backgroundSize: "100% 2px, 3px 100%" }} />
            </div>

            <div className="space-y-0.5 md:space-y-1 hidden sm:block">
              <p className="text-[8px] md:text-[10px] font-mono uppercase tracking-widest text-slate-500">
                INPUT: {cameraDisplayLabel.toUpperCase()}
              </p>
              <p className={`text-[8px] md:text-[10px] font-bold font-mono uppercase tracking-widest ${gestureStatusClass}`}>
                STATUS: {gestureStatusText}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DinoSurferGame;
