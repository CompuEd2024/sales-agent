import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  MessageCircle,
  Sparkles,
  Clock,
  AlertTriangle,
  Receipt,
  Copy,
  Check,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import {
  ShopWithConfig,
  ShopSubscriptionLedger,
  Agent,
  SUBSCRIPTION_TIERS,
  getAgentCurrency,
  getShopMonthlyAmount,
  formatPhoneForWhatsApp,
} from '../types/database';
import { useLanguage, formatMonthName } from '../lib/i18n';
import { resolveAgentCountryDialCode } from './OnboardShopForm';

export type WhatsAppTemplateId =
  | 'welcome'
  | 'payment_reminder'
  | 'overdue_warning'
  | 'thank_you_receipt';

interface WhatsAppTemplatesModalProps {
  shop: ShopWithConfig | null;
  ledger?: ShopSubscriptionLedger[];
  currentAgent?: Agent | null;
  isOpen: boolean;
  onClose: () => void;
}

export function buildShopTemplateMessage(params: {
  templateId: WhatsAppTemplateId;
  templateLang: 'en' | 'ar';
  shop: ShopWithConfig;
  monthYM: string;
  amount: string;
  currencySymbol: string;
  agent?: Agent | null;
  latestReceipt?: ShopSubscriptionLedger | null;
}): string {
  const {
    templateId,
    templateLang,
    shop,
    monthYM,
    amount,
    currencySymbol,
    agent,
    latestReceipt,
  } = params;

  const shopName = shop.shop_name;
  const slug = shop.config?.subdomain_slug || 'shop';
  const storefrontUrl = `https://${slug}.envisioneyewear.store`;
  const tierName = SUBSCRIPTION_TIERS[shop.tier]?.name || shop.tier;
  const monthLabel = formatMonthName(monthYM, templateLang);
  const numericAmount = parseFloat(amount);
  const formattedAmt = !isNaN(numericAmount)
    ? Number.isInteger(numericAmount)
      ? String(numericAmount)
      : numericAmount.toFixed(2)
    : amount || '0';
  const amountText = `${formattedAmt} ${currencySymbol}`;
  const agentName = agent?.full_name || 'OpticPortal Agent';

  if (templateLang === 'ar') {
    switch (templateId) {
      case 'welcome':
        return `مرحباً فريق ${shopName}،\n\nأهلاً بكم في منصة OpticPortal! واجهة متجركم الرقمية للنظارات جاهزة ومباشرة على الرابط:\n${storefrontUrl}\n\nاشتراككم في باقة ${tierName} لشهر ${monthLabel} مفعّل بقيمة ${amountText}. يمكن لعملائكم الآن تصفح الإطارات وتجربتها افتراضياً في أي وقت.\n\nيسعدني مساعدتكم دائماً!\n— ${agentName}`;

      case 'payment_reminder':
        return `مرحباً فريق ${shopName}،\n\nتذكير ودي بخصوص اشتراككم الشهري في منصة OpticPortal عن شهر ${monthLabel} بمبلغ ${amountText}.\n\nيرجى إعلامي بطريقة السداد المناسبة لكم (نقداً أو تحويل بنكي / كليك) لضمان استمرار عمل واجهة متجركم بكل سلاسة.\n\nشكراً لتعاونكم!\n— ${agentName}`;

      case 'overdue_warning':
        return `مرحباً فريق ${shopName}،\n\nتنبيه هام: دفعة اشتراككم في منصة OpticPortal لشهر ${monthLabel} بمبلغ ${amountText} متأخرة عن موعد الاستحقاق.\n\nلتجنب الإيقاف التلقائي لواجهة المتجر الرقمية ونظام حجوزات العملاء، يرجى تسوية مبلغ ${amountText} في أقرب وقت ممكن.\n\nيمكنكم الرد هنا فور التحويل أو لتنسيق التحصيل اليوم.\n— ${agentName}`;

      case 'thank_you_receipt': {
        const receiptLine = latestReceipt?.id
          ? `\n• مرجع الإيصال: ${latestReceipt.id.slice(0, 12)}`
          : '';
        const dateLine = latestReceipt?.created_at
          ? `\n• تاريخ الدفع: ${latestReceipt.created_at.slice(0, 10)}`
          : '';
        return `مرحباً فريق ${shopName}،\n\nشكراً لسدادكم! إليكم تفاصيل إيصال الاشتراك الرسمي:\n• المتجر: ${shopName}\n• شهر الفوترة: ${monthLabel}\n• المبلغ المدفوع: ${amountText}\n• الحالة: مدفوع ونشط${receiptLine}${dateLine}\n\nنقدر شراكتكم المستمرة مع منصة OpticPortal!\n— ${agentName}`;
      }
    }
  }

  switch (templateId) {
    case 'welcome':
      return `Hello ${shopName} team,\n\nWelcome to OpticPortal! Your digital eyewear storefront is now live at:\n${storefrontUrl}\n\nYour ${tierName} subscription for ${monthLabel} is active at ${amountText}. Customers can browse your frames and use virtual try-on anytime.\n\nReach out anytime if you need anything!\n— ${agentName}`;

    case 'payment_reminder':
      return `Hello ${shopName} team,\n\nThis is a friendly reminder regarding your monthly OpticPortal subscription for ${monthLabel} in the amount of ${amountText}.\n\nPlease let me know your preferred payment method (cash or transfer) so we can keep your boutique running smoothly without interruption.\n\nThank you!\n— ${agentName}`;

    case 'overdue_warning':
      return `Hello ${shopName} team,\n\nImportant Notice: Your OpticPortal subscription payment for ${monthLabel} (${amountText}) is currently overdue.\n\nTo avoid service suspension of your digital storefront and customer booking portal, please settle ${amountText} at your earliest convenience.\n\nReply here once transferred or to schedule collection today.\n— ${agentName}`;

    case 'thank_you_receipt': {
      const receiptLine = latestReceipt?.id
        ? `\n• Receipt Ref: ${latestReceipt.id.slice(0, 12)}`
        : '';
      const dateLine = latestReceipt?.created_at
        ? `\n• Payment Date: ${latestReceipt.created_at.slice(0, 10)}`
        : '';
      return `Hello ${shopName} team,\n\nThank you for your payment! Here is your official subscription receipt:\n• Boutique: ${shopName}\n• Billing Month: ${monthLabel}\n• Amount Paid: ${amountText}\n• Status: Paid & Active${receiptLine}${dateLine}\n\nWe appreciate your partnership with OpticPortal!\n— ${agentName}`;
    }
  }
}

