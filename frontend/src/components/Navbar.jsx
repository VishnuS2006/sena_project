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
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-soft">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-lg font-semibold text-slate-900">
          Power Law Rank
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive ? 'text-brand underline underline-offset-4' : 'text-slate-600 hover:text-slate-900'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="block md:hidden text-slate-600 text-sm">Mobile menu</div>
      </div>
    </header>
  );
}

export default Navbar;
