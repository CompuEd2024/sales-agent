import React, { useMemo, useState } from 'react';
import {
  Wallet,
  Clock,
  TrendingUp,
  Layers,
  CheckCircle2,
  Wrench,
  ShieldAlert,
  AlertTriangle,
  ArrowUpRight,
  PlusCircle,
  BarChart3,
  CalendarClock,
  Check,
  DollarSign,
} from 'lucide-react';
import {
  ShopWithConfig,
  ShopSubscriptionLedger,
  ShopNote,
  Agent,
  SubscriptionTier,
  SubscriptionStatus,
  SUBSCRIPTION_TIERS,
  getAgentCurrency,
  getShopMonthlyAmount,
  isShopAtRisk,
  getLocalTodayISODate,
} from '../types/database';
import { useLanguage, formatMonthName } from '../lib/i18n';

interface HomeDashboardProps {
  shops: ShopWithConfig[];
  ledger: ShopSubscriptionLedger[];
  notes?: ShopNote[];
  currentAgent?: Agent | null;
  onNavigateToLedger: () => void;
  onOpenRecordPayment: (shop?: ShopWithConfig) => void;
  onToggleNoteDone?: (noteId: string, done: boolean) => Promise<boolean> | void;
  onFilterByTier: (tier: SubscriptionTier | 'all') => void;
  onFilterByStatus: (status: SubscriptionStatus | 'at_risk' | 'all') => void;
}

function getLedgerMonth(entry: ShopSubscriptionLedger): string {
  return (
    entry.payment_month ||
    entry.billing_period_start?.slice(0, 7) ||
    entry.created_at?.slice(0, 7) ||
    ''
  );
}

function getShopNormalizedStatus(shop: ShopWithConfig): SubscriptionStatus {
  if (shop.subscription_status) return shop.subscription_status;
  if (shop.status === 'on_hold') return 'maintenance';
  if (!shop.is_active) return 'suspended';
  return 'active';
}

function formatShortMonthLabel(ym: string, language: 'en' | 'ar'): string {
  const parts = ym.split('-');
  if (parts.length < 2) return ym;
  const monthIdx = parseInt(parts[1], 10) - 1;
  const SHORT_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const SHORT_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  if (monthIdx < 0 || monthIdx > 11) return ym;
  return language === 'ar' ? SHORT_AR[monthIdx] : SHORT_EN[monthIdx];
}

function formatCurrencyBuckets(
  buckets: Record<string, number>,
  primarySymbol: string
): string {
  const entries = Object.entries(buckets).filter(([, val]) => val > 0);
  if (entries.length === 0) {
    return `0.00 ${primarySymbol}`;
  }
  entries.sort(([a], [b]) => {
    if (a === primarySymbol) return -1;
    if (b === primarySymbol) return 1;
    return a.localeCompare(b);
  });
  return entries.map(([sym, val]) => `${val.toFixed(2)} ${sym}`).join(' + ');
}

function formatCompactNumber(val: number): string {
  if (val >= 1000) {
    const k = val / 1000;
    return Number.isInteger(k) ? `${k}k` : `${k.toFixed(1)}k`;
  }
  return Number.isInteger(val) ? String(val) : val.toFixed(0);
}

