# Decisions

## Node WebSocket Server

Decision: use a small custom TypeScript server with `ws`.

Reason: the rules engine is already deterministic and serializable, so a custom authoritative room server is simple and avoids early provider lock-in.

## Server-Authoritative Online Play

Decision: clients never decide final online state.

Reason: this prevents out-of-turn moves, spectator moves, and divergent game states. Clients submit actions; the server validates and broadcasts the accepted state.

## In-Memory Store First

Decision: start with `InMemoryRoomStore` behind a `RoomStore` interface.

Reason: local room play can ship quickly while preserving a clean path to database-backed persistence.

## No Accounts Yet

Decision: identify reconnecting browsers with a generated local client id, not accounts.

Reason: accounts would add auth, profile, and privacy scope before the core online game loop is proven.

## Documentation Memory

Decision: maintain roadmap, architecture, decisions, and next-phase notes in `docs/`.

Reason: the project is growing past a single changelog. These docs preserve intent and prevent rediscovering the same context each phase.
