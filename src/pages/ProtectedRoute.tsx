import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useApp } from '../context/AppContext';
import BrandLogo from '../components/BrandLogo';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { isAuthenticated, authLoading } = useApp();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <BrandLogo size="md" />
        <p className="text-[var(--text-secondary)] text-sm">Cargando sesión…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
