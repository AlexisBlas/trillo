import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { Mountain } from 'lucide-react';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { BackButton } from '../../components/layout/BackButton';
import { AuthForm } from '../../components/auth/AuthForm';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LangContext';
import { SignInFormData } from '../../lib/schemas';

export function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, user } = useAuth();
  const { t } = useLang();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const redirectAfter =
    (location.state as { redirectAfter?: string } | null)?.redirectAfter || '/';

  useEffect(() => {
    if (user) navigate(redirectAfter, { replace: true });
  }, [user, navigate, redirectAfter]);

  const handleSubmit = async (data: SignInFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await signIn(data.email, data.password);
      if (error) setError(error.message);
      else navigate(redirectAfter, { replace: true });
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Sign in error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E1510]">
      <div className="px-4 pt-3.5">
        <BackButton />
      </div>

      <div className="px-5 pt-8 pb-6">
        <div className="size-12 rounded-full bg-[#1E3A28] flex items-center justify-center mb-4">
          <Mountain className="size-6 text-white" />
        </div>
        <h1 className="text-[24px] font-bold text-[#E6EBE6] leading-tight">Welcome back</h1>
        <p className="text-[14px] text-[#A8C4A0] mt-1">
          {t('signin_subtitle')}
        </p>
        <p className="text-[14px] text-[#A8C4A0] mt-1">
          {t('auth_guest_note')}
        </p>
      </div>

      <div className="px-5 pb-8">
        {error && (
          <Alert variant="destructive" className="mb-4 rounded-[12px]">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AuthForm mode="signin" onSubmit={handleSubmit} isLoading={isLoading} />

        <div className="mt-4 text-center">
          <Link to="/auth/forgot-password" className="text-[13px] text-[#A8C4A0] font-medium">
            {t('forgot_password_link')}
          </Link>
        </div>

        <p className="mt-4 text-center text-[13px] text-[#9AA39C]">
          {t('no_account')}{' '}
          <Link to="/auth/signup" className="text-[#63B882] font-bold">
            {t('sign_up')}
          </Link>
        </p>
      </div>
    </div>
  );
}
