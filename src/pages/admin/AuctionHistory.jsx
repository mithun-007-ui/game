import React, { useState } from 'react';
import { useAuction } from '../../context/AuctionContext';
import Modal from '../../components/Modal';
import { formatYen } from '../../utils/currency';
import { History, RotateCcw, AlertTriangle, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';

export default function AuctionHistory() {
  const { purchases, auditLogs, reverseSale, showToast } = useAuction();
  const [reversalTarget, setReversalTarget] = useState(null);

  const handleExecuteReversal = () => {
    if (!reversalTarget) return;
    try {
      reverseSale(reversalTarget.id);
      showToast(`Sale for "${reversalTarget.placeName}" reversed. Funds refunded to ${reversalTarget.teamName}.`, 'gold');
      setReversalTarget(null);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

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
            <History size={24} color="var(--crimson-bright)" /> Purchase History & Audit Log
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Complete tamper-proof audit trail of sales, bids, and secure sale corrections.
          </p>
        </div>
      </div>

      {/* Confirmed Purchases Table with Reversal capability */}
      <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={18} color="#6ee7b7" /> Confirmed Place Transactions ({purchases.length})
        </h3>

        {purchases.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '20px 0' }}>
            No sales confirmed yet. Run the live auction to record transactions.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 700 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.82rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 14px' }}>Destination</th>
                <th style={{ padding: '12px 14px' }}>Winning Team</th>
                <th style={{ padding: '12px 14px' }}>Final Sale Price</th>
                <th style={{ padding: '12px 14px', color: '#fde047' }}>Asset Value</th>
                <th style={{ padding: '12px 14px' }}>Timestamp</th>
                <th style={{ padding: '12px 14px' }}>Status</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Corrective Action</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => {
                const isReversed = p.status === 'reversed';
                return (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      opacity: isReversed ? 0.5 : 1,
                      textDecoration: isReversed ? 'line-through' : 'none',
                    }}
                  >
                    <td style={{ padding: '14px', fontWeight: 700, color: '#fff' }}>
                      {p.placeName}
                    </td>
                    <td style={{ padding: '14px', color: '#38bdf8', fontWeight: 600 }}>
                      {p.teamName}
                    </td>
                    <td style={{ padding: '14px', fontWeight: 800, color: '#6ee7b7' }}>
                      {formatYen(p.finalPurchasePrice)}
                    </td>
                    <td style={{ padding: '14px', fontWeight: 800, color: '#fde047' }}>
                      {formatYen(p.assetValue)}
                    </td>
                    <td style={{ padding: '14px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {new Date(p.timestamp).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: '14px' }}>
                      {isReversed ? (
                        <span className="badge badge-unsold" style={{ fontSize: '0.72rem' }}>
                          Reversed
                        </span>
                      ) : (
                        <span className="badge badge-sold" style={{ fontSize: '0.72rem' }}>
                          Confirmed
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px', textAlign: 'right' }}>
                      {!isReversed && (
                        <button
                          onClick={() => setReversalTarget(p)}
                          className="btn btn-outline-crimson"
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                          title="Reverse accidental sale and refund team purse"
                        >
                          <RotateCcw size={13} /> Reverse Sale
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* System Audit Log Feed */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={18} color="var(--gold-bright)" /> Chronological System Audit Timeline ({auditLogs.length})
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 380, overflowY: 'auto' }}>
          {auditLogs.map((log) => (
            <div
              key={log.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'rgba(0, 0, 0, 0.25)',
                borderRadius: 'var(--radius-md)',
                borderLeft: log.action.includes('REVERSED')
                  ? '4px solid #ef4444'
                  : log.action.includes('SALE')
                  ? '4px solid #10b981'
                  : '4px solid #38bdf8',
                gap: 16,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', color: '#fde047' }}>
                    {log.action}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    by {log.actor}
                  </span>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', marginTop: 4, lineHeight: 1.4 }}>
                  {log.details}
                </p>
              </div>

              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* REVERSAL CONFIRMATION DIALOG */}
      <Modal
        isOpen={Boolean(reversalTarget)}
        onClose={() => setReversalTarget(null)}
        title="Confirm Accidental Sale Reversal"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#f87171' }}>
            <AlertTriangle size={24} style={{ flexShrink: 0 }} />
            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
              This will officially reverse the sale, refund{' '}
              <strong style={{ color: '#fff' }}>{formatYen(reversalTarget?.finalPurchasePrice)}</strong> back to{' '}
              <strong style={{ color: '#38bdf8' }}>{reversalTarget?.teamName}</strong>'s purse, and return "
              {reversalTarget?.placeName}" back to Available status in the auction catalog.
            </p>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: 14, borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Audit Log Guarantee:</div>
            <div style={{ fontSize: '0.85rem', color: '#6ee7b7', marginTop: 4 }}>
              ✓ The original transaction record is preserved in the audit log as "REVERSED" for complete integrity.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 10 }}>
            <button onClick={() => setReversalTarget(null)} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={handleExecuteReversal} className="btn btn-danger">
              Confirm & Execute Reversal
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
