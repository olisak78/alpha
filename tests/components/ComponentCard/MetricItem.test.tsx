import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricItem } from '../../../src/components/ComponentCard/MetricItem';
import { Activity } from 'lucide-react';
import '@testing-library/jest-dom/vitest';

describe('MetricItem', () => {
  const defaultProps = {
    icon: Activity,
    iconColor: 'text-blue-600',
    value: '85%',
    label: 'Coverage',
    isLoading: false,
  };

  describe('Rendering', () => {
    it('should render metric item with value, label, and icon', () => {
      const { container } = render(<MetricItem {...defaultProps} />);

      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('Coverage')).toBeInTheDocument();
      expect(container.querySelector('.text-blue-600')).toBeInTheDocument();
    });

    it('should apply correct container and element styling', () => {
      const { container } = render(<MetricItem {...defaultProps} />);
      
      const metricContainer = container.firstChild as HTMLElement;
      expect(metricContainer).toHaveClass(
        'flex', 'flex-col', 'items-center', 'justify-center',
        'p-2', 'rounded-lg', 'bg-muted/40', 'hover:bg-muted/60', 'transition-colors'
      );

      const value = screen.getByText('85%');
      expect(value).toHaveClass('font-semibold', 'text-xs', 'truncate', 'max-w-full');

      const label = screen.getByText('Coverage');
      expect(label).toHaveClass('text-[10px]', 'text-muted-foreground', 'mt-0.5');
    });
  });

  describe('Loading State', () => {
    it('should show loading dots when isLoading is true', () => {
      render(<MetricItem {...defaultProps} isLoading={true} />);

      expect(screen.getByText('...')).toBeInTheDocument();
      expect(screen.queryByText('85%')).not.toBeInTheDocument();
    });
  });

  describe('Value Variations', () => {
    it('should render different value types correctly', () => {
      const { rerender } = render(<MetricItem {...defaultProps} value="42" />);
      expect(screen.getByText('42')).toBeInTheDocument();

      rerender(<MetricItem {...defaultProps} value="Passed" />);
      expect(screen.getByText('Passed')).toBeInTheDocument();

      rerender(<MetricItem {...defaultProps} value="N/A" />);
      expect(screen.getByText('N/A')).toBeInTheDocument();

      rerender(<MetricItem {...defaultProps} value="0" />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle long values with truncation', () => {
      const longValue = 'This is a very long value that should be truncated';
      render(<MetricItem {...defaultProps} value={longValue} />);

      const valueElement = screen.getByText(longValue);
      expect(valueElement).toHaveClass('truncate', 'max-w-full');
    });
  });

  describe('Icon Colors', () => {
    it('should apply different icon colors correctly', () => {
      const { container, rerender } = render(<MetricItem {...defaultProps} iconColor="text-blue-600" />);
      expect(container.querySelector('.text-blue-600')).toBeInTheDocument();

      rerender(<MetricItem {...defaultProps} iconColor="text-red-500" />);
      expect(container.querySelector('.text-red-500')).toBeInTheDocument();

      rerender(<MetricItem {...defaultProps} iconColor="text-green-600" />);
      expect(container.querySelector('.text-green-600')).toBeInTheDocument();
    });
  });
});
