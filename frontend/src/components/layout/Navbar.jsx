import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, ChevronDown, Ticket, Shield, CalendarCheck } from 'lucide-react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { isAdminUser } from '../../features/auth/utils/adminAuth';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member';
  const firstName = displayName.split(' ')[0];
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  // Close the account menu on outside click or Escape.
  useEffect(() => {
    if (!accountOpen) return undefined;
    const onPointer = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setAccountOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [accountOpen]);

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
    setAccountOpen(false);
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
                href="#films"
                className="nav-link"
                onClick={(e) => handleNavClick(e, '#films')}
              >
                Now Showing
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
                <div className={`nav-account ${accountOpen ? 'is-open' : ''}`} ref={accountRef}>
                  <button
                    type="button"
                    className="nav-account-trigger"
                    onClick={() => setAccountOpen((open) => !open)}
                    aria-haspopup="menu"
                    aria-expanded={accountOpen}
                  >
                    <span className="nav-avatar" aria-hidden="true">{initials}</span>
                    <span className="nav-account-name">{firstName}</span>
                    <ChevronDown size={14} className="nav-account-chevron" aria-hidden="true" />
                  </button>

                  {accountOpen && (
                    <div className="nav-account-menu" role="menu">
                      <div className="nav-account-head">
                        <span className="nav-avatar nav-avatar-lg" aria-hidden="true">{initials}</span>
                        <div className="nav-account-id">
                          <span className="nav-account-fullname">{displayName}</span>
                          <span className="nav-account-email">{user?.email}</span>
                        </div>
                      </div>
                      <Link
                        to="/booking"
                        className="nav-account-item"
                        role="menuitem"
                        onClick={() => setAccountOpen(false)}
                      >
                        <Ticket size={15} /> Reserve seats
                      </Link>
                      <Link
                        to="/my-bookings"
                        className="nav-account-item"
                        role="menuitem"
                        onClick={() => setAccountOpen(false)}
                      >
                        <CalendarCheck size={15} /> My bookings
                      </Link>
                      {isAdminUser(user) && (
                        <Link
                          to="/admin"
                          className="nav-account-item"
                          role="menuitem"
                          onClick={() => setAccountOpen(false)}
                        >
                          <Shield size={15} /> Admin portal
                        </Link>
                      )}
                      <button
                        type="button"
                        className="nav-account-item is-signout"
                        role="menuitem"
                        onClick={handleLogout}
                      >
                        <LogOut size={15} /> Sign out
                      </button>
                    </div>
                  )}
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
              href="#films"
              className="nav-link"
              onClick={(e) => handleNavClick(e, '#films')}
            >
              Now Showing
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
          {isAuthenticated && (
            <li>
              <Link to="/my-bookings" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
                My Bookings
              </Link>
            </li>
          )}
          {/* Admin Portal Mobile Link */}
          {isAuthenticated && isAdminUser(user) && (
            <li>
              <Link
                to="/admin"
                className="nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin Portal
              </Link>
            </li>
          )}
          <li>
            {isAuthenticated ? (
              <div className="mobile-account">
                <div className="nav-account-head">
                  <span className="nav-avatar nav-avatar-lg" aria-hidden="true">{initials}</span>
                  <div className="nav-account-id">
                    <span className="nav-account-fullname">{displayName}</span>
                    <span className="nav-account-email">{user?.email}</span>
                  </div>
                </div>
                <button type="button" onClick={handleLogout} className="mobile-signout-btn">
                  <LogOut size={16} /> Sign out
                </button>
              </div>
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
