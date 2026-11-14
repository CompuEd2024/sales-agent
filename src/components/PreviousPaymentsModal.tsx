import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Search,
  History,
  CheckCircle2,
  Wrench,
  ShieldAlert,
  Calendar,
  Landmark,
  Wallet,
  Clock,
  Receipt,
  ArrowLeft,
} from 'lucide-react';
import {
  ShopWithConfig,
  ShopSubscriptionLedger,
  SubscriptionStatus,
  Agent,
  getAgentCurrency,
} from '../types/database';
import { useLanguage, formatMonthName } from '../lib/i18n';

interface PreviousPaymentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop: ShopWithConfig | null;
  allShops: ShopWithConfig[];
  ledger: ShopSubscriptionLedger[];
  currentAgent?: Agent | null;
}

const COLLECTION_TYPE_LABELS: Record<string, { en: string; ar: string }> = {
  cash: { en: 'Cash', ar: 'نقداً' },
  cliq: { en: 'CliQ', ar: 'كليك (CliQ)' },
  aani: { en: 'Aani / Instant', ar: 'آني / دفع فوري' },
  mada: { en: 'Mada / STC Pay', ar: 'مدى / STC Pay' },
  knet: { en: 'KNET', ar: 'كي نت (KNET)' },
  qpay: { en: 'QIB / QPay', ar: 'كيو باي / دفع محلي' },
  benefit: { en: 'BenefitPay', ar: 'بنفت بي' },
  mpay: { en: 'MPclear / Wallet', ar: 'محفظة هاتفية' },
  instapay: { en: 'InstaPay / Wallet', ar: 'إنستاباي / محفظة' },
  zelle: { en: 'Zelle / Venmo', ar: 'Zelle / Venmo' },
  faster_payments: { en: 'Faster Payments', ar: 'دفع فوري بريطاني' },
  bank_transfer: { en: 'Bank Transfer', ar: 'تحويل بنكي' },
  ach: { en: 'ACH / Bank Wire', ar: 'تحويل بنكي ACH' },
  pos: { en: 'Card / POS', ar: 'بطاقة / نقاط بيع' },
  card: { en: 'Credit / Debit Card', ar: 'بطاقة ائتمانية' },
  online_portal: { en: 'Online Portal', ar: 'بوابة إلكترونية' },
};

function resolveShopLiveStatus(targetShop?: ShopWithConfig | null): SubscriptionStatus {
  if (!targetShop) return 'active';
  if (targetShop.subscription_status) return targetShop.subscription_status;
  if (!targetShop.is_active) return 'suspended';
  if (targetShop.status === 'on_hold' || targetShop.status === 'maintenance') return 'maintenance';
  return 'active';
}

