import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuction } from '../context/AuctionContext';
import { Lock, Mail, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { loginWithEmailAndPassword, currentUser, isAdmin, isParticipant } = useAuction();
  const navigate = useNavigate();

  // If already logged in, redirect immediately to their dashboard
  if (currentUser) {
    if (isAdmin) return <Navigate to="/admin" replace />;
    if (isParticipant) return <Navigate to="/participant" replace />;
    return <Navigate to="/participant" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    try {
      setIsLoading(true);
      const res = await loginWithEmailAndPassword(email.trim(), password);
      if (res?.success) {
        if (res.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/participant');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: 440,
          padding: '40px 32px',
          border: '1px solid rgba(220, 38, 38, 0.35)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(220, 38, 38, 0.25)',
          borderRadius: 'var(--radius-xl)',
        }}
      >
        {/* Emblem & Title */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--crimson-bright), #7f1d1d)',
              margin: '0 auto 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.9rem',
              boxShadow: '0 0 24px rgba(220, 38, 38, 0.6)',
              border: '2px solid rgba(255, 255, 255, 0.25)',
            }}
          >
            ⛩️
          </div>

          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 900,
              color: '#fff',
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.04em',
              marginBottom: 4,
            }}
          >
            JAPAN ARENA
          </h1>
          <p
            style={{
              fontSize: '0.85rem',
              color: '#fca5a5',
              fontFamily: 'var(--font-serif)',
              letterSpacing: '0.1em',
            }}
          >
            日本観光名所オークションアリーナ
          </p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 8 }}>
            Sign in to enter the live auction arena
          </p>
        </div>

        {/* Clean Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="loginEmail">
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="loginEmail"
                type="email"
                required
                className="form-input"
                placeholder="name@japan-auction.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: 40 }}
                autoComplete="email"
                autoFocus
              />
              <Mail
                size={16}
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="loginPassword">
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="loginPassword"
                type="password"
                required
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: 40 }}
                autoComplete="current-password"
              />
              <Lock
                size={16}
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
            style={{
              width: '100%',
              marginTop: 6,
              padding: '13px',
              fontSize: '0.98rem',
              fontWeight: 700,
              minHeight: 48,
            }}
          >
            {isLoading ? (
              'Authenticating...'
            ) : (
              <>
                Enter Auction Arena <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
