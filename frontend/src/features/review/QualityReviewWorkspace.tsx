import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ProposalReviewModal } from './ProposalReviewModal';
import { LifecycleStepper } from './LifecycleStepper';
import { ComplaintActivityTimeline } from './ComplaintActivityTimeline';
import type { ComplaintData, AIProposalItem, AuditTimelineResponse, PaginatedComplaintList } from '../../types';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  History,
  Clock,
  TrendingUp,
  UserCheck,
  RotateCw,
  Search,
  Eye,
  Filter
} from 'lucide-react';

interface QualityReviewWorkspaceProps {
  currentComplaint: ComplaintData | null;
  onComplaintUpdated: (complaint: ComplaintData) => void;
}

export const QualityReviewWorkspace: React.FC<QualityReviewWorkspaceProps> = ({
  currentComplaint,
  onComplaintUpdated
}) => {
  const [complaint, setComplaint] = useState<ComplaintData | null>(currentComplaint);
  const [proposals, setProposals] = useState<AIProposalItem[]>([]);
  const [timelineData, setTimelineData] = useState<AuditTimelineResponse | null>(null);
  const [loadingProposals, setLoadingProposals] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'REVIEW_DETAIL' | 'QUEUE_LIST' | 'TIMELINE'>('REVIEW_DETAIL');

  // Queue state
  const [queueList, setQueueList] = useState<PaginatedComplaintList | null>(null);
  const [queueSearch, setQueueSearch] = useState<string>('');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // KPI Dashboard metrics
  const [dashboardMetrics, setDashboardMetrics] = useState<{
    total_proposals: number;
    pending_ai_reviews: number;
    approved_proposals: number;
    rejected_proposals: number;
    human_overrides: number;
    ai_override_rate_pct: number;
    ai_acceptance_rate_pct: number;
    high_critical_complaints: number;
    average_review_time_seconds: number;
  } | null>(null);

  // Review Modal state
  const [selectedProposal, setSelectedProposal] = useState<AIProposalItem | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);

  // Feedback notifications
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setComplaint(currentComplaint);
    if (currentComplaint?.id) {
      loadProposals(currentComplaint.id);
      loadTimeline(currentComplaint.id);
    }
    loadDashboardMetrics();
    loadQueue();
  }, [currentComplaint]);

  const loadDashboardMetrics = async () => {
    try {
      const data = await api.fetchReviewerDashboard();
      setDashboardMetrics(data);
    } catch {
      // Fallback
    }
  };

  const loadQueue = async () => {
    try {
      const data = await api.fetchComplaints(1, 20);
      setQueueList(data);
    } catch {
      // Fallback
    }
  };

  const loadProposals = async (complaintId: number) => {
    setLoadingProposals(true);
    try {
      const data = await api.fetchProposals(complaintId);
      setProposals(data);
    } catch (err: any) {
      console.error('Failed to load proposals:', err);
    } finally {
      setLoadingProposals(false);
    }
  };

  const loadTimeline = async (complaintId: number) => {
    try {
      const data = await api.fetchTimeline(complaintId);
      setTimelineData(data);
    } catch (err: any) {
      console.error('Failed to load timeline:', err);
    }
  };

  const handleApprove = async (proposalId: string, notes?: string) => {
    try {
      const res = await api.decideProposal(proposalId, 'APPROVE', undefined, notes || 'Approved by Quality Reviewer');
      setFeedbackMessage({ type: 'success', text: `Proposal ${proposalId} approved and applied.` });
      setComplaint(res.complaint);
      onComplaintUpdated(res.complaint);
      if (complaint?.id) {
        await loadProposals(complaint.id);
        await loadTimeline(complaint.id);
      }
      await loadDashboardMetrics();
      await loadQueue();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Failed to approve proposal' });
      throw err;
    }
  };

  const handleReject = async (proposalId: string, reason: string) => {
    try {
      const res = await api.decideProposal(proposalId, 'REJECT', undefined, reason);
      setFeedbackMessage({ type: 'success', text: `Proposal ${proposalId} rejected.` });
      setComplaint(res.complaint);
      onComplaintUpdated(res.complaint);
      if (complaint?.id) {
        await loadProposals(complaint.id);
        await loadTimeline(complaint.id);
      }
      await loadDashboardMetrics();
      await loadQueue();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Failed to reject proposal' });
      throw err;
    }
  };

  const handleModify = async (proposalId: string, humanValue: string, reason: string) => {
    try {
      const res = await api.decideProposal(proposalId, 'MODIFY', humanValue, reason);
      setFeedbackMessage({
        type: 'success',
        text: `Proposal ${proposalId} modified to "${humanValue}" (Human Override applied).`
      });
      setComplaint(res.complaint);
      onComplaintUpdated(res.complaint);
      if (complaint?.id) {
        await loadProposals(complaint.id);
        await loadTimeline(complaint.id);
      }
      await loadDashboardMetrics();
      await loadQueue();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Failed to modify proposal' });
      throw err;
    }
  };

  const handleLifecycleTransition = async (targetState: string, reason?: string) => {
    if (!complaint?.id) return;
    try {
      const res = await api.transitionComplaint(complaint.id, targetState, reason, 'qa_manager_01');
      setFeedbackMessage({ type: 'success', text: res.message });
      setComplaint(res.complaint);
      onComplaintUpdated(res.complaint);
      await loadTimeline(complaint.id);
      await loadDashboardMetrics();
      await loadQueue();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Failed state transition' });
      throw err;
    }
  };

  const filteredQueue = (queueList?.items || []).filter((item) => {
    const q = queueSearch.toLowerCase();
    const matchSearch = !queueSearch || (
      (item.complaint_number || '').toLowerCase().includes(q) ||
      (item.customer_name || '').toLowerCase().includes(q) ||
      (item.product_name || '').toLowerCase().includes(q) ||
      (item.batch_number || '').toLowerCase().includes(q)
    );
    const matchSeverity = filterSeverity === 'ALL' || item.severity === filterSeverity;
    const matchStatus = filterStatus === 'ALL' || item.status === filterStatus;
    return matchSearch && matchSeverity && matchStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Top Banner */}
      <div
        style={{
          padding: '8px 14px',
          backgroundColor: '#EFF6FF',
          border: '1px solid #BFDBFE',
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: '#1E40AF',
          fontSize: 12
        }}
      >
        <ShieldCheck size={15} color="#1D4ED8" style={{ flexShrink: 0 }} />
        <span>
          <strong>Quality Review Invariant:</strong> AI triage proposals require Qualified Person review. Changes create immutable 21 CFR Part 11 audit records.
        </span>
      </div>

      {/* Feedback Messages */}
      {feedbackMessage && (
        <div
          style={{
            padding: '8px 14px',
            borderRadius: 4,
            backgroundColor: feedbackMessage.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            border: `1px solid ${feedbackMessage.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
            color: feedbackMessage.type === 'success' ? '#065F46' : '#991B1B',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 12,
            fontWeight: 500
          }}
        >
          <span>{feedbackMessage.text}</span>
          <button
            onClick={() => setFeedbackMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 600 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Metrics Dashboard Bar */}
      {dashboardMetrics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          <div style={{ backgroundColor: '#FFFFFF', padding: '10px 12px', borderRadius: 4, border: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6B7280', fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>
              <span>Pending Reviews</span>
              <Clock size={12} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#D97706', marginTop: 2 }}>
              {dashboardMetrics.pending_ai_reviews}
            </div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '10px 12px', borderRadius: 4, border: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6B7280', fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>
              <span>AI Override Rate</span>
              <TrendingUp size={12} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#4B5563', marginTop: 2 }}>
              {dashboardMetrics.ai_override_rate_pct}%
            </div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '10px 12px', borderRadius: 4, border: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6B7280', fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>
              <span>Acceptance Rate</span>
              <CheckCircle2 size={12} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#059669', marginTop: 2 }}>
              {dashboardMetrics.ai_acceptance_rate_pct}%
            </div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '10px 12px', borderRadius: 4, border: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6B7280', fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>
              <span>High / Critical</span>
              <AlertTriangle size={12} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#DC2626', marginTop: 2 }}>
              {dashboardMetrics.high_critical_complaints}
            </div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '10px 12px', borderRadius: 4, border: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6B7280', fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>
              <span>Avg Review Time</span>
              <UserCheck size={12} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1D4ED8', marginTop: 2 }}>
              {dashboardMetrics.average_review_time_seconds}s
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab Navigation: Review Detail vs Queue List vs Audit Timeline */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => setActiveSubTab('REVIEW_DETAIL')}
            style={{
              padding: '8px 12px',
              border: 'none',
              background: 'none',
              fontSize: 13,
              fontWeight: activeSubTab === 'REVIEW_DETAIL' ? 600 : 500,
              color: activeSubTab === 'REVIEW_DETAIL' ? '#1D4ED8' : '#6B7280',
              borderBottom: activeSubTab === 'REVIEW_DETAIL' ? '2px solid #1D4ED8' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>Review Detail ({complaint?.complaint_number || 'Current'})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('QUEUE_LIST')}
            style={{
              padding: '8px 12px',
              border: 'none',
              background: 'none',
              fontSize: 13,
              fontWeight: activeSubTab === 'QUEUE_LIST' ? 600 : 500,
              color: activeSubTab === 'QUEUE_LIST' ? '#1D4ED8' : '#6B7280',
              borderBottom: activeSubTab === 'QUEUE_LIST' ? '2px solid #1D4ED8' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Filter size={13} />
            <span>Operational Queue ({queueList?.total || 0})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('TIMELINE')}
            style={{
              padding: '8px 12px',
              border: 'none',
              background: 'none',
              fontSize: 13,
              fontWeight: activeSubTab === 'TIMELINE' ? 600 : 500,
              color: activeSubTab === 'TIMELINE' ? '#1D4ED8' : '#6B7280',
              borderBottom: activeSubTab === 'TIMELINE' ? '2px solid #1D4ED8' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <History size={13} />
            <span>Audit Trail</span>
          </button>
        </div>

        <button
          onClick={() => {
            if (complaint?.id) {
              loadProposals(complaint.id);
              loadTimeline(complaint.id);
            }
            loadQueue();
            loadDashboardMetrics();
          }}
          style={{
            height: 28,
            padding: '0 10px',
            borderRadius: 4,
            border: '1px solid #D1D5DB',
            backgroundColor: '#FFFFFF',
            color: '#374151',
            fontSize: 11,
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          <RotateCw size={11} />
          <span>Refresh</span>
        </button>
      </div>

      {/* SUBTAB 1: 3-COLUMN REVIEW WORKSPACE */}
      {activeSubTab === 'REVIEW_DETAIL' && (
        complaint ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Lifecycle State Stepper */}
            <LifecycleStepper
              currentStatus={complaint.status || 'PENDING_TRIAGE'}
              onTransition={handleLifecycleTransition}
            />

            {/* 3-Column Review Grid: Left: Meta, Center: Evidence & Details, Right: AI Proposals & Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr 1fr', gap: 12, alignItems: 'start' }}>
              
              {/* LEFT COLUMN: Complaint Information & Scope */}
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: 4, border: '1px solid #E5E7EB', padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F3F4F6', paddingBottom: 6 }}>
                  <h4 style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#111827' }}>
                    Record Information
                  </h4>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#1D4ED8', fontWeight: 600 }}>
                    {complaint.complaint_number || 'DRAFT'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11 }}>
                  <div>
                    <span style={{ color: '#6B7280' }}>Customer:</span>
                    <div style={{ fontWeight: 500, color: '#111827' }}>{complaint.customer_name || 'N/A'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#6B7280' }}>Product Name:</span>
                    <div style={{ fontWeight: 500, color: '#111827' }}>{complaint.product_name || 'N/A'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#6B7280' }}>Strength / Grade:</span>
                    <div style={{ fontWeight: 500, color: '#111827' }}>{complaint.product_strength || 'N/A'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#6B7280' }}>Batch / Lot:</span>
                    <div style={{ fontWeight: 600, color: '#111827', fontFamily: 'var(--font-mono)' }}>{complaint.batch_number || 'N/A'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#6B7280' }}>Quantity Affected:</span>
                    <div style={{ fontWeight: 500, color: '#111827' }}>{complaint.quantity_affected || 'N/A'} {complaint.quantity_unit || 'kg'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#6B7280' }}>Manufacturing Date:</span>
                    <div style={{ fontWeight: 500, color: '#111827' }}>{complaint.manufacturing_date || 'N/A'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#6B7280' }}>Expiry Date:</span>
                    <div style={{ fontWeight: 500, color: '#111827' }}>{complaint.expiry_date || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* CENTER COLUMN: Evidence & Narrative Scope */}
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: 4, border: '1px solid #E5E7EB', padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F3F4F6', paddingBottom: 6 }}>
                  <h4 style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#111827' }}>
                    Evidence & Narrative Details
                  </h4>
                  <span style={{ fontSize: 11, color: '#6B7280' }}>
                    Type: <strong style={{ color: '#111827' }}>{complaint.complaint_type || 'Foreign Matter'}</strong>
                  </span>
                </div>

                <div>
                  <span style={{ color: '#6B7280', fontSize: 10, textTransform: 'uppercase', fontWeight: 600 }}>Customer Narrative</span>
                  <p style={{
                    margin: '4px 0 0 0',
                    fontSize: 11,
                    color: '#111827',
                    backgroundColor: '#F9FAFB',
                    padding: '8px 10px',
                    borderRadius: 4,
                    border: '1px solid #E5E7EB',
                    lineHeight: 1.4
                  }}>
                    {complaint.detailed_description || 'No detailed description provided.'}
                  </p>
                </div>

                {complaint.ai_reasoning && (
                  <div>
                    <span style={{ color: '#6B7280', fontSize: 10, textTransform: 'uppercase', fontWeight: 600 }}>ICH Q9 Quality Rationale</span>
                    <p style={{
                      margin: '4px 0 0 0',
                      fontSize: 11,
                      color: '#1E40AF',
                      backgroundColor: '#EFF6FF',
                      padding: '8px 10px',
                      borderRadius: 4,
                      border: '1px solid #BFDBFE',
                      lineHeight: 1.4
                    }}>
                      {complaint.ai_reasoning}
                    </p>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: AI Proposals & Decision Hierarchy */}
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: 4, border: '1px solid #E5E7EB', padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F3F4F6', paddingBottom: 6 }}>
                  <h4 style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#111827' }}>
                    AI Proposals Queue ({proposals.length})
                  </h4>
                  <span style={{ fontSize: 10, color: '#1D4ED8', backgroundColor: '#EFF6FF', padding: '1px 5px', borderRadius: 3, border: '1px solid #BFDBFE' }}>
                    Conf: {Math.round((complaint.ai_confidence || 0.94) * 100)}%
                  </span>
                </div>

                {loadingProposals ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#9CA3AF', fontSize: 11 }}>Loading proposals...</div>
                ) : proposals.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#F9FAFB', borderRadius: 4, border: '1px dashed #D1D5DB', color: '#6B7280', fontSize: 11 }}>
                    No pending AI proposals for this complaint.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {proposals.map((prop) => {
                      const isPending = prop.status === 'PROPOSED' || prop.status === 'AI_PROPOSED';
                      const isApproved = prop.status === 'APPROVED' || prop.status === 'APPLIED';
                      const isRejected = prop.status === 'REJECTED';

                      return (
                        <div
                          key={prop.id || prop.proposal_id}
                          style={{
                            backgroundColor: isPending ? '#FFFBEB' : '#F9FAFB',
                            borderRadius: 4,
                            border: `1px solid ${isPending ? '#FDE68A' : '#E5E7EB'}`,
                            padding: '10px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 11, color: '#111827' }}>
                              {prop.proposal_id}
                            </span>
                            <span
                              style={{
                                padding: '1px 5px',
                                borderRadius: 3,
                                fontSize: 10,
                                fontWeight: 600,
                                color: isPending ? '#92400E' : isApproved ? '#065F46' : isRejected ? '#991B1B' : '#4B5563',
                                backgroundColor: isPending ? '#FEF3C7' : isApproved ? '#ECFDF5' : isRejected ? '#FEF2F2' : '#F3F4F6'
                              }}
                            >
                              {prop.status}
                            </span>
                          </div>

                          <div style={{ backgroundColor: '#FFFFFF', borderRadius: 3, padding: '6px 8px', border: '1px solid #E5E7EB', marginBottom: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, marginBottom: 2 }}>
                              <span style={{ fontWeight: 500, color: '#4B5563', textTransform: 'capitalize' }}>
                                {prop.field_name.replace(/_/g, ' ')}:
                              </span>
                              <span style={{ color: '#DC2626', textDecoration: 'line-through' }}>
                                {prop.current_value || 'None'}
                              </span>
                              <span>→</span>
                              <span style={{ color: '#059669', fontWeight: 600 }}>
                                {prop.proposed_value}
                              </span>
                            </div>
                            {prop.reason && (
                              <p style={{ margin: 0, fontSize: 10, color: '#6B7280' }}>
                                {prop.reason}
                              </p>
                            )}
                          </div>

                          {isPending ? (
                            <button
                              onClick={() => {
                                setSelectedProposal(prop);
                                setIsReviewModalOpen(true);
                              }}
                              style={{
                                width: '100%',
                                height: 26,
                                borderRadius: 3,
                                border: 'none',
                                backgroundColor: '#1D4ED8',
                                color: '#FFFFFF',
                                fontSize: 11,
                                fontWeight: 500,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 4
                              }}
                            >
                              <span>Review & Decide</span>
                            </button>
                          ) : (
                            <div style={{ fontSize: 10, color: '#4B5563', backgroundColor: '#F3F4F6', padding: '4px 6px', borderRadius: 3 }}>
                              Decision: <strong>{prop.reviewer_notes || prop.status}</strong>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '32px', textAlign: 'center', background: '#FFFFFF', borderRadius: 4, border: '1px solid #E5E7EB' }}>
            <h3 style={{ color: '#111827', fontSize: 14, fontWeight: 600 }}>No Complaint Selected for Detail Review</h3>
            <p style={{ color: '#6B7280', fontSize: 12, marginTop: 4 }}>
              Select a complaint from the operational queue list to inspect details and decide AI proposals.
            </p>
            <button
              onClick={() => setActiveSubTab('QUEUE_LIST')}
              style={{
                marginTop: 10,
                padding: '6px 12px',
                borderRadius: 4,
                backgroundColor: '#1D4ED8',
                color: '#FFFFFF',
                border: 'none',
                fontSize: 11,
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Open Operational Queue
            </button>
          </div>
        )
      )}

      {/* SUBTAB 2: OPERATIONAL QUEUE LIST */}
      {activeSubTab === 'QUEUE_LIST' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 4, border: '1px solid #E5E7EB', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Filters Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                backgroundColor: '#F9FAFB',
                border: '1px solid #D1D5DB',
                borderRadius: 4,
                padding: '3px 8px'
              }}>
                <Search size={13} color="#6B7280" />
                <input
                  type="text"
                  placeholder="Filter by ID, customer, product..."
                  value={queueSearch}
                  onChange={(e) => setQueueSearch(e.target.value)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: 11,
                    color: '#111827',
                    width: 180
                  }}
                />
              </div>

              <select
                className="form-select"
                style={{ height: 28, fontSize: 11, padding: '0 8px' }}
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
              >
                <option value="ALL">All Severities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              <select
                className="form-select"
                style={{ height: 28, fontSize: 11, padding: '0 8px' }}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="ALL">All Lifecycle States</option>
                <option value="PENDING_TRIAGE">Pending Triage</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="INVESTIGATION">Investigation</option>
                <option value="QUALITY_DECISION">Quality Decision</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            <span style={{ fontSize: 11, color: '#6B7280' }}>
              Showing {filteredQueue.length} of {queueList?.total || 0} records
            </span>
          </div>

          {/* Queue Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 11 }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#6B7280', fontSize: 10, textTransform: 'uppercase' }}>
                  <th style={{ padding: '8px 10px' }}>Complaint ID</th>
                  <th style={{ padding: '8px 10px' }}>Customer</th>
                  <th style={{ padding: '8px 10px' }}>Product</th>
                  <th style={{ padding: '8px 10px' }}>Batch</th>
                  <th style={{ padding: '8px 10px' }}>Severity</th>
                  <th style={{ padding: '8px 10px' }}>Priority</th>
                  <th style={{ padding: '8px 10px' }}>Status</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredQueue.map((item) => (
                  <tr key={item.id || item.complaint_number} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: '#111827' }}>
                      {item.complaint_number}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#374151' }}>
                      {item.customer_name || '—'}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#374151' }}>
                      {item.product_name || '—'}
                    </td>
                    <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', color: '#4B5563' }}>
                      {item.batch_number || '—'}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <span className={`badge ${
                        item.severity === 'Critical' ? 'badge-critical' :
                        item.severity === 'High' ? 'badge-high' :
                        item.severity === 'Medium' ? 'badge-medium' : 'badge-low'
                      }`}>
                        {item.severity || 'Medium'}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <span className={`badge ${
                        item.priority === 'Urgent' ? 'badge-urgent' :
                        item.priority === 'High' ? 'badge-high' : 'badge-normal'
                      }`}>
                        {item.priority || 'Normal'}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ fontSize: 10, color: '#4B5563', backgroundColor: '#F3F4F6', padding: '1px 5px', borderRadius: 3 }}>
                        {item.status || 'Pending Triage'}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                      <button
                        onClick={() => {
                          setComplaint(item);
                          onComplaintUpdated(item);
                          setActiveSubTab('REVIEW_DETAIL');
                        }}
                        style={{
                          padding: '3px 8px',
                          borderRadius: 3,
                          backgroundColor: '#1D4ED8',
                          color: '#FFFFFF',
                          border: 'none',
                          fontSize: 11,
                          fontWeight: 500,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3
                        }}
                      >
                        <Eye size={11} />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: AUDIT TIMELINE */}
      {activeSubTab === 'TIMELINE' && (
        <ComplaintActivityTimeline
          events={timelineData?.events || []}
          complaintNumber={complaint?.complaint_number}
        />
      )}

      {/* Proposal Review Modal */}
      <ProposalReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setSelectedProposal(null);
        }}
        proposal={selectedProposal}
        onApprove={handleApprove}
        onReject={handleReject}
        onModify={handleModify}
      />
    </div>
  );
};
