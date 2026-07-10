import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Truck, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Star,
  Activity,
  Package,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

const serviceabilitySchema = z.object({
  pickupPincode:   z.string().length(6, 'Must be 6 digits'),
  deliveryPincode: z.string().length(6, 'Must be 6 digits'),
  weight:          z.string().refine(v => !isNaN(parseFloat(v)) && parseFloat(v) > 0, { message: 'Enter a positive number' }),
});

const couriers = [
  { name: 'Delhivery',    type: 'Surface / Air', rating: 4.8, status: 'Active',      weightMax: '20 kg', reach: '29,000+ Pincodes', speed: '2–4 Days',  color: '#00f2fe' },
  { name: 'BlueDart',     type: 'Premium Air',   rating: 4.9, status: 'Active',      weightMax: '10 kg', reach: '18,000+ Pincodes', speed: '1–2 Days',  color: '#7000ff' },
  { name: 'XpressBees',   type: 'Surface',       rating: 4.2, status: 'Active',      weightMax: '30 kg', reach: '25,000+ Pincodes', speed: '3–5 Days',  color: '#ff007a' },
  { name: 'Ecom Express', type: 'Surface',       rating: 4.0, status: 'Maintenance', weightMax: '25 kg', reach: '27,000+ Pincodes', speed: '3–6 Days',  color: '#00ffa3' },
];

const feats = [
  { title: 'Smart Courier Selection', desc: 'Auto-assign the best courier based on price, zone, and performance history.', icon: Zap,        color: 'primary' },
  { title: 'Transit Insurance',       desc: 'Coverage up to ₹10,000 on every high-value package automatically.', icon: ShieldCheck, color: 'secondary' },
  { title: 'Real-time Webhooks',      desc: 'Instant push notifications on delivery attempts, delays, and RTO events.', icon: Activity,   color: 'success' },
];

const StarRating = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1,2,3,4,5].map(i => (
      <Star key={i} className={`w-3 h-3 ${i <= Math.round(rating) ? 'text-warning fill-warning' : 'text-muted/30'}`} />
    ))}
    <span className="text-[10px] font-bold text-muted ml-1">{rating}</span>
  </div>
);

