function Conclusion() {
  return (
    <section className="space-y-10">
      <div className="rounded-[36px] border border-slate-200 bg-white p-10 shadow-soft">
        <h1 className="text-4xl font-semibold text-slate-950">Conclusion</h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">
          Fair ranking transforms marketplace networks by reducing the dominance of high-degree nodes and improving exposure for the long tail. In power-law graphs, this can improve diversity without sacrificing meaningful ranking structure.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft">
          <h2 className="text-xl font-semibold text-slate-950">Summary</h2>
          <p className="mt-4 text-slate-600">HITS and PageRank are biased in power-law networks. Fair PageRank and normalization offer robust alternatives for long-tail visibility.</p>
        </div>
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft">
          <h2 className="text-xl font-semibold text-slate-950">Applications</h2>
          <p className="mt-4 text-slate-600">This work applies to ecommerce, content recommendation, search ranking, and any network where popularity drives attention.</p>
        </div>
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft">
          <h2 className="text-xl font-semibold text-slate-950">Future scope</h2>
          <p className="mt-4 text-slate-600">Future extensions include group-aware fairness, dynamic graphs, and hybrid personalization for user-specific long-tail discovery.</p>
        </div>
      </div>
    </section>
  );
}

export default Conclusion;
