import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '../../../src/pages/HomePage';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useCurrentUser } from '../../../src/hooks/api/useMembers';
import { useMyJiraIssuesCount, useMyJiraIssues } from '../../../src/hooks/api/useJira';
import { useGitHubContributions } from '../../../src/hooks/api/useGitHubContributions';
import { useGitHubAveragePRTime } from '../../../src/hooks/api/useGitHubAveragePRtime';
import { useGitHubPRs } from '../../../src/hooks/api/useGitHubPRs';

// Mock all the hooks
vi.mock('../../../src/contexts/AuthContext');
vi.mock('../../../src/hooks/api/useMembers');
vi.mock('../../../src/hooks/api/useJira');
vi.mock('../../../src/hooks/api/useGitHubContributions');
vi.mock('../../../src/hooks/api/useGitHubPRs');
vi.mock('../../../src/hooks/api/useGitHubAveragePRtime');

// Mock the Announcements component
vi.mock('../../../src/components/Announcements', () => ({
    Announcements: () => <div data-testid="announcements">Announcements</div>,
}));

// Mock the tab components
vi.mock('../../../src/components/tabs/MePageTabs/CamProfilesTab', () => ({
    default: () => <div data-testid="cam-profiles-tab">CAM Profiles</div>,
}));

vi.mock('../../../src/components/tabs/MePageTabs/QuickLinksTab', () => ({
    default: () => <div data-testid="quick-links-tab">Quick Links</div>,
}));

vi.mock('../../../src/components/tabs/MePageTabs/GithubPrsTab', () => ({
    default: () => <div data-testid="github-prs-tab">GitHub PRs</div>,
}));

vi.mock('../../../src/components/tabs/MePageTabs/JiraIssuesTab', () => ({
    default: () => <div data-testid="jira-issues-tab">Jira Issues</div>,
}));

// Default mock values
const defaultMocks = {
    useAuth: {
        user: { name: 'testuser', memberId: 'member-123' },
    },
    useCurrentUser: {
        data: { first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
        isLoading: false,
        error: null,
    },
    useMyJiraIssuesCount: {
        data: { count: 15 },
        isLoading: false,
        error: null,
    },
    useMyJiraIssues: {
        data: { issues: [], total: 30 },
        isLoading: false,
        error: null,
    },
    useGitHubContributions: {
        data: { total_contributions: 120, period: 'last_year', from: '2024-01-01', to: '2024-12-31' },
        isLoading: false,
        error: null,
    },
    useGitHubAveragePRTime: {
        data: {
            average_pr_merge_time_hours: 0.3,
            pr_count: 57,
            period: '30d',
            from: '2025-10-04T00:00:00Z',
            to: '2025-11-03T23:59:59Z',
            time_series: [
                { week_start: '2025-10-27', week_end: '2025-11-03', average_hours: 0.13, pr_count: 10 },
                { week_start: '2025-10-20', week_end: '2025-10-27', average_hours: 0.08, pr_count: 20 },
                { week_start: '2025-10-13', week_end: '2025-10-20', average_hours: 0.06, pr_count: 18 },
                { week_start: '2025-10-06', week_end: '2025-10-13', average_hours: 1.45, pr_count: 9 },
            ]
        },
        isLoading: false,
        error: null,
    },
    useGitHubPRs: {
        data: { pull_requests: [], total: 0 },
        isLoading: false,
        error: null,
    },
};

describe('HomePage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        
        // Set up default mocks
        vi.mocked(useAuth).mockReturnValue(defaultMocks.useAuth as any);
        vi.mocked(useCurrentUser).mockReturnValue(defaultMocks.useCurrentUser as any);
        vi.mocked(useMyJiraIssuesCount).mockReturnValue(defaultMocks.useMyJiraIssuesCount as any);
        vi.mocked(useMyJiraIssues).mockReturnValue(defaultMocks.useMyJiraIssues as any);
        vi.mocked(useGitHubContributions).mockReturnValue(defaultMocks.useGitHubContributions as any);
        vi.mocked(useGitHubAveragePRTime).mockReturnValue(defaultMocks.useGitHubAveragePRTime as any);
        vi.mocked(useGitHubPRs).mockReturnValue(defaultMocks.useGitHubPRs as any);
    });

    // =========================================
    // STATISTICS CARDS TESTS
    // =========================================

    describe('Statistics Cards', () => {
        it('displays Average PR time stat with correct value including "min" suffix', () => {
            render(
                <MemoryRouter>
                    <HomePage />
                </MemoryRouter>
            );

            expect(screen.getByText('Average PR time')).toBeInTheDocument();
            expect(screen.getByText('57 min')).toBeInTheDocument();
        });

        it('defaults to "0 min" when Average PR time data is undefined', () => {
            vi.mocked(useGitHubAveragePRTime).mockReturnValue({
                ...defaultMocks.useGitHubAveragePRTime,
                data: undefined,
            } as any);

            render(
                <MemoryRouter>
                    <HomePage />
                </MemoryRouter>
            );

            expect(screen.getByText('0 min')).toBeInTheDocument();
        });
    });

    // =========================================
    // AVERAGE PR TIME TESTS
    // =========================================

    describe('Average PR Time', () => {
        it('displays correct PR count with "min" suffix from API response', () => {
            render(
                <MemoryRouter>
                    <HomePage />
                </MemoryRouter>
            );

            expect(screen.getByText('57 min')).toBeInTheDocument();
        });

        it('handles zero PR count with "min" suffix', () => {
            vi.mocked(useGitHubAveragePRTime).mockReturnValue({
                ...defaultMocks.useGitHubAveragePRTime,
                data: {
                    ...defaultMocks.useGitHubAveragePRTime.data!,
                    pr_count: 0,
                },
            } as any);

            render(
                <MemoryRouter>
                    <HomePage />
                </MemoryRouter>
            );

            expect(screen.getByText('0 min')).toBeInTheDocument();
        });

        it('handles large PR count with "min" suffix', () => {
            vi.mocked(useGitHubAveragePRTime).mockReturnValue({
                ...defaultMocks.useGitHubAveragePRTime,
                data: {
                    ...defaultMocks.useGitHubAveragePRTime.data!,
                    pr_count: 1234,
                },
            } as any);

            render(
                <MemoryRouter>
                    <HomePage />
                </MemoryRouter>
            );

            expect(screen.getByText('1234 min')).toBeInTheDocument();
        });
    });
});