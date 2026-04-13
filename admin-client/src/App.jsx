import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import ReservationsPage from './pages/ReservationsPage';
import KitchenOrdersPage from './pages/KitchenOrdersPage';
import VNPayReturnPage from './pages/VNPayReturnPage';
import CustomerOrderingPage from './pages/CustomerOrderingPage';
import OnlineOrdersPage from './pages/OnlineOrdersPage';
import ProductsPage from './pages/ProductsPage';
import MembershipTiersPage from './pages/MembershipTiersPage';
import VouchersPage from './pages/VouchersPage';
import PointsReportPage from './pages/PointsReportPage';
import MainLayout from './components/layout/MainLayout';
import useAuthStore from './store/useAuthStore';
import { Toaster } from 'react-hot-toast';

// Basic Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Dashboard Layout and Sub-routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomePage />} />
          
          {/* Placeholder routes for other menu items */}
          <Route path="rfm" element={<HomePage />} />
          <Route path="orders" element={<OnlineOrdersPage />} />
          <Route path="reservations" element={<ReservationsPage />} />
          <Route path="kitchen" element={<KitchenOrdersPage />} />
          <Route path="payment-return" element={<VNPayReturnPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="product-groups" element={<HomePage />} />
          
          {/* Membership & Loyalty Routes */}
          <Route path="membership-tiers" element={<MembershipTiersPage />} />
          <Route path="vouchers" element={<VouchersPage />} />
          <Route path="points-report" element={<PointsReportPage />} />
        </Route>

        {/* Standalone Customer Simulation Route */}
        <Route path="/customer/ordering" element={<CustomerOrderingPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
