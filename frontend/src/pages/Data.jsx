import { useMemo } from 'react';
import ForceDirectedGraph from '../components/ForceDirectedGraph.jsx';
import { GraphChart } from '../components/GraphChart.jsx';
import TableView from '../components/TableView.jsx';
import { useDataset } from '../context/DatasetContext.jsx';
import { paginateRows } from '../utils/scoreUtils.js';

function Data() {
  const { dataset, error, loading, statusMessage, sourceLabel, uploadDataset, resetToDefault } = useDataset();
  const summary = dataset?.summary;

  const topNodeRows = useMemo(() => paginateRows(summary?.top_nodes ?? [], 1, 15), [summary]);

  const edgeColumns = [
    { Header: 'Source', accessor: 'source' },
    { Header: 'Target', accessor: 'target' },
  ];

  const nodeColumns = [
    { Header: 'Rank', accessor: 'rank' },
    { Header: 'Node', accessor: 'name' },
    { Header: 'Degree', accessor: 'degree' },
  ];

  return (
    <section className="space-y-10">
      <div className="rounded-[36px] border border-slate-200 bg-white p-10 shadow-soft">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-semibold text-slate-950">Data and graph construction</h1>
            <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-600">
              This project is built around <code className="rounded bg-slate-100 px-2 py-1 text-sm">com-amazon.ungraph.txt</code>. The backend parses that dataset, constructs the marketplace graph, computes rankings, and feeds every page from the same cached analysis.
            </p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-5 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Current source</p>
            <p className="mt-1">{sourceLabel}</p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center">
          <label className="inline-flex cursor-pointer items-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
            Upload CSV / TXT
            <input type="file" accept=".csv,.txt" className="hidden" onChange={(event) => event.target.files?.[0] && uploadDataset(event.target.files[0])} />
          </label>
          <button onClick={resetToDefault} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50">
            Reload Amazon dataset
          </button>
          <span className="text-sm text-slate-500">{loading ? statusMessage : error || statusMessage}</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft"><p className="text-sm text-slate-500">Nodes</p><p className="mt-2 text-3xl font-semibold text-slate-950">{summary?.nodes ?? '...'}</p></div>
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft"><p className="text-sm text-slate-500">Edges</p><p className="mt-2 text-3xl font-semibold text-slate-950">{summary?.edges ?? '...'}</p></div>
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft"><p className="text-sm text-slate-500">Average degree</p><p className="mt-2 text-3xl font-semibold text-slate-950">{summary ? summary.average_degree.toFixed(2) : '...'}</p></div>
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft"><p className="text-sm text-slate-500">Density</p><p className="mt-2 text-3xl font-semibold text-slate-950">{summary ? summary.density.toFixed(4) : '...'}</p></div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <ForceDirectedGraph graph={summary?.graph_sample} />
        <GraphChart data={summary?.degree_distribution ?? []} type="bar" title="Degree distribution" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft">
          <h2 className="text-2xl font-semibold text-slate-950">Most connected nodes in the Amazon graph</h2>
          <p className="mt-3 text-slate-600">These nodes form the dominant head of the marketplace network. The fair algorithms later try to reduce how much this structural advantage controls the final ranking.</p>
          <div className="mt-6"><TableView data={topNodeRows} columns={nodeColumns} /></div>
        </div>
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft">
          <h2 className="text-2xl font-semibold text-slate-950">Amazon edge preview</h2>
          <p className="mt-3 text-slate-600">The rows below come directly from <code className="rounded bg-slate-100 px-2 py-1 text-sm">com-amazon.ungraph.txt</code> and serve as the graph-construction input.</p>
          <div className="mt-6"><TableView data={summary?.row_preview ?? []} columns={edgeColumns} /></div>
        </div>
      </div>
    </section>
  );
}

export default Data;
