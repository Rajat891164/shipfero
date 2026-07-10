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

const Onboarding = lazy(() => import('./pages/Onboarding'));

const CourierSettings = lazy(() => import('./pages/CourierSettings'));

import useAuthStore from './store/useAuthStore';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Onboarding />} />
        <Route path="/onboarding" element={<Onboarding />} />
        
        <Route element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/track" element={<Track />} />
          <Route path="/returns" element={<Returns />} />
          <Route path="/ndr" element={<NDR />} />
          <Route path="/logistics" element={<Logistics />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/couriers" element={<CourierSettings />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/add-ons" element={<AddOns />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Suspense>
  );
}

export default App;
