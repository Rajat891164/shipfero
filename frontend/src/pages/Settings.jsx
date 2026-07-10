import React, { useState } from 'react';
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
  X,
  Lock,
  Mail,
  Phone,
  ChevronRight
} from 'lucide-react';

const tabs = [
  { id: 'Profile',       label: 'Profile',        icon: User },
  { id: 'Business',      label: 'Business & KYC', icon: Building2 },
  { id: 'Bank',          label: 'Bank Details',   icon: Shield },
  { id: 'Security',      label: 'Security',       icon: Lock },
  { id: 'Notifications', label: 'Notifications',  icon: Bell },
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

const Settings = () => {
  const [activeTab, setActiveTab] = useState('Profile');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    alert('Settings saved successfully!');
  };

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
      {activeTab === 'Profile' && (
        <div className="animate-fade-up">
          {/* Merchant Profile */}
          <SettingsSection title="Merchant Profile" desc="Used on shipping labels, invoices, and official documents." icon={User}>
            <div className="flex flex-col md:flex-row items-start gap-8">
              {/* Avatar upload */}
              <div className="flex flex-col items-center gap-3 flex-shrink-0">
                <div
                  className="w-24 h-24 rounded-2xl bg-surface-light border border-dashed border-main flex flex-col items-center justify-center text-muted hover:border-secondary hover:text-secondary hover:bg-secondary/5 transition-all cursor-pointer group"
                  onClick={() => alert('Opening photo uploader...')}
                >
                  <Camera className="w-8 h-8 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-bold mt-1 uppercase tracking-wider">Upload</span>
                </div>
                <p className="text-[10px] text-muted text-center">JPG, PNG · Max 2MB</p>
              </div>

              {/* Form fields */}
              <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Full Name">
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-secondary transition-colors pointer-events-none" />
                    <input type="text" defaultValue="Akshay Tomar" className="input-field !pl-11 text-sm" id="settings-name" />
                  </div>
                </FormField>
                <FormField label="Email Address">
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-secondary transition-colors pointer-events-none" />
                    <input type="email" defaultValue="akshay.tomar@example.com" className="input-field !pl-11 text-sm" id="settings-email" />
                  </div>
                </FormField>
                <FormField label="Phone Number">
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-secondary transition-colors pointer-events-none" />
                    <input type="tel" defaultValue="+91 98765 43210" className="input-field !pl-11 text-sm" id="settings-phone" />
                  </div>
                </FormField>
                <FormField label="Business Name">
                  <input type="text" defaultValue="TechMart Enterprise" className="input-field text-sm" id="settings-business-name" />
                </FormField>
              </div>
            </div>
          </SettingsSection>

          {/* KYC Verification */}
          <SettingsSection title="KYC Verification" desc="Government-mandated documents to enable shipping operations." icon={Shield}>
            <div className="space-y-5">
              {/* KYC status */}
              <div className="p-4 bg-success/8 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-success/15 flex items-center justify-center text-success flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-success tracking-wide">KYC Approved</p>
                    <p className="text-[10px] text-muted font-medium mt-0.5">Verified on 12 Mar 2024</p>
                  </div>
                </div>
                <button
                  className="text-[10px] font-bold text-muted hover:text-main transition-colors px-3 py-1.5 bg-surface-light rounded-lg hover:bg-surface-hover"
                  onClick={() => alert('Viewing uploaded KYC documents...')}
                >
                  VIEW DOCUMENTS
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="GST Number">
                  <input type="text" defaultValue="07AAAAA0000A1Z5" className="input-field text-sm font-mono" id="settings-gst" />
                </FormField>
                <FormField label="PAN Number">
                  <input type="text" defaultValue="ABCDE1234F" className="input-field text-sm font-mono" id="settings-pan" />
                </FormField>
              </div>
            </div>
          </SettingsSection>

          {/* Pickup Location */}
          <SettingsSection title="Default Pickup Location" desc="Courier partners will collect shipments from this address." icon={MapPin}>
            <div className="p-4 bg-surface-light/60 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-surface-hover transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-secondary/10 rounded-xl text-secondary flex-shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-main">Primary Warehouse (South)</h4>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    Building No 12, Industrial Area Phase 2,<br />
                    Whitefield, Bengaluru – 560066, Karnataka
                  </p>
                </div>
              </div>
              <button
                className="text-[10px] font-bold text-primary hover:text-primary-dark transition-colors px-3 py-1.5 bg-primary/8 rounded-lg hover:bg-primary/15 flex items-center gap-1.5 whitespace-nowrap"
                onClick={() => alert('Opening address change modal...')}
              >
                CHANGE <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </SettingsSection>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              className="px-6 py-2.5 bg-surface-light text-main text-xs font-bold rounded-xl hover:bg-surface-hover transition-all"
              onClick={() => alert('Changes discarded.')}
            >
              Discard Changes
            </button>
            <button
              className={`flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 ${
                saved
                  ? 'bg-success text-background'
                  : 'bg-secondary text-white hover:bg-secondary-dark hover:shadow-neon-purple'
              }`}
              onClick={handleSave}
              id="settings-save"
            >
              {saved ? (
                <><CheckCircle2 className="w-4 h-4" /> Saved!</>
              ) : (
                <><Save className="w-4 h-4" /> Save Settings</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Other Tabs – Coming Soon */}
      {activeTab !== 'Profile' && (
        <div className="glass-card p-14 text-center animate-fade-up">
          <div className="w-16 h-16 bg-surface-light rounded-2xl flex items-center justify-center mx-auto mb-5">
            {React.createElement(tabs.find(t => t.id === activeTab)?.icon || AlertCircle, {
              className: 'w-8 h-8 text-muted/40'
            })}
          </div>
          <h3 className="text-lg font-bold text-main">{activeTab} Settings</h3>
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
