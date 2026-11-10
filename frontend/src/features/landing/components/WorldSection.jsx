import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function WorldSection() {
  const sectionRef = useRef(null);
  const galleryRef = useRef(null);

  useEffect(() => {
    const el = galleryRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.children,
        {
          opacity: 0,
          y: 45,
        },
        {
          opacity: 1,
          y: 0,
          duration: 1.1,
          stagger: 0.25,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 78%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="world" ref={sectionRef} className="world-section">
      <div className="container">
        <div className="world-header">
          <span className="section-label">A Glimpse of Our World</span>
          <h2 className="world-title">More than a movie. A world of its own.</h2>
          <p className="world-subtitle">
            Every detail is designed to bring you closer to the stories you love.
          </p>
        </div>

        <div ref={galleryRef} className="world-gallery">
          <div className="world-image-card main-view">
            <img
              src="/images/luxury_cinema_interior.jpg"
              alt="CINEVERSE Luxury Auditorium with red velvet seating and warm ambient lighting"
              className="world-img"
              loading="lazy"
            />
            <div className="world-image-overlay">
              <span className="world-image-tag">Atmosphere</span>
              <h3 className="world-image-caption">The Main Auditorium</h3>
            </div>
          </div>

          <div className="world-image-card detail-view">
            <img
              src="/images/luxury_cinema_details.jpg"
              alt="Crimson velvet upholstery and brushed champagne gold trims"
              className="world-img"
              loading="lazy"
            />
            <div className="world-image-overlay">
              <span className="world-image-tag">Craftsmanship</span>
              <h3 className="world-image-caption">Intimate Comfort</h3>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
