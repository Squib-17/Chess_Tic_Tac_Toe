// Bot Controller - Main entry point for AI moves
// Routes to appropriate strategy based on difficulty level

import type { GameState, Action } from '../../domain/game-engine/chess-ttt-engine';
import { generateLegalActions } from '../../domain/game-engine/chess-ttt-engine';
import type { BotDifficulty } from './types';
import { BOT_CONFIGS } from './types';
import { getEasyMove, getMediumMove } from './rule-based-bot';
import { getHardMove, getExpertMove } from './minimax-bot';

/**
 * Get the best move for the bot at the given difficulty level
 * Returns a promise to allow for artificial "thinking" delay
 * 
 * @param state - Current game state
 * @param difficulty - Bot difficulty level
 * @returns Promise resolving to the selected action
 */
export async function getBotMove(
  state: GameState,
  difficulty: BotDifficulty
): Promise<Action | null> {
  if (state.winner || generateLegalActions(state).length === 0) {
    return null;
  }

  const config = BOT_CONFIGS[difficulty];
  
  // Calculate the move (synchronous)
  const startTime = performance.now();
  let action: Action;

  try {
    switch (difficulty) {
      case 'easy':
        action = getEasyMove(state);
        break;
      case 'medium':
        action = getMediumMove(state);
        break;
      case 'hard':
        action = getHardMove(state);
        break;
      case 'expert':
        action = getExpertMove(state);
        break;
      default:
        throw new Error(`Unknown difficulty: ${difficulty}`);
    }
  } catch (error) {
    console.error('Error calculating bot move:', error);
    throw error;
  }

  const calculationTime = performance.now() - startTime;

  // Add artificial delay for better UX (make bot feel more "human")
  // If calculation was already slow, reduce or skip the delay
  const targetDelay = config.thinkingTimeMs;
  const remainingDelay = Math.max(0, targetDelay - calculationTime);

  if (remainingDelay > 0) {
    await new Promise((resolve) => setTimeout(resolve, remainingDelay));
  }

  return action;
}

/**
 * Get move synchronously (for testing or special cases)
 */
export function getBotMoveSync(
  state: GameState,
  difficulty: BotDifficulty
): Action | null {
  if (state.winner || generateLegalActions(state).length === 0) {
    return null;
  }

  switch (difficulty) {
    case 'easy':
      return getEasyMove(state);
    case 'medium':
      return getMediumMove(state);
    case 'hard':
      return getHardMove(state);
    case 'expert':
      return getExpertMove(state);
    default:
      throw new Error(`Unknown difficulty: ${difficulty}`);
  }
}

/**
 * Get estimated thinking time for a difficulty level
 */
export function getEstimatedThinkingTime(difficulty: BotDifficulty): number {
  return BOT_CONFIGS[difficulty].thinkingTimeMs;
}

/**
 * Check if bot can make a move (has legal actions)
 */
export function canBotMove(state: GameState): boolean {
  return !state.winner && generateLegalActions(state).length > 0;
}
