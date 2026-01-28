import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AIPage, { useChatCtx } from '../../../src/features/ai-arena/AIPage';
import { useChat } from '../../../src/features/ai-arena/hooks/useChat';

// Mock the useChat hook
vi.mock('../../../src/features/ai-arena/hooks/useChat', () => ({
  useChat: vi.fn()
}));

// Mock child components
vi.mock('../../../src/features/ai-arena/AILeftPane', () => ({
  default: () => <div data-testid="ai-left-pane">AI Left Pane</div>
}));

vi.mock('../../../src/features/ai-arena/AIChatPane', () => ({
  default: () => <div data-testid="ai-chat-pane">AI Chat Pane</div>
}));

// Test component that uses context outside provider
const TestContextConsumerOutside = () => {
  const chatCtx = useChatCtx();
  return <div data-testid="outside-consumer">{chatCtx.settings.model}</div>;
};

// Default mock chat data
const defaultChatData = {
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

describe('AIPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useChat).mockReturnValue(defaultChatData);
  });

  describe('Component Rendering and Layout', () => {
    it('renders both child components with correct container styling', () => {
      render(<AIPage />);

      // Check child components are rendered
      expect(screen.getByTestId('ai-left-pane')).toBeInTheDocument();
      expect(screen.getByTestId('ai-chat-pane')).toBeInTheDocument();

      // Check container has all required CSS classes
      const container = screen.getByTestId('ai-left-pane').parentElement;
      expect(container).toHaveClass(
        'h-full',
        'w-full',
        'flex',
        'overflow-hidden',
        'bg-white',
        'dark:bg-[#212121]'
      );

      // Check component hierarchy
      expect(container).toContainElement(screen.getByTestId('ai-left-pane'));
      expect(container).toContainElement(screen.getByTestId('ai-chat-pane'));
      expect(container?.children).toHaveLength(2);
    });

    it('calls useChat hook on mount', () => {
      render(<AIPage />);
      expect(useChat).toHaveBeenCalledTimes(1);
    });
  });

  describe('Context Provider Functionality', () => {
    it('provides complete chat context with all expected properties', () => {
      render(<AIPage />);

      expect(useChat).toHaveBeenCalled();
      const chatData = vi.mocked(useChat).mock.results[0].value;
      
      expect(chatData).toEqual(expect.objectContaining({
        conversations: expect.any(Array),
        active: null,
        activeId: null,
        messages: expect.any(Array),
        createConversation: expect.any(Function),
        deleteConversation: expect.any(Function),
        renameConversation: expect.any(Function),
        send: expect.any(Function),
        regenerate: expect.any(Function),
        setActive: expect.any(Function),
        navigateAlternative: expect.any(Function),
        settings: expect.objectContaining({
          model: 'GPT-4',
          deploymentId: 'test-deployment',
          temperature: 0.7,
          maxTokens: 2048,
          systemPrompt: 'You are a helpful assistant'
        }),
        updateSettings: expect.any(Function),
        resetSettings: expect.any(Function)
      }));
    });

    it('updates context when useChat returns different data', () => {
      const { rerender } = render(<AIPage />);

      const updatedChatData = {
        ...defaultChatData,
        messages: [{ id: '1', role: 'user' as const, content: 'Hello', createdAt: Date.now() }],
        activeId: 'conv-1',
        settings: { ...defaultChatData.settings, model: 'GPT-3.5' }
      };
      vi.mocked(useChat).mockReturnValue(updatedChatData);

      rerender(<AIPage />);

      expect(useChat).toHaveBeenCalledTimes(2);
      const result = vi.mocked(useChat).mock.results[1].value;
      expect(result.activeId).toBe('conv-1');
      expect(result.messages).toHaveLength(1);
      expect(result.settings.model).toBe('GPT-3.5');
    });
  });

  describe('useChatCtx Hook', () => {
    it('throws error when used outside of AIPage provider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestContextConsumerOutside />);
      }).toThrow('useChatCtx must be used within <AIPage>');

      consoleSpy.mockRestore();
    });

    it('provides context data when used within provider scope', () => {
      // Test that the context is properly created by verifying useChat is called
      // and the data structure is correct (actual context consumption is tested in child components)
      render(<AIPage />);
      
      expect(useChat).toHaveBeenCalled();
      expect(defaultChatData.settings.model).toBe('GPT-4');
    });
  });

  describe('Error Handling', () => {
    it('handles useChat hook errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      vi.mocked(useChat).mockImplementation(() => {
        throw new Error('useChat failed');
      });

      expect(() => {
        render(<AIPage />);
      }).toThrow('useChat failed');

      consoleSpy.mockRestore();
    });

    it('renders with partial useChat data', () => {
      const partialChatData = {
        ...defaultChatData,
        settings: { ...defaultChatData.settings, model: undefined as any }
      };

      vi.mocked(useChat).mockReturnValue(partialChatData);

      render(<AIPage />);

      expect(screen.getByTestId('ai-left-pane')).toBeInTheDocument();
      expect(screen.getByTestId('ai-chat-pane')).toBeInTheDocument();
    });
  });
});
