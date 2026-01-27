import type { MoveHistoryEntry, PieceType } from '../engine/chess-ttt-engine';

type MoveHistoryProps = {
  history: MoveHistoryEntry[];
  viewingMoveIndex: number | null;
  gameEnded: boolean;
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;
  onGoToMove: (index: number) => void;
  onReturnToLive: () => void;
};

function getPieceName(type: PieceType): string {
  const names = {
    P: 'Pawn',
    N: 'Knight',
    B: 'Bishop',
    R: 'Rook',
  };
  return names[type];
}

function getPieceSymbol(type: PieceType, owner: 'W' | 'B'): string {
  const symbols = {
    W: { P: '♙', N: '♘', B: '♗', R: '♖' },
    B: { P: '♟', N: '♞', B: '♝', R: '♜' },
  };
  return symbols[owner][type];
}

function positionToNotation(pos: number): string {
  const row = Math.floor(pos / 4);
  const col = pos % 4;
  const colLetter = String.fromCharCode(65 + col); // A, B, C, D
  const rowNumber = 4 - row; // 4, 3, 2, 1 (from top to bottom)
  return `${colLetter}${rowNumber}`;
}

function formatMove(entry: MoveHistoryEntry): string {
  const { action, fromPos, toPos, capturedPiece } = entry;
  const piece = action.pieceId;
  const owner = piece[0] as 'W' | 'B';
  const type = piece[2] as PieceType;
  const symbol = getPieceSymbol(type, owner);
  const pieceName = getPieceName(type);
  
  const toNotation = positionToNotation(toPos);

  switch (action.kind) {
    case 'PLACE':
      return `${symbol} ${pieceName} → ${toNotation}`;
    
    case 'RESPAWN':
      return `${symbol} ${pieceName} respawned → ${toNotation}`;
    
    case 'MOVE':
      if (fromPos !== undefined) {
        const fromNotation = positionToNotation(fromPos);
        return `${symbol} ${pieceName} ${fromNotation} → ${toNotation}`;
      }
      return `${symbol} ${pieceName} → ${toNotation}`;
    
    case 'CAPTURE':
      if (fromPos !== undefined && capturedPiece) {
        const fromNotation = positionToNotation(fromPos);
        const capturedType = capturedPiece[2] as PieceType;
        const capturedOwner = capturedPiece[0] as 'W' | 'B';
        const capturedSymbol = getPieceSymbol(capturedType, capturedOwner);
        return `${symbol} ${pieceName} ${fromNotation} × ${capturedSymbol} ${toNotation}`;
      }
      return `${symbol} ${pieceName} captures → ${toNotation}`;
    
    default:
      return `Move to ${toNotation}`;
  }
}

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
          <div
            key={index}
            className={`move-history-entry ${entry.player === 'W' ? 'white-move' : 'black-move'} ${
              viewingMoveIndex === index ? 'viewing' : ''
            } ${gameEnded ? 'clickable' : ''}`}
            onClick={() => gameEnded && onGoToMove(index)}
            title={gameEnded ? 'Click to view this position' : ''}
          >
            <span className="move-number">{entry.ply}.</span>
            <span className="move-player">
              {entry.player === 'W' ? '⚪' : '⚫'}
            </span>
            <span className="move-notation">{formatMove(entry)}</span>
          </div>
        ))}
      </div>

      {gameEnded && (
        <div className="move-history-controls">
          <button
            className="nav-btn"
            onClick={onNavigatePrevious}
            disabled={!canGoPrevious}
            title="Previous move"
          >
            ◀ Previous
          </button>
          {isViewingHistory && (
            <button
              className="nav-btn live-btn"
              onClick={onReturnToLive}
              title="Return to final position"
            >
              ⏭ Live
            </button>
          )}
          <button
            className="nav-btn"
            onClick={onNavigateNext}
            disabled={!canGoNext}
            title="Next move"
          >
            Next ▶
          </button>
        </div>
      )}
    </div>
  );
}
