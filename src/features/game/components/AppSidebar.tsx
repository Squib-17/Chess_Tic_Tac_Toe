import { useMemo, useState } from 'react';
import type { BotDifficulty } from '../../ai/types';
import type { Phase, Player } from '../../../domain/game-engine/chess-ttt-engine';
import type { GameMode } from '../hooks/useChessTttGame';
import type { MultiplayerStatus } from '../hooks/useMultiplayerRoom';
import type { PublicGameSession } from '../../../shared/session';
import { getPlayerName } from '../utils/display';
import { Button, Select } from './ui';

type Tab = 'about' | 'vs-bot' | 'local' | 'online';

function BookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function CpuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" />
      <line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" />
      <line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" />
      <line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

const TAB_CONFIG = [
  { id: 'about' as const, label: 'About', Icon: BookIcon, mode: null },
  { id: 'vs-bot' as const, label: 'vs Bot', Icon: CpuIcon, mode: 'vs-bot' as GameMode },
  { id: 'local' as const, label: 'vs Local', Icon: UsersIcon, mode: 'local' as GameMode },
  { id: 'online' as const, label: 'Online', Icon: GlobeIcon, mode: 'online' as GameMode },
];

type MultiplayerProps = {
  createRoom: () => void;
  displayName: string;
  joinRoom: (roomId: string) => void;
  lastError: string | null;
  leaveRoom: () => void;
  pendingAutoJoinCode: string | null;
  reconnectRoom: () => void;
  requestRematch?: () => void;
  role: Player | 'spectator' | null;
  roomId: string | null;
  session: PublicGameSession | null;
  setDisplayName: (name: string) => void;
  status: MultiplayerStatus;
};

type AppSidebarProps = {
  gameMode: GameMode;
  botDifficulty: BotDifficulty;
  botPlayer: Player;
  isBotThinking: boolean;
  multiplayer: MultiplayerProps;
  score: { white: number; black: number };
  phase: Phase;
  ply: number;
  turn: Player;
  winner: Player | null;
  isDraw: boolean;
  drawOfferedBy: Player | null;
  onModeChange: (mode: GameMode) => void;
  onDifficultyChange: (difficulty: BotDifficulty) => void;
  onBotPlayerChange: (player: Player) => void;
  onReset: () => void;
  onResetScore: () => void;
};

export function AppSidebar({
  gameMode,
  botDifficulty,
  botPlayer,
  isBotThinking,
  multiplayer,
  score,
  phase,
  ply,
  turn,
  winner,
  isDraw,
  drawOfferedBy,
  onModeChange,
  onDifficultyChange,
  onBotPlayerChange,
  onReset,
  onResetScore,
}: AppSidebarProps) {
  const [showAbout, setShowAbout] = useState(false);

  const activeTab: Tab = showAbout
    ? 'about'
    : gameMode === 'vs-bot' ? 'vs-bot'
    : gameMode === 'online' ? 'online'
    : 'local';

  function handleTabClick(tab: Tab) {
    if (tab === 'about') {
      setShowAbout(true);
    } else {
      setShowAbout(false);
      const cfg = TAB_CONFIG.find((t) => t.id === tab);
      if (cfg?.mode) onModeChange(cfg.mode);
    }
  }

  const phaseDisplay = phase === 'PLACEMENT_ONLY'
    ? `Place ${ply}/6`
    : 'Move';

  return (
    <div className="app-sidebar">
      <nav className="app-nav-rail" aria-label="Game modes">
        {TAB_CONFIG.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`nav-tab-btn ${activeTab === id ? 'nav-tab-active' : ''}`}
            onClick={() => handleTabClick(id)}
            aria-pressed={activeTab === id}
            type="button"
          >
            <Icon />
            <span className="nav-tab-label">{label}</span>
          </button>
        ))}
      </nav>

      <div className="app-sidebar-panel">
        <div className="sidebar-status-strip">
          <button
            className="sidebar-score-btn"
            onClick={onResetScore}
            type="button"
            aria-label={`Score — White ${score.white}, Black ${score.black}. Click to reset.`}
            title="Click to reset score"
          >
            <span className="sidebar-score-piece" aria-hidden="true">♔</span>
            <span className="sidebar-score-num">{score.white}</span>
            <span className="sidebar-score-sep" aria-hidden="true">–</span>
            <span className="sidebar-score-num">{score.black}</span>
            <span className="sidebar-score-piece" aria-hidden="true">♚</span>
          </button>
          <div className="sidebar-phase-chip" role="status" aria-live="polite">
            {isDraw ? (
              <span className="chip-phase">Draw</span>
            ) : winner ? (
              <span className="chip-winner">{getPlayerName(winner)} wins</span>
            ) : drawOfferedBy ? (
              <span className="chip-phase">Draw offered</span>
            ) : (
              <span className="chip-phase">{phaseDisplay}</span>
            )}
          </div>
        </div>

        {activeTab === 'about' && <AboutPanel />}
        {activeTab === 'vs-bot' && (
          <BotPanel
            botDifficulty={botDifficulty}
            botPlayer={botPlayer}
            isBotThinking={isBotThinking}
            turn={turn}
            onDifficultyChange={onDifficultyChange}
            onBotPlayerChange={onBotPlayerChange}
            onReset={onReset}
          />
        )}
        {activeTab === 'local' && <LocalPanel turn={turn} winner={winner} onReset={onReset} />}
        {activeTab === 'online' && <OnlinePanel multiplayer={multiplayer} />}
      </div>
    </div>
  );
}

