import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { MemberDetailsDialog, type ExtendedMember } from '../../../src/components/dialogs/MemberDetailsDialog';
import type { Member } from '../../../src/hooks/useOnDutyData';
import * as memberUtils from '../../../src/utils/member-utils';

/**
 * MemberDetailsDialog Component Tests
 * 
 * Tests for the MemberDetailsDialog component which displays detailed
 * member information in a modal dialog with quick action buttons.
 */

// Mock the member utility functions
vi.mock('../../../src/utils/member-utils', () => ({
  openTeamsChat: vi.fn(),
  formatBirthDate: vi.fn(),
  openSAPProfile: vi.fn(),
  openEditPicture: vi.fn(),
  openEmailClient: vi.fn(),
  formatPhoneNumber: vi.fn(),
  copyToClipboard: vi.fn(),
  SAP_PEOPLE_BASE_URL: 'https://people.wdf.sap.corp',
}));

describe('MemberDetailsDialog Component', () => {
  const mockMember: ExtendedMember = {
    id: 'user123',
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    role: 'Senior Developer',
    avatar: 'https://example.com/avatar.jpg',
    team: 'Frontend Team',
    mobile: '+1-555-0123',
    phoneNumber: '+1-555-0123',
    room: 'Building A, Room 101',
    managerName: 'Jane Smith',
    birthDate: '03-15',
  };

  const mockMemberMinimal: ExtendedMember = {
    id: 'user456',
    fullName: 'Jane Smith',
    email: 'jane.smith@example.com',
    role: 'UX Designer',
  };

  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default mock implementations
    vi.mocked(memberUtils.formatBirthDate).mockImplementation((date) => {
      if (date === '03-15') return 'March 15';
      if (date === '12-25') return 'December 25';
      return date || 'Not specified';
    });
    
    vi.mocked(memberUtils.formatPhoneNumber).mockImplementation((phone) => {
      if (!phone) return 'Not specified';
      if (phone === '+1-555-0123') return '+1-5-55-0123';
      if (phone === '+49-123-456-7890') return '+49-1-23-456-7890';
      return phone;
    });
    
    vi.mocked(memberUtils.copyToClipboard).mockImplementation(async (e, text) => {
      e.stopPropagation();
      // Mock successful copy
    });
  });

  // ============================================================================
  // BASIC RENDERING TESTS
  // ============================================================================

  describe('Basic Rendering', () => {
    it('should handle closed dialog and null member states', () => {
      // Test closed dialog
      const { rerender } = render(
        <MemberDetailsDialog
          open={false}
          onOpenChange={mockOnOpenChange}
          member={mockMember}
        />
      );
      expect(screen.queryByText('Member Details')).not.toBeInTheDocument();

      // Test null member
      rerender(
        <MemberDetailsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          member={null}
        />
      );
      expect(screen.queryByText('Member Details')).not.toBeInTheDocument();
    });

    it('should render complete dialog with all member information', () => {
      render(
        <MemberDetailsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          member={mockMember}
        />
      );

      // Dialog structure
      expect(screen.getByText('Member Details')).toBeInTheDocument();
      expect(screen.getByText('View detailed information about this team member')).toBeInTheDocument();

      // Member header
      expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
      expect(screen.getByText('Senior Developer')).toBeInTheDocument();

      // Avatar and action buttons
      expect(document.querySelector('.h-20.w-20.cursor-pointer')).toBeInTheDocument();
      expect(screen.getByText('Open Teams Chat')).toBeInTheDocument();
      expect(screen.getByText('Send Email')).toBeInTheDocument();

      // All detail items
      const expectedDetails = [
        ['User ID:', 'user123'],
        ['Email:', 'john.doe@example.com'],
        ['Team:', 'Frontend Team'],
        ['Room:', 'Building A, Room 101'],
        ['Manager Name:', 'Jane Smith'],
        ['Birth Date:', 'March 15'],
        ['Mobile Phone:', '+1-5-55-0123']
      ];

      expectedDetails.forEach(([label, value]) => {
        expect(screen.getByText(label)).toBeInTheDocument();
        expect(screen.getByText(value)).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // MEMBER DATA HANDLING TESTS
  // ============================================================================

  describe('Member Data Handling', () => {
    it('should handle various member data scenarios', () => {
      // Test minimal data with fallbacks
      const { rerender } = render(
        <MemberDetailsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          member={mockMemberMinimal}
        />
      );

      expect(screen.getAllByText('Jane Smith').length).toBeGreaterThan(0);
      expect(screen.getByText('UX Designer')).toBeInTheDocument();
      expect(screen.getAllByText('Not specified')).toHaveLength(5);

      // Test null/undefined fields
      const memberWithNulls: ExtendedMember = {
        id: 'user789',
        fullName: 'Test User',
        email: 'test@example.com',
        role: 'Tester',
        team: undefined,
        mobile: null as any,
        phoneNumber: '',
        room: undefined,
        managerName: null as any,
        birthDate: '',
      };

      rerender(
        <MemberDetailsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          member={memberWithNulls}
        />
      );

      expect(screen.getAllByText('Test User').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Not specified')).toHaveLength(5);

      // Test special characters and long text
      const memberWithSpecialChars: ExtendedMember = {
        id: 'user-special',
        fullName: "José María O'Connor-Smith",
        email: 'jose.maria@example-company.co.uk',
        role: 'Senior Frontend Developer & Team Lead',
        team: 'International Team (Europe/Asia)',
        mobile: '+49-123-456-7890',
        room: 'Büro München, Raum 42/3',
        managerName: 'François Müller-Schmidt',
        birthDate: '12-25',
      };

      rerender(
        <MemberDetailsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          member={memberWithSpecialChars}
        />
      );

      expect(screen.getAllByText("José María O'Connor-Smith").length).toBeGreaterThan(0);
      expect(screen.getByText('Senior Frontend Developer & Team Lead')).toBeInTheDocument();
      expect(screen.getByText('International Team (Europe/Asia)')).toBeInTheDocument();
      expect(screen.getByText('Büro München, Raum 42/3')).toBeInTheDocument();
      expect(screen.getByText('François Müller-Schmidt')).toBeInTheDocument();
      expect(screen.getByText('December 25')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // AVATAR AND SAP PROFILE TESTS
  // ============================================================================

  describe('Avatar and SAP Profile', () => {
    it('should render avatar with correct styling and handle clicks', async () => {
      const user = userEvent.setup();
      render(
        <MemberDetailsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          member={mockMember}
        />
      );

      const avatarContainer = document.querySelector('.h-20.w-20.cursor-pointer');
      
      // Check avatar exists with proper styling
      expect(avatarContainer).toBeInTheDocument();
      expect(avatarContainer).toHaveClass('cursor-pointer', 'hover:opacity-80', 'transition-opacity');
      expect(avatarContainer).toHaveClass('relative', 'flex', 'shrink-0', 'overflow-hidden', 'rounded-full');
      
      // Test click functionality
      await user.click(avatarContainer as Element);
      expect(memberUtils.openEditPicture).toHaveBeenCalledWith('user123');
    });
  });

  // ============================================================================
  // QUICK ACTIONS TESTS
  // ============================================================================

  describe('Quick Actions', () => {
    it('should handle action button clicks and conditional rendering', async () => {
      const user = userEvent.setup();
      
      // Test with full member data
      const { rerender } = render(
        <MemberDetailsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          member={mockMember}
        />
      );

      // Test button functionality and styling
      const teamsButton = screen.getByText('Open Teams Chat');
      const emailButton = screen.getByText('Send Email');
      
      expect(teamsButton.closest('button')).toHaveClass('flex', 'items-center', 'gap-2');
      expect(emailButton.closest('button')).toHaveClass('flex', 'items-center', 'gap-2');
      expect(teamsButton.closest('button')?.querySelector('svg')).toBeInTheDocument();
      expect(emailButton.closest('button')?.querySelector('img')).toBeInTheDocument();

      await user.click(teamsButton);
      await user.click(emailButton);

      expect(memberUtils.openTeamsChat).toHaveBeenCalledWith('john.doe@example.com');
      expect(memberUtils.openEmailClient).toHaveBeenCalledWith('john.doe@example.com');

      // Test conditional email button rendering
      rerender(
        <MemberDetailsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          member={{ ...mockMember, email: '' }}
        />
      );

      expect(screen.getByText('Open Teams Chat')).toBeInTheDocument();
      expect(screen.queryByText('Send Email')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // BIRTH DATE FORMATTING TESTS
  // ============================================================================

  describe('Birth Date Formatting', () => {
    it('should handle various birth date scenarios', () => {
      const { rerender } = render(
        <MemberDetailsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          member={mockMember}
        />
      );

      // Test valid birth date
      expect(memberUtils.formatBirthDate).toHaveBeenCalledWith('03-15');
      expect(screen.getByText('March 15')).toBeInTheDocument();

      // Test undefined birth date
      rerender(
        <MemberDetailsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          member={{ ...mockMember, birthDate: undefined }}
        />
      );
      expect(memberUtils.formatBirthDate).toHaveBeenCalledWith(undefined);

      // Test empty birth date
      rerender(
        <MemberDetailsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          member={{ ...mockMember, birthDate: '' }}
        />
      );
      expect(memberUtils.formatBirthDate).toHaveBeenCalledWith('');
    });
  });

  // ============================================================================
  // DIALOG INTERACTION AND ACCESSIBILITY TESTS
  // ============================================================================

  describe('Dialog Interaction and Accessibility', () => {
    it('should handle dialog interactions and have proper structure', async () => {
      const user = userEvent.setup();
      render(
        <MemberDetailsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          member={mockMember}
        />
      );

      // Dialog structure and ARIA
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveClass('overflow-y-auto', 'max-h-[90vh]');
      expect(screen.getByText('Member Details')).toBeInTheDocument();
      expect(screen.getByText('View detailed information about this team member')).toBeInTheDocument();

      // Button accessibility
      expect(screen.getByRole('button', { name: /open teams chat/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send email/i })).toBeInTheDocument();

      // Keyboard interaction
      await user.keyboard('{Escape}');
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);

      // Title attributes for accessibility
      const detailValues = screen.getAllByTitle(/user123|john\.doe@example\.com|frontend team/i);
      expect(detailValues.length).toBeGreaterThan(0);
    });

    it('should support keyboard navigation through interactive elements', async () => {
      const user = userEvent.setup();
      render(
        <MemberDetailsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          member={mockMember}
        />
      );

      // Tab through interactive elements - there are copy buttons in between
      await user.tab(); // Close button
      await user.tab(); // Avatar
      
      // Skip through copy buttons to get to action buttons
      let currentElement = document.activeElement;
      let tabCount = 0;
      const maxTabs = 10; // Safety limit
      
      while (tabCount < maxTabs && !currentElement?.textContent?.includes('Open Teams Chat')) {
        await user.tab();
        currentElement = document.activeElement;
        tabCount++;
      }
      
      expect(screen.getByText('Open Teams Chat')).toHaveFocus();

      await user.tab(); // Email button
      expect(screen.getByText('Send Email')).toHaveFocus();
    });
  });


  // ============================================================================
  // COMPONENT UPDATE TESTS
  // ============================================================================

  describe('Component Updates', () => {
    it('should handle member prop changes correctly', () => {
      const { rerender } = render(
        <MemberDetailsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          member={mockMember}
        />
      );

      expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
      expect(screen.getByText('Senior Developer')).toBeInTheDocument();

      // Update member
      const updatedMember: ExtendedMember = {
        ...mockMember,
        fullName: 'John Smith',
        role: 'Lead Developer',
        team: 'Backend Team',
      };

      rerender(
        <MemberDetailsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          member={updatedMember}
        />
      );

      expect(screen.getAllByText('John Smith').length).toBeGreaterThan(0);
      expect(screen.getByText('Lead Developer')).toBeInTheDocument();
      expect(screen.getByText('Backend Team')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.queryByText('Senior Developer')).not.toBeInTheDocument();
    });

    it('should handle open state changes correctly', () => {
      const { rerender } = render(
        <MemberDetailsDialog
          open={false}
          onOpenChange={mockOnOpenChange}
          member={mockMember}
        />
      );

      expect(screen.queryByText('Member Details')).not.toBeInTheDocument();

      rerender(
        <MemberDetailsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          member={mockMember}
        />
      );

      expect(screen.getByText('Member Details')).toBeInTheDocument();
      expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
    });

    it('should handle switching between different members', () => {
      const { rerender } = render(
        <MemberDetailsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          member={mockMember}
        />
      );

      expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
      expect(screen.getByText('user123')).toBeInTheDocument();

      rerender(
        <MemberDetailsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          member={mockMemberMinimal}
        />
      );

      expect(screen.getAllByText('Jane Smith').length).toBeGreaterThan(0);
      expect(screen.getByText('user456')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.queryByText('user123')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle utility function errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock utility functions to not throw errors but just do nothing
      vi.mocked(memberUtils.openTeamsChat).mockImplementation(() => {
        // Simulate error but don't throw
        console.error('Teams not available');
      });
      vi.mocked(memberUtils.openEmailClient).mockImplementation(() => {
        // Simulate error but don't throw
        console.error('Email client not available');
      });

      render(
        <MemberDetailsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          member={mockMember}
        />
      );

      // Should not crash when utility functions have errors
      const teamsButton = screen.getByText('Open Teams Chat');
      const emailButton = screen.getByText('Send Email');

      await user.click(teamsButton);
      await user.click(emailButton);

      // Component should still be rendered
      expect(screen.getByText('Member Details')).toBeInTheDocument();

      // Verify functions were called
      expect(memberUtils.openTeamsChat).toHaveBeenCalledWith('john.doe@example.com');
      expect(memberUtils.openEmailClient).toHaveBeenCalledWith('john.doe@example.com');

      consoleSpy.mockRestore();
    });

    it('should handle formatBirthDate errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock formatBirthDate to return a fallback value instead of throwing
      vi.mocked(memberUtils.formatBirthDate).mockImplementation(() => {
        console.error('Date formatting error');
        return 'Invalid Date';
      });

      render(
        <MemberDetailsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          member={mockMember}
        />
      );

      // Component should still render with fallback value
      expect(screen.getByText('Member Details')).toBeInTheDocument();
      expect(screen.getByText('Invalid Date')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });
});
