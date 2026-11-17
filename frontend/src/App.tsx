import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Login';
import { HealthPage } from './pages/HealthPage';
import { BusinessesList } from './pages/superadmin/BusinessesList';
import { SystemOverview } from './pages/superadmin/SystemOverview';
import { TenantDashboard } from './pages/tenant/TenantDashboard';
import { BotsManager } from './pages/tenant/BotsManager';
import { KnowledgeBase } from './pages/tenant/KnowledgeBase';
import { ChannelsIntegration } from './pages/tenant/ChannelsIntegration';
import { TenantSettings } from './pages/tenant/TenantSettings';
import { NotFound } from './pages/NotFound';
import { Loader2 } from 'lucide-react';

const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: 'super_admin' | 'business_admin' }> = ({
  children,
  requiredRole,
}) => {
  const { isAuthenticated, isLoading, isSuperAdmin, isBusinessAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm">Connecting to secure workspace...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === 'super_admin' && !isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requiredRole === 'business_admin' && !isBusinessAdmin) {
    return <Navigate to="/admin/businesses" replace />;
  }

  return <>{children}</>;
};

const RootRedirect: React.FC = () => {
  const { isAuthenticated, isLoading, isSuperAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return isSuperAdmin ? (
    <Navigate to="/admin/businesses" replace />
  ) : (
    <Navigate to="/dashboard" replace />
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes inside AppLayout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<RootRedirect />} />
            <Route path="/health" element={<HealthPage />} />

            {/* Super Admin Routes */}
            <Route
              path="/admin/businesses"
              element={
                <ProtectedRoute requiredRole="super_admin">
                  <BusinessesList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/system"
              element={
                <ProtectedRoute requiredRole="super_admin">
                  <SystemOverview />
                </ProtectedRoute>
              }
            />

            {/* Tenant / Client Admin Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requiredRole="business_admin">
                  <TenantDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bots"
              element={
                <ProtectedRoute requiredRole="business_admin">
                  <BotsManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/knowledge"
              element={
                <ProtectedRoute requiredRole="business_admin">
                  <KnowledgeBase />
                </ProtectedRoute>
              }
            />
            <Route
              path="/channels"
              element={
                <ProtectedRoute requiredRole="business_admin">
                  <ChannelsIntegration />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute requiredRole="business_admin">
                  <TenantSettings />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
