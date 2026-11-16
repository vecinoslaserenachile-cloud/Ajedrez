import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import { ChessBoard } from './components/ChessBoard';
import { useGameStore } from './store/gameStore';
import { Info, RotateCcw, CloudFog, Volume2, VolumeX, Zap, ZapOff } from 'lucide-react';
import { HyperEnvironment } from './components/HyperEnvironment';
import { Timers } from './components/Timers';

import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  const { game, resetGame, historyPiece, makeComputerMove, isInteracting, gameTick, isAssistedMode, setAssistedMode, isSoundEnabled, setSoundEnabled } = useGameStore();
  const isGameOver = game.isGameOver();
  const [isFoggy, setIsFoggy] = useState(false);
  const [isManualNight, setIsManualNight] = useState<boolean | null>(null);

  const hours = new Date().getHours();
  const isNightTime = hours < 6 || hours > 19;
  const isNight = isManualNight !== null ? isManualNight : isNightTime;

  useEffect(() => {
    if (game.turn() === 'b' && !isGameOver) {
      const timer = setTimeout(() => {
        makeComputerMove();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [gameTick, isGameOver, makeComputerMove]);

  useEffect(() => {
    if (isGameOver && isSoundEnabled) {
      const audio = new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/game-end.mp3');
      audio.play().catch(() => {});
    }
  }, [isGameOver, isSoundEnabled]);

  return (
    <div className="w-full h-screen bg-slate-950 relative overflow-hidden font-sans">
      {/* 3D Scene */}
      <ErrorBoundary>
        <Canvas 
          shadows 
          camera={{ position: [0, 6, 8], fov: 50 }}
          style={{ width: '100%', height: '100%' }}
        >
          <color attach="background" args={['#050a0f']} />
          {isFoggy && <fog attach="fog" args={['#a0b0c0', 5, 25]} />}
          
          {/* Core Lighting */}
          <ambientLight intensity={isFoggy ? 0.8 : (isNight ? 0.4 : 0.6)} />
          <pointLight position={[0, 2, 0]} intensity={isNight ? 0.8 : 0.2} color={isNight ? "#aaccff" : "#ffffff"} />
  
          <Suspense fallback={null}>
            <HyperEnvironment isFoggy={isFoggy} isNightOverride={isNight} />
          </Suspense>
          
          <Suspense fallback={
            <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
            </mesh>
          }>
            <ChessBoard />
          </Suspense>
  
          <ContactShadows position={[0, -0.5, 0]} opacity={0.4} scale={20} blur={2} far={4} />
          <OrbitControls 
            makeDefault 
            enabled={!isInteracting}
            minPolarAngle={0} 
            maxPolarAngle={Math.PI / 2 - 0.05}
            minDistance={4}
            maxDistance={20}
          />
        </Canvas>
      </ErrorBoundary>

      {/* Timers Panel */}
      <Timers />

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full p-6 pointer-events-none flex justify-between items-start z-40">
        <div className="bg-slate-900/40 backdrop-blur-xl p-5 rounded-2xl shadow-2xl pointer-events-auto border border-white/10 transition-all duration-500 hover:bg-slate-900/60">
          <h1 className="text-2xl font-bold text-white mb-1">Ajedrez Patrimonial</h1>
          <p className="text-sm text-slate-300 font-medium">Vecinos La Serena - VLS</p>
          
          <div className="mt-4 flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${game.turn() === 'w' ? 'bg-amber-100 border border-amber-400' : 'bg-amber-900 border border-amber-700'}`} />
            <span className="text-sm font-semibold text-slate-200">
              Turno: {game.turn() === 'w' ? 'Blancas' : 'Negras'}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-2 text-sm text-slate-300">
            <div className="w-3 h-3 rounded-full bg-[#00e5ff] border border-cyan-400 shadow-[0_0_8px_#00e5ff]" />
            <span>Mejor jugada sugerida</span>
          </div>

          {isGameOver && (
            <div className="mt-4 p-3 bg-red-900/50 text-red-100 border border-red-500/30 rounded-lg font-bold text-center">
              ¡Juego Terminado!
              {game.isCheckmate() && <div>Jaque Mate</div>}
              {game.isDraw() && <div>Empate</div>}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button 
              onClick={resetGame}
              className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/10 py-2 px-4 rounded-lg transition-all text-sm font-medium"
            >
              <RotateCcw size={16} />
              Reiniciar
            </button>
            <button 
              onClick={() => setAssistedMode(!isAssistedMode)}
              className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-all text-sm font-medium border ${
                isAssistedMode ? 'bg-cyan-500/30 text-cyan-100 border-cyan-400/30 hover:bg-cyan-500/50' : 'bg-white/10 text-white border-white/10 hover:bg-white/20'
              }`}
              title={isAssistedMode ? "Desactivar Modo Asistido" : "Activar Modo Asistido"}
            >
              {isAssistedMode ? <Zap size={16} /> : <ZapOff size={16} />}
            </button>
            <button 
              onClick={() => setSoundEnabled(!isSoundEnabled)}
              className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-all text-sm font-medium border ${
                isSoundEnabled ? 'bg-green-500/30 text-green-100 border-green-400/30 hover:bg-green-500/50' : 'bg-white/10 text-white border-white/10 hover:bg-white/20'
              }`}
              title={isSoundEnabled ? "Desactivar Sonido" : "Activar Sonido"}
            >
              {isSoundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button 
              onClick={() => setIsFoggy(!isFoggy)}
              className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-all text-sm font-medium border ${
                isFoggy ? 'bg-blue-500/30 text-blue-100 border-blue-400/30 hover:bg-blue-500/50' : 'bg-white/10 text-white border-white/10 hover:bg-white/20'
              }`}
              title="Activar Camanchaca"
            >
              <CloudFog size={16} />
            </button>
            <button 
              onClick={() => setIsManualNight(isNight ? false : true)}
              className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-all text-sm font-medium border ${
                isNight ? 'bg-indigo-500/30 text-indigo-100 border-indigo-400/30 hover:bg-indigo-500/50' : 'bg-amber-500/30 text-amber-100 border-amber-400/30 hover:bg-amber-500/50'
              }`}
              title={isNight ? "Cambiar a Día" : "Cambiar a Noche"}
            >
              {isNight ? "🌙" : "☀️"}
            </button>
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl p-5 rounded-2xl shadow-2xl pointer-events-auto max-w-xs border border-white/10 transition-all duration-500 hover:bg-slate-900/60">
          <div className="flex items-center gap-2 mb-3 text-white">
            <Info size={20} className="text-blue-400" />
            <h2 className="font-bold">Piezas de La Serena</h2>
          </div>

          {historyPiece ? (
            <div className="text-sm text-blue-100 bg-blue-900/30 p-3 rounded-lg border border-blue-500/30">
              {historyPiece === 'k' && (
                <>
                  <h3 className="font-bold text-blue-300 mb-1">Faro Monumental (Rey)</h3>
                  <p>Símbolo icónico de La Serena, construido entre 1950 y 1951. Representa la luz y guía de la ciudad.</p>
                </>
              )}
              {historyPiece === 'q' && (
                <>
                  <h3 className="font-bold text-blue-300 mb-1">Catedral (Reina)</h3>
                  <p>La Catedral de La Serena, construida en el siglo XIX, es el templo religioso más importante y un hito arquitectónico.</p>
                </>
              )}
              {historyPiece === 'n' && (
                <>
                  <h3 className="font-bold text-blue-300 mb-1">Moai (Caballo)</h3>
                  <p>Representa la conexión cultural y el Moai que se encuentra en el Museo Arqueológico de La Serena, traído desde Rapa Nui.</p>
                </>
              )}
              {historyPiece === 'b' && (
                <>
                  <h3 className="font-bold text-blue-300 mb-1">Campanario (Alfil)</h3>
                  <p>La Serena es conocida como la "Ciudad de los Campanarios" por sus numerosas iglesias de piedra caliza.</p>
                </>
              )}
              {historyPiece === 'r' && (
                <>
                  <h3 className="font-bold text-blue-300 mb-1">Fuerte (Torre)</h3>
                  <p>Representa las antiguas fortificaciones y la defensa de la bahía contra piratas en la época colonial.</p>
                </>
              )}
              {historyPiece === 'p' && (
                <>
                  <h3 className="font-bold text-blue-300 mb-1">Jarro Pato (Peón)</h3>
                  <p>Cerámica típica de la cultura Diaguita, pueblo originario que habitó los valles de la región de Coquimbo.</p>
                </>
              )}
            </div>
          ) : (
            <ul className="text-sm text-slate-300 space-y-2">
              <li><strong className="text-slate-200">Rey:</strong> Faro Monumental</li>
              <li><strong className="text-slate-200">Reina:</strong> Catedral</li>
              <li><strong className="text-slate-200">Caballo:</strong> Moai</li>
              <li><strong className="text-slate-200">Alfil:</strong> Campanario</li>
              <li><strong className="text-slate-200">Torre:</strong> Fuerte</li>
              <li><strong className="text-slate-200">Peón:</strong> Jarro Pato Diaguita</li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
