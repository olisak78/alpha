import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../../../src/test/setup';
import AIArenaPage from '../../../src/pages/AIArenaPage';

// ============================================================================
// MOCKS
// ============================================================================

// Mock the contexts and hooks
vi.mock('../../../src/contexts/HeaderNavigationContext', () => ({
  useHeaderNavigation: vi.fn(),
}));

vi.mock('../../../src/hooks/useTabRouting', () => ({
  useTabRouting: vi.fn(),
}));

// Mock components
vi.mock('../../../src/components/BreadcrumbPage', () => ({
  BreadcrumbPage: ({ children }: { children: ReactNode }) =>
    <div data-testid="breadcrumb-page">{children}</div>,
}));

vi.mock('../../../src/components/AILaunchpad/DeploymentsManager', () => ({
  DeploymentsManager: () => <div data-testid="deployments-manager">Deployments Manager</div>,
}));

vi.mock('../../../src/features/ai-arena/AIPage', () => ({
  default: () => <div data-testid="ai-page">AI Chat Page</div>,
}));

import { useHeaderNavigation } from '../../../src/contexts/HeaderNavigationContext';
import { useTabRouting } from '../../../src/hooks/useTabRouting';

// ============================================================================
// TEST SETUP
// ============================================================================

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

// ============================================================================
// TESTS
// ============================================================================

describe('AIArenaPage Component', () => {
  const mockSetTabs = vi.fn();
  const mockSetActiveTab = vi.fn();
  const mockSyncTabWithUrl = vi.fn();

  const defaultMocks = {
    useHeaderNavigation: {
      setTabs: mockSetTabs,
      activeTab: 'chat',
      setActiveTab: mockSetActiveTab,
    },
    useTabRouting: {
      currentTabFromUrl: null,
      syncTabWithUrl: mockSyncTabWithUrl,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Set up default mocks
    vi.mocked(useHeaderNavigation).mockReturnValue(defaultMocks.useHeaderNavigation as any);
    vi.mocked(useTabRouting).mockReturnValue(defaultMocks.useTabRouting as any);
  });

  describe('Basic Functionality', () => {
    it('should render page with chat tab content by default', () => {
      render(<AIArenaPage />, { wrapper: createWrapper() });

      expect(screen.getByTestId('breadcrumb-page')).toBeInTheDocument();
      // Chat tab renders full screen without title
      expect(screen.getByTestId('ai-page')).toBeInTheDocument();
    });

    it('should render deployments tab when active', () => {
      vi.mocked(useHeaderNavigation).mockReturnValue({
        ...defaultMocks.useHeaderNavigation,
        activeTab: 'deployments',
      } as any);

      render(<AIArenaPage />, { wrapper: createWrapper() });

      expect(screen.getByTestId('breadcrumb-page')).toBeInTheDocument();
      expect(screen.getByTestId('deployments-manager')).toBeInTheDocument();
    });

    it('should set header tabs and sync with URL on mount', () => {
      render(<AIArenaPage />, { wrapper: createWrapper() });

      expect(mockSetTabs).toHaveBeenCalledWith([
        { id: 'chat', label: 'Chat' },
        { id: 'deployments', label: 'Deployments' }
      ]);
      expect(mockSyncTabWithUrl).toHaveBeenCalledWith(
        [
          { id: 'chat', label: 'Chat' },
          { id: 'deployments', label: 'Deployments' }
        ],
        'ai-arena'
      );
    });

    it('should fallback to chat tab when no matching tab is found', () => {
      vi.mocked(useHeaderNavigation).mockReturnValue({
        ...defaultMocks.useHeaderNavigation,
        activeTab: 'unknown-tab',
      } as any);

      render(<AIArenaPage />, { wrapper: createWrapper() });
      // Default case renders AIPage (chat tab)
      expect(screen.getByTestId('ai-page')).toBeInTheDocument();
    });

    it('should handle hooks being called correctly', () => {
      render(<AIArenaPage />, { wrapper: createWrapper() });

      expect(useHeaderNavigation).toHaveBeenCalled();
      expect(useTabRouting).toHaveBeenCalled();
    });
  });
});
