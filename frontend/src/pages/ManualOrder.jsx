import React, { useState, useMemo, useEffect } from 'react';
import {
  User,
  MapPin,
  Package,
  CreditCard,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Truck,
} from 'lucide-react';
import { OrderService, MerchantService, CarrierService } from '../services/api';

const CHANNEL_SOURCE = 'MANUAL';

const PAYMENT_TYPE_MAP = {
  COD: 'COD',
  PREPAID: 'PREPAID',
};

const ENTERPRISE_STATES = [
  'Andhra Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi',
  'Gujarat',
  'Haryana',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'West Bengal',
  'Other',
];

const Section = ({ icon: Icon, title, children }) => (
  <section className="border border-slate-200 rounded-lg bg-white p-4 shadow-sm">
    <header className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center">
        <Icon className="w-4 h-4 text-slate-700" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
    </header>
    {children}
  </section>
);

const Label = ({ children, required }) => (
  <label className="block text-xs font-medium text-slate-700 mb-1">
    {children}
    {required && <span className="text-red-500 ml-0.5">*</span>}
  </label>
);

const Input = (props) => (
  <input
    {...props}
    className={`block w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 ${
      props.className || ''
    }`}
  />
);

const Select = (props) => (
  <select
    {...props}
    className={`block w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 ${
      props.className || ''
    }`}
  />
);

const TextArea = (props) => (
  <textarea
    {...props}
    className={`block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 ${
      props.className || ''
    }`}
  />
);

const newItem = () => ({ id: Date.now(), name: '', sku: '', qty: 1, unitPrice: '', hsn: '' });

