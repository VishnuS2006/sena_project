function Methodology() {
  const steps = [
    {
      title: '1. Data loading',
      text: 'The workflow starts from an edge list representing marketplace interactions. The application accepts the bundled Amazon graph or an uploaded CSV/TXT file and standardizes it into source-target rows.',
    },
    {
      title: '2. Graph creation',
      text: 'Rows are converted into a directed graph where each node is a product and each edge captures co-purchase flow. Degree summaries, topology previews, and a force-directed view are generated immediately.',
    },
    {
      title: '3. Algorithm execution',
      text: 'HITS, PageRank, Fair PageRank, Personalized PageRank, and Normalized PageRank are run over the same graph so the comparison remains structurally consistent.',
    },
    {
      title: '4. Ranking output',
      text: 'The application produces ordered score tables, node-level charts, and score curves that reveal how much probability mass each method gives to the head versus the long tail.',
    },
    {
      title: '5. Evaluation',
      text: 'Inequality metrics such as Gini coefficient, rank inequality, and degree-rank correlation quantify whether a method is amplifying or reducing structural bias.',
    },
  ];

  const flow = ['Load data', 'Create graph', 'Run ranking', 'Generate outputs', 'Evaluate fairness'];
  const deliverables = [
    'Problem definition and motivation for long-tail fairness',
    'Graph construction from a real marketplace-style edge list',
    'Implementation of five ranking algorithms',
    'Comparative charts, tables, and distribution views',
    'Quantitative fairness metrics and final conclusion',
  ];

  return (
    <section className="space-y-10">
      <div className="rounded-[36px] border border-slate-200 bg-white p-10 shadow-soft">
        <h1 className="text-4xl font-semibold text-slate-950">Methodology</h1>
        <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-600">
          The methodology is a clean pipeline from raw graph data to fairness evaluation. Each stage is visible so you can trace where structural inequality enters and how the algorithmic adjustments respond to it.
        </p>
      </div>

      <div className="rounded-[36px] border border-slate-200 bg-white p-10 shadow-soft">
        <div className="grid gap-6 lg:grid-cols-5">
          {steps.map((step) => (
            <article key={step.title} className="rounded-[28px] bg-slate-50 p-6">
              <h2 className="text-xl font-semibold text-slate-950">{step.title}</h2>
              <p className="mt-4 leading-7 text-slate-600">{step.text}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="rounded-[36px] border border-slate-200 bg-white p-10 shadow-soft">
        <h2 className="text-2xl font-semibold text-slate-950">Flow diagram</h2>
        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center">
          {flow.map((label, index) => (
            <div key={label} className="flex items-center gap-4">
              <div className="rounded-3xl bg-slate-900 px-6 py-5 text-center text-sm font-semibold text-white">{label}</div>
              {index < flow.length - 1 ? <div className="hidden text-3xl text-slate-300 lg:block">→</div> : null}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[36px] border border-slate-200 bg-white p-10 shadow-soft">
        <h2 className="text-2xl font-semibold text-slate-950">Project completion checklist</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {deliverables.map((item) => (
            <div key={item} className="rounded-[26px] bg-emerald-50 p-5 text-sm font-medium leading-7 text-emerald-900">
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Methodology;
