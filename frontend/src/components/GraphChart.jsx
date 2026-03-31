import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const palette = ['#2563eb', '#0f766e', '#f59e0b', '#7c3aed', '#e11d48'];

function ChartTooltip({ active, payload, label, mode }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      <div className="mt-3 space-y-2">
        {payload.map((entry) => {
          const rawKey = `${entry.dataKey}Raw`;
          const rawValue = entry.payload?.[rawKey] ?? (entry.dataKey === 'value' ? entry.payload?.rawValue : undefined);
          return (
            <div key={entry.dataKey} className="text-sm">
              <p className="font-medium" style={{ color: entry.color }}>{entry.name}</p>
              <p className="text-slate-600">
                {mode === 'raw' ? 'Raw' : 'Normalized'}: {Number(entry.value ?? 0).toFixed(4)}
              </p>
              {rawValue !== undefined ? (
                <p className="text-slate-500">Raw score: {Number(rawValue).toExponential(3)}</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function GraphChart({
  data,
  type = 'bar',
  title,
  xKey = 'name',
  yKey = 'value',
  series,
  height = 320,
  mode = 'normalized',
  yDomain,
}) {
  if (!data || !data.length) {
    return <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-500">No chart data available.</div>;
  }

  const chartSeries = series?.length ? series : [{ key: yKey, label: title ?? yKey, color: palette[0] }];
  const ChartComponent = type === 'line' ? LineChart : BarChart;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      {title ? <h4 className="mb-4 text-lg font-semibold text-slate-900">{title}</h4> : null}
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent data={data} margin={{ top: 8, right: 18, left: 0, bottom: 18 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey={xKey} tick={{ fill: '#475569', fontSize: 12 }} angle={type === 'bar' ? -24 : 0} textAnchor={type === 'bar' ? 'end' : 'middle'} height={type === 'bar' ? 60 : 30} />
          <YAxis tick={{ fill: '#475569', fontSize: 12 }} domain={yDomain} />
          <Tooltip content={<ChartTooltip mode={mode} />} />
          <Legend />
          {type === 'line'
            ? chartSeries.map((entry, index) => (
                <Line key={entry.key} type="monotone" dataKey={entry.key} name={entry.label} stroke={entry.color ?? palette[index]} strokeWidth={2.5} dot={false} />
              ))
            : chartSeries.map((entry, index) => (
                <Bar key={entry.key} dataKey={entry.key} name={entry.label} fill={entry.color ?? palette[index]} radius={[8, 8, 0, 0]} />
              ))}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}
