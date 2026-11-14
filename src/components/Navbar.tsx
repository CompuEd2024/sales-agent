import React from 'react';
import {
  LogOut,
  Eye,
  Store,
  UserPlus,
  ReceiptText,
} from 'lucide-react';
import { useLanguage } from '../lib/i18n';
import { useAgent } from '../context/AgentContext';

interface NavbarProps {
  activeShopsCount: number;
  currentMonthCommission: number;
  activeTab: 'shops' | 'onboard' | 'ledger';
  setActiveTab: (tab: 'shops' | 'onboard' | 'ledger') => void;
  onLogout: () => void;
  onOpenSupabaseConfig?: () => void;
  onOpenCloudinaryConfig: () => void;
}

export function Navbar({
  activeShopsCount: _activeShopsCount,
  currentMonthCommission: _currentMonthCommission,
  activeTab,
  setActiveTab,
  onLogout,
  onOpenSupabaseConfig: _onOpenSupabaseConfig,
  onOpenCloudinaryConfig: _onOpenCloudinaryConfig,
}: NavbarProps) {
  const { language, toggleLanguage, isRTL } = useLanguage();
  const { currentAgent } = useAgent();

  const agent = currentAgent;
  const agentName = agent?.full_name || 'Kareem Mansour';

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-40 bg-[#faf8ff]/95 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-slate-200/80 transition-all">
        <div className="w-full px-3 sm:px-6 lg:px-8 max-w-[1440px] mx-auto flex items-center justify-between h-14 md:h-16 lg:h-20 gap-3 md:gap-6">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-2.5 shrink-0 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#4338ca] text-white flex items-center justify-center shadow-[0_2px_6px_rgba(67,56,202,0.25)] shrink-0">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <span className="text-base font-bold text-[#131b2e] tracking-tight block leading-none whitespace-nowrap">
                OpticPortal
              </span>
              <span className="hidden md:block text-[11px] text-[#777586] uppercase tracking-wider font-semibold mt-0.5 whitespace-nowrap">
                {isRTL ? 'بوابة الشركاء' : 'Partner Hub'}
              </span>
            </div>
          </div>

          {/* Mobile Right Actions (Compact, >=48px tap targets) */}
          <div className="flex md:hidden items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleLanguage}
              className="min-h-[46px] min-w-[52px] px-3.5 rounded-xl bg-[#eaedff] text-[#464554] active:bg-[#d8defe] text-xs font-bold transition-colors shrink-0 flex items-center justify-center whitespace-nowrap"
            >
              {language === 'en' ? 'العربية' : 'EN'}
            </button>

            <div
              className="w-10 h-10 rounded-full bg-[#2a14b4] text-white flex items-center justify-center text-xs font-bold shadow-xs shrink-0"
              title={agentName}
            >
              {agentName.charAt(0)}
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="min-h-[46px] min-w-[48px] rounded-xl bg-[#f2f3ff] text-[#464554] active:bg-rose-100 hover:bg-rose-50 hover:text-rose-700 flex items-center justify-center transition-colors shrink-0"
              title={isRTL ? 'تسجيل الخروج' : 'Sign Out'}
              aria-label={isRTL ? 'تسجيل الخروج' : 'Sign Out'}
            >
              <LogOut className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Zone 2: Desktop Nav Tabs (Hidden on mobile — moved to bottom bar on phones) */}
          <nav className="hidden md:flex items-center justify-center p-1 rounded-xl bg-[#f2f3ff] border border-slate-200/70 gap-1 shadow-2xs shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('shops')}
              className={`min-h-[40px] px-3.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === 'shops'
                  ? 'bg-[#4338ca] text-white shadow-xs'
                  : 'text-[#464554] hover:bg-white/80 hover:text-[#131b2e]'
              }`}
            >
              <Store className="w-3.5 h-3.5 shrink-0" />
              <span>{isRTL ? 'دليل المتاجر' : 'Directory'}</span>
              <span className="hidden lg:inline">{isRTL ? '' : ' of Boutiques'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('onboard')}
              className={`min-h-[40px] px-3.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === 'onboard'
                  ? 'bg-[#4338ca] text-white shadow-xs'
                  : 'text-[#464554] hover:bg-white/80 hover:text-[#131b2e]'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 shrink-0" />
              <span>{isRTL ? 'تسجيل متجر' : 'Onboard'}</span>
              <span className="hidden lg:inline">{isRTL ? ' جديد' : ' Boutique'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ledger')}
              className={`min-h-[40px] px-3.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === 'ledger'
                  ? 'bg-[#4338ca] text-white shadow-xs'
                  : 'text-[#464554] hover:bg-white/80 hover:text-[#131b2e]'
              }`}
            >
              <ReceiptText className="w-3.5 h-3.5 shrink-0" />
              <span>{isRTL ? 'سجل العمولات' : 'Ledger'}</span>
              <span className="hidden lg:inline">{isRTL ? ' والتحصيلات' : ' & Commissions'}</span>
            </button>
          </nav>

          {/* Zone 3: Desktop Actions */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleLanguage}
              className="min-h-[40px] px-3 py-1.5 rounded-lg bg-[#eaedff] text-[#464554] hover:bg-[#e2e7ff] hover:text-[#131b2e] text-xs font-bold transition-colors shrink-0 whitespace-nowrap"
            >
              {language === 'en' ? 'العربية' : 'English'}
            </button>

            <div
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-[#f2f3ff] text-[#131b2e] border border-slate-200/60 shadow-2xs shrink-0"
              title={agentName}
            >
              <div className="w-7 h-7 rounded-full bg-[#2a14b4] text-white flex items-center justify-center text-xs font-bold shadow-xs shrink-0">
                {agentName.charAt(0)}
              </div>
              <span className="text-xs font-semibold max-w-[130px] truncate">
                {agentName}
              </span>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="min-h-[40px] min-w-[40px] rounded-lg bg-[#f2f3ff] text-[#464554] hover:bg-rose-50 hover:text-rose-700 flex items-center justify-center transition-colors shrink-0"
              title={isRTL ? 'تسجيل الخروج' : 'Sign Out'}
              aria-label={isRTL ? 'تسجيل الخروج' : 'Sign Out'}
            >
              <LogOut className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar (Thumb Zone Anchor) */}
      <nav
        aria-label={isRTL ? 'التنقل الرئيسي' : 'Primary navigation'}
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(15,23,42,0.06)] pb-safe"
      >
        <div className="grid grid-cols-3 h-[70px] items-stretch">
          <button
            type="button"
            onClick={() => setActiveTab('shops')}
            className={`relative flex flex-col items-center justify-center gap-1 min-h-[62px] px-2 transition-colors active:scale-[0.97] ${
              activeTab === 'shops'
                ? 'text-[#2a14b4] font-bold'
                : 'text-slate-500 font-medium hover:text-slate-800'
            }`}
          >
            {activeTab === 'shops' && (
              <span className="absolute top-0 inset-x-5 h-0.5 rounded-b-full bg-[#4338ca]" />
            )}
            <span
              className={`w-14 h-8 rounded-full flex items-center justify-center transition-colors ${
                activeTab === 'shops' ? 'bg-[#eaedff]' : ''
              }`}
            >
              <Store className="w-5 h-5 shrink-0" />
            </span>
            <span className="text-xs leading-none whitespace-nowrap">
              {isRTL ? 'المتاجر' : 'Directory'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('onboard')}
            className={`relative flex flex-col items-center justify-center gap-1 min-h-[62px] px-2 transition-colors active:scale-[0.97] ${
              activeTab === 'onboard'
                ? 'text-[#2a14b4] font-bold'
                : 'text-slate-500 font-medium hover:text-slate-800'
            }`}
          >
            {activeTab === 'onboard' && (
              <span className="absolute top-0 inset-x-5 h-0.5 rounded-b-full bg-[#4338ca]" />
            )}
            <span
              className={`w-14 h-8 rounded-full flex items-center justify-center transition-colors ${
                activeTab === 'onboard' ? 'bg-[#eaedff]' : ''
              }`}
            >
              <UserPlus className="w-5 h-5 shrink-0" />
            </span>
            <span className="text-xs leading-none whitespace-nowrap">
              {isRTL ? 'تسجيل متجر' : 'Onboard'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={`relative flex flex-col items-center justify-center gap-1 min-h-[62px] px-2 transition-colors active:scale-[0.97] ${
              activeTab === 'ledger'
                ? 'text-[#2a14b4] font-bold'
                : 'text-slate-500 font-medium hover:text-slate-800'
            }`}
          >
            {activeTab === 'ledger' && (
              <span className="absolute top-0 inset-x-5 h-0.5 rounded-b-full bg-[#4338ca]" />
            )}
            <span
              className={`w-14 h-8 rounded-full flex items-center justify-center transition-colors ${
                activeTab === 'ledger' ? 'bg-[#eaedff]' : ''
              }`}
            >
              <ReceiptText className="w-5 h-5 shrink-0" />
            </span>
            <span className="text-xs leading-none whitespace-nowrap">
              {isRTL ? 'العمولات' : 'Ledger'}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
