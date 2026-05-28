import { describe, expect, it } from 'vitest';
import {
  applySessionAction,
  createSession,
  joinSession,
  markClientDisconnected,
  toPublicSession,
} from './session';

describe('multiplayer session helpers', () => {
  it('creates a room with the creator assigned to White', () => {
    const session = createSession('ROOM1', 'client-a', 100);

    expect(session.roomId).toBe('ROOM1');
    expect(session.players.W?.clientId).toBe('client-a');
    expect(session.players.B).toBeUndefined();
    expect(session.game.turn).toBe('W');
  });

  it('joins the second player as Black and later clients as spectators', () => {
    const first = createSession('ROOM1', 'client-a', 100);
    const second = joinSession(first, 'client-b', 200);
    const third = joinSession(second.session, 'client-c', 300);

    expect(second.role).toBe('B');
    expect(second.session.players.B?.clientId).toBe('client-b');
    expect(third.role).toBe('spectator');
    expect(third.session.spectators).toHaveLength(1);
  });

  it('accepts a valid action from the current player', () => {
    const session = joinSession(createSession('ROOM1', 'client-a', 100), 'client-b', 200).session;
    const result = applySessionAction(
      session,
      'client-a',
      { kind: 'PLACE', pieceId: 'W_P', to: 0 },
      300,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.session.game.board[0]).toBe('W_P');
      expect(result.session.game.turn).toBe('B');
      expect(result.session.updatedAt).toBe(300);
    }
  });

  it('rejects out-of-turn and spectator actions', () => {
    const withBlack = joinSession(createSession('ROOM1', 'client-a', 100), 'client-b', 200).session;
    const withSpectator = joinSession(withBlack, 'client-c', 300).session;

    expect(
      applySessionAction(withSpectator, 'client-b', { kind: 'PLACE', pieceId: 'B_P', to: 0 }).ok,
    ).toBe(false);
    expect(
      applySessionAction(withSpectator, 'client-c', { kind: 'PLACE', pieceId: 'W_P', to: 0 }).ok,
    ).toBe(false);
  });

  it('serializes public room state without client ids', () => {
    const session = joinSession(createSession('ROOM1', 'client-a', 100), 'client-b', 200).session;
    const publicSession = toPublicSession(session);

    expect(publicSession.players.W?.role).toBe('W');
    expect(JSON.stringify(publicSession)).not.toContain('client-a');
    expect(JSON.stringify(publicSession)).not.toContain('client-b');
  });

  it('marks disconnected clients while preserving their role for reconnect', () => {
    const session = joinSession(createSession('ROOM1', 'client-a', 100), 'client-b', 200).session;
    const result = markClientDisconnected(session, 'client-b', 300);

    expect(result.role).toBe('B');
    expect(result.session.players.B?.status).toBe('disconnected');
  });
});
