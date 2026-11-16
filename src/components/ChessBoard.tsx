import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Chess, Square } from 'chess.js';
import { Faro, Catedral, Moai, JarroPato, Campanario, Fuerte, Rey } from './pieces/Pieces';
import { useGameStore } from '../store/gameStore';
import * as THREE from 'three';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'];

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
    { rank: '1', color: 'w', pieces: ['r','n','b','q','k','b','n','r'] },
    { rank: '2', color: 'w', pieces: ['p','p','p','p','p','p','p','p'] },
    { rank: '7', color: 'b', pieces: ['p','p','p','p','p','p','p','p'] },
    { rank: '8', color: 'b', pieces: ['r','n','b','q','k','b','n','r'] },
  ];
  
  setup.forEach(row => {
    row.pieces.forEach((type, fileIndex) => {
      const square = `${FILES[fileIndex]}${row.rank}` as Square;
      pieces.push({
        id: `${row.color}_${type}_${square}`,
        type,
        color: row.color as 'w'|'b',
        square,
        captured: false
      });
    });
  });
  return pieces;
};

const getVisualPieces = (game: Chess): VisualPiece[] => {
  const pieces = getInitialPieces();
  const history = game.history({ verbose: true });
  
  for (const move of history) {
    const movingPiece = pieces.find(p => p.square === move.from && !p.captured);
    if (movingPiece) {
      movingPiece.square = move.to;
      if (move.promotion) movingPiece.type = move.promotion;
    }
    
    if (move.captured) {
      let capSquare = move.to;
      if (move.flags.includes('e')) {
        capSquare = (move.to[0] + move.from[1]) as Square;
      }
      const capturedPiece = pieces.find(p => p.square === capSquare && p.color !== move.color && !p.captured);
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
      const rook = pieces.find(p => p.square === rookFrom && !p.captured);
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
  isPossibleMove: boolean;
  selectedSquare: Square | null;
  clickSquare: (square: Square) => void;
  pointerUpSquare: (square: Square) => void;
  hoverPiece: (square: Square | null) => void;
  setInteracting: (val: boolean) => void;
}

const AnimatedPiece = ({ piece, isSelected, isHovered, isPossibleMove, selectedSquare, clickSquare, pointerUpSquare, hoverPiece, setInteracting }: AnimatedPieceProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const targetPos = useMemo(() => getPosFromSquare(piece.square), [piece.square]);
  const isCaptured = piece.captured;
  
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(targetPos[0], targetPos[1], targetPos[2]);
      groupRef.current.rotation.y = piece.color === 'b' ? Math.PI : 0;
    }
  }, []); // Only run once on mount

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    
    const currentPos = groupRef.current.position;
    
    if (isCaptured) {
      // Capture animation: shrink, spin, float up
      const s = THREE.MathUtils.lerp(groupRef.current.scale.x, 0, delta * 8);
      groupRef.current.scale.set(s, s, s);
      groupRef.current.rotation.y += delta * 15;
      currentPos.y += delta * 2;
    } else {
      // Move animation: slide and hop
      const dist = Math.sqrt(Math.pow(targetPos[0] - currentPos.x, 2) + Math.pow(targetPos[2] - currentPos.z, 2));
      
      currentPos.x = THREE.MathUtils.lerp(currentPos.x, targetPos[0], delta * 15);
      currentPos.z = THREE.MathUtils.lerp(currentPos.z, targetPos[2], delta * 15);
      
      let targetY = targetPos[1];
      if (dist > 0.05) {
         targetY = targetPos[1] + Math.min(dist * 0.8, 1.5); // Hop height based on distance
      }
      
      currentPos.y = THREE.MathUtils.lerp(currentPos.y, targetY, delta * 15);
      
      // Ensure scale is normal
      const s = THREE.MathUtils.lerp(groupRef.current.scale.x, 1, delta * 10);
      groupRef.current.scale.set(s, s, s);
      
      // Rotation (black pieces face white)
      const targetRotY = piece.color === 'b' ? Math.PI : 0;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, delta * 10);
    }
  });

  const PieceComponent = getPieceComponent(piece.type);

  return (
    <group ref={groupRef}>
      <PieceComponent 
        color={piece.color} 
        position={[0, 0.05, 0]} 
        isSelected={isSelected || isHovered}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (!isCaptured) hoverPiece(piece.square);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          if (!isCaptured) hoverPiece(null);
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          setInteracting(true);
          if (!isCaptured) clickSquare(piece.square);
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
          setInteracting(false);
          if (!isCaptured) pointerUpSquare(piece.square);
        }}
      />
    </group>
  );
};

export const ChessBoard = () => {
  const { game, selectedSquare, hoveredSquare, possibleMoves, bestMoves, hoverPiece, clickSquare, pointerUpSquare, setInteracting, gameTick } = useGameStore();

  // Derive visual pieces from game history to maintain stable IDs for animation
  const visualPieces = useMemo(() => getVisualPieces(game), [gameTick]);

  return (
    <group position={[-3.5, 0, -3.5]}>
      {/* Board Base */}
      <mesh position={[3.5, -0.25, 3.5]} receiveShadow>
        <boxGeometry args={[8.4, 0.5, 8.4]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.9} />
      </mesh>

      {/* Squares */}
      {RANKS.map((rank, rankIndex) => (
        FILES.map((file, fileIndex) => {
          const square = `${file}${rank}` as Square;
          const isLight = (rankIndex + fileIndex) % 2 === 0;
          const isSelected = selectedSquare === square;
          const isPossibleMove = possibleMoves.includes(square);
          const isBestMove = bestMoves?.includes(square);

          return (
              <group key={square} position={[fileIndex, 0, 7 - rankIndex]}>
                <mesh 
                  receiveShadow
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setInteracting(true);
                    clickSquare(square);
                  }}
                  onPointerUp={(e) => {
                    e.stopPropagation();
                    setInteracting(false);
                    pointerUpSquare(square);
                  }}
                  onPointerOver={(e) => {
                    e.stopPropagation();
                    hoverPiece(square);
                  }}
                  onPointerOut={(e) => {
                    e.stopPropagation();
                    hoverPiece(null);
                  }}
                >
                  <boxGeometry args={[1, 0.1, 1]} />
                  <meshStandardMaterial 
                    color={
                      isSelected ? '#ffeb3b' : 
                      isBestMove ? '#00e5ff' : 
                      isPossibleMove ? '#8bc34a' : 
                      isLight ? '#d9d4cb' : '#5c5752'
                    } 
                    roughness={0.4}
                    metalness={0.1}
                  />
                </mesh>
              </group>
          );
        })
      ))}

      {/* Animated Pieces */}
      {visualPieces.map(piece => {
        const isSelected = selectedSquare === piece.square && !piece.captured;
        const isHovered = hoveredSquare === piece.square && !piece.captured;
        const isPossibleMove = possibleMoves.includes(piece.square) && !piece.captured;
        
        return (
          <AnimatedPiece 
            key={piece.id} 
            piece={piece} 
            isSelected={isSelected}
            isHovered={isHovered}
            isPossibleMove={isPossibleMove}
            selectedSquare={selectedSquare}
            clickSquare={clickSquare}
            pointerUpSquare={pointerUpSquare}
            hoverPiece={hoverPiece}
            setInteracting={setInteracting}
          />
        );
      })}
    </group>
  );
};
