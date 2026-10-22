import React from 'react';
import { useAuction } from '../context/AuctionContext';
import { CheckCircle2, AlertCircle, Info, Sparkles, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useAuction();

  if (!toasts.length) return null;

  return (
    <div className="toast-container" role="region" aria-live="polite">
      {toasts.map((toast) => {
        let Icon = Info;
        let className = 'toast toast-info';

        if (toast.type === 'success') {
          Icon = CheckCircle2;
          className = 'toast toast-success';
        } else if (toast.type === 'error') {
          Icon = AlertCircle;
          className = 'toast toast-error';
        } else if (toast.type === 'gold') {
          Icon = Sparkles;
          className = 'toast toast-gold';
        }

        return (
          <div key={toast.id} className={className}>
            <Icon size={18} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.9rem', flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
