export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type PriorityLevel = 'Low' | 'Normal' | 'High' | 'Urgent';

export type AIProcessingState = 
  | 'IDLE'
  | 'ANALYZING'
  | 'EXTRACTING'
  | 'VALIDATING'
  | 'ASSESSING_RISK'
  | 'UPDATING_FORM'
  | 'SUCCESS'
  | 'ERROR';

export interface FieldConfidence {
  customer_name?: number;
  product_name?: number;
  product_strength?: number;
  batch_number?: number;
  manufacturing_date?: number;
  expiry_date?: number;
  quantity_affected?: number;
  complaint_type?: number;
  detailed_description?: number;
  [key: string]: number | undefined;
}

export interface FieldProvenanceItem {
  field: string;
  value?: any;
  source_type: 'customer_prompt' | 'uploaded_document' | 'user_edit' | 'ai_inference' | 'deterministic_rule' | string;
  source_document_id?: string | null;
  page_number?: number | null;
  text_span?: string | null;
  confidence: number;
  ai_run_id?: string | null;
  classification: 'EXPLICIT_EXTRACTED' | 'INFERRED' | 'USER_SPECIFIED';
  updated_at?: string;
}

export interface RiskEvidenceItem {
  risk_factor: string;
  severity_impact: string;
  evidence: string;
  source: string;
  page_number?: number | null;
  classification: 'EXPLICIT_EXTRACTED' | 'INFERRED';
}

export type QMSComplaintStatus = 
  | 'DRAFT' 
  | 'SUBMITTED' 
  | 'PENDING_TRIAGE' 
  | 'UNDER_REVIEW' 
  | 'INVESTIGATION' 
  | 'QUALITY_DECISION' 
  | 'CLOSED';

export type AIProposalStatus = 
  | 'PROPOSED'
  | 'AI_PROPOSED' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'MODIFIED' 
  | 'APPLIED';

export interface AIProposalItem {
  id?: number;
  proposal_id: string;
  complaint_id: number;
  ai_run_id?: string;
  proposal_type: string;
  field_name: string;
  current_value?: string;
  proposed_value: string;
  reason?: string;
  source: string;
  confidence_score: number;
  status: AIProposalStatus;
  reviewer_decision?: string;
  reviewer_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at?: string;
}

export interface ComplaintData {
  id?: number;
  complaint_number?: string;
  complaint_source?: string;
  customer_name?: string;
  product_name?: string;
  product_strength?: string;
  batch_number?: string;
  manufacturing_date?: string;
  expiry_date?: string;
  quantity_affected?: string;
  quantity_unit?: string;
  complaint_type?: string;
  complaint_date?: string;
  detailed_description?: string;
  severity?: SeverityLevel;
  priority?: PriorityLevel;
  ai_confidence?: number;
  ai_reasoning?: string;
  recommended_actions?: string[];
  completeness_score?: number;
  field_confidence?: FieldConfidence;
  field_provenance?: Record<string, FieldProvenanceItem>;
  status?: string;
  created_at?: string;
  updated_at?: string;
  events?: ComplaintEvent[];
  proposals?: AIProposalItem[];
}

export interface StepAuditLog {
  step_name: string;
  description: string;
  status: 'completed' | 'in_progress' | 'skipped' | 'error';
  timestamp: string;
}

export interface RiskAssessment {
  severity: SeverityLevel;
  priority: PriorityLevel;
  risk_rationale: string;
  recommended_actions: string[];
  disclaimer: string;
  evidence_grounding?: RiskEvidenceItem[];
}

export interface CompletenessAssessment {
  completeness_score: number;
  missing_critical_fields: string[];
  missing_optional_fields: string[];
  recommendations: string[];
}

export interface DuplicateMatch {
  complaint_number: string;
  similarity: number;
  reason: string;
  product_name?: string;
  batch_number?: string;
  severity?: string;
  created_at?: string;
}

export interface AIResponse {
  success: boolean;
  message: string;
  complaint: ComplaintData;
  updated_fields: string[];
  audit_trail: StepAuditLog[];
  risk_assessment?: RiskAssessment;
  completeness?: CompletenessAssessment;
  duplicate_warning?: DuplicateMatch;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  updatedFields?: string[];
  risk?: RiskAssessment;
}

export interface SaveComplaintResponse {
  success: boolean;
  id: number;
  complaint_number: string;
  status: string;
  message: string;
  created_at: string;
}

export interface ComplaintEvent {
  id: number;
  complaint_id?: number;
  event_type: string;
  input_text?: string;
  structured_changes?: Record<string, any>;
  actor?: string;
  created_at: string;
}

export interface HistoricalComplaint extends ComplaintData {
  events?: ComplaintEvent[];
}

export interface PaginatedComplaintList {
  items: ComplaintData[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface QMSAnalytics {
  total_complaints: number;
  high_critical_count: number;
  pending_triage_count: number;
  avg_completeness: number;
  severity_distribution: Record<string, number>;
  status_distribution: Record<string, number>;
  complaint_types: Record<string, number>;
  recent_activity: ComplaintData[];
}

export interface AIMetrics {
  uptime_seconds: number;
  ai_requests_total: number;
  ai_successes_total: number;
  ai_failures_total: number;
  success_rate_percent: number;
  avg_latency_ms: number;
  p95_latency_ms: number;
  sample_count: number;
}

export interface AuditTimelineEventItem {
  id?: number;
  timestamp: string;
  time_str: string;
  event_type: string;
  title: string;
  description: string;
  actor: string;
  actor_type: 'AI' | 'HUMAN' | 'USER' | 'SYSTEM';
  ai_run_id?: string;
  diffs?: Record<string, any>;
}

export interface AuditTimelineResponse {
  complaint_number: string;
  current_status: string;
  events: AuditTimelineEventItem[];
}
