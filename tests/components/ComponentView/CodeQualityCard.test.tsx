import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CodeQualityCard } from '../../../src/components/ComponentView/CodeQualityCard';
import '@testing-library/jest-dom/vitest';

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Shield: ({ className }: { className?: string }) => <div data-testid="shield-icon" className={className} />,
}));

// Mock UI components
vi.mock('../../../src/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card">{children}</div>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-content" className={className}>{children}</div>
  ),
  CardHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-header" className={className}>{children}</div>
  ),
  CardTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-title" className={className}>{children}</div>
  ),
}));

describe('CodeQualityCard', () => {
  const mockSonarData = {
    coverage: 85.5,
    vulnerabilities: 2,
    codeSmells: 15,
    qualityGate: 'Passed' as const,
  };

  it('should render card structure with title and icon', () => {
    render(<CodeQualityCard sonarData={mockSonarData} />);
    
    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByTestId('card-header')).toHaveClass('pb-3');
    expect(screen.getByTestId('card-content')).toHaveClass('space-y-2');
    expect(screen.getByTestId('card-title')).toHaveClass('text-sm', 'font-semibold', 'flex', 'items-center', 'gap-2');
    expect(screen.getByTestId('shield-icon')).toBeInTheDocument();
    expect(screen.getByText('Code Quality')).toBeInTheDocument();
  });

  it('should display coverage with correct formatting', () => {
    render(<CodeQualityCard sonarData={mockSonarData} />);
    
    expect(screen.getByText('Coverage')).toBeInTheDocument();
    expect(screen.getByText('85.5%')).toBeInTheDocument();

    // Test null coverage
    const dataWithNullCoverage = { ...mockSonarData, coverage: null };
    render(<CodeQualityCard sonarData={dataWithNullCoverage} />);
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('should display vulnerabilities with color-coded thresholds', () => {
    // Test moderate vulnerabilities (yellow)
    render(<CodeQualityCard sonarData={mockSonarData} />);
    expect(screen.getByText('Vulnerabilities')).toBeInTheDocument();
    expect(screen.getByText('2')).toHaveClass('text-yellow-600');

    // Test zero vulnerabilities (green)
    const dataWithZeroVulnerabilities = { ...mockSonarData, vulnerabilities: 0 };
    render(<CodeQualityCard sonarData={dataWithZeroVulnerabilities} />);
    expect(screen.getByText('0')).toHaveClass('text-green-600');

    // Test high vulnerabilities (red)
    const dataWithHighVulnerabilities = { ...mockSonarData, vulnerabilities: 10 };
    render(<CodeQualityCard sonarData={dataWithHighVulnerabilities} />);
    expect(screen.getByText('10')).toHaveClass('text-red-600');
  });

  it('should display code smells with color-coded thresholds', () => {
    // Test moderate code smells (yellow)
    render(<CodeQualityCard sonarData={mockSonarData} />);
    expect(screen.getByText('Code Smells')).toBeInTheDocument();
    expect(screen.getByText('15')).toHaveClass('text-yellow-600');

    // Test zero code smells (green)
    const dataWithZeroCodeSmells = { ...mockSonarData, codeSmells: 0 };
    render(<CodeQualityCard sonarData={dataWithZeroCodeSmells} />);
    expect(screen.getByText('0')).toHaveClass('text-green-600');

    // Test high code smells (red)
    const dataWithHighCodeSmells = { ...mockSonarData, codeSmells: 25 };
    render(<CodeQualityCard sonarData={dataWithHighCodeSmells} />);
    expect(screen.getByText('25')).toHaveClass('text-red-600');
  });

  it('should display quality gate with correct colors', () => {
    // Test passed quality gate (green)
    render(<CodeQualityCard sonarData={mockSonarData} />);
    expect(screen.getByText('Quality Gate')).toBeInTheDocument();
    expect(screen.getByText('Passed')).toHaveClass('text-green-600');

    // Test failed quality gate (red)
    const dataWithFailedQualityGate = { ...mockSonarData, qualityGate: 'Failed' };
    render(<CodeQualityCard sonarData={dataWithFailedQualityGate} />);
    expect(screen.getByText('Failed')).toHaveClass('text-red-600');
  });

  it('should handle null values correctly', () => {
    const dataWithNullValues = {
      coverage: null,
      vulnerabilities: null,
      codeSmells: null,
      qualityGate: null,
    };
    
    render(<CodeQualityCard sonarData={dataWithNullValues} />);
    
    const naElements = screen.getAllByText('N/A');
    expect(naElements.length).toBe(4); // One for each null metric
  });
});
