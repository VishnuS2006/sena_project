import { GraphChart } from '../components/GraphChart.jsx';

const distribution = [
  { name: 'Top-10', value: 48 },
  { name: 'Mid-40', value: 32 },
  { name: 'Long Tail', value: 20 },
];

function Problem() {
  return (
    <section className="space-y-12">
      <div className="rounded-[36px] border border-slate-200 bg-white p-10 shadow-soft">
        <h1 className="text-4xl font-semibold text-slate-950">The Preferential Attachment Problem</h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">
          Preferential attachment is the mechanism that creates power-law degree distributions: nodes with high degree attract more links. In marketplaces, this means popular products get more exposure, while the long tail is starved for attention.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-soft">
          <h2 className="text-2xl font-semibold text-slate-950">Mathematical formulation</h2>
          <p className="mt-4 text-slate-600">
            A classic preferential attachment model gives each new node a probability to connect to existing node <code className="rounded bg-slate-100 px-2 py-1">i</code> proportional to its degree <code className="rounded bg-slate-100 px-2 py-1">k_i</code>:
          </p>
          <pre className="mt-4 overflow-x-auto rounded-3xl bg-slate-950 p-5 text-sm text-slate-100">
            P(i) = k_i / Σ_j k_j
          </pre>
          <p className="mt-4 text-slate-600">
            As a result, the degree distribution follows a power law: <code className="rounded bg-slate-100 px-2 py-1">P(k) ≃ k^{-γ}</code>, meaning a few nodes dominate and many remain rare.
          </p>
        </div>
        <div className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-soft">
          <h2 className="text-2xl font-semibold text-slate-950">Why ranking amplifies bias</h2>
          <p className="mt-4 text-slate-600">
            HITS and PageRank propagate influence along the link structure. High-degree hub nodes get stronger authority scores, and popular nodes continue to receive higher weight each iteration.
          </p>
          <p className="mt-4 text-slate-600">
            This makes the long tail even less visible: nodes with few incoming edges are rarely selected by ranking functions, even if they are novel or relevant.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-soft">
          <h2 className="text-2xl font-semibold text-slate-950">HITS bias</h2>
          <p className="mt-4 text-slate-600">
            HITS separates the graph into hubs and authorities. In a power-law graph, a small set of hubs repeatedly boosts each other, making authority scores steeply skewed toward the rich nodes.
          </p>
        </div>
        <div className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-soft">
          <h2 className="text-2xl font-semibold text-slate-950">PageRank bias</h2>
          <p className="mt-4 text-slate-600">
            PageRank is a random walk on the graph. Since highly connected nodes attract more transitions, they accumulate most of the stationary probability mass, leaving the long tail with nearly zero ranking weight.
          </p>
        </div>
      </div>

      <GraphChart data={distribution} type="line" />
    </section>
  );
}

export default Problem;
