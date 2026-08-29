import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus,
  FiTrash2,
  FiActivity,
  FiSettings,
  FiCheckCircle,
  FiAlertCircle,
  FiChevronRight,
  FiKey,
  FiLock,
  FiExternalLink,
  FiZap,
  FiDatabase,
  FiCpu,
} from 'react-icons/fi';
import { MapPin } from 'lucide-react';
import { CarrierService, CourierService, unwrap, MerchantService } from '../services/api';

// Courier catalog and carrier-specific configuration.
const DIRECT_COURIER_CATALOG = [
  { name: 'Blue Dart', code: 'BLUEDART', capabilities: ['Forward', 'Return', 'NDR'], initials: 'BD', supportsLiveProducts: true },
  { name: 'Delhivery', code: 'DELHIVERY', capabilities: ['Forward', 'Return', 'NDR'], initials: 'DE' },
  { name: 'Xpressbees', code: 'XPRESSBEES', capabilities: ['Forward', 'Return', 'NDR'], initials: 'XB' },
  { name: 'DTDC', code: 'DTDC', capabilities: ['Forward', 'Return', 'NDR'], initials: 'DT' },
  { name: 'Shree Maruti', code: 'SHREE_MARUTI', capabilities: ['Forward', 'Return', 'NDR'], initials: 'SM' },
  { name: 'Trackon', code: 'TRACKON', capabilities: ['Forward'], initials: 'TR' },
  { name: 'Ecom Express', code: 'ECOM_EXPRESS', capabilities: ['Forward', 'Return', 'NDR'], initials: 'EE' },
  { name: 'Ekart', code: 'EKART', capabilities: ['Forward', 'Return'], initials: 'EK' },
  { name: 'Shadowfax', code: 'SHADOWFAX', capabilities: ['Forward', 'Return', 'NDR'], initials: 'SF' },
  { name: 'India Post', code: 'INDIA_POST', capabilities: ['Forward', 'Return'], initials: 'IP' },
];

const BLUEDART_SERVICE_OPTIONS = [
  { value: 'Domestic Priority', label: 'Domestic Priority' },
  { value: 'Ground', label: 'Ground' },
  { value: 'Air/Apex', label: 'Air/Apex' },
  { value: 'Air/Apex (SubProduct = Empty)', label: 'Air/Apex (SubProduct = Empty)' },
  { value: 'Ground B2B (SubProduct = Empty)', label: 'Ground B2B (SubProduct = Empty)' },
  { value: 'eTail COD Air', label: 'eTail COD Air' },
  { value: 'eTail COD Ground', label: 'eTail COD Ground' },
  { value: 'eTail Prepaid Air', label: 'eTail Prepaid Air' },
  { value: 'eTail Ground', label: 'eTail Ground' },
  { value: 'Dart Plus', label: 'Dart Plus' },
  { value: 'Apex Critical Prepaid', label: 'Apex Critical Prepaid' },
  { value: 'Apex Critical COD', label: 'Apex Critical COD' },
  { value: 'Apex Economy', label: 'Apex Economy' },
];

const DEFAULT_FORM = {
  profile_name: '',
  account_mode: 'PRODUCTION',
  login_id: '',
  license_key: '',
  tracking_license_key: '',
  vendor_code: '',
  origin_area: '',
  customer_code_prepaid: '',
  customer_code_cod: '',
  customer_code: '',
  default_service: 'Domestic Priority',
  is_to_pay_customer: false,
  gst_igst_sharing: false,
  postal_validation_mode: 'STRICT',
  auto_pickup: false,
  otp_delivery: false,
  escalation_delivery: false,
  shipper_name: '',
  shipper_mobile: '',
  shipper_address: '',
  shipper_pincode: '',
  api_token: '',
  client_name_number: '',
  warehouse_name: '',
  warehouse_pincode: '',
  seller_gstin: '',
  api_user_email: '',
  api_user_password: '',
  secret_key: '',
  channel_id: '',
  default_pickup_pincode: '',
  x_access_token: '',
  username: '',
  password: '',
  hand_over_mode: 'Pickup',
  merchant_code: '',
  authorization_header: '',
  service_code: 'Regular',
  reverse_service_code: '',
  live_mode: true,
  authentication_mode: 'TOKEN',
  client_id: '',
  client_secret: '',
  customer_id: '',
  bulk_customer_contract_number: '',
  booking_office_id: '',
  whitelisted_public_ip: '',
  service_type: '',
  shipping_mode: 'SURFACE',
  allow_cod: true,
  label_type: 'A4',
  integrated: false,
};

const cloneDefaultForm = () => ({ ...DEFAULT_FORM });

const getCarrierInitials = (carrier) => {
  if (!carrier) return 'CO';
  return carrier.initials || DIRECT_COURIER_CATALOG.find((x) => x.code === carrier.code)?.initials ||
    (carrier.name || carrier.code || 'CO').split(/\s+/).map((x) => x[0]).join('').slice(0, 2).toUpperCase();
};

const getCapabilities = (carrier) => carrier?.capabilities || DIRECT_COURIER_CATALOG.find((x) => x.code === carrier?.code)?.capabilities || ['Forward'];

const getCarrierCode = (carrier) => String(carrier?.code || '').toUpperCase();

// Keep form field component identities stable. These MUST live outside
// CourierSettings; defining them inside the component remounts the input
// after every state update and causes the one-keystroke typing bug.
const Field = ({ label, value, onChange, type = 'text', placeholder = '', required = false, disabled = false }) => (
  <div>
    <label className="text-sm font-semibold text-main mb-1.5 block">
      {label}{required ? ' *' : ''}
    </label>
    <input
      type={type}
      className="input-field w-full"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
    />
  </div>
);

const SelectField = ({ label, value, onChange, options, required = false }) => (
  <div>
    <label className="text-sm font-semibold text-main mb-1.5 block">
      {label}{required ? ' *' : ''}
    </label>
    <select className="input-field w-full" value={value ?? ''} onChange={(e) => onChange(e.target.value)} required={required}>
      {options.map((option) => (
        <option key={option.value ?? option} value={option.value ?? option}>
          {option.label ?? option}
        </option>
      ))}
    </select>
  </div>
);

const CheckField = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-2.5 cursor-pointer select-none rounded-lg py-2">
    <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 rounded accent-primary" />
    <span className="text-sm font-medium text-main">{label}</span>
  </label>
);


