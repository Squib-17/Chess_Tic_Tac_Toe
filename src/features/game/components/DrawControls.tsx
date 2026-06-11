import type { Player } from '../../../domain/game-engine/chess-ttt-engine';
import { Button } from './ui';

type DrawControlsProps = {
  drawOfferedBy: Player | null;
  onOfferDraw: () => void;
  onAcceptDraw: () => void;
  onDeclineDraw: () => void;
  showInstantDraw?: boolean;
  canRespond?: boolean;
  canOffer?: boolean;
  waitingOnOpponent?: boolean;
};

export function DrawControls({
  drawOfferedBy,
  onOfferDraw,
  onAcceptDraw,
  onDeclineDraw,
  showInstantDraw = false,
  canRespond,
  canOffer,
  waitingOnOpponent = false,
}: DrawControlsProps) {
  if (showInstantDraw) {
    return (
      <div className="draw-actions">
        <Button variant="secondary" size="sm" onClick={onOfferDraw}>
          Offer Draw
        </Button>
      </div>
    );
  }

  const showRespond = canRespond ?? drawOfferedBy !== null;
  const showOffer = canOffer ?? drawOfferedBy === null;

  return (
    <div className="draw-actions">
      {waitingOnOpponent && (
        <p className="draw-offer-pending">Draw offered — waiting for opponent</p>
      )}
      {showRespond && !waitingOnOpponent && (
        <>
          <Button variant="secondary" size="sm" onClick={onAcceptDraw}>
            Accept Draw
          </Button>
          <Button variant="ghost" size="sm" onClick={onDeclineDraw}>
            Decline
          </Button>
        </>
      )}
      {showOffer && !waitingOnOpponent && (
        <Button variant="secondary" size="sm" onClick={onOfferDraw}>
          Offer Draw
        </Button>
      )}
    </div>
  );
}
