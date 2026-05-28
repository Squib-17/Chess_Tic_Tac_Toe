# Chess Tic-Tac-Toe

A Vite + React + TypeScript implementation of Chess Tic-Tac-Toe: a 4x4 tactical game where each player uses a pawn, knight, bishop, and rook to make four in a row.

## Gameplay

- Players place three pieces each during the first six plies.
- From ply seven onward, players can place remaining pieces, move on-board pieces, capture, or respawn captured pieces.
- Standard chess movement applies on the 4x4 board, with pawns moving away from their owner and reversing after reaching the far edge.
- A player wins immediately by forming any row, column, or diagonal of four owned pieces.
- Local two-player mode, four AI difficulties, and local WebSocket room play are available.

## Scripts

```bash
npm install
npm run dev
npm run dev:server
npm run dev:all
npm run lint
npm test
npm run check:server
npm run build
npm run preview
```

## Project Structure

```text
src/
  domain/game-engine/   Pure rules engine, board constants, notation, and engine tests
  features/ai/          Bot controller, rule-based AI, minimax AI, evaluator, and AI tests
  features/game/        React game screen, UI components, hooks, display helpers, and UI tests
  shared/               Multiplayer session and wire-protocol types
  test/                 Test setup
server/                 Local authoritative WebSocket multiplayer server
docs/                   PRD and manual testing guides
```

## Local Multiplayer

Run both the client and server:

```bash
npm run dev:all
```

The client uses `ws://localhost:8787` by default. To point at another server, set `VITE_MULTIPLAYER_URL`.

The first multiplayer version supports room codes, White/Black assignment, spectators, server-side move validation, disconnect state, and in-memory rooms. It does not include accounts, public lobbies, or hosted persistence yet.

## Quality Gates

The repo is expected to pass:

```bash
npm run lint
npm test
npm run check:server
npm run build
npm audit --audit-level=moderate
```

Automated tests cover core engine behavior, bot move selection, winner handling, accessibility-oriented UI flows, and stale bot move cancellation after reset.

## Documentation

- [Changelog](CHANGELOG.md)
- [Testing guide](docs/TESTING.md)
- [AI testing guide](docs/AI_TESTING.md)
- [Movement tests](docs/MOVEMENT_TESTS.md)
- [Multiplayer architecture](docs/MULTIPLAYER.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Decisions](docs/DECISIONS.md)
- [Roadmap](docs/ROADMAP.md)
- [Next phase](docs/NEXT_PHASE.md)
- [Product requirements](docs/chess_tic_tac_toe_prd.md)
