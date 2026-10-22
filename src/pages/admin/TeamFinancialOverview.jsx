import React, { useState } from 'react';
import { useAuction } from '../../context/AuctionContext';
import { formatYen } from '../../utils/currency';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { DollarSign, TrendingUp, Sparkles, PieChart, Info } from 'lucide-react';

export default function TeamFinancialOverview() {
  const { allTeamFinancials } = useAuction();
  const [showNetDiff, setShowNetDiff] = useState(true);

  // Prepare data for Recharts
  const chartData = (allTeamFinancials || []).map((t) => ({
    name: t.name.replace('Team ', ''),
    remainingPurseM: Number((t.remainingPurse / 1_000_000).toFixed(1)),
    totalSpentM: Number((t.totalSpent / 1_000_000).toFixed(1)),
    assetValueM: Number((t.totalAssetValue / 1_000_000).toFixed(1)),
    netDiffM: Number((t.netDifference / 1_000_000).toFixed(1)),
    raw: t,
  }));

  // Aggregated totals
  const totalPurseAll = (allTeamFinancials || []).reduce((sum, t) => sum + t.startingPurse, 0);
  const totalSpentAll = (allTeamFinancials || []).reduce((sum, t) => sum + t.totalSpent, 0);
  const totalAssetAll = (allTeamFinancials || []).reduce((sum, t) => sum + t.totalAssetValue, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Banner */}
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
            <DollarSign size={24} color="#f59e0b" /> Team Financial Overview
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Complete confidential financial balance sheets, spending efficiency, and secret asset valuations.
          </p>
        </div>

        <button
          onClick={() => setShowNetDiff(!showNetDiff)}
          className="btn btn-secondary"
          style={{ fontSize: '0.85rem' }}
        >
          {showNetDiff ? 'Hide Net Gain (Asset - Spent)' : 'Show Net Gain (Asset - Spent)'}
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Combined Starting Capital
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', marginTop: 4 }}>
            {formatYen(totalPurseAll)}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Across all registered teams</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Total Arena Confirmed Spend
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fca5a5', marginTop: 4 }}>
            {formatYen(totalSpentAll)}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#6ee7b7' }}>
            {((totalSpentAll / (totalPurseAll || 1)) * 100).toFixed(1)}% of total liquidity deployed
          </span>
        </div>

        <div className="glass-panel glow-gold" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.78rem', color: '#fde047', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Sparkles size={12} /> Total Confirmed Asset Value
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fde047', marginTop: 4 }}>
            {formatYen(totalAssetAll)}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#fef08a' }}>Secret game valuations awarded</span>
        </div>
      </div>

      {/* Recharts Analytics Bar Chart */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <PieChart size={18} color="var(--crimson-bright)" /> Team Liquidity vs. Asset Value Comparison (in Millions ¥)
        </h3>

        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <YAxis stroke="#94a3b8" tickFormatter={(val) => `¥${val}M`} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#111827', borderColor: 'rgba(255,255,255,0.2)', borderRadius: 8 }}
                formatter={(val, name) => [`¥${val}M`, name]}
              />
              <Legend wrapperStyle={{ paddingTop: 10 }} />
              <Bar dataKey="remainingPurseM" name="Remaining Purse" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="totalSpentM" name="Total Spent" fill="#f87171" radius={[4, 4, 0, 0]} />
              <Bar dataKey="assetValueM" name="Asset Value (Secret)" fill="#fbbf24" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comprehensive Financial Table */}
      <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
            Detailed Team Balance Sheet
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Info size={14} /> Currency displayed in Japanese Yen (Exact integer accounting internally)
          </span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 700 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.82rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 14px' }}>Team</th>
              <th style={{ padding: '12px 14px' }}>Starting Purse</th>
              <th style={{ padding: '12px 14px' }}>Total Spent</th>
              <th style={{ padding: '12px 14px' }}>Remaining Purse</th>
              <th style={{ padding: '12px 14px' }}>Places Won</th>
              <th style={{ padding: '12px 14px', color: '#fde047' }}>Total Asset Value</th>
              {showNetDiff && <th style={{ padding: '12px 14px', color: '#6ee7b7' }}>Net Gain (Asset − Spent)</th>}
            </tr>
          </thead>
          <tbody>
            {(allTeamFinancials || []).map((t) => (
              <tr
                key={t.id}
                style={{
                  borderBottom: '1px solid var(--border-subtle)',
                  transition: 'background 0.2s ease',
                }}
              >
                <td style={{ padding: '14px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: t.color || '#f472b6' }} />
                  {t.name}
                </td>
                <td style={{ padding: '14px', color: 'var(--text-secondary)' }}>
                  {formatYen(t.startingPurse)}
                </td>
                <td style={{ padding: '14px', fontWeight: 700, color: t.totalSpent > 0 ? '#fca5a5' : 'var(--text-muted)' }}>
                  {formatYen(t.totalSpent)}
                </td>
                <td style={{ padding: '14px', fontWeight: 800, color: '#38bdf8' }}>
                  {formatYen(t.remainingPurse)}
                </td>
                <td style={{ padding: '14px' }}>
                  <span className="badge badge-sold" style={{ fontSize: '0.78rem' }}>
                    {t.purchasedPlaces?.length || 0} place{t.purchasedPlaces?.length === 1 ? '' : 's'}
                  </span>
                </td>
                <td style={{ padding: '14px', fontWeight: 900, color: '#fde047' }}>
                  {formatYen(t.totalAssetValue)}
                </td>
                {showNetDiff && (
                  <td style={{ padding: '14px', fontWeight: 800, color: t.netDifference >= 0 ? '#6ee7b7' : '#f87171' }}>
                    {t.netDifference >= 0 ? `+${formatYen(t.netDifference)}` : formatYen(t.netDifference)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
