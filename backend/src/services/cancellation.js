import { CANCELLATION_RULES } from '../config/booking.js';
import { showStartsAt } from '../utils/showtime.js';

const HOUR_MS = 60 * 60 * 1000;

/**
 * Can this booking be cancelled now, and how much comes back?
 * @param {object} row  bookings table row
 * @returns {{ allowed: boolean, reason: string|null, refundPercent: number, refundAmount: number,
 *             cancelBy: string|null, fullRefundUntil: string|null }}
 */
export function quoteCancellation(row, now = new Date()) {
  const blocked = (reason) => ({
    allowed: false,
    reason,
    refundPercent: 0,
    refundAmount: 0,
    cancelBy: null,
    fullRefundUntil: null,
  });

  if (row.status !== 'confirmed') return blocked('Only confirmed bookings can be cancelled.');
  if (row.checked_in) return blocked('This booking has already been used at the door.');

  const start = showStartsAt(row.show_date, row.show_time);
  const hoursLeft = (start.getTime() - now.getTime()) / HOUR_MS;
  const rule = CANCELLATION_RULES.find((r) => hoursLeft >= r.minHoursBefore);
  const lastRule = CANCELLATION_RULES[CANCELLATION_RULES.length - 1];
  const deadline = (hours) => new Date(start.getTime() - hours * HOUR_MS).toISOString();

  if (!rule) {
    return blocked(
      hoursLeft <= 0
        ? 'This screening has already started.'
        : `Bookings can be cancelled up to ${lastRule.minHoursBefore} hours before the screening.`
    );
  }

  const full = CANCELLATION_RULES.find((r) => r.refundPercent === 100);
  return {
    allowed: true,
    reason: null,
    refundPercent: rule.refundPercent,
    // Whole rupees, rounded down so the refund never exceeds the policy.
    refundAmount: Math.floor((row.total_amount * rule.refundPercent) / 100),
    cancelBy: deadline(lastRule.minHoursBefore),
    fullRefundUntil: full ? deadline(full.minHoursBefore) : null,
  };
}

/** The policy in words, for the booking pages. */
export function describeCancellationRules() {
  return CANCELLATION_RULES.map((r) => ({ minHoursBefore: r.minHoursBefore, refundPercent: r.refundPercent }));
}
