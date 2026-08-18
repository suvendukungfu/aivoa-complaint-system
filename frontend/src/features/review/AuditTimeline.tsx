import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { AuditTimelineResponse } from '../../types';
import { History, RotateCw, User, Cpu } from 'lucide-react';

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
      return { label: 'AI Engine', color: '#4F46E5', bg: '#EEF2FF', border: '#C7D2FE' };
    }
    if (actorType === 'HUMAN' || actorType === 'USER') {
      return { label: 'Qualified Person', color: '#065F46', bg: '#ECFDF5', border: '#A7F3D0' };
    }
    return { label: 'GxP System', color: '#475569', bg: '#F1F5F9', border: '#E2E8F0' };
  };

  const filteredEvents = timeline?.events.filter((e) => {
    if (filterActor === 'ALL') return true;
    return e.actor_type === filterActor;
  }) || [];

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      border: '1px solid #E2E8F0',
      boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
      overflow: 'hidden'
    }} className="animate-fade-in">
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FAFAFC'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: '#EEF2FF',
            color: '#4F46E5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #C7D2FE'
          }}>
            <History size={16} />
          </div>
          <div>
            <h3 style={{ fontSize: 14.5, fontWeight: 700, color: '#0F172A', margin: 0 }}>
              21 CFR Part 11 Audit Trail & Event Stream
            </h3>
            <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0' }}>
              {complaintNumber ? `Record: ${complaintNumber}` : 'Cryptographically verified timeline'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={filterActor}
            onChange={(e) => setFilterActor(e.target.value as any)}
            style={{
              height: 32,
              padding: '0 10px',
              borderRadius: 6,
              border: '1px solid #CBD5E1',
              fontSize: 12,
              fontWeight: 600,
              color: '#334155',
              backgroundColor: '#FFFFFF'
            }}
          >
            <option value="ALL">All Actors</option>
            <option value="HUMAN">Human Only</option>
            <option value="AI">AI Only</option>
          </select>

          {complaintId && (
            <button
              onClick={() => {
                loadTimeline(complaintId);
                if (onRefresh) onRefresh();
              }}
              style={{
                height: 32,
                padding: '0 10px',
                borderRadius: 6,
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                fontSize: 12,
                fontWeight: 600,
                color: '#475569',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <RotateCw size={12} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          )}
        </div>
      </div>

      {/* Event Timeline List */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {error && (
          <div style={{ fontSize: 12.5, color: '#DC2626', backgroundColor: '#FEF2F2', padding: '10px 14px', borderRadius: 8, border: '1px solid #FECACA' }}>
            {error}
          </div>
        )}

        {filteredEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 16px', color: '#94A3B8', fontSize: 13 }}>
            No audit events recorded for the selected filter.
          </div>
        ) : (
          filteredEvents.map((evt, idx) => {
            const badge = getEventBadge(evt.actor_type);
            return (
              <div
                key={evt.id || idx}
                style={{
                  display: 'flex',
                  gap: 14,
                  padding: '14px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: 10,
                  border: '1px solid #E2E8F0'
                }}
              >
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: badge.bg,
                  border: `1px solid ${badge.border}`,
                  color: badge.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {evt.actor_type === 'AI' ? <Cpu size={15} /> : <User size={15} />}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                        {evt.event_type?.replace(/_/g, ' ')}
                      </span>
                      <span style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 4,
                        backgroundColor: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`
                      }}>
                        {badge.label}
                      </span>
                    </div>
                    <span style={{ fontSize: 11.5, color: '#64748B', fontFamily: 'var(--font-mono)' }}>
                      {evt.timestamp ? new Date(evt.timestamp).toLocaleString() : 'Just now'}
                    </span>
                  </div>

                  <div style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.4 }}>
                    {evt.description || `Performed by ${evt.actor || 'System'}`}
                  </div>

                  {evt.diffs && Object.keys(evt.diffs).length > 0 && (
                    <div style={{
                      marginTop: 8,
                      padding: '8px 10px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: 6,
                      border: '1px solid #E2E8F0',
                      fontSize: 11.5,
                      fontFamily: 'var(--font-mono)',
                      color: '#475569',
                      overflowX: 'auto'
                    }}>
                      {JSON.stringify(evt.diffs, null, 2)}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AuditTimeline;
