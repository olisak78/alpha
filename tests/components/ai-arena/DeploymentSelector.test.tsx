import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { DeploymentSelector } from '../../../src/features/ai-arena/components/DeploymentSelector';
import { type Deployment } from '../../../src/services/aiPlatformApi';
import { type ChatSettings } from '../../../src/features/ai-arena/types/chat';

// Mock dependencies
vi.mock('../../../src/features/ai-arena/AIPage', () => ({
  useChatCtx: vi.fn()
}));

vi.mock('../../../src/services/aiPlatformApi', () => ({
  useDeployments: vi.fn()
}));

// Import mocked functions
import { useChatCtx } from '../../../src/features/ai-arena/AIPage';
import { useDeployments } from '../../../src/services/aiPlatformApi';

const mockUseChatCtx = vi.mocked(useChatCtx);
const mockUseDeployments = vi.mocked(useDeployments);
const mockUpdateSettings = vi.fn();

// Mock UI components
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children, open, onOpenChange }: any) => (
    <div data-testid="dropdown-menu" data-open={open} onClick={() => onOpenChange?.(!open)}>
      {children}
    </div>
  ),
  DropdownMenuContent: ({ children, align, className }: any) => (
    <div data-testid="dropdown-content" data-align={align} className={className}>
      {children}
    </div>
  ),
  DropdownMenuItem: ({ children, onClick, className }: any) => (
    <div data-testid="dropdown-item" onClick={onClick} className={className}>
      {children}
    </div>
  ),
  DropdownMenuTrigger: ({ children, asChild }: any) => (
    <div data-testid="dropdown-trigger">{children}</div>
  )
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, variant, disabled, ...props }: any) => (
    <button
      onClick={onClick}
      className={className}
      disabled={disabled}
      data-variant={variant}
      {...props}
    >
      {children}
    </button>
  )
}));

vi.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, placeholder, className, onClick, ...props }: any) => (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      onClick={onClick}
      data-testid="search-input"
      {...props}
    />
  )
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  ChevronDown: ({ className }: any) => <span data-testid="chevron-down" className={className} />,
  Sparkles: ({ className }: any) => <span data-testid="sparkles" className={className} />,
  AlertCircle: ({ className }: any) => <span data-testid="alert-circle" className={className} />,
  Search: ({ className }: any) => <span data-testid="search-icon" className={className} />
}));

// Sample deployment data
const mockDeployments: Deployment[] = [
  {
    id: 'deploy-1',
    status: 'RUNNING',
    configurationId: 'config-1',
    configurationName: 'GPT-4 Config',
    team: 'Team A',
    createdAt: '2024-01-01T00:00:00Z',
    modifiedAt: '2024-01-01T00:00:00Z',
    details: {
      resources: {
        backendDetails: {
          model: {
            name: 'gpt-4'
          }
        }
      }
    }
  },
  {
    id: 'deploy-2',
    status: 'RUNNING',
    configurationId: 'config-2',
    configurationName: 'Claude Config',
    team: 'Team B',
    createdAt: '2024-01-01T00:00:00Z',
    modifiedAt: '2024-01-01T00:00:00Z',
    details: {
      resources: {
        backend_details: {
          model: {
            name: 'claude-3-sonnet'
          }
        }
      }
    }
  },
  {
    id: 'deploy-5',
    status: 'RUNNING',
    configurationId: 'config-5',
    configurationName: 'Gemini Config',
    team: 'Team D',
    createdAt: '2024-01-01T00:00:00Z',
    modifiedAt: '2024-01-01T00:00:00Z',
    details: {
      resources: {
        backendDetails: {
          model: {
            name: 'gemini-pro'
          }
        }
      }
    }
  }
];

const mockDeploymentsData = {
  deployments: [
    { deployments: mockDeployments }
  ]
};

describe('DeploymentSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    const defaultSettings: ChatSettings = {
      model: "GPT-4",
      temperature: 0.7,
      maxTokens: 2048,
      systemPrompt: "You are a helpful assistant",
      deploymentId: undefined 
    };
    
    mockUseChatCtx.mockReturnValue({
      conversations: [],
      active: null,
      activeId: null,
      messages: [],
      createConversation: vi.fn(),
      selectConversation: vi.fn(),
      deleteConversation: vi.fn(),
      updateConversationTitle: vi.fn(),
      sendMessage: vi.fn(),
      regenerateMessage: vi.fn(),
      settings: defaultSettings,
      updateSettings: mockUpdateSettings,
      resetSettings: vi.fn()
    } as any);
  });

  describe('Loading State', () => {
    it('shows loading state when deployments are being fetched', () => {
      mockUseDeployments.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null
      } as any);

      render(<DeploymentSelector />);

      expect(screen.getByText('Loading deployments...')).toBeInTheDocument();
      expect(screen.getByTestId('sparkles')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows error state when deployment fetch fails', () => {
      mockUseDeployments.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Failed to fetch')
      } as any);

      render(<DeploymentSelector />);

      expect(screen.getByText('Failed to load deployments')).toBeInTheDocument();
      expect(screen.getByTestId('alert-circle')).toBeInTheDocument();
    });
  });

  describe('No Deployments State', () => {
    it('shows no deployments message when no running deployments are available', () => {
      mockUseDeployments.mockReturnValue({
        data: { 
          deployments: [{ deployments: [], team: 'Test Team' }],
          count: 0
        },
        isLoading: false,
        error: null
      } as any);

      render(<DeploymentSelector />);

      expect(screen.getByText('No running deployments available. Please create and start a deployment first.')).toBeInTheDocument();
    });
  });

  describe('Deployment Selection', () => {
    beforeEach(() => {
      mockUseDeployments.mockReturnValue({
        data: {
          deployments: [
            { deployments: mockDeployments, team: 'Test Team' }
          ],
          count: mockDeployments.length
        },
        isLoading: false,
        error: null
      } as any);
    });

    it('renders deployment selector with no selection initially', () => {
      render(<DeploymentSelector />);

      expect(screen.getByText('Select Model Deployment')).toBeInTheDocument();
      expect(screen.getByText('Required to start chatting')).toBeInTheDocument();
    });

  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      mockUseDeployments.mockReturnValue({
        data: {
          deployments: [
            { deployments: mockDeployments, team: 'Test Team' }
          ],
          count: mockDeployments.length
        },
        isLoading: false,
        error: null
      } as any);
    });

    it('renders search input in dropdown', async () => {
      const user = userEvent.setup();
      render(<DeploymentSelector />);

      // Open dropdown
      const trigger = screen.getByTestId('dropdown-trigger');
      await user.click(trigger);

      expect(screen.getByTestId('search-input')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search models...')).toBeInTheDocument();
    });

    it('filters deployments based on search query', async () => {
      const user = userEvent.setup();
      render(<DeploymentSelector />);

      // Open dropdown
      const trigger = screen.getByTestId('dropdown-trigger');
      await user.click(trigger);

      // Search for "gpt"
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'gpt');

      // Should only show GPT deployment
      await waitFor(() => {
        const items = screen.getAllByTestId('dropdown-item');
        expect(items).toHaveLength(1);
        expect(screen.getByText('gpt-4 (deploy-1)')).toBeInTheDocument();
      });
    });
  });
});
