import React, { useEffect, useState } from 'react';
import {
  ShoppingBag,
  Globe,
  Plus,
  CheckCircle2,
  Zap,
  Lock,
  Link,
  X
} from 'lucide-react';
import { IntegrationService, unwrap } from '../services/api';

const PLATFORM_META = {
  SHOPIFY: { name: 'Shopify', icon: ShoppingBag, colorClass: 'bg-success' },
  WOOCOMMERCE: { name: 'WooCommerce', icon: ShoppingBag, colorClass: 'bg-secondary' },
  AMAZON: { name: 'Amazon', icon: Globe, colorClass: 'bg-warning' },
  CUSTOM_API: { name: 'Custom API', icon: Zap, colorClass: 'bg-primary' },
};

const IntegrationCard = ({ integration, onSync, onConnect, syncing }) => {
  const meta = PLATFORM_META[integration.platform] || { name: integration.platform, icon: Zap, colorClass: 'bg-primary' };
  const Icon = meta.icon;
  const connected = !!integration;

  return (
    <div className="glass-card p-6 glass-card-hover group border-main">
      <div className="flex justify-between items-start mb-6">
        <div className={`p-4 rounded-2xl bg-opacity-10 ${meta.colorClass}`}>
          <Icon className={`w-8 h-8 ${meta.colorClass.replace('bg-', 'text-')}`} />
        </div>
        {connected ? (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-success/10 text-success rounded-full text-[10px] font-bold uppercase border border-success/20">
            <CheckCircle2 className="w-3 h-3" /> {integration.status}
          </span>
        ) : (
          <button className="text-[10px] font-bold text-muted hover:text-primary transition-colors flex items-center gap-1" onClick={onConnect}>
            <Plus className="w-3 h-3" /> CONNECT CHANNEL
          </button>
        )}
      </div>
      <h4 className="font-bold text-lg text-main">{integration.store_name || meta.name}</h4>
      <p className="text-xs text-muted mb-6">{meta.name} Integration</p>

      <div className="pt-6 border-t border-main flex gap-2">
        {connected ? (
          <>
            <button className="flex-1 py-2 bg-main/5 text-main text-xs font-bold rounded-lg hover:bg-main/10 transition-colors" onClick={() => alert(`${integration.store_name}: last synced ${integration.last_sync_at || 'never'}`)}>DETAILS</button>
            <button
              className="flex-1 py-2 bg-primary/20 text-primary text-xs font-bold rounded-lg hover:bg-primary hover:text-background transition-colors disabled:opacity-50"
              onClick={() => onSync(integration.id)}
              disabled={syncing === integration.id}
            >
              {syncing === integration.id ? 'SYNCING...' : 'SYNC NOW'}
            </button>
          </>
        ) : (
          <button className="w-full py-2 bg-surface-light border border-main text-main text-xs font-bold rounded-lg hover:border-primary transition-all" onClick={onConnect}>CONFIGURE</button>
        )}
      </div>
    </div>
  );
};

const ConnectModal = ({ onClose, onCreated }) => {
  const [platform, setPlatform] = useState('SHOPIFY');
  const [storeName, setStoreName] = useState('');
  const [storeUrl, setStoreUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!storeName.trim()) return alert('Store name is required.');
    setSaving(true);
    try {
      await IntegrationService.add({
        platform,
        store_name: storeName,
        store_url: storeUrl,
        api_key: apiKey,
      });
      onCreated();
      onClose();
    } catch (err) {
      alert(err.response?.data?.detail || Object.values(err.response?.data || {})[0] || 'Failed to connect channel.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#141521] rounded-3xl border border-white/10 shadow-2xl p-8 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg text-main">Connect a Channel</h3>
          <button onClick={onClose} className="text-muted hover:text-main"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Platform</label>
          <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="input-field text-sm">
            {Object.entries(PLATFORM_META).map(([value, m]) => <option key={value} value={value}>{m.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Store Name</label>
          <input value={storeName} onChange={(e) => setStoreName(e.target.value)} className="input-field text-sm" placeholder="My Store" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Store URL</label>
          <input value={storeUrl} onChange={(e) => setStoreUrl(e.target.value)} className="input-field text-sm" placeholder="mystore.myshopify.com" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">API Key / Token</label>
          <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} type="password" className="input-field text-sm" placeholder="Encrypted at rest" />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full neon-button-primary !py-3 text-xs disabled:opacity-50"
        >
          {saving ? 'Connecting...' : 'Connect Channel'}
        </button>
      </div>
    </div>
  );
};

const Integrations = () => {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchData = () => {
    setLoading(true);
    IntegrationService.list()
      .then(({ data }) => setIntegrations(unwrap(data) || []))
      .catch(() => setIntegrations([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSync = async (id) => {
    setSyncing(id);
    try {
      const { data } = await IntegrationService.sync(id);
      alert(`Synced ${data.orders_fetched ?? 0} orders.`);
      fetchData();
    } catch {
      alert('Sync failed.');
    } finally {
      setSyncing(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3 text-main">
            <Link className="text-primary w-8 h-8" />
            Channel Integrations
          </h2>
          <p className="text-muted text-sm mt-1">Connect your e-commerce stores to automatically pull orders and push tracking updates.</p>
        </div>
        <button className="neon-button-primary !py-2 text-xs flex items-center gap-2" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> CONNECT CHANNEL
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-muted text-sm">Loading integrations...</div>
      ) : integrations.length === 0 ? (
        <div className="glass-card p-12 text-center text-muted text-sm">No channels connected yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {integrations.map((integ) => (
            <IntegrationCard key={integ.id} integration={integ} onSync={handleSync} syncing={syncing} onConnect={() => setShowModal(true)} />
          ))}
        </div>
      )}

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
            <button className="neon-button-primary !py-2 text-xs" onClick={() => window.location.assign('/settings')}>GENERATE API KEY</button>
          </div>
        </div>
      </div>

      {showModal && <ConnectModal onClose={() => setShowModal(false)} onCreated={fetchData} />}
    </div>
  );
};

export default Integrations;
