import React, { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import CinematicIntro from '../components/CinematicIntro';
import RepertoryShowcase from '../components/RepertoryShowcase';
import WelcomeSection from '../components/WelcomeSection';
import ExperienceSection from '../components/ExperienceSection';
import WorldSection from '../components/WorldSection';

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  useEffect(() => {
    // Refresh ScrollTrigger calculations after initial layout and font loading
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="landing-page">
      {/* Luxury Navigation Bar */}
      <Navbar />

      {/* Main Landing Sections */}
      <main>
        <CinematicIntro />
        <RepertoryShowcase />
        <WelcomeSection />
        <ExperienceSection />
        <WorldSection />
      </main>

      {/* Luxury Footer */}
      <Footer />
    </div>
  );
}
