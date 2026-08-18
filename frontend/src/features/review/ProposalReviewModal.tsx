import React, { useState } from 'react';
import type { AIProposalItem } from '../../types';
import { X } from 'lucide-react';
import { getGlassStyle } from '../../design/glass';

interface ProposalReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: AIProposalItem | null;
  onApprove?: (proposalId: string, notes?: string) => Promise<void>;
  onReject?: (proposalId: string, reason: string) => Promise<void>;
  onModify?: (proposalId: string, humanValue: string, reason: string) => Promise<void>;
  onDecision?: (proposalId: string, decision: 'APPROVE' | 'REJECT' | 'OVERRIDE', overrideValue?: string, notes?: string) => Promise<void>;
}

export const ProposalReviewModal: React.FC<ProposalReviewModalProps> = ({
  isOpen,
  onClose,
  proposal,
  onApprove,
  onReject,
  onModify,
  onDecision
}) => {
  const [activeTab, setActiveTab] = useState<'APPROVE' | 'REJECT' | 'MODIFY'>('APPROVE');
  const [rejectReason, setRejectReason] = useState('');
  const [modifiedValue, setModifiedValue] = useState(
    proposal?.field_name === 'severity' ? 'Critical' : proposal?.field_name === 'priority' ? 'Urgent' : proposal?.proposed_value || ''
  );
  const [modifyReason, setModifyReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !proposal) return null;

  const handleExecuteDecision = async () => {
    setSubmitting(true);
    setError(null);
    try {
      if (activeTab === 'APPROVE') {
        if (onDecision) {
          await onDecision(proposal.proposal_id, 'APPROVE', undefined, 'Approved by Quality Reviewer');
        } else if (onApprove) {
          await onApprove(proposal.proposal_id, 'Approved by Quality Reviewer');
        }
      } else if (activeTab === 'REJECT') {
        if (!rejectReason.trim()) {
          setError('Mandatory documented justification required for proposal rejection.');
          setSubmitting(false);
          return;
        }
        if (onDecision) {
          await onDecision(proposal.proposal_id, 'REJECT', undefined, rejectReason.trim());
        } else if (onReject) {
          await onReject(proposal.proposal_id, rejectReason.trim());
        }
      } else if (activeTab === 'MODIFY') {
        const finalVal = modifiedValue.trim() || (proposal.field_name === 'severity' ? 'Critical' : proposal.field_name === 'priority' ? 'Urgent' : proposal.proposed_value);
        if (!finalVal) {
          setError('Please specify the reviewer override value.');
          setSubmitting(false);
          return;
        }
        if (!modifyReason.trim()) {
          setError('Mandatory documented rationale required for human override.');
          setSubmitting(false);
          return;
        }
        if (onDecision) {
          await onDecision(proposal.proposal_id, 'OVERRIDE', finalVal, modifyReason.trim());
        } else if (onModify) {
          await onModify(proposal.proposal_id, finalVal, modifyReason.trim());
        }
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit proposal review decision.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(8, 9, 9, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 250,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          ...getGlassStyle('decision'),
          width: '100%',
          maxWidth: '560px',
          overflow: 'hidden'
        }}
        className="animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>
              Review AI Proposal: {proposal.field_name?.toUpperCase()}
            </h3>
            <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.55)', margin: '2px 0 0' }}>
              Field: <strong style={{ color: '#FFFFFF', textTransform: 'capitalize' }}>{proposal.field_name.replace('_', ' ')}</strong> · <span style={{ color: '#34D399', fontWeight: 600 }}>{Math.round((proposal.confidence_score || 0.98) * 100)}% Conf</span>
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.55)',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Comparison Block */}
        <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              backgroundColor: 'rgba(255, 255, 255, 0.035)',
              padding: '14px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div>
              <div style={{ fontSize: '10.5px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Current Record Value
              </div>
              <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.85)', marginTop: 4 }}>
                {proposal.current_value || 'None (Unset)'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                AI Proposed Value
              </div>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#FFFFFF', marginTop: 4 }}>
                {proposal.proposed_value}
              </div>
            </div>
          </div>

          {/* Justification & Evidence Snippet */}
          {proposal.reason && (
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.025)',
                padding: '10px 12px',
                borderRadius: '8px',
                borderLeft: '2px solid #FFFFFF',
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.75)'
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase', marginBottom: 2 }}>
                Model Rationale
              </div>
              <div>{proposal.reason}</div>
            </div>
          )}

          {/* Action Tabs */}
          <div>
            <div style={{ display: 'flex', gap: 6, backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: 3, borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <button
                type="button"
                onClick={() => setActiveTab('APPROVE')}
                style={{
                  flex: 1,
                  padding: '7px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'APPROVE' ? '#FFFFFF' : 'transparent',
                  color: activeTab === 'APPROVE' ? '#080909' : 'rgba(255, 255, 255, 0.60)',
                  transition: 'all 120ms ease'
                }}
              >
                Approve Proposal
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('MODIFY')}
                style={{
                  flex: 1,
                  padding: '7px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'MODIFY' ? '#FFFFFF' : 'transparent',
                  color: activeTab === 'MODIFY' ? '#080909' : 'rgba(255, 255, 255, 0.60)',
                  transition: 'all 120ms ease'
                }}
              >
                Human Override
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('REJECT')}
                style={{
                  flex: 1,
                  padding: '7px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'REJECT' ? 'rgba(239, 68, 68, 0.20)' : 'transparent',
                  color: activeTab === 'REJECT' ? '#F87171' : 'rgba(255, 255, 255, 0.60)',
                  transition: 'all 120ms ease'
                }}
              >
                Reject Proposal
              </button>
            </div>

            {/* Tab Form Content */}
            <div style={{ marginTop: 12 }}>
              {activeTab === 'APPROVE' && (
                <div style={{ fontSize: '12.5px', color: 'rgba(255, 255, 255, 0.70)', padding: '6px 2px' }}>
                  Confirming approval will immediately accept the AI recommendation, update the active complaint record, and append a verified 21 CFR Part 11 audit log entry.
                </div>
              )}

              {activeTab === 'MODIFY' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.80)', marginBottom: 4 }}>
                      Human Override Value *
                    </label>
                    {proposal.field_name === 'severity' ? (
                      <select
                        value={modifiedValue}
                        onChange={(e) => setModifiedValue(e.target.value)}
                        style={{
                          width: '100%',
                          height: '36px',
                          padding: '0 10px',
                          backgroundColor: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.14)',
                          borderRadius: '6px',
                          color: '#FFFFFF',
                          fontSize: '12.5px',
                          outline: 'none'
                        }}
                      >
                        <option value="Critical" style={{ background: '#111214', color: '#FFFFFF' }}>Critical</option>
                        <option value="High" style={{ background: '#111214', color: '#FFFFFF' }}>High</option>
                        <option value="Medium" style={{ background: '#111214', color: '#FFFFFF' }}>Medium</option>
                        <option value="Low" style={{ background: '#111214', color: '#FFFFFF' }}>Low</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={modifiedValue}
                        onChange={(e) => setModifiedValue(e.target.value)}
                        placeholder="Enter modified value..."
                        style={{
                          width: '100%',
                          height: '36px',
                          padding: '0 10px',
                          backgroundColor: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.14)',
                          borderRadius: '6px',
                          color: '#FFFFFF',
                          fontSize: '12.5px',
                          outline: 'none'
                        }}
                      />
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.80)', marginBottom: 4 }}>
                      Mandatory Justification for Human Override *
                    </label>
                    <textarea
                      value={modifyReason}
                      onChange={(e) => setModifyReason(e.target.value)}
                      placeholder="Potential batch-wide particulate contamination requiring critical escalation..."
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.14)',
                        borderRadius: '6px',
                        color: '#FFFFFF',
                        fontSize: '12px',
                        outline: 'none',
                        resize: 'none'
                      }}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'REJECT' && (
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.80)', marginBottom: 4 }}>
                    Mandatory Justification for Rejection *
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Reviewer determined that evidence indicates packaging defect only..."
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      borderRadius: '6px',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      outline: 'none',
                      resize: 'none'
                    }}
                  />
                </div>
              )}
            </div>

            {error && (
              <div style={{ marginTop: 8, fontSize: '11.5px', color: '#F87171' }}>
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 22px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            backgroundColor: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 14px',
              backgroundColor: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 500,
              color: 'rgba(255, 255, 255, 0.70)',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleExecuteDecision}
            disabled={submitting}
            style={{
              padding: '6px 18px',
              backgroundColor: activeTab === 'REJECT' ? '#EF4444' : '#FFFFFF',
              color: activeTab === 'REJECT' ? '#FFFFFF' : '#080909',
              border: 'none',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer'
            }}
          >
            {submitting ? 'Recording...' : activeTab === 'APPROVE' ? 'Confirm Approval' : activeTab === 'MODIFY' ? 'Apply Human Override' : 'Confirm Rejection'}
          </button>
        </div>
      </div>
    </div>
  );
};
