import Confetti from 'react-confetti';
import { DrawControls } from './components/DrawControls';
import { AppSidebar } from './components/AppSidebar';
import { GameBoard } from './components/GameBoard';
import { MoveHistory } from './components/MoveHistory';
import { PlayerPanel } from './components/PlayerPanel';
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

  const canControlWhite =
    game.game.turn === 'W' &&
    (game.gameMode !== 'online' || game.multiplayer.role === 'W');
  const canControlBlack =
    game.game.turn === 'B' &&
    (game.gameMode !== 'online' || game.multiplayer.role === 'B');

  const onlineTurnText =
    game.gameMode === 'online' && game.multiplayer.role
      ? game.multiplayer.role === 'spectator'
        ? 'Spectating this room'
        : game.game.turn === game.multiplayer.role
          ? 'Your turn'
          : "Opponent's turn"
      : null;

  return (
    <div className="app-shell">
      {game.showConfetti && <Confetti recycle={false} numberOfPieces={500} />}

      {(game.game.winner || game.game.isDraw) && game.showWinnerOverlay && (
        <WinnerOverlay
          winner={game.game.winner}
          isDraw={game.game.isDraw}
          winnerScore={
            game.game.winner === 'W' ? game.score.white : game.game.winner === 'B' ? game.score.black : undefined
          }
          onClose={() => game.setShowWinnerOverlay(false)}
          onNewGame={game.reset}
          onRematch={
            game.gameMode === 'online' && game.multiplayer.role !== 'spectator'
              ? game.requestRematch
              : undefined
          }
        />
      )}

      <header className="app-header">
        <div className="app-header-brand">
          <span className="app-header-chess">Chess</span>
          <span className="app-header-x" aria-hidden="true">×</span>
          <span className="app-header-ttt">Tic-Tac-Toe</span>
        </div>
        <p className="app-header-tagline">Four pieces. One clean line.</p>
      </header>

      <div className="app-body">
        <AppSidebar
          gameMode={game.gameMode}
          botDifficulty={game.botDifficulty}
          botPlayer={game.botPlayer}
          isBotThinking={game.isBotThinking}
          multiplayer={{
            createRoom: game.multiplayer.createRoom,
            displayName: game.multiplayer.displayName,
            joinRoom: game.multiplayer.joinRoom,
            lastError: game.multiplayer.lastError,
            leaveRoom: game.multiplayer.leaveRoom,
            pendingAutoJoinCode: game.multiplayer.pendingAutoJoinCode,
            reconnectRoom: game.multiplayer.reconnectRoom,
            requestRematch: game.requestRematch,
            role: game.multiplayer.role,
            roomId: game.multiplayer.roomId,
            session: game.multiplayer.session,
            setDisplayName: game.multiplayer.setDisplayName,
            status: game.multiplayer.status,
          }}
          score={game.score}
          phase={game.phase}
          ply={game.game.ply}
          turn={game.game.turn}
          winner={game.game.winner}
          isDraw={game.game.isDraw}
          drawOfferedBy={game.drawOfferedBy}
          onModeChange={game.setGameMode}
          onDifficultyChange={game.setBotDifficulty}
          onBotPlayerChange={game.setBotPlayer}
          onReset={game.reset}
          onResetScore={game.resetScore}
        />

        <main className="board-area">
          {game.ui.lastError && (
            <div className="error-message" role="alert">
              {game.ui.lastError}
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
            displayName={game.multiplayer.session?.players.W?.displayName}
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
            displayName={game.multiplayer.session?.players.B?.displayName}
          />

          <div className="instructions" aria-live="polite">
            {onlineTurnText && (
              <p className="online-turn-text">{onlineTurnText}</p>
            )}
            {game.selectedPiece ? (
              <p>
                <strong>{game.selectedPiece}</strong> selected — click a
                highlighted square{' '}
                <button
                  className="link-button"
                  onClick={() => game.dispatch({ type: 'CANCEL_SELECTION' })}
                  type="button"
                >
                  Unselect
                </button>
              </p>
            ) : game.phase === 'PLACEMENT_ONLY' ? (
              <p>Select a piece from your tray, then click an empty square</p>
            ) : (
              <p>Select a piece to place, move, capture, or respawn</p>
            )}
          </div>

          {!game.game.winner && !game.game.isDraw && game.gameMode !== 'online' && (
            <DrawControls
              drawOfferedBy={game.drawOfferedBy}
              onOfferDraw={game.offerDraw}
              onAcceptDraw={game.acceptDraw}
              onDeclineDraw={game.declineDraw}
              showInstantDraw={game.gameMode === 'vs-bot'}
            />
          )}

          {!game.game.winner && !game.game.isDraw && game.gameMode === 'online' && game.multiplayer.roomId && (
            <DrawControls
              drawOfferedBy={game.drawOfferedBy}
              onOfferDraw={game.offerDraw}
              onAcceptDraw={game.acceptDraw}
              onDeclineDraw={game.declineDraw}
              canRespond={
                (game.multiplayer.role === 'W' || game.multiplayer.role === 'B')
                && game.drawOfferedBy !== null
                && game.drawOfferedBy !== game.multiplayer.role
              }
              canOffer={
                (game.multiplayer.role === 'W' || game.multiplayer.role === 'B')
                && game.drawOfferedBy === null
              }
              waitingOnOpponent={
                game.drawOfferedBy !== null
                && game.drawOfferedBy === game.multiplayer.role
              }
            />
          )}
        </main>

        <aside className="right-sidebar">
          <MoveHistory
            history={game.game.moveHistory}
            viewingMoveIndex={game.viewingMoveIndex}
            gameEnded={game.game.winner !== null || game.game.isDraw}
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
