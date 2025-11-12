import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type DialogApprovalGoal = 'delete' | 'move';

interface ApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: DialogApprovalGoal;
  name: string;
  moveFrom?: string;
  moveTo?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

const deleteMessage = (name: string) => `Are you sure you want to delete ${name}? This action cannot be undone.`;
const moveMessage = (name: string, moveFrom: string, moveTo: string) => `Are you sure you want to move ${name} from ${moveFrom} to ${moveTo}?`;

export default function ApprovalDialog({open, onOpenChange, action, name, moveTo, moveFrom, onConfirm, onCancel, isLoading}: ApprovalDialogProps) {
    const handleConfirm = () => {
        onConfirm();
        onOpenChange(false);
    };

    const handleCancel = () => {
        onCancel();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Confirm Action</DialogTitle>
                    <DialogDescription>
                        {action === 'delete' ? deleteMessage(name) : ''}
                        {action === 'move' && moveFrom && moveTo ? moveMessage(name, moveFrom, moveTo) : ''}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex justify-end space-x-4 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Processing...' : 'Confirm'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
