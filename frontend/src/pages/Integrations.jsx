import React from 'react';
import { 
  ShoppingBag, 
  Globe, 
  ArrowRight, 
  Plus, 
  CheckCircle2, 
  Zap,
  Lock,
  Link
} from 'lucide-react';

const IntegrationCard = ({ name, type, icon: Icon, connected, colorClass }) => (
  <div className="glass-card p-6 glass-card-hover group border-main">
    <div className="flex justify-between items-start mb-6">
       <div className={`p-4 rounded-2xl bg-opacity-10 ${colorClass}`}>
          <Icon className={`w-8 h-8 ${colorClass.replace('bg-', 'text-')}`} />
       </div>
       {connected ? (
         <span className="flex items-center gap-1.5 px-3 py-1 bg-success/10 text-success rounded-full text-[10px] font-bold uppercase border border-success/20">
            <CheckCircle2 className="w-3 h-3" /> CONNECTED
         </span>
       ) : (
         <button className="text-[10px] font-bold text-muted hover:text-primary transition-colors flex items-center gap-1" onClick={() => alert(`Starting ${name} connection flow...`)}>
            <Plus className="w-3 h-3" /> CONNECT CHANNEL
         </button>
       )}
    </div>
    <h4 className="font-bold text-lg text-main">{name}</h4>
    <p className="text-xs text-muted mb-6">{type} Integration</p>
    
    <div className="pt-6 border-t border-main flex gap-2">
       {connected ? (
         <>
           <button className="flex-1 py-2 bg-main/5 text-main text-xs font-bold rounded-lg hover:bg-main/10 transition-colors" onClick={() => alert(`Opening ${name} settings...`)}>SETTING</button>
           <button className="flex-1 py-2 bg-primary/20 text-primary text-xs font-bold rounded-lg hover:bg-primary hover:text-background transition-colors" onClick={() => alert(`Syncing ${name} orders...`)}>SYNC NOW</button>
         </>
       ) : (
         <button className="w-full py-2 bg-surface-light border border-main text-main text-xs font-bold rounded-lg hover:border-primary transition-all" onClick={() => alert(`Configuring ${name}...`)}>CONFIGURE</button>
       )}
    </div>
  </div>
);

const Integrations = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-3 text-main">
          <Link className="text-primary w-8 h-8" />
          Channel Integrations
        </h2>
        <p className="text-muted text-sm mt-1">Connect your e-commerce stores to automatically pull orders and push tracking updates.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <IntegrationCard 
          name="Shopify" 
          type="Direct App" 
          icon={ShoppingBag} 
          connected={true} 
          colorClass="bg-success"
        />
        <IntegrationCard 
          name="WooCommerce" 
          type="Plugin Based" 
          icon={ShoppingBag} 
          connected={false} 
          colorClass="bg-secondary"
        />
        <IntegrationCard 
          name="Amazon" 
          type="Seller Central" 
          icon={Globe} 
          connected={false} 
          colorClass="bg-warning"
        />
        <IntegrationCard 
          name="Magento 2" 
          type="Extension" 
          icon={Zap} 
          connected={false} 
          colorClass="bg-primary"
        />
      </div>

      {/* API Configuration */}
      <div className="glass-card p-8 border-dashed border-main">
         <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 bg-surface-light rounded-2xl flex items-center justify-center text-muted border border-main">
               <Lock className="w-8 h-8" />
            </div>
            <div className="flex-1 text-center md:text-left">
               <h3 className="font-bold text-lg text-main">Custom API Access</h3>
               <p className="text-xs text-muted mt-1">Develop your own integration using our robust REST API. Access endpoints for orders, tracking, and labels.</p>
            </div>
            <div className="flex gap-4">
               <button className="neon-button-outline !py-2 text-xs" onClick={() => window.open('https://docs.shipfero.com', '_blank')}>VIEW DOCUMENTATION</button>
               <button className="neon-button-primary !py-2 text-xs" onClick={() => alert('Generating new API key...')}>GENERATE API KEY</button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Integrations;
