import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';

export function GraphChart({ data, type = 'degree' }) {
  if (!data || !data.length) {
    return <div className="rounded-3xl bg-white p-6 shadow-soft">No chart data available.</div>;
  }

  if (type === 'line') {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <h4 className="mb-4 text-lg font-semibold text-slate-900">Distribution</h4>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fill: '#475569' }} />
            <YAxis tick={{ fill: '#475569' }} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-soft">
      <h4 className="mb-4 text-lg font-semibold text-slate-900">Degree distribution</h4>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fill: '#475569' }} />
          <YAxis tick={{ fill: '#475569' }} />
          <Tooltip />
          <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
