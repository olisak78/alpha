import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LandscapeLinksSection } from '@/components/LandscapeLinksSection';
import { LandscapeFilter } from '@/components/LandscapeFilter';
import { LandscapeToolsButtons } from '@/components/LandscapeToolsButtons';
import { Ops2goLandscapeInfo } from '@/components/Ops2goLandscapeInfo';

// Mock the child components
vi.mock('@/components/LandscapeFilter');
vi.mock('@/components/LandscapeToolsButtons');
vi.mock('@/components/Ops2goLandscapeInfo');

describe('LandscapeLinksSection', () => {
  const mockLandscapeFilter = vi.mocked(LandscapeFilter);
  const mockLandscapeToolsButtons = vi.mocked(LandscapeToolsButtons);
  const mockOps2goLandscapeInfo = vi.mocked(Ops2goLandscapeInfo);

  const defaultLandscapeGroups = [
    {
      id: 'group1',
      name: 'Production',
      landscapes: [
        { id: 'land1', name: 'Production US', isCentral: false },
        { id: 'land2', name: 'Production EU', isCentral: true },
      ],
    },
    {
      id: 'group2',
      name: 'Development',
      landscapes: [
        { id: 'land3', name: 'Dev Environment', isCentral: false },
      ],
    },
  ];

  const mockSelectedLandscapeData = {
    technical_name: 'PROD_US',
    display_name: 'Production US',
  };

  const mockOnLandscapeChange = vi.fn();
  const mockOnShowLandscapeDetails = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    mockLandscapeFilter.mockImplementation(() => (
      <div data-testid="landscape-filter">Landscape Filter</div>
    ));
    mockLandscapeToolsButtons.mockImplementation(() => (
      <div data-testid="landscape-tools-buttons">Landscape Tools Buttons</div>
    ));
    mockOps2goLandscapeInfo.mockImplementation(() => (
      <div data-testid="ops2go-landscape-info">Ops2go Info</div>
    ));
  });

  describe('Rendering and Structure', () => {
    it('should render the title', () => {
      render(
        <LandscapeLinksSection
          selectedLandscape={null}
          landscapeGroups={defaultLandscapeGroups}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      expect(screen.getByText('Landscape Links')).toBeInTheDocument();
    });

    it('should render title with correct heading level', () => {
      render(
        <LandscapeLinksSection
          selectedLandscape={null}
          landscapeGroups={defaultLandscapeGroups}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      const heading = screen.getByRole('heading', { name: 'Landscape Links' });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H2');
    });

    it('should render LandscapeFilter component', () => {
      render(
        <LandscapeLinksSection
          selectedLandscape={null}
          landscapeGroups={defaultLandscapeGroups}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      expect(screen.getByTestId('landscape-filter')).toBeInTheDocument();
    });

    it('should render LandscapeToolsButtons component', () => {
      render(
        <LandscapeLinksSection
          selectedLandscape={null}
          landscapeGroups={defaultLandscapeGroups}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      expect(screen.getByTestId('landscape-tools-buttons')).toBeInTheDocument();
    });

    it('should have correct layout structure', () => {
      const { container } = render(
        <LandscapeLinksSection
          selectedLandscape={null}
          landscapeGroups={defaultLandscapeGroups}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      const mainContainer = container.querySelector('.mb-6');
      expect(mainContainer).toBeInTheDocument();
    });
  });

  describe('LandscapeFilter Props', () => {
    it('should pass selectedLandscape to LandscapeFilter', () => {
      render(
        <LandscapeLinksSection
          selectedLandscape="land1"
          landscapeGroups={defaultLandscapeGroups}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      expect(mockLandscapeFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          selectedLandscape: 'land1',
        }),
        expect.anything()
      );
    });

    it('should pass null selectedLandscape to LandscapeFilter', () => {
      render(
        <LandscapeLinksSection
          selectedLandscape={null}
          landscapeGroups={defaultLandscapeGroups}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      expect(mockLandscapeFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          selectedLandscape: null,
        }),
        expect.anything()
      );
    });

    it('should pass onLandscapeChange callback to LandscapeFilter', () => {
      render(
        <LandscapeLinksSection
          selectedLandscape={null}
          landscapeGroups={defaultLandscapeGroups}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      expect(mockLandscapeFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          onLandscapeChange: mockOnLandscapeChange,
        }),
        expect.anything()
      );
    });

    it('should pass onShowLandscapeDetails callback to LandscapeFilter', () => {
      render(
        <LandscapeLinksSection
          selectedLandscape={null}
          landscapeGroups={defaultLandscapeGroups}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      expect(mockLandscapeFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          onShowLandscapeDetails: mockOnShowLandscapeDetails,
        }),
        expect.anything()
      );
    });

    it('should pass showClearButton as false to LandscapeFilter', () => {
      render(
        <LandscapeLinksSection
          selectedLandscape={null}
          landscapeGroups={defaultLandscapeGroups}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      expect(mockLandscapeFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          showClearButton: false,
        }),
        expect.anything()
      );
    });

    it('should pass showViewAllButton as false to LandscapeFilter', () => {
      render(
        <LandscapeLinksSection
          selectedLandscape={null}
          landscapeGroups={defaultLandscapeGroups}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      expect(mockLandscapeFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          showViewAllButton: false,
        }),
        expect.anything()
      );
    });

    it('should pass projectId to LandscapeFilter when provided', () => {
      render(
        <LandscapeLinksSection
          selectedLandscape={null}
          landscapeGroups={defaultLandscapeGroups}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
          projectId="project123"
        />
      );

      expect(mockLandscapeFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'project123',
        }),
        expect.anything()
      );
    });

    it('should not pass projectId when not provided', () => {
      render(
        <LandscapeLinksSection
          selectedLandscape={null}
          landscapeGroups={defaultLandscapeGroups}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      expect(mockLandscapeFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: undefined,
        }),
        expect.anything()
      );
    });
  });

  describe('Landscape Groups Data Transformation', () => {
    it('should transform landscape groups to Record format for LandscapeFilter', () => {
      render(
        <LandscapeLinksSection
          selectedLandscape={null}
          landscapeGroups={defaultLandscapeGroups}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      const expectedTransformed = {
        Production: [
          { id: 'land1', name: 'Production US', status: 'active', isCentral: false },
          { id: 'land2', name: 'Production EU', status: 'active', isCentral: true },
        ],
        Development: [
          { id: 'land3', name: 'Dev Environment', status: 'active', isCentral: false },
        ],
      };

      expect(mockLandscapeFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          landscapeGroups: expectedTransformed,
        }),
        expect.anything()
      );
    });

    it('should add default status as active to transformed landscapes', () => {
      render(
        <LandscapeLinksSection
          selectedLandscape={null}
          landscapeGroups={defaultLandscapeGroups}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      const filterProps = mockLandscapeFilter.mock.calls[0][0];
      const landscapes = filterProps.landscapeGroups.Production;
      
      landscapes.forEach((landscape: any) => {
        expect(landscape.status).toBe('active');
      });
    });

    it('should preserve isCentral property in transformation', () => {
      render(
        <LandscapeLinksSection
          selectedLandscape={null}
          landscapeGroups={defaultLandscapeGroups}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      const filterProps = mockLandscapeFilter.mock.calls[0][0];
      const landscapes = filterProps.landscapeGroups.Production;
      
      expect(landscapes[0].isCentral).toBe(false);
      expect(landscapes[1].isCentral).toBe(true);
    });

    it('should default isCentral to false when not provided', () => {
      const groupsWithoutCentral = [
        {
          id: 'group1',
          name: 'Test',
          landscapes: [
            { id: 'land1', name: 'Test Land' } as any,
          ],
        },
      ];

      render(
        <LandscapeLinksSection
          selectedLandscape={null}
          landscapeGroups={groupsWithoutCentral}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      const filterProps = mockLandscapeFilter.mock.calls[0][0];
      const landscape = filterProps.landscapeGroups.Test[0];
      
      expect(landscape.isCentral).toBe(false);
    });

    it('should handle empty landscape groups', () => {
      render(
        <LandscapeLinksSection
          selectedLandscape={null}
          landscapeGroups={[]}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      expect(mockLandscapeFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          landscapeGroups: {},
        }),
        expect.anything()
      );
    });

    it('should handle group with empty landscapes array', () => {
      const groupsWithEmptyLandscapes = [
        {
          id: 'group1',
          name: 'Empty Group',
          landscapes: [],
        },
      ];

      render(
        <LandscapeLinksSection
          selectedLandscape={null}
          landscapeGroups={groupsWithEmptyLandscapes}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      const filterProps = mockLandscapeFilter.mock.calls[0][0];
      expect(filterProps.landscapeGroups['Empty Group']).toEqual([]);
    });

    it('should memoize landscape groups transformation', () => {
      const { rerender } = render(
        <LandscapeLinksSection
          selectedLandscape={null}
          landscapeGroups={defaultLandscapeGroups}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      const firstCallProps = mockLandscapeFilter.mock.calls[0][0];
      const firstLandscapeGroups = firstCallProps.landscapeGroups;

      // Rerender with same landscape groups
      rerender(
        <LandscapeLinksSection
          selectedLandscape="land1"
          landscapeGroups={defaultLandscapeGroups}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      const secondCallProps = mockLandscapeFilter.mock.calls[1][0];
      const secondLandscapeGroups = secondCallProps.landscapeGroups;

      // Should be the same object reference (memoized)
      expect(firstLandscapeGroups).toBe(secondLandscapeGroups);
    });

    it('should recalculate transformation when landscape groups change', () => {
      const { rerender } = render(
        <LandscapeLinksSection
          selectedLandscape={null}
          landscapeGroups={defaultLandscapeGroups}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      const firstCallProps = mockLandscapeFilter.mock.calls[0][0];
      const firstLandscapeGroups = firstCallProps.landscapeGroups;

      const newLandscapeGroups = [
        {
          id: 'group3',
          name: 'Staging',
          landscapes: [
            { id: 'land4', name: 'Staging Env', isCentral: true },
          ],
        },
      ];

      // Rerender with different landscape groups
      rerender(
        <LandscapeLinksSection
          selectedLandscape={null}
          landscapeGroups={newLandscapeGroups}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      const secondCallProps = mockLandscapeFilter.mock.calls[1][0];
      const secondLandscapeGroups = secondCallProps.landscapeGroups;

      // Should be different object references
      expect(firstLandscapeGroups).not.toBe(secondLandscapeGroups);
      expect(secondLandscapeGroups).toHaveProperty('Staging');
    });
  });

  describe('LandscapeToolsButtons Props', () => {
    it('should pass selectedLandscape to LandscapeToolsButtons', () => {
      render(
        <LandscapeLinksSection
          selectedLandscape="land1"
          landscapeGroups={defaultLandscapeGroups}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      expect(mockLandscapeToolsButtons).toHaveBeenCalledWith(
        expect.objectContaining({
          selectedLandscape: 'land1',
        }),
        expect.anything()
      );
    });

    it('should pass null selectedLandscape to LandscapeToolsButtons', () => {
      render(
        <LandscapeLinksSection
          selectedLandscape={null}
          landscapeGroups={defaultLandscapeGroups}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      expect(mockLandscapeToolsButtons).toHaveBeenCalledWith(
        expect.objectContaining({
          selectedLandscape: null,
        }),
        expect.anything()
      );
    });

    it('should pass landscapeData to LandscapeToolsButtons', () => {
      render(
        <LandscapeLinksSection
          selectedLandscape="land1"
          selectedLandscapeData={mockSelectedLandscapeData}
          landscapeGroups={defaultLandscapeGroups}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      expect(mockLandscapeToolsButtons).toHaveBeenCalledWith(
        expect.objectContaining({
          landscapeData: mockSelectedLandscapeData,
        }),
        expect.anything()
      );
    });

    it('should pass undefined landscapeData when not provided', () => {
      render(
        <LandscapeLinksSection
          selectedLandscape="land1"
          landscapeGroups={defaultLandscapeGroups}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      expect(mockLandscapeToolsButtons).toHaveBeenCalledWith(
        expect.objectContaining({
          landscapeData: undefined,
        }),
        expect.anything()
      );
    });
  });

  describe('Ops2goLandscapeInfo Conditional Rendering', () => {
    it('should render Ops2goLandscapeInfo when selectedLandscapeData is provided', () => {
      render(
        <LandscapeLinksSection
          selectedLandscape="land1"
          selectedLandscapeData={mockSelectedLandscapeData}
          landscapeGroups={defaultLandscapeGroups}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      expect(screen.getByTestId('ops2go-landscape-info')).toBeInTheDocument();
    });

    it('should not render Ops2goLandscapeInfo when selectedLandscapeData is not provided', () => {
      render(
        <LandscapeLinksSection
          selectedLandscape="land1"
          landscapeGroups={defaultLandscapeGroups}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      expect(screen.queryByTestId('ops2go-landscape-info')).not.toBeInTheDocument();
    });

    it('should not render Ops2goLandscapeInfo when selectedLandscapeData is null', () => {
      render(
        <LandscapeLinksSection
          selectedLandscape="land1"
          selectedLandscapeData={null}
          landscapeGroups={defaultLandscapeGroups}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      expect(screen.queryByTestId('ops2go-landscape-info')).not.toBeInTheDocument();
    });

    it('should pass technical_name to Ops2goLandscapeInfo', () => {
      render(
        <LandscapeLinksSection
          selectedLandscape="land1"
          selectedLandscapeData={mockSelectedLandscapeData}
          landscapeGroups={defaultLandscapeGroups}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      expect(mockOps2goLandscapeInfo).toHaveBeenCalledWith(
        expect.objectContaining({
          landscapeName: 'PROD_US',
        }),
        expect.anything()
      );
    });

    it('should update Ops2goLandscapeInfo when selectedLandscapeData changes', () => {
      const { rerender } = render(
        <LandscapeLinksSection
          selectedLandscape="land1"
          selectedLandscapeData={mockSelectedLandscapeData}
          landscapeGroups={defaultLandscapeGroups}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      expect(mockOps2goLandscapeInfo).toHaveBeenCalledWith(
        expect.objectContaining({
          landscapeName: 'PROD_US',
        }),
        expect.anything()
      );

      const newLandscapeData = {
        technical_name: 'DEV_ENV',
        display_name: 'Development',
      };

      rerender(
        <LandscapeLinksSection
          selectedLandscape="land3"
          selectedLandscapeData={newLandscapeData}
          landscapeGroups={defaultLandscapeGroups}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      expect(mockOps2goLandscapeInfo).toHaveBeenLastCalledWith(
        expect.objectContaining({
          landscapeName: 'DEV_ENV',
        }),
        expect.anything()
      );
    });

    it('should hide Ops2goLandscapeInfo when selectedLandscapeData is removed', () => {
      const { rerender } = render(
        <LandscapeLinksSection
          selectedLandscape="land1"
          selectedLandscapeData={mockSelectedLandscapeData}
          landscapeGroups={defaultLandscapeGroups}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      expect(screen.getByTestId('ops2go-landscape-info')).toBeInTheDocument();

      rerender(
        <LandscapeLinksSection
          selectedLandscape="land1"
          landscapeGroups={defaultLandscapeGroups}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      expect(screen.queryByTestId('ops2go-landscape-info')).not.toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('should have correct width constraint for LandscapeFilter', () => {
      const { container } = render(
        <LandscapeLinksSection
          selectedLandscape={null}
          landscapeGroups={defaultLandscapeGroups}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      const filterContainer = container.querySelector('.w-80');
      expect(filterContainer).toBeInTheDocument();
    });

    it('should have margin bottom on main container', () => {
      const { container } = render(
        <LandscapeLinksSection
          selectedLandscape={null}
          landscapeGroups={defaultLandscapeGroups}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      const mainContainer = container.querySelector('.mb-6');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should have margin top on tools section', () => {
      const { container } = render(
        <LandscapeLinksSection
          selectedLandscape={null}
          landscapeGroups={defaultLandscapeGroups}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      const toolsSection = container.querySelector('.mt-3');
      expect(toolsSection).toBeInTheDocument();
    });
  });

  describe('Complex Data Scenarios', () => {
    it('should handle multiple landscape groups', () => {
      const multipleGroups = [
        {
          id: 'g1',
          name: 'Production',
          landscapes: [
            { id: 'l1', name: 'Prod 1', isCentral: true },
            { id: 'l2', name: 'Prod 2', isCentral: false },
          ],
        },
        {
          id: 'g2',
          name: 'Development',
          landscapes: [
            { id: 'l3', name: 'Dev 1', isCentral: false },
          ],
        },
        {
          id: 'g3',
          name: 'Staging',
          landscapes: [
            { id: 'l4', name: 'Stage 1', isCentral: true },
            { id: 'l5', name: 'Stage 2', isCentral: false },
          ],
        },
      ];

      render(
        <LandscapeLinksSection
          selectedLandscape={null}
          landscapeGroups={multipleGroups}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      const filterProps = mockLandscapeFilter.mock.calls[0][0];
      expect(Object.keys(filterProps.landscapeGroups)).toHaveLength(3);
      expect(filterProps.landscapeGroups).toHaveProperty('Production');
      expect(filterProps.landscapeGroups).toHaveProperty('Development');
      expect(filterProps.landscapeGroups).toHaveProperty('Staging');
    });

    it('should handle landscape with special characters in name', () => {
      const specialGroups = [
        {
          id: 'g1',
          name: 'Test & Production',
          landscapes: [
            { id: 'l1', name: 'Test "Landscape" #1', isCentral: false },
          ],
        },
      ];

      render(
        <LandscapeLinksSection
          selectedLandscape={null}
          landscapeGroups={specialGroups}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      const filterProps = mockLandscapeFilter.mock.calls[0][0];
      expect(filterProps.landscapeGroups['Test & Production'][0].name).toBe('Test "Landscape" #1');
    });

    it('should handle single landscape group', () => {
      const singleGroup = [
        {
          id: 'g1',
          name: 'Only Group',
          landscapes: [
            { id: 'l1', name: 'Only Landscape', isCentral: true },
          ],
        },
      ];

      render(
        <LandscapeLinksSection
          selectedLandscape="l1"
          landscapeGroups={singleGroup}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      const filterProps = mockLandscapeFilter.mock.calls[0][0];
      expect(Object.keys(filterProps.landscapeGroups)).toHaveLength(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle selectedLandscapeData with only technical_name', () => {
      const minimalData = {
        technical_name: 'MINIMAL',
      };

      render(
        <LandscapeLinksSection
          selectedLandscape="land1"
          selectedLandscapeData={minimalData}
          landscapeGroups={defaultLandscapeGroups}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      expect(mockOps2goLandscapeInfo).toHaveBeenCalledWith(
        expect.objectContaining({
          landscapeName: 'MINIMAL',
        }),
        expect.anything()
      );
    });

    it('should handle selectedLandscapeData with additional properties', () => {
      const extendedData = {
        technical_name: 'EXTENDED',
        display_name: 'Extended',
        region: 'US',
        status: 'active',
        extraField: 'extra',
      };

      render(
        <LandscapeLinksSection
          selectedLandscape="land1"
          selectedLandscapeData={extendedData}
          landscapeGroups={defaultLandscapeGroups}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      expect(mockOps2goLandscapeInfo).toHaveBeenCalledWith(
        expect.objectContaining({
          landscapeName: 'EXTENDED',
        }),
        expect.anything()
      );
    });

    it('should handle empty projectId string', () => {
      render(
        <LandscapeLinksSection
          selectedLandscape={null}
          landscapeGroups={defaultLandscapeGroups}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
          projectId=""
        />
      );

      expect(mockLandscapeFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: '',
        }),
        expect.anything()
      );
    });
  });

  describe('Component Integration', () => {
    it('should render all child components together', () => {
      render(
        <LandscapeLinksSection
          selectedLandscape="land1"
          selectedLandscapeData={mockSelectedLandscapeData}
          landscapeGroups={defaultLandscapeGroups}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      expect(screen.getByTestId('landscape-filter')).toBeInTheDocument();
      expect(screen.getByTestId('landscape-tools-buttons')).toBeInTheDocument();
      expect(screen.getByTestId('ops2go-landscape-info')).toBeInTheDocument();
    });

    it('should maintain component order in DOM', () => {
      const { container } = render(
        <LandscapeLinksSection
          selectedLandscape="land1"
          selectedLandscapeData={mockSelectedLandscapeData}
          landscapeGroups={defaultLandscapeGroups}
          onLandscapeChange={mockOnLandscapeChange}
          onShowLandscapeDetails={mockOnShowLandscapeDetails}
        />
      );

      const filter = screen.getByTestId('landscape-filter');
      const tools = screen.getByTestId('landscape-tools-buttons');
      const info = screen.getByTestId('ops2go-landscape-info');

      // Filter should come before tools
      expect(filter.compareDocumentPosition(tools) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      // Tools should come before info
      expect(tools.compareDocumentPosition(info) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
  });
});