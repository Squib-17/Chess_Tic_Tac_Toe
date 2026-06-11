import { randomUUID } from 'node:crypto';
import { createServer, type Server as HttpServer } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';
import type {
  ClientId,
  ClientMessage,
  GameSession,
  RoomId,
  ServerMessage,
} from '../src/shared/session';
import {
  applySessionAction,
  acceptDraw,
  createSession,
  declineDraw,
  joinSession,
  markClientDisconnected,
  offerDraw,
  startRematch,
  toPublicSession,
  updateDisplayName,
} from '../src/shared/session';
import { InMemoryRoomStore, type RoomStore } from './room-store';

const DEFAULT_PORT = 8787;
const DEFAULT_MAX_MESSAGE_BYTES = 8192;
const DEFAULT_MAX_MESSAGES_PER_SECOND = 30;
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_CODE_LENGTH = 5;
const ROOM_TTL_MS = 1000 * 60 * 60 * 6;

type ClientMeta = {
  clientId: ClientId;
  roomId: RoomId | null;
  messageWindowStart: number;
  messageCount: number;
};

export type MultiplayerServerOptions = {
  port?: number;
  host?: string;
  store?: RoomStore;
  allowedOrigins?: string[];
  maxMessageBytes?: number;
  maxMessagesPerSecond?: number;
};

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, '');
}

function parseAllowedOrigins(raw: string | undefined): string[] | undefined {
  if (!raw?.trim()) return undefined;
  return raw.split(',').map((origin) => normalizeOrigin(origin)).filter(Boolean);
}

export function readAllowedOriginsFromEnv(): string[] | undefined {
  return parseAllowedOrigins(process.env.ALLOWED_ORIGINS);
}

function isOriginAllowed(origin: string | undefined, allowedOrigins: string[] | undefined): boolean {
  if (!allowedOrigins?.length) return true;
  if (!origin) return false;
  return allowedOrigins.includes(normalizeOrigin(origin));
}

function isRateLimited(meta: ClientMeta, maxMessagesPerSecond: number, timestamp: number): boolean {
  if (timestamp - meta.messageWindowStart >= 1000) {
    meta.messageWindowStart = timestamp;
    meta.messageCount = 0;
  }

  meta.messageCount += 1;
  return meta.messageCount > maxMessagesPerSecond;
}

export type MultiplayerServer = {
  wss: WebSocketServer;
  httpServer: HttpServer;
  store: RoomStore;
  close: () => Promise<void>;
};

function createClientId(): ClientId {
  return randomUUID();
}

function createRoomCode(existing: (roomId: RoomId) => boolean): RoomId {
  for (let attempt = 0; attempt < 30; attempt++) {
    let code = '';
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
      code += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)];
    }
    if (!existing(code)) return code;
  }

  return randomUUID().slice(0, 8).toUpperCase();
}

function parseMessage(raw: WebSocket.RawData): ClientMessage | null {
  try {
    const data = JSON.parse(raw.toString()) as ClientMessage;
    return data && typeof data.type === 'string' ? data : null;
  } catch {
    return null;
  }
}

