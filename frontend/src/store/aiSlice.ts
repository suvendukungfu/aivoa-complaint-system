import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type {
  ChatMessage,
  RiskAssessment,
  CompletenessAssessment,
  DuplicateMatch,
  StepAuditLog,
  AIProcessingState
} from '../types';

interface AIState {
  messages: ChatMessage[];
  loading: boolean;
  processingState: AIProcessingState;
  statusText: string;
  auditTrail: StepAuditLog[];
  riskAssessment: RiskAssessment | null;
  completeness: CompletenessAssessment | null;
  duplicateWarning: DuplicateMatch | null;
  isObservabilityOpen: boolean;
  isAnalyticsOpen: boolean;
  lastDocumentText: string;
  lastDocumentFilename: string;
}

const initialState: AIState = {
  messages: [],
  loading: false,
  processingState: 'IDLE',
  statusText: 'Idle',
  auditTrail: [],
  riskAssessment: null,
  completeness: null,
  duplicateWarning: null,
  isObservabilityOpen: false,
  isAnalyticsOpen: false,
  lastDocumentText: '',
  lastDocumentFilename: ''
};

export const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload);
    },
    setLastDocument: (state, action: PayloadAction<{ text: string; filename: string }>) => {
      state.lastDocumentText = action.payload.text;
      state.lastDocumentFilename = action.payload.filename;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
      if (!action.payload && state.processingState !== 'ERROR') {
        state.processingState = 'IDLE';
      }
    },
    setProcessingState: (state, action: PayloadAction<AIProcessingState>) => {
      state.processingState = action.payload;
      state.loading = ['ANALYZING', 'EXTRACTING', 'VALIDATING', 'ASSESSING_RISK', 'UPDATING_FORM'].includes(action.payload);
      
      const statusLabels: Record<AIProcessingState, string> = {
        IDLE: 'Ready',
        ANALYZING: 'Analyzing Input & Scanning Security...',
        EXTRACTING: 'Extracting QMS Parameters via Groq...',
        VALIDATING: 'Validating against Schema & Dictionaries...',
        ASSESSING_RISK: 'Executing Risk & Completeness Triage...',
        UPDATING_FORM: 'Updating Form State...',
        SUCCESS: 'Complaint Processed Successfully',
        ERROR: 'Processing Error Encountered'
      };
      state.statusText = statusLabels[action.payload] || 'Processing...';
    },
    setStatusText: (state, action: PayloadAction<string>) => {
      state.statusText = action.payload;
    },
    setAuditTrail: (state, action: PayloadAction<StepAuditLog[]>) => {
      state.auditTrail = action.payload;
    },
    setRiskAssessment: (state, action: PayloadAction<RiskAssessment | null>) => {
      state.riskAssessment = action.payload;
    },
    setCompleteness: (state, action: PayloadAction<CompletenessAssessment | null>) => {
      state.completeness = action.payload;
    },
    setDuplicateWarning: (state, action: PayloadAction<DuplicateMatch | null>) => {
      state.duplicateWarning = action.payload;
    },
    toggleObservability: (state) => {
      state.isObservabilityOpen = !state.isObservabilityOpen;
    },
    setObservabilityOpen: (state, action: PayloadAction<boolean>) => {
      state.isObservabilityOpen = action.payload;
    },
    toggleAnalytics: (state) => {
      state.isAnalyticsOpen = !state.isAnalyticsOpen;
    },
    setAnalyticsOpen: (state, action: PayloadAction<boolean>) => {
      state.isAnalyticsOpen = action.payload;
    },
    resetAI: (state) => {
      state.messages = [];
      state.loading = false;
      state.processingState = 'IDLE';
      state.statusText = 'Idle';
      state.auditTrail = [];
      state.riskAssessment = null;
      state.completeness = null;
      state.duplicateWarning = null;
      state.isObservabilityOpen = false;
      state.isAnalyticsOpen = false;
      state.lastDocumentText = '';
      state.lastDocumentFilename = '';
    }
  }
});

export const {
  addMessage,
  setLastDocument,
  setLoading,
  setProcessingState,
  setStatusText,
  setAuditTrail,
  setRiskAssessment,
  setCompleteness,
  setDuplicateWarning,
  toggleObservability,
  setObservabilityOpen,
  toggleAnalytics,
  setAnalyticsOpen,
  resetAI
} = aiSlice.actions;

export default aiSlice.reducer;
