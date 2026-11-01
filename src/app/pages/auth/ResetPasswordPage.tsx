import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { Lock, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useLang } from '../../contexts/LangContext';

const MIN_PASSWORD_LENGTH = 8;
const RECOVERY_TIMEOUT_MS = 12000;

function looksLikeRecoveryUrl() {
  const { href, search, hash } = window.location;
  return (
    href.includes('type=recovery') ||
    hash.includes('type=recovery') ||
    search.includes('code=') ||
    hash.includes('access_token=')
  );
}

function cleanRecoveryUrl() {
  if (window.location.pathname !== '/auth/reset-password') return;
  if (!window.location.search && !window.location.hash) return;
  window.history.replaceState({}, document.title, '/auth/reset-password');
}

export function ResetPasswordPage() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [linkError, setLinkError] = useState(false);
  const readyRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const fromRecoveryLink = looksLikeRecoveryUrl();

    const markReady = () => {
      if (cancelled || readyRef.current) return;
      readyRef.current = true;
      setReady(true);
      setLinkError(false);
      cleanRecoveryUrl();
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        markReady();
        return;
      }
      // Session may already be established before PASSWORD_RECOVERY is observed
      if (session && (fromRecoveryLink || event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        markReady();
      }
    });

    (async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!cancelled && !error) {
            markReady();
            return;
          }
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!cancelled && session) {
          markReady();
        }
      } catch {
        // Timeout / link-error UI handles failure
      }
    })();

    const timer = window.setTimeout(() => {
      if (cancelled || readyRef.current) return;
      setLinkError(true);
    }, RECOVERY_TIMEOUT_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(t('password_min_length'));
      return;
    }
    if (password !== confirm) {
      setError(t('passwords_no_match'));
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setLoading(false);
      setError(updateError.message);
      return;
    }

    // End the recovery session so the next visit is a clean password sign-in
    await supabase.auth.signOut();
    setLoading(false);
    setDone(true);
    window.setTimeout(() => navigate('/auth/signin', { replace: true }), 2200);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-5 pt-12 pb-6">
        <div className="size-12 rounded-full bg-accent flex items-center justify-center mb-4">
          <Lock className="size-6 text-white" />
        </div>
        <h1 className="text-[24px] font-bold text-foreground leading-tight">
          {t('reset_password_title')}
        </h1>
        <p className="text-[14px] text-accent-foreground mt-1">{t('reset_password_subtitle')}</p>
      </div>

      <div className="px-5 pb-8 flex-1">
        {done ? (
          <div className="bg-card border-[1.5px] border-border rounded-[16px] p-6 text-center">
            <CheckCircle className="size-10 text-primary mx-auto mb-3" />
            <p className="text-[15px] font-bold text-foreground">{t('password_updated')}</p>
            <p className="text-[13px] text-muted-foreground mt-1">{t('redirecting')}</p>
          </div>
        ) : linkError && !ready ? (
          <div className="bg-card border-[1.5px] border-border rounded-[16px] p-6 text-center">
            <div className="size-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="size-6 text-amber-600" />
            </div>
            <p className="text-[15px] font-bold text-foreground">{t('reset_link_invalid_title')}</p>
            <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">
              {t('reset_link_invalid_body')}
            </p>
            <Link
              to="/auth/forgot-password"
              className="mt-5 inline-flex h-11 items-center justify-center px-4 rounded-[12px] bg-primary text-primary-foreground text-[13px] font-bold"
            >
              {t('reset_request_new_link')}
            </Link>
            <Link
              to="/auth/signin"
              className="mt-3 block text-[13px] font-bold text-muted-foreground"
            >
              {t('back_to_signin')}
            </Link>
          </div>
        ) : !ready ? (
          <div className="text-center text-[13px] text-muted-foreground pt-8">
            {t('verifying_link')}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-[12px] px-4 py-3 text-[13px] text-red-700">
                {error}
              </div>
            )}
            {(
              [
                { key: 'password' as const, label: t('new_password_label'), placeholder: '········' },
                { key: 'confirm' as const, label: t('confirm_password_label'), placeholder: '········' },
              ] as const
            ).map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-[12px] font-bold text-muted-foreground mb-1.5">
                  {label}
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={key === 'password' ? password : confirm}
                  onChange={(e) =>
                    key === 'password' ? setPassword(e.target.value) : setConfirm(e.target.value)
                  }
                  placeholder={placeholder}
                  className="w-full h-[48px] border-[1.5px] border-border rounded-[12px] px-4 text-[15px] text-foreground bg-card focus:outline-none focus:border-primary"
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[48px] bg-primary rounded-[12px] text-primary-foreground text-[14px] font-bold disabled:opacity-50"
            >
              {loading ? t('saving') : t('update_password')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
