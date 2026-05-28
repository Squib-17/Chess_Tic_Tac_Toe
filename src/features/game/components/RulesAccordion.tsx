export function RulesAccordion() {
  return (
    <details className="rules-accordion">
      <summary className="rules-summary">
        <span className="rules-summary-title">How to play</span>
        <span className="rules-summary-hint">Placement, movement, captures, and winning</span>
      </summary>
      <div className="rules-content">
        <div className="rule-step">
          <span className="rule-number">1</span>
          <p>Place three pieces each during the first six turns. No movement or captures happen yet.</p>
        </div>
        <div className="rule-step">
          <span className="rule-number">2</span>
          <p>From turn seven onward, place your last piece, move, capture, or respawn a captured piece.</p>
        </div>
        <div className="rule-step">
          <span className="rule-number">3</span>
          <p>Pieces move like chess pieces on a 4x4 board. Pawns move away from their owner, then reverse at the far edge.</p>
        </div>
        <div className="rule-step">
          <span className="rule-number">4</span>
          <p>Make four of your pieces in a row, column, or diagonal to win immediately.</p>
        </div>
      </div>
    </details>
  );
}
