import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  IndianRupee, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Truck,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  Plus,
  TrendingUp,
  Zap
} from 'lucide-react';
import { 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';

const data = [
  { name: 'Mon', shipments: 45, revenue: 12400 },
  { name: 'Tue', shipments: 52, revenue: 15600 },
  { name: 'Wed', shipments: 61, revenue: 18900 },
  { name: 'Thu', shipments: 48, revenue: 14200 },
  { name: 'Fri', shipments: 70, revenue: 21000 },
  { name: 'Sat', shipments: 55, revenue: 16500 },
  { name: 'Sun', shipments: 40, revenue: 11000 },
];

const pieData = [
  { name: 'Delhivery',     value: 400, color: '#00f2fe' },
  { name: 'BlueDart',      value: 300, color: '#7000ff' },
  { name: 'Ecom Express',  value: 200, color: '#ff007a' },
  { name: 'XpressBees',    value: 100, color: '#00ffa3' },
];

const couriersTable = [
  { name: 'Delhivery',    booked: 145, inTransit: 82, delivered: 58, rto: 5,  rate: '94%' },
  { name: 'BlueDart',     booked: 98,  inTransit: 45, delivered: 42, rto: 2,  rate: '97%' },
  { name: 'Ecom Express', booked: 112, inTransit: 68, delivered: 35, rto: 9,  rate: '89%' },
  { name: 'XpressBees',   booked: 75,  inTransit: 38, delivered: 30, rto: 7,  rate: '88%' },
];

const StatCard = ({ icon: Icon, label, value, subtext, trend, gradient, onClick }) => (
  <div
    onClick={onClick}
    className="glass-card glass-card-hover p-6 relative overflow-hidden group"
  >
    {/* Background glow */}
    <div className={`absolute -right-6 -top-6 w-28 h-28 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-500 ${gradient}`} />
    
    <div className="flex justify-between items-start mb-5">
      <div className={`p-3 rounded-xl ${gradient} bg-opacity-10`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${
          trend > 0 
            ? 'bg-success/10 text-success border border-success/20' 
            : 'bg-error/10 text-error border border-error/20'
        }`}>
          {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <p className="text-muted text-xs font-medium mb-1">{label}</p>
    <h3 className="text-2xl font-bold text-main tracking-tight">{value}</h3>
    <p className="text-[9px] text-muted mt-2.5 uppercase tracking-[0.15em] font-bold">{subtext}</p>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card px-4 py-3 shadow-card-dark text-xs">
        <p className="font-bold text-muted mb-1">{label}</p>
        <p className="font-bold text-primary">{payload[0].value} shipments</p>
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-7 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse shadow-neon-success" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Live Dashboard</span>
          </div>
          <h2 className="text-2xl font-bold text-main">Welcome back, Akshay!</h2>
          <p className="text-muted text-sm mt-0.5">Here's what's happening with your shipments today.</p>
        </div>
        <button
          onClick={() => navigate('/orders')}
          className="neon-button-outline flex items-center gap-2 text-xs !py-2.5 whitespace-nowrap"
          id="dashboard-create-order"
        >
          <Plus className="w-4 h-4" /> Create Order
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          icon={Package}
          label="Total Orders Today"
          value="452"
          subtext="24 pending pickup"
          trend={12.5}
          gradient="bg-gradient-to-br from-primary to-primary-dark"
          onClick={() => navigate('/orders')}
        />
        <StatCard
          icon={IndianRupee}
          label="Total Revenue Today"
          value="₹1,24,500"
          subtext="COD collections: ₹45,200"
          trend={8.2}
          gradient="bg-gradient-to-br from-success to-primary"
          onClick={() => navigate('/wallet')}
        />
        <StatCard
          icon={AlertCircle}
          label="Pending Actions"
          value="18"
          subtext="NDR re-attempt required"
          gradient="bg-gradient-to-br from-accent to-secondary"
          onClick={() => navigate('/ndr')}
        />
        <StatCard
          icon={Truck}
          label="Active Shipments"
          value="1,240"
          subtext="Avg TAT: 3.2 days"
          trend={-2.4}
          gradient="bg-gradient-to-br from-secondary to-secondary-dark"
          onClick={() => navigate('/track')}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Business Summary Chart */}
        <div className="xl:col-span-2 glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-bold text-main">Business Summary</h3>
              <p className="text-xs text-muted mt-0.5">Shipment volume over the last week</p>
            </div>
            <div className="relative group">
              <button className="bg-surface-light text-[10px] font-bold rounded-lg px-3 py-1.5 flex items-center gap-2 hover:bg-surface-hover transition-all text-main">
                LAST 7 DAYS <ChevronDown className="w-3 h-3 text-muted" />
              </button>
              <div className="absolute right-0 top-full mt-1 w-32 glass-card hidden group-hover:block z-20 shadow-card-dark overflow-hidden">
                <button className="w-full px-3 py-2.5 text-left text-[10px] font-bold hover:bg-primary/10 hover:text-primary transition-colors text-main">LAST 7 DAYS</button>
                <button className="w-full px-3 py-2.5 text-left text-[10px] font-bold hover:bg-primary/10 hover:text-primary transition-colors text-main">LAST 30 DAYS</button>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorShip" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00f2fe" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00f2fe" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgb(130,145,175)', fontSize: 11, fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgb(130,145,175)', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(0,242,254,0.2)', strokeWidth: 1 }} />
                <Area type="monotone" dataKey="shipments" stroke="#00f2fe" strokeWidth={2.5} fillOpacity={1} fill="url(#colorShip)" dot={false} activeDot={{ r: 5, fill: '#00f2fe', stroke: 'rgba(0,242,254,0.3)', strokeWidth: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Courier Split */}
        <div className="glass-card p-6">
          <h3 className="text-base font-bold mb-1 text-main">Courier Split</h3>
          <p className="text-xs text-muted mb-5">Today's allocation</p>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={78}
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgb(16, 20, 45)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2.5 mt-4">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between group cursor-pointer p-1.5 rounded-lg hover:bg-surface-hover transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-medium text-muted group-hover:text-main transition-colors">{item.name}</span>
                </div>
                <span className="text-xs font-bold text-main">{Math.round(item.value / 10)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Getting Started */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="w-4 h-4 text-primary" />
            <h3 className="text-base font-bold text-main">Getting Started</h3>
          </div>
          <div className="space-y-5">
            {[
              { complete: true, title: 'Integrate Channel', sub: 'Shopify connected successfully', path: '/integrations' },
              { complete: true, title: 'KYC Verification', sub: 'Approved on 12 Mar 2024', path: '/settings' },
              { complete: false, title: 'Recharge Wallet', sub: 'Maintain ₹5,000 for smooth ops', path: '/wallet' },
            ].map(({ complete, title, sub, path }) => (
              <div
                key={title}
                className="flex items-start gap-4 cursor-pointer group"
                onClick={() => navigate(path)}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110 ${
                  complete ? 'bg-success/15 text-success' : 'bg-primary/15 text-primary animate-pulse'
                }`}>
                  {complete ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-main group-hover:text-primary transition-colors">{title}</p>
                  <p className="text-xs text-muted mt-0.5 leading-relaxed">{sub}</p>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-muted opacity-0 group-hover:opacity-100 transition-all mt-0.5 flex-shrink-0 group-hover:text-primary" />
              </div>
            ))}
          </div>
        </div>

        {/* Courier Performance Table */}
        <div className="xl:col-span-2 glass-card overflow-hidden">
          <div className="px-6 py-5 border-b border-main flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-main">Courier Performance</h3>
              <p className="text-xs text-muted mt-0.5">Live stats for today</p>
            </div>
            <button
              onClick={() => navigate('/logistics')}
              className="text-[10px] font-bold text-primary hover:text-primary-dark transition-colors flex items-center gap-1"
            >
              View All <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left data-table">
              <thead>
                <tr>
                  <th className="px-6">Courier</th>
                  <th className="px-4 text-center">Booked</th>
                  <th className="px-4 text-center">In Transit</th>
                  <th className="px-4 text-center">Delivered</th>
                  <th className="px-4 text-center">RTO</th>
                  <th className="px-6 text-right">Success Rate</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {couriersTable.map((row, i) => (
                  <tr
                    key={i}
                    className="cursor-pointer hover:bg-primary/4 transition-colors group"
                    onClick={() => navigate('/logistics')}
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-surface-light rounded-xl flex items-center justify-center text-[10px] font-bold text-primary group-hover:shadow-neon-sm transition-shadow">
                          {row.name[0]}
                        </div>
                        <span className="font-semibold text-main text-xs">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center font-medium text-main">{row.booked}</td>
                    <td className="px-4 py-3.5 text-center font-bold text-primary">{row.inTransit}</td>
                    <td className="px-4 py-3.5 text-center font-bold text-success">{row.delivered}</td>
                    <td className="px-4 py-3.5 text-center font-bold text-error">{row.rto}</td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <div className="w-20 h-1.5 bg-surface-light rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-primary to-success rounded-full" style={{ width: row.rate }} />
                        </div>
                        <span className="font-bold text-main text-[11px]">{row.rate}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
