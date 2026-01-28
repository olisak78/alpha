import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AIChatPane from '../../../src/features/ai-arena/AIChatPane';
import { useChatCtx } from '../../../src/features/ai-arena/AIPage';

// Mock the chat context
vi.mock('../../../src/features/ai-arena/AIPage', () => ({
  useChatCtx: vi.fn()
}));

// Mock child components
vi.mock('@/features/ai-arena/components/MessageBubble', () => ({
  MessageBubble: ({ msg, onCopy, onRegenerate, onNavigateAlternative }: any) => (
    <div data-testid={`message-${msg.id}`} data-role={msg.role}>
      <span data-testid={`message-content-${msg.id}`}>{msg.content}</span>
      <button data-testid={`copy-${msg.id}`} onClick={() => onCopy(msg.content)}>
        Copy
      </button>
      {msg.role === 'assistant' && (
        <>
          <button data-testid={`regenerate-${msg.id}`} onClick={() => onRegenerate()}>
            Regenerate
          </button>
          {msg.alternatives && msg.alternatives.length > 1 && (
            <>
              <button 
                data-testid={`prev-alt-${msg.id}`} 
                onClick={() => onNavigateAlternative(msg.id, 'prev')}
              >
                Previous
              </button>
              <button 
                data-testid={`next-alt-${msg.id}`} 
                onClick={() => onNavigateAlternative(msg.id, 'next')}
              >
                Next
              </button>
            </>
          )}
        </>
      )}
    </div>
  )
}));

vi.mock('@/features/ai-arena/components/InputBar', () => ({
  InputBar: ({ onSend, disabled, disabledMessage }: any) => (
    <div data-testid="input-bar">
      <input 
        data-testid="message-input" 
        disabled={disabled}
        placeholder={disabled ? disabledMessage : "Type a message..."}
        onChange={(e) => {
          // Store value for testing
          (e.target as any).testValue = e.target.value;
        }}
      />
      <button 
        data-testid="send-button" 
        disabled={disabled}
        onClick={() => {
          const input = screen.getByTestId('message-input') as HTMLInputElement;
          onSend((input as any).testValue || '', []);
        }}
      >
        Send
      </button>
    </div>
  )
}));

vi.mock('@/features/ai-arena/components/SettingsDrawer', () => ({
  SettingsDrawer: ({ open, onClose }: any) => (
    <div data-testid="settings-drawer" style={{ display: open ? 'block' : 'none' }}>
      <button data-testid="close-settings" onClick={onClose}>Close</button>
    </div>
  )
}));

vi.mock('@/features/ai-arena/components/DeploymentSelector', () => ({
  DeploymentSelector: () => <div data-testid="deployment-selector">Deployment Selector</div>
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined)
  }
});

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// Default mock data
const defaultChatContext = {
  conversations: [],
  active: null,
  activeId: null,
  messages: [],
  createConversation: vi.fn(),
  deleteConversation: vi.fn(),
  renameConversation: vi.fn(),
  send: vi.fn(),
  regenerate: vi.fn(),
  setActive: vi.fn(),
  navigateAlternative: vi.fn(),
  settings: {
    deploymentId: 'test-deployment',
    model: 'GPT-4',
    temperature: 0.7,
    maxTokens: 2048,
    systemPrompt: 'You are a helpful assistant'
  },
  updateSettings: vi.fn(),
  resetSettings: vi.fn()
};

const sampleMessages = [
  {
    id: '1',
    role: 'user' as const,
    content: 'Hello, how are you?',
    createdAt: Date.now()
  },
  {
    id: '2',
    role: 'assistant' as const,
    content: 'I am doing well, thank you for asking!',
    createdAt: Date.now()
  },
  {
    id: '3',
    role: 'assistant' as const,
    content: 'Here is another response',
    createdAt: Date.now(),
    alternatives: ['Here is another response', 'Alternative response'],
    currentAlternativeIndex: 0
  }
];

