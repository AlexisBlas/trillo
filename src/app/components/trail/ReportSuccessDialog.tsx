import { Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { ShareButton } from '../layout/ShareButton';
import type { ShareStatus } from '../../lib/share';

interface ReportSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  actionLabel?: string;
  /** Called when the user confirms (primary button). */
  onAction: () => void;
  /** Optional share target shown under the primary action. */
  share?: {
    title: string;
    text?: string;
    url: string;
    subtitle?: string | null;
    status?: ShareStatus | null;
    statusLabel?: string | null;
    notes?: string | null;
    conditions?: string[] | null;
    hazardTrailName?: string | null;
    updatedValue?: string | null;
  };
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
  share,
}: ReportSuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[340px] rounded-[20px] border-[1.5px] border-[#24302A] p-6 text-center">
        <DialogHeader className="items-center space-y-0">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-[#d1fae5] border border-[#065f46]">
            <Check className="size-8 text-[#065f46]" strokeWidth={2.6} />
          </div>
          <DialogTitle className="text-[19px] font-bold text-[#E6EBE6]">
            {title}
          </DialogTitle>
          <DialogDescription className="text-[14px] leading-relaxed text-[#A8C4A0] pt-1.5">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-5 flex flex-col gap-2.5">
          <button
            onClick={onAction}
            className="h-12 w-full inline-flex items-center justify-center rounded-[14px] bg-[#63B882] text-[#0E1510] text-[15px] font-bold hover:bg-[#52A06E] transition-colors"
          >
            {actionLabel}
          </button>
          {share && (
            <ShareButton
              size="cta"
              title={share.title}
              text={share.text}
              url={share.url}
              subtitle={share.subtitle}
              status={share.status}
              statusLabel={share.statusLabel}
              notes={share.notes}
              conditions={share.conditions}
              hazardTrailName={share.hazardTrailName}
              updatedValue={share.updatedValue}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
