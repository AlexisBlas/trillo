import { useNavigate } from 'react-router';
import { LogIn, UserCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';

interface AuthGateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGuest: () => void;
  redirectAfter?: string;
}

export function AuthGate({ open, onOpenChange, onGuest, redirectAfter }: AuthGateProps) {
  const navigate = useNavigate();

  const goSignIn = () => {
    onOpenChange(false);
    navigate('/auth/signin', { state: { redirectAfter } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[340px] rounded-[20px] p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-bold text-[#1a3010]">
            Submit your report
          </DialogTitle>
          <DialogDescription className="text-[13.5px] text-[#374151]">
            Sign in to save your reports to your profile, or post anonymously as a guest.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2.5 mt-2">
          <button
            onClick={goSignIn}
            className="w-full h-[48px] bg-[#2c4a1e] rounded-[12px] text-white text-[13px] font-bold tracking-[1.2px] flex items-center justify-center gap-2"
          >
            <LogIn className="size-4" />
            SIGN IN
          </button>
          <button
            onClick={() => {
              onOpenChange(false);
              onGuest();
            }}
            className="w-full h-[48px] bg-white border-[1.5px] border-[#e5e7eb] rounded-[12px] text-[#1a3010] text-[13px] font-bold tracking-[1.2px] flex items-center justify-center gap-2"
          >
            <UserCircle2 className="size-4" />
            CONTINUE AS GUEST
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
