import React from 'react';
import GoldDivider from '../ui/GoldDivider';

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="footer-wordmark">CINEVERSE</span>
            <div className="footer-tagline">Beyond the Screen</div>
          </div>

          <p className="footer-statement">
            A sanctuary dedicated to the craft of filmmaking and the art of pure immersion.
          </p>

          <GoldDivider style={{ margin: '2.5rem auto' }} />

          <div className="footer-bottom">
            <span className="footer-copyright">
              © {CURRENT_YEAR} CINEVERSE. All rights reserved.
            </span>
            <span className="footer-badge">
              Private Cinema Concept
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
