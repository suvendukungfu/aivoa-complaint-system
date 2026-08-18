import React from 'react';
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  FileCode2,
  BarChart3,
  History,
  Activity,
  RotateCcw,
  ShieldCheck,
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
    { id: 'OVERVIEW', label: 'Overview', icon: <LayoutDashboard size={15} /> },
    { id: 'INTAKE', label: 'Complaints', icon: <FileText size={15} /> },
    { id: 'REVIEW', label: 'Review Queue', icon: <CheckSquare size={15} />, badge: pendingReviewCount },
    { id: 'DOCUMENTS', label: 'Documents', icon: <FileCode2 size={15} /> },
    { id: 'ANALYTICS', label: 'Analytics', icon: <BarChart3 size={15} /> },
    { id: 'TIMELINE', label: 'Audit Trail', icon: <History size={15} /> }
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

      <aside className={`sidebar-container ${isOpen ? 'open' : ''}`} style={{
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none'
      }}>
        {/* Brand & Workspace Identity */}
        <div style={{
          padding: '16px 18px 14px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 22,
              height: 22,
              borderRadius: 4,
              backgroundColor: 'var(--text-primary)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: '-0.02em'
            }}>
              A
            </div>
            <div>
              <div style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
                lineHeight: 1.2
              }}>
                AIVOA
              </div>
              <div style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                lineHeight: 1.2
              }}>
                Quality Operations
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
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'none'
              }}
              className="mobile-close-btn"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Navigation Item List */}
        <nav style={{
          flex: 1,
          padding: '12px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          overflowY: 'auto'
        }}>
          <div style={{
            fontSize: 10,
            fontWeight: 600,
            color: 'var(--text-muted)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            padding: '4px 8px 6px'
          }}>
            Workspace
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
                  padding: '7px 10px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isActive ? 'var(--bg-subtle)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 450,
                  fontSize: 12.5,
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color var(--transition-fast), color var(--transition-fast)'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ color: isActive ? 'var(--primary)' : 'var(--text-muted)' }}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span style={{
                    fontSize: 10.5,
                    fontWeight: 600,
                    padding: '1px 5px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: isActive ? 'var(--primary)' : 'var(--border-strong)',
                    color: isActive ? '#FFFFFF' : 'var(--text-primary)',
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
            fontWeight: 600,
            color: 'var(--text-muted)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            padding: '14px 8px 6px'
          }}>
            Infrastructure
          </div>

          <button
            onClick={() => handleItemClick('SYSTEM_HEALTH')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              width: '100%',
              padding: '7px 10px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: activeWorkspace === 'SYSTEM_HEALTH' ? 'var(--bg-subtle)' : 'transparent',
              color: activeWorkspace === 'SYSTEM_HEALTH' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: activeWorkspace === 'SYSTEM_HEALTH' ? 600 : 450,
              fontSize: 12.5,
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background-color var(--transition-fast)'
            }}
          >
            <Activity size={15} style={{ color: activeWorkspace === 'SYSTEM_HEALTH' ? 'var(--primary)' : 'var(--text-muted)' }} />
            <span>Diagnostics</span>
          </button>
        </nav>

        {/* Footer Tenant & Utility */}
        <div style={{
          padding: '12px 14px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}>
          {/* Active Tenant / QP Badge */}
          <div style={{
            padding: '8px 10px',
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <ShieldCheck size={14} style={{ color: 'var(--success)', flexShrink: 0 }} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Dr. Marcus Vance, QP
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                Qualified Person · GxP
              </div>
            </div>
          </div>

          {/* Reset Demo / Re-seed action */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={handleResetDemo}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 11,
                color: 'var(--text-muted)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px 4px',
                borderRadius: 'var(--radius-xs)'
              }}
              title="Reset current complaint draft session"
            >
              <RotateCcw size={11} />
              <span>Reset Context</span>
            </button>

            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)'
            }}>
              <Command size={9} />K
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
