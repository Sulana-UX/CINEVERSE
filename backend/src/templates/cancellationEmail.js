import { escapeHtml } from '../utils/escapeHtml.js';

const C = {
  page: '#0a0908',
  card: '#14110d',
  gold: '#d4af37',
  goldSoft: '#f3e5ab',
  goldDim: '#8a7535',
  ivory: '#f5f2eb',
  muted: '#9b9384',
  line: '#2e281d',
};
const SERIF = "Georgia, 'Times New Roman', Times, serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const rs = (n) => `Rs. ${Number(n).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const row = (label, value) => `
  <tr>
    <td style="font-family:${SANS};font-size:12px;letter-spacing:1px;text-transform:uppercase;color:${C.muted};padding:9px 0;border-bottom:1px solid ${C.line};">${label}</td>
    <td align="right" style="font-family:${SANS};font-size:14px;font-weight:bold;color:${C.ivory};padding:9px 0;border-bottom:1px solid ${C.line};">${value}</td>
  </tr>`;

/**
 * Sent when a paid booking is cancelled.
 * @param {{ refCode, guestName, movieTitle, date, time, seats: string[], totalAmount, refundAmount,
 *           refundPercent, refundDone, byStaff?: boolean, reason?: string }} b
 */
export function cancellationEmail(b) {
  const name = escapeHtml(b.guestName || 'Valued Patron');
  const title = escapeHtml(b.movieTitle || 'your screening');
  const ref = escapeHtml(b.refCode);
  const refundLine =
    b.refundAmount > 0
      ? b.refundDone
        ? `We have refunded <strong style="color:${C.goldSoft};">${rs(b.refundAmount)}</strong> to your original payment method.`
        : `We will refund <strong style="color:${C.goldSoft};">${rs(b.refundAmount)}</strong> to your original payment method. Refunds usually reach your account within 5 to 10 working days.`
      : b.byStaff
        ? 'No refund is due for this booking.'
        : 'This cancellation was made inside the no-refund window, so no refund is due.';
  const opening = b.byStaff
    ? `Dear ${name}, our team has cancelled your booking and released your seats.`
    : `Dear ${name}, your booking has been cancelled and your seats have been released.`;
  const reasonLine = b.byStaff && b.reason
    ? `<p style="font-family:${SANS};font-size:13px;line-height:1.6;color:${C.muted};margin:0 0 18px;padding:12px 14px;border-left:2px solid ${C.goldDim};">Reason: ${escapeHtml(b.reason)}</p>`
    : '';
  const footer = b.byStaff
    ? 'Questions about this cancellation? Reply to this email and quote your reference.'
    : 'If you did not cancel this booking, reply to this email straight away and quote your reference.';

  return {
    subject: `Booking cancelled: ${b.movieTitle || 'CINEVERSE'} · ${b.refCode}`,
    html: `<!doctype html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Booking cancelled</title></head>
<body style="margin:0;padding:0;background:${C.page};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.page};">
  <tr>
    <td align="center" style="padding:36px 14px 44px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
        <tr>
          <td align="center" style="padding:0 0 24px;">
            <div style="font-family:${SERIF};font-size:28px;letter-spacing:9px;color:${C.ivory};">CINEVERSE</div>
            <div style="font-family:${SANS};font-size:10px;letter-spacing:5px;color:${C.gold};padding-top:8px;">BEYOND THE SCREEN</div>
          </td>
        </tr>
        <tr>
          <td style="background:${C.card};border:1px solid ${C.goldDim};border-radius:16px;padding:30px 30px 26px;">
            <div style="font-family:${SANS};font-size:10px;font-weight:bold;letter-spacing:3px;color:${C.gold};">BOOKING CANCELLED</div>
            <div style="font-family:${SERIF};font-size:24px;line-height:1.3;color:${C.ivory};padding:10px 0 14px;">${title}</div>
            <p style="font-family:${SANS};font-size:14px;line-height:1.7;color:${C.ivory};margin:0 0 18px;">
              ${opening} ${refundLine}
            </p>
            ${reasonLine}
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              ${row('Reference', ref)}
              ${row('Screening', `${escapeHtml(b.date)} · ${escapeHtml(b.time)}`)}
              ${row('Seats', escapeHtml((b.seats || []).join(', ')))}
              ${row('Amount paid', rs(b.totalAmount))}
              ${row(`Refund (${Number(b.refundPercent)}%)`, `<span style="color:${C.goldSoft};">${rs(b.refundAmount)}</span>`)}
            </table>
            <p style="font-family:${SANS};font-size:12px;line-height:1.6;color:${C.muted};margin:18px 0 0;">
              ${footer}
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`,
  };
}
