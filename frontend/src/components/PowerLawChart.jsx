import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

export default function PowerLawChart({ distribution, fit }) {
  return (
    <article className="section-shell">
      <p className="font-['IBM_Plex_Mono'] text-[11px] uppercase tracking-[0.32em] text-stone-500">
        Power-Law View
      </p>
      <h3 className="mt-2 text-xl font-semibold text-ink">Degree distribution</h3>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        The log-log degree curve highlights whether the uploaded network has a heavy tail and how strongly hub concentration appears.
      </p>

      <div className="mt-5 h-[360px] rounded-[26px] border border-white/70 bg-white/55 px-2 py-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={distribution} margin={{ top: 16, right: 24, bottom: 16, left: 8 }}>
            <CartesianGrid stroke="rgba(120,113,108,0.16)" strokeDasharray="4 4" />
            <XAxis
              dataKey="degree"
              type="number"
              scale="log"
              domain={["auto", "auto"]}
              tick={{ fill: "#57534e", fontSize: 12 }}
            />
            <YAxis
              dataKey="count"
              type="number"
              scale="log"
              domain={["auto", "auto"]}
              tick={{ fill: "#57534e", fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.8)",
                background: "rgba(255,250,242,0.96)",
              }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#ef7d57"
              strokeWidth={3}
              dot={{ r: 2.5, fill: "#ef7d57" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-coral/10 px-4 py-3">
          <p className="font-['IBM_Plex_Mono'] text-[11px] uppercase tracking-[0.3em] text-stone-500">
            Estimated Exponent
          </p>
          <p className="mt-2 text-2xl font-semibold text-ink">{fit.exponent.toFixed(4)}</p>
        </div>
        <div className="rounded-2xl bg-teal/10 px-4 py-3">
          <p className="font-['IBM_Plex_Mono'] text-[11px] uppercase tracking-[0.3em] text-stone-500">
            Fit Quality
          </p>
          <p className="mt-2 text-2xl font-semibold text-ink">R^2 {fit.rSquared.toFixed(4)}</p>
        </div>
      </div>
    </article>
  )
}
