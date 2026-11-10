import React, { useState } from 'react';
import { BarChart3, Sparkles } from 'lucide-react';
import { formatLKR } from '../../../../utils/currency';

/** Round up to a tidy axis maximum: 1, 2 or 5 times a power of ten. */
function niceMax(value) {
  if (value <= 0) return 1000;
  const power = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 5, 10].find((m) => m * power >= value);
  return step * power;
}

const compactLKR = (n) => (n >= 1000 ? `${Math.round(n / 100) / 10}k` : String(n));

export default function RevenueBarChart({ today = [], week = [] }) {
  const [activeRange, setActiveRange] = useState('today');
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const currentDataset = (activeRange === 'today' ? today : week).map((d) => ({
    ...d,
    total: d.tickets + d.dining,
  }));
  const isEmpty = currentDataset.length === 0;
  const peak = currentDataset.reduce((best, d) => (d.total > (best?.total ?? 0) ? d : best), null);

  // Bars are drawn side by side (not stacked), so scale against the tallest single bar.
  const maxBar = Math.max(0, ...currentDataset.map((d) => Math.max(d.tickets, d.dining)));
  const axisMax = niceMax(maxBar);
  const chartHeight = 170;
  const chartWidth = 580;
  const barSlotWidth = chartWidth / Math.max(currentDataset.length, 1);
  const barWidth = Math.max(8, Math.min(24, barSlotWidth / 3));

  const totalTickets = currentDataset.reduce((sum, d) => sum + d.tickets, 0);
  const totalDining = currentDataset.reduce((sum, d) => sum + d.dining, 0);
  const totalOverall = totalTickets + totalDining;
  const diningRatio = totalOverall ? Math.round((totalDining / totalOverall) * 100) : 0;

  return (
    <div className="modern-chart-card">
      {/* Chart Header with Controls */}
      <div className="chart-card-header">
        <div className="chart-title-area">
          <div className="chart-icon-box">
            <BarChart3 size={18} className="chart-header-icon" />
          </div>
          <div>
            <h3 className="chart-main-title">Ticket & In-Seat Service Revenue</h3>
            <p className="chart-main-subtitle">
              Paid bookings: tickets compared with in-seat extras
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
              Today's Screenings
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveRange('week');
                setHoveredIndex(null);
              }}
              className={`segmented-btn ${activeRange === 'week' ? 'is-active' : ''}`}
            >
              Last 7 Days
            </button>
          </div>
        </div>
      </div>

      {/* Mini KPI Highlights Strip */}
      <div className="chart-metrics-row">
        <div className="chart-metric-pill">
          <span className="pill-metric-label">PERIOD GROSS</span>
          <span className="pill-metric-value text-indigo">{formatLKR(totalOverall)}</span>
        </div>
        <div className="chart-metric-pill">
          <span className="pill-metric-label">TICKET SALES</span>
          <span className="pill-metric-value">{formatLKR(totalTickets)}</span>
        </div>
        <div className="chart-metric-pill">
          <span className="pill-metric-label">VIP CONCESSIONS</span>
          <span className="pill-metric-value text-emerald">{formatLKR(totalDining)} ({diningRatio}%)</span>
        </div>
        <div className="chart-metric-pill highlight-pill">
          <Sparkles size={13} className="text-amber" />
          <span className="pill-metric-value">
            {peak ? `Peak: ${peak.label} (${formatLKR(peak.total)})` : 'No sales yet'}
          </span>
        </div>
      </div>

      {/* SVG Interactive Chart Canvas */}
      {isEmpty ? (
        <div className="chart-empty-state">
          {activeRange === 'today' ? 'No screenings are scheduled today.' : 'No sales in the last 7 days.'}
        </div>
      ) : (
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
                  {compactLKR(gridVal)}
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
                    peak === item && item.total > 0 ? 'is-peak-label' : ''
                  }`}
                >
                  {item.label}
                </text>

                {/* Peak Indicator Dot */}
                {peak === item && item.total > 0 && (
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
              <span className="tooltip-time">{currentDataset[hoveredIndex].label}</span>
              <span className="tooltip-hall">{currentDataset[hoveredIndex].hall}</span>
            </div>
            <div className="tooltip-film">{currentDataset[hoveredIndex].film}</div>
            <div className="tooltip-divider" />
            <div className="tooltip-stat-row">
              <span className="stat-name">
                <span className="dot dot-indigo" /> Tickets ({currentDataset[hoveredIndex].seats} seats):
              </span>
              <span className="stat-val font-mono">{formatLKR(currentDataset[hoveredIndex].tickets)}</span>
            </div>
            <div className="tooltip-stat-row">
              <span className="stat-name">
                <span className="dot dot-emerald" /> In-Seat Dining:
              </span>
              <span className="stat-val font-mono">{formatLKR(currentDataset[hoveredIndex].dining)}</span>
            </div>
            <div className="tooltip-total-row">
              <span>Total:</span>
              <span className="tooltip-total-val font-mono">
                {formatLKR(currentDataset[hoveredIndex].total)}
              </span>
            </div>
          </div>
        )}
      </div>

      )}

      {/* Chart Footer Legend */}
      <div className="chart-footer-legend">
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-color-box indigo-grad" />
            <span className="legend-label">Tickets</span>
          </div>
          <div className="legend-item">
            <span className="legend-color-box emerald-grad" />
            <span className="legend-label">In-seat extras</span>
          </div>
        </div>
        <span className="legend-helper-text">
          Hover a column for details
        </span>
      </div>
    </div>
  );
}
