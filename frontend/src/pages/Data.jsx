import { useEffect, useState } from 'react';
import { GraphChart } from '../components/GraphChart.jsx';
import TableView from '../components/TableView.jsx';
import { fetchGraphOverview } from '../services/api.js';

function Data() {
  const [summary, setSummary] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [status, setStatus] = useState('Loading dataset overview...');

  useEffect(() => {
    async function load() {
      try {
        const result = await fetchGraphOverview();
        if (result?.summary) {
          setSummary(result.summary);
          setPreviewRows(result.summary.row_preview ?? []);
          setStatus('Loaded dataset summary from backend.');
        } else {
          setStatus('Unable to load dataset summary from backend.');
        }
      } catch (error) {
        setStatus('Backend fetch failed.');
      }
    }
    load();
  }, []);

  const graphData = summary?.degree_distribution ?? [];
  const columns = [
    { Header: 'Source', accessor: 'source' },
    { Header: 'Target', accessor: 'target' },
  ];

  return (
    <section className="space-y-10">
      <div className="rounded-[36px] border border-slate-200 bg-white p-10 shadow-soft">
        <h1 className="text-4xl font-semibold text-slate-950">Data</h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">
          The application loads the marketplace edge list dataset from the backend and summarizes the power-law structure in the graph.
        </p>
        <div className="mt-8">
          <span className="text-sm text-slate-600">{status}</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft">
          <h2 className="text-xl font-semibold text-slate-950">Dataset explanation</h2>
          <p className="mt-4 text-slate-600">This dataset represents an edge list from an online marketplace graph. Popular nodes form the head of a power-law distribution, while the long tail remains under-represented.</p>
        </div>
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft">
          <h2 className="text-xl font-semibold text-slate-950">Nodes</h2>
          <p className="mt-4 text-slate-600">{summary ? summary.nodes : '...'} unique nodes discovered in the dataset.</p>
        </div>
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft">
          <h2 className="text-xl font-semibold text-slate-950">Edges</h2>
          <p className="mt-4 text-slate-600">{summary ? summary.edges : '...'} directed edges represent the marketplace relationships.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-soft">
          <h2 className="text-2xl font-semibold text-slate-950">Degree distribution preview</h2>
          <p className="mt-3 text-slate-600">Top nodes by total degree reveal the head of the power-law distribution.</p>
          <div className="mt-6">
            <GraphChart data={graphData.slice(0, 20)} type="bar" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft">
            <h2 className="text-xl font-semibold text-slate-950">Top-edge preview</h2>
            <p className="mt-4 text-slate-600">A small sample of the loaded edge list.</p>
            <div className="mt-6">
              <TableView data={previewRows} columns={columns} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Data;
