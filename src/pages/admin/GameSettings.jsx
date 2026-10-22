import React, { useState } from 'react';
import { useAuction } from '../../context/AuctionContext';
import { formatYen } from '../../utils/currency';
import { Settings, ShieldAlert, Sparkles, Clock, Eye, AlertOctagon, CheckCircle2 } from 'lucide-react';

export default function GameSettings() {
  const {
    auctionState,
    setTimerDuration,
    toggleLeadingTeamVisibility,
    revealFinalResults,
    resetGame,
    isFirebase,
    showToast,
  } = useAuction();

  const [timerInput, setTimerInput] = useState(auctionState.timerDuration || 30);
  const [resetConfirmation, setResetConfirmation] = useState('');

  const handleUpdateTimer = (e) => {
    e.preventDefault();
    setTimerDuration(timerInput);
    showToast(`Auction countdown set to ${timerInput} seconds.`, 'success');
  };

  const handleToggleVisibility = (e) => {
    toggleLeadingTeamVisibility(e.target.checked);
    showToast(
      `Leading team ${e.target.checked ? 'visible' : 'hidden'} on participant screens.`,
      'info'
    );
  };

  const handleReveal = () => {
    if (window.confirm('Are you sure you want to reveal official final scores and standings to all participants?')) {
      revealFinalResults();
      showToast('Grand reveal activated! Participants can now view final scores.', 'gold');
    }
  };

  const handleReset = (e) => {
    e.preventDefault();
    if (resetConfirmation !== 'RESET GAME') {
      showToast('Please type "RESET GAME" exactly to confirm.', 'error');
      return;
    }
    try {
      resetGame('RESET GAME');
      setResetConfirmation('');
      showToast('Arena reset successfully for a new game event!', 'info');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 900 }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Settings size={24} color="var(--crimson-bright)" /> Auction Game Settings & Controls
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>
          Configure live auction parameters, participant privacy toggles, and event lifecycle.
        </p>
      </div>

      {/* Countdown Timer Config */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={18} color="#38bdf8" /> Live Bid Countdown Timer
        </h3>

        <form onSubmit={handleUpdateTimer} style={{ display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="timerDurationInput">
              Duration per Bid Round (seconds)
            </label>
            <input
              id="timerDurationInput"
              type="number"
              className="form-input"
              style={{ width: 180 }}
              value={timerInput}
              min="5"
              max="300"
              onChange={(e) => setTimerInput(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary">
            Save Timer Duration
          </button>
        </form>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8, display: 'block' }}>
          Whenever a new high bid is submitted, the timer automatically resets to this duration.
        </span>
      </div>

      {/* Privacy & Display Settings */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Eye size={18} color="#f59e0b" /> Participant Visibility Options
        </h3>

        <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={auctionState.showLeadingTeamToParticipants}
            onChange={handleToggleVisibility}
            style={{ width: 18, height: 18, accentColor: 'var(--crimson-bright)' }}
          />
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>
              Show Current Leading Team Name to Participants
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              When enabled, team screens see which team holds the current highest bid.
            </p>
          </div>
        </label>
      </div>

      {/* Grand Reveal Final Results */}
      <div className="glass-panel glow-gold" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fde047', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={18} /> Grand Results Reveal Control
        </h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
          Until revealed, secret asset values and official scores are completely withheld from all participant interfaces. Click below when all destinations have been auctioned to initiate the Grand Reveal Ceremony.
        </p>

        <button
          onClick={handleReveal}
          className="btn btn-gold"
          style={{ fontWeight: 800 }}
          disabled={auctionState.resultsRevealed}
        >
          {auctionState.resultsRevealed ? '✓ Final Results Already Revealed' : '🎉 Trigger Grand Results Reveal'}
        </button>
      </div>

      {/* Backend & Deployment Status */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={18} color={isFirebase ? '#f59e0b' : '#10b981'} /> Backend Engine & Synchronization
        </h3>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Current Active Mode:{' '}
          <strong style={{ color: isFirebase ? '#f59e0b' : '#10b981' }}>
            {isFirebase ? 'Firebase Firestore Production Mode' : 'Local Arena Multi-Tab Real-Time Sync'}
          </strong>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 8 }}>
          {isFirebase
            ? 'Real-time synchronization across devices is powered by Cloud Firestore onSnapshot listeners and Firestore security rules (Firebase Spark Plan).'
            : 'In Local Mode, tabs communicate instantly via the browser’s BroadcastChannel without external configuration. To switch to Firebase Firestore, add your credentials to .env.'}
        </p>

        {isFirebase && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              onClick={async () => {
                try {
                  showToast('Seeding Firestore database...', 'info');
                  const res = await useAuction().seedFirestoreDatabase();
                  showToast(`Successfully seeded ${res.count} destinations and teams to Firestore!`, 'gold');
                } catch (e) {
                  showToast(`Firestore seeding error: ${e.message}`, 'error');
                }
              }}
              className="btn btn-gold"
              style={{ fontSize: '0.85rem' }}
            >
              Seed Initial Inventory to Firestore
            </button>
          </div>
        )}
      </div>

      {/* Danger Zone: Reset Game */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          background: 'rgba(239, 68, 68, 0.05)',
        }}
      >
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f87171', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertOctagon size={18} /> Danger Zone: Reset Game for New Event
        </h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
          Resetting will reset all destinations to Available, refund team purses to ¥100,000,000, clear purchase histories, and reset auction state. This cannot be undone.
        </p>

        <form onSubmit={handleReset} style={{ display: 'flex', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="resetConfirmInput" style={{ color: '#fca5a5' }}>
              Type "RESET GAME" to confirm:
            </label>
            <input
              id="resetConfirmInput"
              type="text"
              className="form-input"
              style={{ width: 220, borderColor: 'rgba(239, 68, 68, 0.4)' }}
              placeholder="RESET GAME"
              value={resetConfirmation}
              onChange={(e) => setResetConfirmation(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-danger"
            disabled={resetConfirmation !== 'RESET GAME'}
          >
            Confirm & Wipe Game Data
          </button>
        </form>
      </div>
    </div>
  );
}
