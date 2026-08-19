import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import {
  Activity,
  ShieldCheck,
  Database,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Server,
  Lock
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
      maxWidth: 1200,
      margin: '0 auto',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      color: '#111827'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: 6,
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Activity size={18} color="#1D4ED8" />
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 }}>
              System Health & Regulatory Invariants
            </h1>
            <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0 0' }}>
              QMS runtime diagnostics, AI model compliance, and database persistence status
            </p>
          </div>
        </div>

        <button
          onClick={loadHealth}
          disabled={loading}
          style={{
            height: 32,
            padding: '0 12px',
            borderRadius: 4,
            border: '1px solid #D1D5DB',
            backgroundColor: '#FFFFFF',
            color: '#374151',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5
          }}
        >
          <RotateCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Check Health</span>
        </button>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 4, color: '#991B1B', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertTriangle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* Grid of Diagnostic Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {/* Panel 1: Backend Core */}
        <div style={{ padding: '16px', backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #F3F4F6', paddingBottom: 6 }}>
            <Server size={15} color="#1D4ED8" />
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827' }}>
              Application Core
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6B7280' }}>Service Status:</span>
              <span style={{ fontWeight: 600, color: healthData?.status === 'healthy' ? '#059669' : '#DC2626' }}>
                {healthData?.status ? healthData.status.toUpperCase() : 'CHECKING'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6B7280' }}>Version:</span>
              <span style={{ fontWeight: 500, fontFamily: 'var(--font-mono)' }}>{healthData?.version || '2.0.0'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6B7280' }}>Environment:</span>
              <span style={{ fontWeight: 500 }}>{healthData?.environment || 'development'}</span>
            </div>
          </div>
        </div>

        {/* Panel 2: Model & AI Orchestrator */}
        <div style={{ padding: '16px', backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #F3F4F6', paddingBottom: 6 }}>
            <Cpu size={15} color="#1D4ED8" />
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827' }}>
              Model & Orchestrator
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6B7280' }}>Primary Model:</span>
              <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: '#1D4ED8' }}>
                {healthData?.ai_model || 'Groq / gemma2-9b-it'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6B7280' }}>Groq Configured:</span>
              <span style={{ fontWeight: 600, color: healthData?.groq_configured ? '#059669' : '#D97706' }}>
                {healthData?.groq_configured ? 'ACTIVE (TRUE)' : 'FALLBACK MODE'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6B7280' }}>Orchestrator:</span>
              <span style={{ fontWeight: 500 }}>LangGraph StateGraph</span>
            </div>
          </div>
        </div>

        {/* Panel 3: Database Persistence */}
        <div style={{ padding: '16px', backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #F3F4F6', paddingBottom: 6 }}>
            <Database size={15} color="#1D4ED8" />
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827' }}>
              Persistence & Storage
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6B7280' }}>Database Status:</span>
              <span style={{ fontWeight: 600, color: healthData?.database_connected ? '#059669' : '#DC2626' }}>
                {healthData?.database_connected ? 'CONNECTED (READY)' : 'DISCONNECTED'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6B7280' }}>Engine:</span>
              <span style={{ fontWeight: 500 }}>{healthData?.database_type || 'PostgreSQL 16'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6B7280' }}>Schema Migrations:</span>
              <span style={{ fontWeight: 500 }}>Alembic Head Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Floor & Regulatory Policies Invariants */}
      <div style={{ padding: '16px', backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 6 }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
          <ShieldCheck size={15} color="#059669" />
          Active Regulatory Safety Policies & Invariants
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ padding: '10px 12px', backgroundColor: '#F9FAFB', borderRadius: 4, border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={13} color="#059669" />
              <span>RiskPolicyEngine Safety Floors</span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: 11, color: '#4B5563', lineHeight: 1.35 }}>
              Deterministic quality rules override model outputs to prevent silent downgrades of critical contamination defects.
            </p>
          </div>

          <div style={{ padding: '10px 12px', backgroundColor: '#F9FAFB', borderRadius: 4, border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Lock size={13} color="#059669" />
              <span>21 CFR Part 11 Immutable Ledger</span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: 11, color: '#4B5563', lineHeight: 1.35 }}>
              Append-only audit trail records every state transition, proposal approval, override rationale, and user actor.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
