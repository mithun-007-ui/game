import React, { useState } from 'react';
import { useAuction } from '../context/AuctionContext';
import { Navigate, Link } from 'react-router-dom';
import PlaceCard from '../components/PlaceCard';
import CountdownTimer from '../components/CountdownTimer';
import { formatYen } from '../utils/currency';
import {
  Wallet,
  ShoppingBag,
  Radio,
  MapPin,
  Trophy,
  Sparkles,
  TrendingUp,
  Landmark,
  Layers,
} from 'lucide-react';

export default function ParticipantDashboard() {
  const {
    currentUser,
    isParticipant,
    myTeam,
    myPurchasedPlaces,
    places,
    currentAuctionPlace,
    leadingTeam,
    auctionState,
  } = useAuction();

  const [activeCatalogTab, setActiveCatalogTab] = useState('mine'); // 'mine' | 'available'

  if (!currentUser || !isParticipant) {
    return <Navigate to="/login" replace />;
  }

  const {
    auctionStatus,
    currentBid,
    showLeadingTeamToParticipants,
    resultsRevealed,
  } = auctionState;

  const isLive = auctionStatus === 'live';
  const availablePlaces = places.filter((p) => p.status === 'available');

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* FINAL RESULTS BANNER (When unlocked by auctioneer) */}
      {resultsRevealed && (
        <div
          className="glass-panel glow-gold"
          style={{
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(185, 28, 28, 0.2))',
            border: '2px solid var(--border-gold)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Trophy size={28} color="#f59e0b" />
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fde047' }}>
                Official Final Results Have Been Revealed!
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                The auctioneer has concluded the auction. Check out your team’s final standing and asset scores!
              </p>
            </div>
          </div>

          <Link to="/results" className="btn btn-gold" style={{ fontWeight: 800 }}>
            <Sparkles size={16} /> View Final Podium Rankings
          </Link>
        </div>
      )}

      {/* TEAM FINANCIAL HEADER CARD */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          borderLeft: `6px solid ${myTeam?.color || '#f472b6'}`,
          background: 'linear-gradient(135deg, rgba(26, 32, 46, 0.95), rgba(17, 24, 39, 0.95))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: myTeam?.color || '#f472b6',
                boxShadow: `0 0 10px ${myTeam?.color || '#f472b6'}`,
              }}
            />
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Your Assigned Team
              </span>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff' }}>
                {myTeam?.name}
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="badge badge-gold" style={{ fontSize: '0.8rem' }}>
              Passcode: {myTeam?.code}
            </span>
          </div>
        </div>

        {/* Financial KPIs (Strictly remaining balance, spent, starting purse - NO asset value!) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div
            style={{
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
            }}
          >
            <span style={{ fontSize: '0.78rem', color: '#7dd3fc', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Wallet size={14} /> REMAINING PURSE
            </span>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#38bdf8', marginTop: 4 }}>
              {formatYen(myTeam?.remainingPurse)}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Available to place bids
            </span>
          </div>

          <div
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
            }}
          >
            <span style={{ fontSize: '0.78rem', color: '#fca5a5', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShoppingBag size={14} /> TOTAL CONFIRMED SPENDING
            </span>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#f87171', marginTop: 4 }}>
              {formatYen(myTeam?.totalSpent)}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Spent on won places
            </span>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
            }}
          >
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              STARTING PURSE
            </span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-secondary)', marginTop: 4 }}>
              {formatYen(myTeam?.startingPurse)}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Places Won: <strong>{myPurchasedPlaces.length}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* LIVE AUCTION STAGE FEED */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          border: isLive ? '2px solid var(--crimson-bright)' : '1px solid var(--border-subtle)',
          boxShadow: isLive ? '0 0 30px rgba(220, 38, 38, 0.3)' : 'var(--shadow-md)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: isLive ? '#ef4444' : '#94a3b8',
                boxShadow: isLive ? '0 0 10px #ef4444' : 'none',
              }}
            />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Radio size={18} color={isLive ? '#f87171' : 'var(--text-muted)'} />
              Live Stage Status: {isLive ? 'Bidding In Progress' : auctionStatus.toUpperCase()}
            </h3>
          </div>

          <span
            className={isLive ? 'badge badge-live' : 'badge badge-unsold'}
            style={{ fontSize: '0.8rem', padding: '5px 12px' }}
          >
            {auctionStatus.toUpperCase()}
          </span>
        </div>

        {currentAuctionPlace ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 20,
              alignItems: 'center',
            }}
          >
            {/* Destination Media */}
            <div style={{ position: 'relative', height: 240, borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <img
                src={currentAuctionPlace.imageUrl}
                alt={currentAuctionPlace.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(11, 15, 23, 0.9) 0%, transparent 70%)',
                }}
              />
              <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fca5a5', fontSize: '0.8rem' }}>
                  <MapPin size={13} /> {currentAuctionPlace.location}
                </div>
                <h4 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>
                  {currentAuctionPlace.name}
                </h4>
              </div>
            </div>

            {/* Live Pricing & Countdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <CountdownTimer isAdmin={false} />

              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-gold)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.78rem', color: '#fde047', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <TrendingUp size={14} /> CURRENT HIGHEST BID
                  </span>
                  {showLeadingTeamToParticipants && leadingTeam && (
                    <span
                      style={{
                        background: leadingTeam.color || '#f472b6',
                        color: '#000',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.72rem',
                      }}
                    >
                      Leading: {leadingTeam.id === myTeam?.id ? 'YOUR TEAM!' : leadingTeam.name}
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
                  {formatYen(currentBid || currentAuctionPlace.basePrice)}
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Base Opening Price: {formatYen(currentAuctionPlace.basePrice)}
                </div>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {currentAuctionPlace.description}
              </div>
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '30px 0' }}>
            No place currently on the auction stage. The auctioneer will introduce the next destination shortly.
          </p>
        )}
      </div>

      {/* TABS: MY PURCHASED PLACES vs AVAILABLE CATALOG */}
      <div>
        <div
          style={{
            display: 'flex',
            gap: 12,
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: 12,
            marginBottom: 20,
          }}
        >
          <button
            onClick={() => setActiveCatalogTab('mine')}
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius-md)',
              border: activeCatalogTab === 'mine' ? '1px solid var(--crimson-bright)' : '1px solid var(--border-subtle)',
              background: activeCatalogTab === 'mine' ? 'var(--crimson)' : 'rgba(26, 32, 46, 0.6)',
              color: activeCatalogTab === 'mine' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
            }}
          >
            <ShoppingBag size={16} /> My Team’s Secured Places ({myPurchasedPlaces.length})
          </button>

          <button
            onClick={() => setActiveCatalogTab('available')}
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius-md)',
              border: activeCatalogTab === 'available' ? '1px solid var(--crimson-bright)' : '1px solid var(--border-subtle)',
              background: activeCatalogTab === 'available' ? 'var(--crimson)' : 'rgba(26, 32, 46, 0.6)',
              color: activeCatalogTab === 'available' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
            }}
          >
            <Landmark size={16} /> Available Catalog ({availablePlaces.length})
          </button>
        </div>

        {/* TAB 1: MY WON PLACES */}
        {activeCatalogTab === 'mine' && (
          <div>
            {myPurchasedPlaces.length === 0 ? (
              <div
                className="glass-panel"
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div style={{ fontSize: '2.5rem' }}>🏯</div>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
                  No Destinations Purchased Yet
                </h4>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: 460 }}>
                  Place competitive bids with the auctioneer when your favorite Japanese places come up on stage!
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: 20,
                }}
              >
                {myPurchasedPlaces.map((place) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    isAdmin={false}
                    showAssetValue={false}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: AVAILABLE CATALOG */}
        {activeCatalogTab === 'available' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 20,
            }}
          >
            {availablePlaces.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                isAdmin={false}
                showAssetValue={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
