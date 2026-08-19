import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  addMessage,
  setLoading,
  setStatusText,
  setRiskAssessment,
  setCompleteness,
  setDuplicateWarning,
  setAuditTrail
} from '../../store/aiSlice';
import {
  setComplaintData,
  setUpdatedFields
} from '../../store/complaintSlice';
import { setToast } from '../../store/uiSlice';
import { api } from '../../services/api';
import { RiskAssessmentCard } from './RiskAssessmentCard';
import { CompletenessWidget } from './CompletenessWidget';
import { DocumentUpload } from './DocumentUpload';
import { ObservabilityDrawer } from './ObservabilityDrawer';
import {
  Bot,
  User,
  Send,
  Loader2
} from 'lucide-react';

export const CopilotPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const messages = useAppSelector((state) => state.ai.messages);
  const loading = useAppSelector((state) => state.ai.loading);
  const statusText = useAppSelector((state) => state.ai.statusText);
  const complaint = useAppSelector((state) => state.complaint.data);

  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<'ASSISTANT' | 'RISK' | 'COMPLETENESS' | 'UPLOAD'>('ASSISTANT');

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');

    dispatch(addMessage({
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

    dispatch(setLoading(true));
    dispatch(setStatusText('Analyzing complaint instruction...'));

    try {
      const isEdit = complaint.customer_name || complaint.product_name || complaint.detailed_description;
      let res;

      if (isEdit) {
        dispatch(setStatusText('Applying natural language edit...'));
        res = await api.editComplaint(userText, complaint);
      } else {
        dispatch(setStatusText('Extracting complaint entities...'));
        res = await api.logComplaint(userText);
      }

      dispatch(setComplaintData(res.complaint));
      if (res.updated_fields) dispatch(setUpdatedFields(res.updated_fields));
      if (res.risk_assessment) dispatch(setRiskAssessment(res.risk_assessment));
      if (res.completeness) dispatch(setCompleteness(res.completeness));
      if (res.duplicate_warning) dispatch(setDuplicateWarning(res.duplicate_warning));
      if (res.audit_trail) dispatch(setAuditTrail(res.audit_trail));

      const fieldsCount = res.updated_fields?.length || Object.keys(res.complaint.field_provenance || {}).length || 0;
      const riskLevel = res.risk_assessment?.severity || res.complaint.severity || 'Medium';

      dispatch(addMessage({
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: `**Complaint Record Updated**\n\n• **${fieldsCount} fields extracted** with traceable evidence.\n• **Risk Assessment**: **${riskLevel}**.\n• Ready for Qualified Person verification.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        updatedFields: res.updated_fields,
        risk: res.risk_assessment
      }));
    } catch (err: any) {
      dispatch(addMessage({
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `AI analysis unavailable (${err.message || 'Connection timeout'}). No complaint data was changed. You may retry or continue with saved record data.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));
    } finally {
      dispatch(setLoading(false));
      dispatch(setStatusText('Idle'));
    }
  };

  const handleQuickAction = (actionText: string) => {
    setInput(actionText);
  };

  const handleCheckCompleteness = async () => {
    dispatch(setLoading(true));
    dispatch(setStatusText('Evaluating complaint completeness...'));
    try {
      const assessment = await api.evaluateCompleteness(complaint);
      dispatch(setCompleteness(assessment));
      setActiveTab('COMPLETENESS');
      dispatch(setToast({
        message: `Completeness score: ${assessment.completeness_score}%`,
        type: 'info'
      }));
    } catch (err: any) {
      dispatch(setToast({ message: err.message || 'Completeness check failed', type: 'error' }));
    } finally {
      dispatch(setLoading(false));
      dispatch(setStatusText('Idle'));
    }
  };

  const handleEvaluateRisk = async () => {
    dispatch(setLoading(true));
    dispatch(setStatusText('Evaluating quality risk policies...'));
    try {
      const risk = await api.evaluateRisk(complaint);
      dispatch(setRiskAssessment(risk));
      setActiveTab('RISK');
      dispatch(setToast({
        message: `Risk triage evaluated: Severity ${risk.severity}`,
        type: 'info'
      }));
    } catch (err: any) {
      dispatch(setToast({ message: err.message || 'Risk evaluation failed', type: 'error' }));
    } finally {
      dispatch(setLoading(false));
      dispatch(setStatusText('Idle'));
    }
  };

  const fieldCount = Object.keys(complaint.field_provenance || {}).length;

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderRadius: 6,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 600,
      boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)',
      overflow: 'hidden'
    }}>
      {/* 1. Embedded Copilot Header with Operational Context */}
      <div style={{
        padding: '12px 14px',
        borderBottom: '1px solid #E5E7EB',
        backgroundColor: '#F9FAFB',
        display: 'flex',
        flexDirection: 'column',
        gap: 6
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Bot size={15} color="#1D4ED8" />
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827' }}>
              AIVOA Quality Copilot
            </h3>
          </div>

          <span style={{
            fontSize: 10,
            fontWeight: 500,
            backgroundColor: loading ? '#FEF3C7' : '#EFF6FF',
            color: loading ? '#92400E' : '#1D4ED8',
            border: `1px solid ${loading ? '#FDE68A' : '#BFDBFE'}`,
            padding: '1px 6px',
            borderRadius: 3
          }}>
            {loading ? statusText : 'Analyzed & Active'}
          </span>
        </div>

        {/* Operational Context Summary Pill */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: 4,
          padding: '6px 8px',
          fontSize: 11,
          color: '#4B5563',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>Context: <strong style={{ color: '#111827' }}>{complaint.complaint_number || 'Draft Intake'}</strong></span>
          <span>{fieldCount > 0 ? `${fieldCount} fields extracted` : 'Ready for input'}</span>
        </div>

        {/* Sub-tab switcher */}
        <div style={{ display: 'flex', gap: 4, paddingTop: 2 }}>
          <button
            onClick={() => setActiveTab('ASSISTANT')}
            style={{
              flex: 1,
              height: 26,
              borderRadius: 3,
              border: activeTab === 'ASSISTANT' ? '1px solid #BFDBFE' : '1px solid transparent',
              backgroundColor: activeTab === 'ASSISTANT' ? '#EFF6FF' : 'transparent',
              color: activeTab === 'ASSISTANT' ? '#1D4ED8' : '#6B7280',
              fontSize: 11,
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Assistant
          </button>

          <button
            onClick={() => setActiveTab('RISK')}
            style={{
              flex: 1,
              height: 26,
              borderRadius: 3,
              border: activeTab === 'RISK' ? '1px solid #BFDBFE' : '1px solid transparent',
              backgroundColor: activeTab === 'RISK' ? '#EFF6FF' : 'transparent',
              color: activeTab === 'RISK' ? '#1D4ED8' : '#6B7280',
              fontSize: 11,
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Risk Triage
          </button>

          <button
            onClick={() => setActiveTab('COMPLETENESS')}
            style={{
              flex: 1,
              height: 26,
              borderRadius: 3,
              border: activeTab === 'COMPLETENESS' ? '1px solid #BFDBFE' : '1px solid transparent',
              backgroundColor: activeTab === 'COMPLETENESS' ? '#EFF6FF' : 'transparent',
              color: activeTab === 'COMPLETENESS' ? '#1D4ED8' : '#6B7280',
              fontSize: 11,
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Completeness
          </button>

          <button
            onClick={() => setActiveTab('UPLOAD')}
            style={{
              flex: 1,
              height: 26,
              borderRadius: 3,
              border: activeTab === 'UPLOAD' ? '1px solid #BFDBFE' : '1px solid transparent',
              backgroundColor: activeTab === 'UPLOAD' ? '#EFF6FF' : 'transparent',
              color: activeTab === 'UPLOAD' ? '#1D4ED8' : '#6B7280',
              fontSize: 11,
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Upload
          </button>
        </div>
      </div>

      {/* 2. Embedded Action Chips */}
      <div style={{
        padding: '6px 12px',
        backgroundColor: '#F9FAFB',
        borderBottom: '1px solid #E5E7EB',
        display: 'flex',
        gap: 6,
        overflowX: 'auto'
      }}>
        <button
          onClick={() => handleQuickAction('Customer reported visible black particulate in 500mg batch PA240812.')}
          style={{
            padding: '2px 8px',
            borderRadius: 3,
            backgroundColor: '#FFFFFF',
            border: '1px solid #D1D5DB',
            color: '#374151',
            fontSize: 10,
            fontWeight: 500,
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          Sample Contamination
        </button>

        <button
          onClick={handleEvaluateRisk}
          style={{
            padding: '2px 8px',
            borderRadius: 3,
            backgroundColor: '#FFFFFF',
            border: '1px solid #D1D5DB',
            color: '#374151',
            fontSize: 10,
            fontWeight: 500,
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          Assess Risk
        </button>

        <button
          onClick={handleCheckCompleteness}
          style={{
            padding: '2px 8px',
            borderRadius: 3,
            backgroundColor: '#FFFFFF',
            border: '1px solid #D1D5DB',
            color: '#374151',
            fontSize: 10,
            fontWeight: 500,
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          Check Completeness
        </button>
      </div>

      {/* 3. Main Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {activeTab === 'RISK' && <RiskAssessmentCard />}
        {activeTab === 'COMPLETENESS' && <CompletenessWidget />}
        {activeTab === 'UPLOAD' && <DocumentUpload />}

        {activeTab === 'ASSISTANT' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.length === 0 ? (
              <div style={{
                padding: '24px 16px',
                textAlign: 'center',
                color: '#6B7280',
                backgroundColor: '#F9FAFB',
                borderRadius: 4,
                border: '1px dashed #D1D5DB'
              }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: '#111827' }}>Operational Copilot Ready</p>
                <p style={{ margin: '4px 0 0 0', fontSize: 11 }}>Paste customer email text, request field edits, or upload a Certificate of Analysis.</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '92%'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    marginBottom: 2,
                    fontSize: 10,
                    color: '#6B7280',
                    justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                  }}>
                    {msg.sender === 'assistant' ? <Bot size={11} color="#1D4ED8" /> : <User size={11} />}
                    <span>{msg.sender === 'user' ? 'Operator' : 'AI Copilot'} • {msg.timestamp}</span>
                  </div>

                  <div style={{
                    padding: '8px 10px',
                    borderRadius: 4,
                    backgroundColor: msg.sender === 'user' ? '#1D4ED8' : '#F9FAFB',
                    color: msg.sender === 'user' ? '#FFFFFF' : '#111827',
                    border: msg.sender === 'user' ? 'none' : '1px solid #E5E7EB',
                    fontSize: 11,
                    lineHeight: 1.4,
                    whiteSpace: 'pre-wrap'
                  }}>
                    {msg.text.replace(/\*\*/g, '')}
                  </div>
                </div>
              ))
            )}

            {loading && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 10px',
                backgroundColor: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: 4,
                fontSize: 11,
                color: '#4B5563'
              }}>
                <Loader2 size={13} className="animate-spin" color="#1D4ED8" />
                <span>{statusText}</span>
              </div>
            )}
          </div>
        )}

        <ObservabilityDrawer />
      </div>

      {/* 4. Input Bar */}
      <div style={{
        padding: '10px 12px',
        borderTop: '1px solid #E5E7EB',
        backgroundColor: '#FFFFFF',
        display: 'flex',
        gap: 6
      }}>
        <input
          type="text"
          placeholder="Type natural language instruction or edit..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={loading}
          style={{
            flex: 1,
            height: 32,
            padding: '0 10px',
            borderRadius: 4,
            border: '1px solid #D1D5DB',
            fontSize: 12,
            color: '#111827',
            outline: 'none',
            backgroundColor: '#FFFFFF'
          }}
        />

        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          style={{
            height: 32,
            padding: '0 10px',
            borderRadius: 4,
            backgroundColor: '#1D4ED8',
            color: '#FFFFFF',
            border: 'none',
            fontSize: 11,
            fontWeight: 500,
            cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          <Send size={12} />
          <span>Send</span>
        </button>
      </div>
    </div>
  );
};
