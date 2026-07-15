import React, { useEffect, useState } from 'react';
import {
  User,
  Building2,
  Shield,
  MapPin,
  Bell,
  Camera,
  CheckCircle2,
  AlertCircle,
  Save,
  Lock,
  Mail,
  Phone,
  Key,
  Trash2,
  Copy
} from 'lucide-react';
import { MerchantService, SettingsService, unwrap } from '../services/api';

const tabs = [
  { id: 'Profile', label: 'Profile', icon: User },
  { id: 'Business', label: 'Business & KYC', icon: Building2 },
  { id: 'Bank', label: 'Bank Details', icon: Shield },
  { id: 'Security', label: 'Security', icon: Lock },
  { id: 'Notifications', label: 'Notifications', icon: Bell },
];

const SettingsSection = ({ title, desc, children, icon: Icon }) => (
  <div className="glass-card overflow-hidden mb-6">
    <div className="px-6 py-5 bg-surface-light/30 flex items-center gap-3">
      {Icon && (
        <div className="p-2 bg-secondary/10 text-secondary rounded-xl">
          <Icon className="w-4 h-4" />
        </div>
      )}
      <div>
        <h3 className="font-bold text-main text-sm">{title}</h3>
        <p className="text-[10px] text-muted mt-0.5">{desc}</p>
      </div>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const FormField = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">{label}</label>
    {children}
  </div>
);

const KYC_STATUS_STYLE = {
  VERIFIED: { cls: 'bg-success/8 text-success', icon: CheckCircle2, label: 'KYC Verified' },
  PENDING: { cls: 'bg-warning/8 text-warning', icon: AlertCircle, label: 'KYC Pending' },
  UNDER_REVIEW: { cls: 'bg-warning/8 text-warning', icon: AlertCircle, label: 'Under Review' },
  REJECTED: { cls: 'bg-error/8 text-error', icon: AlertCircle, label: 'KYC Rejected' },
};

