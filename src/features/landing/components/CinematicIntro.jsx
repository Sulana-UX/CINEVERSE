import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AlertCircle, Play, Pause } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function CinematicIntro() {
  const containerRef = useRef(null);
  const heroRef = useRef(null);
  const videoRef = useRef(null);
  const titleOverlayRef = useRef(null);
  const scrollIndicatorRef = useRef(null);

  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });
  const [isPlayingReduced, setIsPlayingReduced] = useState(false);

  const targetTimeRef = useRef(0);
  const smoothedTimeRef = useRef(0);
  const isSeekingRef = useRef(false);
  const durationRef = useRef(10);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (e) => setPrefersReducedMotion(e.matches);
    motionQuery.addEventListener('change', handleMotionChange);

    return () => motionQuery.removeEventListener('change', handleMotionChange);
  }, []);

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.duration && !isNaN(video.duration) && video.duration > 0) {
      durationRef.current = video.duration;
    }

    try {
      video.currentTime = 0.001;
    } catch {
      // ignore
    }

    setIsVideoLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsVideoLoaded(true);
  };

  useEffect(() => {
    if (!isVideoLoaded || hasError || prefersReducedMotion) return;

    const video = videoRef.current;
    const container = containerRef.current;
    const hero = heroRef.current;
    const titleOverlay = titleOverlayRef.current;
    const scrollIndicator = scrollIndicatorRef.current;

    if (!video || !container || !hero) return;

    let rafId;
    let seekUnlockTimer = null;

    const handleSeeked = () => {
      isSeekingRef.current = false;
    };

    video.addEventListener('seeked', handleSeeked);

    // High performance RAF loop with smooth linear interpolation (LERP)
    const tick = () => {
      const target = targetTimeRef.current;
      const currentSmoothed = smoothedTimeRef.current;

      // Smooth lerp damping towards target time (0.12 provides responsive yet butter-smooth tracking)
      const nextSmoothed = currentSmoothed + (target - currentSmoothed) * 0.12;
      smoothedTimeRef.current = nextSmoothed;

      // Only seek if difference is noticeable and video decoder is ready
      const diff = Math.abs(video.currentTime - nextSmoothed);
      if (diff > 0.015 && !isSeekingRef.current) {
        isSeekingRef.current = true;
        try {
          video.currentTime = nextSmoothed;
        } catch {
          isSeekingRef.current = false;
        }

        // Safety fallback timer to prevent decoder hang
        clearTimeout(seekUnlockTimer);
        seekUnlockTimer = setTimeout(() => {
          isSeekingRef.current = false;
        }, 35);
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    const ctx = gsap.context(() => {
      const scrollDistance = Math.max(window.innerHeight * 3.5, 2800);
      const maxDuration = Math.max(0.1, durationRef.current - 0.05);

      const scrollProxy = { time: 0 };

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: `+=${scrollDistance}`,
          pin: hero,
          anticipatePin: 1,
          scrub: 0.8, // Elegant GSAP momentum damping eliminates scroll jitter
          onUpdate: () => {
            targetTimeRef.current = scrollProxy.time;
          },
        },
      });

      // Smooth progress proxy animation
      tl.to(scrollProxy, {
        time: maxDuration,
        ease: 'none',
        duration: 1,
      });

      // Title overlay fade and subtle lift
      if (titleOverlay) {
        tl.to(
          titleOverlay,
          {
            opacity: 0,
            y: -45,
            ease: 'power2.out',
            duration: 0.22,
          },
          0
        );
      }

      // Scroll indicator quick fade
      if (scrollIndicator) {
        tl.to(
          scrollIndicator,
          {
            opacity: 0,
            ease: 'power2.out',
            duration: 0.12,
          },
          0
        );
      }
    }, container);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(seekUnlockTimer);
      if (video) {
        video.removeEventListener('seeked', handleSeeked);
      }
      ctx.revert();
    };
  }, [isVideoLoaded, hasError, prefersReducedMotion]);

  const toggleReducedMotionPlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlayingReduced) {
      video.pause();
      setIsPlayingReduced(false);
    } else {
      video.play().then(() => setIsPlayingReduced(true)).catch(() => {});
    }
  };

  return (
    <section id="home" ref={containerRef} className="cinematic-intro-wrapper">
      <div ref={heroRef} className="cinematic-hero-pinned">
        <div className={`cinema-loading-overlay ${isVideoLoaded ? 'loaded' : ''}`}>
          <div className="cinema-spinner" />
          <span className="cinema-loading-text">Preparing Cinema Experience</span>
        </div>

        {hasError ? (
          <div className="cinema-fallback-content">
            <AlertCircle size={40} color="#D4AF37" style={{ marginBottom: '1rem' }} />
            <h2>CINEVERSE</h2>
            <p>
              Step into an intimate sanctuary where cinema is celebrated as an extraordinary art form.
              Scroll to explore our world.
            </p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="cinema-video"
              src="/videos/cinema-intro.mp4"
              playsInline
              muted
              preload="auto"
              onLoadedMetadata={handleLoadedMetadata}
              onError={handleError}
            />

            <div className="cinematic-vignette" />
            <div className="cinematic-top-gradient" />
            <div className="cinematic-bottom-gradient" />

            <div ref={titleOverlayRef} className="cinematic-title-overlay">
              <p className="cinematic-eyebrow">Luxury Cinematic Sanctuary</p>
              <h1 className="cinematic-brand">CINEVERSE</h1>
              <p className="cinematic-tagline">Beyond the Screen</p>
            </div>

            <div ref={scrollIndicatorRef} className="scroll-indicator-container">
              <span className="scroll-indicator-label">Scroll to enter</span>
              <div className="scroll-indicator-mouse">
                <div className="scroll-indicator-wheel" />
              </div>
            </div>

            {prefersReducedMotion && (
              <div className="reduced-motion-panel">
                <button
                  onClick={toggleReducedMotionPlay}
                  className="reduced-motion-btn"
                  aria-label={isPlayingReduced ? 'Pause intro video' : 'Play intro video'}
                >
                  {isPlayingReduced ? (
                    <>
                      <Pause size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                      Pause Intro
                    </>
                  ) : (
                    <>
                      <Play size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                      Play Intro
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
