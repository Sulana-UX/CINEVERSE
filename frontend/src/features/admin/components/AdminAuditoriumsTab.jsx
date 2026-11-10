import React from 'react';
import {
  Volume2,
  Film,
  Sun,
  Thermometer,
  Power,
  AlertTriangle,
  Play,
  Pause,
  Sparkles,
  Moon,
  Users,
  Minus,
  Plus,
  Clock,
  Gauge,
} from 'lucide-react';

const PHASES = [
  { status: 'Live Screening', label: 'Live', icon: Play, tone: 'success' },
  { status: 'Intermission', label: 'Interval', icon: Pause, tone: 'warn' },
  { status: 'Cleaning', label: 'Cleaning', icon: Sparkles, tone: 'info' },
  { status: 'Standby', label: 'Standby', icon: Moon, tone: 'muted' },
];

const STATUS_META = {
  'Live Screening': { text: 'Live Screening', tone: 'success' },
  Intermission: { text: 'Intermission', tone: 'warn' },
  Cleaning: { text: 'Cleaning', tone: 'info' },
  Standby: { text: 'Standby', tone: 'muted' },
};

const AUDIO_PRESETS = [
  { value: 'Dolby Atmos 64-Ch', label: 'Atmos' },
  { value: '70mm 6-Track', label: '6-Track' },
  { value: 'Dialogue Boost', label: 'Dialogue' },
];

const LIGHT_PRESETS = [
  { value: 'Dim 5%', label: '5%' },
  { value: 'Ambient 40%', label: '40%' },
  { value: 'Full 100%', label: '100%' },
];

