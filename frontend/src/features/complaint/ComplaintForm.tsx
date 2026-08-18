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
      border: '1px solid #E2E8F0',
      borderRadius: 12,
      boxShadow: '0 1px 3px rgba(15, 23, 42, 0.06)',
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0,
      flex: 1,
      overflow: 'hidden'
    }} className="animate-fade-in">
      {/* Form Action Header */}
      <div style={{
        padding: '16px 22px',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        backgroundColor: '#FAFAFC'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            fontSize: 15,
            fontWeight: 800,
            color: '#0F172A',
            fontFamily: 'var(--font-mono)'
          }}>
            {formData.complaint_number || 'DRAFT-NEW'}
          </div>
          <span style={{
            padding: '3px 9px',
            borderRadius: 20,
            fontSize: 11.5,
            fontWeight: 700,
            backgroundColor:
              formData.status === 'UNDER_REVIEW' ? '#FFFBEB' :
              formData.status === 'APPROVED' ? '#ECFDF5' : '#F1F5F9',
            color:
              formData.status === 'UNDER_REVIEW' ? '#92400E' :
              formData.status === 'APPROVED' ? '#065F46' : '#475569',
            border: `1px solid ${
              formData.status === 'UNDER_REVIEW' ? '#FDE68A' :
              formData.status === 'APPROVED' ? '#A7F3D0' : '#CBD5E1'
            }`
          }}>
            {formData.status?.replace('_', ' ') || 'DRAFT'}
          </span>
          <span style={{ fontSize: 11.5, color: '#64748B', fontWeight: 500 }}>
            {saveStatus === 'saving' ? 'Saving changes...' : saveStatus === 'unsaved' ? 'Unsaved edits' : 'Autosaved'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={handleReset}
            style={{
              padding: '7px 12px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: 7,
              fontSize: 12,
              fontWeight: 600,
              color: '#475569',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              transition: 'all 120ms ease-out'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '7px 14px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #94A3B8',
              borderRadius: 7,
              fontSize: 12,
              fontWeight: 600,
              color: '#0F172A',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}
          >
            <Save size={13} />
            <span>{saving ? 'Saving...' : 'Save Draft'}</span>
          </button>

          <button
            type="button"
            onClick={handleSubmitTriage}
            style={{
              padding: '7px 16px',
              background: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 7,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 6px rgba(79, 70, 229, 0.3)'
            }}
          >
            <Send size={12} />
            <span>Submit to Queue</span>
          </button>
        </div>
      </div>

      {/* Main Form Fields Container */}
      <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* SECTION 1: COMPLAINT SOURCE */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: 8,
            borderBottom: '1px solid #E2E8F0',
            marginBottom: 14
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                backgroundColor: '#EEF2FF',
                color: '#4F46E5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 800
              }}>
                1
              </div>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>
                Complaint Source & Channel
              </span>
            </div>
            <span style={{ fontSize: 11.5, color: '#64748B', fontWeight: 500 }}>
              Customer contact & channel traceability
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 5 }}>
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
                    height: '34px',
                    padding: '0 12px',
                    backgroundColor: updatedFields.includes('customer_name') ? '#EEF2FF' : '#FFFFFF',
                    border: `1px solid ${updatedFields.includes('customer_name') ? '#818CF8' : '#CBD5E1'}`,
                    borderRadius: 6,
                    fontSize: 12.5,
                    color: '#0F172A',
                    outline: 'none',
                    fontWeight: 500
                  }}
                />
              </EvidencePopover>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 5 }}>
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
                    height: '34px',
                    padding: '0 12px',
                    border: '1px solid #CBD5E1',
                    borderRadius: 6,
                    fontSize: 12.5,
                    color: '#0F172A',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 500
                  }}
                />
              </EvidencePopover>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 5 }}>
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
                    height: '34px',
                    padding: '0 10px',
                    border: '1px solid #CBD5E1',
                    borderRadius: 6,
                    fontSize: 12.5,
                    color: '#0F172A',
                    backgroundColor: '#FFFFFF',
                    fontWeight: 500
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: 8,
            borderBottom: '1px solid #E2E8F0',
            marginBottom: 14
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                backgroundColor: '#EEF2FF',
                color: '#4F46E5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 800
              }}>
                2
              </div>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>
                Product & Batch Traceability
              </span>
            </div>
            <span style={{ fontSize: 11.5, color: '#64748B', fontWeight: 500 }}>
              Batch, strength & manufacturing genealogy
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 5 }}>
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
                    height: '34px',
                    padding: '0 12px',
                    backgroundColor: updatedFields.includes('product_name') ? '#EEF2FF' : '#FFFFFF',
                    border: `1px solid ${updatedFields.includes('product_name') ? '#818CF8' : '#CBD5E1'}`,
                    borderRadius: 6,
                    fontSize: 12.5,
                    color: '#0F172A',
                    fontWeight: 500
                  }}
                />
              </EvidencePopover>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                Strength / Specification
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
                    height: '34px',
                    padding: '0 12px',
                    border: '1px solid #CBD5E1',
                    borderRadius: 6,
                    fontSize: 12.5,
                    color: '#0F172A',
                    fontWeight: 500
                  }}
                />
              </EvidencePopover>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 5 }}>
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
                    height: '34px',
                    padding: '0 12px',
                    fontFamily: 'var(--font-mono)',
                    backgroundColor: updatedFields.includes('batch_number') ? '#EEF2FF' : '#FFFFFF',
                    border: `1px solid ${updatedFields.includes('batch_number') ? '#818CF8' : '#CBD5E1'}`,
                    borderRadius: 6,
                    fontSize: 12.5,
                    color: '#0F172A',
                    fontWeight: 600
                  }}
                />
              </EvidencePopover>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 5 }}>
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
                    height: '34px',
                    padding: '0 12px',
                    border: '1px solid #CBD5E1',
                    borderRadius: 6,
                    fontSize: 12.5,
                    color: '#0F172A',
                    fontWeight: 500
                  }}
                />
              </EvidencePopover>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 5 }}>
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
                    height: '34px',
                    padding: '0 12px',
                    border: '1px solid #CBD5E1',
                    borderRadius: 6,
                    fontSize: 12.5,
                    color: '#0F172A',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
              </EvidencePopover>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 5 }}>
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
                    height: '34px',
                    padding: '0 12px',
                    border: '1px solid #CBD5E1',
                    borderRadius: 6,
                    fontSize: 12.5,
                    color: '#0F172A',
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: 8,
            borderBottom: '1px solid #E2E8F0',
            marginBottom: 14
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                backgroundColor: '#EEF2FF',
                color: '#4F46E5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 800
              }}>
                3
              </div>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>
                Defect Description & Categorization
              </span>
            </div>
            <span style={{ fontSize: 11.5, color: '#64748B', fontWeight: 500 }}>
              Verbatim observation narrative
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ maxWidth: '320px' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 5 }}>
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
                    height: '34px',
                    padding: '0 10px',
                    border: '1px solid #CBD5E1',
                    borderRadius: 6,
                    fontSize: 12.5,
                    color: '#0F172A',
                    backgroundColor: '#FFFFFF',
                    fontWeight: 500
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

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                Detailed Description & Findings *
              </label>
              <EvidencePopover
                label="Detailed Description"
                provenance={formData.field_provenance?.detailed_description}
                onOpenEvidence={() => setActiveHistoryField('detailed_description')}
              >
                <textarea
                  value={formData.detailed_description || ''}
                  onChange={(e) => handleChange('detailed_description', e.target.value)}
                  placeholder="Enter complete customer complaint narrative, batch observations, and initial containment steps..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #CBD5E1',
                    borderRadius: 6,
                    fontSize: 12.5,
                    lineHeight: 1.5,
                    color: '#0F172A',
                    outline: 'none',
                    resize: 'vertical',
                    fontWeight: 500
                  }}
                />
              </EvidencePopover>
            </div>
          </div>
        </div>

        {/* SECTION 4: QUALITY RISK ASSESSMENT */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: 8,
            borderBottom: '1px solid #E2E8F0',
            marginBottom: 14
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                backgroundColor: '#EEF2FF',
                color: '#4F46E5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 800
              }}>
                4
              </div>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>
                Quality Risk Assessment (ICH Q9)
              </span>
            </div>
            <span style={{ fontSize: 11.5, color: '#64748B', fontWeight: 500 }}>
              Defect severity & SLA prioritization
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 5 }}>
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
                    height: '34px',
                    padding: '0 10px',
                    border: '1px solid #CBD5E1',
                    borderRadius: 6,
                    fontSize: 12.5,
                    color: '#0F172A',
                    backgroundColor: '#FFFFFF',
                    fontWeight: 600
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
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 5 }}>
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
                    height: '34px',
                    padding: '0 10px',
                    border: '1px solid #CBD5E1',
                    borderRadius: 6,
                    fontSize: 12.5,
                    color: '#0F172A',
                    backgroundColor: '#FFFFFF',
                    fontWeight: 600
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
          backgroundColor: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: 16
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            border: '1px solid #E2E8F0',
            boxShadow: 'var(--shadow-modal)',
            width: '100%',
            maxWidth: '500px',
            overflow: 'hidden'
          }} className="animate-slide-up">
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#FAFAFC'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <History size={15} style={{ color: '#4F46E5' }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                  Field Lineage: {activeHistoryField.replace('_', ' ')}
                </span>
              </div>
              <button
                onClick={() => setActiveHistoryField(null)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}
              >
                <X size={15} />
              </button>
            </div>

            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {activeProvenance ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ backgroundColor: '#F8FAFC', padding: '10px 12px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Source Origin</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginTop: 3 }}>
                        {activeProvenance.source_type || 'User Manual Edit'}
                      </div>
                    </div>
                    <div style={{ backgroundColor: '#F8FAFC', padding: '10px 12px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Confidence Score</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#059669', marginTop: 3 }}>
                        {activeProvenance.confidence ? `${Math.round(activeProvenance.confidence * 100)}%` : '100%'}
                      </div>
                    </div>
                  </div>

                  {activeProvenance.text_span && (
                    <div>
                      <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600, marginBottom: 5 }}>Verbatim Evidence Text Span</div>
                      <div style={{
                        fontSize: 12.5,
                        fontStyle: 'italic',
                        color: '#1E293B',
                        backgroundColor: '#EEF2FF',
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: '1px solid #C7D2FE',
                        lineHeight: 1.5
                      }}>
                        "{activeProvenance.text_span}"
                      </div>
                    </div>
                  )}

                  {activeProvenance.page_number !== undefined && activeProvenance.page_number !== null && (
                    <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>
                      Document Page Attribution: <strong style={{ color: '#0F172A' }}>Page {activeProvenance.page_number}</strong>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '24px 0' }}>
                  No automated AI provenance recorded for this field.
                </div>
              )}
            </div>

            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid #E2E8F0',
              backgroundColor: '#FAFAFC',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setActiveHistoryField(null)}
                style={{
                  padding: '6px 14px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: 6,
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: '#0F172A',
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
