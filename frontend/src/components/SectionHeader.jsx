export default function SectionHeader({ eyebrow, title, description }) {
  return (
    <div className="mb-5">
      <p className="font-['IBM_Plex_Mono'] text-[11px] uppercase tracking-[0.35em] text-stone-500">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        {title}
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600 sm:text-base">
        {description}
      </p>
    </div>
  )
}
