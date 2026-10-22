import React, { useEffect } from 'react';
import { useAuction } from '../context/AuctionContext';
import { formatYen } from '../utils/currency';
import { playVictoryFanfare } from '../utils/audio';
import confetti from 'canvas-confetti';
import { Trophy, Medal, Award, Sparkles, Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FinalResults() {
  const { leaderboard, auctionState, isAdmin } = useAuction();
  const { resultsRevealed } = auctionState;

  useEffect(() => {
    if (resultsRevealed || isAdmin) {
      playVictoryFanfare();
      // Burst celebratory confetti
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#dc2626', '#f472b6', '#fbbf24', '#ffffff', '#38bdf8'],
        });
      } catch {
        // Ignore
      }
    }
  }, [resultsRevealed, isAdmin]);

  if (!resultsRevealed && !isAdmin) {
    return (
      <div
        style={{
          minHeight: '70vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <div className="glass-panel" style={{ maxWidth: 500, padding: 36, textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔒</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: 8 }}>
            Final Results Kept Secret
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: 20 }}>
            The auctioneer has not yet triggered the official results reveal. Stand by while the final places are auctioned and scores are verified.
          </p>
          <Link to="/participant" className="btn btn-primary">
            Return to Team Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const podiumTeams = leaderboard?.slice(0, 3) || [];
  const [firstPlace, secondPlace, thirdPlace] = podiumTeams;

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Title Header */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid var(--border-gold)',
            padding: '6px 16px',
            borderRadius: 'var(--radius-full)',
            color: '#fde047',
            fontSize: '0.85rem',
            fontWeight: 700,
          }}
        >
          <Sparkles size={16} /> OFFICIAL TOURNAMENT RESULTS
        </div>

        <h1
          style={{
            fontSize: '2.5rem',
            fontWeight: 900,
            color: '#fff',
            fontFamily: 'var(--font-display)',
            letterSpacing: '0.04em',
            marginTop: 6,
          }}
        >
          Grand Champion Ceremony
        </h1>
        <p style={{ fontSize: '1rem', color: '#fca5a5', fontFamily: 'var(--font-serif)', maxWidth: 600 }}>
          日本観光名所オークション 表彰式・最終結果発表
        </p>
      </div>

      {/* 3D-Style Visual Podium */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20,
          alignItems: 'flex-end',
          margin: '20px 0',
        }}
      >
        {/* 2nd Place */}
        {secondPlace && (
          <div
            className="glass-panel"
            style={{
              padding: '24px',
              border: '2px solid rgba(148, 163, 184, 0.4)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              order: 1,
            }}
          >
            <Medal size={42} color="#94a3b8" style={{ margin: '0 auto' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.08em' }}>
              2ND PLACE RUNNER-UP
            </span>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff' }}>
              {secondPlace.name}
            </h3>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Final Asset Score</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fde047' }}>
                {formatYen(secondPlace.totalAssetValue)}
              </div>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Secured: <strong>{secondPlace.purchasedCount}</strong> places • Spent: {formatYen(secondPlace.totalSpent)}
            </div>
          </div>
        )}

        {/* 1st Place Champion (Taller & Highlighted with Gold) */}
        {firstPlace && (
          <div
            className="glass-panel glow-gold"
            style={{
              padding: '36px 28px',
              border: '2px solid var(--border-gold)',
              background: 'linear-gradient(135deg, rgba(35, 25, 20, 0.95), rgba(40, 20, 20, 0.95))',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              order: 0,
              transform: 'scale(1.04)',
              zIndex: 2,
            }}
          >
            <Trophy size={56} color="#f59e0b" style={{ margin: '0 auto', filter: 'drop-shadow(0 0 15px rgba(245, 158, 11, 0.6))' }} />
            <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#fde047', letterSpacing: '0.12em' }}>
              👑 GRAND CHAMPION
            </span>
            <h2 style={{ fontSize: '2.1rem', fontWeight: 900, color: '#fff' }}>
              {firstPlace.name}
            </h2>
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid var(--border-gold)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <span style={{ fontSize: '0.78rem', color: '#fde047', fontWeight: 700 }}>CHAMPIONSHIP ASSET SCORE</span>
              <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#fde047', marginTop: 2 }}>
                {formatYen(firstPlace.totalAssetValue)}
              </div>
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              Secured: <strong>{firstPlace.purchasedCount}</strong> prestigious destinations • Remaining Purse: {formatYen(firstPlace.remainingPurse)}
            </div>
          </div>
        )}

        {/* 3rd Place */}
        {thirdPlace && (
          <div
            className="glass-panel"
            style={{
              padding: '24px',
              border: '2px solid rgba(180, 83, 9, 0.4)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              order: 2,
            }}
          >
            <Award size={42} color="#b45309" style={{ margin: '0 auto' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fb923c', letterSpacing: '0.08em' }}>
              3RD PLACE
            </span>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff' }}>
              {thirdPlace.name}
            </h3>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Final Asset Score</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fde047' }}>
                {formatYen(thirdPlace.totalAssetValue)}
              </div>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Secured: <strong>{thirdPlace.purchasedCount}</strong> places • Spent: {formatYen(thirdPlace.totalSpent)}
            </div>
          </div>
        )}
      </div>

      {/* Comprehensive Official Final Standings Table */}
      <div className="glass-panel" style={{ padding: '28px', overflowX: 'auto' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: 20 }}>
          Official Final Standings & Tie-Breaker Breakdown
        </h3>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 720 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.82rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 14px' }}>Rank</th>
              <th style={{ padding: '12px 14px' }}>Team Name</th>
              <th style={{ padding: '12px 14px', color: '#fde047' }}>Total Asset Value</th>
              <th style={{ padding: '12px 14px' }}>Secured Places</th>
              <th style={{ padding: '12px 14px' }}>Total Amount Spent</th>
              <th style={{ padding: '12px 14px', color: '#38bdf8' }}>Remaining Purse (Tie-Breaker)</th>
            </tr>
          </thead>
          <tbody>
            {(leaderboard || []).map((t) => (
              <tr key={t.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '14px', fontWeight: 900, color: t.rank === 1 ? '#f59e0b' : t.rank === 2 ? '#94a3b8' : t.rank === 3 ? '#fb923c' : '#fff' }}>
                  {t.rank === 1 ? '🥇 1st' : t.rank === 2 ? '🥈 2nd' : t.rank === 3 ? '🥉 3rd' : `#${t.rank}`}
                </td>
                <td style={{ padding: '14px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: t.color || '#f472b6' }} />
                  {t.name}
                </td>
                <td style={{ padding: '14px', fontWeight: 900, color: '#fde047', fontSize: '1.15rem' }}>
                  {formatYen(t.totalAssetValue)}
                </td>
                <td style={{ padding: '14px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span className="badge badge-sold" style={{ fontSize: '0.75rem', width: 'fit-content' }}>
                      {t.purchasedPlaces?.length || 0} places
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {t.purchasedPlaces?.map((p) => p.name.split(' (')[0]).join(', ') || 'None'}
                    </span>
                  </div>
                </td>
                <td style={{ padding: '14px', color: 'var(--text-secondary)' }}>
                  {formatYen(t.totalSpent)}
                </td>
                <td style={{ padding: '14px', color: '#38bdf8', fontWeight: 700 }}>
                  {formatYen(t.remainingPurse)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Navigation footer */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
        <Link to="/" className="btn btn-secondary">
          <ArrowLeft size={16} /> Return to Home
        </Link>
      </div>
    </div>
  );
}
