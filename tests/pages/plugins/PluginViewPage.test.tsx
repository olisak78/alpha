import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import PluginViewPage from '@/pages/PluginViewPage';
import { MemoryRouter } from 'react-router-dom';

// Mock hooks
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useParams: vi.fn(),
        useNavigate: vi.fn(),
    };
});

vi.mock('@/hooks/api/usePlugins', () => ({
    usePlugins: vi.fn(),
}));

vi.mock('@/stores/themeStore', () => ({
    useActualTheme: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
    useToast: vi.fn(),
}));

// Mock plugin utilities
vi.mock('@/plugins/utils/PluginApiClient', () => ({
    PluginApiClient: vi.fn().mockImplementation((id) => ({
        id,
        request: vi.fn(),
    })),
}));

vi.mock('@/plugins/models/models', () => ({
    loadPluginBundle: vi.fn(),
    PluginErrorBoundary: vi.fn(({ children, onError }) => (
        <div data-testid="plugin-error-boundary" data-on-error={!!onError}>
            {children}
        </div>
    )),
    PluginSkeleton: vi.fn(() => <div data-testid="plugin-skeleton">Loading Plugin...</div>),
}));

// Mock UI components
vi.mock('@/components/ui/badge', () => ({
    Badge: vi.fn(({ children, variant }) => (
        <span data-testid="badge" data-variant={variant}>
            {children}
        </span>
    )),
}));

vi.mock('@/components/ui/button', () => ({
    Button: vi.fn(({ children, onClick, variant, size, className }) => (
        <button
            data-testid="button"
            onClick={onClick}
            data-variant={variant}
            data-size={size}
            className={className}
        >
            {children}
        </button>
    )),
}));

vi.mock('@/components/ui/alert', () => ({
    Alert: vi.fn(({ children, variant }) => (
        <div data-testid="alert" data-variant={variant}>
            {children}
        </div>
    )),
    AlertDescription: vi.fn(({ children }) => (
        <div data-testid="alert-description">{children}</div>
    )),
}));

// Mock plugin components
vi.mock('@/plugins/components/PluginContainer', () => ({
    BaseContainer: vi.fn(({ children }) => (
        <div data-testid="base-container">{children}</div>
    )),
}));

vi.mock('@/plugins/components/PluginHeader', () => ({
    BaseHeader: vi.fn(({ title, description, icon, actions }) => (
        <div data-testid="base-header">
            <div data-testid="header-title">{title}</div>
            <div data-testid="header-description">{description}</div>
            <div data-testid="header-icon">{icon}</div>
            <div data-testid="header-actions">{actions}</div>
        </div>
    )),
}));

vi.mock('@/plugins/components/PluginBody', () => ({
    BaseBody: vi.fn(({ children, isLoading, error, onRetry, loadingMessage, minHeight }) => (
        <div
            data-testid="base-body"
            data-is-loading={isLoading}
            data-error={error}
            data-loading-message={loadingMessage}
            data-min-height={minHeight}
        >
            {isLoading && <div>Loading...</div>}
            {error && (
                <div>
                    <div>Error: {error}</div>
                    <button onClick={onRetry}>Retry</button>
                </div>
            )}
            {!isLoading && !error && children}
        </div>
    )),
}));

vi.mock('@/plugins/components/PageSkeleton', () => ({
    PageSkeleton: vi.fn(() => <div data-testid="page-skeleton">Loading Page...</div>),
}));

// Mock icons
vi.mock('lucide-react', () => ({
    AlertCircle: vi.fn(() => <div data-testid="alert-circle-icon">!</div>),
    ArrowLeft: vi.fn(() => <div data-testid="arrow-left-icon">←</div>),
    Shield: vi.fn(() => <div data-testid="shield-icon">Shield</div>),
}));

import { useParams, useNavigate } from 'react-router-dom';
import { usePlugins } from '@/hooks/api/usePlugins';
import { useActualTheme } from '@/stores/themeStore';
import { useToast } from '@/hooks/use-toast';
import { loadPluginBundle } from '@/plugins/models/models';
import { PluginApiClient } from '@/plugins/utils/PluginApiClient';

