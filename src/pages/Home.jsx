import React from 'react';
import { Link } from 'react-router-dom';
import { useAuction } from '../context/AuctionContext';
import PlaceCard from '../components/PlaceCard';
import { formatYen } from '../utils/currency';
import { Gavel, Users, Tv, Shield, Sparkles, MapPin, ArrowRight, Trophy } from 'lucide-react';

export default function Home() {
  const { places, currentUser, isAdmin, isParticipant, myTeam, auctionState } = useAuction();

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '40px 20px', display: 'flex', flexDirection: 'column', gap: 48 }}>
      {/* Hero Section */}
      <section
        className="glass-panel glow-crimson"
        style={{
          padding: '48px 36px',
          borderRadius: 'var(--radius-xl)',
          background: 'linear-gradient(135deg, rgba(26, 32, 46, 0.95), rgba(35, 20, 25, 0.9))',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 36,
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, zIndex: 1 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(220, 38, 38, 0.2)',
              border: '1px solid var(--border-crimson)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              color: '#fca5a5',
              fontSize: '0.82rem',
              fontWeight: 700,
              width: 'fit-content',
            }}
          >
            <Sparkles size={14} color="#fca5a5" />
            <span>COLLEGE FESTIVAL SPECIAL LIVE AUCTION</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
              fontWeight: 900,
              color: '#fff',
              fontFamily: 'var(--font-display)',
              lineHeight: 1.15,
              letterSpacing: '0.02em',
            }}
          >
            Japan Auction Arena
            <span style={{ display: 'block', fontSize: '1.4rem', color: '#fca5a5', fontFamily: 'var(--font-serif)', marginTop: 8 }}>
              日本観光名所オークションアリーナ
            </span>
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6, maxWidth: 540 }}>
            Compete in a high-stakes live auction to purchase Japan's most revered cultural landmarks and scenic treasures. Manage your team's ¥100M budget, outbid rivals, and discover the highest hidden asset portfolio!
          </p>

          {/* Quick CTA Actions */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 10 }}>
            {currentUser ? (
              <Link
                to={isAdmin ? '/admin' : '/participant'}
                className="btn btn-primary"
                style={{ padding: '14px 28px', fontSize: '1rem' }}
              >
                Go to {isAdmin ? 'Auctioneer Cockpit' : `${myTeam?.name || 'Team'} Dashboard`} <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="btn btn-primary"
                  style={{ padding: '14px 28px', fontSize: '1rem' }}
                >
                  <Users size={18} /> Enter Arena as Team
                </Link>

                <Link
                  to="/login"
                  className="btn btn-secondary"
                  style={{ padding: '14px 24px', fontSize: '1rem' }}
                >
                  <Shield size={18} /> Auctioneer Login
                </Link>
              </>
            )}

            <Link
              to="/projector"
              className="btn btn-gold"
              style={{ padding: '14px 24px', fontSize: '1rem' }}
            >
              <Tv size={18} /> Auditorium Projector View
            </Link>
          </div>
        </div>

        {/* Hero Visual Card */}
        <div style={{ position: 'relative', height: 360, borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <img
            src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1200&auto=format&fit=crop"
            alt="Mount Fuji with Cherry Blossoms"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(11, 15, 23, 0.9) 0%, rgba(11, 15, 23, 0.2) 60%, transparent 100%)',
            }}
          />
          <div style={{ position: 'absolute', bottom: 20, left: 24, right: 24 }}>
            <span className="badge badge-gold" style={{ marginBottom: 6 }}>
              Featured Landmark #1
            </span>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff' }}>
              Mount Fuji (富士山)
            </h3>
            <span style={{ fontSize: '0.9rem', color: '#fca5a5' }}>
              Base: ¥5,000,000 • Asset Potential: Confidential
            </span>
          </div>
        </div>
      </section>

      {/* Rules of Engagement */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 'var(--radius-md)',
              background: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}
          >
            <span style={{ fontSize: '1.4rem' }}>💴</span>
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: 8 }}>
            ¥100M Starting Budget
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Each registered team starts with an identical ¥100,000,000 purse. Manage cash flow wisely—you cannot exceed your remaining funds!
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 'var(--radius-md)',
              background: 'rgba(220, 38, 38, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}
          >
            <Gavel size={22} color="var(--crimson-bright)" />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: 8 }}>
            Auctioneer Confirmed Bids
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Bids are placed live in the room and validated server-side by the auctioneer. Sales are finalized with the ceremonial Sold confirmation.
          </p>
        </div>

        <div className="glass-panel glow-gold" style={{ padding: '24px' }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 'var(--radius-md)',
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}
          >
            <Sparkles size={22} color="#f59e0b" />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fde047', marginBottom: 8 }}>
            Confidential Asset Valuation
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Each place holds a secret game asset value hidden until the Grand Reveal. Winner is crowned by highest total asset value, with remaining purse as tie-breaker!
          </p>
        </div>
      </section>

      {/* Destination Showcase Grid */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>🏯</span> Japanese Tourist Places Catalog ({places.length})
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              10 authentic destinations across Japan up for live bidding.
            </p>
          </div>

          <Link to="/login" className="btn btn-secondary">
            Join Auction to Place Bids <ArrowRight size={15} />
          </Link>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
            gap: 24,
          }}
        >
          {places.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              isAdmin={isAdmin}
              showAssetValue={isAdmin}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
