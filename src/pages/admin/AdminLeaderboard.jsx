import React from 'react';
import { useAuction } from '../../context/AuctionContext';
import { formatYen } from '../../utils/currency';
import { Trophy, Medal, Award, Sparkles, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminLeaderboard() {
  const { leaderboard, auctionState, revealFinalResults, showToast } = useAuction();
  const { resultsRevealed } = auctionState;

  const handleReveal = () => {
    if (window.confirm('Are you ready to reveal the final official rankings and secret asset scores to all participants and projector screens?')) {
      revealFinalResults();
      showToast('🎉 GRAND REVEAL! Final results and rankings are now revealed across all dashboards!', 'gold');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Trophy size={24} color="#f59e0b" /> Confidential Auctioneer Leaderboard
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Real-time standings ranked by secret total asset values. Hidden from participants until you trigger the Grand Reveal.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!resultsRevealed ? (
            <button onClick={handleReveal} className="btn btn-gold" style={{ fontWeight: 800 }}>
              <Sparkles size={16} /> Reveal Official Results to All
            </button>
          ) : (
            <Link to="/results" className="btn btn-gold" style={{ fontWeight: 800 }}>
              <Eye size={16} /> View Grand Reveal Ceremony Screen
            </Link>
          )}
        </div>
      </div>

      {/* Podium Top 3 Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {leaderboard?.slice(0, 3).map((team, idx) => {
          let medalIcon = <Trophy size={28} color="#f59e0b" />;
          let rankTitle = '1st Place Champion';
          let borderGlow = 'var(--border-gold)';

          if (idx === 1) {
            medalIcon = <Medal size={28} color="#94a3b8" />;
            rankTitle = '2nd Place Runner-Up';
            borderGlow = 'rgba(148, 163, 184, 0.4)';
          } else if (idx === 2) {
            medalIcon = <Award size={28} color="#b45309" />;
            rankTitle = '3rd Place';
            borderGlow = 'rgba(180, 83, 9, 0.4)';
          }

          return (
            <div
              key={team.id}
              className="glass-panel"
              style={{
                padding: '24px',
                border: `2px solid ${borderGlow}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fde047', textTransform: 'uppercase' }}>
                  {rankTitle}
                </span>
                {medalIcon}
              </div>

              <div>
                <h3 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#fff' }}>
                  {team.name}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {team.purchasedCount} destination{team.purchasedCount === 1 ? '' : 's'} secured
                </span>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: 'var(--radius-md)', marginTop: 8 }}>
                <span style={{ fontSize: '0.72rem', color: '#fde047', fontWeight: 600 }}>Total Asset Value</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fde047' }}>
                  {formatYen(team.totalAssetValue)}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <span>Spent: {formatYen(team.totalSpent)}</span>
                <span>Purse: {formatYen(team.remainingPurse)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Complete Rankings Table */}
      <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: 16 }}>
          Full Standings Table
        </h3>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 650 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.82rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 14px' }}>Rank</th>
              <th style={{ padding: '12px 14px' }}>Team Name</th>
              <th style={{ padding: '12px 14px', color: '#fde047' }}>Total Asset Value</th>
              <th style={{ padding: '12px 14px' }}>Places Purchased</th>
              <th style={{ padding: '12px 14px' }}>Total Spent</th>
              <th style={{ padding: '12px 14px' }}>Remaining Purse</th>
            </tr>
          </thead>
          <tbody>
            {(leaderboard || []).map((t) => (
              <tr key={t.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '14px', fontWeight: 800, color: t.rank <= 3 ? '#fde047' : '#fff' }}>
                  #{t.rank}
                </td>
                <td style={{ padding: '14px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: t.color || '#f472b6' }} />
                  {t.name}
                </td>
                <td style={{ padding: '14px', fontWeight: 900, color: '#fde047', fontSize: '1.05rem' }}>
                  {formatYen(t.totalAssetValue)}
                </td>
                <td style={{ padding: '14px' }}>
                  <span className="badge badge-sold" style={{ fontSize: '0.75rem' }}>
                    {t.purchasedCount} place{t.purchasedCount === 1 ? '' : 's'}
                  </span>
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
    </div>
  );
}
