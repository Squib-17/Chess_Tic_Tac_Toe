// chess-ttt-engine.ts
// Rules Engine for Chess Tic-Tac-Toe 4x4 (v1.1)
// Updated: Placement phase requires 3 pieces per player (6 plies total) before hybrid phase

export type Player = 'W' | 'B';
export type PieceType = 'P' | 'N' | 'B' | 'R';
export type PieceState = 'UNPLACED' | 'ON_BOARD' | 'CAPTURED';
export type PawnDir = 'UP' | 'DOWN';

export type PieceId =
  | 'W_P'
  | 'W_N'
  | 'W_B'
  | 'W_R'
  | 'B_P'
  | 'B_N'
  | 'B_B'
  | 'B_R';

export type Piece = {
  id: PieceId;
  owner: Player;
  type: PieceType;
  state: PieceState;
  pos: number | null; // 0..15 if ON_BOARD else null
  pawnDir?: PawnDir; // only for pawn
  pawnReversed?: boolean; // only for pawn
};

export type Phase = 'PLACEMENT_ONLY' | 'HYBRID';

export type Action =
  | { kind: 'PLACE'; pieceId: PieceId; to: number } // ply 1..6 only
  | { kind: 'RESPAWN'; pieceId: PieceId; to: number } // ply >= 7 only
  | { kind: 'MOVE'; pieceId: PieceId; to: number } // ply >= 7 only
  | { kind: 'CAPTURE'; pieceId: PieceId; to: number; capturedId: PieceId }; // ply >= 7 only

export type MoveHistoryEntry = {
  action: Action;
  ply: number;
  player: Player;
  fromPos?: number; // For moves/captures, where piece moved from
  toPos: number; // Where piece ended up
  capturedPiece?: PieceId; // If a capture occurred
};

export type GameState = {
  board: (PieceId | null)[]; // length 16
  pieces: Record<PieceId, Piece>;
  turn: Player; // current player to act
  ply: number; // 1-based global move count
  winner: Player | null;
  moveHistory: MoveHistoryEntry[]; // Track all moves for replay/analysis
};

export const BOARD_SIZE = 4;
export const BOARD_LEN = BOARD_SIZE * BOARD_SIZE;
export const CENTER_SQUARES: number[] = [5, 6, 9, 10];
export const EDGE_SQUARES: number[] = [0, 3, 12, 15];

export const WIN_LINES: number[][] = [
  // Rows
  [0, 1, 2, 3],
  [4, 5, 6, 7],
  [8, 9, 10, 11],
  [12, 13, 14, 15],
  // Cols
  [0, 4, 8, 12],
  [1, 5, 9, 13],
  [2, 6, 10, 14],
  [3, 7, 11, 15],
  // Diagonals
  [0, 5, 10, 15],
  [3, 6, 9, 12],
];

function assert(condition: unknown, msg: string): asserts condition {
  if (!condition) throw new Error(msg);
}

function phaseFromPly(ply: number): Phase {
  // First 3 pieces per player must be placed (6 plies total)
  return ply <= 6 ? 'PLACEMENT_ONLY' : 'HYBRID';
}

function rcToIdx(r: number, c: number): number {
  return r * BOARD_SIZE + c;
}
function idxToRC(idx: number): { r: number; c: number } {
  return { r: Math.floor(idx / BOARD_SIZE), c: idx % BOARD_SIZE };
}
function inBounds(r: number, c: number): boolean {
  return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
}

export function positionToNotation(pos: number): string {
  const row = Math.floor(pos / BOARD_SIZE);
  const col = pos % BOARD_SIZE;
  return `${String.fromCharCode(65 + col)}${BOARD_SIZE - row}`;
}

function other(player: Player): Player {
  return player === 'W' ? 'B' : 'W';
}

function defaultPawnDirFor(player: Player): PawnDir {
  // UI Layout: White at top, Black at bottom
  // Board coordinates: row 0 = top, row 3 = bottom
  // White (at top) pawns move DOWN away from player (row 0 → row 3)
  // Black (at bottom) pawns move UP away from player (row 3 → row 0)
  return player === 'W' ? 'DOWN' : 'UP';
}

