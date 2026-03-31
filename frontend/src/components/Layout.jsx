import { Outlet } from 'react-router-dom';
import Footer from './Footer.jsx';
import Navbar from './Navbar.jsx';

function Layout() {
  return (
    <div className="min-h-screen bg-surface text-slate-900">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default Layout;
