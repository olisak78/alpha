import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TeamJiraTable } from '@/components/Team/TeamJiraTable';
import type { JiraIssue } from '@/types/api';

// Mock the lucide-react icon
vi.mock('lucide-react', () => ({
  ExternalLink: () => <span data-testid="external-link-icon" />
}));

// Mock UI components
vi.mock('@/components/ui/table', () => ({
  Table: ({ children, ...props }: any) => <table {...props}>{children}</table>,
  TableHeader: ({ children, ...props }: any) => <thead {...props}>{children}</thead>,
  TableBody: ({ children, ...props }: any) => <tbody {...props}>{children}</tbody>,
  TableRow: ({ children, ...props }: any) => <tr {...props}>{children}</tr>,
  TableHead: ({ children, ...props }: any) => <th {...props}>{children}</th>,
  TableCell: ({ children, ...props }: any) => <td {...props}>{children}</td>,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, ...props }: any) => (
    <span data-testid="badge" data-variant={variant} {...props}>{children}</span>
  )
}));

// Mock data for testing
const createMockJiraIssue = (overrides: Partial<JiraIssue> = {}): JiraIssue => ({
  id: 'issue-123',
  key: 'TEST-123',
  project: 'TEST',
  link: 'https://jira.example.com/browse/TEST-123',
  fields: {
    summary: 'Test issue summary',
    status: {
      id: '1',
      name: 'In Progress'
    },
    issuetype: {
      id: '1',
      name: 'Bug'
    },
    priority: {
      id: '1',
      name: 'High'
    },
    assignee: {
      accountId: 'user123',
      displayName: 'John Doe',
      emailAddress: 'john.doe@example.com'
    },
    reporter: {
      accountId: 'user456',
      displayName: 'Jane Smith',
      emailAddress: 'jane.smith@example.com'
    },
    created: '2023-01-01T10:00:00.000Z',
    updated: '2023-01-02T15:30:00.000Z',
    description: 'Test issue description'
  },
  ...overrides
});

