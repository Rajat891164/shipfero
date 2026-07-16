import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUser, FiMail, FiBriefcase, FiFileText, FiCreditCard, 
  FiMapPin, FiPackage, FiCheckCircle, FiChevronRight, FiChevronLeft,
  FiUploadCloud, FiTrendingUp, FiArrowRight
} from 'react-icons/fi';
import { AuthService, MerchantService } from '../services/api';
import useAuthStore from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    // Registration
    full_name: '', email: '', phone: '', company_name: '', gst_number: '', pan_number: '', password: '', referral_code: '',
    // Email Verification
    otp: '',
    // Business Profile
    business_type: '', industry: '', monthly_shipment_volume: '', website_url: '',
    // KYC
    document_type: 'PAN', document_number: '', document_url: '',
    // Bank
    account_holder: '', bank_name: '', account_number: '', ifsc_code: '', account_type: 'SAVINGS',
    // Pickup
    location_name: '', contact_person: '', contact_phone: '', address_line1: '', city: '', state: '', pincode: '',
    // Plan
    plan_name: 'Starter', price: 0
  });

  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);

  const [emailStatus, setEmailStatus] = useState('idle'); // idle | checking | available | taken

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'email') setEmailStatus('idle');
  };

  // PRD Module 1, Step 1 validations
  const GST_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  const gstValid = !formData.gst_number || GST_RE.test(formData.gst_number.toUpperCase());
  const pwChecks = {
    length: formData.password.length >= 8,
    upper: /[A-Z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
  };
  const pwScore = Object.values(pwChecks).filter(Boolean).length;

  const checkEmailAvailability = async () => {
    const email = formData.email.trim();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return;
    setEmailStatus('checking');
    try {
      const { data } = await AuthService.checkEmail(email);
      setEmailStatus(data.available ? 'available' : 'taken');
    } catch {
      setEmailStatus('idle');
    }
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const firstError = (data) =>
    data?.detail ||
    (data && typeof data === 'object' ? Object.values(data).flat()[0] : null) ||
    'Something went wrong. Please try again.';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (step === 1) {
        // PRD validations before creating the account.
        if (!gstValid) throw { response: { data: { detail: 'GST number must be a valid 15-character GSTIN.' } } };
        if (pwScore < 3) throw { response: { data: { detail: 'Password needs at least 8 characters, one uppercase letter and one number.' } } };
        if (emailStatus === 'taken') throw { response: { data: { detail: 'This email is already registered.' } } };
        // Register, then log in so the OTP/onboarding calls are authenticated.
        const [firstName, ...rest] = formData.full_name.trim().split(' ');
        await AuthService.signup({
          email: formData.email,
          first_name: firstName || formData.full_name,
          last_name: rest.join(' '),
          mobile: formData.phone,
          password: formData.password,
        });
        const { data: tokens } = await AuthService.login(formData.email, formData.password);
        setSession({ access: tokens.access, refresh: tokens.refresh });
        nextStep();
      } else if (step === 2) {
        await AuthService.verifyEmailOtp(formData.otp);
        nextStep();
      } else if (step === 3) {
        await MerchantService.saveBusinessProfile({
          business_type: formData.business_type,
          industry: formData.industry,
          monthly_shipment_volume: formData.monthly_shipment_volume,
          website_url: formData.website_url || '',
        });
        nextStep();
      } else if (step === 4) {
        // KYC document upload needs S3 (not wired yet); submit metadata best-effort.
        try {
          await MerchantService.addKyc({
            document_type: formData.document_type,
            document_number: formData.document_number,
            document_url: formData.document_url || 'https://pending-upload.local/kyc',
          });
        } catch {
          /* KYC is reviewed later and doesn't block onboarding completion */
        }
        nextStep();
      } else if (step === 5) {
        await MerchantService.addBankDetails({
          account_holder: formData.account_holder,
          bank_name: formData.bank_name,
          account_number: formData.account_number,
          ifsc_code: formData.ifsc_code,
          account_type: formData.account_type,
        });
        nextStep();
      } else if (step === 6) {
        await MerchantService.addPickupLocation({
          location_name: formData.location_name,
          contact_person: formData.contact_person,
          contact_phone: formData.contact_phone,
          address_line1: formData.address_line1,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        });
        nextStep();
      } else if (step === 7) {
        // Plan selection has no write endpoint yet (a 14-day Pro trial is
        // auto-applied at signup per PRD); just finalize onboarding.
        try {
          await MerchantService.completeOnboarding();
        } catch {
          /* completion validation is surfaced on the dashboard checklist */
        }
        nextStep();
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(firstError(err.response?.data));
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    try {
      await AuthService.sendEmailOtp();
    } catch {
      /* cooldown or transient — ignore */
    }
  };

  const steps = [
    { id: 1, name: 'Register', icon: <FiUser /> },
    { id: 2, name: 'Verify', icon: <FiMail /> },
    { id: 3, name: 'Profile', icon: <FiBriefcase /> },
    { id: 4, name: 'KYC', icon: <FiFileText /> },
    { id: 5, name: 'Bank', icon: <FiCreditCard /> },
    { id: 6, name: 'Pickup', icon: <FiMapPin /> },
    { id: 7, name: 'Plan', icon: <FiPackage /> },
    { id: 8, name: 'Ready', icon: <FiCheckCircle /> }
  ];

  return (
    <div className="min-h-screen bg-[#0a0b14] text-white flex items-center justify-center p-6 font-['Outfit']">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-4xl glass-card rounded-3xl border border-white/10 overflow-hidden flex flex-col md:flex-row shadow-2xl">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-1/3 bg-white/5 p-8 border-b md:border-b-0 md:border-r border-white/10">
          <div className="mb-12">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              ShipBolt
            </h2>
            <p className="text-white/40 text-sm mt-1">Aggregator Onboarding</p>
          </div>

          <div className="space-y-4">
            {steps.map((s) => (
              <div 
                key={s.id} 
                className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-300 ${step === s.id ? 'bg-blue-500/20 text-blue-400' : step > s.id ? 'text-emerald-400' : 'text-white/40'}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${step === s.id ? 'border-blue-400/30' : step > s.id ? 'border-emerald-400/30' : 'border-white/10'}`}>
                  {step > s.id ? <FiCheckCircle /> : s.icon}
                </div>
                <span className="text-sm font-medium">{s.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="w-full md:w-2/3 p-8 md:p-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-3xl font-bold mb-2">{steps[step - 1].name}</h1>
              <p className="text-white/50 mb-8">Step {step} of 8: Please provide your details below.</p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                {step === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Full Name" name="full_name" value={formData.full_name} onChange={handleInputChange} placeholder="John Doe" />
                    <div>
                      <InputField label="Email" name="email" type="email" value={formData.email} onChange={handleInputChange} onBlur={checkEmailAvailability} placeholder="john@company.com" />
                      {emailStatus === 'checking' && <p className="text-[11px] text-white/40 mt-1">Checking availability…</p>}
                      {emailStatus === 'available' && <p className="text-[11px] text-emerald-400 mt-1">✓ Email is available</p>}
                      {emailStatus === 'taken' && <p className="text-[11px] text-red-400 mt-1">✕ Email is already registered</p>}
                    </div>
                    <InputField label="Phone" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+91 9876543210" />
                    <InputField label="Company Name" name="company_name" value={formData.company_name} onChange={handleInputChange} placeholder="Acme Corp" />
                    <div>
                      <InputField label="GST Number" name="gst_number" value={formData.gst_number} onChange={handleInputChange} placeholder="Optional (15-char GSTIN)" />
                      {!gstValid && <p className="text-[11px] text-red-400 mt-1">Invalid GSTIN format</p>}
                    </div>
                    <InputField label="PAN Number" name="pan_number" value={formData.pan_number} onChange={handleInputChange} placeholder="ABCDE1234F" />
                    <div>
                      <InputField label="Password" name="password" type="password" value={formData.password} onChange={handleInputChange} placeholder="••••••••" />
                      {formData.password && (
                        <div className="mt-1.5">
                          <div className="flex gap-1">
                            {[0, 1, 2].map((i) => (
                              <div key={i} className={`h-1 flex-1 rounded-full ${i < pwScore ? (pwScore === 3 ? 'bg-emerald-400' : 'bg-yellow-400') : 'bg-white/10'}`} />
                            ))}
                          </div>
                          <p className="text-[11px] text-white/40 mt-1">
                            {pwChecks.length ? '✓' : '•'} 8+ chars &nbsp; {pwChecks.upper ? '✓' : '•'} uppercase &nbsp; {pwChecks.number ? '✓' : '•'} number
                          </p>
                        </div>
                      )}
                    </div>
                    <InputField label="Referral Code" name="referral_code" value={formData.referral_code} onChange={handleInputChange} placeholder="Optional" />
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4 text-center py-8">
                    <p className="text-white/60">We've sent a 6-digit code to <span className="text-white font-bold">{formData.email}</span></p>
                    <div className="flex justify-center gap-2">
                      <input 
                        className="w-full max-w-[200px] bg-white/5 border border-white/10 rounded-xl p-4 text-center text-2xl tracking-[1em] focus:outline-none focus:border-blue-500/50"
                        maxLength="6"
                        name="otp"
                        value={formData.otp}
                        onChange={handleInputChange}
                        autoFocus
                      />
                    </div>
                    <button type="button" onClick={resendOtp} className="text-blue-400 text-sm hover:underline">Resend OTP</button>
                  </div>
                )}

                {step === 3 && (
                  <div className="grid grid-cols-1 gap-4">
                    <SelectField
                      label="Business Type"
                      name="business_type"
                      value={formData.business_type}
                      onChange={handleInputChange}
                      options={[
                        { value: 'PROPRIETORSHIP', label: 'Proprietorship' },
                        { value: 'PVT_LTD', label: 'Private Limited' },
                        { value: 'LLP', label: 'LLP' },
                        { value: 'PARTNERSHIP', label: 'Partnership' },
                        { value: 'OTHER', label: 'Other' },
                      ]}
                    />
                    <InputField label="Industry" name="industry" value={formData.industry} onChange={handleInputChange} placeholder="e.g. Fashion, Electronics" />
                    <SelectField 
                      label="Monthly Shipment Volume" 
                      name="monthly_shipment_volume" 
                      value={formData.monthly_shipment_volume} 
                      onChange={handleInputChange}
                      options={['<100', '100-500', '500-2000', '2000-10000', '10000+']}
                    />
                    <InputField label="Website URL" name="website_url" value={formData.website_url} onChange={handleInputChange} placeholder="https://..." />
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-6">
                    <SelectField 
                      label="Document Type" 
                      name="document_type" 
                      value={formData.document_type} 
                      onChange={handleInputChange}
                      options={['PAN', 'GST Certificate', 'Aadhaar', 'Company Registration']}
                    />
                    <InputField label="Document Number" name="document_number" value={formData.document_number} onChange={handleInputChange} placeholder="Enter ID number" />
                    <div className="border-2 border-dashed border-white/10 rounded-2xl p-12 text-center hover:border-blue-500/30 transition-colors cursor-pointer group">
                      <FiUploadCloud className="mx-auto text-4xl text-white/20 group-hover:text-blue-400 transition-colors mb-4" />
                      <p className="text-white/60">Click or drag to upload document</p>
                      <p className="text-white/20 text-xs mt-2">PDF, JPG, PNG (Max 5MB)</p>
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Account Holder Name" name="account_holder" value={formData.account_holder} onChange={handleInputChange} />
                    <InputField label="Bank Name" name="bank_name" value={formData.bank_name} onChange={handleInputChange} />
                    <InputField label="Account Number" name="account_number" value={formData.account_number} onChange={handleInputChange} />
                    <InputField label="IFSC Code" name="ifsc_code" value={formData.ifsc_code} onChange={handleInputChange} />
                    <div className="md:col-span-2">
                      <SelectField label="Account Type" name="account_type" value={formData.account_type} onChange={handleInputChange} options={[{ value: 'SAVINGS', label: 'Savings' }, { value: 'CURRENT', label: 'Current' }]} />
                    </div>
                  </div>
                )}

                {step === 6 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <InputField label="Location Name" name="location_name" value={formData.location_name} onChange={handleInputChange} placeholder="e.g. Mumbai Warehouse" />
                    </div>
                    <InputField label="Contact Person" name="contact_person" value={formData.contact_person} onChange={handleInputChange} />
                    <InputField label="Contact Phone" name="contact_phone" value={formData.contact_phone} onChange={handleInputChange} />
                    <div className="md:col-span-2">
                      <InputField label="Address Line 1" name="address_line1" value={formData.address_line1} onChange={handleInputChange} />
                    </div>
                    <InputField label="City" name="city" value={formData.city} onChange={handleInputChange} />
                    <InputField label="State" name="state" value={formData.state} onChange={handleInputChange} />
                    <InputField label="Pincode" name="pincode" value={formData.pincode} onChange={handleInputChange} />
                  </div>
                )}

                {step === 7 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { name: 'Starter', price: 'Free', features: '2 couriers, basic reports' },
                      { name: 'Growth', price: '₹2,999/m', features: '5 couriers, NDR WhatsApp' },
                      { name: 'Pro', price: '₹7,999/m', features: 'All couriers, AI selector' },
                      { name: 'Enterprise', price: 'Custom', features: 'All AI features, support' }
                    ].map(p => (
                      <div 
                        key={p.name}
                        onClick={() => setFormData(prev => ({ ...prev, plan_name: p.name }))}
                        className={`p-6 rounded-2xl border transition-all cursor-pointer ${formData.plan_name === p.name ? 'bg-blue-500/10 border-blue-500/50' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                      >
                        <h3 className="font-bold text-lg">{p.name}</h3>
                        <p className="text-blue-400 font-bold my-2">{p.price}</p>
                        <p className="text-white/40 text-xs">{p.features}</p>
                      </div>
                    ))}
                  </div>
                )}

                {step === 8 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-2xl">
                        <FiCheckCircle />
                      </div>
                      <div>
                        <h3 className="font-bold">Onboarding Complete!</h3>
                        <p className="text-emerald-400/60 text-sm">Your account is being reviewed.</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-white/40 mb-4">Next Steps:</p>
                      <StepBadge text="Integration setup" done />
                      <StepBadge text="Wallet recharge" />
                      <StepBadge text="First shipment" />
                    </div>
                  </div>
                )}

                <div className="pt-8 flex justify-between gap-4">
                  {step > 1 && step < 8 && (
                    <button 
                      type="button" 
                      onClick={prevStep}
                      className="flex-1 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-bold flex items-center justify-center gap-2"
                    >
                      <FiChevronLeft /> Back
                    </button>
                  )}
                  <button 
                    type="submit" 
                    disabled={loading}
                    className={`flex-[2] px-6 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 hover:scale-[1.02] active:scale-[0.98] transition-all font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loading ? 'Processing...' : step === 8 ? 'Go to Dashboard' : 'Continue'} 
                    {!loading && <FiChevronRight />}
                  </button>
                </div>
              </form>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const InputField = ({ label, ...props }) => (
  <div className="space-y-2">
    <label className="text-xs font-bold text-white/40 uppercase tracking-wider">{label}</label>
    <input 
      {...props}
      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all text-white placeholder:text-white/20"
    />
  </div>
);

const SelectField = ({ label, options, ...props }) => (
  <div className="space-y-2">
    <label className="text-xs font-bold text-white/40 uppercase tracking-wider">{label}</label>
    <select
      {...props}
      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all text-white"
    >
      <option value="" disabled>Select {label}</option>
      {options.map((o) => {
        const value = typeof o === 'object' ? o.value : o;
        const text = typeof o === 'object' ? o.label : o;
        return <option key={value} value={value} className="bg-[#1a1b2e]">{text}</option>;
      })}
    </select>
  </div>
);

const StepBadge = ({ text, done }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/20'}`}>
      <FiCheckCircle />
    </div>
    <span className={`text-sm ${done ? 'text-white' : 'text-white/30'}`}>{text}</span>
  </div>
);

export default Onboarding;
