import React from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Film,
  Ticket,
  Maximize2,
  Wine,
  ExternalLink,
  LogOut,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';

export default function AdminSidebar({
  activeTab,
  onSelectTab,
  mobileOpen,
  collapsed = false,
  onToggleCollapse,
  hallCount = 0,
}) {
  const { user, logout } = useAuth();

  const NAV_ITEMS = [
    { id: 'overview', label: 'Executive Overview', icon: LayoutDashboard, badge: null },
    { id: 'films', label: 'Repertory Archive', icon: Film, badge: null },
    { id: 'bookings', label: 'Guest Reservations', icon: Ticket, badge: 'LIVE' },
    { id: 'auditoriums', label: 'Soundstages & Halls', icon: Maximize2, badge: hallCount ? String(hallCount).padStart(2, '0') : null },
    { id: 'concierge', label: 'VIP Concierge Bar', icon: Wine, badge: null },
  ];

  return (
    <aside
      className={`admin-sidebar ${mobileOpen ? 'mobile-open' : ''} ${collapsed ? 'is-collapsed' : ''}`}
    >
      {/* Brand & Wordmark */}
      <div className="admin-sidebar-header">
        <Link to="/" className="sidebar-brand">
          <Film size={22} className="gold-icon" />
          <div className="sidebar-brand-text">
            <span className="brand-wordmark">CINEVERSE</span>
            <span className="brand-suite-badge">CONCIERGE SUITE</span>
          </div>
        </Link>
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="sidebar-collapse-btn"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="admin-sidebar-nav">
        <span className="nav-group-title">COMMAND SUITE</span>
        <ul className="nav-items-list">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`nav-item-btn ${isActive ? 'is-active' : ''}`}
                  title={collapsed ? item.label : undefined}
                  aria-label={item.label}
                >
                  <Icon size={18} className="nav-icon" />
                  <span className="nav-label">{item.label}</span>
                  {item.badge && (
                    <span className={`nav-badge ${item.badge === 'LIVE' ? 'live-badge' : ''}`}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && <div className="nav-active-pip" />}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer / Profile Section */}
      <div className="admin-sidebar-footer">
        <div className="admin-profile-card">
          <div className="admin-avatar">
            <ShieldCheck size={18} className="gold-icon" />
          </div>
          <div className="admin-user-info">
            <span className="admin-user-name">
              {user?.user_metadata?.full_name || 'Executive Director'}
            </span>
            <span className="admin-user-email" title={user?.email || ''}>
              {user?.email || ''}
            </span>
          </div>
        </div>

        <div className="sidebar-action-links">
          <Link
            to="/"
            className="sidebar-footer-link"
            target="_blank"
            rel="noreferrer"
            title="Open public site"
          >
            <ExternalLink size={14} />
            <span>Public Site</span>
          </Link>
          <button
            type="button"
            onClick={logout}
            className="sidebar-footer-link logout-link"
            title="Sign out of Admin Session"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
