import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ProposalReviewModal } from './ProposalReviewModal';
import { LifecycleStepper } from './LifecycleStepper';
import { ComplaintActivityTimeline } from './ComplaintActivityTimeline';
import type { ComplaintData, AIProposalItem, AuditTimelineResponse, PaginatedComplaintList } from '../../types';
import {
  CheckCircle2,
  AlertTriangle,
  History,
  Clock,
  TrendingUp,
  RotateCw,
  Search,
  Eye,
  Filter,
  FileText
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

  const handleSelectComplaintFromQueue = (item: ComplaintData) => {
    setComplaint(item);
    onComplaintUpdated(item);
    if (item.id) {
      loadProposals(item.id);
      loadTimeline(item.id);
    }
    setActiveSubTab('REVIEW_DETAIL');
  };

  const handleOpenReviewModal = (proposal: AIProposalItem) => {
    setSelectedProposal(proposal);
    setIsReviewModalOpen(true);
  };

  const handleProposalDecision = async (
    proposalId: string,
    decision: 'APPROVE' | 'REJECT' | 'OVERRIDE',
    overrideValue?: string,
    notes?: string
  ) => {
    if (!complaint?.id) return;

    try {
      const res = await api.decideProposal(
        proposalId,
        decision === 'OVERRIDE' ? 'MODIFY' : decision,
        overrideValue,
        notes,
        'Dr. Marcus Vance (QP)'
      );

      const updated = res.complaint;
      setComplaint(updated);
      onComplaintUpdated(updated);
      await loadProposals(complaint.id);
      await loadTimeline(complaint.id);
      await loadDashboardMetrics();
      await loadQueue();

      setIsReviewModalOpen(false);
      setSelectedProposal(null);
      setFeedbackMessage({
        type: 'success',
        text: `Proposal decision '${decision}' successfully applied and logged to 21 CFR Part 11 ledger.`
      });

      setTimeout(() => setFeedbackMessage(null), 5000);
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err.message || 'Failed to submit review decision.'
      });
    }
  };

  const filteredQueue = (queueList?.items || []).filter((c) => {
    const matchesSearch =
      !queueSearch ||
      (c.complaint_number || '').toLowerCase().includes(queueSearch.toLowerCase()) ||
      (c.customer_name || '').toLowerCase().includes(queueSearch.toLowerCase()) ||
      (c.product_name || '').toLowerCase().includes(queueSearch.toLowerCase()) ||
      (c.batch_number || '').toLowerCase().includes(queueSearch.toLowerCase());

    const matchesSeverity = filterSeverity === 'ALL' || c.severity === filterSeverity;
    const matchesStatus = filterStatus === 'ALL' || c.status === filterStatus;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  return (
    <div style={{
      maxWidth: 1360,
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }} className="animate-fade-in">
      {/* Feedback Banner */}
      {feedbackMessage && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: 8,
            backgroundColor: feedbackMessage.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            border: `1px solid ${feedbackMessage.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
            color: feedbackMessage.type === 'success' ? '#065F46' : '#991B1B',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 13,
            fontWeight: 600
          }}
          className="animate-slide-up"
        >
          <span>{feedbackMessage.text}</span>
          <button
            onClick={() => setFeedbackMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Metrics Dashboard Bar */}
      {dashboardMetrics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div style={{ backgroundColor: '#FFFFFF', padding: '14px 16px', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <span>Pending Reviews</span>
              <Clock size={14} style={{ color: '#D97706' }} />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#B45309', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
              {dashboardMetrics.pending_ai_reviews}
            </div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '14px 16px', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <span>AI Override Rate</span>
              <TrendingUp size={14} style={{ color: '#64748B' }} />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
              {dashboardMetrics.ai_override_rate_pct}%
            </div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '14px 16px', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <span>Acceptance Rate</span>
              <CheckCircle2 size={14} style={{ color: '#10B981' }} />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#059669', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
              {dashboardMetrics.ai_acceptance_rate_pct}%
            </div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '14px 16px', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <span>Critical / High Risk</span>
              <AlertTriangle size={14} style={{ color: '#DC2626' }} />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#DC2626', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
              {dashboardMetrics.high_critical_complaints}
            </div>
          </div>
        </div>
      )}

      {/* Primary Tab Navigation & Action Bar */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        border: '1px solid #E2E8F0',
        padding: '8px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => setActiveSubTab('REVIEW_DETAIL')}
            style={{
              padding: '8px 14px',
              border: 'none',
              borderRadius: 7,
              backgroundColor: activeSubTab === 'REVIEW_DETAIL' ? '#EEF2FF' : 'transparent',
              fontSize: 13,
              fontWeight: activeSubTab === 'REVIEW_DETAIL' ? 700 : 500,
              color: activeSubTab === 'REVIEW_DETAIL' ? '#4F46E5' : '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 120ms ease-out'
            }}
          >
            <Eye size={14} />
            <span>Review Cockpit {complaint?.complaint_number ? `(${complaint.complaint_number})` : ''}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('QUEUE_LIST')}
            style={{
              padding: '8px 14px',
              border: 'none',
              borderRadius: 7,
              backgroundColor: activeSubTab === 'QUEUE_LIST' ? '#EEF2FF' : 'transparent',
              fontSize: 13,
              fontWeight: activeSubTab === 'QUEUE_LIST' ? 700 : 500,
              color: activeSubTab === 'QUEUE_LIST' ? '#4F46E5' : '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 120ms ease-out'
            }}
          >
            <Filter size={14} />
            <span>Operational Queue ({queueList?.total || 0})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('TIMELINE')}
            style={{
              padding: '8px 14px',
              border: 'none',
              borderRadius: 7,
              backgroundColor: activeSubTab === 'TIMELINE' ? '#EEF2FF' : 'transparent',
              fontSize: 13,
              fontWeight: activeSubTab === 'TIMELINE' ? 700 : 500,
              color: activeSubTab === 'TIMELINE' ? '#4F46E5' : '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 120ms ease-out'
            }}
          >
            <History size={14} />
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
            height: 32,
            padding: '0 12px',
            borderRadius: 7,
            border: '1px solid #CBD5E1',
            backgroundColor: '#FFFFFF',
            color: '#475569',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            transition: 'all 120ms ease-out'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
        >
          <RotateCw size={12} className={loadingProposals ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* SUBTAB 1: REVIEW COCKPIT */}
      {activeSubTab === 'REVIEW_DETAIL' && (
        <>
          {!complaint ? (
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              border: '1px solid #E2E8F0',
              padding: '60px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12
            }}>
              <FileText size={40} style={{ color: '#CBD5E1' }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                No Complaint Selected for Review
              </h3>
              <p style={{ fontSize: 13, color: '#64748B', maxWidth: 420, margin: 0 }}>
                Select a pending complaint from the Operational Queue to inspect evidence, review AI proposals, or submit a quality decision.
              </p>
              <button
                onClick={() => setActiveSubTab('QUEUE_LIST')}
                style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: 6,
                  boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)'
                }}
              >
                Open Operational Queue
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Lifecycle Stage Header Bar */}
              <LifecycleStepper
                currentStatus={complaint.status || 'DRAFT'}
                onTransition={async (targetStatus: string, reason?: string) => {
                  if (!complaint.id) return;
                  const res = await api.transitionComplaint(complaint.id, targetStatus, reason, 'Dr. Marcus Vance (QP)');
                  if (res.complaint) {
                    setComplaint(res.complaint);
                    onComplaintUpdated(res.complaint);
                    loadTimeline(complaint.id);
                    loadDashboardMetrics();
                  }
                }}
              />

              {/* 3-Column Review Grid: Left: Meta, Center: Evidence & Details, Right: AI Proposals & Actions */}
              <div className="review-cockpit-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, alignItems: 'start' }}>
                
                {/* LEFT COLUMN: Complaint Information & Scope */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', padding: '18px', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: 8 }}>
                    <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>
                      Record Information
                    </h4>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: '#4F46E5', fontWeight: 700, backgroundColor: '#EEF2FF', padding: '2px 6px', borderRadius: 4 }}>
                      {complaint.complaint_number || 'DRAFT'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12.5 }}>
                    <div>
                      <span style={{ color: '#64748B', fontWeight: 500 }}>Customer:</span>
                      <div style={{ fontWeight: 600, color: '#0F172A', marginTop: 1 }}>{complaint.customer_name || 'N/A'}</div>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', fontWeight: 500 }}>Product Name:</span>
                      <div style={{ fontWeight: 600, color: '#0F172A', marginTop: 1 }}>{complaint.product_name || 'N/A'}</div>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', fontWeight: 500 }}>Strength / Grade:</span>
                      <div style={{ fontWeight: 600, color: '#0F172A', marginTop: 1 }}>{complaint.product_strength || 'N/A'}</div>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', fontWeight: 500 }}>Batch / Lot:</span>
                      <div style={{ fontWeight: 700, color: '#0F172A', fontFamily: 'var(--font-mono)', marginTop: 1 }}>{complaint.batch_number || 'N/A'}</div>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', fontWeight: 500 }}>Quantity Affected:</span>
                      <div style={{ fontWeight: 600, color: '#0F172A', marginTop: 1 }}>{complaint.quantity_affected || 'N/A'} {complaint.quantity_unit || 'kg'}</div>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', fontWeight: 500 }}>Manufacturing Date:</span>
                      <div style={{ fontWeight: 600, color: '#0F172A', marginTop: 1 }}>{complaint.manufacturing_date || 'N/A'}</div>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', fontWeight: 500 }}>Expiry Date:</span>
                      <div style={{ fontWeight: 600, color: '#0F172A', marginTop: 1 }}>{complaint.expiry_date || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                {/* CENTER COLUMN: Evidence & Narrative Scope */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', padding: '18px', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: 8 }}>
                    <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>
                      Observation & Traceability
                    </h4>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#059669', backgroundColor: '#ECFDF5', padding: '2px 8px', borderRadius: 20 }}>
                      Grounded
                    </span>
                  </div>

                  <div>
                    <span style={{ color: '#64748B', fontSize: 12, fontWeight: 600 }}>Classification:</span>
                    <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2, fontSize: 13 }}>
                      {complaint.complaint_type || 'Foreign Matter'}
                    </div>
                  </div>

                  <div>
                    <span style={{ color: '#64748B', fontSize: 12, fontWeight: 600 }}>Observation Description:</span>
                    <div style={{
                      backgroundColor: '#F8FAFC',
                      padding: '12px',
                      borderRadius: 8,
                      border: '1px solid #E2E8F0',
                      fontSize: 12.5,
                      lineHeight: 1.5,
                      color: '#1E293B',
                      marginTop: 4,
                      fontWeight: 500
                    }}>
                      {complaint.detailed_description || 'No description recorded.'}
                    </div>
                  </div>

                  <div>
                    <span style={{ color: '#64748B', fontSize: 12, fontWeight: 600 }}>ICH Q9 Risk Level:</span>
                    <div style={{ marginTop: 4 }}>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 700,
                        backgroundColor: complaint.severity === 'Critical' ? '#FEF2F2' : '#FFFBEB',
                        color: complaint.severity === 'Critical' ? '#991B1B' : '#92400E',
                        border: `1px solid ${complaint.severity === 'Critical' ? '#FECACA' : '#FDE68A'}`
                      }}>
                        {complaint.severity || 'High'} Severity
                      </span>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: AI Proposal Decision Cockpit */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', padding: '18px', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: 8 }}>
                    <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>
                      AI Proposal Decision
                    </h4>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#4F46E5', backgroundColor: '#EEF2FF', padding: '2px 8px', borderRadius: 20 }}>
                      HITL
                    </span>
                  </div>

                  {loadingProposals ? (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: '#94A3B8', fontSize: 12.5 }}>
                      Loading pending proposals...
                    </div>
                  ) : proposals.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '24px 12px',
                      backgroundColor: '#F8FAFC',
                      borderRadius: 8,
                      border: '1px dashed #CBD5E1',
                      color: '#64748B',
                      fontSize: 12.5
                    }}>
                      No pending AI proposals for this record. All values verified.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {proposals.map((prop) => (
                        <div
                          key={prop.proposal_id}
                          style={{
                            padding: '14px',
                            backgroundColor: '#F8FAFC',
                            borderRadius: 10,
                            border: '1px solid #E2E8F0',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', textTransform: 'capitalize' }}>
                              {prop.field_name.replace('_', ' ')}
                            </span>
                            <span style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#059669',
                              backgroundColor: '#ECFDF5',
                              padding: '1px 6px',
                              borderRadius: 4
                            }}>
                              {Math.round(prop.confidence_score * 100)}% Conf
                            </span>
                          </div>

                          <div style={{ fontSize: 12, color: '#475569' }}>
                            Proposed: <strong style={{ color: '#4F46E5' }}>{prop.proposed_value}</strong>
                          </div>

                          {prop.reason && (
                            <div style={{ fontSize: 11.5, color: '#64748B', lineHeight: 1.4 }}>
                              {prop.reason}
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                            <button
                              onClick={() => handleOpenReviewModal(prop)}
                              style={{
                                flex: 1,
                                padding: '6px 10px',
                                background: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                                boxShadow: '0 1px 3px rgba(79, 70, 229, 0.25)'
                              }}
                            >
                              Review & Decide
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* SUBTAB 2: OPERATIONAL QUEUE LIST */}
      {activeSubTab === 'QUEUE_LIST' && (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Filter Bar */}
          <div style={{
            padding: '14px 18px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10,
            backgroundColor: '#FAFAFC'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: 8,
              padding: '6px 12px',
              width: '260px'
            }}>
              <Search size={14} style={{ color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search queue..."
                value={queueSearch}
                onChange={(e) => setQueueSearch(e.target.value)}
                style={{
                  border: 'none',
                  background: 'none',
                  outline: 'none',
                  fontSize: 12.5,
                  width: '100%',
                  color: '#0F172A',
                  fontWeight: 500
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                style={{
                  height: 32,
                  padding: '0 10px',
                  borderRadius: 6,
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#334155'
                }}
              >
                <option value="ALL">All Severities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  height: 32,
                  padding: '0 10px',
                  borderRadius: 6,
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#334155'
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="PENDING_TRIAGE">Pending Triage</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="APPROVED">Approved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{
                  backgroundColor: '#F8FAFC',
                  borderBottom: '1px solid #E2E8F0',
                  color: '#475569',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  <th style={{ padding: '10px 18px', textAlign: 'left' }}>Complaint ID</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left' }}>Product & Batch</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left' }}>Customer</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left' }}>Severity</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '10px 18px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredQueue.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px 16px', textAlign: 'center', color: '#94A3B8' }}>
                      No complaints found in operational queue.
                    </td>
                  </tr>
                ) : (
                  filteredQueue.map((item) => (
                    <tr
                      key={item.id || item.complaint_number}
                      style={{ borderBottom: '1px solid #F1F5F9', transition: 'background-color 120ms ease-out' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '12px 18px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#4F46E5' }}>
                        {item.complaint_number}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 600, color: '#0F172A' }}>{item.product_name || '—'}</div>
                        <div style={{ fontSize: 11.5, color: '#64748B', fontFamily: 'var(--font-mono)' }}>
                          Batch: {item.batch_number || '—'}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#475569', fontWeight: 500 }}>
                        {item.customer_name || '—'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontSize: 11.5,
                          fontWeight: 700,
                          backgroundColor:
                            item.severity === 'Critical' ? '#FEF2F2' :
                            item.severity === 'High' ? '#FFFBEB' :
                            item.severity === 'Medium' ? '#F0F9FF' : '#F1F5F9',
                          color:
                            item.severity === 'Critical' ? '#991B1B' :
                            item.severity === 'High' ? '#92400E' :
                            item.severity === 'Medium' ? '#0369A1' : '#475569',
                          border: `1px solid ${
                            item.severity === 'Critical' ? '#FECACA' :
                            item.severity === 'High' ? '#FDE68A' :
                            item.severity === 'Medium' ? '#BAE6FD' : '#E2E8F0'
                          }`
                        }}>
                          {item.severity || 'UNASSESSED'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: 11.5, fontWeight: 600, color: item.status === 'APPROVED' ? '#059669' : '#475569' }}>
                          {item.status?.replace('_', ' ') || 'DRAFT'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleSelectComplaintFromQueue(item)}
                          style={{
                            padding: '4px 10px',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #CBD5E1',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#4F46E5',
                            cursor: 'pointer'
                          }}
                        >
                          Inspect →
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: AUDIT TIMELINE */}
      {activeSubTab === 'TIMELINE' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.06)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 14 }}>
            21 CFR Part 11 Audit Trail & Event Stream
          </h3>
          {timelineData ? (
            <ComplaintActivityTimeline
              events={timelineData.events}
              complaintNumber={timelineData.complaint_number}
            />
          ) : (
            <div style={{ color: '#94A3B8', textAlign: 'center', padding: '30px 0', fontSize: 13 }}>
              Select a complaint record to view its immutable audit stream.
            </div>
          )}
        </div>
      )}

      {/* HITL Review Decision Modal */}
      {isReviewModalOpen && selectedProposal && (
        <ProposalReviewModal
          isOpen={isReviewModalOpen}
          proposal={selectedProposal}
          onClose={() => {
            setIsReviewModalOpen(false);
            setSelectedProposal(null);
          }}
          onDecision={handleProposalDecision}
        />
      )}
    </div>
  );
};

export default QualityReviewWorkspace;
