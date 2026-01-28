import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentViewApi } from '../../src/components/ComponentViewApi';
import type { SwaggerUIResponse } from '../../src/hooks/api/useSwaggerUI';
import '@testing-library/jest-dom/vitest';

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Loader2: ({ className }: { className?: string }) => <div data-testid="loader-icon" className={className} />,
  Code2: ({ className }: { className?: string }) => <div data-testid="code-icon" className={className} />,
  ExternalLink: ({ className }: { className?: string }) => <div data-testid="external-link-icon" className={className} />,
  AlertCircle: ({ className }: { className?: string }) => <div data-testid="alert-circle-icon" className={className} />,
}));

// Mock UI components
vi.mock('../../src/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-content" className={className}>{children}</div>
  ),
  CardHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-header" className={className}>{children}</div>
  ),
  CardTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-title" className={className}>{children}</div>
  ),
}));

vi.mock('../../src/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, className }: { 
    children: React.ReactNode; 
    onClick?: () => void; 
    variant?: string; 
    size?: string; 
    className?: string;
  }) => (
    <button 
      data-testid="button" 
      onClick={onClick} 
      data-variant={variant} 
      data-size={size} 
      className={className}
    >
      {children}
    </button>
  ),
}));

vi.mock('../../src/components/ui/label', () => ({
  Label: ({ children, htmlFor, className }: { children: React.ReactNode; htmlFor?: string; className?: string }) => (
    <label data-testid="label" htmlFor={htmlFor} className={className}>{children}</label>
  ),
}));

vi.mock('../../src/components/ui/switch', () => ({
  Switch: ({ id, checked, onCheckedChange, className }: { 
    id?: string; 
    checked: boolean; 
    onCheckedChange: (checked: boolean) => void; 
    className?: string;
  }) => (
    <input
      data-testid="switch"
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      className={className}
    />
  ),
}));

// Mock Swagger UI
vi.mock('swagger-ui-react', () => ({
  default: ({ spec }: { spec: any }) => (
    <div data-testid="swagger-ui" data-spec={JSON.stringify(spec)}>
      Swagger UI Component
    </div>
  ),
}));

// Mock RapiDoc
vi.mock('rapidoc', () => ({}));

// Mock the rapi-doc custom element with loadSpec method
Object.defineProperty(window, 'customElements', {
  value: {
    define: vi.fn(),
    get: vi.fn(),
  },
  writable: true,
});

// Create a proper DOM element mock for rapi-doc
const createMockRapiDocElement = () => {
  const element = document.createElement('div');
  
  // Add the loadSpec method
  (element as any).loadSpec = vi.fn();
  
  // Add other methods that might be called
  (element as any).setAttribute = vi.fn();
  (element as any).removeAttribute = vi.fn();
  (element as any).getAttribute = vi.fn();
  
  // Override the tagName getter to return 'RAPI-DOC'
  Object.defineProperty(element, 'tagName', {
    value: 'RAPI-DOC',
    writable: false,
    enumerable: true,
    configurable: true
  });
  
  return element;
};

// Override document.createElement to return our mock for rapi-doc
const originalCreateElement = document.createElement.bind(document);
document.createElement = vi.fn((tagName: string) => {
  if (tagName === 'rapi-doc') {
    return createMockRapiDocElement() as any;
  }
  return originalCreateElement(tagName);
});

// Mock window.open
const mockWindowOpen = vi.fn();
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true,
});

