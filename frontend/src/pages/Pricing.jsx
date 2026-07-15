import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  MapPin,
  Zap,
  Info,
  BadgePercent,
  X,
  ArrowRight
} from 'lucide-react';
import { PricingService } from '../services/api';

const WEIGHT_SLAB_LABEL = { '0.5': 'Below 500g', '1.0': 'Up to 1kg', '2.0': 'Up to 2kg', '5.0': 'Up to 5kg', '10.0': 'Up to 10kg', ADDITIONAL: 'Additional slab' };

const Pricing = () => {
  const [origin, setOrigin] = useState('');
  const [dest, setDest] = useState('');
  const [weight, setWeight] = useState('');
  const [rates, setRates] = useState([]);
  const [activeCourier, setActiveCourier] = useState('All');
  const [calculating, setCalculating] = useState(false);
  const [calcResult, setCalcResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // The rate-cards endpoint is paginated (20/page) with no page_size override,
    // so walk every page to build the full rate card across all couriers.
    const fetchAll = async () => {
      const all = [];
      let page = 1;
      try {
        // Cap the loop defensively; a real rate card is well under 20 pages.
        for (let i = 0; i < 20; i += 1) {
          const { data } = await PricingService.rateCards({ page });
          if (Array.isArray(data)) { all.push(...data); break; }        // non-paginated fallback
          all.push(...(data.results || []));
          if (!data.next) break;
          page += 1;
        }
        setRates(all);
      } catch {
        setRates(all);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const couriers = ['All', ...new Set(rates.map((r) => r.carrier_name))];
  const filteredRates = rates.filter((r) => activeCourier === 'All' || r.carrier_name === activeCourier);

  const handleEstimate = async () => {
    if (!origin || !dest || !weight) return alert('Please fill in all fields.');
    setCalculating(true);
    setCalcResult(null);
    try {
      const { data } = await PricingService.compare({
        pickup_pincode: origin,
        delivery_pincode: dest,
        weight_kg: weight,
        payment_type: 'PREPAID',
      });
      const options = data || [];
      if (options.length === 0) {
        setCalcResult(null);
      } else {
        const charges = options.map((o) => o.estimated_charge);
        setCalcResult({ min: `₹${Math.min(...charges)}`, max: `₹${Math.max(...charges)}`, couriers: options.length });
      }
    } catch {
      alert('Could not fetch a rate estimate. Please try again.');
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="space-y-7 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-warning" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Rates & Estimates</span>
          </div>
          <h2 className="text-2xl font-bold text-main">Courier Rate Card</h2>
          <p className="text-muted text-sm mt-0.5">Compare shipping costs across all integrated partners by weight and zone.</p>
        </div>
        <button
          className="neon-button-outline !py-2 text-xs flex items-center gap-2"
          onClick={() => alert('Opening Reverse Shipping Rates...')}
          id="pricing-reverse-rates"
        >
          <BadgePercent className="w-3.5 h-3.5" /> Reverse Rates
        </button>
      </div>

      {/* Rate Calculator */}
      <div className="glass-card p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-warning/8 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-warning/15 rounded-xl text-warning">
              <Zap className="w-5 h-5 fill-warning" />
            </div>
            <div>
              <h3 className="font-bold text-main text-sm">Shipping Rate Calculator</h3>
              <p className="text-xs text-muted mt-0.5">Get an instant estimate for your shipment charges.</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 items-end">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { placeholder: 'Origin Pincode', value: origin, set: setOrigin, id: 'pricing-origin' },
                { placeholder: 'Destination Pincode', value: dest, set: setDest, id: 'pricing-dest' },
                { placeholder: 'Weight (kg)', value: weight, set: setWeight, id: 'pricing-weight' },
              ].map(({ placeholder, value, set, id }) => (
                <div key={id} className="relative group">
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    placeholder={placeholder}
                    className="input-field text-xs !py-3"
                    id={id}
                  />
                  {value && (
                    <button onClick={() => set('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-main">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              className="neon-button-primary !bg-warning !text-background hover:shadow-[0_0_18px_rgba(254,251,0,0.45)] flex items-center gap-2 text-xs whitespace-nowrap !py-3 px-6 disabled:opacity-50"
              onClick={handleEstimate}
              disabled={calculating}
              id="pricing-estimate"
            >
              {calculating ? (
                <div className="w-4 h-4 border-2 border-background/40 border-t-background rounded-full animate-spin" />
              ) : (
                <><Zap className="w-3.5 h-3.5" /> ESTIMATE</>
              )}
            </button>
          </div>

          {/* Calc result */}
          {calcResult && (
            <div className="mt-4 p-4 bg-success/8 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-up">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-success/15 flex items-center justify-center text-success">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-success">Estimate Ready</p>
                  <p className="text-[10px] text-muted mt-0.5">Available via {calcResult.couriers} courier partners</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted font-bold uppercase">Estimated Range</p>
                <p className="text-lg font-bold text-main">{calcResult.min} – {calcResult.max}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rates Table */}
      <div className="glass-card overflow-hidden">
        {/* Table controls */}
        <div className="px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Courier filter pills */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {couriers.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCourier(c)}
                className={`px-3.5 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all duration-200 ${
                  activeCourier === c
                    ? 'bg-primary text-background shadow-neon-sm'
                    : 'bg-surface-light text-muted hover:bg-surface-hover hover:text-main'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted font-medium">
            <Info className="w-3 h-3" />
            Rates exclusive of GST & fuel surcharge
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left data-table">
            <thead>
              <tr>
                <th className="px-6">Courier Partner</th>
                <th className="px-4">Zone</th>
                <th className="px-4 text-center">Weight Slab</th>
                <th className="px-4 text-center">Forward Charge</th>
                <th className="px-4 text-center">COD Charge</th>
                <th className="px-6 text-right">RTO Charge</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-muted text-xs">Loading rate cards...</td></tr>
              )}
              {!loading && filteredRates.map((rate) => (
                <tr key={rate.id} className="group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-[10px] group-hover:shadow-neon-sm transition-shadow bg-surface-light text-primary">
                        {(rate.carrier_name || '?')[0]}
                      </div>
                      <span className="font-semibold text-main text-xs">{rate.carrier_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      Zone {rate.zone_code}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center text-xs text-muted">{WEIGHT_SLAB_LABEL[rate.weight_slab] || rate.weight_slab}</td>
                  <td className="px-4 py-4 text-center font-bold text-main text-xs">₹{rate.forward_charge}</td>
                  <td className="px-4 py-4 text-center text-muted text-xs">₹{rate.cod_min_charge} or {rate.cod_percentage}%</td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-xs font-bold text-main">₹{rate.rto_charge}</span>
                  </td>
                </tr>
              ))}
              {!loading && filteredRates.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <TrendingUp className="w-8 h-8 text-muted/30 mx-auto mb-3" />
                    <p className="text-sm font-bold text-muted">No rates available</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 flex items-center justify-between">
          <p className="text-[10px] text-muted">Showing {filteredRates.length} rate{filteredRates.length !== 1 ? 's' : ''}</p>
          <button className="text-[10px] font-bold text-primary flex items-center gap-1 hover:text-primary-dark transition-colors" onClick={() => alert('Downloading full rate card PDF...')}>
            Download Full Rate Card <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
