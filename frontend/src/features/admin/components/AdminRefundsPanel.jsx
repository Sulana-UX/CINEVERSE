import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Loader2, RotateCcw, Undo2 } from 'lucide-react';
import { adminRefundsApi } from '../services/adminBookingsApi';
import { formatLKR } from '../../../utils/currency';
import { formatShowDate } from '../../booking/utils/showDates';

const POLL_MS = 30000;

function reasonFor(b) {
  if (b.status === 'refund_required') return 'Paid after seats were re-sold';
  if (b.cancelledBy === 'guest') return 'Cancelled by guest';
  return 'Cancelled';
}

/**
 * Refunds staff still owe guests. After paying a refund in the payment
 * provider's portal, staff mark it here so the guest's booking shows "refunded".
 */
export default function AdminRefundsPanel({ onNotify }) {
  const [refunds, setRefunds] = useState(null);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      setRefunds(await adminRefundsApi.list());
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const id = setInterval(load, POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [load]);

  const markRefunded = async (b) => {
    const reference = window.prompt(
      `Mark ${formatLKR(b.refundAmount)} to ${b.guestName} as refunded.\n\nPayment portal refund reference (optional):`,
      ''
    );
    if (reference === null) return;
    setBusyId(b.id);
    try {
      const saved = await adminRefundsApi.markRefunded(b.id, reference);
      setRefunds((prev) => prev.map((r) => (r.id === b.id ? saved : r)));
      onNotify?.('success', `Refund for ${b.refCode} marked as paid.`);
    } catch (err) {
      onNotify?.('error', `Refund not updated: ${err.message}`);
    } finally {
      setBusyId(null);
    }
  };

  if (error) {
    return (
      <div className="dashboard-section-panel refunds-panel">
        <p className="refunds-error">
          Could not load refunds: {error}{' '}
          <button type="button" className="panel-view-all-btn" onClick={load}>
            <RotateCcw size={13} /> Retry
          </button>
        </p>
      </div>
    );
  }
  if (!refunds) return null;

  const pending = refunds.filter((r) => r.refundStatus === 'pending');
  const done = refunds.filter((r) => r.refundStatus === 'refunded').slice(0, 5);
  if (!pending.length && !done.length) return null;

  const owed = pending.reduce((sum, r) => sum + (r.refundAmount || 0), 0);

  return (
    <div className="dashboard-section-panel refunds-panel">
      <div className="panel-header">
        <div className="panel-title-group">
          <Undo2 size={16} className="gold-icon" />
          <h2 className="panel-title">Refunds</h2>
        </div>
        <span className={`panel-tag ${pending.length ? 'refunds-tag-owed' : ''}`}>
          {pending.length ? `${pending.length} to pay · ${formatLKR(owed)}` : 'All refunds paid'}
        </span>
      </div>

      <div className="recent-bookings-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>REF ID</th>
              <th>GUEST</th>
              <th>SCREENING</th>
              <th>REASON</th>
              <th>REFUND</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {[...pending, ...done].map((b) => (
              <tr key={b.id}>
                <td className="font-mono text-gold">{b.refCode}</td>
                <td>
                  <div className="font-semibold text-ivory">{b.guestName}</div>
                  <div className="refunds-sub">{b.guestEmail}</div>
                </td>
                <td>
                  <div>{b.movieTitle}</div>
                  <div className="refunds-sub">
                    {formatShowDate(b.showDate)} · {b.showTime}
                  </div>
                </td>
                <td>{reasonFor(b)}</td>
                <td className="text-champagne font-semibold">
                  {formatLKR(b.refundAmount)}
                  <div className="refunds-sub">of {formatLKR(b.totalAmount)}</div>
                </td>
                <td>
                  {b.refundStatus === 'pending' ? (
                    <button
                      type="button"
                      className="refunds-mark-btn"
                      onClick={() => markRefunded(b)}
                      disabled={busyId === b.id}
                    >
                      {busyId === b.id ? <Loader2 size={13} className="spin-loader" /> : null}
                      Mark refunded
                    </button>
                  ) : (
                    <span className="status-pill-table pill-checked">
                      <CheckCircle2 size={12} /> Refunded
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
