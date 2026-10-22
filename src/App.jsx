import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuctionProvider, useAuction } from './context/AuctionContext';
import Navbar from './components/Navbar';
import SakuraPetals from './components/SakuraPetals';
import ToastContainer from './components/ToastContainer';
import MobileBottomNav from './components/MobileBottomNav';
import PWAInstallBanner from './components/PWAInstallBanner';

import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ParticipantDashboard from './pages/ParticipantDashboard';
import FinalResults from './pages/FinalResults';
import ProjectorView from './pages/ProjectorView';

// Protected Route wrapper requiring active authentication
function ProtectedRoute({ children, requireAdmin = false }) {
  const { currentUser, isAdmin } = useAuction();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/participant" replace />;
  }

  return children;
}

// Root route redirector: displays login on opening for unauthenticated visitors
function RootRedirect() {
  const { currentUser, isAdmin } = useAuction();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return isAdmin ? <Navigate to="/admin" replace /> : <Navigate to="/participant" replace />;
}

function AppLayout() {
  const location = useLocation();
  const { currentUser } = useAuction();
  const isProjector = location.pathname === '/projector';
  const isLoginPage = location.pathname === '/login';
  const isDedicatedDashboard = location.pathname === '/admin' || location.pathname === '/participant';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <SakuraPetals />
      {currentUser && !isProjector && !isLoginPage && <Navbar />}
      <div
        style={{ flex: 1, position: 'relative', zIndex: 1 }}
        className={currentUser && !isProjector && !isLoginPage ? 'has-bottom-nav' : ''}
      >
        <Routes>
          {/* Root route shows login immediately if not authenticated */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />

          {/* Protected Pages */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/participant"
            element={
              <ProtectedRoute>
                <ParticipantDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/results"
            element={
              <ProtectedRoute>
                <FinalResults />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projector"
            element={
              <ProtectedRoute>
                <ProjectorView />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {currentUser && !isProjector && !isDedicatedDashboard && !isLoginPage && <MobileBottomNav />}
      <PWAInstallBanner />
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AuctionProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AuctionProvider>
  );
}
