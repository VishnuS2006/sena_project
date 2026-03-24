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

import { buildTailVisibilityData } from "../lib/analytics"
import AnalyticsEmptyState from "./AnalyticsEmptyState"

function TailVisibilityTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null
  }

  const point = payload[0].payload
  return (
    <div className="rounded-2xl border border-white/80 bg-white/95 px-4 py-3 text-sm shadow-lg backdrop-blur">
      <p className="font-semibold text-ink">{point.label}</p>
      <p className="mt-2 text-stone-700">{point.value} low-degree nodes in the Top-50</p>
    </div>
  )
}

export default function TailVisibilityChart({ analysis }) {
  const tailVisibility = analysis?.metrics?.tailVisibility
  const data = buildTailVisibilityData(tailVisibility)

  if (!Object.keys(tailVisibility ?? {}).length) {
    return (
      <AnalyticsEmptyState
        title="Tail visibility pending"
        description="Upload a dataset to compare how many low-degree nodes each method keeps in its Top-50."
      />
    )
  }

  return (
    <article className="section-shell h-full">
      <div className="rounded-[28px] border border-white/70 bg-white/60 px-3 py-4 sm:px-4">
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, bottom: 12, left: 0 }}>
              <CartesianGrid stroke="rgba(120,113,108,0.14)" strokeDasharray="4 4" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#57534e", fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "rgba(120,113,108,0.28)" }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "#57534e", fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "rgba(120,113,108,0.28)" }}
              />
              <Tooltip content={<TailVisibilityTooltip />} cursor={{ fill: "rgba(68,64,60,0.05)" }} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {data.map((entry) => (
                  <Cell key={entry.key} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-stone-600">
        Fair ranking methods significantly improve long-tail representation.
      </p>
    </article>
  )
}
