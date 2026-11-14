import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, Percent, ShieldCheck, Wallet, Receipt, CheckCircle2, User, History } from 'lucide-react';
import { ShopWithConfig, ShopSubscriptionLedger, SUBSCRIPTION_TIERS, getShopMonthlyAmount, getAgentCurrency, Agent } from '../types/database';
import { useLanguage, formatMonthName } from '../lib/i18n';
import { useAgent } from '../context/AgentContext';
import { resolveAgentCountryDialCode } from './OnboardShopForm';
import { PreviousPaymentsModal } from './PreviousPaymentsModal';

export interface CountryPaymentOption {
  id: string;
  labelEn: string;
  labelAr: string;
  icon: string;
  descriptionEn?: string;
  descriptionAr?: string;
}

export function getCountryPaymentOptions(countryCode: string = 'JO'): CountryPaymentOption[] {
  const code = (countryCode || '').toUpperCase().trim();
  switch (code) {
    case 'AE':
      return [
        { id: 'cash', labelEn: 'Cash', labelAr: 'نقداً', icon: '💵', descriptionEn: 'Physical AED cash collection', descriptionAr: 'تحصيل نقدي بالدرهم الإماراتي' },
        { id: 'aani', labelEn: 'Aani / Instant', labelAr: 'آني / دفع فوري', icon: '⚡', descriptionEn: 'UAE Aani / Jaywan instant transfer', descriptionAr: 'دفع فوري عبر شبكة آني / جيوان' },
        { id: 'bank_transfer', labelEn: 'Bank Transfer', labelAr: 'تحويل مصرفي', icon: '🏦', descriptionEn: 'Direct UAE bank transfer', descriptionAr: 'تحويل مصرفي إماراتي مباشر' },
        { id: 'pos', labelEn: 'Card / POS', labelAr: 'بطاقة / نقاط بيع', icon: '💳', descriptionEn: 'Visa / Mastercard / Jaywan POS', descriptionAr: 'أجهزة نقاط البيع بالبطاقة' },
      ];
    case 'SA':
      return [
        { id: 'cash', labelEn: 'Cash', labelAr: 'نقداً', icon: '💵', descriptionEn: 'Physical SAR cash collection', descriptionAr: 'تحصيل نقدي بالريال السعودي' },
        { id: 'mada', labelEn: 'Mada / STC Pay', labelAr: 'مدى / STC Pay', icon: '⚡', descriptionEn: 'Mada Pay & STC Pay mobile transfer', descriptionAr: 'دفع فوري عبر مدى ومحافظ إلكترونية' },
        { id: 'bank_transfer', labelEn: 'SARIE Bank', labelAr: 'تحويل سريع', icon: '🏦', descriptionEn: 'SARIE instant interbank transfer', descriptionAr: 'تحويل بنكي فوري عبر نظام سريع' },
        { id: 'pos', labelEn: 'Mada POS', labelAr: 'نقاط بيع مدى', icon: '💳', descriptionEn: 'Mada debit / credit POS terminal', descriptionAr: 'أجهزة نقاط البيع المعتمدة' },
      ];
    case 'KW':
      return [
        { id: 'cash', labelEn: 'Cash', labelAr: 'نقداً', icon: '💵', descriptionEn: 'Physical KWD cash collection', descriptionAr: 'تحصيل نقدي بالدينار الكويتي' },
        { id: 'knet', labelEn: 'KNET', labelAr: 'كي نت (KNET)', icon: '⚡', descriptionEn: 'Kuwait KNET instant payment', descriptionAr: 'دفع عبر بوابة كي نت الكويتية' },
        { id: 'bank_transfer', labelEn: 'Bank Transfer', labelAr: 'تحويل بنكي', icon: '🏦', descriptionEn: 'Kuwait local bank wire', descriptionAr: 'تحويل مصرفي محلي' },
        { id: 'pos', labelEn: 'POS Card', labelAr: 'بطاقة مصرفية', icon: '💳', descriptionEn: 'POS Card Terminal', descriptionAr: 'نقاط بيع بالبطاقة' },
      ];
    case 'QA':
      return [
        { id: 'cash', labelEn: 'Cash', labelAr: 'نقداً', icon: '💵', descriptionEn: 'Physical QAR cash collection', descriptionAr: 'تحصيل نقدي بالريال القطري' },
        { id: 'qpay', labelEn: 'QIB / QPay', labelAr: 'كيو باي / دفع محلي', icon: '⚡', descriptionEn: 'Qatar electronic direct pay', descriptionAr: 'دفع إلكتروني محلي' },
        { id: 'bank_transfer', labelEn: 'Bank Transfer', labelAr: 'تحويل مصرفي', icon: '🏦', descriptionEn: 'Qatar bank wire', descriptionAr: 'تحويل بنكي' },
        { id: 'pos', labelEn: 'POS Card', labelAr: 'نقاط بيع', icon: '💳', descriptionEn: 'POS Terminal', descriptionAr: 'نقاط بيع' },
      ];
    case 'BH':
      return [
        { id: 'cash', labelEn: 'Cash', labelAr: 'نقداً', icon: '💵', descriptionEn: 'Physical BHD cash collection', descriptionAr: 'تحصيل نقدي بالدينار البحريني' },
        { id: 'benefit', labelEn: 'BenefitPay', labelAr: 'بنفت بي', icon: '⚡', descriptionEn: 'Bahrain BenefitPay instant', descriptionAr: 'دفع فوري عبر بنفت بي' },
        { id: 'bank_transfer', labelEn: 'Fawri+ Bank', labelAr: 'تحويل فوري+', icon: '🏦', descriptionEn: 'Fawri / Fawri+ bank transfer', descriptionAr: 'تحويل بنكي عبر فوري' },
        { id: 'pos', labelEn: 'POS Card', labelAr: 'نقاط بيع', icon: '💳', descriptionEn: 'POS Terminal', descriptionAr: 'نقاط بيع' },
      ];
    case 'OM':
      return [
        { id: 'cash', labelEn: 'Cash', labelAr: 'نقداً', icon: '💵', descriptionEn: 'Physical OMR cash collection', descriptionAr: 'تحصيل نقدي بالريال العماني' },
        { id: 'mpay', labelEn: 'MPclear / Wallet', labelAr: 'محفظة هاتفية', icon: '⚡', descriptionEn: 'Oman mobile wallet instant', descriptionAr: 'دفع فوري عبر المحفظة الهاتفية' },
        { id: 'bank_transfer', labelEn: 'Bank Transfer', labelAr: 'تحويل مصرفي', icon: '🏦', descriptionEn: 'Oman bank transfer', descriptionAr: 'تحويل بنكي' },
        { id: 'pos', labelEn: 'POS Card', labelAr: 'نقاط بيع', icon: '💳', descriptionEn: 'POS Terminal', descriptionAr: 'نقاط بيع' },
      ];
    case 'EG':
      return [
        { id: 'cash', labelEn: 'Cash', labelAr: 'نقداً', icon: '💵', descriptionEn: 'Physical EGP cash collection', descriptionAr: 'تحصيل نقدي بالجنيه' },
        { id: 'instapay', labelEn: 'InstaPay / Wallet', labelAr: 'إنستاباي / محفظة', icon: '⚡', descriptionEn: 'Egypt InstaPay & mobile wallets', descriptionAr: 'إنستاباي وفودافون كاش ومحافظ المحمول' },
        { id: 'bank_transfer', labelEn: 'Bank Transfer', labelAr: 'تحويل بنكي', icon: '🏦', descriptionEn: 'Egyptian bank wire', descriptionAr: 'تحويل بنكي مصري' },
        { id: 'pos', labelEn: 'Fawry / POS', labelAr: 'فوري / نقاط بيع', icon: '💳', descriptionEn: 'Fawry & card terminal', descriptionAr: 'فوري وماكينات نقاط البيع' },
      ];
    case 'US':
    case 'CA':
      return [
        { id: 'cash', labelEn: 'Cash', labelAr: 'نقداً', icon: '💵', descriptionEn: 'Physical USD / CAD cash', descriptionAr: 'تحصيل نقدي' },
        { id: 'zelle', labelEn: 'Zelle / Venmo', labelAr: 'Zelle / Venmo', icon: '⚡', descriptionEn: 'Direct instant mobile transfer', descriptionAr: 'تحويل فوري مباشر عبر الهاتف' },
        { id: 'ach', labelEn: 'ACH / Wire', labelAr: 'تحويل بنكي ACH', icon: '🏦', descriptionEn: 'Direct bank deposit / ACH', descriptionAr: 'إيداع بنكي مباشر' },
        { id: 'card', labelEn: 'Credit / Debit Card', labelAr: 'بطاقة ائتمانية', icon: '💳', descriptionEn: 'Stripe / Square POS terminal', descriptionAr: 'دفع بالبطاقة عبر نقاط البيع' },
      ];
    case 'GB':
    case 'UK':
      return [
        { id: 'cash', labelEn: 'Cash', labelAr: 'نقداً', icon: '💵', descriptionEn: 'Physical GBP cash', descriptionAr: 'تحصيل نقدي بالجنيه الإسترليني' },
        { id: 'faster_payments', labelEn: 'Faster Payments', labelAr: 'دفع فوري بريطاني', icon: '⚡', descriptionEn: 'UK Faster Payments instant', descriptionAr: 'نظام المدفوعات الفورية البريطاني' },
        { id: 'bank_transfer', labelEn: 'BACS / Wire', labelAr: 'تحويل مصرفي', icon: '🏦', descriptionEn: 'Direct UK bank transfer', descriptionAr: 'تحويل بنكي بريطاني' },
        { id: 'pos', labelEn: 'Contactless / POS', labelAr: 'نقاط بيع / لاتلامسي', icon: '💳', descriptionEn: 'Card payment machine', descriptionAr: 'أجهزة نقاط البيع' },
      ];
    case 'JO':
    default:
      return [
        { id: 'cash', labelEn: 'Cash', labelAr: 'نقداً', icon: '💵', descriptionEn: 'Physical JOD cash collection', descriptionAr: 'تحصيل نقدي بالدينار الأردني' },
        { id: 'cliq', labelEn: 'CliQ', labelAr: 'كليك (CliQ)', icon: '⚡', descriptionEn: 'Jordan CliQ instant transfer', descriptionAr: 'تحويل كليك الفوري في الأردن' },
        { id: 'bank_transfer', labelEn: 'Bank Transfer', labelAr: 'تحويل بنكي', icon: '🏦', descriptionEn: 'Local Jordanian bank wire', descriptionAr: 'إيداع أو تحويل بنكي محلي' },
        { id: 'pos', labelEn: 'Card / POS', labelAr: 'بطاقة / نقاط بيع', icon: '💳', descriptionEn: 'POS Card Terminal', descriptionAr: 'بطاقة فيزا / ماستركارد عبر نقاط البيع' },
      ];
  }
}

