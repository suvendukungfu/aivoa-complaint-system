import React from 'react';
import { ArrowRight, CheckSquare, FileText } from 'lucide-react';
import type { WorkspaceView } from '../../App';

interface LandingActionsProps {
  onNavigate: (view: WorkspaceView) => void;
}

export const LandingActions: React.FC<LandingActionsProps> = ({ onNavigate }) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      flexWrap: 'wrap',
      marginTop: 28
    }}>
      {/* Primary Action */}
      <button
        onClick={() => onNavigate('OVERVIEW')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 24px',
          backgroundColor: '#FFFFFF',
          color: '#080B10',
          border: 'none',
          borderRadius: '9999px',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 160ms ease-out',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.92)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#FFFFFF';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <span>Open Workspace</span>
        <ArrowRight size={15} />
      </button>

      {/* Secondary Action */}
      <button
        onClick={() => onNavigate('REVIEW')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 22px',
          backgroundColor: 'transparent',
          color: 'rgba(255, 255, 255, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          borderRadius: '9999px',
          fontSize: 14,
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all 160ms ease-out'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.35)';
          e.currentTarget.style.color = '#FFFFFF';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)';
        }}
      >
        <CheckSquare size={15} style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
        <span>Explore Review Queue</span>
      </button>

      {/* Tertiary Action */}
      <button
        onClick={() => onNavigate('DOCUMENTS')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '12px 16px',
          backgroundColor: 'transparent',
          color: 'rgba(255, 255, 255, 0.6)',
          border: 'none',
          fontSize: 13.5,
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'color 140ms ease-out'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)')}
      >
        <FileText size={14} />
        <span>Evidence Workflow</span>
      </button>
    </div>
  );
};

export default LandingActions;
