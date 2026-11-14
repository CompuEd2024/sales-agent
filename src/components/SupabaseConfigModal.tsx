import React, { useState } from 'react';
import { X, Database, Check, Copy, RefreshCw, Key, ExternalLink, Terminal } from 'lucide-react';
import { getSupabaseCredentials, saveSupabaseCredentials, getSupabaseClient } from '../lib/supabase';
import { SUPABASE_SQL_SCHEMA } from '../lib/sqlSchema';
import { useToast } from './Toast';
import { useLanguage } from '../lib/i18n';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCredentialsUpdated: () => void;
}

export function SupabaseConfigModal({ isOpen, onClose, onCredentialsUpdated }: SupabaseConfigModalProps) {
  const { t, isRTL } = useLanguage();
  const { showToast } = useToast();
  const currentCreds = getSupabaseCredentials();

  const [url, setUrl] = useState(currentCreds.url);
  const [anonKey, setAnonKey] = useState(currentCreds.anonKey);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setTestResult(null);

    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();

    if (!cleanUrl || !cleanKey) {
      saveSupabaseCredentials('', '');
      setTesting(false);
      setTestResult({
        success: true,
        message: isRTL ? 'تم التحويل إلى وضع التخزين المحلي التجريبي.' : 'Switched to Demo Local Storage Mode.',
      });
      showToast(
        isRTL ? 'الوضع التجريبي نشط' : 'Switched to Demo Mode',
        isRTL ? 'استخدام التخزين المحلي لعمليات الوكيل.' : 'Using local storage for agent portal operations.',
        'info'
      );
      onCredentialsUpdated();
      return;
    }

    try {
      saveSupabaseCredentials(cleanUrl, cleanKey);
      const client = getSupabaseClient();
      if (!client) throw new Error('Invalid client configuration.');

      // Quick ping test
      const { error } = await client.from('shops').select('count', { count: 'exact', head: true });
      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist yet, but credentials work!
          setTestResult({
            success: true,
            message: isRTL
              ? 'تم الاتصال بسوبابيس بنجاح! لم يتم العثور على الجداول بعد. يرجى تشغيل كود SQL أدناه في Supabase SQL Editor.'
              : 'Connected to Supabase! Tables not detected yet. Run the SQL schema script below in your Supabase SQL Editor.',
          });
          showToast(
            isRTL ? 'سوبابيس متصل' : 'Supabase Connected',
            isRTL ? 'يرجى إنشاء الجداول باستخدام كود SQL أدناه.' : 'Please create tables using the SQL Schema below.',
            'info'
          );
        } else {
          setTestResult({
            success: false,
            message: `Supabase ping failed: ${error.message} (${error.code || 'code'})`,
          });
          showToast(isRTL ? 'تنبيه الاتصال' : 'Connection Warning', error.message, 'error');
        }
      } else {
        setTestResult({
          success: true,
          message: isRTL
            ? 'تم الاتصال بنجاح والتحقق من جدول public.shops في سوبابيس!'
            : 'Successfully connected and verified public.shops table in Supabase!',
        });
        showToast(
          isRTL ? 'تم التحقق من سوبابيس' : 'Supabase Verified',
          isRTL ? 'متصل بقاعدة البيانات الحية.' : 'Connected to live database.',
          'success'
        );
      }

      onCredentialsUpdated();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Failed to connect to Supabase.',
      });
      showToast(isRTL ? 'خطأ بالاتصال' : 'Connection Error', err.message, 'error');
    } finally {
      setTesting(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    showToast(
      isRTL ? 'تم نسخ مخطط SQL' : 'SQL Schema Copied',
      isRTL ? 'الصق الكود في محرر SQL داخل سوبابيس.' : 'Paste into your Supabase SQL Editor.',
      'success'
    );
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleResetDemo = () => {
    localStorage.removeItem('opticportal_supabase_url');
    localStorage.removeItem('opticportal_supabase_anon');
    setUrl('');
    setAnonKey('');
    setTestResult({
      success: true,
      message: isRTL ? 'تمت إعادة التعيين إلى الوضع التجريبي التفاعلي.' : 'Reset to interactive Demo Agent mode.',
    });
    showToast(
      isRTL ? 'تم تفعيل الوضع التجريبي' : 'Demo Mode Activated',
      isRTL ? 'جاهز مع بيانات تجريبية للمتاجر وسجل العمولات.' : 'Ready with preloaded shops & ledger.',
      'info'
    );
    onCredentialsUpdated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 pb-safe">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 truncate">
                {t('dbSettingsTitle')}
              </h3>
              <p className="text-[11px] text-slate-500 truncate">
                {isRTL
                  ? 'اتصال مباشر بقاعدة بيانات سوبابيس وجداول المتاجر والهوية والسجل'
                  : 'Configure credentials to store optical shops and ledger directly in Supabase'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('cancelBtn')}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          <form onSubmit={handleTestAndSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                {t('supabaseUrlLabel')}
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3 py-2.5 text-sm sm:text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-slate-900 font-mono dir-ltr text-left min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                {t('supabaseKeyLabel')}
              </label>
              <input
                type="password"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2.5 text-sm sm:text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-slate-900 font-mono dir-ltr text-left min-h-[44px]"
              />
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-lg text-xs border ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {testResult.message}
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleResetDemo}
                className="text-xs text-slate-600 hover:text-slate-900 underline transition-colors min-h-[44px] px-2 flex items-center justify-center sm:justify-start"
              >
                {t('resetLocalDemo')}
              </button>

              <button
                type="submit"
                disabled={testing}
                className="w-full sm:w-auto px-5 py-3 text-sm sm:text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 min-h-[52px] sm:min-h-[48px]"
              >
                {testing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t('loading')}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{t('saveDbCreds')}</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* SQL Setup Helper Section */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-slate-500" />
                <span>{t('sqlSetupGuide')}</span>
              </span>
              <button
                type="button"
                onClick={handleCopySql}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition-colors min-h-[46px]"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">{t('sqlCopied')}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{t('copySql')}</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-900 rounded-lg p-3 max-h-36 overflow-y-auto">
              <pre className="text-[11px] font-mono text-slate-200 whitespace-pre leading-relaxed dir-ltr text-left">
                {SUPABASE_SQL_SCHEMA}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
