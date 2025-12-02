
import React from "react";

type IntroViewProps = {
  onEnter: () => void;
  onBack?: () => void;
  cameraLabel?: string;
};

const IntroView: React.FC<IntroViewProps> = ({ onEnter, onBack, cameraLabel }) => {
  return (
    <div className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-[#050505] text-white selection:bg-brand-green selection:text-black">
      {/* Cinematic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#050505] to-[#000000] z-0" />

      {/* CRT Scanline Effect */}
      <div
        className="absolute inset-0 z-10 opacity-10 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))]"
        style={{ backgroundSize: "100% 2px, 6px 100%" }}
      />

      {/* Decorative Grid */}
      <div
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
          backgroundSize: "100px 100px",
        }}
      />

      {/* Main Content */}
      <div className="relative z-20 flex flex-col items-center gap-12 max-w-5xl mx-auto px-6 w-full">
        {/* Title Group */}
        <div className="text-center space-y-6 relative">
          {onBack && (
            <button
              onClick={onBack}
              className="absolute left-0 -top-10 text-[10px] tracking-[0.4em] font-mono uppercase text-slate-400 hover:text-white transition"
            >
              ← BACK TO ARCADE
            </button>
          )}
          <div className="inline-flex items-center gap-3 px-4 py-1.5 border border-white/10 rounded-full bg-white/5 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
            <span className="text-xs font-mono tracking-[0.3em] text-slate-300">
              SYSTEM ONLINE
            </span>
          </div>

          <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-600 drop-shadow-2xl">
            CYBER
            <br />
            <span className="text-brand-green drop-shadow-[0_0_30px_rgba(16,185,129,0.4)]">
              FLAPPY
            </span>
          </h1>

          <p className="max-w-md mx-auto text-slate-400 font-mono text-sm md:text-base leading-relaxed tracking-wide">
            <span className="text-brand-green text-xs mt-2 block tracking-[0.2em]">
              RAISE HAND TO FLY
            </span>
            <br />
            <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
              INPUT: {cameraLabel?.toUpperCase() ?? "DEFAULT SENSOR"}
            </span>
          </p>
        </div>

        {/* Start Button */}
        <div className="mt-8">
          <button
            onClick={onEnter}
            className="group relative px-12 py-6 bg-transparent overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
          >
            {/* Button Background Shape */}
            <div className="absolute inset-0 bg-white/10 skew-x-[-12deg] border border-white/20 transition-all duration-300 group-hover:bg-brand-green group-hover:border-brand-green" />

            {/* Glitch Effect Layers */}
            <div className="absolute inset-0 bg-brand-green/20 skew-x-[-12deg] translate-x-2 translate-y-2 opacity-0 group-hover:opacity-100 transition-all duration-100" />

            <span className="relative z-10 font-black text-xl tracking-[0.2em] group-hover:text-black transition-colors duration-300 flex items-center gap-4">
              START RUN
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M13 5l7 7-7 7M5 5l7 7-7 7"
                />
              </svg>
            </span>
          </button>
          <p className="mt-6 text-center text-[10px] text-slate-600 font-mono tracking-widest animate-pulse">
            CLICK TO START // KEYBOARD SUPPORTED
          </p>
        </div>
      </div>

      {/* Footer System Info */}
      {/* Footer System Info Removed */}
    </div>
  );
};

export default IntroView;
