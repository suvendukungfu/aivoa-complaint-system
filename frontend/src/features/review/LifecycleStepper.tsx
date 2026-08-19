import React, { useState } from 'react';
import { Check, ShieldCheck } from 'lucide-react';

interface LifecycleStepperProps {
  currentStatus: string;
  onTransition: (targetStatus: string, reason?: string) => Promise<void>;
  disabled?: boolean;
}

const LIFECYCLE_STAGES = [
  { id: 'DRAFT', label: 'Draft' },
  { id: 'SUBMITTED', label: 'Submitted' },
  { id: 'PENDING_TRIAGE', label: 'Pending Triage' },
  { id: 'UNDER_REVIEW', label: 'Under Review' },
  { id: 'INVESTIGATION', label: 'Investigation' },
  { id: 'QUALITY_DECISION', label: 'Quality Decision' },
  { id: 'CLOSED', label: 'Closed' }
];

export const LifecycleStepper: React.FC<LifecycleStepperProps> = ({
  currentStatus,
  onTransition,
  disabled = false
}) => {
  const [transitioning, setTransitioning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalize = (status: string) => {
    return status.toUpperCase().replace(/\s+/g, '_');
  };

  const currentNormalized = normalize(currentStatus || 'PENDING_TRIAGE');
  const currentIndex = LIFECYCLE_STAGES.findIndex((s) => s.id === currentNormalized);

  const handleStageClick = async (targetId: string) => {
    if (disabled || transitioning || targetId === currentNormalized) return;
    setTransitioning(true);
    setError(null);
    try {
      await onTransition(targetId, `Transitioned via Review Workspace to ${targetId}`);
    } catch (err: any) {
      setError(err.message || 'Failed state transition.');
    } finally {
      setTransitioning(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 4,
        padding: '12px 16px',
        border: '1px solid #E5E7EB'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ShieldCheck size={14} color="#1D4ED8" />
          <h4 style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#111827' }}>
            Lifecycle State Machine
          </h4>
          <span style={{ fontSize: 11, color: '#6B7280' }}>
            • Current: <strong style={{ color: '#111827' }}>{currentStatus}</strong>
          </span>
        </div>

        {error && (
          <div style={{ fontSize: 11, color: '#DC2626', backgroundColor: '#FEF2F2', padding: '2px 8px', borderRadius: 3, border: '1px solid #FECACA' }}>
            {error}
          </div>
        )}
      </div>

      {/* Stepper Track */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          overflowX: 'auto'
        }}
      >
        {LIFECYCLE_STAGES.map((stage, idx) => {
          const isPassed = idx < currentIndex;
          const isCurrent = stage.id === currentNormalized;
          const isNextAllowed = idx === currentIndex + 1;

          return (
            <React.Fragment key={stage.id}>
              {/* Stage Node */}
              <button
                type="button"
                onClick={() => handleStageClick(stage.id)}
                disabled={disabled || transitioning || (!isNextAllowed && !isCurrent)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: isCurrent ? '#EFF6FF' : 'none',
                  border: isCurrent ? '1px solid #BFDBFE' : 'none',
                  borderRadius: 4,
                  padding: '4px 8px',
                  cursor: isNextAllowed ? 'pointer' : 'default',
                  opacity: isPassed || isCurrent || isNextAllowed ? 1 : 0.4
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    backgroundColor: isCurrent ? '#1D4ED8' : isPassed ? '#059669' : '#F3F4F6',
                    color: isCurrent || isPassed ? '#FFFFFF' : '#6B7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: 10,
                    border: isCurrent || isPassed ? 'none' : '1px solid #D1D5DB'
                  }}
                >
                  {isPassed ? <Check size={11} /> : idx + 1}
                </div>

                <span
                  style={{
                    fontSize: 11,
                    fontWeight: isCurrent ? 600 : 400,
                    color: isCurrent ? '#1D4ED8' : isPassed ? '#111827' : '#6B7280',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {stage.label}
                </span>
              </button>

              {/* Connecting Line */}
              {idx < LIFECYCLE_STAGES.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    backgroundColor: idx < currentIndex ? '#059669' : '#E5E7EB',
                    margin: '0 4px',
                    minWidth: 10
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
