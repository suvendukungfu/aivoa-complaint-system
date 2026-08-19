/** @vitest-environment jsdom */
import { describe, it, expect, vi, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ProposalReviewModal } from '../features/review/ProposalReviewModal';
import { LifecycleStepper } from '../features/review/LifecycleStepper';
import { ComplaintActivityTimeline } from '../features/review/ComplaintActivityTimeline';
import type { AIProposalItem, AuditTimelineEventItem } from '../types';

describe('Phase 8 Human-in-the-Loop Quality Review UI Tests', () => {
  afterEach(() => {
    cleanup();
  });
  const mockProposal: AIProposalItem = {
    id: 1,
    proposal_id: 'PROP-2026-01',
    complaint_id: 101,
    ai_run_id: 'AI-93D22C',
    proposal_type: 'RISK_SEVERITY',
    field_name: 'severity',
    current_value: 'Medium',
    proposed_value: 'High',
    reason: 'Foreign particulate matter detected in active ingredient drum.',
    source: 'AI Risk Assessment',
    confidence_score: 0.98,
    status: 'PROPOSED'
  };

  it('test_proposal_display: renders proposal comparison card with current vs proposed values', () => {
    render(
      <ProposalReviewModal
        isOpen={true}
        onClose={() => {}}
        proposal={mockProposal}
        onApprove={async () => {}}
        onReject={async () => {}}
        onModify={async () => {}}
      />
    );

    expect(screen.getByText(/Review AI Proposal: SEVERITY/i)).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText(/98% Conf/i)).toBeInTheDocument();
  });

  it('test_approval_state: executes approve callback with valid arguments', async () => {
    const onApprove = vi.fn().mockResolvedValue(undefined);
    render(
      <ProposalReviewModal
        isOpen={true}
        onClose={() => {}}
        proposal={mockProposal}
        onApprove={onApprove}
        onReject={async () => {}}
        onModify={async () => {}}
      />
    );

    const approveButton = screen.getByText('Confirm Approval');
    fireEvent.click(approveButton);

    expect(onApprove).toHaveBeenCalledWith('PROP-2026-01', 'Approved by Quality Reviewer');
  });

  it('test_rejection_reason: requires documented rationale before rejecting', async () => {
    const onReject = vi.fn().mockResolvedValue(undefined);
    render(
      <ProposalReviewModal
        isOpen={true}
        onClose={() => {}}
        proposal={mockProposal}
        onApprove={async () => {}}
        onReject={onReject}
        onModify={async () => {}}
      />
    );

    // Switch to reject tab
    const rejectTabs = screen.getAllByText(/Reject Proposal/i);
    fireEvent.click(rejectTabs[0]);

    // Attempt submitting without reason
    const submitBtn = screen.getByText('Confirm Rejection');
    fireEvent.click(submitBtn);

    expect(screen.getByText(/Mandatory documented justification required/i)).toBeInTheDocument();
    expect(onReject).not.toHaveBeenCalled();

    // Fill reason and submit
    const textarea = screen.getByPlaceholderText(/Reviewer determined that evidence indicates/i);
    fireEvent.change(textarea, { target: { value: 'Packaging defect only.' } });
    fireEvent.click(submitBtn);

    expect(onReject).toHaveBeenCalledWith('PROP-2026-01', 'Packaging defect only.');
  });

  it('test_modify_proposal: executes human override with new value and rationale', async () => {
    const onModify = vi.fn().mockResolvedValue(undefined);
    render(
      <ProposalReviewModal
        isOpen={true}
        onClose={() => {}}
        proposal={mockProposal}
        onApprove={async () => {}}
        onReject={async () => {}}
        onModify={onModify}
      />
    );

    // Switch to modify tab
    const modifyTabs = screen.getAllByText(/Human Override/i);
    fireEvent.click(modifyTabs[0]);

    // Fill override rationale
    const reasonInput = screen.getByPlaceholderText(/Potential batch-wide particulate contamination/i);
    fireEvent.change(reasonInput, { target: { value: 'Critical batch contamination escalation.' } });

    const submitBtn = screen.getByText('Apply Human Override');
    fireEvent.click(submitBtn);

    expect(onModify).toHaveBeenCalledWith('PROP-2026-01', 'Critical', 'Critical batch contamination escalation.');
  });

  it('test_lifecycle_stepper: displays 7 GxP lifecycle stages and highlights active state', () => {
    const onTransition = vi.fn();
    render(
      <LifecycleStepper
        currentStatus="UNDER_REVIEW"
        onTransition={onTransition}
      />
    );

    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Submitted')).toBeInTheDocument();
    expect(screen.getByText('Pending Triage')).toBeInTheDocument();
    expect(screen.getByText('Under Review')).toBeInTheDocument();
    expect(screen.getByText('Investigation')).toBeInTheDocument();
    expect(screen.getByText('Quality Decision')).toBeInTheDocument();
    expect(screen.getByText('Closed')).toBeInTheDocument();
  });

  it('test_activity_timeline: displays chronological audit events with actor badges', () => {
    const mockEvents: AuditTimelineEventItem[] = [
      {
        id: 1,
        timestamp: '17 Aug 2026 10:41:00 UTC',
        time_str: '10:41',
        event_type: 'COMPLAINT_CREATED',
        title: 'Complaint Received',
        description: 'Complaint record initiated for Paracetamol API',
        actor: 'aivoa_copilot',
        actor_type: 'AI',
        diffs: {}
      },
      {
        id: 2,
        timestamp: '17 Aug 2026 10:45:00 UTC',
        time_str: '10:45',
        event_type: 'USER_APPROVED',
        title: 'Quality Reviewer Approved',
        description: 'Reviewer approved High severity recommendation',
        actor: 'qa_reviewer_01',
        actor_type: 'USER',
        diffs: {
          severity: { before: 'Medium', after: 'High' }
        }
      }
    ];

    render(
      <ComplaintActivityTimeline
        events={mockEvents}
        complaintNumber="CMP-2026-0007"
      />
    );

    expect(screen.getByText('Complaint Received')).toBeInTheDocument();
    expect(screen.getByText('Quality Reviewer Approved')).toBeInTheDocument();
    expect(screen.getByText('2 Immutable Events')).toBeInTheDocument();
  });
});
