import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

export default function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-20 rounded-xl bg-[#000000] flex items-center justify-center animate-pulse">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <p className="text-sm text-gray-500">A carregar...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}
