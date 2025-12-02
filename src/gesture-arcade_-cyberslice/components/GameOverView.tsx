import React, { useEffect, useState } from "react";
import { getMissionDebrief } from "../services/geminiService";

type GameOverViewProps = {
  score: number;
  highScore: number;
  maxCombo: number;
  difficultyLabel: string;
  onRestart: () => void;
  onMenu: () => void;
  onExit?: () => void;
};

const GameOverView: React.FC<GameOverViewProps> = ({
  score,
  highScore,
  maxCombo,
  difficultyLabel,
  onRestart,
  onMenu,
  onExit,
}) => {
  const [debrief, setDebrief] = useState<string>("ESTABLISHING UPLINK...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchDebrief = async () => {
      const text = await getMissionDebrief(score, maxCombo);
      if (mounted) {
        setDebrief(text);
        setLoading(false);
      }
    };
    fetchDebrief();
    return () => { mounted = false; };
  }, [score, maxCombo]);

  return (
    <div className="relative h-screen w-full flex flex-col items-center justify-center bg-[#050505] text-white overflow-hidden">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-red-900/10 z-0 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-[#050505] to-[#000000] z-0" />

      {/* CRT Scanline */}
      <div
        className="absolute inset-0 z-10 opacity-10 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)]"
        style={{ backgroundSize: "100% 4px" }}
      />

      <div className="relative z-20 max-w-2xl w-full px-6 text-center space-y-8">
        
        <div className="space-y-2">
            <h2 className="text-red-500 font-mono tracking-[0.5em] text-sm animate-pulse">CONNECTION TERMINATED</h2>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]">
            GAME OVER
            </h1>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 border border-white/10 bg-white/5 p-6 rounded-lg backdrop-blur-md">
          <div className="flex flex-col items-center p-4 border border-white/5 bg-black/40">
            <span className="text-slate-400 font-mono text-xs tracking-widest uppercase">
              Final Score
            </span>
            <span className="text-4xl font-bold text-white">{score}</span>
          </div>
          <div className="flex flex-col items-center p-4 border border-white/5 bg-black/40">
            <span className="text-slate-400 font-mono text-xs tracking-widest uppercase">
              High Score
            </span>
            <span className="text-4xl font-bold text-brand-green">
              {highScore}
            </span>
          </div>
          <div className="col-span-2 flex flex-col items-center p-4 border border-white/5 bg-black/40 gap-1">
            <span className="text-slate-400 font-mono text-xs tracking-widest uppercase">
              Difficulty
            </span>
            <span className="text-lg font-semibold text-white tracking-widest">
              {difficultyLabel}
            </span>
          </div>
          <div className="col-span-2 flex flex-col items-center p-2 border-t border-white/5">
            <span className="text-slate-500 font-mono text-[10px] uppercase">
              Max Combo: {maxCombo}
            </span>
          </div>
        </div>

        {/* AI Debrief */}
        <div className="min-h-[100px] bg-black/80 border-l-2 border-brand-green p-6 text-left relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-50">
                <svg className="w-4 h-4 text-brand-green animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
            <h3 className="text-brand-green font-mono text-xs mb-2 flex items-center gap-2">
                <span>AI COMMANDER DEBRIEF</span>
                {loading && <span className="animate-blink">_</span>}
            </h3>
            <p className="text-slate-300 font-mono text-sm leading-relaxed typing-effect">
                {debrief}
            </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col md:flex-row gap-4 justify-center pt-8">
          <button
            onClick={onRestart}
            className="px-8 py-4 bg-white text-black font-bold font-mono tracking-widest hover:bg-brand-green transition-colors skew-x-[-12deg]"
          >
            REBOOT SYSTEM
          </button>
          <button
            onClick={onMenu}
            className="px-8 py-4 bg-transparent border border-white/20 text-white font-bold font-mono tracking-widest hover:bg-white/10 transition-colors skew-x-[-12deg]"
          >
            CHANGE DIFFICULTY
          </button>
        </div>
        {onExit && (
          <button
            onClick={onExit}
            className="px-8 py-4 bg-transparent border border-white/10 text-white font-bold font-mono tracking-widest hover:bg-white/5 transition-colors skew-x-[-12deg]"
          >
            EXIT TO ARCADE
          </button>
        )}

      </div>
    </div>
  );
};

export default GameOverView;
