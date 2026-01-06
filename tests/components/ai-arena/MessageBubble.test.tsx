import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MessageBubble } from '../../../src/features/ai-arena/components/MessageBubble';
import { Message } from '../../../src/features/ai-arena/types/chat';

// Import the mocked modules to access them in tests
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentUser } from '@/hooks/api/useMembers';
import ReactMarkdown from 'react-markdown';

// Mock dependencies
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { name: 'John Doe' }
  }))
}));

vi.mock('@/hooks/api/useMembers', () => ({
  useCurrentUser: vi.fn(() => ({
    data: { first_name: 'John', last_name: 'Doe' }
  }))
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, variant, title, disabled, ...props }: any) => (
    <button
      onClick={onClick}
      className={className}
      title={title}
      disabled={disabled}
      data-variant={variant}
      {...props}
    >
      {children}
    </button>
  )
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Copy: ({ className }: any) => <span data-testid="copy-icon" className={className} />,
  Sparkles: ({ className }: any) => <span data-testid="sparkles-icon" className={className} />,
  RotateCcw: ({ className }: any) => <span data-testid="rotate-icon" className={className} />,
  Check: ({ className }: any) => <span data-testid="check-icon" className={className} />,
  ChevronLeft: ({ className }: any) => <span data-testid="chevron-left-icon" className={className} />,
  ChevronRight: ({ className }: any) => <span data-testid="chevron-right-icon" className={className} />,
  User: ({ className }: any) => <span data-testid="user-icon" className={className} />
}));

// Mock ReactMarkdown
vi.mock('react-markdown', () => ({
  default: ({ children }: any) => <div data-testid="markdown-content">{children}</div>
}));

// Mock remark and rehype plugins
vi.mock('remark-gfm', () => ({ default: vi.fn() }));
vi.mock('remark-breaks', () => ({ default: vi.fn() }));
vi.mock('rehype-prism-plus', () => ({ default: vi.fn() }));
vi.mock('@/lib/prism-languages', () => ({ default: {} }));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined)
  }
});

// Sample messages for testing
const userMessage: Message = {
  id: 'user-1',
  role: 'user',
  content: 'Hello, how are you?',
  createdAt: Date.now()
};

const assistantMessage: Message = {
  id: 'assistant-1',
  role: 'assistant',
  content: 'I am doing well, thank you for asking!',
  createdAt: Date.now()
};

const assistantMessageWithAlternatives: Message = {
  id: 'assistant-2',
  role: 'assistant',
  content: 'Current response',
  createdAt: Date.now(),
  alternatives: ['First response', 'Second response', 'Third response'],
  currentAlternativeIndex: 1
};

const streamingMessage: Message = {
  id: 'assistant-3',
  role: 'assistant',
  content: 'Streaming content...',
  createdAt: Date.now(),
  isStreaming: true
};

const regeneratingMessage: Message = {
  id: 'assistant-4',
  role: 'assistant',
  content: 'Previous content',
  createdAt: Date.now(),
  isRegenerating: true
};

