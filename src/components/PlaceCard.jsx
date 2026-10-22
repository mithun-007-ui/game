import React from 'react';
import { MapPin, Trophy, ShieldAlert, Sparkles } from 'lucide-react';
import { formatYen } from '../utils/currency';

export default function PlaceCard({ place, isAdmin = false, isLive = false, onSelect, showAssetValue = false }) {
  const {
    name,
    location,
    imageUrl,
    description,
    basePrice,
    assetValue,
    status,
    winningTeamId,
    finalPurchasePrice,
  } = place;

  let statusBadge = <span className="badge badge-available">Available</span>;
  if (status === 'live') {
    statusBadge = <span className="badge badge-live">● Live Auction</span>;
  } else if (status === 'sold') {
    statusBadge = <span className="badge badge-sold">✓ Sold</span>;
  } else if (status === 'unsold') {
    statusBadge = <span className="badge badge-unsold">Unsold</span>;
  }

  return (
    <div
      className={`glass-panel ${isLive ? 'glow-crimson' : ''}`}
      style={{
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        cursor: onSelect ? 'pointer' : 'default',
        transition: 'all 0.25s ease',
      }}
      onClick={onSelect}
    >
      {/* Image container */}
      <div style={{ position: 'relative', width: '100%', height: 180, overflow: 'hidden' }}>
        <img
          src={imageUrl}
          alt={name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.5s ease',
          }}
          onError={(e) => {
            // Fallback image if Unsplash fails
            e.target.src = 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1200&auto=format&fit=crop';
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(11, 15, 23, 0.9) 0%, rgba(11, 15, 23, 0.2) 60%, transparent 100%)',
          }}
        />

        <div style={{ position: 'absolute', top: 12, right: 12 }}>
          {statusBadge}
        </div>

        <div style={{ position: 'absolute', bottom: 10, left: 14, right: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fca5a5', fontSize: '0.8rem', fontWeight: 600 }}>
            <MapPin size={13} />
            <span>{location}</span>
          </div>
          <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
            {name}
          </h4>
        </div>
      </div>

      {/* Details */}
      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.45, flex: 1 }}>
          {description}
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: (isAdmin && showAssetValue && assetValue !== undefined) ? '1fr 1fr' : '1fr',
            gap: 10,
            paddingTop: 12,
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {status === 'sold' ? 'Sold Price' : 'Base Price'}
            </span>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: status === 'sold' ? '#6ee7b7' : 'var(--text-main)' }}>
              {formatYen(status === 'sold' ? finalPurchasePrice : basePrice)}
            </div>
          </div>

          {/* ADMIN ONLY: Asset Value Display */}
          {isAdmin && showAssetValue && assetValue !== undefined && (
            <div style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '4px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <span style={{ fontSize: '0.7rem', color: '#fde047', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                <Sparkles size={11} /> SECRET ASSET VALUE
              </span>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fde047' }}>
                {formatYen(assetValue)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
