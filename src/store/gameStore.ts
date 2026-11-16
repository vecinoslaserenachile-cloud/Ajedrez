import { create } from 'zustand';
import { Chess, Square } from 'chess.js';

interface GameState {
  game: Chess;
  selectedSquare: Square | null;
  hoveredSquare: Square | null;
  possibleMoves: string[];
  bestMoves: string[];
  historyPiece: string | null;
  isInteracting: boolean;
  isAssistedMode: boolean;
  isSoundEnabled: boolean;
  gameTick: number;
  setInteracting: (val: boolean) => void;
  setAssistedMode: (val: boolean) => void;
  setSoundEnabled: (val: boolean) => void;
  setHistoryPiece: (piece: string | null) => void;
  hoverPiece: (square: Square | null) => void;
  clickSquare: (square: Square) => void;
  pointerUpSquare: (square: Square) => void;
  makeComputerMove: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  game: new Chess(),
  selectedSquare: null,
  hoveredSquare: null,
  possibleMoves: [],
  bestMoves: [],
  historyPiece: null,
  isInteracting: false,
  isAssistedMode: false,
  isSoundEnabled: true,
  gameTick: 0,

  setInteracting: (val) => set({ isInteracting: val }),
  setAssistedMode: (val) => set({ isAssistedMode: val }),
  setSoundEnabled: (val) => set({ isSoundEnabled: val }),
  setHistoryPiece: (piece) => set({ historyPiece: piece }),

  hoverPiece: (square) => {
    const { game, selectedSquare, isAssistedMode } = get();
    
    if (selectedSquare) return;

    if (!square) {
      set({ hoveredSquare: null, possibleMoves: [], bestMoves: [] });
      return;
    }

    const piece = game.get(square);
    if (piece && piece.color === game.turn() && game.turn() === 'w') {
      const moves = game.moves({ square, verbose: true });
      
      let bestMoveList: string[] = [];
      if (isAssistedMode) {
        // Calculate best moves for this piece
        let bestScore = -Infinity;
        moves.forEach(m => {
          game.move(m);
          const score = minimax(game, 2, -Infinity, Infinity, false);
          game.undo();
          if (score > bestScore) {
            bestScore = score;
            bestMoveList = [m.to];
          } else if (score === bestScore) {
            bestMoveList.push(m.to);
          }
        });
      }

      set({ 
        hoveredSquare: square, 
        possibleMoves: moves.map(m => m.to),
        bestMoves: bestMoveList,
        historyPiece: piece.type
      });
    } else {
      set({ hoveredSquare: null, possibleMoves: [], bestMoves: [] });
    }
  },

  clickSquare: (square) => {
    const { game, selectedSquare, hoveredSquare, possibleMoves, isAssistedMode, isSoundEnabled } = get();
    
    const activeSquare = selectedSquare || hoveredSquare;
    
    if (activeSquare && possibleMoves.includes(square)) {
      try {
        const move = game.move({ from: activeSquare, to: square, promotion: 'q' });
        if (move) {
          if (isSoundEnabled) playMoveSound(move);
          set({ 
            gameTick: get().gameTick + 1,
            selectedSquare: null, 
            hoveredSquare: null,
            possibleMoves: [],
            bestMoves: []
          });
          return;
        }
      } catch (e) {
        console.error("Invalid move", e);
      }
    }

    const piece = game.get(square);
    if (piece && piece.color === game.turn() && game.turn() === 'w') {
      const moves = game.moves({ square, verbose: true });
      
      let bestMoveList: string[] = [];
      if (isAssistedMode) {
        let bestScore = -Infinity;
        moves.forEach(m => {
          game.move(m);
          const score = minimax(game, 2, -Infinity, Infinity, false);
          game.undo();
          if (score > bestScore) {
            bestScore = score;
            bestMoveList = [m.to];
          } else if (score === bestScore) {
            bestMoveList.push(m.to);
          }
        });
      }

      set({ 
        selectedSquare: square, 
        hoveredSquare: null,
        possibleMoves: moves.map(m => m.to),
        bestMoves: bestMoveList,
        historyPiece: piece.type
      });
    } else {
      set({ selectedSquare: null, hoveredSquare: null, possibleMoves: [], bestMoves: [] });
    }
  },

  pointerUpSquare: (square) => {
    const { game, selectedSquare, possibleMoves, isSoundEnabled } = get();
    if (selectedSquare && selectedSquare !== square && possibleMoves.includes(square)) {
      try {
        const move = game.move({ from: selectedSquare, to: square, promotion: 'q' });
        if (move) {
          if (isSoundEnabled) playMoveSound(move);
          set({ 
            gameTick: get().gameTick + 1,
            selectedSquare: null, 
            hoveredSquare: null,
            possibleMoves: [],
            bestMoves: []
          });
        }
      } catch (e) {
        console.error("Invalid move", e);
      }
    }
  },

