import type {
  Action,
  GameState,
} from '../../../domain/game-engine/chess-ttt-engine';
import { positionToNotation } from '../../../domain/game-engine/chess-ttt-engine';
import { getPieceName, getPieceSymbol, getPlayerName } from '../utils/display';

type GameBoardProps = {
  displayedGame: GameState;
  destinations: Record<number, Action[]>;
  isInReplayMode: boolean;
  onSquareClick: (idx: number) => void;
};

export function GameBoard({
  displayedGame,
  destinations,
  isInReplayMode,
  onSquareClick,
}: GameBoardProps) {
  return (
    <div className="board-container">
      <div
        className={`board ${isInReplayMode ? 'replay-mode' : ''}`}
        role="grid"
        aria-label={isInReplayMode ? 'Chess Tic-Tac-Toe board in replay mode' : 'Chess Tic-Tac-Toe board'}
      >
        {displayedGame.board.map((cell, idx) => {
          const actionsHere = destinations[idx];
          const highlight = !isInReplayMode && actionsHere && actionsHere.length > 0;
          const isCapture = highlight && actionsHere.some((a) => a.kind === 'CAPTURE');
          const piece = cell ? displayedGame.pieces[cell] : null;
          const notation = positionToNotation(idx);
          const row = Math.floor(idx / 4);
          const col = idx % 4;
          const squareTone = (row + col) % 2 === 0 ? 'light-square' : 'dark-square';

          return (
            <button
              key={idx}
              onClick={() => onSquareClick(idx)}
              className={`square ${squareTone} ${highlight ? 'highlighted' : ''} ${isCapture ? 'capture' : ''}`}
              title={highlight ? actionsHere.map((a) => a.kind).join(', ') : notation}
              disabled={isInReplayMode}
              type="button"
              role="gridcell"
              aria-label={
                piece
                  ? `${notation}, ${getPlayerName(piece.owner)} ${getPieceName(piece.type)}${highlight ? ', legal destination' : ''}`
                  : `${notation}, empty${highlight ? `, legal ${isCapture ? 'capture' : 'move'} destination` : ''}`
              }
            >
              <span className="square-coordinate" aria-hidden="true">
                {notation}
              </span>
              {piece && (
                <span className={`board-piece player-${piece.owner.toLowerCase()}`} aria-hidden="true">
                  {getPieceSymbol(piece.type, piece.owner)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
