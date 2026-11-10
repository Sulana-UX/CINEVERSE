import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2, RotateCcw, Ticket, XCircle } from 'lucide-react';
import { doorCheckInApi, extractRef } from '../services/adminBookingsApi';
import { colomboToday, formatShowDate, formatShowTime } from '../../booking/utils/showDates';
import { formatLKR } from '../../../utils/currency';

const timeOfDay = (iso) =>
  iso
    ? new Date(iso).toLocaleTimeString('en-GB', { timeZone: 'Asia/Colombo', hour: 'numeric', minute: '2-digit', hour12: true })
    : '';

const NOT_VALID = {
  cancelled: 'This booking was cancelled.',
  refund_required: 'This booking was cancelled and is waiting for a refund.',
  pending: 'This booking was never paid for.',
  failed: 'This booking was never paid for.',
  expired: 'This booking was never paid for.',
};

/**
 * Door check-in. Staff scan the QR code on a guest's e-ticket with their phone
 * camera; it opens /admin/check-in/CV-XXXXXXXX here (signed in as admin), and
 * one tap checks the party in. References can also be typed in.
 */
export default function AdminCheckInPage() {
  const { ref: rawRef } = useParams();
  const ref = extractRef(rawRef);
  const navigate = useNavigate();

  // What was looked up, for which reference. Loading = a reference whose
  // result has not arrived yet, so nothing has to be reset by hand.
  const [result, setResult] = useState({ ref: null, booking: null, error: null, justCheckedIn: false });
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [typed, setTyped] = useState('');
  const [typedError, setTypedError] = useState(null);

  useEffect(() => {
    if (!ref) return undefined;
    let stale = false;
    doorCheckInApi.find(ref).then(
      (found) => !stale && setResult({ ref, booking: found, error: null, justCheckedIn: false }),
      (err) => !stale && setResult({ ref, booking: null, error: err.message, justCheckedIn: false })
    );
    return () => {
      stale = true;
    };
  }, [ref]);

  const current = result.ref === ref ? result : null;
  const loading = Boolean(ref) && !current;
  const booking = current?.booking || null;
  const justCheckedIn = Boolean(current?.justCheckedIn);
  const error =
    (rawRef && !ref ? 'That is not a CINEVERSE booking reference.' : current?.error) || actionError;

  const setCheckedIn = async (value) => {
    setSaving(true);
    setActionError(null);
    try {
      const updated = await doorCheckInApi.setCheckedIn(booking.id, value);
      setResult({ ref, booking: updated, error: null, justCheckedIn: value });
      if (value) navigator.vibrate?.(80);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const openTyped = (e) => {
    e.preventDefault();
    const next = extractRef(typed);
    if (!next) {
      setTypedError('Enter a reference like CV-7KQ2M9XA.');
      return;
    }
    setTypedError(null);
    setActionError(null);
    setTyped('');
    navigate(`/admin/check-in/${next}`);
  };

  const guests = booking?.seats?.length || 0;
  const invalidReason = booking && NOT_VALID[booking.status];
  const otherDay = booking && booking.showDate !== colomboToday();

  return (
    <div className="ci-page">
      <header className="ci-top">
        <Link to="/admin" className="ci-back">
          <ArrowLeft size={16} /> Dashboard
        </Link>
        <span className="ci-brand">CINEVERSE · Door</span>
      </header>

      <main className="ci-main">
        {loading && (
          <div className="ci-card ci-center">
            <Loader2 size={28} className="ci-spin" />
            <p>Looking up {ref}…</p>
          </div>
        )}

        {!loading && !booking && !error && (
          <div className="ci-card ci-center">
            <Ticket size={32} className="ci-gold" />
            <h1 className="ci-title">Check in a guest</h1>
            <p className="ci-muted">
              Scan the QR code on the guest’s e-ticket with your phone camera, or type the booking reference below.
            </p>
          </div>
        )}

        {!loading && error && !booking && (
          <div className="ci-card ci-status is-bad" role="alert">
            <XCircle size={30} />
            <div>
              <h1 className="ci-title">Not found</h1>
              <p>{error}</p>
            </div>
          </div>
        )}

        {!loading && booking && (
          <>
            {invalidReason ? (
              <div className="ci-status is-bad" role="alert">
                <XCircle size={30} />
                <div>
                  <h1 className="ci-title">Do not admit</h1>
                  <p>{invalidReason}</p>
                </div>
              </div>
            ) : booking.checkedIn ? (
              <div className={`ci-status ${justCheckedIn ? 'is-good' : 'is-warn'}`} role="status">
                {justCheckedIn ? <CheckCircle2 size={30} /> : <AlertTriangle size={30} />}
                <div>
                  <h1 className="ci-title">{justCheckedIn ? `Checked in · admit ${guests}` : 'Already checked in'}</h1>
                  <p>{justCheckedIn ? 'Enjoy the show.' : `Checked in at ${timeOfDay(booking.checkedInAt) || 'an earlier time'}. Check before letting anyone in again.`}</p>
                </div>
              </div>
            ) : (
              <div className={`ci-status ${otherDay ? 'is-warn' : 'is-ready'}`} role="status">
                {otherDay ? <AlertTriangle size={30} /> : <Ticket size={30} />}
                <div>
                  <h1 className="ci-title">{otherDay ? 'Not today’s show' : `Valid ticket · admit ${guests}`}</h1>
                  <p>{otherDay ? `This ticket is for ${formatShowDate(booking.showDate)}.` : 'Paid and ready to check in.'}</p>
                </div>
              </div>
            )}

            {error && <p className="ci-error" role="alert">{error}</p>}

            <section className="ci-card">
              <p className="ci-ref">{booking.refCode}</p>
              <h2 className="ci-film">{booking.movieTitle}</h2>
              <dl className="ci-facts">
                <div>
                  <dt>When</dt>
                  <dd>
                    {formatShowDate(booking.showDate)} · {formatShowTime(booking.showTime)}
                  </dd>
                </div>
                <div>
                  <dt>Hall</dt>
                  <dd>{booking.auditorium}</dd>
                </div>
                <div>
                  <dt>Guest</dt>
                  <dd>{booking.guestName}</dd>
                </div>
                <div>
                  <dt>Seats ({guests})</dt>
                  <dd className="ci-seats">
                    {(booking.seats || []).map((s) => (
                      <span key={s}>{s}</span>
                    ))}
                  </dd>
                </div>
                {booking.addons?.length > 0 && (
                  <div>
                    <dt>In-seat service</dt>
                    <dd>
                      {booking.addons.map((a) => (
                        <span key={a.name} className="ci-addon">
                          {a.name} × {a.quantity}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
                <div>
                  <dt>Paid</dt>
                  <dd>{formatLKR(booking.totalAmount)}</dd>
                </div>
              </dl>
            </section>

            {!invalidReason && !booking.checkedIn && (
              <button type="button" className="ci-primary" onClick={() => setCheckedIn(true)} disabled={saving}>
                {saving ? <Loader2 size={20} className="ci-spin" /> : <CheckCircle2 size={20} />}
                {saving ? 'Checking in…' : `Check in ${guests} ${guests === 1 ? 'guest' : 'guests'}`}
              </button>
            )}
            {!invalidReason && booking.checkedIn && (
              <button type="button" className="ci-secondary" onClick={() => setCheckedIn(false)} disabled={saving}>
                <RotateCcw size={16} /> Undo check-in
              </button>
            )}
          </>
        )}

        <form className="ci-card ci-manual" onSubmit={openTyped}>
          <label htmlFor="ci-ref-input">{booking || error ? 'Next ticket: scan its QR code, or type the reference' : 'Booking reference'}</label>
          <div className="ci-manual-row">
            <input
              id="ci-ref-input"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="CV-7KQ2M9XA"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
            />
            <button type="submit">Find</button>
          </div>
          {typedError && <p className="ci-error ci-typed-error" role="alert">{typedError}</p>}
        </form>
      </main>
    </div>
  );
}