function Segmented({ options, value, onChange, ariaLabel }) {
  return (
    <div className="aud-seg" role="group" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`aud-seg-btn ${value === opt.value ? 'is-on' : ''}`}
          aria-pressed={value === opt.value}
          title={opt.value}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function AdminAuditoriumsTab({
  auditoriums,
  onUpdateHallStatus,
  onToggleProjector,
  onSetLighting,
  onSetAudio,
  onAdjustTemp,
  onEmergencyLighting,
}) {
  const totalOccupied = auditoriums.reduce((acc, h) => acc + (h.occupiedSeats || 0), 0);
  const totalSeats = auditoriums.reduce((acc, h) => acc + (h.totalSeats || 0), 0);
  const overallOccupancy = totalSeats ? Math.round((totalOccupied / totalSeats) * 100) : 0;
  const liveCount = auditoriums.filter((h) => h.status === 'Live Screening').length;
  const avgTemp = auditoriums.length
    ? (
        auditoriums.reduce((acc, h) => acc + Number(h.temperature || 21), 0) / auditoriums.length
      ).toFixed(1)
    : '21.0';

  return (
    <div className="aud-tab">
      {/* 1. Command summary */}
      <section className="aud-summary">
        <div className="aud-summary-stats">
          <div className="aud-stat">
            <span className="aud-stat-label">Screening suites</span>
            <span className="aud-stat-value">
              {auditoriums.length}
              <span className="aud-stat-chip tone-success">{liveCount} live</span>
            </span>
          </div>
          <div className="aud-stat">
            <span className="aud-stat-label">Hall occupancy</span>
            <span className="aud-stat-value">
              {totalOccupied}
              <span className="aud-stat-of">/ {totalSeats}</span>
              <span className="aud-stat-chip tone-accent">{overallOccupancy}%</span>
            </span>
          </div>
          <div className="aud-stat">
            <span className="aud-stat-label">Climate average</span>
            <span className="aud-stat-value">
              {avgTemp}°C
              <span className="aud-stat-note">HVAC optimal</span>
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onEmergencyLighting}
          className="aud-emergency-btn"
          title="Immediately bring up 100% lights in all auditoriums"
        >
          <AlertTriangle size={15} />
          <span>Emergency full lighting</span>
        </button>
      </section>

      {/* 2. Hall cards */}
      <div className="aud-grid">
        {auditoriums.map((hall) => {
          const occupancyPercent = Math.round(
            ((hall.occupiedSeats || 0) / (hall.totalSeats || 1)) * 100
          );
          const status = STATUS_META[hall.status] || STATUS_META.Standby;
          const isLive = hall.status === 'Live Screening';
          const progress = hall.screeningProgress || 65;

          return (
            <article key={hall.id} className={`aud-card tone-${status.tone}`}>
              {/* Header */}
              <header className="aud-card-head">
                <div className="aud-card-titles">
                  <span className="aud-card-eyebrow">Soundstage {hall.number}</span>
                  <h2 className="aud-card-title">{hall.name}</h2>
                  <span className="aud-card-format">{hall.format}</span>
                </div>
                <span className={`aud-status tone-${status.tone}`}>
                  <span className="aud-status-dot" />
                  {status.text}
                </span>
              </header>

              {/* Now showing */}
              <div className="aud-now">
                <div className="aud-now-row">
                  <Film size={16} className="aud-now-icon" />
                  <div className="aud-now-text">
                    <span className="aud-now-label">Current feature</span>
                    <span className="aud-now-film">{hall.currentFilm}</span>
                  </div>
                  <span className="aud-now-next">
                    <Clock size={12} />
                    Next {hall.nextShowtime}
                  </span>
                </div>
                <div className="aud-progress" aria-hidden={!isLive}>
                  <div
                    className="aud-progress-fill"
                    style={{ width: isLive ? `${progress}%` : '0%' }}
                  />
                </div>
                <div className="aud-now-foot">
                  <span>{isLive ? 'Playback' : 'Not playing'}</span>
                  <span>{isLive ? `${progress}%` : '—'}</span>
                </div>
              </div>

              {/* Phase control */}
              <div className="aud-block">
                <span className="aud-block-label">Screening phase</span>
                <div className="aud-phase">
                  {PHASES.map((p) => {
                    const Icon = p.icon;
                    const active = hall.status === p.status;
                    return (
                      <button
                        key={p.status}
                        type="button"
                        onClick={() => onUpdateHallStatus && onUpdateHallStatus(hall.id, p.status)}
                        className={`aud-phase-btn tone-${p.tone} ${active ? 'is-on' : ''}`}
                        aria-pressed={active}
                      >
                        <Icon size={13} />
                        <span>{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Equipment controls as an aligned settings list */}
              <div className="aud-controls">
                <div className="aud-control">
                  <div className="aud-control-label">
                    <Power size={15} className={hall.projectorOn ? 'ic-success' : 'ic-muted'} />
                    <div>
                      <span className="aud-control-name">Laser projector</span>
                      <span className="aud-control-sub" title={hall.projection}>
                        {hall.projection}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={!!hall.projectorOn}
                    onClick={() => onToggleProjector && onToggleProjector(hall.id)}
                    className={`aud-switch ${hall.projectorOn ? 'is-on' : ''}`}
                    title="Toggle projector laser power"
                  >
                    <span className="aud-switch-text">{hall.projectorOn ? 'ON' : 'OFF'}</span>
                    <span className="aud-switch-knob" />
                  </button>
                </div>

                <div className="aud-control">
                  <div className="aud-control-label">
                    <Volume2 size={15} className="ic-violet" />
                    <span className="aud-control-name">Audio profile</span>
                  </div>
                  <Segmented
                    ariaLabel="Audio profile"
                    options={AUDIO_PRESETS}
                    value={hall.audioPreset || 'Dolby Atmos 64-Ch'}
                    onChange={(v) => onSetAudio && onSetAudio(hall.id, v)}
                  />
                </div>

                <div className="aud-control">
                  <div className="aud-control-label">
                    <Sun size={15} className="ic-warn" />
                    <span className="aud-control-name">House lights</span>
                  </div>
                  <Segmented
                    ariaLabel="House lights"
                    options={LIGHT_PRESETS}
                    value={hall.lightingPreset || 'Dim 5%'}
                    onChange={(v) => onSetLighting && onSetLighting(hall.id, v)}
                  />
                </div>

                <div className="aud-control">
                  <div className="aud-control-label">
                    <Thermometer size={15} className="ic-info" />
                    <span className="aud-control-name">Climate</span>
                  </div>
                  <div className="aud-stepper">
                    <button
                      type="button"
                      onClick={() => onAdjustTemp && onAdjustTemp(hall.id, -0.5)}
                      aria-label="Lower temperature"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="aud-stepper-val">
                      {Number(hall.temperature || 21).toFixed(1)}°C
                    </span>
                    <button
                      type="button"
                      onClick={() => onAdjustTemp && onAdjustTemp(hall.id, 0.5)}
                      aria-label="Raise temperature"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Occupancy */}
              <footer className="aud-occ">
                <div className="aud-occ-row">
                  <span className="aud-occ-label">
                    <Users size={13} />
                    Seats today
                  </span>
                  <span className="aud-occ-val">
                    {hall.occupiedSeats} / {hall.totalSeats}
                    <strong>{occupancyPercent}%</strong>
                  </span>
                </div>
                <div className="aud-occ-track">
                  <div
                    className={`aud-occ-fill ${occupancyPercent >= 90 ? 'is-full' : ''}`}
                    style={{ width: `${occupancyPercent}%` }}
                  />
                </div>
                {occupancyPercent >= 90 && (
                  <span className="aud-occ-flag">
                    <Gauge size={12} />
                    Near capacity
                  </span>
                )}
              </footer>
            </article>
          );
        })}
      </div>
    </div>
  );
}
