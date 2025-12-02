import React, { useState } from "react";
import type { CameraOption, PlayableGameId, GameCardData } from "../types";
import { DEFAULT_CAMERA_ID } from "../services/camera";

type DashboardProps = {
  onLaunchGame: (id: PlayableGameId) => void;
  cameraOptions: CameraOption[];
  selectedCamera: string;
  selectedCameraLabel: string;
  onSelectCamera: (id: string) => void;
  onMonkeyMeme?: () => void;
};

const games: GameCardData[] = [
  {
    id: "surfer",
    title: "Dino Surfer",
    subtitle: "Expedition",
    description:
      "Subway Surfers style hand gestures based game. Lean left and right to steer through safe lanes, collect data-coins, and survive the endless slide.",
    actions: ["Balance", "Flow", "Survival"],
    accentColor: "orange",
  },
  {
    id: "flappy",
    title: "Cyber Flappy",
    subtitle: "Hybrid Gauntlet",
    description:
      "Phase-shift between runner lanes and neon pipe mazes. Raise your hand to jump, flap, and transmit through the datastream.",
    actions: ["Dual Modes", "Reflex", "Endurance"],
    accentColor: "green",
  }, {
    id: "cyberslice",
    title: "Cyber Slice",
    subtitle: "Arcade Reflex",
    description:
      "Fruit ninja style game for slicing fruit  while dodging explosives. Chain slices to power up your combo meter and survive the onslaught.",
    actions: ["Precision", "Combos", "Control"],
    accentColor: "pink",
  },
  {
    id: "pong",
    title: "Neon Pong",
    subtitle: "Arena Sport",
    description:
      "Enter the cyber-arena. Control the paddle with precise hand tracking. Deflect the energy sphere and dominate the high-score leaderboard.",
    actions: ["Precision", "Tactics", "Classic"],
    accentColor: "blue",
  }


];

