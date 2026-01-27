import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import Confetti from 'react-confetti';
import type { Action, GameState, PieceId, Piece, Player } from '../engine/chess-ttt-engine';
import {
  applyAction,
  getDestinationsForPiece,
  getInitialState,
  getPhase,
} from '../engine/chess-ttt-engine';
import { getBotMove } from '../ai/bot-controller';
import type { BotDifficulty } from '../ai/types';
import { MoveHistory } from './MoveHistory';

type UIState = {
  selectedReserve: PieceId | null;
  selectedFrom: PieceId | null;
  lastError: string | null;
};

type UIEvent =
  | { type: 'SELECT_RESERVE'; pieceId: PieceId }
  | { type: 'SELECT_BOARD_PIECE'; pieceId: PieceId }
  | { type: 'CANCEL_SELECTION' }
  | { type: 'SET_ERROR'; msg: string }
  | { type: 'CLEAR_SELECTIONS' };

function uiReducer(state: UIState, ev: UIEvent): UIState {
  switch (ev.type) {
    case 'SELECT_RESERVE':
      return {
        selectedReserve: ev.pieceId,
        selectedFrom: null,
        lastError: null,
      };
    case 'SELECT_BOARD_PIECE':
      return {
        selectedFrom: ev.pieceId,
        selectedReserve: null,
        lastError: null,
      };
    case 'CANCEL_SELECTION':
    case 'CLEAR_SELECTIONS':
      return { selectedReserve: null, selectedFrom: null, lastError: null };
    case 'SET_ERROR':
      return { ...state, lastError: ev.msg };
    default:
      return state;
  }
}

function getPieceSymbol(type: 'P' | 'N' | 'B' | 'R', owner: 'W' | 'B'): string {
  // Use filled symbols for Black, outlined for White
  const symbols = {
    P: owner === 'W' ? '♙' : '♟',
    N: owner === 'W' ? '♘' : '♞',
    B: owner === 'W' ? '♗' : '♝',
    R: owner === 'W' ? '♖' : '♜',
  };
  return symbols[type];
}

function getPieceName(type: 'P' | 'N' | 'B' | 'R'): string {
  const names = { P: 'Pawn', N: 'Knight', B: 'Bishop', R: 'Rook' };
  return names[type];
}

type PlayerPanelProps = {
  player: 'W' | 'B';
  pieces: Piece[];
  isCurrentTurn: boolean;
  selectedPiece: PieceId | null;
  onPieceClick: (pieceId: PieceId) => void;
  phase: 'PLACEMENT_ONLY' | 'HYBRID';
  gameWinner: 'W' | 'B' | null;
};

