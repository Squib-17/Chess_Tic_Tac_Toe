import type { Phase, Player } from '../../../domain/game-engine/chess-ttt-engine';
import { getPlayerName } from '../utils/display';
import { Button } from './ui';

type GameStatusProps = {
  phase: Phase;
  ply: number;
  turn: Player;
  winner: Player | null;
  onReset: () => void;
};

export function GameStatus({ phase, ply, turn, winner, onReset }: GameStatusProps) {
  const phaseDisplay = phase === 'PLACEMENT_ONLY'
    ? `Place ${ply}/6`
    : 'Move';

  return (
    <section className="sidebar-section" aria-labelledby="status-title">
      <h3 className="sidebar-title" id="status-title">Status</h3>
      <div className="status-info" role="status" aria-live="polite">
        <div className="phase-indicator">{phaseDisplay}</div>
        {winner ? (
          <div className="winner-announcement">
            <span aria-hidden="true">🎉</span> {getPlayerName(winner)} Wins!
          </div>
        ) : (
          <div className="current-turn">
            Turn: <span aria-hidden="true">{turn === 'W' ? '⚪' : '⚫'}</span> {getPlayerName(turn)}
          </div>
        )}
      </div>
      <Button className="btn-full" onClick={onReset} variant="primary">
        New Game
      </Button>
    </section>
  );
}
