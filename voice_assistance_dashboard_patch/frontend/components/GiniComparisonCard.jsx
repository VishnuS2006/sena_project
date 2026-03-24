import { ALGORITHM_META, formatScore, pickWinningAlgorithm } from "../utils/analytics.js";
import EmptyState from "./EmptyState.jsx";

export default function GiniComparisonCard({ gini }) {
  const winner = pickWinningAlgorithm(gini, "min");

  if (!gini || !Object.keys(gini).length) {
    return (
      <EmptyState
        title="Gini comparison pending"
        description="Run the analysis to quantify how concentrated each score distribution becomes."
      />
    );
  }

  const orderedAlgorithms = [...ALGORITHM_META].sort(
    (left, right) => (gini[left.key] ?? 0) - (gini[right.key] ?? 0),
  );

  return (
    <div className="gini-grid">
      {orderedAlgorithms.map((algorithm, index) => {
        const value = gini[algorithm.key] ?? 0;
        const isWinner = winner === algorithm.key;
        const barWidth = `${Math.max(10, (1 - value) * 100)}%`;

        return (
          <article
            className={`gini-card ${isWinner ? "gini-card--winner" : ""}`.trim()}
            key={algorithm.key}
            style={{ "--algorithm-color": algorithm.color }}
          >
            <div className="gini-card__header">
              <span className="gini-card__name">{algorithm.label}</span>
              <span className="gini-card__rank">{isWinner ? "Most fair" : `Rank ${index + 1}`}</span>
            </div>
            <strong>{formatScore(value)}</strong>
            <div className="gini-bar">
              <span style={{ width: barWidth }} />
            </div>
            <p>Lower Gini means less concentration and better score equality across the network.</p>
          </article>
        );
      })}
    </div>
  );
}
