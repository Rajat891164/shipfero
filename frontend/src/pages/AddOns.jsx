import React from 'react';
import { 
  Puzzle, 
  CheckCircle2, 
  MessageCircle, 
  PhoneCall, 
  Globe, 
  Zap, 
  ShieldCheck, 
  Bell
} from 'lucide-react';

const AddOnCard = ({ title, desc, icon: Icon, active, price }) => (
  <div className="glass-card p-8 flex flex-col justify-between hover:border-primary/50 transition-all group overflow-hidden relative border-main">
    {active && (
      <div className="absolute top-4 right-[-30px] bg-success text-background text-[9px] font-black uppercase px-10 py-1 rotate-45 shadow-lg">
        Active
      </div>
    )}
    <div>
      <div className="w-14 h-14 bg-surface-light rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-main">
        <Icon className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-xl font-bold mb-3 text-main">{title}</h3>
      <p className="text-sm text-muted leading-relaxed mb-6">{desc}</p>
    </div>
    <div className="flex items-center justify-between pb-2 border-b border-main mb-6">
       <span className="text-[10px] font-bold text-muted uppercase">Plan</span>
       <span className="text-xs font-bold text-main">{price}</span>
    </div>
    <button 
      onClick={() => alert(`${active ? 'Deactivating' : 'Activating'} ${title}...`)}
      className={`w-full py-3 rounded-xl text-xs font-bold transition-all ${
        active ? 'bg-main/5 text-muted hover:bg-error/10 hover:text-error' : 'neon-button-primary'
      }`}
    >
      {active ? 'DEACTIVATE' : 'ACTIVATE ADD-ON'}
    </button>
  </div>
);

const AddOns = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-3 text-main">
          <Puzzle className="text-primary w-8 h-8" />
          Smart Add-ons
        </h2>
        <p className="text-muted text-sm mt-1">Supercharge your logistics workflow with AI-driven tools and automation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AddOnCard 
          title="NDR WhatsApp Lite" 
          desc="Automate non-delivery confirmation via WhatsApp bots. Reduce RTO by 12%." 
          icon={MessageCircle} 
          active={true}
          price="Included in Pro"
        />
        <AddOnCard 
          title="Shipway Protect" 
          desc="Secure your high-value shipments with per-package insurance coverage." 
          icon={ShieldCheck} 
          active={false}
          price="1% of Invoice"
        />
        <AddOnCard 
          title="EDD Widget" 
          desc="Show Expected Delivery Dates on your product pages to improve conversion." 
          icon={Bell} 
          active={false}
          price="₹999 / month"
        />
        <AddOnCard 
          title="Smart NDR Calling" 
          desc="AI voice bots call customers for re-attempt confirmation on failure." 
          icon={PhoneCall} 
          active={false}
          price="₹2 / call"
        />
        <AddOnCard 
          title="Branded Tracking" 
          desc="Customize the tracking page with your brand logo and marketing banners." 
          icon={Zap} 
          active={false}
          price="₹499 / month"
        />
        <AddOnCard 
          title="Custom Domain" 
          desc="Host your tracking and return pages on your own sub-domain." 
          icon={Globe} 
          active={false}
          price="₹1,999 / year"
        />
      </div>
    </div>
  );
};

export default AddOns;
