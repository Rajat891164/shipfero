import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, FiTrash2, FiActivity, FiSettings, FiCheckCircle, 
  FiAlertCircle, FiChevronRight, FiKey, FiLock, FiExternalLink,
  FiZap, FiDatabase, FiCpu
} from 'react-icons/fi';
import { LogisticsService } from '../services/api';

const CourierSettings = () => {
  const [couriers, setCouriers] = useState([]);
  const [integrations, setIntegrations] = useState([]);
  const [healthData, setHealthData] = useState([]);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedCourier, setSelectedCourier] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [formData, setFormData] = useState({
    account_mode: 'both',
    credentials: {},
    label_type: 'A4',
    otp_delivery: false,
    shipping_mode: 'Surface'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cRes, iRes, hRes] = await Promise.all([
        LogisticsService.getCouriers(),
        LogisticsService.getIntegrations(),
        LogisticsService.getHealth()
      ]);
      setCouriers(cRes.data);
      setIntegrations(iRes.data);
      setHealthData(hRes.data);
    } catch (err) {
      console.error('Failed to fetch logistics data');
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await LogisticsService.testConnection({
        courier_id: selectedCourier.id,
        credentials: formData.credentials
      });
      setTestResult({ success: true, message: res.data.message });
    } catch (err) {
      setTestResult({ success: false, message: err.response?.data?.error || 'Connection failed' });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveIntegration = async () => {
    setLoading(true);
    try {
      await LogisticsService.addIntegration({
        courier_id: selectedCourier.id,
        account_mode: formData.account_mode,
        credentials_encrypted: JSON.stringify(formData.credentials),
        label_type: formData.label_type,
        otp_delivery: formData.otp_delivery,
        shipping_mode: formData.shipping_mode
      });
      setShowWizard(false);
      fetchData();
    } catch (err) {
      alert('Failed to save integration');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIntegration = async (id) => {
    if (window.confirm('Are you sure you want to remove this integration?')) {
      try {
        await LogisticsService.deleteIntegration(id);
        fetchData();
      } catch (err) {
        alert('Failed to delete');
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Courier Integrations</h1>
          <p className="text-white/40 text-sm">Manage API credentials and shipping preferences for your courier partners.</p>
        </div>
        <button 
          onClick={() => { setShowWizard(true); setWizardStep(1); }}
          className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
        >
          <FiPlus /> Add Courier
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Integrations */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6">
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <FiZap className="text-blue-400" /> Active Partners
            </h3>
            
            {integrations.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-2xl">
                <FiCpu className="mx-auto text-4xl text-white/10 mb-4" />
                <p className="text-white/40">No couriers configured yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {integrations.map(integ => {
                  const health = healthData.find(h => h.courier === integ.courier_details.courier_name);
                  return (
                    <div key={integ.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 group hover:border-blue-500/30 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center font-bold text-blue-400">
                            {integ.courier_details.courier_name[0]}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm">{integ.courier_details.courier_name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${health?.status === 'healthy' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                              <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">{health?.status || 'Unknown'}</span>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteIntegration(integ.id)}
                          className="p-2 text-white/20 hover:text-red-400 transition-colors"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-[10px] font-bold text-white/30 uppercase">
                          <span>Mode</span>
                          <span className="text-white/60">{integ.account_mode}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-white/30 uppercase">
                          <span>Label</span>
                          <span className="text-white/60">{integ.label_type}</span>
                        </div>
                      </div>

                      <button className="w-full py-2 bg-white/5 hover:bg-white/10 text-white/60 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2">
                        <FiSettings /> Configure
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Health Monitor Sidebar */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="font-bold mb-6 flex items-center gap-2 text-emerald-400">
              <FiActivity /> API Health
            </h3>
            <div className="space-y-4">
              {healthData.map(h => (
                <div key={h.courier} className="flex justify-between items-center">
                  <div className="text-sm font-medium">{h.courier}</div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-emerald-400">{h.uptime} Uptime</div>
                    <div className="text-[10px] text-white/20">{h.latency}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Courier Wizard Overlay */}
      <AnimatePresence>
        {showWizard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowWizard(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl bg-[#141521] rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/5">
                <div>
                  <h2 className="text-xl font-bold">Add New Courier</h2>
                  <p className="text-white/40 text-xs">Configure API credentials and settings.</p>
                </div>
                <div className="flex gap-2">
                  {[1,2,3].map(s => (
                    <div key={s} className={`w-2 h-2 rounded-full ${wizardStep === s ? 'bg-blue-500' : wizardStep > s ? 'bg-emerald-500' : 'bg-white/10'}`} />
                  ))}
                </div>
              </div>

              <div className="p-8 max-h-[60vh] overflow-y-auto">
                {wizardStep === 1 && (
                  <div className="grid grid-cols-2 gap-4">
                    {couriers.map(c => (
                      <div 
                        key={c.id}
                        onClick={() => setSelectedCourier(c)}
                        className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col items-center text-center gap-4 ${selectedCourier?.id === c.id ? 'bg-blue-500/10 border-blue-500/50 shadow-lg shadow-blue-500/10' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                      >
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center font-bold text-lg">
                          {c.courier_name[0]}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm">{c.courier_name}</h4>
                          <p className="text-[10px] text-white/30 uppercase mt-1">{c.mode}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {wizardStep === 2 && (
                  <div className="space-y-6">
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-4">
                      <FiLock className="text-blue-400 text-xl" />
                      <p className="text-xs text-blue-400/80 leading-relaxed">
                        Your API credentials are encrypted with AES-256 before being stored in our secure database.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <InputField label="API Key / Token" type="password" icon={<FiKey />} />
                      <InputField label="User ID / Login ID" icon={<FiUser />} />
                      <InputField label="Client Secret / Password" type="password" icon={<FiLock />} />
                    </div>

                    <div className="pt-4">
                      <button 
                        onClick={handleTestConnection}
                        disabled={testing}
                        className={`w-full py-4 rounded-2xl border border-white/10 flex items-center justify-center gap-2 font-bold transition-all ${testing ? 'opacity-50' : 'hover:bg-white/5 active:scale-95'}`}
                      >
                        {testing ? <FiActivity className="animate-spin" /> : <FiActivity />}
                        {testing ? 'Testing Connectivity...' : 'Test API Connection'}
                      </button>
                      {testResult && (
                        <div className={`mt-4 p-3 rounded-xl flex items-center gap-2 text-xs font-bold ${testResult.success ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                          {testResult.success ? <FiCheckCircle /> : <FiAlertCircle />}
                          {testResult.message}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {wizardStep === 3 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider ml-1">Account Mode</label>
                        <select className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none">
                          <option>Both (COD & Prepaid)</option>
                          <option>COD Only</option>
                          <option>Prepaid Only</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider ml-1">Label Type</label>
                        <select className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none">
                          <option>A4</option>
                          <option>Thermal (4x6)</option>
                        </select>
                      </div>
                    </div>
                    <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-start gap-4">
                      <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400 mt-1">
                        <FiCheckCircle className="text-xl" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">Ready to Activate</h4>
                        <p className="text-white/40 text-xs mt-1">Everything looks good. Click complete to start booking shipments via {selectedCourier?.courier_name}.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-8 border-t border-white/10 bg-white/5 flex gap-4">
                {wizardStep > 1 && (
                  <button 
                    onClick={() => setWizardStep(s => s - 1)}
                    className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                  >
                    Back
                  </button>
                )}
                <button 
                  disabled={wizardStep === 1 && !selectedCourier}
                  onClick={() => {
                    if (wizardStep === 3) handleSaveIntegration();
                    else setWizardStep(s => s + 1);
                  }}
                  className="flex-[2] py-4 bg-blue-500 hover:bg-blue-600 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {wizardStep === 3 ? (loading ? 'Saving...' : 'Complete Setup') : 'Continue'} <FiChevronRight />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const InputField = ({ label, icon, ...props }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-400 transition-colors">
        {icon}
      </div>
      <input 
        {...props}
        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
        placeholder={`Enter ${label}...`}
      />
    </div>
  </div>
);

const FiUser = () => <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;

export default CourierSettings;
