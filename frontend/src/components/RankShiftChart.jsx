import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { formatInteger } from "../lib/analytics"
import AnalyticsEmptyState from "./AnalyticsEmptyState"

function RankShiftTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null
  }

  const bucket = payload[0].payload
  return (
    <div className="rounded-2xl border border-white/80 bg-white/95 px-4 py-3 text-sm shadow-lg backdrop-blur">
      <p className="font-semibold text-ink">{bucket.label}</p>
      <p className="mt-2 text-stone-700">{formatInteger(bucket.count)} nodes</p>
      <p className="mt-1 text-stone-600">Rank shift = rank(PR) - rank(PPR)</p>
    </div>
  )
}

export default function RankShiftChart({ analysis }) {
  const data = analysis?.metrics?.rankShiftHistogram ?? []

  if (!data.length) {
    return (
      <AnalyticsEmptyState
        title="Rank-shift analysis pending"
        description="Upload a dataset to measure how PageRank ranks move after personalization."
      />
    )
  }

  return (
    <article className="section-shell h-full">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-emerald-700">
          Positive {formatInteger(analysis?.metrics?.positiveShiftCount ?? 0)}
        </span>
        <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-rose-700">
          Negative {formatInteger(analysis?.metrics?.negativeShiftCount ?? 0)}
        </span>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-stone-600">
          Neutral {formatInteger(analysis?.metrics?.neutralShiftCount ?? 0)}
        </span>
      </div>

      <div className="mt-4 rounded-[28px] border border-white/70 bg-white/60 px-3 py-4 sm:px-4">
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, bottom: 24, left: 0 }}>
              <CartesianGrid stroke="rgba(120,113,108,0.14)" strokeDasharray="4 4" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#57534e", fontSize: 11 }}
                angle={-18}
                height={56}
                textAnchor="end"
                tickLine={false}
                axisLine={{ stroke: "rgba(120,113,108,0.28)" }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "#57534e", fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "rgba(120,113,108,0.28)" }}
              />
              <Tooltip content={<RankShiftTooltip />} cursor={{ fill: "rgba(68,64,60,0.05)" }} />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {data.map((entry) => (
                  <Cell
                    key={entry.label}
                    fill={
                      entry.trend === "positive"
                        ? "#10b981"
                        : entry.trend === "negative"
                          ? "#ef4444"
                          : "#94a3b8"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-stone-600">
        Positive shifts indicate improved visibility for previously under-ranked nodes.
      </p>
    </article>
  )
}
