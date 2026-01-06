import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AILeftPane from '../../../src/features/ai-arena/AILeftPane';
import { useChatCtx } from '../../../src/features/ai-arena/AIPage';

// Mock the chat context
vi.mock('../../../src/features/ai-arena/AIPage', () => ({
  useChatCtx: vi.fn()
}));

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, variant, title, ...props }: any) => (
    <button
      onClick={onClick}
      className={className}
      title={title}
      data-variant={variant}
      {...props}
    >
      {children}
    </button>
  )
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Trash2: ({ className }: any) => <span data-testid="trash-icon" className={className} />,
  Edit3: ({ className }: any) => <span data-testid="edit-icon" className={className} />,
  MessageSquarePlus: ({ className }: any) => <span data-testid="message-plus-icon" className={className} />
}));

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
    model: 'GPT-4',
    temperature: 0.7,
    maxTokens: 2048,
    systemPrompt: 'You are a helpful assistant',
    deploymentId: 'test-deployment'
  },
  updateSettings: vi.fn(),
  resetSettings: vi.fn()
};

const sampleConversations = [
  {
    id: 'conv-1',
    title: 'First Conversation',
    messages: [],
    createdAt: Date.now() - 1000,
    updatedAt: Date.now() - 1000
  },
  {
    id: 'conv-2',
    title: 'Second Conversation',
    messages: [],
    createdAt: Date.now() - 2000,
    updatedAt: Date.now() - 2000
  },
  {
    id: 'conv-3',
    title: '',
    messages: [],
    createdAt: Date.now() - 3000,
    updatedAt: Date.now() - 3000
  }
];

