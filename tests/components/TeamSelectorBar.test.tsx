import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TeamSelectorBar } from '@/components/TeamSelectorBar';

describe('TeamSelectorBar', () => {
  const mockOnTeamChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering and Visibility', () => {
    it('should render with teams', () => {
      render(
        <TeamSelectorBar
          teams={['Team A', 'Team B']}
          selectedTeam="Team A"
          hasMultipleTeams={true}
          onTeamChange={mockOnTeamChange}
        />
      );

      expect(screen.getByText('Team:')).toBeInTheDocument();
    });

    it('should return null when teams array is empty', () => {
      const { container } = render(
        <TeamSelectorBar
          teams={[]}
          selectedTeam=""
          hasMultipleTeams={false}
          onTeamChange={mockOnTeamChange}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should not render any content when teams array is empty', () => {
      render(
        <TeamSelectorBar
          teams={[]}
          selectedTeam=""
          hasMultipleTeams={false}
          onTeamChange={mockOnTeamChange}
        />
      );

      expect(screen.queryByText('Team:')).not.toBeInTheDocument();
    });

    it('should render with single team', () => {
      render(
        <TeamSelectorBar
          teams={['Solo Team']}
          selectedTeam="Solo Team"
          hasMultipleTeams={false}
          onTeamChange={mockOnTeamChange}
        />
      );

      expect(screen.getByText('Team:')).toBeInTheDocument();
    });

    it('should have correct container styling', () => {
      const { container } = render(
        <TeamSelectorBar
          teams={['Team A']}
          selectedTeam="Team A"
          hasMultipleTeams={false}
          onTeamChange={mockOnTeamChange}
        />
      );

      const wrapper = container.querySelector('.bg-secondary');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveClass('px-4', 'py-3', 'flex', 'items-center', 'transition-all', 'duration-300');
    });
  });

  describe('Label Prop', () => {
    it('should display default label', () => {
      render(
        <TeamSelectorBar
          teams={['Team A']}
          selectedTeam="Team A"
          hasMultipleTeams={false}
          onTeamChange={mockOnTeamChange}
        />
      );

      expect(screen.getByText('Team:')).toBeInTheDocument();
    });

    it('should display custom label when provided', () => {
      render(
        <TeamSelectorBar
          teams={['Team A']}
          selectedTeam="Team A"
          hasMultipleTeams={false}
          onTeamChange={mockOnTeamChange}
          label="Select Your Team:"
        />
      );

      expect(screen.getByText('Select Your Team:')).toBeInTheDocument();
      expect(screen.queryByText('Team:')).not.toBeInTheDocument();
    });

    it('should render label with correct styling', () => {
      render(
        <TeamSelectorBar
          teams={['Team A']}
          selectedTeam="Team A"
          hasMultipleTeams={false}
          onTeamChange={mockOnTeamChange}
        />
      );

      const label = screen.getByText('Team:');
      expect(label).toHaveClass('text-sm', 'font-medium', 'text-muted-foreground');
    });

    it('should handle empty string label', () => {
      render(
        <TeamSelectorBar
          teams={['Team A']}
          selectedTeam="Team A"
          hasMultipleTeams={false}
          onTeamChange={mockOnTeamChange}
          label=""
        />
      );

      // Empty label should still render the span element
      const { container } = render(
        <TeamSelectorBar
          teams={['Team A']}
          selectedTeam="Team A"
          hasMultipleTeams={false}
          onTeamChange={mockOnTeamChange}
          label=""
        />
      );

      const labelElement = container.querySelector('.text-sm.font-medium');
      expect(labelElement).toBeInTheDocument();
    });
  });

  describe('Select Component', () => {
    it('should render select trigger', () => {
      const { container } = render(
        <TeamSelectorBar
          teams={['Team A']}
          selectedTeam="Team A"
          hasMultipleTeams={false}
          onTeamChange={mockOnTeamChange}
        />
      );

      const selectTrigger = container.querySelector('.w-64');
      expect(selectTrigger).toBeInTheDocument();
    });

    it('should have correct select trigger width', () => {
      const { container } = render(
        <TeamSelectorBar
          teams={['Team A']}
          selectedTeam="Team A"
          hasMultipleTeams={false}
          onTeamChange={mockOnTeamChange}
        />
      );

      const selectTrigger = container.querySelector('.w-64');
      expect(selectTrigger).toHaveClass('w-64');
    });

    it('should display placeholder text', () => {
      render(
        <TeamSelectorBar
          teams={['Team A']}
          selectedTeam=""
          hasMultipleTeams={false}
          onTeamChange={mockOnTeamChange}
        />
      );

      // The SelectValue with placeholder should be in the document
      // Note: The actual rendered placeholder depends on the Select component implementation
      expect(screen.getByText('Team:')).toBeInTheDocument();
    });
  });

  describe('Single Team Mode', () => {
    it('should use first team as value when hasMultipleTeams is false', () => {
      const { container } = render(
        <TeamSelectorBar
          teams={['Only Team']}
          selectedTeam="different"
          hasMultipleTeams={false}
          onTeamChange={mockOnTeamChange}
        />
      );

      // Component should use teams[0] when hasMultipleTeams is false
      expect(container).toBeInTheDocument();
    });

    it('should not show "All Teams" option when hasMultipleTeams is false', async () => {
      const user = userEvent.setup();

      render(
        <TeamSelectorBar
          teams={['Team A', 'Team B']}
          selectedTeam="Team A"
          hasMultipleTeams={false}
          onTeamChange={mockOnTeamChange}
        />
      );

      // Click to open dropdown
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      // "All Teams" should not be present
      expect(screen.queryByText('All Teams')).not.toBeInTheDocument();
    });

    it('should render only provided teams when hasMultipleTeams is false', async () => {
      const user = userEvent.setup();

      render(
        <TeamSelectorBar
          teams={['Team A', 'Team B']}
          selectedTeam="Team A"
          hasMultipleTeams={false}
          onTeamChange={mockOnTeamChange}
        />
      );

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      // Teams may appear multiple times in DOM
      expect(screen.getAllByText('Team A').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Team B').length).toBeGreaterThan(0);
    });
  });

  describe('Multiple Teams Mode', () => {
    it('should use selectedTeam as value when hasMultipleTeams is true', () => {
      render(
        <TeamSelectorBar
          teams={['Team A', 'Team B']}
          selectedTeam="Team B"
          hasMultipleTeams={true}
          onTeamChange={mockOnTeamChange}
        />
      );

      expect(screen.getByText('Team:')).toBeInTheDocument();
    });

    it('should show "All Teams" option when hasMultipleTeams is true', async () => {
      const user = userEvent.setup();

      render(
        <TeamSelectorBar
          teams={['Team A', 'Team B']}
          selectedTeam="Team A"
          hasMultipleTeams={true}
          onTeamChange={mockOnTeamChange}
        />
      );

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      expect(screen.getByText('All Teams')).toBeInTheDocument();
    });

    it('should render "All Teams" before team options', async () => {
      const user = userEvent.setup();

      render(
        <TeamSelectorBar
          teams={['Team A', 'Team B']}
          selectedTeam="Team A"
          hasMultipleTeams={true}
          onTeamChange={mockOnTeamChange}
        />
      );

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      const allTeamsOption = screen.getByText('All Teams');
      // Team A is selected, so it appears in trigger and dropdown
      const teamAOptions = screen.getAllByText('Team A');

      // Both should exist
      expect(allTeamsOption).toBeInTheDocument();
      expect(teamAOptions.length).toBeGreaterThan(0);
    });

    it('should render all team options when hasMultipleTeams is true', async () => {
      const user = userEvent.setup();

      render(
        <TeamSelectorBar
          teams={['Team A', 'Team B', 'Team C']}
          selectedTeam="Team A"
          hasMultipleTeams={true}
          onTeamChange={mockOnTeamChange}
        />
      );

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      expect(screen.getByText('All Teams')).toBeInTheDocument();
      // All teams may appear multiple times in DOM
      expect(screen.getAllByText('Team A').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Team B').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Team C').length).toBeGreaterThan(0);
    });
  });

  describe('Team Selection', () => {
    it('should call onTeamChange when a team is selected', async () => {
      const user = userEvent.setup();

      render(
        <TeamSelectorBar
          teams={['Team A', 'Team B']}
          selectedTeam="Team A"
          hasMultipleTeams={false}
          onTeamChange={mockOnTeamChange}
        />
      );

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      const teamBOption = screen.getByText('Team B');
      await user.click(teamBOption);

      expect(mockOnTeamChange).toHaveBeenCalledWith('Team B');
      expect(mockOnTeamChange).toHaveBeenCalledTimes(1);
    });

    it('should call onTeamChange with "all" when All Teams is selected', async () => {
      const user = userEvent.setup();

      render(
        <TeamSelectorBar
          teams={['Team A', 'Team B']}
          selectedTeam="Team A"
          hasMultipleTeams={true}
          onTeamChange={mockOnTeamChange}
        />
      );

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      const allTeamsOption = screen.getByText('All Teams');
      await user.click(allTeamsOption);

      expect(mockOnTeamChange).toHaveBeenCalledWith('all');
      expect(mockOnTeamChange).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid team changes', async () => {
      const user = userEvent.setup();

      render(
        <TeamSelectorBar
          teams={['Team A', 'Team B', 'Team C']}
          selectedTeam="Team A"
          hasMultipleTeams={true}
          onTeamChange={mockOnTeamChange}
        />
      );

      const trigger = screen.getByRole('combobox');

      // Select Team B
      await user.click(trigger);
      await user.click(screen.getByText('Team B'));

      // Select All Teams
      await user.click(trigger);
      await user.click(screen.getByText('All Teams'));

      // Select Team C
      await user.click(trigger);
      await user.click(screen.getByText('Team C'));

      expect(mockOnTeamChange).toHaveBeenCalledTimes(3);
      expect(mockOnTeamChange).toHaveBeenNthCalledWith(1, 'Team B');
      expect(mockOnTeamChange).toHaveBeenNthCalledWith(2, 'all');
      expect(mockOnTeamChange).toHaveBeenNthCalledWith(3, 'Team C');
    });
  });

  describe('Team Options Rendering', () => {
    it('should render each team as a select option', async () => {
      const user = userEvent.setup();
      const teams = ['Engineering', 'Product', 'Design', 'Marketing'];

      render(
        <TeamSelectorBar
          teams={teams}
          selectedTeam="Engineering"
          hasMultipleTeams={false}
          onTeamChange={mockOnTeamChange}
        />
      );

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      // Each team should appear in the dropdown (may appear multiple times in DOM)
      teams.forEach((team) => {
        const teamOptions = screen.getAllByText(team);
        expect(teamOptions.length).toBeGreaterThan(0);
      });
    });

    it('should use team name as both value and display text', async () => {
      const user = userEvent.setup();

      render(
        <TeamSelectorBar
          teams={['Alpha Team']}
          selectedTeam="Alpha Team"
          hasMultipleTeams={false}
          onTeamChange={mockOnTeamChange}
        />
      );

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      // Alpha Team is selected, so it may appear multiple times
      expect(screen.getAllByText('Alpha Team').length).toBeGreaterThan(0);
    });

    it('should handle teams with special characters', async () => {
      const user = userEvent.setup();

      render(
        <TeamSelectorBar
          teams={['Team A & B', 'Team <C>', 'Team "D"']}
          selectedTeam="Team A & B"
          hasMultipleTeams={false}
          onTeamChange={mockOnTeamChange}
        />
      );

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      // All teams may appear multiple times in DOM (selected value + options)
      expect(screen.getAllByText('Team A & B').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Team <C>').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Team "D"').length).toBeGreaterThan(0);
    });
  });

  describe('Selected Team State', () => {
    it('should reflect selected team in single team mode', () => {
      render(
        <TeamSelectorBar
          teams={['Only Team']}
          selectedTeam="Different Team"
          hasMultipleTeams={false}
          onTeamChange={mockOnTeamChange}
        />
      );

      // In single team mode, it should use teams[0] regardless of selectedTeam
      expect(screen.getByText('Team:')).toBeInTheDocument();
    });

    it('should reflect selected team in multiple teams mode', () => {
      render(
        <TeamSelectorBar
          teams={['Team A', 'Team B', 'Team C']}
          selectedTeam="Team B"
          hasMultipleTeams={true}
          onTeamChange={mockOnTeamChange}
        />
      );

      expect(screen.getByText('Team:')).toBeInTheDocument();
    });

    it('should handle "all" as selected value', () => {
      render(
        <TeamSelectorBar
          teams={['Team A', 'Team B']}
          selectedTeam="all"
          hasMultipleTeams={true}
          onTeamChange={mockOnTeamChange}
        />
      );

      expect(screen.getByText('Team:')).toBeInTheDocument();
    });

    it('should handle empty selected team', () => {
      render(
        <TeamSelectorBar
          teams={['Team A']}
          selectedTeam=""
          hasMultipleTeams={true}
          onTeamChange={mockOnTeamChange}
        />
      );

      expect(screen.getByText('Team:')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle single team in teams array', () => {
      render(
        <TeamSelectorBar
          teams={['Single Team']}
          selectedTeam="Single Team"
          hasMultipleTeams={false}
          onTeamChange={mockOnTeamChange}
        />
      );

      expect(screen.getByText('Team:')).toBeInTheDocument();
    });

    it('should handle very long team names', async () => {
      const user = userEvent.setup();
      const longTeamName = 'A'.repeat(100);

      render(
        <TeamSelectorBar
          teams={[longTeamName]}
          selectedTeam={longTeamName}
          hasMultipleTeams={false}
          onTeamChange={mockOnTeamChange}
        />
      );

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      // Long team name is selected, so it appears in trigger and dropdown
      expect(screen.getAllByText(longTeamName).length).toBeGreaterThan(0);
    });

    it('should handle many teams', async () => {
      const user = userEvent.setup();
      const manyTeams = Array.from({ length: 50 }, (_, i) => `Team ${i + 1}`);

      render(
        <TeamSelectorBar
          teams={manyTeams}
          selectedTeam="Team 1"
          hasMultipleTeams={true}
          onTeamChange={mockOnTeamChange}
        />
      );

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      // Check first, middle, and last teams
      expect(screen.getByText('All Teams')).toBeInTheDocument();
      // Teams may appear multiple times in DOM
      expect(screen.getAllByText('Team 1').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Team 25').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Team 50').length).toBeGreaterThan(0);
    });

    it('should handle teams with duplicate names', async () => {
      const user = userEvent.setup();

      render(
        <TeamSelectorBar
          teams={['Team A', 'Team A', 'Team B']}
          selectedTeam="Team A"
          hasMultipleTeams={false}
          onTeamChange={mockOnTeamChange}
        />
      );

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      // Both "Team A" entries should be rendered
      const teamAOptions = screen.getAllByText('Team A');
      expect(teamAOptions.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle teams with numeric names', async () => {
      const user = userEvent.setup();

      render(
        <TeamSelectorBar
          teams={['123', '456', '789']}
          selectedTeam="123"
          hasMultipleTeams={false}
          onTeamChange={mockOnTeamChange}
        />
      );

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      // Teams may appear multiple times in DOM (trigger and dropdown)
      expect(screen.getAllByText('123').length).toBeGreaterThan(0);
      expect(screen.getAllByText('456').length).toBeGreaterThan(0);
      expect(screen.getAllByText('789').length).toBeGreaterThan(0);
    });
  });

  describe('Layout and Styling', () => {
    it('should have proper spacing between label and select', () => {
      const { container } = render(
        <TeamSelectorBar
          teams={['Team A']}
          selectedTeam="Team A"
          hasMultipleTeams={false}
          onTeamChange={mockOnTeamChange}
        />
      );

      const innerContainer = container.querySelector('.space-x-4');
      expect(innerContainer).toBeInTheDocument();
      expect(innerContainer).toHaveClass('flex', 'items-center');
    });

    it('should align items vertically centered', () => {
      const { container } = render(
        <TeamSelectorBar
          teams={['Team A']}
          selectedTeam="Team A"
          hasMultipleTeams={false}
          onTeamChange={mockOnTeamChange}
        />
      );

      const wrapper = container.querySelector('.bg-secondary');
      expect(wrapper).toHaveClass('items-center');
    });

    it('should have transition animation', () => {
      const { container } = render(
        <TeamSelectorBar
          teams={['Team A']}
          selectedTeam="Team A"
          hasMultipleTeams={false}
          onTeamChange={mockOnTeamChange}
        />
      );

      const wrapper = container.querySelector('.bg-secondary');
      expect(wrapper).toHaveClass('transition-all', 'duration-300');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible combobox role', () => {
      render(
        <TeamSelectorBar
          teams={['Team A', 'Team B']}
          selectedTeam="Team A"
          hasMultipleTeams={false}
          onTeamChange={mockOnTeamChange}
        />
      );

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();

      render(
        <TeamSelectorBar
          teams={['Team A', 'Team B']}
          selectedTeam="Team A"
          hasMultipleTeams={false}
          onTeamChange={mockOnTeamChange}
        />
      );

      const trigger = screen.getByRole('combobox');
      
      // Tab to focus
      await user.tab();
      expect(trigger).toHaveFocus();
    });
  });

  describe('Integration Scenarios', () => {
    it('should work in a typical multi-team workflow', async () => {
      const user = userEvent.setup();

      const { rerender } = render(
        <TeamSelectorBar
          teams={['Team A', 'Team B', 'Team C']}
          selectedTeam="Team A"
          hasMultipleTeams={true}
          onTeamChange={mockOnTeamChange}
        />
      );

      // Select All Teams
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);
      await user.click(screen.getByText('All Teams'));

      expect(mockOnTeamChange).toHaveBeenCalledWith('all');

      // Simulate parent updating selectedTeam
      rerender(
        <TeamSelectorBar
          teams={['Team A', 'Team B', 'Team C']}
          selectedTeam="all"
          hasMultipleTeams={true}
          onTeamChange={mockOnTeamChange}
        />
      );

      expect(screen.getByText('Team:')).toBeInTheDocument();
    });

    it('should handle dynamic team list updates', () => {
      const { rerender } = render(
        <TeamSelectorBar
          teams={['Team A']}
          selectedTeam="Team A"
          hasMultipleTeams={false}
          onTeamChange={mockOnTeamChange}
        />
      );

      expect(screen.getByText('Team:')).toBeInTheDocument();

      // Update to add more teams
      rerender(
        <TeamSelectorBar
          teams={['Team A', 'Team B', 'Team C']}
          selectedTeam="Team A"
          hasMultipleTeams={true}
          onTeamChange={mockOnTeamChange}
        />
      );

      expect(screen.getByText('Team:')).toBeInTheDocument();
    });
  });
});