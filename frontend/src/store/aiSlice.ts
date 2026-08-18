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

const initialWelcomeMessage: ChatMessage = {
  id: 'welcome-1',
  sender: 'assistant',
  text: `**AIVOA Quality Copilot**
Assistant for Pharmaceutical Complaint Intake & Risk Triage.

**Available Capabilities:**
• **Natural-Language Logging:** Enter raw complaint emails, customer reports, or quality observations.
• **Document Ingestion:** Drag and drop **PDF, DOCX, TXT, or EML** files.
• **Controlled Record Edits:** Request field changes such as *"Update affected quantity to 40 kg"* or *"Set batch number to PA240813"*.
• **Automated QMS Triage:** Deterministic severity scoring, evidence extraction, and audit trails.

*Select a quick action or upload a file below to begin.*`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
};

const initialState: AIState = {
  messages: [initialWelcomeMessage],
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
      state.messages = [initialWelcomeMessage];
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
