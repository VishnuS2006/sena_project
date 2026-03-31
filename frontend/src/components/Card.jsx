function Card({ title, description, badge, children, className = '' }) {
  return (
    <article className={`group rounded-3xl border border-slate-200 bg-white p-6 shadow-soft transition hover:-translate-y-1 ${className}`}>
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
        {badge ? <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{badge}</span> : null}
      </div>
      <p className="mt-4 text-slate-600">{description}</p>
      {children}
    </article>
  );
}

export default Card;
