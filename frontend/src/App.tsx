import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './store';
import { clearToast } from './store/uiSlice';
import { setAnalyticsOpen } from './store/aiSlice';
import { setComplaintData } from './store/complaintSlice';
import { Header } from './components/Header';
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
  X,
  LayoutDashboard,
  FileText,
  CheckSquare,
  FileCode2,
  BarChart3,
  History,
  Activity
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

  return (
    <ErrorBoundary>
      <div className="app-container">
        {/* Toast Notification Banner */}
        {toast && (
          <div style={{
            position: 'fixed',
            top: 16,
            right: 20,
            zIndex: 100,
            backgroundColor: toast.type === 'success' ? '#065F46' : toast.type === 'error' ? '#991B1B' : '#1E3A8A',
            color: '#FFFFFF',
            padding: '8px 14px',
            borderRadius: 4,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            fontWeight: 500,
            animation: 'slideUp 0.2s ease-out'
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

        {/* Enterprise Application Header */}
        <Header />

        {/* Primary Workflow Navigation Bar */}
        <nav style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E5E7EB',
          padding: '0 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <button
              onClick={() => handleWorkspaceChange('OVERVIEW')}
              style={{
                padding: '10px 12px',
                border: 'none',
                background: 'none',
                fontSize: 12,
                fontWeight: activeWorkspace === 'OVERVIEW' ? 600 : 500,
                color: activeWorkspace === 'OVERVIEW' ? '#1D4ED8' : '#6B7280',
                borderBottom: activeWorkspace === 'OVERVIEW' ? '2px solid #1D4ED8' : '2px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <LayoutDashboard size={13} />
              <span>Overview</span>
            </button>

            <button
              onClick={() => handleWorkspaceChange('INTAKE')}
              style={{
                padding: '10px 12px',
                border: 'none',
                background: 'none',
                fontSize: 12,
                fontWeight: activeWorkspace === 'INTAKE' ? 600 : 500,
                color: activeWorkspace === 'INTAKE' ? '#1D4ED8' : '#6B7280',
                borderBottom: activeWorkspace === 'INTAKE' ? '2px solid #1D4ED8' : '2px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <FileText size={13} />
              <span>Complaints</span>
            </button>

            <button
              onClick={() => handleWorkspaceChange('REVIEW')}
              style={{
                padding: '10px 12px',
                border: 'none',
                background: 'none',
                fontSize: 12,
                fontWeight: activeWorkspace === 'REVIEW' ? 600 : 500,
                color: activeWorkspace === 'REVIEW' ? '#1D4ED8' : '#6B7280',
                borderBottom: activeWorkspace === 'REVIEW' ? '2px solid #1D4ED8' : '2px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <CheckSquare size={13} />
              <span>Review Queue</span>
            </button>

            <button
              onClick={() => handleWorkspaceChange('DOCUMENTS')}
              style={{
                padding: '10px 12px',
                border: 'none',
                background: 'none',
                fontSize: 12,
                fontWeight: activeWorkspace === 'DOCUMENTS' ? 600 : 500,
                color: activeWorkspace === 'DOCUMENTS' ? '#1D4ED8' : '#6B7280',
                borderBottom: activeWorkspace === 'DOCUMENTS' ? '2px solid #1D4ED8' : '2px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <FileCode2 size={13} />
              <span>Documents</span>
            </button>

            <button
              onClick={() => handleWorkspaceChange('ANALYTICS')}
              style={{
                padding: '10px 12px',
                border: 'none',
                background: 'none',
                fontSize: 12,
                fontWeight: activeWorkspace === 'ANALYTICS' ? 600 : 500,
                color: activeWorkspace === 'ANALYTICS' ? '#1D4ED8' : '#6B7280',
                borderBottom: activeWorkspace === 'ANALYTICS' ? '2px solid #1D4ED8' : '2px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <BarChart3 size={13} />
              <span>Analytics</span>
            </button>

            <button
              onClick={() => handleWorkspaceChange('TIMELINE')}
              style={{
                padding: '10px 12px',
                border: 'none',
                background: 'none',
                fontSize: 12,
                fontWeight: activeWorkspace === 'TIMELINE' ? 600 : 500,
                color: activeWorkspace === 'TIMELINE' ? '#1D4ED8' : '#6B7280',
                borderBottom: activeWorkspace === 'TIMELINE' ? '2px solid #1D4ED8' : '2px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <History size={13} />
              <span>Audit Trail</span>
            </button>

            <button
              onClick={() => handleWorkspaceChange('SYSTEM_HEALTH')}
              style={{
                padding: '10px 12px',
                border: 'none',
                background: 'none',
                fontSize: 12,
                fontWeight: activeWorkspace === 'SYSTEM_HEALTH' ? 600 : 500,
                color: activeWorkspace === 'SYSTEM_HEALTH' ? '#1D4ED8' : '#6B7280',
                borderBottom: activeWorkspace === 'SYSTEM_HEALTH' ? '2px solid #1D4ED8' : '2px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <Activity size={13} />
              <span>System Health</span>
            </button>
          </div>

          <div style={{ fontSize: 11, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0' }}>
            <span>Active Record: <strong style={{ color: '#111827' }}>{complaintData?.complaint_number || 'Unsaved Draft'}</strong></span>
            {complaintData?.status && (
              <span style={{
                fontSize: 10,
                padding: '1px 5px',
                borderRadius: 3,
                background: '#EFF6FF',
                color: '#1D4ED8',
                border: '1px solid #BFDBFE',
                fontWeight: 600
              }}>
                {complaintData.status}
              </span>
            )}
          </div>
        </nav>

        {/* Primary Workspace View Switcher */}
        {activeWorkspace === 'OVERVIEW' && (
          <OverviewDashboard
            onNavigate={(view) => handleWorkspaceChange(view as WorkspaceView)}
            onSelectComplaint={handleSelectFromOverview}
          />
        )}

        {activeWorkspace === 'INTAKE' && (
          <main className="main-content">
            <section aria-label="Complaint Intake Form">
              <ComplaintForm />
            </section>
            <aside aria-label="AIVOA Quality Copilot">
              <CopilotPanel />
            </aside>
          </main>
        )}

        {activeWorkspace === 'REVIEW' && (
          <div style={{ maxWidth: 1600, margin: '16px auto', padding: '0 20px', width: '100%', boxSizing: 'border-box' }}>
            <QualityReviewWorkspace
              currentComplaint={complaintData}
              onComplaintUpdated={handleComplaintUpdated}
            />
          </div>
        )}

        {activeWorkspace === 'DOCUMENTS' && (
          <DocumentsView />
        )}

        {activeWorkspace === 'ANALYTICS' && (
          <AnalyticsDashboard />
        )}

        {activeWorkspace === 'TIMELINE' && (
          <div style={{ maxWidth: 1200, margin: '16px auto', padding: '0 20px', width: '100%', boxSizing: 'border-box' }}>
            <AuditTimeline
              complaintId={complaintData?.id}
              complaintNumber={complaintData?.complaint_number}
              onRefresh={() => {}}
            />
          </div>
        )}

        {activeWorkspace === 'SYSTEM_HEALTH' && (
          <SystemHealthView />
        )}

        {/* Global Dialogs & Tooling */}
        <CommandBar />
        <SavedComplaintsModal />
        <AnalyticsModal
          isOpen={isAnalyticsOpen}
          onClose={() => dispatch(setAnalyticsOpen(false))}
        />
        {selectedEvidence && (
          <DocumentEvidenceViewer
            isOpen={Boolean(selectedEvidence)}
            onClose={() => dispatch(clearToast())}
            documentText={complaintData?.detailed_description || ''}
            activeProvenance={selectedEvidence}
            allProvenance={complaintData?.field_provenance || {}}
          />
        )}

        {/* Minimal Enterprise Footer */}
        <footer style={{
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #E5E7EB',
          padding: '10px 20px',
          marginTop: 'auto',
          fontSize: 11,
          color: '#6B7280'
        }}>
          <div style={{
            maxWidth: 1600,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8
          }}>
            <span>AIVOA QMS • Pharmaceutical Quality Management System</span>
            <span>Intake Engine: LangGraph + Groq • Persistence: PostgreSQL</span>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
};

export default App;
