import React, { useState } from 'react';
import type { AIProposalItem } from '../../types';
import { X, AlertTriangle, Edit3, CheckCircle2 } from 'lucide-react';

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
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
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
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          width: '100%',
          maxWidth: '580px',
          boxShadow: 'var(--shadow-modal)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden'
        }}
        className="animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '16px 22px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#FAFAFC'
        }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Review AI Proposal: {proposal.field_name?.toUpperCase()}
            </h3>
            <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0' }}>
              Field: <strong style={{ color: '#4F46E5', textTransform: 'capitalize' }}>{proposal.field_name.replace('_', ' ')}</strong> · <span style={{ color: '#059669', fontWeight: 600 }}>{Math.round((proposal.confidence_score || 0.98) * 100)}% Conf</span>
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748B',
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
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            backgroundColor: '#F8FAFC',
            padding: '14px',
            borderRadius: 10,
            border: '1px solid #E2E8F0'
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Current Record Value
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginTop: 4 }}>
                {proposal.current_value || 'None (Unset)'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                AI Proposed Value
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#4F46E5', marginTop: 4 }}>
                {proposal.proposed_value}
              </div>
            </div>
          </div>

          {proposal.reason && (
            <div style={{
              fontSize: 12,
              color: '#475569',
              backgroundColor: '#EEF2FF',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #C7D2FE',
              lineHeight: 1.4
            }}>
              <strong>AI Model Rationale:</strong> {proposal.reason}
            </div>
          )}

          {/* Action Tabs */}
          <div style={{
            display: 'flex',
            gap: 6,
            backgroundColor: '#F1F5F9',
            padding: 4,
            borderRadius: 8,
            border: '1px solid #E2E8F0'
          }}>
            <button
              onClick={() => setActiveTab('APPROVE')}
              style={{
                flex: 1,
                padding: '7px 12px',
                fontSize: 12.5,
                fontWeight: 600,
                border: 'none',
                borderRadius: 6,
                backgroundColor: activeTab === 'APPROVE' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'APPROVE' ? '#059669' : '#64748B',
                boxShadow: activeTab === 'APPROVE' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5
              }}
            >
              <CheckCircle2 size={13} />
              <span>Approve AI Value</span>
            </button>

            <button
              onClick={() => setActiveTab('MODIFY')}
              style={{
                flex: 1,
                padding: '7px 12px',
                fontSize: 12.5,
                fontWeight: 600,
                border: 'none',
                borderRadius: 6,
                backgroundColor: activeTab === 'MODIFY' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'MODIFY' ? '#4F46E5' : '#64748B',
                boxShadow: activeTab === 'MODIFY' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5
              }}
            >
              <Edit3 size={13} />
              <span>Human Override</span>
            </button>

            <button
              onClick={() => setActiveTab('REJECT')}
              style={{
                flex: 1,
                padding: '7px 12px',
                fontSize: 12.5,
                fontWeight: 600,
                border: 'none',
                borderRadius: 6,
                backgroundColor: activeTab === 'REJECT' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'REJECT' ? '#DC2626' : '#64748B',
                boxShadow: activeTab === 'REJECT' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5
              }}
            >
              <AlertTriangle size={13} />
              <span>Reject Proposal</span>
            </button>
          </div>

          {/* Tab Content Fields */}
          {activeTab === 'APPROVE' && (
            <div style={{
              fontSize: 12.5,
              color: '#334155',
              backgroundColor: '#ECFDF5',
              padding: '12px',
              borderRadius: 8,
              border: '1px solid #A7F3D0',
              lineHeight: 1.5
            }}>
              Adopting the proposed value <strong style={{ color: '#065F46' }}>"{proposal.proposed_value}"</strong> will update the official complaint record and log an immutable signature to the 21 CFR Part 11 audit ledger.
            </div>
          )}

          {activeTab === 'MODIFY' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Reviewer Override Value *
                </label>
                {proposal.field_name === 'severity' ? (
                  <select
                    value={modifiedValue}
                    onChange={(e) => setModifiedValue(e.target.value)}
                    style={{
                      width: '100%',
                      height: 36,
                      padding: '0 10px',
                      borderRadius: 6,
                      border: '1px solid #CBD5E1',
                      fontSize: 12.5,
                      fontWeight: 600
                    }}
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={modifiedValue}
                    onChange={(e) => setModifiedValue(e.target.value)}
                    style={{
                      width: '100%',
                      height: 36,
                      padding: '0 12px',
                      borderRadius: 6,
                      border: '1px solid #CBD5E1',
                      fontSize: 12.5,
                      fontWeight: 600
                    }}
                  />
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Documented Justification (Mandatory GxP Rationale) *
                </label>
                <textarea
                  value={modifyReason}
                  onChange={(e) => setModifyReason(e.target.value)}
                  placeholder="Potential batch-wide particulate contamination requires immediate critical escalation..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: '1px solid #CBD5E1',
                    fontSize: 12.5,
                    lineHeight: 1.4
                  }}
                />
              </div>
            </div>
          )}

          {activeTab === 'REJECT' && (
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                Rejection Justification (Mandatory GxP Reason) *
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reviewer determined that evidence indicates packaging defect only..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: '1px solid #CBD5E1',
                  fontSize: 12.5,
                  lineHeight: 1.4
                }}
              />
            </div>
          )}

          {error && (
            <div style={{ fontSize: 12, color: '#DC2626', fontWeight: 600, backgroundColor: '#FEF2F2', padding: '8px 12px', borderRadius: 6, border: '1px solid #FECACA' }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '14px 22px',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 10,
          backgroundColor: '#FAFAFC'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '7px 14px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: 7,
              fontSize: 12.5,
              fontWeight: 600,
              color: '#475569',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleExecuteDecision}
            disabled={submitting}
            style={{
              padding: '7px 18px',
              background: activeTab === 'REJECT'
                ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                : 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 7,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)'
            }}
          >
            {submitting ? 'Signing...' : activeTab === 'APPROVE' ? 'Confirm Approval' : activeTab === 'MODIFY' ? 'Apply Human Override' : 'Confirm Rejection'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProposalReviewModal;
