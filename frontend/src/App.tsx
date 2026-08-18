import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './store';
import { clearToast, setSelectedFieldForEvidence } from './store/uiSlice';
import { setAnalyticsOpen } from './store/aiSlice';
import { setComplaintData, resetComplaint } from './store/complaintSlice';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OverviewDashboard } from './features/overview/OverviewDashboard';
import { ComplaintForm } from './features/complaint/ComplaintForm';
import { CopilotPanel } from './features/copilot/CopilotPanel';
import { QualityReviewWorkspace } from './features/review/QualityReviewWorkspace';
import { DocumentsView } from './features/documents/DocumentsView';
import { AnalyticsDashboard } from './features/analytics/AnalyticsDashboard';
import { SystemHealthView } from './features/system/SystemHealthView';
import { AuditTimeline } from './features/review/AuditTimeline';
import { SavedComplaintsModal } from './features/complaint/SavedComplaintsModal';
import { AnalyticsModal } from './features/analytics/AnalyticsModal';
import { DocumentEvidenceViewer } from './components/DocumentEvidenceViewer';
import { CommandBar } from './components/CommandBar';
import {
  CheckCircle2,
  AlertCircle,
  Info,
  X
} from 'lucide-react';
import type { ComplaintData } from './types';

export type WorkspaceView = 'OVERVIEW' | 'INTAKE' | 'REVIEW' | 'DOCUMENTS' | 'ANALYTICS' | 'TIMELINE' | 'SYSTEM_HEALTH';

