/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { useAppStore } from './store/useAppStore';

// Common
import { AcademicRibbon } from './components/common/AcademicRibbon';
import { ToastContainer } from './components/common/ToastContainer';
import { InactivityGuard } from './components/common/InactivityGuard';
import { PrintableConstanciaModal } from './components/common/PrintableConstanciaModal';

// Public
import { HomePage } from './pages/public/HomePage';

// Admin
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminRequestsPage } from './pages/admin/AdminRequestsPage';
import { AdminClientsPage } from './pages/admin/AdminClientsPage';
import { AdminBillingPage } from './pages/admin/AdminBillingPage';
import { AdminVisitsPage } from './pages/admin/AdminVisitsPage';
import { AdminRulesPage } from './pages/admin/AdminRulesPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';

// Client
import { ClientLoginPage } from './pages/client/ClientLoginPage';
import { ClientLayout } from './components/client/ClientLayout';
import { ClientHomePage } from './pages/client/ClientHomePage';
import { ClientInvoicesPage } from './pages/client/ClientInvoicesPage';
import { ClientRequestsPage } from './pages/client/ClientRequestsPage';
import { ClientFilingPage } from './pages/client/ClientFilingPage';
import { ClientNotificationsPage } from './pages/client/ClientNotificationsPage';

const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, addToast } = useAppStore();
  const notifiedRef = useRef(false);

  useEffect(() => {
    if (session.role === 'client' && !notifiedRef.current) {
      notifiedRef.current = true;
      addToast({
        type: 'error',
        title: 'Acceso denegado',
        description: 'Las rutas administrativas están restringidas al personal autorizado de EPM.',
      });
    }
  }, [session.role, addToast]);

  if (session.role === 'admin') return <>{children}</>;
  if (session.role === 'client') return <Navigate to="/clientes" replace />;
  return <Navigate to="/admin/login" replace />;
};

const ClientGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, addToast } = useAppStore();
  const notifiedRef = useRef(false);

  useEffect(() => {
    if (session.role === 'admin' && !notifiedRef.current) {
      notifiedRef.current = true;
      addToast({
        type: 'info',
        title: 'Redirigido a Consola Administrativa',
        description: 'Cierra tu sesión administrativa para ingresar como cliente.',
      });
    }
  }, [session.role, addToast]);

  if (session.role === 'client') return <>{children}</>;
  if (session.role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/clientes/login" replace />;
};

export default function App() {
  const { fontScale, highContrast } = useAppStore();

  useEffect(() => {
    const html = document.documentElement;
    if (highContrast) html.classList.add('high-contrast');
    else html.classList.remove('high-contrast');

    html.style.fontSize = fontScale === 'large' ? '18px' : '16px';
  }, [fontScale, highContrast]);

  return (
    <MotionConfig reducedMotion="user">
      <HashRouter>
        <AcademicRibbon />
        <Routes>
          {/* Vista 1: Sitio institucional público */}
          <Route path="/" element={<HomePage />} />

          {/* Vista 2: Trabajadores EPM (Consola administrativa) */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin"
            element={
              <AdminGuard>
                <AdminLayout />
              </AdminGuard>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="solicitudes" element={<AdminRequestsPage />} />
            <Route path="clientes" element={<AdminClientsPage />} />
            <Route path="facturacion" element={<AdminBillingPage />} />
            <Route path="visitas" element={<AdminVisitsPage />} />
            <Route path="reglas" element={<AdminRulesPage />} />
            <Route path="reportes" element={<AdminReportsPage />} />
          </Route>

          {/* Vista 3: Portal de autogestión de clientes */}
          <Route path="/clientes/login" element={<ClientLoginPage />} />
          <Route
            path="/clientes"
            element={
              <ClientGuard>
                <ClientLayout />
              </ClientGuard>
            }
          >
            <Route index element={<ClientHomePage />} />
            <Route path="facturas" element={<ClientInvoicesPage />} />
            <Route path="solicitudes" element={<ClientRequestsPage />} />
            <Route path="radicar" element={<ClientFilingPage />} />
            <Route path="notificaciones" element={<ClientNotificationsPage />} />
          </Route>

          {/* Respaldo */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <InactivityGuard />
        <PrintableConstanciaModal />
        <ToastContainer />
      </HashRouter>
    </MotionConfig>
  );
}