function formatDateDisplay(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function PreviousPaymentsModal({
  isOpen,
  onClose,
  shop,
  allShops,
  ledger,
  currentAgent,
}: PreviousPaymentsModalProps) {
  const { t, isRTL, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [scope, setScope] = useState<'shop' | 'all'>(shop ? 'shop' : 'all');

  useEffect(() => {
    if (isOpen) {
      setScope(shop ? 'shop' : 'all');
      setSearchQuery('');
    }
  }, [isOpen, shop?.id]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const shopsMap = useMemo(() => {
    const map = new Map<string, ShopWithConfig>();
    allShops.forEach((s) => map.set(s.id, s));
    if (shop) map.set(shop.id, shop);
    return map;
  }, [allShops, shop]);

  const scopedEntries = useMemo(() => {
    const list = scope === 'shop' && shop
      ? ledger.filter((entry) => entry.shop_id === shop.id)
      : ledger;

    return [...list].sort((a, b) => {
      const dateA = new Date(a.created_at || a.billing_period_start || 0).getTime();
      const dateB = new Date(b.created_at || b.billing_period_start || 0).getTime();
      return dateB - dateA;
    });
  }, [ledger, scope, shop]);

  const shopOnlyCount = useMemo(() => {
    if (!shop) return ledger.length;
    return ledger.filter((e) => e.shop_id === shop.id).length;
  }, [ledger, shop]);

  const getStatusMeta = (status: SubscriptionStatus) => {
    if (status === 'maintenance') {
      return {
        labelEn: 'Maintenance',
        labelAr: 'صيانة',
        display: isRTL ? 'صيانة' : 'Maintenance',
        textClass: 'text-amber-700',
        dotBgClass: 'bg-amber-50 border-amber-200',
        Icon: Wrench,
      };
    }
    if (status === 'suspended') {
      return {
        labelEn: 'Suspended',
        labelAr: 'معلّق',
        display: isRTL ? 'معلّق' : 'Suspended',
        textClass: 'text-rose-700',
        dotBgClass: 'bg-rose-50 border-rose-200',
        Icon: ShieldAlert,
      };
    }
    return {
      labelEn: 'Active',
      labelAr: 'نشط',
      display: isRTL ? 'نشط' : 'Active',
      textClass: 'text-emerald-700',
      dotBgClass: 'bg-emerald-50 border-emerald-200',
      Icon: CheckCircle2,
    };
  };

  const getCollectionMeta = (entry: ShopSubscriptionLedger) => {
    const raw = (entry.collection_method || entry.payment_method || 'cash').toLowerCase().trim();
    const mapped = COLLECTION_TYPE_LABELS[raw];
    return {
      raw,
      en: mapped ? mapped.en : raw.replace(/_/g, ' '),
      ar: mapped ? mapped.ar : raw.replace(/_/g, ' '),
      display: mapped ? (isRTL ? mapped.ar : mapped.en) : raw.replace(/_/g, ' '),
    };
  };

  const getBankTransferInfo = (entry: ShopSubscriptionLedger) => {
    const transferIso = entry.remitted_at || entry.verified_at || null;
    const formattedDate = formatDateDisplay(transferIso);
    const remStatus = (entry.remittance_status || '').toLowerCase();

    if (formattedDate) {
      const statusSuffixEn = remStatus === 'verified_by_admin' ? 'Verified' : 'Transferred';
      const statusSuffixAr = remStatus === 'verified_by_admin' ? 'معتمد' : 'تم التحويل';
      return {
        dateStr: formattedDate,
        statusEn: statusSuffixEn,
        statusAr: statusSuffixAr,
        display: formattedDate,
        isPending: false,
      };
    }

    if (remStatus === 'remitted_by_agent' || remStatus === 'verified_by_admin') {
      return {
        dateStr: '',
        statusEn: remStatus === 'verified_by_admin' ? 'Verified by admin' : 'Transferred',
        statusAr: remStatus === 'verified_by_admin' ? 'معتمد من الإدارة' : 'تم التحويل',
        display: remStatus === 'verified_by_admin' ? t('verifiedStatus') : t('transferredStatus'),
        isPending: false,
      };
    }

    return {
      dateStr: '',
      statusEn: 'Pending bank transfer',
      statusAr: 'بانتظار التحويل للبنك',
      display: t('pendingBankTransfer'),
      isPending: true,
    };
  };

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return scopedEntries;

    const tokens = q.split(/\s+/).filter(Boolean);

    return scopedEntries.filter((entry) => {
      const targetShop = shopsMap.get(entry.shop_id) || (shop && shop.id === entry.shop_id ? shop : undefined);
      const currency = getAgentCurrency(currentAgent, targetShop);
      const collection = getCollectionMeta(entry);
      const bankTransfer = getBankTransferInfo(entry);
      const liveStatus = resolveShopLiveStatus(targetShop);
      const statusMeta = getStatusMeta(liveStatus);
      const collectionDate = formatDateDisplay(entry.created_at);
      const paymentMonth = entry.payment_month || entry.billing_period_start.slice(0, 7);

      const searchableText = [
        entry.id,
        String(entry.amount_paid),
        Number(entry.amount_paid || 0).toFixed(2),
        entry.local_currency_code,
        currency.code,
        currency.symbol,
        collection.raw,
        collection.en,
        collection.ar,
        entry.created_at,
        collectionDate,
        entry.remitted_at,
        entry.verified_at,
        bankTransfer.dateStr,
        bankTransfer.statusEn,
        bankTransfer.statusAr,
        entry.remittance_status,
        entry.billing_period_start,
        entry.billing_period_end,
        paymentMonth,
        formatMonthName(paymentMonth, 'en'),
        formatMonthName(paymentMonth, 'ar'),
        liveStatus,
        statusMeta.labelEn,
        statusMeta.labelAr,
        targetShop?.shop_name || entry.shop?.shop_name,
        targetShop?.location || entry.shop?.location,
        targetShop?.tier || entry.shop?.tier,
        entry.notes,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return tokens.every((tok) => searchableText.includes(tok));
    });
  }, [scopedEntries, searchQuery, shopsMap, shop, currentAgent]);

  const totalFilteredAmount = useMemo(
    () => filteredEntries.reduce((sum, item) => sum + Number(item.amount_paid || 0), 0),
    [filteredEntries]
  );

  if (!isOpen) return null;

  const headerShopStatus = shop ? getStatusMeta(resolveShopLiveStatus(shop)) : null;
  const HeaderStatusIcon = headerShopStatus?.Icon;
  const headerCurrency = getAgentCurrency(currentAgent, shop);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/65 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90dvh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-150 pb-safe">
        {/* Mobile grab handle */}
        <div className="sm:hidden pt-2 pb-0.5 flex justify-center shrink-0">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* Fixed Header */}
        <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-slate-100 bg-slate-50/70 shrink-0 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-700 shrink-0" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  {t('previousPaymentsTitle')}
                </h3>
              </div>
              {shop && (
                <div className="flex items-center gap-2 flex-wrap mt-1 text-xs text-slate-600">
                  <span className="font-semibold text-slate-800 truncate max-w-[200px] sm:max-w-none">
                    {shop.shop_name}
                  </span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span className="text-slate-500">{t('shopStatusNowLabel')}:</span>
                  {headerShopStatus && HeaderStatusIcon && (
                    <span className={`inline-flex items-center gap-1 font-semibold ${headerShopStatus.textClass}`}>
                      <HeaderStatusIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>{headerShopStatus.display}</span>
                    </span>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label={t('cancelBtn')}
              className="text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 min-h-[44px] min-w-[44px] -me-1.5 -mt-1 flex items-center justify-center rounded-xl transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scope Toggle (This Shop vs All Shops) */}
          {shop && allShops.length > 1 && (
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-200/70 rounded-xl">
              <button
                type="button"
                onClick={() => setScope('shop')}
                className={`min-h-[44px] px-3 py-2 text-xs font-semibold rounded-lg transition-colors truncate ${
                  scope === 'shop'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('thisShopTab')} ({shopOnlyCount})
              </button>
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`min-h-[44px] px-3 py-2 text-xs font-semibold rounded-lg transition-colors truncate ${
                  scope === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('allShopsTab')} ({ledger.length})
              </button>
            </div>
          )}

          {/* Search Bar (letters, digits, dates, amounts, types, statuses) */}
          <div className="relative">
            <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPaymentsPlaceholder')}
              autoComplete="off"
              className="w-full min-h-[44px] ps-9 pe-11 py-2 text-sm sm:text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-slate-900 text-slate-900 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label={t('clearSearch')}
                className="absolute inset-y-0 end-0 pe-1.5 flex items-center justify-center min-w-[44px] min-h-[44px] text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Payments List */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-5 sm:py-4 space-y-3 bg-slate-50/40">
          {filteredEntries.length === 0 ? (
            <div className="py-10 px-4 text-center bg-white rounded-xl border border-slate-200">
              <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800">
                {searchQuery ? t('noMatchingPayments') : t('noPreviousPayments')}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-3 min-h-[44px] px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  {t('clearSearch')}
                </button>
              )}
            </div>
          ) : (
            filteredEntries.map((entry) => {
              const targetShop =
                shopsMap.get(entry.shop_id) ||
                (shop && shop.id === entry.shop_id ? shop : undefined);
              const entryCurrency = getAgentCurrency(currentAgent, targetShop);
              const currencySymbol = entry.local_currency_code || entryCurrency.symbol;
              const collection = getCollectionMeta(entry);
              const bankTransfer = getBankTransferInfo(entry);
              const collectionDate = formatDateDisplay(entry.created_at) || entry.billing_period_start;
              const paymentMonth = entry.payment_month || entry.billing_period_start.slice(0, 7);
              const liveStatus = resolveShopLiveStatus(targetShop);
              const statusMeta = getStatusMeta(liveStatus);
              const StatusIcon = statusMeta.Icon;

              return (
                <div
                  key={entry.id}
                  className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 space-y-3"
                >
                  {/* Top Row: Amount + Shop Name + Current Shop Status */}
                  <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-slate-100">
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-base sm:text-lg font-mono font-bold text-slate-900 tabular-nums">
                          {Number(entry.amount_paid || 0).toFixed(2)} {currencySymbol}
                        </span>
                        {paymentMonth && (
                          <span className="text-xs text-slate-500 font-medium">
                            · {formatMonthName(paymentMonth, language)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-700 truncate mt-0.5">
                        {targetShop?.shop_name || entry.shop?.shop_name || (isRTL ? 'متجر بصريات' : 'Optical Boutique')}
                      </p>
                    </div>

                    <div className="text-end shrink-0">
                      <span className="block text-[10px] font-medium text-slate-400">
                        {t('shopStatusNowLabel')}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold mt-0.5 ${statusMeta.textClass}`}>
                        <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                        <span>{statusMeta.display}</span>
                      </span>
                    </div>
                  </div>

                  {/* Structured Payment Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                    {/* 1. Type of collection */}
                    <div className="flex items-start gap-2 min-w-0">
                      <Wallet className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="block text-[11px] text-slate-400">
                          {t('collectionTypeLabel')}
                        </span>
                        <span className="font-semibold text-slate-800 block truncate">
                          {collection.display}
                        </span>
                      </div>
                    </div>

                    {/* 2. Date of collection */}
                    <div className="flex items-start gap-2 min-w-0">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="block text-[11px] text-slate-400">
                          {t('collectionDateLabel')}
                        </span>
                        <span className="font-mono font-medium text-slate-800 tabular-nums dir-ltr inline-block">
                          {collectionDate}
                        </span>
                      </div>
                    </div>

                    {/* 3. Date of transfer to the bank */}
                    <div className="flex items-start gap-2 min-w-0">
                      <Landmark className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="block text-[11px] text-slate-400">
                          {t('bankTransferDateLabel')}
                        </span>
                        {bankTransfer.dateStr ? (
                          <span className="font-mono font-medium text-emerald-700 tabular-nums dir-ltr inline-block">
                            {bankTransfer.dateStr}
                            <span className="font-sans text-[11px] text-slate-500 ms-1.5">
                              · {isRTL ? bankTransfer.statusAr : bankTransfer.statusEn}
                            </span>
                          </span>
                        ) : (
                          <span
                            className={`font-medium ${
                              bankTransfer.isPending ? 'text-amber-700' : 'text-emerald-700'
                            }`}
                          >
                            {bankTransfer.display}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 4. Billing period */}
                    <div className="flex items-start gap-2 min-w-0">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="block text-[11px] text-slate-400">
                          {t('billingPeriodLabel')}
                        </span>
                        <span className="font-mono font-medium text-slate-800 tabular-nums dir-ltr inline-block">
                          {entry.billing_period_start} → {entry.billing_period_end}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Notes & 50/50 split line */}
                  {(entry.notes || entry.agent_commission != null) && (
                    <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] text-slate-500">
                      {entry.notes ? (
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Receipt className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{entry.notes}</span>
                        </div>
                      ) : (
                        <span />
                      )}
                      <div className="font-mono tabular-nums text-slate-600 shrink-0">
                        50/50: <span className="text-emerald-700 font-semibold">+{Number(entry.agent_commission || 0).toFixed(2)}</span> / {Number(entry.platform_share || 0).toFixed(2)} {currencySymbol}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Fixed Footer */}
        <div className="px-4 py-3 sm:px-5 border-t border-slate-200 bg-white shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center justify-between sm:justify-start gap-3 text-xs text-slate-600">
            <span>
              {isRTL
                ? `عرض ${filteredEntries.length} من ${scopedEntries.length} دفعة`
                : `Showing ${filteredEntries.length} of ${scopedEntries.length} payments`}
            </span>
            <span className="font-mono font-bold text-slate-900 tabular-nums">
              {totalFilteredAmount.toFixed(2)} {headerCurrency.symbol}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto min-h-[52px] sm:min-h-[48px] px-5 py-3 text-sm sm:text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className={`w-4 h-4 shrink-0 ${isRTL ? 'rotate-180' : ''}`} />
            <span>{t('backToRecordPayment')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