export const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const toast = useAppSelector((state) => state.ui.toast);
  const isAnalyticsOpen = useAppSelector((state) => state.ai.isAnalyticsOpen);
  const complaintData = useAppSelector((state) => state.complaint.data);
  const selectedEvidence = useAppSelector((state) => state.ui.selectedFieldForEvidence);

  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceView>(() => {
    const hash = window.location.hash.toLowerCase().replace('#', '');
    if (hash === 'complaints' || hash === 'intake') return 'INTAKE';
    if (hash === 'review') return 'REVIEW';
    if (hash === 'documents') return 'DOCUMENTS';
    if (hash === 'analytics') return 'ANALYTICS';
    if (hash === 'timeline' || hash === 'audit') return 'TIMELINE';
    if (hash === 'system' || hash === 'health') return 'SYSTEM_HEALTH';
    return 'OVERVIEW';
  });

  const handleWorkspaceChange = (view: WorkspaceView) => {
    setActiveWorkspace(view);
    const hashMapping: Record<WorkspaceView, string> = {
      OVERVIEW: '#overview',
      INTAKE: '#complaints',
      REVIEW: '#review',
      DOCUMENTS: '#documents',
      ANALYTICS: '#analytics',
      TIMELINE: '#timeline',
      SYSTEM_HEALTH: '#system'
    };
    window.location.hash = hashMapping[view];
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase().replace('#', '');
      if (hash === 'complaints' || hash === 'intake') setActiveWorkspace('INTAKE');
      else if (hash === 'review') setActiveWorkspace('REVIEW');
      else if (hash === 'documents') setActiveWorkspace('DOCUMENTS');
      else if (hash === 'analytics') setActiveWorkspace('ANALYTICS');
      else if (hash === 'timeline' || hash === 'audit') setActiveWorkspace('TIMELINE');
      else if (hash === 'system' || hash === 'health') setActiveWorkspace('SYSTEM_HEALTH');
      else if (hash === 'overview') setActiveWorkspace('OVERVIEW');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        handleWorkspaceChange('INTAKE');
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleWorkspaceChange('REVIEW');
      } else if (e.key === 'o' || e.key === 'O') {
        e.preventDefault();
        handleWorkspaceChange('OVERVIEW');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        dispatch(clearToast());
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, dispatch]);

  const handleComplaintUpdated = (updated: ComplaintData) => {
    dispatch(setComplaintData(updated));
  };

  const handleSelectFromOverview = (complaint: ComplaintData) => {
    dispatch(setComplaintData(complaint));
  };

  const handleNewComplaint = () => {
    dispatch(resetComplaint());
    handleWorkspaceChange('INTAKE');
  };

  return (
    <ErrorBoundary>
      <div className="app-layout">
        {/* Toast Notification Banner */}
        {toast && (
          <div style={{
            position: 'fixed',
            top: 16,
            right: 20,
            zIndex: 100,
            backgroundColor: toast.type === 'success' ? 'var(--success-text)' : toast.type === 'error' ? 'var(--danger-text)' : 'var(--primary-text)',
            color: '#FFFFFF',
            padding: '8px 14px',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-modal)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            fontWeight: 500,
            animation: 'slideUp 0.18s ease-out'
          }}>
            {toast.type === 'success' && <CheckCircle2 size={14} />}
            {toast.type === 'error' && <AlertCircle size={14} />}
            {toast.type === 'info' && <Info size={14} />}
            <span>{toast.message}</span>
            <button
              onClick={() => dispatch(clearToast())}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.8)',
                cursor: 'pointer',
                marginLeft: 4
              }}
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* Quiet Desktop Left Sidebar */}
        <Sidebar
          activeWorkspace={activeWorkspace}
          onSelectWorkspace={handleWorkspaceChange}
        />

        {/* Main Viewport Container */}
        <div className="main-viewport">
          <TopBar
            activeWorkspace={activeWorkspace}
            onOpenCommandBar={() => {
              // Trigger command bar via key event or global state
              const evt = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true });
              window.dispatchEvent(evt);
            }}
            onNewComplaint={handleNewComplaint}
          />

          <main className="workspace-scrollable">
            {/* WORKSPACE 1: OVERVIEW DASHBOARD */}
            {activeWorkspace === 'OVERVIEW' && (
              <OverviewDashboard
                onNavigate={handleWorkspaceChange}
                onSelectComplaint={handleSelectFromOverview}
              />
            )}

            {/* WORKSPACE 2: COMPLAINT INTAKE & COPILOT */}
            {activeWorkspace === 'INTAKE' && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 400px)',
                gap: 16,
                height: 'calc(100vh - 100px)',
                maxWidth: 1440,
                margin: '0 auto'
              }}>
                <div style={{ overflowY: 'auto', paddingRight: 4 }}>
                  <ComplaintForm />
                </div>
                <div style={{ height: '100%', overflow: 'hidden', borderRadius: 'var(--radius-card)' }}>
                  <CopilotPanel />
                </div>
              </div>
            )}

            {/* WORKSPACE 3: QUALITY REVIEW QUEUE */}
            {activeWorkspace === 'REVIEW' && (
              <QualityReviewWorkspace
                currentComplaint={complaintData.id ? complaintData : null}
                onComplaintUpdated={handleComplaintUpdated}
              />
            )}

            {/* WORKSPACE 4: DOCUMENT EVIDENCE VIEWER */}
            {activeWorkspace === 'DOCUMENTS' && (
              <DocumentsView />
            )}

            {/* WORKSPACE 5: OPERATIONAL ANALYTICS */}
            {activeWorkspace === 'ANALYTICS' && (
              <AnalyticsDashboard />
            )}

            {/* WORKSPACE 6: 21 CFR PART 11 AUDIT TRAIL */}
            {activeWorkspace === 'TIMELINE' && (
              <div style={{ maxWidth: 1080, margin: '0 auto' }}>
                <AuditTimeline complaintId={complaintData.id} />
              </div>
            )}

            {/* WORKSPACE 7: SYSTEM DIAGNOSTICS & TELEMETRY */}
            {activeWorkspace === 'SYSTEM_HEALTH' && (
              <SystemHealthView />
            )}
          </main>
        </div>

        {/* Global Command Bar / Quick Palette */}
        <CommandBar />

        {/* Supporting Modal Overlays */}
        <SavedComplaintsModal />
        <AnalyticsModal
          isOpen={isAnalyticsOpen}
          onClose={() => dispatch(setAnalyticsOpen(false))}
        />
        {selectedEvidence && (
          <DocumentEvidenceViewer
            isOpen={Boolean(selectedEvidence)}
            onClose={() => dispatch(setSelectedFieldForEvidence(null))}
            activeProvenance={selectedEvidence}
            allProvenance={complaintData.field_provenance}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;
