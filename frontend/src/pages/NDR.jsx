import React, { useEffect, useState, useCallback } from 'react';
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
import { NdrService, unwrap } from '../services/api';

const REASON_LABELS = {
  'DR-01': 'Customer not available',
  'DR-02': 'Refused delivery',
  'DR-03': 'Wrong / incomplete address',
  'DR-04': 'Consignee out of station',
  'DR-05': 'COD amount not ready',
  'DR-06': 'Shipment damaged',
  'DR-07': 'Fake delivery attempt',
  'DR-08': 'Business / shop closed',
  OTHER: 'Other',
};

const STATUS_STYLES = {
  PENDING: 'bg-error/10 text-error',
  ACTION_TAKEN: 'bg-primary/10 text-primary',
  RE_ATTEMPTING: 'bg-secondary/10 text-secondary',
  DELIVERED: 'bg-success/10 text-success',
  RTO_INITIATED: 'bg-warning/10 text-warning',
  CLOSED: 'bg-main/5 text-muted',
};

const formatDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

const NDR = () => {
  const [activeTab, setActiveTab] = useState('ALL NDR');
  const tabs = ['ALL NDR', 'PENDING ACTION', 'ACTION TAKEN'];
  const [stats, setStats] = useState(null);
  const [ndrData, setNdrData] = useState([]);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    NdrService.dashboard().then(({ data }) => setStats(data)).catch(() => {});
    NdrService.list().then(({ data }) => setNdrData(unwrap(data) || [])).catch(() => setNdrData([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const reAttempt = async (id) => {
    setBusyId(id);
    try {
      await NdrService.takeAction(id, { action_type: 'RE_ATTEMPT', notes: 'Re-attempt requested by merchant' });
      load();
    } catch (err) {
      alert(err.response?.data?.detail || 'Action failed.');
    } finally {
      setBusyId(null);
    }
  };

  const filteredNdr = ndrData.filter((n) => {
    if (activeTab === 'PENDING ACTION') return n.ndr_status === 'PENDING';
    if (activeTab === 'ACTION TAKEN') return n.ndr_status !== 'PENDING';
    return true;
  });

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
          { label: 'Total NDR', value: stats?.total ?? '—', color: 'text-main' },
          { label: 'Action Pending', value: stats?.pending ?? '—', color: 'text-error animate-pulse' },
          { label: 'Action Taken', value: stats?.action_taken ?? '—', color: 'text-primary' },
          { label: 'Delivered post NDR', value: stats?.delivered ?? '—', color: 'text-success' },
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
              {filteredNdr.map((item) => (
                <tr key={item.id} className="hover:bg-primary/4 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-main group-hover:text-primary transition-colors">{item.awb_number || item.tracking_id}</div>
                    <div className="text-[10px] text-primary">{item.consignee_name} • {item.carrier_name || '—'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-main">{REASON_LABELS[item.reason_code] || item.reason_code}</div>
                    {item.courier_raw_reason && (
                      <div className="text-[10px] text-muted italic">{item.courier_raw_reason}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-bold text-main">{item.attempt_number}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase ${STATUS_STYLES[item.ndr_status] || 'bg-main/5 text-muted'}`}>
                      {(item.ndr_status || '').replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted">{formatDateTime(item.ndr_date)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        disabled={busyId === item.id || ['DELIVERED', 'RTO_INITIATED', 'CLOSED'].includes(item.ndr_status)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 text-primary rounded-lg text-[10px] font-bold hover:bg-primary hover:text-background transition-all disabled:opacity-40"
                        onClick={() => reAttempt(item.id)}
                      >
                        <RotateCcw className="w-3 h-3" /> {busyId === item.id ? '…' : 'RE-ATTEMPT'}
                      </button>
                      <button className="p-1.5 bg-surface-light rounded-lg text-muted hover:text-primary transition-colors" onClick={() => alert('Courier support chat coming soon')}>
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredNdr.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <CheckCircle2 className="w-8 h-8 text-success/40 mx-auto mb-3" />
                    <p className="text-sm font-bold text-muted">No NDRs in this view</p>
                  </td>
                </tr>
              )}
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
