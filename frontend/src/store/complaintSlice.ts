import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { ComplaintData, SaveComplaintResponse } from '../types';

interface ComplaintState {
  data: ComplaintData;
  updatedFields: string[];
  lastSaved: SaveComplaintResponse | null;
  isSaved: boolean;
}

const initialComplaintData: ComplaintData = {
  complaint_source: 'Customer Direct / Email',
  customer_name: '',
  product_name: '',
  product_strength: '',
  batch_number: '',
  manufacturing_date: '',
  expiry_date: '',
  quantity_affected: '',
  quantity_unit: 'kg',
  complaint_type: 'Foreign Matter / Contamination',
  complaint_date: '',
  detailed_description: '',
  severity: 'Medium',
  priority: 'Normal',
  ai_confidence: 0.90,
  ai_reasoning: '',
  recommended_actions: [],
  completeness_score: 0,
  field_confidence: {},
  status: 'Pending Triage'
};

const initialState: ComplaintState = {
  data: initialComplaintData,
  updatedFields: [],
  lastSaved: null,
  isSaved: false
};

export const complaintSlice = createSlice({
  name: 'complaint',
  initialState,
  reducers: {
    setComplaintData: (state, action: PayloadAction<Partial<ComplaintData>>) => {
      state.data = { ...state.data, ...action.payload };
      state.isSaved = false;
    },
    updateSingleField: (state, action: PayloadAction<{ field: keyof ComplaintData; value: any }>) => {
      (state.data as any)[action.payload.field] = action.payload.value;
      if (!state.updatedFields.includes(action.payload.field)) {
        state.updatedFields.push(action.payload.field);
      }
      state.isSaved = false;
    },
    setUpdatedFields: (state, action: PayloadAction<string[]>) => {
      state.updatedFields = action.payload;
    },
    clearUpdatedFields: (state) => {
      state.updatedFields = [];
    },
    setLastSaved: (state, action: PayloadAction<SaveComplaintResponse>) => {
      state.lastSaved = action.payload;
      state.data.complaint_number = action.payload.complaint_number;
      state.data.status = action.payload.status;
      state.isSaved = true;
    },
    resetComplaint: (state) => {
      state.data = { ...initialComplaintData };
      state.updatedFields = [];
      state.lastSaved = null;
      state.isSaved = false;
    }
  }
});

export const {
  setComplaintData,
  updateSingleField,
  setUpdatedFields,
  clearUpdatedFields,
  setLastSaved,
  resetComplaint
} = complaintSlice.actions;

export default complaintSlice.reducer;
