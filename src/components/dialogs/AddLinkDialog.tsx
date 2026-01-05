import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { apiClient } from "@/services/ApiClient";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import type { TeamLink, UserLink } from "@/types/api";

interface AddLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ownerId?: string;
  onSubmit?: (formData: {
    name: string;
    description: string;
    url: string;
    category_id: string;
    tags: string;
  }) => Promise<void>;
  onTeamLinkAdded?: (teamId: string, updatedLinks: TeamLink[]) => void;
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
 */
const checkDuplicateLink = (
  existingLinks: UserLink[],
  name: string,
  categoryId: string
): boolean => {
  return existingLinks.some(
    (link) => 
      link.title.trim().toLowerCase() === name.trim().toLowerCase() &&
      link.category_id === categoryId
  );
};

export function AddLinkDialog({ open, onOpenChange, ownerId, onTeamLinkAdded }: AddLinkDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: categoriesData } = useCategories();
  const { data: currentUser } = useCurrentUser();

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

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData({
        name: "",
        description: "",
        url: "",
        category: "",
        tags: "",
      });
      setErrors({});
      setTouched({});
      setIsSubmitting(false);
    }
  }, [open]);

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case "name":
        if (!value.trim()) return "Name is required";
        if (value.trim().length < 2) return "Name must be at least 2 characters";
        
        // Check for duplicate name + category combination
        if (formData.category && currentUser?.link) {
          if (checkDuplicateLink(currentUser.link, value, formData.category)) {
            return "A link with this name already exists in the selected category";
          }
        }
        return undefined;
      case "url":
        if (!value.trim()) return "URL is required";
        if (!validateUrl(value.trim())) return "Please enter a valid URL";
        return undefined;
      case "category":
        if (!value) return "Category is required";
        
        // Check for duplicate name + category combination
        if (formData.name && currentUser?.link) {
          if (checkDuplicateLink(currentUser.link, formData.name, value)) {
            return "A link with this name already exists in the selected category";
          }
        }
        return undefined;
      default:
        return undefined;
    }
  };

  const handleFieldChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Validate on change if field has been touched
    if (touched[name]) {
      let error = validateField(name, value);
      
      // Additional duplicate check for name field if both name and category are available
      if (name === "name" && !error && formData.category && currentUser?.link) {
        const isDuplicate = checkDuplicateLink(
          currentUser.link,
          value,
          formData.category
        );
        if (isDuplicate) {
          error = "A link with this name already exists in the selected category";
        }
      }
      
      setErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    }
    
    // Re-validate related fields for duplicate check
    if (name === "name" && touched.category && formData.category) {
      let categoryError = validateField("category", formData.category);
      // Check duplicate when name changes and category is already set
      if (!categoryError && currentUser?.link) {
        const isDuplicate = checkDuplicateLink(
          currentUser.link,
          value,
          formData.category
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
          value
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
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    newErrors.name = validateField("name", formData.name);
    newErrors.url = validateField("url", formData.url);
    newErrors.category = validateField("category", formData.category);

    // Check for duplicate link (same name AND category)
    if (!newErrors.name && !newErrors.category && currentUser?.link) {
      const isDuplicate = checkDuplicateLink(
        currentUser.link,
        formData.name,
        formData.category
      );
      if (isDuplicate) {
        newErrors.name = "A link with this name already exists in the selected category";
      }
    }

    setErrors(newErrors);
    setTouched({ name: true, url: true, category: true });

    return !newErrors.name && !newErrors.url && !newErrors.category;
  };

  const isFormValid = (): boolean => {
    if (!currentUser?.link) return false;
    
    return (
      formData.name.trim().length >= 2 &&
      formData.url.trim().length > 0 &&
      validateUrl(formData.url.trim()) &&
      formData.category !== "" &&
      !checkDuplicateLink(currentUser.link, formData.name, formData.category)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!currentUser?.uuid) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "User information not available. Please try again.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Process tags: split by comma, trim, remove duplicates, and rejoin
      let processedTags = formData.tags.trim();
      if (processedTags) {
        const tagsArray = processedTags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
        const uniqueTags = [...new Set(tagsArray)];
        processedTags = uniqueTags.join(',');
      }

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        owner: ownerId,
        url: formData.url.trim(),
        category_id: formData.category,
        tags: processedTags || undefined,
      };

      await apiClient.post("/links", payload);

      // If this is a team link and we have a callback, fetch updated team data
      if (ownerId && onTeamLinkAdded) {
        try {
          const teamResponse: any = await apiClient.get(`/teams`, {
            params: { 'team-id': ownerId }
          });
          
          if (teamResponse?.links) {
            const updatedLinks: TeamLink[] = teamResponse.links.map((link: any) => ({
              id: link.id,
              name: link.name,
              title: link.name,
              url: link.url,
              category_id: link.category_id,
              description: link.description || "",
              favorite: false,
              tags: Array.isArray(link.tags) ? link.tags : (link.tags ? [link.tags] : [])
            }));
            
            onTeamLinkAdded(ownerId, updatedLinks);
          }
        } catch (error) {
          console.error('Failed to fetch updated team data:', error);
        }
      }

      toast({
        title: "Success",
        description: "Link has been added successfully.",
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.members.currentUser(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.links.all,
      });
      
      if (ownerId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.teams.detail(ownerId),
        });
      }

      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add link. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Link</DialogTitle>
          <DialogDescription>
            Add a new link to your collection. Fill in the required fields below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Enter link name"
              value={formData.name}
              onChange={(e) => handleFieldChange("name", e.target.value)}
              onBlur={() => handleBlur("name")}
              className={errors.name && touched.name ? "border-red-500" : ""}
            />
            {errors.name && touched.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter link description (optional)"
              value={formData.description}
              onChange={(e) => handleFieldChange("description", e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">
              URL <span className="text-red-500">*</span>
            </Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={formData.url}
              onChange={(e) => handleFieldChange("url", e.target.value)}
              onBlur={() => handleBlur("url")}
              className={errors.url && touched.url ? "border-red-500" : ""}
            />
            {errors.url && touched.url && (
              <p className="text-sm text-red-500">{errors.url}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">
              Category <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleFieldChange("category", value)}
            >
              <SelectTrigger
                className={errors.category && touched.category ? "border-red-500" : ""}
                onBlur={() => handleBlur("category")}
              >
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categoriesData?.categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && touched.category && (
              <p className="text-sm text-red-500">{errors.category}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              placeholder="Enter tags (separated by commas)"
              value={formData.tags}
              onChange={(e) => handleFieldChange("tags", e.target.value)}
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={!isFormValid() || isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Submit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}