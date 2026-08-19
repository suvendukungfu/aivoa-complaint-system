import type {
  AIResponse,
  ComplaintData,
  RiskAssessment,
  CompletenessAssessment,
  DuplicateMatch,
  SaveComplaintResponse,
  PaginatedComplaintList,
  QMSAnalytics,
  AIMetrics,
  AIProposalItem,
  AuditTimelineResponse
} from '../types';

const API_BASE = '/api';

function generateRequestId(): string {
  return `req_${Math.random().toString(36).substring(2, 10)}`;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = 'An unexpected server error occurred';
    try {
      const errJson = await res.json();
      errorDetail = errJson.error?.message || errJson.detail || errJson.message || errorDetail;
    } catch {
      errorDetail = (await res.text()) || errorDetail;
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

export const api = {
  async logComplaint(text: string): Promise<AIResponse> {
    const res = await fetch(`${API_BASE}/complaints/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': generateRequestId()
      },
      body: JSON.stringify({ text })
    });
    return handleResponse<AIResponse>(res);
  },

  async editComplaint(instruction: string, currentComplaint: ComplaintData): Promise<AIResponse> {
    const res = await fetch(`${API_BASE}/complaints/edit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': generateRequestId()
      },
      body: JSON.stringify({
        instruction,
        current_complaint: currentComplaint
      })
    });
    return handleResponse<AIResponse>(res);
  },

  async extractDocument(file: File): Promise<AIResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/complaints/extract`, {
      method: 'POST',
      headers: {
        'X-Request-ID': generateRequestId()
      },
      body: formData
    });
    return handleResponse<AIResponse>(res);
  },

  async evaluateCompleteness(complaint: ComplaintData): Promise<CompletenessAssessment> {
    const res = await fetch(`${API_BASE}/complaints/completeness`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ complaint })
    });
    return handleResponse<CompletenessAssessment>(res);
  },

  async evaluateRisk(complaint: ComplaintData): Promise<RiskAssessment> {
    const res = await fetch(`${API_BASE}/complaints/risk-assessment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ complaint })
    });
    return handleResponse<RiskAssessment>(res);
  },

  async generateSummary(complaint: ComplaintData): Promise<{ summary: string }> {
    const res = await fetch(`${API_BASE}/complaints/summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ complaint })
    });
    return handleResponse<{ summary: string }>(res);
  },

  async checkDuplicates(complaint: ComplaintData): Promise<DuplicateMatch | null> {
    const res = await fetch(`${API_BASE}/complaints/duplicates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ complaint })
    });
    return handleResponse<DuplicateMatch | null>(res);
  },

  async saveComplaint(complaint: ComplaintData): Promise<SaveComplaintResponse> {
    const res = await fetch(`${API_BASE}/complaints/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': generateRequestId()
      },
      body: JSON.stringify(complaint)
    });
    return handleResponse<SaveComplaintResponse>(res);
  },

  async fetchComplaints(
    page: number = 1,
    pageSize: number = 20,
    search?: string,
    severity?: string,
    status?: string
  ): Promise<PaginatedComplaintList> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString()
    });
    if (search) params.append('search', search);
    if (severity) params.append('severity', severity);
    if (status) params.append('status', status);

    const res = await fetch(`${API_BASE}/complaints?${params.toString()}`);
    return handleResponse<PaginatedComplaintList>(res);
  },

  async fetchComplaintById(id: number): Promise<ComplaintData> {
    const res = await fetch(`${API_BASE}/complaints/${id}`);
    return handleResponse<ComplaintData>(res);
  },

  async fetchAnalytics(): Promise<QMSAnalytics> {
    const res = await fetch(`${API_BASE}/analytics`);
    return handleResponse<QMSAnalytics>(res);
  },

  async fetchAIMetrics(): Promise<AIMetrics> {
    const res = await fetch(`${API_BASE}/analytics/ai-metrics`);
    return handleResponse<AIMetrics>(res);
  },

  async transitionComplaint(
    complaintId: number,
    targetState: string,
    reason?: string,
    actorId: string = 'qa_reviewer'
  ): Promise<{ success: boolean; message: string; previous_state: string; new_state: string; complaint: ComplaintData }> {
    const res = await fetch(`${API_BASE}/complaints/${complaintId}/transition`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': generateRequestId()
      },
      body: JSON.stringify({
        target_state: targetState,
        reason,
        actor_id: actorId
      })
    });
    return handleResponse<any>(res);
  },

  async fetchProposals(complaintId: number, status?: string): Promise<AIProposalItem[]> {
    const url = status 
      ? `${API_BASE}/complaints/${complaintId}/proposals?status=${encodeURIComponent(status)}`
      : `${API_BASE}/complaints/${complaintId}/proposals`;
    const res = await fetch(url);
    return handleResponse<AIProposalItem[]>(res);
  },

  async decideProposal(
    proposalId: string,
    decision: 'APPROVE' | 'REJECT' | 'MODIFY',
    humanValue?: string,
    notes?: string,
    reviewerId: string = 'qa_reviewer'
  ): Promise<{ success: boolean; message: string; proposal: AIProposalItem; complaint: ComplaintData }> {
    const res = await fetch(`${API_BASE}/complaints/proposals/${encodeURIComponent(proposalId)}/decide`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': generateRequestId()
      },
      body: JSON.stringify({
        decision,
        human_value: humanValue,
        notes,
        reviewer_id: reviewerId
      })
    });
    return handleResponse<any>(res);
  },

  async fetchTimeline(complaintId: number): Promise<AuditTimelineResponse> {
    const res = await fetch(`${API_BASE}/complaints/${complaintId}/timeline`);
    return handleResponse<AuditTimelineResponse>(res);
  },

  async fetchStateMetadata(): Promise<any> {
    const res = await fetch(`${API_BASE}/complaints/states/metadata`);
    return handleResponse<any>(res);
  },

  async fetchReviewerDashboard(): Promise<{
    total_proposals: number;
    pending_ai_reviews: number;
    approved_proposals: number;
    rejected_proposals: number;
    human_overrides: number;
    ai_override_rate_pct: number;
    ai_acceptance_rate_pct: number;
    high_critical_complaints: number;
    average_review_time_seconds: number;
  }> {
    const res = await fetch(`${API_BASE}/complaints/dashboard/review`);
    return handleResponse<any>(res);
  },

  async fetchHealth(): Promise<{
    status: string;
    service: string;
    version: string;
    ai_model: string;
    groq_configured: boolean;
    database_connected: boolean;
    database_type: string;
    environment: string;
  }> {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse<any>(res);
  }
};
