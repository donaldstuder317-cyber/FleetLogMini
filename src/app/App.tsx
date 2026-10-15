import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ToastProvider } from '../components/common/ToastProvider';
import { AppShell } from '../components/layout/AppShell';
import { AddAssetPage } from '../pages/AddAssetPage';
import { AlertsPage } from '../pages/AlertsPage';
import { AssetDetailPage } from '../pages/AssetDetailPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ExportPage } from '../pages/ExportPage';
import { LogServicePage } from '../pages/LogServicePage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { FleetProvider } from './FleetProvider';

export function App() {
  return (
    <FleetProvider>
      <ToastProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route element={<AppShell />}>
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
    </FleetProvider>
  );
}