describe('AIChatPane', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useChatCtx).mockReturnValue(defaultChatContext);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Component Rendering', () => {
    it('renders all main sections', () => {
      render(<AIChatPane />);

      expect(screen.getByTestId('deployment-selector')).toBeInTheDocument();
      expect(screen.getByTestId('input-bar')).toBeInTheDocument();
      expect(screen.getByTestId('settings-drawer')).toBeInTheDocument();
    });

    it('renders empty state when no messages', () => {
      render(<AIChatPane />);

      expect(screen.getByText('How can I help you today?')).toBeInTheDocument();
      expect(screen.getByText('Help me debug a code issue')).toBeInTheDocument();
      expect(screen.getByText('Explain a technical concept')).toBeInTheDocument();
      expect(screen.getByText('Write some code for me')).toBeInTheDocument();
      expect(screen.getByText('Review my architecture')).toBeInTheDocument();
    });

    it('renders messages when they exist', () => {
      vi.mocked(useChatCtx).mockReturnValue({
        ...defaultChatContext,
        messages: sampleMessages
      });

      render(<AIChatPane />);

      expect(screen.getByTestId('message-1')).toBeInTheDocument();
      expect(screen.getByTestId('message-2')).toBeInTheDocument();
      expect(screen.getByTestId('message-3')).toBeInTheDocument();
      expect(screen.getByTestId('message-content-1')).toHaveTextContent('Hello, how are you?');
      expect(screen.getByTestId('message-content-2')).toHaveTextContent('I am doing well, thank you for asking!');
    });
  });

  describe('Empty State Interactions', () => {
    it('sends predefined messages when empty state buttons are clicked', async () => {
      const mockSend = vi.fn();
      vi.mocked(useChatCtx).mockReturnValue({
        ...defaultChatContext,
        send: mockSend
      });

      render(<AIChatPane />);

      // Test multiple buttons to ensure they all work
      const buttons = [
        'Help me debug a code issue',
        'Explain a technical concept',
        'Write some code for me',
        'Review my architecture'
      ];

      for (const buttonText of buttons) {
        const button = screen.getByText(buttonText);
        await userEvent.click(button);
        expect(mockSend).toHaveBeenCalledWith(buttonText);
      }

      expect(mockSend).toHaveBeenCalledTimes(4);
    });
  });

  describe('Message Interactions', () => {
    beforeEach(() => {
      vi.mocked(useChatCtx).mockReturnValue({
        ...defaultChatContext,
        messages: sampleMessages
      });
    });

    it('handles copy functionality', async () => {
      render(<AIChatPane />);

      const copyButton = screen.getByTestId('copy-1');
      await userEvent.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Hello, how are you?');
    });

    it('handles copy failure gracefully', async () => {
      vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error('Copy failed'));

      render(<AIChatPane />);

      const copyButton = screen.getByTestId('copy-1');
      await userEvent.click(copyButton);

      // Should not throw error
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Hello, how are you?');
    });

    it('handles regenerate functionality', async () => {
      const mockRegenerate = vi.fn();
      vi.mocked(useChatCtx).mockReturnValue({
        ...defaultChatContext,
        messages: sampleMessages,
        regenerate: mockRegenerate
      });

      render(<AIChatPane />);

      const regenerateButton = screen.getByTestId('regenerate-2');
      await userEvent.click(regenerateButton);

      expect(mockRegenerate).toHaveBeenCalled();
    });

    it('handles alternative navigation', async () => {
      const mockNavigateAlternative = vi.fn();
      vi.mocked(useChatCtx).mockReturnValue({
        ...defaultChatContext,
        messages: sampleMessages,
        navigateAlternative: mockNavigateAlternative
      });

      render(<AIChatPane />);

      const prevButton = screen.getByTestId('prev-alt-3');
      const nextButton = screen.getByTestId('next-alt-3');

      await userEvent.click(prevButton);
      expect(mockNavigateAlternative).toHaveBeenCalledWith('3', 'prev');

      await userEvent.click(nextButton);
      expect(mockNavigateAlternative).toHaveBeenCalledWith('3', 'next');
    });
  });

  describe('Input Bar Integration', () => {
    it('enables input when deployment is selected', () => {
      render(<AIChatPane />);

      const input = screen.getByTestId('message-input');
      const sendButton = screen.getByTestId('send-button');

      expect(input).not.toBeDisabled();
      expect(sendButton).not.toBeDisabled();
    });

    it('disables input when no deployment is selected', () => {
      vi.mocked(useChatCtx).mockReturnValue({
        ...defaultChatContext,
        settings: {
          ...defaultChatContext.settings,
          deploymentId: ''
        }
      });

      render(<AIChatPane />);

      const input = screen.getByTestId('message-input');
      const sendButton = screen.getByTestId('send-button');

      expect(input).toBeDisabled();
      expect(sendButton).toBeDisabled();
      expect(input).toHaveAttribute('placeholder', 'Please select a model deployment above to start chatting');
    });

    it('sends messages through input bar', async () => {
      const mockSend = vi.fn();
      vi.mocked(useChatCtx).mockReturnValue({
        ...defaultChatContext,
        send: mockSend
      });

      render(<AIChatPane />);

      const input = screen.getByTestId('message-input');
      const sendButton = screen.getByTestId('send-button');

      // Simulate typing
      await userEvent.type(input, 'Test message');
      (input as any).testValue = 'Test message';

      await userEvent.click(sendButton);

      expect(mockSend).toHaveBeenCalledWith('Test message', []);
    });
  });

  describe('State Management', () => {
    it('switches between empty state and messages correctly', async () => {
      // Start with empty messages
      const { rerender } = render(<AIChatPane />);
      expect(screen.getByText('How can I help you today?')).toBeInTheDocument();

      // Add messages
      vi.mocked(useChatCtx).mockReturnValue({
        ...defaultChatContext,
        messages: [sampleMessages[0]]
      });

      await act(async () => {
        rerender(<AIChatPane />);
      });

      expect(screen.getByTestId('message-1')).toBeInTheDocument();
      expect(screen.queryByText('How can I help you today?')).not.toBeInTheDocument();

      // Clear messages - should show empty state again
      vi.mocked(useChatCtx).mockReturnValue({
        ...defaultChatContext,
        messages: []
      });

      rerender(<AIChatPane />);
      expect(screen.getByText('How can I help you today?')).toBeInTheDocument();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles messages with missing properties', () => {
      const incompleteMessages = [
        {
          id: '1',
          role: 'user' as const,
          content: 'Test message'
          // Missing createdAt
        }
      ];

      vi.mocked(useChatCtx).mockReturnValue({
        ...defaultChatContext,
        messages: incompleteMessages as any
      });

      render(<AIChatPane />);

      expect(screen.getByTestId('message-1')).toBeInTheDocument();
    });

    it('handles context provider errors gracefully', () => {
      vi.mocked(useChatCtx).mockImplementation(() => {
        throw new Error('Context not found');
      });

      expect(() => render(<AIChatPane />)).toThrow('Context not found');
    });
  });
});
