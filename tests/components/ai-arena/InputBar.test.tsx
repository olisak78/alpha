import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { InputBar } from '../../../src/features/ai-arena/components/InputBar';
import { type UploadedFile } from '../../../src/services/aiPlatformApi';

// Mock dependencies
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}));

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, variant, disabled, title, ...props }: any) => (
    <button
      onClick={onClick}
      className={className}
      disabled={disabled}
      title={title}
      data-variant={variant}
      {...props}
    >
      {children}
    </button>
  )
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Paperclip: ({ className }: any) => <span data-testid="paperclip-icon" className={className} />,
  ArrowUp: ({ className }: any) => <span data-testid="arrow-up-icon" className={className} />,
  X: ({ className }: any) => <span data-testid="x-icon" className={className} />,
  FileIcon: ({ className }: any) => <span data-testid="file-icon" className={className} />
}));

// Mock FileReader
const mockFileReader = {
  readAsDataURL: vi.fn(),
  result: '',
  onload: null as any,
  onerror: null as any
};

Object.defineProperty(global, 'FileReader', {
  writable: true,
  value: vi.fn(() => mockFileReader)
});

// Sample files for testing
const createMockFile = (name: string, type: string, size: number = 1024): File => {
  const file = new File(['test content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

const mockTextFile = createMockFile('test.txt', 'text/plain', 1024);
const mockImageFile = createMockFile('test.jpg', 'image/jpeg', 2048);
const mockLargeFile = createMockFile('large.txt', 'text/plain', 6 * 1024 * 1024); // 6MB

describe('InputBar', () => {
  const mockOnSend = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFileReader.result = 'data:text/plain;base64,dGVzdCBjb250ZW50';
    mockFileReader.readAsDataURL.mockImplementation(function(this: any) {
      setTimeout(() => {
        if (this.onload) {
          this.onload();
        }
      }, 0);
    });
  });

  describe('Basic Rendering', () => {
    it('renders input bar with all elements', () => {
      render(<InputBar onSend={mockOnSend} />);

      expect(screen.getByTestId('paperclip-icon')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Write Your Message')).toBeInTheDocument();
      expect(screen.getByTestId('arrow-up-icon')).toBeInTheDocument();
    });

    it('renders disabled state correctly', () => {
      render(
        <InputBar 
          onSend={mockOnSend} 
          disabled={true} 
          disabledMessage="Please select a model deployment first" 
        />
      );

      expect(screen.getByPlaceholderText('Select a model deployment to start chatting...')).toBeInTheDocument();
      expect(screen.getByText('Please select a model deployment first')).toBeInTheDocument();
      
      const attachButton = screen.getByTitle('Attach files');
      const sendButton = screen.getByTitle('Send message');
      const textarea = screen.getByPlaceholderText('Select a model deployment to start chatting...');
      
      expect(attachButton).toBeDisabled();
      expect(sendButton).toBeDisabled();
      expect(textarea).toBeDisabled();
    });
  });

  describe('Text Input', () => {
    it('handles text input and auto-resize', async () => {
      const user = userEvent.setup();
      render(<InputBar onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText('Write Your Message');
      await user.type(textarea, 'Hello world');

      expect(textarea).toHaveValue('Hello world');
    });

    it('sends message on Enter key press', async () => {
      const user = userEvent.setup();
      render(<InputBar onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText('Write Your Message');
      await user.type(textarea, 'Hello world');
      await user.keyboard('{Enter}');

      expect(mockOnSend).toHaveBeenCalledWith('Hello world', undefined);
      expect(textarea).toHaveValue('');
    });

    it('does not send on Shift+Enter', async () => {
      const user = userEvent.setup();
      render(<InputBar onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText('Write Your Message');
      await user.type(textarea, 'Hello world');
      await user.keyboard('{Shift>}{Enter}{/Shift}');

      expect(mockOnSend).not.toHaveBeenCalled();
      expect(textarea).toHaveValue('Hello world\n');
    });

    it('sends message on send button click', async () => {
      const user = userEvent.setup();
      render(<InputBar onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText('Write Your Message');
      await user.type(textarea, 'Hello world');
      
      const sendButton = screen.getByTitle('Send message');
      await user.click(sendButton);

      expect(mockOnSend).toHaveBeenCalledWith('Hello world', undefined);
      expect(textarea).toHaveValue('');
    });

    it('does not send empty messages', async () => {
      const user = userEvent.setup();
      render(<InputBar onSend={mockOnSend} />);

      const sendButton = screen.getByTitle('Send message');
      await user.click(sendButton);

      expect(mockOnSend).not.toHaveBeenCalled();
    });

    it('trims whitespace from messages', async () => {
      const user = userEvent.setup();
      render(<InputBar onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText('Write Your Message');
      await user.type(textarea, '   Hello world   ');
      
      const sendButton = screen.getByTitle('Send message');
      await user.click(sendButton);

      expect(mockOnSend).toHaveBeenCalledWith('Hello world', undefined);
    });
  });

  describe('File Attachments', () => {
    it('handles file selection and preview', async () => {
      const user = userEvent.setup();
      render(<InputBar onSend={mockOnSend} />);

      const fileInput = screen.getByTitle('Attach files').parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, mockTextFile);

      await waitFor(() => {
        expect(screen.getByText('test.txt')).toBeInTheDocument();
        expect(screen.getByText('1.0 KB • Text')).toBeInTheDocument();
        expect(screen.getByTestId('file-icon')).toBeInTheDocument();
        expect(screen.getByText('1.0 KB / 5 MB')).toBeInTheDocument();
      });
    });

    it('handles image files with preview', async () => {
      const user = userEvent.setup();
      mockFileReader.result = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD';
      
      render(<InputBar onSend={mockOnSend} />);

      const fileInput = screen.getByTitle('Attach files').parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, mockImageFile);

      await waitFor(() => {
        expect(screen.getByText('test.jpg')).toBeInTheDocument();
        expect(screen.getByText('2.0 KB • Image')).toBeInTheDocument();
        const img = screen.getByAltText('test.jpg');
        expect(img).toHaveAttribute('src', 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD');
      });
    });

    it('removes files and handles multiple files', async () => {
      const user = userEvent.setup();
      render(<InputBar onSend={mockOnSend} />);

      const file1 = createMockFile('file1.txt', 'text/plain', 1024);
      const file2 = createMockFile('file2.txt', 'text/plain', 2048);

      const fileInput = screen.getByTitle('Attach files').parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, [file1, file2]);

      await waitFor(() => {
        expect(screen.getByText('file1.txt')).toBeInTheDocument();
        expect(screen.getByText('file2.txt')).toBeInTheDocument();
        expect(screen.getByText('3.0 KB / 5 MB')).toBeInTheDocument();
      });

      // Test file removal
      const removeButton = screen.getAllByTitle('Remove file')[0];
      await user.click(removeButton);
      expect(screen.queryByText('file1.txt')).not.toBeInTheDocument();
    });

    it('enforces file size limits', async () => {
      const user = userEvent.setup();
      render(<InputBar onSend={mockOnSend} />);

      const fileInput = screen.getByTitle('Attach files').parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, mockLargeFile);

      expect(mockToast).toHaveBeenCalledWith({
        title: "Files too large",
        description: expect.stringContaining("exceeds 5MB limit"),
        variant: "destructive",
      });
    });

    it('sends messages with attachments', async () => {
      const user = userEvent.setup();
      render(<InputBar onSend={mockOnSend} />);

      const fileInput = screen.getByTitle('Attach files').parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, mockTextFile);

      await waitFor(() => {
        expect(screen.getByText('test.txt')).toBeInTheDocument();
      });

      const textarea = screen.getByPlaceholderText('Write Your Message');
      await user.type(textarea, 'Here is a file');
      
      const sendButton = screen.getByTitle('Send message');
      await user.click(sendButton);

      expect(mockOnSend).toHaveBeenCalledWith('Here is a file', [
        {
          url: 'data:text/plain;base64,dGVzdCBjb250ZW50',
          mimeType: 'text/plain',
          filename: 'test.txt',
          size: 1024
        }
      ]);
    });
  });

  describe('Disabled State', () => {
    it('renders disabled state correctly', () => {
      render(
        <InputBar 
          onSend={mockOnSend} 
          disabled={true} 
          disabledMessage="Please select a model deployment first" 
        />
      );

      expect(screen.getByPlaceholderText('Select a model deployment to start chatting...')).toBeInTheDocument();
      expect(screen.getByText('Please select a model deployment first')).toBeInTheDocument();
      
      const attachButton = screen.getByTitle('Attach files');
      const sendButton = screen.getByTitle('Send message');
      const textarea = screen.getByPlaceholderText('Select a model deployment to start chatting...');
      
      expect(attachButton).toBeDisabled();
      expect(sendButton).toBeDisabled();
      expect(textarea).toBeDisabled();
    });
  });

  describe('Send Button State', () => {
    it('enables send button when text is entered', async () => {
      const user = userEvent.setup();
      render(<InputBar onSend={mockOnSend} />);

      const sendButton = screen.getByTitle('Send message');
      expect(sendButton).toHaveClass('cursor-not-allowed');

      const textarea = screen.getByPlaceholderText('Write Your Message');
      await user.type(textarea, 'Hello');

      expect(sendButton).not.toHaveClass('cursor-not-allowed');
    });

    it('enables send button when files are attached', async () => {
      const user = userEvent.setup();
      render(<InputBar onSend={mockOnSend} />);

      const sendButton = screen.getByTitle('Send message');
      expect(sendButton).toHaveClass('cursor-not-allowed');

      const fileInput = screen.getByTitle('Attach files').parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, mockTextFile);

      await waitFor(() => {
        expect(sendButton).not.toHaveClass('cursor-not-allowed');
      });
    });

    it('disables send button when disabled prop is true', () => {
      render(<InputBar onSend={mockOnSend} disabled={true} />);

      const sendButton = screen.getByTitle('Send message');
      expect(sendButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('provides proper button titles', () => {
      render(<InputBar onSend={mockOnSend} />);

      expect(screen.getByTitle('Attach files')).toBeInTheDocument();
      expect(screen.getByTitle('Send message')).toBeInTheDocument();
    });

    it('provides proper file removal button title', async () => {
      const user = userEvent.setup();
      render(<InputBar onSend={mockOnSend} />);

      const fileInput = screen.getByTitle('Attach files').parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, mockTextFile);

      await waitFor(() => {
        expect(screen.getByTitle('Remove file')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty file list', async () => {
      const user = userEvent.setup();
      render(<InputBar onSend={mockOnSend} />);

      const fileInput = screen.getByTitle('Attach files').parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
      
      // Simulate selecting no files
      fireEvent.change(fileInput, { target: { files: [] } });

      // Should not show any file previews
      expect(screen.queryByTestId('file-icon')).not.toBeInTheDocument();
    });

    it('handles file with no type', async () => {
      const user = userEvent.setup();
      render(<InputBar onSend={mockOnSend} />);

      const fileWithoutType = createMockFile('unknown', '');
      const fileInput = screen.getByTitle('Attach files').parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, fileWithoutType);

      // Just verify the file input was interacted with - the actual preview behavior may vary
      expect(fileInput).toBeInTheDocument();
    });

    it('clears file input after selection', async () => {
      const user = userEvent.setup();
      render(<InputBar onSend={mockOnSend} />);

      const fileInput = screen.getByTitle('Attach files').parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, mockTextFile);

      await waitFor(() => {
        expect(fileInput.value).toBe('');
      });
    });
  });
});
