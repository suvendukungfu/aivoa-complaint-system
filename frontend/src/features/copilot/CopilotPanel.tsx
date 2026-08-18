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
import { api } from '../../services/api';
import { RiskAssessmentCard } from './RiskAssessmentCard';
import { CompletenessWidget } from './CompletenessWidget';
import { DocumentUpload } from './DocumentUpload';
import {
  Send,
  Loader2,
  Paperclip,
  Cpu
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
        text: `Analysis complete · ${fieldsCount} fields extracted with traceable evidence · Risk assessed as ${riskLevel}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        updatedFields: res.updated_fields,
        risk: res.risk_assessment
      }));
    } catch (err: any) {
      dispatch(addMessage({
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `AI analysis unavailable (${err.message || 'Connection timeout'}). No complaint data was changed.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));
    } finally {
      dispatch(setLoading(false));
      dispatch(setStatusText(''));
    }
  };

  const handleQuickAction = (actionText: string) => {
    setInput(actionText);
  };

  const renderFormattedMessage = (text: string, isUser: boolean) => {
    if (!text) return null;
    const lines = text.split('\n');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {lines.map((line, lineIdx) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return <div key={lineIdx} style={{ height: 4 }} />;
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
      backgroundColor: '#FFFFFF',
      borderLeft: '1px solid #E2E8F0',
      minWidth: '320px',
      maxWidth: '420px',
      width: '100%',
      boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)'
    }}>
      {/* Copilot Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        backgroundColor: '#FAFAFC'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            background: 'linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(79, 70, 229, 0.3)'
          }}>
            <Cpu size={15} />
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>AIVOA Copilot</span>
              <span className="pulse-dot" style={{ backgroundColor: loading ? '#F59E0B' : '#10B981', width: 6, height: 6 }} />
            </div>
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>
              {loading ? statusText || 'Analyzing...' : 'Gemma2-9B · GxP Agent'}
            </div>
          </div>
        </div>

        {/* Tab switchers */}
        <div style={{
          display: 'flex',
          gap: 2,
          backgroundColor: '#F1F5F9',
          padding: 3,
          borderRadius: 8,
          border: '1px solid #E2E8F0'
        }}>
          <button
            onClick={() => setActiveTab('ASSISTANT')}
            style={{
              padding: '4px 9px',
              fontSize: 11.5,
              fontWeight: 600,
              border: 'none',
              borderRadius: 6,
              backgroundColor: activeTab === 'ASSISTANT' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'ASSISTANT' ? '#4F46E5' : '#64748B',
              boxShadow: activeTab === 'ASSISTANT' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              cursor: 'pointer',
              transition: 'all 120ms ease-out'
            }}
          >
            Chat
          </button>
          <button
            onClick={() => setActiveTab('RISK')}
            style={{
              padding: '4px 9px',
              fontSize: 11.5,
              fontWeight: 600,
              border: 'none',
              borderRadius: 6,
              backgroundColor: activeTab === 'RISK' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'RISK' ? '#4F46E5' : '#64748B',
              boxShadow: activeTab === 'RISK' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              cursor: 'pointer',
              transition: 'all 120ms ease-out'
            }}
          >
            Risk
          </button>
          <button
            onClick={() => setActiveTab('UPLOAD')}
            style={{
              padding: '4px 9px',
              fontSize: 11.5,
              fontWeight: 600,
              border: 'none',
              borderRadius: 6,
              backgroundColor: activeTab === 'UPLOAD' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'UPLOAD' ? '#4F46E5' : '#64748B',
              boxShadow: activeTab === 'UPLOAD' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              cursor: 'pointer',
              transition: 'all 120ms ease-out'
            }}
          >
            Upload
          </button>
        </div>
      </div>

      {/* Suggested Quick Actions Row */}
      {activeTab === 'ASSISTANT' && (
        <div style={{
          padding: '10px 16px',
          borderBottom: '1px solid #E2E8F0',
          backgroundColor: '#FAFAFC',
          display: 'flex',
          gap: 6,
          overflowX: 'auto'
        }}>
          <button
            onClick={() => handleQuickAction('Assess risk for potential contamination in batch')}
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              padding: '4px 10px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: 6,
              color: '#334155',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
              transition: 'all 120ms ease-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#EEF2FF';
              e.currentTarget.style.borderColor = '#C7D2FE';
              e.currentTarget.style.color = '#4338CA';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.borderColor = '#CBD5E1';
              e.currentTarget.style.color = '#334155';
            }}
          >
            Assess Risk
          </button>
          <button
            onClick={() => handleQuickAction('Check completeness of current complaint')}
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              padding: '4px 10px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: 6,
              color: '#334155',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
              transition: 'all 120ms ease-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#EEF2FF';
              e.currentTarget.style.borderColor = '#C7D2FE';
              e.currentTarget.style.color = '#4338CA';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.borderColor = '#CBD5E1';
              e.currentTarget.style.color = '#334155';
            }}
          >
            Completeness
          </button>
          <button
            onClick={() => handleQuickAction('Update quantity affected to 50 kg')}
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              padding: '4px 10px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: 6,
              color: '#334155',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
              transition: 'all 120ms ease-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#EEF2FF';
              e.currentTarget.style.borderColor = '#C7D2FE';
              e.currentTarget.style.color = '#4338CA';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.borderColor = '#CBD5E1';
              e.currentTarget.style.color = '#334155';
            }}
          >
            Edit Quantity
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {activeTab === 'RISK' && <RiskAssessmentCard />}
        {activeTab === 'COMPLETENESS' && <CompletenessWidget />}
        {activeTab === 'UPLOAD' && <DocumentUpload />}

        {activeTab === 'ASSISTANT' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {messages.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '48px 16px',
                color: '#94A3B8'
              }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: '#EEF2FF',
                  color: '#4F46E5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  boxShadow: '0 2px 8px rgba(79, 70, 229, 0.15)'
                }}>
                  <Cpu size={22} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
                  AIVOA Complaint Assistant
                </div>
                <div style={{ fontSize: 12.5, lineHeight: 1.5, color: '#64748B' }}>
                  Paste a customer complaint narrative, request natural language edits, or attach a supporting batch certificate.
                </div>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={msg.id || index}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '92%'
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
                    borderRadius: 10,
                    backgroundColor: msg.sender === 'user' ? '#4F46E5' : '#F8FAFC',
                    color: msg.sender === 'user' ? '#FFFFFF' : '#0F172A',
                    fontSize: 13,
                    lineHeight: 1.5,
                    border: msg.sender === 'user' ? 'none' : '1px solid #E2E8F0',
                    boxShadow: msg.sender === 'user' ? '0 2px 6px rgba(79, 70, 229, 0.25)' : '0 1px 2px rgba(0,0,0,0.02)',
                    fontWeight: 500
                  }}>
                    {renderFormattedMessage(msg.text, msg.sender === 'user')}

                    {/* Updated fields tags */}
                    {msg.updatedFields && msg.updatedFields.length > 0 && (
                      <div style={{
                        marginTop: 10,
                        paddingTop: 8,
                        borderTop: '1px solid rgba(0,0,0,0.06)',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 5
                      }}>
                        {msg.updatedFields.map((f: string, i: number) => (
                          <span
                            key={i}
                            style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              padding: '2px 7px',
                              backgroundColor: '#FFFFFF',
                              border: '1px solid #C7D2FE',
                              borderRadius: 5,
                              color: '#4338CA',
                              fontFamily: 'var(--font-mono)'
                            }}
                          >
                            +{f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {loading && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                backgroundColor: '#F8FAFC',
                borderRadius: 10,
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

      {/* Input Form Bar */}
      {activeTab === 'ASSISTANT' && (
        <div style={{
          padding: '14px 16px',
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
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Describe complaint or request change..."
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
                fontWeight: 500
              }}
            />

            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              style={{
                padding: '6px 10px',
                background: input.trim() && !loading ? 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)' : '#E2E8F0',
                color: input.trim() && !loading ? '#FFFFFF' : '#94A3B8',
                border: 'none',
                borderRadius: 6,
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                boxShadow: input.trim() && !loading ? '0 2px 6px rgba(79, 70, 229, 0.3)' : 'none',
                transition: 'all 140ms ease-out'
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
            <span>Press Enter to send</span>
            <span>Deterministic GxP Safety Active</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CopilotPanel;