export function WhatsAppTemplatesModal({
  shop,
  ledger = [],
  currentAgent,
  isOpen,
  onClose,
}: WhatsAppTemplatesModalProps) {
  const { t, isRTL, language } = useLanguage();

  const now = useMemo(() => new Date(), []);
  const currentMonthYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const selectableMonths = useMemo(() => {
    const list: string[] = [];
    for (let offset = -12; offset <= 3; offset++) {
      const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      list.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return list;
  }, [now]);

  const latestShopReceipt = useMemo(() => {
    if (!shop) return null;
    return (
      ledger
        .filter((e) => e.shop_id === shop.id)
        .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))[0] || null
    );
  }, [ledger, shop]);

  const currency = useMemo(() => getAgentCurrency(currentAgent, shop), [currentAgent, shop]);

  const [templateId, setTemplateId] = useState<WhatsAppTemplateId>('payment_reminder');
  const [templateLang, setTemplateLang] = useState<'en' | 'ar'>(language);
  const [monthYM, setMonthYM] = useState<string>(currentMonthYM);
  const [amount, setAmount] = useState<string>('0');
  const [messageText, setMessageText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Pick smart default template & pre-fill fields whenever shop changes or modal opens
  useEffect(() => {
    if (!isOpen || !shop) return;

    const isPaidCurrentMonth = ledger.some((entry) => {
      if (entry.shop_id !== shop.id) return false;
      const ym = entry.payment_month || entry.billing_period_start?.slice(0, 7) || entry.created_at?.slice(0, 7);
      return ym === currentMonthYM;
    });

    const st = shop.subscription_status || (shop.status === 'on_hold' ? 'maintenance' : shop.is_active ? 'active' : 'suspended');
    if (st === 'maintenance' || st === 'suspended') {
      setTemplateId('overdue_warning');
    } else if (isPaidCurrentMonth) {
      setTemplateId('thank_you_receipt');
    } else {
      setTemplateId('payment_reminder');
    }

    setTemplateLang(language);
    setMonthYM(currentMonthYM);
    const defaultAmt = getShopMonthlyAmount(shop, currentAgent);
    setAmount(String(defaultAmt > 0 ? defaultAmt : latestShopReceipt?.amount_paid ?? 0));
  }, [isOpen, shop?.id]);

  // Auto-regenerate message when template, language, month, or amount changes
  useEffect(() => {
    if (!isOpen || !shop) return;
    const matchedReceiptForMonth =
      ledger.find((e) => {
        if (e.shop_id !== shop.id) return false;
        const ym = e.payment_month || e.billing_period_start?.slice(0, 7) || e.created_at?.slice(0, 7);
        return ym === monthYM;
      }) || latestShopReceipt;

    const generated = buildShopTemplateMessage({
      templateId,
      templateLang,
      shop,
      monthYM,
      amount,
      currencySymbol: currency.symbol,
      agent: currentAgent,
      latestReceipt: matchedReceiptForMonth,
    });
    setMessageText(generated);
  }, [isOpen, shop, templateId, templateLang, monthYM, amount, currency.symbol, currentAgent, ledger, latestShopReceipt]);

  const whatsappUrl = useMemo(() => {
    if (!shop) return '#';
    const dialInfo = resolveAgentCountryDialCode(currentAgent);
    const rawOwnerPhone =
      shop.owner_phone ||
      (shop.config as any)?.phone ||
      shop.staff?.find((s) => s.role === 'shop_owner')?.phone_number ||
      shop.staff?.find((s) => Boolean(s.phone_number))?.phone_number ||
      '';
    const waDigits = formatPhoneForWhatsApp(rawOwnerPhone, dialInfo.dialCode);
    const encoded = encodeURIComponent(messageText);
    return waDigits ? `https://wa.me/${waDigits}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
  }, [shop, currentAgent, messageText]);

  if (!isOpen || !shop) return null;

  const templateCards: {
    id: WhatsAppTemplateId;
    label: string;
    icon: React.ReactNode;
    activeClass: string;
  }[] = [
    {
      id: 'welcome',
      label: t('tplWelcome'),
      icon: <Sparkles className="w-4 h-4 shrink-0" />,
      activeClass: 'bg-sky-50 border-sky-400 text-sky-900',
    },
    {
      id: 'payment_reminder',
      label: t('tplPaymentReminder'),
      icon: <Clock className="w-4 h-4 shrink-0" />,
      activeClass: 'bg-amber-50 border-amber-400 text-amber-900',
    },
    {
      id: 'overdue_warning',
      label: t('tplOverdueWarning'),
      icon: <AlertTriangle className="w-4 h-4 shrink-0" />,
      activeClass: 'bg-rose-50 border-rose-400 text-rose-900',
    },
    {
      id: 'thank_you_receipt',
      label: t('tplThankYouReceipt'),
      icon: <Receipt className="w-4 h-4 shrink-0" />,
      activeClass: 'bg-emerald-50 border-emerald-400 text-emerald-900',
    },
  ];

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetTemplate = () => {
    const generated = buildShopTemplateMessage({
      templateId,
      templateLang,
      shop,
      monthYM,
      amount,
      currencySymbol: currency.symbol,
      agent: currentAgent,
      latestReceipt: latestShopReceipt,
    });
    setMessageText(generated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full sm:my-8 overflow-hidden max-h-[92vh] flex flex-col pb-safe">
        {/* Header */}
        <div className="px-4 py-3.5 sm:p-5 bg-emerald-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold truncate">{t('messageTemplatesTitle')}</h3>
              <p className="text-xs text-emerald-100 mt-0.5 truncate">
                {shop.shop_name} • {t('messageTemplatesSubtitle')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-emerald-100 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            aria-label={isRTL ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* 1. Template Picker (4 templates) */}
          <div className="grid grid-cols-2 gap-2">
            {templateCards.map((tpl) => {
              const active = templateId === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setTemplateId(tpl.id)}
                  className={`min-h-[48px] px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all text-start ${
                    active
                      ? `${tpl.activeClass} ring-1 ring-black/5 shadow-2xs`
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {tpl.icon}
                  <span className="truncate">{tpl.label}</span>
                </button>
              );
            })}
          </div>

          {/* 2. Language Toggle + Month + Amount Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            {/* Template Language */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                {t('templateLanguageLabel')}
              </label>
              <div className="grid grid-cols-2 bg-white p-0.5 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setTemplateLang('en')}
                  className={`min-h-[44px] text-xs font-semibold rounded-lg transition-colors ${
                    templateLang === 'en'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateLang('ar')}
                  className={`min-h-[44px] text-xs font-semibold rounded-lg transition-colors ${
                    templateLang === 'ar'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  العربية
                </button>
              </div>
            </div>

            {/* Month */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                {t('billingMonthShort')}
              </label>
              <select
                value={monthYM}
                onChange={(e) => setMonthYM(e.target.value)}
                className="w-full min-h-[40px] px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 text-slate-800"
              >
                {selectableMonths.map((ym) => (
                  <option key={ym} value={ym}>
                    {formatMonthName(ym, templateLang)}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                {t('amountShortLabel')} ({currency.symbol})
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full min-h-[40px] px-2.5 py-1.5 text-xs font-mono font-bold bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 text-slate-900 dir-ltr tabular-nums"
              />
            </div>
          </div>

          {/* 3. Message Preview & Inline Customization */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                {t('messagePreviewLabel')}
              </label>
              <button
                type="button"
                onClick={handleResetTemplate}
                className="min-h-[40px] px-2.5 rounded-lg hover:bg-slate-100 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('resetTemplateBtn')}</span>
              </button>
            </div>

            <textarea
              rows={7}
              dir={templateLang === 'ar' ? 'rtl' : 'ltr'}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 leading-relaxed focus:outline-none focus:border-emerald-600 resize-y"
            />
          </div>

          {/* 4. Actions: Copy + Open WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopyMessage}
              className="sm:col-span-1 min-h-[52px] sm:min-h-[48px] px-4 py-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-sm sm:text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">{t('copiedBtn')}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>{t('copyMessageBtn')}</span>
                </>
              )}
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="sm:col-span-2 min-h-[52px] sm:min-h-[48px] px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm sm:text-xs font-bold inline-flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>{t('openWhatsAppWithTextBtn')}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80 shrink-0" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
