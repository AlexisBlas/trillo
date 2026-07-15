import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Lock, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useLang } from '../../contexts/LangContext';

export function ResetPasswordPage() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Capture URL before Supabase may strip the code param
    const isRecoveryLink =
      window.location.href.includes('type=recovery') ||
      window.location.search.includes('code=') ||
      window.location.hash.includes('type=recovery');

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });

    // Fallback: Supabase may have already exchanged the code before our listener
    // registered. If we arrived on this page via a recovery link and have a
    // live session, we're ready.
    if (isRecoveryLink) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) setReady(true);
      });
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError(t('password_min_length')); return; }
    if (password !== confirm) { setError(t('passwords_no_match')); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setDone(true);
    setTimeout(() => navigate('/auth/signin'), 2500);
  };

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex flex-col">
      <div className="px-5 pt-12 pb-6">
        <div className="size-12 rounded-full bg-[#3a6b35] flex items-center justify-center mb-4">
          <Lock className="size-6 text-white" />
        </div>
        <h1 className="text-[24px] font-bold text-[#1a3010] leading-tight">{t('reset_password_title')}</h1>
        <p className="text-[14px] text-[#4b6b3a] mt-1">{t('reset_password_subtitle')}</p>
      </div>

      <div className="px-5 pb-8 flex-1">
        {done ? (
          <div className="bg-white border-[1.5px] border-[#e5e0d5] rounded-[16px] p-6 text-center">
            <CheckCircle className="size-10 text-[#2c4a1e] mx-auto mb-3" />
            <p className="text-[15px] font-bold text-[#1a1a1a]">{t('password_updated')}</p>
            <p className="text-[13px] text-[#687588] mt-1">{t('redirecting')}</p>
          </div>
        ) : !ready ? (
          <div className="text-center text-[13px] text-[#687588] pt-8">{t('verifying_link')}</div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-[12px] px-4 py-3 text-[13px] text-red-700">
                {error}
              </div>
            )}
            {[
              { key: 'password' as const, label: t('new_password_label'), placeholder: '········' },
              { key: 'confirm' as const, label: t('confirm_password_label'), placeholder: '········' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-[12px] font-bold text-[#374151] mb-1.5">{label}</label>
                <input
                  type="password"
                  value={key === 'password' ? password : confirm}
                  onChange={(e) => key === 'password' ? setPassword(e.target.value) : setConfirm(e.target.value)}
                  placeholder={placeholder}
                  className="w-full h-[48px] border-[1.5px] border-[#e5e0d5] rounded-[12px] px-4 text-[15px] text-[#1a1a1a] bg-white focus:outline-none focus:border-[#2c4a1e]"
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[48px] bg-[#2c4a1e] rounded-[12px] text-white text-[14px] font-bold disabled:opacity-50"
            >
              {loading ? t('saving') : t('update_password')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
