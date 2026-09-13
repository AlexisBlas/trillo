import { useState } from 'react';
import { Link } from 'react-router';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { BackButton } from '../../components/layout/BackButton';
import { useLang } from '../../contexts/LangContext';

export function ForgotPasswordPage() {
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setLoading(false);
    // Always show the success state for valid emails to avoid account enumeration;
    // still surface real API/config errors (e.g. redirect URL not allowlisted).
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E1510]">
      <div className="relative px-4 pt-3.5 h-[52px] flex items-center">
        <BackButton />
      </div>

      <div className="px-5 pt-8 pb-6">
        <div className="size-12 rounded-full bg-[#1E3A28] flex items-center justify-center mb-4">
          <Mail className="size-6 text-white" />
        </div>
        <h1 className="text-[24px] font-bold text-[#F2F5F2] leading-tight">{t('forgot_password_title')}</h1>
        <p className="text-[14px] text-[#A8C4A0] mt-1">{t('forgot_password_subtitle')}</p>
      </div>

      <div className="px-5 pb-8">
        {sent ? (
          <div className="bg-[#151C18] border-[1.5px] border-[#24302A] rounded-[16px] p-6 text-center">
            <CheckCircle className="size-10 text-[#5EE08A] mx-auto mb-3" />
            <p className="text-[15px] font-bold text-[#F2F5F2] mb-1">{t('reset_sent_title')}</p>
            <p className="text-[13px] text-[#9AA39C] leading-relaxed">{t('reset_sent_body')}</p>
            <Link
              to="/auth/signin"
              className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-bold text-[#5EE08A]"
            >
              <ArrowLeft className="size-3.5" />
              {t('back_to_signin')}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-[12px] px-4 py-3 text-[13px] text-red-700">
                {error}
              </div>
            )}
            <div>
              <label className="block text-[12px] font-bold text-[#9AA39C] mb-1.5">{t('email_label')}</label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-[48px] border-[1.5px] border-[#24302A] rounded-[12px] px-4 text-[15px] text-[#F2F5F2] bg-[#151C18] focus:outline-none focus:border-[#5EE08A]"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full h-[48px] bg-[#5EE08A] rounded-[12px] text-[#0E1510] text-[14px] font-bold disabled:opacity-50"
            >
              {loading ? t('sending') : t('send_reset_link')}
            </button>
            <Link
              to="/auth/signin"
              className="flex items-center justify-center gap-1.5 text-[13px] font-bold text-[#9AA39C]"
            >
              <ArrowLeft className="size-3.5" />
              {t('back_to_signin')}
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
