import type { Action, GameState, Player } from '../domain/game-engine/chess-ttt-engine';
import { applyAction, getInitialState } from '../domain/game-engine/chess-ttt-engine';

export type RoomId = string;
export type ClientId = string;
export type ConnectionStatus = 'connected' | 'disconnected';
export type SessionRole = Player | 'spectator';

export type SessionPlayer = {
  clientId: ClientId;
  displayName: string;
  role: SessionRole;
  status: ConnectionStatus;
  joinedAt: number;
  lastSeenAt: number;
};

export type GameSession = {
  roomId: RoomId;
  game: GameState;
  players: Partial<Record<Player, SessionPlayer>>;
  spectators: SessionPlayer[];
  round: number;
  createdAt: number;
  updatedAt: number;
};

export type PublicGameSession = {
  roomId: RoomId;
  game: GameState;
  players: Partial<Record<Player, Omit<SessionPlayer, 'clientId'>>>;
  spectators: Array<Omit<SessionPlayer, 'clientId'>>;
  round: number;
  createdAt: number;
  updatedAt: number;
};

export type JoinResult = {
  session: GameSession;
  role: SessionRole;
};

export type ActionResult =
  | { ok: true; session: GameSession }
  | { ok: false; session: GameSession; reason: string };

export type ClientMessage =
  | { type: 'create_room'; clientId?: ClientId; displayName?: string }
  | { type: 'join_room'; roomId: RoomId; clientId?: ClientId; displayName?: string }
  | { type: 'submit_action'; roomId: RoomId; action: Action }
  | { type: 'request_rematch'; roomId: RoomId }
  | { type: 'update_display_name'; roomId: RoomId; displayName: string }
  | { type: 'leave_room'; roomId: RoomId }
  | { type: 'ping' };

export type ServerMessage =
  | { type: 'room_created'; roomId: RoomId; clientId: ClientId; role: SessionRole; session: PublicGameSession }
  | { type: 'room_joined'; roomId: RoomId; clientId: ClientId; role: SessionRole; session: PublicGameSession }
  | { type: 'room_state'; roomId: RoomId; session: PublicGameSession }
  | { type: 'action_accepted'; roomId: RoomId; session: PublicGameSession }
  | { type: 'action_rejected'; roomId: RoomId; reason: string; session?: PublicGameSession }
  | { type: 'rematch_started'; roomId: RoomId; session: PublicGameSession }
  | { type: 'player_disconnected'; roomId: RoomId; role: SessionRole; session: PublicGameSession }
  | { type: 'error'; message: string }
  | { type: 'pong' };

function now(): number {
  return Date.now();
}

export function normalizeDisplayName(displayName: string | undefined, fallback = 'Guest'): string {
  const normalized = displayName?.trim().replace(/\s+/g, ' ').slice(0, 24);
  return normalized || fallback;
}

