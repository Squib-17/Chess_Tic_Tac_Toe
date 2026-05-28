import type { PieceId } from '../../../domain/game-engine/chess-ttt-engine';

export type UIState = {
  selectedReserve: PieceId | null;
  selectedFrom: PieceId | null;
  lastError: string | null;
};

export type UIEvent =
  | { type: 'SELECT_RESERVE'; pieceId: PieceId }
  | { type: 'SELECT_BOARD_PIECE'; pieceId: PieceId }
  | { type: 'CANCEL_SELECTION' }
  | { type: 'SET_ERROR'; msg: string }
  | { type: 'CLEAR_SELECTIONS' };

export const initialUIState: UIState = {
  selectedReserve: null,
  selectedFrom: null,
  lastError: null,
};

export function uiReducer(state: UIState, ev: UIEvent): UIState {
  switch (ev.type) {
    case 'SELECT_RESERVE':
      return {
        selectedReserve: ev.pieceId,
        selectedFrom: null,
        lastError: null,
      };
    case 'SELECT_BOARD_PIECE':
      return {
        selectedFrom: ev.pieceId,
        selectedReserve: null,
        lastError: null,
      };
    case 'CANCEL_SELECTION':
    case 'CLEAR_SELECTIONS':
      return initialUIState;
    case 'SET_ERROR':
      return { ...state, lastError: ev.msg };
  }
}
