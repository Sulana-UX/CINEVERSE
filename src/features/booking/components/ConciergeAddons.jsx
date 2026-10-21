import React from 'react';
import { Plus, Minus, Wine } from 'lucide-react';
import { CONCIERGE_EXTRAS } from '../data/mockCinemaData';

export default function ConciergeAddons({
  selectedAddons,
  onUpdateAddonQuantity,
}) {
  return (
    <div className="concierge-addons-section">
      <div className="concierge-header">
        <div className="concierge-title-wrap">
          <Wine size={18} className="gold-icon" />
          <h3 className="concierge-title">Bespoke In-Seat Concierge Service</h3>
        </div>
        <p className="concierge-subtitle">
          Handcrafted culinary delights and sommelier pairings delivered silently to your recliner prior to curtain call.
        </p>
      </div>

      <div className="concierge-grid">
        {CONCIERGE_EXTRAS.map((extra) => {
          const quantity = selectedAddons[extra.id]?.quantity || 0;

          return (
            <div
              key={extra.id}
              className={`concierge-card ${quantity > 0 ? 'selected' : ''}`}
            >
              <div className="concierge-card-top">
                <span className="concierge-tag">{extra.tag}</span>
                <span className="concierge-price">${extra.price}</span>
              </div>

              <h4 className="concierge-item-name">{extra.name}</h4>
              <p className="concierge-item-desc">{extra.description}</p>

              <div className="concierge-controls">
                {quantity === 0 ? (
                  <button
                    type="button"
                    onClick={() => onUpdateAddonQuantity(extra, 1)}
                    className="concierge-add-btn"
                  >
                    <Plus size={14} />
                    <span>ADD TO RESERVATION</span>
                  </button>
                ) : (
                  <div className="concierge-qty-stepper">
                    <button
                      type="button"
                      onClick={() => onUpdateAddonQuantity(extra, quantity - 1)}
                      className="qty-btn"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="qty-value">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => onUpdateAddonQuantity(extra, quantity + 1)}
                      className="qty-btn"
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} />
                    </button>
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
