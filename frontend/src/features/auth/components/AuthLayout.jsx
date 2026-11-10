import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Film } from 'lucide-react';
import gsap from 'gsap';
import CinematicVisualPanel from './CinematicVisualPanel';

const CURRENT_YEAR = new Date().getFullYear();

/**
 * Editorial Split-Screen Layout for CINEVERSE Authentication
 * Left Panel: ~43% Deep-Black Elegant Authentication Form
 * Right Panel: ~57% Dramatic Architectural Cinema Photography
 */
export default function AuthLayout({
  children,
  eyebrow = 'WELCOME BACK',
  title = 'Your Journey Beyond the Screen Begins Here.',
  subtitle = 'Sign in to discover a world of extraordinary cinematic experiences.',
  visualProps = {
    imageSrc: '/images/luxury_cinema_interior.jpg',
    imageAlt: 'CINEVERSE Luxury Cinema Auditorium',
    badgeText: 'PRIVATE SCREENING SUITE • TIER I',
    eyebrow: 'THE ART OF CINEMA',
    heading: 'Where Every Frame Feels Extraordinary.',
    supportingText:
      'Step into a world where storytelling, atmosphere, and elegance become one unforgettable experience.',
    specs: ['70MM DUAL LASER', 'DOLBY ATMOS SOUNDSTAGE', 'BESPOKE CONCIERGE'],
  },
}) {
  const leftPanelRef = useRef(null);
  const formWrapRef = useRef(null);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || !formWrapRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        formWrapRef.current.children,
        {
          opacity: 0,
          y: 20,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.12,
          ease: 'power2.out',
          delay: 0.15,
        }
      );
    }, leftPanelRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="auth-split-wrapper">
      {/* =========================================================================
          LEFT PANEL: Deep-Black Authentication Area (43% width)
          ========================================================================= */}
      <section className="auth-panel-form" aria-label="Authentication Form Section">
        {/* Top Header Bar */}
        <header className="auth-left-topbar">
          <Link to="/" className="auth-return-link" aria-label="Return to Cinema homepage">
            <ArrowLeft size={15} className="auth-return-arrow" />
            <span>Return to Cinema</span>
          </Link>

          <Link to="/" className="auth-monogram-badge" title="CINEVERSE Home" aria-label="CINEVERSE">
            <Film size={16} className="auth-monogram-icon" />
          </Link>
        </header>

        {/* Central Form Container */}
        <div ref={formWrapRef} className="auth-central-content">
          {/* Brand Wordmark */}
          <div className="auth-brand-lockup">
            <Link to="/" className="auth-brand-anchor">
              <span className="auth-brand-title">
                CINEVERSE
                <span className="auth-brand-dot" aria-hidden="true" />
              </span>
              <span className="auth-brand-tagline">Beyond the Screen</span>
            </Link>
          </div>

          {/* Editorial Eyebrow & Headings */}
          <div className="auth-headings-block">
            {eyebrow && <span className="auth-gold-eyebrow">{eyebrow}</span>}
            {title && <h1 className="auth-main-heading">{title}</h1>}
            {subtitle && <p className="auth-main-subtitle">{subtitle}</p>}
          </div>

          {/* Form Content / Injected Children */}
          <div className="auth-form-slot">{children}</div>
        </div>

        {/* Bottom Provenance Notice */}
        <footer className="auth-left-footer">
          <span className="auth-footer-notice">
            ENCRYPTED CONCIERGE ACCESS • 256-BIT PROTOCOL
          </span>
          <span className="auth-footer-copyright">
            © {CURRENT_YEAR} CINEVERSE
          </span>
        </footer>
      </section>

      {/* =========================================================================
          RIGHT PANEL: Cinematic Architectural Photography (57% width)
          ========================================================================= */}
      <section className="auth-panel-visual-container" aria-label="Cinematic Atmosphere Visual">
        <CinematicVisualPanel {...visualProps} />
      </section>
    </div>
  );
}
