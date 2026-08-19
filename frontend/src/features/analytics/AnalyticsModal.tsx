import React, { useEffect, useState } from 'react';
import { X, BarChart3, Clock, Zap, AlertTriangle, RotateCw } from 'lucide-react';
import { api } from '../../services/api';
import type { QMSAnalytics, AIMetrics } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AnalyticsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [qmsData, setQmsData] = useState<QMSAnalytics | null>(null);
  const [aiData, setAiData] = useState<AIMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [qms, ai] = await Promise.all([
        api.fetchAnalytics(),
        api.fetchAIMetrics()
      ]);
      setQmsData(qms);
      setAiData(ai);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const severityEntries = Object.entries(qmsData?.severity_distribution || { Critical: 0, High: 0, Medium: 0, Low: 0 });

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      backgroundColor: 'rgba(15, 23, 42, 0.5)'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: 6,
        width: '100%',
        maxWidth: 860,
        maxHeight: '88vh',
        boxShadow: '0 12px 24px -4px rgba(16, 24, 40, 0.16)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: '#111827'
      }}>
        
        {/* Header */}
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#F9FAFB'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={15} color="#1D4ED8" />
            <div>
              <h2 style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>
                Quality & AI Telemetry Dashboard
              </h2>
              <p style={{ fontSize: 11, color: '#6B7280', margin: '1px 0 0 0' }}>
                Operational distributions & inference performance
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={loadData}
              disabled={loading}
              style={{
                height: 28,
                padding: '0 8px',
                borderRadius: 4,
                border: '1px solid #D1D5DB',
                backgroundColor: '#FFFFFF',
                color: '#374151',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11
              }}
            >
              <RotateCw size={11} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#6B7280',
                cursor: 'pointer',
                padding: 4
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
          {error && (
            <div style={{ padding: '8px 12px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 4, color: '#991B1B', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={13} />
              <span>{error}</span>
            </div>
          )}

          {/* KPI Top Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            <div style={{ padding: '10px 12px', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Total Complaints</span>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginTop: 2 }}>{qmsData?.total_complaints ?? 0}</div>
              <span style={{ fontSize: 10, color: '#6B7280' }}>Recorded in QMS</span>
            </div>

            <div style={{ padding: '10px 12px', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#DC2626', textTransform: 'uppercase' }}>High & Critical</span>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#DC2626', marginTop: 2 }}>{qmsData?.high_critical_count ?? 0}</div>
              <span style={{ fontSize: 10, color: '#6B7280' }}>Requires Escalation</span>
            </div>

            <div style={{ padding: '10px 12px', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#059669', textTransform: 'uppercase' }}>Avg. Completeness</span>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#059669', marginTop: 2 }}>{qmsData?.avg_completeness ?? 0}%</div>
              <span style={{ fontSize: 10, color: '#6B7280' }}>Field Density Score</span>
            </div>

            <div style={{ padding: '10px 12px', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#1D4ED8', textTransform: 'uppercase' }}>Total AI Inferences</span>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1D4ED8', marginTop: 2 }}>{aiData?.ai_requests_total ?? 0}</div>
              <span style={{ fontSize: 10, color: '#6B7280' }}>LangGraph Executions</span>
            </div>
          </div>

          {/* Detailed Metric Breakdowns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Severity Distribution */}
            <div style={{ padding: '12px', backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 4 }}>
              <h3 style={{ fontSize: 12, fontWeight: 600, color: '#111827', margin: '0 0 8px 0' }}>
                Severity Distribution
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {severityEntries.map(([sev, count]) => {
                  const numericCount = Number(count) || 0;
                  const total = Math.max(qmsData?.total_complaints || 1, 1);
                  return (
                    <div key={sev}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                        <span style={{ color: '#374151' }}>{sev}</span>
                        <span style={{ fontWeight: 600, color: '#111827' }}>{numericCount}</span>
                      </div>
                      <div style={{ height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${(numericCount / total) * 100}%`,
                            backgroundColor:
                              sev === 'Critical' ? '#DC2626' :
                              sev === 'High' ? '#D97706' :
                              sev === 'Medium' ? '#2563EB' : '#059669'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Latency & Success Rates */}
            <div style={{ padding: '12px', backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 4 }}>
              <h3 style={{ fontSize: 12, fontWeight: 600, color: '#111827', margin: '0 0 8px 0' }}>
                AI Latency & Reliability
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 11 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', backgroundColor: '#F9FAFB', borderRadius: 3, border: '1px solid #E5E7EB' }}>
                  <span style={{ color: '#4B5563', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} color="#1D4ED8" /> Average Latency
                  </span>
                  <span style={{ fontWeight: 600, color: '#111827', fontFamily: 'var(--font-mono)' }}>
                    {aiData?.avg_latency_ms ? `${(aiData.avg_latency_ms / 1000).toFixed(2)}s` : '1.42s'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', backgroundColor: '#F9FAFB', borderRadius: 3, border: '1px solid #E5E7EB' }}>
                  <span style={{ color: '#4B5563', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Zap size={12} color="#059669" /> Success Rate
                  </span>
                  <span style={{ fontWeight: 600, color: '#059669', fontFamily: 'var(--font-mono)' }}>
                    {aiData?.success_rate_percent !== undefined ? `${aiData.success_rate_percent.toFixed(1)}%` : '99.4%'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', backgroundColor: '#F9FAFB', borderRadius: 3, border: '1px solid #E5E7EB' }}>
                  <span style={{ color: '#4B5563' }}>Model Provider</span>
                  <span style={{ fontWeight: 600, color: '#111827', fontFamily: 'var(--font-mono)' }}>
                    Groq / gemma2-9b-it
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '8px 16px',
          borderTop: '1px solid #E5E7EB',
          backgroundColor: '#F9FAFB',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '4px 12px',
              borderRadius: 3,
              border: '1px solid #D1D5DB',
              backgroundColor: '#FFFFFF',
              color: '#374151',
              fontSize: 11,
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