function PlayerPanel({
  player,
  pieces,
  isCurrentTurn,
  selectedPiece,
  onPieceClick,
  phase,
  gameWinner,
}: PlayerPanelProps) {
  const playerName = player === 'W' ? 'White' : 'Black';
  const directionIndicator = player === 'W' ? '↓' : '↑';

  return (
    <div className={`player-panel player-${player.toLowerCase()} ${isCurrentTurn ? 'active' : ''}`}>
      <div className="player-header">
        <h3>{playerName} Player {directionIndicator}</h3>
        {isCurrentTurn && !gameWinner && <span className="turn-indicator">● Your Turn</span>}
      </div>
      <div className="pieces-container">
        {pieces.map((p) => {
          const isDisabled =
            !!gameWinner ||
            !isCurrentTurn ||
            (phase === 'PLACEMENT_ONLY' && p.state !== 'UNPLACED') ||
            (phase === 'HYBRID' && !(p.state === 'UNPLACED' || p.state === 'CAPTURED'));

          const isSelected = selectedPiece === p.id;
          const isOnBoard = p.state === 'ON_BOARD';
          const isCaptured = p.state === 'CAPTURED';

          return (
            <button
              key={p.id}
              className={`piece-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''} ${isCaptured ? 'captured' : ''} ${isOnBoard ? 'on-board' : ''}`}
              onClick={() => !isDisabled && onPieceClick(p.id)}
              disabled={isDisabled}
              title={`${getPieceName(p.type)} - ${p.state}`}
            >
              <div className="piece-symbol">{getPieceSymbol(p.type, player)}</div>
              <div className="piece-name">{getPieceName(p.type)}</div>
              <div className="piece-state">{p.state === 'ON_BOARD' ? '●' : p.state === 'CAPTURED' ? '✕' : '○'}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

type GameMode = 'local' | 'vs-bot';

export function Game() {
  const [game, setGame] = useState<GameState>(() => getInitialState('W'));
  const [score, setScore] = useState({ white: 0, black: 0 });
  const [showConfetti, setShowConfetti] = useState(false);
  const [showWinnerOverlay, setShowWinnerOverlay] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>('local');
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('medium');
  const [botPlayer, setBotPlayer] = useState<Player>('B');
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [viewingMoveIndex, setViewingMoveIndex] = useState<number | null>(null); // null = viewing live game
  const [ui, dispatch] = useReducer(uiReducer, {
    selectedReserve: null,
    selectedFrom: null,
    lastError: null,
  });

  const phase = getPhase(game.ply);

  // Reconstruct board state at a specific move for replay
  const displayedGame = useMemo(() => {
    if (viewingMoveIndex === null || !game.winner) {
      return game; // Live view
    }

    // Replay moves up to viewingMoveIndex
    let state = getInitialState('W');
    for (let i = 0; i <= viewingMoveIndex && i < game.moveHistory.length; i++) {
      const entry = game.moveHistory[i];
      state = applyAction(state, entry.action);
    }
    return state;
  }, [game, viewingMoveIndex]);

  const selectedPiece: PieceId | null = ui.selectedReserve ?? ui.selectedFrom;

  const destinations = useMemo(() => {
    if (!selectedPiece || viewingMoveIndex !== null) return {}; // No selection in replay mode
    return getDestinationsForPiece(game, selectedPiece);
  }, [game, selectedPiece, viewingMoveIndex]);

  // Track previous winner to update score and trigger confetti
  const previousWinnerRef = useRef<'W' | 'B' | null>(null);
  
  useEffect(() => {
    if (game.winner && game.winner !== previousWinnerRef.current) {
      setScore(prev => ({
        white: prev.white + (game.winner === 'W' ? 1 : 0),
        black: prev.black + (game.winner === 'B' ? 1 : 0),
      }));
      setShowConfetti(true);
      setShowWinnerOverlay(true); // Show overlay immediately
      previousWinnerRef.current = game.winner;
    }
    
    // Reset the ref and confetti when game resets (no winner)
    if (!game.winner) {
      previousWinnerRef.current = null;
      setShowConfetti(false);
      setShowWinnerOverlay(false);
    }
  }, [game.winner]);

  // Bot move execution
  useEffect(() => {
    if (gameMode === 'vs-bot' && game.turn === botPlayer && !game.winner && !isBotThinking) {
      setIsBotThinking(true);
      dispatch({ type: 'CLEAR_SELECTIONS' });

      const executeBotMove = async () => {
        try {
          const action = await getBotMove(game, botDifficulty);
          const next = applyAction(game, action);
          setGame(next);
        } catch (error) {
          console.error('Bot move failed:', error);
        } finally {
          setIsBotThinking(false);
        }
      };

      executeBotMove();
    }
  }, [game, gameMode, botPlayer, botDifficulty, isBotThinking]);

  function tryApply(action: Action) {
    try {
      const next = applyAction(game, action);
      setGame(next);
      dispatch({ type: 'CLEAR_SELECTIONS' });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Invalid action';
      dispatch({ type: 'SET_ERROR', msg: message });
    }
  }

  function onSquareClick(idx: number) {
    if (game.winner) return;
    if (isInReplayMode) return; // Prevent input in replay mode
    if (gameMode === 'vs-bot' && game.turn === botPlayer) return; // Prevent human input during bot's turn

    const occ = game.board[idx];

    // If nothing selected, tapping your own piece selects it (hybrid only)
    if (!selectedPiece) {
      if (occ && game.pieces[occ].owner === game.turn && phase === 'HYBRID') {
        dispatch({ type: 'SELECT_BOARD_PIECE', pieceId: occ });
      }
      return;
    }

    // If clicking on the same piece that's already selected, deselect it
    if (occ && occ === selectedPiece) {
      dispatch({ type: 'CANCEL_SELECTION' });
      return;
    }

    // During placement phase, only allow PLACE actions
    if (phase === 'PLACEMENT_ONLY') {
      if (occ !== null) {
        dispatch({
          type: 'SET_ERROR',
          msg: 'During placement phase, you can only place pieces on empty squares.',
        });
        return;
      }
    }

    const actionsHere = destinations[idx];
    if (!actionsHere || actionsHere.length === 0) {
      // If clicking on your own piece in hybrid phase, select it instead
      if (occ && game.pieces[occ].owner === game.turn && phase === 'HYBRID') {
        dispatch({ type: 'SELECT_BOARD_PIECE', pieceId: occ });
        return;
      }
      
      dispatch({
        type: 'SET_ERROR',
        msg: 'Not a legal square for the selected piece.',
      });
      return;
    }

    const chosen =
      actionsHere.find((a) => a.kind === 'CAPTURE') ?? actionsHere[0];

    tryApply(chosen);
  }

  // Placement/respawn selection (piece first -> square second)
  function onReservePieceClick(pieceId: PieceId) {
    if (game.winner) return;
    if (isInReplayMode) return; // Prevent input in replay mode
    if (gameMode === 'vs-bot' && game.turn === botPlayer) return; // Prevent human input during bot's turn

    const p = game.pieces[pieceId];
    if (p.owner !== game.turn) return;

    // If clicking the already selected piece, deselect it
    if (selectedPiece === pieceId) {
      dispatch({ type: 'CANCEL_SELECTION' });
      return;
    }

    if (phase === 'PLACEMENT_ONLY') {
      if (p.state !== 'UNPLACED') return;
      dispatch({ type: 'SELECT_RESERVE', pieceId });
      return;
    }

    // HYBRID: allow UNPLACED or CAPTURED as reserve actions
    if (p.state === 'UNPLACED' || p.state === 'CAPTURED') {
      dispatch({ type: 'SELECT_RESERVE', pieceId });
    }
  }

  function reset() {
    setGame(getInitialState('W'));
    dispatch({ type: 'CLEAR_SELECTIONS' });
    setIsBotThinking(false);
    setShowWinnerOverlay(false);
    setShowConfetti(false);
    setViewingMoveIndex(null);
  }

  function resetScore() {
    setScore({ white: 0, black: 0 });
  }

  // Move history navigation
  function goToPreviousMove() {
    if (viewingMoveIndex === null) {
      // Start viewing from last move
      setViewingMoveIndex(game.moveHistory.length - 1);
    } else if (viewingMoveIndex > 0) {
      setViewingMoveIndex(viewingMoveIndex - 1);
    }
  }

  function goToNextMove() {
    if (viewingMoveIndex === null) return;
    
    if (viewingMoveIndex < game.moveHistory.length - 1) {
      setViewingMoveIndex(viewingMoveIndex + 1);
    } else {
      // Return to live view
      setViewingMoveIndex(null);
    }
  }

  function goToMove(index: number) {
    setViewingMoveIndex(index);
  }

  function returnToLive() {
    setViewingMoveIndex(null);
  }

  const whitePieces = [
    displayedGame.pieces.W_P,
    displayedGame.pieces.W_N,
    displayedGame.pieces.W_B,
    displayedGame.pieces.W_R,
  ];
  
  const blackPieces = [
    displayedGame.pieces.B_P,
    displayedGame.pieces.B_N,
    displayedGame.pieces.B_B,
    displayedGame.pieces.B_R,
  ];

  const phaseDisplay = phase === 'PLACEMENT_ONLY' 
    ? `Placement Phase (${game.ply}/6)` 
    : 'Movement Phase';

  const isInReplayMode = viewingMoveIndex !== null;

  return (
    <div className="game-wrapper">
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}
      
      {game.winner && showWinnerOverlay && (
        <div className="winner-overlay" onClick={() => setShowWinnerOverlay(false)}>
          <div className="winner-modal" onClick={(e) => e.stopPropagation()}>
            <div className="winner-icon">
              {game.winner === 'W' ? '⚪' : '⚫'}
            </div>
            <h1 className="winner-title">
              {game.winner === 'W' ? 'White' : 'Black'} Wins!
            </h1>
            <div className="winner-score">
              Score: {game.winner === 'W' ? score.white : score.black}
            </div>
            <button className="play-again-btn" onClick={reset}>
              New Game
            </button>
            <p className="click-hint">Click outside to view final position</p>
          </div>
        </div>
      )}

      <div className="game-layout">
        {/* Left Sidebar: Controls */}
        <aside className="left-sidebar">
          <div className="sidebar-section">
            <h3 className="sidebar-title">Game Mode</h3>
            <div className="mode-selector-vertical">
              <button 
                className={`mode-btn ${gameMode === 'local' ? 'active' : ''}`}
                onClick={() => {
                  setGameMode('local');
                  reset();
                }}
              >
                👥 2 Players
              </button>
              <button 
                className={`mode-btn ${gameMode === 'vs-bot' ? 'active' : ''}`}
                onClick={() => {
                  setGameMode('vs-bot');
                  reset();
                }}
              >
                🤖 vs Bot
              </button>
            </div>

            {gameMode === 'vs-bot' && (
              <div className="bot-controls-vertical">
                <label className="bot-control-label">
                  Difficulty:
                  <select 
                    className="difficulty-select"
                    value={botDifficulty} 
                    onChange={(e) => setBotDifficulty(e.target.value as BotDifficulty)}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="expert">Expert</option>
                  </select>
                </label>
                <label className="bot-control-label">
                  Bot plays as:
                  <select 
                    className="player-select"
                    value={botPlayer} 
                    onChange={(e) => {
                      setBotPlayer(e.target.value as Player);
                      reset();
                    }}
                  >
                    <option value="W">White</option>
                    <option value="B">Black</option>
                  </select>
                </label>
                {isBotThinking && <div className="bot-thinking">🤔 Thinking...</div>}
              </div>
            )}
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-title">Score</h3>
            <div className="score-tracker-vertical" title="Click to reset score" onClick={resetScore}>
              <div className="score-item-vertical">
                <span className="score-icon">⚪</span>
                <span className="score-label">White</span>
                <span className="score-value">{score.white}</span>
              </div>
              <div className="score-item-vertical">
                <span className="score-icon">⚫</span>
                <span className="score-label">Black</span>
                <span className="score-value">{score.black}</span>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-title">Status</h3>
            <div className="status-info">
              <div className="phase-indicator">{phaseDisplay}</div>
              {game.winner ? (
                <div className="winner-announcement">
                  🎉 {game.winner === 'W' ? 'White' : 'Black'} Wins!
                </div>
              ) : (
                <div className="current-turn">
                  Turn: {game.turn === 'W' ? '⚪ White' : '⚫ Black'}
                </div>
              )}
            </div>
            <button className="btn-primary btn-full" onClick={reset}>
              New Game
            </button>
          </div>
        </aside>

        {/* Center: Board Area */}
        <main className="board-area">
          {ui.lastError && (
            <div className="error-message">
              ⚠️ {ui.lastError}
            </div>
          )}

          <PlayerPanel
            player="W"
            pieces={whitePieces}
            isCurrentTurn={game.turn === 'W'}
            selectedPiece={selectedPiece}
            onPieceClick={onReservePieceClick}
            phase={phase}
            gameWinner={game.winner}
          />

          <div className="board-container">
            <div className={`board ${isInReplayMode ? 'replay-mode' : ''}`}>
              {displayedGame.board.map((cell, idx) => {
                const actionsHere = destinations[idx];
                const highlight = !isInReplayMode && actionsHere && actionsHere.length > 0;
                const isCapture = highlight && actionsHere.some((a) => a.kind === 'CAPTURE');
                const row = Math.floor(idx / 4);
                const col = idx % 4;

                return (
                  <button
                    key={idx}
                    onClick={() => !isInReplayMode && onSquareClick(idx)}
                    className={`square ${highlight ? 'highlighted' : ''} ${isCapture ? 'capture' : ''}`}
                    data-row={row}
                    data-col={col}
                    title={highlight ? actionsHere.map((a) => a.kind).join(', ') : ''}
                    disabled={isInReplayMode}
                  >
                    {cell && (
                      <div className={`board-piece player-${displayedGame.pieces[cell].owner.toLowerCase()}`}>
                        {getPieceSymbol(displayedGame.pieces[cell].type, displayedGame.pieces[cell].owner)}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <PlayerPanel
            player="B"
            pieces={blackPieces}
            isCurrentTurn={game.turn === 'B'}
            selectedPiece={selectedPiece}
            onPieceClick={onReservePieceClick}
            phase={phase}
            gameWinner={game.winner}
          />

          <div className="instructions">
            {selectedPiece ? (
              <p>
                ✓ <strong>{selectedPiece}</strong> selected - Click a highlighted square
                {' | '}
                <button className="link-button" onClick={() => dispatch({ type: 'CANCEL_SELECTION' })}>
                  Unselect
                </button>
              </p>
            ) : phase === 'PLACEMENT_ONLY' ? (
              <p>📍 Select a piece, then click an empty square</p>
            ) : (
              <p>🎯 Select a piece to place/move/capture</p>
            )}
          </div>
        </main>

        {/* Right Sidebar: History */}
        <aside className="right-sidebar">
          <MoveHistory 
            history={game.moveHistory}
            viewingMoveIndex={viewingMoveIndex}
            gameEnded={game.winner !== null}
            onNavigatePrevious={goToPreviousMove}
            onNavigateNext={goToNextMove}
            onGoToMove={goToMove}
            onReturnToLive={returnToLive}
          />
        </aside>
      </div>
    </div>
  );
}
