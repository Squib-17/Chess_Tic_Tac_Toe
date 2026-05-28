import { describe, expect, it } from 'vitest';
import type { Action, GameState } from '../../domain/game-engine/chess-ttt-engine';
import {
  applyAction,
  generateLegalActions,
  getInitialState,
} from '../../domain/game-engine/chess-ttt-engine';
import type { BotDifficulty } from './types';
import { getBotMoveSync } from './bot-controller';

function play(state: GameState, actions: Action[]): GameState {
  return actions.reduce((current, action) => applyAction(current, action), state);
}

function expectLegal(state: GameState, action: Action | null) {
  expect(action).not.toBeNull();
  expect(generateLegalActions(state)).toContainEqual(action);
}

describe('bot controller', () => {
  it.each<BotDifficulty>(['easy', 'medium', 'hard', 'expert'])(
    'returns a legal move for %s difficulty',
    (difficulty) => {
      const state = getInitialState('W');
      expectLegal(state, getBotMoveSync(state, difficulty));
    },
  );

  it('chooses an immediate winning move when available', () => {
    const state = play(getInitialState('W'), [
      { kind: 'PLACE', pieceId: 'W_P', to: 0 },
      { kind: 'PLACE', pieceId: 'B_P', to: 4 },
      { kind: 'PLACE', pieceId: 'W_N', to: 1 },
      { kind: 'PLACE', pieceId: 'B_N', to: 5 },
      { kind: 'PLACE', pieceId: 'W_B', to: 2 },
      { kind: 'PLACE', pieceId: 'B_B', to: 6 },
    ]);

    expect(getBotMoveSync(state, 'medium')).toEqual({
      kind: 'PLACE',
      pieceId: 'W_R',
      to: 3,
    });
  });

  it('blocks the opponent immediate win in medium mode', () => {
    const state = play(getInitialState('W'), [
      { kind: 'PLACE', pieceId: 'W_P', to: 0 },
      { kind: 'PLACE', pieceId: 'B_P', to: 4 },
      { kind: 'PLACE', pieceId: 'W_N', to: 1 },
      { kind: 'PLACE', pieceId: 'B_N', to: 5 },
      { kind: 'PLACE', pieceId: 'W_B', to: 12 },
      { kind: 'PLACE', pieceId: 'B_B', to: 6 },
    ]);

    expect(getBotMoveSync(state, 'medium')).toEqual({
      kind: 'PLACE',
      pieceId: 'W_R',
      to: 7,
    });
  });

  it('returns null when asked to move after the game is over', () => {
    const state: GameState = {
      ...getInitialState('W'),
      winner: 'W',
    };

    expect(getBotMoveSync(state, 'expert')).toBeNull();
  });
});
