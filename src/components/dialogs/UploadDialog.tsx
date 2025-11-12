import { Upload } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Input } from "../ui/input";

interface UploadDialogProps {
  uploadOpen: boolean;
  setUploadOpen: (open: boolean) => void;
  uploadTypeRef: React.MutableRefObject<"oncall" | "onduty">;
  fileRef: React.RefObject<HTMLInputElement>;
  handleUploadConfirm: () => Promise<void>;
  handleUploadClick: () => void;
}

export function UploadDialog({
  uploadOpen,
  setUploadOpen,
  uploadTypeRef,
  fileRef,
  handleUploadConfirm,
  handleUploadClick
}: UploadDialogProps) {
  const currentMode = uploadTypeRef.current === "oncall" ? "On Call" : "On Duty";
  const dialogTitle = `Upload ${currentMode} Excel`;

  return (
    <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" onClick={handleUploadClick}>
            <Upload className="h-4 w-4 mr-1" /> Upload
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>Select a .xlsx file to import.</DialogDescription>
          </DialogHeader>
          <Input ref={fileRef as any} type="file" accept=".xlsx,.xls" />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
            <Button onClick={handleUploadConfirm}>Upload</Button>
          </div>
        </DialogContent>
      </Dialog>
  )
}