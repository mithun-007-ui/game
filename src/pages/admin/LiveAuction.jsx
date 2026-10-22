import React, { useState } from 'react';
import { useAuction } from '../../context/AuctionContext';
import CountdownTimer from '../../components/CountdownTimer';
import Modal from '../../components/Modal';
import { formatYen, parseYenInput } from '../../utils/currency';
import {
  Gavel,
  CheckCircle,
  XCircle,
  ChevronRight,
  TrendingUp,
  MapPin,
  Sparkles,
  Play,
  RotateCcw,
  Users,
} from 'lucide-react';

export default function LiveAuction() {
  const {
    places,
    teams,
    auctionState,
    currentAuctionPlace,
    leadingTeam,
    selectPlace,
    startAuction,
    submitBid,
    confirmSale,
    markUnsold,
    showToast,
  } = useAuction();

  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [customBidAmount, setCustomBidAmount] = useState('');
  const [showSoldModal, setShowSoldModal] = useState(false);
  const [showUnsoldModal, setShowUnsoldModal] = useState(false);

  const { auctionStatus, currentBid, bidHistory = [] } = auctionState;
  const isAuctionLive = auctionStatus === 'live';

  // Handle bid submit
  const handleBid = (e) => {
    if (e) e.preventDefault();
    if (!selectedTeamId) {
      showToast('Please select a team placing the bid.', 'error');
      return;
    }
    const amount = parseYenInput(customBidAmount);
    try {
      submitBid({ teamId: selectedTeamId, bidAmount: amount });
      showToast(`Confirmed bid: ${formatYen(amount)}!`, 'success');
      setCustomBidAmount('');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Quick increment bid
  const handleQuickAdd = (increment) => {
    const nextAmount = (currentBid || currentAuctionPlace?.basePrice || 0) + increment;
    setCustomBidAmount(nextAmount.toString());
  };

  const handleConfirmSoldAction = () => {
    try {
      confirmSale();
      setShowSoldModal(false);
      showToast('Place officially SOLD! Purse deducted and ownership transferred.', 'gold');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleConfirmUnsoldAction = () => {
    try {
      markUnsold();
      setShowUnsoldModal(false);
      showToast('Place marked UNSOLD.', 'info');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // If no place is selected, pick the first available
  const activePlace = currentAuctionPlace || places[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Banner & Quick Selector */}
      <div
        className="glass-panel"
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              background: 'rgba(220, 38, 38, 0.2)',
              border: '1px solid var(--border-crimson)',
              width: 38,
              height: 38,
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Gavel size={20} color="#f87171" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
              Live Auctioneer Cockpit
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Select destinations, accept team bids, and confirm sales in real time.
            </p>
          </div>
        </div>

        {/* Place switcher dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Destination:</span>
          <select
            className="form-select"
            style={{ minWidth: 260 }}
            value={activePlace?.id || ''}
            onChange={(e) => selectPlace(e.target.value)}
          >
            {places.map((p) => (
              <option key={p.id} value={p.id}>
                {p.order}. {p.name} ({p.status.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Auction Stage: 2-column layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)',
          gap: 24,
        }}
      >
        {/* LEFT COLUMN: Destination Showcase */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            className="glass-panel"
            style={{
              overflow: 'hidden',
              position: 'relative',
              border: isAuctionLive ? '1px solid var(--crimson-bright)' : '1px solid var(--border-subtle)',
              boxShadow: isAuctionLive ? '0 0 30px rgba(220, 38, 38, 0.35)' : 'var(--shadow-md)',
            }}
          >
            {/* Hero Image */}
            <div style={{ position: 'relative', height: 320, width: '100%' }}>
              <img
                src={activePlace?.imageUrl}
                alt={activePlace?.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(11, 15, 23, 0.95) 0%, rgba(11, 15, 23, 0.3) 60%, transparent 100%)',
                }}
              />

              <div style={{ position: 'absolute', top: 16, right: 16 }}>
                <span
                  className={
                    activePlace?.status === 'live'
                      ? 'badge badge-live'
                      : activePlace?.status === 'sold'
                      ? 'badge badge-sold'
                      : 'badge badge-available'
                  }
                  style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                >
                  {activePlace?.status.toUpperCase()}
                </span>
              </div>

              <div style={{ position: 'absolute', bottom: 16, left: 20, right: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fca5a5', fontSize: '0.88rem', fontWeight: 600 }}>
                  <MapPin size={15} />
                  <span>{activePlace?.location}</span>
                </div>
                <h3
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 900,
                    color: '#fff',
                    marginTop: 4,
                    textShadow: '0 2px 8px rgba(0,0,0,0.9)',
                  }}
                >
                  {activePlace?.name}
                </h3>
              </div>
            </div>

            {/* Description & Valuation metrics */}
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                {activePlace?.description}
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 16,
                  padding: '16px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Base Starting Price
                  </span>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff' }}>
                    {formatYen(activePlace?.basePrice)}
                  </div>
                </div>

                {/* SECRET ASSET VALUE (Visible only to Admin!) */}
                <div
                  style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', color: '#fde047', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Sparkles size={12} /> ADMIN ASSET VALUE
                  </span>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#fde047' }}>
                    {formatYen(activePlace?.assetValue)}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#fef08a' }}>
                    Secret to participants until Final Reveal
                  </span>
                </div>
              </div>

              {/* Start / Switch auction actions */}
              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                {activePlace?.status !== 'live' ? (
                  <button
                    onClick={() => startAuction(activePlace?.id)}
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '12px 20px', fontSize: '1rem' }}
                  >
                    <Play size={18} /> Start Live Auction for this Place
                  </button>
                ) : (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, color: '#fca5a5', fontSize: '0.9rem', fontWeight: 600 }}>
                    <span className="badge badge-live">● Live Auction Active</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Bidding Cockpit */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Countdown timer */}
          <CountdownTimer isAdmin={true} />

          {/* Current Leading Bid Display */}
          <div
            className="glass-panel"
            style={{
              padding: '24px',
              border: '1px solid var(--border-gold)',
              background: 'linear-gradient(135deg, rgba(26, 32, 46, 0.95), rgba(35, 25, 20, 0.9))',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: '0.85rem', color: '#fde047', fontWeight: 700, letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
                <TrendingUp size={15} /> CURRENT HIGHEST BID
              </span>
              {leadingTeam && (
                <span
                  style={{
                    background: leadingTeam.color || '#f472b6',
                    color: '#000',
                    fontWeight: 800,
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.78rem',
                  }}
                >
                  Leading: {leadingTeam.name}
                </span>
              )}
            </div>

            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {formatYen(currentBid || activePlace?.basePrice || 0)}
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>
              {leadingTeam
                ? `Placed by ${leadingTeam.name} (Remaining Purse: ${formatYen(leadingTeam.remainingPurse)})`
                : 'No bids placed yet. Base price is active opening minimum.'}
            </p>
          </div>

          {/* Place New Bid Form */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Gavel size={16} color="var(--crimson-bright)" /> Record Next Bid
            </h4>

            <form onSubmit={handleBid} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Team Selector with remaining budget */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="teamSelect">
                  Bidding Team
                </label>
                <select
                  id="teamSelect"
                  className="form-select"
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Bidding Team --</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id} disabled={!t.active || t.remainingPurse < (currentBid || activePlace?.basePrice || 0)}>
                      {t.name} (Purse: {formatYen(t.remainingPurse)}) {!t.active ? '[Inactive]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bid Amount Input */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="bidInput">
                  New Bid Amount (¥)
                </label>
                <input
                  id="bidInput"
                  type="number"
                  className="form-input"
                  placeholder={`Min > ${formatYen(currentBid || activePlace?.basePrice || 0)}`}
                  value={customBidAmount}
                  onChange={(e) => setCustomBidAmount(e.target.value)}
                  step="100000"
                />
              </div>

              {/* Quick Increment Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {[500_000, 1_000_000, 2_000_000, 5_000_000].map((inc) => (
                  <button
                    key={inc}
                    type="button"
                    onClick={() => handleQuickAdd(inc)}
                    className="btn btn-secondary"
                    style={{ padding: '6px 4px', fontSize: '0.78rem', fontWeight: 700 }}
                  >
                    +{formatYen(inc, true)}
                  </button>
                ))}
              </div>

              {/* Submit Bid Button */}
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '12px', fontSize: '0.95rem' }}
                disabled={activePlace?.status === 'sold'}
              >
                Confirm & Update Highest Bid
              </button>
            </form>

            {/* Sale Finalization Actions */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr',
                gap: 12,
                marginTop: 20,
                paddingTop: 18,
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <button
                type="button"
                onClick={() => setShowSoldModal(true)}
                className="btn btn-gold"
                style={{ padding: '12px' }}
                disabled={!leadingTeam || activePlace?.status === 'sold'}
                title="Confirm sold to leading team"
              >
                <CheckCircle size={18} /> CONFIRM SOLD (落札)
              </button>

              <button
                type="button"
                onClick={() => setShowUnsoldModal(true)}
                className="btn btn-danger"
                style={{ padding: '12px' }}
                disabled={activePlace?.status === 'sold'}
                title="Mark place unsold"
              >
                <XCircle size={18} /> UNSOLD (流札)
              </button>
            </div>
          </div>

          {/* Bid History for current place */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12 }}>
              Place Bid History ({bidHistory.length})
            </h4>

            {bidHistory.length === 0 ? (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                No bids recorded yet for this round.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
                {bidHistory.map((b) => (
                  <div
                    key={b.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: 'rgba(0, 0, 0, 0.25)',
                      borderRadius: 'var(--radius-sm)',
                      borderLeft: `3px solid ${b.teamColor || '#b91c1c'}`,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>
                        {b.teamName}
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{b.timestamp}</span>
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fde047' }}>
                      {formatYen(b.bidAmount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SOLD CONFIRMATION MODAL */}
      <Modal
        isOpen={showSoldModal}
        onClose={() => setShowSoldModal(false)}
        title="Confirm Winning Bid Sale"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Are you sure you want to finalize and confirm the sale of this place?
          </p>

          <div
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-gold)',
            }}
          >
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
              {activePlace?.name}
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fde047', margin: '6px 0' }}>
              Winning Bid: {formatYen(currentBid)}
            </div>
            <div style={{ fontSize: '0.95rem', color: '#6ee7b7', fontWeight: 600 }}>
              Winning Team: {leadingTeam?.name}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Team Remaining Purse: {formatYen(leadingTeam?.remainingPurse)} → After Sale:{' '}
              <strong style={{ color: '#fff' }}>
                {formatYen((leadingTeam?.remainingPurse || 0) - (currentBid || 0))}
              </strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 10 }}>
            <button
              onClick={() => setShowSoldModal(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmSoldAction}
              className="btn btn-gold"
              style={{ fontWeight: 800 }}
            >
              Confirm Sale & Deduct Purse
            </button>
          </div>
        </div>
      </Modal>

      {/* UNSOLD CONFIRMATION MODAL */}
      <Modal
        isOpen={showUnsoldModal}
        onClose={() => setShowUnsoldModal(false)}
        title="Mark Place as Unsold"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Mark <strong>"{activePlace?.name}"</strong> as unsold? No team budgets will be deducted, and the place status will become Unsold.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 10 }}>
            <button
              onClick={() => setShowUnsoldModal(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmUnsoldAction}
              className="btn btn-danger"
            >
              Mark Unsold
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
