import React from 'react';
import type { AuditTimelineEventItem } from '../../types';
import { History, Bot, User, Cpu, ArrowRight, ShieldAlert, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

interface ComplaintActivityTimelineProps {
  events: AuditTimelineEventItem[];
  complaintNumber?: string;
}

export const ComplaintActivityTimeline: React.FC<ComplaintActivityTimelineProps> = ({
  events,
  complaintNumber
}) => {
  if (!events || events.length === 0) {
    return (
      <div
        style={{
          padding: '24px',
          textAlign: 'center',
          color: '#6B7280',
          backgroundColor: '#FFFFFF',
          borderRadius: 4,
          border: '1px solid #E5E7EB'
        }}
      >
        <History size={20} style={{ margin: '0 auto 6px', color: '#9CA3AF' }} />
        <p style={{ margin: 0, fontSize: 12 }}>No audit events recorded yet for this complaint.</p>
      </div>
    );
  }

  const getActorBadge = (actorType: string, actor: string) => {
    const typeUpper = (actorType || 'AI').toUpperCase();
    if (typeUpper === 'USER' || typeUpper === 'HUMAN') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            backgroundColor: '#ECFDF5',
            color: '#065F46',
            padding: '1px 6px',
            borderRadius: 3,
            fontSize: 10,
            fontWeight: 500,
            border: '1px solid #A7F3D0'
          }}
        >
          <User size={10} /> {actor || 'Quality Reviewer'}
        </span>
      );
    }
    if (typeUpper === 'AI') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            backgroundColor: '#EFF6FF',
            color: '#1D4ED8',
            padding: '1px 6px',
            borderRadius: 3,
            fontSize: 10,
            fontWeight: 500,
            border: '1px solid #BFDBFE'
          }}
        >
          <Bot size={10} /> AI Engine
        </span>
      );
    }
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 3,
          backgroundColor: '#F3F4F6',
          color: '#374151',
          padding: '1px 6px',
          borderRadius: 3,
          fontSize: 10,
          fontWeight: 500,
          border: '1px solid #E5E7EB'
        }}
      >
        <Cpu size={10} /> System
      </span>
    );
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'USER_APPROVED':
        return <CheckCircle2 size={13} color="#059669" />;
      case 'USER_REJECTED':
        return <AlertTriangle size={13} color="#DC2626" />;
      case 'USER_MODIFIED':
      case 'HUMAN_OVERRIDE':
        return <ShieldAlert size={13} color="#1D4ED8" />;
      case 'DOCUMENT_EXTRACTED':
        return <FileText size={13} color="#4B5563" />;
      default:
        return <History size={13} color="#6B7280" />;
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 4,
        border: '1px solid #E5E7EB',
        padding: '14px',
        boxShadow: '0 1px 2px 0 rgba(16, 24, 40, 0.04)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h4 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: 6 }}>
          <History size={14} color="#1D4ED8" />
          Chronological Activity & 21 CFR Part 11 Audit Trail {complaintNumber ? `(${complaintNumber})` : ''}
        </h4>
        <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 500 }}>
          {events.length} Immutable Events
        </span>
      </div>

      <div style={{ position: 'relative', paddingLeft: '20px' }}>
        {/* Continuous timeline line */}
        <div
          style={{
            position: 'absolute',
            left: '9px',
            top: '6px',
            bottom: '6px',
            width: '1px',
            backgroundColor: '#E5E7EB'
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {events.map((evt, idx) => (
            <div key={evt.id || idx} style={{ position: 'relative' }}>
              {/* Event node icon */}
              <div
                style={{
                  position: 'absolute',
                  left: '-20px',
                  top: '2px',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #D1D5DB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {getEventIcon(evt.event_type)}
              </div>

              {/* Event Content Card */}
              <div
                style={{
                  backgroundColor: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: 4,
                  padding: '8px 10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>
                      {evt.title}
                    </span>
                    {getActorBadge(evt.actor_type, evt.actor)}
                  </div>
                  <span style={{ fontSize: 10, color: '#6B7280', fontFamily: 'monospace' }}>
                    {evt.time_str || evt.timestamp}
                  </span>
                </div>

                <p style={{ margin: '2px 0 0 0', fontSize: 11, color: '#374151', lineHeight: 1.35 }}>
                  {evt.description}
                </p>

                {/* Diff inspection block if available */}
                {evt.diffs && Object.keys(evt.diffs).length > 0 && (
                  <div
                    style={{
                      marginTop: 6,
                      padding: '4px 8px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: 3,
                      border: '1px solid #E5E7EB',
                      fontSize: 10,
                      fontFamily: 'monospace',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 6
                    }}
                  >
                    {Object.entries(evt.diffs).map(([field, diff]: [string, any]) => (
                      <span key={field} style={{ color: '#111827' }}>
                        <strong>{field}</strong>:{' '}
                        {diff.before !== undefined && <span style={{ color: '#DC2626', textDecoration: 'line-through' }}>{String(diff.before)}</span>}{' '}
                        <ArrowRight size={9} style={{ display: 'inline', margin: '0 1px' }} />{' '}
                        <span style={{ color: '#059669', fontWeight: 600 }}>
                          {String(diff.after || diff.human_override || diff.final || '')}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
