import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuctionProvider } from './context/AuctionContext';
import Navbar from './components/Navbar';
import SakuraPetals from './components/SakuraPetals';
import ToastContainer from './components/ToastContainer';

import Home from './pages/Home';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ParticipantDashboard from './pages/ParticipantDashboard';
import FinalResults from './pages/FinalResults';
import ProjectorView from './pages/ProjectorView';

function AppLayout() {
  const location = useLocation();
  const isProjector = location.pathname === '/projector';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <SakuraPetals />
      {!isProjector && <Navbar />}
      <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/participant" element={<ParticipantDashboard />} />
          <Route path="/results" element={<FinalResults />} />
          <Route path="/projector" element={<ProjectorView />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </div>
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
