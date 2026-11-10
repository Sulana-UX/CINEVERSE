import React, { useState } from 'react';
import { PieChart as PieIcon, CheckCircle2, Award } from 'lucide-react';
import { formatLKR } from '../../../../utils/currency';

const PALETTE = [
  { color: '#10B981', gradientId: 'emeraldDonutGrad', accentBg: 'rgba(16, 185, 129, 0.12)' },
  { color: '#D4AF37', gradientId: 'indigoDonutGrad', accentBg: 'rgba(212, 175, 55, 0.10)' },
  { color: '#A78BFA', gradientId: 'amberDonutGrad', accentBg: 'rgba(167, 139, 250, 0.12)' },
];

/** Each slice is that group's share of the seats sold today. */
function toSlices(rows, subtitle) {
  const sold = rows.reduce((n, r) => n + r.occupied, 0);
  return rows.map((r, i) => ({
    ...r,
    ...PALETTE[i % PALETTE.length],
    format: subtitle(r),
    percentage: sold ? Math.round((r.occupied / sold) * 100) : 0,
    fill: r.capacity ? Math.round((r.occupied / r.capacity) * 100) : 0,
  }));
}

export default function OccupancyDonutChart({ halls = [], tiers = [], seatsSold = 0, capacity = 0 }) {
  const [activeMode, setActiveMode] = useState('hall'); // 'hall' or 'tier'
  const [hoveredSlice, setHoveredSlice] = useState(null);

  const dataset =
    activeMode === 'hall'
      ? toSlices(halls, (h) => `${h.shows} screening${h.shows === 1 ? '' : 's'} today`)
      : toSlices(tiers, (t) => `${formatLKR(t.price)} per seat`);
  const occupancy = capacity ? Math.round((seatsSold / capacity) * 100) : 0;
  const busiest = dataset.reduce((best, d) => (d.fill > (best?.fill ?? -1) ? d : best), null);
  const topEarner = dataset.reduce((best, d) => (d.gross > (best?.gross ?? -1) ? d : best), null);

  // Donut geometry constants
  const size = 260;
  const center = size / 2;
  const radius = 95;
  const strokeWidth = 26;
  const circumference = 2 * Math.PI * radius;

  // Calculate cumulative offsets
  const slicesWithOffsets = dataset.map((item, index) => {
    const before = dataset.slice(0, index).reduce((sum, d) => sum + d.percentage, 0);
    const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((before / 100) * circumference);
    return {
      ...item,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const activeItem = hoveredSlice !== null ? dataset[hoveredSlice] : null;

  return (
    <div className="modern-chart-card">
      {/* Header & Toggle */}
      <div className="chart-card-header">
        <div className="chart-title-area">
          <div className="chart-icon-box">
            <PieIcon size={18} className="chart-header-icon" />
          </div>
          <div>
            <h3 className="chart-main-title">Today's Seat Occupancy</h3>
            <p className="chart-main-subtitle">
              Seats sold for today's screenings
            </p>
          </div>
        </div>

        <div className="chart-segmented-control">
          <button
            type="button"
            onClick={() => {
              setActiveMode('hall');
              setHoveredSlice(null);
            }}
            className={`segmented-btn ${activeMode === 'hall' ? 'is-active' : ''}`}
          >
            By Hall
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveMode('tier');
              setHoveredSlice(null);
            }}
            className={`segmented-btn ${activeMode === 'tier' ? 'is-active' : ''}`}
          >
            By Seat Tier
          </button>
        </div>
      </div>

      {/* 2-Column Split: Donut Chart on Left, Breakdown Cards on Right */}
      <div className="donut-chart-layout">
        {/* Left: SVG Donut with Center KPI Callout */}
        <div className="donut-canvas-wrap">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="donut-svg"
          >
            <defs>
              <linearGradient id="emeraldDonutGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#34D399" />
              </linearGradient>
              <linearGradient id="indigoDonutGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#E3C063" />
                <stop offset="100%" stopColor="#D4AF37" />
              </linearGradient>
              <linearGradient id="amberDonutGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#C4B5FD" />
                <stop offset="100%" stopColor="#A78BFA" />
              </linearGradient>
            </defs>

            {/* Background track circle */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="#1A1A1F"
              strokeWidth={strokeWidth}
            />

            {/* Slices */}
            {slicesWithOffsets.map((slice, idx) => {
              const isHovered = hoveredSlice === idx;
              return (
                <circle
                  key={slice.id}
                  opacity={slice.percentage ? 1 : 0}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke={`url(#${slice.gradientId})`}
                  strokeWidth={isHovered ? strokeWidth + 6 : strokeWidth}
                  strokeDasharray={slice.strokeDasharray}
                  strokeDashoffset={slice.strokeDashoffset}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${center} ${center})`}
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    filter: isHovered
                      ? `drop-shadow(0 6px 12px ${slice.color}40)`
                      : 'none',
                  }}
                  onMouseEnter={() => setHoveredSlice(idx)}
                  onMouseLeave={() => setHoveredSlice(null)}
                />
              );
            })}
          </svg>

          {/* Center Hole Callout Display */}
          <div className="donut-center-callout">
            {activeItem ? (
              <div className="callout-inner is-active">
                <span className="callout-pct font-mono" style={{ color: activeItem.color }}>
                  {activeItem.percentage}%
                </span>
                <span className="callout-name">{activeItem.name.split('—')[0]}</span>
                <span className="callout-gross font-mono">{formatLKR(activeItem.gross)}</span>
              </div>
            ) : (
              <div className="callout-inner">
                <span className="callout-pct font-mono text-indigo">{occupancy}%</span>
                <span className="callout-title">SEATS SOLD</span>
                <span className="callout-sub">
                  {seatsSold} / {capacity}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Soundstage Breakdown Details */}
        <div className="donut-details-list">
          {dataset.map((item, idx) => {
            const isHovered = hoveredSlice === idx;
            return (
              <div
                key={item.id}
                className={`donut-item-row ${isHovered ? 'is-hovered' : ''}`}
                onMouseEnter={() => setHoveredSlice(idx)}
                onMouseLeave={() => setHoveredSlice(null)}
                style={{
                  borderColor: isHovered ? item.color : '#26262D',
                  backgroundColor: isHovered ? item.accentBg : '#131316',
                }}
              >
                <div className="row-left">
                  <span
                    className="item-color-pill"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="item-text">
                    <span className="item-title">{item.name}</span>
                    <span className="item-format">{item.format}</span>
                  </div>
                </div>

                <div className="row-right">
                  <div className="item-numbers">
                    <span className="item-percent font-mono">{item.fill}%</span>
                    <span className="item-seats">
                      {item.occupied}/{item.capacity} Seats
                    </span>
                  </div>
                  <span className="item-gross font-mono font-semibold" style={{ color: item.color }}>
                    {formatLKR(item.gross)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Helper */}
      <div className="chart-footer-legend">
        <div className="legend-items">
          <div className="legend-item">
            <CheckCircle2 size={13} className="text-emerald" />
            <span className="legend-label">
              {busiest && busiest.fill > 0 ? `Fullest: ${busiest.name} (${busiest.fill}%)` : 'No seats sold today yet'}
            </span>
          </div>
          <div className="legend-item">
            <Award size={13} className="text-indigo" />
            <span className="legend-label">
              {topEarner && topEarner.gross > 0 ? `Top earner: ${topEarner.name}` : 'Revenue appears as seats sell'}
            </span>
          </div>
        </div>
        <span className="legend-helper-text">Slice size is share of seats sold</span>
      </div>
    </div>
  );
}
