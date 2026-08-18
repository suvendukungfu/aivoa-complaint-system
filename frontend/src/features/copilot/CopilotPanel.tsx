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
  Bot,
  Send,
  Loader2,
  Paperclip
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

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: 'var(--bg-surface)',
      borderLeft: '1px solid var(--border)',
      minWidth: '320px',
      maxWidth: '420px',
      width: '100%'
    }}>
      {/* Copilot Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: loading ? 'var(--warning)' : 'var(--success)'
          }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            AIVOA Copilot
          </span>
          <span style={{
            fontSize: 10.5,
            fontWeight: 500,
            color: 'var(--text-muted)',
            backgroundColor: 'var(--bg-subtle)',
            padding: '1px 5px',
            borderRadius: 'var(--radius-xs)'
          }}>
            {loading ? 'Processing' : 'Active'}
          </span>
        </div>

        {/* Tab switchers */}
        <div style={{ display: 'flex', gap: 2 }}>
          <button
            onClick={() => setActiveTab('ASSISTANT')}
            style={{
              padding: '3px 8px',
              fontSize: 11,
              fontWeight: 500,
              border: 'none',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: activeTab === 'ASSISTANT' ? 'var(--bg-subtle)' : 'transparent',
              color: activeTab === 'ASSISTANT' ? 'var(--text-primary)' : 'var(--text-muted)',
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
              fontWeight: 500,
              border: 'none',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: activeTab === 'RISK' ? 'var(--bg-subtle)' : 'transparent',
              color: activeTab === 'RISK' ? 'var(--text-primary)' : 'var(--text-muted)',
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
              fontWeight: 500,
              border: 'none',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: activeTab === 'UPLOAD' ? 'var(--bg-subtle)' : 'transparent',
              color: activeTab === 'UPLOAD' ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            Upload
          </button>
        </div>
      </div>

      {/* Suggested Quick Actions Row */}
      {activeTab === 'ASSISTANT' && (
        <div style={{
          padding: '8px 14px',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--bg-subtle)',
          display: 'flex',
          gap: 6,
          overflowX: 'auto'
        }}>
          <button
            onClick={() => handleQuickAction('Assess risk for potential contamination in batch')}
            style={{
              fontSize: 11,
              padding: '3px 7px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xs)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Assess Risk
          </button>
          <button
            onClick={() => handleQuickAction('Check completeness of current complaint')}
            style={{
              fontSize: 11,
              padding: '3px 7px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xs)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Completeness
          </button>
          <button
            onClick={() => handleQuickAction('Update quantity affected to 50 kg')}
            style={{
              fontSize: 11,
              padding: '3px 7px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xs)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Edit Quantity
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
        {activeTab === 'RISK' && <RiskAssessmentCard />}
        {activeTab === 'COMPLETENESS' && <CompletenessWidget />}
        {activeTab === 'UPLOAD' && <DocumentUpload />}

        {activeTab === 'ASSISTANT' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 16px',
                color: 'var(--text-muted)'
              }}>
                <Bot size={28} style={{ margin: '0 auto 10px', color: 'var(--text-light)' }} />
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
                  AIVOA Complaint Assistant
                </div>
                <div style={{ fontSize: 11.5, lineHeight: 1.4 }}>
                  Paste a customer complaint narrative, request field edits, or attach a supporting quality document.
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
                >
                  <div style={{
                    fontSize: 10,
                    color: 'var(--text-muted)',
                    marginBottom: 3,
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                  }}>
                    {msg.sender === 'user' ? 'You' : 'AIVOA Copilot'} · {msg.timestamp || 'Just now'}
                  </div>

                  <div style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: msg.sender === 'user' ? 'var(--primary)' : 'var(--bg-subtle)',
                    color: msg.sender === 'user' ? '#FFFFFF' : 'var(--text-primary)',
                    fontSize: 12.5,
                    lineHeight: 1.45,
                    border: msg.sender === 'user' ? 'none' : '1px solid var(--border)'
                  }}>
                    {msg.text}

                    {/* Updated fields tags */}
                    {msg.updatedFields && msg.updatedFields.length > 0 && (
                      <div style={{
                        marginTop: 8,
                        paddingTop: 6,
                        borderTop: '1px solid var(--border)',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 4
                      }}>
                        {msg.updatedFields.map((f: string, i: number) => (
                          <span
                            key={i}
                            style={{
                              fontSize: 10,
                              padding: '1px 5px',
                              backgroundColor: 'var(--bg-surface)',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-xs)',
                              color: 'var(--primary)',
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
                gap: 8,
                padding: '8px 12px',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 12,
                color: 'var(--text-secondary)'
              }}>
                <Loader2 size={13} className="animate-spin" />
                <span>{statusText || 'Analyzing complaint...'}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Form Bar */}
      {activeTab === 'ASSISTANT' && (
        <div style={{
          padding: '12px 14px',
          borderTop: '1px solid var(--border)',
          backgroundColor: 'var(--bg-surface)',
          flexShrink: 0
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px 8px'
          }}>
            <button
              onClick={() => setActiveTab('UPLOAD')}
              title="Attach quality document"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Paperclip size={14} />
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
                fontSize: 12.5,
                color: 'var(--text-primary)',
                lineHeight: 1.4,
                padding: '2px 0'
              }}
            />

            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              style={{
                padding: '4px 8px',
                backgroundColor: input.trim() && !loading ? 'var(--text-primary)' : 'var(--bg-active)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 'var(--radius-xs)',
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                transition: 'background-color var(--transition-fast)'
              }}
            >
              <Send size={11} />
            </button>
          </div>
          <div style={{
            fontSize: 10,
            color: 'var(--text-muted)',
            marginTop: 4,
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span>Press Enter to send</span>
            <span>Deterministic safety active</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CopilotPanel;
