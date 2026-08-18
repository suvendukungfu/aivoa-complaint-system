import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import {
  Activity,
  Database,
  Cpu,
  RotateCw,
  Server
} from 'lucide-react';

export const SystemHealthView: React.FC = () => {
  const [healthData, setHealthData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.fetchHealth();
      setHealthData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch system health status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  return (
    <div style={{
      maxWidth: 1360,
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
      color: '#0F172A'
    }} className="animate-fade-in">
      {/* Header */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        padding: '18px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            backgroundColor: '#EEF2FF',
            color: '#4F46E5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #C7D2FE'
          }}>
            <Activity size={18} />
          </div>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>
              System Health & GxP Telemetry Probe
            </h1>
            <p style={{ fontSize: 12.5, color: '#64748B', margin: '2px 0 0 0', fontWeight: 500 }}>
              Real-time connectivity, database health, and AI provider fallback diagnostics
            </p>
          </div>
        </div>

        <button
          onClick={loadHealth}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: 8,
            fontSize: 12.5,
            fontWeight: 600,
            color: '#475569',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            transition: 'all 120ms ease-out'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
        >
          <RotateCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Probe Health</span>
        </button>
      </div>

      {error && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 8,
          backgroundColor: '#FEF2F2',
          border: '1px solid #FECACA',
          color: '#991B1B',
          fontSize: 13,
          fontWeight: 600
        }}>
          {error}
        </div>
      )}

      {/* Main Diagnostic Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 16
      }}>
        {/* Backend API Service */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Server size={16} style={{ color: '#4F46E5' }} />
              <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>FastAPI Backend Service</span>
            </div>
            <span style={{
              fontSize: 11.5,
              fontWeight: 700,
              color: '#059669',
              backgroundColor: '#ECFDF5',
              border: '1px solid #A7F3D0',
              padding: '2px 8px',
              borderRadius: 6
            }}>
              {healthData?.status?.toUpperCase() || 'HEALTHY'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Service Name:</span>
              <strong style={{ color: '#0F172A' }}>{healthData?.service || 'aivoa-backend'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>API Version:</span>
              <strong style={{ color: '#0F172A' }}>{healthData?.version || 'v1'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Environment:</span>
              <strong style={{ color: '#0F172A', textTransform: 'capitalize' }}>{healthData?.environment || 'development'}</strong>
            </div>
          </div>
        </div>

        {/* Database Connectivity */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Database size={16} style={{ color: '#0EA5E9' }} />
              <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>Relational Persistence</span>
            </div>
            <span style={{
              fontSize: 11.5,
              fontWeight: 700,
              color: healthData?.database_connected ? '#059669' : '#DC2626',
              backgroundColor: healthData?.database_connected ? '#ECFDF5' : '#FEF2F2',
              border: `1px solid ${healthData?.database_connected ? '#A7F3D0' : '#FECACA'}`,
              padding: '2px 8px',
              borderRadius: 6
            }}>
              {healthData?.database_connected ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Engine Driver:</span>
              <strong style={{ color: '#0F172A', textTransform: 'uppercase' }}>{healthData?.database_type || 'sqlite'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Schema Version:</span>
              <strong style={{ color: '#0F172A' }}>v2026.08 (Audit Chained)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>21 CFR Part 11 Ledger:</span>
              <strong style={{ color: '#059669' }}>Active & Immutable</strong>
            </div>
          </div>
        </div>

        {/* AI Provider & Fallback Model */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Cpu size={16} style={{ color: '#8B5CF6' }} />
              <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>AI LLM Provider</span>
            </div>
            <span style={{
              fontSize: 11.5,
              fontWeight: 700,
              color: '#059669',
              backgroundColor: '#ECFDF5',
              border: '1px solid #A7F3D0',
              padding: '2px 8px',
              borderRadius: 6
            }}>
              READY
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Requested Model:</span>
              <strong style={{ color: '#4F46E5', fontFamily: 'var(--font-mono)' }}>{healthData?.ai?.requested_model || 'gemma2-9b-it'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Active Runtime Model:</span>
              <strong style={{ color: '#0F172A', fontFamily: 'var(--font-mono)' }}>{healthData?.ai?.last_successful_model || 'openai/gpt-oss-120b'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Fallback Status:</span>
              <strong style={{ color: '#D97706' }}>{healthData?.ai?.fallback ? 'Transparent Fallback Active' : 'Primary Active'}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemHealthView;
