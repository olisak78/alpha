import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { TeamHeader } from '../../../src/components/Team/TeamHeader';

/**
 * TeamHeader Component Tests
 * 
 * Tests for the TeamHeader component which displays the team name
 * with automatic "Team " prefix handling.
 */

describe('TeamHeader', () => {
  // ============================================================================
  // BASIC RENDERING AND STRUCTURE TESTS
  // ============================================================================

  describe('Basic Rendering and Structure', () => {
    it('should render header with correct structure and CSS classes', () => {
      render(<TeamHeader teamName="Development" />);

      const header = screen.getByRole('banner');
      const heading = screen.getByRole('heading', { level: 1 });

      // Structure
      expect(header).toBeInTheDocument();
      expect(heading).toBeInTheDocument();
      expect(header).toContainElement(heading);
      expect(header.children).toHaveLength(1);

      // CSS classes
      expect(header).toHaveClass('pl-2', 'pt-2', 'flex', 'items-center', 'justify-between');
      expect(heading).toHaveClass('text-2xl', 'font-bold');
      expect(heading.tagName).toBe('H1');
    });
  });

  // ============================================================================
  // TEAM NAME FORMATTING TESTS
  // ============================================================================

  describe('Team Name Formatting', () => {
    it('should handle team name prefix logic correctly', () => {
      const testCases = [
        { input: 'Development', expected: 'Team Development' },
        { input: 'Team Development', expected: 'Team Development' },
        { input: 'team development', expected: 'Team team development' },
        { input: 'TEAM Development', expected: 'Team TEAM Development' },
        { input: 'TeamDevelopment', expected: 'Team TeamDevelopment' },
        { input: 'Alpha Team Beta', expected: 'Team Alpha Team Beta' },
        { input: 'Team', expected: 'Team Team' },
        { input: 'Teams United', expected: 'Team Teams United' },
      ];

      testCases.forEach(({ input, expected }) => {
        const { unmount } = render(<TeamHeader teamName={input} />);
        
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toHaveTextContent(expected);
        
        unmount();
      });
    });
  });

  // ============================================================================
  // EDGE CASES AND SPECIAL HANDLING
  // ============================================================================

  describe('Edge Cases and Special Handling', () => {
    it('should handle various edge cases and special characters', () => {
      const testCases = [
        { input: '', expected: 'Team' },
        { input: "O'Brien & Co.", expected: "Team O'Brien & Co." },
        { input: 'Alpha-1', expected: 'Team Alpha-1' },
        { input: 'Rocket 🚀', expected: 'Team Rocket 🚀' },
        { input: 'Développement', expected: 'Team Développement' },
        { input: "<script>alert('test')</script>", expected: "Team <script>alert('test')</script>" },
      ];

      testCases.forEach(({ input, expected }) => {
        const { unmount } = render(<TeamHeader teamName={input} />);
        
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toHaveTextContent(expected);
        
        unmount();
      });
    });

    it('should handle null and undefined values gracefully', () => {
      const testCases = [
        { input: undefined, shouldRender: true },
        { input: null, shouldRender: true },
      ];

      testCases.forEach(({ input, shouldRender }) => {
        const { unmount } = render(<TeamHeader teamName={input as any} />);
        
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toBeInTheDocument();
        
        unmount();
      });
    });

    it('should handle very long team names', () => {
      const longTeamName = 'A'.repeat(100);
      render(<TeamHeader teamName={longTeamName} />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent(`Team ${longTeamName}`);
    });
  });

  // ============================================================================
  // PROP CHANGES AND ACCESSIBILITY
  // ============================================================================

  describe('Prop Changes and Accessibility', () => {
    it('should handle prop changes correctly', () => {
      const { rerender } = render(<TeamHeader teamName="Original" />);
      
      let heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Team Original');

      rerender(<TeamHeader teamName="Team Updated" />);
      
      heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Team Updated');
    });

    it('should be accessible and properly structured', () => {
      render(<TeamHeader teamName="Development" />);

      const header = screen.getByRole('banner');
      const heading = screen.getByRole('heading', { level: 1 });

      expect(header.tagName).toBe('HEADER');
      expect(heading.tagName).toBe('H1');
      expect(heading).toBeVisible();
      expect(heading).toHaveTextContent('Team Development');
    });

    it('should not throw errors with valid props', () => {
      expect(() => {
        render(<TeamHeader teamName="Valid Team" />);
      }).not.toThrow();
    });
  });
});
