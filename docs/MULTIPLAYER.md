# Multiplayer Architecture

## Current Scope

The first multiplayer implementation is a local WebSocket server for room-code play. It supports:

- Create and join room codes
- White/Black player assignment
- Spectators after both player slots are filled
- Authoritative server validation with the shared game engine
- Room state broadcasts after accepted moves
- Reconnect-by-client-id for the same browser
- Disconnected player status

It does not include accounts, matchmaking, public lobbies, ranked play, or hosted database persistence.

## Runtime

- Client: Vite app
- Server: `server/index.ts`
- Default server URL: `ws://localhost:8787`
- Override client URL with `VITE_MULTIPLAYER_URL`

Useful commands:

```bash
npm run dev:all
npm run dev:server
npm run check:server
```

## Protocol And Session Model

Shared protocol and session types live in `src/shared/session.ts`.

The server accepts `ClientMessage` values and emits `ServerMessage` values. Online game state is always derived from `GameSession.game`, and moves are accepted only through `applySessionAction`, which calls the pure engine `applyAction`.

## Persistence Extension Point

The server uses the `RoomStore` interface in `server/room-store.ts`.

Current implementation:

- `InMemoryRoomStore`

Future database implementation should preserve the same methods:

- `create(session)`
- `get(roomId)`
- `update(session)`
- `remove(roomId)`
- `listActiveRooms()`
- `removeInactiveRooms(now, maxInactiveMs)`

That keeps room persistence swappable without changing the WebSocket protocol or client UI.

## Manual Acceptance

1. Run `npm run dev:all`.
2. Open two browser windows.
3. In window one, select Online and create a room.
4. In window two, select Online and join the room code.
5. Play a complete game.
6. Try an out-of-turn move and confirm it is rejected.
7. Close one window and confirm the other shows a disconnect message.
