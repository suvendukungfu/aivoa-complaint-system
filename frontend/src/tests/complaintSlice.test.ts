import { describe, it, expect } from 'vitest';
import complaintReducer, {
  setComplaintData,
  updateSingleField,
  resetComplaint
} from '../store/complaintSlice';

describe('Redux complaintSlice', () => {
  it('should initialize with default pharmaceutical QMS state', () => {
    const state = complaintReducer(undefined, { type: 'unknown' });
    expect(state.data.complaint_source).toBe('Customer Direct / Email');
    expect(state.data.status).toBe('Pending Triage');
    expect(state.updatedFields).toEqual([]);
    expect(state.isSaved).toBe(false);
  });

  it('should populate complaint data from AI extraction', () => {
    const aiExtractedData = {
      product_name: 'Paracetamol API',
      product_strength: '99.5%',
      batch_number: 'PA240812',
      quantity_affected: '25',
      quantity_unit: 'kg',
      severity: 'High' as const,
      priority: 'Urgent' as const
    };

    const nextState = complaintReducer(undefined, setComplaintData(aiExtractedData));
    expect(nextState.data.product_name).toBe('Paracetamol API');
    expect(nextState.data.batch_number).toBe('PA240812');
    expect(nextState.data.quantity_affected).toBe('25');
    expect(nextState.data.severity).toBe('High');
  });

  it('CRITICAL TEST: should preserve existing fields when a single field is updated', () => {
    const initialState = {
      data: {
        complaint_source: 'Direct Email',
        customer_name: 'ABC Pharmaceuticals',
        product_name: 'Paracetamol API',
        product_strength: '99.5%',
        batch_number: 'PA240812',
        manufacturing_date: '12 August 2026',
        expiry_date: 'August 2028',
        quantity_affected: '25',
        quantity_unit: 'kg',
        complaint_type: 'Foreign Matter / Contamination',
        detailed_description: 'Visible black particles in top layer',
        severity: 'High' as const,
        priority: 'Urgent' as const,
        status: 'Pending Triage'
      },
      updatedFields: [],
      lastSaved: null,
      isSaved: false
    };

    // User/AI updates quantity to 40
    const stateAfterEdit = complaintReducer(
      initialState,
      updateSingleField({ field: 'quantity_affected', value: '40' })
    );

    expect(stateAfterEdit.data.quantity_affected).toBe('40');
    expect(stateAfterEdit.data.product_name).toBe('Paracetamol API');
    expect(stateAfterEdit.data.batch_number).toBe('PA240812');
    expect(stateAfterEdit.data.customer_name).toBe('ABC Pharmaceuticals');
    expect(stateAfterEdit.data.product_strength).toBe('99.5%');
    expect(stateAfterEdit.data.manufacturing_date).toBe('12 August 2026');
    expect(stateAfterEdit.data.expiry_date).toBe('August 2028');
    expect(stateAfterEdit.data.detailed_description).toBe('Visible black particles in top layer');
    expect(stateAfterEdit.data.severity).toBe('High');
    expect(stateAfterEdit.data.priority).toBe('Urgent');
    expect(stateAfterEdit.updatedFields).toContain('quantity_affected');
  });

  it('should reset state cleanly without browser reload', () => {
    const populatedState = {
      data: {
        product_name: 'Amoxicillin',
        batch_number: 'AMX-99',
        customer_name: 'Test Customer'
      },
      updatedFields: ['product_name', 'batch_number'],
      lastSaved: null,
      isSaved: true
    };

    const resetState = complaintReducer(populatedState, resetComplaint());
    expect(resetState.data.product_name).toBe('');
    expect(resetState.data.batch_number).toBe('');
    expect(resetState.updatedFields).toEqual([]);
    expect(resetState.isSaved).toBe(false);
  });
});