function oppositeDir(dir: PawnDir): PawnDir {
  return dir === 'UP' ? 'DOWN' : 'UP';
}

function isEnemy(state: GameState, a: PieceId, b: PieceId): boolean {
  return state.pieces[a].owner !== state.pieces[b].owner;
}

function ownerOf(state: GameState, pieceId: PieceId): Player {
  return state.pieces[pieceId].owner;
}

function isEmpty(state: GameState, idx: number): boolean {
  return state.board[idx] === null;
}

function checkWinner(state: GameState): Player | null {
  for (const line of WIN_LINES) {
    const ids = line.map((i) => state.board[i]);
    if (ids.some((x) => x === null)) continue;
    const p0 = ownerOf(state, ids[0]!);
    if (ids.every((id) => ownerOf(state, id!) === p0)) return p0;
  }
  return null;
}

function rayMoves(
  state: GameState,
  from: number,
  dr: number,
  dc: number,
  moverId: PieceId,
): Action[] {
  const actions: Action[] = [];
  const { r: r0, c: c0 } = idxToRC(from);
  let r = r0 + dr;
  let c = c0 + dc;

  while (inBounds(r, c)) {
    const to = rcToIdx(r, c);
    const occ = state.board[to];
    if (occ === null) {
      actions.push({ kind: 'MOVE', pieceId: moverId, to });
    } else {
      if (isEnemy(state, moverId, occ)) {
        actions.push({
          kind: 'CAPTURE',
          pieceId: moverId,
          to,
          capturedId: occ,
        });
      }
      break; // blocked
    }
    r += dr;
    c += dc;
  }

  return actions;
}

function knightMoves(
  state: GameState,
  from: number,
  moverId: PieceId,
): Action[] {
  const actions: Action[] = [];
  const { r, c } = idxToRC(from);
  const deltas = [
    [-2, -1],
    [-2, 1],
    [-1, -2],
    [-1, 2],
    [1, -2],
    [1, 2],
    [2, -1],
    [2, 1],
  ];
  for (const [dr, dc] of deltas) {
    const rr = r + dr;
    const cc = c + dc;
    if (!inBounds(rr, cc)) continue;
    const to = rcToIdx(rr, cc);
    const occ = state.board[to];
    if (occ === null) {
      actions.push({ kind: 'MOVE', pieceId: moverId, to });
    } else if (isEnemy(state, moverId, occ)) {
      actions.push({ kind: 'CAPTURE', pieceId: moverId, to, capturedId: occ });
    }
  }
  return actions;
}

function pawnMoves(state: GameState, from: number, moverId: PieceId): Action[] {
  const p = state.pieces[moverId];
  assert(p.type === 'P', 'pawnMoves called on non-pawn');
  assert(
    p.pawnDir,
    'Pawn has no pawnDir set (should be set on placement/respawn)',
  );

  const { r, c } = idxToRC(from);

  const dir = p.pawnReversed ? oppositeDir(p.pawnDir) : p.pawnDir;
  const drForward = dir === 'UP' ? -1 : 1;

  const actions: Action[] = [];

  // Forward move
  const rf = r + drForward;
  if (inBounds(rf, c)) {
    const to = rcToIdx(rf, c);
    if (state.board[to] === null) {
      actions.push({ kind: 'MOVE', pieceId: moverId, to });
    }
  }

  // Diagonal captures
  for (const dc of [-1, 1]) {
    const rr = r + drForward;
    const cc = c + dc;
    if (!inBounds(rr, cc)) continue;
    const to = rcToIdx(rr, cc);
    const occ = state.board[to];
    if (occ !== null && isEnemy(state, moverId, occ)) {
      actions.push({ kind: 'CAPTURE', pieceId: moverId, to, capturedId: occ });
    }
  }

  return actions;
}

