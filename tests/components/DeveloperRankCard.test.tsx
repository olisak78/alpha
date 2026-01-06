import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DeveloperRankCard from '@/components/DeveloperRankCard';

describe('DeveloperRankCard', () => {
  describe('Rendering and UI', () => {
    it('should render the card with correct title', () => {
      render(
        <DeveloperRankCard 
          rank={5}
          score={75.5}
          distanceToFirst={10.3}
        />
      );

      expect(screen.getByText('My Rank (Team)')).toBeInTheDocument();
    });

    it('should render all required elements', () => {
      render(
        <DeveloperRankCard 
          rank={3}
          score={85.2}
          distanceToFirst={5.7}
        />
      );

      expect(screen.getByText('My Rank (Team)')).toBeInTheDocument();
      expect(screen.getByText('Rank')).toBeInTheDocument();
      expect(screen.getByText('#3')).toBeInTheDocument();
      expect(screen.getByText('Score: 85.2 / 100')).toBeInTheDocument();
      expect(screen.getByText('Distance to #1: 5.7 pts')).toBeInTheDocument();
    });

    it('should render trophy icon', () => {
      const { container } = render(
        <DeveloperRankCard 
          rank={1}
          score={100}
          distanceToFirst={0}
        />
      );

      // Trophy icon should be present
      const trophyIcon = container.querySelector('svg');
      expect(trophyIcon).toBeInTheDocument();
    });

    it('should have correct card structure', () => {
      render(
        <DeveloperRankCard 
          rank={2}
          score={90}
          distanceToFirst={2.5}
        />
      );

      // Should have card header with title
      const title = screen.getByText('My Rank (Team)');
      expect(title).toBeInTheDocument();
      
      // Should have content section
      const rankLabel = screen.getByText('Rank');
      expect(rankLabel).toBeInTheDocument();
    });
  });

  describe('Rank Display', () => {
    it('should display rank 1 correctly', () => {
      render(
        <DeveloperRankCard 
          rank={1}
          score={100}
          distanceToFirst={0}
        />
      );

      expect(screen.getByText('#1')).toBeInTheDocument();
    });

    it('should display rank with # prefix', () => {
      render(
        <DeveloperRankCard 
          rank={42}
          score={60}
          distanceToFirst={15.5}
        />
      );

      expect(screen.getByText('#42')).toBeInTheDocument();
    });

    it('should display double-digit ranks correctly', () => {
      render(
        <DeveloperRankCard 
          rank={15}
          score={70.5}
          distanceToFirst={12.3}
        />
      );

      expect(screen.getByText('#15')).toBeInTheDocument();
    });

    it('should display triple-digit ranks correctly', () => {
      render(
        <DeveloperRankCard 
          rank={123}
          score={45.2}
          distanceToFirst={55.8}
        />
      );

      expect(screen.getByText('#123')).toBeInTheDocument();
    });
  });

  describe('Score Formatting', () => {
    it('should format score with 1 decimal place', () => {
      render(
        <DeveloperRankCard 
          rank={5}
          score={75.567}
          distanceToFirst={10}
        />
      );

      expect(screen.getByText('Score: 75.6 / 100')).toBeInTheDocument();
    });

    it('should format whole number scores with .0', () => {
      render(
        <DeveloperRankCard 
          rank={1}
          score={100}
          distanceToFirst={0}
        />
      );

      expect(screen.getByText('Score: 100.0 / 100')).toBeInTheDocument();
    });

    it('should round score to 1 decimal place', () => {
      render(
        <DeveloperRankCard 
          rank={3}
          score={85.24}
          distanceToFirst={5}
        />
      );

      expect(screen.getByText('Score: 85.2 / 100')).toBeInTheDocument();
    });

    it('should round up when appropriate', () => {
      render(
        <DeveloperRankCard 
          rank={4}
          score={85.96}
          distanceToFirst={3.2}
        />
      );

      expect(screen.getByText('Score: 86.0 / 100')).toBeInTheDocument();
    });

    it('should display low scores correctly', () => {
      render(
        <DeveloperRankCard 
          rank={50}
          score={10.5}
          distanceToFirst={89.5}
        />
      );

      expect(screen.getByText('Score: 10.5 / 100')).toBeInTheDocument();
    });

    it('should display zero score correctly', () => {
      render(
        <DeveloperRankCard 
          rank={100}
          score={0}
          distanceToFirst={100}
        />
      );

      expect(screen.getByText('Score: 0.0 / 100')).toBeInTheDocument();
    });
  });

  describe('Distance to First Place Formatting', () => {
    it('should format distance with 1 decimal place', () => {
      render(
        <DeveloperRankCard 
          rank={5}
          score={75}
          distanceToFirst={10.567}
        />
      );

      expect(screen.getByText('Distance to #1: 10.6 pts')).toBeInTheDocument();
    });

    it('should display zero distance when rank is 1', () => {
      render(
        <DeveloperRankCard 
          rank={1}
          score={100}
          distanceToFirst={0}
        />
      );

      expect(screen.getByText('Distance to #1: 0.0 pts')).toBeInTheDocument();
    });

    it('should format whole number distances with .0', () => {
      render(
        <DeveloperRankCard 
          rank={3}
          score={85}
          distanceToFirst={15}
        />
      );

      expect(screen.getByText('Distance to #1: 15.0 pts')).toBeInTheDocument();
    });

    it('should round distance to 1 decimal place', () => {
      render(
        <DeveloperRankCard 
          rank={10}
          score={60}
          distanceToFirst={25.44}
        />
      );

      expect(screen.getByText('Distance to #1: 25.4 pts')).toBeInTheDocument();
    });

    it('should round up distance when appropriate', () => {
      render(
        <DeveloperRankCard 
          rank={8}
          score={65}
          distanceToFirst={20.96}
        />
      );

      expect(screen.getByText('Distance to #1: 21.0 pts')).toBeInTheDocument();
    });

    it('should display large distances correctly', () => {
      render(
        <DeveloperRankCard 
          rank={50}
          score={10}
          distanceToFirst={89.5}
        />
      );

      expect(screen.getByText('Distance to #1: 89.5 pts')).toBeInTheDocument();
    });

    it('should display small distances correctly', () => {
      render(
        <DeveloperRankCard 
          rank={2}
          score={99.5}
          distanceToFirst={0.5}
        />
      );

      expect(screen.getByText('Distance to #1: 0.5 pts')).toBeInTheDocument();
    });
  });

  describe('Edge Cases and Boundary Values', () => {
    it('should handle rank 1 with perfect score', () => {
      render(
        <DeveloperRankCard 
          rank={1}
          score={100}
          distanceToFirst={0}
        />
      );

      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('Score: 100.0 / 100')).toBeInTheDocument();
      expect(screen.getByText('Distance to #1: 0.0 pts')).toBeInTheDocument();
    });

    it('should handle very low rank with low score', () => {
      render(
        <DeveloperRankCard 
          rank={999}
          score={1.2}
          distanceToFirst={98.8}
        />
      );

      expect(screen.getByText('#999')).toBeInTheDocument();
      expect(screen.getByText('Score: 1.2 / 100')).toBeInTheDocument();
      expect(screen.getByText('Distance to #1: 98.8 pts')).toBeInTheDocument();
    });

    it('should handle decimal rank values (though typically integer)', () => {
      render(
        <DeveloperRankCard 
          rank={5.7}
          score={75}
          distanceToFirst={10}
        />
      );

      // Should still display even with decimal (JavaScript will handle it)
      expect(screen.getByText('#5.7')).toBeInTheDocument();
    });

    it('should handle very precise decimal values', () => {
      render(
        <DeveloperRankCard 
          rank={3}
          score={85.123456789}
          distanceToFirst={5.987654321}
        />
      );

      expect(screen.getByText('Score: 85.1 / 100')).toBeInTheDocument();
      expect(screen.getByText('Distance to #1: 6.0 pts')).toBeInTheDocument();
    });

    it('should handle negative distance (edge case that should not happen)', () => {
      render(
        <DeveloperRankCard 
          rank={1}
          score={100}
          distanceToFirst={-5}
        />
      );

      expect(screen.getByText('Distance to #1: -5.0 pts')).toBeInTheDocument();
    });
  });

  describe('Multiple Instances', () => {
    it('should render multiple cards with different values independently', () => {
      const { rerender } = render(
        <DeveloperRankCard 
          rank={1}
          score={100}
          distanceToFirst={0}
        />
      );

      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('Score: 100.0 / 100')).toBeInTheDocument();

      rerender(
        <DeveloperRankCard 
          rank={5}
          score={75.5}
          distanceToFirst={24.5}
        />
      );

      expect(screen.getByText('#5')).toBeInTheDocument();
      expect(screen.getByText('Score: 75.5 / 100')).toBeInTheDocument();
      expect(screen.getByText('Distance to #1: 24.5 pts')).toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    it('should render with proper text styling classes', () => {
      const { container } = render(
        <DeveloperRankCard 
          rank={3}
          score={85}
          distanceToFirst={5}
        />
      );

      // Check for rank display (should be large and bold)
      const rankElement = screen.getByText('#3');
      expect(rankElement).toHaveClass('text-lg', 'font-semibold');
    });

    it('should render score with muted styling', () => {
      const { container } = render(
        <DeveloperRankCard 
          rank={3}
          score={85}
          distanceToFirst={5}
        />
      );

      const scoreElement = screen.getByText('Score: 85.0 / 100');
      expect(scoreElement).toHaveClass('text-sm', 'text-muted-foreground');
    });

    it('should render distance with muted styling', () => {
      const { container } = render(
        <DeveloperRankCard 
          rank={3}
          score={85}
          distanceToFirst={5}
        />
      );

      const distanceElement = screen.getByText('Distance to #1: 5.0 pts');
      expect(distanceElement).toHaveClass('text-xs', 'text-muted-foreground');
    });

    it('should render card title with correct styling', () => {
      render(
        <DeveloperRankCard 
          rank={3}
          score={85}
          distanceToFirst={5}
        />
      );

      const titleElement = screen.getByText('My Rank (Team)');
      expect(titleElement).toHaveClass('text-base');
    });
  });

  describe('Accessibility', () => {
    it('should have semantic HTML structure', () => {
      const { container } = render(
        <DeveloperRankCard 
          rank={3}
          score={85}
          distanceToFirst={5}
        />
      );

      // Should be wrapped in appropriate semantic elements
      expect(container.querySelector('[role="group"]') || container.querySelector('div')).toBeInTheDocument();
    });

    it('should display all information in readable text format', () => {
      render(
        <DeveloperRankCard 
          rank={3}
          score={85.5}
          distanceToFirst={10.2}
        />
      );

      // All key information should be accessible as text
      expect(screen.getByText('My Rank (Team)')).toBeInTheDocument();
      expect(screen.getByText('Rank')).toBeInTheDocument();
      expect(screen.getByText('#3')).toBeInTheDocument();
      expect(screen.getByText('Score: 85.5 / 100')).toBeInTheDocument();
      expect(screen.getByText('Distance to #1: 10.2 pts')).toBeInTheDocument();
    });
  });

  describe('Real-World Scenarios', () => {
    it('should display typical second place ranking', () => {
      render(
        <DeveloperRankCard 
          rank={2}
          score={95.3}
          distanceToFirst={4.7}
        />
      );

      expect(screen.getByText('#2')).toBeInTheDocument();
      expect(screen.getByText('Score: 95.3 / 100')).toBeInTheDocument();
      expect(screen.getByText('Distance to #1: 4.7 pts')).toBeInTheDocument();
    });

    it('should display mid-range ranking', () => {
      render(
        <DeveloperRankCard 
          rank={15}
          score={68.9}
          distanceToFirst={31.1}
        />
      );

      expect(screen.getByText('#15')).toBeInTheDocument();
      expect(screen.getByText('Score: 68.9 / 100')).toBeInTheDocument();
      expect(screen.getByText('Distance to #1: 31.1 pts')).toBeInTheDocument();
    });

    it('should display lower ranking', () => {
      render(
        <DeveloperRankCard 
          rank={47}
          score={42.6}
          distanceToFirst={57.4}
        />
      );

      expect(screen.getByText('#47')).toBeInTheDocument();
      expect(screen.getByText('Score: 42.6 / 100')).toBeInTheDocument();
      expect(screen.getByText('Distance to #1: 57.4 pts')).toBeInTheDocument();
    });

    it('should display close race scenario (small distance)', () => {
      render(
        <DeveloperRankCard 
          rank={3}
          score={98.8}
          distanceToFirst={1.2}
        />
      );

      expect(screen.getByText('#3')).toBeInTheDocument();
      expect(screen.getByText('Score: 98.8 / 100')).toBeInTheDocument();
      expect(screen.getByText('Distance to #1: 1.2 pts')).toBeInTheDocument();
    });
  });
});