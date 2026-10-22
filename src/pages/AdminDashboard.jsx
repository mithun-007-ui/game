import React, { useState } from 'react';
import { useAuction } from '../context/AuctionContext';
import { Navigate } from 'react-router-dom';
import LiveAuction from './admin/LiveAuction';
import TeamManagement from './admin/TeamManagement';
import AuctionInventory from './admin/AuctionInventory';
import TeamFinancialOverview from './admin/TeamFinancialOverview';
import AuctionHistory from './admin/AuctionHistory';
import AdminLeaderboard from './admin/AdminLeaderboard';
import GameSettings from './admin/GameSettings';
import { Gavel, Users, Landmark, DollarSign, History, Trophy, Settings } from 'lucide-react';

export default function AdminDashboard() {
  const { currentUser, isAdmin } = useAuction();
  const [activeTab, setActiveTab] = useState('live');

  if (!currentUser || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  const tabs = [
    { id: 'live', label: 'Live Auction', icon: Gavel },
    { id: 'teams', label: 'Team Management', icon: Users },
    { id: 'inventory', label: 'Destination Inventory', icon: Landmark },
    { id: 'financials', label: 'Financial Overview', icon: DollarSign },
    { id: 'history', label: 'History & Audit', icon: History },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'settings', label: 'Game Settings', icon: Settings },
  ];

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', padding: '24px 20px', minHeight: 'calc(100vh - 70px)' }}>
      {/* Navigation Sub-Tabs Bar */}
      <nav
        aria-label="Admin Navigation Tabs"
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 16,
          marginBottom: 24,
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: 'var(--radius-md)',
                border: isActive ? '1px solid var(--crimson-bright)' : '1px solid var(--border-subtle)',
                background: isActive ? 'linear-gradient(135deg, var(--crimson), #7f1d1d)' : 'rgba(26, 32, 46, 0.6)',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? '0 4px 14px rgba(220, 38, 38, 0.35)' : 'none',
              }}
            >
              <Icon size={16} color={isActive ? '#fff' : 'var(--text-muted)'} />
              {t.label}
            </button>
          );
        })}
      </nav>

      {/* Render Active Sub-Page */}
      <main>
        {activeTab === 'live' && <LiveAuction />}
        {activeTab === 'teams' && <TeamManagement />}
        {activeTab === 'inventory' && <AuctionInventory />}
        {activeTab === 'financials' && <TeamFinancialOverview />}
        {activeTab === 'history' && <AuctionHistory />}
        {activeTab === 'leaderboard' && <AdminLeaderboard />}
        {activeTab === 'settings' && <GameSettings />}
      </main>
    </div>
  );
}
