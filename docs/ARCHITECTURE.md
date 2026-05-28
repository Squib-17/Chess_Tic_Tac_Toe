# Architecture

## Client

The React app lives under `src/features/game`.

- `Game.tsx` composes the board, sidebars, move history, and overlays.
- `useChessTttGame` owns local/bot/online orchestration.
- `useMultiplayerRoom` owns the WebSocket connection and online room state.
- UI components consume authoritative state and submit actions through the hook boundary.

## Game Engine

The pure rules engine lives in `src/domain/game-engine`.

- `GameState` is deterministic and serializable.
- `applyAction` validates actions and returns the next immutable state.
- Legal moves, phase transitions, winner checks, captures, respawns, and pawn reversal are engine-owned.

## AI

AI lives in `src/features/ai`.

- Easy/Medium use heuristics.
- Hard/Expert use minimax.
- Bot moves use the same engine actions as local and online play.

## Multiplayer

Shared room and protocol types live in `src/shared/session.ts`.

The server in `server/` is authoritative:

- Clients create/join rooms and submit actions.
- The server validates every action through `applySessionAction`.
- Accepted actions broadcast a new public room state.
- Rejected actions return a reason without changing state.

## Persistence Boundary

`server/room-store.ts` defines `RoomStore`.

Current storage is in-memory. Future database storage should implement the same interface without changing client protocol or engine state.
