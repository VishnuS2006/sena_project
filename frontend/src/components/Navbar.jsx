import { Link, NavLink } from 'react-router-dom';

const items = [
  { path: '/', label: 'Home' },
  { path: '/problem', label: 'Problem' },
  { path: '/data', label: 'Data' },
  { path: '/algorithms', label: 'Algorithms' },
  { path: '/methodology', label: 'Methodology' },
  { path: '/analysis', label: 'Analysis' },
  { path: '/results', label: 'Results' },
  { path: '/metrics', label: 'Metrics' },
  { path: '/conclusion', label: 'Conclusion' },
];

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="text-lg font-semibold tracking-tight text-slate-950">
            Power Laws and Long-Tail Ranking
          </Link>
          <div className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 lg:block">
            Marketplace Fairness Studio
          </div>
        </div>
        <nav className="flex flex-wrap gap-2">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-soft'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
