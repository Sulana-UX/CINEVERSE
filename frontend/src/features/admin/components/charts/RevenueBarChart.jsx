import React, { useState } from 'react';
import { BarChart3, Sparkles } from 'lucide-react';

export default function RevenueBarChart() {
  const [activeRange, setActiveRange] = useState('today');
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Hourly screening data for Today
  const HOURLY_DATA = [
    { time: '11:00', film: 'Interstellar', hall: 'Quantum Chamber', tickets: 120, dining: 45, total: 165, seats: 4 },
    { time: '13:30', film: 'Oppenheimer', hall: 'Director’s Loge', tickets: 180, dining: 60, total: 240, seats: 6 },
    { time: '14:30', film: 'Dune: Part Two', hall: 'Sovereign Soundstage', tickets: 260, dining: 95, total: 355, seats: 9 },
    { time: '17:45', film: 'Dune: Part Two', hall: 'Sovereign Soundstage', tickets: 290, dining: 110, total: 400, seats: 10 },
    { time: '18:45', film: 'Interstellar', hall: 'Quantum Chamber', tickets: 210, dining: 75, total: 285, seats: 7 },
    { time: '20:30', film: 'Dune: Part Two', hall: 'Sovereign Soundstage', tickets: 350, dining: 140, total: 490, seats: 12, isPeak: true },
    { time: '21:15', film: 'Oppenheimer', hall: 'Director’s Loge', tickets: 230, dining: 85, total: 315, seats: 8 },
    { time: '23:30', film: 'Dune: Part Two', hall: 'Sovereign Soundstage', tickets: 140, dining: 50, total: 190, seats: 5 },
  ];

  // 7-Day repertory data
  const WEEKLY_DATA = [
    { time: 'Thu', film: 'Repertory Total', hall: 'All Suites', tickets: 980, dining: 340, total: 1320, seats: 36 },
    { time: 'Fri', film: 'Repertory Total', hall: 'All Suites', tickets: 1420, dining: 510, total: 1930, seats: 52 },
    { time: 'Sat', film: 'Repertory Total', hall: 'All Suites', tickets: 1890, dining: 720, total: 2610, seats: 68, isPeak: true },
    { time: 'Sun', film: 'Repertory Total', hall: 'All Suites', tickets: 1650, dining: 610, total: 2260, seats: 59 },
    { time: 'Mon', film: 'Repertory Total', hall: 'All Suites', tickets: 820, dining: 280, total: 1100, seats: 30 },
    { time: 'Tue', film: 'Repertory Total', hall: 'All Suites', tickets: 1050, dining: 390, total: 1440, seats: 38 },
    { time: 'Wed', film: 'Today (Live)', hall: 'All Suites', tickets: 1120, dining: 404, total: 1524, seats: 41 },
  ];

  const currentDataset = activeRange === 'today' ? HOURLY_DATA : WEEKLY_DATA;
  // Round the axis ceiling up to a clean step so grid labels match bar heights exactly.
  // Bars are drawn side by side (not stacked), so scale against the tallest single bar.
  const maxBar = Math.max(...currentDataset.map((d) => Math.max(d.tickets, d.dining)));
  const axisStep = maxBar > 1000 ? 500 : 100;
  const axisMax = Math.ceil(maxBar / axisStep) * axisStep;
  const chartHeight = 170;
  const chartWidth = 580;
  const barSlotWidth = chartWidth / currentDataset.length;
  const barWidth = activeRange === 'today' ? 18 : 24;

  const totalTickets = currentDataset.reduce((sum, d) => sum + d.tickets, 0);
  const totalDining = currentDataset.reduce((sum, d) => sum + d.dining, 0);
  const totalOverall = totalTickets + totalDining;
  const diningRatio = Math.round((totalDining / totalOverall) * 100);

  return (
    <div className="modern-chart-card">
      {/* Chart Header with Controls */}
      <div className="chart-card-header">
        <div className="chart-title-area">
          <div className="chart-icon-box">
            <BarChart3 size={18} className="chart-header-icon" />
          </div>
          <div>
            <h3 className="chart-main-title">Box Office & VIP Concession Velocity</h3>
            <p className="chart-main-subtitle">
              Admissions gross vs VIP in-seat sommelier beverage revenue
            </p>
          </div>
        </div>

        <div className="chart-controls-group">
          <div className="chart-segmented-control">
            <button
              type="button"
              onClick={() => {
                setActiveRange('today');
                setHoveredIndex(null);
              }}
              className={`segmented-btn ${activeRange === 'today' ? 'is-active' : ''}`}
            >
              Today's Showtimes
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveRange('week');
                setHoveredIndex(null);
              }}
              className={`segmented-btn ${activeRange === 'week' ? 'is-active' : ''}`}
            >
              7-Day Repertory
            </button>
          </div>
        </div>
      </div>

      {/* Mini KPI Highlights Strip */}
      <div className="chart-metrics-row">
        <div className="chart-metric-pill">
          <span className="pill-metric-label">PERIOD GROSS</span>
          <span className="pill-metric-value text-indigo">${totalOverall.toLocaleString()}</span>
        </div>
        <div className="chart-metric-pill">
          <span className="pill-metric-label">TICKET SALES</span>
          <span className="pill-metric-value">${totalTickets.toLocaleString()}</span>
        </div>
        <div className="chart-metric-pill">
          <span className="pill-metric-label">VIP CONCESSIONS</span>
          <span className="pill-metric-value text-emerald">${totalDining.toLocaleString()} ({diningRatio}%)</span>
        </div>
        <div className="chart-metric-pill highlight-pill">
          <Sparkles size={13} className="text-amber" />
          <span className="pill-metric-value">Peak: {activeRange === 'today' ? '20:30 ($490)' : 'Saturday ($2,610)'}</span>
        </div>
      </div>

      {/* SVG Interactive Chart Canvas */}
      <div className="svg-chart-container">
        <svg
          viewBox={`0 0 ${chartWidth + 60} ${chartHeight + 50}`}
          className="responsive-svg-chart"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Ticket Bar Gradient */}
            <linearGradient id="ticketBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#E3C063" stopOpacity="0.85" />
            </linearGradient>

            {/* Dining Concession Bar Gradient */}
            <linearGradient id="diningBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#34D399" stopOpacity="0.85" />
            </linearGradient>

            {/* Hover Pillar Gradient */}
            <linearGradient id="hoverColGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Background Horizontal Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = chartHeight - pct * chartHeight + 20;
            const gridVal = Math.round(pct * axisMax);
            return (
              <g key={idx} className="chart-grid-group">
                <line
                  x1="45"
                  y1={y}
                  x2={chartWidth + 50}
                  y2={y}
                  stroke="#26262D"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x="40"
                  y={y + 3}
                  textAnchor="end"
                  className="chart-axis-label"
                >
                  ${gridVal}
                </text>
              </g>
            );
          })}

          {/* Grouped Stacked/Side Bars */}
          {currentDataset.map((item, index) => {
            const slotX = 50 + index * barSlotWidth;
            const centerX = slotX + barSlotWidth / 2;
            const isHovered = hoveredIndex === index;

            // Heights
            const ticketH = (item.tickets / axisMax) * chartHeight;
            const diningH = (item.dining / axisMax) * chartHeight;

            const ticketY = chartHeight + 20 - ticketH;
            const diningY = chartHeight + 20 - diningH;

            // Side-by-side bar positions
            const x1 = centerX - barWidth;
            const x2 = centerX + 2;

            return (
              <g
                key={index}
                className="chart-bar-group"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Column Highlight Backdrop */}
                {isHovered && (
                  <rect
                    x={slotX + 4}
                    y="10"
                    width={barSlotWidth - 8}
                    height={chartHeight + 15}
                    fill="url(#hoverColGrad)"
                    rx="6"
                  />
                )}

                {/* Ticket Bar */}
                <rect
                  x={x1}
                  y={ticketY}
                  width={barWidth - 2}
                  height={ticketH}
                  rx="4"
                  fill="url(#ticketBarGrad)"
                  filter={isHovered ? 'drop-shadow(0 4px 6px rgba(212, 175, 55, 0.3))' : 'none'}
                  style={{
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transformOrigin: `${x1}px ${chartHeight + 20}px`,
                  }}
                />

                {/* Concessions Bar */}
                <rect
                  x={x2}
                  y={diningY}
                  width={barWidth - 2}
                  height={diningH}
                  rx="4"
                  fill="url(#diningBarGrad)"
                  filter={isHovered ? 'drop-shadow(0 4px 6px rgba(16, 185, 129, 0.3))' : 'none'}
                  style={{
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transformOrigin: `${x2}px ${chartHeight + 20}px`,
                  }}
                />

                {/* X Axis Time Label */}
                <text
                  x={centerX}
                  y={chartHeight + 42}
                  textAnchor="middle"
                  className={`chart-x-label ${isHovered ? 'is-active-label' : ''} ${
                    item.isPeak ? 'is-peak-label' : ''
                  }`}
                >
                  {item.time}
                </text>

                {/* Peak Indicator Dot */}
                {item.isPeak && (
                  <circle
                    cx={x1 + (barWidth - 2) / 2}
                    cy={ticketY - 8}
                    r="3.5"
                    fill="#F59E0B"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Dynamic Interactive HTML Floating Tooltip */}
        {hoveredIndex !== null && currentDataset[hoveredIndex] && (
          <div
            className="chart-dynamic-tooltip"
            style={{
              left: `${((hoveredIndex + 0.5) / currentDataset.length) * 88 + 6}%`,
            }}
          >
            <div className="tooltip-top-row">
              <span className="tooltip-time">{currentDataset[hoveredIndex].time}</span>
              <span className="tooltip-hall">{currentDataset[hoveredIndex].hall}</span>
            </div>
            <div className="tooltip-film">{currentDataset[hoveredIndex].film}</div>
            <div className="tooltip-divider" />
            <div className="tooltip-stat-row">
              <span className="stat-name">
                <span className="dot dot-indigo" /> 70mm Tickets:
              </span>
              <span className="stat-val font-mono">${currentDataset[hoveredIndex].tickets}</span>
            </div>
            <div className="tooltip-stat-row">
              <span className="stat-name">
                <span className="dot dot-emerald" /> In-Seat Dining:
              </span>
              <span className="stat-val font-mono">${currentDataset[hoveredIndex].dining}</span>
            </div>
            <div className="tooltip-total-row">
              <span>Gross Velocity:</span>
              <span className="tooltip-total-val font-mono">
                ${currentDataset[hoveredIndex].total.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Chart Footer Legend */}
      <div className="chart-footer-legend">
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-color-box indigo-grad" />
            <span className="legend-label">70mm Presentation Passes</span>
          </div>
          <div className="legend-item">
            <span className="legend-color-box emerald-grad" />
            <span className="legend-label">VIP Concierge & Dining Concessions</span>
          </div>
        </div>
        <span className="legend-helper-text">
          Hover any column to inspect live admissions & concession breakdown
        </span>
      </div>
    </div>
  );
}
