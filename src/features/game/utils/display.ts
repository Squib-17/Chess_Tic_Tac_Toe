import type {
  MoveHistoryEntry,
  PieceId,
  PieceType,
  Player,
} from '../../../domain/game-engine/chess-ttt-engine';
import { positionToNotation } from '../../../domain/game-engine/chess-ttt-engine';

export function getPieceSymbol(type: PieceType, owner: Player): string {
  const symbols = {
    W: { P: '♙', N: '♘', B: '♗', R: '♖' },
    B: { P: '♟', N: '♞', B: '♝', R: '♜' },
  };

  return symbols[owner][type];
}

export function getPieceName(type: PieceType): string {
  const names = { P: 'Pawn', N: 'Knight', B: 'Bishop', R: 'Rook' };
  return names[type];
}

export function getPlayerName(player: Player): string {
  return player === 'W' ? 'White' : 'Black';
}

export function getPieceTypeFromId(pieceId: PieceId): PieceType {
  return pieceId[2] as PieceType;
}

export function getPlayerFromPieceId(pieceId: PieceId): Player {
  return pieceId[0] as Player;
}

export function formatMove(entry: MoveHistoryEntry): string {
  const { action, fromPos, toPos, capturedPiece } = entry;
  const owner = getPlayerFromPieceId(action.pieceId);
  const type = getPieceTypeFromId(action.pieceId);
  const symbol = getPieceSymbol(type, owner);
  const pieceName = getPieceName(type);
  const toNotation = positionToNotation(toPos);

  switch (action.kind) {
    case 'PLACE':
      return `${symbol} ${pieceName} -> ${toNotation}`;
    case 'RESPAWN':
      return `${symbol} ${pieceName} respawned -> ${toNotation}`;
    case 'MOVE':
      if (fromPos !== undefined) {
        return `${symbol} ${pieceName} ${positionToNotation(fromPos)} -> ${toNotation}`;
      }
      return `${symbol} ${pieceName} -> ${toNotation}`;
    case 'CAPTURE':
      if (fromPos !== undefined && capturedPiece) {
        const capturedType = getPieceTypeFromId(capturedPiece);
        const capturedOwner = getPlayerFromPieceId(capturedPiece);
        const capturedSymbol = getPieceSymbol(capturedType, capturedOwner);
        return `${symbol} ${pieceName} ${positionToNotation(fromPos)} x ${capturedSymbol} ${toNotation}`;
      }
      return `${symbol} ${pieceName} captures -> ${toNotation}`;
  }
}
