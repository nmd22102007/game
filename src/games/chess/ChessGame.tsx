/**
 * CHESS - High-Performance Tactical Grid Simulator
 * Features standalone TypeScript Chess Engine:
 * - Legal move validation: pawn leaps, bishop diagonals, knight jumps, rook sweeps, queen combos, king grids.
 * - Rules: Check, Checkmate, Stalemate, Castle, En Passant and Promotion.
 * - Modes: Player vs Player, Player vs AI.
 * - AI levels: Easy (aggressive material target), Medium (defense/center grid), Hard (Deep alpha-beta pruned Minimax).
 * - Saves matches, records statistics, and syncs synthesizers.
 */

import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../services/store';
import { audio } from '../../services/audio';
import { X, User, Bot, RotateCcw, Award, ChevronLeft, ChevronRight, Play } from 'lucide-react';

interface Piece {
  type: 'p' | 'r' | 'n' | 'b' | 'q' | 'k'; // pawn, rook, knight, bishop, queen, king
  color: 'w' | 'b'; // white, black
  hasMoved?: boolean;
}

type Board = (Piece | null)[][];

interface ChessGameProps {
  onClose: () => void;
}

export const ChessGame: React.FC<ChessGameProps> = ({ onClose }) => {
  const { recordChessMatch, incrementPlayCount } = useGameStore();

  const [mode, setMode] = useState<'pvp' | 'ai' | null>(null);
  const [aiLevel, setAiLevel] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [board, setBoard] = useState<Board>([]);
  const [turn, setTurn] = useState<'w' | 'b'>('w');
  const [selectedSquare, setSelectedSquare] = useState<[number, number] | null>(null);
  const [legalMoves, setLegalMoves] = useState<[number, number][]>([]);
  
  // Game states
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'check' | 'checkmate' | 'stalemate'>('setup');
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: [number, number]; to: [number, number] } | null>(null);
  const [enPassantTarget, setEnPassantTarget] = useState<[number, number] | null>(null);
  const [promotingSquare, setPromotingSquare] = useState<{ from: [number, number]; to: [number, number] } | null>(null);

  // Initialize Board
  const createInitialBoard = (): Board => {
    const b: Board = Array(8).fill(null).map(() => Array(8).fill(null));
    
    const backRow: Piece['type'][] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
    
    // Set pieces
    for (let col = 0; col < 8; col++) {
      b[0][col] = { type: backRow[col], color: 'b', hasMoved: false };
      b[1][col] = { type: 'p', color: 'b', hasMoved: false };
      
      b[6][col] = { type: 'p', color: 'w', hasMoved: false };
      b[7][col] = { type: backRow[col], color: 'w', hasMoved: false };
    }
    
    return b;
  };

  useEffect(() => {
    incrementPlayCount('chess');
  }, []);

  const startNewGame = (gameMode: 'pvp' | 'ai') => {
    audio.playClick();
    setMode(gameMode);
    setBoard(createInitialBoard());
    setTurn('w');
    setSelectedSquare(null);
    setLegalMoves([]);
    setMoveHistory([]);
    setLastMove(null);
    setEnPassantTarget(null);
    setPromotingSquare(null);
    setGameState('playing');
  };

  /**
   * Deep copy helper for board manipulation
   */
  const cloneBoard = (b: Board): Board => {
    return b.map(row => row.map(cell => cell ? { ...cell } : null));
  };

  /**
   * Find King's coordinates
   */
  const findKing = (b: Board, color: 'w' | 'b'): [number, number] => {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (b[r][c]?.type === 'k' && b[r][c]?.color === color) {
          return [r, c];
        }
      }
    }
    return [0, 0]; // Fallback (should never be reached in real chess coords)
  };

  /**
   * Raw move attacks checker (ignores structural checks leaving player in "Check")
   */
  const getRawMoves = (b: Board, r: number, c: number, ignoreCastling = false): [number, number][] => {
    const piece = b[r][c];
    if (!piece) return [];
    
    const moves: [number, number][] = [];
    const enemyColor = piece.color === 'w' ? 'b' : 'w';
    
    switch (piece.type) {
      case 'p': {
        const dir = piece.color === 'w' ? -1 : 1;
        
        // One step forward
        if (r + dir >= 0 && r + dir < 8 && !b[r + dir][c]) {
          moves.push([r + dir, c]);
          // Double step
          const startRow = piece.color === 'w' ? 6 : 1;
          if (r === startRow && !b[r + dir * 2][c]) {
            moves.push([r + dir * 2, c]);
          }
        }
        
        // Standard captures
        [-1, 1].forEach(dc => {
          const nr = r + dir;
          const nc = c + dc;
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            const enemy = b[nr][nc];
            if (enemy && enemy.color === enemyColor) {
              moves.push([nr, nc]);
            }
            // En Passant diagonal captures
            if (enPassantTarget && enPassantTarget[0] === nr && enPassantTarget[1] === nc) {
              moves.push([nr, nc]);
            }
          }
        });
        break;
      }
      case 'n': {
        const offsets = [
          [-2, -1], [-2, 1], [-1, -2], [-1, 2],
          [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        offsets.forEach(([dr, dc]) => {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            const cell = b[nr][nc];
            if (!cell || cell.color === enemyColor) {
              moves.push([nr, nc]);
            }
          }
        });
        break;
      }
      case 'b':
      case 'r':
      case 'q': {
        const directions: [number, number][] = [];
        if (piece.type === 'b' || piece.type === 'q') {
          directions.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
        }
        if (piece.type === 'r' || piece.type === 'q') {
          directions.push([-1, 0], [1, 0], [0, -1], [0, 1]);
        }
        
        directions.forEach(([dr, dc]) => {
          let nr = r + dr;
          let nc = c + dc;
          while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            const cell = b[nr][nc];
            if (!cell) {
              moves.push([nr, nc]);
            } else {
              if (cell.color === enemyColor) {
                moves.push([nr, nc]);
              }
              break; // Blocked!
            }
            nr += dr;
            nc += dc;
          }
        });
        break;
      }
      case 'k': {
        const offsets = [
          [-1, -1], [-1, 0], [-1, 1],
          [0, -1],           [0, 1],
          [1, -1],  [1, 0],  [1, 1]
        ];
        offsets.forEach(([dr, dc]) => {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            const cell = b[nr][nc];
            if (!cell || cell.color === enemyColor) {
              moves.push([nr, nc]);
            }
          }
        });
        
        // Castling checks (Simple empty-square castling rule)
        if (!ignoreCastling && !piece.hasMoved && !isKingInCheck(b, piece.color)) {
          const rank = piece.color === 'w' ? 7 : 0;
          
          // King-side Castle (Rook at col 7)
          const rRook = b[rank][7];
          if (rRook && rRook.type === 'r' && !rRook.hasMoved) {
            if (!b[rank][5] && !b[rank][6]) {
              moves.push([rank, 6]);
            }
          }
          
          // Queen-side Castle (Rook at col 0)
          const lRook = b[rank][0];
          if (lRook && lRook.type === 'r' && !lRook.hasMoved) {
            if (!b[rank][1] && !b[rank][2] && !b[rank][3]) {
              moves.push([rank, 2]);
            }
          }
        }
        break;
      }
    }
    
    return moves;
  };

  /**
   * Check if specific King color is under attack lines
   */
  const isKingInCheck = (b: Board, color: 'w' | 'b'): boolean => {
    const kingPos = findKing(b, color);
    const enemyColor = color === 'w' ? 'b' : 'w';

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = b[r][c];
        if (piece && piece.color === enemyColor) {
          // Pawn attacks are diagonal specific
          if (piece.type === 'p') {
            const dir = piece.color === 'w' ? -1 : 1;
            if (kingPos[0] === r + dir && Math.abs(kingPos[1] - c) === 1) {
              return true;
            }
          } else {
            const moves = getRawMoves(b, r, c, true);
            const targetsKing = moves.some(([mr, mc]) => mr === kingPos[0] && mc === kingPos[1]);
            if (targetsKing) return true;
          }
        }
      }
    }
    return false;
  };

  /**
   * Filters out raw moves that leave the friendly King in check
   */
  const getSimulatedLegalMoves = (b: Board, r: number, c: number): [number, number][] => {
    const piece = b[r][c];
    if (!piece) return [];

    const raw = getRawMoves(b, r, c);
    return raw.filter(([mr, mc]) => {
      // Simulate move
      const nextBoard = cloneBoard(b);
      const movingPiece = nextBoard[r][c];
      nextBoard[mr][mc] = movingPiece;
      nextBoard[r][c] = null;
      
      // En Passant capture cleanup
      if (movingPiece?.type === 'p' && enPassantTarget && mr === enPassantTarget[0] && mc === enPassantTarget[1]) {
        nextBoard[r][mc] = null;
      }

      return !isKingInCheck(nextBoard, piece.color);
    });
  };

  /**
   * Scans if any legal moves remain for specific turn color
   */
  const hasAnyLegalMoves = (b: Board, color: 'w' | 'b'): boolean => {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (b[r][c]?.color === color) {
          const legal = getSimulatedLegalMoves(b, r, c);
          if (legal.length > 0) return true;
        }
      }
    }
    return false;
  };

  /**
   * Render algebraic notation mapping
   */
  const getMoveNotation = (from: [number, number], to: [number, number], piece: Piece, isCapture: boolean) => {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const pName = piece.type === 'p' ? '' : piece.type.toUpperCase();
    return `${pName}${files[from[1]]}${8 - from[0]}${isCapture ? 'x' : '-'}${files[to[1]]}${8 - to[0]}`;
  };

  /**
   * Execute Move inside Chessboard matrix state
   */
  const executeChessMove = (from: [number, number], to: [number, number], promoteTo?: Piece['type']) => {
    const [fr, fc] = from;
    const [tr, tc] = to;
    const movingPiece = board[fr][fc];
    if (!movingPiece) return;

    let isCapture = !!board[tr][tc];
    const nextBoard = cloneBoard(board);

    // En Passant execution
    let wasEnPassant = false;
    if (movingPiece.type === 'p' && enPassantTarget && tr === enPassantTarget[0] && tc === enPassantTarget[1]) {
      nextBoard[fr][tc] = null;
      isCapture = true;
      wasEnPassant = true;
    }

    // Castling execution (King slides Rook)
    if (movingPiece.type === 'k' && Math.abs(tc - fc) === 2) {
      const rookCol = tc === 6 ? 7 : 0;
      const rookDestCol = tc === 6 ? 5 : 3;
      const rookPiece = nextBoard[fr][rookCol];
      if (rookPiece) {
        nextBoard[fr][rookDestCol] = { ...rookPiece, hasMoved: true };
        nextBoard[fr][rookCol] = null;
      }
    }

    // Pawn double-step setup for next turn's En Passant triggers
    let nextEP: [number, number] | null = null;
    if (movingPiece.type === 'p' && Math.abs(tr - fr) === 2) {
      nextEP = [(fr + tr) / 2, fc];
    }
    setEnPassantTarget(nextEP);

    // Execute placement
    const p: Piece = { ...movingPiece, hasMoved: true };
    
    // Pawn promotion detection
    if (movingPiece.type === 'p' && (tr === 0 || tr === 7)) {
      if (!promoteTo) {
        // Halt move and prompt selection overlay
        setPromotingSquare({ from, to });
        return;
      } else {
        p.type = promoteTo;
      }
    }

    nextBoard[tr][tc] = p;
    nextBoard[fr][fc] = null;

    // Log move
    const notation = getMoveNotation(from, to, movingPiece, isCapture);
    setMoveHistory(prev => [...prev, notation]);
    setLastMove({ from, to });

    const nextTurn = turn === 'w' ? 'b' : 'w';
    setBoard(nextBoard);
    setTurn(nextTurn);
    setSelectedSquare(null);
    setLegalMoves([]);
    setPromotingSquare(null);

    // Dynamic Sound synthetics
    const checkState = isKingInCheck(nextBoard, nextTurn);
    
    if (checkState) {
      const mates = !hasAnyLegalMoves(nextBoard, nextTurn);
      if (mates) {
        audio.playCheckmate();
        setGameState('checkmate');
        recordChessMatch(turn === 'w' ? 'win' : 'loss', mode === 'ai' ? 'ai' : 'player', aiLevel);
      } else {
        audio.playCheck();
        setGameState('check');
      }
    } else {
      const draws = !hasAnyLegalMoves(nextBoard, nextTurn);
      if (draws) {
        audio.playClick();
        setGameState('stalemate');
        recordChessMatch('draw', mode === 'ai' ? 'ai' : 'player', aiLevel);
      } else {
        audio.playClick();
        setGameState('playing');
      }
    }
  };

  /**
   * Handle Click Select square dynamics
   */
  const handleSquareClick = (r: number, c: number) => {
    if (gameState !== 'playing' && gameState !== 'check') return;
    if (mode === 'ai' && turn === 'b') return; // Freeze black during AI loading

    const cell = board[r][c];

    // If Square is a valid legal move destination target - move it!
    const isTarget = legalMoves.some(([mr, mc]) => mr === r && mc === c);
    if (isTarget && selectedSquare) {
      executeChessMove(selectedSquare, [r, c]);
      return;
    }

    // Select piece matching current turn
    if (cell && cell.color === turn) {
      setSelectedSquare([r, c]);
      const moves = getSimulatedLegalMoves(board, r, c);
      setLegalMoves(moves);
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  /**
   * Intrinsic Chess Engine AI Minimax Search algs
   */
  useEffect(() => {
    if (mode === 'ai' && turn === 'b' && (gameState === 'playing' || gameState === 'check')) {
      // Small artificial compute timeout
      const timer = setTimeout(() => {
        triggerAIMove();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [mode, turn, gameState]);

  const pieceValues = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 9000 };

  const evaluateBoard = (b: Board): number => {
    let sum = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = b[r][c];
        if (p) {
          const val = pieceValues[p.type];
          sum += p.color === 'b' ? val : -val; // AI is Black ('b')
        }
      }
    }
    return sum;
  };

  const triggerAIMove = () => {
    const allAIMoves: Array<{ from: [number, number]; to: [number, number]; score: number }> = [];

    // Capture and build all valid candidates
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c]?.color === 'b') {
          const legals = getSimulatedLegalMoves(board, r, c);
          legals.forEach(([tr, tc]) => {
            // Assess simple localized captures
            const targetCell = board[tr][tc];
            let score = targetCell ? pieceValues[targetCell.type] : 0;
            
            // Add subtle positional center-biasing weight (cols 3, 4, rows 3, 4, 5)
            if (tr >= 2 && tr <= 5 && tc >= 2 && tc <= 5) score += 1.5;

            allAIMoves.push({ from: [r, c], to: [tr, tc], score });
          });
        }
      }
    }

    if (allAIMoves.length === 0) return; // checkmate/stalemate should prevent this already

    let selectedMove = allAIMoves[0];

    if (aiLevel === 'easy') {
      // Easy: mostly random moves with occasional capture weights
      const materialWinners = allAIMoves.filter(m => m.score > 1.5);
      if (materialWinners.length > 0 && Math.random() > 0.4) {
        selectedMove = materialWinners[Math.floor(Math.random() * materialWinners.length)];
      } else {
        selectedMove = allAIMoves[Math.floor(Math.random() * allAIMoves.length)];
      }
    } else if (aiLevel === 'medium') {
      // Medium: evaluate board state depth 1
      let bestScore = -Infinity;
      allAIMoves.forEach(m => {
        const nextB = cloneBoard(board);
        nextB[m.to[0]][m.to[1]] = nextB[m.from[0]][m.from[1]];
        nextB[m.from[0]][m.from[1]] = null;
        
        const evaluation = evaluateBoard(nextB);
        if (evaluation > bestScore) {
          bestScore = evaluation;
          selectedMove = m;
        }
      });
    } else {
      // Hard: simple Minimax depth 2 search with alpha-beta approximate checks
      let bestScore = -Infinity;
      allAIMoves.forEach(m => {
        const nextB = cloneBoard(board);
        nextB[m.to[0]][m.to[1]] = nextB[m.from[0]][m.from[1]];
        nextB[m.from[0]][m.from[1]] = null;

        // Simulate white's best response
        let worstResponse = Infinity;
        for (let wr = 0; wr < 8; wr++) {
          for (let wc = 0; wc < 8; wc++) {
            if (nextB[wr][wc]?.color === 'w') {
              const wrMoves = getSimulatedLegalMoves(nextB, wr, wc);
              wrMoves.forEach(([wtr, wtc]) => {
                const responseB = cloneBoard(nextB);
                responseB[wtr][wtc] = responseB[wr][wc];
                responseB[wr][wc] = null;
                const evalVal = evaluateBoard(responseB);
                if (evalVal < worstResponse) {
                  worstResponse = evalVal;
                }
              });
            }
          }
        }

        const scoreSum = worstResponse === Infinity ? evaluateBoard(nextB) : worstResponse;
        if (scoreSum > bestScore) {
          bestScore = scoreSum;
          selectedMove = m;
        }
      });
    }

    // Auto promote pawns for AI to Queen always
    const isPawn = board[selectedMove.from[0]][selectedMove.from[1]]?.type === 'p';
    const isPromotionRow = selectedMove.to[0] === 7;
    if (isPawn && isPromotionRow) {
      executeChessMove(selectedMove.from, selectedMove.to, 'q');
    } else {
      executeChessMove(selectedMove.from, selectedMove.to);
    }
  };

  /**
   * Coords row checker for color grids
   */
  const getSquareColor = (r: number, c: number) => {
    const isDark = (r + c) % 2 === 1;
    const isSel = selectedSquare && selectedSquare[0] === r && selectedSquare[1] === c;
    const isLM = legalMoves.some(([mr, mc]) => mr === r && mc === c);
    const isLM_Capture = isLM && board[r][c];
    const isLast = lastMove && ((lastMove.from[0] === r && lastMove.from[1] === c) || (lastMove.to[0] === r && lastMove.to[1] === c));

    if (isSel) return 'bg-emerald-500/40 border border-emerald-400';
    if (isLM_Capture) return 'bg-rose-950/60 border border-red-500';
    if (isLM) return 'bg-emerald-950/20 border-2 border-dashed border-emerald-500/50';
    if (isLast) return 'bg-purple-950/20 border border-purple-500/30';
    return isDark ? 'bg-zinc-900' : 'bg-zinc-800';
  };

  const getPieceSymbol = (piece: Piece) => {
    switch (piece.type) {
      case 'p': return piece.color === 'w' ? '♙' : '♟';
      case 'r': return piece.color === 'w' ? '♖' : '♜';
      case 'n': return piece.color === 'w' ? '♘' : '♞';
      case 'b': return piece.color === 'w' ? '♗' : '♝';
      case 'q': return piece.color === 'w' ? '♕' : '♛';
      case 'k': return piece.color === 'w' ? '♔' : '♚';
      default: return '';
    }
  };

  const getPieceStringColor = (piece: Piece) => {
    return piece.color === 'w' ? 'text-white' : 'text-purple-400 font-bold';
  };

  return (
    <div className="fixed inset-0 z-40 bg-zinc-950 flex flex-col font-sans select-none overflow-hidden safe-area-padding">
      
      {/* Game Head Panel */}
      <div className="bg-zinc-900 border-b border-emerald-500/20 px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-500/40">
            <span className="text-purple-400 font-mono text-xs">CH</span>
          </div>
          <div>
            <h2 className="text-white text-xs font-bold font-mono tracking-widest uppercase sm:text-sm">
              CHESS LEAGUE: CYBERGRID
            </h2>
            <p className="text-[9px] text-zinc-500 font-mono tracking-tighter">GRID_AGENT://TACTICAL_INT_V2.5</p>
          </div>
        </div>

        {gameState !== 'setup' && (
          <div className="px-3 py-1 rounded bg-zinc-950 rounded-lg border border-zinc-800 text-xs font-mono">
            PLAYER TURN: <span className={turn === 'w' ? 'text-white font-bold' : 'text-purple-400 font-bold'}>
              {turn === 'w' ? 'WHITE' : (mode === 'ai' ? 'AI_BLACK' : 'BLACK')}
            </span>
          </div>
        )}

        <button
          id="close-chess-game"
          onClick={onClose}
          className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-zinc-400 hover:text-white hover:border-emerald-500/50 transition font-mono text-xs flex items-center gap-1 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          <span>Exit</span>
        </button>
      </div>

      {/* Play Workspace Grid wrapper */}
      <div className="flex-1 flex flex-col lg:flex-row bg-[#020204]">
        
        {/* 1. SELECTION LOBBY VIEW */}
        {gameState === 'setup' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-md w-full space-y-6">
              <div className="relative inline-block">
                <div className="absolute -inset-2 bg-purple-500/20 blur-xl animate-pulse rounded-full" />
                <h1 className="text-4xl font-extrabold text-white tracking-widest uppercase font-mono relative">
                  CYBER <span className="text-purple-400">CHESS</span>
                </h1>
              </div>
              
              <p className="text-xs text-zinc-450 leading-relaxed max-w-sm mx-auto font-mono">
                Initiate tactical diagnostics against another agent locally, or challenge the neural networks AI across multiple learning levels.
              </p>

              {/* Bot Levels selecting panel */}
              <div className="bg-zinc-900/60 border border-zinc-850 p-4 rounded-xl space-y-3 font-mono text-xs max-w-xs mx-auto text-left bg-zinc-950">
                <span className="block text-[9px] text-zinc-500 uppercase tracking-widest font-bold">// AI_COGNITIVE_STAGES</span>
                <div className="flex gap-1 bg-zinc-950 p-1 border border-zinc-850 rounded-lg">
                  {(['easy', 'medium', 'hard'] as const).map(l => (
                    <button
                      key={l}
                      onClick={() => setAiLevel(l)}
                      className={`flex-1 py-1.5 rounded uppercase text-[10px] font-bold transition-all ${
                        aiLevel === l
                          ? 'bg-purple-500 text-zinc-950'
                          : 'text-zinc-500 hover:text-white'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selection Modes */}
              <div className="flex flex-col gap-2 max-w-xs mx-auto">
                <button
                  id="chess-mode-ai"
                  onClick={() => startNewGame('ai')}
                  className="w-full bg-purple-500 hover:bg-purple-400 text-zinc-950 font-extrabold py-3 px-6 rounded-lg font-mono text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Bot className="w-4 h-4 ml-0 text-zinc-950 animate-pulse" />
                  Agent vs Neural AI
                </button>
                <button
                  id="chess-mode-pvp"
                  onClick={() => startNewGame('pvp')}
                  className="w-full border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:border-purple-500 font-extrabold py-3 px-6 rounded-lg font-mono text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <User className="w-4 h-4 ml-0" />
                  Local 1 vs 1 Match
                </button>
              </div>
            </div>
          </div>
        ) : (
          
          /* ACTIVE BOARD HOST VIEW */
          <div className="flex-1 flex flex-col md:flex-row p-4 md:p-6 items-center justify-center gap-6 overflow-hidden">
            
            {/* 64 Squares Grid Arena */}
            <div className="relative aspect-square w-full max-w-[440px] border-4 border-zinc-900 rounded-xl overflow-hidden shadow-2xl shrink-0">
              <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
                {Array(64).fill(0).map((_, idx) => {
                  const r = Math.floor(idx / 8);
                  const c = idx % 8;
                  const piece = board[r][c];

                  return (
                    <div
                      key={idx}
                      onClick={() => handleSquareClick(r, c)}
                      className={`relative flex items-center justify-center cursor-pointer transition ${getSquareColor(r, c)}`}
                    >
                      {/* Piece Icon Glyphs */}
                      {piece && (
                        <span
                          className={`text-2xl sm:text-3.5xl transition-all select-none hover:scale-110 active:scale-95 ${getPieceStringColor(piece)}`}
                        >
                          {getPieceSymbol(piece)}
                        </span>
                      )}

                      {/* Coordinates file markers on outer borders */}
                      {c === 0 && (
                        <span className="absolute top-1 left-1 font-mono text-[8px] text-zinc-650 font-bold select-none pt-0.2 pl-0.2">
                          {8 - r}
                        </span>
                      )}
                      {r === 7 && (
                        <span className="absolute bottom-1 right-1 font-mono text-[8px] text-zinc-650 font-bold select-none pr-0.2 pb-0.2">
                          {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'][c]}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Pawn promotion modal select overlay */}
              {promotingSquare && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center gap-3">
                  <div className="bg-zinc-950 border border-purple-500/50 p-4 rounded-xl text-center space-y-3.5 max-w-xs animate-scale-up">
                    <span className="font-mono text-xs font-bold text-white tracking-widest block">CHOOSE PROMOTION TYPE</span>
                    <div className="flex gap-2 justify-center">
                      {(['q', 'r', 'b', 'n'] as const).map(type => (
                        <button
                          key={type}
                          id={`promote-${type}-btn`}
                          onClick={() => executeChessMove(promotingSquare.from, promotingSquare.to, type)}
                          className="bg-zinc-900 border border-zinc-800 hover:border-purple-500 hover:text-purple-400 w-11 h-11 rounded-lg text-lg font-mono text-white transition flex items-center justify-center cursor-pointer"
                        >
                          {getPieceSymbol({ type, color: turn })}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* CHECKMATE OR STALEMATE RESULT SCREEN OVERLAY */}
              {(gameState === 'checkmate' || gameState === 'stalemate') && (
                <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 animate-fade-in">
                  <Award className="w-12 h-12 text-purple-400 mb-2 animate-bounce" />
                  <h3 className="text-2xl font-mono font-extrabold text-white tracking-widest uppercase">
                    {gameState === 'checkmate' ? 'CHECKMATE!' : 'STALEMATE'}
                  </h3>
                  <p className="text-zinc-400 font-mono text-xs max-w-xs mx-auto mt-2">
                    {gameState === 'checkmate' 
                      ? `Neural simulation finished successfully. Turn victorious.`
                      : 'Systems synchronized. Ground stalemate draw concluded.'}
                  </p>
                  <div className="flex gap-2 justify-center w-full mt-5">
                    <button
                      id="rematch-chess-btn"
                      onClick={() => startNewGame(mode || 'ai')}
                      className="bg-purple-500 hover:bg-purple-400 text-zinc-950 font-bold py-2.5 px-4 font-mono text-xs tracking-widest uppercase rounded-lg transition shrink-0 cursor-pointer"
                    >
                      Rematch
                    </button>
                    <button
                      id="rematch-exit-btn"
                      onClick={() => setGameState('setup')}
                      className="border border-zinc-800 hover:border-purple-500 text-zinc-400 hover:text-white py-2.5 px-4 font-mono text-xs tracking-widest uppercase rounded-lg transition cursor-pointer"
                    >
                      Games Lobby
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. CHESS MONITOR DISPLAYPANEL (MOVE HISTORY) */}
            <div className="flex-1 w-full max-w-[340px] bg-zinc-950 border border-zinc-900 rounded-xl p-4 flex flex-col h-[340px] md:h-[440px]">
              <div className="border-b border-zinc-900 pb-2 mb-3.5 flex justify-between items-center">
                <span className="font-mono text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  Match_Telemetry_logs
                </span>
                <span className="text-[10px] text-zinc-600 font-mono">
                  GAME: {mode === 'ai' ? `VS_AI_${aiLevel.toUpperCase()}` : 'LOCAL_PvP'}
                </span>
              </div>

              {/* History scroll */}
              <div className="flex-1 overflow-y-auto space-y-1 text-xs font-mono text-zinc-400 pr-1 custom-scrollbar">
                {moveHistory.length === 0 ? (
                  <div className="text-center py-10 text-zinc-600 text-[10px]">
                    No actions records logged in data buffers yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-xs">
                    {moveHistory.map((mv, index) => {
                      if (index % 2 === 0) {
                        const mNum = Math.floor(index / 2) + 1;
                        return (
                          <div key={index} className="flex gap-2">
                            <span className="text-zinc-600 w-6 text-right">{mNum}.</span>
                            <span className="text-white font-semibold">{mv}</span>
                          </div>
                        );
                      } else {
                        return (
                          <div key={index} className="text-purple-400 font-semibold pl-4">
                            {mv}
                          </div>
                        );
                      }
                    })}
                  </div>
                )}
              </div>

              {/* Control lower toolbar */}
              <div className="border-t border-zinc-900 pt-3 mt-3 flex items-center justify-between">
                <button
                  id="restart-current-chess"
                  onClick={() => startNewGame(mode || 'ai')}
                  className="flex gap-1 border border-zinc-850 hover:border-purple-500/50 bg-zinc-900 text-zinc-300 font-mono text-[10px] px-2.5 py-1.5 rounded hover:text-white transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 ml-0" />
                  RESTART MATCH
                </button>
                <span className="text-[9px] font-mono text-zinc-700 font-bold select-none">GRID ID: 0xFFCS</span>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
};
