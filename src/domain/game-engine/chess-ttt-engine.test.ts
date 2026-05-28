import { describe, expect, it } from 'vitest';
import type { Action, GameState, PieceId } from './chess-ttt-engine';
import {
  applyAction,
  generateLegalActions,
  getInitialState,
  getPhase,
} from './chess-ttt-engine';

function play(state: GameState, actions: Action[]): GameState {
  return actions.reduce((current, action) => applyAction(current, action), state);
}

function forceHybrid(state: GameState, turn = state.turn): GameState {
  return { ...state, ply: 7, turn };
}

describe('chess tic-tac-toe engine', () => {
  it('keeps placement phase for six plies, then enters hybrid phase', () => {
    let state = getInitialState('W');
    expect(getPhase(state.ply)).toBe('PLACEMENT_ONLY');

    state = play(state, [
      { kind: 'PLACE', pieceId: 'W_P', to: 0 },
      { kind: 'PLACE', pieceId: 'B_P', to: 4 },
      { kind: 'PLACE', pieceId: 'W_N', to: 1 },
      { kind: 'PLACE', pieceId: 'B_N', to: 5 },
      { kind: 'PLACE', pieceId: 'W_B', to: 2 },
      { kind: 'PLACE', pieceId: 'B_B', to: 6 },
    ]);

    expect(state.ply).toBe(7);
    expect(getPhase(state.ply)).toBe('HYBRID');
    expect(generateLegalActions(state).some((action) => action.kind !== 'PLACE')).toBe(true);
  });

  it('captures and respawns pieces with state and board updates', () => {
    let state = forceHybrid(getInitialState('W'));
    state = applyAction(state, { kind: 'PLACE', pieceId: 'W_R', to: 0 });
    state = forceHybrid(state, 'B');
    state = applyAction(state, { kind: 'PLACE', pieceId: 'B_N', to: 3 });
    state = forceHybrid(state, 'W');

    state = applyAction(state, {
      kind: 'CAPTURE',
      pieceId: 'W_R',
      to: 3,
      capturedId: 'B_N',
    });

    expect(state.board[3]).toBe('W_R');
    expect(state.pieces.B_N.state).toBe('CAPTURED');
    expect(state.pieces.B_N.pos).toBeNull();

    state = forceHybrid(state, 'B');
    state = applyAction(state, { kind: 'RESPAWN', pieceId: 'B_N', to: 4 });

    expect(state.board[4]).toBe('B_N');
    expect(state.pieces.B_N.state).toBe('ON_BOARD');
  });

  it('reverses pawns at the far edge and resets direction on respawn', () => {
    let state = forceHybrid(getInitialState('W'));
    state = applyAction(state, { kind: 'PLACE', pieceId: 'W_P', to: 10 });
    state = forceHybrid(state, 'W');
    state = applyAction(state, { kind: 'MOVE', pieceId: 'W_P', to: 14 });

    expect(state.pieces.W_P.pawnReversed).toBe(true);

    state = forceHybrid(state, 'B');
    state = applyAction(state, { kind: 'PLACE', pieceId: 'B_R', to: 15 });
    state = forceHybrid(state, 'B');
    state = applyAction(state, {
      kind: 'CAPTURE',
      pieceId: 'B_R',
      to: 14,
      capturedId: 'W_P',
    });

    state = forceHybrid(state, 'W');
    state = applyAction(state, { kind: 'RESPAWN', pieceId: 'W_P', to: 0 });

    expect(state.pieces.W_P.pawnDir).toBe('DOWN');
    expect(state.pieces.W_P.pawnReversed).toBe(false);
  });

  it('detects a four-in-a-row win immediately after placement', () => {
    const state = play(getInitialState('W'), [
      { kind: 'PLACE', pieceId: 'W_P', to: 0 },
      { kind: 'PLACE', pieceId: 'B_P', to: 4 },
      { kind: 'PLACE', pieceId: 'W_N', to: 1 },
      { kind: 'PLACE', pieceId: 'B_N', to: 5 },
      { kind: 'PLACE', pieceId: 'W_B', to: 2 },
      { kind: 'PLACE', pieceId: 'B_B', to: 6 },
      { kind: 'PLACE', pieceId: 'W_R', to: 3 },
    ]);

    expect(state.winner).toBe('W');
  });

  it('rejects illegal movement during placement', () => {
    const state = applyAction(getInitialState('W'), { kind: 'PLACE', pieceId: 'W_P', to: 0 });

    expect(() => applyAction(state, { kind: 'MOVE', pieceId: 'B_P', to: 4 })).toThrow(
      'During moves 1–6, only placement is allowed',
    );
  });

  it('returns no legal actions after the game has a winner', () => {
    const state: GameState = {
      ...getInitialState('W'),
      winner: 'B',
    };

    expect(generateLegalActions(state)).toEqual([]);
  });

  it('uses stable piece ids in move history', () => {
    const state = applyAction(getInitialState('W'), { kind: 'PLACE', pieceId: 'W_P', to: 0 });
    const movedPiece: PieceId = state.moveHistory[0].action.pieceId;

    expect(movedPiece).toBe('W_P');
    expect(state.moveHistory[0].toPos).toBe(0);
  });
});
