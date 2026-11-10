import React, { useState, useEffect } from 'react';
import { Clock, Menu } from 'lucide-react';

export default function AdminTopBar({
  activeTab,
  onToggleMobileSidebar,
}) {
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const TAB_TITLES = {
    overview: {
      title: 'Executive Box Office & Operations',
      subtitle: 'Real-time cinema performance, occupancy analytics, and architectural timelines.',
    },
    films: {
      title: 'Repertory Film Archive & Formats',
      subtitle: 'Manage 70mm laser presentations, audio formats, and Cloudinary CDN visuals.',
    },
    bookings: {
      title: 'Guest Reservations & Passes',
      subtitle: 'Review VIP guest bookings, loge seating allocations, and door check-in status.',
    },
    auditoriums: {
      title: 'Soundstages & Screening Suites',
      subtitle: 'Architectural specifications, laser projection calibrators, and spatial acoustics.',
    },
    concierge: {
      title: 'VIP Concierge & Concession Bar',
      subtitle: 'Track in-seat Dom Pérignon champagne, caviar, and artisanal culinary orders.',
    },
  };

  const currentMeta = TAB_TITLES[activeTab] || TAB_TITLES.overview;

  return (
    <header className="admin-topbar">
      <div className="topbar-left">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="admin-mobile-toggle"
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>

        <div className="topbar-heading">
          <h1 className="topbar-title">{currentMeta.title}</h1>
          <p className="topbar-subtitle">{currentMeta.subtitle}</p>
        </div>
      </div>

      <div className="topbar-right">
        {/* Live Cinema Clock */}
        <div className="topbar-clock">
          <Clock size={14} className="gold-icon" />
          <span className="clock-digits">{timeString || '20:30:00'}</span>
          <span className="clock-label">CINEMA TIME</span>
        </div>
      </div>
    </header>
  );
}
