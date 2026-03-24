import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

export default function ScoreComparisonChart({ rows }) {
  const chartRows = rows.slice(0, 10).map((row) => ({
    nodeId: row.nodeId,
    HITS: row.hitsScore,
    PageRank: row.pageRankScore,
    Personalized: row.personalizedPageRankScore,
    DegreeNormalized: row.degreeNormalizedPageRankScore,
  }))

  return (
    <article className="section-shell">
      <p className="font-['IBM_Plex_Mono'] text-[11px] uppercase tracking-[0.32em] text-stone-500">
        Rank Bias Snapshot
      </p>
      <h3 className="mt-2 text-xl font-semibold text-ink">Top-node score comparison</h3>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        These bars compare how the same high-visibility nodes move when inverse-degree teleportation and degree normalization are applied.
      </p>

      <div className="mt-5 h-[380px] rounded-[26px] border border-white/70 bg-white/55 px-2 py-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartRows} margin={{ top: 16, right: 18, bottom: 20, left: 4 }}>
            <CartesianGrid stroke="rgba(120,113,108,0.16)" strokeDasharray="4 4" />
            <XAxis dataKey="nodeId" tick={{ fill: "#57534e", fontSize: 11 }} angle={-22} textAnchor="end" height={55} />
            <YAxis tick={{ fill: "#57534e", fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.8)",
                background: "rgba(255,250,242,0.96)",
              }}
            />
            <Legend />
            <Bar dataKey="HITS" fill="#b77948" radius={[5, 5, 0, 0]} />
            <Bar dataKey="PageRank" fill="#ef7d57" radius={[5, 5, 0, 0]} />
            <Bar dataKey="Personalized" fill="#4ecdc4" radius={[5, 5, 0, 0]} />
            <Bar dataKey="DegreeNormalized" fill="#1a9d90" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  )
}
