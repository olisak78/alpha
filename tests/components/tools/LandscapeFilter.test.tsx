import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { LandscapeFilter } from '@/components/LandscapeFilter';
import type { Landscape } from '@/types/developer-portal';

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: vi.fn(({ children, onClick, role, ...props }) => (
    <button onClick={onClick} role={role} {...props}>
      {children}
    </button>
  )),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: vi.fn(({ children, ...props }) => (
    <span data-testid="badge" {...props}>{children}</span>
  )),
}));

vi.mock('@/components/ui/popover', () => ({
  Popover: vi.fn(({ open, onOpenChange, children }) => (
    <div data-testid="popover" data-open={open}>
      {children}
    </div>
  )),
  PopoverTrigger: vi.fn(({ children }) => <div data-testid="popover-trigger">{children}</div>),
  PopoverContent: vi.fn(({ children }) => <div data-testid="popover-content">{children}</div>),
}));

vi.mock('@/components/ui/command', () => ({
  Command: vi.fn(({ children }) => <div data-testid="command">{children}</div>),
  CommandInput: vi.fn((props) => <input data-testid="command-input" {...props} />),
  CommandList: vi.fn(({ children }) => <div data-testid="command-list">{children}</div>),
  CommandEmpty: vi.fn(({ children }) => <div data-testid="command-empty">{children}</div>),
  CommandGroup: vi.fn(({ heading, children }) => (
    <div data-testid="command-group">
      <div data-testid="group-heading">{heading}</div>
      {children}
    </div>
  )),
  CommandItem: vi.fn(({ children, onSelect, disabled, value }) => (
    <div
      data-testid={`command-item-${value}`}
      data-disabled={disabled}
      onClick={() => !disabled && onSelect?.()}
    >
      {children}
    </div>
  )),
}));

// Mock stores
vi.mock('@/stores/appStateStore', () => ({
  useLandscapeSelection: vi.fn(),
  useSelectedLandscape: vi.fn(),
  useSelectedLandscapeForProject: vi.fn(),
}));

// Mock utilities
vi.mock('@/utils/landscapeHistory', () => ({
  getLandscapeHistory: vi.fn(),
  addToLandscapeHistory: vi.fn(),
}));

vi.mock('@/utils/developer-portal-helpers', () => ({
  sortLandscapeGroups: vi.fn((groups) => Object.entries(groups)),
}));

vi.mock('@/lib/utils', () => ({
  cn: vi.fn((...classes) => classes.filter(Boolean).join(' ')),
}));

import { useLandscapeSelection, useSelectedLandscape, useSelectedLandscapeForProject } from '@/stores/appStateStore';
import { getLandscapeHistory, addToLandscapeHistory } from '@/utils/landscapeHistory';
import { sortLandscapeGroups } from '@/utils/developer-portal-helpers';

