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

  const badgeColor = isUser ? '#34D399' : isExplicit ? '#FFFFFF' : '#FBBF24';
  const badgeBg = isUser ? 'rgba(16, 185, 129, 0.12)' : isExplicit ? 'rgba(255, 255, 255, 0.08)' : 'rgba(245, 158, 11, 0.12)';
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
            borderRadius: 4,
            padding: '1px 6px',
            fontSize: 10,
            fontWeight: 600,
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
            backgroundColor: 'rgba(12, 13, 14, 0.96)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: 8,
            border: '1px solid rgba(255, 255, 255, 0.14)',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.65)',
            padding: '10px 12px',
            fontSize: 11,
            color: '#FFFFFF',
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
                  borderRadius: 3,
                  padding: '1px 5px',
                  fontWeight: 600,
                  fontSize: 10
                }}
              >
                {badgeLabel} {isExplicit ? 'Extracted' : isInferred ? 'Inference' : 'Edit'}
              </span>
              <span style={{ fontWeight: 600, color: 'rgba(255, 255, 255, 0.90)' }}>{label}</span>
            </div>
            {provenance.confidence !== undefined && (
              <span style={{ color: 'rgba(255, 255, 255, 0.50)', fontSize: 10, fontFamily: 'var(--font-mono)' }}>
                {Math.round(provenance.confidence * 100)}% conf
              </span>
            )}
          </div>

          {/* Evidence Snippet */}
          {provenance.text_span ? (
            <div style={{ marginBottom: 6 }}>
              <div style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: 9.5, textTransform: 'uppercase', marginBottom: 2, letterSpacing: '0.04em' }}>
                Verbatim Evidence
              </div>
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  borderLeft: '2px solid #FFFFFF',
                  padding: '4px 6px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10.5,
                  color: '#FFFFFF',
                  lineHeight: 1.35,
                  borderRadius: '0 4px 4px 0'
                }}
              >
                &ldquo;{provenance.text_span}&rdquo;
              </div>
            </div>
          ) : isInferred ? (
            <div style={{ marginBottom: 6, color: 'rgba(255, 255, 255, 0.50)', fontSize: 10.5, fontStyle: 'italic' }}>
              Field inferred from context / standard QMS rules (no direct textual span).
            </div>
          ) : null}

          {/* Source Document & Page */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: 'rgba(255, 255, 255, 0.50)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <FileText size={10} />
              <span>{provenance.source_document_id || 'Complaint Document'}</span>
              {provenance.page_number !== null && provenance.page_number !== undefined && (
                <span>· Page {provenance.page_number}</span>
              )}
            </div>

            {onOpenEvidence && (
              <button
                type="button"
                onClick={() => onOpenEvidence(provenance)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  fontSize: 10,
                  fontWeight: 600,
                  padding: 0
                }}
              >
                <span>View Source</span>
                <ExternalLink size={9} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
