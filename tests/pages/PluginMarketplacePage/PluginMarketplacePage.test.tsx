import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import PluginMarketplacePage from '../../../src/pages/PluginMarketplacePage';
import type { PluginApiData } from '../../../src/hooks/api/usePlugins';

// =====================
// Mocks
// =====================

// --- react-router ---
const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>(
        'react-router-dom'
    );
    return {
        ...actual,
        useNavigate: () => navigateMock,
    };
});

// --- toast ---
const toastMock = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({
        toast: toastMock,
    }),
}));

// --- api client ---
const putMock = vi.fn();
const deleteMock = vi.fn();
vi.mock('@/services/ApiClient', () => ({
    apiClient: {
        put: (...args: any[]) => putMock(...args),
        delete: (...args: any[]) => deleteMock(...args),
    },
}));

// --- usePlugins hook ---
const refetchMock = vi.fn();
let usePluginsState: any = {};

vi.mock('@/hooks/api/usePlugins', () => ({
    usePlugins: () => usePluginsState,
}));

// --- Child components (shallow mocks) ---

vi.mock('@/plugins/components/PluginCard', () => ({
    default: ({ plugin, onOpen, onEdit, onDelete }: any) => (
        <div data-testid="plugin-card">
            <span>{plugin.title}</span>
            <button onClick={() => onOpen(plugin)}>open</button>
            <button onClick={() => onEdit(plugin)}>edit</button>
            <button onClick={() => onDelete(plugin)}>delete</button>
        </div>
    ),
}));

vi.mock('@/plugins/components/PluginCardSkeleton', () => ({
    default: () => <div data-testid="plugin-skeleton" />,
}));

vi.mock('@/plugins/components/Pagination', () => ({
    default: ({ currentPage, totalPages, onPageChange }: any) => (
        <div data-testid="pagination">
            <span>
                page {currentPage} / {totalPages}
            </span>
            <button onClick={() => onPageChange(currentPage + 1)}>next</button>
        </div>
    ),
}));

vi.mock('@/plugins/components/SearchBar', () => ({
    default: ({ searchQuery, onSearchChange }: any) => (
        <input
            data-testid="search-input"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
        />
    ),
}));

vi.mock('@/plugins/components/RegisterPluginDialog', () => ({
    default: ({ onSuccess }: any) => (
        <button onClick={onSuccess}>register-plugin</button>
    ),
}));

// =====================
// Helpers
// =====================

function renderPage() {
    return render(
        <MemoryRouter>
            <PluginMarketplacePage />
        </MemoryRouter>
    );
}

const mockPlugins: PluginApiData[] = [
    {
        id: '1',
        name: 'test-plugin',
        title: 'Test Plugin',
        description: 'desc',
        owner: 'oleg',
        react_component_path: 'https://example.com/plugin.js',
        backend_server_url: 'https://api.example.com',
    },
    {
        id: '2',
        name: 'other-plugin',
        title: 'Other Plugin',
        description: 'desc',
        owner: 'john',
        react_component_path: 'https://example.com/other.js',
        backend_server_url: 'https://api.other.com',
    },
];


// =====================
// Tests
// =====================

describe('PluginMarketplacePage', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        usePluginsState = {
            data: {
                plugins: mockPlugins,
                total: mockPlugins.length,
            },
            isLoading: false,
            isError: false,
            error: null,
            refetch: refetchMock,
            isFetching: false,
        };
    });

    it('renders plugins', () => {
        renderPage();

        expect(screen.getAllByTestId('plugin-card')).toHaveLength(2);
        expect(screen.getByText('Test Plugin')).toBeInTheDocument();
        expect(screen.getByText('Other Plugin')).toBeInTheDocument();
    });

    it('shows loading skeletons while loading', () => {
        usePluginsState.isLoading = true;

        renderPage();

        expect(screen.getAllByTestId('plugin-skeleton')).toHaveLength(6);
    });

    it('shows error state', () => {
        usePluginsState.isError = true;
        usePluginsState.error = new Error('Boom');

        renderPage();

        expect(screen.getByText(/Boom/i)).toBeInTheDocument();
    });

    it('filters plugins by search query (debounced)', async () => {
        const user = userEvent.setup();
        renderPage();

        await user.type(screen.getByTestId('search-input'), 'other');

        await waitFor(() => {
            expect(screen.queryByText('Test Plugin')).not.toBeInTheDocument();
            expect(screen.getByText('Other Plugin')).toBeInTheDocument();
        });
    });

    it('navigates when opening a plugin', async () => {
        const user = userEvent.setup();
        renderPage();

        const openButtons = screen.getAllByText('open');
        await user.click(openButtons[0]);

        expect(navigateMock).toHaveBeenCalledWith('/plugins/test-plugin');
    });

    it('opens edit dialog when clicking edit', async () => {
        const user = userEvent.setup();
        renderPage();

        await user.click(screen.getAllByText('edit')[0]);

        expect(screen.getByText('Edit Plugin')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test Plugin')).toBeInTheDocument();
    });

    it('submits edit and calls API + refetch', async () => {
        const user = userEvent.setup();
        putMock.mockResolvedValueOnce({});

        renderPage();

        await user.click(screen.getAllByText('edit')[0]);
        await user.click(screen.getByText('Update Plugin'));

        await waitFor(() => {
            expect(putMock).toHaveBeenCalled();
            expect(refetchMock).toHaveBeenCalled();
            expect(toastMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'Success',
                })
            );
        });
    });

    it('opens delete dialog and deletes plugin', async () => {
        const user = userEvent.setup();
        deleteMock.mockResolvedValueOnce({});

        renderPage();

        await user.click(screen.getAllByText('delete')[0]);
        expect(
            screen.getByRole('button', { name: /^delete plugin$/i })
        ).toBeInTheDocument();


        await user.click(
            screen.getByRole('button', { name: /^delete plugin$/i })
        );


        await waitFor(() => {
            expect(deleteMock).toHaveBeenCalledWith('/plugins/1');
            expect(refetchMock).toHaveBeenCalled();
            expect(toastMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'Success',
                })
            );
        });
    });

    it('calls refetch when refresh button is clicked', async () => {
        const user = userEvent.setup();
        renderPage();

        await user.click(screen.getByText('Refresh'));

        expect(refetchMock).toHaveBeenCalled();
    });
});
