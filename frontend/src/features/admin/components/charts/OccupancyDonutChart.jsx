import React, { useState } from 'react';
import { PieChart as PieIcon, CheckCircle2, Award } from 'lucide-react';

export default function OccupancyDonutChart() {
  const [activeMode, setActiveMode] = useState('hall'); // 'hall' or 'tier'
  const [hoveredSlice, setHoveredSlice] = useState(null);

  // Soundstages Distribution
  const HALL_DATA = [
    {
      id: 'sov',
      name: 'The Sovereign Soundstage',
      format: '70mm Dual Laser',
      percentage: 48,
      occupied: 20,
      capacity: 20,
      gross: 730,
      color: '#10B981',
      gradientId: 'emeraldDonutGrad',
      accentBg: 'rgba(16, 185, 129, 0.12)',
      accentBorder: 'rgba(16, 185, 129, 0.32)',
    },
    {
      id: 'dir',
      name: 'The Director’s Loge',
      format: '70mm Panavision',
      percentage: 32,
      occupied: 14,
      capacity: 16,
      gross: 490,
      color: '#D4AF37',
      gradientId: 'indigoDonutGrad',
      accentBg: 'rgba(212, 175, 55, 0.10)',
      accentBorder: 'rgba(212, 175, 55, 0.32)',
    },
    {
      id: 'qua',
      name: 'The Quantum Chamber',
      format: '10th Anniv. 70mm',
      percentage: 20,
      occupied: 10,
      capacity: 12,
      gross: 304,
      color: '#A78BFA',
      gradientId: 'amberDonutGrad',
      accentBg: 'rgba(167, 139, 250, 0.12)',
      accentBorder: 'rgba(167, 139, 250, 0.32)',
    },
  ];

  // Seating Tier Distribution
  const TIER_DATA = [
    {
      id: 'sov-tier',
      name: 'Sovereign Recliners',
      format: 'Heated Leather & Sommelier',
      percentage: 45,
      occupied: 20,
      capacity: 22,
      gross: 685,
      color: '#D4AF37',
      gradientId: 'indigoDonutGrad',
      accentBg: 'rgba(212, 175, 55, 0.10)',
      accentBorder: 'rgba(212, 175, 55, 0.32)',
    },
    {
      id: 'dir-tier',
      name: 'Director Private Suites',
      format: 'Dolby Personal Soundstage',
      percentage: 35,
      occupied: 14,
      capacity: 16,
      gross: 533,
      color: '#10B981',
      gradientId: 'emeraldDonutGrad',
      accentBg: 'rgba(16, 185, 129, 0.12)',
      accentBorder: 'rgba(16, 185, 129, 0.32)',
    },
    {
      id: 'bal-tier',
      name: 'Royal Balcony Club',
      format: 'Elevated Sightline Tier',
      percentage: 20,
      occupied: 10,
      capacity: 10,
      gross: 306,
      color: '#A78BFA',
      gradientId: 'amberDonutGrad',
      accentBg: 'rgba(167, 139, 250, 0.12)',
      accentBorder: 'rgba(167, 139, 250, 0.32)',
    },
  ];

  const dataset = activeMode === 'hall' ? HALL_DATA : TIER_DATA;

  // Donut geometry constants
  const size = 260;
  const center = size / 2;
  const radius = 95;
  const strokeWidth = 26;
  const circumference = 2 * Math.PI * radius;

  // Calculate cumulative offsets
  let cumulativePercentage = 0;
  const slicesWithOffsets = dataset.map((item) => {
    const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((cumulativePercentage / 100) * circumference);
    cumulativePercentage += item.percentage;
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
            <h3 className="chart-main-title">Soundstage Capacity & Revenue</h3>
            <p className="chart-main-subtitle">
              Interactive occupancy breakdown across 3 luxury suites
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
            By Soundstage
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveMode('tier');
              setHoveredSlice(null);
            }}
            className={`segmented-btn ${activeMode === 'tier' ? 'is-active' : ''}`}
          >
            By Seating Tier
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
                <span className="callout-gross font-mono">${activeItem.gross}</span>
              </div>
            ) : (
              <div className="callout-inner">
                <span className="callout-pct font-mono text-indigo">86%</span>
                <span className="callout-title">SEAT CAPACITY</span>
                <span className="callout-sub">44 / 48 Reserved</span>
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
                    <span className="item-percent font-mono">{item.percentage}%</span>
                    <span className="item-seats">
                      {item.occupied}/{item.capacity} Seats
                    </span>
                  </div>
                  <span className="item-gross font-mono font-semibold" style={{ color: item.color }}>
                    ${item.gross}
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
            <span className="legend-label">Soundstage 01 at 100% Full Capacity</span>
          </div>
          <div className="legend-item">
            <Award size={13} className="text-indigo" />
            <span className="legend-label">Highest Yield: Sovereign Recliner Tier</span>
          </div>
        </div>
        <span className="legend-helper-text">Hover any suite slice to inspect seat yield</span>
      </div>
    </div>
  );
}
