import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AlertCircle, Play, Pause } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);
// Phones resize the viewport when the address bar slides in and out. Without
// this, every resize re-measures the pin and the page jumps while scrolling.
ScrollTrigger.config({ ignoreMobileResize: true });

const VIDEO_URL = '/videos/cinema-intro.mp4';

// Phones and tablets: scrubbing the video frame by frame while scrolling is too
// heavy for their decoders and made the page lag. They get the same video
// playing on its own in a loop instead, with normal scrolling.
const LITE_QUERY = '(max-width: 900px), (hover: none) and (pointer: coarse)';
const isLiteDevice = () => typeof window !== 'undefined' && Boolean(window.matchMedia?.(LITE_QUERY).matches);

/**
 * Scroll scrubbing seeks all over the video. Over the internet every seek into
 * a part that has not downloaded yet stalls, so the whole file is downloaded
 * into memory first and played from there. Returns the src to use and the
 * download progress (0–100). If the download fails, the normal URL is used.
 */
function useFullyLoadedVideo(url) {
  const [state, setState] = useState({ src: null, progress: 0 });

  useEffect(() => {
    if (!url) return undefined; // not needed (phones stream the video instead)
    const controller = new AbortController();
    let objectUrl = null;

    (async () => {
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
        const total = Number(res.headers.get('content-length')) || 0;
        const reader = res.body.getReader();
        const chunks = [];
        let received = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.length;
          if (total) setState((s) => ({ ...s, progress: Math.min(99, Math.round((received / total) * 100)) }));
        }
        objectUrl = URL.createObjectURL(new Blob(chunks, { type: 'video/mp4' }));
        setState({ src: objectUrl, progress: 100 });
      } catch (err) {
        if (err.name !== 'AbortError') setState({ src: url, progress: 100 });
      }
    })();

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  return state;
}

export default function CinematicIntro() {
  const [lite] = useState(isLiteDevice);
  const { src: fullVideoSrc, progress: downloadProgress } = useFullyLoadedVideo(lite ? null : VIDEO_URL);
  const videoSrc = lite ? VIDEO_URL : fullVideoSrc;
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

  // 1. Pin the hero and reserve its scroll space straight away, before the
  //    video has downloaded. Adding it later made the page jump on slow
  //    connections while people were already scrolling.
  useEffect(() => {
    if (hasError || prefersReducedMotion || lite) return undefined;

    const container = containerRef.current;
    const hero = heroRef.current;
    const titleOverlay = titleOverlayRef.current;
    const scrollIndicator = scrollIndicatorRef.current;
    if (!container || !hero) return undefined;

    const ctx = gsap.context(() => {
      const scrollDistance = Math.max(window.innerHeight * 3.5, 2800);
      const scrollProxy = { progress: 0 };

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: `+=${scrollDistance}`,
          pin: hero,
          anticipatePin: 1,
          scrub: 0.8, // momentum damping smooths out scroll jitter
          onUpdate: () => {
            // The duration is only known once the video has loaded.
            targetTimeRef.current = scrollProxy.progress * Math.max(0.1, durationRef.current - 0.05);
          },
        },
      });

      tl.to(scrollProxy, { progress: 1, ease: 'none', duration: 1 });

      // Title overlay fade and subtle lift
      if (titleOverlay) {
        tl.to(titleOverlay, { opacity: 0, y: -45, ease: 'power2.out', duration: 0.22 }, 0);
      }

      // Scroll indicator quick fade
      if (scrollIndicator) {
        tl.to(scrollIndicator, { opacity: 0, ease: 'power2.out', duration: 0.12 }, 0);
      }
    }, container);

    // Other sections set up their scroll animations first; let them re-measure
    // now that the pin has added its scroll space.
    ScrollTrigger.refresh();

    return () => ctx.revert();
  }, [hasError, prefersReducedMotion, lite]);

  // 2. Once the video is in memory, follow the scroll position with it.
  useEffect(() => {
    if (!isVideoLoaded || hasError || prefersReducedMotion || lite) return undefined;

    const video = videoRef.current;
    if (!video) return undefined;

    let rafId;
    let seekUnlockTimer = null;

    const handleSeeked = () => {
      isSeekingRef.current = false;
    };
    video.addEventListener('seeked', handleSeeked);

    // RAF loop with linear interpolation, so the video eases towards the
    // scroll position instead of jumping (also when the guest scrolled while
    // the video was still downloading).
    const tick = () => {
      const target = targetTimeRef.current;
      const nextSmoothed = smoothedTimeRef.current + (target - smoothedTimeRef.current) * 0.12;
      smoothedTimeRef.current = nextSmoothed;

      // Only seek when the difference is noticeable and the decoder is free
      const diff = Math.abs(video.currentTime - nextSmoothed);
      if (diff > 0.015 && !isSeekingRef.current) {
        isSeekingRef.current = true;
        try {
          video.currentTime = nextSmoothed;
        } catch {
          isSeekingRef.current = false;
        }

        // Safety fallback in case 'seeked' never fires
        clearTimeout(seekUnlockTimer);
        seekUnlockTimer = setTimeout(() => {
          isSeekingRef.current = false;
        }, 35);
      }

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(seekUnlockTimer);
      video.removeEventListener('seeked', handleSeeked);
    };
  }, [isVideoLoaded, hasError, prefersReducedMotion, lite]);

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
          <span className="cinema-loading-text">
            Preparing Cinema Experience{downloadProgress > 0 && downloadProgress < 100 ? ` · ${downloadProgress}%` : ''}
          </span>
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
              src={videoSrc || undefined}
              playsInline
              muted
              autoPlay={lite && !prefersReducedMotion}
              loop={lite}
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
