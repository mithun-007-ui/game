import React, { useState } from 'react';
import { useAuction } from '../context/AuctionContext';
import CountdownTimer from '../components/CountdownTimer';
import { formatYen } from '../utils/currency';
import { Tv, Radio, MapPin, TrendingUp, Trophy, ArrowLeft, Maximize2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ProjectorView() {
  const { currentAuctionPlace, auctionState, leadingTeam, leaderboard } = useAuction();
  const [viewMode, setViewMode] = useState('stage'); // 'stage' | 'leaderboard'
  const { auctionStatus, currentBid, showLeadingTeamToParticipants } = auctionState;

  const isLive = auctionStatus === 'live';

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#070a10',
        color: '#fff',
        padding: '24px 32px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 1,
      }}
    >
      {/* Top Projector Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          paddingBottom: 16,
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--crimson-bright), #7f1d1d)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.6rem',
              boxShadow: '0 0 20px rgba(220, 38, 38, 0.6)',
            }}
          >
            ⛩️
          </div>

          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '0.06em', fontFamily: 'var(--font-display)' }}>
              JAPAN AUCTION ARENA
            </h1>
            <span style={{ fontSize: '0.85rem', color: '#fca5a5', fontFamily: 'var(--font-serif)', letterSpacing: '0.1em' }}>
              LIVE AUDITORIUM ARENA STAGE
            </span>
          </div>
        </div>

        {/* View switcher & controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 'var(--radius-md)', padding: 4 }}>
            <button
              onClick={() => setViewMode('stage')}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: viewMode === 'stage' ? 'var(--crimson)' : 'transparent',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Live Stage
            </button>
            <button
              onClick={() => setViewMode('leaderboard')}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: viewMode === 'leaderboard' ? 'var(--crimson)' : 'transparent',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Standings
            </button>
          </div>

          <button
            onClick={toggleFullScreen}
            className="btn btn-secondary"
            style={{ padding: '8px 12px' }}
            title="Toggle Fullscreen"
          >
            <Maximize2 size={16} />
          </button>

          <Link to="/" className="btn btn-secondary" style={{ padding: '8px 12px' }}>
            <ArrowLeft size={16} /> Exit
          </Link>
        </div>
      </header>

      {/* VIEW 1: LIVE STAGE */}
      {viewMode === 'stage' && (
        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: 32,
            alignItems: 'center',
          }}
        >
          {/* Giant Place Media */}
          <div
            className="glass-panel"
            style={{
              height: 'calc(100vh - 200px)',
              maxHeight: 680,
              overflow: 'hidden',
              position: 'relative',
              borderRadius: 'var(--radius-xl)',
              border: isLive ? '2px solid var(--crimson-bright)' : '1px solid var(--border-subtle)',
              boxShadow: isLive ? '0 0 40px rgba(220, 38, 38, 0.45)' : 'none',
            }}
          >
            <img
              src={currentAuctionPlace?.imageUrl}
              alt={currentAuctionPlace?.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(7, 10, 16, 0.98) 0%, rgba(7, 10, 16, 0.3) 50%, transparent 100%)',
              }}
            />

            <div style={{ position: 'absolute', bottom: 32, left: 32, right: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fca5a5', fontSize: '1.1rem', fontWeight: 600 }}>
                <MapPin size={20} /> {currentAuctionPlace?.location}
              </div>
              <h2
                style={{
                  fontSize: '3rem',
                  fontWeight: 900,
                  color: '#fff',
                  fontFamily: 'var(--font-display)',
                  lineHeight: 1.15,
                  marginTop: 6,
                  textShadow: '0 4px 12px rgba(0,0,0,0.9)',
                }}
              >
                {currentAuctionPlace?.name}
              </h2>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginTop: 12, lineHeight: 1.5, maxWidth: 640 }}>
                {currentAuctionPlace?.description}
              </p>
            </div>
          </div>

          {/* Giant Bidding Console */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <CountdownTimer isAdmin={false} />

            {/* Giant Bid Display */}
            <div
              className="glass-panel"
              style={{
                padding: '36px 32px',
                border: '2px solid var(--border-gold)',
                background: 'linear-gradient(135deg, rgba(30, 20, 15, 0.95), rgba(15, 23, 42, 0.95))',
                borderRadius: 'var(--radius-xl)',
                boxShadow: '0 0 35px rgba(245, 158, 11, 0.25)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fde047', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrendingUp size={22} /> CURRENT HIGHEST CONFIRMED BID
                </span>
                <span
                  className={isLive ? 'badge badge-live' : 'badge badge-unsold'}
                  style={{ fontSize: '0.9rem', padding: '6px 14px' }}
                >
                  {auctionStatus.toUpperCase()}
                </span>
              </div>

              <div
                style={{
                  fontSize: '4.5rem',
                  fontWeight: 900,
                  color: '#fff',
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                  fontFamily: 'var(--font-body)',
                  margin: '12px 0',
                }}
              >
                {formatYen(currentBid || currentAuctionPlace?.basePrice || 0)}
              </div>

              {showLeadingTeamToParticipants && leadingTeam && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    background: leadingTeam.color || '#f472b6',
                    color: '#000',
                    fontWeight: 900,
                    fontSize: '1.35rem',
                    padding: '8px 20px',
                    borderRadius: 'var(--radius-full)',
                    marginTop: 8,
                  }}
                >
                  👑 LEADING: {leadingTeam.name.toUpperCase()}
                </div>
              )}

              <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginTop: 16 }}>
                Base Opening Bid: <strong>{formatYen(currentAuctionPlace?.basePrice)}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: LEADERBOARD STANDINGS */}
      {viewMode === 'leaderboard' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Trophy size={28} color="#f59e0b" /> Tournament Standings
          </h2>

          <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '1.15rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.15)', color: '#fde047', textTransform: 'uppercase' }}>
                  <th style={{ padding: '16px' }}>Rank</th>
                  <th style={{ padding: '16px' }}>Team</th>
                  <th style={{ padding: '16px' }}>Destinations Secured</th>
                  <th style={{ padding: '16px' }}>Remaining Purse</th>
                </tr>
              </thead>
              <tbody>
                {(leaderboard || []).map((t, idx) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <td style={{ padding: '18px 16px', fontWeight: 900, color: idx === 0 ? '#f59e0b' : '#fff' }}>
                      #{idx + 1}
                    </td>
                    <td style={{ padding: '18px 16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ width: 14, height: 14, borderRadius: '50%', background: t.color || '#f472b6' }} />
                      {t.name}
                    </td>
                    <td style={{ padding: '18px 16px' }}>
                      <span className="badge badge-sold" style={{ fontSize: '0.9rem', padding: '6px 14px' }}>
                        {t.purchasedPlaces?.length || 0} places
                      </span>
                    </td>
                    <td style={{ padding: '18px 16px', fontWeight: 800, color: '#38bdf8' }}>
                      {formatYen(t.remainingPurse)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <span>Japan Auction Arena • College Festival Event Edition</span>
        <span>Real-time Event Synchronization Active</span>
      </footer>
    </div>
  );
}
