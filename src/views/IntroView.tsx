import React from "react";

type IntroViewProps = {
  onEnter: () => void;
};

const IntroView: React.FC<IntroViewProps> = ({ onEnter }) => {
  return (
    <div className="relative h-[100dvh] w-full flex flex-col items-center justify-start md:justify-center overflow-y-auto overflow-x-hidden bg-[#050505] text-white selection:bg-brand-green selection:text-black pt-10 pb-20 md:py-0">
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
      <div className="relative z-20 flex flex-col items-center gap-4 md:gap-12 max-w-5xl mx-auto px-6 py-6 md:py-12 w-full">
        {/* Title Group */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 border border-white/10 rounded-full bg-white/5 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
            <span className="text-xs font-mono tracking-[0.3em] text-slate-300">
              SYSTEM ONLINE
            </span>
          </div>

          <h1 className="text-4xl md:text-7xl lg:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-600 drop-shadow-2xl leading-none">
            GESTURE
            <br />
            <span className="text-brand-green drop-shadow-[0_0_30px_rgba(16,185,129,0.4)]">
              ARCADE
            </span>
          </h1>

          <p className="max-w-md mx-auto text-slate-400 font-mono text-sm md:text-base leading-relaxed tracking-wide">
            COMPUTER VISION CSC447 FINAL PROJECT
            <br />
            <span className="opacity-50">
              NO CONTROLLER DETECTED // HANDS REQUIRED
            </span>
          </p>
        </div>

        {/* Start Button */}
        <div className="mt-8">
          <button
            onClick={onEnter}
            className="group relative px-8 py-4 md:px-12 md:py-6 bg-transparent overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95"
          >
            {/* Button Background Shape */}
            <div className="absolute inset-0 bg-white/10 skew-x-[-12deg] border border-white/20 transition-all duration-300 group-hover:bg-brand-green group-hover:border-brand-green" />

            {/* Glitch Effect Layers */}
            <div className="absolute inset-0 bg-brand-green/20 skew-x-[-12deg] translate-x-2 translate-y-2 opacity-0 group-hover:opacity-100 transition-all duration-100" />

            <span className="relative z-10 font-black text-xl tracking-[0.2em] group-hover:text-black transition-colors duration-300 flex items-center gap-4">
              INITIALIZE SYSTEM
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </span>
          </button>
          <p className="mt-6 text-center text-[10px] text-slate-600 font-mono tracking-widest animate-pulse">
            PRESS BUTTON TO START
          </p>
        </div>
      </div>

      {/* Footer System Info */}
      <div className="absolute bottom-0 w-full p-4 md:p-8 flex flex-col md:flex-row justify-between items-center md:items-end text-[8px] md:text-[10px] font-mono text-slate-600 uppercase tracking-widest pointer-events-none z-20 gap-2">
        <div className="text-center md:text-left">
          ID: GESTURE-8842
          <br className="hidden md:block" />
          <span className="md:hidden"> // </span>
          LOC: BROWSER
        </div>
        <div className="text-center md:text-right">
          PWR: STABLE
          <br className="hidden md:block" />
          <span className="md:hidden"> // </span>
          NET: CONNECTED
        </div>
      </div>
    </div>
  );
};

export default IntroView;
