import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '../../../src/test/setup';
import { ConfirmDialog } from '../../../src/components/AILaunchpad/ConfirmDialog';

const mockProps = {
  open: true,
  onOpenChange: vi.fn(),
  title: 'Confirm Action',
  description: 'Are you sure you want to perform this action?',
  onConfirm: vi.fn(),
};

describe('ConfirmDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with title, description and buttons', () => {
    render(<ConfirmDialog {...mockProps} />);
    
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to perform this action?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('should render with custom button text and variants', () => {
    render(
      <ConfirmDialog 
        {...mockProps} 
        variant="destructive"
        confirmText="Delete" 
        cancelText="Keep" 
      />
    );
    
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Keep' })).toBeInTheDocument();
  });

  it('should handle confirm and cancel actions', async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog {...mockProps} />);
    
    // Test confirm
    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(mockProps.onConfirm).toHaveBeenCalledTimes(1);
    
    // Test cancel
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mockProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should not render when closed', () => {
    render(<ConfirmDialog {...mockProps} open={false} />);
    
    expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
  });
});