const Settings = () => {
  const [activeTab, setActiveTab] = useState('Profile');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const [merchant, setMerchant] = useState(null);
  const [profileForm, setProfileForm] = useState(null);
  const [kyc, setKyc] = useState(null);
  const [bank, setBank] = useState(null);
  const [pickup, setPickup] = useState(null);
  const [apiKeys, setApiKeys] = useState([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState(null);

  useEffect(() => {
    MerchantService.me().then(({ data }) => {
      setMerchant(data);
      setProfileForm({
        company_name: data.company_name || '',
        business_email: data.business_email || '',
        phone: data.phone || '',
        gst_number: data.gst_number || '',
        pan_number: data.pan_number || '',
      });
    }).catch(() => {});
    MerchantService.listKyc().then(({ data }) => setKyc((unwrap(data) || [])[0] || null)).catch(() => {});
    MerchantService.listBankDetails().then(({ data }) => setBank((unwrap(data) || [])[0] || null)).catch(() => {});
    MerchantService.listPickupLocations().then(({ data }) => setPickup((unwrap(data) || []).find((p) => p.is_default) || (unwrap(data) || [])[0] || null)).catch(() => {});
    fetchApiKeys();
  }, []);

  const fetchApiKeys = () => {
    SettingsService.listApiKeys().then(({ data }) => setApiKeys(unwrap(data) || [])).catch(() => {});
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await MerchantService.updateMe(profileForm);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return alert('Give the key a name.');
    try {
      const { data } = await SettingsService.createApiKey({ name: newKeyName.trim() });
      setCreatedKey(data);
      setNewKeyName('');
      fetchApiKeys();
    } catch {
      alert('Failed to create API key.');
    }
  };

  const handleRevokeKey = async (id) => {
    if (!window.confirm('Revoke this API key? This cannot be undone.')) return;
    try {
      await SettingsService.revokeApiKey(id);
      fetchApiKeys();
    } catch {
      alert('Failed to revoke key.');
    }
  };

  const kycStyle = KYC_STATUS_STYLE[kyc?.status] || KYC_STATUS_STYLE.PENDING;
  const KycIcon = kycStyle.icon;

  return (
    <div className="max-w-4xl space-y-6 animate-fade-up">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <User className="w-4 h-4 text-secondary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Configuration</span>
        </div>
        <h2 className="text-2xl font-bold text-main">Account & Profile Settings</h2>
        <p className="text-muted text-sm mt-0.5">Manage your merchant profile, KYC documents, and delivery preferences.</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
              activeTab === id
                ? 'bg-secondary text-white shadow-neon-purple scale-[1.02]'
                : 'text-muted bg-surface-light/50 hover:text-main hover:bg-surface-hover'
            }`}
            id={`settings-tab-${id.toLowerCase()}`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'Profile' && profileForm && (
        <div className="animate-fade-up">
          <SettingsSection title="Merchant Profile" desc="Used on shipping labels, invoices, and official documents." icon={User}>
            <div className="flex flex-col md:flex-row items-start gap-8">
              <div className="flex flex-col items-center gap-3 flex-shrink-0">
                <div className="w-24 h-24 rounded-2xl bg-surface-light border border-dashed border-main flex flex-col items-center justify-center text-muted">
                  <Camera className="w-8 h-8" />
                  <span className="text-[9px] font-bold mt-1 uppercase tracking-wider">Upload</span>
                </div>
                <p className="text-[10px] text-muted text-center">JPG, PNG · Max 2MB</p>
              </div>

              <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Business Name">
                  <div className="relative group">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                    <input type="text" value={profileForm.company_name} onChange={(e) => setProfileForm((f) => ({ ...f, company_name: e.target.value }))} className="input-field !pl-11 text-sm" id="settings-business-name" />
                  </div>
                </FormField>
                <FormField label="Business Email">
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                    <input type="email" value={profileForm.business_email} onChange={(e) => setProfileForm((f) => ({ ...f, business_email: e.target.value }))} className="input-field !pl-11 text-sm" id="settings-email" />
                  </div>
                </FormField>
                <FormField label="Phone Number">
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                    <input type="tel" value={profileForm.phone} onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))} className="input-field !pl-11 text-sm" id="settings-phone" />
                  </div>
                </FormField>
                <FormField label="GST Number">
                  <input type="text" value={profileForm.gst_number} onChange={(e) => setProfileForm((f) => ({ ...f, gst_number: e.target.value }))} className="input-field text-sm font-mono" id="settings-gst" />
                </FormField>
              </div>
            </div>
          </SettingsSection>

          {pickup && (
            <SettingsSection title="Default Pickup Location" desc="Courier partners will collect shipments from this address." icon={MapPin}>
              <div className="p-4 bg-surface-light/60 rounded-2xl flex items-start gap-4">
                <div className="p-3 bg-secondary/10 rounded-xl text-secondary flex-shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-main">{pickup.location_name}</h4>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    {pickup.address_line1}{pickup.address_line2 ? `, ${pickup.address_line2}` : ''},<br />
                    {pickup.city} – {pickup.pincode}, {pickup.state}
                  </p>
                </div>
              </div>
            </SettingsSection>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              className={`flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 disabled:opacity-60 ${
                saved ? 'bg-success text-background' : 'bg-secondary text-white hover:bg-secondary-dark hover:shadow-neon-purple'
              }`}
              onClick={handleSaveProfile}
              disabled={saving}
              id="settings-save"
            >
              {saved ? (<><CheckCircle2 className="w-4 h-4" /> Saved!</>) : saving ? 'Saving...' : (<><Save className="w-4 h-4" /> Save Settings</>)}
            </button>
          </div>
        </div>
      )}

      {/* Business & KYC Tab */}
      {activeTab === 'Business' && (
        <div className="animate-fade-up">
          <SettingsSection title="KYC Verification" desc="Government-mandated documents to enable shipping operations." icon={Shield}>
            <div className="space-y-5">
              <div className={`p-4 rounded-2xl flex items-center justify-between gap-3 ${kycStyle.cls}`}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                    <KycIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold tracking-wide">{kycStyle.label}</p>
                    {kyc?.rejection_reason && <p className="text-[10px] font-medium mt-0.5">{kyc.rejection_reason}</p>}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Document Type">
                  <input type="text" value={kyc?.document_type || '—'} disabled className="input-field text-sm font-mono opacity-60" />
                </FormField>
                <FormField label="Document Number">
                  <input type="text" value={kyc?.document_number || '—'} disabled className="input-field text-sm font-mono opacity-60" />
                </FormField>
              </div>
            </div>
          </SettingsSection>
        </div>
      )}

      {/* Bank Tab */}
      {activeTab === 'Bank' && (
        <div className="animate-fade-up">
          <SettingsSection title="Bank Account" desc="Used for COD remittance and wallet refunds." icon={Shield}>
            {bank ? (
              <div className="space-y-5">
                <div className={`p-4 rounded-2xl flex items-center gap-3 ${bank.is_verified ? 'bg-success/8 text-success' : 'bg-warning/8 text-warning'}`}>
                  {bank.is_verified ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  <p className="text-sm font-bold">{bank.is_verified ? 'Bank Verified (Penny Drop)' : 'Verification Pending'}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Account Holder"><input type="text" value={bank.account_holder} disabled className="input-field text-sm opacity-60" /></FormField>
                  <FormField label="Bank Name"><input type="text" value={bank.bank_name} disabled className="input-field text-sm opacity-60" /></FormField>
                  <FormField label="Account Number"><input type="text" value={bank.account_number} disabled className="input-field text-sm font-mono opacity-60" /></FormField>
                  <FormField label="IFSC Code"><input type="text" value={bank.ifsc_code} disabled className="input-field text-sm font-mono opacity-60" /></FormField>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted">No bank account on file yet.</p>
            )}
          </SettingsSection>
        </div>
      )}

      {/* Security Tab — API Keys */}
      {activeTab === 'Security' && (
        <div className="animate-fade-up">
          <SettingsSection title="API Keys" desc="Generate keys for custom integrations. Keys are shown only once." icon={Key}>
            <div className="flex gap-3 mb-5">
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Key name, e.g. Warehouse ERP"
                className="input-field text-sm flex-1"
              />
              <button onClick={handleCreateKey} className="neon-button-primary !py-2.5 text-xs px-5">Generate</button>
            </div>

            {createdKey && (
              <div className="mb-5 p-4 bg-warning/10 border border-warning/20 rounded-2xl">
                <p className="text-[10px] font-bold text-warning uppercase mb-2">Copy this key now — it won't be shown again</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono bg-black/20 px-3 py-2 rounded-lg break-all text-main">{createdKey.api_key}</code>
                  <button onClick={() => navigator.clipboard.writeText(createdKey.api_key)} className="p-2 bg-surface-light rounded-lg text-muted hover:text-primary">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {apiKeys.length === 0 && <p className="text-xs text-muted">No API keys yet.</p>}
              {apiKeys.map((key) => (
                <div key={key.id} className="flex items-center justify-between p-3 bg-surface-light rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-main">{key.name}</p>
                    <p className="text-[10px] text-muted">{key.last_used_at ? `Last used ${new Date(key.last_used_at).toLocaleDateString('en-IN')}` : 'Never used'}</p>
                  </div>
                  <button onClick={() => handleRevokeKey(key.id)} className="p-2 text-muted hover:text-error transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </SettingsSection>
        </div>
      )}

      {/* Notifications — Coming Soon */}
      {activeTab === 'Notifications' && (
        <div className="glass-card p-14 text-center animate-fade-up">
          <div className="w-16 h-16 bg-surface-light rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Bell className="w-8 h-8 text-muted/40" />
          </div>
          <h3 className="text-lg font-bold text-main">Notification Preferences</h3>
          <p className="text-sm text-muted mt-2 max-w-xs mx-auto leading-relaxed">
            This module is currently being developed. Check back in the next update.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-muted font-bold uppercase tracking-wider">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            Coming Soon
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
