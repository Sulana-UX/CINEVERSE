import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Loader2, Mail, XCircle } from 'lucide-react';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import { useAuth } from '../../auth/hooks/useAuth';
import { bookingApi } from '../services/bookingApi';
import TicketPass from '../components/TicketPass';

const POLL_MS = 2500;
const MAX_WAIT_MS = 90 * 1000;

/**
 * Landing page after payment (PayHere return_url / cancel_url, or the demo checkout).
 * The booking only becomes "confirmed" when the gateway notifies the backend,
 * so this page polls until it sees a final status.
 */
export default function BookingConfirmationPage() {
  const [params] = useSearchParams();
  const ref = params.get('ref') || '';
  const cancelled = params.get('cancelled') === '1';
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [booking, setBooking] = useState(null);
  const [error, setError] = useState(null);
  const [timedOut, setTimedOut] = useState(false);
  const startedAt = useRef(0);

  useEffect(() => {
    if (authLoading || !isAuthenticated || !ref) return undefined;
    let alive = true;
    let timer = null;
    startedAt.current = Date.now();

    const load = async () => {
      try {
        let b = await bookingApi.getBooking(ref);
        if (cancelled && b.status === 'pending') b = await bookingApi.cancelBooking(ref);
        if (!alive) return;
        setBooking(b);
        if (b.status === 'pending') {
          if (Date.now() - startedAt.current > MAX_WAIT_MS) setTimedOut(true);
          else timer = setTimeout(load, POLL_MS);
        }
      } catch (err) {
        if (alive) setError(err.message);
      }
    };
    load();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [ref, cancelled, isAuthenticated, authLoading]);

  const renderBody = () => {
    if (!ref) return <p className="bk-muted">No booking reference was provided.</p>;
    if (!authLoading && !isAuthenticated) {
      return (
        <p className="bk-muted">
          Please <Link to="/login" state={{ from: `/booking/confirmation?ref=${encodeURIComponent(ref)}` }}>sign in</Link>{' '}
          to view this booking.
        </p>
      );
    }
    if (error) return <p className="bk-error-text">{error}</p>;
    if (!booking) {
      return (
        <p className="bk-muted">
          <Loader2 size={15} className="bk-spin" /> Loading your booking…
        </p>
      );
    }

    switch (booking.status) {
      case 'confirmed':
        return (
          <>
            <div className="bk-result is-success">
              <CheckCircle2 size={26} />
              <div>
                <h1>Booking confirmed</h1>
                <p>
                  <Mail size={14} /> Your e-ticket has been emailed to <strong>{booking.guestEmail}</strong>.
                </p>
              </div>
            </div>
            <TicketPass booking={booking} />
            <div className="bk-result-actions bk-no-print">
              <Link to="/my-bookings" className="bk-ghost-btn">My bookings</Link>
              <Link to="/booking" className="bk-primary-btn">Book more seats</Link>
            </div>
          </>
        );
      case 'pending':
        return (
          <div className="bk-result is-pending">
            <Loader2 size={26} className="bk-spin" />
            <div>
              <h1>{timedOut ? 'Still waiting for the payment result' : 'Confirming your payment…'}</h1>
              <p>
                {timedOut
                  ? 'This is taking longer than usual. If you were charged, your booking will confirm automatically and you will get an email. You can refresh this page.'
                  : 'Please keep this page open. This usually takes a few seconds.'}
              </p>
            </div>
          </div>
        );
      case 'refund_required':
        return (
          <div className="bk-result is-error">
            <AlertTriangle size={26} />
            <div>
              <h1>Payment received, but the seats were no longer available</h1>
              <p>
                Your payment arrived after the seat hold expired and someone else booked those seats. Our team will
                refund you in full. Reference: <strong>{booking.refCode}</strong>.
              </p>
            </div>
          </div>
        );
      case 'cancelled':
        if (booking.paidAt) {
          // A paid booking the guest cancelled later (from My Bookings).
          return (
            <div className="bk-result is-pending">
              <XCircle size={26} />
              <div>
                <h1>This booking was cancelled</h1>
                <p>
                  {booking.refundAmount > 0
                    ? `A refund of Rs. ${Number(booking.refundAmount).toLocaleString('en-LK')} ${
                        booking.refundStatus === 'refunded' ? 'has been paid' : 'is on its way'
                      }.`
                    : 'No refund was due for this cancellation.'}
                </p>
                <Link to="/my-bookings" className="bk-primary-btn">My bookings</Link>
              </div>
            </div>
          );
        }
      // falls through: an unpaid hold that was cancelled
      default: {
        const messages = {
          cancelled: 'Payment was cancelled, so your seats were released. You have not been charged.',
          failed: 'The payment did not go through, so your seats were released. You have not been charged.',
          expired: 'The seat hold ran out before payment finished, so the seats were released.',
        };
        return (
          <div className="bk-result is-error">
            <XCircle size={26} />
            <div>
              <h1>Booking not completed</h1>
              <p>{messages[booking.status] || 'This booking was not completed.'}</p>
              <Link to="/booking" className="bk-primary-btn">Try again</Link>
            </div>
          </div>
        );
      }
    }
  };

  return (
    <div className="booking-page-root">
      <Navbar />
      <main className="bk-main">
        <div className="container bk-narrow">{renderBody()}</div>
      </main>
      <Footer />
    </div>
  );
}
