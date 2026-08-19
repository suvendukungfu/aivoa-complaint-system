import React, { useState } from 'react';
import type { AIProposalItem } from '../../types';
import { X, AlertTriangle, Edit3, FileText, CheckCircle2 } from 'lucide-react';

interface ProposalReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: AIProposalItem | null;
  onApprove: (proposalId: string, notes?: string) => Promise<void>;
  onReject: (proposalId: string, reason: string) => Promise<void>;
  onModify: (proposalId: string, humanValue: string, reason: string) => Promise<void>;
}

export const ProposalReviewModal: React.FC<ProposalReviewModalProps> = ({
  isOpen,
  onClose,
  proposal,
  onApprove,
  onReject,
  onModify
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
        await onApprove(proposal.proposal_id, 'Approved by Quality Reviewer');
      } else if (activeTab === 'REJECT') {
        if (!rejectReason.trim()) {
          setError('Mandatory documented justification required for proposal rejection.');
          setSubmitting(false);
          return;
        }
        await onReject(proposal.proposal_id, rejectReason.trim());
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
        await onModify(proposal.proposal_id, finalVal, modifyReason.trim());
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
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
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
          borderRadius: 6,
          width: '100%',
          maxWidth: '580px',
          boxShadow: '0 12px 24px -4px rgba(16, 24, 40, 0.16)',
          border: '1px solid #E5E7EB',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid #E5E7EB',
            backgroundColor: '#F9FAFB',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827' }}>
              Review AI Proposal: {proposal.field_name.replace(/_/g, ' ').toUpperCase()}
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: 11, color: '#6B7280' }}>
              Proposal ID: <strong>{proposal.proposal_id}</strong> • AI Run: {proposal.ai_run_id || 'AI-93D22C'}
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#6B7280',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: 3
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Comparison Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 4,
                border: '1px solid #E5E7EB',
                backgroundColor: '#F9FAFB'
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>
                Current Record Value
              </span>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginTop: 2 }}>
                {proposal.current_value || 'None / Default'}
              </div>
            </div>

            <div
              style={{
                padding: '10px 12px',
                borderRadius: 4,
                border: '1px solid #BFDBFE',
                backgroundColor: '#EFF6FF'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: '#1D4ED8', textTransform: 'uppercase' }}>
                  AI Recommendation
                </span>
                <span style={{ fontSize: 10, fontWeight: 600, color: '#1D4ED8' }}>
                  {Math.round(proposal.confidence_score * 100)}% Conf
                </span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1E40AF', marginTop: 2 }}>
                {proposal.proposed_value}
              </div>
            </div>
          </div>

          {/* AI Rationale */}
          {proposal.reason && (
            <div style={{ fontSize: 11, color: '#374151', backgroundColor: '#F9FAFB', padding: '8px 10px', borderRadius: 4, border: '1px solid #E5E7EB' }}>
              <strong>AI Rationale: </strong> {proposal.reason}
            </div>
          )}

          {/* Verbatim Evidence Citation */}
          {proposal.reason && (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderLeft: '3px solid #1D4ED8',
                padding: '8px 10px',
                borderRadius: '0 4px 4px 0',
                border: '1px solid #E5E7EB',
                borderLeftWidth: '3px'
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                <FileText size={11} /> Supporting Evidence Citation
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#111827' }}>
                "{proposal.reason}"
              </div>
            </div>
          )}

          {/* Decision Mode Selector Tabs */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#111827', marginBottom: 6 }}>
              Quality Reviewer Disposition
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={() => setActiveTab('APPROVE')}
                style={{
                  flex: 1,
                  height: 32,
                  borderRadius: 4,
                  border: activeTab === 'APPROVE' ? '1px solid #059669' : '1px solid #D1D5DB',
                  backgroundColor: activeTab === 'APPROVE' ? '#ECFDF5' : '#FFFFFF',
                  color: activeTab === 'APPROVE' ? '#065F46' : '#4B5563',
                  fontWeight: activeTab === 'APPROVE' ? 600 : 400,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  fontSize: 12
                }}
              >
                <CheckCircle2 size={13} color={activeTab === 'APPROVE' ? '#059669' : '#6B7280'} />
                <span>Approve AI Value</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('MODIFY')}
                style={{
                  flex: 1,
                  height: 32,
                  borderRadius: 4,
                  border: activeTab === 'MODIFY' ? '1px solid #1D4ED8' : '1px solid #D1D5DB',
                  backgroundColor: activeTab === 'MODIFY' ? '#EFF6FF' : '#FFFFFF',
                  color: activeTab === 'MODIFY' ? '#1E40AF' : '#4B5563',
                  fontWeight: activeTab === 'MODIFY' ? 600 : 400,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  fontSize: 12
                }}
              >
                <Edit3 size={13} color={activeTab === 'MODIFY' ? '#1D4ED8' : '#6B7280'} />
                <span>Human Override</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('REJECT')}
                style={{
                  flex: 1,
                  height: 32,
                  borderRadius: 4,
                  border: activeTab === 'REJECT' ? '1px solid #DC2626' : '1px solid #D1D5DB',
                  backgroundColor: activeTab === 'REJECT' ? '#FEF2F2' : '#FFFFFF',
                  color: activeTab === 'REJECT' ? '#991B1B' : '#4B5563',
                  fontWeight: activeTab === 'REJECT' ? 600 : 400,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  fontSize: 12
                }}
              >
                <AlertTriangle size={13} color={activeTab === 'REJECT' ? '#DC2626' : '#6B7280'} />
                <span>Reject Proposal</span>
              </button>
            </div>
          </div>

          {/* Conditional Input Fields */}
          {activeTab === 'APPROVE' && (
            <div style={{ padding: '8px 10px', backgroundColor: '#ECFDF5', borderRadius: 4, border: '1px solid #A7F3D0', fontSize: 11, color: '#065F46' }}>
              Approving will apply <strong>'{proposal.proposed_value}'</strong> to the complaint record and log an immutable <code>USER_APPROVED</code> audit event.
            </div>
          )}

          {activeTab === 'REJECT' && (
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
                Documented Rejection Justification (Mandatory GxP Record)
              </label>
              <textarea
                rows={2}
                placeholder="Reviewer determined that evidence indicates cosmetic packaging defect only, not bulk API contamination."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 4,
                  border: '1px solid #D1D5DB',
                  fontSize: 12,
                  color: '#111827',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          )}

          {activeTab === 'MODIFY' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
                  Reviewer Override Value
                </label>
                {proposal.field_name === 'severity' ? (
                  <select
                    value={modifiedValue || 'Critical'}
                    onChange={(e) => setModifiedValue(e.target.value)}
                    style={{
                      width: '100%',
                      height: 32,
                      padding: '0 8px',
                      borderRadius: 4,
                      border: '1px solid #1D4ED8',
                      fontSize: 12,
                      fontWeight: 500,
                      backgroundColor: '#FFFFFF'
                    }}
                  >
                    <option value="Critical">Critical (Immediate Quarantine)</option>
                    <option value="High">High (Foreign Particulate / OOS)</option>
                    <option value="Medium">Medium (Secondary Packaging)</option>
                    <option value="Low">Low (Minor Documentation)</option>
                  </select>
                ) : proposal.field_name === 'priority' ? (
                  <select
                    value={modifiedValue || 'Urgent'}
                    onChange={(e) => setModifiedValue(e.target.value)}
                    style={{
                      width: '100%',
                      height: 32,
                      padding: '0 8px',
                      borderRadius: 4,
                      border: '1px solid #1D4ED8',
                      fontSize: 12,
                      fontWeight: 500,
                      backgroundColor: '#FFFFFF'
                    }}
                  >
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Normal">Normal</option>
                    <option value="Low">Low</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder={`Enter override value for ${proposal.field_name}...`}
                    value={modifiedValue}
                    onChange={(e) => setModifiedValue(e.target.value)}
                    style={{
                      width: '100%',
                      height: 32,
                      padding: '0 8px',
                      borderRadius: 4,
                      border: '1px solid #1D4ED8',
                      fontSize: 12,
                      boxSizing: 'border-box'
                    }}
                  />
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
                  Documented Override Rationale (Preserves both AI & Human values)
                </label>
                <textarea
                  rows={2}
                  placeholder="Potential batch-wide particulate contamination requires immediate critical escalation."
                  value={modifyReason}
                  onChange={(e) => setModifyReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: 4,
                    border: '1px solid #D1D5DB',
                    fontSize: 12,
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          )}

          {error && (
            <div style={{ padding: '6px 10px', backgroundColor: '#FEF2F2', color: '#991B1B', borderRadius: 4, border: '1px solid #FECACA', fontSize: 11, fontWeight: 500 }}>
              {error}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '10px 16px',
            borderTop: '1px solid #E5E7EB',
            backgroundColor: '#F9FAFB',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: 10, color: '#6B7280' }}>
            21 CFR Part 11 Electronic Signature & Decision Enforcement
          </span>

          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={onClose}
              disabled={submitting}
              style={{
                height: 30,
                padding: '0 12px',
                borderRadius: 4,
                border: '1px solid #D1D5DB',
                backgroundColor: '#FFFFFF',
                color: '#4B5563',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              onClick={handleExecuteDecision}
              disabled={submitting}
              style={{
                height: 30,
                padding: '0 14px',
                borderRadius: 4,
                border: 'none',
                backgroundColor: activeTab === 'REJECT' ? '#DC2626' : '#1D4ED8',
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: 500,
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? 'Submitting...' : activeTab === 'APPROVE' ? 'Confirm Approval' : activeTab === 'REJECT' ? 'Confirm Rejection' : 'Apply Human Override'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
