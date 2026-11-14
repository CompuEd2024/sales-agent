import React, { useState } from 'react';
import {
  Glasses,
  Lock,
  Mail,
  Languages,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { getSupabaseCredentials } from '../lib/supabase';
import { useToast } from './Toast';
import { useLanguage } from '../lib/i18n';
import { useAgent } from '../context/AgentContext';

interface AuthViewProps {
  onOpenSupabaseConfig?: () => void;
}

const AGENT_NOT_RECOGNIZED_MESSAGE =
  'Agent not recognized. You are not registered as an agent, so you cannot enter the app.';

export function AuthView({ onOpenSupabaseConfig: _onOpenSupabaseConfig }: AuthViewProps) {
  const { showToast } = useToast();
  const { t, toggleLanguage, isRTL } = useLanguage();
  const { login, error: agentError, clearError } = useAgent();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUnrecognizedAgent, setIsUnrecognizedAgent] = useState(false);

  const creds = getSupabaseCredentials();

  const activeError = errorMsg || agentError;
  const showUnrecognizedError =
    isUnrecognizedAgent || activeError === AGENT_NOT_RECOGNIZED_MESSAGE;
  const displayedError = showUnrecognizedError
    ? t('agentNotRecognizedError')
    : activeError;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setIsUnrecognizedAgent(false);
    clearError();

    try {
      const res = await login(email, password);
      if (!res.success || !res.agent) {
        const notRecognized =
          res.errorCode === 'AGENT_NOT_RECOGNIZED' ||
          res.error === AGENT_NOT_RECOGNIZED_MESSAGE;
        setIsUnrecognizedAgent(notRecognized);
        const msg = notRecognized
          ? t('agentNotRecognizedError')
          : res.error || (isRTL ? 'البريد أو كلمة المرور غير صحيحة.' : 'Invalid agent email or password.');
        setErrorMsg(res.error || msg);
        showToast(t('toastLoginFailed'), msg, 'error');
      } else {
        showToast(
          t('toastWelcomeBack'),
          isRTL ? `تم تسجيل الدخول: ${res.agent.full_name}` : `Logged in as ${res.agent.full_name}`,
          'success'
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
      showToast(isRTL ? 'خطأ' : 'Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8 relative pb-safe">
      {/* Top Bar with Language Switcher */}
      <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4">
        <button
          type="button"
          onClick={toggleLanguage}
          className="min-h-[48px] flex items-center gap-2 px-4 py-2.5 text-sm sm:text-xs font-bold rounded-xl border border-slate-300 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 shadow-2xs transition-colors"
        >
          <Languages className="w-4 h-4 text-slate-600" />
          <span>{t('switchLanguage')}</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md">
            <Glasses className="w-7 h-7" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">
          {t('agentLoginTitle')}
        </h2>
        <p className="mt-1 text-center text-xs text-slate-600 px-4">
          {t('agentLoginSubtitle')}
        </p>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 px-4 shadow-sm border border-slate-200 rounded-2xl sm:py-8 sm:px-10">
          {/* Supabase status indicator */}
          <div className="mb-5 flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  creds.isConfigured ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <span className="text-slate-700 truncate">
                {t('authMode')}{' '}
                <strong className="font-semibold">
                  {creds.isConfigured ? t('liveSupabase') : t('agentDemoMode')}
                </strong>
              </span>
            </div>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                {t('emailAddress')}
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 pl-3 rtl:pl-0 rtl:pr-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMsg || agentError) {
                      setErrorMsg(null);
                      setIsUnrecognizedAgent(false);
                      clearError();
                    }
                  }}
                  placeholder="agent@opticportal.io"
                  className="block w-full min-h-[48px] pl-10 rtl:pl-3 rtl:pr-10 pr-3 py-3 text-base sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-slate-900 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                {t('passwordField')}
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 pl-3 rtl:pl-0 rtl:pr-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg || agentError) {
                      setErrorMsg(null);
                      setIsUnrecognizedAgent(false);
                      clearError();
                    }
                  }}
                  placeholder="••••••••"
                  className="block w-full min-h-[48px] pl-10 pr-12 rtl:pl-12 rtl:pr-10 py-3 text-base sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={
                    showPassword
                      ? isRTL
                        ? 'إخفاء كلمة المرور'
                        : 'Hide password'
                      : isRTL
                        ? 'إظهار كلمة المرور'
                        : 'Show password'
                  }
                  aria-pressed={showPassword}
                  title={
                    showPassword
                      ? isRTL
                        ? 'إخفاء كلمة المرور'
                        : 'Hide password'
                      : isRTL
                        ? 'إظهار كلمة المرور'
                        : 'Show password'
                  }
                  className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 min-w-[48px] min-h-[48px] flex items-center justify-center text-slate-400 hover:text-slate-700 active:text-slate-900 rounded-r-xl rtl:rounded-r-none rtl:rounded-l-xl focus:outline-none transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {displayedError && (
              <div
                role="alert"
                className="p-3.5 rounded-xl text-xs font-medium bg-rose-50 border border-rose-300 text-rose-900 flex items-start gap-2.5 shadow-2xs"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{displayedError}</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[54px] flex justify-center items-center py-3.5 px-5 border border-transparent rounded-xl shadow-sm text-base sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.99] focus:outline-none disabled:opacity-50 transition-all"
              >
                {loading
                  ? (isRTL ? 'جاري التحقق...' : 'Authenticating...')
                  : t('signInBtn')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