describe('AILeftPane', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useChatCtx).mockReturnValue(defaultChatContext);
  });

  it('renders UI elements and handles conversation display', () => {
    // Test empty state
    render(<AILeftPane />);
    const newChatButton = screen.getByRole('button', { name: /new chat/i });
    expect(newChatButton).toBeInTheDocument();
    expect(screen.getByTestId('message-plus-icon')).toBeInTheDocument();

    // Test with conversations
    vi.mocked(useChatCtx).mockReturnValue({
      ...defaultChatContext,
      conversations: sampleConversations,
      activeId: 'conv-1'
    });

    render(<AILeftPane />);
    expect(screen.getByText('First Conversation')).toBeInTheDocument();
    expect(screen.getByText('Second Conversation')).toBeInTheDocument();
    expect(screen.getByText('New chat')).toBeInTheDocument(); // Empty title shows as "New chat"
    
    // Test active conversation highlighting
    const conversationItems = screen.getAllByText('First Conversation');
    const activeItem = conversationItems[0].closest('.group');
    expect(activeItem).toHaveClass('bg-gray-100', 'dark:bg-white/10');
  });

  it('handles conversation creation and selection', async () => {
    const mockCreateConversation = vi.fn();
    const mockSetActive = vi.fn();
    
    vi.mocked(useChatCtx).mockReturnValue({
      ...defaultChatContext,
      conversations: sampleConversations,
      createConversation: mockCreateConversation,
      setActive: mockSetActive
    });

    render(<AILeftPane />);

    // Test new chat creation
    const newChatButton = screen.getByRole('button', { name: /new chat/i });
    await userEvent.click(newChatButton);
    expect(mockCreateConversation).toHaveBeenCalledWith('New Chat');

    // Test conversation selection
    const conversation = screen.getByText('First Conversation');
    await userEvent.click(conversation);
    expect(mockSetActive).toHaveBeenCalledWith('conv-1');
  });

  it('handles conversation actions and editing workflow', async () => {
    const mockDeleteConversation = vi.fn();
    const mockRenameConversation = vi.fn();
    const mockSetActive = vi.fn();
    
    vi.mocked(useChatCtx).mockReturnValue({
      ...defaultChatContext,
      conversations: sampleConversations,
      deleteConversation: mockDeleteConversation,
      renameConversation: mockRenameConversation,
      setActive: mockSetActive
    });

    render(<AILeftPane />);

    // Test action buttons presence
    const editButtons = screen.getAllByTestId('edit-icon');
    const deleteButtons = screen.getAllByTestId('trash-icon');
    expect(editButtons).toHaveLength(3);
    expect(deleteButtons).toHaveLength(3);

    // Test delete functionality
    const deleteButton = deleteButtons[0].closest('button')!;
    await userEvent.click(deleteButton);
    expect(mockDeleteConversation).toHaveBeenCalledWith('conv-1');

    // Test edit mode entry and focus
    const editButton = editButtons[0].closest('button')!;
    await userEvent.click(editButton);
    const input = screen.getByDisplayValue('First Conversation');
    expect(input).toBeInTheDocument();
    expect(input).toHaveFocus();

    // Test preventing selection during edit
    await userEvent.click(input.closest('div')!);
    expect(mockSetActive).not.toHaveBeenCalled();
  });

  it('handles editing interactions and validation', async () => {
    const mockRenameConversation = vi.fn();
    
    vi.mocked(useChatCtx).mockReturnValue({
      ...defaultChatContext,
      conversations: sampleConversations,
      renameConversation: mockRenameConversation
    });

    render(<AILeftPane />);

    // Enter edit mode
    const editButton = screen.getAllByTestId('edit-icon')[0].closest('button')!;
    await userEvent.click(editButton);
    const input = screen.getByDisplayValue('First Conversation');

    // Test save on Enter with whitespace trimming
    await userEvent.clear(input);
    await userEvent.type(input, '  Updated Title  ');
    await userEvent.keyboard('{Enter}');
    expect(mockRenameConversation).toHaveBeenCalledWith('conv-1', 'Updated Title');

    // Test cancel on Escape
    await userEvent.click(editButton);
    const newInput = screen.getByDisplayValue('First Conversation');
    await userEvent.clear(newInput);
    await userEvent.type(newInput, 'Temp Title');
    await userEvent.keyboard('{Escape}');
    expect(screen.getByText('First Conversation')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Temp Title')).not.toBeInTheDocument();

    // Test empty title validation
    vi.clearAllMocks();
    await userEvent.click(editButton);
    const emptyInput = screen.getByDisplayValue('First Conversation');
    await userEvent.clear(emptyInput);
    await userEvent.keyboard('{Enter}');
    expect(mockRenameConversation).not.toHaveBeenCalled();
  });

  it('handles accessibility and edge cases', () => {
    // Test accessibility titles
    vi.mocked(useChatCtx).mockReturnValue({
      ...defaultChatContext,
      conversations: sampleConversations
    });

    const { unmount } = render(<AILeftPane />);
    const editButtons = screen.getAllByTitle('Rename');
    const deleteButtons = screen.getAllByTitle('Delete chat');
    expect(editButtons).toHaveLength(3);
    expect(deleteButtons).toHaveLength(3);
    unmount();

    // Test empty title handling
    vi.mocked(useChatCtx).mockReturnValue({
      ...defaultChatContext,
      conversations: [{ 
        id: 'conv-1', 
        title: '', 
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      }]
    });

    render(<AILeftPane />);
    expect(screen.getAllByText('New chat')).toHaveLength(1);
  });

  it('ensures only one new chat can be created at a time', async () => {
    const mockCreateConversation = vi.fn();
    
    // Start with conversations that include one with "New Chat" title
    const conversationsWithNewChat = [
      {
        id: 'conv-1',
        title: 'New Chat',
        messages: [],
        createdAt: Date.now() - 1000,
        updatedAt: Date.now() - 1000
      },
      {
        id: 'conv-2',
        title: 'Existing Conversation',
        messages: [],
        createdAt: Date.now() - 2000,
        updatedAt: Date.now() - 2000
      }
    ];
    
    vi.mocked(useChatCtx).mockReturnValue({
      ...defaultChatContext,
      conversations: conversationsWithNewChat,
      createConversation: mockCreateConversation
    });

    render(<AILeftPane />);

    const newChatButton = screen.getByRole('button', { name: /new chat/i });
    
    // Simulate multiple clicks on the new chat button when a "New Chat" already exists
    await userEvent.click(newChatButton);
    await userEvent.click(newChatButton);
    await userEvent.click(newChatButton);
    
    // Verify that createConversation was not called since a "New Chat" already exists
    expect(mockCreateConversation).not.toHaveBeenCalled();
  });
});
