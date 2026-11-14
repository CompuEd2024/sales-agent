import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Percent,
  Calendar,
  Building2,
  Download,
  Search,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Wallet,
  Receipt,
  Filter,
} from 'lucide-react';
import { ShopSubscriptionLedger, ShopWithConfig, getAgentCurrency } from '../types/database';
import { useLanguage, formatMonthName } from '../lib/i18n';
import { useAgent } from '../context/AgentContext';

interface FinancialLedgerProps {
  ledger: ShopSubscriptionLedger[];
  shops: ShopWithConfig[];
  onOpenRecordPayment: (shop?: ShopWithConfig, defaultMonth?: string) => void;
}

export function FinancialLedger({ ledger, shops, onOpenRecordPayment }: FinancialLedgerProps) {
  const { t, isRTL, language } = useLanguage();
  const { currentAgent } = useAgent();
  const agentCurrency = useMemo(() => {
    return getAgentCurrency(currentAgent, shops[0]);
  }, [currentAgent, shops]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShopFilter, setSelectedShopFilter] = useState<string>('all');

  // Compute available months
  const now = useMemo(() => new Date(), []);
  const currentMonthYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    
    // Always include all 12 months for current year (2026) and previous year (2025)
    const currentYear = now.getFullYear();
    for (let y = currentYear; y >= currentYear - 1; y--) {
      for (let m = 12; m >= 1; m--) {
        monthsSet.add(`${y}-${String(m).padStart(2, '0')}`);
      }
    }

    // Also include any months present in ledger entries
    ledger.forEach((item) => {
      const ym = item.payment_month || item.billing_period_start.slice(0, 7);
      if (ym) monthsSet.add(ym);
    });

    return Array.from(monthsSet).sort().reverse();
  }, [ledger, now]);

  // Recent 5 months for quick pill selection
  const quickMonths = useMemo(() => {
    const list: string[] = [];
    for (let offset = 0; offset >= -3; offset--) {
      const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      list.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return list;
  }, [now]);

  // Selected Month State (defaults to current month)
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthYM);

  // Filter ledger based on selectedMonth, shop, and search
  const filteredLedger = useMemo(() => {
    return ledger.filter((item) => {
      const itemMonth = item.payment_month || item.billing_period_start.slice(0, 7);
      const matchesMonth = selectedMonth === 'all' || itemMonth === selectedMonth;

      const shopName = item.shop?.shop_name || '';
      const matchesSearch =
        shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.billing_period_start.includes(searchTerm) ||
        item.billing_period_end.includes(searchTerm) ||
        (item.payment_month && item.payment_month.includes(searchTerm)) ||
        (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesShop = selectedShopFilter === 'all' || item.shop_id === selectedShopFilter;

      return matchesMonth && matchesSearch && matchesShop;
    });
  }, [ledger, selectedMonth, searchTerm, selectedShopFilter]);

  // Month-scoped or All-Time aggregates
  const activeEntriesForMetrics = useMemo(() => {
    if (selectedMonth === 'all') return ledger;
    return ledger.filter(
      (item) => (item.payment_month || item.billing_period_start.slice(0, 7)) === selectedMonth
    );
  }, [ledger, selectedMonth]);

  const totalCollected = activeEntriesForMetrics.reduce((sum, item) => sum + Number(item.amount_paid || 0), 0);
  const totalAgentCommission = activeEntriesForMetrics.reduce((sum, item) => sum + Number(item.agent_commission || 0), 0);
  const totalPlatformShare = activeEntriesForMetrics.reduce((sum, item) => sum + Number(item.platform_share || 0), 0);
  const clearedPaymentsCount = activeEntriesForMetrics.length;

  // Month navigation helpers
  const handlePrevMonth = () => {
    const currentIndex = availableMonths.indexOf(selectedMonth);
    if (currentIndex >= 0 && currentIndex < availableMonths.length - 1) {
      setSelectedMonth(availableMonths[currentIndex + 1]);
    }
  };

  const handleNextMonth = () => {
    const currentIndex = availableMonths.indexOf(selectedMonth);
    if (currentIndex > 0) {
      setSelectedMonth(availableMonths[currentIndex - 1]);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Transaction ID',
      'Date Logged',
      'Payment For Month',
      'Shop Name',
      'Billing Start',
      'Billing End',
      'Amount Collected (JOD)',
      'Agent Commission 50% (JOD)',
      'Platform Share 50% (JOD)',
      'Collection Method',
      'Collector Note',
    ];

    const rows = filteredLedger.map((item) => [
      item.id,
      item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A',
      item.payment_month || item.billing_period_start.slice(0, 7),
      item.shop?.shop_name || 'Optical Boutique',
      item.billing_period_start,
      item.billing_period_end,
      item.amount_paid.toFixed(2),
      item.agent_commission.toFixed(2),
      item.platform_share.toFixed(2),
      item.collection_method || 'cash',
      item.notes || 'Collected by agent and remitted',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `opticportal_ledger_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper method for method badges
  const getMethodBadge = (method?: string) => {
    switch (method) {
      case 'cliq':
        return { label: 'CliQ', icon: '⚡', color: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'aani':
        return { label: 'Aani', icon: '⚡', color: 'bg-cyan-50 text-cyan-800 border-cyan-200' };
      case 'mada':
        return { label: 'Mada / STC', icon: '⚡', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'knet':
        return { label: 'KNET', icon: '⚡', color: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'qpay':
        return { label: 'QPay', icon: '⚡', color: 'bg-rose-50 text-rose-800 border-rose-200' };
      case 'benefit':
        return { label: 'BenefitPay', icon: '⚡', color: 'bg-red-50 text-red-800 border-red-200' };
      case 'mpay':
        return { label: 'MPclear', icon: '⚡', color: 'bg-teal-50 text-teal-800 border-teal-200' };
      case 'instapay':
        return { label: 'InstaPay', icon: '⚡', color: 'bg-purple-50 text-purple-800 border-purple-200' };
      case 'zelle':
        return { label: 'Zelle', icon: '⚡', color: 'bg-violet-50 text-violet-800 border-violet-200' };
      case 'faster_payments':
        return { label: 'Faster Pay', icon: '⚡', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
      case 'ach':
      case 'bank_transfer':
        return { label: isRTL ? 'تحويل بنكي' : 'Bank Wire', icon: '🏦', color: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'pos':
        return { label: 'POS', icon: '💳', color: 'bg-purple-50 text-purple-800 border-purple-200' };
      case 'cash':
      default:
        return { label: isRTL ? 'نقداً' : 'Cash', icon: '💵', color: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Notice & Agent Collection Protocol Banner */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-100">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                {isRTL ? 'بروتوكول تحصيل اشتراكات البصريات (تقاسم 50/50)' : '50/50 Subscription Collection Protocol'}
              </h4>
              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                {t('collectedByAgentBadge')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {t('collectionNotice')}
            </p>
          </div>
        </div>

        {/* Record Payment Button */}
        <div className="shrink-0 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenRecordPayment(undefined, selectedMonth !== 'all' ? selectedMonth : currentMonthYM)}
            className="w-full sm:w-auto min-h-[52px] sm:min-h-[48px] px-5 py-3 text-sm sm:text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-2xs"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {selectedMonth !== 'all'
                ? `${t('recordPaymentForMonth')} ${formatMonthName(selectedMonth, language)}`
                : t('recordFee')}
            </span>
          </button>
        </div>
      </div>

      {/* MONTH CHOICE SELECTOR BAR */}
      <div className="bg-slate-900 text-white rounded-xl p-4 shadow-md border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Month Navigation Title & Quick Controls */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-indigo-400 flex items-center justify-center border border-slate-700 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                {t('monthlyLedgerTitle')}
              </div>
              <div className="text-base sm:text-lg font-bold text-white flex items-center gap-2 flex-wrap">
                <span>
                  {selectedMonth === 'all'
                    ? t('allMonths')
                    : formatMonthName(selectedMonth, language)}
                </span>
                {selectedMonth === currentMonthYM && (
                  <span className="text-[11px] font-semibold text-emerald-400">
                    · {isRTL ? 'الشهر الحالي' : 'Current'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Center / Right: Interactive Month Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Month Navigation Arrows */}
            <div className="flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={isRTL ? handleNextMonth : handlePrevMonth}
                disabled={selectedMonth === 'all' || availableMonths.indexOf(selectedMonth) >= availableMonths.length - 1}
                title={isRTL ? 'الشهر التالي' : 'Previous Month'}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-mono px-2 text-slate-300 tabular-nums">
                {selectedMonth === 'all' ? 'All' : selectedMonth}
              </span>

              <button
                type="button"
                onClick={isRTL ? handlePrevMonth : handleNextMonth}
                disabled={selectedMonth === 'all' || availableMonths.indexOf(selectedMonth) <= 0}
                title={isRTL ? 'الشهر السابق' : 'Next Month'}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Comprehensive Month Dropdown Choice */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="flex-1 sm:flex-none min-h-[44px] px-3 py-2 text-xs bg-slate-800 text-white border border-slate-700 rounded-xl focus:outline-none focus:border-indigo-400 font-medium"
            >
              <option value="all">{t('allMonths')}</option>
              {availableMonths.map((ym) => (
                <option key={ym} value={ym}>
                  {formatMonthName(ym, language)} {ym === currentMonthYM ? `(${isRTL ? 'الحالي' : 'Current'})` : ''}
                </option>
              ))}
            </select>

            {/* Custom Calendar Month Input Picker */}
            <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-xl px-3 min-h-[44px]">
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">{t('customMonthPicker')}:</span>
              <input
                type="month"
                value={selectedMonth !== 'all' ? selectedMonth : currentMonthYM}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedMonth(e.target.value);
                  }
                }}
                className="bg-transparent text-xs text-white focus:outline-none font-mono cursor-pointer min-h-[40px]"
                title={isRTL ? 'اختر أي شهر من التقويم' : 'Pick any month from calendar'}
              />
            </div>
          </div>
        </div>

        {/* Quick Select Month Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium me-1">
            {t('quickMonths')}
          </span>

          <button
            type="button"
            onClick={() => setSelectedMonth('all')}
            className={`min-h-[44px] px-3.5 py-2 text-xs rounded-xl transition-colors ${
              selectedMonth === 'all'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {t('allMonths')}
          </button>

          {quickMonths.map((ym) => (
            <button
              type="button"
              key={ym}
              onClick={() => setSelectedMonth(ym)}
              className={`min-h-[44px] px-3.5 py-2 text-xs rounded-xl transition-colors flex items-center gap-1.5 ${
                selectedMonth === ym
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>{formatMonthName(ym, language)}</span>
            </button>
          ))}
        </div>

        {/* Status sub-bar */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-400">
          <span>
            {selectedMonth === 'all'
              ? (isRTL ? `عرض كافة القيود لكافة الأشهر (${clearedPaymentsCount} قيد مسجل)` : `Showing all historical ledger records (${clearedPaymentsCount} records)`)
              : (isRTL
                  ? `عرض السجل الشهري لشهر ${formatMonthName(selectedMonth, language)} (${clearedPaymentsCount} اشتراكات مسددة)`
                  : `Viewing monthly ledger for ${formatMonthName(selectedMonth, language)} (${clearedPaymentsCount} subscriptions cleared)`
                )}
          </span>

          <span className="font-mono text-emerald-400 font-semibold text-xs tabular-nums">
            {totalAgentCommission.toFixed(2)} {agentCurrency.symbol} {isRTL ? 'عمولتك المستحقة' : 'Commission Earned'}
          </span>
        </div>
      </div>

      {/* Dynamic Summary Cards for Selected Month / All-time */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Gross Collected */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 truncate">
              {selectedMonth === 'all' ? t('totalCollected') : t('selectedMonthCollected')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-lg sm:text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {totalCollected.toFixed(2)} {agentCurrency.symbol}
            </span>
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
              {selectedMonth === 'all'
                ? t('grossSubscriptionsDesc')
                : (isRTL ? `إجمالي اشتراكات ${formatMonthName(selectedMonth, language)}` : `Collected in ${formatMonthName(selectedMonth, language)}`)}
            </p>
          </div>
        </div>

        {/* Card 2: Agent Share (50%) */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-emerald-200 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-800 truncate">
              {selectedMonth === 'all' ? t('yourCommission') : t('selectedMonthCommission')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-lg sm:text-2xl font-bold font-mono text-emerald-700 tabular-nums">
              {totalAgentCommission.toFixed(2)} {agentCurrency.symbol}
            </span>
            <p className="text-[11px] text-emerald-600 mt-1 line-clamp-2">
              {isRTL ? 'صافي أرباح الوكيل (50%)' : 'Instant 50% agent cut'}
            </p>
          </div>
        </div>

        {/* Card 3: Platform Share (50%) */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 truncate">
              {selectedMonth === 'all' ? t('platformShare') : t('selectedMonthPlatform')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-lg sm:text-2xl font-bold font-mono text-slate-800 tabular-nums">
              {totalPlatformShare.toFixed(2)} {agentCurrency.symbol}
            </span>
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
              {isRTL ? 'حصة المنصة (50%)' : 'Platform share (50%)'}
            </p>
          </div>
        </div>

        {/* Card 4: Payments Count */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 truncate">
              {isRTL ? 'المتاجر المسددة' : 'Cleared'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-lg sm:text-2xl font-bold font-mono text-sky-700 tabular-nums">
              {clearedPaymentsCount}
            </span>
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
              {t('paymentsRecordedCount')}
            </p>
          </div>
        </div>
      </div>

      {/* Table & Controls Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Table Filter & Actions Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="grid grid-cols-1 sm:flex sm:items-center gap-2.5 flex-1 flex-wrap">
            {/* Search Input */}
            <div className="relative w-full sm:min-w-[200px] sm:flex-1 sm:max-w-xs">
              <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={t('searchLedger')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full min-h-[44px] pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 bg-slate-50/50"
              />
            </div>

            <div className="grid grid-cols-2 sm:flex items-center gap-2">
              {/* In-Table Month Quick Selector */}
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                aria-label={t('monthChoice')}
                className="w-full sm:w-auto min-h-[44px] px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 font-medium text-slate-800"
              >
                <option value="all">{t('allMonths')}</option>
                {availableMonths.map((ym) => (
                  <option key={ym} value={ym}>
                    {formatMonthName(ym, language)}
                  </option>
                ))}
              </select>

              {/* Shop Filter */}
              <select
                value={selectedShopFilter}
                onChange={(e) => setSelectedShopFilter(e.target.value)}
                aria-label={t('allBoutiques')}
                className="w-full sm:w-auto min-h-[44px] px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-slate-800"
              >
                <option value="all">{t('allBoutiques')}</option>
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.shop_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filteredLedger.length === 0}
              className="min-h-[48px] px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="truncate">{t('exportCsv')}</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenRecordPayment(undefined, selectedMonth !== 'all' ? selectedMonth : currentMonthYM)}
              className="min-h-[48px] px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">{t('recordFee')}</span>
            </button>
          </div>
        </div>

        {/* Informational banner when filtered to a month */}
        {selectedMonth !== 'all' && (
          <div className="bg-indigo-50/70 border-b border-indigo-100 px-4 py-2.5 flex items-center justify-between gap-2 text-xs text-indigo-900">
            <span className="flex items-center gap-1.5 min-w-0">
              <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="truncate">
                {isRTL
                  ? `السجل الشهري: ${formatMonthName(selectedMonth, language)} (${filteredLedger.length} قيد)`
                  : `${formatMonthName(selectedMonth, language)} (${filteredLedger.length} entries)`}
              </span>
            </span>

            <button
              type="button"
              onClick={() => setSelectedMonth('all')}
              className="min-h-[44px] px-3 text-xs font-semibold text-indigo-700 hover:text-indigo-900 hover:bg-indigo-100/70 rounded-lg underline shrink-0 whitespace-nowrap transition-colors"
            >
              {isRTL ? 'عرض كافة الأشهر' : 'View all months'}
            </button>
          </div>
        )}

        {/* Mobile Cards View (Shown on phones & small screens) */}
        <div className="md:hidden divide-y divide-slate-200">
          {filteredLedger.length === 0 ? (
            <div className="text-center py-10 px-4 text-slate-500">
              <DollarSign className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-sm text-slate-700">{t('noPaymentRecords')}</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                {selectedMonth !== 'all'
                  ? (isRTL
                      ? `لم يتم تسجيل أي دفعات اشتراك لشهر ${formatMonthName(selectedMonth, language)}.`
                      : `No subscription payments recorded for ${formatMonthName(selectedMonth, language)}.`)
                  : t('noPaymentRecordsDesc')}
              </p>
              <button
                type="button"
                onClick={() => onOpenRecordPayment(undefined, selectedMonth !== 'all' ? selectedMonth : currentMonthYM)}
                className="mt-4 w-full min-h-[48px] px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-2xs"
              >
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                <span>
                  {selectedMonth !== 'all'
                    ? `${t('recordPaymentForMonth')} ${formatMonthName(selectedMonth, language)}`
                    : t('recordFee')}
                </span>
              </button>
            </div>
          ) : (
            filteredLedger.map((row) => {
              const dateStr = row.created_at
                ? new Date(row.created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : 'Recent';
              const paymentMonthStr = row.payment_month || row.billing_period_start.slice(0, 7);
              const methodBadge = getMethodBadge(row.collection_method);
              const currencySymbol =
                row.shop?.currency_symbol ||
                row.shop?.currency_code ||
                row.local_currency_code ||
                agentCurrency.symbol;

              return (
                <div key={row.id} className="p-4 space-y-3 bg-white">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        {row.shop?.shop_name || 'Optical Boutique'}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                        <span className="font-semibold text-indigo-700">
                          {formatMonthName(paymentMonthStr, language)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{dateStr}</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700 shrink-0">
                      {t('statusCleared')}
                    </span>
                  </div>

                  {/* 3-Column Financial Metrics Strip */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div>
                      <span className="text-[10px] text-slate-500 block">{t('colAmountPaid')}</span>
                      <span className="text-xs font-mono font-bold text-slate-900 tabular-nums">
                        {row.amount_paid.toFixed(2)} {currencySymbol}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-700 block">{t('colAgentCommission50')}</span>
                      <span className="text-xs font-mono font-bold text-emerald-700 tabular-nums">
                        +{row.agent_commission.toFixed(2)} {currencySymbol}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">{t('colPlatformShare50')}</span>
                      <span className="text-xs font-mono font-semibold text-slate-700 tabular-nums">
                        {row.platform_share.toFixed(2)} {currencySymbol}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                    <span className="font-mono dir-ltr truncate">
                      {row.billing_period_start} → {row.billing_period_end}
                    </span>
                    <span className="font-medium text-slate-700 shrink-0">
                      {methodBadge.icon} {methodBadge.label}
                    </span>
                  </div>

                  {row.notes && (
                    <p className="text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg">
                      {row.notes}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Payments History Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left rtl:text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3">{t('colLoggedDate')}</th>
                <th className="px-4 py-3">{t('colPaymentMonth')}</th>
                <th className="px-4 py-3">{t('colOpticalShop')}</th>
                <th className="px-4 py-3">{t('colBillingPeriod')}</th>
                <th className="px-4 py-3 text-right rtl:text-left">{t('colAmountPaid')}</th>
                <th className="px-4 py-3 text-right rtl:text-left">{t('colAgentCommission50')}</th>
                <th className="px-4 py-3 text-right rtl:text-left">{t('colPlatformShare50')}</th>
                <th className="px-4 py-3 text-center">{t('collectionMethod')}</th>
                <th className="px-4 py-3 text-center">{t('colStatus')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredLedger.map((row) => {
                const dateStr = row.created_at
                  ? new Date(row.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'Recent';

                const paymentMonthStr = row.payment_month || row.billing_period_start.slice(0, 7);
                const methodBadge = getMethodBadge(row.collection_method);
                const currencySymbol =
                  row.shop?.currency_symbol ||
                  row.shop?.currency_code ||
                  row.local_currency_code ||
                  agentCurrency.symbol;

                return (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Logged Date */}
                    <td className="px-4 py-3 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                      {dateStr}
                    </td>

                    {/* Payment For Month (Explicit Column) */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
                        <Calendar className="w-3 h-3 text-indigo-600" />
                        <span>{formatMonthName(paymentMonthStr, language)}</span>
                      </span>
                    </td>

                    {/* Shop Name & Notes */}
                    <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                      <div>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{row.shop?.shop_name || 'Optical Boutique'}</span>
                        </div>
                        {row.notes && (
                          <p className="text-[10px] text-slate-400 font-normal mt-0.5 max-w-xs truncate">
                            {row.notes}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Billing Period */}
                    <td className="px-4 py-3 text-slate-600 font-mono text-[11px] whitespace-nowrap dir-ltr text-left rtl:text-right">
                      {row.billing_period_start} → {row.billing_period_end}
                    </td>

                    {/* Amount Paid */}
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900 text-right rtl:text-left whitespace-nowrap tabular-nums">
                      {row.amount_paid.toFixed(2)} {currencySymbol}
                    </td>

                    {/* Agent Commission (50%) */}
                    <td className="px-4 py-3 font-mono font-bold text-emerald-700 text-right rtl:text-left whitespace-nowrap tabular-nums">
                      +{row.agent_commission.toFixed(2)} {currencySymbol}
                    </td>

                    {/* Platform Share (50%) */}
                    <td className="px-4 py-3 font-mono text-slate-600 text-right rtl:text-left whitespace-nowrap tabular-nums">
                      {row.platform_share.toFixed(2)} {currencySymbol}
                    </td>

                    {/* Collection Method */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${methodBadge.color}`}>
                        <span>{methodBadge.icon}</span>
                        <span>{methodBadge.label}</span>
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {t('statusCleared')}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredLedger.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <DollarSign className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-sm text-slate-700">
                        {t('noPaymentRecords')}
                      </p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        {selectedMonth !== 'all'
                          ? (isRTL
                              ? `لم يتم تسجيل أي دفعات اشتراك لشهر ${formatMonthName(selectedMonth, language)}. انقر على الزر أدناه لإضافة دفعة قمت بتحصيلها.`
                              : `No subscription payments recorded for ${formatMonthName(selectedMonth, language)}. Click below to log collections for this month.`)
                          : t('noPaymentRecordsDesc')}
                      </p>
                      <button
                        type="button"
                        onClick={() => onOpenRecordPayment(undefined, selectedMonth !== 'all' ? selectedMonth : currentMonthYM)}
                        className="mt-2 min-h-[44px] px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>
                          {selectedMonth !== 'all'
                            ? `${t('recordPaymentForMonth')} ${formatMonthName(selectedMonth, language)}`
                            : t('recordFee')}
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
