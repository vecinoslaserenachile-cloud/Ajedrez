import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { Clock, Timer } from 'lucide-react';

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const Timers = () => {
  const [realTime, setRealTime] = useState(new Date());
  const [whiteTime, setWhiteTime] = useState(600); // 10 minutes
  const [blackTime, setBlackTime] = useState(600);

  useEffect(() => {
    const interval = setInterval(() => {
      setRealTime(new Date());
      
      const game = useGameStore.getState().game;
      // Tick the timer as long as the game isn't over
      if (!game.isGameOver()) {
        if (game.turn() === 'w') {
          setWhiteTime(t => Math.max(0, t - 1));
        } else {
          setBlackTime(t => Math.max(0, t - 1));
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Reset timers when game is reset
  useEffect(() => {
    const unsubscribe = useGameStore.subscribe((state) => {
      if (state.game.history().length === 0) {
        setWhiteTime(600);
        setBlackTime(600);
      }
    });
    return unsubscribe;
  }, []);

  const { game, gameTick } = useGameStore();
  const isWhiteTurn = game.turn() === 'w' && !game.isGameOver();
  const isBlackTurn = game.turn() === 'b' && !game.isGameOver();

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-3 pointer-events-none z-50">
      {/* Real Time Clock */}
      <div className="bg-slate-900/40 backdrop-blur-xl px-4 py-2 rounded-full shadow-2xl border border-white/10 flex items-center gap-2 pointer-events-auto h-fit transition-all duration-500 hover:bg-slate-900/60">
        <Clock className="text-blue-400" size={14} />
        <p className="text-sm font-mono font-bold text-white tracking-wider">
          {realTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {/* Chess Timers */}
      <div className="bg-slate-900/40 backdrop-blur-xl px-4 py-2 rounded-full shadow-2xl border border-white/10 pointer-events-auto flex items-center gap-3 h-fit transition-all duration-500 hover:bg-slate-900/60">
        <div className={`px-2.5 py-1 rounded-md border transition-all flex items-center gap-2 ${isWhiteTurn ? 'border-amber-500/50 bg-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'border-white/5 bg-white/5'}`}>
          <div className="w-2.5 h-2.5 rounded-full bg-slate-100 shadow-sm"></div>
          <p className={`text-sm font-mono font-bold tracking-wider ${whiteTime < 60 ? 'text-red-400' : 'text-white'}`}>
            {formatTime(whiteTime)}
          </p>
        </div>

        <Timer className="text-slate-400" size={14} />

        <div className={`px-2.5 py-1 rounded-md border transition-all flex items-center gap-2 ${isBlackTurn ? 'border-amber-500/50 bg-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'border-white/5 bg-white/5'}`}>
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700 shadow-sm"></div>
          <p className={`text-sm font-mono font-bold tracking-wider ${blackTime < 60 ? 'text-red-400' : 'text-white'}`}>
            {formatTime(blackTime)}
          </p>
        </div>
      </div>
    </div>
  );
};
