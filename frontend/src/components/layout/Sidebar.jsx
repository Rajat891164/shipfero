import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Search, 
  RotateCcw, 
  AlertTriangle, 
  Truck, 
  Wallet, 
  PlusCircle, 
  BarChart3, 
  Settings, 
  Link as LinkIcon,
  ChevronRight,
  TrendingUp,
  IndianRupee,
  Sparkles,
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import useUIStore from '../../store/useUIStore';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', accent: 'primary' },
  { 
    icon: Package, 
    label: 'Orders', 
    path: '/orders',
    accent: 'primary',
    subItems: [
      { label: 'All Orders', path: '/orders' },
      { label: 'Forward Orders', path: '/orders?type=forward' },
      { label: 'Reverse Orders', path: '/returns' },
    ]
  },
  { icon: Search, label: 'Track', path: '/track', accent: 'primary' },
  { 
    icon: RotateCcw, 
    label: 'RTO & NDR', 
    path: '/ndr',
    accent: 'accent',
    subItems: [
      { label: 'NDR Management', path: '/ndr' },
      { label: 'RTO Reports', path: '/reports?cat=rto' },
    ]
  },
  { 
    icon: Truck, 
    label: 'Logistics', 
    path: '/logistics',
    accent: 'primary',
    subItems: [
      { label: 'Serviceability', path: '/logistics' },
      { label: 'Courier Partners', path: '/integrations' },
    ]
  },
  { icon: IndianRupee, label: 'Financials', path: '/wallet', accent: 'secondary' },
  { icon: PlusCircle, label: 'Add-ons', path: '/add-ons', accent: 'accent' },
  { icon: TrendingUp, label: 'Pricing', path: '/pricing', accent: 'warning' },
  { 
    icon: BarChart3, 
    label: 'Reports', 
    path: '/reports',
    accent: 'success',
    subItems: [
      { label: 'MIS Reports', path: '/reports' },
      { label: 'Shipping Labels', path: '/orders' },
    ]
  },
  { icon: Settings, label: 'Settings', path: '/settings', accent: 'muted' },
  { icon: LinkIcon, label: 'Integrations', path: '/integrations', accent: 'secondary' },
];

const accentMap = {
  primary:   { active: 'text-primary bg-primary/10 border-l border-primary', hover: 'hover:text-primary', dot: 'bg-primary', shadow: 'shadow-neon-sm' },
  secondary: { active: 'text-secondary bg-secondary/10 border-l border-secondary', hover: 'hover:text-secondary', dot: 'bg-secondary', shadow: 'shadow-neon-purple' },
  accent:    { active: 'text-accent bg-accent/10 border-l border-accent', hover: 'hover:text-accent', dot: 'bg-accent', shadow: '' },
  success:   { active: 'text-success bg-success/10 border-l border-success', hover: 'hover:text-success', dot: 'bg-success', shadow: '' },
  warning:   { active: 'text-warning bg-warning/10 border-l border-warning', hover: 'hover:text-warning', dot: 'bg-warning', shadow: '' },
  muted:     { active: 'text-primary bg-primary/10 border-l border-primary', hover: 'hover:text-main', dot: 'bg-muted', shadow: '' },
};

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { expandedMenus, setExpandedMenus } = useUIStore();

  const toggleMenu = (label) => {
    setExpandedMenus(label);
  };

  return (
    <aside className="w-64 h-screen bg-surface border-r border-main flex flex-col fixed left-0 top-0 z-50 transition-colors duration-300">
      {/* Logo */}
      <div className="p-5 flex items-center gap-3">
        <div className="w-10 h-10 bg-neon-glow rounded-xl flex items-center justify-center shadow-neon animate-glow-pulse flex-shrink-0">
          <Truck className="text-white w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-base leading-none text-main tracking-tight">Aggregator</h1>
          <p className="text-[9px] text-primary tracking-[0.25em] font-bold mt-0.5">SHIPFERO v2</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 no-scrollbar">
        <p className="text-[9px] font-bold text-muted/60 uppercase tracking-[0.2em] px-3 mb-2">Navigation</p>
        {menuItems.map((item) => {
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isExpanded = expandedMenus[item.label];
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          const accent = accentMap[item.accent] || accentMap.primary;

          return (
            <div key={item.label}>
              {hasSubItems ? (
                <button
                  onClick={() => toggleMenu(item.label)}
                  className={cn(
                    "w-full flex items-center justify-between group px-3 py-2.5 rounded-xl transition-all duration-200",
                    isActive
                      ? accent.active + " " + accent.shadow
                      : "text-muted hover:text-main hover:bg-surface-hover"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={cn("w-4.5 h-4.5 flex-shrink-0 transition-transform duration-200", isActive ? '' : 'group-hover:scale-110')} style={{width:'18px',height:'18px'}} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <ChevronRight className={cn(
                    "w-3.5 h-3.5 transition-transform duration-300",
                    isExpanded ? "rotate-90 opacity-100" : "opacity-0 group-hover:opacity-60"
                  )} />
                </button>
              ) : (
                <NavLink
                  to={item.path}
                  className={({ isActive: navActive }) => cn(
                    "flex items-center justify-between group px-3 py-2.5 rounded-xl transition-all duration-200",
                    navActive
                      ? accent.active + " " + accent.shadow
                      : "text-muted hover:text-main hover:bg-surface-hover"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110" style={{width:'18px',height:'18px'}} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity" />
                </NavLink>
              )}

              {/* Sub-items with animated expand */}
              {hasSubItems && isExpanded && (
                <div className="ml-8 mt-1 mb-1 space-y-0.5 border-l border-primary/20 pl-3 animate-fade-up">
                  {item.subItems.map((subItem) => (
                    <NavLink
                      key={subItem.label}
                      to={subItem.path}
                      className={({ isActive: navActive }) => cn(
                        "block px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150",
                        navActive
                          ? "text-primary bg-primary/10"
                          : "text-muted hover:text-main hover:bg-surface-hover"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className={cn("w-1.5 h-1.5 rounded-full", accent.dot)} />
                        {subItem.label}
                      </div>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Wallet Widget */}
      <div className="p-3">
        <div className="relative overflow-hidden bg-gradient-to-br from-secondary/20 via-primary/10 to-transparent rounded-2xl p-4 group">
          {/* Background glow */}
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-primary/10 blur-2xl rounded-full group-hover:scale-125 transition-transform duration-500" />
          <div className="absolute -left-2 -bottom-2 w-16 h-16 bg-secondary/10 blur-2xl rounded-full" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse shadow-neon-success" />
              <span className="text-[9px] text-muted font-bold tracking-[0.2em] uppercase">Wallet Balance</span>
            </div>
            <div className="text-xl font-bold text-main mb-3 flex items-baseline gap-1">
              <span className="text-sm text-muted">₹</span>12,450.00
            </div>
            <button 
              onClick={() => navigate('/wallet')}
              className="w-full py-2 bg-primary text-background text-[10px] font-bold rounded-lg transition-all duration-200 hover:shadow-neon hover:scale-[1.02] active:scale-[0.98] tracking-wider uppercase"
            >
              Recharge Wallet
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
