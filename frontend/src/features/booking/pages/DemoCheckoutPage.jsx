import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, FlaskConical, Loader2, Timer } from 'lucide-react';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import { useAuth } from '../../auth/hooks/useAuth';
import { formatLKR } from '../../../utils/currency';
import { bookingApi } from '../services/bookingApi';
import { formatShowDate, formatShowTime } from '../utils/showDates';

function useCountdown(until) {
  const [left, setLeft] = useState(() => (until ? new Date(until).getTime() - Date.now() : 0));
  useEffect(() => {
    if (!until) return undefined;
    const id = setInterval(() => setLeft(new Date(until).getTime() - Date.now()), 1000);
    return () => clearInterval(id);
  }, [until]);
  const secs = Math.max(0, Math.floor(left / 1000));
  return { expired: until ? secs <= 0 : false, text: `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}` };
}

/**
 * Development-only stand-in for the payment gateway. The backend refuses
 * these calls when PAYMENT_PROVIDER is not "demo" or in production.
 */
export default function DemoCheckoutPage() {
  const [params] = useSearchParams();
  const ref = params.get('ref') || '';
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [booking, setBooking] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);
  const countdown = useCountdown(booking?.status === 'pending' ? booking.holdExpiresAt : null);

  useEffect(() => {
    if (authLoading || !isAuthenticated || !ref) return;
    bookingApi
      .getBooking(ref)
      .then(setBooking)
      .catch((err) => setError(err.message));
  }, [ref, isAuthenticated, authLoading]);

  const finish = async (outcome) => {
    setBusy(outcome);
    try {
      await bookingApi.completeDemoPayment(ref, outcome);
    } catch {
      // The confirmation page shows the final state either way.
    }
    navigate(`/booking/confirmation?ref=${encodeURIComponent(ref)}${outcome === 'cancel' ? '&cancelled=1' : ''}`, {
      replace: true,
    });
  };

  return (
    <div className="booking-page-root">
      <Navbar />
      <main className="bk-main">
        <div className="container bk-narrow">
          <div className="bk-panel bk-checkout">
            <span className="bk-demo-badge">
              <FlaskConical size={14} /> Test payment
            </span>
            <h1 className="bk-checkout-title">Complete payment</h1>

            {!isAuthenticated && !authLoading ? (
              <p className="bk-muted">
                Please <Link to="/login">sign in</Link> to continue.
              </p>
            ) : error ? (
              <p className="bk-error-text">{error}</p>
            ) : !booking ? (
              <p className="bk-muted">
                <Loader2 size={14} className="bk-spin" /> Loading your booking…
              </p>
            ) : booking.status !== 'pending' ? (
              <p className="bk-muted">
                This booking is {booking.status}.{' '}
                <Link to={`/booking/confirmation?ref=${encodeURIComponent(ref)}`}>View details</Link>
              </p>
            ) : (
              <>
                <div className="bk-checkout-summary">
                  <div>
                    <span className="bk-muted bk-small">{booking.refCode}</span>
                    <strong>{booking.movieTitle}</strong>
                    <span className="bk-muted bk-small">
                      {formatShowDate(booking.showDate)} · {formatShowTime(booking.showTime)} · Seats{' '}
                      {booking.seats.join(', ')}
                    </span>
                  </div>
                  <span className="bk-checkout-amount">{formatLKR(booking.totalAmount)}</span>
                </div>

                <p className={`bk-hold-timer ${countdown.expired ? 'is-expired' : ''}`}>
                  <Timer size={15} />
                  {countdown.expired ? 'Your seat hold has expired.' : `Seats held for ${countdown.text}`}
                </p>

                <p className="bk-muted bk-small">
                  This is a test checkout for development. Choose an outcome to simulate the payment gateway.
                  Set <code>PAYMENT_PROVIDER=payhere</code> on the server to take real payments.
                </p>

                <div className="bk-checkout-actions">
                  <button
                    type="button"
                    className="bk-primary-btn"
                    disabled={Boolean(busy) || countdown.expired}
                    onClick={() => finish('success')}
                  >
                    {busy === 'success' ? <Loader2 size={16} className="bk-spin" /> : <CreditCard size={16} />}
                    <span>Pay {formatLKR(booking.totalAmount)}</span>
                  </button>
                  <button
                    type="button"
                    className="bk-ghost-btn"
                    disabled={Boolean(busy)}
                    onClick={() => finish('cancel')}
                  >
                    Cancel payment
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
