import React, { useState } from 'react';
import { useAppSelector } from '../../store';
import type { FieldProvenanceItem } from '../../types';
import {
  FileText,
  Copy,
  Check,
  ShieldCheck,
  UploadCloud,
  FileCheck2
} from 'lucide-react';

export const DocumentsView: React.FC = () => {
  const currentFile = useAppSelector((state) => state.document.currentFile);
  const complaint = useAppSelector((state) => state.complaint.data);
  const allProvenance: Record<string, FieldProvenanceItem> = (complaint.field_provenance as any) || {};

  const [selectedSpan, setSelectedSpan] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const evidenceItems = Object.entries(allProvenance).filter(
    ([, prov]) => Boolean(prov?.text_span)
  );

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      maxWidth: 1360,
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
      color: '#0F172A'
    }} className="animate-fade-in">
      {/* Header */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        padding: '18px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            backgroundColor: '#EEF2FF',
            color: '#4F46E5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #C7D2FE'
          }}>
            <FileText size={18} />
          </div>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Document Evidence & Provenance Inspector
            </h1>
            <p style={{ fontSize: 12.5, color: '#64748B', margin: '2px 0 0 0', fontWeight: 500 }}>
              Inspect verbatim source text spans, page mapping, and parameter extraction lineage
            </p>
          </div>
        </div>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          backgroundColor: '#ECFDF5',
          border: '1px solid #A7F3D0',
          padding: '4px 12px',
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 700,
          color: '#065F46'
        }}>
          <ShieldCheck size={14} style={{ color: '#10B981' }} />
          <span>ALCOA+ Traceable Lineage</span>
        </div>
      </div>

      {/* Main Grid: Left is Evidence Lineage, Right is Raw Source Document */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: 18
      }}>
        {/* Left Column: Traceable Text Spans */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '14px 18px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#FAFAFC'
          }}>
            <h2 style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Extracted Evidence Spans ({evidenceItems.length})
            </h2>
            <span style={{ fontSize: 11.5, color: '#64748B', fontWeight: 500 }}>
              Complaint: {complaint.complaint_number || 'DRAFT'}
            </span>
          </div>

          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', maxHeight: '600px' }}>
            {evidenceItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: '#94A3B8', fontSize: 13 }}>
                No text span evidence recorded for the current complaint draft.
              </div>
            ) : (
              evidenceItems.map(([fieldName, prov]) => (
                <div
                  key={fieldName}
                  onClick={() => setSelectedSpan(prov?.text_span || '')}
                  style={{
                    backgroundColor: selectedSpan === prov?.text_span ? '#EEF2FF' : '#F8FAFC',
                    border: `1px solid ${selectedSpan === prov?.text_span ? '#818CF8' : '#E2E8F0'}`,
                    borderRadius: 10,
                    padding: '12px 14px',
                    cursor: 'pointer',
                    transition: 'all 140ms ease-out',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', textTransform: 'capitalize' }}>
                      {fieldName.replace('_', ' ')}
                    </span>
                    <span style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: '#059669',
                      backgroundColor: '#ECFDF5',
                      padding: '1px 6px',
                      borderRadius: 4,
                      border: '1px solid #A7F3D0'
                    }}>
                      {prov?.confidence ? `${Math.round(prov.confidence * 100)}%` : '100%'}
                    </span>
                  </div>

                  <div style={{
                    fontSize: 12,
                    fontStyle: 'italic',
                    color: '#334155',
                    lineHeight: 1.4,
                    marginBottom: 6
                  }}>
                    "{prov?.text_span}"
                  </div>

                  <div style={{ fontSize: 11, color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Source: {prov?.source_type || 'Document'}</span>
                    {prov?.page_number && <span>Page {prov.page_number}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Source Document Viewer */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '14px 18px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#FAFAFC'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileCheck2 size={15} style={{ color: '#4F46E5' }} />
              <h2 style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                {currentFile ? (currentFile.filename || currentFile.name) : 'Active Ingestion Document'}
              </h2>
            </div>

            {currentFile && (
              <button
                onClick={() => handleCopy(currentFile.text_content || '')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 8px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: 6,
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                {copied ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </button>
            )}
          </div>

          <div style={{ padding: '16px', flex: 1, overflowY: 'auto', maxHeight: '600px' }}>
            {currentFile && currentFile.text_content ? (
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                lineHeight: 1.6,
                color: '#1E293B',
                whiteSpace: 'pre-wrap',
                backgroundColor: '#F8FAFC',
                padding: '14px',
                borderRadius: 8,
                border: '1px solid #E2E8F0'
              }}>
                {currentFile.text_content}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '60px 16px',
                color: '#94A3B8',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10
              }}>
                <UploadCloud size={36} style={{ color: '#CBD5E1' }} />
                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#475569' }}>
                  No Active Supporting Document Uploaded
                </div>
                <div style={{ fontSize: 12, color: '#94A3B8', maxWidth: 320 }}>
                  Upload a batch release certificate, CoA (.pdf, .docx, .txt), or customer letter in Complaint Intake to inspect full document context.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentsView;
