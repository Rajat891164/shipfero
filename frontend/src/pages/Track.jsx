import React, { useState } from 'react';
import { 
  Search, 
  Truck, 
  Package, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Info,
  Calendar,
  Phone,
  Copy,
  RefreshCw
} from 'lucide-react';

const timeline = [
  { status: 'Delivered',           location: 'Gurgaon Sec-45',              date: '21 Apr, 02:30 PM', completed: true, current: true,  remark: 'Delivered at Gate' },
  { status: 'Out for Delivery',    location: 'Gurgaon Hub',                 date: '21 Apr, 09:15 AM', completed: true, current: false },
  { status: 'Reached Hub',         location: 'Gurgaon North Hub',           date: '20 Apr, 11:45 PM', completed: true, current: false },
  { status: 'In Transit',          location: 'New Delhi Transit Point',      date: '20 Apr, 04:20 PM', completed: true, current: false },
  { status: 'Picked Up',           location: 'Merchant Warehouse, Bengaluru', date: '19 Apr, 10:00 AM', completed: true, current: false },
  { status: 'Order Manifested',    location: 'Bengaluru',                   date: '18 Apr, 08:30 PM', completed: true, current: false },
];

const TrackingEvent = ({ event, isLast }) => (
  <div className="flex gap-4 relative group">
    {/* Vertical line */}
    {!isLast && (
      <div className="absolute left-[15px] top-8 w-0.5 h-[calc(100%-20px)] bg-gradient-to-b from-primary/30 to-transparent" />
    )}

    {/* Node icon */}
    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 flex-shrink-0 border transition-all duration-300 ${
      event.current 
        ? 'bg-primary border-primary shadow-neon-sm text-background' 
        : event.completed 
          ? 'bg-success/15 border-success/30 text-success' 
          : 'bg-surface-light border-main text-muted'
    }`}>
      {event.current 
        ? <Truck className="w-4 h-4" />
        : event.completed 
          ? <CheckCircle2 className="w-4 h-4" /> 
          : <Clock className="w-4 h-4" />
      }
    </div>

    {/* Content */}
    <div className="pb-7 flex-1 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className={`text-sm font-bold transition-colors ${
            event.current ? 'text-primary' : event.completed ? 'text-main' : 'text-muted'
          }`}>
            {event.status}
          </h4>
          <p className="text-xs text-muted mt-0.5">{event.location} · {event.date}</p>
        </div>
        {event.current && (
          <span className="flex-shrink-0 px-2 py-0.5 text-[9px] font-bold bg-primary/15 text-primary border border-primary/25 rounded-full uppercase tracking-wider animate-pulse">
            Current
          </span>
        )}
      </div>
      {event.remark && (
        <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] bg-surface-light px-3 py-1.5 rounded-lg text-muted italic">
          <Info className="w-3 h-3 flex-shrink-0" />
          {event.remark}
        </div>
      )}
    </div>
  </div>
);

const Track = () => {
  const [awb, setAwb] = useState('1442155261');
  const [hasSearched, setHasSearched] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTrack = () => {
    if (!awb.trim()) return;
    setIsTracking(true);
    setTimeout(() => {
      setIsTracking(false);
      setHasSearched(true);
    }, 1200);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(awb);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-7 animate-fade-up">
      {/* Search Panel */}
      <div className="glass-card p-8 sm:p-10 flex flex-col items-center text-center space-y-6">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-neon-sm transition-transform hover:scale-110 hover:rotate-6 cursor-default">
          <Truck className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-main">Track Your Shipment</h2>
          <p className="text-muted text-sm mt-1.5 max-w-md">Enter your AWB number or Order ID to get real-time delivery updates across all courier partners.</p>
        </div>

        {/* Search input + button */}
        <div className="w-full max-w-xl">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
            <div className="relative flex rounded-2xl overflow-hidden">
              <input
                type="text"
                value={awb}
                onChange={(e) => setAwb(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                placeholder="Enter AWB / Order ID e.g. 1442155261"
                className="flex-1 bg-surface border-0 border-r border-main/20 px-5 py-4 focus:outline-none text-sm text-main placeholder:text-muted"
                id="track-awb-input"
              />
              <button
                onClick={handleTrack}
                disabled={isTracking}
                className="bg-primary text-background font-bold px-7 hover:bg-primary-dark transition-colors flex items-center gap-2 text-sm disabled:opacity-70"
                id="track-submit"
              >
                {isTracking ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>TRACK <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4 text-[10px] text-muted">
          <button
            className="flex items-center gap-1.5 hover:text-primary transition-colors font-medium"
            onClick={() => alert('Opening Bulk Tracking via CSV...')}
          >
            <Info className="w-3 h-3" /> Bulk tracking via CSV
          </button>
          <span className="opacity-20">|</span>
          <button
            className="flex items-center gap-1.5 hover:text-primary transition-colors font-medium"
            onClick={() => alert('Opening search history...')}
          >
            <Search className="w-3 h-3" /> View search history
          </button>
        </div>
      </div>

      {/* Tracking Result */}
      {hasSearched && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-up">
          {/* Timeline */}
          <div className="lg:col-span-2">
            <div className="glass-card overflow-hidden">
              {/* Header */}
              <div className="p-6 bg-gradient-to-r from-primary/5 to-transparent flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-surface-light rounded-xl">
                    <Package className="text-primary w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-main flex items-center gap-2">
                      AWB: {awb}
                      <button
                        onClick={handleCopy}
                        className="text-muted hover:text-primary transition-colors"
                        title="Copy AWB"
                      >
                        {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </h3>
                    <p className="text-xs text-muted font-medium mt-0.5">ORD-7721 · Domestic Express · PREPAID</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[9px] text-muted font-bold uppercase tracking-widest mb-1">Courier Partner</p>
                  <div className="flex items-center gap-2 justify-end">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    <span className="font-bold text-main text-sm">Delhivery</span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="p-6">
                {timeline.map((event, i) => (
                  <TrackingEvent key={i} event={event} isLast={i === timeline.length - 1} />
                ))}
              </div>
            </div>
          </div>

          {/* Side info */}
          <div className="space-y-5">
            {/* Delivery Info */}
            <div className="glass-card p-5">
              <h4 className="text-xs font-bold mb-4 flex items-center gap-2 text-main uppercase tracking-wider">
                <MapPin className="w-4 h-4 text-primary" /> Delivery Info
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] text-muted font-bold uppercase tracking-widest block mb-1">Consignee</label>
                  <p className="text-sm font-bold text-main">Rahul Sharma</p>
                  <p className="text-xs text-muted leading-relaxed mt-0.5">
                    House No 45, DLF Phase 1,<br />Gurgaon, Haryana – 122002
                  </p>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    className="flex-1 py-2 bg-surface-light rounded-xl text-[10px] font-bold text-main hover:bg-primary/5 hover:text-primary transition-all flex items-center justify-center gap-1.5"
                    onClick={() => alert('Connecting to courier support...')}
                  >
                    <Phone className="w-3 h-3" /> CALL HELP
                  </button>
                  <button
                    className="flex-1 py-2 bg-surface-light rounded-xl text-[10px] font-bold text-main hover:bg-primary/5 hover:text-primary transition-all flex items-center justify-center gap-1.5"
                    onClick={() => alert('Opening delivery scheduler...')}
                  >
                    <Calendar className="w-3 h-3" /> SCHEDULE
                  </button>
                </div>
              </div>
            </div>

            {/* Shipment Summary */}
            <div className="glass-card p-5 bg-gradient-to-br from-primary/5 to-transparent">
              <h4 className="text-xs font-bold uppercase tracking-widest text-main mb-4">Shipment Summary</h4>
              <div className="space-y-3">
                {[
                  { label: 'Weight',   value: '1.50 KG',      cls: 'text-main' },
                  { label: 'Payment',  value: 'PREPAID',       cls: 'text-warning font-bold' },
                  { label: 'Origin',   value: 'BENGALURU',     cls: 'text-main' },
                ].map(({ label, value, cls }) => (
                  <div key={label} className="flex justify-between items-center text-xs py-1">
                    <span className="text-[9px] text-muted font-bold uppercase tracking-widest">{label}</span>
                    <span className={`font-bold ${cls}`}>{value}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center text-xs pt-3">
                  <span className="text-[9px] text-muted font-bold uppercase tracking-widest">Est. Delivery</span>
                  <span className="font-bold text-success text-xs underline underline-offset-4 decoration-success/30">
                    22 APR 2026
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Track;
