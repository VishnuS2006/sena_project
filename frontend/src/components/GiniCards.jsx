import {
  ALGORITHM_META,
  formatScore,
  getGiniAccent,
  pickWinningAlgorithm,
} from "../lib/analytics"
import AnalyticsEmptyState from "./AnalyticsEmptyState"

export default function GiniCards({ analysis }) {
  const gini = analysis?.metrics?.gini ?? {}
  const winner = pickWinningAlgorithm(gini, "min")

  if (!Object.keys(gini).length) {
    return (
      <AnalyticsEmptyState
        title="Fairness scores pending"
        description="Upload a dataset to compare score inequality across HITS and the three PageRank variants."
        className="min-h-[220px]"
      />
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {ALGORITHM_META.map((algorithm) => {
        const value = gini[algorithm.key] ?? 0
        const accent = getGiniAccent(value)

        return (
          <article
            key={algorithm.key}
            className="glass-card group relative overflow-hidden rounded-[28px] border p-5 transition duration-300 hover:-translate-y-1"
            style={{
              borderColor: accent.border,
              background: `linear-gradient(160deg, ${accent.soft}, rgba(255,255,255,0.92))`,
              boxShadow: `0 22px 70px ${accent.glow}`,
            }}
          >
            <div
              className="absolute inset-x-0 top-0 h-1"
              style={{ backgroundColor: accent.strong }}
            />

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-['IBM_Plex_Mono'] text-[11px] uppercase tracking-[0.28em] text-stone-500">
                  {algorithm.label}
                </p>
                <h3 className="mt-3 text-3xl font-semibold text-ink">{formatScore(value)}</h3>
              </div>
              <span
                className="rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.22em]"
                style={{
                  backgroundColor: accent.glow,
                  color: accent.strong,
                }}
              >
                {winner === algorithm.key ? "Lowest Inequality" : "Gini Score"}
              </span>
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/70">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max(12, value * 100)}%`,
                  backgroundColor: accent.strong,
                }}
              />
            </div>

            <p className="mt-4 text-sm leading-6 text-stone-600">
              Lower values mean score concentration is reduced and visibility is distributed more evenly.
            </p>
          </article>
        )
      })}
    </div>
  )
}
