import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useUpdateDocumentation } from "@/hooks/api/useDocumentation";
import { Loader2 } from "lucide-react";
import type { Documentation } from "@/types/documentation";
import { useTeamById } from "@/hooks/api/useTeams"; 

interface EditDocumentationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentation: Documentation;
}

interface FormData {
  url: string;
  title: string;
  description: string;
}

interface FormErrors {
  url?: string;
  title?: string;
}

const validateGitHubUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    // Support both github.tools.sap and github.com
    if (parsedUrl.host !== "github.tools.sap" && parsedUrl.host !== "github.com") {
      return false;
    }
    // Expected format: /{owner}/{repo}/tree/{branch}/{path} or /{owner}/{repo}/blob/{branch}/{path}
    const parts = parsedUrl.pathname.split('/').filter(p => p);
    if (parts.length < 5) {
      return false;
    }
    if (parts[2] !== "tree" && parts[2] !== "blob") {
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

export function EditDocumentationDialog({ open, onOpenChange, documentation }: EditDocumentationDialogProps) {
  const { toast } = useToast();
  const updateDocumentation = useUpdateDocumentation(documentation.id);

  const { data: teamData } = useTeamById(documentation.team_id);
  const teamDisplayName = teamData?.title || teamData?.name || "Team";

  const [formData, setFormData] = useState<FormData>({
    url: "",
    title: "",
    description: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Initialize form with documentation data when dialog opens
  useEffect(() => {
    if (open && documentation) {
      // Reconstruct URL from documentation parts
      const url = `https://${documentation.owner.includes('/') ? 'github.tools.sap' : 'github.com'}/${documentation.owner}/${documentation.repo}/tree/${documentation.branch}/${documentation.docs_path}`;
      setFormData({
        url: url,
        title: documentation.title,
        description: documentation.description || "",
      });
      setErrors({});
      setTouched({});
    }
  }, [open, documentation]);

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case "title":
        if (!value.trim()) return "Title is required";
        if (value.trim().length < 2) return "Title must be at least 2 characters";
        if (value.trim().length > 100) return "Title must be at most 100 characters";
        return undefined;
      case "url":
        if (!value.trim()) return "GitHub URL is required";
        if (!validateGitHubUrl(value.trim())) {
          return "Please enter a valid GitHub URL (e.g., https://github.tools.sap/org/repo/tree/main/docs)";
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
      const error = validateField(name, value);
      setErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
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

    newErrors.title = validateField("title", formData.title);
    newErrors.url = validateField("url", formData.url);

    setErrors(newErrors);
    setTouched({ title: true, url: true });

    return !newErrors.title && !newErrors.url;
  };

  const isFormValid = (): boolean => {
    return (
      formData.title.trim().length >= 2 &&
      formData.title.trim().length <= 100 &&
      formData.url.trim().length > 0 &&
      validateGitHubUrl(formData.url.trim())
    );
  };

  const handleSubmit = async () => {
    if (!validateForm() || !isFormValid()) {
      return;
    }

    try {
      await updateDocumentation.mutateAsync({
        id: documentation.id,
        team_id: documentation.team_id,
        url: formData.url.trim(),
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
      });

      toast({
        title: "Documentation updated",
        description: "Documentation endpoint has been updated successfully",
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update documentation:", error);
      toast({
        title: "Failed to update documentation",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Edit Documentation</DialogTitle>
          <DialogDescription>
            Update the GitHub documentation endpoint for this team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="edit-title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-title"
              placeholder={`${teamDisplayName} Documentation`}
              value={formData.title}
              onChange={(e) => handleFieldChange("title", e.target.value)}
              onBlur={() => handleBlur("title")}
              className={errors.title && touched.title ? "border-red-500" : ""}
            />
            {errors.title && touched.title && (
              <p className="text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          {/* URL */}
          <div className="space-y-2">
            <Label htmlFor="edit-url">
              GitHub URL <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-url"
              placeholder="https://github.tools.sap/org/repo/tree/main/docs"
              value={formData.url}
              onChange={(e) => handleFieldChange("url", e.target.value)}
              onBlur={() => handleBlur("url")}
              className={errors.url && touched.url ? "border-red-500" : ""}
            />
            {errors.url && touched.url && (
              <p className="text-sm text-red-500">{errors.url}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Example: https://github.tools.sap/cfs-platform-engineering/cfs-platform-docs/tree/main/docs/coe
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description (Optional)</Label>
            <Textarea
              id="edit-description"
              placeholder="Documentation for the COE team..."
              value={formData.description}
              onChange={(e) => handleFieldChange("description", e.target.value)}
              rows={3}
              maxLength={200}
            />
            <p className="text-sm text-muted-foreground">
              {formData.description.length}/200 characters
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateDocumentation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid() || updateDocumentation.isPending}
          >
            {updateDocumentation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Update Documentation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
