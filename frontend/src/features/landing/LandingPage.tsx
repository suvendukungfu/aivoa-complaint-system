import React, { useState, useEffect, useRef } from 'react';
import { CinematicBackground } from './CinematicBackground';
import { LandingNav } from './LandingNav';
import { Typewriter } from './Typewriter';
import { LandingActions } from './LandingActions';
import { GlassPanel } from './GlassPanel';
import type { WorkspaceView } from '../../App';
import { ArrowRight, FileCheck2, Activity } from 'lucide-react';

interface LandingPageProps {
  onEnterWorkspace: (targetView?: WorkspaceView) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterWorkspace }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const mouseTargetRef = useRef({ x: 0, y: 0 });

  const handleNavigate = (view: WorkspaceView) => {
    setIsExiting(true);
    setTimeout(() => {
      onEnterWorkspace(view);
    }, 300);
  };

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) return;

    let animId: number;

    const handleMouseMove = (e: MouseEvent) => {
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = (e.clientY / window.innerHeight) * 2 - 1;
      mouseTargetRef.current = { x: normX, y: normY };
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    let currentX = 0;
    let currentY = 0;

    const loop = () => {
      currentX += (mouseTargetRef.current.x - currentX) * 0.05;
      currentY += (mouseTargetRef.current.y - currentY) * 0.05;
      setMouseOffset({ x: currentX * 8, y: currentY * 8 });
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

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
          padding: '110px 32px 40px',
          maxWidth: '1280px',
          margin: '0 auto',
          width: '100%'
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 40,
            alignItems: 'center'
          }}
        >
          {/* Left Column: Hero Typography & CTA */}
          <div style={{ maxWidth: '640px' }}>
            {/* Small Metadata Header */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.10)',
                padding: '4px 12px',
                borderRadius: '9999px',
                marginBottom: 20,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)'
              }}
            >
              <span className="pulse-dot" style={{ backgroundColor: '#10B981', width: 6, height: 6 }} />
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.75)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase'
                }}
              >
                Quality Intelligence Platform
              </span>
            </div>

            {/* Main Heading */}
            <h1
              style={{
                fontSize: 'clamp(38px, 5.5vw, 68px)',
                fontWeight: 600,
                lineHeight: 1.02,
                letterSpacing: '-0.04em',
                color: '#FFFFFF',
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

            {/* Supporting Copy */}
            <p
              style={{
                fontSize: 'clamp(15px, 1.6vw, 18px)',
                lineHeight: 1.5,
                color: 'rgba(255, 255, 255, 0.70)',
                maxWidth: '560px',
                margin: '0 0 8px',
                fontWeight: 400
              }}
            >
              Turn unstructured pharmaceutical complaints into structured, evidence-grounded quality workflows.
            </p>

            {/* Action Buttons */}
            <LandingActions onNavigate={handleNavigate} />
          </div>

          {/* Right Column: Floating Realistic Product Panel & System Status */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              transform: `translate(${mouseOffset.x}px, ${mouseOffset.y}px)`,
              transition: 'transform 100ms ease-out'
            }}
          >
            {/* Floating Product Panel (Realistic Complaint Record) */}
            <GlassPanel
              variant="strong"
              style={{
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                maxWidth: '460px',
                alignSelf: 'flex-end',
                width: '100%'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 4,
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      fontSize: 11,
                      fontWeight: 700
                    }}
                  >
                    <FileCheck2 size={13} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.02em', color: '#FFFFFF' }}>
                    CMP-2026-0001
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 4,
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    color: '#FBBF24',
                    border: '1px solid rgba(245, 158, 11, 0.3)'
                  }}
                >
                  HIGH · Urgent
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
                <div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Product
                  </div>
                  <div style={{ color: '#FFFFFF', fontWeight: 600, marginTop: 2 }}>Paracetamol API 99.5%</div>
                </div>
                <div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Batch / Lot
                  </div>
                  <div style={{ color: '#FFFFFF', fontWeight: 600, marginTop: 2, fontFamily: 'var(--font-mono)' }}>PA240812</div>
                </div>
                <div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Affected Qty
                  </div>
                  <div style={{ color: '#FFFFFF', fontWeight: 600, marginTop: 2 }}>25 kg affected</div>
                </div>
                <div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Evidence Grounding
                  </div>
                  <div style={{ color: '#6EE7B7', fontWeight: 600, marginTop: 2 }}>4 traceable references</div>
                </div>
              </div>

              <div
                style={{
                  paddingTop: 10,
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 11.5
                }}
              >
                <span style={{ color: 'rgba(255, 255, 255, 0.60)' }}>AI Proposal: Quality Review</span>
                <button
                  onClick={() => handleNavigate('REVIEW')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: 0
                  }}
                >
                  <span>Inspect</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </GlassPanel>

            {/* Product Status Panel */}
            <GlassPanel
              variant="light"
              style={{
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                maxWidth: '460px',
                alignSelf: 'flex-end',
                width: '100%',
                fontSize: 11.5,
                color: 'rgba(255, 255, 255, 0.70)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Activity size={13} style={{ color: '#10B981' }} />
                <span style={{ fontWeight: 600, color: '#FFFFFF' }}>SYSTEM STATUS:</span>
                <span style={{ color: '#10B981' }}>Operational</span>
              </div>
              <div style={{ display: 'flex', gap: 12, color: 'rgba(255, 255, 255, 0.50)' }}>
                <span>AI: Available</span>
                <span>•</span>
                <span>Evidence: Grounded</span>
                <span>•</span>
                <span>HITL: Active</span>
              </div>
            </GlassPanel>
          </div>
        </div>

        {/* Floating Product GxP Pipeline */}
        <div style={{ marginTop: 48 }}>
          <GlassPanel
            variant="light"
            style={{
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              flexWrap: 'wrap',
              gap: 12,
              borderRadius: '9999px',
              maxWidth: '900px',
              margin: '0 auto'
            }}
          >
            {['Complaint', 'AI Extraction', 'Evidence', 'Risk', 'Human Review', 'Audit'].map((step, idx, arr) => (
              <React.Fragment key={step}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      color: 'rgba(255, 255, 255, 0.75)',
                      fontSize: 9.5,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255, 255, 255, 0.85)' }}>
                    {step}
                  </span>
                </div>
                {idx < arr.length - 1 && (
                  <span style={{ color: 'rgba(255, 255, 255, 0.25)', fontSize: 12 }}>→</span>
                )}
              </React.Fragment>
            ))}
          </GlassPanel>
        </div>
      </main>

      {/* Floating Glass Feature Strip Footer */}
      <footer
        style={{
          position: 'relative',
          zIndex: 10,
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          padding: '16px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          backgroundColor: 'rgba(8, 11, 16, 0.6)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)'
        }}
      >
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {['EVIDENCE GROUNDED', 'HUMAN REVIEWED', 'AUDITABLE', 'AI ASSISTED'].map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.45)',
                letterSpacing: '0.1em'
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.40)' }}>
          AIVOA · Pharmaceutical Quality Management System
        </div>
      </footer>
    </div>
  );
};