export function getInitialState(startingPlayer: Player = 'W'): GameState {
  const pieces: Record<PieceId, Piece> = {
    W_P: { id: 'W_P', owner: 'W', type: 'P', state: 'UNPLACED', pos: null },
    W_N: { id: 'W_N', owner: 'W', type: 'N', state: 'UNPLACED', pos: null },
    W_B: { id: 'W_B', owner: 'W', type: 'B', state: 'UNPLACED', pos: null },
    W_R: { id: 'W_R', owner: 'W', type: 'R', state: 'UNPLACED', pos: null },

    B_P: { id: 'B_P', owner: 'B', type: 'P', state: 'UNPLACED', pos: null },
    B_N: { id: 'B_N', owner: 'B', type: 'N', state: 'UNPLACED', pos: null },
    B_B: { id: 'B_B', owner: 'B', type: 'B', state: 'UNPLACED', pos: null },
    B_R: { id: 'B_R', owner: 'B', type: 'R', state: 'UNPLACED', pos: null },
  };

  return {
    board: Array.from({ length: BOARD_LEN }, () => null),
    pieces,
    turn: startingPlayer,
    ply: 1,
    winner: null,
    moveHistory: [],
  };
}

export function generateLegalActions(state: GameState): Action[] {
  if (state.winner) return [];

  const phase = phaseFromPly(state.ply);
  const actions: Action[] = [];

  // Helper to iterate pieces belonging to current player
  const myPieces = Object.values(state.pieces).filter(
    (p) => p.owner === state.turn,
  );

  if (phase === 'PLACEMENT_ONLY') {
    // Only PLACE with UNPLACED pieces into empty squares
    const unplaced = myPieces.filter((p) => p.state === 'UNPLACED');
    for (const p of unplaced) {
      for (let to = 0; to < BOARD_LEN; to++) {
        if (state.board[to] !== null) continue;
        actions.push({ kind: 'PLACE', pieceId: p.id, to });
      }
    }
    return actions;
  }

  // HYBRID phase (ply >= 7)
  // 1) PLACE remaining UNPLACED piece(s) (should be 0 or 1 normally, but we keep it generic)
  const unplaced = myPieces.filter((p) => p.state === 'UNPLACED');
  for (const p of unplaced) {
    for (let to = 0; to < BOARD_LEN; to++) {
      if (state.board[to] !== null) continue;
      actions.push({ kind: 'PLACE', pieceId: p.id, to });
    }
  }

  // 2) RESPAWN any CAPTURED piece(s)
  const captured = myPieces.filter((p) => p.state === 'CAPTURED');
  for (const p of captured) {
    for (let to = 0; to < BOARD_LEN; to++) {
      if (state.board[to] !== null) continue;
      actions.push({ kind: 'RESPAWN', pieceId: p.id, to });
    }
  }

  // 3) MOVE / CAPTURE from ON_BOARD pieces
  const onBoard = myPieces.filter(
    (p) => p.state === 'ON_BOARD' && p.pos !== null,
  );
  for (const p of onBoard) {
    const from = p.pos!;
    switch (p.type) {
      case 'R':
        actions.push(
          ...rayMoves(state, from, -1, 0, p.id),
          ...rayMoves(state, from, 1, 0, p.id),
          ...rayMoves(state, from, 0, -1, p.id),
          ...rayMoves(state, from, 0, 1, p.id),
        );
        break;
      case 'B':
        actions.push(
          ...rayMoves(state, from, -1, -1, p.id),
          ...rayMoves(state, from, -1, 1, p.id),
          ...rayMoves(state, from, 1, -1, p.id),
          ...rayMoves(state, from, 1, 1, p.id),
        );
        break;
      case 'N':
        actions.push(...knightMoves(state, from, p.id));
        break;
      case 'P':
        actions.push(...pawnMoves(state, from, p.id));
        break;
    }
  }

  return actions;
}