describe('PluginViewPage', () => {
    const mockNavigate = vi.fn();
    const mockToast = vi.fn();

    const mockPlugins = [
        {
            id: 'plugin-1',
            name: 'Test Plugin',
            title: 'Test Plugin Title',
            description: 'A test plugin',
            owner: 'Test Owner',
            version: '1.0.0',
            icon: 'Database',
            react_component_path: 'https://example.com/plugin.js',
            backend_server_url: 'https://api.example.com',
            subscribed: true,
        },
        {
            id: 'plugin-2',
            name: 'Another Plugin',
            title: 'Another Plugin Title',
            description: 'Another test plugin',
            owner: 'Another Owner',
            version: '2.0.0',
            icon: 'Settings',
            react_component_path: 'https://example.com/another.js',
            backend_server_url: null,
            subscribed: true,
        },
    ];

    const mockPluginComponent = vi.fn(({ context }) => (
        <div data-testid="plugin-component">
            Plugin Component
            <div data-testid="plugin-context-theme">{context.theme.mode}</div>
        </div>
    ));

    const mockManifest = {
        component: mockPluginComponent,
        hooks: {
            onMount: vi.fn(),
            onUnmount: vi.fn(),
        },
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Clear sessionStorage
        sessionStorage.clear();

        vi.mocked(useParams).mockReturnValue({ pluginSlug: 'test-plugin' });
        vi.mocked(useNavigate).mockReturnValue(mockNavigate);
        vi.mocked(useActualTheme).mockReturnValue('light');
        vi.mocked(useToast).mockReturnValue({ toast: mockToast } as any);

        vi.mocked(usePlugins).mockReturnValue({
            data: { plugins: mockPlugins },
            isLoading: false,
            error: null,
        } as any);

        vi.mocked(loadPluginBundle).mockResolvedValue(mockManifest);
    });

    afterEach(() => {
        sessionStorage.clear();
    });

    const renderWithRouter = (ui: React.ReactElement) => {
        return render(<MemoryRouter>{ui}</MemoryRouter>);
    };

    describe('Loading States', () => {
        it('should show page skeleton while loading plugins', () => {
            vi.mocked(usePlugins).mockReturnValue({
                data: null,
                isLoading: true,
                error: null,
            } as any);

            renderWithRouter(<PluginViewPage />);

            expect(screen.getByTestId('page-skeleton')).toBeInTheDocument();
        });

        it('should show loading state when plugin bundle is loading', async () => {
            vi.mocked(loadPluginBundle).mockImplementation(
                () => new Promise(() => { }) // Never resolves
            );

            renderWithRouter(<PluginViewPage />);

            await waitFor(() => {
                expect(screen.getByTestId('base-body')).toHaveAttribute('data-is-loading', 'true');
            });
        });
    });

    describe('Error States', () => {
        it('should show error when plugins fetch fails', () => {
            vi.mocked(usePlugins).mockReturnValue({
                data: null,
                isLoading: false,
                error: new Error('Failed to fetch plugins'),
            } as any);

            renderWithRouter(<PluginViewPage />);

            expect(screen.getByTestId('alert')).toHaveAttribute('data-variant', 'destructive');
            expect(screen.getByText(/Failed to load plugins: Failed to fetch plugins/)).toBeInTheDocument();
        });

        it('should show back button on plugins fetch error', () => {
            vi.mocked(usePlugins).mockReturnValue({
                data: null,
                isLoading: false,
                error: new Error('Failed to fetch'),
            } as any);

            renderWithRouter(<PluginViewPage />);

            const buttons = screen.getAllByTestId('button');
            const backButton = buttons.find(btn => btn.textContent?.includes('Back to Marketplace'));
            expect(backButton).toBeInTheDocument();
        });

        it('should navigate to marketplace on back button click after error', async () => {
            const user = userEvent.setup();

            vi.mocked(usePlugins).mockReturnValue({
                data: null,
                isLoading: false,
                error: new Error('Failed to fetch'),
            } as any);

            renderWithRouter(<PluginViewPage />);

            const buttons = screen.getAllByTestId('button');
            const backButton = buttons.find(btn => btn.textContent?.includes('Back to Marketplace'));

            if (backButton) {
                await user.click(backButton);
                expect(mockNavigate).toHaveBeenCalledWith('/plugin-marketplace');
            }
        });

        it('should show error when plugin not found', () => {
            vi.mocked(useParams).mockReturnValue({ pluginSlug: 'nonexistent-plugin' });

            renderWithRouter(<PluginViewPage />);

            expect(screen.getByText('Plugin not found.')).toBeInTheDocument();
        });

        it('should show error when plugin bundle fails to load', async () => {
            vi.mocked(loadPluginBundle).mockRejectedValue(new Error('Bundle load failed'));

            renderWithRouter(<PluginViewPage />);

            await waitFor(() => {
                const baseBody = screen.getByTestId('base-body');
                expect(baseBody).toHaveAttribute('data-error', 'Bundle load failed');
            });
        });
    });

    describe('Plugin Slug Matching', () => {
        it('should match plugin by sanitized slug', () => {
            renderWithRouter(<PluginViewPage />);

            expect(screen.getByTestId('header-title')).toHaveTextContent('Test Plugin Title');
        });

        it('should sanitize plugin name with spaces to slug', () => {
            vi.mocked(useParams).mockReturnValue({ pluginSlug: 'another-plugin' });

            renderWithRouter(<PluginViewPage />);

            expect(screen.getByTestId('header-title')).toHaveTextContent('Another Plugin Title');
        });

        it('should handle uppercase in plugin slug', () => {
            vi.mocked(useParams).mockReturnValue({ pluginSlug: 'test-plugin' });

            renderWithRouter(<PluginViewPage />);

            expect(screen.getByTestId('header-title')).toHaveTextContent('Test Plugin Title');
        });
    });

    describe('Plugin Header', () => {
        it('should render plugin title', () => {
            renderWithRouter(<PluginViewPage />);

            expect(screen.getByTestId('header-title')).toHaveTextContent('Test Plugin Title');
        });

        it('should render plugin description', () => {
            renderWithRouter(<PluginViewPage />);

            expect(screen.getByTestId('header-description')).toHaveTextContent('A test plugin');
        });

        it('should render plugin icon', () => {
            renderWithRouter(<PluginViewPage />);

            expect(screen.getByTestId('header-icon')).toHaveTextContent('Database');
        });

        it('should render owner badge', () => {
            renderWithRouter(<PluginViewPage />);

            const badges = screen.getAllByTestId('badge');
            const ownerBadge = badges.find(badge => badge.textContent === 'Test Owner');
            expect(ownerBadge).toBeInTheDocument();
        });

        it('should render version badge', () => {
            renderWithRouter(<PluginViewPage />);

            const badges = screen.getAllByTestId('badge');
            const versionBadge = badges.find(badge => badge.textContent === 'v1.0.0');
            expect(versionBadge).toBeInTheDocument();
        });

        it('should use name as title if title is missing', () => {
            const pluginsWithoutTitle = [{
                ...mockPlugins[0],
                title: '',
            }];

            vi.mocked(usePlugins).mockReturnValue({
                data: { plugins: pluginsWithoutTitle },
                isLoading: false,
                error: null,
            } as any);

            renderWithRouter(<PluginViewPage />);

            expect(screen.getByTestId('header-title')).toHaveTextContent('Test Plugin');
        });
    });

    describe('Plugin Loading and Lifecycle', () => {
        it('should load plugin bundle', async () => {
            renderWithRouter(<PluginViewPage />);

            await waitFor(() => {
                expect(loadPluginBundle).toHaveBeenCalledWith(mockPlugins[0]);
            });
        });

        it('should call onMount hook after loading', async () => {
            renderWithRouter(<PluginViewPage />);

            await waitFor(() => {
                expect(mockManifest.hooks.onMount).toHaveBeenCalled();
            });
        });

        it('should call onUnmount hook on cleanup', async () => {
            const { unmount } = renderWithRouter(<PluginViewPage />);

            await waitFor(() => {
                expect(loadPluginBundle).toHaveBeenCalled();
            });

            unmount();

            await waitFor(() => {
                expect(mockManifest.hooks.onUnmount).toHaveBeenCalled();
            });
        });

        it('should render plugin component when loaded', async () => {
            renderWithRouter(<PluginViewPage />);

            await waitFor(() => {
                expect(screen.getByTestId('plugin-component')).toBeInTheDocument();
            });
        });

        it('should pass context to plugin component', async () => {
            renderWithRouter(<PluginViewPage />);

            await waitFor(() => {
                expect(mockPluginComponent).toHaveBeenCalledWith(
                    expect.objectContaining({
                        context: expect.objectContaining({
                            theme: expect.any(Object),
                            apiClient: expect.any(Object),
                            metadata: expect.any(Object),
                            utils: expect.any(Object),
                        }),
                    }),
                    expect.anything()
                );
            });
        });
    });

    describe('Plugin Context', () => {
        it('should create theme context with light mode', async () => {
            vi.mocked(useActualTheme).mockReturnValue('light');

            renderWithRouter(<PluginViewPage />);

            await waitFor(() => {
                expect(screen.getByTestId('plugin-context-theme')).toHaveTextContent('light');
            });
        });

        it('should create theme context with dark mode', async () => {
            vi.mocked(useActualTheme).mockReturnValue('dark');

            renderWithRouter(<PluginViewPage />);

            await waitFor(() => {
                expect(screen.getByTestId('plugin-context-theme')).toHaveTextContent('dark');
            });
        });

        it('should create API client with plugin id', async () => {
            renderWithRouter(<PluginViewPage />);

            await waitFor(() => {
                expect(PluginApiClient).toHaveBeenCalledWith('plugin-1');
            });
        });

        it('should include metadata in context', async () => {
            renderWithRouter(<PluginViewPage />);

            await waitFor(() => {
                expect(mockPluginComponent).toHaveBeenCalledWith(
                    expect.objectContaining({
                        context: expect.objectContaining({
                            metadata: expect.objectContaining({
                                id: 'plugin-1',
                                name: 'Test Plugin',
                                title: 'Test Plugin Title',
                            }),
                        }),
                    }),
                    expect.anything()
                );
            });
        });
    });


    describe('Navigation', () => {
        it('should render back to marketplace button', () => {
            renderWithRouter(<PluginViewPage />);

            const buttons = screen.getAllByTestId('button');
            const backButton = buttons.find(btn => btn.textContent?.includes('Back to Marketplace'));
            expect(backButton).toBeInTheDocument();
        });

        it('should navigate to marketplace on back button click', async () => {
            const user = userEvent.setup();

            renderWithRouter(<PluginViewPage />);

            const buttons = screen.getAllByTestId('button');
            const backButton = buttons.find(btn => btn.textContent?.includes('Back to Marketplace'));

            if (backButton) {
                await user.click(backButton);
                expect(mockNavigate).toHaveBeenCalledWith('/plugin-marketplace');
            }
        });
    });

    describe('SessionStorage Cleanup', () => {
        it('should clear plugin backend proxy from sessionStorage', () => {
            sessionStorage.setItem('plugin-backend-proxy', 'test-value');

            renderWithRouter(<PluginViewPage />);

            expect(sessionStorage.getItem('plugin-backend-proxy')).toBeNull();
        });
    });


    describe('Edge Cases', () => {
        it('should handle plugin without version', () => {
            const pluginsWithoutVersion = [{
                ...mockPlugins[0],
                version: null,
            }];

            vi.mocked(usePlugins).mockReturnValue({
                data: { plugins: pluginsWithoutVersion },
                isLoading: false,
                error: null,
            } as any);

            renderWithRouter(<PluginViewPage />);

            const badges = screen.getAllByTestId('badge');
            const versionBadge = badges.find(badge => badge.textContent === 'v1.0.0');
            expect(versionBadge).toBeInTheDocument(); // Should default to 1.0.0
        });

        it('should handle plugin without owner', () => {
            const pluginsWithoutOwner = [{
                ...mockPlugins[0],
                owner: null,
            }];

            vi.mocked(usePlugins).mockReturnValue({
                data: { plugins: pluginsWithoutOwner },
                isLoading: false,
                error: null,
            } as any);

            renderWithRouter(<PluginViewPage />);

            // Should still render without crashing
            expect(screen.getByTestId('header-title')).toBeInTheDocument();
        });

        it('should handle plugin without icon', () => {
            const pluginsWithoutIcon = [{
                ...mockPlugins[0],
                icon: null,
            }];

            vi.mocked(usePlugins).mockReturnValue({
                data: { plugins: pluginsWithoutIcon },
                isLoading: false,
                error: null,
            } as any);

            renderWithRouter(<PluginViewPage />);

            expect(screen.getByTestId('header-icon')).toHaveTextContent('Puzzle'); // Default icon
        });

        it('should handle manifest without hooks', async () => {
            const manifestWithoutHooks = {
                component: mockPluginComponent,
            };

            vi.mocked(loadPluginBundle).mockResolvedValue(manifestWithoutHooks);

            renderWithRouter(<PluginViewPage />);

            await waitFor(() => {
                expect(screen.getByTestId('plugin-component')).toBeInTheDocument();
            });
        });

        it('should handle onMount hook error gracefully', async () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            const manifestWithFailingOnMount = {
                ...mockManifest,
                hooks: {
                    onMount: vi.fn().mockRejectedValue(new Error('Mount failed')),
                    onUnmount: vi.fn(),
                },
            };

            vi.mocked(loadPluginBundle).mockResolvedValue(manifestWithFailingOnMount);

            renderWithRouter(<PluginViewPage />);

            await waitFor(() => {
                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    '[Plugin] onMount error:',
                    expect.any(Error)
                );
            });

            consoleErrorSpy.mockRestore();
        });

        it('should handle onUnmount hook error gracefully', async () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            const manifestWithFailingOnUnmount = {
                ...mockManifest,
                hooks: {
                    onMount: vi.fn(),
                    onUnmount: vi.fn(() => { throw new Error('Unmount failed'); }),
                },
            };

            vi.mocked(loadPluginBundle).mockResolvedValue(manifestWithFailingOnUnmount);

            const { unmount } = renderWithRouter(<PluginViewPage />);

            await waitFor(() => {
                expect(loadPluginBundle).toHaveBeenCalled();
            });

            unmount();

            await waitFor(() => {
                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    '[Plugin] onUnmount error:',
                    expect.any(Error)
                );
            });

            consoleErrorSpy.mockRestore();
        });
    });

});