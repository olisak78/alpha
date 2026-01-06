import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import UserInformationSettings from '../../../src/components/UserInformationSettings';

/**
 * UserInformationSettings Component Tests
 * 
 * Tests for the UserInformationSettings component which displays user
 * information including full name, email, team, and role in a read-only format.
 * This is now a pure presentation component that receives processed data as props.
 * 
 * Component Location: src/components/UserInformationSettings.tsx
 */

// ============================================================================
// TEST UTILITIES
// ============================================================================

const defaultProps = {
  fullName: 'John Doe',
  email: 'john.doe@example.com',
  team: 'Engineering Team',
  role: 'Owner'
};

/**
 * Helper function to render UserInformationSettings with default props
 */
function renderUserInformationSettings(props?: Partial<typeof defaultProps>) {
  const finalProps = { ...defaultProps, ...props };
  return render(<UserInformationSettings {...finalProps} />);
}

// ============================================================================
// COMPONENT TESTS
// ============================================================================

describe('UserInformationSettings Component', () => {

  // ==========================================================================
  // RENDERING TESTS
  // ==========================================================================

  describe('Rendering', () => {
    it('should render component with all user information fields and labels', () => {
      renderUserInformationSettings();
      
      // Check main UI elements
      expect(screen.getByText('User Information')).toBeInTheDocument();
      expect(screen.getByText('Personal Details')).toBeInTheDocument();
      expect(screen.getByText('Your personal information.')).toBeInTheDocument();
      
      // Check all labels
      expect(screen.getByText('Full Name:')).toBeInTheDocument();
      expect(screen.getByText('Email:')).toBeInTheDocument();
      expect(screen.getByText('Team:')).toBeInTheDocument();
      expect(screen.getByText('Role:')).toBeInTheDocument();
    });

    it('should display user data as read-only text', () => {
      renderUserInformationSettings();
      
      // Check that data is displayed as text, not form inputs
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
      expect(screen.getByText('Engineering Team')).toBeInTheDocument();
      expect(screen.getByText('Owner')).toBeInTheDocument();
      
      // Ensure no form inputs are present
      expect(screen.queryAllByRole('textbox')).toHaveLength(0);
    });

    it('should display different user data when props change', () => {
      renderUserInformationSettings({
        fullName: 'Jane Smith',
        email: 'jane.smith@example.com',
        team: 'Design Team',
        role: 'Member'
      });
      
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('jane.smith@example.com')).toBeInTheDocument();
      expect(screen.getByText('Design Team')).toBeInTheDocument();
      expect(screen.getByText('Member')).toBeInTheDocument();
    });

    it('should display empty or placeholder values when provided', () => {
      renderUserInformationSettings({
        fullName: 'Not available',
        email: 'Not available',
        team: 'Not available',
        role: 'Not available'
      });
      
      expect(screen.getAllByText('Not available')).toHaveLength(4);
    });
  });


  // ==========================================================================
  // ACCESSIBILITY TESTS
  // ==========================================================================

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      renderUserInformationSettings();
      
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('User Information');
      expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent('Personal Details');
    });
  });

  // ==========================================================================
  // EDGE CASES TESTS
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle special characters in user data', () => {
      renderUserInformationSettings({
        fullName: 'José María García-López',
        email: 'jose.garcia+test@example.com',
        team: 'R&D Team',
        role: 'Senior Developer'
      });
      
      expect(screen.getByText('José María García-López')).toBeInTheDocument();
      expect(screen.getByText('jose.garcia+test@example.com')).toBeInTheDocument();
      expect(screen.getByText('R&D Team')).toBeInTheDocument();
      expect(screen.getByText('Senior Developer')).toBeInTheDocument();
    });

    it('should handle very long text values', () => {
      const longName = 'This is a very long name that might cause layout issues';
      const longTeam = 'This is a very long team name that might cause layout issues';
      
      renderUserInformationSettings({
        fullName: longName,
        team: longTeam
      });
      
      expect(screen.getByText(longName)).toBeInTheDocument();
      expect(screen.getByText(longTeam)).toBeInTheDocument();
    });

    it('should handle empty string values', () => {
      renderUserInformationSettings({
        fullName: '',
        email: '',
        team: '',
        role: ''
      });
      
      // Component should still render, even with empty strings
      expect(screen.getByText('User Information')).toBeInTheDocument();
      expect(screen.getByText('Full Name:')).toBeInTheDocument();
      expect(screen.getByText('Email:')).toBeInTheDocument();
      expect(screen.getByText('Team:')).toBeInTheDocument();
      expect(screen.getByText('Role:')).toBeInTheDocument();
    });
  });
});
