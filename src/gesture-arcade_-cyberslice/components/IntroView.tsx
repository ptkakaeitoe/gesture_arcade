import React from "react";
import type { CyberSliceDifficulty, DifficultyConfig } from "../types";

type IntroViewProps = {
  difficulties: DifficultyConfig[];
  selectedDifficulty: CyberSliceDifficulty;
  onSelectDifficulty: (difficulty: CyberSliceDifficulty) => void;
  onBack?: () => void;
  cameraLabel?: string;
};

const IntroView: React.FC<IntroViewProps> = ({
  difficulties,
  selectedDifficulty,
  onSelectDifficulty,
  onBack,
  cameraLabel,
}) => {
  return (
    <div className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-[#050505] text-white selection:bg-brand-green selection:text-black px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#050505] to-[#000000] z-0" />
      <div
        className="absolute inset-0 z-10 opacity-10 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))]"
        style={{ backgroundSize: "100% 2px, 6px 100%" }}
      />
      <div
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
          backgroundSize: "100px 100px",
        }}
      />

      <div className="relative z-20 flex flex-col gap-8 w-full max-w-5xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 border border-white/10 rounded-full bg-white/5 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
              <span className="text-xs font-mono tracking-[0.3em] text-slate-300">
                CYBERSLICE PROTOCOL
              </span>
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-600 drop-shadow-2xl">
              Select Difficulty
            </h1>
            <p className="text-slate-400 font-mono text-xs md:text-sm tracking-[0.2em] uppercase">
              Input source: {cameraLabel ?? "DEFAULT SENSOR"}
            </p>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="self-start md:self-center px-5 py-3 border border-white/20 text-xs font-mono tracking-[0.3em] uppercase hover:bg-white/10 transition-colors"
            >
              ← Back to Arcade
            </button>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {difficulties.map((difficulty) => {
            const isActive = difficulty.id === selectedDifficulty;
            return (
              <button
                key={difficulty.id}
                onClick={() => onSelectDifficulty(difficulty.id)}
                className={`relative flex flex-col gap-2 border px-6 py-8 text-left bg-white/5 backdrop-blur-sm transition-all duration-300 ${isActive
                    ? "border-brand-green shadow-[0_0_30px_rgba(16,185,129,0.2)] translate-y-[-4px]"
                    : "border-white/10 hover:border-white/40"
                  }`}
              >
                {isActive && (
                  <div className="absolute inset-0 border border-brand-green/30 pointer-events-none" />
                )}
                <p className="text-[10px] font-mono tracking-[0.4em] text-slate-400 uppercase">
                  {difficulty.tagline}
                </p>
                <h3 className="text-3xl font-black text-white">
                  {difficulty.label}
                </h3>

                <div className="text-[10px] font-mono text-slate-500 tracking-[0.3em] uppercase pt-4 mt-auto">
                  {isActive ? "Tap to Launch" : "Tap to Arm"}
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-center text-[10px] text-slate-500 font-mono tracking-widest">
          Swipe to slice fruit // Avoid explosives // Build combo multiplier
        </p>
      </div>
    </div>
  );
};

export default IntroView;