function validateAction(state: GameState, action: Action): void {
  assert(!state.winner, 'Game already ended');
  assert(action.to >= 0 && action.to < BOARD_LEN, 'Target out of bounds');

  const piece = state.pieces[action.pieceId];
  assert(piece, 'Unknown pieceId');
  assert(piece.owner === state.turn, 'Not your piece');

  const phase = phaseFromPly(state.ply);

  if (phase === 'PLACEMENT_ONLY') {
    assert(
      action.kind === 'PLACE',
      'During moves 1–6, only placement is allowed',
    );
    assert(piece.state === 'UNPLACED', 'Piece is not unplaced');
    assert(isEmpty(state, action.to), 'Target must be empty');
    return;
  }

  // HYBRID
  switch (action.kind) {
    case 'PLACE':
      assert(piece.state === 'UNPLACED', 'PLACE requires an unplaced piece');
      assert(isEmpty(state, action.to), 'Target must be empty');
      break;
    case 'RESPAWN':
      assert(piece.state === 'CAPTURED', 'RESPAWN requires a captured piece');
      assert(isEmpty(state, action.to), 'Target must be empty');
      break;
    case 'MOVE':
      assert(
        piece.state === 'ON_BOARD' && piece.pos !== null,
        'MOVE requires piece on board',
      );
      assert(isEmpty(state, action.to), 'MOVE requires empty target');
      break;
    case 'CAPTURE': {
      assert(
        piece.state === 'ON_BOARD' && piece.pos !== null,
        'CAPTURE requires piece on board',
      );
      const occ = state.board[action.to];
      assert(occ !== null, 'CAPTURE requires occupied target');
      assert(occ === action.capturedId, 'capturedId mismatch');
      assert(
        isEnemy(state, action.pieceId, occ),
        'Cannot capture your own piece',
      );
      break;
    }
  }

  // Additionally, ensure action is actually legal (movement rules).
  // Instead of re-implementing logic here, we check membership in generated legal actions.
  const legals = generateLegalActions(state);
  const found = legals.some((a) => actionEquals(a, action));
  assert(found, 'Illegal action (not in legal move set)');
}

function actionEquals(a: Action, b: Action): boolean {
  if (a.kind !== b.kind) return false;
  if (a.pieceId !== b.pieceId) return false;
  if (a.to !== b.to) return false;
  if (a.kind === 'CAPTURE' && b.kind === 'CAPTURE')
    return a.capturedId === b.capturedId;
  return true;
}

function cloneState(state: GameState): GameState {
  // shallow copy board; deep copy pieces (small, only 8)
  const pieces = {} as Record<PieceId, Piece>;
  for (const [id, p] of Object.entries(state.pieces) as [PieceId, Piece][]) {
    pieces[id] = { ...p };
  }
  return {
    board: [...state.board],
    pieces,
    turn: state.turn,
    ply: state.ply,
    winner: state.winner,
    moveHistory: [...state.moveHistory], // Shallow copy is fine for history
  };
}

function maybeFlipPawnAfterLanding(piece: Piece): void {
  if (piece.type !== 'P' || piece.pos === null) return;
  assert(piece.pawnDir, 'Pawn must have pawnDir');
  if (piece.pawnReversed) return; // only flips once

  const { r } = idxToRC(piece.pos);

  // It flips when reaching the far edge in its original direction
  if (piece.pawnDir === 'UP' && r === 0) piece.pawnReversed = true;
  if (piece.pawnDir === 'DOWN' && r === 3) piece.pawnReversed = true;
}

function placePiece(state: GameState, pieceId: PieceId, to: number): void {
  const piece = state.pieces[pieceId];
  assert(state.board[to] === null, 'Target not empty');
  assert(piece.pos === null, 'Piece already has a position');

  state.board[to] = pieceId;
  piece.state = 'ON_BOARD';
  piece.pos = to;

  if (piece.type === 'P') {
    // On placement/respawn, reset pawn movement attributes cleanly
    piece.pawnDir = defaultPawnDirFor(piece.owner);
    piece.pawnReversed = false;
    maybeFlipPawnAfterLanding(piece); // if placed directly on far edge (rare but possible)
  }
}

function movePiece(state: GameState, pieceId: PieceId, to: number): void {
  const piece = state.pieces[pieceId];
  assert(piece.pos !== null, 'No from position');
  const from = piece.pos;

  assert(state.board[from] === pieceId, 'Board/from mismatch');
  assert(state.board[to] === null, 'Target must be empty for MOVE');

  state.board[from] = null;
  state.board[to] = pieceId;
  piece.pos = to;

  if (piece.type === 'P') maybeFlipPawnAfterLanding(piece);
}

