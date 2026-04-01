import ForceDirectedGraph from '../components/ForceDirectedGraph.jsx';
import { GraphChart } from '../components/GraphChart.jsx';
import { useDataset } from '../context/DatasetContext.jsx';

function DataRedesigned() {
  const { dataset, error, loading, statusMessage, sourceLabel, uploadDataset, resetToDefault } = useDataset();
  const summary = dataset?.summary;

  const cumulativeDegree = (summary?.degree_distribution ?? []).reduce((acc, row, index, array) => {
    const total = array.reduce((sum, item) => sum + Number(item.value ?? 0), 0) || 1;
    const previous = acc[index - 1]?.cumulative ?? 0;
    const cumulative = previous + Number(row.value ?? 0) / total;
    acc.push({ degree: Number(row.name), frequency: Number(row.value ?? 0), cumulative });
    return acc;
  }, []);

  return (
    <section className="space-y-8">
      <div className="rounded-[36px] border border-slate-200 bg-white p-10 shadow-soft">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-semibold text-slate-950">Data</h1>
            <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-600">
              This page focuses on graph structure only: a readable network sample, the long-tail degree distribution, and core dataset statistics.
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

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft"><p className="text-sm text-slate-500">Nodes</p><p className="mt-2 text-3xl font-semibold text-slate-950">{summary?.nodes ?? '...'}</p></div>
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft"><p className="text-sm text-slate-500">Edges</p><p className="mt-2 text-3xl font-semibold text-slate-950">{summary?.edges ?? '...'}</p></div>
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft"><p className="text-sm text-slate-500">Average degree</p><p className="mt-2 text-3xl font-semibold text-slate-950">{summary ? summary.average_degree.toFixed(2) : '...'}</p></div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="min-w-0">
          <ForceDirectedGraph graph={summary?.graph_sample} />
        </div>
        <div className="grid gap-6">
          <GraphChart
            data={(summary?.degree_distribution ?? []).map((row) => ({ degree: Number(row.name), value: Number(row.value ?? 0) }))}
            title="Degree Distribution"
            xKey="degree"
            mode="raw"
            height={200}
          />
          <GraphChart
            data={cumulativeDegree}
            title="Cumulative Degree Mass"
            xKey="degree"
            yKey="cumulative"
            mode="normalized"
            yDomain={[0, 1]}
            height={200}
          />
        </div>
      </div>
    </section>
  );
}

export default DataRedesigned;