function send(ws: WebSocket, message: ServerMessage): void {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function broadcast(clients: Map<WebSocket, ClientMeta>, roomId: RoomId, message: ServerMessage): void {
  for (const [client, meta] of clients) {
    if (meta.roomId === roomId) {
      send(client, message);
    }
  }
}

function upsertSession(store: RoomStore, session: GameSession): GameSession {
  store.update(session);
  return session;
}

export function startMultiplayerServer({
  port = DEFAULT_PORT,
  host = '127.0.0.1',
  store = new InMemoryRoomStore(),
  allowedOrigins,
  maxMessageBytes = DEFAULT_MAX_MESSAGE_BYTES,
  maxMessagesPerSecond = DEFAULT_MAX_MESSAGES_PER_SECOND,
}: MultiplayerServerOptions = {}): MultiplayerServer {
  const httpServer = createServer((request, response) => {
    if (request.url === '/health') {
      response.writeHead(200, { 'Content-Type': 'text/plain' });
      response.end('ok');
      return;
    }

    response.writeHead(404, { 'Content-Type': 'text/plain' });
    response.end('Not found');
  });

  const wss = new WebSocketServer({
    server: httpServer,
    maxPayload: maxMessageBytes,
    verifyClient: ({ origin }, callback) => {
      if (isOriginAllowed(origin, allowedOrigins)) {
        callback(true);
        return;
      }
      callback(false, 403, 'Origin not allowed');
    },
  });
  const clients = new Map<WebSocket, ClientMeta>();

  httpServer.listen(port, host);

  const cleanupInterval = setInterval(() => {
    store.removeInactiveRooms(Date.now(), ROOM_TTL_MS);
  }, 1000 * 60 * 15);

  function leaveCurrentRoom(ws: WebSocket): void {
    const meta = clients.get(ws);
    if (!meta?.roomId) return;

    const session = store.get(meta.roomId);
    if (!session) return;

    const result = markClientDisconnected(session, meta.clientId);
    if (!result.role) return;

    const next = upsertSession(store, result.session);
    broadcast(clients, next.roomId, {
      type: 'player_disconnected',
      roomId: next.roomId,
      role: result.role,
      session: toPublicSession(next),
    });
  }

  wss.on('connection', (ws) => {
    const meta: ClientMeta = {
      clientId: createClientId(),
      roomId: null,
      messageWindowStart: Date.now(),
      messageCount: 0,
    };
    clients.set(ws, meta);

    ws.on('message', (raw) => {
      if (isRateLimited(meta, maxMessagesPerSecond, Date.now())) {
        send(ws, { type: 'error', message: 'Rate limit exceeded.' });
        ws.close(1008, 'Rate limit exceeded');
        return;
      }

      const message = parseMessage(raw);
      if (!message) {
        send(ws, { type: 'error', message: 'Malformed message.' });
        return;
      }

      if (message.type === 'ping') {
        send(ws, { type: 'pong' });
        return;
      }

      if (message.type === 'create_room') {
        const clientId = message.clientId ?? meta.clientId;
        meta.clientId = clientId;
        const roomId = createRoomCode((candidate) => store.get(candidate) !== undefined);
        const session = createSession(roomId, clientId);
        store.create(session);
        meta.roomId = roomId;
        send(ws, {
          type: 'room_created',
          roomId,
          clientId,
          role: 'W',
          session: toPublicSession(session),
        });
        return;
      }

      if (message.type === 'join_room') {
        const roomId = message.roomId.trim().toUpperCase();
        const session = store.get(roomId);
        if (!session) {
          send(ws, { type: 'error', message: 'Room not found.' });
          return;
        }

        const clientId = message.clientId ?? meta.clientId;
        meta.clientId = clientId;
        const result = joinSession(session, clientId);
        const next = upsertSession(store, result.session);
        meta.roomId = roomId;
        send(ws, {
          type: 'room_joined',
          roomId,
          clientId,
          role: result.role,
          session: toPublicSession(next),
        });
        broadcast(clients, roomId, {
          type: 'room_state',
          roomId,
          session: toPublicSession(next),
        });
        return;
      }

      if (message.type === 'submit_action') {
        const roomId = message.roomId.trim().toUpperCase();
        const session = store.get(roomId);
        if (!session) {
          send(ws, { type: 'error', message: 'Room not found.' });
          return;
        }

        const result = applySessionAction(session, meta.clientId, message.action);
        if (!result.ok) {
          send(ws, {
            type: 'action_rejected',
            roomId,
            reason: result.reason,
            session: toPublicSession(result.session),
          });
          return;
        }

        const next = upsertSession(store, result.session);
        broadcast(clients, roomId, {
          type: 'action_accepted',
          roomId,
          session: toPublicSession(next),
        });
        return;
      }

      if (message.type === 'request_rematch') {
        const session = store.get(message.roomId);
        if (!session) {
          send(ws, { type: 'error', message: 'Room not found.' });
          return;
        }
        const result = startRematch(session, meta.clientId);
        if (!result.ok) {
          send(ws, { type: 'error', message: result.reason });
          return;
        }
        const next = upsertSession(store, result.session);
        broadcast(clients, next.roomId, {
          type: 'rematch_started',
          roomId: next.roomId,
          session: toPublicSession(next),
        });
        return;
      }

      if (message.type === 'offer_draw') {
        const session = store.get(message.roomId);
        if (!session) {
          send(ws, { type: 'error', message: 'Room not found.' });
          return;
        }
        const result = offerDraw(session, meta.clientId);
        if (!result.ok) {
          send(ws, { type: 'error', message: result.reason });
          return;
        }
        const next = upsertSession(store, result.session);
        broadcast(clients, next.roomId, {
          type: 'draw_offered',
          roomId: next.roomId,
          offeredBy: next.drawOfferedBy!,
          session: toPublicSession(next),
        });
        return;
      }

      if (message.type === 'accept_draw') {
        const session = store.get(message.roomId);
        if (!session) {
          send(ws, { type: 'error', message: 'Room not found.' });
          return;
        }
        const result = acceptDraw(session, meta.clientId);
        if (!result.ok) {
          send(ws, { type: 'error', message: result.reason });
          return;
        }
        const next = upsertSession(store, result.session);
        broadcast(clients, next.roomId, {
          type: 'draw_accepted',
          roomId: next.roomId,
          session: toPublicSession(next),
        });
        return;
      }

      if (message.type === 'decline_draw') {
        const session = store.get(message.roomId);
        if (!session) {
          send(ws, { type: 'error', message: 'Room not found.' });
          return;
        }
        const result = declineDraw(session, meta.clientId);
        if (!result.ok) {
          send(ws, { type: 'error', message: result.reason });
          return;
        }
        const next = upsertSession(store, result.session);
        broadcast(clients, next.roomId, {
          type: 'draw_declined',
          roomId: next.roomId,
          session: toPublicSession(next),
        });
        return;
      }

      if (message.type === 'update_display_name') {
        const session = store.get(message.roomId);
        if (!session) {
          send(ws, { type: 'error', message: 'Room not found.' });
          return;
        }
        const result = updateDisplayName(session, meta.clientId, message.displayName);
        if (!result.ok) {
          send(ws, { type: 'error', message: result.reason });
          return;
        }
        const next = upsertSession(store, result.session);
        broadcast(clients, next.roomId, {
          type: 'room_state',
          roomId: next.roomId,
          session: toPublicSession(next),
        });
        return;
      }

      if (message.type === 'leave_room') {
        leaveCurrentRoom(ws);
        meta.roomId = null;
      }
    });

    ws.on('close', () => {
      leaveCurrentRoom(ws);
      clients.delete(ws);
    });
  });

  return {
    wss,
    httpServer,
    store,
    close: () => new Promise((resolve) => {
      clearInterval(cleanupInterval);
      for (const client of clients.keys()) {
        client.close();
      }
      wss.close(() => {
        httpServer.close(() => resolve());
      });
    }),
  };
}
