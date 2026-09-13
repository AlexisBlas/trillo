import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Mountain } from 'lucide-react';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { BackButton } from '../../components/layout/BackButton';
import { AuthForm } from '../../components/auth/AuthForm';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LangContext';
import { SignUpFormData } from '../../lib/schemas';
import { toast } from 'sonner';

export function SignUpPage() {
  const navigate = useNavigate();
  const { signUp, user } = useAuth();
  const { t } = useLang();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await signUp(data.email, data.password);
      if (error) {
        setError(error.message);
      } else {
        toast.success('Account created! Please check your email to confirm.');
        navigate('/auth/signin');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Sign up error:', err);
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
        <h1 className="text-[24px] font-bold text-[#F2F5F2] leading-tight">Create account</h1>
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

        <AuthForm mode="signup" onSubmit={handleSubmit} isLoading={isLoading} />

        <p className="mt-6 text-center text-[13px] text-[#9AA39C]">
          Already have an account?{' '}
          <Link to="/auth/signin" className="text-[#5EE08A] font-bold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
