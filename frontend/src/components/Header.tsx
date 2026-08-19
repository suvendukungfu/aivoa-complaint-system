import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { resetComplaint, setComplaintData, setLastSaved } from '../store/complaintSlice';
import { resetAI, addMessage, setRiskAssessment, setCompleteness, setDuplicateWarning, setAuditTrail, setLoading, setStatusText, setAnalyticsOpen } from '../store/aiSlice';
import { resetDocument } from '../store/documentSlice';
import { setShowSavedModal, setToast, setSavedComplaintsList } from '../store/uiSlice';
import { api } from '../services/api';
import {
  RotateCcw,
  Save,
  Database,
  CheckCircle2,
  BarChart3,
  Command,
  User
} from 'lucide-react';

const SAMPLE_DATASETS = [
  {
    label: 'Scenario 1: Foreign Particles (Paracetamol API)',
    prompt: 'ABC Pharma reported visible black particles in Paracetamol API 99.5%, batch PA240812. Manufacturing date was 12 August 2026 and expiry is August 2028. 25 kg is affected.'
  },
  {
    label: 'Scenario 2: Packaging Defect (Amoxicillin 500mg)',
    prompt: 'BioHealth Distribution Corp reported damaged cartons and compromised security seals on Amoxicillin Trihydrate 500mg, batch AMX-2026-884. Manufactured on 10 May 2026, expiry May 2029. 350 cartons affected.'
  },
  {
    label: 'Scenario 3: Out of Specification (Ibuprofen DC)',
    prompt: 'Nordic Care Pharmaceuticals reported assay potency failure of 72.4% on Ibuprofen DC Granules (Batch IBU-DC-9011, Mfg: 01 June 2026, Exp: June 2029). 1200 kg under quarantine.'
  }
];

