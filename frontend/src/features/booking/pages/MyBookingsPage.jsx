import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock,
  Loader2,
  MapPin,
  Sparkles,
  Ticket,
  X,
} from 'lucide-react';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import { useAuth } from '../../auth/hooks/useAuth';
import { movieService } from '../../admin/services/movieService';
import { bookingApi } from '../services/bookingApi';
import TicketPass from '../components/TicketPass';
import { formatLKR } from '../../../utils/currency';
import { formatShowDate, formatShowTime } from '../utils/showDates';

const COLOMBO_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
// A screening counts as "past" this long after it starts.
const PAST_AFTER_MS = 3 * 60 * 60 * 1000;

const TABS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
  { id: 'cancelled', label: 'Cancelled' },
];

/** Start of a screening (Colombo local date + "HH:MM") as epoch ms. */
function showStart(b) {
  const [y, m, d] = b.showDate.split('-').map(Number);
  const [hh, mm] = b.showTime.split(':').map(Number);
  return Date.UTC(y, m - 1, d, hh, mm) - COLOMBO_OFFSET_MS;
}

function formatDeadline(iso) {
  return new Date(iso).toLocaleString('en-GB', {
    timeZone: 'Asia/Colombo',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function groupOf(b, now) {
  if (b.status === 'cancelled' || b.status === 'refund_required') return 'cancelled';
  return showStart(b) + PAST_AFTER_MS < now ? 'past' : 'upcoming';
}

function RefundLine({ booking }) {
  if (booking.refundStatus === 'refunded') {
    return (
      <span className="mb-refund is-done">
        <CheckCircle2 size={14} /> {formatLKR(booking.refundAmount)} refunded
      </span>
    );
  }
  if (booking.refundStatus === 'pending') {
    return (
      <span className="mb-refund is-pending">
        <Clock size={14} /> Refund of {formatLKR(booking.refundAmount)} on its way (5–10 working days)
      </span>
    );
  }
  return <span className="mb-refund">No refund was due for this cancellation.</span>;
}

/** What the guest can expect if they cancel now. */
function CancellationHint({ cancellation }) {
  if (!cancellation) return null;
  if (!cancellation.allowed) return <p className="mb-hint">{cancellation.reason}</p>;
  if (cancellation.refundPercent === 100) {
    return (
      <p className="mb-hint is-good">
        Free cancellation until {formatDeadline(cancellation.fullRefundUntil)}.
      </p>
    );
  }
  return (
    <p className="mb-hint">
      Cancel now for a {cancellation.refundPercent}% refund ({formatLKR(cancellation.refundAmount)}), until{' '}
      {formatDeadline(cancellation.cancelBy)}.
    </p>
  );
}

/** "More than 24 hours before…: full refund" lines from the server's rules. */
function describeRules(rules) {
  if (!rules?.length) return [];
  const lines = rules.map((r, i) => {
    const pct = r.refundPercent === 100 ? 'full refund' : r.refundPercent === 0 ? 'no refund' : `${r.refundPercent}% refund`;
    if (i === 0) return `More than ${r.minHoursBefore} hours before the screening: ${pct}.`;
    return `Between ${rules[i - 1].minHoursBefore} and ${r.minHoursBefore} hours before: ${pct}.`;
  });
  lines.push(`Less than ${rules[rules.length - 1].minHoursBefore} hours before: bookings can’t be cancelled.`);
  return lines;
}

function BookingCard({ booking, poster, group, onCancel }) {
  const [showTicket, setShowTicket] = useState(false);
  const canCancel = group === 'upcoming' && booking.cancellation?.allowed;
  const statusLabel =
    group === 'cancelled'
      ? booking.status === 'refund_required'
        ? 'Not completed'
        : 'Cancelled'
      : booking.checkedIn
        ? 'Checked in'
        : group === 'past'
          ? 'Watched'
          : 'Confirmed';

  return (
    <article className={`mb-card is-${group}`}>
      <div className="mb-card-body">
        <div className="mb-poster" aria-hidden="true">
          {poster ? <img src={poster} alt="" loading="lazy" /> : <Ticket size={22} />}
        </div>

        <div className="mb-info">
          <div className="mb-top">
            <span className={`mb-status is-${group}`}>{statusLabel}</span>
            <span className="mb-ref">{booking.refCode}</span>
          </div>
          <h2 className="mb-title">{booking.movieTitle}</h2>
          <ul className="mb-meta">
            <li>
              <CalendarDays size={14} /> {formatShowDate(booking.showDate)}
            </li>
            <li>
              <Clock size={14} /> {formatShowTime(booking.showTime)}
            </li>
            {booking.auditorium && (
              <li>
                <MapPin size={14} /> {booking.auditorium}
              </li>
            )}
          </ul>
          <div className="mb-seats">
            {booking.seats.map((s) => (
              <span key={s} className="mb-seat">
                {s}
              </span>
            ))}
            <span className="mb-total">{formatLKR(booking.totalAmount)}</span>
          </div>

          {group === 'cancelled' ? (
            booking.status === 'refund_required' ? (
              <p className="mb-hint">
                Your payment arrived after the seats were released. Our team will refund you in full.
              </p>
            ) : (
              <RefundLine booking={booking} />
            )
          ) : (
            group === 'upcoming' && <CancellationHint cancellation={booking.cancellation} />
          )}
        </div>
      </div>

      {group !== 'cancelled' && (
        <div className="mb-actions">
          <button
            type="button"
            className="bk-ghost-btn"
            onClick={() => setShowTicket((v) => !v)}
            aria-expanded={showTicket}
          >
            <Ticket size={15} /> {showTicket ? 'Hide ticket' : 'View ticket'}
            <ChevronDown size={14} className={`mb-chevron ${showTicket ? 'is-open' : ''}`} />
          </button>
          {canCancel && (
            <button type="button" className="mb-cancel-btn" onClick={() => onCancel(booking)}>
              Cancel booking
            </button>
          )}
        </div>
      )}

      {showTicket && (
        <div className="mb-ticket-wrap">
          <TicketPass booking={booking} />
        </div>
      )}
    </article>
  );
}

function CancelDialog({ booking, rules, onClose, onCancelled }) {
  const [quote, setQuote] = useState(booking.cancellation);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      const updated = await bookingApi.cancelPaidBooking(booking.refCode, quote.refundAmount);
      onCancelled(updated);
    } catch (err) {
      // The refund changed (e.g. the 24-hour line passed) or cancelling closed.
      if (err.data?.cancellation) setQuote(err.data.cancellation);
      setError(err.message);
      setBusy(false);
    }
  };

  return createPortal(
    <div className="mb-dialog-backdrop" onClick={() => !busy && onClose()}>
      <div
        className="mb-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mb-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="mb-dialog-close" onClick={onClose} disabled={busy} aria-label="Close">
          <X size={18} />
        </button>
        <h2 id="mb-dialog-title" className="mb-dialog-title">
          Cancel this booking?
        </h2>
        <p className="mb-dialog-film">
          {booking.movieTitle} · {formatShowDate(booking.showDate)} · {formatShowTime(booking.showTime)}
        </p>

        {quote.allowed ? (
          <dl className="mb-dialog-sums">
            <div>
              <dt>You paid</dt>
              <dd>{formatLKR(booking.totalAmount)}</dd>
            </div>
            <div className="is-refund">
              <dt>Refund ({quote.refundPercent}%)</dt>
              <dd>{formatLKR(quote.refundAmount)}</dd>
            </div>
          </dl>
        ) : (
          <p className="bk-error-text">{quote.reason}</p>
        )}

        {rules.length > 0 && (
          <ul className="mb-dialog-rules">
            {describeRules(rules).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
        <p className="mb-dialog-note">
          Your seats ({booking.seats.join(', ')}) will be released straight away. Refunds go back to your original
          payment method and usually take 5 to 10 working days.
        </p>

        {error && (
          <p className="mb-dialog-error" role="alert">
            <AlertTriangle size={15} /> {error}
          </p>
        )}

        <div className="mb-dialog-actions">
          <button type="button" className="bk-ghost-btn" onClick={onClose} disabled={busy}>
            Keep booking
          </button>
          <button type="button" className="mb-cancel-btn is-solid" onClick={confirm} disabled={busy || !quote.allowed}>
            {busy ? <Loader2 size={15} className="bk-spin" /> : null}
            {busy ? 'Cancelling…' : 'Yes, cancel'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function MyBookingsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState(null);
  const [posters, setPosters] = useState({});
  const [rules, setRules] = useState([]);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('upcoming');
  const [cancelling, setCancelling] = useState(null);
  const [notice, setNotice] = useState(null);
  const [now] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      setBookings(await bookingApi.getMyBookings());
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return undefined;
    const t = setTimeout(load, 0);
    movieService.getAllMovies().then(({ data }) => {
      setPosters(Object.fromEntries(data.map((m) => [String(m.id), m.backdrop])));
    });
    bookingApi
      .getConfig()
      .then((cfg) => setRules(cfg.cancellationRules || []))
      .catch(() => {});
    return () => clearTimeout(t);
  }, [authLoading, isAuthenticated, load]);

  const grouped = useMemo(() => {
    const groups = { upcoming: [], past: [], cancelled: [] };
    for (const b of bookings || []) groups[groupOf(b, now)].push(b);
    // Soonest screening first for upcoming; most recent first for the rest.
    groups.upcoming.sort((a, b) => showStart(a) - showStart(b));
    return groups;
  }, [bookings, now]);

  const handleCancelled = (updated) => {
    setBookings((prev) => prev.map((b) => (b.refCode === updated.refCode ? updated : b)));
    setCancelling(null);
    setNotice(
      updated.refundAmount > 0
        ? `Booking ${updated.refCode} is cancelled. ${formatLKR(updated.refundAmount)} will be refunded, and we have emailed you the details.`
        : `Booking ${updated.refCode} is cancelled. We have emailed you the details.`
    );
    setTab('cancelled');
  };

  const renderBody = () => {
    if (!authLoading && !isAuthenticated) {
      return (
        <div className="bk-panel mb-empty">
          <Ticket size={28} className="gold-icon" />
          <h2>Sign in to see your bookings</h2>
          <Link to="/login" state={{ from: '/my-bookings' }} className="bk-primary-btn mb-empty-btn">
            Sign in
          </Link>
        </div>
      );
    }
    if (error) {
      return (
        <div className="bk-panel bk-error-panel">
          <AlertTriangle size={22} />
          <div>
            <h2>Could not load your bookings</h2>
            <p>{error}</p>
            <button type="button" className="bk-ghost-btn" onClick={load}>
              Try again
            </button>
          </div>
        </div>
      );
    }
    if (!bookings) {
      return (
        <p className="bk-muted mb-loading">
          <Loader2 size={16} className="bk-spin" /> Loading your bookings…
        </p>
      );
    }

    const list = grouped[tab];
    return (
      <>
        <div className="mb-tabs" role="tablist" aria-label="Booking groups">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`mb-tab ${tab === t.id ? 'is-active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              <span className="mb-tab-count">{grouped[t.id].length}</span>
            </button>
          ))}
        </div>

        {list.length === 0 ? (
          <div className="bk-panel mb-empty">
            <Sparkles size={26} className="gold-icon" />
            <h2>
              {tab === 'upcoming'
                ? 'No upcoming screenings'
                : tab === 'past'
                  ? 'No past screenings yet'
                  : 'No cancelled bookings'}
            </h2>
            {tab === 'upcoming' && (
              <Link to="/booking" className="bk-primary-btn mb-empty-btn">
                Book tickets
              </Link>
            )}
          </div>
        ) : (
          <div className="mb-list">
            {list.map((b) => (
              <BookingCard
                key={b.refCode}
                booking={b}
                group={tab}
                poster={posters[String(b.movieId)]}
                onCancel={setCancelling}
              />
            ))}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="booking-page-root">
      <Navbar />
      <main className="bk-main">
        <div className="container bk-narrow">
          <div className="bk-page-head">
            <Link to="/" className="booking-back-link">
              <ArrowLeft size={15} />
              <span>Back to home</span>
            </Link>
            <span className="booking-eyebrow">
              <Sparkles size={13} className="gold-icon" />
              <span>YOUR ACCOUNT</span>
            </span>
            <h1 className="booking-page-heading">My Bookings</h1>
          </div>

          {notice && (
            <div className="bk-result is-success mb-notice" role="status">
              <CheckCircle2 size={22} />
              <p>{notice}</p>
              <button type="button" className="mb-notice-close" onClick={() => setNotice(null)} aria-label="Dismiss">
                <X size={16} />
              </button>
            </div>
          )}

          {renderBody()}
        </div>
      </main>
      <Footer />

      {cancelling && (
        <CancelDialog booking={cancelling} rules={rules} onClose={() => setCancelling(null)} onCancelled={handleCancelled} />
      )}
    </div>
  );
}
