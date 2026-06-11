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
  declareDraw,
  getDestinationsForPiece,
  getInitialState,
  getPhase,
  isGameOver,
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
  // Track which online round's winner overlay the user has dismissed
  const [dismissedOnlineRound, setDismissedOnlineRound] = useState(-1);
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('medium');
  const [botPlayer, setBotPlayer] = useState<Player>('B');
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [viewingMoveIndex, setViewingMoveIndex] = useState<number | null>(null);
  const [localDrawOfferedBy, setLocalDrawOfferedBy] = useState<Player | null>(null);
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

  const recordDraw = useCallback((next: GameState, previousIsDraw: boolean) => {
    if (!next.isDraw || previousIsDraw) return;
    setShowWinnerOverlay(true);
  }, []);

  const displayedGame = useMemo(() => {
    if (viewingMoveIndex === null || !isGameOver(game)) {
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
    setLocalDrawOfferedBy(null);
  }, [gameMode, multiplayer]);

  useEffect(() => {
    if (gameMode !== 'vs-bot' || localGame.turn !== botPlayer || isGameOver(localGame) || isBotThinking) {
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
        if (isGameOver(localGame) || localGame.turn !== botPlayer) return;

        const next = applyAction(localGame, action);
        setLocalGame(next);
        recordWinner(next, localGame.winner);
        recordDraw(next, localGame.isDraw);
      })
      .catch((error: unknown) => {
        console.error('Bot move failed:', error);
      })
      .finally(() => {
        if (botTurnTokenRef.current === token) {
          setIsBotThinking(false);
        }
      });
  }, [localGame, gameMode, botPlayer, botDifficulty, isBotThinking, recordWinner, recordDraw]);

  const submitAction = useCallback((action: Action) => {
    try {
      if (gameMode === 'online') {
        const sent = multiplayer.submitNetworkAction(action);
        if (!sent) return;
      } else {
        const next = applyAction(localGame, action);
        setLocalGame(next);
        recordWinner(next, localGame.winner);
        recordDraw(next, localGame.isDraw);
      }
      dispatch({ type: 'CLEAR_SELECTIONS' });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Invalid action';
      dispatch({ type: 'SET_ERROR', msg: message });
    }
  }, [gameMode, localGame, multiplayer, recordWinner, recordDraw]);

  const finalizeLocalDraw = useCallback(() => {
    setLocalGame((prev) => {
      const next = declareDraw(prev);
      recordDraw(next, prev.isDraw);
      return next;
    });
    setLocalDrawOfferedBy(null);
  }, [recordDraw]);

  const drawOfferedBy = gameMode === 'online'
    ? (multiplayer.session?.drawOfferedBy ?? null)
    : localDrawOfferedBy;

  const offerDraw = useCallback(() => {
    if (isGameOver(game)) return;

    if (gameMode === 'online') {
      if (multiplayer.role !== 'W' && multiplayer.role !== 'B') return;
      multiplayer.offerDraw();
      return;
    }

    if (gameMode === 'vs-bot') {
      finalizeLocalDraw();
      return;
    }

    if (localDrawOfferedBy) return;
    setLocalDrawOfferedBy(game.turn);
  }, [game, gameMode, finalizeLocalDraw, localDrawOfferedBy, multiplayer]);

  const acceptDraw = useCallback(() => {
    if (gameMode === 'online') {
      multiplayer.acceptDraw();
      return;
    }

    if (!localDrawOfferedBy) return;
    finalizeLocalDraw();
  }, [finalizeLocalDraw, gameMode, localDrawOfferedBy, multiplayer]);

  const declineDraw = useCallback(() => {
    if (gameMode === 'online') {
      multiplayer.declineDraw();
      return;
    }

    setLocalDrawOfferedBy(null);
  }, [gameMode, multiplayer]);

  const onSquareClick = useCallback((idx: number) => {
    if (isGameOver(game) || isInReplayMode) return;
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
    if (isGameOver(game) || isInReplayMode) return;
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

  // For online mode: derive overlay visibility from session state rather than local state,
  // so the winner overlay appears when the server confirms a winner.
  const onlineRound = multiplayer.session?.round ?? 0;
  const onlineWinner = gameMode === 'online' ? (multiplayer.session?.game.winner ?? null) : null;
  const onlineIsDraw = gameMode === 'online' ? (multiplayer.session?.game.isDraw ?? false) : false;
  const onlineGameEnded = onlineWinner !== null || onlineIsDraw;
  const effectiveShowWinnerOverlay = gameMode === 'online'
    ? (onlineGameEnded && dismissedOnlineRound !== onlineRound)
    : showWinnerOverlay;
  const effectiveShowConfetti = gameMode === 'online'
    ? (onlineWinner !== null && dismissedOnlineRound !== onlineRound)
    : showConfetti;

  const requestRematch = useCallback(() => {
    multiplayer.requestRematch();
    dispatch({ type: 'CLEAR_SELECTIONS' });
    setViewingMoveIndex(null);
  }, [multiplayer]);

  return {
    acceptDraw,
    botDifficulty,
    botPlayer,
    declineDraw,
    destinations,
    dispatch,
    displayedGame,
    drawOfferedBy,
    game,
    gameMode,
    isBotThinking,
    isInReplayMode,
    multiplayer,
    offerDraw,
    onReservePieceClick,
    onSquareClick,
    phase,
    requestRematch,
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
      setLocalDrawOfferedBy(null);
      if (gameMode === 'online' && mode !== 'online') {
        multiplayer.leaveRoom();
      }
    },
    setShowWinnerOverlay: (show: boolean) => {
      if (gameMode === 'online') {
        if (!show) setDismissedOnlineRound(onlineRound);
      } else {
        setShowWinnerOverlay(show);
      }
    },
    showConfetti: effectiveShowConfetti,
    showWinnerOverlay: effectiveShowWinnerOverlay,
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
