import React, { useState } from 'react';
import { useAuction } from '../../context/AuctionContext';
import Modal from '../../components/Modal';
import { formatYen } from '../../utils/currency';
import { Users, UserPlus, Edit3, Trash2, Key, CheckCircle, XCircle, Sparkles, Shield } from 'lucide-react';

export default function TeamManagement() {
  const { teams, allTeamFinancials, addTeam, updateTeam, deleteTeam, showToast } = useAuction();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);

  // Form states
  const [teamName, setTeamName] = useState('');
  const [startingPurse, setStartingPurse] = useState(100_000_000);
  const [teamColor, setTeamColor] = useState('#f472b6');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!teamName.trim()) {
      showToast('Please enter a team name.', 'error');
      return;
    }
    try {
      const created = addTeam({
        name: teamName.trim(),
        startingPurse: Number(startingPurse) || 100_000_000,
        color: teamColor,
      });
      showToast(`Team "${created.name}" created with code ${created.code}!`, 'success');
      setShowAddModal(false);
      setTeamName('');
      setStartingPurse(100_000_000);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    if (!editingTeam) return;
    try {
      updateTeam(editingTeam.id, {
        name: teamName.trim(),
        startingPurse: Number(startingPurse) || 100_000_000,
        color: teamColor,
      });
      showToast(`Team "${teamName}" updated successfully.`, 'success');
      setEditingTeam(null);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleToggleActive = (team) => {
    try {
      updateTeam(team.id, { active: !team.active });
      showToast(`Team ${team.name} access ${!team.active ? 'enabled' : 'disabled'}.`, 'info');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = (team) => {
    if (window.confirm(`Delete team "${team.name}"?`)) {
      try {
        deleteTeam(team.id);
        showToast(`Team "${team.name}" deleted.`, 'info');
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  };

  const openEditModal = (t) => {
    setEditingTeam(t);
    setTeamName(t.name);
    setStartingPurse(t.startingPurse);
    setTeamColor(t.color || '#f472b6');
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
            <Users size={24} color="var(--crimson-bright)" /> Team Management
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Manage participating teams, starting purses, and secure login access passcodes.
          </p>
        </div>

        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <UserPlus size={16} /> Register New Team
        </button>
      </div>

      {/* Teams Grid / Table */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: 20,
        }}
      >
        {allTeamFinancials?.map((team) => (
          <div
            key={team.id}
            className="glass-panel"
            style={{
              padding: '22px',
              borderLeft: `5px solid ${team.color || '#f472b6'}`,
              opacity: team.active ? 1 : 0.6,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <div>
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: team.color || '#f472b6',
                      display: 'inline-block',
                    }}
                  />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
                    {team.name}
                  </h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {team.active ? (
                    <span className="badge badge-sold" style={{ fontSize: '0.72rem' }}>
                      Active
                    </span>
                  ) : (
                    <span className="badge badge-unsold" style={{ fontSize: '0.72rem' }}>
                      Disabled
                    </span>
                  )}
                </div>
              </div>

              {/* Access Code badge */}
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 16,
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Key size={13} color="var(--gold-bright)" /> Access Passcode:
                </span>
                <code style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fde047', letterSpacing: '0.08em' }}>
                  {team.code}
                </code>
              </div>

              {/* Financial stats */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  background: 'rgba(255, 255, 255, 0.02)',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Remaining Purse</span>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#6ee7b7' }}>
                    {formatYen(team.remainingPurse)}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total Spent</span>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fca5a5' }}>
                    {formatYen(team.totalSpent)}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Places Owned</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                    {team.purchasedPlaces?.length || 0}
                  </div>
                </div>

                {/* ASSET VALUE: Auctioneer only */}
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#fde047', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Sparkles size={11} /> Total Asset Value
                  </span>
                  <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fde047' }}>
                    {formatYen(team.totalAssetValue)}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions footer */}
            <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
              <button
                onClick={() => openEditModal(team)}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '7px 10px', fontSize: '0.82rem' }}
              >
                <Edit3 size={14} /> Edit
              </button>

              <button
                onClick={() => handleToggleActive(team)}
                className="btn btn-secondary"
                style={{ padding: '7px 10px', fontSize: '0.82rem' }}
                title={team.active ? 'Disable Team Access' : 'Enable Team Access'}
              >
                {team.active ? <XCircle size={14} color="#fca5a5" /> : <CheckCircle size={14} color="#86efac" />}
              </button>

              <button
                onClick={() => handleDelete(team)}
                className="btn btn-secondary"
                style={{ padding: '7px 10px', fontSize: '0.82rem' }}
                title="Delete Team"
                disabled={team.purchasedPlaces?.length > 0}
              >
                <Trash2 size={14} color="#fca5a5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ADD TEAM MODAL */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Register Participating Team">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="newTeamName">
              Team Name
            </label>
            <input
              id="newTeamName"
              type="text"
              className="form-input"
              placeholder="e.g. Team Kyoto"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="newStartingPurse">
              Starting Purse (¥)
            </label>
            <input
              id="newStartingPurse"
              type="number"
              className="form-input"
              value={startingPurse}
              onChange={(e) => setStartingPurse(e.target.value)}
              step="1000000"
              required
            />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Formatted: {formatYen(startingPurse)}
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Team Accent Color</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {['#f472b6', '#38bdf8', '#a855f7', '#34d399', '#fbbf24', '#f87171', '#94a3b8'].map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setTeamColor(col)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: col,
                    border: teamColor === col ? '3px solid #fff' : '2px solid transparent',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
            <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Team & Generate Passcode
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT TEAM MODAL */}
      <Modal isOpen={Boolean(editingTeam)} onClose={() => setEditingTeam(null)} title={`Edit ${editingTeam?.name}`}>
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Team Name</label>
            <input
              type="text"
              className="form-input"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Starting Purse (¥)</label>
            <input
              type="number"
              className="form-input"
              value={startingPurse}
              onChange={(e) => setStartingPurse(e.target.value)}
              step="1000000"
              required
            />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Formatted: {formatYen(startingPurse)}
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Team Color</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {['#f472b6', '#38bdf8', '#a855f7', '#34d399', '#fbbf24', '#f87171', '#94a3b8'].map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setTeamColor(col)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: col,
                    border: teamColor === col ? '3px solid #fff' : '2px solid transparent',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
            <button type="button" onClick={() => setEditingTeam(null)} className="btn btn-secondary">
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
