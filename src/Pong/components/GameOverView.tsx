import React, { useEffect, useState } from "react";

type GameOverViewProps = {
    score: number;
    misses: number;
    onRestart: () => void;
    onHome: () => void;
    onExit?: () => void;
};

const GameOverView: React.FC<GameOverViewProps> = ({
    score,
    misses,
    onRestart,
    onHome,
    onExit,
}) => {
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
                        <span className="text-slate-400 font-mono text-xs tracking-widest uppercase">Final Score</span>
                        <span className="text-4xl font-bold text-white">{score}</span>
                    </div>
                    <div className="flex flex-col items-center p-4 border border-white/5 bg-black/40">
                        <span className="text-slate-400 font-mono text-xs tracking-widest uppercase">Misses</span>
                        <span className="text-4xl font-bold text-amber-500">{misses}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col md:flex-row gap-4 justify-center pt-8">
                    <button onClick={onRestart} className="px-8 py-4 bg-white text-black font-bold font-mono tracking-widest hover:bg-cyan-500 transition-colors skew-x-[-12deg] relative overflow-hidden">
                        <span className="relative z-10">REBOOT SYSTEM ({countdown})</span>
                        <div
                            className="absolute bottom-0 left-0 h-1 bg-cyan-500 transition-all duration-1000 ease-linear"
                            style={{ width: `${(countdown / 3) * 100}%` }}
                        />
                    </button>
                    <button onClick={onHome} className="px-8 py-4 bg-transparent border border-white/20 text-white font-bold font-mono tracking-widest hover:bg-white/10 transition-colors skew-x-[-12deg]">
                        ABORT
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
