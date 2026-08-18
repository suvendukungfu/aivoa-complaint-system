import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  updateSingleField,
  resetComplaint,
  setComplaintData,
  clearUpdatedFields
} from '../../store/complaintSlice';
import { setToast } from '../../store/uiSlice';
import { api } from '../../services/api';
import { EvidencePopover } from '../../components/EvidencePopover';
import type { ComplaintData, SeverityLevel, PriorityLevel } from '../../types';
import {
  Save,
  RotateCcw,
  Send,
  History,
  X
} from 'lucide-react';
import { typography } from '../../design/typography';

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
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)',
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0,
      flex: 1
    }}>
      {/* Form Action Header */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        backgroundColor: 'var(--bg-surface)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)'
          }}>
            {formData.complaint_number || 'DRAFT-NEW'}
          </div>
          <span style={{
            padding: '2px 7px',
            borderRadius: 'var(--radius-xs)',
            fontSize: 11,
            fontWeight: 600,
            backgroundColor:
              formData.status === 'UNDER_REVIEW' ? 'var(--warning-subtle)' :
              formData.status === 'APPROVED' ? 'var(--success-subtle)' : 'var(--bg-subtle)',
            color:
              formData.status === 'UNDER_REVIEW' ? 'var(--warning-text)' :
              formData.status === 'APPROVED' ? 'var(--success-text)' : 'var(--text-secondary)',
            border: `1px solid ${
              formData.status === 'UNDER_REVIEW' ? 'var(--warning-border)' :
              formData.status === 'APPROVED' ? 'var(--success-border)' : 'var(--border)'
            }`
          }}>
            {formData.status?.replace('_', ' ') || 'DRAFT'}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {saveStatus === 'saving' ? 'Saving changes...' : saveStatus === 'unsaved' ? 'Unsaved edits' : 'Autosaved'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={handleReset}
            style={{
              padding: '6px 11px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12,
              fontWeight: 500,
              color: 'var(--text-secondary)',
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
              padding: '6px 12px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12,
              fontWeight: 500,
              color: 'var(--text-primary)',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5
            }}
          >
            <Save size={13} />
            <span>{saving ? 'Saving...' : 'Save Draft'}</span>
          </button>

          <button
            type="button"
            onClick={handleSubmitTriage}
            style={{
              padding: '6px 14px',
              backgroundColor: 'var(--text-primary)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              boxShadow: 'var(--shadow-subtle)'
            }}
          >
            <Send size={12} />
            <span>Submit to Queue</span>
          </button>
        </div>
      </div>

      {/* Main Form Fields Container */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* SECTION 1: COMPLAINT SOURCE */}
        <div>
          <div style={{
            ...typography.sectionHeaderLabel,
            paddingBottom: 6,
            borderBottom: '1px solid var(--border)',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>1. Complaint Source</span>
            <span style={{ fontSize: 10, fontWeight: 400, textTransform: 'none', color: 'var(--text-muted)' }}>
              Reporter identification & channel
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
                Customer Name *
              </label>
              <EvidencePopover
                label="Customer Name"
                provenance={formData.field_provenance?.customer_name}
                onOpenEvidence={() => setActiveHistoryField('customer_name')}
              >
                <input
                  type="text"
                  value={formData.customer_name || ''}
                  onChange={(e) => handleChange('customer_name', e.target.value)}
                  placeholder="e.g. ABC Pharma Corp"
                  style={{
                    width: '100%',
                    height: '32px',
                    padding: '0 10px',
                    backgroundColor: updatedFields.includes('customer_name') ? 'var(--primary-subtle)' : 'var(--bg-surface)',
                    border: `1px solid ${updatedFields.includes('customer_name') ? 'var(--primary-border)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 12.5,
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                />
              </EvidencePopover>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
                Complaint Date
              </label>
              <EvidencePopover
                label="Complaint Date"
                provenance={formData.field_provenance?.complaint_date}
                onOpenEvidence={() => setActiveHistoryField('complaint_date')}
              >
                <input
                  type="date"
                  value={formData.complaint_date || ''}
                  onChange={(e) => handleChange('complaint_date', e.target.value)}
                  style={{
                    width: '100%',
                    height: '32px',
                    padding: '0 10px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 12.5,
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
              </EvidencePopover>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
                Source Channel
              </label>
              <EvidencePopover
                label="Source Channel"
                provenance={formData.field_provenance?.complaint_source}
                onOpenEvidence={() => setActiveHistoryField('complaint_source')}
              >
                <select
                  value={formData.complaint_source || 'Email'}
                  onChange={(e) => handleChange('complaint_source', e.target.value)}
                  style={{
                    width: '100%',
                    height: '32px',
                    padding: '0 8px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 12.5,
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--bg-surface)'
                  }}
                >
                  <option value="Email">Email Communication</option>
                  <option value="Phone">Telephone Quality Notice</option>
                  <option value="Customer Portal">Customer QMS Portal</option>
                  <option value="Audit Finding">Regulatory / Audit Finding</option>
                </select>
              </EvidencePopover>
            </div>
          </div>
        </div>

        {/* SECTION 2: PRODUCT IDENTIFICATION */}
        <div>
          <div style={{
            ...typography.sectionHeaderLabel,
            paddingBottom: 6,
            borderBottom: '1px solid var(--border)',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>2. Product Identification</span>
            <span style={{ fontSize: 10, fontWeight: 400, textTransform: 'none', color: 'var(--text-muted)' }}>
              Batch, strength & manufacturing traceability
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
                Product Name *
              </label>
              <EvidencePopover
                label="Product Name"
                provenance={formData.field_provenance?.product_name}
                onOpenEvidence={() => setActiveHistoryField('product_name')}
              >
                <input
                  type="text"
                  value={formData.product_name || ''}
                  onChange={(e) => handleChange('product_name', e.target.value)}
                  placeholder="e.g. Paracetamol API 99.5%"
                  style={{
                    width: '100%',
                    height: '32px',
                    padding: '0 10px',
                    backgroundColor: updatedFields.includes('product_name') ? 'var(--primary-subtle)' : 'var(--bg-surface)',
                    border: `1px solid ${updatedFields.includes('product_name') ? 'var(--primary-border)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 12.5,
                    color: 'var(--text-primary)'
                  }}
                />
              </EvidencePopover>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
                Strength / Grade
              </label>
              <EvidencePopover
                label="Product Strength"
                provenance={formData.field_provenance?.product_strength}
                onOpenEvidence={() => setActiveHistoryField('product_strength')}
              >
                <input
                  type="text"
                  value={formData.product_strength || ''}
                  onChange={(e) => handleChange('product_strength', e.target.value)}
                  placeholder="e.g. 500mg / USP Grade"
                  style={{
                    width: '100%',
                    height: '32px',
                    padding: '0 10px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 12.5,
                    color: 'var(--text-primary)'
                  }}
                />
              </EvidencePopover>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
                Batch / Lot Number *
              </label>
              <EvidencePopover
                label="Batch Number"
                provenance={formData.field_provenance?.batch_number}
                onOpenEvidence={() => setActiveHistoryField('batch_number')}
              >
                <input
                  type="text"
                  value={formData.batch_number || ''}
                  onChange={(e) => handleChange('batch_number', e.target.value)}
                  placeholder="e.g. PA240812"
                  style={{
                    width: '100%',
                    height: '32px',
                    padding: '0 10px',
                    fontFamily: 'var(--font-mono)',
                    backgroundColor: updatedFields.includes('batch_number') ? 'var(--primary-subtle)' : 'var(--bg-surface)',
                    border: `1px solid ${updatedFields.includes('batch_number') ? 'var(--primary-border)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 12.5,
                    color: 'var(--text-primary)'
                  }}
                />
              </EvidencePopover>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
                Quantity Affected
              </label>
              <EvidencePopover
                label="Quantity Affected"
                provenance={formData.field_provenance?.quantity_affected}
                onOpenEvidence={() => setActiveHistoryField('quantity_affected')}
              >
                <input
                  type="text"
                  value={formData.quantity_affected || ''}
                  onChange={(e) => handleChange('quantity_affected', e.target.value)}
                  placeholder="e.g. 25 kg / 350 cartons"
                  style={{
                    width: '100%',
                    height: '32px',
                    padding: '0 10px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 12.5,
                    color: 'var(--text-primary)'
                  }}
                />
              </EvidencePopover>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
                Manufacturing Date
              </label>
              <EvidencePopover
                label="Manufacturing Date"
                provenance={formData.field_provenance?.manufacturing_date}
                onOpenEvidence={() => setActiveHistoryField('manufacturing_date')}
              >
                <input
                  type="date"
                  value={formData.manufacturing_date || ''}
                  onChange={(e) => handleChange('manufacturing_date', e.target.value)}
                  style={{
                    width: '100%',
                    height: '32px',
                    padding: '0 10px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 12.5,
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
              </EvidencePopover>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
                Expiry Date
              </label>
              <EvidencePopover
                label="Expiry Date"
                provenance={formData.field_provenance?.expiry_date}
                onOpenEvidence={() => setActiveHistoryField('expiry_date')}
              >
                <input
                  type="date"
                  value={formData.expiry_date || ''}
                  onChange={(e) => handleChange('expiry_date', e.target.value)}
                  style={{
                    width: '100%',
                    height: '32px',
                    padding: '0 10px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 12.5,
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
              </EvidencePopover>
            </div>
          </div>
        </div>

        {/* SECTION 3: DEFECT CLASSIFICATION & DESCRIPTION */}
        <div>
          <div style={{
            ...typography.sectionHeaderLabel,
            paddingBottom: 6,
            borderBottom: '1px solid var(--border)',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>3. Defect Classification & Description</span>
            <span style={{ fontSize: 10, fontWeight: 400, textTransform: 'none', color: 'var(--text-muted)' }}>
              Verbatim complaint narrative & categorization
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Complaint Classification
                </label>
                <EvidencePopover
                  label="Complaint Type"
                  provenance={formData.field_provenance?.complaint_type}
                  onOpenEvidence={() => setActiveHistoryField('complaint_type')}
                >
                  <select
                    value={formData.complaint_type || 'Foreign Matter'}
                    onChange={(e) => handleChange('complaint_type', e.target.value)}
                    style={{
                      width: '100%',
                      height: '32px',
                      padding: '0 8px',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 12.5,
                      color: 'var(--text-primary)',
                      backgroundColor: 'var(--bg-surface)'
                    }}
                  >
                    <option value="Foreign Matter">Foreign Matter / Particulate</option>
                    <option value="Packaging Defect">Packaging Defect / Seal Integrity</option>
                    <option value="Out of Specification">Out of Specification (Assay/Potency)</option>
                    <option value="Labeling Error">Labeling / Artwork Defect</option>
                    <option value="Adverse Event">Clinical / Adverse Event</option>
                    <option value="Other">Other Quality Discrepancy</option>
                  </select>
                </EvidencePopover>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
                Detailed Description *
              </label>
              <EvidencePopover
                label="Detailed Description"
                provenance={formData.field_provenance?.detailed_description}
                onOpenEvidence={() => setActiveHistoryField('detailed_description')}
              >
                <textarea
                  value={formData.detailed_description || ''}
                  onChange={(e) => handleChange('detailed_description', e.target.value)}
                  placeholder="Enter complete customer complaint description, observations, and initial containment steps..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 12.5,
                    lineHeight: 1.45,
                    color: 'var(--text-primary)',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </EvidencePopover>
            </div>
          </div>
        </div>

        {/* SECTION 4: QUALITY RISK ASSESSMENT */}
        <div>
          <div style={{
            ...typography.sectionHeaderLabel,
            paddingBottom: 6,
            borderBottom: '1px solid var(--border)',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>4. Quality Risk Assessment</span>
            <span style={{ fontSize: 10, fontWeight: 400, textTransform: 'none', color: 'var(--text-muted)' }}>
              ICH Q9 defect severity & operational urgency
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
                Defect Severity
              </label>
              <EvidencePopover
                label="Severity"
                provenance={formData.field_provenance?.severity}
                onOpenEvidence={() => setActiveHistoryField('severity')}
              >
                <select
                  value={formData.severity || 'High'}
                  onChange={(e) => handleChange('severity', e.target.value as SeverityLevel)}
                  style={{
                    width: '100%',
                    height: '32px',
                    padding: '0 8px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 12.5,
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--bg-surface)'
                  }}
                >
                  <option value="Critical">Critical (Immediate Health Hazard)</option>
                  <option value="High">High (Major Defect / Contamination)</option>
                  <option value="Medium">Medium (Minor Functional Discrepancy)</option>
                  <option value="Low">Low (Cosmetic / Packaging)</option>
                </select>
              </EvidencePopover>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
                Investigation Priority
              </label>
              <EvidencePopover
                label="Priority"
                provenance={formData.field_provenance?.priority}
                onOpenEvidence={() => setActiveHistoryField('priority')}
              >
                <select
                  value={formData.priority || 'High'}
                  onChange={(e) => handleChange('priority', e.target.value as PriorityLevel)}
                  style={{
                    width: '100%',
                    height: '32px',
                    padding: '0 8px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 12.5,
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--bg-surface)'
                  }}
                >
                  <option value="Urgent">Urgent (24-Hour SLA)</option>
                  <option value="High">High (72-Hour SLA)</option>
                  <option value="Normal">Normal (7-Day SLA)</option>
                  <option value="Low">Low (30-Day SLA)</option>
                </select>
              </EvidencePopover>
            </div>
          </div>
        </div>
      </div>

      {/* Field History Modal */}
      {activeHistoryField && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(17, 24, 39, 0.4)',
          backdropFilter: 'blur(2px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: 16
        }}>
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-modal)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-modal)',
            width: '100%',
            maxWidth: '480px',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <History size={14} style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Field Lineage: {activeHistoryField.replace('_', ' ')}
                </span>
              </div>
              <button
                onClick={() => setActiveHistoryField(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            </div>

            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activeProvenance ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <div style={typography.metadata}>Source Origin</div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', marginTop: 2 }}>
                        {activeProvenance.source_type || 'User Manual Edit'}
                      </div>
                    </div>
                    <div>
                      <div style={typography.metadata}>Confidence Score</div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', marginTop: 2 }}>
                        {activeProvenance.confidence ? `${Math.round(activeProvenance.confidence * 100)}%` : '100%'}
                      </div>
                    </div>
                  </div>

                  {activeProvenance.text_span && (
                    <div>
                      <div style={typography.metadata}>Verbatim Evidence Span</div>
                      <div style={{
                        fontSize: 12,
                        fontStyle: 'italic',
                        color: 'var(--text-primary)',
                        backgroundColor: 'var(--bg-subtle)',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        marginTop: 4
                      }}>
                        "{activeProvenance.text_span}"
                      </div>
                    </div>
                  )}

                  {activeProvenance.page_number !== undefined && activeProvenance.page_number !== null && (
                    <div>
                      <div style={typography.metadata}>Page Attribution</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                        Page {activeProvenance.page_number}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                  No automated AI provenance recorded for this field.
                </div>
              )}
            </div>

            <div style={{
              padding: '10px 18px',
              borderTop: '1px solid var(--border)',
              backgroundColor: 'var(--bg-subtle)',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setActiveHistoryField(null)}
                style={{
                  padding: '5px 12px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--text-primary)',
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

export default ComplaintForm;
