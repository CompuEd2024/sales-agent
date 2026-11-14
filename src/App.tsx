import React, { useState, useEffect, useCallback } from 'react';
import {
  portalService,
} from './lib/supabase';
import {
  ShopWithConfig,
  ShopSubscriptionLedger,
  SubscriptionTier,
  SubscriptionStatus,
  StaffProvisionInput,
  OnboardShopResponse,
  ShopNote,
} from './types/database';
import { ToastProvider, useToast } from './components/Toast';
import { LanguageProvider, useLanguage } from './lib/i18n';
import { AgentProvider, useAgent } from './context/AgentContext';
import { Navbar } from './components/Navbar';
import { AuthView } from './components/AuthView';
import { HomeDashboard } from './components/HomeDashboard';
import { ShopsDirectory } from './components/ShopsDirectory';
import { OnboardShopForm } from './components/OnboardShopForm';
import { FinancialLedger } from './components/FinancialLedger';
import { ChangeTierModal } from './components/ChangeTierModal';
import { ConfigureBrandingModal } from './components/ConfigureBrandingModal';
import { RecordPaymentModal } from './components/RecordPaymentModal';
import { ShopLivePreviewModal } from './components/ShopLivePreviewModal';
import { HoldShopModal } from './components/HoldShopModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { CloudinaryConfigModal } from './components/CloudinaryConfigModal';
import { RefreshCw, AlertTriangle } from 'lucide-react';

