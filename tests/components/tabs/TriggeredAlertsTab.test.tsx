import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TriggeredAlertsTab } from '../../../src/components/tabs/TriggeredAlertsTab';

// Mock the context and its dependencies
vi.mock('../../../src/contexts/TriggeredAlertsContext', () => ({
  TriggeredAlertsProvider: ({ children }: any) => <div data-testid="triggered-alerts-provider">{children}</div>,
  useTriggeredAlertsContext: () => ({
    filteredAlerts: [],
    isLoading: false,
    filtersLoading: false,
    error: null,
    options: {
      regions: ['us-east-1', 'eu-west-1'],
      severities: ['critical', 'warning'],
      statuses: ['firing', 'resolved'],
      landscapes: ['production', 'staging'],
      components: ['component-a', 'component-b'],
    },
  }),
}));

// Mock the child components
vi.mock('../../../src/components/TriggeredAlerts/TriggeredAlertsFilters', () => ({
  TriggeredAlertsFilters: () => <div data-testid="triggered-alerts-filters">Filters</div>,
}));

vi.mock('../../../src/components/TriggeredAlerts/TriggeredAlertsTable', () => ({
  TriggeredAlertsTable: ({ showRegion }: any) => (
    <div data-testid="triggered-alerts-table">
      Table - showRegion: {showRegion?.toString()}
    </div>
  ),
}));

describe('TriggeredAlertsTab', () => {
  const defaultProps = {
    projectId: 'test-project-123',
  };

  it('should render the component with required props', () => {
    render(<TriggeredAlertsTab {...defaultProps} />);
    
    expect(screen.getByTestId('triggered-alerts-provider')).toBeInTheDocument();
    expect(screen.getByTestId('triggered-alerts-filters')).toBeInTheDocument();
    expect(screen.getByTestId('triggered-alerts-table')).toBeInTheDocument();
  });

  it('should render with different projectId', () => {
    render(<TriggeredAlertsTab projectId="different-project-456" />);
    
    expect(screen.getByTestId('triggered-alerts-provider')).toBeInTheDocument();
    expect(screen.getByTestId('triggered-alerts-filters')).toBeInTheDocument();
    expect(screen.getByTestId('triggered-alerts-table')).toBeInTheDocument();
  });

  it('should have correct structure and styling', () => {
    render(<TriggeredAlertsTab {...defaultProps} />);
    
    expect(screen.getByTestId('triggered-alerts-filters')).toBeInTheDocument();
    expect(screen.getByTestId('triggered-alerts-table')).toBeInTheDocument();
    
    // Check that showRegion is passed correctly to the table
    expect(screen.getByText('Table - showRegion: true')).toBeInTheDocument();
  });

  it('should handle edge cases', () => {
    render(<TriggeredAlertsTab projectId="" />);
    
    expect(screen.getByTestId('triggered-alerts-provider')).toBeInTheDocument();
    expect(screen.getByTestId('triggered-alerts-filters')).toBeInTheDocument();
    expect(screen.getByTestId('triggered-alerts-table')).toBeInTheDocument();
  });
});