interface RecordPaymentModalProps {
  shop: ShopWithConfig | null;
  availableShops?: ShopWithConfig[];
  ledger?: ShopSubscriptionLedger[];
  agentId: string;
  currentAgent?: Agent | null;
  isOpen: boolean;
  initialMonth?: string;
  onClose: () => void;
  onSuccess: (amount: number, agentCommission: number) => void;
  onRecordPayment: (payment: {
    shop_id: string;
    agent_id: string;
    amount_paid: number;
    billing_period_start: string;
    billing_period_end: string;
    payment_month?: string;
    collection_method?: string;
    notes?: string;
  }) => Promise<boolean>;
}

export function RecordPaymentModal({
  shop: initialShop,
  availableShops = [],
  ledger = [],
  agentId,
  currentAgent,
  isOpen,
  initialMonth,
  onClose,
  onSuccess,
  onRecordPayment,
}: RecordPaymentModalProps) {
  const { t, isRTL, language } = useLanguage();
  const { currentAgent: contextAgent } = useAgent();
  const effectiveAgent = currentAgent || contextAgent;
  const [selectedShopId, setSelectedShopId] = useState<string>(initialShop?.id || availableShops[0]?.id || '');
  
  const currentShop = initialShop || availableShops.find((s) => s.id === selectedShopId) || availableShops[0] || null;

  const agentCurrency = getAgentCurrency(effectiveAgent, currentShop);
  const countryInfo = resolveAgentCountryDialCode(effectiveAgent);
  const paymentOptions = getCountryPaymentOptions(countryInfo.countryCode);

  const tablePrice = currentShop ? getShopMonthlyAmount(currentShop, effectiveAgent) : 0;
  const [amountPaid, setAmountPaid] = useState<string>(tablePrice > 0 ? tablePrice.toString() : '');
  
  // Current month default or initialMonth
  const now = new Date();
  const defaultYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [paymentMonth, setPaymentMonth] = useState<string>(initialMonth || defaultYearMonth);
  const [collectionMethod, setCollectionMethod] = useState<string>(paymentOptions[0]?.id || 'cash');
  const [collectionNotes, setCollectionNotes] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviousPaymentsOpen, setIsPreviousPaymentsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsPreviousPaymentsOpen(false);
    }
  }, [isOpen]);

  // Check if shop was stopped due to non-payment (3 months unpaid or suspended)
  const isStoppedShop = Boolean(
    currentShop &&
      (!currentShop.is_active ||
        currentShop.subscription_status === 'suspended' ||
        currentShop.subscription_status === 'maintenance' ||
        currentShop.status === 'on_hold' ||
        (currentShop as any).is_stopped_for_non_payment ||
        ((currentShop as any).unpaid_months && (currentShop as any).unpaid_months >= 3))
  );

  useEffect(() => {
    if (paymentOptions.length > 0 && !paymentOptions.some((o) => o.id === collectionMethod)) {
      setCollectionMethod(paymentOptions[0].id);
    }
  }, [countryInfo.countryCode]);

  useEffect(() => {
    if (initialMonth) {
      setPaymentMonth(initialMonth);
    }
  }, [initialMonth]);

  // Generate selectable months (previous 12 months, current, next 3 months)
  const selectableMonths: string[] = [];
  for (let offset = -12; offset <= 3; offset++) {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    selectableMonths.push(ym);
  }

  useEffect(() => {
    if (initialShop) {
      setSelectedShopId(initialShop.id);
    } else if (availableShops.length > 0 && !selectedShopId) {
      setSelectedShopId(availableShops[0].id);
    }
  }, [initialShop, availableShops]);

  // Sync dates when paymentMonth changes
  useEffect(() => {
    if (paymentMonth) {
      const [yearStr, monthStr] = paymentMonth.split('-');
      const y = parseInt(yearStr, 10);
      const m = parseInt(monthStr, 10);
      const lastDay = new Date(y, m, 0).getDate();
      setStartDate(`${yearStr}-${monthStr}-01`);
      setEndDate(`${yearStr}-${monthStr}-${String(lastDay).padStart(2, '0')}`);
    }
  }, [paymentMonth]);

  useEffect(() => {
    if (currentShop) {
      setAmountPaid(String(getShopMonthlyAmount(currentShop, effectiveAgent)));
    }
  }, [currentShop?.id, effectiveAgent]);

  if (!isOpen || !currentShop) return null;

  const numAmount = parseFloat(amountPaid) || 0;
  // Strictly compute 50/50 splits
  const agentCommission = Number((numAmount * 0.5).toFixed(2));
  const platformShare = Number((numAmount * 0.5).toFixed(2));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) return;

    setIsSubmitting(true);
    const ok = await onRecordPayment({
      shop_id: currentShop.id,
      agent_id: agentId,
      amount_paid: numAmount,
      billing_period_start: startDate,
      billing_period_end: endDate,
      payment_month: paymentMonth,
      collection_method: collectionMethod,
      notes: collectionNotes,
    });
    setIsSubmitting(false);

    if (ok) {
      onSuccess(numAmount, agentCommission);
      onClose();
    }
  };

  const shopPaymentsCount = ledger.filter((entry) => entry.shop_id === currentShop.id).length;

  return (
    <>
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/55 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[98dvh] overflow-y-auto pb-safe animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-150">
        {/* Compact Header */}
        <div className="px-4 py-2.5 sm:px-5 sm:py-3.5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {t('recordPaymentTitle')}
              </h3>
              <span className="text-[11px] font-medium text-emerald-700 inline-flex items-center gap-1 shrink-0">
                <User className="w-3 h-3 text-emerald-600 shrink-0" />
                <span className="truncate max-w-[90px]">
                  {effectiveAgent?.full_name || (isRTL ? 'الوكيل' : 'Agent')}
                </span>
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('cancelBtn')}
              className="text-slate-400 hover:text-slate-700 min-h-[44px] min-w-[44px] -me-2 -my-1.5 flex items-center justify-center rounded-xl transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center justify-between gap-2 mt-1">
            <p className="text-[11px] text-slate-500 truncate min-w-0">
              {currentShop.shop_name} · <span className="capitalize font-medium text-slate-700">{currentShop.tier}</span>
              {isStoppedShop && (
                <span className="text-emerald-700 font-semibold">
                  {' '}· {isRTL ? 'يعيد التفعيل فوراً' : 'Resumes shop'}
                </span>
              )}
            </p>
            <button
              type="button"
              onClick={() => setIsPreviousPaymentsOpen(true)}
              className="inline-flex items-center gap-1.5 min-h-[44px] -my-2 px-2.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900 underline underline-offset-2 rounded-xl hover:bg-indigo-50/80 transition-colors shrink-0 whitespace-nowrap"
            >
              <History className="w-4 h-4 shrink-0" />
              <span>{t('viewPreviousPayments')} ({shopPaymentsCount})</span>
            </button>
          </div>
        </div>

        {/* Single-Screen Compact Body */}
        <form onSubmit={handleSubmit} className="px-4 py-3 sm:px-5 sm:py-4 space-y-2.5 sm:space-y-3">
          {/* Shop Selector (when accessed from ledger without preselected shop) */}
          {!initialShop && availableShops.length > 0 && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                {t('selectBoutique')}
              </label>
              <select
                value={selectedShopId}
                onChange={(e) => setSelectedShopId(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 text-xs font-medium border border-slate-300 rounded-xl focus:outline-none focus:border-slate-900 bg-white"
              >
                {availableShops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.shop_name} ({s.location}) — {s.tier.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Row 1: Payment Month + Amount Collected */}
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-7">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-indigo-600 shrink-0" />
                <span className="truncate">{t('selectPaymentMonth')}</span>
              </label>
              <select
                value={paymentMonth}
                onChange={(e) => setPaymentMonth(e.target.value)}
                className="w-full min-h-[44px] px-2.5 py-2 text-xs font-semibold border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 bg-slate-50 text-slate-800"
              >
                {selectableMonths.map((ym) => (
                  <option key={ym} value={ym}>
                    {formatMonthName(ym, language)}{ym === defaultYearMonth ? ` (${isRTL ? 'الحالي' : 'Now'})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-5">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center justify-between gap-1">
                <span className="truncate">{isRTL ? 'المبلغ' : 'Amount'}</span>
                <span className="font-mono text-[10px] text-slate-500 shrink-0">{agentCurrency.code}</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="1"
                  required
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="block w-full min-h-[44px] ps-3 pe-11 py-2 text-sm font-mono font-bold text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:border-slate-900 dir-ltr text-start"
                />
                <div className="absolute inset-y-0 end-0 pe-2.5 flex items-center pointer-events-none text-[11px] font-bold text-slate-500">
                  {agentCurrency.symbol}
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Collection Method (Single 4-Column Row, >= 44px tap targets) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Wallet className="w-3 h-3 text-slate-500" />
                <span>{t('collectionMethod')}</span>
              </span>
              <span className="text-[10px] font-normal text-slate-400">
                {isRTL ? countryInfo.countryNameAr : countryInfo.countryNameEn}
              </span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {paymentOptions.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setCollectionMethod(m.id)}
                  title={isRTL ? m.descriptionAr : m.descriptionEn}
                  className={`min-h-[48px] px-1.5 py-1.5 text-[11px] rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 leading-tight ${
                    collectionMethod === m.id
                      ? 'bg-slate-900 text-white border-slate-900 font-semibold shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-sm leading-none shrink-0">{m.icon}</span>
                  <span className="truncate w-full text-[10px] sm:text-[11px]">
                    {isRTL ? m.labelAr : m.labelEn}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Row 3: Billing Period Dates */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1 truncate">
                {t('billingStartDate')}
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full min-h-[44px] px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-slate-900 font-mono text-slate-800 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1 truncate">
                {t('billingEndDate')}
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full min-h-[44px] px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-slate-900 font-mono text-slate-800 bg-white"
              />
            </div>
          </div>

          {/* Row 4: Notes / Receipt Reference */}
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none text-slate-400">
                <Receipt className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={collectionNotes}
                onChange={(e) => setCollectionNotes(e.target.value)}
                placeholder={
                  isRTL
                    ? 'ملاحظة أو رقم إيصال (اختياري)...'
                    : 'Receipt ref or collection note (optional)...'
                }
                className="w-full min-h-[44px] ps-8 pe-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-slate-900 text-slate-800"
              />
            </div>
          </div>

          {/* Row 5: Compact 50/50 Revenue Split Strip */}
          <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="px-2.5 py-1.5 bg-white rounded-lg border border-emerald-200 flex flex-col justify-center">
              <span className="text-[10px] font-semibold text-emerald-800 truncate">
                {t('yourCommissionSplit')}
              </span>
              <span className="text-sm sm:text-base font-mono font-bold text-emerald-700 tabular-nums leading-tight mt-0.5">
                +{agentCommission.toFixed(2)} {agentCurrency.symbol}
              </span>
            </div>

            <div className="px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 flex flex-col justify-center">
              <span className="text-[10px] font-semibold text-slate-600 truncate">
                {t('platformSplit')}
              </span>
              <span className="text-sm sm:text-base font-mono font-bold text-slate-800 tabular-nums leading-tight mt-0.5">
                {platformShare.toFixed(2)} {agentCurrency.symbol}
              </span>
            </div>
          </div>

          {/* Row 6: Side-by-Side Large Tap Actions */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="col-span-1 min-h-[52px] sm:min-h-[48px] px-3 py-2.5 text-sm sm:text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center"
            >
              {t('cancelBtn')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || numAmount <= 0}
              className="col-span-2 min-h-[52px] sm:min-h-[48px] px-4 py-2.5 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">
                {isSubmitting ? t('recordingPaymentBtn') : t('recordPaymentSubmitBtn')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <PreviousPaymentsModal
      isOpen={isPreviousPaymentsOpen}
      onClose={() => setIsPreviousPaymentsOpen(false)}
      shop={currentShop}
      allShops={availableShops}
      ledger={ledger}
      currentAgent={effectiveAgent}
    />
    </>
  );
}

