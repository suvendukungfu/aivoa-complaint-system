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

  const navGroups: {
    title: string;
    items: { id: WorkspaceView; label: string; icon: React.ReactNode; badge?: number }[];
  }[] = [
    {
      title: 'WORKSPACE',
      items: [
        { id: 'OVERVIEW', label: 'Overview', icon: <LayoutDashboard size={15} /> },
        { id: 'INTAKE', label: 'Complaints', icon: <FileText size={15} /> },
        { id: 'REVIEW', label: 'Review Queue', icon: <CheckSquare size={15} />, badge: pendingReviewCount }
      ]
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { id: 'DOCUMENTS', label: 'Documents', icon: <FileCode2 size={15} /> },
        { id: 'ANALYTICS', label: 'Analytics', icon: <BarChart3 size={15} /> }
      ]
    },
    {
      title: 'GOVERNANCE',
      items: [
        { id: 'TIMELINE', label: 'Audit Trail', icon: <History size={15} /> },
        { id: 'SYSTEM_HEALTH', label: 'System Health', icon: <Activity size={15} /> }
      ]
    }
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
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(8, 9, 9, 0.75)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 45
          }}
        />
      )}

      <aside
        className={`sidebar-container ${isOpen ? 'open' : ''}`}
        style={{
          width: '240px',
          height: '100vh',
          backgroundColor: 'rgba(255, 255, 255, 0.025)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          zIndex: 46
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div
            onClick={() => handleItemClick('LANDING')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer'
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: '#FFFFFF',
                color: '#080909',
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
            <div>
              <div
                style={{
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2
                }}
              >
                AIVOA
              </div>
              <div
                style={{
                  fontSize: 9.5,
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.45)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase'
                }}
              >
                Quality Intelligence
              </div>
            </div>
          </div>

          {isOpen && (
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.60)',
                cursor: 'pointer',
                padding: 4
              }}
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation Section */}
        <div
          style={{
            flex: 1,
            padding: '16px 12px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 20
          }}
        >
          {navGroups.map((group) => (
            <div key={group.title}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.35)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  padding: '0 8px 6px'
                }}
              >
                {group.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {group.items.map((item) => {
                  const isActive = activeWorkspace === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      style={{
                        height: '38px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 10px',
                        backgroundColor: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                        color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.55)',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        position: 'relative',
                        transition: 'all 140ms cubic-bezier(0.16, 1, 0.3, 1)',
                        fontWeight: isActive ? 600 : 500,
                        fontSize: '13px'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)';
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.035)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.55)';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {isActive && (
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: '8px',
                            bottom: '8px',
                            width: '2px',
                            backgroundColor: '#FFFFFF',
                            borderRadius: '0 2px 2px 0'
                          }}
                        />
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ color: isActive ? '#FFFFFF' : 'inherit' }}>{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '9999px',
                            backgroundColor: isActive ? 'rgba(255, 255, 255, 0.20)' : 'rgba(255, 255, 255, 0.08)',
                            color: '#FFFFFF'
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '12px 14px',
            borderTop: '1px solid rgba(255, 255, 255, 0.07)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8
          }}
        >
          <button
            onClick={handleResetDemo}
            style={{
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: 'rgba(255, 255, 255, 0.65)',
              fontSize: '11.5px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              cursor: 'pointer',
              transition: 'all 140ms ease-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.07)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.65)';
            }}
          >
            <RotateCcw size={12} />
            <span>Reset Demo State</span>
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 6px',
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.35)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Command size={11} />
              <span>K for search</span>
            </div>
            <span>v2.4.0</span>
          </div>
        </div>
      </aside>
    </>
  );
};
