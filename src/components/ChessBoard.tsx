import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Chess, Square } from 'chess.js';
import { Faro, Catedral, Moai, JarroPato, Campanario, Fuerte, Rey } from './pieces/Pieces';
import { useGameStore } from '../store/gameStore';
import * as THREE from 'three';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'];

const TAP_THRESHOLD_PX = 14;

// Shared pointer start tracker so dragging to orbit never triggers an accidental move tap
const pointerStart = { x: 0, y: 0, id: -1 };

const handlePointerDownTap = (e: ThreeEvent<PointerEvent>) => {
  e.stopPropagation();
  pointerStart.x = e.clientX;
  pointerStart.y = e.clientY;
  pointerStart.id = e.pointerId;
};

const isCleanTap = (e: ThreeEvent<PointerEvent>): boolean => {
  if (pointerStart.id !== e.pointerId) return false;
  const dist = Math.hypot(e.clientX - pointerStart.x, e.clientY - pointerStart.y);
  return dist < TAP_THRESHOLD_PX;
};

const getPieceComponent = (type: string) => {
  switch (type) {
    case 'k': return Rey;
    case 'q': return Catedral;
    case 'n': return Moai;
    case 'p': return JarroPato;
    case 'b': return Campanario;
    case 'r': return Fuerte;
    default: return Rey;
  }
};

type VisualPiece = {
  id: string;
  type: string;
  color: 'w' | 'b';
  square: Square;
  captured: boolean;
};

const getInitialPieces = (): VisualPiece[] => {
  const pieces: VisualPiece[] = [];
  const setup = [
    { rank: '1', color: 'w', pieces: ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'] },
    { rank: '2', color: 'w', pieces: ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'] },
    { rank: '7', color: 'b', pieces: ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'] },
    { rank: '8', color: 'b', pieces: ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'] },
  ];

  setup.forEach((row) => {
    row.pieces.forEach((type, fileIndex) => {
      const square = `${FILES[fileIndex]}${row.rank}` as Square;
      pieces.push({
        id: `${row.color}_${type}_${square}`,
        type,
        color: row.color as 'w' | 'b',
        square,
        captured: false,
      });
    });
  });
  return pieces;
};

const getVisualPieces = (game: Chess): VisualPiece[] => {
  const pieces = getInitialPieces();
  const history = game.history({ verbose: true });

  for (const move of history) {
    const movingPiece = pieces.find((p) => p.square === move.from && !p.captured);
    if (movingPiece) {
      movingPiece.square = move.to;
      if (move.promotion) movingPiece.type = move.promotion;
    }

    if (move.captured) {
      let capSquare = move.to;
      if (move.flags.includes('e')) {
        capSquare = (move.to[0] + move.from[1]) as Square;
      }
      const capturedPiece = pieces.find(
        (p) => p.square === capSquare && p.color !== move.color && !p.captured
      );
      if (capturedPiece) capturedPiece.captured = true;
    }

    if (move.flags.includes('k') || move.flags.includes('q')) {
      let rookFrom: Square, rookTo: Square;
      if (move.flags.includes('k')) {
        rookFrom = (move.color === 'w' ? 'h1' : 'h8') as Square;
        rookTo = (move.color === 'w' ? 'f1' : 'f8') as Square;
      } else {
        rookFrom = (move.color === 'w' ? 'a1' : 'a8') as Square;
        rookTo = (move.color === 'w' ? 'd1' : 'd8') as Square;
      }
      const rook = pieces.find((p) => p.square === rookFrom && !p.captured);
      if (rook) rook.square = rookTo;
    }
  }

  return pieces;
};

const getPosFromSquare = (square: Square): [number, number, number] => {
  const fileIndex = FILES.indexOf(square[0]);
  const rankIndex = RANKS.indexOf(square[1]);
  return [fileIndex, 0, 7 - rankIndex];
};

interface AnimatedPieceProps {
  piece: VisualPiece;
  isSelected: boolean;
  isHovered: boolean;
  clickSquare: (square: Square) => void;
  hoverPiece: (square: Square | null) => void;
}

const AnimatedPiece = ({
  piece,
  isSelected,
  isHovered,
  clickSquare,
  hoverPiece,
}: AnimatedPieceProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const targetPos = useMemo(() => getPosFromSquare(piece.square), [piece.square]);
  const isCaptured = piece.captured;

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(targetPos[0], targetPos[1], targetPos[2]);
      groupRef.current.rotation.y = piece.color === 'b' ? Math.PI : 0;
    }
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const dt = Math.min(delta, 0.1);
    const currentPos = groupRef.current.position;

    if (isCaptured) {
      const s = THREE.MathUtils.lerp(groupRef.current.scale.x, 0, dt * 8);
      groupRef.current.scale.set(s, s, s);
      groupRef.current.rotation.y += dt * 15;
      currentPos.y += dt * 2;
    } else {
      const dist = Math.sqrt(
        Math.pow(targetPos[0] - currentPos.x, 2) +
          Math.pow(targetPos[2] - currentPos.z, 2)
      );

      currentPos.x = THREE.MathUtils.lerp(currentPos.x, targetPos[0], dt * 15);
      currentPos.z = THREE.MathUtils.lerp(currentPos.z, targetPos[2], dt * 15);

      let targetY = targetPos[1];
      if (dist > 0.05) {
        targetY = targetPos[1] + Math.min(dist * 0.8, 1.5);
      } else if (isSelected) {
        targetY = targetPos[1] + 0.12; // Gentle lift feedback when selected on mobile
      }

      currentPos.y = THREE.MathUtils.lerp(currentPos.y, targetY, dt * 15);

      const s = THREE.MathUtils.lerp(groupRef.current.scale.x, 1, dt * 10);
      groupRef.current.scale.set(s, s, s);

      const targetRotY = piece.color === 'b' ? Math.PI : 0;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotY,
        dt * 10
      );
    }
  });

  const PieceComponent = getPieceComponent(piece.type);

  return (
    <group ref={groupRef}>
      <PieceComponent
        color={piece.color}
        position={[0, 0.05, 0]}
        isSelected={isSelected || isHovered}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          if (e.pointerType === 'touch') return;
          e.stopPropagation();
          if (!isCaptured) hoverPiece(piece.square);
        }}
        onPointerOut={(e: ThreeEvent<PointerEvent>) => {
          if (e.pointerType === 'touch') return;
          e.stopPropagation();
          if (!isCaptured) hoverPiece(null);
        }}
        onPointerDown={handlePointerDownTap}
        onPointerUp={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          if (!isCaptured && isCleanTap(e)) {
            clickSquare(piece.square);
          }
        }}
      />
    </group>
  );
};