const CourierSettings = () => {
  const [catalog, setCatalog] = useState([]);
  const [configured, setConfigured] = useState([]);

  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedCarrier, setSelectedCarrier] = useState(null);

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [activeTab, setActiveTab] = useState('DIRECT');
  const [searchQuery, setSearchQuery] = useState('');
  const [capabilityFilter, setCapabilityFilter] = useState('All Capabilities');

  const [liveProducts, setLiveProducts] = useState(null); // null = not fetched, [] = fetched empty/failed
  const [fetchingProducts, setFetchingProducts] = useState(false);
  const [productsError, setProductsError] = useState(null);

  const [formData, setFormData] = useState(cloneDefaultForm());

  // Pickup locations
  const [pickupLocations, setPickupLocations] = useState([]);
  const [pickupLoading, setPickupLoading] = useState(true);
  const [pickupError, setPickupError] = useState(null);
  const [pickupFormOpen, setPickupFormOpen] = useState(false);
  const [editingPickup, setEditingPickup] = useState(null);
  const [pickupForm, setPickupForm] = useState({
    name: '',
    contact_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    pincode: '',
    is_default: false,
  });
  const [pickupSaving, setPickupSaving] = useState(false);
  const [pickupSaveError, setPickupSaveError] = useState(null);

  const fetchData = useCallback(() => {
    CarrierService.list()
      .then(({ data }) => setCatalog(unwrap(data)))
      .catch(() => setCatalog([]));

    CourierService.list()
      .then(({ data }) => setConfigured(unwrap(data)))
      .catch(() => setConfigured([]));
  }, []);

  useEffect(() => {
    fetchData();
    loadPickupLocations();
  }, [fetchData]);

  const resetWizard = () => {
    setShowWizard(false);
    setWizardStep(1);
    setSelectedCarrier(null);
    setTestResult(null);
    setSaveError(null);
    setLiveProducts(null);
    setProductsError(null);
    setFormData(cloneDefaultForm());
  };

  const setField = (k, v) => {
    setFormData((f) => ({ ...f, [k]: typeof v === 'function' ? v(f[k]) : v }));
    setSaveError(null);
  };

  const isBlueDart = getCarrierCode(selectedCarrier) === 'BLUEDART';
  const serviceOptions = isBlueDart
    ? (() => {
        const live = liveProducts && liveProducts.length > 0
          ? liveProducts.map((p) => ({ value: p.product_name, label: p.product_name }))
          : [];
        const seen = new Set(live.map((x) => x.value));
        const dartPlus = BLUEDART_SERVICE_OPTIONS.find((x) => x.value === 'Dart Plus');
        if (dartPlus && !seen.has(dartPlus.value)) live.push(dartPlus);
        BLUEDART_SERVICE_OPTIONS.forEach((item) => {
          if (!seen.has(item.value)) {
            // Keep the full standard list available even when the live response is partial.
            live.push(item);
          }
        });
        return live;
      })()
    : [];

  const fetchLiveProducts = async () => {
    if (!selectedCarrier || !isBlueDart || !formData.login_id || !formData.license_key) return;
    setFetchingProducts(true);
    setProductsError(null);
    try {
      const { data } = await CourierService.fetchUnsavedProducts({
        carrier: selectedCarrier.id,
        login_id: formData.login_id,
        license_key: formData.license_key,
        tracking_license_key: formData.tracking_license_key || formData.license_key,
        customer_code: formData.customer_code || formData.customer_code_prepaid || formData.customer_code_cod,
        origin_area: formData.origin_area,
        default_service: formData.default_service,
        shipper_name: formData.shipper_name,
        shipper_mobile: formData.shipper_mobile,
        shipper_address: formData.shipper_address,
        shipper_pincode: formData.shipper_pincode,
      });
      const products = data.products || [];
      setLiveProducts(products);
      if (products.length > 0 && !products.some((p) => p.product_name === formData.default_service)) {
        setField('default_service', products[0].product_name);
      }
    } catch (err) {
      setProductsError(err.response?.data?.detail || 'Could not fetch live services.');
      setLiveProducts([]);
    } finally {
      setFetchingProducts(false);
    }
  };

  const getRequiredFields = (code) => {
    const required = {
      BLUEDART: ['profile_name', 'login_id', 'license_key'],
      DELHIVERY: ['api_token', 'warehouse_name', 'warehouse_pincode'],
      XPRESSBEES: ['api_user_email', 'api_user_password', 'secret_key'],
      DTDC: ['api_token', 'x_access_token', 'customer_code'],
      SHREE_MARUTI: ['username', 'password'],
      TRACKON: ['username', 'api_token'],
      ECOM_EXPRESS: ['username', 'password'],
      EKART: ['merchant_code', 'authorization_header'],
      SHADOWFAX: [],
      INDIA_POST: ['username', 'password', 'customer_id', 'bulk_customer_contract_number'],
    };
    return required[code] || [];
  };

  const validateCarrierForm = () => {
    const code = getCarrierCode(selectedCarrier);
    const required = getRequiredFields(code);
    if (code === 'SHADOWFAX') {
      if (formData.authentication_mode === 'TOKEN' && !formData.api_token.trim()) return 'API Token is required.';
      if (formData.authentication_mode === 'OAUTH2' && (!formData.client_id.trim() || !formData.client_secret.trim())) {
        return 'Client ID and Client Secret are required for OAuth2.';
      }
    }
    const missing = required.filter((field) => !String(formData[field] ?? '').trim());
    if (missing.length > 0) return `${missing.map((x) => x.replaceAll('_', ' ')).join(', ')} ${missing.length === 1 ? 'is' : 'are'} required.`;
    return null;
  };

  const handleTestConnection = () => {
    const validation = validateCarrierForm();
    setTesting(true);
    setTestResult(null);
    window.setTimeout(() => {
      if (validation) {
        setTestResult({ success: false, message: validation });
      } else {
        setTestResult({ success: true, message: 'Credentials look valid. Live connection test runs after save.' });
      }
      setTesting(false);
    }, 300);
  };


  const handleSaveIntegration = async () => {
    if (!selectedCarrier) return;

    setSaveError(null);

    const validation = validateCarrierForm();
    if (validation) {
      setSaveError(validation);
      return;
    }

    let carrierForSave = selectedCarrier;

    if (!carrierForSave.id || !Number.isFinite(Number(carrierForSave.id))) {
      // Don't trust a stale/null id yet — re-check against the backend once
      // before giving up, in case the carrier was provisioned after the
      // catalog was first loaded.
      try {
        const { data } = await CarrierService.list();
        const freshCatalog = unwrap(data) || [];
        const code = getCarrierCode(selectedCarrier);
        const fresh = freshCatalog.find((c) => getCarrierCode(c) === code);
        if (fresh?.id && Number.isFinite(Number(fresh.id))) {
          carrierForSave = { ...selectedCarrier, ...fresh };
          setSelectedCarrier(carrierForSave);
          setCatalog(freshCatalog);
        }
      } catch {
        // Ignore — falls through to the same "not provisioned" error below.
      }
    }

    if (!carrierForSave.id || !Number.isFinite(Number(carrierForSave.id))) {
      setSaveError(
        `${carrierForSave.name || 'This courier'} is visible in the catalog but is not provisioned in the backend carrier catalog yet (no "${getCarrierCode(carrierForSave)}" entry with a valid id was returned by /carriers). Add it in the backend carrier catalog, then reopen this form — no changes were saved.`
      );
      return;
    }

    setLoading(true);
    try {
      const selectedCarrier = carrierForSave;
      const code = getCarrierCode(selectedCarrier);
      let payload;

      if (code === 'BLUEDART') {
        const isDartPlus = formData.default_service === 'Dart Plus';
        payload = {
          carrier: selectedCarrier.id,
          profile_name: formData.profile_name,
          account_mode: formData.account_mode,
          login_id: formData.login_id,
          license_key: formData.license_key,
          tracking_license_key: formData.tracking_license_key || formData.license_key,
          vendor_code: formData.vendor_code,
          origin_area: formData.origin_area,
          customer_code_prepaid: formData.customer_code_prepaid,
          customer_code_cod: formData.customer_code_cod,
          customer_code: formData.customer_code || formData.customer_code_prepaid || formData.customer_code_cod,
          default_service: formData.default_service,
          product_code: isDartPlus ? 'A' : '',
          sub_product_code: isDartPlus ? 'DART PLUS' : '',
          pack_type: isDartPlus ? 'L' : '',
          is_to_pay_customer: formData.is_to_pay_customer,
          gst_igst_sharing: formData.gst_igst_sharing,
          postal_validation_mode: formData.postal_validation_mode,
          auto_pickup: formData.auto_pickup,
          allow_cod: formData.allow_cod,
          label_type: formData.label_type,
          otp_delivery: formData.otp_delivery,
          escalation_delivery: formData.escalation_delivery,
          shipper_name: formData.shipper_name,
          shipper_mobile: formData.shipper_mobile,
          shipper_address: formData.shipper_address,
          shipper_pincode: formData.shipper_pincode,
          shipping_mode: formData.shipping_mode,
        };
      } else if (code === 'DELHIVERY') {
        payload = {
          carrier: selectedCarrier.id,
          account_mode: formData.account_mode,
          api_token: formData.api_token,
          client_name_number: formData.client_name_number,
          warehouse_name: formData.warehouse_name,
          warehouse_pincode: formData.warehouse_pincode,
          service_type: formData.service_type || 'Surface',
          seller_gstin: formData.seller_gstin,
          allow_cod: formData.allow_cod,
          label_type: formData.label_type,
        };
      } else if (code === 'XPRESSBEES') {
        payload = {
          carrier: selectedCarrier.id,
          account_mode: formData.account_mode,
          api_user_email: formData.api_user_email,
          api_user_password: formData.api_user_password,
          secret_key: formData.secret_key,
          channel_id: formData.channel_id,
          default_pickup_pincode: formData.default_pickup_pincode,
          service_type: formData.service_type || 'Surface',
          allow_cod: formData.allow_cod,
          label_type: formData.label_type,
        };
      } else if (code === 'DTDC') {
        payload = {
          carrier: selectedCarrier.id,
          account_mode: formData.account_mode,
          api_token: formData.api_token,
          x_access_token: formData.x_access_token,
          customer_code: formData.customer_code,
          username: formData.username,
          password: formData.password,
          origin_area: formData.origin_area,
          service_type: formData.service_type || 'Domestic Express (PTP)',
          allow_cod: formData.allow_cod,
          label_type: formData.label_type,
        };
      } else if (code === 'SHREE_MARUTI') {
        payload = {
          carrier: selectedCarrier.id,
          account_mode: formData.account_mode,
          username: formData.username,
          password: formData.password,
          origin_area: formData.origin_area,
          service_type: formData.service_type || 'Air',
          hand_over_mode: formData.hand_over_mode,
          allow_cod: formData.allow_cod,
          label_type: formData.label_type,
        };
      } else if (code === 'TRACKON') {
        payload = {
          carrier: selectedCarrier.id,
          account_mode: formData.account_mode,
          username: formData.username,
          api_token: formData.api_token,
          origin_area: formData.origin_area,
          service_type: formData.service_type || 'Surface',
          allow_cod: formData.allow_cod,
          label_type: formData.label_type,
        };
      } else if (code === 'ECOM_EXPRESS') {
        payload = {
          carrier: selectedCarrier.id,
          account_mode: formData.account_mode,
          username: formData.username,
          password: formData.password,
          origin_area: formData.origin_area,
          service_type: formData.service_type || 'EXPP Express',
          allow_cod: formData.allow_cod,
          label_type: formData.label_type,
        };
      } else if (code === 'EKART') {
        payload = {
          carrier: selectedCarrier.id,
          account_mode: formData.account_mode,
          merchant_code: formData.merchant_code,
          authorization_header: formData.authorization_header,
          service_code: formData.service_code,
          reverse_service_code: formData.reverse_service_code,
          origin_area: formData.origin_area,
          live_mode: formData.live_mode,
          allow_cod: formData.allow_cod,
          label_type: formData.label_type,
        };
      } else if (code === 'SHADOWFAX') {
        payload = {
          carrier: selectedCarrier.id,
          account_mode: formData.account_mode,
          authentication_mode: formData.authentication_mode,
          ...(formData.authentication_mode === 'TOKEN'
            ? { api_token: formData.api_token }
            : { client_id: formData.client_id, client_secret: formData.client_secret }),
          origin_area: formData.origin_area,
          allow_cod: formData.allow_cod,
          label_type: formData.label_type,
        };
      } else if (code === 'INDIA_POST') {
        payload = {
          carrier: selectedCarrier.id,
          account_mode: formData.account_mode,
          username: formData.username,
          password: formData.password,
          customer_id: formData.customer_id,
          bulk_customer_contract_number: formData.bulk_customer_contract_number,
          booking_office_id: formData.booking_office_id,
          service_type: formData.service_type || 'Speed Post',
          whitelisted_public_ip: formData.whitelisted_public_ip,
          allow_cod: formData.allow_cod,
          label_type: formData.label_type,
        };
      } else {
        payload = { carrier: selectedCarrier.id };
      }

      // First profile for a carrier becomes the default automatically.
      // Additional profiles are saved normally and can be made default from the UI.
      const alreadyConfiguredForCarrier = configured.some((item) =>
        Number(item.carrier) === Number(selectedCarrier.id) ||
        item.carrier_code === code ||
        getCarrierCode(item.carrier) === code
      );
      payload.is_default = !alreadyConfiguredForCarrier;

      const { data } = await CourierService.add(payload);

      try {
        await CourierService.test(data.id);
      } catch {
        // Non-fatal: configuration remains saved so the user can inspect the response/status.
      }

      resetWizard();
      fetchData();
    } catch (err) {
      const body = err.response?.data;
      let message = 'Failed to save courier.';
      if (typeof body === 'string') {
        message = body;
      } else if (Array.isArray(body)) {
        message = body.join(' ');
      } else if (body && typeof body === 'object') {
        const parts = Object.entries(body).map(
          ([field, errs]) => `${field}: ${Array.isArray(errs) ? errs.join(', ') : errs}`
        );
        message = parts.length > 0 ? parts.join(' | ') : message;
      }
      setSaveError(message);
    } finally {
      setLoading(false);
    }
  };


  const handleDelete = async (id) => {
    if (!window.confirm('Remove this courier configuration?')) return;
    try {
      await CourierService.remove(id);
      fetchData();
    } catch (err) {
      alert(
        err.response?.data?.[0] || err.response?.data?.detail || 'Failed to delete courier.',
      );
    }
  };

  // Set one profile as the default for this merchant + carrier.
  // The backend clears the previous default for the same carrier.
  const handleSetDefault = async (id) => {
    const target = configured.find((item) => Number(item.id) === Number(id));
    if (!target || target.is_default) return;

    try {
      await CourierService.update(id, { is_default: true });
      await fetchData();
    } catch (err) {
      const body = err.response?.data;
      const message = body?.detail ||
        (body && typeof body === 'object'
          ? Object.entries(body).map(([field, errors]) =>
              `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`
            ).join(' | ')
          : null) ||
        'Failed to set default courier profile.';
      alert(message);
    }
  };

  // Pickup helpers
  const loadPickupLocations = () => {
    setPickupLoading(true);
    setPickupError(null);
    MerchantService.listPickupLocations()
      .then(({ data }) => {
        const list = Array.isArray(data?.results) ? data.results : data;
        setPickupLocations(list || []);
      })
      .catch((err) => {
        setPickupError(err.response?.data?.detail || 'Unable to load pickup locations');
      })
      .finally(() => setPickupLoading(false));
  };

  const openPickupCreate = () => {
    setEditingPickup(null);
    setPickupForm({
      name: '',
      contact_name: '',
      phone: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      pincode: '',
      is_default: pickupLocations.length === 0,
    });
    setPickupSaveError(null);
    setPickupFormOpen(true);
  };

  const openPickupEdit = (loc) => {
    setEditingPickup(loc);
    setPickupForm({
      name: loc.name || '',
      contact_name: loc.contact_name || '',
      phone: loc.phone || '',
      address_line1: loc.address_line1 || '',
      address_line2: loc.address_line2 || '',
      city: loc.city || '',
      state: loc.state || '',
      pincode: loc.pincode || '',
      is_default: !!loc.is_default,
    });
    setPickupSaveError(null);
    setPickupFormOpen(true);
  };

  const setPickupField = (k, v) => {
    setPickupForm((prev) => ({ ...prev, [k]: v }));
  };

  const savePickup = async (e) => {
    e.preventDefault();
    setPickupSaving(true);
    setPickupSaveError(null);
    const payload = {
      location_name: pickupForm.name,
      contact_person: pickupForm.contact_name,
      contact_phone: pickupForm.phone,
      address_line1: pickupForm.address_line1,
      address_line2: pickupForm.address_line2 || null,
      city: pickupForm.city,
      state: pickupForm.state,
      pincode: pickupForm.pincode,
      is_default: pickupForm.is_default,
    };
    try {
      if (editingPickup) {
        await MerchantService.updatePickupLocation(editingPickup.id, payload);
      } else {
        await MerchantService.addPickupLocation(payload);
      }
      setPickupFormOpen(false);
      setEditingPickup(null);
      loadPickupLocations();
    } catch (err) {
      const data = err.response?.data;
      setPickupSaveError(
        typeof data === 'object' ? JSON.stringify(data) : (data?.detail || err.message),
      );
    } finally {
      setPickupSaving(false);
    }
  };

  const deletePickup = async (loc) => {
    if (!window.confirm('Remove this pickup location?')) return;
    try {
      await MerchantService.deletePickupLocation(loc.id);
      loadPickupLocations();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete pickup location.');
    }
  };

  const setDefaultPickup = async (loc) => {
    try {
      await MerchantService.setDefaultPickupLocation(loc.id);
      loadPickupLocations();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to set default pickup location.');
    }
  };

  const mergedCatalog = (() => {
    const actual = Array.isArray(catalog) ? catalog : [];
    const byCode = new Map(actual.map((carrier) => [getCarrierCode(carrier), carrier]));
    return DIRECT_COURIER_CATALOG.map((item) => {
      const existing = byCode.get(item.code);
      return existing ? { ...item, ...existing, initials: item.initials } : { ...item, id: null };
    }).concat(actual.filter((carrier) => !DIRECT_COURIER_CATALOG.some((item) => item.code === getCarrierCode(carrier))));
  })();

  const visibleCatalog = mergedCatalog.filter((carrier) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q || `${carrier.name || ''} ${carrier.code || ''}`.toLowerCase().includes(q);
    const capabilities = getCapabilities(carrier);
    const matchesCapability = capabilityFilter === 'All Capabilities' || capabilities.includes(capabilityFilter);
    return matchesSearch && matchesCapability;
  });

  const openCarrierWizard = (carrier) => {
    setSelectedCarrier(carrier);
    setWizardStep(2);
    setShowWizard(true);
    setTestResult(null);
    setSaveError(null);
    setLiveProducts(null);
    setProductsError(null);
    setFormData(cloneDefaultForm());
    // Catalog may have been provisioned on the backend after this page first
    // loaded (e.g. Blue Dart just added). Refresh so `selectedCarrier.id`
    // isn't a stale `null` from an earlier fetch.
    fetchData();
  };

  const openAddCourierWizard = () => {
    setSelectedCarrier(null);
    setWizardStep(1);
    setShowWizard(true);
    setTestResult(null);
    setSaveError(null);
    setLiveProducts(null);
    setProductsError(null);
    setFormData(cloneDefaultForm());
    fetchData();
  };

  const configuredForCode = (code) => configured.filter((c) => getCarrierCode(c.carrier_code ? { code: c.carrier_code } : c.carrier) === code || getCarrierCode(c.carrier) === code || c.carrier_code === code);

  const renderCarrierFields = () => {
    const code = getCarrierCode(selectedCarrier);
    const common = (
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField label="Account Mode" value={formData.account_mode} onChange={(v) => setField('account_mode', v)} options={[{ value: 'PRODUCTION', label: 'Production Server' }, { value: 'STAGING', label: 'Staging Server' }]} />
        </div>
      </div>
    );

    if (code === 'BLUEDART') {
      const isDartPlus = formData.default_service === 'Dart Plus';
      return (
        <div className="space-y-7">
          {common}
          <div className="space-y-4">
            <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Profile & Access</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Profile Name" required value={formData.profile_name} onChange={(v) => setField('profile_name', v)} placeholder="Profile name" />
              <Field label="Login ID" required value={formData.login_id} onChange={(v) => setField('login_id', v)} placeholder="Blue Dart Login ID" />
              <Field label="License Key" required type="password" value={formData.license_key} onChange={(v) => setField('license_key', v)} placeholder="License Key" />
              <Field label="Tracking License Key" type="password" value={formData.tracking_license_key} onChange={(v) => setField('tracking_license_key', v)} placeholder="Tracking License Key" />
              <Field label="Vendor Code" value={formData.vendor_code} onChange={(v) => setField('vendor_code', v)} placeholder="Vendor Code" />
              <Field label="Origin Area" value={formData.origin_area} onChange={(v) => setField('origin_area', v)} placeholder="Origin Area" />
              <Field label="Customer Code (Pre-Paid)" value={formData.customer_code_prepaid} onChange={(v) => setField('customer_code_prepaid', v)} placeholder="Pre-Paid Customer Code" />
              <Field label="Customer Code (COD)" value={formData.customer_code_cod} onChange={(v) => setField('customer_code_cod', v)} placeholder="COD Customer Code" />
              <Field label="Customer Code" value={formData.customer_code} onChange={(v) => setField('customer_code', v)} placeholder="Primary Customer Code" />
              <SelectField label="Service Type" value={formData.default_service} onChange={(v) => setField('default_service', v)} options={serviceOptions.length ? serviceOptions : BLUEDART_SERVICE_OPTIONS} required />
            </div>
            {isDartPlus && (
              <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary leading-relaxed">
                Dart Plus is a Blue Dart service. It will be booked with Product Code <strong>A</strong>, SubProduct <strong>DART PLUS</strong>, and Pack Type <strong>L</strong>.
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <CheckField label="Is To Pay Customer" checked={formData.is_to_pay_customer} onChange={(v) => setField('is_to_pay_customer', v)} />
              <CheckField label="GST/IGST data sharing" checked={formData.gst_igst_sharing} onChange={(v) => setField('gst_igst_sharing', v)} />
              <CheckField label="Auto Pickup" checked={formData.auto_pickup} onChange={(v) => setField('auto_pickup', v)} />
              <CheckField label="Escalation delivery" checked={formData.escalation_delivery} onChange={(v) => setField('escalation_delivery', v)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField label="Postal-code validation mode" value={formData.postal_validation_mode} onChange={(v) => setField('postal_validation_mode', v)} options={[{ value: 'STRICT', label: 'Strict' }, { value: 'WARN', label: 'Warn only' }, { value: 'OFF', label: 'Disabled' }]} />
              <SelectField label="Label Type" value={formData.label_type} onChange={(v) => setField('label_type', v)} options={[{ value: 'A4', label: 'A4' }, { value: 'THERMAL', label: 'Thermal' }]} />
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Blue Dart Services</p>
            <SelectField label="Service Type" value={formData.default_service} onChange={(v) => setField('default_service', v)} options={serviceOptions.length ? serviceOptions : BLUEDART_SERVICE_OPTIONS} required />
            <button type="button" onClick={fetchLiveProducts} disabled={fetchingProducts || !formData.login_id || !formData.license_key} className="w-full py-2.5 rounded-lg text-sm font-semibold border border-border text-main hover:border-primary/50 hover:shadow-neon transition-all disabled:opacity-40">
              {fetchingProducts ? 'Fetching Live Services…' : 'Fetch Live Services'}
            </button>
            {liveProducts && liveProducts.length > 0 && (
              <p className="text-xs text-success flex items-center gap-1"><FiCheckCircle className="w-3.5 h-3.5" /> Live services loaded. Dart Plus remains available.</p>
            )}
            {productsError && (
              <p className="text-xs text-error flex items-center gap-1"><FiAlertCircle className="w-3.5 h-3.5" /> {productsError}</p>
            )}
          </div>

          <div className="space-y-4">
            <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Shipper Profile</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Shipper Name" value={formData.shipper_name} onChange={(v) => setField('shipper_name', v)} placeholder="Shipper name" />
              <Field label="Shipper Mobile" value={formData.shipper_mobile} onChange={(v) => setField('shipper_mobile', v)} placeholder="Mobile number" />
              <div className="md:col-span-2"><Field label="Shipper Address" value={formData.shipper_address} onChange={(v) => setField('shipper_address', v)} placeholder="Address" /></div>
              <Field label="Shipper Pincode" value={formData.shipper_pincode} onChange={(v) => setField('shipper_pincode', v.replace(/\D/g, '').slice(0, 6))} placeholder="Pincode" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <CheckField label="Allow COD" checked={formData.allow_cod} onChange={(v) => setField('allow_cod', v)} />
            <CheckField label="OTP delivery" checked={formData.otp_delivery} onChange={(v) => setField('otp_delivery', v)} />
          </div>
        </div>
      );
    }

    const simpleCommon = (
      <>
        {common}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField label="Label Type" value={formData.label_type} onChange={(v) => setField('label_type', v)} options={[{ value: 'A4', label: 'A4' }, { value: 'THERMAL', label: 'Thermal' }]} />
          <CheckField label="Enable COD" checked={formData.allow_cod} onChange={(v) => setField('allow_cod', v)} />
        </div>
      </>
    );

    if (code === 'DELHIVERY') return <div className="space-y-7"><h4 className="text-lg font-bold text-main">Delhivery Credentials</h4>{simpleCommon}<div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Field label="API Token" required type="password" value={formData.api_token} onChange={(v) => setField('api_token', v)} /><Field label="Client Name / Client Number" value={formData.client_name_number} onChange={(v) => setField('client_name_number', v)} /><Field label="Warehouse Name" required value={formData.warehouse_name} onChange={(v) => setField('warehouse_name', v)} /><Field label="Warehouse Pincode" required value={formData.warehouse_pincode} onChange={(v) => setField('warehouse_pincode', v.replace(/\D/g, '').slice(0, 6))} /><SelectField label="Service Type" value={formData.service_type} onChange={(v) => setField('service_type', v)} options={['Surface', 'Express']} /><Field label="Seller GSTIN" value={formData.seller_gstin} onChange={(v) => setField('seller_gstin', v)} /></div></div>;

    if (code === 'XPRESSBEES') return <div className="space-y-7"><h4 className="text-lg font-bold text-main">Xpressbees Credentials</h4>{simpleCommon}<div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Field label="API User Email" required value={formData.api_user_email} onChange={(v) => setField('api_user_email', v)} /><Field label="API User Password" required type="password" value={formData.api_user_password} onChange={(v) => setField('api_user_password', v)} /><Field label="Secret Key" required type="password" value={formData.secret_key} onChange={(v) => setField('secret_key', v)} /><Field label="Channel ID" value={formData.channel_id} onChange={(v) => setField('channel_id', v)} /><Field label="Default Pickup Pincode" value={formData.default_pickup_pincode} onChange={(v) => setField('default_pickup_pincode', v.replace(/\D/g, '').slice(0, 6))} /><SelectField label="Service Type" value={formData.service_type} onChange={(v) => setField('service_type', v)} options={['Surface', 'Air']} /></div></div>;

    if (code === 'DTDC') return <div className="space-y-7"><h4 className="text-lg font-bold text-main">DTDC Credentials</h4>{simpleCommon}<div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Field label="API Key" required type="password" value={formData.api_token} onChange={(v) => setField('api_token', v)} /><Field label="X-Access-Token" required type="password" value={formData.x_access_token} onChange={(v) => setField('x_access_token', v)} /><Field label="Customer Code" required value={formData.customer_code} onChange={(v) => setField('customer_code', v)} /><Field label="Username" value={formData.username} onChange={(v) => setField('username', v)} /><Field label="Password" type="password" value={formData.password} onChange={(v) => setField('password', v)} /><Field label="Origin Area" value={formData.origin_area} onChange={(v) => setField('origin_area', v)} /><SelectField label="Service Type" value={formData.service_type} onChange={(v) => setField('service_type', v)} options={['Domestic Express (PTP)', 'B2C Priority', 'Heavy Shipment']} /></div></div>;

    if (code === 'SHREE_MARUTI') return <div className="space-y-7"><h4 className="text-lg font-bold text-main">Shree Maruti Credentials</h4>{simpleCommon}<div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Field label="Username" required value={formData.username} onChange={(v) => setField('username', v)} /><Field label="Password" required type="password" value={formData.password} onChange={(v) => setField('password', v)} /><Field label="Origin Area" value={formData.origin_area} onChange={(v) => setField('origin_area', v)} /><SelectField label="Service Type" value={formData.service_type} onChange={(v) => setField('service_type', v)} options={['Air', 'Surface']} /><SelectField label="Hand Over Mode" value={formData.hand_over_mode} onChange={(v) => setField('hand_over_mode', v)} options={['Drop', 'Pickup', 'Pick']} /></div></div>;

    if (code === 'TRACKON') return <div className="space-y-7"><h4 className="text-lg font-bold text-main">Trackon Credentials</h4>{simpleCommon}<div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Field label="Username" required value={formData.username} onChange={(v) => setField('username', v)} /><Field label="API Key / Token" required type="password" value={formData.api_token} onChange={(v) => setField('api_token', v)} /><Field label="Origin Area" value={formData.origin_area} onChange={(v) => setField('origin_area', v)} /><SelectField label="Service Type" value={formData.service_type} onChange={(v) => setField('service_type', v)} options={['Surface', 'Air']} /></div></div>;

    if (code === 'ECOM_EXPRESS') return <div className="space-y-7"><h4 className="text-lg font-bold text-main">Ecom Express Credentials</h4>{simpleCommon}<div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Field label="Username" required value={formData.username} onChange={(v) => setField('username', v)} /><Field label="Password" required type="password" value={formData.password} onChange={(v) => setField('password', v)} /><Field label="Origin Area" value={formData.origin_area} onChange={(v) => setField('origin_area', v)} /><SelectField label="Service Type" value={formData.service_type} onChange={(v) => setField('service_type', v)} options={['EXPP Express', 'ESCP Surface']} /></div></div>;

    if (code === 'EKART') return <div className="space-y-7"><h4 className="text-lg font-bold text-main">Ekart Credentials</h4>{simpleCommon}<div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Field label="Merchant Code" required value={formData.merchant_code} onChange={(v) => setField('merchant_code', v)} /><Field label="Authorization header" required type="password" value={formData.authorization_header} onChange={(v) => setField('authorization_header', v)} /><SelectField label="Service Code" value={formData.service_code} onChange={(v) => setField('service_code', v)} options={['Regular', 'Economy']} /><Field label="Reverse Service Code" value={formData.reverse_service_code} onChange={(v) => setField('reverse_service_code', v)} /><Field label="Origin Area" value={formData.origin_area} onChange={(v) => setField('origin_area', v)} /></div><CheckField label="Live mode" checked={formData.live_mode} onChange={(v) => setField('live_mode', v)} /></div>;

    if (code === 'SHADOWFAX') return <div className="space-y-7"><h4 className="text-lg font-bold text-main">Shadowfax Credentials</h4>{simpleCommon}<div className="space-y-4"><SelectField label="Authentication Mode" value={formData.authentication_mode} onChange={(v) => setField('authentication_mode', v)} options={[{ value: 'TOKEN', label: 'Token Auth' }, { value: 'OAUTH2', label: 'OAuth2' }]} />{formData.authentication_mode === 'TOKEN' ? <Field label="API Token" required type="password" value={formData.api_token} onChange={(v) => setField('api_token', v)} /> : <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Field label="Client ID" required value={formData.client_id} onChange={(v) => setField('client_id', v)} /><Field label="Client Secret" required type="password" value={formData.client_secret} onChange={(v) => setField('client_secret', v)} /></div>}<Field label="Origin Area" value={formData.origin_area} onChange={(v) => setField('origin_area', v)} /></div></div>;

    if (code === 'INDIA_POST') return <div className="space-y-7"><h4 className="text-lg font-bold text-main">India Post Credentials</h4>{simpleCommon}<div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Field label="Username" required value={formData.username} onChange={(v) => setField('username', v)} /><Field label="Password" required type="password" value={formData.password} onChange={(v) => setField('password', v)} /><Field label="Customer ID" required value={formData.customer_id} onChange={(v) => setField('customer_id', v)} /><Field label="Bulk Customer Contract Number" required value={formData.bulk_customer_contract_number} onChange={(v) => setField('bulk_customer_contract_number', v)} /><Field label="Booking Office ID" value={formData.booking_office_id} onChange={(v) => setField('booking_office_id', v)} /><SelectField label="Service Type" value={formData.service_type} onChange={(v) => setField('service_type', v)} options={['Speed Post', 'Business Parcel', 'Registered Letter', 'Registered Parcel']} /><Field label="Whitelisted Public IP" value={formData.whitelisted_public_ip} onChange={(v) => setField('whitelisted_public_ip', v)} /></div></div>;

    return <div className="rounded-xl border border-border p-5 text-sm text-muted">No credential form is defined for this courier yet.</div>;
  };

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Courier Settings</h1>
          <p className="text-sm text-muted">
            Connect logistics partners, manage API credentials, and control defaults for labels,
            COD, and shipping modes.
          </p>
        </div>
        <button
          onClick={() => {
            setShowWizard(true);
            setWizardStep(1);
          }}
          className="px-6 py-2.5 bg-primary hover:shadow-neon text-background rounded-xl font-bold flex items-center gap-2 transition-all"
        >
          <FiPlus />
          Add Courier
        </button>
      </div>

      {/* Courier Integration Table */}
      <div className="glass-card p-6">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-main">Courier Integrations</h3>
            <p className="text-sm text-muted mt-1">Connect direct courier partners and manage existing integrations.</p>
          </div>
          <button
            type="button"
            onClick={openAddCourierWizard}
            className="px-5 py-2.5 bg-primary hover:shadow-neon text-background rounded-xl font-bold flex items-center gap-2 transition-all"
          >
            <FiPlus /> Add Courier
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {['DIRECT', 'INTEGRATED'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab ? 'bg-primary text-background shadow-sm' : 'bg-surface-light text-muted hover:text-main'
              }`}
            >
              {tab === 'DIRECT' ? 'Direct Courier Integration' : 'Integrated Couriers'}
            </button>
          ))}
        </div>

        {activeTab === 'DIRECT' ? (
          <>
            <div className="flex flex-col lg:flex-row gap-3 mb-5">
              <div className="flex-1">
                <input
                  className="input-field w-full text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search couriers by name or code..."
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {['All Capabilities', 'Forward', 'Return', 'NDR'].map((capability) => (
                  <button
                    key={capability}
                    type="button"
                    onClick={() => setCapabilityFilter(capability)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      capabilityFilter === capability ? 'bg-primary/10 text-primary border-primary/30' : 'border-border text-muted hover:text-main hover:shadow-neon'
                    }`}
                  >
                    {capability}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[860px] text-left">
                <thead className="bg-surface-light border-b border-border">
                  <tr>
                    <th className="px-5 py-4 text-xs font-bold text-muted uppercase tracking-wider">Courier</th>
                    <th className="px-5 py-4 text-xs font-bold text-muted uppercase tracking-wider">Capabilities</th>
                    <th className="px-5 py-4 text-xs font-bold text-muted uppercase tracking-wider">Integration Details</th>
                    <th className="px-5 py-4 text-xs font-bold text-muted uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {visibleCatalog.map((carrier) => {
                    const already = configured.some((cfg) => cfg.carrier === carrier.id || cfg.carrier_code === carrier.code || getCarrierCode(cfg.carrier) === carrier.code);
                    const supportedInBackend = Boolean(carrier.id);
                    return (
                      <tr key={`${carrier.code}-${carrier.id || 'frontend'}`} className="hover:bg-surface-light/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-sm flex-shrink-0">
                              {getCarrierInitials(carrier)}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-main">{carrier.name}</div>
                              <div className="text-xs text-muted mt-0.5">{carrier.code}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {getCapabilities(carrier).map((capability) => (
                              <span key={capability} className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
                                {capability}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-sm text-main">{already ? 'Configured for this account' : 'Credentials not configured'}</div>
                          <div className="text-xs text-muted mt-1">
                            {supportedInBackend ? 'Backend carrier available' : 'Catalog entry ready; backend carrier setup required'}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => openCarrierWizard(carrier)}
                            className="px-4 py-2.5 bg-primary text-background rounded-lg text-xs font-bold hover:shadow-neon transition-all"
                          >
                            {already ? 'Add Another' : 'Add Credentials'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {visibleCatalog.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center text-sm text-muted">No couriers match your search or capability filter.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-surface-light border-b border-border">
                <tr>
                  <th className="px-5 py-4 text-xs font-bold text-muted uppercase tracking-wider">Courier</th>
                  <th className="px-5 py-4 text-xs font-bold text-muted uppercase tracking-wider">Status</th>
                  <th className="px-5 py-4 text-xs font-bold text-muted uppercase tracking-wider">Integration Details</th>
                  <th className="px-5 py-4 text-xs font-bold text-muted uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {configured.map((c) => {
                  const code = c.carrier_code || c.carrier?.code || 'COURIER';
                  const carrierRef = mergedCatalog.find((x) => x.code === code) || { name: c.carrier_name || c.carrier?.name || code, code, initials: getCarrierInitials({ name: c.carrier_name || code, code }) };
                  return (
                    <tr key={c.id} className="hover:bg-surface-light/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                            {getCarrierInitials(carrierRef)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-main">{c.carrier_name || c.carrier?.name || code}</div>
                            <div className="text-xs text-muted">{code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4"><span className="px-2.5 py-1 rounded-full bg-success/10 text-success text-[11px] font-semibold">{(c.status || 'UNKNOWN').replaceAll('_', ' ')}</span></td>
                      <td className="px-5 py-4">
                        <div className="text-sm text-main">{c.customer_code || c.origin_area || 'Credentials saved'}</div>
                        <div className="text-xs text-muted mt-1">Last tested: {c.last_tested_at ? new Date(c.last_tested_at).toLocaleString('en-IN') : 'Not tested'}</div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {c.is_default ? (
                            <span className="px-3 py-2 rounded-lg text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                              Default
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetDefault(c.id)}
                              className="px-3 py-2 rounded-lg text-xs font-semibold text-primary border border-primary/20 hover:bg-primary/10 transition-colors"
                            >
                              Set as Default
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(c.id)}
                            className="px-3 py-2 rounded-lg text-xs font-semibold text-error hover:bg-error/10 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {configured.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-12 text-center text-sm text-muted">No integrated couriers yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pickup Locations */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <MapPin className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-main">Pickup Locations</h2>
              <p className="text-xs text-muted mt-0.5">
                Warehouses and addresses from where couriers will collect your shipments.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openPickupCreate}
            className="px-3 py-2 bg-primary text-background text-xs font-semibold rounded-lg flex items-center gap-2 hover:shadow-neon hover:scale-[1.02]"
          >
            <FiPlus className="w-3.5 h-3.5" /> Add Pickup Location
          </button>
        </div>
        {pickupLoading ? (
          <div className="py-10 flex items-center justify-center text-muted text-sm">
            <FiActivity className="w-4 h-4 animate-spin mr-2" /> Loading pickup locations…
          </div>
        ) : pickupError ? (
          <div className="py-4 flex items-center gap-2 text-xs text-error">
            <FiAlertCircle className="w-4 h-4" /> {pickupError}
          </div>
        ) : pickupLocations.length === 0 ? (
          <div className="py-10 border-2 border-dashed border-border/50 rounded-2xl text-center text-xs text-muted">
            <FiDatabase className="w-8 h-8 mx-auto mb-3 text-muted/40" />
            No pickup locations configured yet.
            <br />
            Add your primary warehouse so you can start booking shipments.
          </div>
        ) : (
          <div className="space-y-3">
            {pickupLocations.map((loc) => (
              <div
                key={loc.id}
                className="border border-border/60 rounded-xl p-4 flex items-start justify-between hover:border-primary/40 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-main">
                      {loc.name || 'Pickup Location'}
                    </span>
                    {loc.is_default && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success font-semibold">
                        <FiCheckCircle className="w-3 h-3" /> Default
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted">
                    {loc.address_line1}
                    {loc.address_line2 ? `, ${loc.address_line2}` : ''}
                  </p>
                  <p className="text-[11px] text-muted mt-0.5">
                    {loc.city}, {loc.state} · {loc.pincode}
                  </p>
                  <p className="text-[11px] text-muted mt-0.5">
                    Contact: {loc.contact_name || '—'} · {loc.phone || '—'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {!loc.is_default && (
                    <button
                      type="button"
                      onClick={() => setDefaultPickup(loc)}
                      className="text-[10px] px-2 py-1 rounded-lg bg-surface-light text-muted hover:text-main"
                    >
                      Make Default
                    </button>
                  )}
                  <div className="flex items-center gap-1 mt-1">
                    <button
                      type="button"
                      onClick={() => openPickupEdit(loc)}
                      className="p-2 rounded-lg text-muted hover:text-primary hover:bg-surface-hover"
                    >
                      <FiSettings className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePickup(loc)}
                      className="p-2 rounded-lg text-muted hover:text-error hover:bg-error/10"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Couriers */}
      <div className="glass-card p-6">
        <h3 className="font-bold mb-6 flex items-center gap-2">
          <FiSettings className="text-muted" /> Available Couriers
        </h3>
        {catalog.length === 0 ? (
          <div className="bg-surface-light rounded-2xl border border-main p-8 text-center text-muted">
            <FiCpu className="mx-auto text-4xl mb-3 text-muted/30" />
            No carriers available in the catalog yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {catalog.map((c) => {
              const alreadyConnected = configured.some(
                (cfg) => cfg.carrier === c.id || cfg.carrier_code === c.code
              );
              return (
                <div
                  key={c.id}
                  className="bg-surface-light rounded-2xl border border-main p-4 hover:border-primary/40 transition-all cursor-pointer flex items-center justify-between group"
                  onClick={() => {
                    setSelectedCarrier(c);
                    setWizardStep(2);
                    setShowWizard(true);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-sm flex-shrink-0">
                      {c.name?.[0] || 'C'}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-main">{c.name}</h4>
                      <p className="text-[11px] text-muted mt-0.5">{c.code}</p>
                    </div>
                  </div>
                  {alreadyConnected ? (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-success/10 text-success font-semibold">
                      <FiCheckCircle className="w-3 h-3" /> Connected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Connect <FiChevronRight />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Courier setup panel — right-side slide-over */}
      <AnimatePresence>
        {showWizard && (
          <div className="fixed inset-0 z-[60] flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={resetWizard}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
              className="relative w-full max-w-2xl h-full bg-surface border-l border-border shadow-2xl flex flex-col"
            >
              <div className="px-6 py-5 border-b border-border flex items-start justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  {selectedCarrier && (
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-sm flex-shrink-0">
                      {getCarrierInitials(selectedCarrier)}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-main">{selectedCarrier ? `Add ${selectedCarrier.name} Credentials` : 'Add Courier'}</h3>
                    <p className="text-sm text-muted mt-1">{selectedCarrier ? `Configure ${selectedCarrier.name} without unrelated credential fields.` : 'Select a courier partner to continue.'}</p>
                  </div>
                </div>
                <button type="button" onClick={resetWizard} className="text-sm text-muted hover:text-main px-2 py-1 -mr-2">Close</button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6">
                {wizardStep === 1 ? (
                  <div className="space-y-4">
                    <p className="text-sm font-bold text-main">Select a courier</p>
                    {visibleCatalog.map((carrier) => (
                      <button
                        key={`${carrier.code}-${carrier.id || 'frontend'}`}
                        type="button"
                        onClick={() => openCarrierWizard(carrier)}
                        className="w-full flex items-center justify-between text-left p-4 rounded-xl border border-border bg-surface-light/40 hover:border-primary/50 hover:shadow-neon transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">{getCarrierInitials(carrier)}</div>
                          <div>
                            <div className="font-semibold text-sm text-main">{carrier.name}</div>
                            <div className="text-xs text-muted mt-0.5">{carrier.code}</div>
                          </div>
                        </div>
                        <FiChevronRight className="text-muted" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {renderCarrierFields()}
                    {saveError && (
                      <div className="rounded-xl p-4 text-sm bg-error/10 text-error border border-error/30">
                        <div className="flex items-start gap-2">
                          <FiAlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span className="break-words">{saveError}</span>
                        </div>
                      </div>
                    )}
                    {testResult && (
                      <div className={`rounded-xl p-4 text-sm ${testResult.success ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                        <div className="flex items-start gap-2"><FiCheckCircle className="w-4 h-4 mt-0.5" /><span>{testResult.message}</span></div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {wizardStep === 2 && (
                <div className="px-6 py-4 border-t border-border flex-shrink-0 flex items-center justify-between gap-3 bg-surface">
                  <button type="button" onClick={() => setWizardStep(1)} className="text-sm font-semibold text-muted hover:text-main">← Change Courier</button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={testing}
                      className="px-4 py-2.5 border border-border rounded-lg text-sm font-semibold text-main hover:border-primary/50 disabled:opacity-40 transition-all"
                    >
                      {testing ? 'Testing…' : 'Test Connection'}
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveIntegration}
                      disabled={loading}
                      className="px-5 py-2.5 bg-primary text-background rounded-lg text-sm font-bold hover:shadow-neon disabled:opacity-40 transition-all"
                    >
                      {loading ? 'Saving…' : 'Save Credentials'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pickup form modal */}
      {pickupFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface rounded-2xl border border-border p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-main">
                  {editingPickup ? 'Edit Pickup Location' : 'Add Pickup Location'}
                </h3>
                <p className="text-[11px] text-muted mt-0.5">
                  This address will be used as origin for courier pickups.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPickupFormOpen(false);
                  setEditingPickup(null);
                }}
                className="text-xs text-muted hover:text-main"
              >
                Close
              </button>
            </div>
            <form onSubmit={savePickup} className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted mb-1 block">Name *</label>
                  <input
                    className="input-field"
                    required
                    value={pickupForm.name}
                    onChange={(e) => setPickupField('name', e.target.value)}
                    placeholder="Primary Warehouse"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted mb-1 block">
                    Contact person
                  </label>
                  <input
                    className="input-field"
                    value={pickupForm.contact_name}
                    onChange={(e) => setPickupField('contact_name', e.target.value)}
                    placeholder="Name"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted mb-1 block">Phone *</label>
                  <input
                    className="input-field"
                    required
                    value={pickupForm.phone}
                    onChange={(e) => setPickupField('phone', e.target.value)}
                    placeholder="Customer-care mobile"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted mb-1 block">
                    Address line 1 *
                  </label>
                  <input
                    className="input-field"
                    required
                    value={pickupForm.address_line1}
                    onChange={(e) => setPickupField('address_line1', e.target.value)}
                    placeholder="Building, street"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted mb-1 block">
                    Address line 2
                  </label>
                  <input
                    className="input-field"
                    value={pickupForm.address_line2}
                    onChange={(e) => setPickupField('address_line2', e.target.value)}
                    placeholder="Area, landmark"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-muted mb-1 block">
                      City *
                    </label>
                    <input
                      className="input-field"
                      required
                      value={pickupForm.city}
                      onChange={(e) => setPickupField('city', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted mb-1 block">
                      State *
                    </label>
                    <input
                      className="input-field"
                      required
                      value={pickupForm.state}
                      onChange={(e) => setPickupField('state', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted mb-1 block">Pincode *</label>
                  <input
                    className="input-field"
                    required
                    maxLength={6}
                    value={pickupForm.pincode}
                    onChange={(e) =>
                      setPickupField('pincode', e.target.value.replace(/\D/g, ''))
                    }
                  />
                </div>
                <label className="flex items-center gap-2 text-[11px] text-muted mt-1">
                  <input
                    type="checkbox"
                    checked={pickupForm.is_default}
                    onChange={(e) => setPickupField('is_default', e.target.checked)}
                    className="w-4 h-4 rounded accent-primary"
                  />
                  <span>Set as default pickup location</span>
                </label>
              </div>
              {pickupSaveError && (
                <div className="flex items-start gap-2 text-[11px] text-error bg-error/10 rounded-lg p-2">
                  <FiAlertCircle className="w-3.5 h-3.5 mt-0.5" />
                  <span className="break-words">{pickupSaveError}</span>
                </div>
              )}
              <div className="flex items-center justify-end gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setPickupFormOpen(false);
                    setEditingPickup(null);
                  }}
                  className="px-3 py-2 text-[11px] text-muted hover:text-main"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pickupSaving}
                  className="px-4 py-2 text-[11px] font-semibold bg-primary text-background rounded-lg flex items-center gap-2 hover:shadow-neon disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {pickupSaving ? (
                    <>
                      <FiActivity className="w-3.5 h-3.5 animate-spin" /> Saving…
                    </>
                  ) : (
                    'Save Pickup Location'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourierSettings;