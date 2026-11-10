import React from 'react';
import { Check } from 'lucide-react';
import { BOOKING_STEPS } from '../utils/bookingFlow';

export default function BookingStepper({ current, maxReached, onGoTo }) {
  const currentIndex = BOOKING_STEPS.findIndex((s) => s.id === current);

  return (
    <nav className="bk-stepper" aria-label="Booking progress">
      <ol>
        {BOOKING_STEPS.map((step, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          const reachable = i <= maxReached;
          return (
            <li key={step.id} className={`${done ? 'is-done' : ''} ${active ? 'is-active' : ''}`}>
              <button
                type="button"
                onClick={() => reachable && onGoTo(step.id)}
                disabled={!reachable || active}
                aria-current={active ? 'step' : undefined}
              >
                <span className="bk-step-num">{done ? <Check size={13} strokeWidth={3} /> : i + 1}</span>
                <span className="bk-step-label">{step.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
