import React, { useState } from 'react';
import { useAuction } from '../../context/AuctionContext';
import Modal from '../../components/Modal';
import PlaceCard from '../../components/PlaceCard';
import { formatYen } from '../../utils/currency';
import { Landmark, Plus, Edit3, Trash2, Play, Sparkles, Filter } from 'lucide-react';

export default function AuctionInventory() {
  const { places, teams, addPlace, updatePlace, deletePlace, selectPlace, startAuction, showToast } = useAuction();
  const [filter, setFilter] = useState('all'); // all | available | live | sold | unsold
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlace, setEditingPlace] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState(3_000_000);
  const [assetValue, setAssetValue] = useState(9_000_000);

  const filteredPlaces = places.filter((p) => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name.trim() || !location.trim()) {
      showToast('Name and location are required.', 'error');
      return;
    }
    try {
      const created = addPlace({
        name: name.trim(),
        location: location.trim(),
        imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1200&auto=format&fit=crop',
        description: description.trim(),
        basePrice: Number(basePrice) || 2_000_000,
        assetValue: Number(assetValue) || 5_000_000,
      });
      showToast(`Destination "${created.name}" added to inventory!`, 'success');
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    if (!editingPlace) return;
    try {
      updatePlace(editingPlace.id, {
        name: name.trim(),
        location: location.trim(),
        imageUrl: imageUrl.trim(),
        description: description.trim(),
        basePrice: Number(basePrice) || 2_000_000,
        assetValue: Number(assetValue) || 5_000_000,
      });
      showToast(`Updated "${name}".`, 'success');
      setEditingPlace(null);
      resetForm();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = (place) => {
    if (window.confirm(`Delete "${place.name}" from inventory?`)) {
      try {
        deletePlace(place.id);
        showToast(`Place "${place.name}" removed.`, 'info');
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  };

  const openEditModal = (p) => {
    setEditingPlace(p);
    setName(p.name);
    setLocation(p.location);
    setImageUrl(p.imageUrl);
    setDescription(p.description);
    setBasePrice(p.basePrice);
    setAssetValue(p.assetValue);
  };

  const resetForm = () => {
    setName('');
    setLocation('');
    setImageUrl('');
    setDescription('');
    setBasePrice(3_000_000);
    setAssetValue(9_000_000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
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
            <Landmark size={24} color="var(--crimson-bright)" /> Destination Inventory ({places.length})
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Manage Japanese tourist places, base starting prices, and secret game asset values.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Filter Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', background: 'rgba(0,0,0,0.3)', padding: 4, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', gap: 4 }}>
            {['all', 'available', 'live', 'sold', 'unsold'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  background: filter === f ? 'var(--crimson)' : 'transparent',
                  color: filter === f ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                  minHeight: 36,
                }}
              >
                {f}
              </button>
            ))}
          </div>

          <button onClick={() => setShowAddModal(true)} className="btn btn-primary" style={{ minHeight: 44 }}>
            <Plus size={16} /> Add Destination
          </button>
        </div>
      </div>

      {/* Grid of Places */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
          gap: 20,
        }}
      >
        {filteredPlaces.map((place) => {
          const winningTeam = teams.find((t) => t.id === place.winningTeamId);

          return (
            <div
              key={place.id}
              className="glass-panel"
              style={{
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <PlaceCard
                place={place}
                isAdmin={true}
                showAssetValue={true}
                isLive={place.status === 'live'}
              />

              {/* Status info bar */}
              {place.status === 'sold' && winningTeam && (
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    borderTop: '1px solid rgba(16, 185, 129, 0.2)',
                    padding: '8px 16px',
                    fontSize: '0.8rem',
                    color: '#6ee7b7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>Winner: <strong>{winningTeam.name}</strong></span>
                  <span>Won for: {formatYen(place.finalPurchasePrice)}</span>
                </div>
              )}

              {/* Action Toolbar */}
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  padding: '12px 16px',
                  background: 'rgba(0,0,0,0.25)',
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                {place.status !== 'sold' && (
                  <button
                    onClick={() => {
                      selectPlace(place.id);
                      startAuction(place.id);
                      showToast(`Started auction for "${place.name}". Switch to Live Auction tab!`, 'gold');
                    }}
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '7px 10px', fontSize: '0.82rem' }}
                    title="Launch live auction for this place"
                  >
                    <Play size={14} /> Auction Now
                  </button>
                )}

                <button
                  onClick={() => openEditModal(place)}
                  className="btn btn-secondary"
                  style={{ padding: '7px 10px', fontSize: '0.82rem' }}
                  disabled={place.status === 'sold'}
                  title="Edit Place Details"
                >
                  <Edit3 size={14} />
                </button>

                <button
                  onClick={() => handleDelete(place)}
                  className="btn btn-secondary"
                  style={{ padding: '7px 10px', fontSize: '0.82rem' }}
                  disabled={place.status === 'sold'}
                  title="Delete Place"
                >
                  <Trash2 size={14} color="#fca5a5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD DESTINATION MODAL */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Japanese Destination">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Place Name (English & Japanese)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Kinkaku-ji (金閣寺)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Prefecture / Location</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Kyoto Prefecture"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Image URL (High-res photo)</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://images.unsplash.com/..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Short Description</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Brief historical or scenic description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Base Starting Price (¥)</label>
              <input
                type="number"
                className="form-input"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                step="500000"
                required
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatYen(basePrice)}</span>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ color: '#fde047' }}>
                Secret Game Asset Value (¥)
              </label>
              <input
                type="number"
                className="form-input"
                style={{ borderColor: 'var(--border-gold)' }}
                value={assetValue}
                onChange={(e) => setAssetValue(e.target.value)}
                step="500000"
                required
              />
              <span style={{ fontSize: '0.75rem', color: '#fde047' }}>{formatYen(assetValue)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
            <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add to Inventory
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT DESTINATION MODAL */}
      <Modal isOpen={Boolean(editingPlace)} onClose={() => setEditingPlace(null)} title={`Edit ${editingPlace?.name}`}>
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Place Name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Location</label>
            <input
              type="text"
              className="form-input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Image URL</label>
            <input
              type="url"
              className="form-input"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Base Price (¥)</label>
              <input
                type="number"
                className="form-input"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                step="500000"
                required
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatYen(basePrice)}</span>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ color: '#fde047' }}>
                Secret Asset Value (¥)
              </label>
              <input
                type="number"
                className="form-input"
                style={{ borderColor: 'var(--border-gold)' }}
                value={assetValue}
                onChange={(e) => setAssetValue(e.target.value)}
                step="500000"
                required
              />
              <span style={{ fontSize: '0.75rem', color: '#fde047' }}>{formatYen(assetValue)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
            <button type="button" onClick={() => setEditingPlace(null)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
