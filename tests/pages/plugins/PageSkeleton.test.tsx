import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageSkeleton } from '@/plugins/components/PageSkeleton';

// Mock the Skeleton component
vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className, ...props }: { className?: string }) => (
    <div data-testid="skeleton" className={className} {...props} />
  ),
}));

describe('PageSkeleton', () => {
  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      render(<PageSkeleton />);
      
      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render the correct number of skeleton elements', () => {
      render(<PageSkeleton />);
      
      const skeletons = screen.getAllByTestId('skeleton');
      // Should have 4 skeleton elements total:
      // 1. Icon skeleton (h-8 w-8)
      // 2. Title skeleton (h-6 w-48)
      // 3. Description skeleton (h-4 w-72)
      // 4. Content skeleton (h-[400px] w-full)
      expect(skeletons).toHaveLength(4);
    });
  });

  describe('Layout Structure', () => {
    it('should render with correct container structure', () => {
      const { container } = render(<PageSkeleton />);
      
      const mainContainer = container.querySelector('.p-6.space-y-6');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should have a flex container for header section', () => {
      const { container } = render(<PageSkeleton />);
      
      const headerContainer = container.querySelector('.flex.items-center.gap-4');
      expect(headerContainer).toBeInTheDocument();
    });

    it('should have a space-y-2 container for text skeletons', () => {
      const { container } = render(<PageSkeleton />);
      
      const textContainer = container.querySelector('.space-y-2');
      expect(textContainer).toBeInTheDocument();
    });
  });

  describe('Skeleton Elements', () => {
    it('should render icon skeleton with correct dimensions', () => {
      render(<PageSkeleton />);
      
      const skeletons = screen.getAllByTestId('skeleton');
      const iconSkeleton = skeletons[0];
      
      expect(iconSkeleton).toHaveClass('h-8');
      expect(iconSkeleton).toHaveClass('w-8');
    });

    it('should render title skeleton with correct dimensions', () => {
      render(<PageSkeleton />);
      
      const skeletons = screen.getAllByTestId('skeleton');
      const titleSkeleton = skeletons[1];
      
      expect(titleSkeleton).toHaveClass('h-6');
      expect(titleSkeleton).toHaveClass('w-48');
    });

    it('should render description skeleton with correct dimensions', () => {
      render(<PageSkeleton />);
      
      const skeletons = screen.getAllByTestId('skeleton');
      const descriptionSkeleton = skeletons[2];
      
      expect(descriptionSkeleton).toHaveClass('h-4');
      expect(descriptionSkeleton).toHaveClass('w-72');
    });

    it('should render content skeleton with correct dimensions', () => {
      render(<PageSkeleton />);
      
      const skeletons = screen.getAllByTestId('skeleton');
      const contentSkeleton = skeletons[3];
      
      expect(contentSkeleton).toHaveClass('h-[400px]');
      expect(contentSkeleton).toHaveClass('w-full');
    });
  });

  describe('Visual Hierarchy', () => {
    it('should have correct DOM structure for header section', () => {
      const { container } = render(<PageSkeleton />);
      
      // Check that icon and text group are siblings within flex container
      const flexContainer = container.querySelector('.flex.items-center.gap-4');
      expect(flexContainer).toBeInTheDocument();
      
      const children = flexContainer?.children;
      expect(children).toHaveLength(2); // Icon skeleton + text container
    });

    it('should have title and description as siblings in text container', () => {
      const { container } = render(<PageSkeleton />);
      
      const textContainer = container.querySelector('.space-y-2');
      const children = textContainer?.children;
      
      expect(children).toHaveLength(2); // Title + description skeletons
    });

    it('should have header section before content section', () => {
      const { container } = render(<PageSkeleton />);
      
      const mainContainer = container.querySelector('.p-6.space-y-6');
      const children = Array.from(mainContainer?.children || []);
      
      expect(children).toHaveLength(2);
      
      // First child should be the header flex container
      expect(children[0]).toHaveClass('flex');
      expect(children[0]).toHaveClass('items-center');
      expect(children[0]).toHaveClass('gap-4');
      
      // Second child should be the content skeleton
      expect(children[1]).toHaveClass('h-[400px]');
      expect(children[1]).toHaveClass('w-full');
    });
  });

  describe('Spacing and Layout', () => {
    it('should apply padding to main container', () => {
      const { container } = render(<PageSkeleton />);
      
      const mainContainer = container.querySelector('.p-6');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should apply vertical spacing to main container', () => {
      const { container } = render(<PageSkeleton />);
      
      const mainContainer = container.querySelector('.space-y-6');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should apply gap to header flex container', () => {
      const { container } = render(<PageSkeleton />);
      
      const flexContainer = container.querySelector('.gap-4');
      expect(flexContainer).toBeInTheDocument();
    });

    it('should apply vertical spacing to text container', () => {
      const { container } = render(<PageSkeleton />);
      
      const textContainer = container.querySelector('.space-y-2');
      expect(textContainer).toBeInTheDocument();
    });
  });

  describe('Component Isolation', () => {
    it('should render independently without props', () => {
      // PageSkeleton doesn't accept props, so this verifies it works standalone
      const { container } = render(<PageSkeleton />);
      
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should be reusable and render multiple instances', () => {
      const { container } = render(
        <>
          <PageSkeleton />
          <PageSkeleton />
        </>
      );
      
      const skeletons = screen.getAllByTestId('skeleton');
      // Each PageSkeleton has 4 skeleton elements, so 2 instances = 8 total
      expect(skeletons).toHaveLength(8);
    });
  });

  describe('Accessibility', () => {
    it('should render as a div element', () => {
      const { container } = render(<PageSkeleton />);
      
      const mainContainer = container.firstChild;
      expect(mainContainer?.nodeName).toBe('DIV');
    });

    it('should not contain any interactive elements', () => {
      const { container } = render(<PageSkeleton />);
      
      const buttons = container.querySelectorAll('button');
      const links = container.querySelectorAll('a');
      const inputs = container.querySelectorAll('input');
      
      expect(buttons).toHaveLength(0);
      expect(links).toHaveLength(0);
      expect(inputs).toHaveLength(0);
    });
  });

  describe('Snapshot', () => {
    it('should match snapshot', () => {
      const { container } = render(<PageSkeleton />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});