function Conclusion() {
  return (
    <section className="space-y-10">
      <div className="rounded-[36px] border border-slate-200 bg-white p-10 shadow-soft">
        <h1 className="text-4xl font-semibold text-slate-950">Conclusion</h1>
        <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-600">
          The application shows a consistent pattern across marketplace graphs: standard link-analysis methods reward structural advantage, while fairness-aware methods preserve ranking signal but reduce visibility inequality. That matters whenever discovery quality depends on more than raw popularity.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-[30px] border border-slate-200 bg-white p-7 shadow-soft"><h2 className="text-xl font-semibold text-slate-950">Summary of findings</h2><p className="mt-3 leading-7 text-slate-600">Power-law structure pushes HITS and PageRank toward the head of the graph. Fair PageRank and Normalized PageRank reduce that concentration and improve long-tail visibility.</p></div>
        <div className="rounded-[30px] border border-slate-200 bg-white p-7 shadow-soft"><h2 className="text-xl font-semibold text-slate-950">Why fairness matters</h2><p className="mt-3 leading-7 text-slate-600">A marketplace that only recycles existing popularity becomes less diverse, less discoverable, and less informative for users. Fair ranking broadens exposure without abandoning graph structure.</p></div>
        <div className="rounded-[30px] border border-slate-200 bg-white p-7 shadow-soft"><h2 className="text-xl font-semibold text-slate-950">Real-world applications</h2><p className="mt-3 leading-7 text-slate-600">The same reasoning applies to ecommerce, app stores, recommendation systems, content discovery, scholarly citation graphs, and any environment where visibility compounds over time.</p></div>
      </div>

      <div className="rounded-[36px] border border-slate-200 bg-slate-900 p-10 text-white shadow-soft">
        <h2 className="text-3xl font-semibold">Final project statement</h2>
        <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-200">
          This project is now structured as a complete working study: it loads marketplace graph data, implements baseline and fairness-aware ranking methods, visualizes their behavior across multiple pages, and supports the core problem statement with measurable long-tail fairness evidence.
        </p>
      </div>
    </section>
  );
}

export default Conclusion;
