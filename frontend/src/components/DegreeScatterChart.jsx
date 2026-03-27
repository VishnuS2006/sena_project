import {
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { buildScatterSeries, formatInteger, formatScore } from "../lib/analytics"
import AnalyticsEmptyState from "./AnalyticsEmptyState"

function ScatterTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null
  }

  const point = payload[0].payload
  return (
    <div className="rounded-2xl border border-white/80 bg-white/95 px-4 py-3 text-sm shadow-lg backdrop-blur">
      <p className="font-semibold text-ink">{point.nodeId}</p>
      <p className="mt-1 text-stone-600">{point.algorithm}</p>
      <p className="mt-2 text-stone-700">Degree: {formatInteger(point.degree)}</p>
      <p className="text-stone-700">Score: {formatScore(point.score)}</p>
    </div>
  )
}

export default function DegreeScatterChart({ analysis }) {
  const scatterRows = analysis?.scatterRows ?? []
  const series = buildScatterSeries(scatterRows)

  if (!series.length) {
    return (
      <AnalyticsEmptyState
        title="Scatter plot pending"
        description="Upload a network to compare node degree against score across HITS and the PageRank variants."
      />
    )
  }

  return (
    <article className="section-shell">
      <div className="rounded-[28px] border border-white/70 bg-white/60 px-3 py-4 sm:px-5">
        <div className="h-[430px] sm:h-[520px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 18, right: 28, bottom: 30, left: 8 }}>
              <CartesianGrid stroke="rgba(120,113,108,0.14)" strokeDasharray="4 4" />
              <XAxis
                type="number"
                dataKey="degree"
                name="Node Degree"
                tick={{ fill: "#57534e", fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "rgba(120,113,108,0.28)" }}
                label={{
                  value: "Node Degree",
                  position: "insideBottom",
                  offset: -10,
                  fill: "#44403c",
                }}
              />
              <YAxis
                type="number"
                dataKey="score"
                name="Score"
                tick={{ fill: "#57534e", fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "rgba(120,113,108,0.28)" }}
                tickFormatter={formatScore}
                width={80}
                label={{
                  value: "Score",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#44403c",
                }}
              />
              <Tooltip content={<ScatterTooltip />} cursor={{ strokeDasharray: "3 3" }} />
              <Legend wrapperStyle={{ paddingTop: 10 }} />
              {series.map((algorithm) => (
                <Scatter
                  key={algorithm.key}
                  name={algorithm.label}
                  data={algorithm.data}
                  fill={algorithm.color}
                  fillOpacity={0.72}
                  line={false}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-stone-600">
        <p className="max-w-3xl leading-6">
          Standard algorithms cluster around high-degree nodes, while fairness-aware
          variants distribute importance more evenly.
        </p>
        {analysis?.summary?.scatterSampled ? (
          <span className="rounded-full border border-stone-200 bg-white/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-stone-500">
            {formatInteger(analysis.summary.scatterPointCount)} sampled points
          </span>
        ) : null}
      </div>
    </article>
  )
}
