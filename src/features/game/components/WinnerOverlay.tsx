import { useEffect, useRef } from 'react';
import type { Player } from '../../../domain/game-engine/chess-ttt-engine';
import { getPlayerName } from '../utils/display';
import { Button } from './ui';

type WinnerOverlayProps = {
  winner: Player | null;
  isDraw?: boolean;
  winnerScore?: number;
  onClose: () => void;
  onNewGame: () => void;
  onRematch?: () => void;
};

export function WinnerOverlay({
  winner,
  isDraw = false,
  winnerScore,
  onClose,
  onNewGame,
  onRematch,
}: WinnerOverlayProps) {
  const newGameButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    newGameButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const title = isDraw ? 'Draw' : `${getPlayerName(winner!)} Wins!`;
  const summary = isDraw
    ? 'Both players agreed to a draw.'
    : `Score: ${winnerScore ?? 0}`;

  return (
    <div className="winner-overlay" onClick={onClose}>
      <div
        className="winner-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="winner-title"
        aria-describedby="winner-summary"
      >
        <div className="winner-icon" aria-hidden="true">
          {isDraw ? '🤝' : winner === 'W' ? '⚪' : '⚫'}
        </div>
        <h1 className="winner-title" id="winner-title">
          {title}
        </h1>
        <div className="winner-score" id="winner-summary">
          {summary}
        </div>
        {onRematch ? (
          <Button
            className="play-again-btn"
            onClick={onRematch}
            ref={newGameButtonRef}
            variant="primary"
            size="lg"
          >
            Rematch
          </Button>
        ) : (
          <Button
            className="play-again-btn"
            onClick={onNewGame}
            ref={newGameButtonRef}
            variant="primary"
            size="lg"
          >
            New Game
          </Button>
        )}
        <Button className="link-button modal-close" onClick={onClose} variant="ghost">
          View final position
        </Button>
      </div>
    </div>
  );
}
