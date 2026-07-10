import React from 'react';
import { 
  AlertCircle, 
  Phone, 
  RotateCcw, 
  CheckCircle2, 
  MessageSquare, 
  MoreVertical,
  Filter,
  Download
} from 'lucide-react';

const ndrData = [
  { id: '1442155265', order: 'ORD-8801', courier: 'Delhivery', reason: 'Customer Not Available', attempt: 1, status: 'Action Pending', date: '21 Apr, 10:00 AM' },
  { id: 'BD992811', order: 'ORD-8799', courier: 'BlueDart', reason: 'Incorrect Address', attempt: 2, status: 'Re-attempt Requested', date: '20 Apr, 04:30 PM' },
  { id: 'XP993322', order: 'ORD-8795', courier: 'XpressBees', reason: 'Phone Not Reachable', attempt: 1, status: 'Action Taken', date: '20 Apr, 11:15 AM' },
  { id: 'EE884411', order: 'ORD-8790', courier: 'Ecom Express', reason: 'Refused by Customer', attempt: 1, status: 'RTO Initiated', date: '19 Apr, 02:00 PM' },
];

const NDR = () => {
  const [activeTab, setActiveTab] = React.useState('ALL NDR');
  const tabs = ['ALL NDR', 'PENDING ACTION', 'ACTION TAKEN'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3 text-main">
            <AlertCircle className="text-error w-8 h-8" /> 
            NDR Management (Non-Delivery)
          </h2>
          <p className="text-muted text-sm mt-1">Take actions on failed delivery attempts to reduce RTO %.</p>
        </div>
        <div className="flex gap-3">
           <button className="neon-button-outline !py-2 text-xs flex items-center gap-2" onClick={() => alert('Exporting NDR data...')}>
             <Download className="w-4 h-4" /> EXPORT NDR
           </button>
        </div>
      </div>

      {/* NDR Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total NDR Today', value: '124', color: 'text-main' },
          { label: 'Action Pending', value: '45', color: 'text-error animate-pulse' },
          { label: 'Action Taken', value: '68', color: 'text-primary' },
          { label: 'Delivered post NDR', value: '11', color: 'text-success' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 border-l-2 border-l-surface hover:border-l-primary transition-all">
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">{stat.label}</p>
            <h3 className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* NDR List */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 flex flex-col md:flex-row justify-between gap-4">
          <div className="flex gap-2">
            {tabs.map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab 
                    ? 'bg-primary/20 text-primary' 
                    : 'text-muted hover:bg-main/5 hover:text-main'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button className="p-2 bg-surface-light rounded-xl text-muted hover:text-primary" onClick={() => alert('Opening NDR filters...')}><Filter className="w-4 h-4" /></button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left data-table">
            <thead>
              <tr className="text-[10px] text-muted uppercase tracking-widest">
                <th className="px-6 py-4 font-bold text-muted">AWB / Order ID</th>
                <th className="px-6 py-4 font-bold text-muted">NDR Reason</th>
                <th className="px-6 py-4 font-bold text-muted">Attempt</th>
                <th className="px-6 py-4 font-bold text-muted">Status</th>
                <th className="px-6 py-4 font-bold text-muted">Date</th>
                <th className="px-6 py-4 font-bold text-muted text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {ndrData.map((item) => (
                <tr key={item.id} className="hover:bg-primary/4 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-main group-hover:text-primary transition-colors">{item.id}</div>
                    <div className="text-[10px] text-primary">{item.order} • {item.courier}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-main">{item.reason}</div>
                    <div className="text-[10px] text-muted italic">Courier remark available</div>
                  </td>
                  <td className="px-6 py-4 font-bold text-main">{item.attempt}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase ${
                      item.status === 'Action Pending' ? 'bg-error/10 text-error' : 
                      item.status === 'Action Taken' ? 'bg-primary/10 text-primary' :
                      'bg-main/5 text-muted'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted">{item.date}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 text-primary rounded-lg text-[10px] font-bold hover:bg-primary hover:text-background transition-all" onClick={() => alert(`Requesting re-attempt for AWB ${item.id}`)}>
                        <RotateCcw className="w-3 h-3" /> RE-ATTEMPT
                      </button>
                      <button className="p-1.5 bg-surface-light rounded-lg text-muted hover:text-primary transition-colors" onClick={() => alert(`Opening chat with courier support for AWB ${item.id}`)}>
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 bg-surface-light rounded-lg text-muted hover:text-primary transition-colors" onClick={() => alert('Showing more options...')}>
                         <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add-on Banner for NDR */}
      <div className="glass-card p-6 bg-gradient-to-r from-secondary/10 via-background to-primary/10 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-secondary/20 rounded-2xl flex items-center justify-center text-secondary shadow-neon-purple">
            <Phone className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-lg font-bold">Automate NDR with <span className="text-secondary">Smart WhatsApp Bots</span></h4>
            <p className="text-muted text-sm mt-1">Reduce RTO and improve delivery by 15% with automated buyer confirmation calls.</p>
          </div>
        </div>
        <button className="neon-button-primary !bg-secondary text-white hover:shadow-neon-purple">ACTIVATE NOW</button>
      </div>
    </div>
  );
};

export default NDR;
