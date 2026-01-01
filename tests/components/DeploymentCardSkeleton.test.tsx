import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DeploymentCardSkeleton } from '@/components/AILaunchpad/DeploymentCardSkeleton';

describe('DeploymentCardSkeleton', () => {
  describe('Rendering and Structure', () => {
    it('should render the card component', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      const card = container.querySelector('.deployment-card');
      expect(card).toBeInTheDocument();
    });

    it('should render card with correct border styling', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      const card = container.querySelector('.deployment-card');
      expect(card).toHaveClass('border-l-4', 'border-l-muted');
    });

    it('should have hover shadow transition', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      const card = container.querySelector('.deployment-card');
      expect(card).toHaveClass('hover:shadow-lg', 'transition-shadow');
    });

    it('should have flex layout', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      const card = container.querySelector('.deployment-card');
      expect(card).toHaveClass('flex', 'flex-col', 'w-full');
    });

    it('should render all skeleton elements', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Card Header Section', () => {
    it('should render card header', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      const header = container.querySelector('.pb-4');
      expect(header).toBeInTheDocument();
    });

    it('should render header skeleton elements', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      const header = container.querySelector('.pb-4');
      const skeletons = header?.querySelectorAll('[class*="animate-pulse"]');
      
      expect(skeletons?.length).toBeGreaterThan(0);
    });

    it('should have flex layout in header', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      const headerFlex = container.querySelector('.flex.items-start.justify-between');
      expect(headerFlex).toBeInTheDocument();
    });

    it('should render title skeleton with correct width', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      const titleSkeleton = container.querySelector('.h-5.w-3\\/4');
      expect(titleSkeleton).toBeInTheDocument();
    });

    it('should render subtitle skeleton with correct width', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      const subtitleSkeleton = container.querySelector('.h-4.w-1\\/2');
      expect(subtitleSkeleton).toBeInTheDocument();
    });

    it('should render badge skeleton', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      const badgeSkeleton = container.querySelector('.h-6.w-16.rounded-full');
      expect(badgeSkeleton).toBeInTheDocument();
    });

    it('should have spacing in header content', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      const headerContent = container.querySelector('.flex-1.space-y-2');
      expect(headerContent).toBeInTheDocument();
    });
  });

  describe('Card Content Section', () => {
    it('should render card content', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      const content = container.querySelector('.space-y-6.flex-1');
      expect(content).toBeInTheDocument();
    });

    it('should have vertical spacing in content', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      const content = container.querySelector('.space-y-6');
      expect(content).toBeInTheDocument();
    });

    it('should render multiple content sections', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      const content = container.querySelector('.space-y-6.flex-1');
      const sections = content?.querySelectorAll('.space-y-3');
      
      expect(sections?.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Model Configuration Section', () => {
    it('should render model configuration section', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      const sections = container.querySelectorAll('.space-y-3');
      expect(sections.length).toBeGreaterThan(0);
    });

    it('should render section title skeleton', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      const sectionTitle = container.querySelector('.h-4.w-1\\/3');
      expect(sectionTitle).toBeInTheDocument();
    });

    it('should render model config content skeletons', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      const fullWidthSkeleton = container.querySelector('.h-3.w-full');
      const partialWidthSkeleton = container.querySelector('.h-3.w-2\\/3');
      
      expect(fullWidthSkeleton).toBeInTheDocument();
      expect(partialWidthSkeleton).toBeInTheDocument();
    });

    it('should have nested spacing in model config', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      const sections = container.querySelectorAll('.space-y-3');
      const firstSection = sections[0];
      const nestedSpace = firstSection?.querySelector('.space-y-2');
      
      expect(nestedSpace).toBeInTheDocument();
    });
  });

  describe('Timeline Section', () => {
    it('should render timeline section title', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      const timelineTitle = container.querySelector('.h-4.w-1\\/4');
      expect(timelineTitle).toBeInTheDocument();
    });

    it('should render timeline content skeletons', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      const wideTimeline = container.querySelector('.h-3.w-3\\/4');
      const narrowTimeline = container.querySelector('.h-3.w-1\\/2');
      
      expect(wideTimeline).toBeInTheDocument();
      expect(narrowTimeline).toBeInTheDocument();
    });

    it('should have spacing in timeline content', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      const sections = container.querySelectorAll('.space-y-3');
      expect(sections.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Endpoint Section', () => {
    it('should render endpoint section', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      const sections = container.querySelectorAll('.space-y-3');
      expect(sections.length).toBeGreaterThanOrEqual(3);
    });

    it('should render endpoint input skeleton', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      const endpointInput = container.querySelector('.h-8.flex-1');
      expect(endpointInput).toBeInTheDocument();
    });

    it('should render endpoint action button skeleton', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      const actionButton = container.querySelector('.h-8.w-8');
      expect(actionButton).toBeInTheDocument();
    });

    it('should have flex layout for endpoint elements', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      const endpointFlex = container.querySelector('.flex.items-center.space-x-2');
      expect(endpointFlex).toBeInTheDocument();
    });
  });

  describe('Actions Section', () => {
    it('should render actions section at bottom', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      const actionsSection = container.querySelector('.p-6.pt-0.mt-auto');
      expect(actionsSection).toBeInTheDocument();
    });

    it('should have correct padding in actions section', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      const actionsSection = container.querySelector('.p-6.pt-0');
      expect(actionsSection).toBeInTheDocument();
    });

    it('should render action buttons with gap', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      const buttonContainer = container.querySelector('.flex.gap-2');
      expect(buttonContainer).toBeInTheDocument();
    });

    it('should render two action button skeletons', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      const buttonContainer = container.querySelector('.flex.gap-2');
      const buttonSkeletons = buttonContainer?.querySelectorAll('.h-9.w-20');
      
      expect(buttonSkeletons?.length).toBe(2);
    });

    it('should render action buttons with correct size', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      const buttonSkeletons = container.querySelectorAll('.h-9.w-20');
      expect(buttonSkeletons.length).toBe(2);
    });

    it('should pin actions to bottom with mt-auto', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      const actionsSection = container.querySelector('.mt-auto');
      expect(actionsSection).toBeInTheDocument();
    });
  });

  describe('Skeleton Elements Sizing', () => {
    it('should render skeletons with various heights', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      expect(container.querySelector('.h-3')).toBeInTheDocument();
      expect(container.querySelector('.h-4')).toBeInTheDocument();
      expect(container.querySelector('.h-5')).toBeInTheDocument();
      expect(container.querySelector('.h-6')).toBeInTheDocument();
      expect(container.querySelector('.h-8')).toBeInTheDocument();
      expect(container.querySelector('.h-9')).toBeInTheDocument();
    });

    it('should render skeletons with various widths', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      expect(container.querySelector('.w-1\\/4')).toBeInTheDocument();
      expect(container.querySelector('.w-1\\/3')).toBeInTheDocument();
      expect(container.querySelector('.w-1\\/2')).toBeInTheDocument();
      expect(container.querySelector('.w-2\\/3')).toBeInTheDocument();
      expect(container.querySelector('.w-3\\/4')).toBeInTheDocument();
      expect(container.querySelector('.w-full')).toBeInTheDocument();
    });

    it('should render fixed width skeletons', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      expect(container.querySelector('.w-8')).toBeInTheDocument();
      expect(container.querySelector('.w-16')).toBeInTheDocument();
      expect(container.querySelector('.w-20')).toBeInTheDocument();
    });

    it('should render rounded full skeleton for badge', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      const roundedSkeleton = container.querySelector('.rounded-full');
      expect(roundedSkeleton).toBeInTheDocument();
    });
  });

  describe('Layout and Spacing', () => {
    it('should use space-y-2 for small spacing', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      const smallSpacing = container.querySelectorAll('.space-y-2');
      expect(smallSpacing.length).toBeGreaterThan(0);
    });

    it('should use space-y-3 for medium spacing', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      const mediumSpacing = container.querySelectorAll('.space-y-3');
      expect(mediumSpacing.length).toBeGreaterThan(0);
    });

    it('should use space-y-6 for large spacing', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      const largeSpacing = container.querySelector('.space-y-6');
      expect(largeSpacing).toBeInTheDocument();
    });

    it('should use space-x-2 for horizontal spacing', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      const horizontalSpacing = container.querySelector('.space-x-2');
      expect(horizontalSpacing).toBeInTheDocument();
    });

    it('should use flex-1 for flexible content', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      const flexItems = container.querySelectorAll('.flex-1');
      expect(flexItems.length).toBeGreaterThan(0);
    });

    it('should use gap-2 for action buttons', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      const gapContainer = container.querySelector('.gap-2');
      expect(gapContainer).toBeInTheDocument();
    });
  });

  describe('Complete Structure', () => {
    it('should render all main sections', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      // Header
      expect(container.querySelector('.pb-4')).toBeInTheDocument();
      
      // Content
      expect(container.querySelector('.space-y-6.flex-1')).toBeInTheDocument();
      
      // Actions
      expect(container.querySelector('.p-6.pt-0.mt-auto')).toBeInTheDocument();
    });

    it('should maintain hierarchical structure', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      const card = container.querySelector('.deployment-card');
      const header = card?.querySelector('.pb-4');
      const content = card?.querySelector('.space-y-6.flex-1');
      const actions = card?.querySelector('.p-6.pt-0.mt-auto');

      expect(card).toBeInTheDocument();
      expect(header).toBeInTheDocument();
      expect(content).toBeInTheDocument();
      expect(actions).toBeInTheDocument();
    });

    it('should render minimum expected number of skeletons', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
      
      // Should have at least:
      // Header: 3 (title, subtitle, badge)
      // Model config: 3 (title, 2 content)
      // Timeline: 3 (title, 2 content)
      // Endpoint: 3 (title, input, button)
      // Actions: 2 (2 buttons)
      // Total minimum: 14
      expect(skeletons.length).toBeGreaterThanOrEqual(14);
    });
  });

  describe('Visual Consistency', () => {
    it('should use consistent section title heights', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      const sectionTitles = [
        container.querySelector('.h-4.w-1\\/3'),
        container.querySelector('.h-4.w-1\\/4'),
      ];

      sectionTitles.forEach((title) => {
        expect(title).toBeInTheDocument();
        expect(title).toHaveClass('h-4');
      });
    });

    it('should use consistent content line heights', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      const contentLines = container.querySelectorAll('.h-3');
      expect(contentLines.length).toBeGreaterThan(0);
    });

    it('should use consistent button heights in actions', () => {
      const { container } = render(<DeploymentCardSkeleton />);

      const actionButtons = container.querySelectorAll('.h-9.w-20');
      expect(actionButtons.length).toBe(2);
      
      actionButtons.forEach((button) => {
        expect(button).toHaveClass('h-9');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should render without errors', () => {
      expect(() => render(<DeploymentCardSkeleton />)).not.toThrow();
    });

    it('should render as a standalone component', () => {
      const { container } = render(<DeploymentCardSkeleton />);
      
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render multiple instances independently', () => {
      const { container } = render(
        <>
          <DeploymentCardSkeleton />
          <DeploymentCardSkeleton />
          <DeploymentCardSkeleton />
        </>
      );

      const cards = container.querySelectorAll('.deployment-card');
      expect(cards.length).toBe(3);
    });

    it('should maintain structure in different containers', () => {
      const { container } = render(
        <div className="grid gap-4">
          <DeploymentCardSkeleton />
        </div>
      );

      const card = container.querySelector('.deployment-card');
      expect(card).toBeInTheDocument();
    });
  });
});