import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut } from 'lucide-react';
import { useAuth } from '../../features/auth/hooks/useAuth';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e, targetHash) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    if (location.pathname !== '/') {
      navigate('/' + targetHash);
      return;
    }

    if (targetHash === '#home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const element = document.querySelector(targetHash);
    if (element) {
      const navOffset = 80;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - navOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
  };

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <div className="navbar-inner">
          {/* Brand Wordmark */}
          <Link
            to="/"
            className="navbar-brand"
            onClick={(e) => handleNavClick(e, '#home')}
            aria-label="CINEVERSE Home"
          >
            <div className="brand-title">
              CINEVERSE
              <span className="brand-dot" aria-hidden="true" />
            </div>
            <span className="brand-subtitle">Beyond the Screen</span>
          </Link>

          {/* Desktop Navigation Links */}
          <ul className="navbar-links">
            <li>
              <a
                href="#home"
                className="nav-link"
                onClick={(e) => handleNavClick(e, '#home')}
              >
                Home
              </a>
            </li>
            <li>
              <a
                href="#experience"
                className="nav-link"
                onClick={(e) => handleNavClick(e, '#experience')}
              >
                Experience
              </a>
            </li>
            <li>
              <a
                href="#welcome"
                className="nav-link"
                onClick={(e) => handleNavClick(e, '#welcome')}
              >
                About
              </a>
            </li>
            <li>
              <Link to="/booking" className="nav-link nav-booking-link">
                Reserve Seats
              </Link>
            </li>

            {/* Authentication Member Status */}
            <li>
              {isAuthenticated ? (
                <div className="nav-user-menu">
                  <span className="nav-user-name">
                    <User size={13} style={{ marginRight: '4px' }} />
                    {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="nav-logout-btn"
                    title="Sign Out"
                    aria-label="Sign Out"
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="nav-link nav-auth-btn"
                >
                  Sign In
                </Link>
              )}
            </li>
          </ul>

          {/* Mobile Menu Button */}
          <button
            className="mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <button
          className="mobile-close-btn"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close navigation menu"
        >
          <X size={28} />
        </button>
        <ul className="mobile-links">
          <li>
            <a
              href="#home"
              className="nav-link"
              onClick={(e) => handleNavClick(e, '#home')}
            >
              Home
            </a>
          </li>
          <li>
            <a
              href="#experience"
              className="nav-link"
              onClick={(e) => handleNavClick(e, '#experience')}
            >
              Experience
            </a>
          </li>
          <li>
            <a
              href="#welcome"
              className="nav-link"
              onClick={(e) => handleNavClick(e, '#welcome')}
            >
              About
            </a>
          </li>
          <li>
            <Link
              to="/booking"
              className="nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Reserve Seats
            </Link>
          </li>
          <li>
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="nav-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Sign Out ({user?.user_metadata?.full_name || 'Member'})
              </button>
            ) : (
              <Link
                to="/login"
                className="nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
}
