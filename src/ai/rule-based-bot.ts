// Rule-based AI strategy for Chess Tic-Tac-Toe
// Implements Easy and Medium difficulty levels using heuristics

import type { GameState, Action } from '../engine/chess-ttt-engine';
import { generateLegalActions } from '../engine/chess-ttt-engine';
import {
  findWinningMove,
  findBlockingMove,
  findThreatCreatingMove,
  getCenterActions,
  countThreats,
} from './evaluator';

/**
 * Easy mode: Basic strategy with occasional mistakes
 * - Always takes winning moves
 * - Blocks opponent wins 80% of the time
 * - Otherwise plays randomly
 */
export function getEasyMove(state: GameState): Action {
  const actions = generateLegalActions(state);
  
  if (actions.length === 0) {
    throw new Error('No legal moves available');
  }

  // 1. Win if possible (100%)
  const winningMove = findWinningMove(state);
  if (winningMove) {
    return winningMove;
  }

  // 2. Block opponent win (80% of the time - occasionally misses for realism)
  const blockingMove = findBlockingMove(state);
  if (blockingMove && Math.random() > 0.2) {
    return blockingMove;
  }

  // 3. Prefer center squares in placement phase
  if (state.ply <= 6) {
    const centerActions = getCenterActions(actions);
    if (centerActions.length > 0 && Math.random() > 0.3) {
      return centerActions[Math.floor(Math.random() * centerActions.length)];
    }
  }

  // 4. Random move
  return actions[Math.floor(Math.random() * actions.length)];
}

/**
 * Medium mode: Solid strategic play
 * - Win detection and blocking
 * - Threat creation and blocking
 * - Strategic positioning
 * - Center control
 */
export function getMediumMove(state: GameState): Action {
  const actions = generateLegalActions(state);
  
  if (actions.length === 0) {
    throw new Error('No legal moves available');
  }

  // 1. Win immediately if possible (Priority: 100%)
  const winningMove = findWinningMove(state);
  if (winningMove) {
    return winningMove;
  }

  // 2. Block opponent's winning move (Priority: 100%)
  const blockingMove = findBlockingMove(state);
  if (blockingMove) {
    return blockingMove;
  }

  // 3. Create a threat (3 in a row with gap) (Priority: 90%)
  const threatMove = findThreatCreatingMove(state);
  if (threatMove && Math.random() > 0.1) {
    return threatMove;
  }

  // 4. Block opponent threats (Priority: 85%)
  const oppThreatBlock = findOpponentThreatBlockingMove(state);
  if (oppThreatBlock && Math.random() > 0.15) {
    return oppThreatBlock;
  }

  // 5. Strategic move selection
  return selectStrategicMove(state, actions);
}

/**
 * Find move that blocks an opponent's threat
 */
function findOpponentThreatBlockingMove(state: GameState): Action | null {
  const opp = state.turn === 'W' ? 'B' : 'W';
  const oppThreats = countThreats(state, opp);
  
  if (oppThreats === 0) return null;

  const actions = generateLegalActions(state);
  
  // Try to find a move that reduces opponent threats
  for (const action of actions) {
    // Check if this square is part of opponent's threat
    if (wouldBlockThreat(state, action, opp)) {
      return action;
    }
  }

  return null;
}

/**
 * Check if an action would block opponent's threat
 */
function wouldBlockThreat(state: GameState, action: Action, opp: 'W' | 'B'): boolean {
  const WIN_LINES = [
    [0, 1, 2, 3],
    [4, 5, 6, 7],
    [8, 9, 10, 11],
    [12, 13, 14, 15],
    [0, 4, 8, 12],
    [1, 5, 9, 13],
    [2, 6, 10, 14],
    [3, 7, 11, 15],
    [0, 5, 10, 15],
    [3, 6, 9, 12],
  ];

  for (const line of WIN_LINES) {
    if (!line.includes(action.to)) continue;

    let oppCount = 0;
    let emptyCount = 0;

    for (const pos of line) {
      const piece = state.board[pos];
      if (piece === null) {
        emptyCount++;
      } else if (state.pieces[piece].owner === opp) {
        oppCount++;
      }
    }

    // This is a threat line if opponent has 3 and there's 1 empty
    if (oppCount === 3 && emptyCount === 1) {
      return true;
    }
  }

  return false;
}

/**
 * Select best strategic move based on multiple factors
 */
function selectStrategicMove(state: GameState, actions: Action[]): Action {
  // Phase-specific strategy
  if (state.ply <= 6) {
    // Placement phase: prefer center squares
    return selectPlacementPhaseMove(state, actions);
  } else {
    // Hybrid phase: prefer moves that improve position
    return selectHybridPhaseMove(state, actions);
  }
}

/**
 * Strategic move selection for placement phase (plies 1-6)
 */
function selectPlacementPhaseMove(state: GameState, actions: Action[]): Action {
  const CENTER_SQUARES = [5, 6, 9, 10];
  const INNER_SQUARES = [1, 2, 4, 7, 8, 11, 13, 14];

  // Strongly prefer center squares
  const centerActions = actions.filter((a) => CENTER_SQUARES.includes(a.to));
  if (centerActions.length > 0) {
    return centerActions[Math.floor(Math.random() * centerActions.length)];
  }

  // Next prefer inner squares
  const innerActions = actions.filter((a) => INNER_SQUARES.includes(a.to));
  if (innerActions.length > 0) {
    return innerActions[Math.floor(Math.random() * innerActions.length)];
  }

  // Fallback to any action
  return actions[Math.floor(Math.random() * actions.length)];
}

/**
 * Strategic move selection for hybrid phase (ply 7+)
 */
function selectHybridPhaseMove(state: GameState, actions: Action[]): Action {
  // Score each action and pick the best
  let bestAction = actions[0];
  let bestScore = -Infinity;

  for (const action of actions) {
    let score = 0;

    // Captures are valuable
    if (action.kind === 'CAPTURE') {
      score += 30;
    }

    // Center squares are good
    const CENTER_SQUARES = [5, 6, 9, 10];
    if (CENTER_SQUARES.includes(action.to)) {
      score += 15;
    }

    // Respawns are situational
    if (action.kind === 'RESPAWN') {
      score += 10;
    }

    // Prefer moving more valuable pieces (Rook > Bishop > Knight > Pawn)
    if (action.kind === 'MOVE' || action.kind === 'CAPTURE') {
      const piece = state.pieces[action.pieceId];
      if (piece.type === 'R') score += 8;
      else if (piece.type === 'B') score += 6;
      else if (piece.type === 'N') score += 5;
      else if (piece.type === 'P') score += 3;
    }

    // Add some randomness to avoid predictability
    score += Math.random() * 10;

    if (score > bestScore) {
      bestScore = score;
      bestAction = action;
    }
  }

  return bestAction;
}
