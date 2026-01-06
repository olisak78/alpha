import { vi, expect } from 'vitest';

// Common mock factories
export const createMockQuickLinksContext = (overrides = {}) => ({
  linkCategories: [
    {
      id: 'category-1',
      name: 'Development',
      icon: vi.fn(() => 'dev-icon'),
      color: 'bg-blue-500',
    },
    {
      id: 'category-2',
      name: 'Documentation',
      icon: vi.fn(() => 'docs-icon'),
      color: 'bg-green-500',
    },
  ],
  searchTerm: '',
  setSearchTerm: vi.fn(),
  selectedCategoryId: 'all',
  setSelectedCategoryId: vi.fn(),
  deleteDialog: {
    isOpen: false,
    linkTitle: '',
    linkId: '',
  },
  handleDeleteConfirm: vi.fn(),
  handleDeleteCancel: vi.fn(),
  ...overrides,
});

export const createMockFormData = (overrides = {}) => ({
  title: '',
  url: '',
  category: '',
  icon: 'link',
  ...overrides,
});

export const createMockFormProps = (overrides = {}) => ({
  open: false,
  onOpenChange: vi.fn(),
  formData: createMockFormData(),
  formErrors: {},
  existingCategories: ['Development', 'Documentation', 'Tools'],
  isFormValid: false,
  isSubmitting: false,
  onFieldChange: vi.fn(),
  onFieldBlur: vi.fn(),
  shouldShowError: vi.fn(() => false),
  onSubmit: vi.fn(),
  onCancel: vi.fn(),
  ...overrides,
});

// Common test utilities
export const setupScrollMocks = () => {
  Element.prototype.scrollTo = vi.fn();
  
  Object.defineProperty(Element.prototype, 'scrollLeft', {
    writable: true,
    value: 0,
  });
  Object.defineProperty(Element.prototype, 'scrollWidth', {
    writable: true,
    value: 500,
  });
  Object.defineProperty(Element.prototype, 'clientWidth', {
    writable: true,
    value: 500,
  });
};

// Common assertions
export const expectDialogToBeOpen = (screen: any, testId: string) => {
  const dialog = screen.getByTestId(testId);
  expect(dialog).toHaveAttribute('data-open', 'true');
};

export const expectDialogToBeClosed = (screen: any, testId: string) => {
  const dialog = screen.getByTestId(testId);
  expect(dialog).toHaveAttribute('data-open', 'false');
};

export const expectButtonToHaveCorrectClasses = (button: HTMLElement, expectedClasses: string[]) => {
  expectedClasses.forEach(className => {
    expect(button).toHaveClass(className);
  });
};

// Common test data
export const MOCK_CATEGORIES = [
  { id: 'dev', name: 'Development' },
  { id: 'docs', name: 'Documentation' },
  { id: 'tools', name: 'Tools' },
];

export const FORM_FIELD_TESTS = [
  { field: 'title', placeholder: 'e.g., Jira Dashboard', testValue: 'New Title' },
  { field: 'url', placeholder: 'https://example.com', testValue: 'https://new-url.com' },
  { field: 'category', placeholder: 'Select or type a new category', testValue: 'New Category' },
];
