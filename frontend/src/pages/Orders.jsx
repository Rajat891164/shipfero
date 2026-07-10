import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Download, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Truck,
  X,
  SlidersHorizontal,
  Package,
  RefreshCw
} from 'lucide-react';

const ordersData = [
  { id: 'ORD-7721', date: '21 Apr 2026', customer: 'Rahul Sharma',   amount: '₹1,250', status: 'Booked',     courier: 'Delhivery',     awb: '1442155261' },
  { id: 'ORD-7720', date: '21 Apr 2026', customer: 'Priya Verma',    amount: '₹890',   status: 'In Transit', courier: 'BlueDart',       awb: 'BD882199' },
  { id: 'ORD-7719', date: '20 Apr 2026', customer: 'Amit Patel',     amount: '₹2,100', status: 'Delivered',  courier: 'XpressBees',    awb: 'XP112233' },
  { id: 'ORD-7718', date: '20 Apr 2026', customer: 'Sneider John',   amount: '₹450',   status: 'RTO',        courier: 'Ecom Express',  awb: 'EE556677' },
  { id: 'ORD-7717', date: '19 Apr 2026', customer: 'Megha Singh',    amount: '₹1,560', status: 'Cancelled',  courier: '-',             awb: '-' },
  { id: 'ORD-7716', date: '19 Apr 2026', customer: 'Vikram AD',      amount: '₹999',   status: 'In Transit', courier: 'Delhivery',     awb: '1442155262' },
  { id: 'ORD-7715', date: '18 Apr 2026', customer: 'Suresh Raina',   amount: '₹3,400', status: 'Delivered',  courier: 'BlueDart',      awb: 'BD882190' },
  { id: 'ORD-7714', date: '18 Apr 2026', customer: 'Kajal Dawas',    amount: '₹750',   status: 'On Hold',    courier: '-',             awb: '-' },
];

const statusConfig = {
  'Booked':     { cls: 'bg-primary/10 text-primary border-primary/10',       dot: 'bg-primary' },
  'In Transit': { cls: 'bg-secondary/10 text-secondary border-secondary/10', dot: 'bg-secondary' },
  'Delivered':  { cls: 'bg-success/10 text-success border-success/10',       dot: 'bg-success' },
  'RTO':        { cls: 'bg-error/10 text-error border-error/10',             dot: 'bg-error animate-pulse' },
  'Cancelled':  { cls: 'bg-muted/10 text-muted border-muted/10',             dot: 'bg-muted' },
  'On Hold':    { cls: 'bg-warning/10 text-warning border-warning/10',       dot: 'bg-warning' },
};

const StatusBadge = ({ status }) => {
  const cfg = statusConfig[status] || statusConfig['Cancelled'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {status}
    </span>
  );
};

const tabs = ['All', 'New', 'In Transit', 'Delivered', 'RTO', 'NDR'];

