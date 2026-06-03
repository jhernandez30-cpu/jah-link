import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import LandingPage from './components/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CheckoutPage from './pages/CheckoutPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './pages/ProtectedRoute';
import ShortLinkResolver from './pages/ShortLinkResolver';
import PublicBioPage from './pages/PublicBioPage';
import LegalPage from './pages/LegalPage';
import DashboardView from './components/DashboardView';
import ShortLinksView from './components/ShortLinksView';
import BioPageBuilderView from './components/BioPageBuilderView';
import AnalyticsView from './components/AnalyticsView';
import QRCodeView from './components/QRCodeView';
import SettingsView from './components/SettingsView';
import { useApp } from './context/AppContext';

function DashboardHome() {
  const { links } = useApp();
  return (
    <DashboardView
      links={links}
      bioPagesCount={1}
      qrCount={links.filter((l) => l.qrCodeGenerated).length}
      onCreateNewLink={() => undefined}
      onNavigate={() => undefined}
    />
  );
}

function LinksPage() {
  const { links, addLink, updateLink, deleteLink, searchQuery } = useApp();
  const term = searchQuery.toLowerCase();
  const filtered = links.filter(
    (l) =>
      l.shortUrl.toLowerCase().includes(term) ||
      l.destination.toLowerCase().includes(term),
  );
  return (
    <ShortLinksView
      links={filtered}
      onAddLink={addLink}
      onDeleteLink={deleteLink}
      onUpdateLink={updateLink}
    />
  );
}

function BioPage() {
  const { bioConfig, saveBioConfig } = useApp();
  return (
    <BioPageBuilderView
      initialConfig={bioConfig}
      onSaveConfig={(config) => saveBioConfig(config)}
    />
  );
}

function AnalyticsPage() {
  const { links, analyticsEvents } = useApp();
  return <AnalyticsView links={links} events={analyticsEvents} />;
}

function QRPage() {
  const { links, qrCodes, createQr, deleteQr } = useApp();
  return <QRCodeView links={links} qrCodes={qrCodes} onCreateQr={createQr} onDeleteQr={deleteQr} />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/payment/success" element={<PaymentSuccessPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="links" element={<LinksPage />} />
        <Route path="bio" element={<BioPage />} />
        <Route path="bio/create" element={<BioPage />} />
        <Route path="bio/edit/:id" element={<BioPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="qr" element={<QRPage />} />
        <Route path="settings" element={<SettingsView />} />
      </Route>
      <Route path="/m/:username" element={<PublicBioPage />} />
      <Route path="/u/:username" element={<PublicBioPage />} />
      <Route path="/legal/*" element={<LegalPage />} />
      <Route path="/:slug" element={<ShortLinkResolver />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
