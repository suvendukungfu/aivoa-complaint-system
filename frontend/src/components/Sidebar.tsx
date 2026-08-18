import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  FileCode2,
  BarChart3,
  History,
  Activity,
  RotateCcw,
  Command,
  X
} from 'lucide-react';
import type { WorkspaceView } from '../App';
import { useAppDispatch } from '../store';
import { resetComplaint } from '../store/complaintSlice';
import { resetAI } from '../store/aiSlice';
import { resetDocument } from '../store/documentSlice';
import { setToast } from '../store/uiSlice';

interface SidebarProps {
  activeWorkspace: WorkspaceView;
  onSelectWorkspace: (view: WorkspaceView) => void;
  pendingReviewCount?: number;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeWorkspace,
  onSelectWorkspace,
  pendingReviewCount = 3,
  isOpen = false,
  onClose
}) => {
  const dispatch = useAppDispatch();

  const handleResetDemo = () => {
    dispatch(resetComplaint());
    dispatch(resetAI());
    dispatch(resetDocument());
    dispatch(setToast({ type: 'info', message: 'Workspace & Copilot context reset.' }));
  };

  const navItems: { id: WorkspaceView; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'OVERVIEW', label: 'Overview', icon: <LayoutDashboard size={16} /> },
    { id: 'INTAKE', label: 'Complaints Intake', icon: <FileText size={16} /> },
    { id: 'REVIEW', label: 'Review Queue', icon: <CheckSquare size={16} />, badge: pendingReviewCount },
    { id: 'DOCUMENTS', label: 'Evidence Docs', icon: <FileCode2 size={16} /> },
    { id: 'ANALYTICS', label: 'QMS Analytics', icon: <BarChart3 size={16} /> },
    { id: 'TIMELINE', label: '21 CFR Audit', icon: <History size={16} /> }
  ];

  const handleItemClick = (id: WorkspaceView) => {
    onSelectWorkspace(id);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar-container ${isOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div style={{
          padding: '20px 18px 18px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 15,
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.35)',
              letterSpacing: '-0.03em'
            }}>
              A
            </div>
            <div>
              <div style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <span>AIVOA</span>
                <span style={{
                  fontSize: 9,
                  fontWeight: 600,
                  backgroundColor: 'rgba(99, 102, 241, 0.2)',
                  color: '#A5B4FC',
                  padding: '1px 5px',
                  borderRadius: 4,
                  border: '1px solid rgba(165, 180, 252, 0.3)'
                }}>
                  GxP
                </span>
              </div>
              <div style={{
                fontSize: 11,
                color: '#94A3B8',
                lineHeight: 1.2,
                marginTop: 2
              }}>
                Pharma QMS Intelligence
              </div>
            </div>
          </div>

          {/* Close button for mobile drawer */}
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: 4
              }}
              className="mobile-close-btn"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav style={{
          flex: 1,
          padding: '16px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          overflowY: 'auto'
        }}>
          <div style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#64748B',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            padding: '4px 10px 8px'
          }}>
            Operations
          </div>

          {navItems.map((item) => {
            const isActive = activeWorkspace === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  backgroundColor: isActive ? 'rgba(79, 70, 229, 0.16)' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#94A3B8',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: 13,
                  border: isActive ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 160ms ease-out',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = '#F8FAFC';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#94A3B8';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    color: isActive ? '#818CF8' : '#64748B',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: 9999,
                    backgroundColor: isActive ? '#4F46E5' : 'rgba(245, 158, 11, 0.2)',
                    color: isActive ? '#FFFFFF' : '#FBBF24',
                    border: isActive ? 'none' : '1px solid rgba(245, 158, 11, 0.35)',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#64748B',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            padding: '16px 10px 8px'
          }}>
            Diagnostics
          </div>

          <button
            onClick={() => handleItemClick('SYSTEM_HEALTH')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              padding: '9px 12px',
              borderRadius: 8,
              backgroundColor: activeWorkspace === 'SYSTEM_HEALTH' ? 'rgba(79, 70, 229, 0.16)' : 'transparent',
              color: activeWorkspace === 'SYSTEM_HEALTH' ? '#FFFFFF' : '#94A3B8',
              fontWeight: activeWorkspace === 'SYSTEM_HEALTH' ? 600 : 500,
              fontSize: 13,
              border: activeWorkspace === 'SYSTEM_HEALTH' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 160ms ease-out'
            }}
          >
            <Activity size={16} style={{ color: activeWorkspace === 'SYSTEM_HEALTH' ? '#818CF8' : '#64748B' }} />
            <span>Health & Telemetry</span>
          </button>
        </nav>

        {/* Footer Tenant & Actions */}
        <div style={{
          padding: '16px 14px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          {/* Qualified Person Card */}
          <div style={{
            padding: '10px 12px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              backgroundColor: '#1E293B',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
              color: '#818CF8'
            }}>
              MV
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#F8FAFC',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}>
                <span>Dr. Marcus Vance</span>
                <span className="pulse-dot" style={{ backgroundColor: '#10B981', width: 6, height: 6 }} />
              </div>
              <div style={{ fontSize: 10.5, color: '#94A3B8' }}>
                Lead Qualified Person (QP)
              </div>
            </div>
          </div>

          {/* Quick Context Reset & Command bar hint */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={handleResetDemo}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 11.5,
                color: '#94A3B8',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '3px 6px',
                borderRadius: 4,
                transition: 'color 140ms ease-out'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#F8FAFC')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
              title="Reset current complaint draft session"
            >
              <RotateCcw size={12} />
              <span>Reset Context</span>
            </button>

            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              fontSize: 10.5,
              fontFamily: 'var(--font-mono)',
              color: '#94A3B8',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              padding: '2px 6px',
              borderRadius: 4,
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <Command size={10} />K
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
