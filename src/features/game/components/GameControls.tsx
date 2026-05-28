import { useMemo, useState } from 'react';
import type { BotDifficulty } from '../../ai/types';
import type { Player } from '../../../domain/game-engine/chess-ttt-engine';
import type { GameMode } from '../hooks/useChessTttGame';
import type { MultiplayerStatus } from '../hooks/useMultiplayerRoom';
import type { PublicGameSession } from '../../../shared/session';
import { getPlayerName } from '../utils/display';
import { Button, Select } from './ui';

type GameControlsProps = {
  gameMode: GameMode;
  botDifficulty: BotDifficulty;
  botPlayer: Player;
  isBotThinking: boolean;
  multiplayer: {
    createRoom: () => void;
    joinRoom: (roomId: string) => void;
    lastError: string | null;
    leaveRoom: () => void;
    reconnectRoom: () => void;
    role: Player | 'spectator' | null;
    roomId: string | null;
    session: PublicGameSession | null;
    status: MultiplayerStatus;
  };
  onModeChange: (mode: GameMode) => void;
  onDifficultyChange: (difficulty: BotDifficulty) => void;
  onBotPlayerChange: (player: Player) => void;
};

export function GameControls({
  gameMode,
  botDifficulty,
  botPlayer,
  isBotThinking,
  multiplayer,
  onModeChange,
  onDifficultyChange,
  onBotPlayerChange,
}: GameControlsProps) {
  const [joinCode, setJoinCode] = useState('');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const onlineSummary = useMemo(() => {
    if (!multiplayer.session || !multiplayer.role) return 'Create or join a room to start online play.';
    if (multiplayer.role === 'spectator') return 'You are spectating this room.';

    const opponentRole = multiplayer.role === 'W' ? 'B' : 'W';
    const opponent = multiplayer.session.players[opponentRole];
    if (!opponent) return 'Waiting for an opponent to join.';
    if (opponent.status === 'disconnected') return 'Opponent disconnected. Waiting for them to reconnect.';

    const turn = multiplayer.session.game.turn;
    return turn === multiplayer.role ? 'Your turn.' : "Opponent's turn.";
  }, [multiplayer.role, multiplayer.session]);
  const spectatorCount = multiplayer.session?.spectators.length ?? 0;

  return (
    <section className="sidebar-section" aria-labelledby="game-mode-title">
      <h3 className="sidebar-title" id="game-mode-title">Game Mode</h3>
      <div className="mode-selector-vertical" role="group" aria-label="Game mode">
        <Button
          className={gameMode === 'local' ? 'active' : ''}
          onClick={() => onModeChange('local')}
          aria-pressed={gameMode === 'local'}
        >
          <span aria-hidden="true">👥</span> 2 Players
        </Button>
        <Button
          className={gameMode === 'vs-bot' ? 'active' : ''}
          onClick={() => onModeChange('vs-bot')}
          aria-pressed={gameMode === 'vs-bot'}
        >
          <span aria-hidden="true">🤖</span> vs Bot
        </Button>
        <Button
          className={gameMode === 'online' ? 'active' : ''}
          onClick={() => onModeChange('online')}
          aria-pressed={gameMode === 'online'}
        >
          <span aria-hidden="true">🌐</span> Online
        </Button>
      </div>

      {gameMode === 'vs-bot' && (
        <div className="bot-controls-vertical">
          <label className="bot-control-label">
            Difficulty
            <Select
              value={botDifficulty}
              onChange={(e) => onDifficultyChange(e.target.value as BotDifficulty)}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="expert">Expert</option>
            </Select>
          </label>
          <label className="bot-control-label">
            Bot plays as
            <Select
              value={botPlayer}
              onChange={(e) => onBotPlayerChange(e.target.value as Player)}
            >
              <option value="W">{getPlayerName('W')}</option>
              <option value="B">{getPlayerName('B')}</option>
            </Select>
          </label>
          {isBotThinking && (
            <div className="bot-thinking" role="status" aria-live="polite">
              <span aria-hidden="true">🤔</span> Thinking...
            </div>
          )}
        </div>
      )}

      {gameMode === 'online' && (
        <div className="online-controls">
          <div className={`connection-pill status-${multiplayer.status}`}>
            {multiplayer.status}
          </div>
          <p className="online-summary" role="status">
            {onlineSummary}
          </p>

          <Button
            onClick={multiplayer.createRoom}
            variant="primary"
            disabled={multiplayer.status === 'connecting'}
          >
            Create Room
          </Button>

          <form
            className="join-room-form"
            onSubmit={(event) => {
              event.preventDefault();
              multiplayer.joinRoom(joinCode);
            }}
          >
            <label className="bot-control-label">
              Room code
              <input
                className="ui-input"
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                placeholder="ABCDE"
              />
            </label>
            <Button type="submit" disabled={multiplayer.status === 'connecting'}>
              Join Room
            </Button>
          </form>

          {multiplayer.roomId && (
            <div className="room-card">
              <span className="room-label">Room</span>
              <strong>{multiplayer.roomId}</strong>
              <span className="room-label">You are {multiplayer.role}</span>
              <span className="room-label">{spectatorCount} spectator{spectatorCount === 1 ? '' : 's'}</span>
              <Button
                onClick={() => {
                  const code = multiplayer.roomId ?? '';
                  if (!navigator.clipboard) {
                    setCopyStatus('failed');
                    return;
                  }

                  void navigator.clipboard
                    .writeText(code)
                    .then(() => setCopyStatus('copied'))
                    .catch(() => setCopyStatus('failed'));
                }}
                size="sm"
              >
                Copy code
              </Button>
              {copyStatus === 'copied' && <span className="copy-feedback">Copied</span>}
              {copyStatus === 'failed' && <span className="copy-feedback">Copy unavailable</span>}
              {multiplayer.status === 'disconnected' && (
                <Button onClick={multiplayer.reconnectRoom} size="sm" variant="primary">
                  Reconnect
                </Button>
              )}
              <Button onClick={multiplayer.leaveRoom} size="sm" variant="ghost">
                Leave
              </Button>
            </div>
          )}

          {multiplayer.lastError && (
            <p className="online-error" role="alert">
              {multiplayer.lastError}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
