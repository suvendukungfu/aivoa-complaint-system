import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { addMessage, setRiskAssessment, setCompleteness, setDuplicateWarning, setAuditTrail, setLoading, setStatusText } from '../store/aiSlice';
import { setShowSavedModal, setToast, setSavedComplaintsList } from '../store/uiSlice';
import { setComplaintData } from '../store/complaintSlice';
import { api } from '../services/api';
import {
  Search,
  Database,
  ChevronDown,
  Command,
  Plus,
  Menu,
  FileCheck2
} from 'lucide-react';
import type { WorkspaceView } from '../App';

const SAMPLE_DATASETS = [
  {
    label: 'Scenario A: Foreign Particulate (Paracetamol API)',
    prompt: 'ABC Pharma reported visible black particles in Paracetamol API 99.5%, batch PA240812. Manufacturing date was 12 August 2026 and expiry is August 2028. 25 kg is affected.'
  },
  {
    label: 'Scenario B: Packaging Defect (Amoxicillin 500mg)',
    prompt: 'BioHealth Distribution Corp reported damaged cartons and compromised security seals on Amoxicillin Trihydrate 500mg, batch AMX-2026-884. Manufactured on 10 May 2026, expiry May 2029. 350 cartons affected.'
  },
  {
    label: 'Scenario C: Out of Specification (Ibuprofen DC)',
    prompt: 'Nordic Care Pharmaceuticals reported assay potency failure of 72.4% on Ibuprofen DC Granules (Batch IBU-DC-9011, Mfg: 01 June 2026, Exp: June 2029). 1200 kg under quarantine.'
  }
];