const GameDashboard: React.FC<DashboardProps> = ({
  onLaunchGame,
  cameraOptions,
  selectedCamera,
  selectedCameraLabel,
  onSelectCamera,
  onMonkeyMeme,
}) => {
  const [activeGameId, setActiveGameId] = useState<PlayableGameId>("surfer");

  const activeGame = games.find((g) => g.id === activeGameId) || games[0];

  // Dynamic styles based on active game
  const getThemeStyles = (color: string) => {
    switch (color) {
      case "green":
        return {
          bg: "from-brand-green/20",
          text: "text-brand-green",
          border: "border-brand-green",
          glow: "shadow-[0_0_40px_rgba(16,185,129,0.3)]",
          btn: "bg-brand-green text-black hover:bg-white",
          gradient: "bg-gradient-to-r from-brand-green to-emerald-600",
        };
      case "blue":
        return {
          bg: "from-brand-blue/20",
          text: "text-brand-blue",
          border: "border-brand-blue",
          glow: "shadow-[0_0_40px_rgba(59,130,246,0.3)]",
          btn: "bg-brand-blue text-white hover:bg-white hover:text-brand-blue",
          gradient: "bg-gradient-to-r from-brand-blue to-indigo-600",
        };
      case "orange":
        return {
          bg: "from-brand-orange/20",
          text: "text-brand-orange",
          border: "border-brand-orange",
          glow: "shadow-[0_0_40px_rgba(249,115,22,0.3)]",
          btn: "bg-brand-orange text-white hover:bg-white hover:text-brand-orange",
          gradient: "bg-gradient-to-r from-brand-orange to-red-600",
        };
      case "pink":
        return {
          bg: "from-pink-500/20",
          text: "text-pink-400",
          border: "border-pink-500/60",
          glow: "shadow-[0_0_40px_rgba(236,72,153,0.3)]",
          btn: "bg-pink-500 text-white hover:bg-white hover:text-pink-500",
          gradient: "bg-gradient-to-r from-pink-500 to-rose-600",
        };
      default:
        return {
          bg: "",
          text: "",
          border: "",
          glow: "",
          btn: "",
          gradient: "",
        };
    }
  };

  const theme = getThemeStyles(activeGame.accentColor);

  return (
    <div className="relative h-[100dvh] w-full bg-[#0B0C15] overflow-hidden text-slate-200 font-sans selection:bg-white/20 flex flex-col">
      {/* Dynamic Background Glow */}
      <div
        className={`absolute -top-[50%] -right-[20%] w-[80vw] h-[80vw] rounded-full bg-gradient-to-b ${theme.bg} to-transparent blur-[120px] transition-all duration-700 opacity-40 pointer-events-none`}
      />

      {/* Background Grid */}
      <div
        className="absolute inset-0 z-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
          maskImage:
            "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)",
        }}
      />

      {/* Top Bar / HUD */}
      <header className="relative z-20 flex flex-col md:flex-row justify-between items-center p-4 md:p-6 md:px-12 border-b border-white/5 bg-black/20 backdrop-blur-sm gap-4">
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="font-mono text-[10px] md:text-xs tracking-[0.2em] text-slate-400">
            GESTURE ARCADE // CONNECTED
          </span>
        </div>

        {/* Tech Pill Camera Selector */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          <div className="hidden md:flex flex-col items-start text-[10px] font-mono uppercase tracking-widest text-slate-500">
            <span>Input Source</span>
            <span className="text-slate-300">
              {selectedCameraLabel?.toUpperCase()}
            </span>
          </div>
          <div className="relative group w-full md:w-auto">
            <select
              value={selectedCamera}
              onChange={(e) => onSelectCamera(e.target.value)}
              className="appearance-none w-full md:w-auto bg-slate-900/80 border border-slate-700 text-slate-300 text-xs font-mono py-2 pl-4 pr-10 rounded-sm focus:outline-none focus:border-white transition-colors cursor-pointer"
            >
              {cameraOptions.length === 0 && (
                <option value={DEFAULT_CAMERA_ID}>
                  DEFAULT OPTICAL SENSOR
                </option>
              )}
              {cameraOptions.map((cam) => (
                <option key={cam.id} value={cam.id}>
                  {cam.label.toUpperCase()}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-slate-500" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* LEFT: Game Navigation (Sidebar) */}
        <aside className="w-full md:w-1/4 min-w-[280px] h-auto max-h-[20vh] md:max-h-none md:h-full border-b md:border-b-0 md:border-r border-white/5 bg-black/20 backdrop-blur-md flex flex-col p-2 md:p-6 gap-2 overflow-y-auto">
          <div className="text-[10px] font-mono text-slate-500 mb-1 md:mb-4 tracking-widest uppercase sticky top-0 bg-[#0B0C15]/80 backdrop-blur-sm py-1 z-10">
            Select Mission
          </div>
          <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-1 md:pb-0 snap-x">
            {games.map((game) => {
              const isActive = game.id === activeGameId;
              return (
                <button
                  key={game.id}
                  onClick={() => setActiveGameId(game.id)}
                  className={`group relative min-w-[200px] md:min-w-0 w-full text-left p-4 md:p-6 transition-all duration-300 snap-center rounded-sm border border-transparent ${isActive
                    ? "bg-white/5 md:translate-x-2 border-white/10"
                    : "hover:bg-white/5 hover:translate-x-1"
                    }`}
                >
                  {isActive && (
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 ${theme.gradient}`}
                    />
                  )}
                  <div className="relative z-10">
                    <h3
                      className={`font-bold text-base md:text-lg uppercase tracking-wider transition-colors ${isActive
                        ? "text-white"
                        : "text-slate-500 group-hover:text-slate-300"
                        }`}
                    >
                      {game.title}
                    </h3>
                    <p className="text-[8px] md:text-[10px] font-mono text-slate-600 mt-1 uppercase tracking-widest truncate">
                      {game.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* RIGHT: Game Preview (Hero) */}
        <section className="flex-1 relative flex flex-col justify-start md:justify-end p-4 md:p-16 lg:p-24 overflow-y-auto md:overflow-hidden pb-24 md:pb-16">
          {/* Large Background Title (Decorative) */}
          <h1 className="absolute top-10 left-10 text-[15vw] font-black text-white/5 pointer-events-none leading-none select-none">
            {activeGame.id}
          </h1>

          {/* Content Container */}
          <div className="relative z-10 max-w-3xl space-y-8">
            {/* Header Group */}
            <div className="space-y-2">
              <div
                className={`inline-block px-3 py-1 border ${theme.border} ${theme.text} text-[10px] font-mono uppercase tracking-widest bg-black/40 backdrop-blur-md`}
              >
                Ready to Launch
              </div>
              <h2 className="text-2xl md:text-6xl lg:text-8xl font-black text-white tracking-tighter uppercase drop-shadow-2xl">
                {activeGame.title}
              </h2>
            </div>

            {/* Stats / Tags */}
            <div className="flex gap-4">
              {activeGame.actions.map((tag, i) => (
                <span
                  key={i}
                  className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-white/5 px-4 py-2 rounded-sm border-l-2 border-slate-700"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Description */}
            <p className="text-xs md:text-lg md:text-xl text-slate-300 font-light leading-relaxed max-w-xl border-l border-white/10 pl-3 md:pl-6">
              {activeGame.description}
            </p>

            {/* Launch Button */}
            <div className="pt-4 md:pt-8 sticky bottom-0 bg-gradient-to-t from-[#0B0C15] via-[#0B0C15]/80 to-transparent pb-4 md:pb-0 z-20">
              <button
                onClick={() => onLaunchGame(activeGame.id)}
                className={`group relative w-full md:w-auto px-6 py-4 md:px-10 md:py-5 ${theme.btn} font-bold text-base md:text-lg tracking-[0.2em] uppercase transition-all duration-300 clip-path-polygon hover:scale-105 active:scale-95 ${theme.glow}`}
                style={{
                  clipPath:
                    "polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)",
                }}
              >
                <span className="flex items-center justify-center gap-3">
                  Initiating Launch
                  <svg
                    className="w-5 h-5 transition-transform group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </span>
              </button>
            </div>
          </div>

          {/* Decorative HUD Elements */}
          <div className="absolute right-12 bottom-12 flex flex-col items-end gap-2 text-[10px] font-mono text-slate-600">
            <div className="w-32 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full w-2/3 ${theme.gradient} animate-pulse`} />
            </div>
            <span>SYS_LOAD: 34%</span>
            {onMonkeyMeme && (
              <button
                onClick={onMonkeyMeme}
                className="text-[8px] opacity-20 hover:opacity-100 transition-opacity cursor-default hover:cursor-pointer"
                title="???"
              >
                🍌
              </button>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default GameDashboard;
