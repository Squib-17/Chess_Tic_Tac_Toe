import { afterEach, describe, expect, it } from 'vitest';
import WebSocket from 'ws';
import type { ServerMessage } from '../src/shared/session';
import { startMultiplayerServer, type MultiplayerServer } from './multiplayer-server';

const servers: MultiplayerServer[] = [];

function waitForOpen(ws: WebSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    ws.once('open', () => resolve());
    ws.once('error', reject);
  });
}

function nextMessage(ws: WebSocket): Promise<ServerMessage> {
  return new Promise((resolve) => {
    ws.once('message', (raw) => resolve(JSON.parse(raw.toString()) as ServerMessage));
  });
}

async function createClient(port: number): Promise<WebSocket> {
  const ws = new WebSocket(`ws://127.0.0.1:${port}`);
  await waitForOpen(ws);
  return ws;
}

async function createServer(): Promise<{ server: MultiplayerServer; port: number }> {
  const server = startMultiplayerServer({ port: 0 });
  servers.push(server);
  await new Promise<void>((resolve) => server.wss.once('listening', () => resolve()));
  const address = server.wss.address();
  if (typeof address === 'string' || address === null) throw new Error('Expected TCP address.');
  return { server, port: address.port };
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.close()));
});

describe('multiplayer websocket server', () => {
  it('creates and joins rooms with White and Black assignments', async () => {
    const { port } = await createServer();
    const white = await createClient(port);
    const black = await createClient(port);

    white.send(JSON.stringify({ type: 'create_room', clientId: 'white-client' }));
    const created = await nextMessage(white);
    expect(created.type).toBe('room_created');
    if (created.type !== 'room_created') return;
    expect(created.role).toBe('W');

    black.send(JSON.stringify({ type: 'join_room', roomId: created.roomId, clientId: 'black-client' }));
    const joined = await nextMessage(black);
    expect(joined.type).toBe('room_joined');
    if (joined.type !== 'room_joined') return;
    expect(joined.role).toBe('B');
  });

  it('accepts valid moves and rejects out-of-turn moves', async () => {
    const { port } = await createServer();
    const white = await createClient(port);
    const black = await createClient(port);

    white.send(JSON.stringify({ type: 'create_room', clientId: 'white-client' }));
    const created = await nextMessage(white);
    if (created.type !== 'room_created') throw new Error('Expected room_created');

    black.send(JSON.stringify({ type: 'join_room', roomId: created.roomId, clientId: 'black-client' }));
    await nextMessage(black);
    await nextMessage(white);

    black.send(JSON.stringify({
      type: 'submit_action',
      roomId: created.roomId,
      action: { kind: 'PLACE', pieceId: 'B_P', to: 0 },
    }));
    const rejected = await nextMessage(black);
    expect(rejected.type).toBe('action_rejected');

    white.send(JSON.stringify({
      type: 'submit_action',
      roomId: created.roomId,
      action: { kind: 'PLACE', pieceId: 'W_P', to: 0 },
    }));
    const accepted = await nextMessage(white);
    expect(accepted.type).toBe('action_accepted');
    if (accepted.type === 'action_accepted') {
      expect(accepted.session.game.board[0]).toBe('W_P');
    }
  });

  it('broadcasts disconnected player state', async () => {
    const { port } = await createServer();
    const white = await createClient(port);
    const black = await createClient(port);

    white.send(JSON.stringify({ type: 'create_room', clientId: 'white-client' }));
    const created = await nextMessage(white);
    if (created.type !== 'room_created') throw new Error('Expected room_created');

    black.send(JSON.stringify({ type: 'join_room', roomId: created.roomId, clientId: 'black-client' }));
    await nextMessage(black);
    await nextMessage(white);

    black.close();
    const disconnected = await nextMessage(white);
    expect(disconnected.type).toBe('player_disconnected');
    if (disconnected.type === 'player_disconnected') {
      expect(disconnected.role).toBe('B');
      expect(disconnected.session.players.B?.status).toBe('disconnected');
    }
  });
});
