import { useState, useMemo } from "react";
import { QuickLinkFormData, defaultFormData } from "@/types/developer-portal";

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function useQuickLinksForm() {
  const [formData, setFormData] = useState<QuickLinkFormData>(defaultFormData);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof QuickLinkFormData, string>>>({});
  const [touchedFields, setTouchedFields] = useState<Set<keyof QuickLinkFormData>>(new Set());

  const isFormValid = useMemo(() => {
    if (!formData.title.trim() || !formData.url.trim() || !formData.category.trim()) {
      return false;
    }
    if (!isValidUrl(formData.url)) {
      return false;
    }
    return true;
  }, [formData]);

   const validateField = (field: keyof QuickLinkFormData): string | undefined => {
    switch (field) {
      case 'title':
        if (!formData.title.trim()) {
          return 'Title is required';
        }
        break;
      case 'url':
        if (!formData.url.trim()) {
          return 'URL is required';
        } else if (!isValidUrl(formData.url)) {
          return 'Please enter a valid URL (e.g., https://example.com)';
        }
        break;
      case 'category':
        if (!formData.category.trim()) {
          return 'Category is required';
        }
        break;
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof QuickLinkFormData, string>> = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }

    if (!formData.url.trim()) {
      errors.url = 'URL is required';
    } else if (!isValidUrl(formData.url)) {
      errors.url = 'Please enter a valid URL (e.g., https://example.com)';
    }

    if (!formData.category.trim()) {
      errors.category = 'Category is required';
    }

    setFormErrors(errors);
    setTouchedFields(new Set(['title', 'url', 'category']));
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData(defaultFormData);
    setFormErrors({});
    setTouchedFields(new Set());
  };

  const updateField = <K extends keyof QuickLinkFormData>(
    field: K,
    value: QuickLinkFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFieldBlur = (field: keyof QuickLinkFormData) => {
    setTouchedFields(prev => new Set(prev).add(field));
    const error = validateField(field);
    setFormErrors(prev => ({ ...prev, [field]: error }));
  };

  const shouldShowError = (field: keyof QuickLinkFormData): boolean => {
    return touchedFields.has(field) && !!formErrors[field];
  };

  return {
    formData,
    formErrors,
    isFormValid,
    validateForm,
    resetForm,
    updateField,
    setFormData,
    handleFieldBlur,
    shouldShowError,
  };
}