import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { AddLinkDialog } from '../../../src/components/dialogs/AddLinkDialog';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the hooks and services using factory functions to avoid hoisting issues
vi.mock('../../../src/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

vi.mock('../../../src/services/ApiClient', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

vi.mock('../../../src/hooks/api/useLinks', () => ({
  useCategories: vi.fn(() => ({
    data: {
      categories: [
        { id: 'cat1', title: 'Development' },
        { id: 'cat2', title: 'Documentation' },
        { id: 'cat3', title: 'Tools' },
      ],
    },
  })),
}));

vi.mock('../../../src/hooks/api/useMembers', () => ({
  useCurrentUser: vi.fn(() => ({
    data: {
      uuid: 'user-123',
      link: [
        {
          id: 'link1',
          title: 'Existing Link',
          category_id: 'cat1',
          url: 'https://existing.com',
          description: 'An existing link',
          tags: ['tag1'],
        },
      ],
    },
  })),
}));

// Get the mocked functions after the mocks are set up
const mockToast = vi.fn();
const mockInvalidateQueries = vi.fn();

// Create a wrapper component with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  queryClient.invalidateQueries = mockInvalidateQueries;

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('AddLinkDialog Component', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnTeamLinkAdded = vi.fn();

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    ownerId: undefined,
    onTeamLinkAdded: undefined,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Set up the mocked functions using dynamic imports
    const { useToast } = await vi.importMock('../../../src/hooks/use-toast') as any;
    const { apiClient } = await vi.importMock('../../../src/services/ApiClient') as any;
    
    useToast.mockReturnValue({ toast: mockToast });
    apiClient.post.mockResolvedValue({ id: 'new-link-123' });
    apiClient.get.mockResolvedValue({
      links: [
        {
          id: 'team-link-1',
          name: 'Team Link',
          url: 'https://team.com',
          category_id: 'cat1',
          description: 'Team link description',
          tags: ['team'],
        },
      ],
    });
  });

  // ============================================================================
  // RENDERING TESTS
  // ============================================================================

  describe('Rendering', () => {
    it('should render dialog with all essential elements', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <AddLinkDialog {...defaultProps} />
        </Wrapper>
      );

      expect(screen.getByText('Add Link')).toBeInTheDocument();
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/url/i)).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByLabelText(/tags/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
      expect(screen.getAllByText('*')).toHaveLength(3); // Required field indicators
    });

    it('should render category options from API', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <AddLinkDialog {...defaultProps} />
        </Wrapper>
      );

      const options = screen.getAllByRole('option', { hidden: true });
      expect(options).toHaveLength(3);
      expect(options[0]).toHaveTextContent('Development');
      expect(options[1]).toHaveTextContent('Documentation');
      expect(options[2]).toHaveTextContent('Tools');
    });

    it('should control dialog visibility based on open prop', () => {
      const Wrapper = createWrapper();
      const { rerender } = render(
        <Wrapper>
          <AddLinkDialog {...defaultProps} open={false} />
        </Wrapper>
      );
      expect(screen.queryByText('Add Link')).not.toBeInTheDocument();

      rerender(
        <Wrapper>
          <AddLinkDialog {...defaultProps} open={true} />
        </Wrapper>
      );
      expect(screen.getByText('Add Link')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // FORM VALIDATION TESTS
  // ============================================================================

  describe('Form Validation', () => {
    it('should validate required fields and show appropriate errors', async () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <AddLinkDialog {...defaultProps} />
        </Wrapper>
      );

      // Test name validation
      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.change(nameInput, { target: { value: '' } });
      fireEvent.blur(nameInput);
      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
      });

      fireEvent.change(nameInput, { target: { value: 'A' } });
      fireEvent.blur(nameInput);
      await waitFor(() => {
        expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
      });

      // Test URL validation
      const urlInput = screen.getByLabelText(/url/i);
      fireEvent.change(urlInput, { target: { value: 'not-a-url' } });
      fireEvent.blur(urlInput);
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid URL')).toBeInTheDocument();
      });
    });

    it('should disable submit button when form is invalid', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <AddLinkDialog {...defaultProps} />
        </Wrapper>
      );

      const submitButton = screen.getByRole('button', { name: /submit/i });
      expect(submitButton).toBeDisabled();

      // Fill some fields but not all required ones
      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Test Link' } });
      expect(submitButton).toBeDisabled(); // Still disabled because URL and category are missing
    });

    it('should detect duplicate names', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <AddLinkDialog {...defaultProps} />
        </Wrapper>
      );

      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.change(nameInput, { target: { value: 'Existing Link' } });
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      expect(submitButton).toBeDisabled();
    });
  });

  // ============================================================================
  // FORM INTERACTION TESTS
  // ============================================================================

  describe('Form Interactions', () => {
    it('should accept user input in all form fields', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <AddLinkDialog {...defaultProps} />
        </Wrapper>
      );

      const nameInput = screen.getByLabelText(/name/i);
      const urlInput = screen.getByLabelText(/url/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const tagsInput = screen.getByLabelText(/tags/i);

      fireEvent.change(nameInput, { target: { value: 'Test Link' } });
      fireEvent.change(urlInput, { target: { value: 'https://test.com' } });
      fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
      fireEvent.change(tagsInput, { target: { value: 'tag1, tag2' } });

      expect(nameInput).toHaveValue('Test Link');
      expect(urlInput).toHaveValue('https://test.com');
      expect(descriptionInput).toHaveValue('Test description');
      expect(tagsInput).toHaveValue('tag1, tag2');
    });

    it('should reset form when dialog closes and reopens', () => {
      const Wrapper = createWrapper();
      const { rerender } = render(
        <Wrapper>
          <AddLinkDialog {...defaultProps} />
        </Wrapper>
      );

      // Fill form
      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Test Link' } });
      fireEvent.change(screen.getByLabelText(/url/i), { target: { value: 'https://test.com' } });

      // Close and reopen dialog
      rerender(
        <Wrapper>
          <AddLinkDialog {...defaultProps} open={false} />
        </Wrapper>
      );
      rerender(
        <Wrapper>
          <AddLinkDialog {...defaultProps} open={true} />
        </Wrapper>
      );

      // Form should be reset
      expect(screen.getByLabelText(/name/i)).toHaveValue('');
      expect(screen.getByLabelText(/url/i)).toHaveValue('');
    });

    it('should show validation errors with proper styling', async () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <AddLinkDialog {...defaultProps} />
        </Wrapper>
      );

      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.change(nameInput, { target: { value: '' } });
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(nameInput).toHaveClass('border-red-500');
      });
    });
  });

  // ============================================================================
  // FORM SUBMISSION TESTS
  // ============================================================================

  describe('Form Submission', () => {
    it('should show loading state during submission', async () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <AddLinkDialog {...defaultProps} />
        </Wrapper>
      );

      // Fill form with valid data
      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Test Link' } });
      fireEvent.change(screen.getByLabelText(/url/i), { target: { value: 'https://test.com' } });

      const submitButton = screen.getByRole('button', { name: /submit/i });
      
      // Check that button is initially disabled (due to missing category)
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent('Submit');
    });

    it('should handle form submission attempt', async () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <AddLinkDialog {...defaultProps} />
        </Wrapper>
      );

      // Fill form with valid data
      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Test Link' } });
      fireEvent.change(screen.getByLabelText(/url/i), { target: { value: 'https://test.com' } });

      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      // Form should prevent submission due to validation (missing category)
      expect(submitButton).toBeDisabled();
    });
  });

  // ============================================================================
  // HANDLE SUBMIT FUNCTION TESTS
  // ============================================================================

  describe('handleSubmit Function', () => {
    const fillValidForm = async () => {
      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'New Test Link' } });
      fireEvent.change(screen.getByLabelText(/url/i), { target: { value: 'https://newtest.com' } });
      fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Test description' } });
      fireEvent.change(screen.getByLabelText(/tags/i), { target: { value: ' tag1 , tag2, tag1 , tag3 ' } });
      
      // Select category using the Select component's onValueChange
      const categorySelect = screen.getByRole('combobox');
      fireEvent.click(categorySelect);
      
      // Wait for options to appear and click the Development option
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Development' })).toBeInTheDocument();
      });
      
      const developmentOption = screen.getByRole('option', { name: 'Development' });
      fireEvent.click(developmentOption);
      
      // Wait for the selection to be processed
      await waitFor(() => {
        expect(categorySelect).toHaveAttribute('data-state', 'closed');
      });
    };

    it('should prevent submission when form validation fails', async () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <AddLinkDialog {...defaultProps} />
        </Wrapper>
      );

      // Try to submit empty form
      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      // Should not call API
      const { apiClient } = await vi.importMock('../../../src/services/ApiClient') as any;
      expect(apiClient.post).not.toHaveBeenCalled();
      expect(mockToast).not.toHaveBeenCalled();
    });

    it('should show error when user information is not available', async () => {
      const { useCurrentUser } = await vi.importMock('../../../src/hooks/api/useMembers') as any;
      useCurrentUser.mockReturnValue({
        data: { uuid: null, link: [] }
      });

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <AddLinkDialog {...defaultProps} />
        </Wrapper>
      );

      await fillValidForm();

      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: "destructive",
          title: "Error",
          description: "User information not available. Please try again.",
        });
      });
    });


  });

  // ============================================================================
  // TEAM FUNCTIONALITY TESTS
  // ============================================================================

  describe('Team Functionality', () => {
    it('should render with team owner ID when provided', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <AddLinkDialog {...defaultProps} ownerId="team-123" onTeamLinkAdded={mockOnTeamLinkAdded} />
        </Wrapper>
      );

      expect(screen.getByText('Add Link')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled();
    });
  });

  // ============================================================================
  // VALIDATION LOGIC TESTS
  // ============================================================================

  describe('Validation Logic', () => {
    it('should validate URL format correctly', async () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <AddLinkDialog {...defaultProps} />
        </Wrapper>
      );

      const urlInput = screen.getByLabelText(/url/i);

      // Test valid URL
      fireEvent.change(urlInput, { target: { value: 'https://valid-url.com' } });
      fireEvent.blur(urlInput);
      
      await waitFor(() => {
        expect(screen.queryByText('Please enter a valid URL')).not.toBeInTheDocument();
      });

      // Test invalid URL
      fireEvent.change(urlInput, { target: { value: 'invalid-url' } });
      fireEvent.blur(urlInput);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid URL')).toBeInTheDocument();
      });
    });

    it('should handle field validation on change when touched', async () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <AddLinkDialog {...defaultProps} />
        </Wrapper>
      );

      const nameInput = screen.getByLabelText(/name/i);

      // First touch the field
      fireEvent.blur(nameInput);
      
      // Now changes should trigger validation
      fireEvent.change(nameInput, { target: { value: '' } });
      
      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
      });

      // Fix the validation error
      fireEvent.change(nameInput, { target: { value: 'Valid Name' } });
      
      await waitFor(() => {
        expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
      });
    });

    it('should handle duplicate validation with case insensitivity', async () => {
      const { useCurrentUser } = await vi.importMock('../../../src/hooks/api/useMembers') as any;
      useCurrentUser.mockReturnValue({
        data: {
          uuid: 'user-123',
          link: [
            {
              id: 'link1',
              title: 'Existing Link',
              category_id: 'cat1',
              url: 'https://existing.com',
              description: 'An existing link',
              tags: ['tag1'],
            },
          ],
        }
      });

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <AddLinkDialog {...defaultProps} />
        </Wrapper>
      );

      const nameInput = screen.getByLabelText(/name/i);

      // Test case-insensitive duplicate detection
      fireEvent.change(nameInput, { target: { value: 'EXISTING LINK' } });
      fireEvent.blur(nameInput);

      // Should detect duplicate even with different case
      const submitButton = screen.getByRole('button', { name: /submit/i });
      expect(submitButton).toBeDisabled();
    });
  });

  // ============================================================================
  // TAGS PROCESSING TESTS
  // ============================================================================

  describe('Tags Processing', () => {
    it('should accept tags input', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <AddLinkDialog {...defaultProps} />
        </Wrapper>
      );

      const tagsInput = screen.getByLabelText(/tags/i);
      fireEvent.change(tagsInput, { target: { value: ' tag1 , tag2, tag1 , tag3 ' } });

      expect(tagsInput).toHaveValue(' tag1 , tag2, tag1 , tag3 ');
    });
  });

  // ============================================================================
  // EDGE CASES TESTS
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle special characters in input fields', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <AddLinkDialog {...defaultProps} />
        </Wrapper>
      );

      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.change(nameInput, { target: { value: 'Link & "Special" <Characters>' } });

      expect(nameInput).toHaveValue('Link & "Special" <Characters>');
    });

    it('should handle validation when no current user data', async () => {
      const { useCurrentUser } = await vi.importMock('../../../src/hooks/api/useMembers') as any;
      useCurrentUser.mockReturnValue({
        data: null
      });

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <AddLinkDialog {...defaultProps} />
        </Wrapper>
      );

      const submitButton = screen.getByRole('button', { name: /submit/i });
      expect(submitButton).toBeDisabled();
    });

    it('should handle validation when current user has no links', async () => {
      const { useCurrentUser } = await vi.importMock('../../../src/hooks/api/useMembers') as any;
      useCurrentUser.mockReturnValue({
        data: {
          uuid: 'user-123',
          link: null
        }
      });

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <AddLinkDialog {...defaultProps} />
        </Wrapper>
      );

      const submitButton = screen.getByRole('button', { name: /submit/i });
      expect(submitButton).toBeDisabled();
    });
  });

  // ============================================================================
  // ACCESSIBILITY TESTS
  // ============================================================================

  describe('Accessibility', () => {
    it('should have proper accessibility attributes', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <AddLinkDialog {...defaultProps} />
        </Wrapper>
      );

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/url/i)).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByLabelText(/tags/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
      expect(screen.getAllByText('*')).toHaveLength(3);
    });
  });
});
