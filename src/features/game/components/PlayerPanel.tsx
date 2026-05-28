import type {
  Phase,
  Piece,
  PieceId,
  Player,
} from '../../../domain/game-engine/chess-ttt-engine';
import {
  getPieceName,
  getPieceSymbol,
  getPlayerName,
} from '../utils/display';

type PlayerPanelProps = {
  player: Player;
  pieces: Piece[];
  isCurrentTurn: boolean;
  selectedPiece: PieceId | null;
  onPieceClick: (pieceId: PieceId) => void;
  phase: Phase;
  gameWinner: Player | null;
};

export function PlayerPanel({
  player,
  pieces,
  isCurrentTurn,
  selectedPiece,
  onPieceClick,
  phase,
  gameWinner,
}: PlayerPanelProps) {
  const directionIndicator = player === 'W' ? 'down' : 'up';

  return (
    <section
      className={`player-panel player-${player.toLowerCase()} ${isCurrentTurn ? 'active' : ''}`}
      aria-label={`${getPlayerName(player)} player pieces`}
    >
      <div className="player-header">
        <h3>
          {getPlayerName(player)} Player
          <span aria-hidden="true">{player === 'W' ? '↓' : '↑'}</span>
        </h3>
        {isCurrentTurn && !gameWinner && <span className="turn-indicator">Your Turn</span>}
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
          const pieceName = getPieceName(p.type);

          return (
            <button
              key={p.id}
              className={`piece-card ${isSelected ? 'selected' : ''} ${isCaptured ? 'captured' : ''} ${isOnBoard ? 'on-board' : ''}`}
              onClick={() => onPieceClick(p.id)}
              disabled={isDisabled}
              type="button"
              aria-pressed={isSelected}
              aria-label={`${getPlayerName(player)} ${pieceName}, ${p.state.toLowerCase()}, moves ${directionIndicator}`}
              title={`${pieceName} - ${p.state}`}
            >
              <span className="piece-symbol" aria-hidden="true">
                {getPieceSymbol(p.type, player)}
              </span>
              <span className="piece-name">{pieceName}</span>
              <span className="piece-state" aria-hidden="true">
                {isOnBoard ? '●' : isCaptured ? '✕' : '○'}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
