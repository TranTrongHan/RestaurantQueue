import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
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

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPlaceholder />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// Placeholder for the main dashboard content
const DashboardPlaceholder = () => {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center p-6">
      <div className="text-center p-12 bg-neutral-800 rounded-2xl shadow-2xl border border-neutral-700 max-w-lg w-full">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-rose-500 bg-clip-text text-transparent mb-4">
          Admin Dashboard
        </h1>
        <p className="text-neutral-400 mb-8">
          Welcome back, <span className="text-white font-bold">{user?.username || 'Admin'}</span>! 
          You have successfully authenticated to the management portal.
        </p>
        
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-neutral-700/50 rounded-xl border border-neutral-600">
              <p className="text-sm text-neutral-500">Status</p>
              <p className="text-xl font-bold text-green-400">Authenticated</p>
            </div>
            <div className="p-4 bg-neutral-700/50 rounded-xl border border-neutral-600">
              <p className="text-sm text-neutral-500">Role</p>
              <p className="text-xl font-bold text-blue-400">{user?.role || 'Manager'}</p>
            </div>
          </div>
          
          <button 
            onClick={() => {
              logout();
              window.location.href = '/login';
            }}
            className="mt-4 px-6 py-3 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-xl font-bold transition-all"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
