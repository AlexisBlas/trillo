import { Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';

interface ReportSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  actionLabel?: string;
  /** Called when the user confirms (primary button). */
  onAction: () => void;
}

/**
 * Success confirmation shown after a trail or park report is submitted.
 * Gives clearer, more reassuring feedback than a transient toast.
 */
export function ReportSuccessDialog({
  open,
  onOpenChange,
  title = 'Report submitted',
  description = 'Thanks for sharing! Your report helps fellow hikers know what to expect on the trail.',
  actionLabel = 'Done',
  onAction,
}: ReportSuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[340px] rounded-[20px] border-[1.5px] border-[#f0ede6] p-6 text-center">
        <DialogHeader className="items-center space-y-0">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-[#d1fae5] border border-[#065f46]">
            <Check className="size-8 text-[#065f46]" strokeWidth={2.6} />
          </div>
          <DialogTitle className="text-[19px] font-bold text-[#1a3010]">
            {title}
          </DialogTitle>
          <DialogDescription className="text-[14px] leading-relaxed text-[#4b6b3a] pt-1.5">
            {description}
          </DialogDescription>
        </DialogHeader>

        <button
          onClick={onAction}
          className="mt-5 h-12 w-full inline-flex items-center justify-center rounded-[14px] bg-[#2c4a1e] text-white text-[15px] font-bold hover:bg-[#1a3010] transition-colors"
        >
          {actionLabel}
        </button>
      </DialogContent>
    </Dialog>
  );
}
