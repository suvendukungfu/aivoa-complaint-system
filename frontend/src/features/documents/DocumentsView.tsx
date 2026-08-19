import React, { useState } from 'react';
import { useAppSelector } from '../../store';
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
  const allProvenance = complaint.field_provenance || {};

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
      maxWidth: 1440,
      margin: '0 auto',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      color: '#111827'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: 6,
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FileText size={18} color="#1D4ED8" />
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 }}>
              Document Evidence & Provenance Inspector
            </h1>
            <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0 0' }}>
              Inspect verbatim source text spans, page mapping, and parameter extraction lineage
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6B7280' }}>
          <span>Active Record: <strong style={{ color: '#111827' }}>{complaint.complaint_number || 'Draft'}</strong></span>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 14 }}>
        {/* Left: Source Text & Highlight Inspection */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: 6,
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F3F4F6', paddingBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileCheck2 size={15} color="#1D4ED8" />
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827' }}>
                {currentFile ? currentFile.name : 'Complaint Document Source Text'}
              </h3>
            </div>
            {selectedSpan && (
              <button
                onClick={() => handleCopy(selectedSpan)}
                style={{
                  padding: '3px 8px',
                  borderRadius: 3,
                  border: '1px solid #D1D5DB',
                  backgroundColor: '#FFFFFF',
                  color: '#374151',
                  fontSize: 11,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3
                }}
              >
                {copied ? <Check size={11} color="#059669" /> : <Copy size={11} />}
                <span>{copied ? 'Copied' : 'Copy Evidence'}</span>
              </button>
            )}
          </div>

          <div style={{
            padding: '14px',
            backgroundColor: '#F9FAFB',
            borderRadius: 4,
            border: '1px solid #E5E7EB',
            minHeight: 280,
            fontSize: 12,
            lineHeight: 1.5,
            color: '#111827',
            fontFamily: 'inherit'
          }}>
            {complaint.detailed_description ? (
              <p style={{ margin: 0 }}>{complaint.detailed_description}</p>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
                <UploadCloud size={24} style={{ margin: '0 auto 8px', color: '#9CA3AF' }} />
                <p style={{ margin: 0, fontSize: 12 }}>Upload a complaint PDF, DOCX, TXT, or EML in the Intake workspace to view full document text.</p>
              </div>
            )}
          </div>

          <div style={{
            padding: '8px 10px',
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: 4,
            fontSize: 11,
            color: '#1E40AF',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <ShieldCheck size={13} color="#1D4ED8" />
            <span><strong>Non-Fabrication Invariant:</strong> Inferred fields without verbatim text are explicitly labeled as <code>INFERRED</code> without fabricated citations.</span>
          </div>
        </div>

        {/* Right: Extracted Entities & Citations List */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: 6,
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F3F4F6', paddingBottom: 8 }}>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827' }}>
              Extracted Parameters ({evidenceItems.length})
            </h3>
          </div>

          {evidenceItems.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#6B7280', backgroundColor: '#F9FAFB', borderRadius: 4, border: '1px dashed #D1D5DB', fontSize: 11 }}>
              No verbatim evidence citations extracted yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 380, overflowY: 'auto' }}>
              {evidenceItems.map(([field, prov]) => {
                const isSelected = selectedSpan === prov.text_span;
                return (
                  <div
                    key={field}
                    onClick={() => setSelectedSpan(prov.text_span || null)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 4,
                      border: isSelected ? '1px solid #1D4ED8' : '1px solid #E5E7EB',
                      backgroundColor: isSelected ? '#EFF6FF' : '#F9FAFB',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 3
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#111827', textTransform: 'capitalize' }}>
                        {field.replace(/_/g, ' ')}
                      </span>
                      <span style={{ fontSize: 10, color: '#1D4ED8', fontWeight: 500 }}>
                        {Math.round(prov.confidence * 100)}% Conf
                      </span>
                    </div>

                    <div style={{ fontSize: 10, color: '#4B5563', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      "{prov.text_span}"
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
