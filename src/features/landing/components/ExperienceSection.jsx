import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Sparkles, Armchair, Film } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  {
    index: '01',
    title: 'Immersive Visuals',
    description: 'Step into extraordinary worlds through captivating cinematic experiences.',
    icon: Sparkles,
  },
  {
    index: '02',
    title: 'Comfort Redefined',
    description: 'Relax into a premium atmosphere designed around your comfort.',
    icon: Armchair,
  },
  {
    index: '03',
    title: 'Every Story Matters',
    description: 'From unforgettable adventures to intimate stories, find your next escape.',
    icon: Film,
  },
];

export default function ExperienceSection() {
  const sectionRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    const cards = cardsRef.current.filter(Boolean);
    if (!cards.length) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        cards,
        {
          opacity: 0,
          y: 40,
        },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          stagger: 0.18,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="experience" ref={sectionRef} className="experience-section">
      <div className="container">
        <div className="experience-header">
          <span className="section-label">The Cineverse Experience</span>
          <h2 className="section-title">An Elevated Standard</h2>
          <p className="section-description">
            Crafted for discerning moviegoers who seek an atmosphere as captivating as the stories
            unfolding before them.
          </p>
        </div>

        <div className="experience-grid">
          {FEATURES.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={item.index}
                ref={(el) => (cardsRef.current[idx] = el)}
                className="experience-card"
              >
                <div className="card-top">
                  <div className="card-icon-wrap">
                    <Icon size={20} strokeWidth={1.5} />
                  </div>
                  <span className="card-index">{item.index}</span>
                </div>

                <h3 className="card-title">{item.title}</h3>
                <p className="card-description">{item.description}</p>

                <div className="card-accent-line" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
