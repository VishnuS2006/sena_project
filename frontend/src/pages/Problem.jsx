function Problem() {
  return (
    <section className="space-y-8">
      <div className="rounded-[36px] border border-slate-200 bg-white p-10 shadow-soft">
        <h1 className="text-4xl font-semibold text-slate-950">The ranking problem inside a power-law marketplace</h1>
        <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-600">
          Marketplace graphs are highly unequal. A small head collects most links and attention, while most products stay in the long tail. If ranking algorithms trust that structure directly, they amplify popularity instead of balancing visibility.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <article className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft">
          <h2 className="text-2xl font-semibold text-slate-950">Unequal Structure</h2>
          <p className="mt-4 leading-8 text-slate-600">
            A few nodes form the dense core of the marketplace, while most nodes have very few links. The ranking process starts from this imbalance.
          </p>
        </article>
        <article className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft">
          <h2 className="text-2xl font-semibold text-slate-950">Rich-Get-Richer</h2>
          <p className="mt-4 leading-8 text-slate-600">
            Preferential attachment means visible products keep gaining more links, more clicks, and more authority than smaller products.
          </p>
        </article>
        <article className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft">
          <h2 className="text-2xl font-semibold text-slate-950">Why Fairness Matters</h2>
          <p className="mt-4 leading-8 text-slate-600">
            HITS and PageRank reinforce the core. Fairer variants are useful because they keep more visibility in low-degree and mid-degree nodes.
          </p>
        </article>
      </div>

      <div className="rounded-[36px] border border-slate-200 bg-white p-10 shadow-soft">
        <div className="flex items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold text-slate-950">Illustration of imbalance</h2>
            <p className="mt-3 max-w-3xl leading-7 text-slate-600">
              Dense core nodes reinforce each other, while long-tail nodes stay peripheral and receive much less score.
            </p>
          </div>
          <div className="rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">Head nodes dominate the walk</div>
        </div>
        <div className="mt-8 overflow-x-auto rounded-[28px] bg-slate-50 p-6">
          <svg viewBox="0 0 900 360" className="min-w-[720px]">
            <g stroke="#cbd5e1" strokeWidth="2">
              <line x1="210" y1="90" x2="340" y2="180" />
              <line x1="340" y1="180" x2="250" y2="265" />
              <line x1="250" y1="265" x2="210" y2="90" />
              <line x1="340" y1="180" x2="450" y2="110" />
              <line x1="340" y1="180" x2="450" y2="260" />
              <line x1="450" y1="110" x2="610" y2="70" />
              <line x1="450" y1="260" x2="610" y2="290" />
              <line x1="210" y1="90" x2="110" y2="70" />
              <line x1="250" y1="265" x2="120" y2="300" />
              <line x1="610" y1="70" x2="760" y2="120" />
              <line x1="610" y1="290" x2="760" y2="240" />
            </g>
            {[{ x: 210, y: 90, r: 32, fill: '#0f766e', label: 'Hub A' }, { x: 340, y: 180, r: 42, fill: '#0f766e', label: 'Hub B' }, { x: 250, y: 265, r: 30, fill: '#0f766e', label: 'Hub C' }, { x: 450, y: 110, r: 26, fill: '#2563eb', label: 'Mid 1' }, { x: 450, y: 260, r: 26, fill: '#2563eb', label: 'Mid 2' }, { x: 610, y: 70, r: 16, fill: '#94a3b8', label: 'Tail 1' }, { x: 610, y: 290, r: 16, fill: '#94a3b8', label: 'Tail 2' }, { x: 110, y: 70, r: 14, fill: '#94a3b8', label: 'Tail 3' }, { x: 120, y: 300, r: 14, fill: '#94a3b8', label: 'Tail 4' }, { x: 760, y: 120, r: 14, fill: '#94a3b8', label: 'Tail 5' }, { x: 760, y: 240, r: 14, fill: '#94a3b8', label: 'Tail 6' }].map((node) => (
              <g key={node.label}>
                <circle cx={node.x} cy={node.y} r={node.r} fill={node.fill} opacity="0.95" />
                <text x={node.x} y={node.y + 5} textAnchor="middle" fontSize="12" fill="#ffffff" fontWeight="700">{node.label}</text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </section>
  );
}

export default Problem;
