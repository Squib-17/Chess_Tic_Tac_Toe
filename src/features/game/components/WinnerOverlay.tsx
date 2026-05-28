import { useEffect, useRef } from 'react';
import type { Player } from '../../../domain/game-engine/chess-ttt-engine';
import { getPlayerName } from '../utils/display';
import { Button } from './ui';

type WinnerOverlayProps = {
  winner: Player;
  winnerScore: number;
  onClose: () => void;
  onNewGame: () => void;
};

export function WinnerOverlay({
  winner,
  winnerScore,
  onClose,
  onNewGame,
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
          {winner === 'W' ? '⚪' : '⚫'}
        </div>
        <h1 className="winner-title" id="winner-title">
          {getPlayerName(winner)} Wins!
        </h1>
        <div className="winner-score" id="winner-summary">
          Score: {winnerScore}
        </div>
        <Button
          className="play-again-btn"
          onClick={onNewGame}
          ref={newGameButtonRef}
          variant="primary"
          size="lg"
        >
          New Game
        </Button>
        <Button className="link-button modal-close" onClick={onClose} variant="ghost">
          View final position
        </Button>
      </div>
    </div>
  );
}