function AboutPanel() {
  return (
    <div className="tab-panel tab-panel-about">
      <p className="tab-panel-intro">
        A tactical 4×4 game — command a pawn, knight, bishop, and rook.
        Get four pieces in a line to win.
      </p>

      <ol className="rules-list">
        <li className="rules-item">
          <span className="rules-num" aria-hidden="true">1</span>
          <div><strong>Placement</strong> — Place three pieces each (6 turns total). No movement yet.</div>
        </li>
        <li className="rules-item">
          <span className="rules-num" aria-hidden="true">2</span>
          <div><strong>Hybrid phase</strong> — From turn seven: place, move, capture, or respawn.</div>
        </li>
        <li className="rules-item">
          <span className="rules-num" aria-hidden="true">3</span>
          <div><strong>Chess movement</strong> — Standard rules on a 4×4 board. Pawns reverse at the far edge.</div>
        </li>
        <li className="rules-item">
          <span className="rules-num" aria-hidden="true">4</span>
          <div><strong>Win</strong> — Four of your pieces in any row, column, or diagonal.</div>
        </li>
      </ol>

      <div className="about-pieces">
        <div className="about-piece-row">
          <span className="about-piece-sym" aria-hidden="true">♙</span>
          <span className="about-piece-name">Pawn</span>
          <span className="about-piece-desc">One square forward</span>
        </div>
        <div className="about-piece-row">
          <span className="about-piece-sym" aria-hidden="true">♘</span>
          <span className="about-piece-name">Knight</span>
          <span className="about-piece-desc">L-shape (2 + 1)</span>
        </div>
        <div className="about-piece-row">
          <span className="about-piece-sym" aria-hidden="true">♗</span>
          <span className="about-piece-name">Bishop</span>
          <span className="about-piece-desc">Any diagonal</span>
        </div>
        <div className="about-piece-row">
          <span className="about-piece-sym" aria-hidden="true">♖</span>
          <span className="about-piece-name">Rook</span>
          <span className="about-piece-desc">Any straight line</span>
        </div>
      </div>
    </div>
  );
}

type BotPanelProps = {
  botDifficulty: BotDifficulty;
  botPlayer: Player;
  isBotThinking: boolean;
  turn: Player;
  onDifficultyChange: (d: BotDifficulty) => void;
  onBotPlayerChange: (p: Player) => void;
  onReset: () => void;
};

function BotPanel({ botDifficulty, botPlayer, isBotThinking, onDifficultyChange, onBotPlayerChange, onReset }: BotPanelProps) {
  return (
    <div className="tab-panel tab-panel-bot">
      <p className="tab-panel-intro">Play against the computer. Pick your difficulty and side.</p>

      <div className="field-group">
        <label className="field-label" htmlFor="difficulty-select">Difficulty</label>
        <Select
          id="difficulty-select"
          value={botDifficulty}
          onChange={(e) => onDifficultyChange(e.target.value as BotDifficulty)}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
          <option value="expert">Expert</option>
        </Select>
      </div>

      <div className="field-group">
        <label className="field-label" htmlFor="bot-side-select">Bot plays as</label>
        <Select
          id="bot-side-select"
          value={botPlayer}
          onChange={(e) => onBotPlayerChange(e.target.value as Player)}
          aria-label="Bot plays as"
        >
          <option value="W">{getPlayerName('W')}</option>
          <option value="B">{getPlayerName('B')}</option>
        </Select>
      </div>

      {isBotThinking && (
        <div className="bot-thinking-strip" role="status" aria-live="polite">
          <span className="bot-dot" aria-hidden="true" />
          <span className="bot-dot" aria-hidden="true" />
          <span className="bot-dot" aria-hidden="true" />
          Thinking...
        </div>
      )}

      <Button className="btn-full" onClick={onReset} variant="primary">
        New Game
      </Button>
    </div>
  );
}

function LocalPanel({ turn, winner, onReset }: { turn: Player; winner: Player | null; onReset: () => void }) {
  return (
    <div className="tab-panel tab-panel-local">
      <p className="tab-panel-intro">Two players on the same device. White moves first.</p>

      <div className="local-turn-display" role="status" aria-live="polite">
        {winner ? (
          <span className="local-turn-winner">{getPlayerName(winner)} wins!</span>
        ) : (
          <>
            <span className="local-turn-piece" aria-hidden="true">{turn === 'W' ? '♔' : '♚'}</span>
            <span className="local-turn-text">{getPlayerName(turn)}'s turn</span>
          </>
        )}
      </div>

      <Button className="btn-full" onClick={onReset} variant="primary">
        New Game
      </Button>
    </div>
  );
}

