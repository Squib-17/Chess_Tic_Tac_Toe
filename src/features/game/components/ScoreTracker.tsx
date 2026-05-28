type ScoreTrackerProps = {
  score: {
    white: number;
    black: number;
  };
  onResetScore: () => void;
};

export function ScoreTracker({ score, onResetScore }: ScoreTrackerProps) {
  return (
    <section className="sidebar-section" aria-labelledby="score-title">
      <h3 className="sidebar-title" id="score-title">Score</h3>
      <button
        className="score-tracker-vertical"
        onClick={onResetScore}
        type="button"
        aria-label={`Reset score. Current score is White ${score.white}, Black ${score.black}`}
        title="Reset score"
      >
        <span className="score-item-vertical">
          <span className="score-icon" aria-hidden="true">⚪</span>
          <span className="score-label">White</span>
          <span className="score-value">{score.white}</span>
        </span>
        <span className="score-item-vertical">
          <span className="score-icon" aria-hidden="true">⚫</span>
          <span className="score-label">Black</span>
          <span className="score-value">{score.black}</span>
        </span>
      </button>
    </section>
  );
}
