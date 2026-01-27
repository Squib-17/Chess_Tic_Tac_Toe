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
  const [ui, dispatch] = useReducer(uiReducer, {
    selectedReserve: null,
    selectedFrom: null,
    lastError: null,
  });

  const phase = getPhase(game.ply);

  const selectedPiece: PieceId | null = ui.selectedReserve ?? ui.selectedFrom;

  const destinations = useMemo(() => {
    if (!selectedPiece) return {};
    return getDestinationsForPiece(game, selectedPiece);
  }, [game, selectedPiece]);

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
  }

  function resetScore() {
    setScore({ white: 0, black: 0 });
  }

  const whitePieces = [
    game.pieces.W_P,
    game.pieces.W_N,
    game.pieces.W_B,
    game.pieces.W_R,
  ];
  
  const blackPieces = [
    game.pieces.B_P,
    game.pieces.B_N,
    game.pieces.B_B,
    game.pieces.B_R,
  ];

  const phaseDisplay = phase === 'PLACEMENT_ONLY' 
    ? `Placement Phase (${game.ply}/6)` 
    : 'Movement Phase';

  return (
    <div className="game-container">
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

      <div className="status-bar">
        <div className="game-info">
          <div className="phase-indicator">{phaseDisplay}</div>
          {game.winner ? (
            <div className="winner-announcement">
              🎉 {game.winner === 'W' ? 'White' : 'Black'} Wins!
            </div>
          ) : (
            <div className="current-turn">
              Turn: {game.turn === 'W' ? 'White' : 'Black'}
            </div>
          )}
        </div>
        <div className="score-and-controls">
          <div className="score-tracker" title="Click to reset score" onClick={resetScore} style={{ cursor: 'pointer' }}>
            <div className="score-item">
              <span className="score-label">⚪ White</span>
              <span className="score-value">{score.white}</span>
            </div>
            <div className="score-divider">-</div>
            <div className="score-item">
              <span className="score-label">⚫ Black</span>
              <span className="score-value">{score.black}</span>
            </div>
          </div>
          <button className="btn-primary" onClick={reset}>
            New Game
          </button>
        </div>
      </div>

      <div className="game-mode-controls">
        <div className="mode-selector">
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
          <div className="bot-controls">
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
            {isBotThinking && <div className="bot-thinking">🤔 Bot is thinking...</div>}
          </div>
        )}
      </div>

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
        <div className="board">
          {game.board.map((cell, idx) => {
            const actionsHere = destinations[idx];
            const highlight = actionsHere && actionsHere.length > 0;
            const isCapture = highlight && actionsHere.some((a) => a.kind === 'CAPTURE');
            const row = Math.floor(idx / 4);
            const col = idx % 4;

            return (
              <button
                key={idx}
                onClick={() => onSquareClick(idx)}
                className={`square ${highlight ? 'highlighted' : ''} ${isCapture ? 'capture' : ''}`}
                data-row={row}
                data-col={col}
                title={highlight ? actionsHere.map((a) => a.kind).join(', ') : ''}
              >
                {cell && (
                  <div className={`board-piece player-${game.pieces[cell].owner.toLowerCase()}`}>
                    {getPieceSymbol(game.pieces[cell].type, game.pieces[cell].owner)}
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
            ✓ <strong>{selectedPiece}</strong> selected - Click a highlighted square to place/move
            {' | '}
            <button className="link-button" onClick={() => dispatch({ type: 'CANCEL_SELECTION' })}>
              Click here or the same piece to unselect
            </button>
          </p>
        ) : phase === 'PLACEMENT_ONLY' ? (
          <p>📍 Select a piece above, then click an empty square to place it</p>
        ) : (
          <p>🎯 Select a piece to place/respawn, or click a piece on the board to move/capture</p>
        )}
      </div>
    </div>
  );
}
