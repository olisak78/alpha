import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SelfServiceDialogButtons } from '../../../src/components/SelfService/SelfServiceDialogButtons';

describe('SelfServiceDialogButtons', () => {
  const mockOnCancel = vi.fn();
  const mockOnPrevious = vi.fn();
  const mockOnNext = vi.fn();
  const mockOnSubmit = vi.fn();

  const defaultProps = {
    currentStep: 'configuration' as const,
    isLoading: false,
    hasParameters: true,
    onCancel: mockOnCancel,
    onPrevious: mockOnPrevious,
    onNext: mockOnNext,
    onSubmit: mockOnSubmit
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Button Rendering and Interactions', () => {
    const previewProps = { 
      ...defaultProps, 
      currentStep: 'preview' as const,
      currentStepIndex: 1,
      totalSteps: 2
    };

    it('renders appropriate buttons for each step and handles all interactions', () => {
      // Test configuration step buttons
      const { rerender } = render(<SelfServiceDialogButtons {...defaultProps} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /previous/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /submit/i })).not.toBeInTheDocument();

      // Test next button interaction
      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).not.toBeDisabled();
      fireEvent.click(nextButton);
      expect(mockOnNext).toHaveBeenCalledTimes(1);

      // Test cancel button interaction
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);
      expect(mockOnCancel).toHaveBeenCalledTimes(1);

      // Test preview step buttons
      rerender(<SelfServiceDialogButtons {...previewProps} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument();

      // Test preview interactions
      fireEvent.click(screen.getByRole('button', { name: /previous/i }));
      expect(mockOnPrevious).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole('button', { name: /submit/i }));
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    it('handles loading and disabled states correctly', () => {
      // Test disabled next button
      const { rerender } = render(<SelfServiceDialogButtons {...defaultProps} hasParameters={false} />);
      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();

      rerender(<SelfServiceDialogButtons {...defaultProps} isLoading={true} />);
      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();

      // Test loading state in preview
      rerender(<SelfServiceDialogButtons {...previewProps} isLoading={true} />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Submit')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /loading/i })).toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('does not call handlers when buttons are disabled', () => {
      render(<SelfServiceDialogButtons {...defaultProps} hasParameters={false} />);

      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      expect(mockOnNext).not.toHaveBeenCalled();
    });

    it('maintains button order correctly', () => {
      render(<SelfServiceDialogButtons {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      const nextButton = screen.getByRole('button', { name: /next/i });

      expect(buttons.indexOf(cancelButton)).toBeLessThan(buttons.indexOf(nextButton));
    });
  });
});
