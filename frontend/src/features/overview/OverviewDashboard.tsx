import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { ComplaintData, QMSAnalytics, PaginatedComplaintList } from '../../types';
import {
  Inbox,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  FilePlus2,
  CheckSquare,
  ShieldCheck,
  Search,
  RotateCw,
  Eye
} from 'lucide-react';

interface OverviewDashboardProps {
  onNavigate: (view: 'INTAKE' | 'REVIEW' | 'TIMELINE' | 'DOCUMENTS' | 'ANALYTICS' | 'SYSTEM_HEALTH') => void;
  onSelectComplaint: (complaint: ComplaintData) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  onNavigate,
  onSelectComplaint
}) => {
  const [analytics, setAnalytics] = useState<QMSAnalytics | null>(null);
  const [dashboardMetrics, setDashboardMetrics] = useState<any | null>(null);
  const [complaintList, setComplaintList] = useState<PaginatedComplaintList | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsData, reviewMetrics, complaintsData] = await Promise.all([
        api.fetchAnalytics().catch(() => null),
        api.fetchReviewerDashboard().catch(() => null),
        api.fetchComplaints(1, 10).catch(() => null)
      ]);
      setAnalytics(analyticsData);
      setDashboardMetrics(reviewMetrics);
      setComplaintList(complaintsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openComplaints = analytics?.total_complaints ?? complaintList?.total ?? 0;
  const pendingReviews = dashboardMetrics?.pending_ai_reviews ?? analytics?.pending_triage_count ?? 0;
  const highCritical = dashboardMetrics?.high_critical_complaints ?? analytics?.high_critical_count ?? 0;
  const acceptanceRate = dashboardMetrics?.ai_acceptance_rate_pct ?? (dashboardMetrics ? 100 : null);
  const overrideRate = dashboardMetrics?.ai_override_rate_pct ?? (dashboardMetrics ? 0 : null);

  const filteredComplaints = (complaintList?.items || []).filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.complaint_number || '').toLowerCase().includes(q) ||
      (c.customer_name || '').toLowerCase().includes(q) ||
      (c.product_name || '').toLowerCase().includes(q) ||
      (c.batch_number || '').toLowerCase().includes(q)
    );
  });

  return (
    <div style={{
      maxWidth: 1440,
      margin: '0 auto',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      color: '#111827'
    }}>
      {/* Top Greeting & Operational Shift Summary */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: 6,
        padding: '16px 20px',
        boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 style={{ fontSize: 18, fontWeight: 600, color: '#111827', margin: 0 }}>
              Good morning, Quality Team
            </h1>
            <span style={{
              fontSize: 11,
              fontWeight: 500,
              backgroundColor: '#ECFDF5',
              color: '#065F46',
              border: '1px solid #A7F3D0',
              padding: '1px 6px',
              borderRadius: 3
            }}>
              Operational Shift Active
            </span>
          </div>
          <p style={{ fontSize: 12, color: '#6B7280', margin: '4px 0 0 0' }}>
            Pharmaceutical QMS Complaint Intake & Quality Assurance Workspace
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => onNavigate('INTAKE')}
            style={{
              height: 32,
              padding: '0 12px',
              borderRadius: 4,
              backgroundColor: '#1D4ED8',
              color: '#FFFFFF',
              border: 'none',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5
            }}
          >
            <FilePlus2 size={14} />
            <span>New Complaint</span>
          </button>

          <button
            onClick={loadData}
            style={{
              height: 32,
              padding: '0 10px',
              borderRadius: 4,
              backgroundColor: '#FFFFFF',
              color: '#374151',
              border: '1px solid #D1D5DB',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <RotateCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '10px 14px',
          backgroundColor: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: 4,
          color: '#991B1B',
          fontSize: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          <AlertTriangle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* 4 Core Operational Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <div
          onClick={() => onNavigate('REVIEW')}
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: 6,
            padding: '14px 16px',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6B7280', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Open Complaints</span>
            <Inbox size={14} color="#1D4ED8" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginTop: 4 }}>
            {openComplaints}
          </div>
          <span style={{ fontSize: 11, color: '#6B7280' }}>Total active in QMS ledger</span>
        </div>

        <div
          onClick={() => onNavigate('REVIEW')}
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: 6,
            padding: '14px 16px',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#D97706', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Pending Review</span>
            <Clock size={14} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#D97706', marginTop: 4 }}>
            {pendingReviews}
          </div>
          <span style={{ fontSize: 11, color: '#6B7280' }}>Awaiting Qualified Person decision</span>
        </div>

        <div
          onClick={() => onNavigate('REVIEW')}
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: 6,
            padding: '14px 16px',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#DC2626', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>
            <span>High & Critical Defect</span>
            <AlertTriangle size={14} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#DC2626', marginTop: 4 }}>
            {highCritical}
          </div>
          <span style={{ fontSize: 11, color: '#6B7280' }}>Urgent triage priority</span>
        </div>

        <div
          onClick={() => onNavigate('ANALYTICS')}
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: 6,
            padding: '14px 16px',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>
            <span>AI Acceptance Rate</span>
            <CheckCircle2 size={14} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#059669', marginTop: 4 }}>
            {acceptanceRate !== null ? `${acceptanceRate}%` : '—'}
          </div>
          <span style={{ fontSize: 11, color: '#6B7280' }}>
            {overrideRate !== null ? `Override rate: ${overrideRate}%` : 'Awaiting review metrics'}
          </span>
        </div>
      </div>

      {/* Main Grid: Operational Review Queue & Risk Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: 14 }}>
        {/* Left: Operational Review Queue Table */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: 6,
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckSquare size={15} color="#1D4ED8" />
                Active Review Queue
              </h2>
              <p style={{ fontSize: 11, color: '#6B7280', margin: '2px 0 0 0' }}>
                Customer complaints requiring verification and Qualified Person sign-off
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                backgroundColor: '#F9FAFB',
                border: '1px solid #D1D5DB',
                borderRadius: 4,
                padding: '2px 8px'
              }}>
                <Search size={13} color="#6B7280" />
                <input
                  type="text"
                  placeholder="Filter queue..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: 11,
                    color: '#111827',
                    width: 120
                  }}
                />
              </div>

              <button
                onClick={() => onNavigate('REVIEW')}
                style={{
                  height: 28,
                  padding: '0 8px',
                  borderRadius: 4,
                  backgroundColor: '#EFF6FF',
                  color: '#1D4ED8',
                  border: '1px solid #BFDBFE',
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                View Full Queue
              </button>
            </div>
          </div>

          {filteredComplaints.length === 0 ? (
            <div style={{
              padding: '32px',
              textAlign: 'center',
              backgroundColor: '#F9FAFB',
              borderRadius: 4,
              border: '1px dashed #D1D5DB',
              color: '#6B7280'
            }}>
              <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: '#111827' }}>No complaints yet</p>
              <p style={{ fontSize: 11, margin: '4px 0 12px 0' }}>Complaints logged through intake or parsed from documents will appear here.</p>
              <button
                onClick={() => onNavigate('INTAKE')}
                style={{
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
                Create First Complaint
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 11 }}>
                <thead>
                  <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#6B7280', fontSize: 10, textTransform: 'uppercase' }}>
                    <th style={{ padding: '6px 10px' }}>Complaint ID</th>
                    <th style={{ padding: '6px 10px' }}>Customer</th>
                    <th style={{ padding: '6px 10px' }}>Product</th>
                    <th style={{ padding: '6px 10px' }}>Batch</th>
                    <th style={{ padding: '6px 10px' }}>Severity</th>
                    <th style={{ padding: '6px 10px' }}>Status</th>
                    <th style={{ padding: '6px 10px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComplaints.slice(0, 6).map((c) => (
                    <tr key={c.id || c.complaint_number} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '7px 10px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: '#111827' }}>
                        {c.complaint_number}
                      </td>
                      <td style={{ padding: '7px 10px', color: '#374151' }}>
                        {c.customer_name || '—'}
                      </td>
                      <td style={{ padding: '7px 10px', color: '#374151' }}>
                        {c.product_name || '—'}
                      </td>
                      <td style={{ padding: '7px 10px', fontFamily: 'var(--font-mono)', color: '#4B5563' }}>
                        {c.batch_number || '—'}
                      </td>
                      <td style={{ padding: '7px 10px' }}>
                        <span className={`badge ${
                          c.severity === 'Critical' ? 'badge-critical' :
                          c.severity === 'High' ? 'badge-high' :
                          c.severity === 'Medium' ? 'badge-medium' : 'badge-low'
                        }`}>
                          {c.severity || 'Medium'}
                        </span>
                      </td>
                      <td style={{ padding: '7px 10px' }}>
                        <span style={{ fontSize: 10, color: '#4B5563', backgroundColor: '#F3F4F6', padding: '1px 5px', borderRadius: 3 }}>
                          {c.status || 'Pending Triage'}
                        </span>
                      </td>
                      <td style={{ padding: '7px 10px', textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            onSelectComplaint(c);
                            onNavigate('REVIEW');
                          }}
                          style={{
                            padding: '3px 8px',
                            borderRadius: 3,
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #D1D5DB',
                            color: '#1D4ED8',
                            fontSize: 11,
                            fontWeight: 500,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3
                          }}
                        >
                          <Eye size={11} />
                          <span>Review</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Operational Quality Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Defect Severity Breakdown */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: 6,
            padding: '16px',
            boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)'
          }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={14} color="#1D4ED8" />
              Defect Severity Distribution
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(analytics?.severity_distribution || { Critical: 0, High: 0, Medium: 0, Low: 0 }).map(([sev, count]) => {
                const total = Math.max(openComplaints, 1);
                const pct = Math.round((Number(count) / total) * 100);
                return (
                  <div key={sev}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                      <span style={{ color: '#374151' }}>{sev}</span>
                      <span style={{ fontWeight: 600, color: '#111827' }}>{count} ({pct}%)</span>
                    </div>
                    <div style={{ height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          backgroundColor:
                            sev === 'Critical' ? '#DC2626' :
                            sev === 'High' ? '#D97706' :
                            sev === 'Medium' ? '#1D4ED8' : '#059669'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* GxP Invariant Notice Card */}
          <div style={{
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: 6,
            padding: '14px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10
          }}>
            <ShieldCheck size={16} color="#1D4ED8" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 11, color: '#1E40AF', lineHeight: 1.4 }}>
              <strong>GxP Review Invariant:</strong> All AI triage extractions and risk assignments remain in <code>PROPOSED</code> state until verified and approved by authorized QA Personnel.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
