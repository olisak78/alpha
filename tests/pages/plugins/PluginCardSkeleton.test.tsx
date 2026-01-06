import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PluginCardSkeleton from '@/plugins/components/PluginCardSkeleton';

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-content" className={className}>
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

describe('PluginCardSkeleton', () => {
  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      render(<PluginCardSkeleton />);

      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByTestId('card-content')).toBeInTheDocument();
    });

    it('should render the correct number of skeleton elements', () => {
      render(<PluginCardSkeleton />);

      const skeletons = screen.getAllByTestId('skeleton');
      // Total skeletons:
      // 1. Icon (h-10 w-10)
      // 2. Title (h-4 w-3/4)
      // 3. Badge (h-5 w-20)
      // 4. Version (h-4 w-12)
      // 5-7. Description lines (3 skeletons)
      // 8. Footer author (h-4 w-32)
      // 9. Footer button (h-8 w-16)
      expect(skeletons).toHaveLength(9);
    });
  });

  describe('Card Structure', () => {
    it('should render Card with correct class', () => {
      render(<PluginCardSkeleton />);

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('h-full');
    });

    it('should render CardContent with correct padding', () => {
      render(<PluginCardSkeleton />);

      const cardContent = screen.getByTestId('card-content');
      expect(cardContent).toHaveClass('p-5');
    });
  });

  describe('Header Section Skeletons', () => {
    it('should render icon skeleton with correct dimensions', () => {
      render(<PluginCardSkeleton />);

      const skeletons = screen.getAllByTestId('skeleton');
      const iconSkeleton = skeletons[0];

      expect(iconSkeleton).toHaveClass('h-10');
      expect(iconSkeleton).toHaveClass('w-10');
      expect(iconSkeleton).toHaveClass('rounded-xl');
    });

    it('should render title skeleton with correct dimensions', () => {
      render(<PluginCardSkeleton />);

      const skeletons = screen.getAllByTestId('skeleton');
      const titleSkeleton = skeletons[1];

      expect(titleSkeleton).toHaveClass('h-4');
      expect(titleSkeleton).toHaveClass('w-3/4');
    });

    it('should render badge skeleton with correct dimensions', () => {
      render(<PluginCardSkeleton />);

      const skeletons = screen.getAllByTestId('skeleton');
      const badgeSkeleton = skeletons[2];

      expect(badgeSkeleton).toHaveClass('h-5');
      expect(badgeSkeleton).toHaveClass('w-20');
    });

    it('should render version skeleton with correct dimensions', () => {
      render(<PluginCardSkeleton />);

      const skeletons = screen.getAllByTestId('skeleton');
      const versionSkeleton = skeletons[3];

      expect(versionSkeleton).toHaveClass('h-4');
      expect(versionSkeleton).toHaveClass('w-12');
    });
  });

  describe('Description Section Skeletons', () => {
    it('should render first description line with full width', () => {
      render(<PluginCardSkeleton />);

      const skeletons = screen.getAllByTestId('skeleton');
      const firstLine = skeletons[4];

      expect(firstLine).toHaveClass('h-4');
      expect(firstLine).toHaveClass('w-full');
    });

    it('should render second description line with 5/6 width', () => {
      render(<PluginCardSkeleton />);

      const skeletons = screen.getAllByTestId('skeleton');
      const secondLine = skeletons[5];

      expect(secondLine).toHaveClass('h-4');
      expect(secondLine).toHaveClass('w-5/6');
    });

    it('should render third description line with 2/3 width', () => {
      render(<PluginCardSkeleton />);

      const skeletons = screen.getAllByTestId('skeleton');
      const thirdLine = skeletons[6];

      expect(thirdLine).toHaveClass('h-4');
      expect(thirdLine).toHaveClass('w-2/3');
    });

    it('should render all three description lines', () => {
      render(<PluginCardSkeleton />);

      const skeletons = screen.getAllByTestId('skeleton');
      const descriptionSkeletons = [skeletons[4], skeletons[5], skeletons[6]];

      // All should be height 4
      descriptionSkeletons.forEach(skeleton => {
        expect(skeleton).toHaveClass('h-4');
      });

      // Different widths for visual variety
      expect(descriptionSkeletons[0]).toHaveClass('w-full');
      expect(descriptionSkeletons[1]).toHaveClass('w-5/6');
      expect(descriptionSkeletons[2]).toHaveClass('w-2/3');
    });
  });

  describe('Footer Section Skeletons', () => {
    it('should render author skeleton with correct dimensions', () => {
      render(<PluginCardSkeleton />);

      const skeletons = screen.getAllByTestId('skeleton');
      const authorSkeleton = skeletons[7];

      expect(authorSkeleton).toHaveClass('h-4');
      expect(authorSkeleton).toHaveClass('w-32');
    });

    it('should render button skeleton with correct dimensions', () => {
      render(<PluginCardSkeleton />);

      const skeletons = screen.getAllByTestId('skeleton');
      const buttonSkeleton = skeletons[8];

      expect(buttonSkeleton).toHaveClass('h-8');
      expect(buttonSkeleton).toHaveClass('w-16');
    });
  });

  describe('Layout Structure', () => {
    it('should have header section with flex layout', () => {
      const { container } = render(<PluginCardSkeleton />);

      const headerSection = container.querySelector('.flex.items-start.gap-3.mb-3');
      expect(headerSection).toBeInTheDocument();
    });

    it('should have title container with flex-1 and spacing', () => {
      const { container } = render(<PluginCardSkeleton />);

      const titleContainer = container.querySelector('.flex-1.space-y-2');
      expect(titleContainer).toBeInTheDocument();
    });

    it('should have badge/version container with flex layout', () => {
      const { container } = render(<PluginCardSkeleton />);

      const badgeContainer = container.querySelector('.flex.items-center.gap-2');
      expect(badgeContainer).toBeInTheDocument();
    });

    it('should have description section with vertical spacing', () => {
      const { container } = render(<PluginCardSkeleton />);

      const descSection = container.querySelector('.space-y-2.mb-4');
      expect(descSection).toBeInTheDocument();
    });

    it('should have footer section with flex layout', () => {
      const { container } = render(<PluginCardSkeleton />);

      const footerSection = container.querySelector('.flex.items-center.justify-between.pt-2');
      expect(footerSection).toBeInTheDocument();
    });
  });

  describe('Visual Hierarchy', () => {
    it('should have correct DOM structure for header section', () => {
      const { container } = render(<PluginCardSkeleton />);

      const headerSection = container.querySelector('.flex.items-start.gap-3');
      expect(headerSection).toBeInTheDocument();

      // Should have icon and title container as children
      const children = headerSection?.children;
      expect(children).toHaveLength(2);
    });

    it('should have description lines as siblings', () => {
      const { container } = render(<PluginCardSkeleton />);

      const descSection = container.querySelector('.space-y-2.mb-4');
      const children = descSection?.children;

      // Should have 3 description line skeletons
      expect(children).toHaveLength(3);
    });

    it('should have footer elements as siblings', () => {
      const { container } = render(<PluginCardSkeleton />);

      const footerSection = container.querySelector('.flex.items-center.justify-between');
      const children = footerSection?.children;

      // Should have author and button skeletons
      expect(children).toHaveLength(2);
    });

    it('should render sections in correct order', () => {
      const { container } = render(<PluginCardSkeleton />);

      const cardContent = screen.getByTestId('card-content');
      const sections = Array.from(cardContent.children);

      // First child should be header section
      expect(sections[0]).toHaveClass('flex');
      expect(sections[0]).toHaveClass('items-start');

      // Second child should be description section
      expect(sections[1]).toHaveClass('space-y-2');
      expect(sections[1]).toHaveClass('mb-4');

      // Third child should be footer section
      expect(sections[2]).toHaveClass('flex');
      expect(sections[2]).toHaveClass('justify-between');
    });
  });

  describe('Spacing and Margins', () => {
    it('should apply bottom margin to header section', () => {
      const { container } = render(<PluginCardSkeleton />);

      const headerSection = container.querySelector('.mb-3');
      expect(headerSection).toBeInTheDocument();
    });

    it('should apply bottom margin to description section', () => {
      const { container } = render(<PluginCardSkeleton />);

      const descSection = container.querySelector('.mb-4');
      expect(descSection).toBeInTheDocument();
    });

    it('should apply top padding to footer section', () => {
      const { container } = render(<PluginCardSkeleton />);

      const footerSection = container.querySelector('.pt-2');
      expect(footerSection).toBeInTheDocument();
    });

    it('should apply gap between header elements', () => {
      const { container } = render(<PluginCardSkeleton />);

      const headerSection = container.querySelector('.gap-3');
      expect(headerSection).toBeInTheDocument();
    });

    it('should apply gap between badge and version', () => {
      const { container } = render(<PluginCardSkeleton />);

      const badgeContainer = container.querySelector('.flex.items-center.gap-2');
      expect(badgeContainer).toBeInTheDocument();
    });

    it('should apply vertical spacing to description lines', () => {
      const { container } = render(<PluginCardSkeleton />);

      const descSection = container.querySelector('.space-y-2');
      expect(descSection).toBeInTheDocument();
    });

    it('should apply vertical spacing to title area', () => {
      const { container } = render(<PluginCardSkeleton />);

      const titleContainer = container.querySelector('.flex-1.space-y-2');
      expect(titleContainer).toBeInTheDocument();
    });
  });

  describe('Component Isolation', () => {
    it('should render independently without props', () => {
      const { container } = render(<PluginCardSkeleton />);

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should be reusable and render multiple instances', () => {
      render(
        <>
          <PluginCardSkeleton />
          <PluginCardSkeleton />
          <PluginCardSkeleton />
        </>
      );

      const cards = screen.getAllByTestId('card');
      expect(cards).toHaveLength(3);

      const skeletons = screen.getAllByTestId('skeleton');
      // Each skeleton has 9 elements, so 3 instances = 27 total
      expect(skeletons).toHaveLength(27);
    });

    it('should not accept any props', () => {
      // PluginCardSkeleton has no props interface
      // This test verifies it renders without requiring props
      expect(() => render(<PluginCardSkeleton />)).not.toThrow();
    });
  });

  describe('Skeleton Pattern Consistency', () => {
    it('should use consistent height for text skeletons', () => {
      render(<PluginCardSkeleton />);

      const skeletons = screen.getAllByTestId('skeleton');
      
      // Title, version, description lines (3), and author should all be h-4
      const textSkeletons = [
        skeletons[1], // title
        skeletons[3], // version
        skeletons[4], // desc line 1
        skeletons[5], // desc line 2
        skeletons[6], // desc line 3
        skeletons[7], // author
      ];

      textSkeletons.forEach(skeleton => {
        expect(skeleton).toHaveClass('h-4');
      });
    });

    it('should have icon skeleton larger than text skeletons', () => {
      render(<PluginCardSkeleton />);

      const skeletons = screen.getAllByTestId('skeleton');
      const iconSkeleton = skeletons[0];

      // Icon should be h-10 (larger than h-4 text skeletons)
      expect(iconSkeleton).toHaveClass('h-10');
    });

    it('should have badge skeleton taller than text skeletons', () => {
      render(<PluginCardSkeleton />);

      const skeletons = screen.getAllByTestId('skeleton');
      const badgeSkeleton = skeletons[2];

      // Badge should be h-5 (slightly larger than h-4 text)
      expect(badgeSkeleton).toHaveClass('h-5');
    });

    it('should have button skeleton tallest in footer', () => {
      render(<PluginCardSkeleton />);

      const skeletons = screen.getAllByTestId('skeleton');
      const buttonSkeleton = skeletons[8];

      // Button should be h-8 (tallest element)
      expect(buttonSkeleton).toHaveClass('h-8');
    });
  });

  describe('Accessibility', () => {
    it('should render as semantic div elements', () => {
      const { container } = render(<PluginCardSkeleton />);

      const mainContainer = container.firstChild;
      expect(mainContainer?.nodeName).toBe('DIV');
    });

    it('should not contain any interactive elements', () => {
      const { container } = render(<PluginCardSkeleton />);

      const buttons = container.querySelectorAll('button');
      const links = container.querySelectorAll('a');
      const inputs = container.querySelectorAll('input');

      expect(buttons).toHaveLength(0);
      expect(links).toHaveLength(0);
      expect(inputs).toHaveLength(0);
    });

    it('should be purely presentational', () => {
      const { container } = render(<PluginCardSkeleton />);

      // Should not have any event handlers or interactive attributes
      const allElements = container.querySelectorAll('*');
      allElements.forEach(element => {
        expect(element.getAttribute('onclick')).toBeNull();
        expect(element.getAttribute('onchange')).toBeNull();
        expect(element.getAttribute('role')).toBeNull();
      });
    });
  });

  describe('Visual Design Intent', () => {
    it('should create visual hierarchy with varying widths', () => {
      render(<PluginCardSkeleton />);

      const skeletons = screen.getAllByTestId('skeleton');

      // Description lines should have decreasing widths for natural look
      expect(skeletons[4]).toHaveClass('w-full');   // 100%
      expect(skeletons[5]).toHaveClass('w-5/6');    // ~83%
      expect(skeletons[6]).toHaveClass('w-2/3');    // ~66%
    });

    it('should match plugin card layout proportions', () => {
      render(<PluginCardSkeleton />);

      const skeletons = screen.getAllByTestId('skeleton');

      // Icon should be square
      expect(skeletons[0]).toHaveClass('h-10');
      expect(skeletons[0]).toHaveClass('w-10');

      // Title should take most of the width
      expect(skeletons[1]).toHaveClass('w-3/4');

      // Badge should be small and fixed
      expect(skeletons[2]).toHaveClass('w-20');

      // Author should be medium-sized
      expect(skeletons[7]).toHaveClass('w-32');

      // Button should be small
      expect(skeletons[8]).toHaveClass('w-16');
    });

    it('should use rounded corners for icon skeleton', () => {
      render(<PluginCardSkeleton />);

      const skeletons = screen.getAllByTestId('skeleton');
      const iconSkeleton = skeletons[0];

      // Icon should have rounded corners to match actual plugin card icon
      expect(iconSkeleton).toHaveClass('rounded-xl');
    });
  });

  describe('Edge Cases', () => {
    it('should render correctly when wrapped in additional containers', () => {
      const { container } = render(
        <div>
          <div>
            <PluginCardSkeleton />
          </div>
        </div>
      );

      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons).toHaveLength(9);
    });

    it('should render correctly in a grid layout', () => {
      const { container } = render(
        <div className="grid grid-cols-3 gap-4">
          <PluginCardSkeleton />
          <PluginCardSkeleton />
          <PluginCardSkeleton />
        </div>
      );

      const cards = screen.getAllByTestId('card');
      expect(cards).toHaveLength(3);

      // Each card should maintain its full height
      cards.forEach(card => {
        expect(card).toHaveClass('h-full');
      });
    });
  });

  describe('Snapshot', () => {
    it('should match snapshot', () => {
      const { container } = render(<PluginCardSkeleton />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot for multiple instances', () => {
      const { container } = render(
        <div className="grid">
          <PluginCardSkeleton />
          <PluginCardSkeleton />
        </div>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});