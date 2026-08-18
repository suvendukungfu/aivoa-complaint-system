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
    } catch {
      dispatch(addMessage({
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'AI analysis unavailable. No complaint data was changed.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));
      dispatch(setToast({ type: 'error', message: 'AI service unavailable.' }));
    } finally {
      dispatch(setLoading(false));
      dispatch(setStatusText(''));
    }
  };

  const getBreadcrumb = () => {
    switch (activeWorkspace) {
      case 'OVERVIEW':
        return 'Overview / Operations';
      case 'INTAKE':
        return `Complaints / ${complaintData.complaint_number || 'New Draft'}`;
      case 'REVIEW':
        return 'Review Queue / Quality Decisions';
      case 'DOCUMENTS':
        return 'Documents / Evidence Library';
      case 'ANALYTICS':
        return 'Analytics / QMS Metrics';
      case 'TIMELINE':
        return 'Audit Trail / 21 CFR Part 11';
      case 'SYSTEM_HEALTH':
        return 'System Health / Observability';
      default:
        return 'Workspace';
    }
  };

  return (
    <header
      style={{
        height: '58px',
        backgroundColor: 'rgba(8, 9, 9, 0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 40
      }}
    >
      {/* Left: Breadcrumb & Mobile Menu Trigger */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="mobile-hamburger"
            style={{
              display: 'none',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.10)',
              borderRadius: 6,
              padding: 6,
              color: '#FFFFFF',
              cursor: 'pointer'
            }}
            aria-label="Open mobile menu"
          >
            <Menu size={16} />
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.90)',
              letterSpacing: '-0.01em'
            }}
          >
            {getBreadcrumb()}
          </span>
        </div>
      </div>

      {/* Center: Command Bar Trigger */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={onOpenCommandBar}
          style={{
            height: '34px',
            width: '280px',
            backgroundColor: 'rgba(255, 255, 255, 0.035)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '9999px',
            padding: '0 12px',
            color: 'rgba(255, 255, 255, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 140ms ease-out'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.035)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.45)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Search size={13} />
            <span>Search complaints, batch, text...</span>
          </div>
          <div
            style={{
              fontSize: '10.5px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              padding: '1px 5px',
              borderRadius: 4,
              color: 'rgba(255, 255, 255, 0.60)'
            }}
          >
            ⌘K
          </div>
        </button>
      </div>

      {/* Right: Actions & User Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Sample Scenario Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowScenarioMenu(!showScenarioMenu)}
            style={{
              height: '32px',
              padding: '0 10px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              borderRadius: '9999px',
              color: 'rgba(255, 255, 255, 0.75)',
              fontSize: '11.5px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
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
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)';
            }}
          >
            <FileCheck2 size={13} />
            <span>Sample Scenarios</span>
            <ChevronDown size={12} />
          </button>

          {showScenarioMenu && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                width: '320px',
                backgroundColor: 'rgba(12, 13, 14, 0.96)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '12px',
                padding: '6px',
                boxShadow: '0 16px 36px rgba(0, 0, 0, 0.6)',
                zIndex: 60
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.40)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '6px 8px 4px'
                }}
              >
                PRECONFIGURED GXP COMPLAINTS
              </div>
              {SAMPLE_DATASETS.map((scenario) => (
                <button
                  key={scenario.label}
                  onClick={() => handleLoadScenario(scenario)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    transition: 'background-color 120ms ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span style={{ fontWeight: 600 }}>{scenario.label.split(':')[0]}</span>
                  <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.55)', lineHeight: 1.3 }}>
                    {scenario.label.split(':')[1]}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Database History Modal Trigger */}
        <button
          onClick={handleOpenDatabaseModal}
          style={{
            height: '32px',
            padding: '0 10px',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.09)',
            borderRadius: '9999px',
            color: 'rgba(255, 255, 255, 0.75)',
            fontSize: '11.5px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
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
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)';
          }}
        >
          <Database size={13} />
          <span>Records</span>
        </button>

        {/* New Complaint Button */}
        <button
          onClick={onNewComplaint}
          style={{
            height: '32px',
            padding: '0 12px',
            backgroundColor: '#FFFFFF',
            color: '#080909',
            border: 'none',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            cursor: 'pointer',
            transition: 'all 140ms ease-out'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.90)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
        >
          <Plus size={13} />
          <span>New</span>
        </button>

        {/* User Pill */}
        <div
          style={{
            height: '32px',
            padding: '0 8px 0 4px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.75)'
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              color: '#080909',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '10px'
            }}
          >
            QP
          </div>
          <span style={{ fontWeight: 600 }}>Dr. Vance</span>
        </div>
      </div>
    </header>
  );
};
