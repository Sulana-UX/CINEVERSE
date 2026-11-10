import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default class TabErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Tab render error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="admin-tab-error-state"
          style={{
            background: '#131316',
            border: '1px solid rgba(239, 68, 68, 0.34)',
            borderRadius: '16px',
            padding: '3rem 2rem',
            textAlign: 'center',
            maxWidth: '540px',
            margin: '2rem auto',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.08)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#F87171',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}
          >
            <AlertTriangle size={26} />
          </div>
          <h3
            style={{
              margin: '0 0 0.5rem',
              color: '#F5F1E8',
              fontSize: '1.15rem',
              fontWeight: 700,
            }}
          >
            Unable to display {this.props.tabName || 'this section'}
          </h3>
          <p
            style={{
              margin: '0 0 1.25rem',
              color: '#9A958B',
              fontSize: '0.85rem',
              lineHeight: 1.5,
            }}
          >
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            style={{
              background: '#D4AF37',
              color: '#141110',
              border: 'none',
              borderRadius: '8px',
              padding: '0.6rem 1.25rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <RotateCcw size={14} />
            <span>Reload Tab</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
