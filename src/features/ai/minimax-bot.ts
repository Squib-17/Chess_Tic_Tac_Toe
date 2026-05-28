// Minimax AI strategy with alpha-beta pruning
// Implements Hard and Expert difficulty levels

import type { GameState, Action, Player } from '../../domain/game-engine/chess-ttt-engine';
import {
  CENTER_SQUARES,
  applyAction,
  generateLegalActions,
} from '../../domain/game-engine/chess-ttt-engine';
import { evaluatePosition, findWinningMove } from './evaluator';

interface ScoredAction {
  action: Action;
  score: number;
}

/**
 * Get best move using minimax algorithm
 */
export function getMinimaxMove(state: GameState, maxDepth: number): Action {
  const actions = generateLegalActions(state);
  
  if (actions.length === 0) {
    throw new Error('No legal moves available');
  }

  // Quick win check (avoid unnecessary computation)
  const winningMove = findWinningMove(state);
  if (winningMove) {
    return winningMove;
  }

  // Order moves for better alpha-beta pruning
  const orderedActions = orderMoves(state, actions);

  let bestAction = orderedActions[0];
  let bestScore = -Infinity;
  let alpha = -Infinity;
  const beta = Infinity;

  // Search each move
  for (const action of orderedActions) {
    const nextState = applyAction(state, action);
    const score = minimax(nextState, maxDepth - 1, alpha, beta, false, state.turn);

    if (score > bestScore) {
      bestScore = score;
      bestAction = action;
    }

    alpha = Math.max(alpha, score);
  }

  return bestAction;
}

/**
 * Minimax algorithm with alpha-beta pruning
 * 
 * @param state - Current game state
 * @param depth - Remaining search depth
 * @param alpha - Best score for maximizing player
 * @param beta - Best score for minimizing player
 * @param maximizing - True if maximizing player's turn
 * @param originalPlayer - The player we're calculating the best move for
 */
function minimax(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  originalPlayer: Player
): number {
  // Terminal conditions
  if (state.winner !== null) {
    // Winning is best, losing is worst
    if (state.winner === originalPlayer) {
      return 10000 + depth; // Prefer faster wins
    } else {
      return -10000 - depth; // Prefer slower losses
    }
  }

  if (depth === 0) {
    return evaluatePosition(state, originalPlayer);
  }

  const actions = generateLegalActions(state);
  
  if (actions.length === 0) {
    // No legal moves means the player loses
    if (state.turn === originalPlayer) {
      return -10000 - depth;
    } else {
      return 10000 + depth;
    }
  }

  if (maximizing) {
    let maxEval = -Infinity;

    for (const action of actions) {
      const nextState = applyAction(state, action);
      const evaluation = minimax(nextState, depth - 1, alpha, beta, false, originalPlayer);
      
      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);

      // Alpha-beta pruning
      if (beta <= alpha) {
        break;
      }
    }

    return maxEval;
  } else {
    let minEval = Infinity;

    for (const action of actions) {
      const nextState = applyAction(state, action);
      const evaluation = minimax(nextState, depth - 1, alpha, beta, true, originalPlayer);
      
      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);

      // Alpha-beta pruning
      if (beta <= alpha) {
        break;
      }
    }

    return minEval;
  }
}

/**
 * Order moves to improve alpha-beta pruning efficiency
 * Better moves first = more cutoffs = faster search
 */
function orderMoves(state: GameState, actions: Action[]): Action[] {
  const scoredActions: ScoredAction[] = actions.map((action) => ({
    action,
    score: scoreMove(state, action),
  }));

  // Sort by score descending (best moves first)
  scoredActions.sort((a, b) => b.score - a.score);

  return scoredActions.map((sa) => sa.action);
}

/**
 * Quick heuristic scoring for move ordering
 */
function scoreMove(state: GameState, action: Action): number {
  let score = 0;

  // Captures are very valuable
  if (action.kind === 'CAPTURE') {
    score += 100;
    
    // Capturing opponent's pieces by type
    const capturedPiece = state.pieces[action.capturedId];
    if (capturedPiece.type === 'R') score += 40;
    else if (capturedPiece.type === 'B') score += 30;
    else if (capturedPiece.type === 'N') score += 25;
    else if (capturedPiece.type === 'P') score += 15;
  }

  // Center squares are strategic
  if (CENTER_SQUARES.includes(action.to)) {
    score += 20;
  }

  // Respawns can be powerful
  if (action.kind === 'RESPAWN') {
    score += 15;
  }

  // Piece type preference for moves
  if (action.kind === 'MOVE' || action.kind === 'CAPTURE') {
    const piece = state.pieces[action.pieceId];
    if (piece.type === 'R') score += 12;
    else if (piece.type === 'B') score += 10;
    else if (piece.type === 'N') score += 8;
    else if (piece.type === 'P') score += 5;
  }

  // Placement to center in early game
  if (action.kind === 'PLACE' && state.ply <= 6) {
    if (CENTER_SQUARES.includes(action.to)) {
      score += 25;
    }
  }

  return score;
}

/**
 * Get Hard difficulty move (depth 3)
 */
export function getHardMove(state: GameState): Action {
  return getMinimaxMove(state, 3);
}

/**
 * Get Expert difficulty move (depth 4)
 */
export function getExpertMove(state: GameState): Action {
  return getMinimaxMove(state, 4);
}
