// AI-specific types for Chess Tic-Tac-Toe bot

export type BotDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export type BotStrategy = 'rule-based' | 'minimax';

export interface BotConfig {
  difficulty: BotDifficulty;
  thinkingTimeMs: number; // Artificial delay for better UX
  strategy: BotStrategy;
  minmaxDepth?: number; // For minimax strategy
}

export const BOT_CONFIGS: Record<BotDifficulty, BotConfig> = {
  easy: {
    difficulty: 'easy',
    thinkingTimeMs: 300,
    strategy: 'rule-based',
  },
  medium: {
    difficulty: 'medium',
    thinkingTimeMs: 400,
    strategy: 'rule-based',
  },
  hard: {
    difficulty: 'hard',
    thinkingTimeMs: 500,
    strategy: 'minimax',
    minmaxDepth: 3,
  },
  expert: {
    difficulty: 'expert',
    thinkingTimeMs: 600,
    strategy: 'minimax',
    minmaxDepth: 4,
  },
};
