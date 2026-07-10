import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, User, Search, Globe, Moon, Sun, Settings, LogOut, ChevronDown, X, Command } from 'lucide-react';
import useUIStore from '../../store/useUIStore';
import useAuthStore from '../../store/useAuthStore';

const routeLabels = {
  '/dashboard': 'Dashboard',
  '/orders': 'Orders',
  '/track': 'Track Shipment',
  '/returns': 'Returns',
  '/ndr': 'NDR Management',
  '/logistics': 'Logistics',
  '/wallet': 'Wallet & Financials',
  '/pricing': 'Rate Card',
  '/reports': 'Reports',
  '/settings': 'Settings',
  '/integrations': 'Integrations',
  '/add-ons': 'Add-ons',
};

const Topbar = () => {
  const { theme, toggleTheme } = useUIStore();
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [notifCount] = useState(3);
  const userMenuRef = useRef(null);
  const searchRef = useRef(null);

  const currentPage = routeLabels[location.pathname] || 'Dashboard';

  // Close menus on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search when opened
  useEffect(() => {
    if (showSearch && searchRef.current) searchRef.current.focus();
  }, [showSearch]);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
        setShowUserMenu(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <header className="h-16 bg-surface/70 backdrop-blur-xl border-b border-main flex items-center justify-between px-6 sticky top-0 z-40 transition-colors duration-300">
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="hidden md:block">
          <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Courier Aggregator</p>
          <h2 className="text-sm font-semibold text-main leading-none mt-0.5">{currentPage}</h2>
        </div>
      </div>

      {/* Center: Search Bar */}
      <div className="flex-1 max-w-md mx-6">
        <button
          onClick={() => setShowSearch(true)}
          className="w-full flex items-center gap-3 bg-surface-light rounded-xl px-4 py-2 text-muted text-sm hover:bg-surface-hover transition-all duration-200 group"
        >
          <Search className="w-4 h-4 group-hover:text-primary transition-colors" />
          <span className="flex-1 text-left text-xs">Search shipments, orders, AWB...</span>
          <kbd className="hidden sm:flex items-center gap-1 bg-surface border border-main rounded px-1.5 py-0.5 text-[9px] font-bold text-muted/60">
            <Command className="w-2.5 h-2.5" />K
          </kbd>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="relative p-2.5 rounded-xl text-muted hover:text-main hover:bg-surface-hover transition-all duration-200 group"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          aria-label="Toggle theme"
        >
          <div className="relative overflow-hidden w-5 h-5 flex items-center justify-center">
            <Sun className={`w-5 h-5 absolute transition-all duration-300 ${theme === 'dark' ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90'}`} />
            <Moon className={`w-5 h-5 absolute transition-all duration-300 ${theme === 'light' ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'}`} />
          </div>
        </button>

        {/* Notifications */}
        <button
          className="relative p-2.5 rounded-xl text-muted hover:text-main hover:bg-surface-hover transition-all duration-200"
          title="Notifications"
          aria-label="View notifications"
          onClick={() => alert(`You have ${notifCount} pending notifications.`)}
        >
          <Bell className="w-5 h-5" />
          {notifCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border-2 border-surface animate-pulse" />
          )}
        </button>

        <div className="h-6 w-px bg-main mx-1" style={{ opacity: 0.1 }} />

        {/* User menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 cursor-pointer group rounded-xl px-2 py-1.5 hover:bg-surface-hover transition-all duration-200"
            aria-expanded={showUserMenu}
          >
            <div className="w-8 h-8 rounded-full bg-neon-glow p-[2px] shadow-neon-sm flex-shrink-0">
              <div className="w-full h-full rounded-full bg-surface flex items-center justify-center overflow-hidden">
                <User className="w-4 h-4 text-muted group-hover:text-primary transition-colors" />
              </div>
            </div>
            <div className="text-right hidden md:block">
              <p className="text-xs font-semibold text-main leading-none">Akshay Tomar</p>
              <p className="text-[9px] text-muted mt-0.5 leading-none">Enterprise</p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-muted transition-transform duration-300 ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-52 glass-card shadow-card-dark overflow-hidden border-main animate-fade-up z-50">
              <div className="px-4 py-3 bg-surface-light/50">
                <p className="text-xs font-semibold text-main">Akshay Tomar</p>
                <p className="text-[10px] text-muted mt-0.5">akshay.tomar@example.com</p>
              </div>
              <div className="py-1.5">
                <button
                  className="w-full px-4 py-2.5 text-left text-xs text-muted hover:bg-surface-hover hover:text-primary transition-all flex items-center gap-3 group"
                  onClick={() => { setShowUserMenu(false); navigate('/settings'); }}
                >
                  <User className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Profile Settings</span>
                </button>
                <button
                  className="w-full px-4 py-2.5 text-left text-xs text-muted hover:bg-surface-hover hover:text-primary transition-all flex items-center gap-3 group"
                  onClick={() => { setShowUserMenu(false); navigate('/settings'); }}
                >
                  <Settings className="w-3.5 h-3.5 group-hover:rotate-45 transition-transform duration-300" />
                  <span className="font-medium">Preferences</span>
                </button>
                <div className="h-px bg-main my-1.5" style={{ opacity: 0.08 }} />
                <button
                  onClick={() => { setShowUserMenu(false); logout(); }}
                  className="w-full px-4 py-2.5 text-left text-xs text-error hover:bg-error/8 transition-all flex items-center gap-3 group"
                >
                  <LogOut className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full-screen Search Modal */}
      {showSearch && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4"
          onClick={(e) => e.target === e.currentTarget && setShowSearch(false)}
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowSearch(false)} />
          <div className="relative w-full max-w-xl glass-card shadow-card-dark overflow-hidden animate-fade-up z-10">
            <div className="flex items-center gap-3 p-4">
              <Search className="w-5 h-5 text-primary flex-shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Search shipments, orders, AWB number..."
                className="flex-1 bg-transparent border-none focus:outline-none text-sm text-main placeholder:text-muted"
              />
              <button
                onClick={() => setShowSearch(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-light text-muted hover:text-main transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 text-center text-xs text-muted py-8">
              {searchVal ? `Searching for "${searchVal}"...` : 'Type to start searching across all modules'}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Topbar;
