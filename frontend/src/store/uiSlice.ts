import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { HistoricalComplaint, FieldProvenanceItem } from '../types';

interface UIState {
  showSavedModal: boolean;
  savedComplaintsList: HistoricalComplaint[];
  selectedComplaintDetail: HistoricalComplaint | null;
  selectedFieldForEvidence: FieldProvenanceItem | null;
  activeFilter: string;
  toast: {
    type: 'success' | 'error' | 'info';
    message: string;
  } | null;
}

const initialState: UIState = {
  showSavedModal: false,
  savedComplaintsList: [],
  selectedComplaintDetail: null,
  selectedFieldForEvidence: null,
  activeFilter: 'all',
  toast: null
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setShowSavedModal: (state, action: PayloadAction<boolean>) => {
      state.showSavedModal = action.payload;
    },
    setSavedComplaintsList: (state, action: PayloadAction<HistoricalComplaint[]>) => {
      state.savedComplaintsList = action.payload;
    },
    setSelectedComplaintDetail: (state, action: PayloadAction<HistoricalComplaint | null>) => {
      state.selectedComplaintDetail = action.payload;
    },
    setSelectedFieldForEvidence: (state, action: PayloadAction<FieldProvenanceItem | null>) => {
      state.selectedFieldForEvidence = action.payload;
    },
    setActiveFilter: (state, action: PayloadAction<string>) => {
      state.activeFilter = action.payload;
    },
    setToast: (state, action: PayloadAction<{ type: 'success' | 'error' | 'info'; message: string } | null>) => {
      state.toast = action.payload;
    },
    clearToast: (state) => {
      state.toast = null;
    }
  }
});

export const {
  setShowSavedModal,
  setSavedComplaintsList,
  setSelectedComplaintDetail,
  setSelectedFieldForEvidence,
  setActiveFilter,
  setToast,
  clearToast
} = uiSlice.actions;

export default uiSlice.reducer;
