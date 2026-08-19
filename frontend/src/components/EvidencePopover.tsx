import React, { useState } from 'react';
import type { FieldProvenanceItem } from '../types';
import { FileText, UserCheck, ExternalLink, HelpCircle, Bot } from 'lucide-react';

interface EvidencePopoverProps {
  provenance?: FieldProvenanceItem;
  label: string;
  onOpenEvidence?: (provenance: FieldProvenanceItem) => void;
  children: React.ReactNode;
}

export const EvidencePopover: React.FC<EvidencePopoverProps> = ({
  provenance,
  label,
  onOpenEvidence,
  children
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!provenance) {
    return <>{children}</>;
  }

  const isExplicit = provenance.classification === 'EXPLICIT_EXTRACTED';
  const isUser = provenance.classification === 'USER_SPECIFIED' || provenance.source_type === 'user_edit';
  const isInferred = provenance.classification === 'INFERRED' || provenance.source_type === 'ai_inference';

  const badgeColor = isUser ? '#059669' : isExplicit ? '#1D4ED8' : '#D97706';
  const badgeBg = isUser ? '#ECFDF5' : isExplicit ? '#EFF6FF' : '#FFFBEB';
  const badgeLabel = isUser ? 'User' : isExplicit ? 'AI' : 'Inferred';

  return (
    <div
      style={{ position: 'relative', width: '100%' }}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div style={{ position: 'relative' }}>
        {children}

        {/* Indicator icon inside field */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          aria-label={`View evidence for ${label}`}
          style={{
            position: 'absolute',
            right: 6,
            top: '50%',
            transform: 'translateY(-50%)',
            background: badgeBg,
            border: `1px solid ${badgeColor}33`,
            color: badgeColor,
            borderRadius: 3,
            padding: '1px 5px',
            fontSize: 10,
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            zIndex: 2
          }}
        >
          {isUser && <UserCheck size={10} />}
          {isExplicit && <Bot size={10} />}
          {isInferred && <HelpCircle size={10} />}
          <span>{badgeLabel}</span>
        </button>
      </div>

      {/* Floating Provenance Popover Card */}
      {isOpen && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 50,
            backgroundColor: '#FFFFFF',
            borderRadius: 4,
            border: '1px solid #E5E7EB',
            boxShadow: '0 4px 12px -2px rgba(16, 24, 40, 0.12)',
            padding: '10px 12px',
            fontSize: 11,
            color: '#111827',
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span
                style={{
                  background: badgeBg,
                  color: badgeColor,
                  padding: '1px 5px',
                  borderRadius: 3,
                  fontWeight: 500,
                  fontSize: 10
                }}
              >
                {isUser ? 'User Specified' : isExplicit ? 'AI Extracted' : 'AI Inferred'}
              </span>
              <span style={{ fontWeight: 600, color: '#111827' }}>{label}</span>
            </div>

            <span style={{ fontSize: 10, color: '#6B7280' }}>
              Confidence: <strong style={{ color: '#111827' }}>{Math.round(provenance.confidence * 100)}%</strong>
            </span>
          </div>

          {/* Source Citation */}
          <div style={{ marginBottom: 6, color: '#4B5563', fontSize: 11 }}>
            <span style={{ color: '#6B7280' }}>Source: </span>
            <strong style={{ color: '#111827' }}>
              {provenance.source_document_id
                ? provenance.source_document_id
                : provenance.source_type === 'customer_prompt'
                ? 'Customer Communication'
                : provenance.source_type === 'user_edit'
                ? 'Quality Operator'
                : 'AI Reasoning Engine'}
            </strong>

            {provenance.page_number !== undefined && provenance.page_number !== null && (
              <span
                style={{
                  marginLeft: 6,
                  background: '#F3F4F6',
                  padding: '1px 4px',
                  borderRadius: 3,
                  fontSize: 10,
                  color: '#4B5563'
                }}
              >
                Page {provenance.page_number}
              </span>
            )}
          </div>

          {/* Verbatim Evidence Snippet */}
          {provenance.text_span ? (
            <div
              style={{
                backgroundColor: '#F9FAFB',
                borderLeft: `2px solid ${badgeColor}`,
                padding: '6px 8px',
                borderRadius: '0 3px 3px 0',
                marginBottom: 8,
                fontFamily: 'monospace',
                fontSize: 11,
                color: '#111827',
                lineHeight: 1.35
              }}
            >
              <div style={{ fontSize: 9, color: '#6B7280', textTransform: 'uppercase', marginBottom: 2, fontWeight: 600 }}>
                Verbatim Evidence:
              </div>
              "{provenance.text_span}"
            </div>
          ) : (
            <div
              style={{
                backgroundColor: '#F9FAFB',
                borderLeft: '2px solid #D97706',
                padding: '4px 8px',
                borderRadius: '0 3px 3px 0',
                marginBottom: 8,
                fontSize: 10,
                color: '#4B5563'
              }}
            >
              {isUser
                ? 'Specified directly by quality operator.'
                : 'Inferred by AI from complaint context (no verbatim text span).'}
            </div>
          )}

          {/* AI Run ID & Open Evidence Action */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4, borderTop: '1px solid #F3F4F6' }}>
            <span style={{ fontSize: 10, color: '#9CA3AF' }}>
              {provenance.ai_run_id ? `Run: ${provenance.ai_run_id}` : 'Manual Input'}
            </span>

            {provenance.text_span && onOpenEvidence && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenEvidence(provenance);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1D4ED8',
                  fontWeight: 500,
                  fontSize: 10,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  padding: '1px 4px'
                }}
              >
                <FileText size={11} />
                <span>Open Evidence</span>
                <ExternalLink size={9} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
