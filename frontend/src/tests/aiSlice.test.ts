import { describe, it, expect } from 'vitest';
import aiReducer, {
  addMessage,
  setRiskAssessment,
  setCompleteness,
  resetAI
} from '../store/aiSlice';

describe('Redux aiSlice', () => {
  it('should initialize with empty messages and idle status', () => {
    const state = aiReducer(undefined, { type: 'unknown' });
    expect(state.messages.length).toBe(0);
    expect(state.loading).toBe(false);
    expect(state.statusText).toBe('Idle');
    expect(state.riskAssessment).toBeNull();
  });

  it('should append chat messages', () => {
    const newMsg = {
      id: 'msg-1',
      sender: 'user' as const,
      text: 'Change batch to PA240813',
      timestamp: '12:00 PM'
    };

    const nextState = aiReducer(undefined, addMessage(newMsg));
    expect(nextState.messages).toContainEqual(newMsg);
  });

  it('should update risk assessment and completeness', () => {
    const risk = {
      severity: 'High' as const,
      priority: 'Urgent' as const,
      risk_rationale: 'Foreign particles detected in API batch.',
      recommended_actions: ['Quarantine batch', 'Review BMR'],
      disclaimer: 'AI-generated initial triage recommendation. Final assessment requires qualified Quality personnel.'
    };

    const completeness = {
      completeness_score: 85,
      missing_critical_fields: [],
      missing_optional_fields: ['Expiry Date'],
      recommendations: ['Verify expiry date with ERP']
    };

    let state = aiReducer(undefined, setRiskAssessment(risk));
    state = aiReducer(state, setCompleteness(completeness));

    expect(state.riskAssessment?.severity).toBe('High');
    expect(state.riskAssessment?.priority).toBe('Urgent');
    expect(state.completeness?.completeness_score).toBe(85);
  });

  it('should reset AI state', () => {
    const modifiedState = {
      messages: [{ id: 'm1', sender: 'user' as const, text: 'hi', timestamp: '12:00' }],
      loading: true,
      processingState: 'ANALYZING' as const,
      statusText: 'Processing...',
      auditTrail: [],
      riskAssessment: { severity: 'High' as const, priority: 'Urgent' as const, risk_rationale: '', recommended_actions: [], disclaimer: '' },
      completeness: null,
      duplicateWarning: null,
      isObservabilityOpen: true,
      isAnalyticsOpen: true,
      lastDocumentText: '',
      lastDocumentFilename: ''
    };

    const resetState = aiReducer(modifiedState, resetAI());
    expect(resetState.loading).toBe(false);
    expect(resetState.statusText).toBe('Idle');
    expect(resetState.riskAssessment).toBeNull();
    expect(resetState.messages.length).toBe(0);
    expect(resetState.isObservabilityOpen).toBe(false);
  });
});
