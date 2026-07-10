import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Package, 
  Truck, 
  User, 
  MapPin, 
  CreditCard, 
  Download, 
  ExternalLink,
  Clock,
  CheckCircle2
} from 'lucide-react';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/orders')}
            className="p-2 bg-surface-light rounded-xl border border-main hover:text-primary transition-colors text-main"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-main">Order {id}</h2>
            <p className="text-muted text-xs font-medium">Placed on 21 Apr 2026, 10:45 AM via Shopify</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="neon-button-outline !py-2 text-xs flex items-center gap-2" onClick={() => alert('Downloading Shipment Label...')}>
            <Download className="w-4 h-4" /> DOWNLOAD LABEL
          </button>
          <button className="neon-button-primary !py-2 text-xs flex items-center gap-2" onClick={() => navigate('/track')}>
            <Truck className="w-4 h-4" /> TRACK SHIPMENT
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Items & Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Tracker */}
          <div className="glass-card p-8">
             <div className="flex justify-between items-center mb-10">
                {['Ordered', 'Booked', 'Shipped', 'Out for Delivery', 'Delivered'].map((step, i) => (
                  <div key={i} className="flex flex-col items-center relative flex-1">
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 border ${
                       i <= 1 ? 'bg-primary border-primary text-background' : 'bg-surface-light text-muted border-main'
                     }`}>
                        {i < 1 ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-[10px] font-bold">{i+1}</span>}
                     </div>
                     <span className={`text-[10px] font-bold mt-3 uppercase tracking-widest ${i <= 1 ? 'text-primary' : 'text-muted'}`}>{step}</span>
                     {i < 4 && (
                       <div className={`absolute left-[50%] top-4 w-full h-[2px] ${i < 1 ? 'bg-primary' : 'bg-main opacity-10'}`} />
                     )}
                  </div>
                ))}
             </div>
             
             <div className="bg-surface-light border border-main p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <Clock className="text-warning w-5 h-5" />
                   <div>
                      <p className="text-xs font-bold text-main">Pickup Scheduled</p>
                      <p className="text-[10px] text-muted">Courier executive will arrive between 2:00 PM - 5:00 PM today.</p>
                   </div>
                </div>
                <button className="text-[10px] text-primary font-bold hover:underline" onClick={() => alert('Opening Reschedule Modal')}>RESCHEDULE</button>
             </div>
          </div>

          {/* Items Table */}
          <div className="glass-card overflow-hidden">
             <div className="p-6 border-b border-main flex items-center gap-2">
                <Package className="w-5 h-5 text-muted" />
                <h3 className="font-bold text-main">Shipment Items (2)</h3>
             </div>
             <table className="w-full text-left">
                <thead className="bg-surface-light border-b border-main">
                   <tr className="text-[10px] text-muted uppercase tracking-widest">
                      <th className="px-6 py-4">Product Details</th>
                      <th className="px-6 py-4 text-center">SKU</th>
                      <th className="px-6 py-4 text-center">Qty</th>
                      <th className="px-6 py-4 text-right">Price</th>
                   </tr>
                </thead>
                <tbody className="text-xs">
                   <tr className="border-b border-main last:border-0 hover:bg-main/5 duration-200">
                      <td className="px-6 py-4 flex items-center gap-4">
                         <div className="w-12 h-12 bg-surface-light rounded-lg border border-main flex items-center justify-center">
                            <Package className="w-6 h-6 text-muted border-main" />
                         </div>
                         <div>
                            <p className="font-bold text-main">Smart Runner V2 - Black</p>
                            <p className="text-[10px] text-muted">Size: 10 • Color: Matte Black</p>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-center font-mono text-muted">SNK-BLK-V2-10</td>
                      <td className="px-6 py-4 text-center text-main">1</td>
                      <td className="px-6 py-4 text-right font-bold text-main">₹1,999.00</td>
                   </tr>
                   <tr className="border-b border-main last:border-0 hover:bg-main/5 duration-200">
                      <td className="px-6 py-4 flex items-center gap-4">
                         <div className="w-12 h-12 bg-surface-light rounded-lg border border-main flex items-center justify-center">
                            <Package className="w-6 h-6 text-muted border-main" />
                         </div>
                         <div>
                            <p className="font-bold text-main">Premium Cleaning Kit</p>
                            <p className="text-[10px] text-muted">Universal Sole Cleaner</p>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-center font-mono text-muted">ACC-CLN-KIT</td>
                      <td className="px-6 py-4 text-center text-main">1</td>
                      <td className="px-6 py-4 text-right font-bold text-main">₹249.00</td>
                   </tr>
                </tbody>
             </table>
             <div className="p-6 bg-surface-light border-t border-main flex flex-col items-end gap-2">
                <div className="flex justify-between w-48 text-muted">
                   <span className="text-[10px] font-bold uppercase">Subtotal</span>
                   <span className="font-bold text-main">₹2,248.00</span>
                </div>
                <div className="flex justify-between w-48 text-muted">
                   <span className="text-[10px] font-bold uppercase">Shipping</span>
                   <span className="font-bold text-main">₹0.00</span>
                </div>
                <div className="flex justify-between w-48 text-main pt-2 border-t border-main">
                   <span className="text-xs font-bold uppercase text-main">Total Amount</span>
                   <span className="text-lg font-bold text-primary">₹2,248.00</span>
                </div>
             </div>
          </div>
        </div>

        {/* Right Column: Address & Details */}
        <div className="space-y-6">
          <div className="glass-card p-6">
             <h4 className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> CUSTOMER DETAILS
             </h4>
             <div className="space-y-4">
                <div>
                   <p className="text-sm font-bold text-main">Rahul Sharma</p>
                   <p className="text-xs text-muted">rahul.sharma@example.com</p>
                   <p className="text-xs text-muted">+91 98765 43210</p>
                </div>
                <div className="pt-4 border-t border-main">
                   <div className="flex items-center gap-2 text-[10px] font-bold text-muted uppercase mb-2">
                      <MapPin className="w-3 h-3" /> SHIPPING ADDRESS
                   </div>
                   <p className="text-xs leading-relaxed text-muted">
                      House No 45, DLF Phase 1,<br />
                      Gurgaon, Haryana - 122002<br />
                      India
                   </p>
                </div>
                <button className="w-full py-2 bg-surface-light border border-main rounded-lg text-[10px] font-bold hover:text-primary hover:border-primary transition-all text-main" onClick={() => alert('Editing Customer Address...')}>EDIT ADDRESS</button>
             </div>
          </div>

          <div className="glass-card p-6">
             <h4 className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-success" /> PAYMENT & PICKUP
             </h4>
             <div className="space-y-4">
                <div className="flex justify-between items-center">
                   <span className="text-[10px] font-bold text-muted uppercase">Method</span>
                   <span className="text-xs font-bold text-success uppercase">Prepaid</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-main">
                   <span className="text-[10px] font-bold text-muted uppercase">Courier</span>
                   <span className="text-xs font-bold text-main">Delhivery</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-[10px] font-bold text-muted uppercase">AWB</span>
                   <span className="text-xs font-bold text-primary flex items-center gap-1 cursor-pointer hover:underline" onClick={() => navigate('/track')}>1442155261 <ExternalLink className="w-3 h-3" /></span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-main">
                   <span className="text-[10px] font-bold text-muted uppercase">Pickup Hub</span>
                   <span className="text-xs font-bold text-main">BLR_Warehouse_South</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