function OnlinePanel({ multiplayer }: { multiplayer: MultiplayerProps }) {
  const [joinCode, setJoinCode] = useState(() => multiplayer.pendingAutoJoinCode ?? '');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [localError, setLocalError] = useState<string | null>(null);

  const onlineSummary = useMemo(() => {
    if (!multiplayer.session || !multiplayer.role) return 'Create or join a room to start online play.';
    if (multiplayer.role === 'spectator') return 'You are spectating this room.';
    const opponentRole = multiplayer.role === 'W' ? 'B' : 'W';
    const opponent = multiplayer.session.players[opponentRole];
    if (!opponent) return 'Waiting for an opponent to join.';
    if (opponent.status === 'disconnected') return 'Opponent disconnected. Waiting for them to reconnect.';
    const isTurn = multiplayer.session.game.turn === multiplayer.role;
    return isTurn ? 'Your turn.' : "Opponent's turn.";
  }, [multiplayer.role, multiplayer.session]);

  const spectatorCount = multiplayer.session?.spectators.length ?? 0;
  const errorText = localError ?? multiplayer.lastError;
  const gameWinner = multiplayer.session?.game.winner ?? null;
  const gameIsDraw = multiplayer.session?.game.isDraw ?? false;
  const canRematch = (gameWinner !== null || gameIsDraw) && (multiplayer.role === 'W' || multiplayer.role === 'B');

  function copyLink() {
    const url = `${window.location.origin}${window.location.pathname}?room=${multiplayer.roomId ?? ''}`;
    if (!navigator.clipboard) { setCopyStatus('failed'); return; }
    void navigator.clipboard.writeText(url)
      .then(() => setCopyStatus('copied'))
      .catch(() => setCopyStatus('failed'));
  }

  return (
    <div className="tab-panel tab-panel-online">
      <div className="field-group">
        <label className="field-label" htmlFor="display-name-input">Your name</label>
        <input
          id="display-name-input"
          className="ui-input"
          value={multiplayer.displayName}
          onChange={(e) => multiplayer.setDisplayName(e.target.value)}
          placeholder="Anonymous"
          maxLength={24}
          aria-label="Display name"
        />
      </div>

      <div className={`conn-pill conn-pill-${multiplayer.status}`} role="status">
        {multiplayer.status}
      </div>

      <p className="online-status-text" role="status">{onlineSummary}</p>

      {!multiplayer.roomId && (
        <>
          <Button
            onClick={multiplayer.createRoom}
            variant="primary"
            className="btn-full"
            disabled={multiplayer.status === 'connecting'}
          >
            Create Room
          </Button>

          <div className="online-or-divider">
            <span>or join</span>
          </div>

          <form
            className="join-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!joinCode.trim()) {
                setLocalError('Enter a room code');
                return;
              }
              setLocalError(null);
              multiplayer.joinRoom(joinCode);
            }}
          >
            <label className="field-label" htmlFor="room-code-input">Room code</label>
            <input
              id="room-code-input"
              className="ui-input room-code-input"
              value={joinCode}
              onChange={(e) => {
                setJoinCode(e.target.value.toUpperCase());
                if (localError) setLocalError(null);
              }}
              placeholder="ABCDE"
              aria-label="Room code"
              maxLength={8}
            />
            <Button
              type="submit"
              className="btn-full"
              disabled={multiplayer.status === 'connecting'}
            >
              Join Room
            </Button>
          </form>
        </>
      )}

      {multiplayer.roomId && (
        <div className="room-card-v2">
          <div className="room-card-header">
            <span className="room-card-meta-label">Room code</span>
            <span className="room-card-code">{multiplayer.roomId}</span>
          </div>
          <div className="room-card-info">
            <span>You are {multiplayer.role === 'W' ? 'White' : multiplayer.role === 'B' ? 'Black' : 'spectator'}</span>
            {spectatorCount > 0 && (
              <span>{spectatorCount} spectator{spectatorCount !== 1 ? 's' : ''}</span>
            )}
          </div>
          <div className="room-card-actions">
            <Button size="sm" onClick={copyLink}>
              {copyStatus === 'copied' ? 'Copied!' : 'Copy link'}
            </Button>
            {multiplayer.status === 'disconnected' && (
              <Button onClick={multiplayer.reconnectRoom} size="sm" variant="primary">
                Reconnect
              </Button>
            )}
            <Button onClick={multiplayer.leaveRoom} size="sm" variant="ghost">
              Leave
            </Button>
          </div>
          {copyStatus === 'failed' && (
            <p className="room-card-copy-error">Copy unavailable in this browser</p>
          )}
          {canRematch && multiplayer.requestRematch && (
            <Button
              className="btn-full rematch-btn"
              onClick={multiplayer.requestRematch}
              variant="primary"
            >
              Rematch
            </Button>
          )}
        </div>
      )}

      {errorText && (
        <p className="online-error-msg" role="alert">{errorText}</p>
      )}
    </div>
  );
}
