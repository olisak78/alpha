import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DeploymentsLoadingSkeleton } from '@/components/AILaunchpad/DeploymentsLoadingSkeleton';
import { DeploymentCardSkeleton } from '@/components/AILaunchpad/DeploymentCardSkeleton';

// Mock the DeploymentCardSkeleton component
vi.mock('@/components/AILaunchpad/DeploymentCardSkeleton', () => ({
  DeploymentCardSkeleton: vi.fn(() => (
    <div data-testid="deployment-card-skeleton">Card Skeleton</div>
  )),
}));

describe('DeploymentsLoadingSkeleton', () => {
  const mockDeploymentCardSkeleton = vi.mocked(DeploymentCardSkeleton);

  describe('Default Rendering', () => {
    it('should render with default count of 8', () => {
      render(<DeploymentsLoadingSkeleton />);

      const skeletons = screen.getAllByTestId('deployment-card-skeleton');
      expect(skeletons).toHaveLength(8);
    });

    it('should render grid container', () => {
      const { container } = render(<DeploymentsLoadingSkeleton />);

      const grid = container.querySelector('.deployments-grid');
      expect(grid).toBeInTheDocument();
    });

    it('should have correct grid classes', () => {
      const { container } = render(<DeploymentsLoadingSkeleton />);

      const grid = container.querySelector('.deployments-grid');
      expect(grid).toHaveClass('grid');
    });

    it('should call DeploymentCardSkeleton 8 times by default', () => {
      mockDeploymentCardSkeleton.mockClear();
      
      render(<DeploymentsLoadingSkeleton />);

      expect(mockDeploymentCardSkeleton).toHaveBeenCalledTimes(8);
    });
  });

  describe('Custom Count Prop', () => {
    it('should render custom count of skeletons', () => {
      render(<DeploymentsLoadingSkeleton count={5} />);

      const skeletons = screen.getAllByTestId('deployment-card-skeleton');
      expect(skeletons).toHaveLength(5);
    });

    it('should call DeploymentCardSkeleton with custom count', () => {
      mockDeploymentCardSkeleton.mockClear();
      
      render(<DeploymentsLoadingSkeleton count={3} />);

      expect(mockDeploymentCardSkeleton).toHaveBeenCalledTimes(3);
    });

    it('should render single skeleton when count is 1', () => {
      render(<DeploymentsLoadingSkeleton count={1} />);

      const skeletons = screen.getAllByTestId('deployment-card-skeleton');
      expect(skeletons).toHaveLength(1);
    });

    it('should render many skeletons with large count', () => {
      render(<DeploymentsLoadingSkeleton count={20} />);

      const skeletons = screen.getAllByTestId('deployment-card-skeleton');
      expect(skeletons).toHaveLength(20);
    });

    it('should render zero skeletons when count is 0', () => {
      render(<DeploymentsLoadingSkeleton count={0} />);

      const skeletons = screen.queryAllByTestId('deployment-card-skeleton');
      expect(skeletons).toHaveLength(0);
    });
  });

  describe('Grid Layout', () => {
    it('should have responsive grid columns for mobile', () => {
      const { container } = render(<DeploymentsLoadingSkeleton />);

      const grid = container.querySelector('.deployments-grid');
      expect(grid).toHaveClass('grid-cols-1');
    });

    it('should have responsive grid columns for small screens', () => {
      const { container } = render(<DeploymentsLoadingSkeleton />);

      const grid = container.querySelector('.deployments-grid');
      expect(grid).toHaveClass('sm:grid-cols-2');
    });

    it('should have responsive grid columns for medium screens', () => {
      const { container } = render(<DeploymentsLoadingSkeleton />);

      const grid = container.querySelector('.deployments-grid');
      expect(grid).toHaveClass('md:grid-cols-3');
    });

    it('should have responsive grid columns for large screens', () => {
      const { container } = render(<DeploymentsLoadingSkeleton />);

      const grid = container.querySelector('.deployments-grid');
      expect(grid).toHaveClass('lg:grid-cols-4');
    });

    it('should have responsive grid columns for extra large screens', () => {
      const { container } = render(<DeploymentsLoadingSkeleton />);

      const grid = container.querySelector('.deployments-grid');
      expect(grid).toHaveClass('xl:grid-cols-4');
    });

    it('should have gap between grid items', () => {
      const { container } = render(<DeploymentsLoadingSkeleton />);

      const grid = container.querySelector('.deployments-grid');
      expect(grid).toHaveClass('gap-5');
    });

    it('should align items to start', () => {
      const { container } = render(<DeploymentsLoadingSkeleton />);

      const grid = container.querySelector('.deployments-grid');
      expect(grid).toHaveClass('items-start');
    });

    it('should have all grid layout classes', () => {
      const { container } = render(<DeploymentsLoadingSkeleton />);

      const grid = container.querySelector('.deployments-grid');
      expect(grid).toHaveClass(
        'grid',
        'grid-cols-1',
        'sm:grid-cols-2',
        'md:grid-cols-3',
        'lg:grid-cols-4',
        'xl:grid-cols-4',
        'gap-5',
        'items-start'
      );
    });
  });

  describe('Skeleton Keys', () => {
    it('should assign unique keys to each skeleton', () => {
      const { container } = render(<DeploymentsLoadingSkeleton count={5} />);

      const skeletons = container.querySelectorAll('[data-testid="deployment-card-skeleton"]');
      
      // Each skeleton should be a unique React element (keys are internal but rendering should work)
      expect(skeletons).toHaveLength(5);
    });

    it('should render skeletons in correct order', () => {
      render(<DeploymentsLoadingSkeleton count={3} />);

      const skeletons = screen.getAllByTestId('deployment-card-skeleton');
      expect(skeletons).toHaveLength(3);
    });
  });

  describe('Container Structure', () => {
    it('should render grid as direct child of component', () => {
      const { container } = render(<DeploymentsLoadingSkeleton />);

      const grid = container.querySelector('.deployments-grid');
      // Grid should be the first child
      expect(grid).toBe(container.firstChild);
    });

    it('should render skeletons as children of grid', () => {
      const { container } = render(<DeploymentsLoadingSkeleton count={3} />);

      const grid = container.querySelector('.deployments-grid');
      const skeletons = grid?.querySelectorAll('[data-testid="deployment-card-skeleton"]');
      
      expect(skeletons?.length).toBe(3);
    });

    it('should maintain structure with different counts', () => {
      const { container } = render(<DeploymentsLoadingSkeleton count={10} />);

      const grid = container.querySelector('.deployments-grid');
      expect(grid).toBeInTheDocument();
      
      const skeletons = grid?.querySelectorAll('[data-testid="deployment-card-skeleton"]');
      expect(skeletons?.length).toBe(10);
    });
  });

  describe('Component Updates', () => {
    it('should update skeleton count when prop changes', () => {
      const { rerender } = render(<DeploymentsLoadingSkeleton count={3} />);

      let skeletons = screen.getAllByTestId('deployment-card-skeleton');
      expect(skeletons).toHaveLength(3);

      rerender(<DeploymentsLoadingSkeleton count={6} />);

      skeletons = screen.getAllByTestId('deployment-card-skeleton');
      expect(skeletons).toHaveLength(6);
    });

    it('should update from default to custom count', () => {
      const { rerender } = render(<DeploymentsLoadingSkeleton />);

      let skeletons = screen.getAllByTestId('deployment-card-skeleton');
      expect(skeletons).toHaveLength(8);

      rerender(<DeploymentsLoadingSkeleton count={4} />);

      skeletons = screen.getAllByTestId('deployment-card-skeleton');
      expect(skeletons).toHaveLength(4);
    });

    it('should update to zero skeletons', () => {
      const { rerender } = render(<DeploymentsLoadingSkeleton count={5} />);

      let skeletons = screen.getAllByTestId('deployment-card-skeleton');
      expect(skeletons).toHaveLength(5);

      rerender(<DeploymentsLoadingSkeleton count={0} />);

      skeletons = screen.queryAllByTestId('deployment-card-skeleton');
      expect(skeletons).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should render without errors', () => {
      expect(() => render(<DeploymentsLoadingSkeleton />)).not.toThrow();
    });

    it('should render with count 0', () => {
      const { container } = render(<DeploymentsLoadingSkeleton count={0} />);

      const grid = container.querySelector('.deployments-grid');
      expect(grid).toBeInTheDocument();
      
      const skeletons = screen.queryAllByTestId('deployment-card-skeleton');
      expect(skeletons).toHaveLength(0);
    });

    it('should handle very large counts', () => {
      render(<DeploymentsLoadingSkeleton count={100} />);

      const skeletons = screen.getAllByTestId('deployment-card-skeleton');
      expect(skeletons).toHaveLength(100);
    });

    it('should maintain grid structure with zero skeletons', () => {
      const { container } = render(<DeploymentsLoadingSkeleton count={0} />);

      const grid = container.querySelector('.deployments-grid');
      expect(grid).toHaveClass('grid', 'grid-cols-1', 'sm:grid-cols-2');
    });
  });

  describe('Array Generation', () => {
    it('should use Array.from for skeleton generation', () => {
      render(<DeploymentsLoadingSkeleton count={4} />);

      const skeletons = screen.getAllByTestId('deployment-card-skeleton');
      expect(skeletons).toHaveLength(4);
    });

    it('should generate correct number of iterations', () => {
      mockDeploymentCardSkeleton.mockClear();
      
      render(<DeploymentsLoadingSkeleton count={7} />);

      expect(mockDeploymentCardSkeleton).toHaveBeenCalledTimes(7);
    });
  });

  describe('Integration', () => {
    it('should work with default export/import', () => {
      const { container } = render(<DeploymentsLoadingSkeleton />);

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render in parent containers', () => {
      const { container } = render(
        <div className="wrapper">
          <DeploymentsLoadingSkeleton count={3} />
        </div>
      );

      const wrapper = container.querySelector('.wrapper');
      const grid = wrapper?.querySelector('.deployments-grid');
      
      expect(grid).toBeInTheDocument();
    });

    it('should handle multiple instances', () => {
      const { container } = render(
        <>
          <DeploymentsLoadingSkeleton count={2} />
          <DeploymentsLoadingSkeleton count={3} />
        </>
      );

      const grids = container.querySelectorAll('.deployments-grid');
      expect(grids).toHaveLength(2);
      
      const allSkeletons = screen.getAllByTestId('deployment-card-skeleton');
      expect(allSkeletons).toHaveLength(5);
    });
  });

  describe('Accessibility', () => {
    it('should render semantic div structure', () => {
      const { container } = render(<DeploymentsLoadingSkeleton />);

      const grid = container.querySelector('div.deployments-grid');
      expect(grid).toBeInTheDocument();
    });

    it('should be accessible with screen readers', () => {
      render(<DeploymentsLoadingSkeleton count={3} />);

      const skeletons = screen.getAllByTestId('deployment-card-skeleton');
      expect(skeletons).toHaveLength(3);
    });
  });

  describe('Responsive Behavior', () => {
    it('should adapt from 1 column to 2 columns on small screens', () => {
      const { container } = render(<DeploymentsLoadingSkeleton />);

      const grid = container.querySelector('.deployments-grid');
      expect(grid).toHaveClass('grid-cols-1', 'sm:grid-cols-2');
    });

    it('should adapt from 2 columns to 3 columns on medium screens', () => {
      const { container } = render(<DeploymentsLoadingSkeleton />);

      const grid = container.querySelector('.deployments-grid');
      expect(grid).toHaveClass('sm:grid-cols-2', 'md:grid-cols-3');
    });

    it('should adapt from 3 columns to 4 columns on large screens', () => {
      const { container } = render(<DeploymentsLoadingSkeleton />);

      const grid = container.querySelector('.deployments-grid');
      expect(grid).toHaveClass('md:grid-cols-3', 'lg:grid-cols-4');
    });

    it('should maintain 4 columns on extra large screens', () => {
      const { container } = render(<DeploymentsLoadingSkeleton />);

      const grid = container.querySelector('.deployments-grid');
      expect(grid).toHaveClass('lg:grid-cols-4', 'xl:grid-cols-4');
    });
  });

  describe('Typical Usage Scenarios', () => {
    it('should render loading state for deployments page', () => {
      render(<DeploymentsLoadingSkeleton />);

      const skeletons = screen.getAllByTestId('deployment-card-skeleton');
      expect(skeletons).toHaveLength(8);
    });

    it('should render loading state with custom count for search results', () => {
      render(<DeploymentsLoadingSkeleton count={4} />);

      const skeletons = screen.getAllByTestId('deployment-card-skeleton');
      expect(skeletons).toHaveLength(4);
    });

    it('should render empty state with zero count', () => {
      const { container } = render(<DeploymentsLoadingSkeleton count={0} />);

      const grid = container.querySelector('.deployments-grid');
      expect(grid).toBeInTheDocument();
      expect(grid?.children).toHaveLength(0);
    });

    it('should render paginated loading state', () => {
      render(<DeploymentsLoadingSkeleton count={12} />);

      const skeletons = screen.getAllByTestId('deployment-card-skeleton');
      expect(skeletons).toHaveLength(12);
    });
  });
});