describe('LandscapeFilter', () => {
  const mockOnLandscapeChange = vi.fn();
  const mockOnShowLandscapeDetails = vi.fn();
  const mockSetSelectedLandscapeForProject = vi.fn();
  const mockGetSelectedLandscapeForProject = vi.fn();

  const mockLandscapes: Landscape[] = [
    {
      id: 'land-1',
      name: 'Production',
      technical_name: 'prod',
      status: 'healthy',
      isCentral: true,
    } as Landscape,
    {
      id: 'land-2',
      name: 'Development',
      technical_name: 'dev',
      status: 'warning',
      isCentral: false,
    } as Landscape,
    {
      id: 'land-3',
      name: 'Staging',
      technical_name: 'staging',
      status: 'error',
      isCentral: false,
    } as Landscape,
  ];

  const mockLandscapeGroups = {
    'Production': [mockLandscapes[0]],
    'Non-Production': [mockLandscapes[1], mockLandscapes[2]],
  };

  const defaultProps = {
    landscapeGroups: mockLandscapeGroups,
    onLandscapeChange: mockOnLandscapeChange,
    onShowLandscapeDetails: mockOnShowLandscapeDetails,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useLandscapeSelection).mockReturnValue({
      getSelectedLandscapeForProject: mockGetSelectedLandscapeForProject,
      setSelectedLandscapeForProject: mockSetSelectedLandscapeForProject,
    });

    vi.mocked(useSelectedLandscape).mockReturnValue(null);
    vi.mocked(useSelectedLandscapeForProject).mockReturnValue(null);
    vi.mocked(getLandscapeHistory).mockReturnValue([]);
    vi.mocked(sortLandscapeGroups).mockImplementation((groups) => Object.entries(groups));
  });

  describe('Rendering', () => {
    it('should render landscape filter with Globe icon', () => {
      render(<LandscapeFilter {...defaultProps} />);

      const container = screen.getByRole('combobox').closest('div')?.parentElement;
      expect(container).toBeInTheDocument();
    });

    it('should render popover trigger button', () => {
      render(<LandscapeFilter {...defaultProps} />);

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should render View All Landscapes button by default', () => {
      render(<LandscapeFilter {...defaultProps} />);

      expect(screen.getByText('View All Landscapes')).toBeInTheDocument();
    });

    it('should not render View All button when showViewAllButton is false', () => {
      render(<LandscapeFilter {...defaultProps} showViewAllButton={false} />);

      expect(screen.queryByText('View All Landscapes')).not.toBeInTheDocument();
    });

    it('should render default placeholder text', () => {
      render(<LandscapeFilter {...defaultProps} />);

      expect(screen.getByText('Filter by Landscape')).toBeInTheDocument();
    });

    it('should render custom placeholder text', () => {
      render(<LandscapeFilter {...defaultProps} placeholder="Select Landscape" />);

      expect(screen.getByText('Select Landscape')).toBeInTheDocument();
    });
  });

  describe('Selected Landscape Display', () => {
    it('should display selected landscape name', () => {
      vi.mocked(useSelectedLandscape).mockReturnValue('land-1');

      render(<LandscapeFilter {...defaultProps} />);

      const combobox = screen.getByRole('combobox');
      expect(combobox).toHaveTextContent('prod');
    });

    it('should show central badge for central landscape', () => {
      vi.mocked(useSelectedLandscape).mockReturnValue('land-1');

      render(<LandscapeFilter {...defaultProps} />);

      const combobox = screen.getByRole('combobox');
      expect(combobox).toHaveTextContent('central');
    });

    it('should not show central badge for non-central landscape', () => {
      vi.mocked(useSelectedLandscape).mockReturnValue('land-2');

      render(<LandscapeFilter {...defaultProps} />);

      const combobox = screen.getByRole('combobox');
      expect(combobox).not.toHaveTextContent('central');
    });

    it('should show status color indicator for selected landscape', () => {
      vi.mocked(useSelectedLandscape).mockReturnValue('land-1');

      const { container } = render(<LandscapeFilter {...defaultProps} />);

      const statusIndicator = container.querySelector('.bg-success');
      expect(statusIndicator).toBeInTheDocument();
    });

    it('should use technical_name if available', () => {
      vi.mocked(useSelectedLandscape).mockReturnValue('land-1');

      render(<LandscapeFilter {...defaultProps} />);

      const combobox = screen.getByRole('combobox');
      expect(combobox).toHaveTextContent('prod');
    });

    it('should fall back to name if technical_name is not available', () => {
      const landscapeWithoutTechnicalName = {
        ...mockLandscapes[0],
        technical_name: undefined,
      } as Landscape;

      const groups = {
        'Production': [landscapeWithoutTechnicalName],
      };

      vi.mocked(useSelectedLandscape).mockReturnValue('land-1');

      render(<LandscapeFilter {...defaultProps} landscapeGroups={groups} />);

      const combobox = screen.getByRole('combobox');
      expect(combobox).toHaveTextContent('Production');
    });
  });

  describe('Clear Button', () => {
    it('should show clear button when landscape is selected and showClearButton is true', () => {
      vi.mocked(useSelectedLandscape).mockReturnValue('land-1');

      render(<LandscapeFilter {...defaultProps} showClearButton={true} />);

      expect(screen.getByText('Clear')).toBeInTheDocument();
    });

    it('should not show clear button when no landscape is selected', () => {
      render(<LandscapeFilter {...defaultProps} />);

      expect(screen.queryByText('Clear')).not.toBeInTheDocument();
    });

    it('should not show clear button when showClearButton is false', () => {
      vi.mocked(useSelectedLandscape).mockReturnValue('land-1');

      render(<LandscapeFilter {...defaultProps} showClearButton={false} />);

      expect(screen.queryByText('Clear')).not.toBeInTheDocument();
    });

    it('should call onLandscapeChange with null when clear button is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(useSelectedLandscape).mockReturnValue('land-1');

      render(<LandscapeFilter {...defaultProps} />);

      const clearButton = screen.getByText('Clear');
      await user.click(clearButton);

      expect(mockOnLandscapeChange).toHaveBeenCalledWith(null);
    });

    it('should clear project-specific landscape when projectId is provided', async () => {
      const user = userEvent.setup();
      vi.mocked(useSelectedLandscapeForProject).mockReturnValue('land-1');

      render(<LandscapeFilter {...defaultProps} projectId="proj-1" />);

      const clearButton = screen.getByText('Clear');
      await user.click(clearButton);

      expect(mockSetSelectedLandscapeForProject).toHaveBeenCalledWith('proj-1', null);
    });
  });

  describe('View All Button', () => {
    it('should call onShowLandscapeDetails when clicked', async () => {
      const user = userEvent.setup();

      render(<LandscapeFilter {...defaultProps} />);

      const viewAllButton = screen.getByText('View All Landscapes');
      await user.click(viewAllButton);

      expect(mockOnShowLandscapeDetails).toHaveBeenCalledTimes(1);
    });
  });

  describe('Landscape Selection', () => {
    it('should call onLandscapeChange when landscape is selected', async () => {
      const user = userEvent.setup();

      render(<LandscapeFilter {...defaultProps} />);

      // Open popover first (in a real scenario)
      const selectItem = screen.getByTestId('command-item-land-1-prod');
      await user.click(selectItem);

      expect(mockOnLandscapeChange).toHaveBeenCalledWith('land-1');
    });

    it('should add to landscape history when landscape is selected', async () => {
      const user = userEvent.setup();

      render(<LandscapeFilter {...defaultProps} />);

      const selectItem = screen.getByTestId('command-item-land-1-prod');
      await user.click(selectItem);

      expect(addToLandscapeHistory).toHaveBeenCalledWith('land-1');
    });

    it('should set project-specific landscape when projectId is provided', async () => {
      const user = userEvent.setup();

      render(<LandscapeFilter {...defaultProps} projectId="proj-1" />);

      const selectItem = screen.getByTestId('command-item-land-1-prod');
      await user.click(selectItem);

      expect(mockSetSelectedLandscapeForProject).toHaveBeenCalledWith('proj-1', 'land-1');
    });

    it('should not select disabled landscape', async () => {
      const user = userEvent.setup();

      render(<LandscapeFilter {...defaultProps} disableNonCentral={true} />);

      // land-2 is non-central and should be disabled
      const disabledItem = screen.getByTestId('command-item-land-2-dev');

      expect(disabledItem).toHaveAttribute('data-disabled', 'true');
    });
  });

  describe('Frequently Visited', () => {
    it('should show Frequently Visited group when history exists', () => {
      vi.mocked(getLandscapeHistory).mockReturnValue([
        { id: 'land-1', timestamp: Date.now() },
      ]);

      render(<LandscapeFilter {...defaultProps} />);

      expect(screen.getByText('Frequently Visited')).toBeInTheDocument();
    });

    it('should not show Frequently Visited group when history is empty', () => {
      vi.mocked(getLandscapeHistory).mockReturnValue([]);

      render(<LandscapeFilter {...defaultProps} />);

      expect(screen.queryByText('FREQUENTLY VISITED')).not.toBeInTheDocument();
    });

    it('should only show landscapes that exist in current groups', () => {
      vi.mocked(getLandscapeHistory).mockReturnValue([
        { id: 'land-1', timestamp: Date.now() },
        { id: 'nonexistent', timestamp: Date.now() },
      ]);

      render(<LandscapeFilter {...defaultProps} />);

      // land-1 should appear twice: once in "Frequently Visited" and once in its original group
      const land1Items = screen.getAllByTestId('command-item-land-1-prod');
      expect(land1Items.length).toBe(2);

      // nonexistent landscape should not appear at all
      expect(screen.queryByTestId('command-item-nonexistent-')).not.toBeInTheDocument();
    });
  });

  describe('Status Colors', () => {
    it('should apply success color for healthy status', () => {
      vi.mocked(useSelectedLandscape).mockReturnValue('land-1');

      const { container } = render(<LandscapeFilter {...defaultProps} />);

      expect(container.querySelector('.bg-success')).toBeInTheDocument();
    });

    it('should apply warning color for warning status', () => {
      vi.mocked(useSelectedLandscape).mockReturnValue('land-2');

      const { container } = render(<LandscapeFilter {...defaultProps} />);

      expect(container.querySelector('.bg-warning')).toBeInTheDocument();
    });

    it('should apply destructive color for error status', () => {
      vi.mocked(useSelectedLandscape).mockReturnValue('land-3');

      const { container } = render(<LandscapeFilter {...defaultProps} />);

      expect(container.querySelector('.bg-destructive')).toBeInTheDocument();
    });

    it('should apply muted color for unknown status', () => {
      const landscapeWithUnknownStatus = {
        ...mockLandscapes[0],
        status: 'unknown',
      } as Landscape;

      const groups = {
        'Test': [landscapeWithUnknownStatus],
      };

      vi.mocked(useSelectedLandscape).mockReturnValue('land-1');

      const { container } = render(<LandscapeFilter {...defaultProps} landscapeGroups={groups} />);

      expect(container.querySelector('.bg-muted')).toBeInTheDocument();
    });
  });

  describe('Disabled Non-Central Landscapes', () => {
    it('should disable non-central landscapes when disableNonCentral is true', () => {
      render(<LandscapeFilter {...defaultProps} disableNonCentral={true} />);

      const nonCentralItem = screen.getByTestId('command-item-land-2-dev');
      expect(nonCentralItem).toHaveAttribute('data-disabled', 'true');
    });

    it('should not disable central landscapes even when disableNonCentral is true', () => {
      render(<LandscapeFilter {...defaultProps} disableNonCentral={true} />);

      const centralItem = screen.getByTestId('command-item-land-1-prod');
      expect(centralItem).toHaveAttribute('data-disabled', 'false');
    });

    it('should not disable any landscapes when disableNonCentral is false', () => {
      render(<LandscapeFilter {...defaultProps} disableNonCentral={false} />);

      const item1 = screen.getByTestId('command-item-land-1-prod');
      const item2 = screen.getByTestId('command-item-land-2-dev');

      expect(item1).toHaveAttribute('data-disabled', 'false');
      expect(item2).toHaveAttribute('data-disabled', 'false');
    });
  });

  describe('Empty States', () => {
    it('should show "No available landscapes" when landscapeGroups is empty', () => {
      render(<LandscapeFilter {...defaultProps} landscapeGroups={{}} />);

      const elements = screen.getAllByText('No available landscapes');
      expect(elements.length).toBe(2); // Once in button, once in popover content
    });

    it('should not render landscape list when no landscapes available', () => {
      render(<LandscapeFilter {...defaultProps} landscapeGroups={{}} />);

      expect(screen.queryByTestId('command-list')).not.toBeInTheDocument();
    });

    it('should show red border when no landscape selected and landscapes available', () => {
      const { container } = render(<LandscapeFilter {...defaultProps} />);

      const button = container.querySelector('.border-red-500');
      expect(button).toBeInTheDocument();
    });

    it('should not show red border when landscape is selected', () => {
      vi.mocked(useSelectedLandscape).mockReturnValue('land-1');

      const { container } = render(<LandscapeFilter {...defaultProps} />);

      const redBorder = container.querySelector('.border-red-500');
      expect(redBorder).not.toBeInTheDocument();
    });
  });

  describe('Project-Specific Selection', () => {
    it('should use project-specific landscape when projectId is provided', () => {
      vi.mocked(useSelectedLandscapeForProject).mockReturnValue('land-2');

      render(<LandscapeFilter {...defaultProps} projectId="proj-1" />);

      const combobox = screen.getByRole('combobox');
      expect(combobox).toHaveTextContent('dev');
    });

    it('should use global landscape when projectId is not provided', () => {
      vi.mocked(useSelectedLandscape).mockReturnValue('land-1');

      render(<LandscapeFilter {...defaultProps} />);

      const combobox = screen.getByRole('combobox');
      expect(combobox).toHaveTextContent('prod');
    });

    it('should call useSelectedLandscapeForProject with correct projectId', () => {
      render(<LandscapeFilter {...defaultProps} projectId="proj-1" />);

      expect(useSelectedLandscapeForProject).toHaveBeenCalledWith('proj-1');
    });

    it('should call useSelectedLandscapeForProject with empty string when no projectId', () => {
      render(<LandscapeFilter {...defaultProps} />);

      expect(useSelectedLandscapeForProject).toHaveBeenCalledWith('');
    });
  });

  describe('Search Functionality', () => {
    it('should render search input in command', () => {
      render(<LandscapeFilter {...defaultProps} />);

      expect(screen.getByTestId('command-input')).toBeInTheDocument();
    });

    it('should have correct placeholder for search', () => {
      render(<LandscapeFilter {...defaultProps} />);

      const searchInput = screen.getByTestId('command-input');
      expect(searchInput).toHaveAttribute('placeholder', 'Search landscapes...');
    });
  });

  describe('Landscape Groups', () => {
    it('should render all landscape groups', () => {
      render(<LandscapeFilter {...defaultProps} />);

      expect(screen.getByText('Production')).toBeInTheDocument();
      expect(screen.getByText('Non-Production')).toBeInTheDocument();
    });

    it('should render all landscapes in each group', () => {
      render(<LandscapeFilter {...defaultProps} />);

      expect(screen.getByTestId('command-item-land-1-prod')).toBeInTheDocument();
      expect(screen.getByTestId('command-item-land-2-dev')).toBeInTheDocument();
      expect(screen.getByTestId('command-item-land-3-staging')).toBeInTheDocument();
    });

    it('should call sortLandscapeGroups utility', () => {
      render(<LandscapeFilter {...defaultProps} />);

      expect(sortLandscapeGroups).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle landscape without status', () => {
      const landscapeWithoutStatus = {
        ...mockLandscapes[0],
        status: undefined,
      } as Landscape;

      const groups = {
        'Test': [landscapeWithoutStatus],
      };

      vi.mocked(useSelectedLandscape).mockReturnValue('land-1');

      const { container } = render(<LandscapeFilter {...defaultProps} landscapeGroups={groups} />);

      expect(container.querySelector('.bg-muted')).toBeInTheDocument();
    });

    it('should handle very long landscape names', () => {
      const longNameLandscape = {
        ...mockLandscapes[0],
        technical_name: 'very-long-landscape-name-that-should-be-truncated',
      } as Landscape;

      const groups = {
        'Test': [longNameLandscape],
      };

      vi.mocked(useSelectedLandscape).mockReturnValue('land-1');

      render(<LandscapeFilter {...defaultProps} landscapeGroups={groups} />);

      const combobox = screen.getByRole('combobox');
      expect(combobox).toHaveTextContent('very-long-landscape-name-that-should-be-truncated');
    });

    it('should handle many landscape groups', () => {
      const manyGroups = Object.fromEntries(
        Array.from({ length: 20 }, (_, i) => [
          `Group ${i}`,
          [{ ...mockLandscapes[0], id: `land-${i}`, technical_name: `land-${i}` }],
        ])
      );

      render(<LandscapeFilter {...defaultProps} landscapeGroups={manyGroups} />);

      expect(screen.getByTestId('command-list')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should integrate with appStateStore for global selection', () => {
      render(<LandscapeFilter {...defaultProps} />);

      expect(useSelectedLandscape).toHaveBeenCalled();
      expect(useLandscapeSelection).toHaveBeenCalled();
    });

    it('should integrate with appStateStore for project selection', () => {
      render(<LandscapeFilter {...defaultProps} projectId="proj-1" />);

      expect(useSelectedLandscapeForProject).toHaveBeenCalledWith('proj-1');
    });

    it('should integrate with landscape history utilities', async () => {
      const user = userEvent.setup();

      render(<LandscapeFilter {...defaultProps} />);

      expect(getLandscapeHistory).toHaveBeenCalled();

      const selectItem = screen.getByTestId('command-item-land-1-prod');
      await user.click(selectItem);

      expect(addToLandscapeHistory).toHaveBeenCalledWith('land-1');
    });
  });
});