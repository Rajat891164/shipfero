import axios from 'axios';

/**
 * API abstraction layer for the Shipfero backend (Django + DRF + SimpleJWT).
 *
 * Endpoint map mirrors backend/config/urls.py. Auth is JWT: the access token
 * is attached to every request; on a 401 we transparently refresh using the
 * refresh token and retry the original request once.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Token storage keys — kept in sync with useAuthStore.
const ACCESS_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const tokenStore = {
  getAccess: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  set: (access, refresh) => {
    if (access) localStorage.setItem(ACCESS_TOKEN_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// A bare client (no interceptors) for the refresh call itself, to avoid loops.
const refreshClient = axios.create({ baseURL: API_URL });

// REQUEST: attach the access token.
api.interceptors.request.use(
  (config) => {
    const token = tokenStore.getAccess();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE: on 401, refresh once and retry. Queue concurrent 401s so we only
// refresh a single time.
let isRefreshing = false;
let pendingQueue = [];

const flushQueue = (error, token = null) => {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  pendingQueue = [];
};

const forceLogout = () => {
  tokenStore.clear();
  localStorage.removeItem('auth-storage');
  if (window.location.pathname !== '/login') window.location.href = '/login';
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Don't try to refresh the refresh/login calls themselves.
    const isAuthCall =
      originalRequest?.url?.includes('/auth/token/') ||
      originalRequest?.url?.includes('/auth/token/refresh/');

    if (status === 401 && !originalRequest._retry && !isAuthCall) {
      const refresh = tokenStore.getRefresh();
      if (!refresh) {
        forceLogout();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Wait for the in-flight refresh, then retry.
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await refreshClient.post('/auth/token/refresh/', { refresh });
        tokenStore.set(data.access, data.refresh); // rotation enabled server-side
        api.defaults.headers.common.Authorization = `Bearer ${data.access}`;
        flushQueue(null, data.access);
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        flushQueue(refreshError, null);
        forceLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Unwrap paginated DRF responses ({count, results}) vs plain arrays/objects.
export const unwrap = (data) =>
  data && Array.isArray(data.results) ? data.results : data;

// ─── Auth (/api/auth/) ────────────────────────────────────────────────────
export const AuthService = {
  login: (email, password) => api.post('/auth/token/', { email, password }),
  refresh: (refresh) => api.post('/auth/token/refresh/', { refresh }),
  signup: (data) => api.post('/auth/signup/', data),
  sendEmailOtp: () => api.post('/auth/send-email-otp/'),
  verifyEmailOtp: (code) => api.post('/auth/verify-email-otp/', { code }),
};

// ─── Merchants / Onboarding (/api/merchants/) ─────────────────────────────
export const MerchantService = {
  me: () => api.get('/merchants/me/'),
  updateMe: (data) => api.patch('/merchants/me/', data),
  dashboard: () => api.get('/merchants/dashboard/'),
  onboardingStatus: () => api.get('/merchants/onboarding/status/'),
  getBusinessProfile: () => api.get('/merchants/onboarding/business-profile/'),
  saveBusinessProfile: (data) => api.post('/merchants/onboarding/business-profile/', data),
  updateBusinessProfile: (data) => api.patch('/merchants/onboarding/business-profile/', data),
  listKyc: () => api.get('/merchants/onboarding/kyc/'),
  addKyc: (data) => api.post('/merchants/onboarding/kyc/', data),
  listBankDetails: () => api.get('/merchants/onboarding/bank-details/'),
  addBankDetails: (data) => api.post('/merchants/onboarding/bank-details/', data),
  listPickupLocations: () => api.get('/merchants/onboarding/pickup-locations/'),
  addPickupLocation: (data) => api.post('/merchants/onboarding/pickup-locations/', data),
  completeOnboarding: () => api.post('/merchants/onboarding/complete/'),
  plan: () => api.get('/merchants/plan/'),
};

// ─── Orders (/api/orders/) ────────────────────────────────────────────────
export const OrderService = {
  list: (params) => api.get('/orders/', { params }),
  detail: (id) => api.get(`/orders/${id}/`),
  create: (data) => api.post('/orders/', data),
  update: (id, data) => api.patch(`/orders/${id}/`, data),
  process: (id, data) => api.post(`/orders/${id}/process/`, data),
  bookAwb: (id, data) => api.post(`/orders/${id}/book-awb/`, data),
  bulkProcess: (data) => api.post('/orders/bulk-process/', data),
  cancel: (id, data) => api.post(`/orders/${id}/cancel/`, data),
  stats: () => api.get('/orders/stats/'),
};

// ─── Shipments (/api/shipments/) ──────────────────────────────────────────
export const ShipmentService = {
  list: (params) => api.get('/shipments/', { params }),
  detail: (id) => api.get(`/shipments/${id}/`),
  book: (id) => api.post(`/shipments/${id}/book/`),
  stats: () => api.get('/shipments/stats/'),
};

// ─── Tracking (/api/tracking/) ────────────────────────────────────────────
export const TrackingService = {
  timeline: (awb) => api.get(`/tracking/${awb}/`),
  analytics: () => api.get('/tracking/analytics/'),
};

// ─── NDR (/api/ndr/) ──────────────────────────────────────────────────────
export const NdrService = {
  list: (params) => api.get('/ndr/', { params }),
  dashboard: () => api.get('/ndr/dashboard/'),
  detail: (id) => api.get(`/ndr/${id}/`),
  takeAction: (id, data) => api.post(`/ndr/${id}/action/`, data),
  bulkAction: (data) => api.post('/ndr/bulk-action/', data),
};

// ─── Returns (/api/returns/) ──────────────────────────────────────────────
export const ReturnService = {
  list: (params) => api.get('/returns/', { params }),
  detail: (id) => api.get(`/returns/${id}/`),
  createReverse: (data) => api.post('/returns/create-reverse/', data),
  markReceived: (id) => api.post(`/returns/${id}/mark-received/`),
  stats: () => api.get('/returns/stats/'),
};

// ─── Carriers (/api/carriers/) ────────────────────────────────────────────
export const CarrierService = {
  list: () => api.get('/carriers/'),
  detail: (id) => api.get(`/carriers/${id}/`),
  serviceability: (data) => api.post('/carriers/serviceability/', data),
  calculateRate: (data) => api.post('/carriers/calculate-rate/', data),
};

// ─── Couriers — merchant-configured (/api/couriers/) ──────────────────────
export const CourierService = {
  list: () => api.get('/couriers/'),
  add: (data) => api.post('/couriers/', data),
  detail: (id) => api.get(`/couriers/${id}/`),
  update: (id, data) => api.patch(`/couriers/${id}/`, data),
  remove: (id) => api.delete(`/couriers/${id}/`),
  test: (id) => api.post(`/couriers/${id}/test/`),
  health: (id) => api.get(`/couriers/${id}/health/`),
};

// ─── Integrations (/api/integrations/) ────────────────────────────────────
export const IntegrationService = {
  list: () => api.get('/integrations/'),
  add: (data) => api.post('/integrations/', data),
  detail: (id) => api.get(`/integrations/${id}/`),
  update: (id, data) => api.patch(`/integrations/${id}/`, data),
  remove: (id) => api.delete(`/integrations/${id}/`),
  sync: (id) => api.post(`/integrations/${id}/sync/`),
  logs: (id) => api.get(`/integrations/${id}/logs/`),
};

// ─── Pricing (/api/pricing/) ──────────────────────────────────────────────
export const PricingService = {
  rateCards: (params) => api.get('/pricing/rate-cards/', { params }),
  zones: () => api.get('/pricing/zones/'),
  compare: (data) => api.post('/pricing/compare/', data),
};

// ─── Billing / Wallet (/api/billing/) ─────────────────────────────────────
export const BillingService = {
  wallet: () => api.get('/billing/wallet/'),
  addFunds: (data) => api.post('/billing/wallet/add-funds/', data),
  transactions: (params) => api.get('/billing/transactions/', { params }),
  invoices: (params) => api.get('/billing/invoices/', { params }),
  summary: () => api.get('/billing/summary/'),
};

// ─── Reports (/api/reports/) ──────────────────────────────────────────────
export const ReportService = {
  list: () => api.get('/reports/'),
  generate: (data) => api.post('/reports/generate/', data),
  status: (id) => api.get(`/reports/${id}/status/`),
  scheduledList: () => api.get('/reports/scheduled/'),
  createScheduled: (data) => api.post('/reports/scheduled/', data),
};

// ─── Notifications (/api/notifications/) ──────────────────────────────────
export const NotificationService = {
  list: () => api.get('/notifications/'),
  unreadCount: () => api.get('/notifications/unread-count/'),
  markRead: (id) => api.post(`/notifications/${id}/read/`),
  markAllRead: () => api.post('/notifications/mark-all-read/'),
};

// ─── Settings (/api/settings/) ────────────────────────────────────────────
export const SettingsService = {
  listApiKeys: () => api.get('/settings/api-keys/'),
  createApiKey: (data) => api.post('/settings/api-keys/', data),
  revokeApiKey: (id) => api.delete(`/settings/api-keys/${id}/`),
  listStaff: () => api.get('/settings/staff/'),
  inviteStaff: (data) => api.post('/settings/staff/invite/', data),
  auditLogs: () => api.get('/settings/audit-logs/'),
};

export default api;