export function createSession(
  roomId: RoomId,
  creatorId: ClientId,
  timestamp = now(),
  displayName?: string,
): GameSession {
  return {
    roomId,
    game: getInitialState('W'),
    players: {
      W: {
        clientId: creatorId,
        displayName: normalizeDisplayName(displayName, 'White player'),
        role: 'W',
        status: 'connected',
        joinedAt: timestamp,
        lastSeenAt: timestamp,
      },
    },
    spectators: [],
    round: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function makePlayer(
  clientId: ClientId,
  role: SessionRole,
  timestamp: number,
  displayName?: string,
): SessionPlayer {
  return {
    clientId,
    displayName: normalizeDisplayName(displayName, role === 'B' ? 'Black player' : 'Guest'),
    role,
    status: 'connected',
    joinedAt: timestamp,
    lastSeenAt: timestamp,
  };
}

export function joinSession(
  session: GameSession,
  clientId: ClientId,
  timestamp = now(),
  displayName?: string,
): JoinResult {
  const next: GameSession = {
    ...session,
    players: { ...session.players },
    spectators: [...session.spectators],
    updatedAt: timestamp,
  };

  for (const role of ['W', 'B'] as const) {
    const player = next.players[role];
    if (player?.clientId === clientId) {
      next.players[role] = {
        ...player,
        displayName: normalizeDisplayName(displayName, player.displayName),
        status: 'connected',
        lastSeenAt: timestamp,
      };
      return { session: next, role };
    }
  }

  const spectatorIndex = next.spectators.findIndex((spectator) => spectator.clientId === clientId);
  if (spectatorIndex >= 0) {
    next.spectators[spectatorIndex] = {
      ...next.spectators[spectatorIndex],
      displayName: normalizeDisplayName(displayName, next.spectators[spectatorIndex].displayName),
      status: 'connected',
      lastSeenAt: timestamp,
    };
    return { session: next, role: 'spectator' };
  }

  if (!next.players.W) {
    next.players.W = makePlayer(clientId, 'W', timestamp, displayName);
    return { session: next, role: 'W' };
  }

  if (!next.players.B) {
    next.players.B = makePlayer(clientId, 'B', timestamp, displayName);
    return { session: next, role: 'B' };
  }

  const spectator = makePlayer(clientId, 'spectator', timestamp, displayName);
  next.spectators.push(spectator);
  return { session: next, role: 'spectator' };
}

export function updateDisplayName(
  session: GameSession,
  clientId: ClientId,
  displayName: string,
  timestamp = now(),
): ActionResult {
  const next: GameSession = {
    ...session,
    players: { ...session.players },
    spectators: [...session.spectators],
    updatedAt: timestamp,
  };
  const nextDisplayName = normalizeDisplayName(displayName);

  for (const role of ['W', 'B'] as const) {
    const player = next.players[role];
    if (player?.clientId === clientId) {
      next.players[role] = { ...player, displayName: nextDisplayName, lastSeenAt: timestamp };
      return { ok: true, session: next };
    }
  }

  const spectatorIndex = next.spectators.findIndex((spectator) => spectator.clientId === clientId);
  if (spectatorIndex >= 0) {
    next.spectators[spectatorIndex] = {
      ...next.spectators[spectatorIndex],
      displayName: nextDisplayName,
      lastSeenAt: timestamp,
    };
    return { ok: true, session: next };
  }

  return { ok: false, session, reason: 'Client is not in this room.' };
}

export function markClientDisconnected(
  session: GameSession,
  clientId: ClientId,
  timestamp = now(),
): { session: GameSession; role: SessionRole | null } {
  const next: GameSession = {
    ...session,
    players: { ...session.players },
    spectators: [...session.spectators],
    updatedAt: timestamp,
  };

  for (const role of ['W', 'B'] as const) {
    const player = next.players[role];
    if (player?.clientId === clientId) {
      next.players[role] = { ...player, status: 'disconnected', lastSeenAt: timestamp };
      return { session: next, role };
    }
  }

  const spectatorIndex = next.spectators.findIndex((spectator) => spectator.clientId === clientId);
  if (spectatorIndex >= 0) {
    const spectator = next.spectators[spectatorIndex];
    next.spectators[spectatorIndex] = {
      ...spectator,
      status: 'disconnected',
      lastSeenAt: timestamp,
    };
    return { session: next, role: 'spectator' };
  }

  return { session, role: null };
}

export function roleForClient(session: GameSession, clientId: ClientId): SessionRole | null {
  if (session.players.W?.clientId === clientId) return 'W';
  if (session.players.B?.clientId === clientId) return 'B';
  if (session.spectators.some((spectator) => spectator.clientId === clientId)) return 'spectator';
  return null;
}

export function applySessionAction(
  session: GameSession,
  clientId: ClientId,
  action: Action,
  timestamp = now(),
): ActionResult {
  const role = roleForClient(session, clientId);

  if (role === null) {
    return { ok: false, session, reason: 'Client is not in this room.' };
  }

  if (role === 'spectator') {
    return { ok: false, session, reason: 'Spectators cannot submit moves.' };
  }

  if (session.game.winner) {
    return { ok: false, session, reason: 'Game already ended.' };
  }

  if (session.game.turn !== role) {
    return { ok: false, session, reason: 'It is not your turn.' };
  }

  try {
    const game = applyAction(session.game, action);
    return {
      ok: true,
      session: {
        ...session,
        game,
        updatedAt: timestamp,
      },
    };
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : 'Invalid action.';
    return { ok: false, session, reason };
  }
}

export function startRematch(
  session: GameSession,
  clientId: ClientId,
  timestamp = now(),
): ActionResult {
  const role = roleForClient(session, clientId);

  if (role === null) {
    return { ok: false, session, reason: 'Client is not in this room.' };
  }

  if (role === 'spectator') {
    return { ok: false, session, reason: 'Spectators cannot start rematches.' };
  }

  if (!session.game.winner) {
    return { ok: false, session, reason: 'Finish the current game before starting a rematch.' };
  }

  return {
    ok: true,
    session: {
      ...session,
      game: getInitialState('W'),
      round: session.round + 1,
      updatedAt: timestamp,
    },
  };
}

function publicPlayer(player: SessionPlayer): Omit<SessionPlayer, 'clientId'> {
  return {
    displayName: player.displayName,
    role: player.role,
    status: player.status,
    joinedAt: player.joinedAt,
    lastSeenAt: player.lastSeenAt,
  };
}

export function toPublicSession(session: GameSession): PublicGameSession {
  return {
    roomId: session.roomId,
    game: session.game,
    players: {
      ...(session.players.W ? { W: publicPlayer(session.players.W) } : {}),
      ...(session.players.B ? { B: publicPlayer(session.players.B) } : {}),
    },
    spectators: session.spectators.map(publicPlayer),
    round: session.round,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}
