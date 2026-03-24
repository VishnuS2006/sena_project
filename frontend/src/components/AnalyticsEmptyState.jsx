export default function AnalyticsEmptyState({ title, description, className = "" }) {
  return (
    <div
      className={`flex min-h-[280px] flex-col items-center justify-center rounded-[28px] border border-dashed border-stone-200 bg-white/45 px-6 py-10 text-center ${className}`}
    >
      <h3 className="text-xl font-semibold text-ink">{title}</h3>
      <p className="mt-3 max-w-xl text-sm leading-6 text-stone-600">{description}</p>
    </div>
  )
}
