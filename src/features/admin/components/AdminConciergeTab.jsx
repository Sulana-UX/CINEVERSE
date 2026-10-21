import React, { useState } from 'react';
import { Wine, Clock, CheckCircle2, ChevronRight } from 'lucide-react';

export default function AdminConciergeTab({ orders, onUpdateOrderStatus }) {
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'ALL') return true;
    return o.status.toUpperCase() === statusFilter;
  });

  const getNextStatus = (current) => {
    if (current === 'Pending') return 'Preparing';
    if (current === 'Preparing') return 'Delivered';
    return 'Delivered';
  };

  return (
    <div className="concierge-tab-content">
      {/* 1. Header Filter Row */}
      <div className="concierge-filter-strip">
        <div className="filter-chips-group">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`filter-chip ${statusFilter === 'ALL' ? 'active' : ''}`}
          >
            All Orders ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('PENDING')}
            className={`filter-chip ${statusFilter === 'PENDING' ? 'active' : ''}`}
          >
            Pending Delivery ({orders.filter((o) => o.status === 'Pending').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('PREPARING')}
            className={`filter-chip ${statusFilter === 'PREPARING' ? 'active' : ''}`}
          >
            Sommelier Preparing ({orders.filter((o) => o.status === 'Preparing').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('DELIVERED')}
            className={`filter-chip ${statusFilter === 'DELIVERED' ? 'active' : ''}`}
          >
            Delivered ({orders.filter((o) => o.status === 'Delivered').length})
          </button>
        </div>
      </div>

      {/* 2. Orders Grid */}
      <div className="concierge-orders-grid">
        {filteredOrders.map((ord) => {
          const nextStatus = getNextStatus(ord.status);

          return (
            <div key={ord.id} className="concierge-order-card">
              <div className="order-card-top">
                <div className="order-meta">
                  <span className="order-id font-mono text-gold">{ord.id}</span>
                  <span className="order-time">
                    <Clock size={11} style={{ display: 'inline', marginRight: '3px' }} />
                    {ord.orderTime}
                  </span>
                </div>
                <span
                  className={`concierge-status-pill status-${ord.status.toLowerCase()}`}
                >
                  {ord.status}
                </span>
              </div>

              {/* Guest & Seat Details */}
              <div className="order-guest-strip">
                <div className="guest-info">
                  <span className="guest-name">{ord.guestName}</span>
                  <span className="guest-hall">{ord.auditorium}</span>
                </div>
                <div className="seat-badge-box">
                  <span className="seat-coords">{ord.seat}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="order-items-list">
                {ord.items.map((item, idx) => (
                  <div key={idx} className="order-item-row">
                    <span className="item-name">
                      <Wine size={13} className="gold-icon" style={{ display: 'inline', marginRight: '5px' }} />
                      {item.name} <span className="item-qty">x{item.quantity}</span>
                    </span>
                    <span className="item-price font-mono">${item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              {/* Card Footer */}
              <div className="order-card-footer">
                <div className="order-total-group">
                  <span className="total-label">ORDER TOTAL</span>
                  <span className="total-val font-mono text-champagne">${ord.total.toFixed(2)}</span>
                </div>

                {ord.status !== 'Delivered' && (
                  <button
                    type="button"
                    onClick={() => onUpdateOrderStatus(ord.id, nextStatus)}
                    className="advance-status-btn"
                  >
                    <span>Mark {nextStatus}</span>
                    <ChevronRight size={14} />
                  </button>
                )}

                {ord.status === 'Delivered' && (
                  <div className="delivered-badge">
                    <CheckCircle2 size={14} />
                    <span>Fulfilled to Seat</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
