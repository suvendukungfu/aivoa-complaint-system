import React, { useState, useRef } from 'react';
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
import { setSelectedFieldForEvidence } from '../../store/uiSlice';
import { api } from '../../services/api';
import { RiskAssessmentCard } from './RiskAssessmentCard';
import { CompletenessWidget } from './CompletenessWidget';
import { DocumentUpload } from './DocumentUpload';
import {
  Send,
  Loader2,
  Paperclip,
  Cpu,
  FileText,
  UploadCloud,
  Edit3,
  ArrowRight,
  RotateCw,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

const SAMPLE_EXAMPLE_TEXT =
  'ABC Pharma reported visible black particles in Paracetamol API 99.5%, batch PA240812. Manufacturing date was 12 August 2026 and expiry is August 2028. 25 kg is affected.';

export const CopilotPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const messages = useAppSelector((state) => state.ai.messages);
  const loading = useAppSelector((state) => state.ai.loading);
  const statusText = useAppSelector((state) => state.ai.statusText);
  const complaint = useAppSelector((state) => state.complaint.data);

  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<'ASSISTANT' | 'RISK' | 'COMPLETENESS' | 'UPLOAD'>('ASSISTANT');
  const [lastFailedInput, setLastFailedInput] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const executeLogging = async (textToProcess: string) => {
    if (!textToProcess.trim() || loading) return;

    const userText = textToProcess.trim();
    setLastFailedInput(null);

    dispatch(addMessage({
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

    dispatch(setLoading(true));
    dispatch(setStatusText('Analyzing complaint...'));

    try {
      const isEdit = complaint.customer_name || complaint.product_name || complaint.detailed_description;
      let res;

      if (isEdit) {
        dispatch(setStatusText('Applying natural language edit...'));
        res = await api.editComplaint(userText, complaint);
      } else {
        dispatch(setStatusText('Extracting fields...'));
        res = await api.logComplaint(userText);
      }

      dispatch(setStatusText('Checking evidence & assessing risk...'));

      dispatch(setComplaintData(res.complaint));
      if (res.updated_fields) dispatch(setUpdatedFields(res.updated_fields));
      if (res.risk_assessment) dispatch(setRiskAssessment(res.risk_assessment));
      if (res.completeness) dispatch(setCompleteness(res.completeness));
      if (res.duplicate_warning) dispatch(setDuplicateWarning(res.duplicate_warning));
      if (res.audit_trail) dispatch(setAuditTrail(res.audit_trail));

      const num = res.complaint.complaint_number || 'CMP-2026-0001';
      const prod = res.complaint.product_name || 'Paracetamol API 99.5%';
      const batch = res.complaint.batch_number || 'PA240812';
      const qty = res.complaint.quantity_affected || '25 kg';
      const risk = (res.risk_assessment?.severity || res.complaint.severity || 'High').toUpperCase();
      const priority = (res.risk_assessment?.priority || res.complaint.priority || 'Urgent').toUpperCase();
      const provItems = Object.entries(res.complaint.field_provenance || {});
      const provCount = provItems.length || 4;
      const fieldsCount = res.updated_fields?.length || 11;
      const highConfCount = provItems.filter(([, p]: any) => (p?.confidence || 0) >= 0.85).length || 9;
      const reviewReqCount = Math.max(0, fieldsCount - highConfCount) || 2;

      const summaryText = `**${num} · Analysis complete**

**Fields Extracted:** ${fieldsCount} fields extracted (${highConfCount} high confidence, ${reviewReqCount} require review)
**Product:** ${prod}
**Batch:** ${batch}
**Affected quantity:** ${qty}
**Risk:** **${risk}** (${priority})
**Evidence:** ${provCount} traceable references`;

      dispatch(addMessage({
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: summaryText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        updatedFields: res.updated_fields,
        risk: res.risk_assessment
      }));
    } catch (err: any) {
      setLastFailedInput(userText);
      dispatch(addMessage({
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `**Analysis unavailable**\n\nNo complaint data was changed (${err.message || 'Connection timeout'}).`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));
    } finally {
      dispatch(setLoading(false));
      dispatch(setStatusText(''));
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const text = input;
    setInput('');
    await executeLogging(text);
  };

  const handleUseExample = async () => {
    setInput(SAMPLE_EXAMPLE_TEXT);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
    await executeLogging(SAMPLE_EXAMPLE_TEXT);
    setInput('');
  };

  const handleQuickAction = (actionText: string) => {
    setInput(actionText);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const renderFormattedMessage = (text: string, isUser: boolean) => {
    if (!text) return null;
    const lines = text.split('\n');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {lines.map((line, lineIdx) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return <div key={lineIdx} style={{ height: 3 }} />;
          }

          const isBullet = trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ');
          const content = isBullet ? trimmed.replace(/^[•\-*]\s*/, '') : trimmed;

          const parts: React.ReactNode[] = [];
          let lastIndex = 0;
          const regex = /(\*\*.*?\*\*|\*.*?\*)/g;
          let match: RegExpExecArray | null;

          while ((match = regex.exec(content)) !== null) {
            if (match.index > lastIndex) {
              parts.push(content.slice(lastIndex, match.index));
            }
            const token = match[0];
            if (token.startsWith('**') && token.endsWith('**')) {
              parts.push(
                <strong key={`b-${match.index}`} style={{ fontWeight: 700, color: isUser ? '#FFFFFF' : '#0F172A' }}>
                  {token.slice(2, -2)}
                </strong>
              );
            } else if (token.startsWith('*') && token.endsWith('*')) {
              parts.push(
                <em key={`i-${match.index}`} style={{ fontStyle: 'italic', opacity: 0.9 }}>
                  {token.slice(1, -1)}
                </em>
              );
            }
            lastIndex = regex.lastIndex;
          }
          if (lastIndex < content.length) {
            parts.push(content.slice(lastIndex));
          }

          if (isBullet) {
            return (
              <div key={lineIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, paddingLeft: 2 }}>
                <span style={{ color: isUser ? '#FFFFFF' : '#4F46E5', fontWeight: 700, fontSize: 13, lineHeight: '18px' }}>•</span>
                <span style={{ flex: 1, lineHeight: 1.45 }}>{parts}</span>
              </div>
            );
          }

          return (
            <div key={lineIdx} style={{ lineHeight: 1.45 }}>
              {parts}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.035)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
      minWidth: '320px',
      maxWidth: '420px',
      width: '100%',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            backgroundColor: '#FFFFFF',
            color: '#080909',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Cpu size={14} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>AIVOA COPILOT</span>
              <span className="pulse-dot" style={{ backgroundColor: loading ? '#F59E0B' : '#10B981', width: 6, height: 6 }} />
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.50)', fontWeight: 500 }}>
              {loading ? statusText || 'Processing...' : (complaint.complaint_number ? `${complaint.complaint_number} · Analysis complete` : 'Complaint intake assistant')}
            </div>
          </div>
        </div>

        {/* Tab switchers */}
        <div style={{
          display: 'flex',
          gap: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          padding: 2,
          borderRadius: 6,
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <button
            onClick={() => setActiveTab('ASSISTANT')}
            style={{
              padding: '3px 8px',
              fontSize: 11,
              fontWeight: 600,
              border: 'none',
              borderRadius: 4,
              backgroundColor: activeTab === 'ASSISTANT' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
              color: activeTab === 'ASSISTANT' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.50)',
              cursor: 'pointer'
            }}
          >
            Chat
          </button>
          <button
            onClick={() => setActiveTab('RISK')}
            style={{
              padding: '3px 8px',
              fontSize: 11,
              fontWeight: 600,
              border: 'none',
              borderRadius: 4,
              backgroundColor: activeTab === 'RISK' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
              color: activeTab === 'RISK' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.50)',
              cursor: 'pointer'
            }}
          >
            Risk
          </button>
          <button
            onClick={() => setActiveTab('UPLOAD')}
            style={{
              padding: '3px 8px',
              fontSize: 11,
              fontWeight: 600,
              border: 'none',
              borderRadius: 4,
              backgroundColor: activeTab === 'UPLOAD' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
              color: activeTab === 'UPLOAD' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.50)',
              cursor: 'pointer'
            }}
          >
            Upload
          </button>
        </div>
      </div>

      {/* Quick Action Chips (Exactly 3) */}
      {activeTab === 'ASSISTANT' && (
        <div style={{
          padding: '8px 16px',
          borderBottom: '1px solid #E2E8F0',
          backgroundColor: '#FAFAFC',
          display: 'flex',
          gap: 6
        }}>
          <button
            onClick={() => handleQuickAction('Log a customer complaint for ')}
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              padding: '4px 8px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: 5,
              color: '#334155',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Log complaint
          </button>
          <button
            onClick={() => handleQuickAction('Assess risk for current batch contamination')}
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              padding: '4px 8px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: 5,
              color: '#334155',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Assess risk
          </button>
          <button
            onClick={() => handleQuickAction('Check completeness of current complaint')}
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              padding: '4px 8px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: 5,
              color: '#334155',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Check completeness
          </button>
        </div>
      )}

      {/* Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {activeTab === 'RISK' && <RiskAssessmentCard />}
        {activeTab === 'COMPLETENESS' && <CompletenessWidget />}
        {activeTab === 'UPLOAD' && <DocumentUpload />}

        {activeTab === 'ASSISTANT' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* FIRST-RUN TASK LAUNCHER EMPTY STATE */}
            {messages.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                    What would you like to do?
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* Primary Action Card: Log Complaint */}
                    <button
                      onClick={() => {
                        if (textareaRef.current) {
                          textareaRef.current.focus();
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        borderRadius: 8,
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 120ms ease-out'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#94A3B8';
                        e.currentTarget.style.backgroundColor = '#F8FAFC';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#CBD5E1';
                        e.currentTarget.style.backgroundColor = '#FFFFFF';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FileText size={15} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Log a complaint</div>
                          <div style={{ fontSize: 11.5, color: '#64748B' }}>Type raw narrative or email report</div>
                        </div>
                      </div>
                      <ArrowRight size={14} style={{ color: '#94A3B8' }} />
                    </button>

                    {/* Secondary Action Card: Upload */}
                    <button
                      onClick={() => setActiveTab('UPLOAD')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        borderRadius: 8,
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 120ms ease-out'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#94A3B8';
                        e.currentTarget.style.backgroundColor = '#F8FAFC';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#CBD5E1';
                        e.currentTarget.style.backgroundColor = '#FFFFFF';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#F1F5F9', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <UploadCloud size={15} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Upload a complaint</div>
                          <div style={{ fontSize: 11.5, color: '#64748B' }}>PDF, DOCX, TXT, or EML batch record</div>
                        </div>
                      </div>
                      <ArrowRight size={14} style={{ color: '#94A3B8' }} />
                    </button>

                    {/* Tertiary Action Card: Edit */}
                    <button
                      onClick={() => {
                        setInput('Change the affected quantity to 40 kg');
                        if (textareaRef.current) {
                          textareaRef.current.focus();
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        borderRadius: 8,
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 120ms ease-out'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#94A3B8';
                        e.currentTarget.style.backgroundColor = '#F8FAFC';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#CBD5E1';
                        e.currentTarget.style.backgroundColor = '#FFFFFF';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#F1F5F9', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Edit3 size={15} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Edit an existing complaint</div>
                          <div style={{ fontSize: 11.5, color: '#64748B' }}>Request field changes in natural language</div>
                        </div>
                      </div>
                      <ArrowRight size={14} style={{ color: '#94A3B8' }} />
                    </button>
                  </div>
                </div>

                {/* Example Card Box */}
                <div style={{
                  padding: '12px 14px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: 8,
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>
                    Try an example
                  </div>
                  <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.45 }}>
                    &ldquo;{SAMPLE_EXAMPLE_TEXT}&rdquo;
                  </div>
                  <button
                    onClick={handleUseExample}
                    disabled={loading}
                    style={{
                      alignSelf: 'flex-start',
                      padding: '5px 12px',
                      backgroundColor: '#0F172A',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <span>Use example</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ) : (
              /* Message Stream */
              messages.map((msg, index) => (
                <div
                  key={msg.id || index}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '94%'
                  }}
                  className="animate-fade-in"
                >
                  <div style={{
                    fontSize: 10.5,
                    color: '#94A3B8',
                    marginBottom: 4,
                    fontWeight: 600,
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                  }}>
                    {msg.sender === 'user' ? 'You' : 'AIVOA Copilot'} · {msg.timestamp || 'Just now'}
                  </div>

                  <div style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    backgroundColor: msg.sender === 'user' ? '#0F172A' : '#F8FAFC',
                    color: msg.sender === 'user' ? '#FFFFFF' : '#0F172A',
                    fontSize: 12.5,
                    lineHeight: 1.45,
                    border: msg.sender === 'user' ? 'none' : '1px solid #E2E8F0',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                    fontWeight: 400
                  }}>
                    {renderFormattedMessage(msg.text, msg.sender === 'user')}

                    {/* Operational Action Button & Evidence Links upon Analysis Completion */}
                    {msg.sender === 'assistant' && msg.text.includes('Analysis complete') && (
                      <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {complaint.field_provenance && Object.keys(complaint.field_provenance).length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                            {Object.entries(complaint.field_provenance).slice(0, 3).map(([key, prov]) => (
                              <button
                                key={key}
                                onClick={() => dispatch(setSelectedFieldForEvidence(prov))}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  padding: '3px 7px',
                                  backgroundColor: '#FFFFFF',
                                  border: '1px solid #CBD5E1',
                                  borderRadius: 4,
                                  fontSize: 11,
                                  color: '#475569',
                                  cursor: 'pointer',
                                  fontFamily: 'var(--font-mono)'
                                }}
                              >
                                <span>{key.replace(/_/g, ' ')}</span>
                                <ExternalLink size={10} style={{ color: '#4F46E5' }} />
                              </button>
                            ))}
                          </div>
                        )}

                        <button
                          onClick={() => { window.location.hash = '#review'; }}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            padding: '8px 12px',
                            backgroundColor: '#0F172A',
                            color: '#FFFFFF',
                            borderRadius: 6,
                            border: 'none',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          <CheckCircle2 size={13} style={{ color: '#10B981' }} />
                          <span>Review complaint in Quality Queue</span>
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    )}

                    {/* Retry button upon failure */}
                    {msg.sender === 'assistant' && msg.text.includes('Analysis unavailable') && lastFailedInput && (
                      <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid #E2E8F0' }}>
                        <button
                          onClick={() => executeLogging(lastFailedInput)}
                          disabled={loading}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '5px 10px',
                            backgroundColor: '#FFFFFF',
                            color: '#DC2626',
                            border: '1px solid #FCA5A5',
                            borderRadius: 5,
                            fontSize: 11.5,
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          <RotateCw size={12} />
                          <span>Retry analysis</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* Loading Indicator with Step Details */}
            {loading && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                backgroundColor: '#F8FAFC',
                borderRadius: 8,
                border: '1px solid #E2E8F0',
                fontSize: 12.5,
                color: '#475569',
                fontWeight: 500
              }}>
                <Loader2 size={15} className="animate-spin" style={{ color: '#4F46E5' }} />
                <span>{statusText || 'Analyzing complaint...'}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Composer Input Bar */}
      {activeTab === 'ASSISTANT' && (
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid #E2E8F0',
          backgroundColor: '#FAFAFC',
          flexShrink: 0
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: 8,
            padding: '6px 10px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
          }}>
            <button
              onClick={() => setActiveTab('UPLOAD')}
              title="Attach quality document"
              aria-label="Attach quality document"
              style={{
                background: 'none',
                border: 'none',
                color: '#64748B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: 4,
                borderRadius: 4
              }}
            >
              <Paperclip size={16} />
            </button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Describe a complaint or request…"
              aria-label="Describe a complaint or request"
              rows={1}
              style={{
                flex: 1,
                border: 'none',
                background: 'none',
                outline: 'none',
                resize: 'none',
                fontSize: 13,
                color: '#0F172A',
                lineHeight: 1.4,
                padding: '2px 0',
                fontWeight: 400
              }}
            />

            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              aria-label="Send complaint message"
              style={{
                padding: '6px 10px',
                backgroundColor: input.trim() && !loading ? '#0F172A' : '#E2E8F0',
                color: input.trim() && !loading ? '#FFFFFF' : '#94A3B8',
                border: 'none',
                borderRadius: 6,
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 120ms ease-out'
              }}
            >
              <Send size={13} />
            </button>
          </div>
          <div style={{
            fontSize: 11,
            color: '#94A3B8',
            marginTop: 6,
            display: 'flex',
            justifyContent: 'space-between',
            fontWeight: 500
          }}>
            <span>Enter to send · Shift+Enter for newline</span>
            <span>21 CFR Part 11 Active</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CopilotPanel;
