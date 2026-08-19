import React from 'react';
import { useAppSelector } from '../../store';
import { AlertCircle, HelpCircle } from 'lucide-react';

export const CompletenessWidget: React.FC = () => {
  const completeness = useAppSelector((state) => state.ai.completeness);
  const complaint = useAppSelector((state) => state.complaint.data);

  if (!completeness && !complaint.completeness_score) {
    return null;
  }

  const score = completeness?.completeness_score ?? complaint.completeness_score ?? 0;
  const missingCritical = completeness?.missing_critical_fields || [];
  const missingOptional = completeness?.missing_optional_fields || [];
  const recommendations = completeness?.recommendations || [];

  const getScoreColor = (val: number) => {
    if (val >= 80) return '#059669';
    if (val >= 50) return '#D97706';
    return '#DC2626';
  };

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: 4,
      border: '1px solid #E5E7EB',
      padding: '12px',
      marginTop: 8
    }}>
      {/* Header & Score */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <h4 style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>
          Record Completeness
        </h4>
        <span style={{
          fontSize: 12,
          fontWeight: 600,
          color: getScoreColor(score)
        }}>
          {score}%
        </span>
      </div>

      {/* Progress Track */}
      <div style={{
        width: '100%',
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 8
      }}>
        <div style={{
          width: `${score}%`,
          height: '100%',
          backgroundColor: getScoreColor(score),
          borderRadius: 2,
          transition: 'width 0.3s ease'
        }} />
      </div>

      {/* Missing Fields Breakdown */}
      {missingCritical.length > 0 && (
        <div style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#DC2626', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
            <AlertCircle size={11} />
            Missing Critical Fields:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {missingCritical.map((field, idx) => (
              <span key={idx} style={{
                fontSize: 10,
                backgroundColor: '#FEF2F2',
                color: '#991B1B',
                border: '1px solid #FECACA',
                padding: '1px 5px',
                borderRadius: 3
              }}>
                {field}
              </span>
            ))}
          </div>
        </div>
      )}

      {missingOptional.length > 0 && (
        <div style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#D97706', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
            <HelpCircle size={11} />
            Missing Optional Fields:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {missingOptional.map((field, idx) => (
              <span key={idx} style={{
                fontSize: 10,
                backgroundColor: '#FFFBEB',
                color: '#92400E',
                border: '1px solid #FDE68A',
                padding: '1px 5px',
                borderRadius: 3
              }}>
                {field}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div style={{
          backgroundColor: '#F9FAFB',
          borderRadius: 3,
          border: '1px solid #E5E7EB',
          padding: '6px 8px',
          fontSize: 10,
          color: '#4B5563',
          lineHeight: 1.3
        }}>
          <strong>Recommendation:</strong> {recommendations.join(' ')}
        </div>
      )}
    </div>
  );
};
