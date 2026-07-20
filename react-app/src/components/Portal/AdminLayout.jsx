import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../utils/api';
import '../../styles/portal.css';

export default function AdminLayout({ children, title = '' }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    api.post('/auth/logout').finally(() => {
      navigate('/admin/login');
    });
  };

  useEffect(() => {
    async function loadAdmin() {
      try {
        const data = await api.get('/auth/me');
        if (!data?.user) {
          navigate('/admin/login');
          return;
        }
        if (data.user.role === 'client') {
          navigate('/client-portal/dashboard');
          return;
        }
        setUser(data.user);
        setLoading(false);
      } catch {
        navigate('/admin/login');
      }
    }
    loadAdmin();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-rose-100 border-t-rose-600"></div>
      </div>
    );
  }

  const currentPath = location.pathname;
  const isTabActive = (path) => currentPath === path;
  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="flex min-h-screen bg-[#f5f5f7] font-sans">
      {/* Sidebar Overlay for Mobile */}
      <div 
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity duration-300 md:hidden ${menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMenuOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`fixed top-0 bottom-0 left-0 z-50 w-60 bg-[#0f0f11] border-r border-white/5 flex flex-col justify-between py-6 transition-transform duration-300 md:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div>
          {/* Brand */}
          <div className="px-6 pb-6 border-b border-white/5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#d4001f] to-[#a4001a] text-white flex items-center justify-center font-serif text-lg font-bold shadow-sm">
              B
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-tight">BAAS Admin</div>
              <div className="text-[10px] font-semibold text-white/40 uppercase tracking-widest mt-0.5">Staff Portal</div>
            </div>
          </div>

          <nav className="px-3 py-6 space-y-1.5">
            <div className="px-3 text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Overview</div>

            <Link 
              to="/admin/dashboard" 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all group relative ${isTabActive('/admin/dashboard') ? 'text-white bg-[#d4001f]/25 font-bold shadow-xs border border-white/5' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
              onClick={() => setMenuOpen(false)}
            >
              <svg className="w-4 h-4 text-current opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
              Dashboard
            </Link>

            <div className="px-3 text-[10px] font-bold text-white/30 uppercase tracking-widest pt-4 mb-2">Management</div>

            <Link 
              to="/admin/clients" 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all group relative ${isTabActive('/admin/clients') ? 'text-white bg-[#d4001f]/25 font-bold shadow-xs border border-white/5' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
              onClick={() => setMenuOpen(false)}
            >
              <svg className="w-4 h-4 text-current opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
              </svg>
              Clients
            </Link>

            <Link 
              to="/admin/orders" 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all group relative ${isTabActive('/admin/orders') ? 'text-white bg-[#d4001f]/25 font-bold shadow-xs border border-white/5' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
              onClick={() => setMenuOpen(false)}
            >
              <svg className="w-4 h-4 text-current opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                <rect x="9" y="3" width="6" height="4" rx="1"/>
              </svg>
              Orders
            </Link>

            <Link 
              to="/admin/payments" 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all group relative ${isTabActive('/admin/payments') ? 'text-white bg-[#d4001f]/25 font-bold shadow-xs border border-white/5' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
              onClick={() => setMenuOpen(false)}
            >
              <svg className="w-4 h-4 text-current opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
              Payments
            </Link>

            <Link
              to="/admin/invoices"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all group relative ${isTabActive('/admin/invoices') ? 'text-white bg-[#d4001f]/25 font-bold shadow-xs border border-white/5' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
              onClick={() => setMenuOpen(false)}
            >
              <svg className="w-4 h-4 text-current opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/>
              </svg>
              Invoices
            </Link>

            <Link
              to="/admin/chat"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all group relative ${isTabActive('/admin/chat') ? 'text-white bg-[#d4001f]/25 font-bold shadow-xs border border-white/5' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
              onClick={() => setMenuOpen(false)}
            >
              <svg className="w-4 h-4 text-current opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
              </svg>
              Live Chat
            </Link>

            <Link
              to="/admin/blogs"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all group relative ${currentPath.startsWith('/admin/blogs') ? 'text-white bg-[#d4001f]/25 font-bold shadow-xs border border-white/5' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
              onClick={() => setMenuOpen(false)}
            >
              <svg className="w-4 h-4 text-current opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
              </svg>
              Blog Management
            </Link>

            <Link 
              to="/admin/notifications" 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all group relative ${isTabActive('/admin/notifications') ? 'text-white bg-[#d4001f]/25 font-bold shadow-xs border border-white/5' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
              onClick={() => setMenuOpen(false)}
            >
              <svg className="w-4 h-4 text-current opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
              Send Notification
            </Link>

            <div className="px-3 text-[10px] font-bold text-white/30 uppercase tracking-widest pt-4 mb-2">System</div>

            <Link 
              to="/admin/activity" 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all group relative ${isTabActive('/admin/activity') ? 'text-white bg-[#d4001f]/25 font-bold shadow-xs border border-white/5' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
              onClick={() => setMenuOpen(false)}
            >
              <svg className="w-4 h-4 text-current opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              Activity Log
            </Link>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="px-3 space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-white/[0.02]">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#d4001f] to-[#a4001a] text-white flex items-center justify-center text-xs font-bold shrink-0">
              {(user?.name?.[0] || 'A').toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-white/90 truncate">{user?.name}</div>
              <div className="text-[10px] text-white/40 truncate capitalize">{user?.role}</div>
            </div>
          </div>
          <button 
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
            onClick={handleLogout}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 md:pl-60 flex flex-col min-w-0 min-h-screen">
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-100 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              className="p-2 rounded-lg border border-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-50 md:hidden" 
              onClick={() => setMenuOpen(!menuOpen)} 
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <line x1="3" y1="6"  x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <div className="text-base font-bold text-gray-900 tracking-tight" id="admin-page-title">{title}</div>
          </div>
          <div className="text-xs text-gray-400 font-medium" id="topbar-date">{todayStr}</div>
        </header>

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}