export const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const complaintData = useAppSelector((state) => state.complaint.data);
  const isSaved = useAppSelector((state) => state.complaint.isSaved);
  const lastSaved = useAppSelector((state) => state.complaint.lastSaved);
  const [saving, setSaving] = useState(false);
  const [healthStatus, setHealthStatus] = useState<{
    status: string;
    ai_model: string;
    groq_configured: boolean;
    database_type: string;
  }>({
    status: 'healthy',
    ai_model: 'gemma2-9b-it',
    groq_configured: true,
    database_type: 'postgresql'
  });

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const health = await api.fetchHealth();
        setHealthStatus(health);
      } catch {
        // Fallback default
      }
    };
    checkHealth();
  }, []);

  const handleReset = () => {
    dispatch(resetComplaint());
    dispatch(resetAI());
    dispatch(resetDocument());
    dispatch(setToast({ type: 'info', message: 'Complaint workspace and copilot context reset.' }));
  };

  const handleSaveComplaint = async () => {
    if (!complaintData.product_name && !complaintData.batch_number && !complaintData.detailed_description) {
      dispatch(setToast({ type: 'error', message: 'Cannot save an empty complaint. Please enter details or log via Copilot.' }));
      return;
    }

    try {
      setSaving(true);
      const res = await api.saveComplaint(complaintData);
      dispatch(setLastSaved(res));
      dispatch(setToast({
        type: 'success',
        message: `Complaint persisted successfully. Assigned QMS ID: ${res.complaint_number}`
      }));
    } catch (err: any) {
      dispatch(setToast({ type: 'error', message: err.message || 'Failed to persist complaint.' }));
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDatabaseModal = async () => {
    try {
      const res = await api.fetchComplaints();
      dispatch(setSavedComplaintsList(res.items || []));
      dispatch(setShowSavedModal(true));
    } catch {
      dispatch(setToast({ type: 'error', message: 'Failed to load historical complaints from database.' }));
    }
  };

  const handleSelectSamplePrompt = async (promptText: string) => {
    dispatch(setLoading(true));
    dispatch(setStatusText('Extracting complaint entities...'));
    dispatch(addMessage({
      id: `user-${Date.now()}`,
      sender: 'user',
      text: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

    try {
      const res = await api.logComplaint(promptText);
      dispatch(setComplaintData(res.complaint));
      if (res.risk_assessment) dispatch(setRiskAssessment(res.risk_assessment));
      if (res.completeness) dispatch(setCompleteness(res.completeness));
      if (res.duplicate_warning) dispatch(setDuplicateWarning(res.duplicate_warning));
      if (res.audit_trail) dispatch(setAuditTrail(res.audit_trail));

      dispatch(addMessage({
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: res.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        updatedFields: res.updated_fields,
        risk: res.risk_assessment
      }));
    } catch (err: any) {
      dispatch(addMessage({
        id: `ai-err-${Date.now()}`,
        sender: 'assistant',
        text: `Processing Error: ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));
    } finally {
      dispatch(setLoading(false));
      dispatch(setStatusText('Idle'));
    }
  };

  return (
    <header style={{
      backgroundColor: '#FFFFFF',
      borderBottom: '1px solid #E5E7EB',
      padding: '8px 20px',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      boxShadow: '0 1px 2px 0 rgba(16, 24, 40, 0.04)'
    }}>
      <div style={{
        maxWidth: 1600,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        {/* Left: Brand, Breadcrumb & Context */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: 4,
              backgroundColor: '#1E293B',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: '-0.03em'
            }}>
              A
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#111827', letterSpacing: '-0.01em' }}>
                  AIVOA QMS
                </span>
                <span style={{ color: '#D1D5DB' }}>/</span>
                <span style={{ fontSize: 13, color: '#4B5563', fontWeight: 500 }}>
                  {complaintData?.complaint_number || 'New Intake'}
                </span>
              </div>
              <span style={{ fontSize: 11, color: '#6B7280' }}>
                Pharmaceutical Complaint Management
              </span>
            </div>
          </div>

          <div style={{ width: 1, height: 24, backgroundColor: '#E5E7EB', margin: '0 4px' }} />

          {/* Model Status Indicator */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '3px 8px',
            borderRadius: 4,
            backgroundColor: '#F3F4F6',
            border: '1px solid #E5E7EB',
            fontSize: 11,
            color: '#374151',
            fontWeight: 500
          }}>
            <span style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: healthStatus.groq_configured ? '#059669' : '#D97706'
            }} />
            <span>Groq: {healthStatus.ai_model}</span>
          </div>
        </div>

        {/* Right: Actions, Demo, Search & User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Demo Scenario Selector */}
          <select
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) {
                handleSelectSamplePrompt(e.target.value);
                e.target.value = '';
              }
            }}
            style={{
              height: 32,
              padding: '0 10px',
              fontSize: 12,
              fontWeight: 500,
              backgroundColor: '#FFFFFF',
              color: '#374151',
              border: '1px solid #D1D5DB',
              borderRadius: 4,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="" disabled>Load Demo Scenario...</option>
            {SAMPLE_DATASETS.map((s, idx) => (
              <option key={idx} value={s.prompt}>{s.label}</option>
            ))}
          </select>

          {/* Command Bar Button */}
          <button
            onClick={() => {
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
            }}
            style={{
              height: 32,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '0 10px',
              fontSize: 12,
              fontWeight: 500,
              backgroundColor: '#F9FAFB',
              color: '#4B5563',
              border: '1px solid #D1D5DB',
              borderRadius: 4,
              cursor: 'pointer'
            }}
            title="Open Command Bar (⌘K)"
          >
            <Command size={13} />
            <span style={{ fontSize: 11, color: '#6B7280' }}>⌘K</span>
          </button>

          {/* Analytics Button */}
          <button
            onClick={() => dispatch(setAnalyticsOpen(true))}
            style={{
              height: 32,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '0 10px',
              fontSize: 12,
              fontWeight: 500,
              backgroundColor: '#FFFFFF',
              color: '#374151',
              border: '1px solid #D1D5DB',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            <BarChart3 size={13} color="#4B5563" />
            <span>Analytics</span>
          </button>

          {/* QMS Registry Button */}
          <button
            onClick={handleOpenDatabaseModal}
            style={{
              height: 32,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '0 10px',
              fontSize: 12,
              fontWeight: 500,
              backgroundColor: '#FFFFFF',
              color: '#374151',
              border: '1px solid #D1D5DB',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            <Database size={13} color="#4B5563" />
            <span>Registry</span>
          </button>

          {/* Reset Workspace Button */}
          <button
            onClick={handleReset}
            title="Reset active form and copilot"
            style={{
              height: 32,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '0 10px',
              fontSize: 12,
              fontWeight: 500,
              backgroundColor: '#FFFFFF',
              color: '#4B5563',
              border: '1px solid #D1D5DB',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>

          {/* Save to QMS Button */}
          <button
            onClick={handleSaveComplaint}
            disabled={saving || isSaved}
            style={{
              height: 32,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '0 14px',
              fontSize: 12,
              fontWeight: 500,
              backgroundColor: isSaved ? '#059669' : '#1D4ED8',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 4,
              cursor: isSaved ? 'default' : 'pointer',
              opacity: saving ? 0.7 : 1
            }}
          >
            {isSaved ? (
              <>
                <CheckCircle2 size={14} />
                <span>Saved ({lastSaved?.complaint_number})</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>{saving ? 'Saving...' : 'Save Record'}</span>
              </>
            )}
          </button>

          <div style={{ width: 1, height: 20, backgroundColor: '#E5E7EB', margin: '0 2px' }} />

          {/* User / Role Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '2px 8px',
            backgroundColor: '#F3F4F6',
            borderRadius: 4,
            border: '1px solid #E5E7EB',
            fontSize: 11,
            color: '#374151'
          }}>
            <User size={12} color="#6B7280" />
            <span style={{ fontWeight: 500 }}>QA Reviewer</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
