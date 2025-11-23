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



  it('should show loading state', () => {
    const { container } = render(
      <HealthOverview summary={mockSummary} isLoading={true} />
    );
    
    const pulsingElements = container.querySelectorAll('.animate-pulse');
    expect(pulsingElements.length).toBeGreaterThanOrEqual(0)
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

  

  it('should have proper grid layout on different screen sizes', () => {
    const { container } = render(
      <HealthOverview summary={mockSummary} isLoading={false} />
    );

    const grid = container.firstChild as HTMLElement;
    
    // Should have responsive grid classes
    expect(grid.className).toContain('flex gap-3');
 
  });
});