  makeComputerMove: () => {
    const { game, isSoundEnabled } = get();
    if (game.isGameOver() || game.turn() === 'w') return;

    const bestMove = getBestMove(game, 3, false);

    if (bestMove) {
      try {
        const move = game.move(bestMove);
        if (isSoundEnabled) playMoveSound(move);
        set({ 
          gameTick: get().gameTick + 1,
          selectedSquare: null, 
          possibleMoves: [],
          bestMoves: [],
          historyPiece: bestMove.piece
        });
      } catch (e) {
        console.error("Computer move failed", e);
      }
    }
  },

  resetGame: () => {
    set({
      game: new Chess(),
      selectedSquare: null,
      possibleMoves: [],
      bestMoves: [],
      historyPiece: null,
      gameTick: 0
    });
  }
}));

// Sound helpers
const sounds = {
  move: new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/move-self.mp3'),
  capture: new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/capture.mp3'),
  check: new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/move-check.mp3'),
  castle: new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/castle.mp3'),
  gameOver: new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/game-end.mp3'),
};

const playMoveSound = (move: any) => {
  if (move.captured) {
    sounds.capture.currentTime = 0;
    sounds.capture.play().catch(() => {});
  } else if (move.san.includes('+')) {
    sounds.check.currentTime = 0;
    sounds.check.play().catch(() => {});
  } else if (move.san.includes('O-O')) {
    sounds.castle.currentTime = 0;
    sounds.castle.play().catch(() => {});
  } else {
    sounds.move.currentTime = 0;
    sounds.move.play().catch(() => {});
  }
};

// Evaluation helpers
const getPieceValue = (type: string) => {
  const values: Record<string, number> = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 900 };
  return values[type] || 0;
};

const evaluateBoard = (game: Chess) => {
  if (game.isCheckmate()) {
    return game.turn() === 'w' ? -10000 : 10000;
  }
  if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition()) {
    return 0;
  }

  let score = 0;
  const board = game.board();
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece) {
        const val = getPieceValue(piece.type);
        // Center control bonus
        const centerBonus = (3.5 - Math.abs(3.5 - i)) * (3.5 - Math.abs(3.5 - j)) * 0.5;
        const pieceScore = val + centerBonus;
        score += piece.color === 'w' ? pieceScore : -pieceScore;
      }
    }
  }
  return score;
};

const minimax = (game: Chess, depth: number, alpha: number, beta: number, isMaximizingPlayer: boolean): number => {
  if (depth === 0 || game.isGameOver()) {
    return evaluateBoard(game);
  }

  const moves = game.moves({ verbose: true });
  // Sort moves to improve alpha-beta pruning (captures first)
  moves.sort((a, b) => (b.captured ? 1 : 0) - (a.captured ? 1 : 0));

  if (isMaximizingPlayer) {
    let maxEval = -Infinity;
    for (const move of moves) {
      game.move(move);
      const ev = minimax(game, depth - 1, alpha, beta, false);
      game.undo();
      maxEval = Math.max(maxEval, ev);
      alpha = Math.max(alpha, ev);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      game.move(move);
      const ev = minimax(game, depth - 1, alpha, beta, true);
      game.undo();
      minEval = Math.min(minEval, ev);
      beta = Math.min(beta, ev);
      if (beta <= alpha) break;
    }
    return minEval;
  }
};

const getBestMove = (game: Chess, depth: number, isMaximizingPlayer: boolean) => {
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return null;

  let bestMove = null;
  let bestValue = isMaximizingPlayer ? -Infinity : Infinity;
  let alpha = -Infinity;
  let beta = Infinity;

  moves.sort((a, b) => (b.captured ? 1 : 0) - (a.captured ? 1 : 0));

  for (const move of moves) {
    game.move(move);
    const boardValue = minimax(game, depth - 1, alpha, beta, !isMaximizingPlayer);
    game.undo();

    if (isMaximizingPlayer) {
      if (boardValue > bestValue) {
        bestValue = boardValue;
        bestMove = move;
      }
      alpha = Math.max(alpha, boardValue);
    } else {
      if (boardValue < bestValue) {
        bestValue = boardValue;
        bestMove = move;
      }
      beta = Math.min(beta, boardValue);
    }
  }

  return bestMove || moves[0];
};
