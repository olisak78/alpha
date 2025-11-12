import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { FormPreview } from '../../../src/components/SelfService/FormPreview';
import type { JenkinsJobField } from '../../../src/types/api';

describe('FormPreview', () => {
  const mockParameters: JenkinsJobField[] = [
    {
      name: 'DEPLOY_VERSION',
      type: 'StringParameterDefinition',
      description: 'Version to deploy',
      defaultParameterValue: { value: '1.0.0' }
    },
    {
      name: 'ENABLE_DEBUG',
      type: 'checkbox',
      description: 'Enable debug mode',
      defaultParameterValue: { value: false }
    }
  ];

  const mockFormData = {
    DEPLOY_VERSION: '2.0.0',
    ENABLE_DEBUG: true
  };

  describe('Basic Rendering', () => {
    it('renders parameters with values', () => {
      render(<FormPreview parameters={mockParameters} formData={mockFormData} />);

      expect(screen.getByText('DEPLOY_VERSION')).toBeInTheDocument();
      expect(screen.getByText('ENABLE_DEBUG')).toBeInTheDocument();
      expect(screen.getByText('2.0.0')).toBeInTheDocument();
      expect(screen.getByText('true')).toBeInTheDocument();
    });

    it('uses parameter names as-is without formatting', () => {
      const parametersWithPrefix: JenkinsJobField[] = [
        {
          name: 'DEPLOY_APPLICATION_VERSION',
          type: 'text',
          defaultParameterValue: { value: 'v1.0' }
        }
      ];

      render(<FormPreview parameters={parametersWithPrefix} formData={{}} />);
      expect(screen.getByText('DEPLOY_APPLICATION_VERSION')).toBeInTheDocument();
    });
  });

  describe('Value Display Logic', () => {
    it('uses formData value when available, falls back to defaults', () => {
      render(<FormPreview parameters={mockParameters} formData={{}} />);

      expect(screen.getByText('1.0.0')).toBeInTheDocument(); // default value
      // Note: false boolean values are filtered out by the component, so they won't be displayed
    });

    it('filters out parameters with no values', () => {
      const parametersWithoutDefaults: JenkinsJobField[] = [
        {
          name: 'EMPTY_PARAM',
          type: 'text'
        }
      ];

      const { container } = render(<FormPreview parameters={parametersWithoutDefaults} formData={{}} />);
      // Should not display empty parameters
      expect(screen.queryByText('EMPTY_PARAM')).not.toBeInTheDocument();
      expect(container.firstChild?.textContent).toBe('');
    });
  });

  describe('Boolean Values', () => {
    it('displays boolean values correctly', () => {
      const booleanFormData = { ENABLE_DEBUG: true };
      render(<FormPreview parameters={mockParameters} formData={booleanFormData} />);

      expect(screen.getByText('true')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty parameters array', () => {
      const { container } = render(<FormPreview parameters={[]} formData={{}} />);
      expect(container.firstChild).toBeInTheDocument();
      expect(container.textContent).toBe(''); // Should render empty container
    });

    it('handles null values gracefully', () => {
      const formDataWithNulls = {
        DEPLOY_VERSION: null,
        ENABLE_DEBUG: undefined
      };

      const { container } = render(<FormPreview parameters={mockParameters} formData={formDataWithNulls} />);
      // Null/undefined values should be filtered out completely
      expect(screen.queryByText('DEPLOY_VERSION')).not.toBeInTheDocument();
      expect(screen.queryByText('ENABLE_DEBUG')).not.toBeInTheDocument();
      expect(container.firstChild?.textContent).toBe('');
    });
  });
});
