import {
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { buildScatterSeries, formatScore } from "../utils/analytics.js";
import EmptyState from "./EmptyState.jsx";

function ScatterTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <strong>{point.node_id}</strong>
      <span>{point.algorithm}</span>
      <span>Degree: {point.degree}</span>
      <span>Score: {formatScore(point.score)}</span>
    </div>
  );
}

export default function ScatterComparison({ analysis }) {
  const series = buildScatterSeries(analysis);

  if (!series.length) {
    return (
      <EmptyState
        title="Scatter plot pending"
        description="Upload a dataset to compare how each ranking method distributes score across node degree."
      />
    );
  }

  return (
    <div className="chart-shell">
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={360}>
          <ScatterChart margin={{ top: 16, right: 24, bottom: 16, left: 8 }}>
            <CartesianGrid stroke="rgba(154, 165, 194, 0.16)" />
            <XAxis
              dataKey="degree"
              type="number"
              name="Node Degree"
              tick={{ fill: "#aab4d5", fontSize: 12 }}
              axisLine={{ stroke: "rgba(154, 165, 194, 0.2)" }}
              tickLine={false}
              label={{
                value: "Node Degree",
                position: "insideBottom",
                offset: -8,
                fill: "#dce3f5",
              }}
            />
            <YAxis
              dataKey="score"
              type="number"
              name="Score"
              tick={{ fill: "#aab4d5", fontSize: 12 }}
              axisLine={{ stroke: "rgba(154, 165, 194, 0.2)" }}
              tickLine={false}
              tickFormatter={formatScore}
              label={{
                value: "Score",
                angle: -90,
                position: "insideLeft",
                fill: "#dce3f5",
              }}
            />
            <Tooltip content={<ScatterTooltip />} cursor={{ strokeDasharray: "3 3" }} />
            <Legend wrapperStyle={{ color: "#e9eefc" }} />
            {series.map((algorithm) => (
              <Scatter
                key={algorithm.key}
                name={algorithm.label}
                data={algorithm.data}
                fill={algorithm.color}
                line={false}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <p className="chart-note">
        HITS and PageRank typically compress score mass into high-degree hubs, while
        Personalized PR and Degree-Normalized PR spread visibility deeper into the
        long tail.
      </p>
    </div>
  );
}
