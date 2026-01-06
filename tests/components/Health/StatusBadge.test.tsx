import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../../../src/components/Health/StatusBadge';
import '@testing-library/jest-dom/vitest';

describe('StatusBadge', () => {
  it('should render UP status with correct styling', () => {
    render(<StatusBadge status="UP" />);
    const badge = screen.getByText('UP');
    expect(badge).toBeTruthy();
    
    const container = badge.closest('div');
    expect(container?.className).toContain('bg-green-100');
    expect(container?.className).toContain('text-green-800');
  });

  it('should render DOWN status with correct styling', () => {
    render(<StatusBadge status="DOWN" />);
    const badge = screen.getByText('DOWN');
    expect(badge).toBeTruthy();
    
    const container = badge.closest('div');
    expect(container?.className).toContain('bg-red-100');
    expect(container?.className).toContain('text-red-800');
  });

  it('should render LOADING status with spinning animation', () => {
    render(<StatusBadge status="LOADING" />);
    const badge = screen.getByText('LOADING');
    expect(badge).toBeTruthy();
    
    const container = badge.closest('div');
    const icon = container?.querySelector('.animate-spin');
    expect(icon).toBeTruthy();
  });

  it('should display error message in title attribute', () => {
    const errorMessage = 'Connection timeout';
    render(<StatusBadge status="ERROR" error={errorMessage} />);
    
    const container = screen.getByText('ERROR').closest('div');
    expect(container).toHaveAttribute('title', errorMessage);
  });

  // New tests for recent code additions
  it('should render UNKNOWN status with correct styling and label', () => {
    render(<StatusBadge status="UNKNOWN" />);
    const badge = screen.getByText('Not Available');
    expect(badge).toBeTruthy();
    
    // Verify the container has the correct structure
    const container = badge.closest('div');
    expect(container).toBeTruthy();
  });

  it('should render OUT_OF_SERVICE status with correct styling', () => {
    render(<StatusBadge status="OUT_OF_SERVICE" />);
    const badge = screen.getByText('OUT_OF_SERVICE');
    expect(badge).toBeTruthy();
    
    const container = badge.closest('div');
    expect(container?.className).toContain('bg-yellow-100');
    expect(container?.className).toContain('text-yellow-800');
  });

  it('should handle unknown status gracefully', () => {
    // @ts-ignore - Testing with invalid status
    render(<StatusBadge status="INVALID_STATUS" />);
    const badge = screen.getByText('UNKNOWN');
    expect(badge).toBeTruthy();
    
    const container = badge.closest('div');
    expect(container?.className).toContain('bg-gray-100');
    expect(container?.className).toContain('text-gray-800');
  });

  it('should display status as title when no error provided', () => {
    render(<StatusBadge status="UP" />);
    
    const container = screen.getByText('UP').closest('div');
    expect(container).toHaveAttribute('title', 'UP');
  });

  it('should render with dark mode classes', () => {
    render(<StatusBadge status="UP" />);
    const badge = screen.getByText('UP');
    const container = badge.closest('div');
    
    expect(container?.className).toContain('dark:bg-green-900/30');
    expect(container?.className).toContain('dark:text-green-400');
  });
});
