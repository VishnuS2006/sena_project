import {
  Brush,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

function ComparisonTooltip({ active, payload, label, normalized, explanations }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
      <p className="text-sm font-semibold text-slate-900">Node rank {label}</p>
      <div className="mt-2 space-y-2">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm">
            <p className="font-semibold" style={{ color: entry.color }}>{entry.name}</p>
            <p className="text-slate-600">{normalized ? 'Normalized' : 'Raw'} score: {Number(entry.value ?? 0).toFixed(4)}</p>
            <p className="text-slate-500">{explanations?.[entry.name] ?? 'Score decay across ranked nodes.'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ComparisonChart({ data, series, normalized, explanations, xLabel = 'Node Rank', onResetZoom, zoomLabel }) {
  return (
    <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-950">Score Distribution Comparison</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">Steeper drops expose concentrated influence. Smoother curves show score spreading deeper into the graph.</p>
        </div>
        {zoomLabel ? (
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
              {zoomLabel}
            </span>
            {onResetZoom ? (
              <button
                type="button"
                onClick={onResetZoom}
                className="rounded-full border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Reset zoom
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="mt-5">
        <ResponsiveContainer width="100%" height={380}>
          <LineChart data={data} margin={{ top: 8, right: 18, left: -8, bottom: 8 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 12" vertical={false} />
            <XAxis
              dataKey="rank"
              tick={{ fill: '#475569', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              label={{ value: xLabel, position: 'insideBottom', offset: -4, fill: '#64748b' }}
            />
            <YAxis
              tick={{ fill: '#475569', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              domain={normalized ? [0, 1] : ['auto', 'auto']}
              label={{ value: normalized ? 'Score (0-1)' : 'Score', angle: -90, position: 'insideLeft', fill: '#64748b' }}
            />
            <Tooltip content={<ComparisonTooltip normalized={normalized} explanations={explanations} />} />
            <Legend verticalAlign="top" align="right" iconType="circle" />
            {series.map((entry) => (
              <Line
                key={entry.key}
                type="monotone"
                dataKey={entry.key}
                name={entry.label}
                stroke={entry.color}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                connectNulls
              />
            ))}
            <Brush dataKey="rank" height={22} stroke="#94a3b8" travellerWidth={10} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
