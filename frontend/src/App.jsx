import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import LoadingScreen from './components/ui/LoadingScreen';

// Lazy load pages for performance
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Orders = lazy(() => import('./pages/Orders'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const Track = lazy(() => import('./pages/Track'));
const Returns = lazy(() => import('./pages/Returns'));
const NDR = lazy(() => import('./pages/NDR'));
const Logistics = lazy(() => import('./pages/Logistics'));
const Wallet = lazy(() => import('./pages/Wallet'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const Integrations = lazy(() => import('./pages/Integrations'));
const AddOns = lazy(() => import('./pages/AddOns'));
const ManualOrder = lazy(() => import('./pages/ManualOrder'));

const Onboarding = lazy(() => import('./pages/Onboarding'));

import useAuthStore from './store/useAuthStore';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public / auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Protected routes under main layout */}
        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <Layout>
                <Routes>
                  <Route path="dashboard" element={<Dashboard />} />

                  {/* Orders section */}
                  <Route path="orders" element={<Orders />} />
                  <Route path="orders/:id" element={<OrderDetail />} />
                  <Route path="orders/manual" element={<ManualOrder />} />

                  {/* Tracking */}
                  <Route path="track" element={<Track />} />

                  {/* Returns */}
                  <Route path="returns" element={<Returns />} />

                  {/* NDR */}
                  <Route path="ndr" element={<NDR />} />

                  {/* Logistics */}
                  <Route path="logistics" element={<Logistics />} />

                  {/* Wallet / Financials */}
                  <Route path="wallet" element={<Wallet />} />

                  {/* Pricing */}
                  <Route path="pricing" element={<Pricing />} />

                  {/* Reports */}
                  <Route path="reports" element={<Reports />} />

                  {/* Settings */}
                  <Route path="settings" element={<Settings />} />

                  {/* Integrations */}
                  <Route path="integrations" element={<Integrations />} />

                  {/* Add-ons */}
                  <Route path="addons" element={<AddOns />} />

                  {/* Default redirect */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Suspense>
  );
}

export default App;
