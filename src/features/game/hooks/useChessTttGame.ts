import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { BotDifficulty } from '../../ai/types';
import { getBotMove } from '../../ai/bot-controller';
import type {
  Action,
  GameState,
  PieceId,
  Player,
} from '../../../domain/game-engine/chess-ttt-engine';
import {
  applyAction,
  getDestinationsForPiece,
  getInitialState,
  getPhase,
} from '../../../domain/game-engine/chess-ttt-engine';
import {
  initialUIState,
  uiReducer,
} from './ui-selection';
import { useMultiplayerRoom } from './useMultiplayerRoom';

export type GameMode = 'local' | 'vs-bot' | 'online';

export function useChessTttGame() {
  const [localGame, setLocalGame] = useState<GameState>(() => getInitialState('W'));
  const [score, setScore] = useState({ white: 0, black: 0 });
  const [showConfetti, setShowConfetti] = useState(false);
  const [showWinnerOverlay, setShowWinnerOverlay] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>('local');
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('medium');
  const [botPlayer, setBotPlayer] = useState<Player>('B');
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [viewingMoveIndex, setViewingMoveIndex] = useState<number | null>(null);
  const [ui, dispatch] = useReducer(uiReducer, initialUIState);
  const multiplayer = useMultiplayerRoom();

  const botTurnTokenRef = useRef(0);
  const game = gameMode === 'online' && multiplayer.session ? multiplayer.session.game : localGame;
  const phase = getPhase(game.ply);
  const isInReplayMode = viewingMoveIndex !== null;
  const selectedPiece: PieceId | null = ui.selectedReserve ?? ui.selectedFrom;

  const recordWinner = useCallback((next: GameState, previousWinner: Player | null) => {
    if (!next.winner || next.winner === previousWinner) return;

    setScore((prev) => ({
      white: prev.white + (next.winner === 'W' ? 1 : 0),
      black: prev.black + (next.winner === 'B' ? 1 : 0),
    }));
    setShowConfetti(true);
    setShowWinnerOverlay(true);
  }, []);

  const displayedGame = useMemo(() => {
    if (viewingMoveIndex === null || !game.winner) {
      return game;
    }

    let state = getInitialState('W');
    for (let i = 0; i <= viewingMoveIndex && i < game.moveHistory.length; i++) {
      state = applyAction(state, game.moveHistory[i].action);
    }
    return state;
  }, [game, viewingMoveIndex]);

  const destinations = useMemo(() => {
    if (!selectedPiece || viewingMoveIndex !== null) return {};
    return getDestinationsForPiece(game, selectedPiece);
  }, [game, selectedPiece, viewingMoveIndex]);

  const reset = useCallback(() => {
    botTurnTokenRef.current += 1;
    setLocalGame(getInitialState('W'));
    if (gameMode === 'online') {
      multiplayer.leaveRoom();
    }
    dispatch({ type: 'CLEAR_SELECTIONS' });
    setIsBotThinking(false);
    setShowWinnerOverlay(false);
    setShowConfetti(false);
    setViewingMoveIndex(null);
  }, [gameMode, multiplayer]);

  useEffect(() => {
    if (gameMode !== 'vs-bot' || localGame.turn !== botPlayer || localGame.winner || isBotThinking) {
      return;
    }

    const token = botTurnTokenRef.current + 1;
    botTurnTokenRef.current = token;
    void Promise.resolve().then(() => {
      if (botTurnTokenRef.current === token) {
        setIsBotThinking(true);
      }
    });
    dispatch({ type: 'CLEAR_SELECTIONS' });

    getBotMove(localGame, botDifficulty)
      .then((action) => {
        if (botTurnTokenRef.current !== token || !action) return;
        if (localGame.winner || localGame.turn !== botPlayer) return;

        const next = applyAction(localGame, action);
        setLocalGame(next);
        recordWinner(next, localGame.winner);
      })
      .catch((error: unknown) => {
        console.error('Bot move failed:', error);
      })
      .finally(() => {
        if (botTurnTokenRef.current === token) {
          setIsBotThinking(false);
        }
      });
  }, [localGame, gameMode, botPlayer, botDifficulty, isBotThinking, recordWinner]);

  const submitAction = useCallback((action: Action) => {
    try {
      if (gameMode === 'online') {
        const sent = multiplayer.submitNetworkAction(action);
        if (!sent) return;
      } else {
        const next = applyAction(localGame, action);
        setLocalGame(next);
        recordWinner(next, localGame.winner);
      }
      dispatch({ type: 'CLEAR_SELECTIONS' });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Invalid action';
      dispatch({ type: 'SET_ERROR', msg: message });
    }
  }, [gameMode, localGame, multiplayer, recordWinner]);

  const onSquareClick = useCallback((idx: number) => {
    if (game.winner || isInReplayMode) return;
    if (gameMode === 'vs-bot' && game.turn === botPlayer) return;
    if (gameMode === 'online' && game.turn !== multiplayer.role) return;

    const occ = game.board[idx];

    if (!selectedPiece) {
      if (occ && game.pieces[occ].owner === game.turn && phase === 'HYBRID') {
        dispatch({ type: 'SELECT_BOARD_PIECE', pieceId: occ });
      }
      return;
    }

    if (occ && occ === selectedPiece) {
      dispatch({ type: 'CANCEL_SELECTION' });
      return;
    }

    if (phase === 'PLACEMENT_ONLY' && occ !== null) {
      dispatch({
        type: 'SET_ERROR',
        msg: 'During placement phase, you can only place pieces on empty squares.',
      });
      return;
    }

    const actionsHere = destinations[idx];
    if (!actionsHere || actionsHere.length === 0) {
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

    submitAction(actionsHere.find((a) => a.kind === 'CAPTURE') ?? actionsHere[0]);
  }, [
    botPlayer,
    destinations,
    game,
    gameMode,
    isInReplayMode,
    phase,
    selectedPiece,
    multiplayer.role,
    submitAction,
  ]);

  const onReservePieceClick = useCallback((pieceId: PieceId) => {
    if (game.winner || isInReplayMode) return;
    if (gameMode === 'vs-bot' && game.turn === botPlayer) return;
    if (gameMode === 'online' && game.turn !== multiplayer.role) return;

    const p = game.pieces[pieceId];
    if (p.owner !== game.turn) return;

    if (selectedPiece === pieceId) {
      dispatch({ type: 'CANCEL_SELECTION' });
      return;
    }

    if (phase === 'PLACEMENT_ONLY') {
      if (p.state !== 'UNPLACED') return;
      dispatch({ type: 'SELECT_RESERVE', pieceId });
      return;
    }

    if (p.state === 'UNPLACED' || p.state === 'CAPTURED') {
      dispatch({ type: 'SELECT_RESERVE', pieceId });
    }
  }, [botPlayer, game, gameMode, isInReplayMode, multiplayer.role, phase, selectedPiece]);

  return {
    botDifficulty,
    botPlayer,
    destinations,
    dispatch,
    displayedGame,
    game,
    gameMode,
    isBotThinking,
    isInReplayMode,
    multiplayer,
    onReservePieceClick,
    onSquareClick,
    phase,
    reset,
    resetScore: () => setScore({ white: 0, black: 0 }),
    score,
    selectedPiece,
    setBotDifficulty,
    setBotPlayer: (player: Player) => {
      setBotPlayer(player);
      reset();
    },
    setGameMode: (mode: GameMode) => {
      setGameMode(mode);
      botTurnTokenRef.current += 1;
      setLocalGame(getInitialState('W'));
      dispatch({ type: 'CLEAR_SELECTIONS' });
      setIsBotThinking(false);
      setShowWinnerOverlay(false);
      setShowConfetti(false);
      setViewingMoveIndex(null);
      if (gameMode === 'online' && mode !== 'online') {
        multiplayer.leaveRoom();
      }
    },
    setShowWinnerOverlay,
    showConfetti,
    showWinnerOverlay,
    ui,
    viewingMoveIndex,
    goToPreviousMove: () => {
      if (viewingMoveIndex === null) {
        setViewingMoveIndex(game.moveHistory.length - 1);
      } else if (viewingMoveIndex > 0) {
        setViewingMoveIndex(viewingMoveIndex - 1);
      }
    },
    goToNextMove: () => {
      if (viewingMoveIndex === null) return;
      if (viewingMoveIndex < game.moveHistory.length - 1) {
        setViewingMoveIndex(viewingMoveIndex + 1);
      } else {
        setViewingMoveIndex(null);
      }
    },
    goToMove: setViewingMoveIndex,
    returnToLive: () => setViewingMoveIndex(null),
  };
}
