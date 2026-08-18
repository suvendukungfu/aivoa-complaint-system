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
  Command
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
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeWorkspace,
  onSelectWorkspace,
  pendingReviewCount = 3
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

  return (
    <aside style={{
      width: '230px',
      backgroundColor: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      flexShrink: 0,
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

        <div style={{
          fontSize: 10,
          fontWeight: 600,
          color: 'var(--success-text)',
          backgroundColor: 'var(--success-subtle)',
          border: '1px solid var(--success-border)',
          borderRadius: 'var(--radius-xs)',
          padding: '1px 5px'
        }}>
          GxP
        </div>
      </div>

      {/* Primary Navigation Items */}
      <div style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
        <div style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          padding: '4px 10px 8px'
        }}>
          Workspaces
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map((item) => {
            const isActive = activeWorkspace === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectWorkspace(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  backgroundColor: isActive ? 'var(--bg-surface)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: 12.5,
                  cursor: 'pointer',
                  boxShadow: isActive ? 'var(--shadow-subtle)' : 'none',
                  transition: 'background-color var(--transition-fast)'
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
                    backgroundColor: isActive ? 'var(--primary-subtle)' : 'var(--bg-subtle)',
                    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                    borderRadius: 10,
                    padding: '1px 6px',
                    fontVariantNumeric: 'tabular-nums'
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* System & Secondary Navigation */}
        <div style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          padding: '18px 10px 8px'
        }}>
          System
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <button
            onClick={() => onSelectWorkspace('SYSTEM_HEALTH')}
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              padding: '7px 10px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: activeWorkspace === 'SYSTEM_HEALTH' ? 'var(--bg-surface)' : 'transparent',
              color: activeWorkspace === 'SYSTEM_HEALTH' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: activeWorkspace === 'SYSTEM_HEALTH' ? 600 : 500,
              fontSize: 12.5,
              cursor: 'pointer',
              boxShadow: activeWorkspace === 'SYSTEM_HEALTH' ? 'var(--shadow-subtle)' : 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ color: activeWorkspace === 'SYSTEM_HEALTH' ? 'var(--primary)' : 'var(--text-muted)' }}>
                <Activity size={15} />
              </span>
              <span>System Health</span>
            </div>
          </button>

          <button
            onClick={handleResetDemo}
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              padding: '7px 10px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              fontWeight: 500,
              fontSize: 12.5,
              cursor: 'pointer',
              transition: 'background-color var(--transition-fast)'
            }}
            title="Reset active complaint and copilot draft"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <RotateCcw size={14} style={{ color: 'var(--text-muted)' }} />
              <span>Reset Context</span>
            </div>
          </button>
        </div>
      </div>

      {/* Footer User Info & Shortcut */}
      <div style={{
        padding: '12px 14px',
        borderTop: '1px solid var(--border)',
        backgroundColor: 'var(--bg-surface)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              backgroundColor: '#EFF6FF',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 600
            }}>
              QP
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                Elena Vance
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.2 }}>
                Qualified Person
              </div>
            </div>
          </div>
          <ShieldCheck size={14} style={{ color: 'var(--success)' }} />
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 10.5,
          color: 'var(--text-muted)',
          paddingTop: 6,
          borderTop: '1px solid var(--bg-subtle)'
        }}>
          <span>Command Bar</span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xs)',
            padding: '1px 4px',
            fontFamily: 'var(--font-mono)'
          }}>
            <Command size={9} />K
          </span>
        </div>
      </div>
    </aside>
  );
};
