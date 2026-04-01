import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

function DominanceTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }
  const point = payload[0]?.payload;
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
      <p className="text-sm font-semibold text-slate-900">{point?.algorithm}</p>
      <p className="mt-2 text-sm text-slate-600">Value: {Number(point?.value ?? 0).toFixed(2)}%</p>
      <p className="text-sm text-slate-500">{point?.explanation ?? 'Top 10% score share across ranked nodes.'}</p>
    </div>
  );
}

export function DominanceChart({ data }) {
  return (
    <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft">
      <h2 className="text-xl font-semibold text-slate-950">Top Nodes Dominance</h2>
      <div className="mt-5">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 12" vertical={false} />
            <XAxis dataKey="shortLabel" tick={{ fill: '#475569', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
            <YAxis
              tick={{ fill: '#475569', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              label={{ value: '% of total score', angle: -90, position: 'insideLeft', fill: '#64748b' }}
            />
            <Tooltip content={<DominanceTooltip />} />
            <Bar dataKey="value" radius={[10, 10, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.algorithm} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600">Higher percentage indicates strong centralization (rich-get-richer effect).</p>
    </div>
  );
}
