import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { CompanyPanelProvider } from './context/CompanyPanelContext';
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
  const location = useLocation();

  // Se veio de um link "overlay" (ver Navbar), a rota real de fundo
  // fica guardada aqui — as rotas de baixo continuam a renderizar essa.
  const state = location.state as { backgroundLocation?: Location } | null;
  const backgroundLocation = state?.backgroundLocation;

  if (isLoading) {
    return <PageFallback />;
  }

  return (
    <LanguageProvider>
    <CompanyPanelProvider>
    <Suspense fallback={<PageFallback />}>
      {/* Camada de baixo: renderiza sempre a localização "real" de fundo
          quando existe, para o Dashboard nunca desmontar por causa de um overlay. */}
      <Routes location={backgroundLocation || location}>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route
          path="/"
          element={
            user
              ? <Dashboard isOverlayActive={Boolean(backgroundLocation)} />
              : <Navigate to="/login" replace />
          }
        />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPostDetail />} />
        <Route
          path="/history"
          element={
            user
              ? <History isOverlayActive={Boolean(backgroundLocation)} />
              : <Navigate to="/login" replace />
          }
        />
        {/* Acesso direto/refresh sem overlay ativo: nunca mostra a página sozinha, volta ao Dashboard */}
        <Route path="/sobre" element={<Navigate to="/" replace />} />
        <Route path="/faq" element={<Navigate to="/" replace />} />
        <Route path="/politica-privacidade" element={<Navigate to="/" replace />} />
        <Route path="/termos-de-uso" element={<Navigate to="/" replace />} />
        <Route path="/suporte" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Camada de cima: só existe quando se navegou a partir de um link
          com state.backgroundLocation — renderiza por cima, sem desmontar o de baixo. */}
      {backgroundLocation && (
        <Routes>
          <Route path="/sobre" element={<Sobre />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />
          <Route path="/termos-de-uso" element={<TermosDeUso />} />
          <Route path="/suporte" element={<Suporte />} />
        </Routes>
      )}
    </Suspense>
    </CompanyPanelProvider>
    </LanguageProvider>
  );
}