import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories } from "@/hooks/api/useLinks";
import { useCurrentUser } from "@/hooks/api/useMembers";
import { useToast } from "@/hooks/use-toast";
import { useUpdateLink } from "@/hooks/api/mutations/useUpdateLink";
import type { UserLink } from "@/types/api";

interface EditLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  linkData: UserLink;
}

interface FormData {
  name: string;
  description: string;
  url: string;
  category: string;
  tags: string;
}

interface FormErrors {
  name?: string;
  url?: string;
  category?: string;
}

const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Check if a link with the same name and category already exists
 * Excludes the current link being edited
 */
const checkDuplicateLink = (
  existingLinks: UserLink[],
  name: string,
  categoryId: string,
  currentLinkId: string
): boolean => {
  return existingLinks.some(
    (link) => 
      link.id !== currentLinkId &&
      link.title.trim().toLowerCase() === name.trim().toLowerCase() &&
      link.category_id === categoryId
  );
};

export function EditLinkDialog({ open, onOpenChange, linkData }: EditLinkDialogProps) {
  const { toast } = useToast();
  const { data: categoriesData } = useCategories();
  const { data: currentUser } = useCurrentUser();
  const updateLinkMutation = useUpdateLink();

  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    url: "",
    category: "",
    tags: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with link data when dialog opens
  useEffect(() => {
    if (open && linkData) {
      setFormData({
        name: linkData.title || linkData.name || "",
        description: linkData.description || "",
        url: linkData.url || "",
        category: linkData.category_id || "",
        tags: Array.isArray(linkData.tags) ? linkData.tags.join(", ") : "",
      });
      setErrors({});
      setTouched({});
      setIsSubmitting(false);
    }
  }, [open, linkData]);

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case "name":
        if (!value.trim()) return "Name is required";
        if (value.trim().length < 2) return "Name must be at least 2 characters";
        
        // Check for duplicate link names in the same category (excluding current link)
        if (formData.category && currentUser?.link) {
          const isDuplicate = checkDuplicateLink(
            currentUser.link,
            value,
            formData.category,
            linkData.id
          );
          if (isDuplicate) {
            return "A link with this name already exists in the selected category";
          }
        }
        return undefined;

      case "url":
        if (!value.trim()) return "URL is required";
        if (!validateUrl(value)) return "Please enter a valid URL";
        return undefined;

      case "category":
        if (!value) return "Category is required";
        return undefined;

      default:
        return undefined;
    }
  };

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof FormErrors];
        return newErrors;
      });
    }

    // Validate the field if it has been touched
    if (touched[name]) {
      const error = validateField(name, value);
      if (error) {
        setErrors((prev) => ({
          ...prev,
          [name]: error,
        }));
      }
    }
    
    // Re-validate related fields for duplicate check
    if (name === "name" && touched.category && formData.category) {
      let categoryError = validateField("category", formData.category);
      // Check duplicate when name changes and category is already set
      if (!categoryError && currentUser?.link) {
        const isDuplicate = checkDuplicateLink(
          currentUser.link,
          value,
          formData.category,
          linkData.id
        );
        if (isDuplicate) {
          setErrors((prev) => ({
            ...prev,
            name: "A link with this name already exists in the selected category",
          }));
        }
      }
    } else if (name === "category" && touched.name && formData.name) {
      let nameError = validateField("name", formData.name);
      // Check duplicate when category changes and name is already set
      if (!nameError && currentUser?.link) {
        const isDuplicate = checkDuplicateLink(
          currentUser.link,
          formData.name,
          value,
          linkData.id
        );
        if (isDuplicate) {
          setErrors((prev) => ({
            ...prev,
            name: "A link with this name already exists in the selected category",
          }));
        } else {
          // Clear name error if it was previously a duplicate error
          setErrors((prev) => {
            const newErrors = { ...prev };
            if (newErrors.name === "A link with this name already exists in the selected category") {
              delete newErrors.name;
            }
            return newErrors;
          });
        }
      }
    }
  };

  const handleBlur = (name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name as keyof FormData]);
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const isFormValid = () => {
    const requiredFields = ["name", "url", "category"];
    const allFieldsFilled = requiredFields.every((field) => 
      formData[field as keyof FormData]?.trim()
    );
    const noErrors = Object.keys(errors).length === 0;
    return allFieldsFilled && noErrors && !isSubmitting;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: FormErrors = {};
    const requiredFields = ["name", "url", "category"];
    
    requiredFields.forEach((field) => {
      const error = validateField(field, formData[field as keyof FormData]);
      if (error) {
        newErrors[field as keyof FormErrors] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched({
        name: true,
        url: true,
        category: true,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        id: linkData.id,
        name: formData.name.trim(),
        title: formData.name.trim(),
        description: formData.description.trim(),
        url: formData.url.trim(),
        category_id: formData.category,
        tags: formData.tags.trim(), // Send as string, not array
      };

      await updateLinkMutation.mutateAsync(payload);

      toast({
        title: "Link updated",
        description: "The link has been updated successfully.",
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to update link",
        description: error.message || "There was an error updating the link. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Link</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              onBlur={() => handleBlur("name")}
              placeholder="Enter link name"
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* URL Field */}
          <div className="space-y-2">
            <Label htmlFor="url">
              URL <span className="text-destructive">*</span>
            </Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => handleChange("url", e.target.value)}
              onBlur={() => handleBlur("url")}
              placeholder="https://example.com"
              className={errors.url ? "border-destructive" : ""}
            />
            {errors.url && (
              <p className="text-sm text-destructive">{errors.url}</p>
            )}
          </div>

          {/* Category Field */}
          <div className="space-y-2">
            <Label htmlFor="category">
              Category <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleChange("category", value)}
            >
              <SelectTrigger className={errors.category ? "border-destructive" : ""}>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categoriesData?.categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category}</p>
            )}
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Enter link description (optional)"
              rows={3}
            />
          </div>

          {/* Tags Field */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => handleChange("tags", e.target.value)}
              placeholder="Enter tags separated by commas"
            />
            <p className="text-xs text-muted-foreground">
              Separate multiple tags with commas
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid()}
            >
              {isSubmitting ? "Updating..." : "Update Link"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}