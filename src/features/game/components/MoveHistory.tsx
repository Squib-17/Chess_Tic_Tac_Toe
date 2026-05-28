import type { MoveHistoryEntry } from '../../../domain/game-engine/chess-ttt-engine';
import { formatMove } from '../utils/display';
import { Button } from './ui';

type MoveHistoryProps = {
  history: MoveHistoryEntry[];
  viewingMoveIndex: number | null;
  gameEnded: boolean;
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;
  onGoToMove: (index: number) => void;
  onReturnToLive: () => void;
};

export function MoveHistory({ 
  history, 
  viewingMoveIndex, 
  gameEnded,
  onNavigatePrevious,
  onNavigateNext,
  onGoToMove,
  onReturnToLive,
}: MoveHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="move-history">
        <h3 className="move-history-title">Move History</h3>
        <div className="move-history-empty">No moves yet</div>
      </div>
    );
  }

  const isViewingHistory = viewingMoveIndex !== null;
  const canGoPrevious = viewingMoveIndex === null || viewingMoveIndex > 0;
  const canGoNext = viewingMoveIndex !== null && viewingMoveIndex < history.length - 1;

  return (
    <div className="move-history">
      <h3 className="move-history-title">
        Move History ({history.length} moves)
        {isViewingHistory && (
          <span className="viewing-indicator">
            {' '}📍 Viewing move {(viewingMoveIndex ?? 0) + 1}
          </span>
        )}
      </h3>
      <div className="move-history-list">
        {history.map((entry, index) => (
          <button
            key={index}
            className={`move-history-entry ${entry.player === 'W' ? 'white-move' : 'black-move'} ${
              viewingMoveIndex === index ? 'viewing' : ''
            } ${gameEnded ? 'clickable' : ''}`}
            onClick={() => gameEnded && onGoToMove(index)}
            disabled={!gameEnded}
            type="button"
            title={gameEnded ? 'Click to view this position' : ''}
            aria-current={viewingMoveIndex === index ? 'step' : undefined}
            aria-label={`Move ${entry.ply}: ${formatMove(entry)}`}
          >
            <span className="move-number">{entry.ply}.</span>
            <span className="move-player" aria-hidden="true">
              {entry.player === 'W' ? '⚪' : '⚫'}
            </span>
            <span className="move-notation">{formatMove(entry)}</span>
          </button>
        ))}
      </div>

      {gameEnded && (
        <div className="move-history-controls">
          <Button
            className="nav-btn"
            onClick={onNavigatePrevious}
            disabled={!canGoPrevious}
            title="Previous move"
            variant="secondary"
            size="sm"
          >
            ◀ Previous
          </Button>
          {isViewingHistory && (
            <Button
              className="nav-btn live-btn"
              onClick={onReturnToLive}
              title="Return to final position"
              variant="primary"
              size="sm"
            >
              ⏭ Live
            </Button>
          )}
          <Button
            className="nav-btn"
            onClick={onNavigateNext}
            disabled={!canGoNext}
            title="Next move"
            variant="secondary"
            size="sm"
          >
            Next ▶
          </Button>
        </div>
      )}
    </div>
  );
}
