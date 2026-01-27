// Position evaluation functions for Chess Tic-Tac-Toe AI

import type { GameState, Player, Action, PieceId } from '../engine/chess-ttt-engine';
import { generateLegalActions, applyAction } from '../engine/chess-ttt-engine';

// Win lines for threat detection
const WIN_LINES: number[][] = [
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

// Center squares have higher strategic value
const CENTER_SQUARES = [5, 6, 9, 10];
const EDGE_SQUARES = [0, 3, 12, 15];

/**
 * Get opponent player
 */
function opponent(player: Player): Player {
  return player === 'W' ? 'B' : 'W';
}

/**
 * Count threats (3 pieces in a line with 1 empty space) for a player
 */
export function countThreats(state: GameState, player: Player): number {
  let threats = 0;

  for (const line of WIN_LINES) {
    let myCount = 0;
    let emptyCount = 0;
    let oppCount = 0;

    for (const pos of line) {
      const piece = state.board[pos];
      if (piece === null) {
        emptyCount++;
      } else if (state.pieces[piece].owner === player) {
        myCount++;
      } else {
        oppCount++;
      }
    }

    // Threat = 3 of my pieces + 1 empty (and no opponent pieces)
    if (myCount === 3 && emptyCount === 1 && oppCount === 0) {
      threats++;
    }
  }

  return threats;
}

/**
 * Find if there's a winning move available
 */
export function findWinningMove(state: GameState): Action | null {
  const actions = generateLegalActions(state);

  for (const action of actions) {
    const nextState = applyAction(state, action);
    if (nextState.winner === state.turn) {
      return action;
    }
  }

  return null;
}

/**
 * Find if opponent can win next turn (blocking move needed)
 */
export function findBlockingMove(state: GameState): Action | null {
  const opp = opponent(state.turn);
  
  // Simulate opponent's turn to find their winning moves
  const hypotheticalState = { ...state, turn: opp };
  const oppWinningMove = findWinningMove(hypotheticalState);
  
  if (!oppWinningMove) return null;

  // Find our action that blocks this square
  const blockSquare = oppWinningMove.to;
  const actions = generateLegalActions(state);

  for (const action of actions) {
    if (action.to === blockSquare) {
      return action;
    }
  }

  return null;
}

/**
 * Find move that creates a threat (3 in a row with empty)
 */
export function findThreatCreatingMove(state: GameState): Action | null {
  const actions = generateLegalActions(state);
  const currentThreats = countThreats(state, state.turn);

  for (const action of actions) {
    const nextState = applyAction(state, action);
    const newThreats = countThreats(nextState, state.turn);
    
    if (newThreats > currentThreats) {
      return action;
    }
  }

  return null;
}

/**
 * Count pieces on board for a player
 */
export function countPiecesOnBoard(state: GameState, player: Player): number {
  return Object.values(state.pieces).filter(
    (p) => p.owner === player && p.state === 'ON_BOARD'
  ).length;
}

/**
 * Count legal moves available for a player
 */
export function countLegalMoves(state: GameState, player: Player): number {
  const tempState = { ...state, turn: player };
  return generateLegalActions(tempState).length;
}

/**
 * Evaluate piece positioning (center control, etc.)
 */
export function evaluatePiecePositions(state: GameState, player: Player): number {
  let score = 0;

  for (const piece of Object.values(state.pieces)) {
    if (piece.owner !== player || piece.state !== 'ON_BOARD' || piece.pos === null) {
      continue;
    }

    const pos = piece.pos;

    // Center squares are more valuable
    if (CENTER_SQUARES.includes(pos)) {
      score += 15;
    }

    // Edge corners are less valuable
    if (EDGE_SQUARES.includes(pos)) {
      score -= 5;
    }

    // Bonus for pieces that are part of partial lines
    score += evaluatePieceConnectivity(state, piece.id, player);
  }

  return score;
}

/**
 * Evaluate how well a piece contributes to potential winning lines
 */
function evaluatePieceConnectivity(state: GameState, pieceId: PieceId, player: Player): number {
  const piece = state.pieces[pieceId];
  if (piece.pos === null) return 0;

  let connectivity = 0;

  for (const line of WIN_LINES) {
    if (!line.includes(piece.pos)) continue;

    let myCount = 0;
    let emptyCount = 0;
    let oppCount = 0;

    for (const pos of line) {
      const p = state.board[pos];
      if (p === null) {
        emptyCount++;
      } else if (state.pieces[p].owner === player) {
        myCount++;
      } else {
        oppCount++;
      }
    }

    // Line is viable if no opponent pieces block it
    if (oppCount === 0) {
      connectivity += myCount * 5 + emptyCount;
    }
  }

  return connectivity;
}

/**
 * Get center-focused actions (prefer center squares)
 */
export function getCenterActions(actions: Action[]): Action[] {
  return actions.filter((a) => CENTER_SQUARES.includes(a.to));
}

/**
 * Comprehensive position evaluation for minimax
 */
export function evaluatePosition(state: GameState, forPlayer: Player): number {
  // Terminal state checks
  if (state.winner === forPlayer) return 10000;
  if (state.winner === opponent(forPlayer)) return -10000;

  const opp = opponent(forPlayer);
  let score = 0;

  // 1. Threats (most important tactical factor)
  const myThreats = countThreats(state, forPlayer);
  const oppThreats = countThreats(state, opp);
  score += myThreats * 100;
  score -= oppThreats * 100;

  // 2. Piece positioning and connectivity
  score += evaluatePiecePositions(state, forPlayer);
  score -= evaluatePiecePositions(state, opp);

  // 3. Mobility (number of legal moves)
  const myMobility = countLegalMoves(state, forPlayer);
  const oppMobility = countLegalMoves(state, opp);
  score += myMobility * 2;
  score -= oppMobility * 2;

  // 4. Material count (pieces on board)
  const myMaterial = countPiecesOnBoard(state, forPlayer);
  const oppMaterial = countPiecesOnBoard(state, opp);
  score += myMaterial * 10;
  score -= oppMaterial * 10;

  // 5. Potential lines (lines with 2+ pieces and no opponent)
  score += countPotentialLines(state, forPlayer) * 20;
  score -= countPotentialLines(state, opp) * 20;

  return score;
}

/**
 * Count lines with 2+ pieces and no opponent pieces (potential future threats)
 */
function countPotentialLines(state: GameState, player: Player): number {
  let potentialLines = 0;

  for (const line of WIN_LINES) {
    let myCount = 0;
    let oppCount = 0;

    for (const pos of line) {
      const piece = state.board[pos];
      if (piece !== null) {
        if (state.pieces[piece].owner === player) {
          myCount++;
        } else {
          oppCount++;
        }
      }
    }

    // Potential line = 2+ my pieces, no opponent
    if (myCount >= 2 && oppCount === 0) {
      potentialLines++;
    }
  }

  return potentialLines;
}
