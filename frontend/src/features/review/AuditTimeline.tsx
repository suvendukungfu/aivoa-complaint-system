import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { AuditTimelineResponse } from '../../types';
import { History, RotateCw, User, Bot, Cpu } from 'lucide-react';

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
      return { label: 'AI Engine', color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' };
    }
    if (actorType === 'HUMAN' || actorType === 'USER') {
      return { label: 'Human Reviewer', color: '#065F46', bg: '#ECFDF5', border: '#A7F3D0' };
    }
    return { label: 'System', color: '#374151', bg: '#F3F4F6', border: '#E5E7EB' };
  };

  const filteredEvents = timeline?.events.filter((e) => {
    if (filterActor === 'ALL') return true;
    return e.actor_type === filterActor;
  }) || [];

  return (
    <div style={{ padding: '16px', background: '#FFFFFF', borderRadius: 4, border: '1px solid #E5E7EB', boxShadow: '0 1px 2px 0 rgba(16, 24, 40, 0.04)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #F3F4F6', paddingBottom: 10 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: 6 }}>
            <History size={15} color="#1D4ED8" /> Audit Trail & Lineage
          </h2>
          <p style={{ margin: '2px 0 0 0', fontSize: 11, color: '#6B7280' }}>
            Immutable append-only ledger for <strong>{complaintNumber || timeline?.complaint_number || 'Record'}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Actor Filter */}
          <div style={{ display: 'flex', background: '#F3F4F6', padding: '2px', borderRadius: 4, border: '1px solid #E5E7EB' }}>
            <button
              onClick={() => setFilterActor('ALL')}
              style={{
                padding: '3px 8px',
                borderRadius: 3,
                border: 'none',
                background: filterActor === 'ALL' ? '#FFFFFF' : 'transparent',
                fontWeight: filterActor === 'ALL' ? 600 : 400,
                color: filterActor === 'ALL' ? '#111827' : '#6B7280',
                cursor: 'pointer',
                fontSize: 11
              }}
            >
              All Events
            </button>
            <button
              onClick={() => setFilterActor('HUMAN')}
              style={{
                padding: '3px 8px',
                borderRadius: 3,
                border: 'none',
                background: filterActor === 'HUMAN' ? '#FFFFFF' : 'transparent',
                fontWeight: filterActor === 'HUMAN' ? 600 : 400,
                color: filterActor === 'HUMAN' ? '#065F46' : '#6B7280',
                cursor: 'pointer',
                fontSize: 11
              }}
            >
              Human Only
            </button>
            <button
              onClick={() => setFilterActor('AI')}
              style={{
                padding: '3px 8px',
                borderRadius: 3,
                border: 'none',
                background: filterActor === 'AI' ? '#FFFFFF' : 'transparent',
                fontWeight: filterActor === 'AI' ? 600 : 400,
                color: filterActor === 'AI' ? '#1D4ED8' : '#6B7280',
                cursor: 'pointer',
                fontSize: 11
              }}
            >
              AI Only
            </button>
          </div>

          <button
            onClick={() => {
              if (complaintId) loadTimeline(complaintId);
              if (onRefresh) onRefresh();
            }}
            disabled={loading}
            style={{
              height: 28,
              padding: '0 10px',
              borderRadius: 4,
              border: '1px solid #D1D5DB',
              background: '#FFFFFF',
              color: '#374151',
              fontWeight: 500,
              fontSize: 11,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <RotateCw size={12} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '8px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 4, color: '#991B1B', marginBottom: 12, fontSize: 11 }}>
          {error}
        </div>
      )}

      {loading && !timeline && (
        <div style={{ textAlign: 'center', padding: '30px', color: '#6B7280', fontSize: 12 }}>
          Loading audit lineage...
        </div>
      )}

      {!complaintId && (
        <div style={{ textAlign: 'center', padding: '30px', color: '#6B7280', background: '#F9FAFB', borderRadius: 4, border: '1px dashed #D1D5DB' }}>
          <p style={{ margin: 0, fontWeight: 500, fontSize: 12 }}>No complaint selected.</p>
          <p style={{ margin: '2px 0 0 0', fontSize: 11 }}>Select or save a complaint to view its full QMS audit timeline.</p>
        </div>
      )}

      {/* Timeline Stream */}
      {complaintId && timeline && (
        <div style={{ position: 'relative', paddingLeft: '24px' }}>
          {/* Vertical Line */}
          <div
            style={{
              position: 'absolute',
              top: '8px',
              bottom: '8px',
              left: '11px',
              width: '1px',
              background: '#E5E7EB'
            }}
          />

          {filteredEvents.length === 0 ? (
            <div style={{ padding: '16px', color: '#6B7280', fontSize: 11 }}>
              No audit events found for selected filter.
            </div>
          ) : (
            filteredEvents.map((evt, idx) => {
              const badge = getEventBadge(evt.actor_type);

              return (
                <div key={evt.id || idx} style={{ position: 'relative', marginBottom: 12 }}>
                  {/* Timeline Bullet Node */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '-24px',
                      top: '2px',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: '#FFFFFF',
                      border: `1px solid ${badge.color}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 9,
                      zIndex: 2
                    }}
                  >
                    {evt.actor_type === 'AI' ? <Bot size={9} color={badge.color} /> : evt.actor_type === 'HUMAN' || evt.actor_type === 'USER' ? <User size={9} color={badge.color} /> : <Cpu size={9} color={badge.color} />}
                  </div>

                  {/* Event Card */}
                  <div
                    style={{
                      background: '#F9FAFB',
                      borderRadius: 4,
                      border: '1px solid #E5E7EB',
                      padding: '10px 12px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>
                          {evt.title}
                        </span>
                        <span
                          style={{
                            padding: '1px 6px',
                            borderRadius: 3,
                            fontSize: 10,
                            fontWeight: 500,
                            color: badge.color,
                            background: badge.bg,
                            border: `1px solid ${badge.border}`
                          }}
                        >
                          {badge.label}
                        </span>
                        {evt.ai_run_id && (
                          <span style={{ fontSize: 10, color: '#1D4ED8', background: '#EFF6FF', padding: '1px 4px', borderRadius: 3, fontFamily: 'monospace' }}>
                            {evt.ai_run_id}
                          </span>
                        )}
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 11, fontWeight: 500, color: '#374151' }}>
                          {evt.time_str}
                        </span>
                        <div style={{ fontSize: 10, color: '#9CA3AF' }}>
                          {evt.timestamp}
                        </div>
                      </div>
                    </div>

                    <p style={{ margin: '0 0 6px 0', fontSize: 11, color: '#374151', lineHeight: 1.35 }}>
                      {evt.description}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 10, color: '#6B7280' }}>
                      <span><strong>Actor:</strong> {evt.actor}</span>
                    </div>

                    {/* Diffs View */}
                    {evt.diffs && Object.keys(evt.diffs).length > 0 && (
                      <div style={{ marginTop: 6, padding: '6px 8px', background: '#FFFFFF', borderRadius: 3, border: '1px solid #E5E7EB', fontSize: 11 }}>
                        <div style={{ color: '#6B7280', fontSize: 10, fontWeight: 500, marginBottom: 2 }}>Field Changes:</div>
                        {Object.entries(evt.diffs).map(([fKey, diffObj]: [string, any]) => (
                          <div key={fKey} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'monospace', color: '#374151', fontSize: 10 }}>
                            <span style={{ fontWeight: 500 }}>{fKey}:</span>
                            {diffObj.before !== undefined && (
                              <span style={{ color: '#DC2626', textDecoration: 'line-through' }}>{String(diffObj.before || 'None')}</span>
                            )}
                            <span>→</span>
                            <span style={{ color: '#059669', fontWeight: 600 }}>{String(diffObj.after || diffObj.final || diffObj.retained || 'None')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
