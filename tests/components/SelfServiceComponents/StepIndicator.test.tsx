import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { StepIndicator } from '../../../src/components/SelfService/StepIndicator';

describe('StepIndicator', () => {
  const defaultSteps = [
    { id: 'configuration', title: 'Configuration Options' },
    { id: 'review', title: 'Review Details' }
  ];

  describe('Step Indicator Rendering and Styling', () => {
    it('renders complete step indicator with all elements and proper styling', () => {
      // Test basic rendering at step 0
      const { container, rerender } = render(<StepIndicator currentStepIndex={0} steps={defaultSteps} />);

      // Basic structure and content
      expect(screen.getByText('Configuration Options')).toBeInTheDocument();
      expect(screen.getByText('Review Details')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(container.firstChild?.childNodes).toHaveLength(2); // Two step groups

      // Test step highlighting and styling at step 1
      rerender(<StepIndicator currentStepIndex={1} steps={defaultSteps} />);

      const stepNumbers = screen.getAllByText(/[12]/);
      const firstStep = stepNumbers[0].closest('div');
      const secondStep = stepNumbers[1].closest('div');
      
      // Current step highlighting
      expect(secondStep).toHaveClass('bg-primary', 'text-primary-foreground');
      // Completed step styling
      expect(firstStep).toHaveClass('bg-primary', 'text-white');

      // Label styling
      const reviewLabel = screen.getByText('Review Details');
      const configurationLabel = screen.getByText('Configuration Options');
      expect(reviewLabel).toHaveClass('text-primary', 'font-medium');
      expect(configurationLabel).toHaveClass('text-muted-foreground');

      // Connecting lines
      const connectingLines = container.querySelectorAll('.h-0\\.5.w-24');
      expect(connectingLines).toHaveLength(1); // Between 2 steps
      expect(connectingLines[0]).toHaveClass('bg-primary');
    });
  });

  describe('Edge Cases', () => {
    it('handles first step correctly', () => {
      const { container } = render(<StepIndicator currentStepIndex={0} steps={defaultSteps} />);

      expect(screen.getByText('Configuration Options')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      
      const connectingLines = container.querySelectorAll('.h-0\\.5.w-24');
      expect(connectingLines).toHaveLength(1);
    });

    it('handles invalid currentStepIndex gracefully', () => {
      render(<StepIndicator currentStepIndex={5} steps={defaultSteps} />);

      expect(screen.getByText('Configuration Options')).toBeInTheDocument();
      expect(screen.getByText('Review Details')).toBeInTheDocument();
    });

    it('renders step numbers correctly', () => {
      render(<StepIndicator currentStepIndex={0} steps={defaultSteps} />);

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });
});
