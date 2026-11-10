import { escapeHtml } from '../utils/escapeHtml.js';

/*
 * E-ticket email, laid out like an airline boarding pass.
 * Email clients ignore most modern CSS, so this uses nested tables and inline styles only.
 */

const C = {
  page: '#0a0908',
  card: '#14110d',
  cardDeep: '#0f0d0a',
  gold: '#d4af37',
  goldSoft: '#f3e5ab',
  goldDim: '#8a7535',
  ivory: '#f5f2eb',
  muted: '#9b9384',
  line: '#2e281d',
};
const SERIF = "Georgia, 'Times New Roman', Times, serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'Courier New', Courier, monospace";

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

function parseShowDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return { day: String(d).padStart(2, '0'), month: MONTHS[m - 1], year: y, weekday: DAYS[date.getUTCDay()] };
}

/** "19:30" -> { display: "7:30 PM", doors: "7:10 PM" }. Other formats are shown as given. */
function parseShowTime(value) {
  const match = /^(\d{1,2}):(\d{2})/.exec(value || '');
  if (!match) return { display: value || '', doors: '' };
  const minutes = Number(match[1]) * 60 + Number(match[2]);
  const fmt = (total) => {
    const t = (total + 1440) % 1440;
    const h = Math.floor(t / 60);
    const m = String(t % 60).padStart(2, '0');
    return `${h % 12 || 12}:${m} ${h < 12 ? 'AM' : 'PM'}`;
  };
  return { display: fmt(minutes), doors: fmt(minutes - 20) };
}