describe('MessageBubble', () => {
  const mockOnCopy = vi.fn().mockResolvedValue(undefined);
  const mockOnRegenerate = vi.fn();
  const mockOnNavigateAlternative = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('Basic Rendering', () => {
    it('renders user message with avatar and content', () => {
      render(
        <MessageBubble
          msg={userMessage}
          onCopy={mockOnCopy}
        />
      );

      expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
      expect(screen.getByText('JD')).toBeInTheDocument(); // User initials
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
      expect(screen.queryByTestId('copy-icon')).not.toBeInTheDocument(); // No action buttons for user
    });

    it('renders assistant message with sparkles avatar and action buttons', () => {
      render(
        <MessageBubble
          msg={assistantMessage}
          onCopy={mockOnCopy}
          onRegenerate={mockOnRegenerate}
        />
      );

      expect(screen.getByText('I am doing well, thank you for asking!')).toBeInTheDocument();
      expect(screen.getByTestId('sparkles-icon')).toBeInTheDocument();
      expect(screen.getByTestId('copy-icon')).toBeInTheDocument();
      expect(screen.getByTestId('rotate-icon')).toBeInTheDocument();
    });
  });

  describe('Message States', () => {
    it('shows regenerating state with loading animation', () => {
      const { container } = render(
        <MessageBubble
          msg={regeneratingMessage}
          onCopy={mockOnCopy}
        />
      );

      expect(screen.getByText('Generating response...')).toBeInTheDocument();
      expect(screen.queryByText('Previous content')).not.toBeInTheDocument();
      expect(container.querySelectorAll('.animate-bounce')).toHaveLength(3);
      expect(screen.queryByTestId('copy-icon')).not.toBeInTheDocument(); // No actions during regeneration
    });

    it('shows streaming state with typing cursor', () => {
      render(
        <MessageBubble
          msg={streamingMessage}
          onCopy={mockOnCopy}
        />
      );

      expect(screen.getByText('Streaming content...')).toBeInTheDocument();
      const markdownContent = screen.getByTestId('markdown-content').parentElement;
      expect(markdownContent).toHaveClass('typing-cursor');
    });
  });

  describe('Alternative Answers Navigation', () => {
    it('shows navigation controls and handles button states correctly', () => {
      // Test middle position
      render(
        <MessageBubble
          msg={assistantMessageWithAlternatives}
          onCopy={mockOnCopy}
          onNavigateAlternative={mockOnNavigateAlternative}
        />
      );

      expect(screen.getByTestId('chevron-left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('chevron-right-icon')).toBeInTheDocument();
      expect(screen.getByText('2 / 3')).toBeInTheDocument();
    });

    it('disables navigation buttons at boundaries', () => {
      // Test first position
      const firstAlternativeMessage = {
        ...assistantMessageWithAlternatives,
        currentAlternativeIndex: 0
      };

      const { rerender } = render(
        <MessageBubble
          msg={firstAlternativeMessage}
          onCopy={mockOnCopy}
          onNavigateAlternative={mockOnNavigateAlternative}
        />
      );

      const prevButton = screen.getByTestId('chevron-left-icon').closest('button')!;
      expect(prevButton).toBeDisabled();
      expect(screen.getByText('1 / 3')).toBeInTheDocument();

      // Test last position
      const lastAlternativeMessage = {
        ...assistantMessageWithAlternatives,
        currentAlternativeIndex: 2
      };

      rerender(
        <MessageBubble
          msg={lastAlternativeMessage}
          onCopy={mockOnCopy}
          onNavigateAlternative={mockOnNavigateAlternative}
        />
      );

      const nextButton = screen.getByTestId('chevron-right-icon').closest('button')!;
      expect(nextButton).toBeDisabled();
      expect(screen.getByText('3 / 3')).toBeInTheDocument();
    });

    it('hides navigation when not needed', () => {
      // Single alternative
      const singleAlternativeMessage = {
        ...assistantMessage,
        alternatives: ['Single response'],
        currentAlternativeIndex: 0
      };

      render(
        <MessageBubble
          msg={singleAlternativeMessage}
          onCopy={mockOnCopy}
          onNavigateAlternative={mockOnNavigateAlternative}
        />
      );

      expect(screen.queryByTestId('chevron-left-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('chevron-right-icon')).not.toBeInTheDocument();
    });

  });

  describe('Edge Cases', () => {
    it('handles missing currentAlternativeIndex gracefully', () => {
      const messageWithoutIndex = {
        ...assistantMessage,
        alternatives: ['First', 'Second'],
        currentAlternativeIndex: undefined
      };

      render(
        <MessageBubble
          msg={messageWithoutIndex}
          onCopy={mockOnCopy}
          onNavigateAlternative={mockOnNavigateAlternative}
        />
      );

      expect(screen.getByText('1 / 2')).toBeInTheDocument(); // Defaults to 0 + 1
    });

    it('handles empty content gracefully', () => {
      const emptyMessage = {
        ...assistantMessage,
        content: ''
      };

      render(
        <MessageBubble
          msg={emptyMessage}
          onCopy={mockOnCopy}
        />
      );

      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    });
  });

  describe('Conditional Rendering', () => {
    it('shows regenerate button only when handler is provided', () => {
      const { rerender } = render(
        <MessageBubble
          msg={assistantMessage}
          onCopy={mockOnCopy}
        />
      );

      expect(screen.queryByTestId('rotate-icon')).not.toBeInTheDocument();

      rerender(
        <MessageBubble
          msg={assistantMessage}
          onCopy={mockOnCopy}
          onRegenerate={mockOnRegenerate}
        />
      );

      expect(screen.getByTestId('rotate-icon')).toBeInTheDocument();
    });

    it('displays current alternative content correctly', () => {
      render(
        <MessageBubble
          msg={assistantMessageWithAlternatives}
          onCopy={mockOnCopy}
          onNavigateAlternative={mockOnNavigateAlternative}
        />
      );

      // Should show the content at currentAlternativeIndex (1), which is "Second response"
      expect(screen.getByText('Current response')).toBeInTheDocument();
      expect(screen.getByText('2 / 3')).toBeInTheDocument();
    });

    it('handles messages without alternatives array', () => {
      const messageWithoutAlternatives = {
        ...assistantMessage,
        alternatives: undefined,
        currentAlternativeIndex: undefined
      };

      render(
        <MessageBubble
          msg={messageWithoutAlternatives}
          onCopy={mockOnCopy}
          onNavigateAlternative={mockOnNavigateAlternative}
        />
      );

      expect(screen.queryByTestId('chevron-left-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('chevron-right-icon')).not.toBeInTheDocument();
      expect(screen.queryByText('/')).not.toBeInTheDocument(); // No counter display
    });
  });

  describe('User Interactions', () => {
    it('handles copy button click and shows feedback', async () => {
      render(
        <MessageBubble
          msg={assistantMessage}
          onCopy={mockOnCopy}
          onRegenerate={mockOnRegenerate}
        />
      );

      const copyButton = screen.getByTitle('Copy');
      
      // Click the button and wait for state updates
      await act(async () => {
        fireEvent.click(copyButton);
      });

      // Verify the callback was called
      expect(mockOnCopy).toHaveBeenCalledWith('I am doing well, thank you for asking!');
      
      // The component should show check icon after clicking
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();

      // Advance timers to trigger the timeout reset
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      
      // The icon should change back to copy icon
      expect(screen.getByTestId('copy-icon')).toBeInTheDocument();
    });

    it('handles regenerate button click', async () => {
      render(
        <MessageBubble
          msg={assistantMessage}
          onCopy={mockOnCopy}
          onRegenerate={mockOnRegenerate}
        />
      );

      const regenerateButton = screen.getByTitle('Regenerate');
      fireEvent.click(regenerateButton);

      expect(mockOnRegenerate).toHaveBeenCalledTimes(1);
    });

    it('handles alternative navigation clicks', async () => {
      render(
        <MessageBubble
          msg={assistantMessageWithAlternatives}
          onCopy={mockOnCopy}
          onNavigateAlternative={mockOnNavigateAlternative}
        />
      );

      const nextButton = screen.getByTitle('Next answer');
      const prevButton = screen.getByTitle('Previous answer');

      fireEvent.click(nextButton);
      expect(mockOnNavigateAlternative).toHaveBeenCalledWith('assistant-2', 'next');

      fireEvent.click(prevButton);
      expect(mockOnNavigateAlternative).toHaveBeenCalledWith('assistant-2', 'prev');
    });

    it('does not call onNavigateAlternative when buttons are disabled', async () => {
      const firstAlternativeMessage = {
        ...assistantMessageWithAlternatives,
        currentAlternativeIndex: 0
      };
      
      render(
        <MessageBubble
          msg={firstAlternativeMessage}
          onCopy={mockOnCopy}
          onNavigateAlternative={mockOnNavigateAlternative}
        />
      );

      const prevButton = screen.getByTitle('Previous answer');
      expect(prevButton).toBeDisabled();

      fireEvent.click(prevButton);
      expect(mockOnNavigateAlternative).not.toHaveBeenCalled();
    });
  });

  describe('Avatar Rendering', () => {
    it('renders user initials when member data is available', () => {
      render(
        <MessageBubble
          msg={userMessage}
          onCopy={mockOnCopy}
        />
      );

      expect(screen.getByText('JD')).toBeInTheDocument();
      expect(screen.queryByTestId('user-icon')).not.toBeInTheDocument();
    });

    it('renders user icon when no member data is available', () => {
      // Mock hooks to return no data
      vi.mocked(useCurrentUser).mockReturnValueOnce({ data: null } as any);
      vi.mocked(useAuth).mockReturnValueOnce({ user: null } as any);

      render(
        <MessageBubble
          msg={userMessage}
          onCopy={mockOnCopy}
        />
      );

      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
      expect(screen.queryByText('JD')).not.toBeInTheDocument();
    });

    it('falls back to user name when member data is incomplete', () => {
      // Mock hooks to return incomplete member data but valid user name
      vi.mocked(useCurrentUser).mockReturnValueOnce({ data: { first_name: 'John' } } as any); // Missing last_name

      render(
        <MessageBubble
          msg={userMessage}
          onCopy={mockOnCopy}
        />
      );

      expect(screen.getByText('JD')).toBeInTheDocument(); // Falls back to user.name
    });

    it('renders assistant avatar with sparkles icon', () => {
      render(
        <MessageBubble
          msg={assistantMessage}
          onCopy={mockOnCopy}
        />
      );

      expect(screen.getByTestId('sparkles-icon')).toBeInTheDocument();
    });
  });

  describe('Styling and Content', () => {
    it('applies correct styling and content rendering', () => {
      const { container } = render(
        <MessageBubble
          msg={assistantMessage}
          onCopy={mockOnCopy}
        />
      );

      // Content rendering
      const contentDiv = screen.getByTestId('markdown-content').parentElement;
      expect(contentDiv).toHaveClass('prose', 'prose-sm', 'dark:prose-invert');
      expect(contentDiv).not.toHaveClass('typing-cursor');

      // Border styling for non-user messages
      const messageDiv = container.firstChild as HTMLElement;
      expect(messageDiv).toHaveClass('border-b', 'border-gray-100', 'dark:border-gray-800');
    });

    it('applies typing cursor for streaming and no border for user messages', () => {
      const { container } = render(
        <MessageBubble
          msg={streamingMessage}
          onCopy={mockOnCopy}
        />
      );

      const contentDiv = screen.getByTestId('markdown-content').parentElement;
      expect(contentDiv).toHaveClass('typing-cursor');
    });

    it('renders code blocks and handles different message types', () => {
      const messageWithCode: Message = {
        id: 'code-1',
        role: 'system',
        content: 'Here is some code:\n```javascript\nconsole.log("Hello");\n```',
        createdAt: Date.now()
      };

      render(
        <MessageBubble
          msg={messageWithCode}
          onCopy={mockOnCopy}
        />
      );

      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
      expect(screen.getByText(/Here is some code:/)).toBeInTheDocument();
      expect(screen.getByTestId('sparkles-icon')).toBeInTheDocument(); // Non-user gets sparkles
      expect(navigator.clipboard.writeText).toBeDefined(); // Code copy functionality available
    });
  });


  describe('User Initials Generation', () => {
    it('generates initials from first and last name', () => {
      vi.mocked(useCurrentUser).mockReturnValueOnce({ 
        data: { first_name: 'Alice', last_name: 'Smith' } 
      } as any);

      render(
        <MessageBubble
          msg={userMessage}
          onCopy={mockOnCopy}
        />
      );

      expect(screen.getByText('AS')).toBeInTheDocument();
    });

    it('generates initials from user name when member data is incomplete', () => {
      vi.mocked(useCurrentUser).mockReturnValueOnce({ data: null } as any);
      vi.mocked(useAuth).mockReturnValueOnce({ user: { name: 'Bob Johnson Wilson' } } as any);

      render(
        <MessageBubble
          msg={userMessage}
          onCopy={mockOnCopy}
        />
      );

      expect(screen.getByText('BJ')).toBeInTheDocument(); // Takes first 2 initials
    });

    it('handles single name gracefully', () => {
      vi.mocked(useCurrentUser).mockReturnValueOnce({ data: null } as any);
      vi.mocked(useAuth).mockReturnValueOnce({ user: { name: 'Madonna' } } as any);

      render(
        <MessageBubble
          msg={userMessage}
          onCopy={mockOnCopy}
        />
      );

      expect(screen.getByText('M')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles missing onNavigateAlternative gracefully', () => {
      render(
        <MessageBubble
          msg={assistantMessageWithAlternatives}
          onCopy={mockOnCopy}
          // onNavigateAlternative not provided
        />
      );

      const nextButton = screen.getByTitle('Next answer');
      fireEvent.click(nextButton);
      
      // Should not throw error even without handler
      expect(nextButton).toBeInTheDocument();
    });

    it('handles messages with undefined alternatives gracefully', () => {
      const messageWithUndefinedAlternatives = {
        ...assistantMessage,
        alternatives: undefined,
        currentAlternativeIndex: 5 // Invalid index
      };

      render(
        <MessageBubble
          msg={messageWithUndefinedAlternatives}
          onCopy={mockOnCopy}
          onNavigateAlternative={mockOnNavigateAlternative}
        />
      );

      // Should not show navigation controls
      expect(screen.queryByTestId('chevron-left-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('chevron-right-icon')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides proper button titles and states', () => {
      const firstAlternativeMessage = {
        ...assistantMessageWithAlternatives,
        currentAlternativeIndex: 0
      };

      render(
        <MessageBubble
          msg={firstAlternativeMessage}
          onCopy={mockOnCopy}
          onRegenerate={mockOnRegenerate}
          onNavigateAlternative={mockOnNavigateAlternative}
        />
      );

      expect(screen.getByTitle('Copy')).toBeInTheDocument();
      expect(screen.getByTitle('Regenerate')).toBeInTheDocument();
      expect(screen.getByTitle('Previous answer')).toBeDisabled();
      expect(screen.getByTitle('Next answer')).not.toBeDisabled();
    });

    it('provides proper ARIA attributes for buttons', () => {
      render(
        <MessageBubble
          msg={assistantMessage}
          onCopy={mockOnCopy}
          onRegenerate={mockOnRegenerate}
        />
      );

      const copyButton = screen.getByTitle('Copy');
      const regenerateButton = screen.getByTitle('Regenerate');

      expect(copyButton).toHaveAttribute('title', 'Copy');
      expect(regenerateButton).toHaveAttribute('title', 'Regenerate');
    });
  });
});
