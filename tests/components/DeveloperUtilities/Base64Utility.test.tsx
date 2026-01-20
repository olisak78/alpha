import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Base64Utility } from '@/components/DeveloperUtilities/Base64Utility';

// Mock the toast hook
const mockToast = vi.fn();
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}));

// Mock Tabs components
vi.mock('@/components/ui/tabs', () => ({
  TabsContent: ({ children, ...props }: any) => <div {...props}>{children}</div>
}));

describe('Base64Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render input and output text areas', () => {
    render(<Base64Utility />);
    
    expect(screen.getByLabelText('Input')).toBeInTheDocument();
    expect(screen.getByLabelText('Output')).toBeInTheDocument();
  });

  it('should render all action buttons', () => {
    render(<Base64Utility />);
    
    expect(screen.getByRole('button', { name: /encode/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /decode/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /parse jwt/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });

  it('should disable action buttons when input is empty', () => {
    render(<Base64Utility />);
    
    expect(screen.getByRole('button', { name: /encode/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /decode/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /parse jwt/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /clear/i })).toBeDisabled();
  });

  it('should enable buttons when input has text', async () => {
    const user = userEvent.setup();
    render(<Base64Utility />);
    
    const input = screen.getByLabelText('Input');
    await user.type(input, 'test');
    
    expect(screen.getByRole('button', { name: /encode/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /decode/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /parse jwt/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /clear/i })).toBeEnabled();
  });

  it('should encode text to Base64', async () => {
    const user = userEvent.setup();
    render(<Base64Utility />);
    
    const input = screen.getByLabelText('Input');
    await user.type(input, 'Hello World');
    
    const encodeButton = screen.getByRole('button', { name: /encode/i });
    await user.click(encodeButton);
    
    const output = screen.getByLabelText('Output') as HTMLTextAreaElement;
    expect(output.value).toBe('SGVsbG8gV29ybGQ=');
    
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Success',
      description: 'String encoded to Base64',
    });
  });

  it('should decode Base64 to text', async () => {
    const user = userEvent.setup();
    render(<Base64Utility />);
    
    const input = screen.getByLabelText('Input');
    await user.type(input, 'SGVsbG8gV29ybGQ=');
    
    const decodeButton = screen.getByRole('button', { name: /decode/i });
    await user.click(decodeButton);
    
    const output = screen.getByLabelText('Output') as HTMLTextAreaElement;
    expect(output.value).toBe('Hello World');
    
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Success',
      description: 'Base64 string decoded',
    });
  });

  it('should show error when decoding invalid Base64', async () => {
    const user = userEvent.setup();
    render(<Base64Utility />);
    
    const input = screen.getByLabelText('Input');
    await user.type(input, 'invalid-base64!!!');
    
    const decodeButton = screen.getByRole('button', { name: /decode/i });
    await user.click(decodeButton);
    
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Error',
      description: "Failed to decode Base64 string. Make sure it's a valid Base64 string.",
      variant: 'destructive',
    });
  });

  it('should parse valid JWT token', async () => {
    const user = userEvent.setup();
    render(<Base64Utility />);
    
    // Valid JWT token (header.payload.signature)
    const validJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    
    const input = screen.getByLabelText('Input');
    await user.type(input, validJWT);
    
    const parseButton = screen.getByRole('button', { name: /parse jwt/i });
    await user.click(parseButton);
    
    const output = screen.getByLabelText('Output') as HTMLTextAreaElement;
    const parsed = JSON.parse(output.value);
    
    expect(parsed.header).toEqual({ alg: 'HS256', typ: 'JWT' });
    expect(parsed.payload).toEqual({ sub: '1234567890', name: 'John Doe', iat: 1516239022 });
    expect(parsed.signature).toBeDefined();
    
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Success',
      description: 'JWT parsed successfully',
    });
  });

  it('should handle JWT with Bearer prefix', async () => {
    const user = userEvent.setup();
    render(<Base64Utility />);
    
    const validJWT = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    
    const input = screen.getByLabelText('Input');
    await user.type(input, validJWT);
    
    const parseButton = screen.getByRole('button', { name: /parse jwt/i });
    await user.click(parseButton);
    
    const output = screen.getByLabelText('Output') as HTMLTextAreaElement;
    expect(output.value).toContain('"header"');
    expect(output.value).toContain('"payload"');
  });

  it('should show error when parsing invalid JWT', async () => {
    const user = userEvent.setup();
    render(<Base64Utility />);
    
    const input = screen.getByLabelText('Input');
    await user.type(input, 'invalid.jwt');
    
    const parseButton = screen.getByRole('button', { name: /parse jwt/i });
    await user.click(parseButton);
    
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Error',
      description: "Failed to parse JWT. Make sure it's a valid JWT token.",
      variant: 'destructive',
    });
  });

  it('should clear both input and output fields', async () => {
    const user = userEvent.setup();
    render(<Base64Utility />);
    
    const input = screen.getByLabelText('Input') as HTMLTextAreaElement;
    await user.type(input, 'test');
    
    const encodeButton = screen.getByRole('button', { name: /encode/i });
    await user.click(encodeButton);
    
    const output = screen.getByLabelText('Output') as HTMLTextAreaElement;
    expect(output.value).toBeTruthy();
    
    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);
    
    expect(input.value).toBe('');
    expect(output.value).toBe('');
    
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Cleared',
      description: 'Input and output fields have been cleared',
    });
  });

  it('should have proper placeholder text', () => {
    render(<Base64Utility />);
    
    expect(screen.getByPlaceholderText(/enter text to encode/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/result will appear here/i)).toBeInTheDocument();
  });

  it('should make output field read-only', () => {
    render(<Base64Utility />);
    
    const output = screen.getByLabelText('Output');
    expect(output).toHaveAttribute('readonly');
  });
});