function AgentPortalApp() {
  const { showToast } = useToast();
  const { t, isRTL } = useLanguage();
  const { currentAgent, agentId, isLoading: agentLoading, error: agentError, logout, refreshAgent } = useAgent();

  const [shops, setShops] = useState<ShopWithConfig[]>([]);
  const [ledger, setLedger] = useState<ShopSubscriptionLedger[]>([]);
  const [notes, setNotes] = useState<ShopNote[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'shops' | 'onboard' | 'ledger'>('shops');
  const [directoryFilter, setDirectoryFilter] = useState<{
    tier?: string;
    status?: 'all' | 'active' | 'maintenance' | 'suspended' | 'at_risk';
    nonce: number;
  } | null>(null);

  // Modals state
  const [changeTierShop, setChangeTierShop] = useState<ShopWithConfig | null>(null);
  const [configureBrandingShop, setConfigureBrandingShop] = useState<ShopWithConfig | null>(null);
  const [recordPaymentShop, setRecordPaymentShop] = useState<ShopWithConfig | null>(null);
  const [recordPaymentDefaultMonth, setRecordPaymentDefaultMonth] = useState<string | undefined>(undefined);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState<boolean>(false);
  const [livePreviewShop, setLivePreviewShop] = useState<ShopWithConfig | null>(null);
  const [holdShop, setHoldShop] = useState<ShopWithConfig | null>(null);
  const [supabaseConfigOpen, setSupabaseConfigOpen] = useState<boolean>(false);
  const [cloudinaryConfigOpen, setCloudinaryConfigOpen] = useState<boolean>(false);

  // Scoped Data Fetching: Runs whenever currentAgent (specifically currentAgent.id) changes
  const loadScopedData = useCallback(async (activeAgentId: string) => {
    if (!activeAgentId) {
      setShops([]);
      setLedger([]);
      setNotes([]);
      return;
    }
    setDataLoading(true);
    setDataError(null);
    try {
      // 1. Scoped Shops Fetching: .eq('agent_id', currentAgent.id)
      // 2. Scoped Financial Ledger Fetching: .eq('agent_id', currentAgent.id)
      // 3. Scoped Shop Notes Fetching: .eq('agent_id', currentAgent.id)
      const [loadedShops, loadedLedger, loadedNotes] = await Promise.all([
        portalService.getShops(activeAgentId),
        portalService.getLedger(activeAgentId),
        portalService.getShopNotes(activeAgentId),
      ]);
      setShops(loadedShops);
      setLedger(loadedLedger);
      setNotes(loadedNotes);
    } catch (err: any) {
      console.error('Scoped data loading error:', err);
      setDataError(err.message || 'Failed to load scoped agent data');
      showToast(
        isRTL ? 'خطأ في جلب البيانات' : 'Data Query Error',
        err.message || 'Could not fetch records for this agent.',
        'error'
      );
    } finally {
      setDataLoading(false);
    }
  }, [showToast, isRTL]);

  useEffect(() => {
    if (agentId) {
      loadScopedData(agentId);
    } else {
      setShops([]);
      setLedger([]);
      setNotes([]);
      setDataError(null);
      setDataLoading(false);
    }
  }, [agentId, loadScopedData]);

  // Handlers for Tab 1 Actions
  const handleUpdateTier = async (shopId: string, tier: SubscriptionTier): Promise<boolean> => {
    const res = await portalService.updateShopTier(shopId, tier);
    if (res.success) {
      setShops((prev) =>
        prev.map((s) => (s.id === shopId ? { ...s, tier } : s))
      );
      const targetShop = shops.find((s) => s.id === shopId);
      showToast(
        t('toastTierUpdated'),
        isRTL
          ? `تم تحديث متجر ${targetShop?.shop_name || ''} إلى باقة ${tier.toUpperCase()}`
          : `${targetShop?.shop_name || 'Shop'} upgraded to ${tier.toUpperCase()} tier.`,
        'success'
      );
      return true;
    }
    showToast(isRTL ? 'فشل تحديث الباقة' : 'Failed to Update Tier', res.error, 'error');
    return false;
  };

  const handleUpdateConfig = async (
    shopId: string,
    config: {
      subdomain_slug: string;
      logo_url: string;
      primary_color: string;
      secondary_color: string;
      background_image_url: string;
    }
  ): Promise<boolean> => {
    const res = await portalService.updateShopConfig(shopId, config);
    if (res.success && res.config) {
      setShops((prev) =>
        prev.map((s) => (s.id === shopId ? { ...s, config: res.config } : s))
      );
      showToast(
        t('toastBrandingSaved'),
        isRTL ? 'تم حفظ الهوية وتحديث الصور في قاعدة البيانات.' : 'Storefront portal theme and slug updated.',
        'success'
      );
      return true;
    }
    showToast(isRTL ? 'فشل حفظ الهوية' : 'Failed to Save Branding', res.error, 'error');
    return false;
  };

  const handleUpdateSubscriptionStatus = async (
    shopId: string,
    newStatus: SubscriptionStatus,
    reason?: string
  ): Promise<boolean> => {
    const res = await portalService.updateShopSubscriptionStatus(shopId, newStatus, reason);
    if (res.success) {
      const isActive = newStatus === 'active';
      const nowIso = newStatus !== 'active' ? new Date().toISOString() : undefined;
      setShops((prev) =>
        prev.map((s) =>
          s.id === shopId
            ? {
                ...s,
                subscription_status: newStatus,
                is_active: isActive,
                status: newStatus,
                hold_reason:
                  newStatus === 'active'
                    ? undefined
                    : reason ||
                      (newStatus === 'maintenance'
                        ? 'Scheduled routine maintenance & late payment review'
                        : 'Storefront locked due to overdue subscription payment'),
                hold_date: nowIso,
              }
            : s
        )
      );
      const targetShop = shops.find((s) => s.id === shopId);
      const shopName = targetShop?.shop_name || 'Boutique';
      showToast(
        t('toastStatusChanged'),
        newStatus === 'maintenance'
          ? (isRTL
              ? `تم وضع ${shopName} في وضع الصيانة الدبلوماسي لحماية مكانة المتجر أثناء تسوية الاشتراك.`
              : `${shopName} switched to Diplomatic Maintenance mode. Public visitors see routine update notice.`)
          : newStatus === 'suspended'
          ? (isRTL
              ? `تم تعليق متجر ${shopName} وحجب الوصول بالكامل لعدم سداد الاشتراك الشهري.`
              : `${shopName} suspended offline due to overdue subscription.`)
          : (isRTL
              ? `تمت إعادة تفعيل متجر ${shopName} بنجاح واستعادة كافة الخدمات.`
              : `${shopName} restored to active status successfully.`),
        newStatus === 'active' ? 'success' : newStatus === 'maintenance' ? 'info' : 'warning'
      );
      return true;
    }
    showToast(isRTL ? 'فشل تعديل حالة المتجر' : 'Failed to update shop status', res.error, 'error');
    return false;
  };

  const handleUpdateHoldStatus = async (
    shopId: string,
    onHold: boolean,
    reason?: string
  ): Promise<boolean> => {
    return handleUpdateSubscriptionStatus(shopId, onHold ? 'maintenance' : 'active', reason);
  };

  const handleToggleActive = async (shopId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    await portalService.toggleShopActive(shopId, newStatus);
    setShops((prev) =>
      prev.map((s) =>
        s.id === shopId
          ? {
              ...s,
              is_active: newStatus,
              subscription_status: newStatus ? 'active' : 'maintenance',
              status: newStatus ? 'active' : 'maintenance',
              hold_reason: newStatus ? undefined : 'Monthly subscription payment overdue',
              hold_date: newStatus ? undefined : new Date().toISOString(),
            }
          : s
      )
    );
    showToast(
      t('toastStatusChanged'),
      newStatus
        ? (isRTL ? 'تم تفعيل اشتراك متجر البصريات.' : 'Optical boutique subscription active.')
        : (isRTL ? 'تم إيقاف الاشتراك مؤقتاً.' : 'Subscription paused.'),
      'info'
    );
  };

  // Handlers for Tab 2: Onboard Shop
  // Explicitly injects agent_id: currentAgent.id into public.shops and provisions staff credentials
  const handleOnboardShop = async (
    shopData: {
      shop_name: string;
      location: string;
      owner_email: string;
      tier: SubscriptionTier;
      agent_id: string;
      country_code?: string;
      currency_code?: string;
      currency_symbol?: string;
      tier_1_price?: number;
      tier_2_price?: number;
      tier_3_price?: number;
      tier_4_price?: number;
    },
    configData: {
      subdomain_slug: string;
      logo_url: string;
      primary_color: string;
      secondary_color: string;
      background_image_url: string;
      bg_image_url?: string;
      config_json?: any;
    },
    staffData: StaffProvisionInput[] = []
  ): Promise<OnboardShopResponse> => {
    if (!agentId) {
      showToast(
        isRTL ? 'خطأ في تعريف الوكيل' : 'Missing Agent Profile',
        isRTL ? 'لا يمكن تسجيل المتجر بدون تسجيل دخول الوكيل.' : 'No active agent session found.',
        'error'
      );
      return { success: false, error: 'Missing agent ID' };
    }

    // Auto-inject the correct agent_id and agent details
    const payload = {
      ...shopData,
      agent_id: agentId,
      agent: currentAgent || undefined,
    };

    const res = await portalService.onboardShopWithStaff(payload, configData, staffData);
    if (res.success && res.shop) {
      setShops((prev) => [res.shop!, ...prev]);
      showToast(
        t('toastShopOnboarded'),
        isRTL
          ? `تمت إضافة ${res.shop.shop_name} بنجاح إلى محفظة الوكيل (${currentAgent?.full_name}).`
          : `${res.shop.shop_name} assigned to agent portfolio (${currentAgent?.full_name}).`,
        'success'
      );
      if (res.warnings && res.warnings.length > 0) {
        showToast(
          isRTL ? 'تنبيهات النظام' : 'System Warnings',
          res.warnings.join('\n'),
          'info'
        );
      }
      return res;
    }

    showToast(
      isRTL ? 'فشل تسجيل المتجر' : 'Failed to Onboard Boutique',
      res.error || 'Transaction failed in database',
      'error'
    );
    return { success: false, error: res.error };
  };

  // Handlers for Tab 3: Record Payment
  // Calculates 50/50 split in JavaScript before submitting and inserts into public.shop_subscriptions_ledger
  const handleRecordPayment = async (payment: {
    shop_id: string;
    agent_id: string;
    amount_paid: number;
    billing_period_start: string;
    billing_period_end: string;
    payment_month?: string;
    collection_method?: string;
    notes?: string;
  }): Promise<boolean> => {
    if (!agentId) {
      showToast(
        isRTL ? 'خطأ في تعريف الوكيل' : 'Missing Agent Profile',
        isRTL ? 'لا يمكن تسجيل الدفعة بدون معرف الوكيل.' : 'Cannot record payment without active agent ID.',
        'error'
      );
      return false;
    }

    const payload = {
      ...payment,
      agent_id: agentId,
    };

    const res = await portalService.recordPayment(payload);
    if (res.success && res.ledgerEntry) {
      const associatedShop = shops.find((s) => s.id === payment.shop_id);
      const entryWithShop: ShopSubscriptionLedger = {
        ...res.ledgerEntry,
        shop: associatedShop
          ? {
              shop_name: associatedShop.shop_name,
              location: associatedShop.location,
              tier: associatedShop.tier,
            }
          : res.ledgerEntry.shop,
      };

      setLedger((prev) => [entryWithShop, ...prev]);

      // Automatically reinstate shop if it was on hold
      setShops((prev) =>
        prev.map((s) =>
          s.id === payment.shop_id
            ? {
                ...s,
                is_active: true,
                status: 'active',
                hold_reason: undefined,
                hold_date: undefined,
              }
            : s
        )
      );

      const commission = (payment.amount_paid * 0.5).toFixed(2);
      showToast(
        t('toastPaymentRecorded'),
        isRTL
          ? `تم قيد ${payment.amount_paid.toFixed(2)} د.أ. عمولة الوكيل (50%): +${commission} د.أ`
          : `Logged ${payment.amount_paid.toFixed(2)} JOD. Agent 50% commission: +${commission} JOD`,
        'success'
      );
      return true;
    }

    showToast(isRTL ? 'فشل تسجيل الدفعة' : 'Failed to Record Payment', res.error, 'error');
    return false;
  };

  // Handlers for Shop Notes & Follow-ups
  const handleAddShopNote = async (
    shopId: string,
    payload: { note: string; follow_up_date?: string | null }
  ): Promise<boolean> => {
    if (!agentId) return false;
    const res = await portalService.addShopNote(shopId, agentId, payload);
    if (res.success && res.note) {
      const matchedShop = shops.find((s) => s.id === shopId);
      const enrichedNote: ShopNote = {
        ...res.note,
        shop:
          res.note.shop ||
          (matchedShop
            ? { id: matchedShop.id, shop_name: matchedShop.shop_name, location: matchedShop.location }
            : undefined),
      };
      setNotes((prev) => [enrichedNote, ...prev]);
      showToast(
        t('toastNoteAdded'),
        matchedShop?.shop_name || (isRTL ? 'تم حفظ الملاحظة بنجاح.' : 'Note saved to shop record.'),
        'success'
      );
      return true;
    }
    showToast(t('toastNoteFailed'), res.error || (isRTL ? 'تعذر حفظ الملاحظة' : 'Could not save note.'), 'error');
    return false;
  };

  const handleToggleShopNoteDone = async (noteId: string, done: boolean): Promise<boolean> => {
    const res = await portalService.updateShopNote(noteId, { done });
    if (res.success && res.note) {
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, ...res.note, shop: res.note!.shop || n.shop } : n))
      );
      showToast(
        t('toastNoteUpdated'),
        done
          ? (isRTL ? 'تم تحديد المتابعة كمنجزة.' : 'Follow-up marked as done.')
          : (isRTL ? 'تمت إعادة فتح المتابعة.' : 'Follow-up reopened.'),
        done ? 'success' : 'info'
      );
      return true;
    }
    showToast(t('toastNoteFailed'), res.error || (isRTL ? 'تعذر تحديث الملاحظة' : 'Could not update note.'), 'error');
    return false;
  };

  const handleDeleteShopNote = async (noteId: string): Promise<boolean> => {
    const res = await portalService.deleteShopNote(noteId);
    if (res.success) {
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      showToast(t('toastNoteDeleted'), isRTL ? 'تم حذف الملاحظة بنجاح.' : 'Note removed from shop.', 'info');
      return true;
    }
    showToast(t('toastNoteFailed'), res.error || (isRTL ? 'تعذر حذف الملاحظة' : 'Could not delete note.'), 'error');
    return false;
  };

  const handleLogout = async () => {
    await logout();
    setShops([]);
    setLedger([]);
    setNotes([]);
    setDataError(null);
    setActiveTab('shops');
    setDirectoryFilter(null);
    setChangeTierShop(null);
    setConfigureBrandingShop(null);
    setRecordPaymentShop(null);
    setRecordPaymentDefaultMonth(undefined);
    setIsRecordPaymentOpen(false);
    setLivePreviewShop(null);
    setHoldShop(null);
    setCloudinaryConfigOpen(false);
    showToast(
      t('toastSignedOut'),
      isRTL ? 'تم تسجيل خروجك من منصة وكيل المبيعات.' : 'You have been logged out of the agent portal.',
      'info'
    );
  };

  // Stats calculation strictly scoped to active agent
  const activeShopsCount = shops.filter((s) => s.is_active).length;

  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthCommission = ledger
    .filter((item) => {
      const ym = item.payment_month || item.billing_period_start?.slice(0, 7) || item.created_at?.slice(0, 7);
      return ym === currentMonthPrefix;
    })
    .reduce((sum, item) => sum + Number(item.agent_commission || 0), 0);

  // Initial Agent Session Loading
  if (agentLoading && !currentAgent) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex items-center gap-3 text-slate-600 text-xs font-semibold">
          <RefreshCw className="w-4 h-4 animate-spin text-slate-900" />
          <span>{isRTL ? 'جاري تهيئة منصة الوكيل ونظام الصلاحيات...' : 'Initializing agent authentication & scoping...'}</span>
        </div>
      </div>
    );
  }

  // Not authenticated -> Show Agent Auth View
  if (!currentAgent) {
    return (
      <>
        <AuthView onOpenSupabaseConfig={() => setSupabaseConfigOpen(true)} />
        <SupabaseConfigModal
          isOpen={supabaseConfigOpen}
          onClose={() => setSupabaseConfigOpen(false)}
          onCredentialsUpdated={() => refreshAgent()}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* 1. Navigation & Header: Displays logged-in agent's name */}
      <Navbar
        activeShopsCount={activeShopsCount}
        currentMonthCommission={currentMonthCommission}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        onOpenSupabaseConfig={() => setSupabaseConfigOpen(true)}
        onOpenCloudinaryConfig={() => setCloudinaryConfigOpen(true)}
      />

      {/* Main Dashboard Container */}
      <main
        className={`flex-1 w-full mx-auto ${
          activeTab === 'onboard'
            ? 'max-w-[1440px] px-3 sm:px-6 lg:px-8 pt-16 md:pt-20 lg:pt-24 pb-36 md:pb-24'
            : 'max-w-7xl px-3 sm:px-6 lg:px-8 pt-16 md:pt-20 lg:pt-24 pb-24 md:pb-12'
        }`}
      >
        {/* Error Notification Banner if Agent Profile or Transaction Failed */}
        {(agentError || dataError) && (
          <div className="mb-5 p-3.5 sm:p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{agentError || dataError}</span>
            </div>
            <button
              onClick={() => agentId && loadScopedData(agentId)}
              className="min-h-[44px] px-4 py-2 bg-white border border-amber-300 rounded-lg font-semibold text-amber-800 hover:bg-amber-100 shrink-0"
            >
              {isRTL ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        )}

        {/* Loading Indicator for Data Queries */}
        {dataLoading && (
          <div className="py-8 flex items-center justify-center text-xs text-slate-500 gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-slate-700" />
            <span>{isRTL ? 'جاري استرجاع البيانات المخصصة للوكيل...' : 'Querying records filtered by agent_id...'}</span>
          </div>
        )}

        {/* Tab 1: Home Dashboard + Shops Directory (Scoped to currentAgent.id) */}
        {!dataLoading && activeTab === 'shops' && (
          <>
            <HomeDashboard
              shops={shops}
              ledger={ledger}
              notes={notes}
              currentAgent={currentAgent}
              onNavigateToLedger={() => setActiveTab('ledger')}
              onOpenRecordPayment={(shop) => {
                setRecordPaymentShop(shop || null);
                setRecordPaymentDefaultMonth(currentMonthPrefix);
                setIsRecordPaymentOpen(true);
              }}
              onToggleNoteDone={handleToggleShopNoteDone}
              onFilterByTier={(tier) =>
                setDirectoryFilter({ tier, status: 'all', nonce: Date.now() })
              }
              onFilterByStatus={(status) =>
                setDirectoryFilter({ tier: 'all', status, nonce: Date.now() })
              }
            />
            <ShopsDirectory
              shops={shops}
              ledger={ledger}
              notes={notes}
              currentAgent={currentAgent}
              externalFilter={directoryFilter}
              onOpenChangeTier={(shop) => setChangeTierShop(shop)}
              onOpenConfigureBranding={(shop) => setConfigureBrandingShop(shop)}
              onOpenRecordPayment={(shop) => {
                setRecordPaymentShop(shop);
                setIsRecordPaymentOpen(true);
              }}
              onOpenLivePreview={(shop) => setLivePreviewShop(shop)}
              onOpenHoldModal={(shop) => setHoldShop(shop)}
              onUpdateSubscriptionStatus={handleUpdateSubscriptionStatus}
              onUpdateShopStaff={(shopId, updatedStaff) => {
                setShops((prev) =>
                  prev.map((s) => (s.id === shopId ? { ...s, staff: updatedStaff } : s))
                );
              }}
              onAddShopNote={handleAddShopNote}
              onToggleNoteDone={handleToggleShopNoteDone}
              onDeleteNote={handleDeleteShopNote}
              onNavigateToOnboard={() => setActiveTab('onboard')}
            />
          </>
        )}

        {/* Tab 2: Onboard New Shop Form (Auto-injects agent_id: currentAgent.id) */}
        {activeTab === 'onboard' && (
          <OnboardShopForm
            agentId={currentAgent.id}
            agentName={currentAgent.full_name}
            agent={currentAgent}
            onShopOnboarded={() => {
              setActiveTab('shops');
            }}
            onCancel={() => setActiveTab('shops')}
            onOpenCloudinaryConfig={() => setCloudinaryConfigOpen(true)}
            onSubmitOnboard={handleOnboardShop}
          />
        )}

        {/* Tab 3: Financial & Commission Ledger (Scoped strictly to currentAgent.id) */}
        {!dataLoading && activeTab === 'ledger' && (
          <FinancialLedger
            ledger={ledger}
            shops={shops}
            onOpenRecordPayment={(shop, defaultMonth) => {
              setRecordPaymentShop(shop || null);
              setRecordPaymentDefaultMonth(defaultMonth);
              setIsRecordPaymentOpen(true);
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 pb-20 md:pb-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <p className="text-center sm:text-start">
            {isRTL
              ? `© 2026 منصة بوابة البصريات (OpticPortal) · الوكيل النشط: ${currentAgent.full_name}`
              : `© 2026 OpticPortal Platform · Active Agent: ${currentAgent.full_name}`}
          </p>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="font-mono text-emerald-700 font-semibold">
              {isRTL ? 'نظام العمولات 50/50' : '50/50 Commission Split'}
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ChangeTierModal
        shop={changeTierShop}
        isOpen={Boolean(changeTierShop)}
        onClose={() => setChangeTierShop(null)}
        onSuccess={() => {}}
        onUpdateTier={handleUpdateTier}
      />

      <ConfigureBrandingModal
        shop={configureBrandingShop}
        isOpen={Boolean(configureBrandingShop)}
        onClose={() => setConfigureBrandingShop(null)}
        onSuccess={() => {}}
        onOpenCloudinaryConfig={() => setCloudinaryConfigOpen(true)}
        onUpdateConfig={handleUpdateConfig}
      />

      <RecordPaymentModal
        shop={recordPaymentShop}
        availableShops={shops}
        ledger={ledger}
        agentId={currentAgent.id}
        currentAgent={currentAgent}
        isOpen={isRecordPaymentOpen}
        initialMonth={recordPaymentDefaultMonth}
        onClose={() => {
          setIsRecordPaymentOpen(false);
          setRecordPaymentShop(null);
          setRecordPaymentDefaultMonth(undefined);
        }}
        onSuccess={() => {}}
        onRecordPayment={handleRecordPayment}
      />

      <ShopLivePreviewModal
        shop={livePreviewShop}
        isOpen={Boolean(livePreviewShop)}
        onClose={() => setLivePreviewShop(null)}
        onOpenRecordPayment={(shop) => {
          setLivePreviewShop(null);
          setRecordPaymentShop(shop);
          setIsRecordPaymentOpen(true);
        }}
      />

      <HoldShopModal
        shop={holdShop}
        isOpen={Boolean(holdShop)}
        onClose={() => setHoldShop(null)}
        onUpdateSubscriptionStatus={handleUpdateSubscriptionStatus}
        onOpenRecordPayment={(shop) => {
          setHoldShop(null);
          setRecordPaymentShop(shop);
          setIsRecordPaymentOpen(true);
        }}
      />

      <SupabaseConfigModal
        isOpen={supabaseConfigOpen}
        onClose={() => setSupabaseConfigOpen(false)}
        onCredentialsUpdated={() => {
          refreshAgent();
          if (agentId) loadScopedData(agentId);
        }}
      />

      <CloudinaryConfigModal
        isOpen={cloudinaryConfigOpen}
        onClose={() => setCloudinaryConfigOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <AgentProvider>
          <AgentPortalApp />
        </AgentProvider>
      </ToastProvider>
    </LanguageProvider>
  );
}
