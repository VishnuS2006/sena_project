import {
  ALGORITHM_LOOKUP,
  formatCompactNumber,
  formatScore,
  pickWinningAlgorithm,
} from "../lib/analytics"

function formatRuntime(runtimeMap) {
  const total = Object.values(runtimeMap ?? {}).reduce((sum, value) => sum + Number(value ?? 0), 0)
  return `${total.toFixed(2)}s total`
}

export default function SummaryCards({ analysis }) {
  if (!analysis) {
    return [
      "Upload a dataset to populate network scale, fairness, and long-tail ranking signals.",
      "The scatter plot compares degree against score for all four algorithms in one view.",
      "Tail visibility tracks how many low-degree nodes remain present inside each Top-50 list.",
      "Gini cards quantify inequality so hub dominance and fairer score spread are easy to compare.",
    ].map((message, index) => (
      <div
        key={index}
        className="glass-card flex min-h-[164px] items-center p-5 text-sm leading-6 text-stone-600"
      >
        {message}
      </div>
    ))
  }

  const summary = analysis.summary
  const gini = analysis.metrics?.gini ?? {}
  const tailVisibility = analysis.metrics?.tailVisibility ?? {}
  const fairnessWinner = pickWinningAlgorithm(gini, "min")
  const tailWinner = pickWinningAlgorithm(tailVisibility, "max")

  const cards = [
    {
      label: "Network Scale",
      value: `${formatCompactNumber(summary.nodeCount)} nodes`,
      detail: `${formatCompactNumber(summary.edgeCount)} edges`,
      accent: "from-coral/18 via-white/70 to-coral/5",
    },
    {
      label: "Lowest Inequality",
      value: fairnessWinner ? ALGORITHM_LOOKUP[fairnessWinner].label : "Pending",
      detail: fairnessWinner ? `Gini ${formatScore(gini[fairnessWinner])}` : "Run analysis",
      accent: "from-emerald-100/80 via-white/70 to-emerald-50",
    },
    {
      label: "Best Tail Visibility",
      value: tailWinner ? ALGORITHM_LOOKUP[tailWinner].label : "Pending",
      detail: tailWinner ? `${tailVisibility[tailWinner]} low-degree nodes in Top-50` : "Run analysis",
      accent: "from-sky-100/80 via-white/70 to-sky-50",
    },
    {
      label: "Processing Profile",
      value: summary.scatterSampled
        ? `${formatCompactNumber(summary.scatterPointCount)} chart points`
        : "Full scatter coverage",
      detail: `${formatRuntime(analysis.algorithmRuntimeSeconds)} across four algorithms`,
      accent: "from-violet-100/80 via-white/70 to-violet-50",
    },
  ]

  return cards.map((card) => (
    <article
      key={card.label}
      className={`glass-card flex min-h-[164px] flex-col justify-between bg-gradient-to-br ${card.accent} p-5 transition duration-300 hover:-translate-y-1`}
    >
      <p className="font-['IBM_Plex_Mono'] text-[11px] uppercase tracking-[0.3em] text-stone-500">
        {card.label}
      </p>
      <div className="mt-5">
        <h3 className="text-2xl font-semibold text-ink">{card.value}</h3>
        <p className="mt-2 text-sm text-stone-600">{card.detail}</p>
      </div>
    </article>
  ))
}
