import { Link } from 'react-router-dom';
import Card from '../components/Card.jsx';

const algorithms = [
  'HITS',
  'PageRank',
  'Fair PageRank',
  'Personalized PageRank',
  'Normalized PageRank',
];

function Home() {
  return (
    <section className="space-y-16">
      <div className="rounded-[36px] border border-slate-200 bg-white p-10 shadow-soft">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="mb-4 inline-flex rounded-full bg-brand/10 px-4 py-2 text-sm font-semibold text-brand">Research-grade ranking</p>
            <h1 className="text-5xl font-semibold tracking-tight text-slate-950">Breaking the Rich-Get-Richer Effect</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Fair Ranking in Power-Law Networks explores how marketplace algorithms amplify bias and how fairness-aware modifications restore long-tail visibility.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/algorithms" className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
                Explore Algorithms
              </Link>
              <Link to="/analysis" className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400">
                View Analysis
              </Link>
            </div>
          </div>
          <div className="rounded-[32px] bg-slate-50 p-8">
            <h2 className="text-xl font-semibold text-slate-900">Why this study matters</h2>
            <p className="mt-4 text-slate-600">
              Online marketplaces naturally produce power-law graphs where a few products and sellers dominate visibility. This app demonstrates the quantitative and visual impact of ranking bias.
            </p>
            <div className="mt-6 space-y-4 text-slate-700">
              <p>• Power-law distributions describe node degree imbalance.</p>
              <p>• Long-tail items receive little exposure.</p>
              <p>• Preferential attachment creates entrenched popularity.</p>
              <p>• Fair ranking seeks to correct prominence without breaking relevance.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft">
          <h2 className="text-2xl font-semibold text-slate-900">Understanding the long tail</h2>
          <p className="mt-4 text-slate-600">
            In a power-law market, most nodes sit in a long tail of rare interactions. A small number of highly connected hubs receive the majority of attention, while the rest struggle to surface.
          </p>
        </div>
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft">
          <h2 className="text-2xl font-semibold text-slate-900">Bias in ranking</h2>
          <p className="mt-4 text-slate-600">
            Popularity-based ranking algorithms reward already-popular nodes, amplifying the rich-get-richer effect. This creates a feedback loop where the most visible items become even more visible.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Algorithm Comparison" description="Compare traditional and fairness-aware ranking with statistical metrics and visibility graphs." badge="Insight" />
        <Card title="Fair Ranking Model" description="See how degree penalization and normalization reduce node inequality in practice." badge="Model" />
        <Card title="Interactive Analysis" description="Explore score distributions, top nodes, and long-tail uplift across five algorithms." badge="Explore" />
      </div>

      <section className="rounded-[36px] border border-slate-200 bg-white p-10 shadow-soft">
        <h2 className="text-3xl font-semibold text-slate-950">Algorithm Preview</h2>
        <p className="mt-3 text-slate-600">Learn how each ranking method behaves in graphs with power-law degree distributions.</p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {algorithms.map((label) => (
            <div key={label} className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-xl font-semibold text-slate-900">{label}</h3>
              <p className="mt-3 text-slate-600">{label === 'HITS' ? 'Authority and hub flow.' : label === 'PageRank' ? 'Markov chain centrality.' : label === 'Fair PageRank' ? 'Degree-aware normalization.' : label === 'Personalized PageRank' ? 'Bias toward a seed set.' : 'Range-scaled ranking.'}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[36px] border border-slate-200 bg-white p-10 shadow-soft text-center">
        <h2 className="text-3xl font-semibold text-slate-950">Start your fairness analysis</h2>
        <p className="mt-4 mx-auto max-w-2xl text-slate-600">Use visual analytics, algorithm comparisons, and quantitative metrics to understand how marketplace ranking is shaped by network structure.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link to="/data" className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">Upload Dataset</Link>
          <Link to="/analysis" className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400">See Analysis</Link>
        </div>
      </section>
    </section>
  );
}

export default Home;
