export default function SectionCard({
  eyebrow,
  title,
  subtitle,
  children,
  className = "",
}) {
  return (
    <section className={`section-card ${className}`.trim()}>
      <div className="section-header">
        {eyebrow ? <p className="section-eyebrow">{eyebrow}</p> : null}
        <div>
          <h2>{title}</h2>
          {subtitle ? <p className="section-subtitle">{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}
