import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import GoldDivider from '../../../components/ui/GoldDivider';

gsap.registerPlugin(ScrollTrigger);

export default function WelcomeSection() {
  const sectionRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.children,
        {
          opacity: 0,
          y: 35,
        },
        {
          opacity: 1,
          y: 0,
          duration: 1.2,
          stagger: 0.2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 82%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="welcome" ref={sectionRef} className="welcome-section">
      <div className="container-narrow">
        <div ref={contentRef} className="welcome-content">
          <div className="welcome-badge">
            <span className="section-label">Welcome to Cineverse</span>
          </div>

          <h2 className="welcome-title">
            Beyond <span className="gold-gradient-text">the Screen</span>
          </h2>

          <GoldDivider />

          <p className="welcome-text">
            “Discover a world where extraordinary stories meet cinematic luxury. At CINEVERSE, every
            visit is an invitation to escape the ordinary, immerse yourself in unforgettable stories,
            and experience cinema in a whole new way.”
          </p>
        </div>
      </div>
    </section>
  );
}
