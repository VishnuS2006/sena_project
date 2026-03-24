import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { buildRankShiftBins } from "../utils/analytics.js";
import EmptyState from "./EmptyState.jsx";

function RankShiftTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }

  const bin = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <strong>{bin.label}</strong>
      <span>{bin.count} nodes</span>
      <span>
        Positive shift means the node ranks better under Personalized PageRank.
      </span>
    </div>
  );
}

export default function RankShiftChart({ rankShiftRows }) {
  const histogram = buildRankShiftBins(rankShiftRows);

  if (!histogram.length) {
    return (
      <EmptyState
        title="Rank-shift histogram pending"
        description="Run an analysis to see which nodes gain or lose visibility when PageRank becomes personalized."
      />
    );
  }

  return (
    <div className="chart-shell">
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={histogram} margin={{ top: 12, right: 12, bottom: 20, left: 0 }}>
            <CartesianGrid stroke="rgba(154, 165, 194, 0.16)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#aab4d5", fontSize: 12 }}
              angle={-18}
              height={54}
              textAnchor="end"
              tickLine={false}
              axisLine={{ stroke: "rgba(154, 165, 194, 0.2)" }}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "#aab4d5", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "rgba(154, 165, 194, 0.2)" }}
            />
            <Tooltip content={<RankShiftTooltip />} cursor={{ fill: "rgba(255, 255, 255, 0.04)" }} />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {histogram.map((bin) => (
                <Cell
                  key={bin.label}
                  fill={
                    bin.trend === "positive"
                      ? "#48d597"
                      : bin.trend === "negative"
                        ? "#ff6a7c"
                        : "#8ba0d9"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="chart-note">
        Positive bars show nodes that move up when bias toward already-popular nodes is
        reduced. Negative bars show hubs losing relative dominance.
      </p>
    </div>
  );
}
