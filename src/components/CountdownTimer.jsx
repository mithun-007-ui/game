import React from 'react';
import { Play, Pause, RotateCcw, Clock } from 'lucide-react';
import { useAuction } from '../context/AuctionContext';

export default function CountdownTimer({ isAdmin = false }) {
  const { auctionState, pauseAuction, resumeAuction, resetTimer } = useAuction();
  const { timerRemaining = 30, timerDuration = 30, isTimerRunning = false } = auctionState;

  const pct = Math.max(0, Math.min(100, (timerRemaining / (timerDuration || 30)) * 100));

  let color = '#10b981'; // emerald green
  if (timerRemaining <= 5) {
    color = '#ef4444'; // urgent crimson red
  } else if (timerRemaining <= 10) {
    color = '#f59e0b'; // amber gold
  }

  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.75)',
        border: `1px solid ${timerRemaining <= 5 && isTimerRunning ? 'rgba(239, 68, 68, 0.7)' : 'var(--border-subtle)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        boxShadow: timerRemaining <= 5 && isTimerRunning ? '0 0 20px rgba(239, 68, 68, 0.4)' : 'none',
        transition: 'all 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>
          <Clock size={16} color={color} />
          <span>AUCTION COUNTDOWN</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span
            style={{
              fontSize: '2rem',
              fontWeight: 900,
              fontFamily: 'monospace',
              color: color,
              lineHeight: 1,
              animation: timerRemaining <= 5 && isTimerRunning ? 'pulse-badge 1s infinite' : 'none',
            }}
          >
            {timerRemaining < 10 ? `0${timerRemaining}` : timerRemaining}
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>s</span>
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: '100%',
          height: 6,
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}, #f472b6)`,
            transition: 'width 1s linear, background 0.3s ease',
          }}
        />
      </div>

      {/* Admin Controls */}
      {isAdmin && (
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          {isTimerRunning ? (
            <button
              onClick={pauseAuction}
              className="btn btn-secondary"
              style={{ flex: 1, padding: '6px 12px', fontSize: '0.85rem' }}
              title="Pause countdown"
            >
              <Pause size={14} /> Pause
            </button>
          ) : (
            <button
              onClick={resumeAuction}
              className="btn btn-primary"
              style={{ flex: 1, padding: '6px 12px', fontSize: '0.85rem' }}
              title="Resume countdown"
            >
              <Play size={14} /> Resume
            </button>
          )}

          <button
            onClick={resetTimer}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.85rem' }}
            title="Reset timer to duration"
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      )}
    </div>
  );
}
