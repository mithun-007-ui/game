import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuction } from '../context/AuctionContext';
import { isSoundEnabled, setSoundEnabled } from '../utils/audio';
import { getSafeFirebaseConfig } from '../services/firebase';
import Modal from './Modal';
import {
  Volume2,
  VolumeX,
  LogOut,
  Tv,
  Shield,
  Users,
  Radio,
  Sparkles,
  Database,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Flame,
} from 'lucide-react';

export default function Navbar() {
  const {
    currentUser,
    logout,
    auctionState,
    isFirebase,
    connectionStatus,
    connectionError,
    isAdmin,
    myTeam,
    seedFirestoreDatabase,
    showToast,
  } = useAuction();

  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const navigate = useNavigate();

  const safeConfig = getSafeFirebaseConfig();

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  };

  const handleSeedFirestore = async () => {
    try {
      setIsSeeding(true);
      await seedFirestoreDatabase();
      showToast('Successfully seeded 10 destinations, teams, and auction state into Firestore!', 'gold');
    } catch (err) {
      showToast(`Firestore seeding error: ${err.message}`, 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  const { auctionStatus, resultsRevealed } = auctionState;

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

  // Connection dot & label
  let dotColor = '#10b981';
  let connectionLabel = 'Local Real-Time Sync';
  if (isFirebase) {
    if (connectionStatus === 'connected') {
      dotColor = '#f59e0b';
      connectionLabel = 'Firebase Connected';
    } else if (connectionStatus === 'connecting') {
      dotColor = '#fde047';
      connectionLabel = 'Firebase Connecting...';
    } else if (connectionStatus === 'error') {
      dotColor = '#ef4444';
      connectionLabel = 'Firebase Offline (Local)';
    }
  }

  return (
    <>
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
            to="/"
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
                日本観光名所オークション管理システム
              </div>
            </div>
          </Link>

          {/* Right side controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Interactive Connection Mode Pill */}
            <button
              type="button"
              onClick={() => setShowStatusModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              title="Click to view Backend & Connection diagnostics"
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: dotColor,
                  boxShadow: `0 0 8px ${dotColor}`,
                }}
              />
              <span style={{ fontWeight: 600 }}>{connectionLabel}</span>
              <HelpCircle size={12} color="var(--text-muted)" />
            </button>

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
              onClick={handleToggleSound}
              className="btn btn-secondary"
              style={{ padding: '7px 10px', fontSize: '0.82rem' }}
              title={soundOn ? 'Mute Sounds' : 'Unmute Sounds'}
            >
              {soundOn ? <Volume2 size={15} color="#34d399" /> : <VolumeX size={15} color="var(--text-muted)" />}
            </button>

            {/* User profile / Role badge */}
            {currentUser && (
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
            )}
          </div>
        </div>
      </header>

      {/* BACKEND & CONNECTION DIAGNOSTICS MODAL */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Backend & Real-Time Sync Diagnostics"
        maxWidth={580}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Active Mode Banner */}
          <div
            style={{
              padding: 16,
              borderRadius: 'var(--radius-md)',
              background: isFirebase ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              border: `1px solid ${isFirebase ? 'var(--border-gold)' : 'rgba(16, 185, 129, 0.3)'}`,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            {isFirebase ? (
              <Flame size={24} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
            ) : (
              <CheckCircle2 size={24} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
            )}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>
                {isFirebase ? 'Production Firebase Mode' : 'Local Arena Multi-Tab Simulation Engine'}
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.45 }}>
                {isFirebase
                  ? 'Connected to Firebase Firestore with real-time onSnapshot listeners and cloud database persistence.'
                  : 'Operating in High-Speed Local Mode using the browser BroadcastChannel API and localStorage. Synchronizes instantaneously across multiple browser windows, tabs, and projector screens without external credentials.'}
              </p>
            </div>
          </div>

          {/* Configuration Parameters */}
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>
              Configuration Status
            </h5>

            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 8, fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Status:</span>
              <span style={{ fontWeight: 700, color: dotColor }}>{connectionStatus.toUpperCase()}</span>

              <span style={{ color: 'var(--text-muted)' }}>Project ID:</span>
              <code style={{ color: '#fff' }}>{safeConfig.projectId}</code>

              <span style={{ color: 'var(--text-muted)' }}>API Key:</span>
              <code style={{ color: 'var(--text-secondary)' }}>{safeConfig.apiKeyMasked}</code>

              <span style={{ color: 'var(--text-muted)' }}>Auth Domain:</span>
              <code style={{ color: 'var(--text-secondary)' }}>{safeConfig.authDomain}</code>
            </div>

            {connectionError && (
              <div style={{ marginTop: 12, padding: 8, background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: 'var(--radius-sm)', color: '#fca5a5', fontSize: '0.8rem' }}>
                <AlertCircle size={14} style={{ display: 'inline', marginRight: 6 }} />
                Error: {connectionError}
              </div>
            )}
          </div>

          {/* Admin Seeding Helper */}
          {isAdmin && isFirebase && (
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
              <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginBottom: 6 }}>
                Firestore Initial Database Seeder
              </h5>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                Push the 10 initial destinations, secret valuations, and default teams into your Firestore collections.
              </p>

              <button
                type="button"
                onClick={handleSeedFirestore}
                className="btn btn-gold"
                disabled={isSeeding}
                style={{ fontSize: '0.85rem' }}
              >
                <Database size={14} /> {isSeeding ? 'Seeding Firestore...' : 'Seed Initial Inventory to Firestore'}
              </button>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" onClick={() => setShowStatusModal(false)} className="btn btn-secondary">
              Close Diagnostics
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
