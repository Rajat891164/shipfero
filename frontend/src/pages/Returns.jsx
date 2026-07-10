import React from 'react';
import { 
  RotateCcw, 
  Package, 
  ArrowLeftRight, 
  CheckCircle2, 
  Clock,
  Search,
  Filter
} from 'lucide-react';

const returnsData = [
  { id: 'RET-3312', originalOrder: 'ORD-7718', customer: 'Sneider John', type: 'RTO (Refused)', status: 'In Transit to Origin', courier: 'Ecom Express', date: '21 Apr' },
  { id: 'RET-3311', originalOrder: 'ORD-7650', customer: 'Anita Mehra', type: 'Customer Return', status: 'Pickup Pending', courier: 'Delhivery Reverse', date: '20 Apr' },
  { id: 'RET-3310', originalOrder: 'ORD-7590', customer: 'Karan Johar', type: 'Exchange', status: 'Delivered to Warehouse', courier: 'BlueDart', date: '19 Apr' },
];

const Returns = () => {
  const [activeTab, setActiveTab] = React.useState('All Returns');
  const tabs = ['All Returns', 'Pickup Pending', 'In Transit', 'Received', 'RTO Orders'];

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
        {tabs.map((tab) => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab 
                ? 'bg-secondary text-white shadow-neon-purple' 
                : 'text-muted hover:bg-main/5 hover:text-main'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
           <input 
              type="text" 
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
                {returnsData.map((item) => (
                  <tr key={item.id} className="hover:bg-primary/4 transition-colors group">
                    <td className="px-6 py-4">
                       <div className="font-bold text-secondary group-hover:shadow-neon-purple-sm transition-all">{item.id}</div>
                       <div className="text-[10px] text-muted font-medium">Original: {item.originalOrder}</div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="font-medium text-main">{item.customer}</div>
                       <div className="text-[10px] text-muted">{item.date}</div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2 text-primary font-bold">
                          {item.type.includes('Exchange') ? <ArrowLeftRight className="w-3 h-3" /> : <Package className="w-3 h-3" />}
                          {item.type}
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="px-2.5 py-1 rounded-full bg-main/5 text-[10px] font-bold text-muted">
                          {item.status}
                       </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-main">{item.courier}</td>
                    <td className="px-6 py-4 text-right">
                       <button className="p-2 bg-surface-light rounded-lg text-muted hover:text-secondary transition-all" onClick={() => alert(`Viewing tracking detail for return ${item.id}`)}>
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
