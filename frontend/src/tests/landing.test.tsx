/** @vitest-environment jsdom */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { Typewriter } from '../features/landing/Typewriter';
import { LandingPage } from '../features/landing/LandingPage';
import { LandingNav } from '../features/landing/LandingNav';
import { LandingActions } from '../features/landing/LandingActions';

describe('AIVOA Cinematic Landing Page Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('test_typewriter_renders_and_types_text: types out text with delay', () => {
    render(<Typewriter text="Quality decisions, grounded in evidence." speed={20} startDelay={100} />);

    expect(screen.queryByText('Quality decisions, grounded in evidence.')).not.toBeInTheDocument();

    // Advance time past startDelay and typing duration
    act(() => {
      vi.advanceTimersByTime(100 + 40 * 20 + 200);
    });

    expect(screen.getByText('Quality decisions, grounded in evidence.')).toBeInTheDocument();
  });

  it('test_landing_page_renders_hero_and_status: verifies hero copy and trust strip', () => {
    const onEnter = vi.fn();
    render(<LandingPage onEnterWorkspace={onEnter} />);

    expect(screen.getByText(/QUALITY INTELLIGENCE PLATFORM/i)).toBeInTheDocument();
    expect(screen.getByText(/Turn unstructured pharmaceutical complaints into structured/i)).toBeInTheDocument();
    expect(screen.getByText(/CMP-2026-0001/i)).toBeInTheDocument();
    expect(screen.getByText(/SYSTEM STATUS/i)).toBeInTheDocument();
    expect(screen.getByText(/EVIDENCE GROUNDED/i)).toBeInTheDocument();
  });

  it('test_landing_actions_navigation: triggers workspace entry', () => {
    const onNavigate = vi.fn();
    render(<LandingActions onNavigate={onNavigate} />);

    const openBtn = screen.getByText('Open Workspace');
    fireEvent.click(openBtn);
    expect(onNavigate).toHaveBeenCalledWith('OVERVIEW');

    const reviewBtn = screen.getByText('View Review Queue');
    fireEvent.click(reviewBtn);
    expect(onNavigate).toHaveBeenCalledWith('REVIEW');

    const evidenceBtn = screen.getByText('Explore Evidence');
    fireEvent.click(evidenceBtn);
    expect(onNavigate).toHaveBeenCalledWith('DOCUMENTS');

    const auditBtn = screen.getByText('See Audit Trail');
    fireEvent.click(auditBtn);
    expect(onNavigate).toHaveBeenCalledWith('TIMELINE');
  });

  it('test_landing_nav_navigation: triggers workspace navigation from header', () => {
    const onNavigate = vi.fn();
    render(<LandingNav onNavigate={onNavigate} />);

    const productBtn = screen.getByText('Product');
    fireEvent.click(productBtn);
    expect(onNavigate).toHaveBeenCalledWith('OVERVIEW');

    const workflowBtn = screen.getByText('Workflow');
    fireEvent.click(workflowBtn);
    expect(onNavigate).toHaveBeenCalledWith('INTAKE');

    const evidenceBtn = screen.getByText('Evidence');
    fireEvent.click(evidenceBtn);
    expect(onNavigate).toHaveBeenCalledWith('DOCUMENTS');
  });
});
