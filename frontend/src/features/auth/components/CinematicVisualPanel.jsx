import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * Reusable Cinematic Visual Panel for Authentication Pages
 * Delivers editorial luxury through architectural cinema photography,
 * refined typography overlays, and subtle ambient motion.
 */
export default function CinematicVisualPanel({
  imageSrc,
  imageAlt = 'CINEVERSE Luxury Cinema Sanctuary',
  badgeText = 'PRIVATE SCREENING SUITE • TIER I',
  eyebrow = 'THE ART OF CINEMA',
  heading = 'Where Every Frame Feels Extraordinary.',
  supportingText = 'Step into a world where storytelling, atmosphere, and elegance become one unforgettable experience.',
  specs = ['70MM DUAL LASER', 'DOLBY ATMOS SOUNDSTAGE', 'BESPOKE CONCIERGE'],
}) {
  const panelRef = useRef(null);
  const imageRef = useRef(null);
  const textContentRef = useRef(null);

  useEffect(() => {
    // Respect user's motion preferences
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || !imageRef.current) return;

    const ctx = gsap.context(() => {
      // Subtle, slow breathing scale on the cinematic photograph
      gsap.fromTo(
        imageRef.current,
        { scale: 1 },
        {
          scale: 1.045,
          duration: 18,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        }
      );

      // Gentle entrance for editorial text overlay
      if (textContentRef.current) {
        gsap.fromTo(
          textContentRef.current.children,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 1.2,
            stagger: 0.18,
            ease: 'power3.out',
            delay: 0.35,
          }
        );
      }
    }, panelRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={panelRef} className="auth-visual-panel" aria-hidden="true">
      {/* Background Architectural Cinema Photograph */}
      <div className="auth-visual-image-wrapper">
        <img
          ref={imageRef}
          src={imageSrc}
          alt={imageAlt}
          className="auth-visual-image"
          loading="eager"
        />
      </div>

      {/* Atmospheric Overlays */}
      <div className="auth-visual-feather-left" />
      <div className="auth-visual-ambient-glow" />
      <div className="auth-visual-bottom-scrim" />

      {/* Top Architectural Badge */}
      {badgeText && (
        <div className="auth-visual-top-badge">
          <span className="auth-badge-dot" />
          <span className="auth-badge-text">{badgeText}</span>
        </div>
      )}

      {/* Editorial Luxury Text Composition */}
      <div ref={textContentRef} className="auth-visual-editorial">
        {eyebrow && (
          <div className="auth-editorial-eyebrow">
            <span className="auth-eyebrow-line" />
            <span className="auth-eyebrow-text">{eyebrow}</span>
          </div>
        )}

        {heading && (
          <h2 className="auth-editorial-heading">
            {heading}
          </h2>
        )}

        {supportingText && (
          <p className="auth-editorial-description">
            {supportingText}
          </p>
        )}

        {specs && specs.length > 0 && (
          <div className="auth-editorial-specs">
            {specs.map((spec, index) => (
              <span key={index} className="auth-spec-item">
                {spec}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
