import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { toggleObservability } from '../../store/aiSlice';
import { ChevronDown, ChevronUp, Cpu, CheckCircle2, Clock } from 'lucide-react';

export const ObservabilityDrawer: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ai.isObservabilityOpen);
  const auditTrail = useAppSelector((state) => state.ai.auditTrail);

  if (!auditTrail || auditTrail.length === 0) {
    return null;
  }

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: 4,
      border: '1px solid #E5E7EB',
      overflow: 'hidden',
      marginTop: 8
    }}>
      {/* Header / Toggle Button */}
      <button
        onClick={() => dispatch(toggleObservability())}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          backgroundColor: '#F9FAFB',
          border: 'none',
          cursor: 'pointer',
          borderBottom: isOpen ? '1px solid #E5E7EB' : 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Cpu size={13} color="#1D4ED8" />
          <span style={{ fontSize: 11, fontWeight: 600, color: '#111827' }}>
            Agent Execution Pipeline
          </span>
          <span style={{
            fontSize: 10,
            fontWeight: 500,
            backgroundColor: '#EFF6FF',
            color: '#1D4ED8',
            padding: '1px 5px',
            borderRadius: 3,
            border: '1px solid #BFDBFE'
          }}>
            {auditTrail.length} steps
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', color: '#6B7280' }}>
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {/* Content Accordion */}
      {isOpen && (
        <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {auditTrail.map((step, idx) => (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              paddingBottom: 6,
              borderBottom: idx < auditTrail.length - 1 ? '1px solid #F3F4F6' : 'none'
            }}>
              <div style={{ marginTop: 1, color: '#059669' }}>
                <CheckCircle2 size={12} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#111827' }}>
                    {step.step_name}
                  </span>
                  <span style={{ fontSize: 10, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Clock size={9} /> {step.timestamp}
                  </span>
                </div>
                <p style={{ fontSize: 10, color: '#4B5563', margin: '1px 0 0 0' }}>
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
