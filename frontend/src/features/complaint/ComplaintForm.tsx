import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  updateSingleField,
  resetComplaint,
  setComplaintData,
  clearUpdatedFields
} from '../../store/complaintSlice';
import { setToast, setSelectedFieldForEvidence } from '../../store/uiSlice';
import { api } from '../../services/api';
import { EvidencePopover } from '../../components/EvidencePopover';
import type { ComplaintData, SeverityLevel, PriorityLevel } from '../../types';
import {
  Building2,
  Package,
  FileText,
  Save,
  RotateCcw,
  ShieldCheck,
  Send,
  History,
  X
} from 'lucide-react';

export const ComplaintForm: React.FC = () => {
  const dispatch = useAppDispatch();
  const formData = useAppSelector((state) => state.complaint.data);
  const updatedFields = useAppSelector((state) => state.complaint.updatedFields);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [activeHistoryField, setActiveHistoryField] = useState<string | null>(null);

  const handleChange = (field: keyof ComplaintData, value: any) => {
    dispatch(updateSingleField({ field, value }));
    setSaveStatus('unsaved');
  };

  const handleSave = async () => {
    if (!formData.customer_name && !formData.product_name) {
      dispatch(setToast({
        message: 'Please enter at least a customer or product name before saving.',
        type: 'error'
      }));
      return;
    }

    setSaving(true);
    setSaveStatus('saving');
    try {
      const res = await api.saveComplaint(formData);
      dispatch(setComplaintData({
        ...formData,
        id: res.id,
        complaint_number: res.complaint_number,
        status: res.status
      }));
      dispatch(setToast({
        message: `Saved complaint record: ${res.complaint_number}`,
        type: 'success'
      }));
      setSaveStatus('saved');
      dispatch(clearUpdatedFields());
    } catch (err: any) {
      dispatch(setToast({
        message: err.message || 'Failed to save complaint record.',
        type: 'error'
      }));
      setSaveStatus('unsaved');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitTriage = async () => {
    await handleSave();
    dispatch(setToast({
      message: 'Complaint submitted to Quality Review Queue (Pending Triage).',
      type: 'success'
    }));
  };

  const handleReset = () => {
    dispatch(resetComplaint());
    setSaveStatus('saved');
    dispatch(setToast({
      message: 'Form cleared and initialized for new complaint intake.',
      type: 'info'
    }));
  };

  const activeProvenance = activeHistoryField && formData.field_provenance
    ? formData.field_provenance[activeHistoryField]
    : null;

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderRadius: 6,
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)',
      overflow: 'hidden'
    }}>
      {/* 1. Header Bar with Metadata & Compact Actions */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #E5E7EB',
        backgroundColor: '#F9FAFB',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              fontWeight: 700,
              color: '#111827'
            }}>
              {formData.complaint_number || 'CMP-DRAFT-2026'}
            </span>

            <span style={{
              fontSize: 10,
              padding: '1px 6px',
              borderRadius: 3,
              backgroundColor: '#EFF6FF',
              color: '#1D4ED8',
              border: '1px solid #BFDBFE',
              fontWeight: 600
            }}>
              {formData.status || 'DRAFT'}
            </span>

            <span className={`badge ${
              formData.severity === 'Critical' ? 'badge-critical' :
              formData.severity === 'High' ? 'badge-high' :
              formData.severity === 'Medium' ? 'badge-medium' : 'badge-low'
            }`}>
              {formData.severity || 'Medium'}
            </span>

            <span className={`badge ${
              formData.priority === 'Urgent' ? 'badge-urgent' :
              formData.priority === 'High' ? 'badge-high' : 'badge-normal'
            }`}>
              {formData.priority || 'Normal'}
            </span>
          </div>

          <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2, display: 'flex', gap: 10 }}>
            <span>Created: <strong>{formData.created_at ? new Date(formData.created_at).toLocaleDateString() : 'Today'}</strong></span>
            <span>Assignee: <strong>Quality Assurance Lead</strong></span>
            <span style={{ color: saveStatus === 'saved' ? '#059669' : '#D97706' }}>
              • {saveStatus === 'saved' ? 'Saved to draft' : saveStatus === 'saving' ? 'Saving draft...' : 'Unsaved edits'}
            </span>
          </div>
        </div>

        {/* Compact Action Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            onClick={handleReset}
            style={{
              height: 28,
              padding: '0 8px',
              borderRadius: 4,
              border: '1px solid #D1D5DB',
              backgroundColor: '#FFFFFF',
              color: '#4B5563',
              fontSize: 11,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              height: 28,
              padding: '0 10px',
              borderRadius: 4,
              border: '1px solid #D1D5DB',
              backgroundColor: '#FFFFFF',
              color: '#111827',
              fontSize: 11,
              fontWeight: 500,
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <Save size={12} color="#1D4ED8" />
            <span>{saving ? 'Saving...' : 'Save Draft'}</span>
          </button>

          <button
            type="button"
            onClick={handleSubmitTriage}
            style={{
              height: 28,
              padding: '0 12px',
              borderRadius: 4,
              border: 'none',
              backgroundColor: '#1D4ED8',
              color: '#FFFFFF',
              fontSize: 11,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <Send size={12} />
            <span>Submit for Review</span>
          </button>
        </div>
      </div>

      {/* 2. Structured 4-Section Form Body */}
      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        
        {/* SECTION 1: Complaint Source */}
        <div>
          <div style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#111827',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            borderBottom: '1px solid #F3F4F6',
            paddingBottom: 4
          }}>
            <Building2 size={13} color="#1D4ED8" />
            <span>1. Complaint Source & Intake Origin</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <label className="form-label">Customer / Institution</label>
                {formData.field_provenance?.customer_name && (
                  <button
                    type="button"
                    onClick={() => setActiveHistoryField('customer_name')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: 10, display: 'flex', alignItems: 'center', gap: 2 }}
                  >
                    <History size={10} /> History
                  </button>
                )}
              </div>
              <EvidencePopover provenance={formData.field_provenance?.customer_name} label="Customer Name" onOpenEvidence={(p) => dispatch(setSelectedFieldForEvidence(p))}>
                <input
                  type="text"
                  className={`form-input ${updatedFields.includes('customer_name') ? 'field-updated' : ''}`}
                  placeholder="e.g. Apex Health Systems"
                  value={formData.customer_name || ''}
                  onChange={(e) => handleChange('customer_name', e.target.value)}
                />
              </EvidencePopover>
            </div>

            <div>
              <label className="form-label">Complaint Source</label>
              <select
                className="form-select"
                value={formData.complaint_source || 'Customer Email'}
                onChange={(e) => handleChange('complaint_source', e.target.value)}
              >
                <option value="Customer Email">Customer Email</option>
                <option value="Phone / Direct Call">Phone / Direct Call</option>
                <option value="Distributor Notification">Distributor Notification</option>
                <option value="Certificate of Analysis">Certificate of Analysis (CoA)</option>
                <option value="Regulatory Authority">Regulatory Authority (FDA / EMA)</option>
              </select>
            </div>

            <div>
              <label className="form-label">Complaint Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.complaint_date || new Date().toISOString().split('T')[0]}
                onChange={(e) => handleChange('complaint_date', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Product Identification */}
        <div>
          <div style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#111827',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            borderBottom: '1px solid #F3F4F6',
            paddingBottom: 4
          }}>
            <Package size={13} color="#1D4ED8" />
            <span>2. Product Identification & Batch Traceability</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <label className="form-label">Product Name</label>
                {formData.field_provenance?.product_name && (
                  <button
                    type="button"
                    onClick={() => setActiveHistoryField('product_name')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: 10, display: 'flex', alignItems: 'center', gap: 2 }}
                  >
                    <History size={10} /> History
                  </button>
                )}
              </div>
              <EvidencePopover provenance={formData.field_provenance?.product_name} label="Product Name" onOpenEvidence={(p) => dispatch(setSelectedFieldForEvidence(p))}>
                <input
                  type="text"
                  className={`form-input ${updatedFields.includes('product_name') ? 'field-updated' : ''}`}
                  placeholder="e.g. Paracetamol Active Ingredient"
                  value={formData.product_name || ''}
                  onChange={(e) => handleChange('product_name', e.target.value)}
                />
              </EvidencePopover>
            </div>

            <div>
              <label className="form-label">Strength / Grade</label>
              <input
                type="text"
                className={`form-input ${updatedFields.includes('product_strength') ? 'field-updated' : ''}`}
                placeholder="e.g. 500mg USP Grade"
                value={formData.product_strength || ''}
                onChange={(e) => handleChange('product_strength', e.target.value)}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <label className="form-label">Batch / Lot Number</label>
                {formData.field_provenance?.batch_number && (
                  <button
                    type="button"
                    onClick={() => setActiveHistoryField('batch_number')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: 10, display: 'flex', alignItems: 'center', gap: 2 }}
                  >
                    <History size={10} /> History
                  </button>
                )}
              </div>
              <EvidencePopover provenance={formData.field_provenance?.batch_number} label="Batch Number" onOpenEvidence={(p) => dispatch(setSelectedFieldForEvidence(p))}>
                <input
                  type="text"
                  style={{ fontFamily: 'var(--font-mono)' }}
                  className={`form-input ${updatedFields.includes('batch_number') ? 'field-updated' : ''}`}
                  placeholder="e.g. PA240812-A"
                  value={formData.batch_number || ''}
                  onChange={(e) => handleChange('batch_number', e.target.value)}
                />
              </EvidencePopover>
            </div>

            <div>
              <label className="form-label">Manufacturing Date</label>
              <input
                type="date"
                className={`form-input ${updatedFields.includes('manufacturing_date') ? 'field-updated' : ''}`}
                value={formData.manufacturing_date || ''}
                onChange={(e) => handleChange('manufacturing_date', e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">Expiry Date</label>
              <input
                type="date"
                className={`form-input ${updatedFields.includes('expiry_date') ? 'field-updated' : ''}`}
                value={formData.expiry_date || ''}
                onChange={(e) => handleChange('expiry_date', e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 6 }}>
              <div>
                <label className="form-label">Quantity Affected</label>
                <input
                  type="text"
                  className={`form-input ${updatedFields.includes('quantity_affected') ? 'field-updated' : ''}`}
                  placeholder="e.g. 50"
                  value={formData.quantity_affected || ''}
                  onChange={(e) => handleChange('quantity_affected', e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">Unit</label>
                <select
                  className="form-select"
                  value={formData.quantity_unit || 'kg'}
                  onChange={(e) => handleChange('quantity_unit', e.target.value)}
                >
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="units">units</option>
                  <option value="drums">drums</option>
                  <option value="bottles">bottles</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: Complaint Details & Narrative */}
        <div>
          <div style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#111827',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            borderBottom: '1px solid #F3F4F6',
            paddingBottom: 4
          }}>
            <FileText size={13} color="#1D4ED8" />
            <span>3. Defect Classification & Narrative Scope</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
            <div>
              <label className="form-label">Classification / Defect Type</label>
              <select
                className="form-select"
                value={formData.complaint_type || 'Foreign Matter / Contamination'}
                onChange={(e) => handleChange('complaint_type', e.target.value)}
              >
                <option value="Foreign Matter / Contamination">Foreign Matter / Contamination</option>
                <option value="Potency / Out of Specification">Potency / Out of Specification</option>
                <option value="Packaging / Labeling Defect">Packaging / Labeling Defect</option>
                <option value="Physical / Appearance Defect">Physical / Appearance Defect</option>
                <option value="Dissolution / Disintegration Failure">Dissolution / Disintegration Failure</option>
                <option value="Damaged Shipment / Seals Broken">Damaged Shipment / Seals Broken</option>
              </select>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <label className="form-label">Detailed Complaint Narrative</label>
                {formData.field_provenance?.detailed_description && (
                  <button
                    type="button"
                    onClick={() => setActiveHistoryField('detailed_description')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: 10, display: 'flex', alignItems: 'center', gap: 2 }}
                  >
                    <History size={10} /> History
                  </button>
                )}
              </div>
              <EvidencePopover provenance={formData.field_provenance?.detailed_description} label="Detailed Description" onOpenEvidence={(p) => dispatch(setSelectedFieldForEvidence(p))}>
                <textarea
                  rows={3}
                  className={`form-textarea ${updatedFields.includes('detailed_description') ? 'field-updated' : ''}`}
                  placeholder="Enter verbatim customer narrative or copy text from email/report..."
                  value={formData.detailed_description || ''}
                  onChange={(e) => handleChange('detailed_description', e.target.value)}
                />
              </EvidencePopover>
            </div>
          </div>
        </div>

        {/* SECTION 4: Quality Risk Assessment */}
        <div>
          <div style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#111827',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            borderBottom: '1px solid #F3F4F6',
            paddingBottom: 4
          }}>
            <ShieldCheck size={13} color="#1D4ED8" />
            <span>4. Quality Risk Assessment & Disposition</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <div>
              <label className="form-label">Defect Severity</label>
              <select
                className="form-select"
                value={formData.severity || 'Medium'}
                onChange={(e) => handleChange('severity', e.target.value as SeverityLevel)}
              >
                <option value="Critical">Critical (Immediate Quarantine / Recall)</option>
                <option value="High">High (Adulteration / OOS Contamination)</option>
                <option value="Medium">Medium (Secondary Packaging Defect)</option>
                <option value="Low">Low (Minor Documentation Error)</option>
              </select>
            </div>

            <div>
              <label className="form-label">Triage Priority</label>
              <select
                className="form-select"
                value={formData.priority || 'Normal'}
                onChange={(e) => handleChange('priority', e.target.value as PriorityLevel)}
              >
                <option value="Urgent">Urgent (Action within 4 Hours)</option>
                <option value="High">High (Action within 24 Hours)</option>
                <option value="Normal">Normal (Standard 5-Day SLA)</option>
                <option value="Low">Low (Informational Triage)</option>
              </select>
            </div>

            <div>
              <label className="form-label">Assigned Quality Officer</label>
              <input
                type="text"
                className="form-input"
                value="Quality Assurance Reviewer (QP-01)"
                disabled
              />
            </div>
          </div>
        </div>
      </form>

      {/* 3. Field History Inspection Modal */}
      {activeHistoryField && activeProvenance && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
          onClick={() => setActiveHistoryField(null)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 6,
              border: '1px solid #E5E7EB',
              maxWidth: 480,
              width: '100%',
              boxShadow: '0 12px 24px rgba(16, 24, 40, 0.15)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '10px 14px',
              borderBottom: '1px solid #E5E7EB',
              backgroundColor: '#F9FAFB',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <History size={14} color="#1D4ED8" />
                <h4 style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#111827' }}>
                  Field Lineage: {activeHistoryField.replace(/_/g, ' ').toUpperCase()}
                </h4>
              </div>
              <button
                onClick={() => setActiveHistoryField(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 2 }}
              >
                <X size={14} />
              </button>
            </div>

            <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 11 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ backgroundColor: '#F9FAFB', padding: '8px', borderRadius: 4, border: '1px solid #E5E7EB' }}>
                  <span style={{ color: '#6B7280', fontSize: 10, textTransform: 'uppercase' }}>Classification</span>
                  <div style={{ fontWeight: 600, color: '#111827', marginTop: 2 }}>{activeProvenance.classification}</div>
                </div>
                <div style={{ backgroundColor: '#F9FAFB', padding: '8px', borderRadius: 4, border: '1px solid #E5E7EB' }}>
                  <span style={{ color: '#6B7280', fontSize: 10, textTransform: 'uppercase' }}>Confidence</span>
                  <div style={{ fontWeight: 600, color: '#1D4ED8', marginTop: 2 }}>{Math.round(activeProvenance.confidence * 100)}%</div>
                </div>
              </div>

              <div>
                <span style={{ color: '#6B7280', fontSize: 10, textTransform: 'uppercase' }}>Source Origin</span>
                <div style={{ fontWeight: 500, color: '#111827', marginTop: 2 }}>
                  {activeProvenance.source_document_id ? `Document: ${activeProvenance.source_document_id}` : activeProvenance.source_type}
                  {activeProvenance.page_number && ` (Page ${activeProvenance.page_number})`}
                </div>
              </div>

              {activeProvenance.text_span && (
                <div>
                  <span style={{ color: '#6B7280', fontSize: 10, textTransform: 'uppercase' }}>Verbatim Evidence Text</span>
                  <p style={{
                    margin: '3px 0 0 0',
                    padding: '6px 8px',
                    backgroundColor: '#F9FAFB',
                    borderRadius: 3,
                    border: '1px solid #E5E7EB',
                    fontFamily: 'var(--font-mono)',
                    color: '#111827',
                    lineHeight: 1.35
                  }}>
                    "{activeProvenance.text_span}"
                  </p>
                </div>
              )}
            </div>

            <div style={{ padding: '8px 14px', borderTop: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setActiveHistoryField(null)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 3,
                  border: '1px solid #D1D5DB',
                  backgroundColor: '#FFFFFF',
                  color: '#374151',
                  fontSize: 11,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