const Logistics = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState(null);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(serviceabilitySchema),
  });

  const onSubmit = () => {
    setIsChecking(true);
    setResult(null);
    setTimeout(() => {
      setIsChecking(false);
      setResult({ available: true, couriers: ['Delhivery', 'BlueDart', 'XpressBees'], estDays: '2–3 Days' });
    }, 1500);
  };

  return (
    <div className="space-y-7 animate-fade-up">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Truck className="w-4 h-4 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Network</span>
        </div>
        <h2 className="text-2xl font-bold text-main">Courier Serviceability</h2>
        <p className="text-muted text-sm mt-0.5">Manage courier partners and check real-time delivery availability by pincode.</p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Serviceability Checker */}
        <div className="glass-card p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="p-2 bg-primary/10 rounded-xl text-primary">
                <Zap className="w-4 h-4 fill-primary" />
              </div>
              <h3 className="font-bold text-main text-sm">Check Serviceability</h3>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Pickup PIN</label>
                  <input
                    {...register('pickupPincode')}
                    type="text"
                    placeholder="560001"
                    maxLength={6}
                    className={`input-field !py-2.5 text-sm ${errors.pickupPincode ? '!border-error/50' : ''}`}
                    id="logistics-pickup-pin"
                  />
                  {errors.pickupPincode && <p className="text-[9px] text-error font-bold ml-1">{errors.pickupPincode.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Delivery PIN</label>
                  <input
                    {...register('deliveryPincode')}
                    type="text"
                    placeholder="122002"
                    maxLength={6}
                    className={`input-field !py-2.5 text-sm ${errors.deliveryPincode ? '!border-error/50' : ''}`}
                    id="logistics-delivery-pin"
                  />
                  {errors.deliveryPincode && <p className="text-[9px] text-error font-bold ml-1">{errors.deliveryPincode.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Weight (kg)</label>
                <input
                  {...register('weight')}
                  type="text"
                  placeholder="0.5"
                  className={`input-field !py-2.5 text-sm ${errors.weight ? '!border-error/50' : ''}`}
                  id="logistics-weight"
                />
                {errors.weight && <p className="text-[9px] text-error font-bold ml-1">{errors.weight.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isChecking}
                className="w-full neon-button-primary !py-3 flex items-center justify-center gap-2 text-xs mt-1 disabled:opacity-60"
                id="logistics-check-btn"
              >
                {isChecking ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Checking...</>
                ) : (
                  <>Check Availability <ArrowRight className="w-3.5 h-3.5" /></>
                )}
              </button>
            </form>

            {/* Result */}
            {result && (
              <div className="mt-4 p-4 bg-success/8 rounded-2xl animate-fade-up">
                <div className="flex items-center gap-2 text-success font-bold text-xs mb-3">
                  <CheckCircle2 className="w-4 h-4" /> Serviceable Area
                </div>
                <p className="text-[10px] text-muted mb-2">Available via:</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {result.couriers.map(c => (
                    <span key={c} className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold">{c}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] text-muted font-bold uppercase">Est. Delivery</span>
                  <span className="text-xs font-bold text-primary">{result.estDays}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Courier Partners Grid */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-main text-sm">Integrated Courier Partners</h3>
              <p className="text-[10px] text-muted mt-0.5">4 of 12 active partners shown</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-success/8 text-success rounded-full text-[10px] font-bold">
              <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
              System Stable
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {couriers.map((courier, i) => (
              <button
                key={i}
                className="p-4 bg-surface-light rounded-2xl flex items-center justify-between group hover:bg-surface-hover transition-all duration-200 active:scale-[0.98] text-left w-full"
                onClick={() => alert(`Opening ${courier.name} performance details`)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xs group-hover:shadow-neon-sm transition-shadow bg-surface"
                    style={{ color: courier.color }}
                  >
                    {courier.name[0]}
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-sm text-main">{courier.name}</h4>
                    <p className="text-[10px] text-muted uppercase font-bold tracking-wider mt-0.5">{courier.reach}</p>
                    <StarRating rating={courier.rating} />
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <span className={`text-[9px] font-bold uppercase tracking-widest block mb-1 ${
                    courier.status === 'Active' ? 'text-success' : 'text-warning'
                  }`}>
                    {courier.status === 'Active' ? '● Active' : '⚠ Maintenance'}
                  </span>
                  <span className="text-[10px] text-muted font-medium">{courier.speed}</span>
                  <p className="text-[10px] text-muted mt-0.5">{courier.weightMax}</p>
                </div>
              </button>
            ))}
          </div>

          <button
            className="mt-5 text-xs text-primary font-bold flex items-center gap-2 hover:gap-3 hover:text-primary-dark transition-all duration-200"
            onClick={() => alert('Navigating to full courier partners list...')}
          >
            Manage All 12 Courier Partners <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {feats.map(({ title, desc, icon: Icon, color }) => (
          <button
            key={title}
            className="glass-card glass-card-hover p-5 flex items-start gap-4 group text-left w-full"
            onClick={() => alert(`Opening details for: ${title}`)}
          >
            <div className={`p-3 rounded-xl transition-all duration-200 flex-shrink-0 ${
              color === 'primary'   ? 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-background' :
              color === 'secondary' ? 'bg-secondary/10 text-secondary group-hover:bg-secondary group-hover:text-white' :
                                     'bg-success/10 text-success group-hover:bg-success group-hover:text-background'
            }`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-main group-hover:text-primary transition-colors mb-1">{title}</h4>
              <p className="text-xs text-muted leading-relaxed">{desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Logistics;
