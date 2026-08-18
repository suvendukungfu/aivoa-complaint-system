/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import aiReducer from '../store/aiSlice';
import complaintReducer from '../store/complaintSlice';
import uiReducer from '../store/uiSlice';
import documentReducer from '../store/documentSlice';
import { CopilotPanel } from '../features/copilot/CopilotPanel';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    logComplaint: vi.fn(),
    editComplaint: vi.fn()
  }
}));

const createMockStore = (initialAiMessages = []) => {
  return configureStore({
    reducer: {
      ai: aiReducer,
      complaint: complaintReducer,
      ui: uiReducer,
      document: documentReducer
    },
    preloadedState: {
      ai: {
        messages: initialAiMessages,
        loading: false,
        processingState: 'IDLE' as const,
        statusText: 'Idle',
        auditTrail: [],
        riskAssessment: null,
        completeness: null,
        duplicateWarning: null,
        isObservabilityOpen: false,
        isAnalyticsOpen: false,
        lastDocumentText: '',
        lastDocumentFilename: ''
      }
    }
  });
};

describe('Copilot First-Run Experience Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders clean task launcher empty state with 3 actions and example', () => {
    const store = createMockStore([]);
    render(
      <Provider store={store}>
        <CopilotPanel />
      </Provider>
    );

    expect(screen.getByText('AIVOA COPILOT')).toBeInTheDocument();
    expect(screen.getByText('Complaint intake assistant')).toBeInTheDocument();
    expect(screen.getByText('What would you like to do?')).toBeInTheDocument();

    expect(screen.getByText('Log a complaint')).toBeInTheDocument();
    expect(screen.getByText('Upload a complaint')).toBeInTheDocument();
    expect(screen.getByText('Edit an existing complaint')).toBeInTheDocument();

    expect(screen.getByText('Try an example')).toBeInTheDocument();
    expect(screen.getByText('Use example')).toBeInTheDocument();

    expect(screen.getByText('Log complaint')).toBeInTheDocument();
    expect(screen.getByText('Assess risk')).toBeInTheDocument();
    expect(screen.getByText('Check completeness')).toBeInTheDocument();
  });

  it('executes real logging workflow when Use example is clicked', async () => {
    const mockApiResponse = {
      complaint: {
        id: 101,
        complaint_number: 'CMP-2026-00101',
        product_name: 'Paracetamol API 99.5%',
        batch_number: 'PA240812',
        quantity_affected: '25 kg',
        severity: 'High',
        status: 'SUBMITTED',
        field_provenance: {
          product_name: { text_span: 'Paracetamol API 99.5%', confidence: 0.98, source_type: 'RAW_TEXT' }
        }
      },
      risk_assessment: {
        severity: 'High',
        priority: 'Urgent',
        risk_rationale: 'Contamination in active ingredient',
        recommended_actions: ['Quarantine lot']
      },
      updated_fields: ['product_name', 'batch_number', 'quantity_affected']
    };

    (api.logComplaint as any).mockResolvedValueOnce(mockApiResponse);

    const store = createMockStore([]);
    render(
      <Provider store={store}>
        <CopilotPanel />
      </Provider>
    );

    const useExampleBtn = screen.getByText('Use example');
    fireEvent.click(useExampleBtn);

    expect(api.logComplaint).toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getAllByText(/Analysis complete/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Review complaint in Quality Queue/i)).toBeInTheDocument();
    });
  });

  it('handles and displays error state with retry button when analysis fails', async () => {
    (api.logComplaint as any).mockRejectedValueOnce(new Error('Network timeout'));

    const store = createMockStore([]);
    render(
      <Provider store={store}>
        <CopilotPanel />
      </Provider>
    );

    const useExampleBtn = screen.getByText('Use example');
    fireEvent.click(useExampleBtn);

    await waitFor(() => {
      expect(screen.getByText(/Analysis unavailable/i)).toBeInTheDocument();
      expect(screen.getByText(/Retry analysis/i)).toBeInTheDocument();
    });
  });
});
