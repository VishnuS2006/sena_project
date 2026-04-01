import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

function DegreeTooltip({ active, payload, label, normalized }) {
  if (!active || !payload?.length) {
    return null;
  }
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
      <p className="text-sm font-semibold text-slate-900">{label} degree</p>
      <div className="mt-2 space-y-2">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm">
            <p className="font-semibold" style={{ color: entry.color }}>{entry.name}</p>
            <p className="text-slate-600">{normalized ? 'Normalized' : 'Raw'} average score: {Number(entry.value ?? 0).toFixed(4)}</p>
            <p className="text-slate-500">
              {entry.payload?.explanations?.[entry.name] ?? 'Average score received by this degree group.'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DegreeVisibilityChart({ data, series, normalized }) {
  return (
    <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft">
      <h2 className="text-xl font-semibold text-slate-950">Low-Degree Node Visibility</h2>
      <div className="mt-5">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }} barGap={6}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 12" vertical={false} />
            <XAxis dataKey="group" tick={{ fill: '#475569', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
            <YAxis
              tick={{ fill: '#475569', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              domain={normalized ? [0, 1] : ['auto', 'auto']}
              label={{ value: normalized ? 'Average score (0-1)' : 'Average score', angle: -90, position: 'insideLeft', fill: '#64748b' }}
            />
            <Tooltip content={<DegreeTooltip normalized={normalized} />} />
            <Legend verticalAlign="top" align="right" iconType="circle" />
            {series.map((entry) => (
              <Bar
                key={entry.key}
                dataKey={entry.key}
                name={entry.label}
                stroke={entry.color}
                fill={entry.color}
                radius={[6, 6, 0, 0]}
                minPointSize={normalize ? 6 : 2}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600">Fair algorithms improve visibility of low-degree nodes.</p>
    </div>
  );
}