export function HomeDashboard({
  shops,
  ledger,
  notes = [],
  currentAgent,
  onNavigateToLedger,
  onOpenRecordPayment,
  onToggleNoteDone,
  onFilterByTier,
  onFilterByStatus,
}: HomeDashboardProps) {
  const { t, isRTL, language } = useLanguage();

  const defaultCurrency = useMemo(
    () => getAgentCurrency(currentAgent, shops[0]),
    [currentAgent, shops]
  );

  const now = useMemo(() => new Date(), []);
  const currentMonthYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const todayStr = useMemo(() => getLocalTodayISODate(now), [now]);

  const last6Months = useMemo(() => {
    const list: string[] = [];
    for (let offset = -5; offset <= 0; offset++) {
      const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      list.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return list;
  }, [now]);

  const [selectedChartMonth, setSelectedChartMonth] = useState<string>(currentMonthYM);
  const [updatingNoteId, setUpdatingNoteId] = useState<string | null>(null);

  const shopsMap = useMemo(
    () => new Map<string, ShopWithConfig>(shops.map((s) => [s.id, s])),
    [shops]
  );

  // Follow-ups due today (plus any open overdue follow-ups so nothing slips)
  const dueFollowUps = useMemo(() => {
    return notes
      .filter((n) => !n.done && Boolean(n.follow_up_date) && String(n.follow_up_date).slice(0, 10) <= todayStr)
      .sort((a, b) => String(a.follow_up_date).localeCompare(String(b.follow_up_date)));
  }, [notes, todayStr]);

  const handleMarkFollowUpDone = async (noteId: string) => {
    if (!onToggleNoteDone || updatingNoteId === noteId) return;
    setUpdatingNoteId(noteId);
    try {
      await onToggleNoteDone(noteId, true);
    } finally {
      setUpdatingNoteId(null);
    }
  };

  const getEntryCurrencySymbol = (entry: ShopSubscriptionLedger): string => {
    if (entry.local_currency_code) {
      return entry.local_currency_code === 'USD' ? '$' : entry.local_currency_code;
    }
    const matchedShop = shopsMap.get(entry.shop_id);
    if (matchedShop) {
      return getAgentCurrency(currentAgent, matchedShop).symbol;
    }
    if (entry.shop?.currency_symbol) return entry.shop.currency_symbol;
    if (entry.shop?.currency_code) return entry.shop.currency_code === 'USD' ? '$' : entry.shop.currency_code;
    return defaultCurrency.symbol;
  };

  // 1. Commission Earned This Month
  const currentMonthStats = useMemo(() => {
    const entries = ledger.filter((item) => getLedgerMonth(item) === currentMonthYM);
    const commissionBuckets: Record<string, number> = {};
    const collectedBuckets: Record<string, number> = {};
    const paidShopIds = new Set<string>();

    for (const item of entries) {
      paidShopIds.add(item.shop_id);
      const sym = getEntryCurrencySymbol(item);
      const amt = Number(item.amount_paid || 0);
      const comm = Number(item.agent_commission ?? amt * 0.5);
      collectedBuckets[sym] = (collectedBuckets[sym] || 0) + amt;
      commissionBuckets[sym] = (commissionBuckets[sym] || 0) + comm;
    }

    return {
      entriesCount: entries.length,
      paidShopsCount: paidShopIds.size,
      paidShopIds,
      commissionText: formatCurrencyBuckets(commissionBuckets, defaultCurrency.symbol),
      collectedText: formatCurrencyBuckets(collectedBuckets, defaultCurrency.symbol),
    };
  }, [ledger, currentMonthYM, defaultCurrency.symbol, shopsMap, currentAgent]);

  // 2. Expected Commission from Shops That Are Still Unpaid This Month
  const unpaidStats = useMemo(() => {
    const unpaidShops = shops.filter((s) => !currentMonthStats.paidShopIds.has(s.id));
    const expectedCommissionBuckets: Record<string, number> = {};
    const expectedGrossBuckets: Record<string, number> = {};

    for (const shop of unpaidShops) {
      const monthlyFee = getShopMonthlyAmount(shop, currentAgent);
      const sym = getAgentCurrency(currentAgent, shop).symbol;
      expectedGrossBuckets[sym] = (expectedGrossBuckets[sym] || 0) + monthlyFee;
      expectedCommissionBuckets[sym] =
        (expectedCommissionBuckets[sym] || 0) + Number((monthlyFee * 0.5).toFixed(2));
    }

    return {
      unpaidShops,
      count: unpaidShops.length,
      expectedCommissionText: formatCurrencyBuckets(expectedCommissionBuckets, defaultCurrency.symbol),
      expectedGrossText: formatCurrencyBuckets(expectedGrossBuckets, defaultCurrency.symbol),
    };
  }, [shops, currentMonthStats.paidShopIds, currentAgent, defaultCurrency.symbol]);

  // 3. Number of Shops by Tier and by Status
  const breakdown = useMemo(() => {
    const byTier: Record<SubscriptionTier, number> = {
      platinum: 0,
      gold: 0,
      silver: 0,
      bronze: 0,
    };
    const byStatus: Record<SubscriptionStatus, number> = {
      active: 0,
      maintenance: 0,
      suspended: 0,
    };
    let atRiskCount = 0;

    for (const shop of shops) {
      if (shop.tier in byTier) {
        byTier[shop.tier] += 1;
      }
      const st = getShopNormalizedStatus(shop);
      byStatus[st] += 1;
      if (isShopAtRisk(shop)) {
        atRiskCount += 1;
      }
    }

    return { byTier, byStatus, atRiskCount, total: shops.length };
  }, [shops]);

  // 4. Monthly Collections Chart Data (Last 6 Months)
  const monthlySeries = useMemo(() => {
    const map = new Map<
      string,
      {
        ym: string;
        collected: number;
        commission: number;
        count: number;
        collectedBuckets: Record<string, number>;
        commissionBuckets: Record<string, number>;
      }
    >();

    for (const ym of last6Months) {
      map.set(ym, {
        ym,
        collected: 0,
        commission: 0,
        count: 0,
        collectedBuckets: {},
        commissionBuckets: {},
      });
    }

    for (const item of ledger) {
      const ym = getLedgerMonth(item);
      const bucket = map.get(ym);
      if (!bucket) continue;
      const amt = Number(item.amount_paid || 0);
      const comm = Number(item.agent_commission ?? amt * 0.5);
      const sym = getEntryCurrencySymbol(item);
      bucket.collected += amt;
      bucket.commission += comm;
      bucket.count += 1;
      bucket.collectedBuckets[sym] = (bucket.collectedBuckets[sym] || 0) + amt;
      bucket.commissionBuckets[sym] = (bucket.commissionBuckets[sym] || 0) + comm;
    }

    const rows = Array.from(map.values());
    const maxCollected = Math.max(...rows.map((r) => r.collected), 1);
    const totalCollectedBuckets: Record<string, number> = {};
    for (const r of rows) {
      for (const [sym, val] of Object.entries(r.collectedBuckets)) {
        totalCollectedBuckets[sym] = (totalCollectedBuckets[sym] || 0) + val;
      }
    }

    return {
      rows,
      maxCollected,
      totalCollectedText: formatCurrencyBuckets(totalCollectedBuckets, defaultCurrency.symbol),
    };
  }, [last6Months, ledger, defaultCurrency.symbol, shopsMap, currentAgent]);

  const activeChartPoint =
    monthlySeries.rows.find((r) => r.ym === selectedChartMonth) ||
    monthlySeries.rows[monthlySeries.rows.length - 1];

  const tierItems: { id: SubscriptionTier; barColor: string; dotColor: string }[] = [
    { id: 'platinum', barColor: 'bg-indigo-600', dotColor: 'bg-indigo-600' },
    { id: 'gold', barColor: 'bg-amber-500', dotColor: 'bg-amber-500' },
    { id: 'silver', barColor: 'bg-slate-400', dotColor: 'bg-slate-400' },
    { id: 'bronze', barColor: 'bg-orange-500', dotColor: 'bg-orange-500' },
  ];

  const statusItems: {
    id: SubscriptionStatus;
    label: string;
    icon: React.ReactNode;
    barColor: string;
    textColor: string;
  }[] = [
    {
      id: 'active',
      label: t('statusActive'),
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
      barColor: 'bg-emerald-500',
      textColor: 'text-emerald-700',
    },
    {
      id: 'maintenance',
      label: t('statusMaintenance'),
      icon: <Wrench className="w-3.5 h-3.5 text-amber-600 shrink-0" />,
      barColor: 'bg-amber-500',
      textColor: 'text-amber-800',
    },
    {
      id: 'suspended',
      label: t('statusSuspended'),
      icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />,
      barColor: 'bg-rose-500',
      textColor: 'text-rose-700',
    },
  ];

  return (
    <section
      aria-label={t('dashboardTitle')}
      className="mb-6 space-y-4"
    >
      {/* Top Row: Primary Commission KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Commission Earned This Month */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 sm:p-5 flex flex-col justify-between gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {t('commissionEarnedThisMonth')}
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  {formatMonthName(currentMonthYM, language)}
                </span>
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-emerald-700 tabular-nums tracking-tight">
                {currentMonthStats.commissionText}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
            <span className="text-slate-600 tabular-nums truncate">
              <strong className="text-slate-900 font-semibold">
                {currentMonthStats.paidShopsCount}/{breakdown.total}
              </strong>{' '}
              {t('paidShopsSummary')} ·{' '}
              <span className="font-mono text-slate-700">
                {currentMonthStats.collectedText}
              </span>{' '}
              {t('grossCollectedShort')}
            </span>
            <button
              type="button"
              onClick={onNavigateToLedger}
              className="min-h-[44px] px-3 py-1.5 rounded-lg hover:bg-indigo-50 inline-flex items-center gap-1 text-xs font-semibold text-[#4338ca] hover:text-[#2a14b4] whitespace-nowrap shrink-0 transition-colors"
            >
              <span>{t('viewFullLedger')}</span>
              <ArrowUpRight className={`w-3.5 h-3.5 ${isRTL ? '-scale-x-100' : ''}`} />
            </button>
          </div>
        </div>

        {/* Card 2: Expected Commission from Still-Unpaid Shops */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 sm:p-5 flex flex-col justify-between gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {t('expectedCommissionUnpaid')}
                </span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border tabular-nums ${
                    unpaidStats.count > 0
                      ? 'text-amber-800 bg-amber-50 border-amber-200'
                      : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  }`}
                >
                  {unpaidStats.count} {isRTL ? 'متجر غير مسدد' : 'unpaid'}
                </span>
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-slate-900 tabular-nums tracking-tight">
                {unpaidStats.expectedCommissionText}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
            <span className="text-slate-600 truncate">
              {unpaidStats.count === 0 ? (
                t('allShopsPaidThisMonth')
              ) : (
                <>
                  <span className="font-semibold text-slate-800 tabular-nums">
                    {unpaidStats.count} {t('unpaidShopsSummary')}
                  </span>
                  <span className="text-slate-400"> · </span>
                  <span className="text-slate-500">
                    {unpaidStats.unpaidShops
                      .slice(0, 2)
                      .map((s) => s.shop_name)
                      .join(', ')}
                    {unpaidStats.count > 2 ? ` +${unpaidStats.count - 2}` : ''}
                  </span>
                </>
              )}
            </span>

            {unpaidStats.count > 0 && (
              <button
                type="button"
                onClick={() => onOpenRecordPayment(unpaidStats.unpaidShops[0])}
                className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold whitespace-nowrap shrink-0 transition-colors"
              >
                <PlusCircle className="w-4 h-4 shrink-0" />
                <span>{t('collectUnpaidBtn')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Second Row: 6-Month Collections Chart + Shops Breakdown (Tier & Status) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Simple Monthly Collections Chart (Last 6 Months) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-2xs p-4 sm:p-5 flex flex-col justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#4338ca] shrink-0" />
                <span>{t('monthlyCollections6mTitle')}</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {t('monthlyCollections6mSubtitle')}
              </p>
            </div>
            <div className="text-start sm:text-end shrink-0">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {t('total6mCollected')}
              </div>
              <div className="text-sm font-bold font-mono text-slate-900 tabular-nums">
                {monthlySeries.totalCollectedText}
              </div>
            </div>
          </div>

          {/* 6-Month Bar Chart */}
          <div className="relative pt-5 pb-1">
            {/* Subtle horizontal reference lines */}
            <div className="pointer-events-none absolute inset-x-0 top-5 bottom-7 flex flex-col justify-between">
              <div className="border-b border-dashed border-slate-200/80 w-full" />
              <div className="border-b border-dashed border-slate-200/80 w-full" />
              <div className="border-b border-slate-200 w-full" />
            </div>

            <div
              className="relative grid grid-cols-6 gap-2 sm:gap-3 items-end h-36 sm:h-40"
              dir="ltr"
            >
              {monthlySeries.rows.map((point) => {
                const heightPct =
                  point.collected > 0
                    ? Math.max(8, Math.round((point.collected / monthlySeries.maxCollected) * 100))
                    : 0;
                const isSelected = activeChartPoint?.ym === point.ym;
                const isCurrent = point.ym === currentMonthYM;

                return (
                  <button
                    key={point.ym}
                    type="button"
                    onClick={() => setSelectedChartMonth(point.ym)}
                    onMouseEnter={() => setSelectedChartMonth(point.ym)}
                    className="group flex flex-col items-center justify-end h-full min-h-[44px] focus:outline-none"
                    aria-label={`${formatMonthName(point.ym, language)}: ${formatCurrencyBuckets(point.collectedBuckets, defaultCurrency.symbol)}`}
                  >
                    <span
                      className={`text-[10px] sm:text-[11px] font-mono font-semibold mb-1 tabular-nums transition-colors ${
                        isSelected
                          ? 'text-[#2a14b4]'
                          : 'text-slate-500 group-hover:text-slate-900'
                      }`}
                    >
                      {formatCompactNumber(point.collected)}
                    </span>

                    <div className="w-full max-w-[44px] flex-1 flex items-end justify-center">
                      {point.collected > 0 ? (
                        <div
                          style={{ height: `${heightPct}%` }}
                          className={`w-full rounded-t-md transition-all duration-200 relative overflow-hidden ${
                            isSelected
                              ? 'bg-[#4338ca] ring-2 ring-[#4338ca]/25'
                              : isCurrent
                              ? 'bg-indigo-500 group-hover:bg-[#4338ca]'
                              : 'bg-indigo-200 group-hover:bg-indigo-400'
                          }`}
                        >
                          {/* Subtle bottom 50% commission band */}
                          <div
                            className={`absolute inset-x-0 bottom-0 h-1/2 ${
                              isSelected ? 'bg-emerald-400/35' : 'bg-emerald-500/20'
                            }`}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-1 rounded-full bg-slate-200 group-hover:bg-slate-300 transition-colors" />
                      )}
                    </div>

                    <span
                      className={`mt-1.5 text-[11px] font-semibold whitespace-nowrap ${
                        isSelected
                          ? 'text-[#2a14b4]'
                          : isCurrent
                          ? 'text-slate-900'
                          : 'text-slate-500'
                      }`}
                    >
                      {formatShortMonthLabel(point.ym, language)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Month Detail Bar */}
          {activeChartPoint && (
            <div className="rounded-lg bg-slate-50 border border-slate-200/80 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <TrendingUp className="w-3.5 h-3.5 text-[#4338ca] shrink-0" />
                <span>{formatMonthName(activeChartPoint.ym, language)}</span>
                <span className="text-[11px] font-normal text-slate-500 tabular-nums">
                  ({activeChartPoint.count} {t('paymentsWord')})
                </span>
              </div>
              <div className="flex items-center gap-3 font-mono text-xs tabular-nums">
                <span className="text-slate-700">
                  {t('grossCollectedShort')}:{' '}
                  <strong className="text-slate-900">
                    {formatCurrencyBuckets(activeChartPoint.collectedBuckets, defaultCurrency.symbol)}
                  </strong>
                </span>
                <span className="text-emerald-700">
                  50%:{' '}
                  <strong>
                    {formatCurrencyBuckets(activeChartPoint.commissionBuckets, defaultCurrency.symbol)}
                  </strong>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Shops by Tier & Shops by Status */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
          {/* Number of Shops by Tier */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>{t('shopsByTierTitle')}</span>
              </h3>
              <span className="text-[11px] font-mono font-semibold text-slate-500 tabular-nums">
                {t('totalShopsCount')}: {breakdown.total}
              </span>
            </div>

            <div className="space-y-2">
              {tierItems.map(({ id, barColor, dotColor }) => {
                const count = breakdown.byTier[id];
                const pct = breakdown.total > 0 ? Math.round((count / breakdown.total) * 100) : 0;
                const tierLabel = SUBSCRIPTION_TIERS[id].name;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onFilterByTier(id)}
                    className="w-full min-h-[46px] text-start group rounded-xl px-2.5 py-2 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="flex items-center gap-2 font-medium text-slate-700 group-hover:text-slate-900">
                        <span className={`w-2 h-2 rounded-full ${dotColor} shrink-0`} />
                        <span>{tierLabel}</span>
                      </span>
                      <span className="font-mono font-bold text-slate-900 tabular-nums">
                        {count}
                        <span className="text-[10px] font-normal text-slate-400 ms-1">({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor} transition-all duration-300`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Number of Shops by Status */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{t('shopsByStatusTitle')}</span>
              </h3>
              {breakdown.atRiskCount > 0 && (
                <button
                  type="button"
                  onClick={() => onFilterByStatus('at_risk')}
                  className="min-h-[40px] sm:min-h-[34px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 tabular-nums transition-colors"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>
                    {breakdown.atRiskCount} {t('atRiskFlag')}
                  </span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              {statusItems.map((item) => {
                const count = breakdown.byStatus[item.id];
                const pct = breakdown.total > 0 ? Math.round((count / breakdown.total) * 100) : 0;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onFilterByStatus(item.id)}
                    className="w-full min-h-[46px] text-start group rounded-xl px-2.5 py-2 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="flex items-center gap-2 font-medium text-slate-700 group-hover:text-slate-900 truncate">
                        {item.icon}
                        <span className="truncate">{item.label}</span>
                      </span>
                      <span className={`font-mono font-bold tabular-nums shrink-0 ${item.textColor}`}>
                        {count}
                        <span className="text-[10px] font-normal text-slate-400 ms-1">({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.barColor} transition-all duration-300`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Third Row: Follow-ups Due Today */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
              <CalendarClock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>{t('followUpsDueTodayTitle')}</span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold tabular-nums border ${
                    dueFollowUps.length > 0
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {dueFollowUps.length}
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 font-mono tabular-nums">{todayStr}</p>
            </div>
          </div>
        </div>

        {dueFollowUps.length === 0 ? (
          <div className="rounded-lg bg-slate-50 border border-dashed border-slate-200 px-3.5 py-3 text-xs text-slate-500 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{t('noFollowUpsDueToday')}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {dueFollowUps.map((item) => {
              const matchedShop = shopsMap.get(item.shop_id);
              const shopName =
                item.shop?.shop_name ||
                matchedShop?.shop_name ||
                (isRTL ? 'متجر بصريات' : 'Optical Shop');
              const dueDate = String(item.follow_up_date || '').slice(0, 10);
              const isOverdue = dueDate < todayStr;
              const isBusy = updatingNoteId === item.id;

              return (
                <div
                  key={item.id}
                  className={`rounded-xl border p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors ${
                    isOverdue
                      ? 'bg-rose-50/40 border-rose-200'
                      : 'bg-amber-50/40 border-amber-200'
                  }`}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center flex-wrap gap-1.5">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {shopName}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold border tabular-nums ${
                          isOverdue
                            ? 'bg-rose-100 text-rose-800 border-rose-200'
                            : 'bg-amber-100 text-amber-800 border-amber-200'
                        }`}
                      >
                        {isOverdue ? `${t('overdueBadge')} · ${dueDate}` : t('dueTodayBadge')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 break-words leading-relaxed">
                      {item.note}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {matchedShop && (
                      <button
                        type="button"
                        onClick={() => onOpenRecordPayment(matchedShop)}
                        className="min-h-[48px] sm:min-h-[40px] px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                        title={t('recordPayment')}
                      >
                        <DollarSign className="w-4 h-4 shrink-0" />
                        <span>{t('collectUnpaidBtn')}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleMarkFollowUpDone(item.id)}
                      className="min-h-[48px] sm:min-h-[40px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Check className="w-4 h-4 shrink-0" />
                      <span>{t('markDoneBtn')}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
