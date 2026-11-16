import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import { ChessBoard } from './components/ChessBoard';
import { useGameStore, PIECE_NAMES_ES } from './store/gameStore';
import {
  Info,
  RotateCcw,
  CloudFog,
  Volume2,
  VolumeX,
  Zap,
  ZapOff,
  Eye,
  Lock,
  Unlock,
  SlidersHorizontal,
  X,
  Sun,
  Moon,
  Compass,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { HyperEnvironment } from './components/HyperEnvironment';
import { Timers } from './components/Timers';
import { ResponsiveCamera } from './components/ResponsiveCamera';
import { ErrorBoundary } from './components/ErrorBoundary';

type ActiveSheet = 'none' | 'pieces' | 'settings';

const PIECE_LORE = [
  {
    key: 'k',
    title: 'Faro Monumental (Rey)',
    desc: 'Símbolo icónico de La Serena, construido entre 1950 y 1951. Representa la luz y guía de la ciudad.',
  },
  {
    key: 'q',
    title: 'Catedral (Reina)',
    desc: 'La Catedral de La Serena, construida en el siglo XIX, es el templo religioso más importante y un hito arquitectónico.',
  },
  {
    key: 'n',
    title: 'Moai (Caballo)',
    desc: 'Representa la conexión cultural y el Moai que se encuentra en el Museo Arqueológico de La Serena, traído desde Rapa Nui.',
  },
  {
    key: 'b',
    title: 'Campanario (Alfil)',
    desc: 'La Serena es conocida como la "Ciudad de los Campanarios" por sus numerosas iglesias de piedra caliza.',
  },
  {
    key: 'r',
    title: 'Fuerte (Torre)',
    desc: 'Representa las antiguas fortificaciones y la defensa de la bahía contra piratas en la época colonial.',
  },
  {
    key: 'p',
    title: 'Jarro Pato (Peón)',
    desc: 'Cerámica típica de la cultura Diaguita, pueblo originario que habitó los valles de la región de Coquimbo.',
  },
];

export default function App() {
  const {
    game,
    resetGame,
    historyPiece,
    selectedSquare,
    possibleMoves,
    clearSelection,
    makeComputerMove,
    gameTick,
    isAssistedMode,
    setAssistedMode,
    isSoundEnabled,
    setSoundEnabled,
    cameraPreset,
    setCameraPreset,
    isCameraLocked,
    setCameraLocked,
    triggerCameraReset,
  } = useGameStore();

  const isGameOver = game.isGameOver();
  const isCheck = game.inCheck() && !isGameOver;
  const [isFoggy, setIsFoggy] = useState(false);
  const [isManualNight, setIsManualNight] = useState<boolean | null>(null);
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>('none');
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [webglLost, setWebglLost] = useState(false);

  const hours = new Date().getHours();
  const isNightTime = hours < 6 || hours > 19;
  const isNight = isManualNight !== null ? isManualNight : isNightTime;

  useEffect(() => {
    if (game.turn() === 'b' && !isGameOver) {
      const timer = setTimeout(() => {
        makeComputerMove();
      }, 550);
      return () => clearTimeout(timer);
    }
  }, [gameTick, isGameOver, makeComputerMove]);

  useEffect(() => {
    if (isGameOver && isSoundEnabled) {
      const audio = new Audio(
        'https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/game-end.mp3'
      );
      audio.play().catch(() => {});
    }
  }, [isGameOver, isSoundEnabled]);

  const handleCanvasCreated = useCallback(
    ({ gl }: { gl: { domElement: HTMLCanvasElement } }) => {
      const canvas = gl.domElement;
      canvas.addEventListener(
        'webglcontextlost',
        (e) => {
          e.preventDefault();
          setWebglLost(true);
        },
        false
      );
      canvas.addEventListener(
        'webglcontextrestored',
        () => {
          setWebglLost(false);
        },
        false
      );
    },
    []
  );

  const selectedPiece = selectedSquare ? game.get(selectedSquare) : null;
  const selectedPieceLabel = selectedPiece
    ? PIECE_NAMES_ES[selectedPiece.type] || 'Pieza'
    : null;

  const gameOverLabel = game.isCheckmate()
    ? game.turn() === 'w'
      ? 'Jaque Mate · Ganan las Negras'
      : 'Jaque Mate · ¡Ganaste!'
    : 'Partida en Tablas (Empate)';

  return (
    <div className="w-full h-dvh bg-slate-950 relative overflow-hidden select-none touch-none">
      {/* 3D Scene */}
      <ErrorBoundary>
        {webglLost ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-950 text-white">
            <h2 className="font-display text-xl font-bold mb-2">
              Vista 3D pausada por el navegador
            </h2>
            <p className="text-sm text-slate-300 mb-5 max-w-xs">
              Tu dispositivo liberó memoria gráfica. Recarga para continuar jugando.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="min-h-[44px] px-6 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-semibold text-sm"
            >
              Recargar partida
            </button>
          </div>
        ) : (
          <Canvas
            shadows
            dpr={[1, 2]}
            camera={{ position: [0, 14, 11], fov: 50 }}
            onCreated={handleCanvasCreated}
            style={{ width: '100%', height: '100%', touchAction: 'none' }}
          >
            <color attach="background" args={['#050a0f']} />
            {isFoggy && <fog attach="fog" args={['#a0b0c0', 6, 28]} />}

            <ambientLight intensity={isFoggy ? 0.8 : isNight ? 0.45 : 0.65} />
            <pointLight
              position={[0, 3, 0]}
              intensity={isNight ? 0.85 : 0.25}
              color={isNight ? '#aaccff' : '#ffffff'}
            />

            <Suspense fallback={null}>
              <HyperEnvironment isFoggy={isFoggy} isNightOverride={isNight} />
            </Suspense>

            <Suspense
              fallback={
                <mesh>
                  <boxGeometry args={[1, 1, 1]} />
                  <meshStandardMaterial
                    color="#d4af37"
                    emissive="#d4af37"
                    emissiveIntensity={0.3}
                  />
                </mesh>
              }
            >
              <ChessBoard />
            </Suspense>

            <ContactShadows
              position={[0, -0.5, 0]}
              opacity={0.35}
              scale={18}
              blur={2}
              far={4}
            />
            <ResponsiveCamera />
          </Canvas>
        )}
      </ErrorBoundary>

      {/* Top Bar: Brand, Turn Status & Timers */}
      <Timers />

      {/* Contextual Action / Selection Strip above Bottom Dock */}
      {!isDockCollapsed && (
        <div className="absolute bottom-[74px] sm:bottom-[88px] left-0 right-0 z-30 px-3 pointer-events-none flex justify-center">
          {isGameOver ? (
            <div className="pointer-events-auto flex items-center justify-between gap-3 w-full max-w-md px-4 py-2.5 rounded-2xl bg-red-950/92 border border-red-400/40 shadow-2xl">
              <div className="min-w-0">
                <p className="font-display font-bold text-sm text-white truncate">
                  ¡Juego Terminado!
                </p>
                <p className="text-xs text-red-200 truncate">{gameOverLabel}</p>
              </div>
              <button
                onClick={resetGame}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-white text-slate-950 font-semibold text-xs whitespace-nowrap shrink-0 active:scale-[0.98] transition-transform"
              >
                Jugar de nuevo
              </button>
            </div>
          ) : selectedSquare && selectedPieceLabel ? (
            <div className="pointer-events-auto flex items-center justify-between gap-3 w-full max-w-md px-3.5 py-1.5 rounded-xl bg-slate-950/88 border border-amber-400/35 shadow-xl">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-amber-200 truncate">
                  {selectedPieceLabel} · {selectedSquare.toUpperCase()}
                </p>
                <p className="text-[11px] text-slate-300 truncate">
                  {possibleMoves.length > 0
                    ? `${possibleMoves.length} jugadas disponibles · Toca una casilla`
                    : 'Sin jugadas legales para esta pieza'}
                </p>
              </div>
              <button
                onClick={clearSelection}
                className="min-h-[44px] min-w-[44px] px-3 rounded-lg text-xs font-medium text-slate-200 bg-white/10 active:bg-white/20 whitespace-nowrap shrink-0"
              >
                Cancelar
              </button>
            </div>
          ) : isCheck ? (
            <div className="pointer-events-auto px-4 py-2 rounded-xl bg-amber-950/90 border border-amber-400/40 text-xs font-semibold text-amber-200 shadow-lg">
              ¡Jaque! Protege al Faro Monumental
            </div>
          ) : null}
        </div>
      )}

      {/* Bottom Thumb-Zone Control Dock */}
      <nav
        aria-label="Controles de partida"
        className={`fixed bottom-0 left-0 right-0 z-40 px-2 sm:px-4 pb-safe pointer-events-none transition-transform duration-200 ${
          isDockCollapsed ? 'translate-y-[calc(100%-36px)]' : 'translate-y-0'
        }`}
      >
        <div className="max-w-xl mx-auto flex flex-col items-center">
          {/* Desktop collapse handle */}
          <button
            onClick={() => setIsDockCollapsed((v) => !v)}
            className="hidden sm:flex pointer-events-auto items-center gap-1 px-3 py-1 mb-1 rounded-t-lg bg-slate-950/88 border border-b-0 border-white/10 text-[11px] text-slate-300 hover:text-white"
            aria-label={isDockCollapsed ? 'Mostrar controles' : 'Ocultar controles'}
          >
            {isDockCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>{isDockCollapsed ? 'Controles' : 'Ocultar'}</span>
          </button>

          <div className="pointer-events-auto w-full grid grid-cols-6 gap-1 p-1.5 rounded-2xl sm:mb-3 bg-slate-950/92 border border-white/12 shadow-2xl">
            {/* 1. Camera Preset (3D / Cenital) */}
            <button
              onClick={() =>
                setCameraPreset(cameraPreset === '3d' ? 'top' : '3d')
              }
              className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 transition-colors active:scale-[0.97] ${
                cameraPreset === 'top'
                  ? 'bg-sky-500/25 text-sky-200 border border-sky-400/40'
                  : 'text-slate-200 hover:bg-white/10 border border-transparent'
              }`}
              aria-label="Cambiar ángulo de cámara entre 3D y vista cenital"
            >
              <Eye size={18} />
              <span className="text-[10px] font-medium leading-none whitespace-nowrap">
                {cameraPreset === 'top' ? 'Cenital' : 'Vista 3D'}
              </span>
            </button>

            {/* 2. Camera Lock */}
            <button
              onClick={() => setCameraLocked(!isCameraLocked)}
              className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 transition-colors active:scale-[0.97] ${
                isCameraLocked
                  ? 'bg-amber-500/25 text-amber-200 border border-amber-400/40'
                  : 'text-slate-200 hover:bg-white/10 border border-transparent'
              }`}
              aria-label={isCameraLocked ? 'Desbloquear cámara' : 'Fijar cámara'}
            >
              {isCameraLocked ? <Lock size={18} /> : <Unlock size={18} />}
              <span className="text-[10px] font-medium leading-none whitespace-nowrap">
                {isCameraLocked ? 'Fija' : 'Rotar'}
              </span>
            </button>

            {/* 3. Assisted Mode */}
            <button
              onClick={() => setAssistedMode(!isAssistedMode)}
              className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 transition-colors active:scale-[0.97] ${
                isAssistedMode
                  ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/40'
                  : 'text-slate-200 hover:bg-white/10 border border-transparent'
              }`}
              aria-label={
                isAssistedMode
                  ? 'Desactivar modo asistido'
                  : 'Activar modo asistido'
              }
            >
              {isAssistedMode ? <Zap size={18} /> : <ZapOff size={18} />}
              <span className="text-[10px] font-medium leading-none whitespace-nowrap">
                Asistente
              </span>
            </button>

            {/* 4. Sound */}
            <button
              onClick={() => setSoundEnabled(!isSoundEnabled)}
              className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 transition-colors active:scale-[0.97] ${
                isSoundEnabled
                  ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/35'
                  : 'text-slate-400 hover:bg-white/10 border border-transparent'
              }`}
              aria-label={isSoundEnabled ? 'Silenciar sonido' : 'Activar sonido'}
            >
              {isSoundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              <span className="text-[10px] font-medium leading-none whitespace-nowrap">
                Sonido
              </span>
            </button>

            {/* 5. Pieces Heritage Sheet */}
            <button
              onClick={() =>
                setActiveSheet(activeSheet === 'pieces' ? 'none' : 'pieces')
              }
              className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 transition-colors active:scale-[0.97] ${
                activeSheet === 'pieces'
                  ? 'bg-blue-500/25 text-blue-200 border border-blue-400/40'
                  : 'text-slate-200 hover:bg-white/10 border border-transparent'
              }`}
              aria-label="Ver guía de piezas patrimoniales"
            >
              <Info size={18} />
              <span className="text-[10px] font-medium leading-none whitespace-nowrap">
                Piezas
              </span>
            </button>

            {/* 6. More / Settings Sheet */}
            <button
              onClick={() =>
                setActiveSheet(activeSheet === 'settings' ? 'none' : 'settings')
              }
              className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 transition-colors active:scale-[0.97] ${
                activeSheet === 'settings'
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'text-slate-200 hover:bg-white/10 border border-transparent'
              }`}
              aria-label="Abrir ajustes y reiniciar partida"
            >
              <SlidersHorizontal size={18} />
              <span className="text-[10px] font-medium leading-none whitespace-nowrap">
                Opciones
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Slide-Up Bottom Sheet for Heritage Pieces & Settings */}
      {activeSheet !== 'none' && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
          onClick={() => setActiveSheet('none')}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={
              activeSheet === 'pieces'
                ? 'Piezas de La Serena'
                : 'Opciones de partida'
            }
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md max-h-[78dvh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-slate-900 border-t sm:border border-white/15 shadow-2xl pb-safe overflow-hidden"
          >
            {/* Drag Handle Affordance */}
            <div className="pt-3 pb-1 flex justify-center sm:hidden">
              <span className="w-10 h-1.5 rounded-full bg-slate-700" />
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
              <h2 className="font-display font-bold text-base text-white">
                {activeSheet === 'pieces'
                  ? 'Piezas Patrimoniales de La Serena'
                  : 'Opciones de Partida'}
              </h2>
              <button
                onClick={() => setActiveSheet('none')}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-300 hover:bg-white/10"
                aria-label="Cerrar panel"
              >
                <X size={20} />
              </button>
            </div>

            {activeSheet === 'pieces' ? (
              <div className="p-4 overflow-y-auto space-y-2.5">
                {PIECE_LORE.map((item) => {
                  const isHighlighted = historyPiece === item.key;
                  return (
                    <div
                      key={item.key}
                      className={`p-3.5 rounded-2xl border transition-colors ${
                        isHighlighted
                          ? 'bg-sky-950/60 border-sky-400/50'
                          : 'bg-slate-950/60 border-white/10'
                      }`}
                    >
                      <h3 className="font-display font-semibold text-sm text-white mb-1">
                        {item.title}
                      </h3>
                      <p className="text-xs leading-relaxed text-slate-300">
                        {item.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 overflow-y-auto space-y-2.5">
                <button
                  onClick={() => {
                    triggerCameraReset();
                    setActiveSheet('none');
                  }}
                  className="w-full min-h-[48px] flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-950/70 border border-white/10 text-left active:bg-white/10"
                >
                  <span className="flex items-center gap-3 text-sm font-medium text-white">
                    <Compass size={18} className="text-sky-400" />
                    Centrar cámara en el tablero
                  </span>
                  <span className="text-xs text-slate-400">Ajustar</span>
                </button>

                <button
                  onClick={() => setIsFoggy(!isFoggy)}
                  className="w-full min-h-[48px] flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-950/70 border border-white/10 text-left active:bg-white/10"
                >
                  <span className="flex items-center gap-3 text-sm font-medium text-white">
                    <CloudFog size={18} className="text-blue-400" />
                    Camanchaca (Neblina costera)
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      isFoggy ? 'text-sky-300' : 'text-slate-400'
                    }`}
                  >
                    {isFoggy ? 'Activa' : 'Desactivada'}
                  </span>
                </button>

                <button
                  onClick={() => setIsManualNight(!isNight)}
                  className="w-full min-h-[48px] flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-950/70 border border-white/10 text-left active:bg-white/10"
                >
                  <span className="flex items-center gap-3 text-sm font-medium text-white">
                    {isNight ? (
                      <Moon size={18} className="text-indigo-300" />
                    ) : (
                      <Sun size={18} className="text-amber-300" />
                    )}
                    Iluminación del entorno
                  </span>
                  <span className="text-xs font-semibold text-slate-300">
                    {isNight ? 'Noche' : 'Día'}
                  </span>
                </button>

                <div className="pt-2 border-t border-white/10">
                  <button
                    onClick={() => {
                      resetGame();
                      setActiveSheet('none');
                    }}
                    className="w-full min-h-[48px] flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-red-600/90 hover:bg-red-600 text-white font-semibold text-sm active:scale-[0.99] transition-transform"
                  >
                    <RotateCcw size={18} />
                    Reiniciar partida
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
