import React from 'react';
import { ArrowRight, CheckSquare, FileText, History } from 'lucide-react';
import type { WorkspaceView } from '../../App';

interface LandingActionsProps {
  onNavigate: (view: WorkspaceView) => void;
}

export const LandingActions: React.FC<LandingActionsProps> = ({ onNavigate }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        flexWrap: 'wrap',
        marginTop: 32
      }}
    >
      {/* Primary Action — Dominant Liquid Glass Strong Pill */}
      <button
        onClick={() => onNavigate('OVERVIEW')}
        className="landing-cta-pill"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 24px',
          backgroundColor: '#FFFFFF',
          color: '#080B10',
          border: 'none',
          borderRadius: '9999px',
          fontSize: 14.5,
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(255, 255, 255, 0.15)'
        }}
      >
        <span>Open Workspace</span>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            backgroundColor: '#080B10',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <ArrowRight size={13} />
        </div>
      </button>

      {/* Secondary Action 1: View Review Queue */}
      <button
        onClick={() => onNavigate('REVIEW')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 18px',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          color: 'rgba(255, 255, 255, 0.80)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '9999px',
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          transition: 'all 180ms ease-out'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
          e.currentTarget.style.color = '#FFFFFF';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.80)';
        }}
      >
        <CheckSquare size={14} style={{ color: 'rgba(255, 255, 255, 0.60)' }} />
        <span>View Review Queue</span>
      </button>

      {/* Secondary Action 2: Explore Evidence */}
      <button
        onClick={() => onNavigate('DOCUMENTS')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 18px',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          color: 'rgba(255, 255, 255, 0.80)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '9999px',
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          transition: 'all 180ms ease-out'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
          e.currentTarget.style.color = '#FFFFFF';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.80)';
        }}
      >
        <FileText size={14} style={{ color: 'rgba(255, 255, 255, 0.60)' }} />
        <span>Explore Evidence</span>
      </button>

      {/* Secondary Action 3: See Audit Trail */}
      <button
        onClick={() => onNavigate('TIMELINE')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 18px',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          color: 'rgba(255, 255, 255, 0.80)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '9999px',
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          transition: 'all 180ms ease-out'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
          e.currentTarget.style.color = '#FFFFFF';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.80)';
        }}
      >
        <History size={14} style={{ color: 'rgba(255, 255, 255, 0.60)' }} />
        <span>See Audit Trail</span>
      </button>
    </div>
  );
};
