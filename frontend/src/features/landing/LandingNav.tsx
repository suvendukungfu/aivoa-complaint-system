import React, { useState } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';
import type { WorkspaceView } from '../../App';

interface LandingNavProps {
  onNavigate: (view: WorkspaceView) => void;
}

export const LandingNav: React.FC<LandingNavProps> = ({ onNavigate }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '64px',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        backgroundColor: 'rgba(8, 11, 16, 0.65)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)'
      }}
    >
      {/* Left: AIVOA Brand Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => onNavigate('OVERVIEW')}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#FFFFFF'
          }}
          aria-label="AIVOA Home"
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: '#FFFFFF',
              color: '#080B10',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 12,
              letterSpacing: '-0.03em'
            }}
          >
            A
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
              AIVOA
            </span>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.50)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase'
              }}
            >
              Quality Intelligence
            </span>
          </div>
        </button>
      </div>

      {/* Right Desktop Navigation: Product | Workflow | Evidence | Open Workspace */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 24 }} className="landing-desktop-nav">
        <button
          onClick={() => onNavigate('OVERVIEW')}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.70)',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'color 140ms ease-out'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.70)')}
        >
          Product
        </button>

        <button
          onClick={() => onNavigate('INTAKE')}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.70)',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'color 140ms ease-out'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.70)')}
        >
          Workflow
        </button>

        <button
          onClick={() => onNavigate('DOCUMENTS')}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.70)',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'color 140ms ease-out'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.70)')}
        >
          Evidence
        </button>

        {/* Liquid Glass Pill Button */}
        <button
          onClick={() => onNavigate('OVERVIEW')}
          className="landing-cta-pill"
          style={{
            padding: '6px 14px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            color: '#FFFFFF',
            fontSize: 12.5,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.15)'
          }}
        >
          <span>Open Workspace</span>
          <ArrowRight size={13} style={{ color: 'rgba(255, 255, 255, 0.85)' }} />
        </button>
      </nav>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="landing-mobile-btn"
        style={{
          display: 'none',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 6,
          padding: '6px 10px',
          color: '#FFFFFF',
          cursor: 'pointer'
        }}
        aria-label="Toggle navigation menu"
      >
        {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: '64px',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(8, 11, 16, 0.96)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            zIndex: 49,
            display: 'flex',
            flexDirection: 'column',
            padding: '24px 32px',
            gap: 16
          }}
        >
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onNavigate('OVERVIEW');
            }}
            style={{
              padding: '12px 0',
              textAlign: 'left',
              background: 'none',
              border: 'none',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#FFFFFF',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Product
          </button>
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onNavigate('INTAKE');
            }}
            style={{
              padding: '12px 0',
              textAlign: 'left',
              background: 'none',
              border: 'none',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#FFFFFF',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Workflow
          </button>
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onNavigate('DOCUMENTS');
            }}
            style={{
              padding: '12px 0',
              textAlign: 'left',
              background: 'none',
              border: 'none',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#FFFFFF',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Evidence
          </button>
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onNavigate('OVERVIEW');
            }}
            style={{
              marginTop: 16,
              padding: '12px 16px',
              backgroundColor: '#FFFFFF',
              color: '#080B10',
              borderRadius: 8,
              border: 'none',
              fontSize: 14,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer'
            }}
          >
            <span>Open Workspace</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </header>
  );
};