function capturePiece(
  state: GameState,
  pieceId: PieceId,
  to: number,
  capturedId: PieceId,
): void {
  const piece = state.pieces[pieceId];
  assert(piece.pos !== null, 'No from position');
  const from = piece.pos;

  assert(state.board[from] === pieceId, 'Board/from mismatch');
  assert(state.board[to] === capturedId, 'Board/to captured mismatch');

  const captured = state.pieces[capturedId];
  assert(
    captured.state === 'ON_BOARD' && captured.pos === to,
    'Captured piece state mismatch',
  );

  // Remove captured
  state.board[to] = null;
  captured.state = 'CAPTURED';
  captured.pos = null;

  // Move capturer in
  state.board[from] = null;
  state.board[to] = pieceId;
  piece.pos = to;

  if (piece.type === 'P') maybeFlipPawnAfterLanding(piece);
}

function enforceNoLegalMovesLoss(state: GameState): void {
  if (state.winner) return;
  const legals = generateLegalActions(state);
  if (legals.length === 0) {
    state.winner = other(state.turn);
  }
}

/**
 * Applies an action and returns a NEW state (immutable style).
 * - Validates action against phase + legal set.
 * - Applies transitions.
 * - Checks winner immediately after action.
 * - Switches turn & increments ply if no winner.
 * - Enforces "no legal moves => lose" for the next player.
 */
export function applyAction(state: GameState, action: Action): GameState {
  validateAction(state, action);
  const next = cloneState(state);

  const piece = next.pieces[action.pieceId];
  const fromPos = piece.pos; // Capture original position before move

  switch (action.kind) {
    case 'PLACE':
      placePiece(next, action.pieceId, action.to);
      break;
    case 'RESPAWN':
      // Respawn is effectively placement of a captured piece
      // but only allowed from ply >= 7 (handled by validation)
      placePiece(next, action.pieceId, action.to);
      break;
    case 'MOVE':
      movePiece(next, action.pieceId, action.to);
      break;
    case 'CAPTURE':
      capturePiece(next, action.pieceId, action.to, action.capturedId);
      break;
  }

  // Record move in history
  const historyEntry: MoveHistoryEntry = {
    action,
    ply: state.ply,
    player: state.turn,
    fromPos: fromPos ?? undefined,
    toPos: action.to,
    capturedPiece: action.kind === 'CAPTURE' ? action.capturedId : undefined,
  };
  next.moveHistory = [...next.moveHistory, historyEntry];

  // Check for instant win after the move
  next.winner = checkWinner(next);
  if (next.winner) return next;

  // Advance turn
  next.turn = other(next.turn);
  next.ply += 1;

  // If next player has no legal moves => they lose
  enforceNoLegalMovesLoss(next);

  return next;
}

export function getPhase(ply: number): Phase {
  return ply <= 6 ? 'PLACEMENT_ONLY' : 'HYBRID';
}

export function getLegalActionsByPiece(
  state: GameState,
): Record<PieceId, Action[]> {
  const grouped: Partial<Record<PieceId, Action[]>> = {};
  const legals = generateLegalActions(state);

  for (const a of legals) {
    const id = a.pieceId;
    if (!grouped[id]) grouped[id] = [];
    grouped[id]!.push(a);
  }

  return grouped as Record<PieceId, Action[]>;
}

export function getLegalActionsByTo(
  state: GameState,
): Record<number, Action[]> {
  const grouped: Record<number, Action[]> = {};
  const legals = generateLegalActions(state);

  for (const a of legals) {
    if (!grouped[a.to]) grouped[a.to] = [];
    grouped[a.to].push(a);
  }

  return grouped;
}

export function getDestinationsForPiece(
  state: GameState,
  pieceId: PieceId,
): Record<number, Action[]> {
  const byPiece = getLegalActionsByPiece(state);
  const actions = byPiece[pieceId] ?? [];

  const dests: Record<number, Action[]> = {};
  for (const a of actions) {
    if (!dests[a.to]) dests[a.to] = [];
    dests[a.to].push(a);
  }
  return dests;
}
