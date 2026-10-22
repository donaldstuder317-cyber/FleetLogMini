import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ToastProvider } from '../components/common/ToastProvider';
import { AppShell } from '../components/layout/AppShell';
import { GuestOnly, RequireAuth } from '../components/layout/AuthGate';
import { AuthLayout } from '../components/layout/AuthLayout';
import { useAuth } from '../hooks/useAuth';
import { AddAssetPage } from '../pages/AddAssetPage';
import { AlertsPage } from '../pages/AlertsPage';
import { AssetDetailPage } from '../pages/AssetDetailPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ExportPage } from '../pages/ExportPage';
import { LogServicePage } from '../pages/LogServicePage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { SignInPage } from '../pages/SignInPage';
import { SignUpPage } from '../pages/SignUpPage';
import { AuthProvider } from './AuthProvider';
import { FleetProvider } from './FleetProvider';

/** Keyed by user, so switching accounts never shows the previous user's fleet. */
function SignedInApp() {
  const { user } = useAuth();
  return (
    <FleetProvider key={user!.id}>
      <AppShell />
    </FleetProvider>
  );
}

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route element={<GuestOnly><AuthLayout /></GuestOnly>}>
              <Route path="sign-in" element={<SignInPage />} />
              <Route path="sign-up" element={<SignUpPage />} />
            </Route>
            <Route element={<RequireAuth><SignedInApp /></RequireAuth>}>
              <Route index element={<DashboardPage />} />
              <Route path="assets/new" element={<AddAssetPage />} />
              <Route path="assets/:id" element={<AssetDetailPage />} />
              <Route path="log" element={<LogServicePage />} />
              <Route path="alerts" element={<AlertsPage />} />
              <Route path="export" element={<ExportPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