export default function ManualOrder() {
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '' });
  const [shipping, setShipping] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  });

  const [items, setItems] = useState([newItem()]);
  const [dims, setDims] = useState({ length: '', breadth: '', height: '', weight: '' });
  const [paymentType, setPaymentType] = useState('COD');
  const [shippingCharge, setShippingCharge] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [codAmount, setCodAmount] = useState(0);
  const [notes, setNotes] = useState('');

  const [pickupLocations, setPickupLocations] = useState([]);
  const [pickupLocationsError, setPickupLocationsError] = useState(null);
  const [selectedPickupId, setSelectedPickupId] = useState('');
  const [carriers, setCarriers] = useState([]);
  const [carriersError, setCarriersError] = useState(null);
  const [selectedCarrierId, setSelectedCarrierId] = useState('');

  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    MerchantService.listPickupLocations()
      .then(({ data }) => {
        const list = Array.isArray(data?.results) ? data.results : data;
        setPickupLocations(list || []);
        if (list && list.length > 0) {
          const defaultLoc = list.find((l) => l.is_default) || list[0];
          setSelectedPickupId(String(defaultLoc.id));
        } else {
          setPickupLocationsError('No pickup locations found on your merchant account. Add one in Courier Settings.');
        }
      })
      .catch((err) => {
        setPickupLocations([]);
        setPickupLocationsError(
          err.response?.data?.detail ||
            `Could not load pickup locations (${err.response?.status || 'network error'}).`
        );
      });

    CarrierService.list()
      .then(({ data }) => {
        const list = Array.isArray(data?.results) ? data.results : data;
        setCarriers(list || []);
        if (list && list.length > 0) {
          setSelectedCarrierId(String(list[0].id));
        } else {
          setCarriersError('No carriers found. Connect a courier in Courier Settings first.');
        }
      })
      .catch((err) => {
        setCarriers([]);
        setCarriersError(
          err.response?.data?.detail ||
            `Could not load carriers (${err.response?.status || 'network error'}).`
        );
      });
  }, []);

  const itemsSubtotal = useMemo(
    () =>
      items.reduce(
        (sum, it) => sum + Number(it.qty || 0) * Number(it.unitPrice || 0),
        0,
      ),
    [items],
  );

  const orderAmount = useMemo(() => {
    const shippingFee = Number(shippingCharge || 0);
    const discount = Number(discountAmount || 0);
    return Math.max(itemsSubtotal + shippingFee - discount, 0);
  }, [itemsSubtotal, shippingCharge, discountAmount]);

  const volumetricWeight = useMemo(() => {
    const { length, breadth, height } = dims;
    if (!length || !breadth || !height) return 0;
    return (Number(length) * Number(breadth) * Number(height)) / 5000;
  }, [dims]);

  const chargeableWeight = useMemo(() => {
    const actual = Number(dims.weight || 0);
    return Math.max(actual, volumetricWeight);
  }, [dims.weight, volumetricWeight]);

  const updateItem = (id, patch) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const addItem = () => setItems((prev) => [...prev, newItem()]);

  const removeItem = (id) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.id !== id) : prev));
  };

  const lookupPincode = async (pincode) => {
    setShipping((prev) => ({ ...prev, pincode }));
    setError(null);

    if (pincode.length !== 6) return;

    try {
      const response = await fetch(
        `http://postalpincode.gen.in/api/pincode/${encodeURIComponent(pincode)}`,
      );
      const data = await response.json();

      if (data.Status !== 'Success' || !Array.isArray(data.PostOffice) || !data.PostOffice[0]) {
        throw new Error('Pincode not found');
      }

      const office = data.PostOffice[0];
      setShipping((prev) => ({
        ...prev,
        city: office.District || prev.city,
        state: office.State || prev.state,
        country: office.Country || prev.country,
      }));
    } catch (err) {
      setError(`Pincode lookup failed: ${err.message}`);
    }
  };

  const buildPayload = () => ({
    channel_source: CHANNEL_SOURCE,
    channel_order_id: undefined,

    customer_name: customer.name,
    customer_phone: customer.phone,
    customer_email: customer.email || undefined,

    shipping_address1: shipping.line1,
    shipping_address2: shipping.line2 || undefined,
    shipping_city: shipping.city,
    shipping_state: shipping.state,
    shipping_pincode: shipping.pincode,
    shipping_country: shipping.country,

    billing_same_as_shipping: true,
    billing_address1: shipping.line1,
    billing_address2: shipping.line2 || undefined,
    billing_city: shipping.city,
    billing_state: shipping.state,
    billing_pincode: shipping.pincode,

    order_amount: orderAmount,
    discount_amount: Number(discountAmount || 0),
    tax_amount: 0,
    shipping_charge_merchant: Number(shippingCharge || 0),

    payment_type: PAYMENT_TYPE_MAP[paymentType] || paymentType,
    cod_amount:
      PAYMENT_TYPE_MAP[paymentType] === 'COD' ? Number(codAmount || orderAmount) : 0,

    total_weight: chargeableWeight,
    length: Number(dims.length || 0),
    breadth: Number(dims.breadth || 0),
    height: Number(dims.height || 0),

    pickup_location: selectedPickupId ? Number(selectedPickupId) : null,
    assigned_carrier: selectedCarrierId ? Number(selectedCarrierId) : null,
    integration: null,
    store_payment_method: null,

    items: items.map((it) => ({
      product_name: it.name,
      sku: it.sku || undefined,
      quantity: Number(it.qty || 0),
      unit_price: Number(it.unitPrice || 0),
      discount: 0,
      tax_percentage: 0,
      hsn_code: it.hsn || undefined,
      weight_grams: (chargeableWeight * 1000) / (items.length || 1),
      length_cm: Number(dims.length || 0),
      breadth_cm: Number(dims.breadth || 0),
      height_cm: Number(dims.height || 0),
    })),
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setResult(null);

    if (!customer.name || !customer.phone || !shipping.line1 || !shipping.pincode) {
      setError('Please fill in customer name, phone, shipping address and pincode.');
      return;
    }

    if (!dims.weight) {
      setError('Please provide package weight (kg).');
      return;
    }

    if (!selectedCarrierId) {
      setError('Please select a carrier.');
      return;
    }

    if (!selectedPickupId) {
      setError('Please select a pickup location.');
      return;
    }

    try {
      setStatus('creating');
      const payload = buildPayload();

      const { data: order } = await OrderService.create(payload);
      const orderId = order.id;

      setStatus('processing');
      await OrderService.process(orderId, {
        total_weight: payload.total_weight,
        length: payload.length,
        breadth: payload.breadth,
        height: payload.height,
        assigned_carrier_id: Number(selectedCarrierId),
        pickup_location_id: Number(selectedPickupId),
      });

      setStatus('booking');
      const { data: booking } = await OrderService.bookAwb(orderId, {
        carrier_id: Number(selectedCarrierId),
        pickup_location_id: Number(selectedPickupId),
        service_type: 'STANDARD',
      });

      setResult({
        orderId,
        awb: booking.awb_number || booking.awb,
        labelUrl: booking.label_url || booking.label,
      });
      setStatus('done');
    } catch (err) {
      const detail = err.response?.data;
      const message =
        detail?.detail ||
        detail?.message ||
        (typeof detail === 'object' ? JSON.stringify(detail) : err.message) ||
        'Order submission failed.';
      setError(message);
      setStatus('error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6">
      <header className="mb-6 border-b border-slate-200 pb-4">
        <h1 className="text-lg font-semibold text-slate-900">Manual Order (Enterprise)</h1>
        <p className="mt-1 text-sm text-slate-600">
          Create a shipment for offline or manual orders.
        </p>
      </header>

      {status === 'done' && result && (
        <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
          <div className="text-xs text-emerald-800">
            <p className="font-semibold mb-1">Order created and AWB booked.</p>
            <p>
              Order ID: <span className="font-semibold">{result.orderId}</span>
              {result.awb && (
                <>
                  {' '}
                  · AWB: <span className="font-semibold">{result.awb}</span>
                </>
              )}
            </p>
            {result.labelUrl && (
              <p className="mt-1">
                <a
                  href={result.labelUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 underline"
                >
                  Download shipping label
                </a>
              </p>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
          <p className="text-xs text-red-800 break-words">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Section icon={User} title="Customer">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label required>Full name</Label>
              <Input
                value={customer.name}
                onChange={(e) => setCustomer((p) => ({ ...p, name: e.target.value }))}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label required>Phone</Label>
              <Input
                value={customer.phone}
                onChange={(e) => setCustomer((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+91 98765 43210"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={customer.email}
                onChange={(e) => setCustomer((p) => ({ ...p, email: e.target.value }))}
                placeholder="john@example.com"
              />
            </div>
          </div>
        </Section>

        <Section icon={MapPin} title="Shipping address">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label required>Address line 1</Label>
              <Input
                value={shipping.line1}
                onChange={(e) => setShipping((p) => ({ ...p, line1: e.target.value }))}
                placeholder="Flat / house, building"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Address line 2</Label>
              <Input
                value={shipping.line2}
                onChange={(e) => setShipping((p) => ({ ...p, line2: e.target.value }))}
                placeholder="Street, area"
              />
            </div>
            <div>
              <Label required>Pincode</Label>
              <Input
                value={shipping.pincode}
                onChange={(e) => lookupPincode(e.target.value)}
                placeholder="560001"
                maxLength={6}
              />
            </div>
            <div>
              <Label required>City / district</Label>
              <Input
                value={shipping.city}
                onChange={(e) => setShipping((p) => ({ ...p, city: e.target.value }))}
                placeholder="Bengaluru"
              />
            </div>
            <div>
              <Label required>State</Label>
              <Select
                value={shipping.state}
                onChange={(e) => setShipping((p) => ({ ...p, state: e.target.value }))}
              >
                <option value="">Select state</option>
                {ENTERPRISE_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label required>Country</Label>
              <Input
                value={shipping.country}
                onChange={(e) => setShipping((p) => ({ ...p, country: e.target.value }))}
                placeholder="India"
              />
            </div>
          </div>
        </Section>

        <Section icon={Package} title="Items">
          <div className="space-y-3">
            {items.map((it, idx) => (
              <div
                key={it.id}
                className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3 flex flex-col gap-3"
              >
                <div className="flex justify-between items-center text-xs text-slate-600">
                  <span>Item {idx + 1}</span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(it.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-2">
                    <Label required>Product name</Label>
                    <Input
                      value={it.name}
                      onChange={(e) => updateItem(it.id, { name: e.target.value })}
                      placeholder="Product name"
                    />
                  </div>
                  <div>
                    <Label>SKU</Label>
                    <Input
                      value={it.sku}
                      onChange={(e) => updateItem(it.id, { sku: e.target.value })}
                      placeholder="SKU"
                    />
                  </div>
                  <div>
                    <Label required>Quantity</Label>
                    <Input
                      type="number"
                      min={1}
                      value={it.qty}
                      onChange={(e) =>
                        updateItem(it.id, { qty: Number(e.target.value || 0) })
                      }
                    />
                  </div>
                  <div>
                    <Label required>Unit price (₹)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={it.unitPrice}
                      onChange={(e) =>
                        updateItem(it.id, { unitPrice: Number(e.target.value || 0) })
                      }
                    />
                  </div>
                  <div>
                    <Label>HSN code</Label>
                    <Input
                      value={it.hsn}
                      onChange={(e) => updateItem(it.id, { hsn: e.target.value })}
                      placeholder="HSN"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addItem}
            className="mt-3 text-xs font-medium text-slate-700 hover:text-slate-900"
          >
            + Add another item
          </button>

          <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-xs">
            <div className="flex justify-between">
              <span>Items subtotal</span>
              <span className="font-semibold">₹{itemsSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Shipping charge</span>
              <span className="font-semibold">₹{Number(shippingCharge || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Discount</span>
              <span className="font-semibold">-₹{Number(discountAmount || 0).toFixed(2)}</span>
            </div>
            <div className="border-t border-slate-200 mt-2 pt-2 flex justify-between">
              <span className="font-semibold">Order amount</span>
              <span className="font-semibold">₹{orderAmount.toFixed(2)}</span>
            </div>
          </div>
        </Section>

        <Section icon={Package} title="Package">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label required>Length (cm)</Label>
              <Input
                type="number"
                min={0}
                step={0.1}
                value={dims.length}
                onChange={(e) => setDims((p) => ({ ...p, length: e.target.value }))}
              />
            </div>
            <div>
              <Label required>Breadth (cm)</Label>
              <Input
                type="number"
                min={0}
                step={0.1}
                value={dims.breadth}
                onChange={(e) => setDims((p) => ({ ...p, breadth: e.target.value }))}
              />
            </div>
            <div>
              <Label required>Height (cm)</Label>
              <Input
                type="number"
                min={0}
                step={0.1}
                value={dims.height}
                onChange={(e) => setDims((p) => ({ ...p, height: e.target.value }))}
              />
            </div>
            <div>
              <Label required>Weight (kg)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={dims.weight}
                onChange={(e) => setDims((p) => ({ ...p, weight: e.target.value }))}
              />
            </div>
          </div>

          <div className="mt-3 text-xs text-slate-600 flex flex-wrap gap-4">
            <span>Volumetric weight: {volumetricWeight.toFixed(2)} kg</span>
            <span>Chargeable weight (used for total_weight): {chargeableWeight.toFixed(2)} kg</span>
          </div>
        </Section>

        <Section icon={CreditCard} title="Payment">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label required>Payment type</Label>
              <Select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
              >
                <option value="COD">COD</option>
                <option value="PREPAID">Prepaid</option>
              </Select>
            </div>
            <div>
              <Label required>Shipping charge (₹)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={shippingCharge}
                onChange={(e) => setShippingCharge(Number(e.target.value || 0))}
              />
            </div>
            <div>
              <Label>Discount (₹)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Number(e.target.value || 0))}
              />
            </div>
            {paymentType === 'COD' && (
              <div>
                <Label required>COD amount to collect (₹)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={codAmount || orderAmount}
                  onChange={(e) => setCodAmount(Number(e.target.value || 0))}
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Must be greater than 0 for COD orders.
                </p>
              </div>
            )}
          </div>
        </Section>

        <Section icon={Truck} title="Courier & Pickup">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label required>Carrier</Label>
              <Select
                value={selectedCarrierId}
                onChange={(e) => setSelectedCarrierId(e.target.value)}
              >
                <option value="">Select carrier</option>
                {carriers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              {carriersError && (
                <p className="mt-1 text-[11px] text-red-600">{carriersError}</p>
              )}
            </div>
            <div>
              <Label required>Pickup location</Label>
              <Select
                value={selectedPickupId}
                onChange={(e) => setSelectedPickupId(e.target.value)}
              >
                <option value="">Select pickup location</option>
                {pickupLocations.map((pl) => {
                  const label =
                    pl.name?.trim() ||
                    [pl.address_line1, pl.city].filter(Boolean).join(', ') ||
                    `Pickup location #${pl.id}`;
                  return (
                    <option key={pl.id} value={pl.id}>
                      {label}
                    </option>
                  );
                })}
              </Select>
              {pickupLocationsError && (
                <p className="mt-1 text-[11px] text-red-600">{pickupLocationsError}</p>
              )}
            </div>
          </div>
        </Section>

        <Section icon={FileText} title="Notes">
          <div>
            <Label>Internal notes / courier instructions</Label>
            <TextArea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes for operations or courier."
            />
          </div>
        </Section>

        <div className="flex justify-end gap-3 pt-2 border-t border-slate-200 mt-4">
          <button
            type="submit"
            disabled={status === 'creating' || status === 'processing' || status === 'booking'}
            className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
          >
            {status === 'creating' && (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Creating order
              </>
            )}
            {status === 'processing' && (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Processing
              </>
            )}
            {status === 'booking' && (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Booking AWB
              </>
            )}
            {(status === 'idle' || status === 'error' || status === 'done') && 'Create order'}
          </button>
        </div>
      </form>
    </div>
  );
}