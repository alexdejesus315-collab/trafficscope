import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { LanguageProvider } from './context/LanguageContext';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const History = lazy(() => import('./pages/History'));
const Sobre = lazy(() => import('./pages/Sobre'));
const Faq = lazy(() => import('./pages/Faq'));
const PoliticaPrivacidade = lazy(() => import('./pages/PoliticaPrivacidade'));
const TermosDeUso = lazy(() => import('./pages/TermosDeUso'));
const Suporte = lazy(() => import('./pages/Suporte'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPostDetail = lazy(() => import('./pages/BlogPostDetail'));

function PageFallback() {
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

export default function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <PageFallback />;
  }

  return (
    <LanguageProvider>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" replace />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPostDetail />} />
          <Route path="/history" element={user ? <History /> : <Navigate to="/login" replace />} />
          <Route path="/sobre" element={<Sobre />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />
          <Route path="/termos-de-uso" element={<TermosDeUso />} />
          <Route path="/suporte" element={<Suporte />} />
        </Routes>
      </Suspense>
    </LanguageProvider>
  );
}