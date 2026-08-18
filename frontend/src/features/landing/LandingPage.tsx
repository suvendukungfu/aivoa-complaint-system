import React, { useState } from 'react';
import { CinematicBackground } from './CinematicBackground';
import { LandingNav } from './LandingNav';
import { Typewriter } from './Typewriter';
import { LandingActions } from './LandingActions';
import type { WorkspaceView } from '../../App';

interface LandingPageProps {
  onEnterWorkspace: (targetView?: WorkspaceView) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterWorkspace }) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleNavigate = (view: WorkspaceView) => {
    setIsExiting(true);
    setTimeout(() => {
      onEnterWorkspace(view);
    }, 300);
  };

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: '#080B10',
        color: '#FFFFFF',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        opacity: isExiting ? 0 : 1,
        transition: 'opacity 300ms cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Background Canvas */}
      <CinematicBackground />

      {/* Minimal Top Navigation */}
      <LandingNav onNavigate={handleNavigate} />

      {/* Main Hero Container */}
      <main
        style={{
          position: 'relative',
          zIndex: 10,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '120px 32px 60px',
          maxWidth: '1280px',
          margin: '0 auto',
          width: '100%'
        }}
      >
        {/* Subtle Operational Status Pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '4px 12px',
          borderRadius: '9999px',
          marginBottom: 24,
          alignSelf: 'flex-start',
          backdropFilter: 'blur(8px)'
        }}>
          <span className="pulse-dot" style={{ backgroundColor: '#10B981', width: 6, height: 6 }} />
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.8)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase'
          }}>
            AI System Ready · 21 CFR Part 11 Active
          </span>
        </div>

        {/* Primary Typewriter Heading */}
        <h1
          style={{
            fontSize: 'clamp(38px, 6vw, 76px)',
            fontWeight: 600,
            lineHeight: 1.02,
            letterSpacing: '-0.035em',
            color: '#FFFFFF',
            maxWidth: '820px',
            margin: '0 0 20px',
            minHeight: '1.2em'
          }}
        >
          <Typewriter
            text="Quality decisions, grounded in evidence."
            speed={38}
            startDelay={400}
          />
        </h1>

        {/* Secondary Supporting Copy */}
        <p
          style={{
            fontSize: 'clamp(16px, 1.8vw, 19px)',
            lineHeight: 1.5,
            color: 'rgba(255, 255, 255, 0.65)',
            maxWidth: '580px',
            margin: '0 0 12px',
            fontWeight: 400
          }}
        >
          AIVOA turns unstructured pharmaceutical complaints into structured, reviewable quality workflows.
        </p>

        {/* Third Level Principle Copy */}
        <p
          style={{
            fontSize: '13.5px',
            color: 'rgba(255, 255, 255, 0.45)',
            letterSpacing: '0.02em',
            margin: 0,
            fontWeight: 500
          }}
        >
          AI-assisted · Evidence-grounded · Human-controlled
        </p>

        {/* Action Controls */}
        <LandingActions onNavigate={handleNavigate} />
      </main>

      {/* Footer Trust Strip & Technical Metadata */}
      <footer
        style={{
          position: 'relative',
          zIndex: 10,
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          padding: '18px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          backgroundColor: 'rgba(8, 11, 16, 0.5)',
          backdropFilter: 'blur(8px)'
        }}
      >
        {/* Trust Strip */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontSize: 12,
          color: 'rgba(255, 255, 255, 0.55)',
          fontWeight: 500
        }}>
          <span>Evidence grounded</span>
          <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>·</span>
          <span>Human reviewed</span>
          <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>·</span>
          <span>Auditable workflow</span>
        </div>

        {/* Technical Product Metadata */}
        <div style={{
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          color: 'rgba(255, 255, 255, 0.4)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase'
        }}>
          AIVOA / QUALITY INTELLIGENCE · VERSION 1.0 · WORKSPACE READY
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