interface TopBarProps {
  activeWorkspace: WorkspaceView;
  onOpenCommandBar: () => void;
  onNewComplaint: () => void;
  onToggleMobileMenu?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeWorkspace,
  onOpenCommandBar,
  onNewComplaint,
  onToggleMobileMenu
}) => {
  const dispatch = useAppDispatch();
  const complaintData = useAppSelector((state) => state.complaint.data);
  const [showScenarioMenu, setShowScenarioMenu] = useState(false);

  const handleOpenDatabaseModal = async () => {
    try {
      const res = await api.fetchComplaints();
      dispatch(setSavedComplaintsList(res.items || []));
      dispatch(setShowSavedModal(true));
    } catch {
      dispatch(setToast({ type: 'error', message: 'Failed to load historical complaints.' }));
    }
  };

  const handleLoadScenario = async (scenario: { label: string; prompt: string }) => {
    setShowScenarioMenu(false);
    dispatch(addMessage({
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: scenario.prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));
    dispatch(setLoading(true));
    dispatch(setStatusText('Extracting entities & assessing GxP risk...'));

    try {
      const response = await api.logComplaint(scenario.prompt);
      if (response.complaint) {
        dispatch(setComplaintData(response.complaint));
      }
      if (response.risk_assessment) {
        dispatch(setRiskAssessment(response.risk_assessment));
      }
      if (response.completeness) {
        dispatch(setCompleteness(response.completeness));
      }
      if (response.duplicate_warning) {
        dispatch(setDuplicateWarning(response.duplicate_warning));
      }
      if (response.audit_trail) {
        dispatch(setAuditTrail(response.audit_trail));
      }
      dispatch(addMessage({
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: `Loaded ${scenario.label.split(':')[0]}. Extracted entities and risk assessment updated.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));
      dispatch(setToast({ type: 'success', message: `${scenario.label.split(':')[0]} loaded.` }));
    } catch (err: any) {
      dispatch(addMessage({
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'AI analysis unavailable. No complaint data was changed.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));
      dispatch(setToast({ type: 'error', message: err.message || 'Failed to analyze scenario.' }));
    } finally {
      dispatch(setLoading(false));
      dispatch(setStatusText(''));
    }
  };

  const workspaceLabels: Record<WorkspaceView, string> = {
    OVERVIEW: 'Overview Dashboard',
    INTAKE: 'Complaint Intake & Copilot',
    REVIEW: 'Quality Review Queue',
    DOCUMENTS: 'Document Evidence Viewer',
    ANALYTICS: 'Operational Analytics',
    TIMELINE: '21 CFR Part 11 Audit Trail',
    SYSTEM_HEALTH: 'System Health & Telemetry'
  };

  return (
    <header style={{
      height: '56px',
      backgroundColor: 'rgba(255, 255, 255, 0.92)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid #E2E8F0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      flexShrink: 0,
      zIndex: 10,
      gap: 16
    }}>
      {/* Left: Breadcrumbs & Current Record */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            style={{
              background: 'none',
              border: 'none',
              color: '#475569',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: 6,
              borderRadius: 6
            }}
            aria-label="Toggle navigation menu"
          >
            <Menu size={18} />
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, whiteSpace: 'nowrap' }}>
          <span style={{ fontSize: 12.5, fontWeight: 500, color: '#64748B' }}>Workspace</span>
          <span style={{ fontSize: 12, color: '#CBD5E1' }}>/</span>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {workspaceLabels[activeWorkspace]}
          </span>
          {activeWorkspace === 'INTAKE' && complaintData.complaint_number && (
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11.5,
              fontWeight: 700,
              color: '#4F46E5',
              backgroundColor: '#EEF2FF',
              padding: '2px 8px',
              borderRadius: 6,
              border: '1px solid #C7D2FE',
              marginLeft: 4
            }}>
              {complaintData.complaint_number}
            </span>
          )}
        </div>
      </div>

      {/* Center: Command Palette Trigger Search */}
      <button
        onClick={onOpenCommandBar}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          backgroundColor: '#F1F5F9',
          border: '1px solid #E2E8F0',
          borderRadius: 8,
          padding: '6px 14px',
          color: '#64748B',
          fontSize: 12.5,
          cursor: 'pointer',
          maxWidth: '320px',
          flex: '1 1 auto',
          justifyContent: 'space-between',
          transition: 'all 160ms ease-out',
          boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.02)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#CBD5E1';
          e.currentTarget.style.backgroundColor = '#FFFFFF';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#E2E8F0';
          e.currentTarget.style.backgroundColor = '#F1F5F9';
          e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0, 0, 0, 0.02)';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
          <Search size={14} style={{ flexShrink: 0, color: '#94A3B8' }} />
          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontWeight: 500 }}>
            Search complaints, batches, documents...
          </span>
        </div>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 2,
          fontSize: 10.5,
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
          backgroundColor: '#FFFFFF',
          color: '#475569',
          border: '1px solid #CBD5E1',
          borderRadius: 5,
          padding: '2px 6px',
          flexShrink: 0,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)'
        }}>
          <Command size={10} />K
        </span>
      </button>

      {/* Right: Actions Group */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {/* Scenario Loader Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowScenarioMenu(!showScenarioMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: 7,
              fontSize: 12.5,
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-subtle)',
              transition: 'all 140ms ease-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F8FAFC';
              e.currentTarget.style.borderColor = '#94A3B8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.borderColor = '#CBD5E1';
            }}
          >
            <FileCheck2 size={13} style={{ color: '#6366F1' }} />
            <span>GxP Scenarios</span>
            <ChevronDown size={13} style={{ color: '#94A3B8' }} />
          </button>

          {showScenarioMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 6,
              width: '300px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 10,
              boxShadow: 'var(--shadow-popover)',
              padding: 6,
              zIndex: 50,
              animation: 'slideUp 160ms cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}>
              <div style={{
                fontSize: 10.5,
                fontWeight: 700,
                color: '#64748B',
                padding: '6px 10px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase'
              }}>
                Pre-seeded GxP Test Scenarios
              </div>
              {SAMPLE_DATASETS.map((scenario, idx) => (
                <button
                  key={idx}
                  onClick={() => handleLoadScenario(scenario)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 10px',
                    border: 'none',
                    background: 'none',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 500,
                    color: '#1E293B',
                    cursor: 'pointer',
                    transition: 'all 120ms ease-out',
                    lineHeight: 1.4
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#EEF2FF';
                    e.currentTarget.style.color = '#4338CA';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#1E293B';
                  }}
                >
                  {scenario.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Database Ledger */}
        <button
          onClick={handleOpenDatabaseModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: 7,
            fontSize: 12.5,
            fontWeight: 600,
            color: '#334155',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-subtle)',
            transition: 'all 140ms ease-out'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#F8FAFC';
            e.currentTarget.style.borderColor = '#94A3B8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#FFFFFF';
            e.currentTarget.style.borderColor = '#CBD5E1';
          }}
          title="Browse persisted database complaints"
        >
          <Database size={13} style={{ color: '#0EA5E9' }} />
          <span>Ledger</span>
        </button>

        {/* Primary New Intake Button */}
        <button
          onClick={onNewComplaint}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            background: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 7,
            fontSize: 12.5,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(79, 70, 229, 0.3)',
            transition: 'all 140ms ease-out'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 6px rgba(79, 70, 229, 0.3)';
          }}
        >
          <Plus size={14} />
          <span>New Intake</span>
        </button>
      </div>
    </header>
  );
};

export default TopBar;
