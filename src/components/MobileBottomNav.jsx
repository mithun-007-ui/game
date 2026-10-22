import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuction } from '../context/AuctionContext';
import {
  Radio,
  Wallet,
  Landmark,
  Trophy,
  Shield,
  Home,
  Gavel,
  Users,
  Settings,
} from 'lucide-react';

export default function MobileBottomNav({ adminActiveTab, setAdminActiveTab, participantActiveTab, setParticipantActiveTab }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, isAdmin, isParticipant, auctionState } = useAuction();

  const isLive = auctionState?.auctionStatus === 'live';
  const pathname = location.pathname;

  // Don't show if not authenticated or on Projector screen
  if (!currentUser || pathname === '/projector' || pathname === '/login') return null;

  // 1. Admin Mobile Bottom Navigation
  if (isAdmin && pathname === '/admin') {
    return (
      <nav className="mobile-bottom-nav" aria-label="Admin Mobile Navigation">
        <div className="mobile-bottom-nav-inner">
          <button
            type="button"
            className={`mobile-nav-btn ${adminActiveTab === 'live' ? 'active' : ''}`}
            onClick={() => setAdminActiveTab && setAdminActiveTab('live')}
          >
            {isLive && <span className="mobile-nav-badge" />}
            <Gavel size={18} />
            <span>Auction</span>
          </button>

          <button
            type="button"
            className={`mobile-nav-btn ${adminActiveTab === 'teams' ? 'active' : ''}`}
            onClick={() => setAdminActiveTab && setAdminActiveTab('teams')}
          >
            <Users size={18} />
            <span>Teams</span>
          </button>

          <button
            type="button"
            className={`mobile-nav-btn ${adminActiveTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setAdminActiveTab && setAdminActiveTab('inventory')}
          >
            <Landmark size={18} />
            <span>Places</span>
          </button>

          <button
            type="button"
            className={`mobile-nav-btn ${adminActiveTab === 'financials' ? 'active' : ''}`}
            onClick={() => setAdminActiveTab && setAdminActiveTab('financials')}
          >
            <Wallet size={18} />
            <span>Budgets</span>
          </button>

          <button
            type="button"
            className={`mobile-nav-btn ${adminActiveTab === 'settings' ? 'active' : ''}`}
            onClick={() => setAdminActiveTab && setAdminActiveTab('settings')}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </div>
      </nav>
    );
  }

  // 2. Participant Mobile Bottom Navigation
  if (isParticipant && pathname === '/participant') {
    return (
      <nav className="mobile-bottom-nav" aria-label="Participant Mobile Navigation">
        <div className="mobile-bottom-nav-inner">
          <button
            type="button"
            className={`mobile-nav-btn ${participantActiveTab === 'live' ? 'active' : ''}`}
            onClick={() => {
              if (setParticipantActiveTab) setParticipantActiveTab('live');
              const el = document.getElementById('live-stage-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            {isLive && <span className="mobile-nav-badge" />}
            <Radio size={18} color={isLive ? '#ef4444' : undefined} />
            <span>Live Stage</span>
          </button>

          <button
            type="button"
            className={`mobile-nav-btn ${participantActiveTab === 'purse' ? 'active' : ''}`}
            onClick={() => {
              if (setParticipantActiveTab) setParticipantActiveTab('purse');
              const el = document.getElementById('my-team-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <Wallet size={18} />
            <span>My Purse</span>
          </button>

          <button
            type="button"
            className={`mobile-nav-btn ${participantActiveTab === 'places' ? 'active' : ''}`}
            onClick={() => {
              if (setParticipantActiveTab) setParticipantActiveTab('places');
              const el = document.getElementById('catalog-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <Landmark size={18} />
            <span>Places</span>
          </button>

          <button
            type="button"
            className={`mobile-nav-btn ${pathname === '/results' ? 'active' : ''}`}
            onClick={() => navigate('/results')}
          >
            <Trophy size={18} />
            <span>Podium</span>
          </button>
        </div>
      </nav>
    );
  }

  // 3. General Public Mobile Navigation
  return (
    <nav className="mobile-bottom-nav" aria-label="General Mobile Navigation">
      <div className="mobile-bottom-nav-inner">
        <button
          type="button"
          className={`mobile-nav-btn ${pathname === '/' ? 'active' : ''}`}
          onClick={() => navigate('/')}
        >
          <Home size={18} />
          <span>Home</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-btn ${pathname === '/results' ? 'active' : ''}`}
          onClick={() => navigate('/results')}
        >
          <Trophy size={18} />
          <span>Results</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-btn ${pathname === '/login' ? 'active' : ''}`}
          onClick={() => navigate('/login')}
        >
          {currentUser ? <Shield size={18} /> : <Users size={18} />}
          <span>{currentUser ? (isAdmin ? 'Admin' : 'My Team') : 'Login'}</span>
        </button>
      </div>
    </nav>
  );
}
