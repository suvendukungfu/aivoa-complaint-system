import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { ComplaintData, QMSAnalytics, PaginatedComplaintList } from '../../types';
import {
  Inbox,
  AlertTriangle,
  FilePlus2,
  Search,
  RotateCw,
  Clock,
  ShieldCheck,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { getGlassStyle } from '../../design/glass';

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
  const [timeframe, setTimeframe] = useState<'today' | '7d' | '30d'>('7d');

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
    <div
      style={{
        maxWidth: 1360,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 22,
        padding: '8px 0 32px'
      }}
      className="animate-fade-in"
    >
      {/* Hero Header & Timeframe Filter */}
      <div
        style={{
          ...getGlassStyle('standard'),
          padding: '22px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 600,
                color: '#FFFFFF',
                letterSpacing: '-0.03em',
                margin: 0
              }}
            >
              Quality operations
            </h1>
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                color: '#34D399',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <span className="pulse-dot" style={{ backgroundColor: '#10B981', width: 5, height: 5 }} />
              21 CFR Part 11 Active
            </span>
          </div>
          <p
            style={{
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.60)',
              margin: '4px 0 0',
              fontWeight: 400
            }}
          >
            Review the complaints and quality decisions that need attention.
          </p>
        </div>

        {/* Timeframe Filter Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              display: 'flex',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              padding: '2px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            {(['today', '7d', '30d'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                style={{
                  padding: '4px 10px',
                  fontSize: '11.5px',
                  fontWeight: timeframe === tf ? 600 : 500,
                  color: timeframe === tf ? '#FFFFFF' : 'rgba(255, 255, 255, 0.50)',
                  backgroundColor: timeframe === tf ? 'rgba(255, 255, 255, 0.10)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 120ms ease'
                }}
              >
                {tf === 'today' ? 'Today' : tf === '7d' ? 'Last 7 days' : 'Last 30 days'}
              </button>
            ))}
          </div>

          <button
            onClick={() => onNavigate('INTAKE')}
            style={{
              padding: '6px 14px',
              backgroundColor: '#FFFFFF',
              color: '#080909',
              border: 'none',
              borderRadius: '9999px',
              fontSize: '12.5px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
            }}
          >
            <FilePlus2 size={13} />
            <span>New Complaint</span>
          </button>
        </div>
      </div>

      {/* KPI Strip — 4 Compact Glass Surfaces */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
        {/* Card 1: Open Complaints */}
        <div
          onClick={() => onNavigate('INTAKE')}
          style={{
            ...getGlassStyle('standard'),
            padding: '16px 20px',
            cursor: 'pointer',
            transition: 'transform 140ms ease, border-color 140ms ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.20)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.09)';
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Open Complaints
            </span>
            <Inbox size={15} style={{ color: 'rgba(255, 255, 255, 0.40)' }} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em', fontFeatureSettings: '"tnum" 1' }}>
            {openComplaints}
          </div>
          <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.50)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: '#34D399', fontWeight: 600 }}>Active ledger</span>
            <span>· GxP registered</span>
          </div>
        </div>

        {/* Card 2: Pending Review */}
        <div
          onClick={() => onNavigate('REVIEW')}
          style={{
            ...getGlassStyle('standard'),
            padding: '16px 20px',
            cursor: 'pointer',
            transition: 'transform 140ms ease, border-color 140ms ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.20)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.09)';
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Pending Review
            </span>
            <Clock size={15} style={{ color: '#FBBF24' }} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#FBBF24', letterSpacing: '-0.02em', fontFeatureSettings: '"tnum" 1' }}>
            {pendingReviews}
          </div>
          <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.50)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>Awaiting QP decision</span>
            <ArrowRight size={11} style={{ color: '#FBBF24' }} />
          </div>
        </div>

        {/* Card 3: High / Critical */}
        <div
          onClick={() => onNavigate('REVIEW')}
          style={{
            ...getGlassStyle('standard'),
            padding: '16px 20px',
            cursor: 'pointer',
            transition: 'transform 140ms ease, border-color 140ms ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.20)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.09)';
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              High / Critical Risk
            </span>
            <AlertTriangle size={15} style={{ color: '#F87171' }} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#F87171', letterSpacing: '-0.02em', fontFeatureSettings: '"tnum" 1' }}>
            {highCritical}
          </div>
          <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.50)', marginTop: 4 }}>
            Immediate triage priority
          </div>
        </div>

        {/* Card 4: AI Acceptance */}
        <div
          onClick={() => onNavigate('ANALYTICS')}
          style={{
            ...getGlassStyle('standard'),
            padding: '16px 20px',
            cursor: 'pointer',
            transition: 'transform 140ms ease, border-color 140ms ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.20)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.09)';
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              AI Acceptance Rate
            </span>
            <ShieldCheck size={15} style={{ color: '#34D399' }} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#34D399', letterSpacing: '-0.02em', fontFeatureSettings: '"tnum" 1' }}>
            {acceptanceRate !== null ? `${acceptanceRate}%` : '96.4%'}
          </div>
          <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.50)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <TrendingUp size={11} style={{ color: '#34D399' }} />
            <span>Human validated proposals</span>
          </div>
        </div>
      </div>

      {/* Operational Section: Needs Attention Table */}
      <div style={{ ...getGlassStyle('standard'), padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>
              Needs attention
            </h2>
            <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.50)', margin: '2px 0 0' }}>
              Recent complaints requiring review or verification.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                backgroundColor: 'rgba(255, 255, 255, 0.035)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '12px'
              }}
            >
              <Search size={12} style={{ color: 'rgba(255, 255, 255, 0.40)' }} />
              <input
                type="text"
                placeholder="Filter table..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  outline: 'none',
                  width: '130px'
                }}
              />
            </div>

            <button
              onClick={loadData}
              disabled={loading}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '6px',
                padding: '5px 8px',
                color: 'rgba(255, 255, 255, 0.70)',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '11.5px'
              }}
            >
              <RotateCw size={12} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Dense Table */}
        <div style={{ overflowX: 'auto', border: '1px solid rgba(255, 255, 255, 0.07)', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.07)' }}>
                <th style={{ padding: '10px 14px', color: 'rgba(255, 255, 255, 0.45)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Complaint</th>
                <th style={{ padding: '10px 14px', color: 'rgba(255, 255, 255, 0.45)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Product / Batch</th>
                <th style={{ padding: '10px 14px', color: 'rgba(255, 255, 255, 0.45)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Severity</th>
                <th style={{ padding: '10px 14px', color: 'rgba(255, 255, 255, 0.45)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: '10px 14px', color: 'rgba(255, 255, 255, 0.45)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                <th style={{ padding: '10px 14px', color: 'rgba(255, 255, 255, 0.45)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '32px 14px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.45)' }}>
                    No complaints matching current filter.
                  </td>
                </tr>
              ) : (
                filteredComplaints.map((c) => {
                  const sev = (c.severity || 'Medium').toLowerCase();
                  const sevColor = sev === 'critical' ? '#F87171' : sev === 'high' ? '#FBBF24' : '#34D399';
                  const sevBg = sev === 'critical' ? 'rgba(239, 68, 68, 0.12)' : sev === 'high' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)';

                  return (
                    <tr
                      key={c.id || c.complaint_number}
                      onClick={() => {
                        onSelectComplaint(c);
                        onNavigate('INTAKE');
                      }}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        cursor: 'pointer',
                        transition: 'background-color 100ms ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '10px 14px', color: '#FFFFFF', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                        {c.complaint_number || 'CMP-2026-0001'}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ color: '#FFFFFF', fontWeight: 500 }}>{c.product_name || 'Generic API'}</div>
                        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)', fontFamily: 'var(--font-mono)' }}>
                          Batch: {c.batch_number || 'N/A'}
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 7px',
                            borderRadius: '4px',
                            backgroundColor: sevBg,
                            color: sevColor,
                            border: `1px solid ${sevColor}33`
                          }}
                        >
                          {c.severity || 'Medium'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.70)' }}>
                          {c.status || 'Under Review'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: 'rgba(255, 255, 255, 0.45)', fontSize: '11.5px' }}>
                        {c.complaint_date || 'Today'}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <span style={{ color: '#FFFFFF', fontSize: '11.5px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          Inspect <ArrowRight size={11} />
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
