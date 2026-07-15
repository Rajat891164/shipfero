import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Truck,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  RefreshCw
} from 'lucide-react';
import { CarrierService, unwrap } from '../services/api';

const serviceabilitySchema = z.object({
  pickupPincode: z.string().length(6, 'Must be 6 digits'),
  deliveryPincode: z.string().length(6, 'Must be 6 digits'),
  weight: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, { message: 'Enter a positive number' }),
});

const feats = [
  { title: 'Smart Courier Selection', desc: 'Auto-assign the best courier based on price, zone, and performance history.', icon: Zap, color: 'primary' },
  { title: 'Transit Insurance', desc: 'Coverage up to ₹10,000 on every high-value package automatically.', icon: ShieldCheck, color: 'secondary' },
  { title: 'Real-time Webhooks', desc: 'Instant push notifications on delivery attempts, delays, and RTO events.', icon: Activity, color: 'success' },
];

const Logistics = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [carriers, setCarriers] = useState([]);
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(serviceabilitySchema),
  });

  useEffect(() => {
    CarrierService.list()
      .then(({ data }) => setCarriers(unwrap(data) || []))
      .catch(() => setCarriers([]))
      .finally(() => setLoading(false));
  }, []);

  const onSubmit = async (formData) => {
    setIsChecking(true);
    setResult(null);
    try {
      const { data } = await CarrierService.serviceability({
        pickup_pincode: formData.pickupPincode,
        delivery_pincode: formData.deliveryPincode,
        weight: formData.weight,
      });
      setResult(data);
    } catch {
      setResult({ results: [] });
    } finally {
      setIsChecking(false);
    }
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
                {(result.results || []).length > 0 ? (
                  <>
                    <div className="flex items-center gap-2 text-success font-bold text-xs mb-3">
                      <CheckCircle2 className="w-4 h-4" /> Serviceable Area
                    </div>
                    <div className="space-y-2">
                      {result.results.map((r) => (
                        <div key={r.carrier_id} className="flex items-center justify-between text-xs">
                          <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold">{r.carrier_name}</span>
                          <span className="text-muted">{r.estimated_days} · ₹{r.estimated_rate}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted">No couriers serviceable for this route.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Courier Partners Grid */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-main text-sm">Integrated Courier Partners</h3>
              <p className="text-[10px] text-muted mt-0.5">{carriers.length} partner{carriers.length !== 1 ? 's' : ''} in catalog</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-success/8 text-success rounded-full text-[10px] font-bold">
              <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
              System Stable
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-muted text-sm">Loading carriers...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {carriers.map((courier) => (
                <div key={courier.id} className="p-4 bg-surface-light rounded-2xl flex items-center justify-between group hover:bg-surface-hover transition-all duration-200 text-left w-full">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xs group-hover:shadow-neon-sm transition-shadow bg-surface text-primary">
                      {courier.name[0]}
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-sm text-main">{courier.name}</h4>
                      <div className="flex gap-1 mt-1">
                        {courier.supports_cod && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-primary/10 text-primary rounded uppercase">COD</span>}
                        {courier.supports_express && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-secondary/10 text-secondary rounded uppercase">Express</span>}
                        {courier.supports_reverse && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-warning/10 text-warning rounded uppercase">Reverse</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <span className={`text-[9px] font-bold uppercase tracking-widest block mb-1 ${
                      courier.status === 'ACTIVE' ? 'text-success' : 'text-warning'
                    }`}>
                      {courier.status === 'ACTIVE' ? '● Active' : `⚠ ${courier.status}`}
                    </span>
                    <span className="text-[10px] text-muted font-medium">Up to {courier.max_weight_kg} kg</span>
                  </div>
                </div>
              ))}
              {carriers.length === 0 && (
                <p className="col-span-2 text-center text-muted text-xs py-8">No carriers in the catalog yet.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {feats.map(({ title, desc, icon: Icon, color }) => (
          <div key={title} className="glass-card p-5 flex items-start gap-4">
            <div className={`p-3 rounded-xl flex-shrink-0 ${
              color === 'primary' ? 'bg-primary/10 text-primary' :
              color === 'secondary' ? 'bg-secondary/10 text-secondary' :
                                       'bg-success/10 text-success'
            }`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-main mb-1">{title}</h4>
              <p className="text-xs text-muted leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Logistics;
