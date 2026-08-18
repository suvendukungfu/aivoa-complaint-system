import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { ComplaintData, QMSAnalytics, PaginatedComplaintList } from '../../types';
import {
  Inbox,
  AlertTriangle,
  CheckCircle2,
  FilePlus2,
  Search,
  RotateCw,
  Clock,
  ShieldCheck
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
      maxWidth: 1360,
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 20
    }} className="animate-fade-in">
      {/* Top Greeting & Operational Status Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        padding: '20px 24px',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.06)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: 'linear-gradient(90deg, #4F46E5 0%, #06B6D4 100%)'
        }} />

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.025em' }}>
              Quality Operations Command
            </h1>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11.5,
              fontWeight: 600,
              color: '#065F46',
              backgroundColor: '#ECFDF5',
              border: '1px solid #A7F3D0',
              borderRadius: 20,
              padding: '2px 10px'
            }}>
              <span className="pulse-dot" style={{ backgroundColor: '#10B981', width: 6, height: 6 }} />
              <span>Shift Active · 21 CFR Part 11</span>
            </div>
          </div>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4, fontWeight: 500 }}>
            {pendingReviews > 0
              ? `${pendingReviews} complaints currently awaiting Qualified Person review & sign-off.`
              : 'All incoming customer complaints have been triaged and verified.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={loadData}
            disabled={loading}
            style={{
              padding: '8px 14px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 600,
              color: '#475569',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              transition: 'all 140ms ease-out'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
          >
            <RotateCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => onNavigate('INTAKE')}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
              transition: 'all 140ms ease-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(79, 70, 229, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(79, 70, 229, 0.3)';
            }}
          >
            <FilePlus2 size={14} />
            <span>Log Complaint</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 16
      }}>
        {/* KPI 1: Pending Reviews */}
        <div
          onClick={() => onNavigate('REVIEW')}
          className="hover-card"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 12,
            padding: '18px 20px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Pending Review
            </span>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: '#FFFBEB',
              border: '1px solid #FDE68A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#D97706'
            }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{
            fontSize: 32,
            fontWeight: 800,
            color: pendingReviews > 0 ? '#B45309' : '#0F172A',
            lineHeight: 1.1,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.03em'
          }}>
            {pendingReviews}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, fontSize: 12, color: '#64748B' }}>
            <span>{pendingReviews > 0 ? 'Requires QP sign-off' : 'Queue cleared'}</span>
            <span style={{ fontWeight: 600, color: '#4F46E5', display: 'flex', alignItems: 'center', gap: 2 }}>
              Open Queue →
            </span>
          </div>
        </div>

        {/* KPI 2: High & Critical Defects */}
        <div
          className="hover-card"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 12,
            padding: '18px 20px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Critical & High Defects
            </span>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: highCritical > 0 ? '#FEF2F2' : '#F1F5F9',
              border: `1px solid ${highCritical > 0 ? '#FECACA' : '#E2E8F0'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: highCritical > 0 ? '#DC2626' : '#94A3B8'
            }}>
              <AlertTriangle size={16} />
            </div>
          </div>
          <div style={{
            fontSize: 32,
            fontWeight: 800,
            color: highCritical > 0 ? '#DC2626' : '#0F172A',
            lineHeight: 1.1,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.03em'
          }}>
            {highCritical}
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: highCritical > 0 ? '#991B1B' : '#64748B', fontWeight: highCritical > 0 ? 600 : 400 }}>
            {highCritical > 0 ? 'Urgent escalation active' : 'Zero critical safety risks'}
          </div>
        </div>

        {/* KPI 3: Open Complaints */}
        <div
          onClick={() => onNavigate('INTAKE')}
          className="hover-card"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 12,
            padding: '18px 20px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Active Pipeline
            </span>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: '#EEF2FF',
              border: '1px solid #C7D2FE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4F46E5'
            }}>
              <Inbox size={16} />
            </div>
          </div>
          <div style={{
            fontSize: 32,
            fontWeight: 800,
            color: '#0F172A',
            lineHeight: 1.1,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.03em'
          }}>
            {openComplaints}
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: '#64748B' }}>
            Total registered cases in ledger
          </div>
        </div>

        {/* KPI 4: AI Acceptance Rate */}
        <div
          onClick={() => onNavigate('ANALYTICS')}
          className="hover-card"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 12,
            padding: '18px 20px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              AI Acceptance Rate
            </span>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: '#ECFDF5',
              border: '1px solid #A7F3D0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669'
            }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div style={{
            fontSize: 32,
            fontWeight: 800,
            color: '#0F172A',
            lineHeight: 1.1,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.03em'
          }}>
            {acceptanceRate !== null ? `${acceptanceRate}%` : '—'}
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: '#64748B' }}>
            {overrideRate !== null ? `${overrideRate}% human override rate` : 'Accumulating telemetry'}
          </div>
        </div>
      </div>

      {/* Main Actionable Sections Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2.2fr) minmax(0, 1fr)',
        gap: 18
      }}>
        {/* Left: Active Review Queue Table */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            backgroundColor: '#FAFAFC'
          }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Operational Review Queue
              </h2>
              <p style={{ fontSize: 12, color: '#64748B', marginTop: 2, margin: 0 }}>
                Complaints awaiting QP verification or AI proposal sign-off
              </p>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: 8,
              padding: '6px 10px',
              width: '220px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
            }}>
              <Search size={13} style={{ color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Filter queue by ID, lot..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 12.5,
              textAlign: 'left'
            }}>
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
                  <th style={{ padding: '10px 18px' }}>Complaint ID</th>
                  <th style={{ padding: '10px 14px' }}>Product & Lot</th>
                  <th style={{ padding: '10px 14px' }}>Customer</th>
                  <th style={{ padding: '10px 14px' }}>Severity</th>
                  <th style={{ padding: '10px 14px' }}>Status</th>
                  <th style={{ padding: '10px 18px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px 16px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
                      No matching complaints found in the active review queue.
                    </td>
                  </tr>
                ) : (
                  filteredComplaints.map((item) => (
                    <tr
                      key={item.id || item.complaint_number}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        transition: 'background-color 120ms ease-out'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '12px 18px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#4F46E5' }}>
                        {item.complaint_number}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 600, color: '#0F172A' }}>
                          {item.product_name || '—'}
                        </div>
                        <div style={{ fontSize: 11.5, color: '#64748B', fontFamily: 'var(--font-mono)' }}>
                          Batch: {item.batch_number || '—'}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#475569', fontWeight: 500 }}>
                        {item.customer_name || '—'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
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
                        <span style={{
                          fontSize: 11.5,
                          fontWeight: 600,
                          color: item.status === 'APPROVED' ? '#059669' : '#475569'
                        }}>
                          {item.status?.replace('_', ' ') || 'DRAFT'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            onSelectComplaint(item);
                            onNavigate('REVIEW');
                          }}
                          style={{
                            padding: '4px 10px',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #CBD5E1',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#4F46E5',
                            cursor: 'pointer',
                            transition: 'all 120ms ease-out',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#EEF2FF';
                            e.currentTarget.style.borderColor = '#C7D2FE';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#FFFFFF';
                            e.currentTarget.style.borderColor = '#CBD5E1';
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

        {/* Right: Operational Insights & Invariant Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Defect Severity Breakdown */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 12,
            padding: '18px 20px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.06)'
          }}>
            <h2 style={{ fontSize: 14.5, fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Defect Severity Profile
            </h2>
            <p style={{ fontSize: 12, color: '#64748B', marginTop: 2, marginBottom: 16 }}>
              ICH Q9 risk category distribution
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}>
                  <span style={{ fontWeight: 600, color: '#DC2626' }}>Critical / High Risk</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{highCritical}</span>
                </div>
                <div style={{ height: 7, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${openComplaints > 0 ? (highCritical / openComplaints) * 100 : 0}%`,
                    background: 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)',
                    borderRadius: 4,
                    transition: 'width 300ms ease-out'
                  }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}>
                  <span style={{ fontWeight: 600, color: '#D97706' }}>Medium / Low Risk</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{Math.max(0, openComplaints - highCritical)}</span>
                </div>
                <div style={{ height: 7, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${openComplaints > 0 ? ((openComplaints - highCritical) / openComplaints) * 100 : 0}%`,
                    background: 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)',
                    borderRadius: 4,
                    transition: 'width 300ms ease-out'
                  }} />
                </div>
              </div>
            </div>
          </div>

          {/* GxP Governance Card */}
          <div style={{
            backgroundColor: '#EEF2FF',
            border: '1px solid #C7D2FE',
            borderRadius: 12,
            padding: '16px 18px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <ShieldCheck size={16} style={{ color: '#4F46E5' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#3730A3' }}>
                21 CFR Part 11 Integrity
              </span>
            </div>
            <p style={{ fontSize: 12, color: '#4338CA', lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
              All AI-extracted entities remain in a proposed state until signed off by an authorized Qualified Person. Every human override preserves the original AI recommendation in the immutable audit ledger.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewDashboard;
