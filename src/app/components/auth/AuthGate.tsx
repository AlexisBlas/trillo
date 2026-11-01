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
          <DialogTitle className="text-[18px] font-bold text-foreground">
            Submit your report
          </DialogTitle>
          <DialogDescription className="text-[13.5px] text-muted-foreground">
            Sign in to save your reports to your profile, or post anonymously as a guest.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2.5 mt-2">
          <button
            onClick={goSignIn}
            className="w-full h-[48px] bg-primary rounded-[12px] text-primary-foreground text-[13px] font-bold tracking-[1.2px] flex items-center justify-center gap-2"
          >
            <LogIn className="size-4" />
            SIGN IN
          </button>
          <button
            onClick={() => {
              onOpenChange(false);
              onGuest();
            }}
            className="w-full h-[48px] bg-card border-[1.5px] border-border rounded-[12px] text-foreground text-[13px] font-bold tracking-[1.2px] flex items-center justify-center gap-2"
          >
            <UserCircle2 className="size-4" />
            CONTINUE AS GUEST
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