describe('ComponentViewApi', () => {
  const mockSwaggerData: SwaggerUIResponse = {
    schema: {
      openapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
        description: 'Test API Description',
      },
      paths: {
        '/test': {
          get: {
            summary: 'Test endpoint',
            responses: {
              '200': {
                description: 'Success',
              },
            },
          },
        },
      },
    },
    swaggerUiUrl: 'https://example.com/swagger-ui',
  };

  const mockSwaggerDataWithoutUrl: SwaggerUIResponse = {
    schema: {
      openapi: '3.0.0',
      info: {
        title: 'Test API Without URL',
        version: '2.0.0',
      },
      paths: {},
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state', () => {
    render(
      <ComponentViewApi 
        isLoading={true} 
        error={null} 
        swaggerData={undefined} 
      />
    );

    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    expect(screen.getByText('Loading API documentation...')).toBeInTheDocument();
  });

  it('should render error state when error is provided', () => {
    const error = new Error('Failed to load API documentation');
    
    render(
      <ComponentViewApi 
        isLoading={false} 
        error={error} 
        swaggerData={undefined} 
      />
    );

    expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
    expect(screen.getByText('API Documentation Not Available')).toBeInTheDocument();
    expect(screen.getByText('Failed to load API documentation')).toBeInTheDocument();
  });

  it('should render error state when swaggerData is undefined', () => {
    render(
      <ComponentViewApi 
        isLoading={false} 
        error={null} 
        swaggerData={undefined} 
      />
    );

    expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
    expect(screen.getByText('API Documentation Not Available')).toBeInTheDocument();
    expect(screen.getByText('Unable to load API documentation for this component.')).toBeInTheDocument();
  });

  it('should render API documentation with title and version', () => {
    render(
      <ComponentViewApi 
        isLoading={false} 
        error={null} 
        swaggerData={mockSwaggerData} 
      />
    );

    expect(screen.getByTestId('code-icon')).toBeInTheDocument();
    expect(screen.getByText('Test API')).toBeInTheDocument();
    expect(screen.getByText('Version 1.0.0')).toBeInTheDocument();
  });

  it('should render API documentation without version when not provided', () => {
    const swaggerDataNoVersion: SwaggerUIResponse = {
      schema: {
        openapi: '3.0.0',
        info: {
          title: 'Test API No Version',
        },
        paths: {},
      },
    };

    render(
      <ComponentViewApi 
        isLoading={false} 
        error={null} 
        swaggerData={swaggerDataNoVersion} 
      />
    );

    expect(screen.getByText('Test API No Version')).toBeInTheDocument();
    expect(screen.queryByText(/^Version/)).not.toBeInTheDocument();
  });

  it('should render fallback title when info.title is not provided', () => {
    const swaggerDataNoTitle: SwaggerUIResponse = {
      schema: { openapi: '3.0.0', info: {}, paths: {} },
    };

    render(
      <ComponentViewApi 
        isLoading={false} 
        error={null} 
        swaggerData={swaggerDataNoTitle} 
      />
    );

    expect(screen.getByText('API Documentation')).toBeInTheDocument();
  });

  it('should render viewer toggle switch', () => {
    render(
      <ComponentViewApi 
        isLoading={false} 
        error={null} 
        swaggerData={mockSwaggerData} 
      />
    );

    expect(screen.getByTestId('switch')).toBeInTheDocument();
    expect(screen.getByText('Swagger UI')).toBeInTheDocument();
  });

  it('should toggle between Swagger UI and RapiDoc', () => {
    render(
      <ComponentViewApi 
        isLoading={false} 
        error={null} 
        swaggerData={mockSwaggerData} 
      />
    );

    const toggle = screen.getByTestId('switch');
    
    // Initially should show Swagger UI
    expect(screen.getByText('Swagger UI')).toBeInTheDocument();
    expect(screen.getByTestId('swagger-ui')).toBeInTheDocument();

    // Toggle to RapiDoc
    fireEvent.click(toggle);
    expect(toggle).toBeChecked();
  });

  it('should render "Open in New Tab" button when swaggerUiUrl is provided', () => {
    render(
      <ComponentViewApi 
        isLoading={false} 
        error={null} 
        swaggerData={mockSwaggerData} 
      />
    );

    const openButton = screen.getByText('Open in New Tab').closest('button');
    expect(openButton).toBeInTheDocument();
    expect(screen.getByTestId('external-link-icon')).toBeInTheDocument();
  });

  it('should not render "Open in New Tab" button when swaggerUiUrl is not provided', () => {
    render(
      <ComponentViewApi 
        isLoading={false} 
        error={null} 
        swaggerData={mockSwaggerDataWithoutUrl} 
      />
    );

    expect(screen.queryByText('Open in New Tab')).not.toBeInTheDocument();
  });

  it('should open new tab when "Open in New Tab" button is clicked', () => {
    render(
      <ComponentViewApi 
        isLoading={false} 
        error={null} 
        swaggerData={mockSwaggerData} 
      />
    );

    const openButton = screen.getByText('Open in New Tab').closest('button');
    fireEvent.click(openButton!);

    expect(mockWindowOpen).toHaveBeenCalledWith('https://example.com/swagger-ui', '_blank');
  });

  it('should render Swagger UI by default', () => {
    render(
      <ComponentViewApi 
        isLoading={false} 
        error={null} 
        swaggerData={mockSwaggerData} 
      />
    );

    expect(screen.getByTestId('swagger-ui')).toBeInTheDocument();
    expect(screen.queryByText('rapi-doc')).not.toBeInTheDocument();
  });

  it('should pass correct spec to Swagger UI', () => {
    render(
      <ComponentViewApi 
        isLoading={false} 
        error={null} 
        swaggerData={mockSwaggerData} 
      />
    );

    const swaggerUI = screen.getByTestId('swagger-ui');
    expect(swaggerUI).toHaveAttribute('data-spec', JSON.stringify(mockSwaggerData.schema));
  });
});
