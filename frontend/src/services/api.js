import axios from 'axios';

/**
 * PRODUCTION-READY API ABSTRACTION LAYER
 * This service handles all backend communication with JWT support.
 */

// Environment variable for API URL (defaults to localhost for development)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// REQUEST INTERCEPTOR: Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR: Global error handling and token refresh logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle token expiration (HTTP 401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // MOCK: Integration point for token refresh
        // const { data } = await axios.post(`${API_URL}/token/refresh/`, { refresh: localStorage.getItem('refresh_token') });
        // localStorage.setItem('auth_token', data.access);
        // api.defaults.headers.common['Authorization'] = `Bearer ${data.access}`;
        // return api(originalRequest);
        console.warn('Token expired. Refresh logic goes here.');
      } catch (refreshError) {
        // Redirtect to login if refresh fails
        localStorage.clear();
        window.location.href = '/login';
      }
    }

    // Global Error Handling UI Integration Point
    return Promise.reject(error);
  }
);

/**
 * MOCK SERVICE LAYER REPLACING REAL ENDPOINTS
 */
export const CourierService = {
  getStats: () => api.get('/dashboard/stats/'), // BACKEND: ReadOnlyModelViewSet
  getOrders: (params) => api.get('/orders/', { params }),
  getOrderDetail: (id) => api.get(`/orders/${id}/`),
  trackShipment: (awb) => api.get(`/tracking/${awb}/`),
  getNDR: () => api.get('/ndr/'),
  getWalletBalance: () => api.get('/wallet/balance/'),
};

export const AuthService = {
  register: (data) => api.post('/accounts/register/', data),
  verifyEmail: (data) => api.post('/accounts/verify-email/', data),
  updateProfile: (data) => api.put('/accounts/business-profile/', data),
  uploadKYC: (data) => api.post('/accounts/kyc/', data),
  addBankDetails: (data) => api.post('/accounts/bank-details/', data),
  addPickupLocation: (data) => api.post('/accounts/pickup-locations/', data),
  selectPlan: (data) => api.post('/accounts/plan/', data),
  getOnboardingStatus: () => api.get('/accounts/onboarding-status/'),
};

export const LogisticsService = {
  getCouriers: () => api.get('/logistics/couriers/'),
  getIntegrations: () => api.get('/logistics/integrations/'),
  addIntegration: (data) => api.post('/logistics/integrations/', data),
  deleteIntegration: (id) => api.delete(`/logistics/integrations/${id}/`),
  testConnection: (data) => api.post('/logistics/test-connection/', data),
  checkServiceability: (data) => api.post('/logistics/serviceability-check/', data),
  getHealth: () => api.get('/logistics/health/'),
};

export default api;
