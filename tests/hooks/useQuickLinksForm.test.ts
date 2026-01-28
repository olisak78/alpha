import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useQuickLinksForm } from "@/hooks/useQuickLinksForm";

describe("useQuickLinksForm", () => {
  describe("Initial State", () => {

    it("should initialize with no form errors", () => {
      const { result } = renderHook(() => useQuickLinksForm());

      expect(result.current.formErrors).toEqual({});
    });

    it("should initialize with isFormValid as false", () => {
      const { result } = renderHook(() => useQuickLinksForm());

      expect(result.current.isFormValid).toBe(false);
    });
  });

  describe("updateField", () => {
    it("should update title field", () => {
      const { result } = renderHook(() => useQuickLinksForm());

      act(() => {
        result.current.updateField("title", "My Title");
      });

      expect(result.current.formData.title).toBe("My Title");
    });

    it("should update url field", () => {
      const { result } = renderHook(() => useQuickLinksForm());

      act(() => {
        result.current.updateField("url", "https://example.com");
      });

      expect(result.current.formData.url).toBe("https://example.com");
    });

    it("should update category field", () => {
      const { result } = renderHook(() => useQuickLinksForm());

      act(() => {
        result.current.updateField("category", "Development");
      });

      expect(result.current.formData.category).toBe("Development");
    });

    it("should update description field", () => {
      const { result } = renderHook(() => useQuickLinksForm());

      act(() => {
        result.current.updateField("description", "A helpful link");
      });

      expect(result.current.formData.description).toBe("A helpful link");
    });

    it("should clear field error when field is updated", () => {
      const { result } = renderHook(() => useQuickLinksForm());

      // First, validate to get errors
      act(() => {
        result.current.validateForm();
      });

      expect(result.current.formErrors.title).toBeDefined();

      // Update the field
      act(() => {
        result.current.updateField("title", "Valid Title");
      });

      expect(result.current.formErrors.title).toBeUndefined();
    });

    it("should update multiple fields independently", () => {
      const { result } = renderHook(() => useQuickLinksForm());

      act(() => {
        result.current.updateField("title", "Title");
        result.current.updateField("url", "https://example.com");
        result.current.updateField("category", "Docs");
      });

      expect(result.current.formData.title).toBe("Title");
      expect(result.current.formData.url).toBe("https://example.com");
      expect(result.current.formData.category).toBe("Docs");
    });
  });

  describe("Field Validation - Title", () => {
    it("should require title", () => {
      const { result } = renderHook(() => useQuickLinksForm());

      act(() => {
        result.current.handleFieldBlur("title");
      });

      expect(result.current.formErrors.title).toBe("Title is required");
    });

    it("should reject whitespace-only title", () => {
      const { result } = renderHook(() => useQuickLinksForm());

      act(() => {
        result.current.updateField("title", "   ");
      });

      act(() => {
        result.current.handleFieldBlur("title");
      });

      expect(result.current.formErrors.title).toBe("Title is required");
    });

    it("should accept valid title", () => {
      const { result } = renderHook(() => useQuickLinksForm());

      act(() => {
        result.current.updateField("title", "Valid Title");
      });

      act(() => {
        result.current.handleFieldBlur("title");
      });

      expect(result.current.formErrors.title).toBeUndefined();
    });
  });

  describe("Field Validation - URL", () => {
    it("should require URL", () => {
      const { result } = renderHook(() => useQuickLinksForm());

      act(() => {
        result.current.handleFieldBlur("url");
      });

      expect(result.current.formErrors.url).toBe("URL is required");
    });

    it("should reject whitespace-only URL", () => {
      const { result } = renderHook(() => useQuickLinksForm());

      act(() => {
        result.current.updateField("url", "   ");
      });

      act(() => {
        result.current.handleFieldBlur("url");
      });

      expect(result.current.formErrors.url).toBe("URL is required");
    });

    it("should reject invalid URL format", () => {
      const { result } = renderHook(() => useQuickLinksForm());

      act(() => {
        result.current.updateField("url", "not-a-valid-url");
      });

      act(() => {
        result.current.handleFieldBlur("url");
      });

      expect(result.current.formErrors.url).toBe(
        "Please enter a valid URL (e.g., https://example.com)"
      );
    });

    it("should accept valid HTTP URL", () => {
      const { result } = renderHook(() => useQuickLinksForm());

      act(() => {
        result.current.updateField("url", "http://example.com");
      });

      act(() => {
        result.current.handleFieldBlur("url");
      });

      expect(result.current.formErrors.url).toBeUndefined();
    });

    it("should accept valid HTTPS URL", () => {
      const { result } = renderHook(() => useQuickLinksForm());

      act(() => {
        result.current.updateField("url", "https://example.com");
      });

      act(() => {
        result.current.handleFieldBlur("url");
      });

      expect(result.current.formErrors.url).toBeUndefined();
    });

    it("should accept URL with path", () => {
      const { result } = renderHook(() => useQuickLinksForm());

      act(() => {
        result.current.updateField("url", "https://example.com/path/to/resource");
      });

      act(() => {
        result.current.handleFieldBlur("url");
      });

      expect(result.current.formErrors.url).toBeUndefined();
    });

    it("should accept URL with query parameters", () => {
      const { result } = renderHook(() => useQuickLinksForm());

      act(() => {
        result.current.updateField("url", "https://example.com?param=value");
      });

      act(() => {
        result.current.handleFieldBlur("url");
      });

      expect(result.current.formErrors.url).toBeUndefined();
    });
  });

  describe("Field Validation - Category", () => {
    it("should require category", () => {
      const { result } = renderHook(() => useQuickLinksForm());

      act(() => {
        result.current.handleFieldBlur("category");
      });

      expect(result.current.formErrors.category).toBe("Category is required");
    });

    it("should reject whitespace-only category", () => {
      const { result } = renderHook(() => useQuickLinksForm());

      act(() => {
        result.current.updateField("category", "   ");
      });

      act(() => {
        result.current.handleFieldBlur("category");
      });

      expect(result.current.formErrors.category).toBe("Category is required");
    });

    it("should accept valid category", () => {
      const { result } = renderHook(() => useQuickLinksForm());

      act(() => {
        result.current.updateField("category", "Development");
      });

      act(() => {
        result.current.handleFieldBlur("category");
      });

      expect(result.current.formErrors.category).toBeUndefined();
    });
  });

  describe("validateForm", () => {
    it("should return false when all fields are empty", () => {
      const { result } = renderHook(() => useQuickLinksForm());

      let isValid: boolean = false;

      act(() => {
        isValid = result.current.validateForm();
      });

      expect(isValid).toBe(false);
      expect(result.current.formErrors.title).toBe("Title is required");
      expect(result.current.formErrors.url).toBe("URL is required");
      expect(result.current.formErrors.category).toBe("Category is required");
    });

    it("should return false when title is missing", () => {
      const { result } = renderHook(() => useQuickLinksForm());

      act(() => {
        result.current.updateField("url", "https://example.com");
        result.current.updateField("category", "Development");
      });

      let isValid: boolean = false;

      act(() => {
        isValid = result.current.validateForm();
      });

      expect(isValid).toBe(false);
      expect(result.current.formErrors.title).toBe("Title is required");
    });

    it("should return false when URL is missing", () => {
      const { result } = renderHook(() => useQuickLinksForm());

      act(() => {
        result.current.updateField("title", "My Link");
        result.current.updateField("category", "Development");
      });

      let isValid: boolean = false;

      act(() => {
        isValid = result.current.validateForm();
      });

      expect(isValid).toBe(false);
      expect(result.current.formErrors.url).toBe("URL is required");
    });

    it("should return false when URL is invalid", () => {
      const { result } = renderHook(() => useQuickLinksForm());

      act(() => {
        result.current.updateField("title", "My Link");
        result.current.updateField("url", "invalid-url");
        result.current.updateField("category", "Development");
      });

      let isValid: boolean = false;

      act(() => {
        isValid = result.current.validateForm();
      });

      expect(isValid).toBe(false);
      expect(result.current.formErrors.url).toBe(
        "Please enter a valid URL (e.g., https://example.com)"
      );
    });

    it("should return false when category is missing", () => {
      const { result } = renderHook(() => useQuickLinksForm());

      act(() => {
        result.current.updateField("title", "My Link");
        result.current.updateField("url", "https://example.com");
      });

      let isValid: boolean = false;

      act(() => {
        isValid = result.current.validateForm();
      });

      expect(isValid).toBe(false);
      expect(result.current.formErrors.category).toBe("Category is required");
    });

    it("should return true when all fields are valid", () => {
      const { result } = renderHook(() => useQuickLinksForm());

      act(() => {
        result.current.updateField("title", "My Link");
        result.current.updateField("url", "https://example.com");
        result.current.updateField("category", "Development");
      });

      let isValid: boolean = false;

      act(() => {
        isValid = result.current.validateForm();
      });

      expect(isValid).toBe(true);
      expect(result.current.formErrors).toEqual({});
    });

    it("should mark all required fields as touched", () => {
      const { result } = renderHook(() => useQuickLinksForm());

      act(() => {
        result.current.validateForm();
      });

      expect(result.current.shouldShowError("title")).toBe(true);
      expect(result.current.shouldShowError("url")).toBe(true);
      expect(result.current.shouldShowError("category")).toBe(true);
    });
  });

  describe("isFormValid", () => {
    it("should be false when form is empty", () => {
      const { result } = renderHook(() => useQuickLinksForm());

      expect(result.current.isFormValid).toBe(false);
    });

    it("should be false when title is missing", () => {
      const { result } = renderHook(() => useQuickLinksForm());

      act(() => {
        result.current.updateField("url", "https://example.com");
        result.current.updateField("category", "Development");
      });

      expect(result.current.isFormValid).toBe(false);
    });

    it("should be false when URL is missing", () => {
      const { result } = renderHook(() => useQuickLinksForm());

      act(() => {
        result.current.updateField("title", "My Link");
        result.current.updateField("category", "Development");
      });

      expect(result.current.isFormValid).toBe(false);
    });

    it("should be false when URL is invalid", () => {
      const { result } = renderHook(() => useQuickLinksForm());

      act(() => {
        result.current.updateField("title", "My Link");
        result.current.updateField("url", "not-a-url");
        result.current.updateField("category", "Development");
      });

      expect(result.current.isFormValid).toBe(false);
    });

    it("should be false when category is missing", () => {
      const { result } = renderHook(() => useQuickLinksForm());

      act(() => {
        result.current.updateField("title", "My Link");
        result.current.updateField("url", "https://example.com");
      });

      expect(result.current.isFormValid).toBe(false);
    });

    it("should be true when all required fields are valid", () => {
      const { result } = renderHook(() => useQuickLinksForm());

      act(() => {
        result.current.updateField("title", "My Link");
        result.current.updateField("url", "https://example.com");
        result.current.updateField("category", "Development");
      });

      expect(result.current.isFormValid).toBe(true);
    });

    it("should update when form data changes", () => {
      const { result } = renderHook(() => useQuickLinksForm());

      expect(result.current.isFormValid).toBe(false);

      act(() => {
        result.current.updateField("title", "My Link");
        result.current.updateField("url", "https://example.com");
        result.current.updateField("category", "Development");
      });

      expect(result.current.isFormValid).toBe(true);

      act(() => {
        result.current.updateField("url", "");
      });

      expect(result.current.isFormValid).toBe(false);
    });
  });

  describe("resetForm", () => {

    it("should clear all errors", () => {
      const { result } = renderHook(() => useQuickLinksForm());

      act(() => {
        result.current.validateForm();
      });

      expect(Object.keys(result.current.formErrors).length).toBeGreaterThan(0);

      act(() => {
        result.current.resetForm();
      });

      expect(result.current.formErrors).toEqual({});
    });

    it("should clear all touched fields", () => {
      const { result } = renderHook(() => useQuickLinksForm());

      act(() => {
        result.current.handleFieldBlur("title");
        result.current.handleFieldBlur("url");
      });

      expect(result.current.shouldShowError("title")).toBe(true);

      act(() => {
        result.current.resetForm();
      });

      expect(result.current.shouldShowError("title")).toBe(false);
      expect(result.current.shouldShowError("url")).toBe(false);
    });
  });

  describe("handleFieldBlur", () => {
    it("should mark field as touched", () => {
      const { result } = renderHook(() => useQuickLinksForm());

      expect(result.current.shouldShowError("title")).toBe(false);

      act(() => {
        result.current.handleFieldBlur("title");
      });

      expect(result.current.shouldShowError("title")).toBe(true);
    });

    it("should validate field on blur", () => {
      const { result } = renderHook(() => useQuickLinksForm());

      act(() => {
        result.current.handleFieldBlur("title");
      });

      expect(result.current.formErrors.title).toBe("Title is required");
    });

    it("should handle multiple field blurs", () => {
      const { result } = renderHook(() => useQuickLinksForm());

      act(() => {
        result.current.handleFieldBlur("title");
        result.current.handleFieldBlur("url");
        result.current.handleFieldBlur("category");
      });

      expect(result.current.shouldShowError("title")).toBe(true);
      expect(result.current.shouldShowError("url")).toBe(true);
      expect(result.current.shouldShowError("category")).toBe(true);
    });
  });

  describe("shouldShowError", () => {
    it("should return false for untouched field", () => {
      const { result } = renderHook(() => useQuickLinksForm());

      expect(result.current.shouldShowError("title")).toBe(false);
    });

    it("should return false for touched field without error", () => {
      const { result } = renderHook(() => useQuickLinksForm());

      act(() => {
        result.current.updateField("title", "Valid Title");
      });

      act(() => {
        result.current.handleFieldBlur("title");
      });

      expect(result.current.shouldShowError("title")).toBe(false);
    });

    it("should return true for touched field with error", () => {
      const { result } = renderHook(() => useQuickLinksForm());

      act(() => {
        result.current.handleFieldBlur("title");
      });

      expect(result.current.shouldShowError("title")).toBe(true);
    });
  });

  describe("setFormData", () => {
    it("should allow setting entire form data", () => {
      const { result } = renderHook(() => useQuickLinksForm());

      const newFormData = {
        title: "New Title",
        url: "https://new-url.com",
        category: "New Category",
        description: "New Description",
        icon: "link",
      };

      act(() => {
        result.current.setFormData(newFormData);
      });

      expect(result.current.formData).toEqual(newFormData);
    });
  });

  describe("Integration", () => {

    it("should handle validation errors workflow", () => {
      const { result } = renderHook(() => useQuickLinksForm());

      // 1. User fills invalid URL
      act(() => {
        result.current.updateField("title", "My Link");
        result.current.updateField("url", "invalid");
        result.current.updateField("category", "Development");
      });

      // 2. Form is invalid
      expect(result.current.isFormValid).toBe(false);

      // 3. User tries to submit
      let isValid: boolean = false;
      act(() => {
        isValid = result.current.validateForm();
      });

      expect(isValid).toBe(false);
      expect(result.current.formErrors.url).toBeDefined();

      // 4. User corrects URL
      act(() => {
        result.current.updateField("url", "https://example.com");
      });

      // 5. Error is cleared
      expect(result.current.formErrors.url).toBeUndefined();

      // 6. Form is now valid
      expect(result.current.isFormValid).toBe(true);
    });
  });
});