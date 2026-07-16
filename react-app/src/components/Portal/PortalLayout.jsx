import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../utils/api';
import '../../styles/portal.css';

export default function PortalLayout({ children, title = '', subtitle = '' }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    api.post('/auth/logout').finally(() => {
      navigate('/client-portal/login');
    });
  };

  useEffect(() => {
    async function loadPortal() {
      try {
        const data = await api.get('/auth/me');
        if (!data?.user) {
          navigate('/client-portal/login');
          return;
        }
        if (data.user.role !== 'client') {
          navigate('/admin/dashboard');
          return;
        }
        setUser(data.user);

        // Fetch counts
        const { notifications } = await api.get('/notifications');
        const unreadN = notifications.filter(n => !n.is_read).length;
        setUnreadNotif(unreadN);

        setLoading(false);
      } catch (err) {
        navigate('/client-portal/login');
      }
    }
    loadPortal();
  }, [navigate]);

  // Reflect profile edits (name/avatar) in the sidebar/header without a reload.
  useEffect(() => {
    const refresh = () => {
      api.get('/auth/me').then(d => { if (d?.user) setUser(d.user); }).catch(() => {});
    };
    window.addEventListener('profile-updated', refresh);
    return () => window.removeEventListener('profile-updated', refresh);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-rose-100 border-t-rose-600"></div>
      </div>
    );
  }

  const currentPath = location.pathname;
  const isTabActive = (path) => currentPath === path;

  return (
    <div className="flex min-h-screen bg-[#f9f8f6] font-sans">
      {/* Sidebar Overlay for Mobile */}
      <div 
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity duration-300 md:hidden ${menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMenuOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-gray-100/80 shadow-[1px_0_20px_rgba(16,24,40,0.03)] flex flex-col justify-between py-6 transition-transform duration-300 md:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div>
          {/* Brand Logo */}
          <div className="px-6 pb-6 border-b border-gray-50 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#d4001f] to-[#a4001a] text-white flex items-center justify-center font-serif text-lg font-bold shadow-sm">
              B
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900 leading-tight">BAAS Portal</div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mt-0.5">Client Dashboard</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-4 py-6 space-y-1.5">
            <div className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Main</div>

            <Link 
              to="/client-portal/dashboard" 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${isTabActive('/client-portal/dashboard') ? 'text-[#d4001f] bg-rose-500/[0.04] font-semibold' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
              onClick={() => setMenuOpen(false)}
            >
              <svg className="w-4 h-4 text-current opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
              Dashboard
            </Link>

            <Link 
              to="/client-portal/orders" 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${isTabActive('/client-portal/orders') ? 'text-[#d4001f] bg-rose-500/[0.04] font-semibold' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
              onClick={() => setMenuOpen(false)}
            >
              <svg className="w-4 h-4 text-current opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                <rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/>
              </svg>
              My Orders
            </Link>

            <Link 
              to="/client-portal/new-order" 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${isTabActive('/client-portal/new-order') ? 'text-[#d4001f] bg-rose-500/[0.04] font-semibold' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
              onClick={() => setMenuOpen(false)}
            >
              <svg className="w-4 h-4 text-current opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>
              </svg>
              New Order
            </Link>

            <Link 
              to="/client-portal/documents" 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${isTabActive('/client-portal/documents') ? 'text-[#d4001f] bg-rose-500/[0.04] font-semibold' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
              onClick={() => setMenuOpen(false)}
            >
              <svg className="w-4 h-4 text-current opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/>
              </svg>
              Documents
            </Link>

            <div className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-4 mb-2">Communication</div>

            <Link
              to="/client-portal/chat"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${isTabActive('/client-portal/chat') ? 'text-[#d4001f] bg-rose-500/[0.04] font-semibold' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
              onClick={() => setMenuOpen(false)}
            >
              <svg className="w-4 h-4 text-current opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
              </svg>
              Live Support
            </Link>

            <Link
              to="/client-portal/notifications"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${isTabActive('/client-portal/notifications') ? 'text-[#d4001f] bg-rose-500/[0.04] font-semibold' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
              onClick={() => setMenuOpen(false)}
            >
              <svg className="w-4 h-4 text-current opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
              Notifications
              {unreadNotif > 0 && (
                <span className="ml-auto inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold bg-[#d4001f] text-white">
                  {unreadNotif}
                </span>
              )}
            </Link>

            <div className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-4 mb-2">Billing</div>

            <Link 
              to="/client-portal/invoices" 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${isTabActive('/client-portal/invoices') ? 'text-[#d4001f] bg-rose-500/[0.04] font-semibold' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
              onClick={() => setMenuOpen(false)}
            >
              <svg className="w-4 h-4 text-current opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>
              </svg>
              Invoices
            </Link>

            <div className="h-px bg-gray-100 my-4" />

            <Link 
              to="/client-portal/profile" 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${isTabActive('/client-portal/profile') ? 'text-[#d4001f] bg-rose-500/[0.04] font-semibold' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
              onClick={() => setMenuOpen(false)}
            >
              <svg className="w-4 h-4 text-current opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              Profile
            </Link>
          </nav>
        </div>

        {/* Sidebar Footer / User Profile */}
        <div className="px-4 space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/50">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#d4001f] to-[#a4001a] text-white flex items-center justify-center text-xs font-bold shrink-0">
              {((user?.first_name?.[0] || '') + (user?.last_name?.[0] || '')).toUpperCase() || '?'}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-gray-800 truncate">
                {user?.first_name} {user?.last_name}
              </div>
              <div className="text-[10px] text-gray-400 truncate">
                {user?.email}
              </div>
            </div>
          </div>
          <button 
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50/50 hover:text-rose-700 transition-colors"
            onClick={handleLogout}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Contents */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0 min-h-screen">
        {/* Sticky Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 flex items-center justify-between">
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
            <div>
              <h1 className="text-base font-bold text-gray-900 tracking-tight leading-tight">{title}</h1>
              {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              to="/client-portal/notifications" 
              className="relative p-2 rounded-lg border border-gray-100 text-gray-500 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-50/50 transition-all" 
              aria-label="Notifications"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
              {unreadNotif > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#d4001f] border-2 border-white" />
              )}
            </Link>
            <Link 
              to="/client-portal/profile" 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-100 text-xs font-semibold text-gray-700 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              Profile
            </Link>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}

