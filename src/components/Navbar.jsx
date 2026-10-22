import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuction } from '../context/AuctionContext';
import { isSoundEnabled, setSoundEnabled } from '../utils/audio';
import {
  Volume2,
  VolumeX,
  LogOut,
  Tv,
  Shield,
  Users,
  Radio,
  Sparkles,
} from 'lucide-react';

export default function Navbar() {
  const {
    currentUser,
    logout,
    auctionState,
    isAdmin,
    myTeam,
  } = useAuction();

  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const navigate = useNavigate();

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  };

  const { auctionStatus, resultsRevealed } = auctionState || {};

  let statusBadge = (
    <span className="badge badge-unsold" style={{ fontSize: '0.75rem' }}>
      Idle
    </span>
  );
  if (resultsRevealed) {
    statusBadge = (
      <span className="badge badge-gold" style={{ fontSize: '0.75rem' }}>
        <Sparkles size={11} /> Results Revealed
      </span>
    );
  } else if (auctionStatus === 'live') {
    statusBadge = (
      <span className="badge badge-live" style={{ fontSize: '0.75rem' }}>
        <Radio size={11} /> Live Auction
      </span>
    );
  } else if (auctionStatus === 'paused') {
    statusBadge = (
      <span className="badge" style={{ background: 'rgba(234, 179, 8, 0.2)', color: '#fde047', border: '1px solid rgba(234, 179, 8, 0.4)', fontSize: '0.75rem' }}>
        Paused
      </span>
    );
  }

  // Do not show Navbar if user is not authenticated
  if (!currentUser) {
    return null;
  }

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(11, 15, 23, 0.88)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '12px 24px',
      }}
    >
      <div
        style={{
          maxWidth: 1440,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        {/* Brand */}
        <Link
          to={isAdmin ? '/admin' : '/participant'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--crimson-bright), #7f1d1d)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(220, 38, 38, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <span style={{ fontSize: '1.25rem' }}>⛩️</span>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '0.04em', color: '#fff', fontFamily: 'var(--font-display)' }}>
                JAPAN AUCTION ARENA
              </span>
              {statusBadge}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#fca5a5', letterSpacing: '0.12em', fontFamily: 'var(--font-serif)' }}>
              日本観光名所オークションアリーナ
            </div>
          </div>
        </Link>

        {/* Right side controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Projector Mode button */}
          <Link
            to="/projector"
            className="btn btn-secondary"
            style={{ padding: '7px 12px', fontSize: '0.82rem' }}
            title="Open Auditorium Big-Screen Projector Display"
          >
            <Tv size={14} />
            <span className="hide-on-mobile">Projector</span>
          </Link>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={handleToggleSound}
            className="btn btn-secondary"
            style={{ padding: '7px 10px', fontSize: '0.82rem' }}
            title={soundOn ? 'Mute Sounds' : 'Unmute Sounds'}
          >
            {soundOn ? <Volume2 size={15} color="#34d399" /> : <VolumeX size={15} color="var(--text-muted)" />}
          </button>

          {/* User profile / Role badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                background: isAdmin ? 'rgba(220, 38, 38, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                border: `1px solid ${isAdmin ? 'var(--border-crimson)' : 'rgba(56, 189, 248, 0.4)'}`,
                padding: '5px 12px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.85rem',
                fontWeight: 600,
                color: isAdmin ? '#fca5a5' : '#7dd3fc',
              }}
            >
              {isAdmin ? <Shield size={14} /> : <Users size={14} />}
              <span>{isAdmin ? 'Auctioneer' : (myTeam?.name || currentUser.name)}</span>
            </div>

            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="btn btn-secondary"
              style={{ padding: '7px 10px' }}
              title="Logout"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
