import { Link } from 'react-router-dom';
import Card from '../components/Card.jsx';
import { useDataset } from '../context/DatasetContext.jsx';

function Home() {
  const { dataset, sourceLabel } = useDataset();
  const summary = dataset?.summary;

  return (
    <section className="space-y-10">
      <div className="rounded-[40px] border border-slate-200 bg-white p-10 shadow-soft md:p-14">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-full bg-brand/10 px-4 py-2 text-sm font-semibold text-brand">Fairness-Aware Ranking Analysis</p>
            <h1 className="mt-5 max-w-4xl text-5xl font-semibold tracking-tight text-slate-950">Power laws reward the head of the marketplace. This application shows how to recover visibility for the long tail.</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
              Explore how HITS and PageRank reinforce preferential attachment, then compare fairness-aware alternatives that redistribute attention toward lower-degree products without breaking ranking logic.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/data" className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Open Data Workspace</Link>
              <Link to="/analysis" className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50">Compare Algorithms</Link>
            </div>
          </div>
          <div className="rounded-[32px] bg-slate-50 p-8">
            <h2 className="text-xl font-semibold text-slate-950">Current Dataset Snapshot</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-5 shadow-soft">
                <p className="text-sm text-slate-500">Nodes</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">{summary?.nodes ?? '...'}</p>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-soft">
                <p className="text-sm text-slate-500">Edges</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">{summary?.edges ?? '...'}</p>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-soft sm:col-span-2">
                <p className="text-sm text-slate-500">Source</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{sourceLabel}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Problem" description="Understand how preferential attachment creates rich-get-richer exposure patterns in marketplace graphs." badge="Why it matters" />
        <Card title="Algorithms" description="Inspect HITS, PageRank, Fair PageRank, Personalized PageRank, and Normalized PageRank with readable formulas." badge="Methods" />
        <Card title="Metrics" description="Track Gini coefficient, rank inequality, and degree-rank correlation to quantify bias reduction." badge="Evidence" />
      </div>
    </section>
  );
}

export default Home;
