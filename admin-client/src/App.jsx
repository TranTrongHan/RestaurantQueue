import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import ReservationsPage from './pages/ReservationsPage';
import CustomerOrderingPage from './pages/CustomerOrderingPage';
import MainLayout from './components/layout/MainLayout';
import useAuthStore from './store/useAuthStore';

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
          <Route path="orders" element={<HomePage />} />
          <Route path="reservations" element={<ReservationsPage />} />
          <Route path="products" element={<HomePage />} />
          <Route path="product-groups" element={<HomePage />} />
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
