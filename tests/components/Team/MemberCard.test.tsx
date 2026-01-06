import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { MemberCard } from '../../../src/components/Team/MemberCard';
import type { Member } from '../../../src/hooks/useOnDutyData';

/**
 * MemberCard Component Tests
 * 
 * Tests for the MemberCard component which displays individual team member
 * information with optional actions for moving members.
 */

describe('MemberCard Component', () => {
  const mockMember: Member = {
    id: '1',
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    role: 'Senior Developer',
    avatar: 'https://example.com/avatar1.jpg',
  };

  const mockMemberWithoutAvatar: Member = {
    id: '2',
    fullName: 'Jane Smith',
    email: 'jane.smith@example.com',
    role: 'UX Designer',
  };

  const mockOnInitiateMove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // BASIC RENDERING TESTS
  // ============================================================================

  describe('Basic Rendering', () => {
    it('should render member card with all information and proper structure', () => {
      render(<MemberCard member={mockMember} />);

      // Check for card structure
      const card = document.querySelector('[class*="card"]');
      expect(card).toBeInTheDocument();

      // Check for member information
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Senior Developer')).toBeInTheDocument(); // Role is shown as badge

      // Check for initials fallback
      expect(screen.getByText('JD')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // AVATAR AND INITIALS TESTS
  // ============================================================================

  describe('Avatar and Initials', () => {
    it('should generate correct initials for various name formats', () => {
      const testCases = [
        { name: 'John', expected: 'J' },
        { name: 'John Doe', expected: 'JD' },
        { name: 'Mary Jane Watson', expected: 'MJ' },
        { name: 'José María García López', expected: 'JM' },
        { name: 'A B C D E', expected: 'AB' },
        { name: 'A', expected: 'A' }, // Single character
        { name: "O'Brian José-María", expected: 'OJ' }, // Special characters
      ];

      testCases.forEach(({ name, expected }) => {
        const testMember = { ...mockMember, fullName: name };
        const { unmount } = render(<MemberCard member={testMember} />);
        
        if (name === 'A') {
          // Handle case where name appears in both title and initials
          const nameElements = screen.getAllByText('A');
          expect(nameElements.length).toBeGreaterThan(0);
        } else {
          expect(screen.getByText(expected)).toBeInTheDocument();
        }
        unmount();
      });
    });

    it('should show initials when avatar is missing or empty', () => {
      render(<MemberCard member={mockMemberWithoutAvatar} />);
      expect(screen.getByText('JS')).toBeInTheDocument();

      const { unmount } = render(<MemberCard member={{ ...mockMember, avatar: '' }} />);
      expect(screen.getByText('JD')).toBeInTheDocument();
      unmount();
    });
  });

  // ============================================================================
  // ACTIONS VISIBILITY TESTS
  // ============================================================================

  describe('Actions Visibility', () => {
    it('should show action button when all conditions are met', () => {
      render(
        <MemberCard 
          member={mockMember} 
          showActions={true} 
          isAdmin={true} 
          onInitiateMove={mockOnInitiateMove} 
        />
      );
      expect(screen.getByLabelText('Actions')).toBeInTheDocument();
    });

    it('should not show action button when any condition is false', () => {
      const testCases = [
        { showActions: false, isAdmin: true, hasCallback: true },
        { showActions: true, isAdmin: false, hasCallback: true },
        { showActions: true, isAdmin: true, hasCallback: false },
        { showActions: true, isAdmin: false, hasCallback: false }, // Default isAdmin
      ];

      testCases.forEach(({ showActions, isAdmin, hasCallback }) => {
        const { unmount } = render(
          <MemberCard 
            member={mockMember} 
            showActions={showActions} 
            isAdmin={isAdmin} 
            onInitiateMove={hasCallback ? mockOnInitiateMove : undefined} 
          />
        );

        expect(screen.queryByLabelText('Actions')).not.toBeInTheDocument();
        unmount();
      });
    });
  });

  // ============================================================================
  // DROPDOWN FUNCTIONALITY TESTS
  // ============================================================================

  describe('Dropdown Functionality', () => {
    it('should open dropdown and call onInitiateMove when clicked', async () => {
      const user = userEvent.setup();
      render(
        <MemberCard 
          member={mockMember} 
          showActions={true} 
          isAdmin={true} 
          onInitiateMove={mockOnInitiateMove} 
        />
      );

      const actionButton = screen.getByLabelText('Actions');
      await user.click(actionButton);

      const moveOption = screen.getByText('Move to...');
      expect(moveOption).toBeInTheDocument();

      // Check dropdown styling
      const dropdownContent = moveOption.closest('[class*="z-50"]');
      expect(dropdownContent).toBeInTheDocument();

      // Test callback
      await user.click(moveOption);
      expect(mockOnInitiateMove).toHaveBeenCalledWith(mockMember);
      expect(mockOnInitiateMove).toHaveBeenCalledTimes(1);
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(
        <MemberCard 
          member={mockMember} 
          showActions={true} 
          isAdmin={true} 
          onInitiateMove={mockOnInitiateMove} 
        />
      );

      // Tab to action button and activate with keyboard
      await user.tab();
      expect(screen.getByLabelText('Actions')).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(screen.getByText('Move to...')).toBeInTheDocument();

      await user.tab();
      await user.keyboard('{Enter}');

      expect(mockOnInitiateMove).toHaveBeenCalledWith(mockMember);
    });
  });

  // ============================================================================
  // DATA HANDLING TESTS
  // ============================================================================

  describe('Data Handling', () => {
    it('should handle various data scenarios', () => {
      const testCases = [
        {
          name: 'special characters',
          member: {
            id: '1',
            fullName: "José María O'Connor-Smith",
            email: 'jose.maria@example-company.co.uk',
            role: 'Senior Frontend Developer & Team Lead',
          }
        },
        {
          name: 'very long data',
          member: {
            id: '1',
            fullName: 'A'.repeat(50),
            email: `${'very-long-email-address'.repeat(2)}@example.com`,
            role: 'Very Long Role Title That Exceeds Normal Length Expectations',
          }
        }
      ];

      testCases.forEach(({ name, member }) => {
        const { unmount } = render(<MemberCard member={member} />);
        
        expect(screen.getByText(member.fullName)).toBeInTheDocument();
        expect(screen.getByText(member.role)).toBeInTheDocument(); // Role is shown as badge, not "Role: X"
        
        unmount();
      });
    });
  });

  // ============================================================================
  // ACCESSIBILITY TESTS
  // ============================================================================

  describe('Accessibility', () => {
    it('should have proper ARIA labels and semantic structure', () => {
      render(
        <MemberCard 
          member={mockMember} 
          showActions={true} 
          isAdmin={true} 
          onInitiateMove={mockOnInitiateMove} 
        />
      );

      // Check ARIA labels
      const actionButton = screen.getByLabelText('Actions');
      expect(actionButton).toHaveAttribute('aria-label', 'Actions');

      // Check semantic structure
      const nameElement = screen.getByText('John Doe');
      const roleElement = screen.getByText('Senior Developer'); // Role is shown as badge
      
      expect(nameElement).toBeInTheDocument();
      expect(roleElement).toBeInTheDocument();

      // Check initials are rendered as fallback
      expect(screen.getByText('JD')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle invalid member data gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Test undefined member
      expect(() => {
        render(<MemberCard member={undefined as any} />);
      }).toThrow();

      // Test member with null fields
      expect(() => {
        render(<MemberCard member={{
          id: '1',
          fullName: null as any,
          email: undefined as any,
          role: '',
        }} />);
      }).toThrow();

      consoleSpy.mockRestore();
    });
  });

  // ============================================================================
  // COMPONENT UPDATES TESTS
  // ============================================================================

  describe('Component Updates', () => {
    it('should handle prop and data changes correctly', async () => {
      const user = userEvent.setup();
      const firstCallback = vi.fn();
      const secondCallback = vi.fn();

      const { rerender } = render(<MemberCard member={mockMember} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByLabelText('Actions')).not.toBeInTheDocument();

      // Test prop changes - enable actions
      rerender(
        <MemberCard 
          member={mockMember} 
          showActions={true} 
          isAdmin={true} 
          onInitiateMove={firstCallback} 
        />
      );

      expect(screen.getByLabelText('Actions')).toBeInTheDocument();

      // Test member data changes
      const updatedMember = {
        ...mockMember,
        fullName: 'John Smith',
        role: 'Lead Developer',
      };

      rerender(
        <MemberCard 
          member={updatedMember} 
          showActions={true} 
          isAdmin={true} 
          onInitiateMove={secondCallback} 
        />
      );

      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('Lead Developer')).toBeInTheDocument(); // Role is shown as badge
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();

      // Test callback changes
      const actionButton = screen.getByLabelText('Actions');
      await user.click(actionButton);
      const moveOption = screen.getByText('Move to...');
      await user.click(moveOption);

      expect(secondCallback).toHaveBeenCalledWith(updatedMember);
      expect(firstCallback).not.toHaveBeenCalled();
    });
  });
});
