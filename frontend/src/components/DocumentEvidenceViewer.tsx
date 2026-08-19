import React, { useState, useEffect, useRef } from 'react';
import type { FieldProvenanceItem } from '../types';
import { X, FileText, Check, Copy } from 'lucide-react';

interface DocumentEvidenceViewerProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle?: string;
  documentText?: string;
  activeProvenance?: FieldProvenanceItem | null;
  allProvenance?: Record<string, FieldProvenanceItem>;
  onSelectField?: (fieldKey: string) => void;
}

export const DocumentEvidenceViewer: React.FC<DocumentEvidenceViewerProps> = ({
  isOpen,
  onClose,
  documentTitle = 'Source Complaint Document',
  documentText = '',
  activeProvenance,
  allProvenance = {},
  onSelectField
}) => {
  const [selectedSpan, setSelectedSpan] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const highlightRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (activeProvenance?.text_span) {
      setSelectedSpan(activeProvenance.text_span);
    }
  }, [activeProvenance]);

  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedSpan]);

  if (!isOpen) return null;

  const handleCopyEvidence = () => {
    if (selectedSpan) {
      navigator.clipboard.writeText(selectedSpan);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const renderHighlightedText = () => {
    if (!documentText) {
      return (
        <div style={{ color: '#6B7280', padding: '24px', textAlign: 'center', fontSize: 12 }}>
          No raw document text available for this complaint intake.
        </div>
      );
    }

    if (!selectedSpan) {
      return <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0, fontSize: 12 }}>{documentText}</pre>;
    }

    const cleanTarget = selectedSpan.replace(/^\.\.\.|\.\.\.$/g, '').trim();
    if (!cleanTarget) {
      return <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0, fontSize: 12 }}>{documentText}</pre>;
    }

    const index = documentText.toLowerCase().indexOf(cleanTarget.toLowerCase());
    if (index === -1) {
      return <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0, fontSize: 12 }}>{documentText}</pre>;
    }

    const before = documentText.slice(0, index);
    const match = documentText.slice(index, index + cleanTarget.length);
    const after = documentText.slice(index + cleanTarget.length);

    return (
      <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0, lineHeight: 1.5, fontSize: 12 }}>
        {before}
        <mark
          ref={highlightRef}
          style={{
            backgroundColor: '#FEF08A',
            color: '#854D0E',
            padding: '1px 3px',
            borderRadius: '2px',
            fontWeight: 600,
            border: '1px solid #FDE047'
          }}
        >
          {match}
        </mark>
        {after}
      </pre>
    );
  };

  const evidenceItems = Object.entries(allProvenance).filter(
    ([, prov]) => Boolean(prov?.text_span)
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        zIndex: 200,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 6,
          width: '100%',
          maxWidth: '900px',
          height: '80vh',
          maxHeight: '700px',
          boxShadow: '0 12px 24px -4px rgba(16, 24, 40, 0.16)',
          border: '1px solid #E5E7EB',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid #E5E7EB',
            backgroundColor: '#F9FAFB',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={15} color="#1D4ED8" />
            <div>
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827' }}>
                Document Evidence Inspector
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: 11, color: '#6B7280' }}>
                {documentTitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#6B7280',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: 3
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Two-Column Body */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', flex: 1, overflow: 'hidden' }}>
          {/* Main Document Content */}
          <div
            style={{
              padding: '16px',
              overflowY: 'auto',
              borderRight: '1px solid #E5E7EB',
              backgroundColor: '#FFFFFF',
              color: '#111827'
            }}
          >
            {renderHighlightedText()}
          </div>

          {/* Right-Side Evidence Index */}
          <div style={{ backgroundColor: '#F9FAFB', padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>
                Extracted Entities ({evidenceItems.length})
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {evidenceItems.map(([key, prov]) => {
                const isSelected = selectedSpan === prov.text_span;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setSelectedSpan(prov.text_span || null);
                      if (onSelectField) onSelectField(key);
                    }}
                    style={{
                      textAlign: 'left',
                      padding: '6px 8px',
                      borderRadius: 4,
                      border: isSelected ? '1px solid #1D4ED8' : '1px solid #E5E7EB',
                      backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: isSelected ? '#1D4ED8' : '#111827', textTransform: 'capitalize' }}>
                        {key.replace(/_/g, ' ')}
                      </span>
                      {prov.page_number && (
                        <span style={{ fontSize: 9, color: '#6B7280', backgroundColor: '#F3F4F6', padding: '1px 3px', borderRadius: 2 }}>
                          P.{prov.page_number}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 10, color: '#4B5563', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      "{prov.text_span}"
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '8px 16px',
            borderTop: '1px solid #E5E7EB',
            backgroundColor: '#F9FAFB',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 11
          }}
        >
          <span style={{ color: '#6B7280' }}>
            Non-fabrication invariant: Inferred parameters have no text citations.
          </span>

          <div style={{ display: 'flex', gap: 6 }}>
            {selectedSpan && (
              <button
                onClick={handleCopyEvidence}
                style={{
                  padding: '4px 8px',
                  borderRadius: 3,
                  border: '1px solid #D1D5DB',
                  backgroundColor: '#FFFFFF',
                  color: '#374151',
                  fontSize: 11,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                {copied ? <Check size={11} color="#059669" /> : <Copy size={11} />}
                <span>{copied ? 'Copied' : 'Copy Span'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                padding: '4px 10px',
                borderRadius: 3,
                border: 'none',
                backgroundColor: '#1D4ED8',
                color: '#FFFFFF',
                fontSize: 11,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
