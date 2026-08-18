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
  Plus
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
}

export const TopBar: React.FC<TopBarProps> = ({
  activeWorkspace,
  onOpenCommandBar,
  onNewComplaint
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
    OVERVIEW: 'Overview',
    INTAKE: 'Complaint Intake',
    REVIEW: 'Quality Review Queue',
    DOCUMENTS: 'Document Evidence',
    ANALYTICS: 'Operational Analytics',
    TIMELINE: '21 CFR Part 11 Audit Trail',
    SYSTEM_HEALTH: 'System Diagnostics'
  };

  return (
    <header style={{
      height: '50px',
      backgroundColor: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      flexShrink: 0,
      zIndex: 10
    }}>
      {/* Breadcrumb Context */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Workspace</span>
        <span style={{ fontSize: 12, color: 'var(--text-light)' }}>/</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
          {workspaceLabels[activeWorkspace]}
        </span>
        {activeWorkspace === 'INTAKE' && complaintData.complaint_number && (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--primary)',
            backgroundColor: 'var(--primary-subtle)',
            padding: '1px 6px',
            borderRadius: 'var(--radius-xs)',
            marginLeft: 4
          }}>
            {complaintData.complaint_number}
          </span>
        )}
      </div>

      {/* Global Search Command Bar Trigger */}
      <button
        onClick={onOpenCommandBar}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          backgroundColor: 'var(--bg-subtle)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: '5px 12px',
          color: 'var(--text-muted)',
          fontSize: 12,
          cursor: 'pointer',
          width: '280px',
          justifyContent: 'space-between',
          transition: 'border-color var(--transition-fast)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Search size={13} />
          <span>Search or jump to...</span>
        </div>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 2,
          fontSize: 10,
          fontFamily: 'var(--font-mono)',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xs)',
          padding: '1px 4px'
        }}>
          <Command size={9} />K
        </span>
      </button>

      {/* Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Scenario Loader Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowScenarioMenu(!showScenarioMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 10px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12,
              fontWeight: 500,
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            <span>Scenarios</span>
            <ChevronDown size={12} />
          </button>

          {showScenarioMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 4,
              width: '260px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-popover)',
              padding: 4,
              zIndex: 50
            }}>
              <div style={{
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--text-muted)',
                padding: '4px 8px',
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}>
                Pre-seeded GxP Scenarios
              </div>
              {SAMPLE_DATASETS.map((scenario, idx) => (
                <button
                  key={idx}
                  onClick={() => handleLoadScenario(scenario)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '6px 8px',
                    border: 'none',
                    background: 'none',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: 11.5,
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'background-color var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  {scenario.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Database Complaints */}
        <button
          onClick={handleOpenDatabaseModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '5px 10px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--text-secondary)',
            cursor: 'pointer'
          }}
          title="Browse persisted database complaints"
        >
          <Database size={13} />
          <span>Ledger</span>
        </button>

        {/* New Complaint Quick Action */}
        <button
          onClick={onNewComplaint}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '5px 11px',
            backgroundColor: 'var(--text-primary)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-subtle)'
          }}
        >
          <Plus size={13} />
          <span>New Intake</span>
        </button>
      </div>
    </header>
  );
};

export default TopBar;
