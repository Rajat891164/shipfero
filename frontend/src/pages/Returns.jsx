import React, { useEffect, useState, useCallback } from 'react';
import {
  RotateCcw,
  Package,
  ArrowLeftRight,
  Search,
  Filter
} from 'lucide-react';
import { ReturnService, unwrap } from '../services/api';

const TABS = [
  { label: 'All Returns', status: '' },
  { label: 'Pickup Pending', status: 'PICKUP_SCHEDULED' },
  { label: 'In Transit', status: 'IN_TRANSIT' },
  { label: 'Received', status: 'DELIVERED' },
  { label: 'RTO Orders', type: 'RTO' },
];

const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '';

const Returns = () => {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [search, setSearch] = useState('');
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReturns = useCallback(() => {
    setLoading(true);
    const params = {};
    if (activeTab.status) params.status = activeTab.status;
    if (activeTab.type) params.type = activeTab.type;
    if (search.trim()) params.search = search.trim();
    ReturnService.list(params)
      .then(({ data }) => setReturns(unwrap(data) || []))
      .catch(() => setReturns([]))
      .finally(() => setLoading(false));
  }, [activeTab, search]);

  useEffect(() => {
    const t = setTimeout(fetchReturns, 300);
    return () => clearTimeout(t);
  }, [fetchReturns]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3 text-main">
            <RotateCcw className="text-secondary w-8 h-8" />
            Returns & RTO management
          </h2>
          <p className="text-muted text-sm mt-1">Track return shipments and manage reverse logistics efficiently.</p>
        </div>
        <button className="neon-button-outline !py-2 text-xs" onClick={() => alert('Opening Return Settings...')}>VIEW RETURN SETTINGS</button>
      </div>

      {/* Tabs */}
      <div className="glass-card p-2 flex gap-1 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab.label === tab.label
                ? 'bg-secondary text-white shadow-neon-purple'
                : 'text-muted hover:bg-main/5 hover:text-main'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Return ID, Original Order or AWB..."
            className="input-field pl-10 !py-2.5 text-xs text-main bg-surface w-full"
          />
        </div>
        <button className="bg-surface-light px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 text-muted hover:text-primary transition-colors" onClick={() => alert('Opening return filters...')}>
          <Filter className="w-4 h-4" /> FILTERS
        </button>
      </div>

      {/* Returns List */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left data-table">
            <thead>
              <tr className="text-[10px] text-muted uppercase tracking-widest">
                <th className="px-6 py-4 font-bold">Return Details</th>
                <th className="px-6 py-4 font-bold">Customer</th>
                <th className="px-6 py-4 font-bold">Return Type</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Courier</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {loading && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-muted text-xs">Loading returns...</td></tr>
              )}
              {!loading && returns.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-muted text-xs">No returns found.</td></tr>
              )}
              {!loading && returns.map((item) => (
                <tr key={item.id} className="hover:bg-primary/4 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-secondary group-hover:shadow-neon-purple-sm transition-all">RET-{item.id}</div>
                    <div className="text-[10px] text-muted font-medium">Original: {item.original_awb || '—'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-main">{item.customer_name}</div>
                    <div className="text-[10px] text-muted">{formatDate(item.created_at)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-primary font-bold">
                      {item.return_type === 'RTO' ? <Package className="w-3 h-3" /> : <ArrowLeftRight className="w-3 h-3" />}
                      {item.return_type === 'RTO' ? 'RTO' : 'Reverse Pickup'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full bg-main/5 text-[10px] font-bold text-muted">
                      {(item.status || '').replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-main">{item.return_carrier_name || '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 bg-surface-light rounded-lg text-muted hover:text-secondary transition-all" onClick={() => alert(`Viewing tracking detail for return RET-${item.id}`)}>
                      <Search className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Returns;
