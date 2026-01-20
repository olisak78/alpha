import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import CamProfilesTab from '../../../src/components/tabs/CamProfilesTab';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Search: () => <div data-testid="search-icon" />,
  ExternalLink: () => <div data-testid="external-link-icon" />,
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
}));

const mockCamGroups = [
  {
    name: 'staging-admin-profile',
    description: 'Admin access for staging environment',
    group: 'Development'
  },
  {
    name: 'live-viewer-profile',
    description: 'Read-only access for production',
    group: 'Production'
  },
  {
    name: 'canary-full-profile',
    description: 'Full access for canary testing',
    group: 'Testing'
  },
  {
    name: 'hotfix-approver-profile',
    group: 'Development'
  },
  {
    name: 'basic-profile',
    group: 'Other'
  }
];

// Mock window.open
const mockWindowOpen = vi.fn();
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true
});

describe('CamProfilesTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input and profile count', () => {
    render(<CamProfilesTab camGroups={mockCamGroups} />);
    
    expect(screen.getByPlaceholderText('Search profiles by name, group, or description...')).toBeInTheDocument();
    expect(screen.getByText('Showing 5 profiles')).toBeInTheDocument();
  });

  it('filters profiles by search query', async () => {
    render(<CamProfilesTab camGroups={mockCamGroups} />);
    
    const searchInput = screen.getByPlaceholderText('Search profiles by name, group, or description...');
    fireEvent.change(searchInput, { target: { value: 'admin' } });
    
    await waitFor(() => {
      expect(screen.getByText('Found 1 profile')).toBeInTheDocument();
    });
    
    // Open the accordion to see the profile names
    const developmentAccordion = screen.getByText('Development').closest('button');
    if (developmentAccordion) {
      fireEvent.click(developmentAccordion);
    }
    
    await waitFor(() => {
      expect(screen.getByText('staging-admin-profile')).toBeInTheDocument();
    });
  });

  it('groups profiles correctly', () => {
    render(<CamProfilesTab camGroups={mockCamGroups} />);
    
    expect(screen.getByText('Development')).toBeInTheDocument();
    expect(screen.getByText('Production')).toBeInTheDocument();
    expect(screen.getByText('Testing')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  it('displays profile count for each group', () => {
    render(<CamProfilesTab camGroups={mockCamGroups} />);
    
    expect(screen.getByText('2 profiles')).toBeInTheDocument(); // Development group
    expect(screen.getAllByText('1 profile')).toHaveLength(3); // Production, Testing, Other groups
  });

  it('handles request access button click', async () => {
    render(<CamProfilesTab camGroups={mockCamGroups} />);
    
    // Open the accordion to see the request access buttons
    const developmentAccordion = screen.getByText('Development').closest('button');
    if (developmentAccordion) {
      fireEvent.click(developmentAccordion);
    }
    
    await waitFor(() => {
      const requestButtons = screen.getAllByTitle('Request access');
      expect(requestButtons.length).toBeGreaterThan(0);
      fireEvent.click(requestButtons[0]);
    });
    
    expect(mockWindowOpen).toHaveBeenCalledWith(
      expect.stringContaining('https://cam.int.sap/cam/ui/admin?item=request&profile='),
      '_blank'
    );
  });

  it('displays correct role types', async () => {
    render(<CamProfilesTab camGroups={mockCamGroups} />);
    
    // Open all accordions to see the role types
    const accordionButtons = screen.getAllByRole('button');
    for (const button of accordionButtons) {
      if (button.textContent?.includes('profiles') || button.textContent?.includes('profile')) {
        fireEvent.click(button);
      }
    }
    
    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument();
      expect(screen.getByText('Viewer')).toBeInTheDocument();
      expect(screen.getByText('Full')).toBeInTheDocument();
      expect(screen.getByText('Approver')).toBeInTheDocument();
      expect(screen.getByText('Basic')).toBeInTheDocument();
    });
  });

  it('shows no results message when search has no matches', async () => {
    render(<CamProfilesTab camGroups={mockCamGroups} />);
    
    const searchInput = screen.getByPlaceholderText('Search profiles by name, group, or description...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    await waitFor(() => {
      expect(screen.getByText('No profiles found matching "nonexistent"')).toBeInTheDocument();
    });
  });

  it('handles empty cam groups', () => {
    render(<CamProfilesTab camGroups={[]} />);
    
    expect(screen.getByText('Showing 0 profiles')).toBeInTheDocument();
  });

});
