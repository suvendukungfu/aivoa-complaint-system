import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { ComplaintData, QMSAnalytics, PaginatedComplaintList } from '../../types';
import {
  Inbox,
  AlertTriangle,
  CheckCircle2,
  FilePlus2,
  ShieldCheck,
  Search,
  RotateCw
} from 'lucide-react';
import { typography } from '../../design/typography';

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
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [analyticsData, reviewMetrics, complaintsData] = await Promise.all([
        api.fetchAnalytics().catch(() => null),
        api.fetchReviewerDashboard().catch(() => null),
        api.fetchComplaints(1, 10).catch(() => null)
      ]);
      setAnalytics(analyticsData);
      setDashboardMetrics(reviewMetrics);
      setComplaintList(complaintsData);
    } catch {
      // Handled silently
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
      maxWidth: 1320,
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 20
    }}>
      {/* Top Greeting & Operational Shift Summary */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        padding: '16px 20px',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 style={{ ...typography.sectionTitle, fontSize: 18, margin: 0 }}>
              Good morning, Quality Operations
            </h1>
            <span style={{
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--success-text)',
              backgroundColor: 'var(--success-subtle)',
              border: '1px solid var(--success-border)',
              borderRadius: 'var(--radius-xs)',
              padding: '1px 6px'
            }}>
              Shift Active · GxP
            </span>
          </div>
          <p style={{ ...typography.secondary, marginTop: 3 }}>
            {pendingReviews > 0
              ? `${pendingReviews} complaints currently awaiting Quality Review sign-off.`
              : 'All incoming customer complaints have been triaged and reviewed.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={loadData}
            disabled={loading}
            style={{
              padding: '6px 12px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12,
              fontWeight: 500,
              color: 'var(--text-secondary)',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5
            }}
          >
            <RotateCw size={12} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => onNavigate('INTAKE')}
            style={{
              padding: '6px 12px',
              backgroundColor: 'var(--text-primary)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              boxShadow: 'var(--shadow-subtle)'
            }}
          >
            <FilePlus2 size={13} />
            <span>New Complaint</span>
          </button>
        </div>
      </div>

      {/* KPI Cards — Restrained, Number-Dominated */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 14
      }}>
        {/* KPI 1: Pending Reviews */}
        <div
          onClick={() => onNavigate('REVIEW')}
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
            padding: '16px 18px',
            boxShadow: 'var(--shadow-card)',
            cursor: 'pointer',
            transition: 'border-color var(--transition-fast)'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
        >
          <div style={{ ...typography.sectionHeaderLabel, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Pending Review</span>
            <span style={{ color: 'var(--primary)', textTransform: 'none', fontSize: 11, fontWeight: 500 }}>
              Queue →
            </span>
          </div>
          <div style={{
            fontSize: 28,
            fontWeight: 600,
            color: pendingReviews > 0 ? 'var(--warning-text)' : 'var(--text-primary)',
            lineHeight: 1.1,
            fontVariantNumeric: 'tabular-nums'
          }}>
            {pendingReviews}
          </div>
          <div style={{ ...typography.metadata, marginTop: 6 }}>
            {pendingReviews > 0 ? 'Requires human sign-off' : 'Queue cleared'}
          </div>
        </div>

        {/* KPI 2: High & Critical Defects */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: '16px 18px',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ ...typography.sectionHeaderLabel, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>High & Critical</span>
            <AlertTriangle size={13} style={{ color: highCritical > 0 ? 'var(--danger)' : 'var(--text-muted)' }} />
          </div>
          <div style={{
            fontSize: 28,
            fontWeight: 600,
            color: highCritical > 0 ? 'var(--danger-text)' : 'var(--text-primary)',
            lineHeight: 1.1,
            fontVariantNumeric: 'tabular-nums'
          }}>
            {highCritical}
          </div>
          <div style={{ ...typography.metadata, marginTop: 6 }}>
            {highCritical > 0 ? 'Urgent escalation active' : 'No critical safety risks'}
          </div>
        </div>

        {/* KPI 3: Open Complaints */}
        <div
          onClick={() => onNavigate('INTAKE')}
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
            padding: '16px 18px',
            boxShadow: 'var(--shadow-card)',
            cursor: 'pointer',
            transition: 'border-color var(--transition-fast)'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
        >
          <div style={{ ...typography.sectionHeaderLabel, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Active Pipeline</span>
            <Inbox size={13} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div style={{
            fontSize: 28,
            fontWeight: 600,
            color: 'var(--text-primary)',
            lineHeight: 1.1,
            fontVariantNumeric: 'tabular-nums'
          }}>
            {openComplaints}
          </div>
          <div style={{ ...typography.metadata, marginTop: 6 }}>
            Total registered cases
          </div>
        </div>

        {/* KPI 4: AI Acceptance Rate */}
        <div
          onClick={() => onNavigate('ANALYTICS')}
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
            padding: '16px 18px',
            boxShadow: 'var(--shadow-card)',
            cursor: 'pointer',
            transition: 'border-color var(--transition-fast)'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
        >
          <div style={{ ...typography.sectionHeaderLabel, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>AI Acceptance</span>
            <CheckCircle2 size={13} style={{ color: 'var(--success)' }} />
          </div>
          <div style={{
            fontSize: 28,
            fontWeight: 600,
            color: 'var(--text-primary)',
            lineHeight: 1.1,
            fontVariantNumeric: 'tabular-nums'
          }}>
            {acceptanceRate !== null ? `${acceptanceRate}%` : '—'}
          </div>
          <div style={{ ...typography.metadata, marginTop: 6 }}>
            {overrideRate !== null ? `${overrideRate}% human override rate` : 'Accumulating review telemetry'}
          </div>
        </div>
      </div>

      {/* Main Actionable Sections Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
        gap: 16
      }}>
        {/* Left: Active Review Queue Table */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0
        }}>
          <div style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12
          }}>
            <div>
              <h2 style={typography.sectionTitle}>
                Active Review Queue
              </h2>
              <p style={typography.metadata}>
                Complaints awaiting triage or Qualified Person authorization
              </p>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '4px 8px',
              width: '200px'
            }}>
              <Search size={12} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Filter by ID, batch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  background: 'none',
                  outline: 'none',
                  fontSize: 12,
                  width: '100%',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 12,
              textAlign: 'left'
            }}>
              <thead>
                <tr style={{
                  backgroundColor: 'var(--bg-subtle)',
                  borderBottom: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  <th style={{ padding: '8px 16px' }}>ID</th>
                  <th style={{ padding: '8px 12px' }}>Product & Batch</th>
                  <th style={{ padding: '8px 12px' }}>Customer</th>
                  <th style={{ padding: '8px 12px' }}>Severity</th>
                  <th style={{ padding: '8px 12px' }}>Status</th>
                  <th style={{ padding: '8px 16px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No matching complaints found in the active queue.
                    </td>
                  </tr>
                ) : (
                  filteredComplaints.map((item) => (
                    <tr
                      key={item.id || item.complaint_number}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        transition: 'background-color var(--transition-fast)'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--primary)' }}>
                        {item.complaint_number}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                          {item.product_name || '—'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          Batch: {item.batch_number || '—'}
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                        {item.customer_name || '—'}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-xs)',
                          fontSize: 11,
                          fontWeight: 600,
                          backgroundColor:
                            item.severity === 'Critical' ? 'var(--danger-subtle)' :
                            item.severity === 'High' ? 'var(--warning-subtle)' :
                            item.severity === 'Medium' ? 'var(--info-subtle)' : 'var(--bg-subtle)',
                          color:
                            item.severity === 'Critical' ? 'var(--danger-text)' :
                            item.severity === 'High' ? 'var(--warning-text)' :
                            item.severity === 'Medium' ? 'var(--info-text)' : 'var(--text-secondary)',
                          border: `1px solid ${
                            item.severity === 'Critical' ? 'var(--danger-border)' :
                            item.severity === 'High' ? 'var(--warning-border)' :
                            item.severity === 'Medium' ? 'var(--info-border)' : 'var(--border)'
                          }`
                        }}>
                          {item.severity || 'UNASSESSED'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 500,
                          color: item.status === 'APPROVED' ? 'var(--success-text)' : 'var(--text-secondary)'
                        }}>
                          {item.status?.replace('_', ' ') || 'DRAFT'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            onSelectComplaint(item);
                            onNavigate('REVIEW');
                          }}
                          style={{
                            padding: '3px 8px',
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-xs)',
                            fontSize: 11,
                            fontWeight: 500,
                            color: 'var(--primary)',
                            cursor: 'pointer'
                          }}
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Operational Insights & Invariant Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Defect Severity Breakdown */}
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
            padding: '16px 18px',
            boxShadow: 'var(--shadow-card)'
          }}>
            <h2 style={{ ...typography.sectionTitle, marginBottom: 4 }}>
              Defect Distribution
            </h2>
            <p style={{ ...typography.metadata, marginBottom: 14 }}>
              Current severity profile across active complaints
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                  <span style={{ fontWeight: 500, color: 'var(--danger-text)' }}>Critical / High Risk</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{highCritical}</span>
                </div>
                <div style={{ height: 6, backgroundColor: 'var(--bg-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${openComplaints > 0 ? (highCritical / openComplaints) * 100 : 0}%`,
                    backgroundColor: 'var(--danger)'
                  }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                  <span style={{ fontWeight: 500, color: 'var(--warning-text)' }}>Medium / Low Risk</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{Math.max(0, openComplaints - highCritical)}</span>
                </div>
                <div style={{ height: 6, backgroundColor: 'var(--bg-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${openComplaints > 0 ? ((openComplaints - highCritical) / openComplaints) * 100 : 0}%`,
                    backgroundColor: 'var(--warning)'
                  }} />
                </div>
              </div>
            </div>
          </div>

          {/* GxP Review Invariant Card */}
          <div style={{
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
            padding: '14px 16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <ShieldCheck size={14} style={{ color: 'var(--success)' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                21 CFR Part 11 Governance
              </span>
            </div>
            <p style={{ ...typography.secondary, fontSize: 11.5, lineHeight: 1.45 }}>
              All AI-extracted entities remain in a proposed state until reviewed and signed off by an authorized Qualified Person. Every human override preserves the original AI recommendation in the immutable audit ledger.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewDashboard;
