import React, { useState } from 'react';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import type { WorkspaceView } from '../../App';

interface LandingNavProps {
  onNavigate: (view: WorkspaceView) => void;
}

export const LandingNav: React.FC<LandingNavProps> = ({ onNavigate }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header style={{
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
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)'
    }}>
      {/* Left: Brand Identity */}
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
          <div style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            background: 'linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: 12,
            letterSpacing: '-0.03em'
          }}>
            A
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
              AIVOA
            </span>
            <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255, 255, 255, 0.45)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Quality Intelligence
            </span>
          </div>
        </button>
      </div>

      {/* Center/Right Desktop Navigation */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 28 }} className="landing-desktop-nav">
        <button
          onClick={() => onNavigate('OVERVIEW')}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'color 140ms ease-out'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)')}
        >
          Overview
        </button>

        <button
          onClick={() => onNavigate('INTAKE')}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'color 140ms ease-out'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)')}
        >
          Complaints
        </button>

        <button
          onClick={() => onNavigate('REVIEW')}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'color 140ms ease-out'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)')}
        >
          Review Queue
        </button>

        {/* Action Button */}
        <button
          onClick={() => onNavigate('OVERVIEW')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            backgroundColor: '#FFFFFF',
            color: '#080B10',
            border: 'none',
            borderRadius: 6,
            fontSize: 12.5,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 140ms ease-out',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#FFFFFF';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <span>Open Workspace</span>
          <ArrowUpRight size={13} />
        </button>
      </nav>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="landing-mobile-btn"
        style={{
          display: 'none',
          background: 'none',
          border: 'none',
          color: '#FFFFFF',
          cursor: 'pointer',
          padding: 6
        }}
        aria-label="Toggle navigation menu"
      >
        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Drawer Dropdown */}
      {isMobileMenuOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: '#0A0E14',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
        }}>
          <button
            onClick={() => { onNavigate('OVERVIEW'); setIsMobileMenuOpen(false); }}
            style={{
              background: 'none',
              border: 'none',
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 500,
              textAlign: 'left',
              padding: '6px 0',
              cursor: 'pointer'
            }}
          >
            Overview
          </button>
          <button
            onClick={() => { onNavigate('INTAKE'); setIsMobileMenuOpen(false); }}
            style={{
              background: 'none',
              border: 'none',
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 500,
              textAlign: 'left',
              padding: '6px 0',
              cursor: 'pointer'
            }}
          >
            Complaints Intake
          </button>
          <button
            onClick={() => { onNavigate('REVIEW'); setIsMobileMenuOpen(false); }}
            style={{
              background: 'none',
              border: 'none',
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 500,
              textAlign: 'left',
              padding: '6px 0',
              cursor: 'pointer'
            }}
          >
            Review Queue
          </button>
          <button
            onClick={() => { onNavigate('OVERVIEW'); setIsMobileMenuOpen(false); }}
            style={{
              marginTop: 6,
              padding: '10px 16px',
              backgroundColor: '#FFFFFF',
              color: '#080B10',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            <span>Open Workspace</span>
            <ArrowUpRight size={14} />
          </button>
        </div>
      )}
    </header>
  );
};

export default LandingNav;
