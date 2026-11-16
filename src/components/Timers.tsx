import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { Clock } from 'lucide-react';

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const Timers = () => {
  const [realTime, setRealTime] = useState(new Date());
  const [whiteTime, setWhiteTime] = useState(600);
  const [blackTime, setBlackTime] = useState(600);

  useEffect(() => {
    const interval = setInterval(() => {
      setRealTime(new Date());

      const game = useGameStore.getState().game;
      if (!game.isGameOver()) {
        if (game.turn() === 'w') {
          setWhiteTime((t) => Math.max(0, t - 1));
        } else {
          setBlackTime((t) => Math.max(0, t - 1));
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

  const { game } = useGameStore();
  const isGameOver = game.isGameOver();
  const isWhiteTurn = game.turn() === 'w' && !isGameOver;
  const isBlackTurn = game.turn() === 'b' && !isGameOver;
  const isCheck = game.inCheck() && !isGameOver;

  return (
    <header className="absolute top-0 left-0 right-0 z-40 pt-safe px-3 sm:px-6 pointer-events-none">
      <div className="max-w-5xl mx-auto h-12 sm:h-14 flex items-center justify-between gap-2 px-3 sm:px-5 rounded-b-2xl sm:rounded-2xl sm:mt-3 bg-slate-950/88 border border-white/10 shadow-xl pointer-events-auto">
        {/* Left: Brand + Turn state */}
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="font-display font-bold text-sm sm:text-base text-white tracking-tight whitespace-nowrap shrink-0">
            <span className="sm:hidden">Ajedrez VLS</span>
            <span className="hidden sm:inline">Ajedrez Patrimonial</span>
          </span>
          <span className="hidden md:inline text-slate-600" aria-hidden="true">·</span>
          <span className="hidden md:inline text-xs text-slate-400 whitespace-nowrap shrink-0">
            Vecinos La Serena
          </span>
          <span className="text-slate-600" aria-hidden="true">·</span>
          <span
            className={`text-xs font-medium whitespace-nowrap truncate ${
              isCheck
                ? 'text-amber-300'
                : isGameOver
                  ? 'text-red-300'
                  : isWhiteTurn
                    ? 'text-slate-200'
                    : 'text-sky-300'
            }`}
          >
            {isGameOver
              ? 'Fin'
              : isCheck
                ? 'Jaque'
                : isWhiteTurn
                  ? 'Tu turno'
                  : 'Pensando...'}
          </span>
        </div>

        {/* Right: Timers + Desktop Clock */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-300 font-mono-nums pr-2 border-r border-white/10">
            <Clock size={13} className="text-sky-400" />
            <span>
              {realTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {/* White Clock */}
          <div
            className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg border text-xs sm:text-sm font-mono-nums font-bold transition-colors ${
              isWhiteTurn
                ? 'border-amber-400/60 bg-amber-500/20 text-amber-100'
                : 'border-white/10 bg-white/5 text-slate-300'
            }`}
            aria-label={`Tiempo blancas ${formatTime(whiteTime)}`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-50 border border-amber-300 shrink-0" />
            <span className={whiteTime < 60 ? 'text-red-400' : ''}>
              {formatTime(whiteTime)}
            </span>
          </div>

          {/* Black Clock */}
          <div
            className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg border text-xs sm:text-sm font-mono-nums font-bold transition-colors ${
              isBlackTurn
                ? 'border-sky-400/60 bg-sky-500/20 text-sky-100'
                : 'border-white/10 bg-white/5 text-slate-300'
            }`}
            aria-label={`Tiempo negras ${formatTime(blackTime)}`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-500 shrink-0" />
            <span className={blackTime < 60 ? 'text-red-400' : ''}>
              {formatTime(blackTime)}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
