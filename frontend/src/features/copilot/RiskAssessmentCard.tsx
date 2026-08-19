import React from 'react';
import { useAppSelector } from '../../store';
import { ShieldAlert, CheckSquare, AlertCircle } from 'lucide-react';

export const RiskAssessmentCard: React.FC = () => {
  const risk = useAppSelector((state) => state.ai.riskAssessment);
  const complaint = useAppSelector((state) => state.complaint.data);

  if (!risk && !complaint.ai_reasoning) {
    return null;
  }

  const severity = risk?.severity || complaint.severity || 'Medium';
  const priority = risk?.priority || complaint.priority || 'Normal';
  const rationale = risk?.risk_rationale || complaint.ai_reasoning || 'Standard quality complaint triage.';
  const actions = risk?.recommended_actions || complaint.recommended_actions || [];

  const getSeverityBadgeClass = (sev: string) => {
    switch (sev) {
      case 'Critical': return 'badge-critical';
      case 'High': return 'badge-high';
      case 'Medium': return 'badge-medium';
      case 'Low': return 'badge-low';
      default: return 'badge-normal';
    }
  };

  const getPriorityBadgeClass = (prio: string) => {
    switch (prio) {
      case 'Urgent': return 'badge-urgent';
      case 'High': return 'badge-high';
      case 'Normal': return 'badge-normal';
      case 'Low': return 'badge-low';
      default: return 'badge-normal';
    }
  };

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: 4,
      border: '1px solid #E5E7EB',
      padding: '12px',
      marginTop: 8
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ShieldAlert size={14} color="#4B5563" />
          <h4 style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>
            Risk Triage Assessment
          </h4>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span className={`badge ${getSeverityBadgeClass(severity)}`}>
            {severity}
          </span>
          <span className={`badge ${getPriorityBadgeClass(priority)}`}>
            {priority}
          </span>
        </div>
      </div>

      {/* Rationale */}
      <div style={{
        backgroundColor: '#F9FAFB',
        borderRadius: 4,
        border: '1px solid #E5E7EB',
        padding: '8px 10px',
        fontSize: 11,
        color: '#374151',
        lineHeight: 1.4,
        marginBottom: 8
      }}>
        <strong style={{ color: '#111827' }}>Rationale:</strong> {rationale}
      </div>

      {/* Recommended Next Actions */}
      {actions.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#4B5563', marginBottom: 4 }}>
            Recommended Next Actions:
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {actions.map((action, idx) => (
              <li key={idx} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 5,
                fontSize: 11,
                color: '#374151',
                lineHeight: 1.35
              }}>
                <CheckSquare size={12} color="#1D4ED8" style={{ marginTop: 2, flexShrink: 0 }} />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Regulatory Notice */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        paddingTop: 6,
        borderTop: '1px solid #F3F4F6',
        fontSize: 10,
        color: '#6B7280'
      }}>
        <AlertCircle size={11} color="#9CA3AF" />
        <span>Initial AI recommendation. Subject to Qualified Person approval.</span>
      </div>
    </div>
  );
};
