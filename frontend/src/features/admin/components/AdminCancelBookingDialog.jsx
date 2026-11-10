import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { formatLKR } from '../../../utils/currency';

/**
 * Staff cancel a paid booking for a guest (e.g. on the phone).
 * Refund options: what the guest rules give now, a full refund, or none.
 */
export default function AdminCancelBookingDialog({ booking, onClose, onConfirm }) {
  const policy = booking.cancellation || {};
  const policyAmount = policy.allowed ? policy.refundAmount : 0;
  const [refund, setRefund] = useState(policy.allowed ? 'policy' : 'full');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  const options = [
    {
      id: 'policy',
      label: 'Cancellation rules',
      amount: policyAmount,
      note: policy.allowed
        ? `What the guest would get by cancelling now (${policy.refundPercent}%).`
        : `${policy.reason || 'Outside the guest cancellation window.'} No refund under the rules.`,
    },
    {
      id: 'full',
      label: 'Full refund',
      amount: booking.totalAmount,
      note: 'For example when the cinema cancels the screening.',
    },
    { id: 'none', label: 'No refund', amount: 0, note: 'Seats are released, nothing is paid back.' },
  ];
  const chosen = options.find((o) => o.id === refund);
  const reasonOk = reason.trim().length >= 3;

  const submit = async (e) => {
    e.preventDefault();
    if (!reasonOk || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm(booking, refund, reason.trim());
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return createPortal(
    <div className="admin-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="cancel-booking-title">
      <form className="admin-modal-card admin-cancel-card" onSubmit={submit}>
        <button type="button" className="admin-modal-close" onClick={onClose} disabled={busy} aria-label="Close">
          <X size={18} />
        </button>
        <div className="admin-modal-header cancel-dialog-header">
          <span className="cancel-dialog-ref">{booking.id}</span>
          <h3 className="admin-modal-title" id="cancel-booking-title">
            Cancel this booking?
          </h3>
          <dl className="cancel-dialog-facts">
            <div>
              <dt>Guest</dt>
              <dd>{booking.guestName}</dd>
            </div>
            <div>
              <dt>Film</dt>
              <dd>{booking.movieTitle}</dd>
            </div>
            <div>
              <dt>Screening</dt>
              <dd>
                {booking.date?.full} · {booking.timeLabel || booking.showtime}
              </dd>
            </div>
            <div>
              <dt>Seats</dt>
              <dd>{Array.isArray(booking.seats) ? booking.seats.join(', ') : booking.seats}</dd>
            </div>
          </dl>
        </div>

        <div className="admin-modal-form cancel-dialog-body">
        <fieldset className="cancel-refund-options">
          <legend className="admin-label">Refund to the guest (paid {formatLKR(booking.totalAmount)})</legend>
          {options.map((o) => (
            <label key={o.id} className={`cancel-refund-option ${refund === o.id ? 'is-selected' : ''}`}>
              <input
                type="radio"
                name="refund"
                value={o.id}
                checked={refund === o.id}
                onChange={() => setRefund(o.id)}
              />
              <span className="cancel-refund-text">
                <span className="cancel-refund-label">{o.label}</span>
                <span className="cancel-refund-note">{o.note}</span>
              </span>
              <span className="cancel-refund-amount">{formatLKR(o.amount)}</span>
            </label>
          ))}
        </fieldset>

        <div className="admin-field-group">
          <label className="admin-label" htmlFor="cancel-reason">
            Reason (the guest sees this in their email) *
          </label>
          <textarea
            id="cancel-reason"
            className="admin-input admin-textarea"
            rows={2}
            style={{ minHeight: 0 }}
            maxLength={300}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Guest asked by phone to cancel"
            required
          />
        </div>

        <p className="cancel-effects">
          The seats go back on sale straight away and the guest gets an email.
          {chosen.amount > 0 && ' The refund appears in the Refunds list until you mark it as paid.'}
        </p>

        {error && (
          <div className="admin-toast-banner toast-error" role="alert">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="admin-modal-actions cancel-dialog-actions">
          <div className="cancel-dialog-total">
            <span>Refund</span>
            <strong>{formatLKR(chosen.amount)}</strong>
          </div>
          <button type="button" className="admin-cancel-btn" onClick={onClose} disabled={busy}>
            Keep booking
          </button>
          <button
            type="submit"
            className="admin-submit-btn admin-danger-btn"
            disabled={busy || !reasonOk}
            title={reasonOk ? undefined : 'Add a reason first'}
          >
            {busy && <Loader2 size={15} className="spin-loader" />}
            <span>{busy ? 'Cancelling…' : 'Cancel booking'}</span>
          </button>
        </div>
        </div>
      </form>
    </div>,
    document.body
  );
}
