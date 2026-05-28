import Confetti from 'react-confetti';
import { GameBoard } from './components/GameBoard';
import { GameControls } from './components/GameControls';
import { GameStatus } from './components/GameStatus';
import { MoveHistory } from './components/MoveHistory';
import { PlayerPanel } from './components/PlayerPanel';
import { RulesAccordion } from './components/RulesAccordion';
import { ScoreTracker } from './components/ScoreTracker';
import { WinnerOverlay } from './components/WinnerOverlay';
import { useChessTttGame } from './hooks/useChessTttGame';

export function Game() {
  const game = useChessTttGame();
  const whitePieces = [
    game.displayedGame.pieces.W_P,
    game.displayedGame.pieces.W_N,
    game.displayedGame.pieces.W_B,
    game.displayedGame.pieces.W_R,
  ];
  const blackPieces = [
    game.displayedGame.pieces.B_P,
    game.displayedGame.pieces.B_N,
    game.displayedGame.pieces.B_B,
    game.displayedGame.pieces.B_R,
  ];
  const canControlWhite = game.game.turn === 'W' && (game.gameMode !== 'online' || game.multiplayer.role === 'W');
  const canControlBlack = game.game.turn === 'B' && (game.gameMode !== 'online' || game.multiplayer.role === 'B');
  const onlineTurnText = game.gameMode === 'online' && game.multiplayer.role
    ? game.multiplayer.role === 'spectator'
      ? 'Spectating this room'
      : game.game.turn === game.multiplayer.role
        ? 'Your turn'
        : "Opponent's turn"
    : null;

  return (
    <div className="game-wrapper">
      {game.showConfetti && <Confetti recycle={false} numberOfPieces={500} />}

      {game.game.winner && game.showWinnerOverlay && (
        <WinnerOverlay
          winner={game.game.winner}
          winnerScore={game.game.winner === 'W' ? game.score.white : game.score.black}
          onClose={() => game.setShowWinnerOverlay(false)}
          onNewGame={game.reset}
        />
      )}

      <header className="game-topbar">
        <div>
          <p className="game-kicker">Chess Tic-Tac-Toe</p>
          <h1>Four pieces. One clean line.</h1>
        </div>
        <RulesAccordion />
      </header>

      <div className="game-layout">
        <aside className="left-sidebar">
          <GameControls
            gameMode={game.gameMode}
            botDifficulty={game.botDifficulty}
            botPlayer={game.botPlayer}
            isBotThinking={game.isBotThinking}
            multiplayer={game.multiplayer}
            onModeChange={game.setGameMode}
            onDifficultyChange={game.setBotDifficulty}
            onBotPlayerChange={game.setBotPlayer}
          />
          <ScoreTracker score={game.score} onResetScore={game.resetScore} />
          <GameStatus
            phase={game.phase}
            ply={game.game.ply}
            turn={game.game.turn}
            winner={game.game.winner}
            onReset={game.reset}
          />
        </aside>

        <main className="board-area">
          {game.ui.lastError && (
            <div className="error-message" role="alert">
              <span aria-hidden="true">⚠️</span> {game.ui.lastError}
            </div>
          )}

          <PlayerPanel
            player="W"
            pieces={whitePieces}
            isCurrentTurn={canControlWhite}
            selectedPiece={game.selectedPiece}
            onPieceClick={game.onReservePieceClick}
            phase={game.phase}
            gameWinner={game.game.winner}
          />

          <GameBoard
            displayedGame={game.displayedGame}
            destinations={game.destinations}
            isInReplayMode={game.isInReplayMode}
            onSquareClick={game.onSquareClick}
          />

          <PlayerPanel
            player="B"
            pieces={blackPieces}
            isCurrentTurn={canControlBlack}
            selectedPiece={game.selectedPiece}
            onPieceClick={game.onReservePieceClick}
            phase={game.phase}
            gameWinner={game.game.winner}
          />

          <div className="instructions" aria-live="polite">
            {onlineTurnText && (
              <p className="online-turn-text">{onlineTurnText}</p>
            )}
            {game.selectedPiece ? (
              <p>
                <strong>{game.selectedPiece}</strong> selected - Click a highlighted square
                {' | '}
                <button className="link-button" onClick={() => game.dispatch({ type: 'CANCEL_SELECTION' })} type="button">
                  Unselect
                </button>
              </p>
            ) : game.phase === 'PLACEMENT_ONLY' ? (
              <p>Select a piece, then click an empty square</p>
            ) : (
              <p>Select a piece to place, move, capture, or respawn</p>
            )}
          </div>
        </main>

        <aside className="right-sidebar">
          <MoveHistory
            history={game.game.moveHistory}
            viewingMoveIndex={game.viewingMoveIndex}
            gameEnded={game.game.winner !== null}
            onNavigatePrevious={game.goToPreviousMove}
            onNavigateNext={game.goToNextMove}
            onGoToMove={game.goToMove}
            onReturnToLive={game.returnToLive}
          />
        </aside>
      </div>
    </div>
  );
}
