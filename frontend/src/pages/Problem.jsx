function Problem() {
  return (
    <section className="space-y-10">
      <div className="rounded-[36px] border border-slate-200 bg-white p-10 shadow-soft">
        <h1 className="text-4xl font-semibold text-slate-950">The ranking problem inside a power-law marketplace</h1>
        <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-600">
          Online marketplaces are not neutral graphs. A small number of products receive most clicks, reviews, and co-purchase links, while an enormous long tail receives very little structural attention. When ranking algorithms rely on this graph directly, they often confuse popularity with merit and amplify exposure inequality.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft">
          <h2 className="text-2xl font-semibold text-slate-950">1. Introduction to the problem</h2>
          <p className="mt-4 leading-8 text-slate-600">
            In a co-purchase network, each edge represents attention flowing between products. The topology is heavily imbalanced: a few products become dense hubs and many others remain sparsely connected. This means the ranking stage starts from an unequal structure, so a naive centrality score rarely gives smaller nodes a realistic chance to surface.
          </p>
        </article>
        <article className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft">
          <h2 className="text-2xl font-semibold text-slate-950">2. Preferential attachment</h2>
          <p className="mt-4 leading-8 text-slate-600">
            Preferential attachment describes the tendency of new links to connect to nodes that already have many links. In marketplaces, visibility breeds more visibility: well-known products are recommended more often, clicked more often, and therefore collect even more connections. The graph is shaped by cumulative advantage long before the ranking algorithm runs.
          </p>
        </article>
        <article className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft">
          <h2 className="text-2xl font-semibold text-slate-950">3. The rich-get-richer effect</h2>
          <p className="mt-4 leading-8 text-slate-600">
            Once a product reaches the head of the distribution, graph-based ranking reinforces its lead. Scores are recursively propagated through incoming and outgoing links, so high-degree products receive stronger support at every iteration. What begins as a slight popularity difference can become a dominant ranking gap.
          </p>
        </article>
        <article className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft">
          <h2 className="text-2xl font-semibold text-slate-950">4. Impact on long-tail nodes</h2>
          <p className="mt-4 leading-8 text-slate-600">
            Long-tail products may be relevant, diverse, or newly emerging, but they have too little graph mass to compete with established hubs. Their scores stay small, their recommendations stay rare, and the marketplace becomes narrower over time. This is a visibility problem as much as a ranking problem.
          </p>
        </article>
        <article className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft">
          <h2 className="text-2xl font-semibold text-slate-950">5. Why HITS fails here</h2>
          <p className="mt-4 leading-8 text-slate-600">
            HITS separates nodes into hubs and authorities, but in a power-law graph both roles are concentrated near the core. Strong hubs point to already prominent authorities, and those authorities in turn validate the same hub cluster. The iterative feedback loop is interpretable, but it also makes head-node dominance sharper.
          </p>
        </article>
        <article className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft">
          <h2 className="text-2xl font-semibold text-slate-950">6. Why PageRank is biased</h2>
          <p className="mt-4 leading-8 text-slate-600">
            PageRank models a random walk with teleportation, yet most probability mass still accumulates where the network is already dense. Nodes with many useful incoming paths absorb more stationary probability, while low-degree nodes receive little traffic. Teleportation softens the issue, but it does not remove structural bias when the graph itself is extremely unequal.
          </p>
        </article>
      </div>

      <div className="rounded-[36px] border border-slate-200 bg-white p-10 shadow-soft">
        <div className="flex items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold text-slate-950">Illustration of imbalance</h2>
            <p className="mt-3 max-w-3xl leading-7 text-slate-600">
              The central cluster below represents head products with many reinforcing links. The outer ring represents long-tail products with few chances to gather authority, even when they remain connected to the marketplace.
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
