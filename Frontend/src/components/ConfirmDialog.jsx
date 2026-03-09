import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';

/**
 * Confirm dialog component for destructive actions
 * @param {{isOpen: boolean, title: string, description: string, onConfirm: Function, onCancel: Function, isLoading: boolean}} props
 */
export function ConfirmDialog({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  isLoading = false,
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Please wait...' : 'Confirm'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ConfirmDialog;