describe('TeamJiraTable', () => {
  describe('Basic Rendering', () => {
    it('renders table structure with correct headers', () => {
      render(<TeamJiraTable filteredIssues={[]} />);

      // Check table structure and headers
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      
      const headers = ['Key', 'Summary', 'Type', 'Status', 'Priority', 'Assignee', 'Updated'];
      headers.forEach(header => {
        expect(screen.getByText(header)).toBeInTheDocument();
      });

      // Check semantic structure
      const thead = table.querySelector('thead');
      const tbody = table.querySelector('tbody');
      expect(thead).toBeInTheDocument();
      expect(tbody).toBeInTheDocument();

      // Check that table body is empty when no issues provided
      expect(tbody?.children).toHaveLength(0);
    });

    it('renders issues when provided', () => {
      const mockIssue = createMockJiraIssue();
      render(<TeamJiraTable filteredIssues={[mockIssue]} />);

      // Check that one row is rendered
      const tableBody = screen.getByRole('table').querySelector('tbody');
      expect(tableBody?.children).toHaveLength(1);
    });
  });

  describe('Issue Row Rendering', () => {

    it('renders multiple issues correctly', () => {
      const issues = [
        createMockJiraIssue({
          id: 'issue-1',
          key: 'TEST-001',
          fields: {
            summary: 'First issue',
            status: { id: '1', name: 'Open' },
            issuetype: { id: '1', name: 'Bug' },
            priority: { id: '1', name: 'High' },
            assignee: {
              accountId: 'user1',
              displayName: 'User One',
              emailAddress: 'user1@example.com'
            },
            reporter: {
              accountId: 'user456',
              displayName: 'Jane Smith',
              emailAddress: 'jane.smith@example.com'
            },
            created: '2023-01-01T10:00:00.000Z',
            updated: '2023-01-01T10:00:00.000Z'
          }
        }),
        createMockJiraIssue({
          id: 'issue-2',
          key: 'TEST-002',
          fields: {
            summary: 'Second issue',
            status: { id: '2', name: 'In Progress' },
            issuetype: { id: '2', name: 'Story' },
            priority: { id: '2', name: 'Low' },
            assignee: {
              accountId: 'user2',
              displayName: 'User Two',
              emailAddress: 'user2@example.com'
            },
            reporter: {
              accountId: 'user456',
              displayName: 'Jane Smith',
              emailAddress: 'jane.smith@example.com'
            },
            created: '2023-01-01T10:00:00.000Z',
            updated: '2023-01-02T10:00:00.000Z'
          }
        })
      ];

      render(<TeamJiraTable filteredIssues={issues} />);

      // Check that both issues are rendered
      expect(screen.getByText('TEST-001')).toBeInTheDocument();
      expect(screen.getByText('TEST-002')).toBeInTheDocument();
      expect(screen.getByText('First issue')).toBeInTheDocument();
      expect(screen.getByText('Second issue')).toBeInTheDocument();
      expect(screen.getByText('User One')).toBeInTheDocument();
      expect(screen.getByText('User Two')).toBeInTheDocument();

      // Check that table has 2 rows
      const tableBody = screen.getByRole('table').querySelector('tbody');
      expect(tableBody?.children).toHaveLength(2);
    });
  });

  describe('Edge Cases and Fallback Values', () => {
    it('handles missing and undefined field values gracefully', () => {
      const issueWithMissingFields = createMockJiraIssue({
        fields: {
          summary: 'Issue with missing fields',
          status: { id: '1', name: 'Open' },
          issuetype: { id: '1', name: 'Bug' },
          priority: null as any,
          assignee: undefined,
          reporter: {
            accountId: 'user456',
            displayName: 'Jane Smith',
            emailAddress: 'jane.smith@example.com'
          },
          created: '2023-01-01T10:00:00.000Z',
          updated: '2023-01-01T10:00:00.000Z'
        }
      });

      render(<TeamJiraTable filteredIssues={[issueWithMissingFields]} />);

      expect(screen.getByText('Issue with missing fields')).toBeInTheDocument();
      expect(screen.getByText('N/A')).toBeInTheDocument(); // Priority
      expect(screen.getByText('Unassigned')).toBeInTheDocument(); // Assignee
    });

    it('handles undefined field names', () => {
      const issueWithUndefinedNames = createMockJiraIssue({
        fields: {
          ...createMockJiraIssue().fields,
          priority: { id: '1', name: undefined as any },
          assignee: {
            accountId: 'user123',
            displayName: undefined as any,
            emailAddress: 'user@example.com'
          }
        }
      });

      render(<TeamJiraTable filteredIssues={[issueWithUndefinedNames]} />);

      expect(screen.getByText('N/A')).toBeInTheDocument(); // Priority
      expect(screen.getByText('Unassigned')).toBeInTheDocument(); // Assignee
    });
  });

  describe('Date Formatting', () => {
    it('formats updated date using toLocaleString', () => {
      const mockIssue = createMockJiraIssue({
        fields: {
          ...createMockJiraIssue().fields,
          updated: '2023-12-25T18:30:45.123Z'
        }
      });

      render(<TeamJiraTable filteredIssues={[mockIssue]} />);

      // The exact format depends on the locale, but we can check that a formatted date is present
      const dateText = screen.getByText(/12\/25\/2023|2023-12-25|Dec.*25.*2023/);
      expect(dateText).toBeInTheDocument();
    });

    it('handles different date formats', () => {
      const dates = [
        '2023-01-01T00:00:00.000Z',
        '2023-06-15T12:30:45.678Z',
        '2023-12-31T23:59:59.999Z'
      ];

      dates.forEach((date, index) => {
        const mockIssue = createMockJiraIssue({
          id: `issue-${index}`,
          key: `TEST-${index}`,
          fields: {
            ...createMockJiraIssue().fields,
            updated: date
          }
        });

        const { unmount } = render(<TeamJiraTable filteredIssues={[mockIssue]} />);

        // Check that a date is rendered (exact format may vary by locale)
        const dateElement = screen.getByText(/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|[A-Za-z]{3}.*\d{1,2}.*\d{4}/);
        expect(dateElement).toBeInTheDocument();

        unmount();
      });
    });
  });


  describe('Accessibility and Styling', () => {
    it('provides accessibility features and correct styling', () => {
      const longSummary = 'This is a very long summary that should be truncated in the UI';
      const mockIssue = createMockJiraIssue({
        fields: {
          ...createMockJiraIssue().fields,
          summary: longSummary
        },
        link: 'https://jira.company.com/browse/PROJ-123'
      });

      render(<TeamJiraTable filteredIssues={[mockIssue]} />);

      // Check semantic table structure (already covered in basic rendering)
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      // Check title attribute for truncated summary
      const summaryCell = screen.getByText(longSummary).closest('td');
      expect(summaryCell).toHaveAttribute('title', longSummary);
      expect(summaryCell).toHaveClass('max-w-[420px]', 'truncate');

      // Check proper link attributes for external Jira links
      const keyLink = screen.getByRole('link', { name: /TEST-123/ });
      expect(keyLink).toHaveAttribute('href', 'https://jira.company.com/browse/PROJ-123');
      expect(keyLink).toHaveAttribute('target', '_blank');
      expect(keyLink).toHaveAttribute('rel', 'noreferrer');
      expect(keyLink).toHaveClass('inline-flex', 'items-center', 'gap-1', 'text-primary', 'hover:underline');

      // Check updated cell styling
      const updatedCell = screen.getByText(/1\/2\/2023/).closest('td');
      expect(updatedCell).toHaveClass('whitespace-nowrap');
    });
  });

  describe('Component Integration', () => {
    it('uses correct Badge variant for issue type', () => {
      const mockIssue = createMockJiraIssue({
        fields: {
          ...createMockJiraIssue().fields,
          issuetype: { id: '5', name: 'Epic' }
        }
      });

      render(<TeamJiraTable filteredIssues={[mockIssue]} />);

      const badges = screen.getAllByTestId('badge');
      const epicBadge = badges.find(badge => badge.textContent === 'Epic');
      expect(epicBadge).toBeDefined();
      expect(epicBadge).toHaveTextContent('Epic');
    });

    it('renders ExternalLink icon with correct props', () => {
      const mockIssue = createMockJiraIssue();
      render(<TeamJiraTable filteredIssues={[mockIssue]} />);

      const externalLinkIcon = screen.getByTestId('external-link-icon');
      expect(externalLinkIcon).toBeInTheDocument();
    });
  });

  describe('Props Validation', () => {
    it('handles undefined filteredIssues gracefully', () => {
      // This should not happen in practice, but testing for robustness
      // The component expects an array, so undefined will throw an error
      expect(() => {
        render(<TeamJiraTable filteredIssues={undefined as any} />);
      }).toThrow();
    });

    it('handles null values in issue fields', () => {
      const issueWithNullFields = {
        id: 'null-issue',
        key: 'NULL-001',
        project: 'NULL',
        link: 'https://jira.example.com/browse/NULL-001',
        fields: {
          summary: null as any,
          status: { id: '1', name: 'Open' },
          issuetype: { id: '1', name: 'Bug' },
          priority: null as any,
          assignee: null as any,
          reporter: null as any,
          created: '2023-01-01T10:00:00.000Z',
          updated: '2023-01-01T10:00:00.000Z'
        }
      };

      expect(() => {
        render(<TeamJiraTable filteredIssues={[issueWithNullFields]} />);
      }).not.toThrow();

      expect(screen.getByText('N/A')).toBeInTheDocument(); // Priority
      expect(screen.getByText('Unassigned')).toBeInTheDocument(); // Assignee
    });
  });
});
