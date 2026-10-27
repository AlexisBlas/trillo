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
          <DialogTitle className="text-[18px] font-bold text-[#E6EBE6]">
            Submit your report
          </DialogTitle>
          <DialogDescription className="text-[13.5px] text-[#9AA39C]">
            Sign in to save your reports to your profile, or post anonymously as a guest.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2.5 mt-2">
          <button
            onClick={goSignIn}
            className="w-full h-[48px] bg-[#63B882] rounded-[12px] text-[#0E1510] text-[13px] font-bold tracking-[1.2px] flex items-center justify-center gap-2"
          >
            <LogIn className="size-4" />
            SIGN IN
          </button>
          <button
            onClick={() => {
              onOpenChange(false);
              onGuest();
            }}
            className="w-full h-[48px] bg-[#151C18] border-[1.5px] border-[#24302A] rounded-[12px] text-[#E6EBE6] text-[13px] font-bold tracking-[1.2px] flex items-center justify-center gap-2"
          >
            <UserCircle2 className="size-4" />
            CONTINUE AS GUEST
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
