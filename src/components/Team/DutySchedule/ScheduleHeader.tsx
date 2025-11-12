import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Undo, Save } from "lucide-react";
import { UploadDialog } from "@/components/dialogs/UploadDialog";

interface ScheduleActions {
  exportOnCallToExcel: () => void;
  exportOnDutyToExcel: () => void;
  undo: () => void;
  canUndo: boolean;
  save: () => void;
}

interface ScheduleHeaderProps {
  actions: ScheduleActions;
  showOnCall: boolean;
  setShowOnCall: (show: boolean) => void;
  uploadOpen: boolean;
  setUploadOpen: (open: boolean) => void;
  uploadTypeRef: React.MutableRefObject<"oncall" | "onduty">;
  fileRef: React.RefObject<HTMLInputElement>;
  handleUploadConfirm: () => Promise<void>;
}

export function ScheduleHeader({
  actions,
  showOnCall,
  setShowOnCall,
  uploadOpen,
  setUploadOpen,
  uploadTypeRef,
  fileRef,
  handleUploadConfirm
}: ScheduleHeaderProps) {
  const {
    exportOnCallToExcel,
    exportOnDutyToExcel,
    undo,
    canUndo,
    save,
  } = actions;

  const currentMode = showOnCall ? "oncall" : "onduty";
  const exportHandler = showOnCall ? exportOnCallToExcel : exportOnDutyToExcel;

  const handleUploadClick = () => {
    uploadTypeRef.current = currentMode;
  };

  return (
    <div className="flex items-center gap-3">      
      <div className="inline-flex rounded-full bg-muted p-1 shadow-inner">
        <button
          className={`h-10 px-4 rounded-full text-sm font-medium transition-colors ${
            !showOnCall ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          }`}
          onClick={() => setShowOnCall(false)}
          aria-pressed={!showOnCall}
        >
          On Duty
        </button>
        <button
          className={`h-10 px-4 rounded-full text-sm font-medium transition-colors ${
            showOnCall ? "bg-emerald-600 text-white" : "text-muted-foreground"
          }`}
          onClick={() => setShowOnCall(true)}
          aria-pressed={showOnCall}
        >
          On Call
        </button>
      </div>
      <Button 
        size="sm" 
        variant="outline" 
        onClick={undo} 
        disabled={!canUndo}
        title="Undo last action"
      >
        <Undo className="h-4 w-4 mr-1" /> Undo
      </Button>
      <Button size="sm" variant="outline" onClick={exportHandler}>
        <Download className="h-4 w-4 mr-1" /> Export
      </Button>
      <UploadDialog
        uploadOpen={uploadOpen}
        setUploadOpen={setUploadOpen}
        uploadTypeRef={uploadTypeRef}
        fileRef={fileRef}
        handleUploadConfirm={handleUploadConfirm}
        handleUploadClick={handleUploadClick}
      />
      <Button size="sm" variant="outline" onClick={save} title="Save changes">
        <Save className="h-4 w-4 mr-1" /> Save
      </Button>
    </div>
  );
}