export const ChessBoard = () => {
  const {
    game,
    selectedSquare,
    hoveredSquare,
    possibleMoves,
    bestMoves,
    hoverPiece,
    clickSquare,
    gameTick,
  } = useGameStore();

  const visualPieces = useMemo(() => getVisualPieces(game), [gameTick]);

  const lastMove = useMemo(() => {
    const history = game.history({ verbose: true });
    return history.length > 0 ? history[history.length - 1] : null;
  }, [gameTick]);

  return (
    <group position={[-3.5, 0, -3.5]}>
      {/* Board Base */}
      <mesh position={[3.5, -0.25, 3.5]} receiveShadow>
        <boxGeometry args={[8.4, 0.5, 8.4]} />
        <meshStandardMaterial color="#3b3733" roughness={0.85} metalness={0.15} />
      </mesh>

      {/* Squares */}
      {RANKS.map((rank, rankIndex) =>
        FILES.map((file, fileIndex) => {
          const square = `${file}${rank}` as Square;
          const isLight = (rankIndex + fileIndex) % 2 === 0;
          const isSelected = selectedSquare === square;
          const isPossibleMove = possibleMoves.includes(square);
          const isBestMove = bestMoves?.includes(square);
          const isLastMove =
            lastMove?.from === square || lastMove?.to === square;
          const occupant = game.get(square);
          const isCaptureTarget = isPossibleMove && Boolean(occupant);

          const squareColor = isSelected
            ? '#facc15'
            : isBestMove
              ? '#06b6d4'
              : isCaptureTarget
                ? '#f97316'
                : isPossibleMove
                  ? '#84cc16'
                  : isLastMove
                    ? isLight
                      ? '#e3d5a5'
                      : '#7d734b'
                    : isLight
                      ? '#dfd9ce'
                      : '#57524d';

          return (
            <group key={square} position={[fileIndex, 0, 7 - rankIndex]}>
              <mesh
                receiveShadow
                onPointerDown={handlePointerDownTap}
                onPointerUp={(e) => {
                  e.stopPropagation();
                  if (isCleanTap(e)) {
                    clickSquare(square);
                  }
                }}
                onPointerOver={(e) => {
                  if (e.pointerType === 'touch') return;
                  e.stopPropagation();
                  hoverPiece(square);
                }}
                onPointerOut={(e) => {
                  if (e.pointerType === 'touch') return;
                  e.stopPropagation();
                  hoverPiece(null);
                }}
              >
                <boxGeometry args={[1, 0.1, 1]} />
                <meshStandardMaterial
                  color={squareColor}
                  roughness={0.45}
                  metalness={0.1}
                />
              </mesh>

              {/* High-visibility tactical marker on top of square for touch accuracy */}
              {isBestMove && (
                <mesh position={[0, 0.056, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[0.24, 0.38, 28]} />
                  <meshBasicMaterial color="#67e8f9" transparent opacity={0.95} />
                </mesh>
              )}

              {isPossibleMove && !isBestMove && !isCaptureTarget && (
                <mesh position={[0, 0.055, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <circleGeometry args={[0.18, 24]} />
                  <meshBasicMaterial color="#ecfccb" transparent opacity={0.85} />
                </mesh>
              )}

              {isCaptureTarget && !isBestMove && (
                <mesh position={[0, 0.056, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[0.3, 0.42, 28]} />
                  <meshBasicMaterial color="#fed7aa" transparent opacity={0.95} />
                </mesh>
              )}
            </group>
          );
        })
      )}

      {/* Animated Pieces */}
      {visualPieces.map((piece) => {
        const isSelected = selectedSquare === piece.square && !piece.captured;
        const isHovered = hoveredSquare === piece.square && !piece.captured;

        return (
          <AnimatedPiece
            key={piece.id}
            piece={piece}
            isSelected={isSelected}
            isHovered={isHovered}
            clickSquare={clickSquare}
            hoverPiece={hoverPiece}
          />
        );
      })}
    </group>
  );
};
