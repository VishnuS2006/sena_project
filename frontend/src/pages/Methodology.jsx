function Methodology() {
  const steps = [
    {
      title: 'Data ingestion',
      text: 'Upload marketplace interactions as an edge list or load the built-in sample graph.',
    },
    {
      title: 'Graph construction',
      text: 'Translate the dataset into a directed graph with nodes and edges for ranking.',
    },
    {
      title: 'Algorithm execution',
      text: 'Run HITS, PageRank, and fairness-aware variants to compute scores.',
    },
    {
      title: 'Result generation',
      text: 'Visualize score distributions, top nodes, and long-tail visibility.',
    },
    {
      title: 'Evaluation',
      text: 'Measure inequality, skewness, and ranking improvement across methods.',
    },
  ];

  return (
    <section className="space-y-10">
      <div className="rounded-[36px] border border-slate-200 bg-white p-10 shadow-soft">
        <h1 className="text-4xl font-semibold text-slate-950">Methodology</h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">
          A structured pipeline ensures the comparison is reproducible and interpretable. Every step is designed to highlight how network shape influences ranking outcomes.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {steps.map((step, index) => (
          <div key={step.title} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand font-semibold">{index + 1}</span>
            <h2 className="mt-5 text-xl font-semibold text-slate-900">{step.title}</h2>
            <p className="mt-3 text-slate-600">{step.text}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[36px] border border-slate-200 bg-white p-10 shadow-soft">
        <h2 className="text-3xl font-semibold text-slate-950">Workflow overview</h2>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
            <p className="text-slate-600">Data ingestion and graph construction are performed on the backend with FastAPI, NetworkX, and Pandas. The frontend renders insights and interactive visualizations using React, Recharts, and Framer Motion.</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
            <p className="text-slate-600">Algorithm execution is split between Python for authoritative results and JavaScript modules for frontend demonstrations. Metrics are computed consistently across both environments.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Methodology;
