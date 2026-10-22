import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuction } from '../context/AuctionContext';
import { Shield, Users, KeyRound, Sparkles, ArrowRight } from 'lucide-react';

export default function Login() {
  const [activeTab, setActiveTab] = useState('team'); // 'team' | 'admin'
  const [teamCode, setTeamCode] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const { loginTeamByCode, loginAdmin, teams } = useAuction();
  const navigate = useNavigate();

  const handleTeamSubmit = (e) => {
    e.preventDefault();
    if (!teamCode.trim()) return;
    const ok = loginTeamByCode(teamCode);
    if (ok) {
      navigate('/participant');
    }
  };

  const handleAdminSubmit = (e) => {
    e.preventDefault();
    if (!adminPassword) return;
    const ok = loginAdmin(adminPassword);
    if (ok) {
      navigate('/admin');
    }
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 70px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '30px 20px',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: 480,
          padding: '36px 32px',
          border: '1px solid rgba(220, 38, 38, 0.3)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(185, 28, 28, 0.2)',
        }}
      >
        {/* Crest */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--crimson-bright), #7f1d1d)',
              margin: '0 auto 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              boxShadow: '0 0 20px rgba(220, 38, 38, 0.6)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            ⛩️
          </div>

          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
            JAPAN ARENA
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#fca5a5', fontFamily: 'var(--font-serif)', marginTop: 2 }}>
            日本観光名所オークションアリーナ
          </p>
        </div>

        {/* Tab switcher */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: 'rgba(0, 0, 0, 0.4)',
            padding: 4,
            borderRadius: 'var(--radius-md)',
            marginBottom: 24,
            border: '1px solid var(--border-subtle)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('team')}
            style={{
              padding: '10px 14px',
              background: activeTab === 'team' ? 'linear-gradient(135deg, var(--crimson), #991b1b)' : 'transparent',
              color: activeTab === 'team' ? '#fff' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <Users size={16} /> Team Participant
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            style={{
              padding: '10px 14px',
              background: activeTab === 'admin' ? 'linear-gradient(135deg, var(--crimson), #991b1b)' : 'transparent',
              color: activeTab === 'admin' ? '#fff' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <Shield size={16} /> Auctioneer Admin
          </button>
        </div>

        {/* Team Login Form */}
        {activeTab === 'team' && (
          <form onSubmit={handleTeamSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="teamCodeInput">
                Team Access Passcode
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="teamCodeInput"
                  type="text"
                  className="form-input"
                  placeholder="e.g. SAKURA-888"
                  value={teamCode}
                  onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                  style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}
                  autoFocus
                />
                <KeyRound size={16} style={{ position: 'absolute', right: 14, top: 14, color: 'var(--text-muted)' }} />
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Enter the passcode provided by the event auctioneer.
              </span>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>
              Enter Arena Dashboard <ArrowRight size={16} />
            </button>

            {/* Quick Demo Team Launcher */}
            <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={12} color="#f59e0b" /> Quick Select Demo Teams:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {teams.slice(0, 4).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTeamCode(t.code);
                      loginTeamByCode(t.code);
                      navigate('/participant');
                    }}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '6px 8px', justifyContent: 'flex-start', borderLeft: `3px solid ${t.color}` }}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          </form>
        )}

        {/* Admin Login Form */}
        {activeTab === 'admin' && (
          <form onSubmit={handleAdminSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="adminPassInput">
                Auctioneer Master Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="adminPassInput"
                  type="password"
                  className="form-input"
                  placeholder="Enter Master Password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  autoFocus
                />
                <Shield size={16} style={{ position: 'absolute', right: 14, top: 14, color: 'var(--text-muted)' }} />
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Default demo passkey: <code style={{ color: '#fca5a5' }}>admin123</code> or <code style={{ color: '#fca5a5' }}>katana123</code>
              </span>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>
              Unlock Auction Control Cockpit <ArrowRight size={16} />
            </button>

            <button
              type="button"
              onClick={() => {
                setAdminPassword('katana123');
                loginAdmin('katana123');
                navigate('/admin');
              }}
              className="btn btn-gold"
              style={{ width: '100%', marginTop: 12, fontSize: '0.85rem' }}
            >
              ⚡ Instant 1-Click Auctioneer Demo Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