const Orders = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [selectedRows, setSelectedRows] = useState(new Set());

  const toggleRow = (id) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filteredOrders = ordersData.filter(o => {
    const matchTab = activeTab === 'All' || activeTab === 'New' || o.status === activeTab;
    const matchSearch = !searchVal || 
      o.id.toLowerCase().includes(searchVal.toLowerCase()) || 
      o.awb.toLowerCase().includes(searchVal.toLowerCase()) ||
      o.customer.toLowerCase().includes(searchVal.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Management</span>
          </div>
          <h2 className="text-2xl font-bold text-main">Orders</h2>
          <p className="text-muted text-sm mt-0.5">View and manage all shipment orders across integrated channels.</p>
        </div>
        <div className="flex gap-2.5">
          <button
            className="neon-button-outline flex items-center gap-2 text-xs !py-2"
            onClick={() => alert('MIS Report Export Initialized')}
            id="orders-export"
          >
            <Download className="w-3.5 h-3.5" /> Export MIS
          </button>
          <button
            className="neon-button-primary flex items-center gap-2 text-xs !py-2"
            onClick={() => alert('Processing selected orders...')}
            id="orders-process"
          >
            {selectedRows.size > 0 ? `Process (${selectedRows.size})` : 'Process Orders (12)'}
          </button>
        </div>
      </div>

      {/* Tabs + Search bar */}
      <div className="glass-card p-2 flex flex-col sm:flex-row justify-between gap-3">
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-primary text-background shadow-neon-sm'
                  : 'text-muted hover:text-main hover:bg-surface-hover'
              }`}
              id={`orders-tab-${tab.replace(/\s+/g, '-').toLowerCase()}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
            <input
              type="text"
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              placeholder="Order ID / AWB / Customer"
              className="input-field !py-2 !pl-8 !pr-4 text-xs w-full sm:w-52"
              id="orders-search"
            />
            {searchVal && (
              <button onClick={() => setSearchVal('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-main">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          
          {/* Filter button */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-xl transition-all duration-200 ${
                showFilters ? 'bg-primary/10 text-primary' : 'bg-surface-light text-muted hover:text-main'
              }`}
              id="orders-filter"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {showFilters && (
              <div className="absolute right-0 mt-2 w-64 glass-card p-4 shadow-card-dark z-50 animate-fade-up">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[10px] font-bold text-muted uppercase tracking-widest">Quick Filters</h4>
                  <button onClick={() => setShowFilters(false)} className="text-muted hover:text-main transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-muted uppercase ml-1">Channel</label>
                    <select className="input-field !py-1.5 text-xs">
                      <option>All Channels</option>
                      <option>Shopify</option>
                      <option>WooCommerce</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-muted uppercase ml-1">Courier</label>
                    <select className="input-field !py-1.5 text-xs">
                      <option>All Couriers</option>
                      <option>Delhivery</option>
                      <option>BlueDart</option>
                    </select>
                  </div>
                  <button
                    className="w-full neon-button-primary !py-2 text-[10px]"
                    onClick={() => setShowFilters(false)}
                  >
                    APPLY FILTERS
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            className="p-2 bg-surface-light rounded-xl text-muted hover:text-main transition-all"
            onClick={() => alert('Filter by Date Range')}
            title="Date Filter"
          >
            <Calendar className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left data-table">
            <thead>
              <tr>
                <th className="px-6 w-10">
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5 rounded accent-primary cursor-pointer"
                    onChange={(e) => {
                      if (e.target.checked) setSelectedRows(new Set(filteredOrders.map(o => o.id)));
                      else setSelectedRows(new Set());
                    }}
                    checked={selectedRows.size === filteredOrders.length && filteredOrders.length > 0}
                  />
                </th>
                <th className="px-4">Order Details</th>
                <th className="px-4">Customer</th>
                <th className="px-4">Amount</th>
                <th className="px-4">Status</th>
                <th className="px-4">Courier / AWB</th>
                <th className="px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className={`group cursor-pointer transition-all duration-150 ${selectedRows.has(order.id) ? 'bg-primary/5' : ''}`}
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(order.id)}
                      onChange={() => toggleRow(order.id)}
                      onClick={e => e.stopPropagation()}
                      className="w-3.5 h-3.5 rounded accent-primary cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-4" onClick={() => navigate(`/orders/${order.id}`)}>
                    <div className="font-bold text-primary text-xs">{order.id}</div>
                    <div className="text-[10px] text-muted mt-0.5">{order.date}</div>
                  </td>
                  <td className="px-4 py-4" onClick={() => navigate(`/orders/${order.id}`)}>
                    <div className="font-semibold text-main text-xs">{order.customer}</div>
                    <div className="text-[10px] text-muted mt-0.5">Shopify Store</div>
                  </td>
                  <td className="px-4 py-4" onClick={() => navigate(`/orders/${order.id}`)}>
                    <span className="font-bold text-main text-xs">{order.amount}</span>
                  </td>
                  <td className="px-4 py-4" onClick={() => navigate(`/orders/${order.id}`)}>
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-4" onClick={() => navigate(`/orders/${order.id}`)}>
                    <div className="text-xs font-medium text-main">{order.courier}</div>
                    {order.awb !== '-' && (
                      <div className="text-[10px] bg-primary/8 text-primary px-1.5 py-0.5 rounded mt-1 inline-block font-mono">
                        {order.awb}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/orders/${order.id}`); }}
                        className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-background transition-all duration-200 hover:scale-110"
                        title="View order"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate('/track'); }}
                        className="p-1.5 bg-secondary/10 text-secondary rounded-lg hover:bg-secondary hover:text-background transition-all duration-200 hover:scale-110"
                        title="Track order"
                      >
                        <Truck className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <Package className="w-10 h-10 text-muted/30 mx-auto mb-3" />
                    <p className="text-sm font-bold text-muted">No orders found</p>
                    <p className="text-xs text-muted/60 mt-1">Try adjusting your filters or search term</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-main flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[10px] text-muted font-bold tracking-widest uppercase">
            Showing 1–{filteredOrders.length} of 452 orders
          </p>
          <div className="flex items-center gap-1.5">
            <button className="p-1.5 bg-surface-light rounded-lg text-muted hover:text-primary disabled:opacity-30 transition-all" disabled>
              <ChevronLeft className="w-4 h-4" />
            </button>
            {[1, 2, 3, '…', 45].map((p, i) => (
              <button
                key={i}
                onClick={() => typeof p === 'number' && console.log(`Page ${p}`)}
                className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                  p === 1 
                    ? 'bg-primary text-background shadow-neon-sm' 
                    : typeof p === 'number' 
                      ? 'text-muted hover:bg-surface-hover hover:text-primary' 
                      : 'text-muted cursor-default'
                }`}
              >
                {p}
              </button>
            ))}
            <button className="p-1.5 bg-surface-light rounded-lg text-muted hover:text-primary transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Orders;
