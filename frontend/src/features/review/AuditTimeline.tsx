import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { AuditTimelineResponse } from '../../types';
import { History, RotateCw } from 'lucide-react';
import { getGlassStyle } from '../../design/glass';

interface AuditTimelineProps {
  complaintId?: number;
  complaintNumber?: string;
  onRefresh?: () => void;
}

export const AuditTimeline: React.FC<AuditTimelineProps> = ({
  complaintId,
  complaintNumber,
  onRefresh
}) => {
  const [timeline, setTimeline] = useState<AuditTimelineResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filterActor, setFilterActor] = useState<'ALL' | 'HUMAN' | 'AI'>('ALL');

  useEffect(() => {
    if (complaintId) {
      loadTimeline(complaintId);
    }
  }, [complaintId]);

  const loadTimeline = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.fetchTimeline(id);
      setTimeline(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit timeline');
    } finally {
      setLoading(false);
    }
  };

  const getEventBadge = (actorType: string) => {
    if (actorType === 'AI') {
      return { label: 'AI Engine', color: '#FFFFFF', bg: 'rgba(255, 255, 255, 0.08)', border: 'rgba(255, 255, 255, 0.20)' };
    }
    if (actorType === 'HUMAN' || actorType === 'USER') {
      return { label: 'Qualified Person', color: '#34D399', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.30)' };
    }
    return { label: 'GxP System', color: 'rgba(255, 255, 255, 0.70)', bg: 'rgba(255, 255, 255, 0.04)', border: 'rgba(255, 255, 255, 0.10)' };
  };

  const filteredEvents = timeline?.events.filter((e) => {
    if (filterActor === 'ALL') return true;
    return e.actor_type === filterActor;
  }) || [];

  return (
    <div
      style={{
        ...getGlassStyle('standard'),
        overflow: 'hidden'
      }}
      className="animate-fade-in"
    >
      {/* Header */}
      <div
        style={{
          padding: '18px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          flexWrap: 'wrap',
          gap: 12
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <History size={16} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>
                AUDIT TRAIL
              </h2>
              {complaintNumber && (
                <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.45)', fontFamily: 'var(--font-mono)' }}>
                  · {complaintNumber}
                </span>
              )}
            </div>
            <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.55)', margin: '2px 0 0' }}>
              Immutable quality event history · 21 CFR Part 11 compliant ledger
            </p>
          </div>
        </div>

        {/* Filters and Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              display: 'flex',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              padding: '2px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            {(['ALL', 'HUMAN', 'AI'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilterActor(mode)}
                style={{
                  padding: '3px 8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: filterActor === mode ? '#FFFFFF' : 'rgba(255, 255, 255, 0.50)',
                  backgroundColor: filterActor === mode ? 'rgba(255, 255, 255, 0.10)' : 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {mode}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              if (complaintId) loadTimeline(complaintId);
              if (onRefresh) onRefresh();
            }}
            disabled={loading}
            style={{
              height: '28px',
              padding: '0 8px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '6px',
              color: 'rgba(255, 255, 255, 0.70)',
              fontSize: '11.5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <RotateCw size={12} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Timeline Stream */}
      <div style={{ padding: '20px 24px' }}>
        {error && (
          <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#F87171', fontSize: '12px', marginBottom: 14 }}>
            {error}
          </div>
        )}

        {filteredEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 0', color: 'rgba(255, 255, 255, 0.45)', fontSize: '12.5px' }}>
            No audit records found for this complaint.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredEvents.map((evt, idx) => {
              const badge = getEventBadge(evt.actor_type);
              return (
                <div
                  key={evt.id || idx}
                  style={{
                    display: 'flex',
                    gap: 14,
                    alignItems: 'flex-start'
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      color: 'rgba(255, 255, 255, 0.40)',
                      width: '70px',
                      paddingTop: '2px',
                      flexShrink: 0
                    }}
                  >
                    {evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '00:00:00'}
                  </div>

                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: evt.actor_type === 'HUMAN' ? '#10B981' : '#FFFFFF',
                      marginTop: '6px',
                      flexShrink: 0
                    }}
                  />

                  <div
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.025)',
                      border: '1px solid rgba(255, 255, 255, 0.07)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      fontSize: '12.5px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '3px',
                            backgroundColor: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`
                          }}
                        >
                          {badge.label}
                        </span>
                        <strong style={{ color: '#FFFFFF', fontWeight: 600 }}>{evt.title || evt.event_type}</strong>
                      </div>
                      <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.40)' }}>
                        {evt.actor || 'System Operator'}
                      </span>
                    </div>

                    {evt.description && (
                      <div style={{ color: 'rgba(255, 255, 255, 0.70)', marginTop: 4, lineHeight: 1.4 }}>
                        {evt.description}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