function money(amount, currency) {
  const prefix = !currency || currency === 'LKR' ? 'Rs.' : escapeHtml(currency);
  return `${prefix} ${Number(amount).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function seatIds(booking) {
  if (Array.isArray(booking.seatDetails) && booking.seatDetails.length) return booking.seatDetails.map((s) => s.id);
  if (Array.isArray(booking.seats)) return booking.seats.map((s) => (s && s.id) || s);
  return booking.seats ? [String(booking.seats)] : [];
}

/** "Premier Circle" or "Orchestra · Loge" when a booking spans tiers. */
function seatClass(booking) {
  if (!Array.isArray(booking.seatDetails)) return '';
  const names = [...new Set(booking.seatDetails.map((s) => s.tierName).filter(Boolean))];
  return names.join(' · ');
}

const label = (text) =>
  `<div style="font-family:${SANS};font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${C.muted};padding-bottom:6px;">${text}</div>`;

const field = (title, value, { size = 15, color = C.ivory, family = SANS, align = 'left' } = {}) => `
  <td valign="top" align="${align}" style="padding:0 8px 22px 0;">
    ${label(title)}
    <div style="font-family:${family};font-size:${size}px;line-height:1.25;font-weight:bold;color:${color};">${value || '&mdash;'}</div>
  </td>`;

/** Torn-edge perforation between the pass and its stub. */
const perforation = (bg) => `
  <tr>
    <td style="padding:0;background:${bg};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="14" style="width:14px;height:28px;padding:0;background:${C.page};border-radius:0 14px 14px 0;font-size:0;line-height:0;">&nbsp;</td>
          <td style="padding:0 10px;"><div style="border-top:2px dashed ${C.line};font-size:0;line-height:0;height:0;">&nbsp;</div></td>
          <td width="14" style="width:14px;height:28px;padding:0;background:${C.page};border-radius:14px 0 0 14px;font-size:0;line-height:0;">&nbsp;</td>
        </tr>
      </table>
    </td>
  </tr>`;

export function ticketEmail(booking) {
  const movie = booking.movie || {};
  const title = escapeHtml(movie.title || 'Your Presentation');
  const format = escapeHtml(movie.format || '');
  const auditorium = escapeHtml(movie.auditorium || 'Grand Auditorium');
  const guestName = escapeHtml(booking.guestName || 'Valued Patron');
  const refCode = escapeHtml(booking.refCode || '');
  const seats = seatIds(booking).map(escapeHtml);
  const seatTier = escapeHtml(seatClass(booking));
  const admit = seats.length || 1;

  const showDate = parseShowDate(booking.showDate);
  const dateLine = escapeHtml((booking.date && booking.date.full) || booking.date || '');
  const time = parseShowTime(booking.time);
  const showTime = escapeHtml(time.display);
  const doorsOpen = escapeHtml(time.doors);

  const addons = Array.isArray(booking.addons) ? booking.addons : [];
  const total = booking.totalAmount != null ? money(booking.totalAmount, booking.currency) : '';

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=0&data=${encodeURIComponent(
    booking.refCode || ''
  )}&color=14-17-13&bgcolor=243-229-171`;

  const preheader = `${movie.title || 'Your film'} · ${showDate ? `${showDate.day} ${showDate.month}` : dateLine} · ${
    time.display
  } · Seats ${seatIds(booking).join(', ')}`;

  const dateBlock = showDate
    ? `<div style="font-family:${SERIF};font-size:34px;line-height:1;color:${C.ivory};">${showDate.day}<span style="color:${C.gold};"> ${showDate.month}</span></div>
       <div style="font-family:${SANS};font-size:10px;letter-spacing:2px;color:${C.muted};padding-top:6px;">${showDate.weekday} · ${showDate.year}</div>`
    : `<div style="font-family:${SERIF};font-size:20px;line-height:1.2;color:${C.ivory};">${dateLine}</div>`;

  const addonRows = addons.length
    ? `
      <tr>
        <td class="px" style="padding:0 32px 8px;background:${C.card};">
          ${label('In-seat service')}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${addons
              .map(
                (a) => `
              <tr>
                <td style="font-family:${SANS};font-size:13px;color:${C.ivory};padding:5px 0;border-bottom:1px solid ${C.line};">${escapeHtml(
                  a.name
                )}</td>
                <td align="right" style="font-family:${SANS};font-size:13px;color:${C.goldSoft};padding:5px 0;border-bottom:1px solid ${C.line};">&times; ${Number(
                  a.quantity
                )}</td>
              </tr>`
              )
              .join('')}
          </table>
          <div style="height:18px;line-height:18px;font-size:0;">&nbsp;</div>
        </td>
      </tr>`
    : '';

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="dark" />
<meta name="supported-color-schemes" content="dark" />
<title>Your CINEVERSE Royal Pass</title>
<style>
  @media only screen and (max-width: 480px) {
    .px { padding-left: 20px !important; padding-right: 20px !important; }
    .band-txt { letter-spacing: 2px !important; font-size: 10px !important; }
    .route-mid { display: none !important; width: 0 !important; }
    .route-l { padding-left: 14px !important; }
    .route-r { padding-right: 14px !important; }
    .big-time { font-size: 20px !important; }
    .ref { font-size: 18px !important; letter-spacing: 1px !important; }
    .qr-cell { width: 100px !important; }
    .qr { width: 92px !important; height: 92px !important; border-width: 4px !important; }
    .title { font-size: 26px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${C.page};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.page};">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.page};">
  <tr>
    <td align="center" style="padding:36px 14px 44px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">

        <!-- Masthead -->
        <tr>
          <td align="center" style="padding:0 0 26px;">
            <div style="font-family:${SERIF};font-size:13px;letter-spacing:8px;color:${C.gold};">&#9830; &#9830; &#9830;</div>
            <div style="font-family:${SERIF};font-size:30px;letter-spacing:10px;color:${C.ivory};padding-top:10px;">CINEVERSE</div>
            <div style="font-family:${SANS};font-size:10px;letter-spacing:5px;color:${C.gold};padding-top:8px;">BEYOND THE SCREEN</div>
          </td>
        </tr>

        <tr>
          <td align="center" style="padding:0 6px 22px;font-family:${SERIF};font-size:16px;line-height:1.6;color:${C.ivory};">
            Dear ${guestName}, your seats are confirmed.<br />
            <span style="font-family:${SANS};font-size:13px;color:${C.muted};">Please present this pass at the Grand Foyer.</span>
          </td>
        </tr>

        <!-- Pass -->
        <tr>
          <td style="padding:0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.card};border:1px solid ${C.goldDim};border-radius:18px;overflow:hidden;">

              <!-- Gold header band -->
              <tr>
                <td class="px" style="background:${C.gold};background-image:linear-gradient(110deg,#b8932c 0%,#f3e5ab 48%,#c9a646 100%);padding:16px 32px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="font-family:${SANS};font-size:11px;font-weight:bold;letter-spacing:4px;color:#1a1408;" class="band-txt">ROYAL ADMISSION PASS</td>
                      <td align="right" style="font-family:${SANS};font-size:11px;font-weight:bold;letter-spacing:3px;color:#1a1408;white-space:nowrap;" class="band-txt">ADMIT ${admit}</td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Title -->
              <tr>
                <td class="px" style="padding:28px 32px 6px;">
                  ${label('Feature presentation')}
                  <div style="font-family:${SERIF};font-size:30px;line-height:1.15;color:${C.ivory};" class="title">${title}</div>
                  ${
                    format
                      ? `<div style="padding-top:12px;"><span style="display:inline-block;font-family:${SANS};font-size:10px;font-weight:bold;letter-spacing:2px;color:${C.goldSoft};border:1px solid ${C.goldDim};border-radius:20px;padding:5px 12px;">${format}</span></div>`
                      : ''
                  }
                </td>
              </tr>

              <!-- Route: Foyer -> Auditorium, like origin -> destination -->
              <tr>
                <td class="px" style="padding:22px 32px 24px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.cardDeep};border:1px solid ${C.line};border-radius:12px;">
                    <tr>
                      <td class="route-l" valign="middle" style="padding:18px 0 18px 20px;" width="38%">
                        ${label('Doors open')}
                        <div style="font-family:${SERIF};font-size:24px;color:${C.ivory};white-space:nowrap;" class="big-time">${doorsOpen || 'Foyer'}</div>
                        <div style="font-family:${SANS};font-size:11px;color:${C.muted};padding-top:4px;">Grand Foyer</div>
                      </td>
                      <td class="route-mid" valign="middle" align="center" style="padding:18px 6px;white-space:nowrap;font-family:${SERIF};font-size:18px;color:${C.gold};letter-spacing:2px;" width="24%">
                        &middot;&middot;&middot; &#10022; &middot;&middot;&middot;
                      </td>
                      <td class="route-r" valign="middle" align="right" style="padding:18px 20px 18px 0;" width="38%">
                        ${label('Showtime')}
                        <div style="font-family:${SERIF};font-size:24px;color:${C.gold};white-space:nowrap;" class="big-time">${showTime || '&mdash;'}</div>
                        <div style="font-family:${SANS};font-size:11px;color:${C.muted};padding-top:4px;">${auditorium}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Details grid -->
              <tr>
                <td class="px" style="padding:0 32px 4px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td valign="top" width="50%" style="padding:0 8px 22px 0;">
                        ${label('Date')}
                        ${dateBlock}
                      </td>
                      ${field('Seats', seats.join('&nbsp; ') || '&mdash;', { size: 24, color: C.goldSoft, family: SERIF })}
                    </tr>
                    <tr>
                      ${field('Patron', guestName)}
                      ${field('Class', seatTier || 'Royal')}
                    </tr>
                    <tr>
                      ${field('Hall', auditorium)}
                      ${field('Amount paid', total, { color: C.goldSoft })}
                    </tr>
                  </table>
                </td>
              </tr>

              ${addonRows}

              ${perforation(C.card)}

              <!-- Stub -->
              <tr>
                <td class="px" style="padding:22px 32px 30px;background:${C.card};">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td valign="middle" style="padding-right:16px;">
                        ${label('Booking reference')}
                        <div style="font-family:${MONO};font-size:24px;font-weight:bold;letter-spacing:3px;color:${C.gold};white-space:nowrap;" class="ref">${refCode}</div>
                        <div style="font-family:${SANS};font-size:12px;line-height:1.6;color:${C.muted};padding-top:12px;">
                          Scan at the door, or tell the host your reference.<br />
                          Valid for ${admit} ${admit === 1 ? 'guest' : 'guests'} &middot; this showing only.
                        </div>
                      </td>
                      <td class="qr-cell" valign="middle" align="right" width="132" style="width:132px;">
                        <img class="qr" src="${qrSrc}" width="120" height="120" alt="Entry QR code ${refCode}" style="display:block;width:120px;height:120px;border:6px solid ${C.goldSoft};border-radius:8px;" />
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Good to know -->
        <tr>
          <td style="padding:26px 10px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="font-family:${SANS};font-size:12px;line-height:1.7;color:${C.muted};">
                  <span style="color:${C.gold};">&#10022;</span>&nbsp; Arrive by ${doorsOpen || 'doors open'}. The foyer lounge and champagne bar open with the doors.<br />
                  <span style="color:${C.gold};">&#10022;</span>&nbsp; Your in-seat service is brought to your recliner before the curtain rises.<br />
                  <span style="color:${C.gold};">&#10022;</span>&nbsp; Late entry may be held until a suitable moment in the film.
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td align="center" style="padding:30px 10px 0;font-family:${SANS};font-size:10px;letter-spacing:3px;color:${C.goldDim};">
            CINEVERSE &middot; BEYOND THE SCREEN
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  return {
    subject: `Your Royal Pass: ${movie.title || 'Reservation'} · ${booking.refCode || ''}`,
    html,
  };
}
