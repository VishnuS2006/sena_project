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
import { buildTailVisibilityData } from "../utils/analytics.js";
import EmptyState from "./EmptyState.jsx";

function TailTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <strong>{point.label}</strong>
      <span>{point.value} low-degree nodes in the Top-50</span>
    </div>
  );
}

export default function TailVisibilityChart({ tailVisibility }) {
  const data = buildTailVisibilityData(tailVisibility);

  if (!data.length || !Object.keys(tailVisibility ?? {}).length) {
    return (
      <EmptyState
        title="Tail-visibility metrics pending"
        description="Upload a dataset to measure how many low-degree nodes each algorithm preserves in its Top-50."
      />
    );
  }

  return (
    <div className="chart-shell">
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 12, right: 12, bottom: 12, left: 0 }}>
            <CartesianGrid stroke="rgba(154, 165, 194, 0.16)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#aab4d5", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "rgba(154, 165, 194, 0.2)" }}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "#aab4d5", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "rgba(154, 165, 194, 0.2)" }}
            />
            <Tooltip content={<TailTooltip />} cursor={{ fill: "rgba(255, 255, 255, 0.04)" }} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.key} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="chart-note">
        Higher bars mean more long-tail nodes remain visible. Fairer ranking methods
        should recover these nodes instead of suppressing them behind hubs.
      </p>
    </div>
  );
}
