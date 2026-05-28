# Next Phase

## Multiplayer Hardening Checklist

- Validate online mode with two browser windows.
- Confirm create room, join room, play, disconnect, reconnect, and leave flows.
- Improve rejected-action language as real playtesting reveals confusing cases.
- Add rematch/new-room flow after online games.
- Add optional player display names.
- Decide whether room persistence should remain local-server-only or move to a database-backed store.

## Acceptance Criteria

- Online mode clearly shows:
  - Connection status
  - Room code
  - Player role
  - Waiting for opponent
  - Opponent disconnected
  - Spectator state
  - Your turn versus opponent turn
- Local and bot modes remain unaffected.
- Full quality gates stay green:
  - `npm run lint`
  - `npm test`
  - `npm run check:server`
  - `npm run build`
  - `npm audit --audit-level=moderate`

## Notes For The Next Session

The server is intentionally local and in-memory. Do not add accounts or deployment-specific code until room play has been manually tested and hardened.
