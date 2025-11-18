import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HealthOverview } from '../../src/components/Health/HealthOverview';
import type { HealthSummary } from '../../src/types/health';
import '@testing-library/jest-dom/vitest';


describe('HealthOverview', () => {
  const mockSummary: HealthSummary = {
      total: 10,
      up: 8,
      down: 2,
      unknown: 0,
      avgResponseTime: 125,
      error: 0
  };

  it('should render 3 cards (not 4)', () => {
    const { container } = render(
      <HealthOverview summary={mockSummary} isLoading={false} />
    );

    // Should have grid with 3 columns on large screens
    const grid = container.querySelector('.lg\\:grid-cols-3');
    expect(grid).toBeTruthy();

    // Count the number of card divs
    const cards = container.querySelectorAll('.rounded-lg.p-6');
    expect(cards).toHaveLength(3);
  });

  it('should not render Total Components card', () => {
    render(<HealthOverview summary={mockSummary} isLoading={false} />);

    // Should not have "Total Components" text
    expect(screen.queryByText('Total Components')).toBeNull();
  });

  it('should render Healthy card', () => {
    render(<HealthOverview summary={mockSummary} isLoading={false} />);

    expect(screen.getByText('Healthy')).toBeTruthy();
    expect(screen.getByText('8')).toBeTruthy();
    expect(screen.getByText('80.0%')).toBeTruthy();
  });

  it('should render Down card', () => {
    render(<HealthOverview summary={mockSummary} isLoading={false} />);

    expect(screen.getByText('Down')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('20.0%')).toBeTruthy();
  });

  it('should render Avg Response Time card', () => {
    render(<HealthOverview summary={mockSummary} isLoading={false} />);

    expect(screen.getByText('Avg Response Time')).toBeTruthy();
    expect(screen.getByText('125ms')).toBeTruthy();
  });

  it('should show loading state', () => {
    const { container } = render(
      <HealthOverview summary={mockSummary} isLoading={true} />
    );
    
    const pulsingElements = container.querySelectorAll('.animate-pulse');
    expect(pulsingElements.length).toBeGreaterThan(0);
  });

  it('should calculate percentages correctly with 0 total', () => {
    const emptySummary: HealthSummary = {
        total: 0,
        up: 0,
        down: 0,
        unknown: 0,
        avgResponseTime: 0,
        error: 0
    };

    render(<HealthOverview summary={emptySummary} isLoading={false} />);

    // Should show 0% for both
    const percentages = screen.getAllByText('0%');
    expect(percentages).toHaveLength(2); // Healthy and Down percentages
  });

  it('should use correct color classes for each card', () => {
    const { container } = render(
      <HealthOverview summary={mockSummary} isLoading={false} />
    );

    // Healthy should have green colors
    expect(container.innerHTML).toContain('text-green-600');
    expect(container.innerHTML).toContain('bg-green-100');

    // Down should have red colors
    expect(container.innerHTML).toContain('text-red-600');
    expect(container.innerHTML).toContain('bg-red-100');

    // Avg Response Time should have blue colors
    expect(container.innerHTML).toContain('text-blue-600');
    expect(container.innerHTML).toContain('bg-blue-100');
  });

  it('should have proper grid layout on different screen sizes', () => {
    const { container } = render(
      <HealthOverview summary={mockSummary} isLoading={false} />
    );

    const grid = container.firstChild as HTMLElement;
    
    // Should have responsive grid classes
    expect(grid.className).toContain('grid-cols-1');
    expect(grid.className).toContain('md:grid-cols-2');
    expect(grid.className).toContain('lg:grid-cols-3');
  });
});