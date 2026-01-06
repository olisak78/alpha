import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MermaidDiagram } from '../../../src/features/docs/components/MermaidDiagram';
import '@testing-library/jest-dom/vitest';

// Mock mermaid library
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn(),
  },
}));

import mermaid from 'mermaid';
const mockMermaid = vi.mocked(mermaid);

describe('MermaidDiagram', () => {
  const validChart = `
    graph TD
      A[Start] --> B{Decision}
      B -->|Yes| C[Action 1]
      B -->|No| D[Action 2]
      C --> E[End]
      D --> E
  `;

  const invalidChart = `
    invalid mermaid syntax
    this should fail
  `;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset the mermaid initialization flag
    // Note: In the actual component, mermaidInitialized is a module-level variable
    // We can't directly reset it, but we can ensure initialize is called
    
    // Mock document.documentElement.classList.contains for theme detection
    Object.defineProperty(document.documentElement, 'classList', {
      value: {
        contains: vi.fn().mockReturnValue(false), // Default to light mode
      },
      writable: true,
    });
  });

  it('should render valid mermaid diagram', async () => {
    const mockSvg = '<svg><g>Mock Mermaid Diagram</g></svg>';
    mockMermaid.render.mockResolvedValue({ svg: mockSvg, diagramType: 'flowchart' });

    render(<MermaidDiagram chart={validChart} />);

    await waitFor(() => {
      expect(mockMermaid.render).toHaveBeenCalled();
    });

    // Check that the SVG is rendered
    await waitFor(() => {
      const container = screen.getByText('Mock Mermaid Diagram').closest('div');
      expect(container).toBeInTheDocument();
    });
  });


  it('should generate unique IDs for each diagram', async () => {
    const mockSvg = '<svg><g>Test</g></svg>';
    mockMermaid.render.mockResolvedValue({ svg: mockSvg, diagramType: 'flowchart' });

    render(<MermaidDiagram chart={validChart} />);

    await waitFor(() => {
      expect(mockMermaid.render).toHaveBeenCalled();
    });

    const renderCall = mockMermaid.render.mock.calls[0];
    const generatedId = renderCall[0];
    
    // Should start with 'mermaid-' and have a random suffix
    expect(generatedId).toMatch(/^mermaid-[a-z0-9]+$/);
  });

  it('should log errors to console when rendering fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Rendering failed');
    mockMermaid.render.mockRejectedValue(error);

    render(<MermaidDiagram chart={invalidChart} />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Mermaid rendering error:', error);
    });

    consoleSpy.mockRestore();
  });

  it('should have proper styling for error state', async () => {
    mockMermaid.render.mockRejectedValue(new Error('Test error'));

    render(<MermaidDiagram chart={invalidChart} />);

    await waitFor(() => {
      const errorContainer = screen.getByText(/Failed to render Mermaid diagram/).closest('div');
      expect(errorContainer).toHaveClass('my-4', 'p-4', 'border', 'rounded-lg');
      expect(errorContainer?.className).toContain('border-red-300');
      expect(errorContainer?.className).toContain('bg-red-50');
    });
  });

  it('should have proper styling for success state', async () => {
    const mockSvg = '<svg><g>Success</g></svg>';
    mockMermaid.render.mockResolvedValue({ svg: mockSvg, diagramType: 'flowchart' });

    const { container } = render(<MermaidDiagram chart={validChart} />);

    await waitFor(() => {
      const diagramContainer = container.querySelector('.my-6');
      expect(diagramContainer).toHaveClass('my-6', 'flex', 'justify-center', 'overflow-x-auto');
    });
  });

  it('should handle empty chart gracefully', async () => {
    const error = new Error('Empty chart');
    mockMermaid.render.mockRejectedValue(error);

    render(<MermaidDiagram chart="" />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to render Mermaid diagram/)).toBeInTheDocument();
    });
  });

  it('should re-render when chart prop changes', async () => {
    const mockSvg1 = '<svg><g>Chart 1</g></svg>';
    const mockSvg2 = '<svg><g>Chart 2</g></svg>';
    
    mockMermaid.render
      .mockResolvedValueOnce({ svg: mockSvg1, diagramType: 'flowchart' })
      .mockResolvedValueOnce({ svg: mockSvg2, diagramType: 'flowchart' });

    const { rerender } = render(<MermaidDiagram chart="graph TD; A --> B" />);

    await waitFor(() => {
      expect(mockMermaid.render).toHaveBeenCalledTimes(1);
    });

    rerender(<MermaidDiagram chart="graph LR; X --> Y" />);

    await waitFor(() => {
      expect(mockMermaid.render).toHaveBeenCalledTimes(2);
    });
  });

  it('should support dark mode styling for error state', async () => {
    mockMermaid.render.mockRejectedValue(new Error('Test error'));

    render(<MermaidDiagram chart={invalidChart} />);

    await waitFor(() => {
      const errorContainer = screen.getByText(/Failed to render Mermaid diagram/).closest('div');
      expect(errorContainer?.className).toContain('dark:border-red-700');
      expect(errorContainer?.className).toContain('dark:bg-red-900/20');
    });
  });
});
