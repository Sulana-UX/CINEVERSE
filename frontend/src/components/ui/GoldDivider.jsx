import React from 'react';

/**
 * Reusable Luxury Gold Divider UI Component
 */
export default function GoldDivider({ className = '', style = {} }) {
  return (
    <div className={`gold-divider ${className}`} style={style} aria-hidden="true">
      <div className="gold-divider-line" />
      <div className="gold-divider-diamond" />
      <div className="gold-divider-line" />
    </div>
  );
}
