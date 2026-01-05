import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { QuickLinkFormData } from "@/types/developer-portal";

interface QuickLinkFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: QuickLinkFormData;
  formErrors: Partial<Record<keyof QuickLinkFormData, string>>;
  existingCategories: string[];
  isFormValid: boolean;
  isSubmitting: boolean;
  onFieldChange: <K extends keyof QuickLinkFormData>(
    field: K,
    value: QuickLinkFormData[K]
  ) => void;
  onFieldBlur: (field: keyof QuickLinkFormData) => void;
  shouldShowError: (field: keyof QuickLinkFormData) => boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

export function QuickLinkFormDialog({
  open,
  onOpenChange,
  formData,
  formErrors,
  existingCategories,
  isFormValid,
  isSubmitting,
  onFieldChange,
  onFieldBlur,
  shouldShowError,
  onSubmit,
  onCancel,
}: QuickLinkFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className='ml-auto'>
          <Plus className="mr-2 h-4 w-4" />
          Add Quick Link
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Quick Link</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g., Jira Dashboard"
              value={formData.title}
              onChange={(e) => onFieldChange('title', e.target.value)}
              onBlur={() => onFieldBlur('title')}
              className={formErrors.title ? 'border-destructive' : ''}
            />
            {shouldShowError('title') && (
              <p className="text-sm text-destructive">{formErrors.title}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              placeholder="https://example.com"
              value={formData.url}
              onChange={(e) => onFieldChange('url', e.target.value)}
              onBlur={() => onFieldBlur('url')}
              className={formErrors.url ? 'border-destructive' : ''}
            />
           {shouldShowError('url') && (
              <p className="text-sm text-destructive">{formErrors.url}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              list="categories"
              placeholder={
                existingCategories.length > 0
                  ? "Select or type a new category"
                  : "Type a new category"
              }
              value={formData.category}
              onChange={(e) => onFieldChange('category', e.target.value)}
              onBlur={() => onFieldBlur('category')}
              className={formErrors.category ? 'border-destructive' : ''}
            />
            <datalist id="categories">
              {existingCategories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
             {shouldShowError('category') && (
              <p className="text-sm text-destructive">{formErrors.category}</p>
            )}
          </div>
    
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting || !isFormValid}>
            {isSubmitting ? 'Adding...' : 'Add Link'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}