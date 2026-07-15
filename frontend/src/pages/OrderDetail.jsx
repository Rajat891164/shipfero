import React, { useEffect, useState } from 'react';
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
import { OrderService } from '../services/api';

const STATUS_FLOW = ['NEW', 'PROCESSING', 'READY_TO_SHIP', 'BOOKED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];
const STATUS_LABEL = { NEW: 'Ordered', PROCESSING: 'Processing', READY_TO_SHIP: 'Ready to Ship', BOOKED: 'Booked', IN_TRANSIT: 'Shipped', OUT_FOR_DELIVERY: 'Out for Delivery', DELIVERED: 'Delivered' };

const formatDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

const money = (v) => `₹${Number(v || 0).toFixed(2)}`;

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    OrderService.detail(id)
      .then(({ data }) => setOrder(data))
      .catch(() => setError('Order not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="p-12 text-center text-muted text-sm">Loading order...</div>;
  }

  if (error || !order) {
    return (
      <div className="p-12 text-center space-y-3">
        <Package className="w-10 h-10 text-muted/30 mx-auto" />
        <p className="text-sm font-bold text-muted">{error || 'Order not found.'}</p>
        <button onClick={() => navigate('/orders')} className="neon-button-outline !py-2 text-xs">Back to Orders</button>
      </div>
    );
  }

  const flowSteps = order.status === 'CANCELLED' || order.status === 'ON_HOLD'
    ? STATUS_FLOW.slice(0, 1).concat(order.status)
    : STATUS_FLOW;
  const currentIdx = Math.max(flowSteps.indexOf(order.status), 0);

  const subtotal = (order.items || []).reduce((sum, it) => sum + Number(it.total_price || 0), 0);
  const displayAwb = order.awb_number || order.tracking_id;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/orders')}
            className="p-2 bg-surface-light rounded-xl border border-main hover:text-primary transition-colors text-main"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-main">Order {order.order_number}</h2>
            <p className="text-muted text-xs font-medium">
              Placed on {formatDateTime(order.created_at)}{order.channel_source ? ` via ${order.channel_source}` : ''}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {displayAwb && (
            <button className="neon-button-outline !py-2 text-xs flex items-center gap-2" onClick={() => alert('Downloading Shipment Label...')}>
              <Download className="w-4 h-4" /> DOWNLOAD LABEL
            </button>
          )}
          {displayAwb && (
            <button className="neon-button-primary !py-2 text-xs flex items-center gap-2" onClick={() => navigate('/track')}>
              <Truck className="w-4 h-4" /> TRACK SHIPMENT
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Items & Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Tracker */}
          <div className="glass-card p-8">
            <div className="flex justify-between items-center mb-10">
              {flowSteps.map((s, i) => (
                <div key={s} className="flex flex-col items-center relative flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 border ${
                    i <= currentIdx ? 'bg-primary border-primary text-background' : 'bg-surface-light text-muted border-main'
                  }`}>
                    {i < currentIdx ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-[10px] font-bold">{i + 1}</span>}
                  </div>
                  <span className={`text-[10px] font-bold mt-3 uppercase tracking-widest text-center ${i <= currentIdx ? 'text-primary' : 'text-muted'}`}>
                    {STATUS_LABEL[s] || s.replace(/_/g, ' ')}
                  </span>
                  {i < flowSteps.length - 1 && (
                    <div className={`absolute left-[50%] top-4 w-full h-[2px] ${i < currentIdx ? 'bg-primary' : 'bg-main opacity-10'}`} />
                  )}
                </div>
              ))}
            </div>

            {order.is_flagged && order.flag_reason && (
              <div className="bg-error/10 border border-error/20 p-4 rounded-xl flex items-center gap-3">
                <Clock className="text-error w-5 h-5" />
                <div>
                  <p className="text-xs font-bold text-error">Flagged</p>
                  <p className="text-[10px] text-muted">{order.flag_reason}</p>
                </div>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-main flex items-center gap-2">
              <Package className="w-5 h-5 text-muted" />
              <h3 className="font-bold text-main">Shipment Items ({(order.items || []).length})</h3>
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
                {(order.items || []).map((item) => (
                  <tr key={item.id} className="border-b border-main last:border-0 hover:bg-main/5 duration-200">
                    <td className="px-6 py-4 flex items-center gap-4">
                      <div className="w-12 h-12 bg-surface-light rounded-lg border border-main flex items-center justify-center">
                        <Package className="w-6 h-6 text-muted border-main" />
                      </div>
                      <div>
                        <p className="font-bold text-main">{item.product_name}</p>
                        {item.hsn_code && <p className="text-[10px] text-muted">HSN: {item.hsn_code}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-muted">{item.sku || '—'}</td>
                    <td className="px-6 py-4 text-center text-main">{item.quantity}</td>
                    <td className="px-6 py-4 text-right font-bold text-main">{money(item.total_price)}</td>
                  </tr>
                ))}
                {(order.items || []).length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-muted text-xs">No items on this order.</td></tr>
                )}
              </tbody>
            </table>
            <div className="p-6 bg-surface-light border-t border-main flex flex-col items-end gap-2">
              <div className="flex justify-between w-48 text-muted">
                <span className="text-[10px] font-bold uppercase">Subtotal</span>
                <span className="font-bold text-main">{money(subtotal)}</span>
              </div>
              <div className="flex justify-between w-48 text-muted">
                <span className="text-[10px] font-bold uppercase">Shipping</span>
                <span className="font-bold text-main">{money(order.shipping_charge_merchant)}</span>
              </div>
              {Number(order.discount_amount) > 0 && (
                <div className="flex justify-between w-48 text-muted">
                  <span className="text-[10px] font-bold uppercase">Discount</span>
                  <span className="font-bold text-main">-{money(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between w-48 text-main pt-2 border-t border-main">
                <span className="text-xs font-bold uppercase text-main">Total Amount</span>
                <span className="text-lg font-bold text-primary">{money(order.order_amount)}</span>
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
                <p className="text-sm font-bold text-main">{order.customer_name}</p>
                {order.customer_email && <p className="text-xs text-muted">{order.customer_email}</p>}
                <p className="text-xs text-muted">{order.customer_phone}</p>
              </div>
              <div className="pt-4 border-t border-main">
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted uppercase mb-2">
                  <MapPin className="w-3 h-3" /> SHIPPING ADDRESS
                </div>
                <p className="text-xs leading-relaxed text-muted">
                  {order.shipping_address1}{order.shipping_address2 ? `, ${order.shipping_address2}` : ''}<br />
                  {order.shipping_city}, {order.shipping_state} - {order.shipping_pincode}<br />
                  {order.shipping_country}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h4 className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-success" /> PAYMENT & PICKUP
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-muted uppercase">Method</span>
                <span className={`text-xs font-bold uppercase ${order.payment_type === 'COD' ? 'text-warning' : 'text-success'}`}>
                  {order.payment_type}{order.payment_type === 'COD' ? ` · ${money(order.cod_amount)}` : ''}
                </span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-main">
                <span className="text-[10px] font-bold text-muted uppercase">Courier</span>
                <span className="text-xs font-bold text-main">{order.carrier_name || '—'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-muted uppercase">AWB</span>
                {displayAwb ? (
                  <span className="text-xs font-bold text-primary flex items-center gap-1 cursor-pointer hover:underline" onClick={() => navigate('/track')}>
                    {displayAwb} <ExternalLink className="w-3 h-3" />
                  </span>
                ) : (
                  <span className="text-xs font-bold text-muted">Not booked</span>
                )}
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-main">
                <span className="text-[10px] font-bold text-muted uppercase">Status</span>
                <span className="text-xs font-bold text-main">{(order.shipment_status || order.status || '').replace(/_/g, ' ')}</span>
              </div>
            </div>
          </div>

          {(order.status_history || []).length > 0 && (
            <div className="glass-card p-6">
              <h4 className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mb-6">STATUS HISTORY</h4>
              <div className="space-y-3">
                {order.status_history.map((h) => (
                  <div key={h.id} className="text-xs">
                    <p className="font-bold text-main">{(h.to_status || '').replace(/_/g, ' ')}</p>
                    <p className="text-[10px] text-muted">{formatDateTime(h.created_at)}{h.note ? ` · ${h.note}` : ''}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
