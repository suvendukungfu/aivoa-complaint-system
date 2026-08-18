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

    expect(screen.getByText(/AI SYSTEM READY/i)).toBeInTheDocument();
    expect(screen.getByText(/AIVOA turns unstructured pharmaceutical complaints into/i)).toBeInTheDocument();
    expect(screen.getByText(/AI-assisted · Evidence-grounded · Human-controlled/i)).toBeInTheDocument();
    expect(screen.getByText(/Evidence grounded/i)).toBeInTheDocument();
    expect(screen.getByText(/AIVOA \/ QUALITY INTELLIGENCE/i)).toBeInTheDocument();
  });

  it('test_landing_actions_navigation: triggers workspace entry', () => {
    const onNavigate = vi.fn();
    render(<LandingActions onNavigate={onNavigate} />);

    const openBtn = screen.getByText('Open Workspace');
    fireEvent.click(openBtn);
    expect(onNavigate).toHaveBeenCalledWith('OVERVIEW');

    const reviewBtn = screen.getByText('Explore Review Queue');
    fireEvent.click(reviewBtn);
    expect(onNavigate).toHaveBeenCalledWith('REVIEW');

    const evidenceBtn = screen.getByText('Evidence Workflow');
    fireEvent.click(evidenceBtn);
    expect(onNavigate).toHaveBeenCalledWith('DOCUMENTS');
  });

  it('test_landing_nav_navigation: triggers workspace navigation from header', () => {
    const onNavigate = vi.fn();
    render(<LandingNav onNavigate={onNavigate} />);

    const overviewBtn = screen.getByText('Overview');
    fireEvent.click(overviewBtn);
    expect(onNavigate).toHaveBeenCalledWith('OVERVIEW');

    const complaintsBtn = screen.getByText('Complaints');
    fireEvent.click(complaintsBtn);
    expect(onNavigate).toHaveBeenCalledWith('INTAKE');

    const reviewBtn = screen.getByText('Review Queue');
    fireEvent.click(reviewBtn);
    expect(onNavigate).toHaveBeenCalledWith('REVIEW');
  });
});
