import React from 'react';
import { Minus, Plus, Wine } from 'lucide-react';
import { formatLKR } from '../../../utils/currency';

export default function ExtrasPicker({ extras, selected, onChangeQuantity }) {
  return (
    <div className="bk-panel">
      <div className="bk-section">
        <h2 className="bk-section-title">
          <Wine size={16} /> In-seat extras <span className="bk-optional">Optional</span>
        </h2>
        <p className="bk-muted">Delivered quietly to your seat before the film begins.</p>

        <div className="bk-extras-grid">
          {extras.map((extra) => {
            const qty = selected[extra.id]?.quantity || 0;
            return (
              <div key={extra.id} className={`bk-extra ${qty > 0 ? 'is-on' : ''}`}>
                <div className="bk-extra-top">
                  <span className="bk-extra-tag">{extra.tag}</span>
                  <span className="bk-extra-price">{formatLKR(extra.price)}</span>
                </div>
                <h3 className="bk-extra-name">{extra.name}</h3>
                <p className="bk-extra-desc">{extra.description}</p>

                {qty === 0 ? (
                  <button type="button" className="bk-extra-add" onClick={() => onChangeQuantity(extra, 1)}>
                    <Plus size={14} /> Add
                  </button>
                ) : (
                  <div className="bk-qty" aria-label={`${extra.name} quantity`}>
                    <button type="button" onClick={() => onChangeQuantity(extra, qty - 1)} aria-label="Remove one">
                      <Minus size={14} />
                    </button>
                    <span aria-live="polite">{qty}</span>
                    <button
                      type="button"
                      onClick={() => onChangeQuantity(extra, Math.min(10, qty + 1))}
                      aria-label="Add one"
                      disabled={qty >= 10}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
