import React, { useState, useEffect } from 'react';
import {
  X,
  Glasses,
  ShieldCheck,
  MapPin,
  Mail,
  Sparkles,
  AlertTriangle,
  PauseCircle,
  Eye,
  ShieldAlert,
  Wrench,
  CheckCircle2,
  DollarSign,
  ArrowLeft,
} from 'lucide-react';
import { ShopWithConfig, SUBSCRIPTION_TIERS, SubscriptionStatus, getShopMonthlyAmount, getAgentCurrency } from '../types/database';
import { useLanguage } from '../lib/i18n';

interface ShopLivePreviewModalProps {
  shop: ShopWithConfig | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenRecordPayment?: (shop: ShopWithConfig) => void;
}

export function ShopLivePreviewModal({
  shop,
  isOpen,
  onClose,
  onOpenRecordPayment,
}: ShopLivePreviewModalProps) {
  const { t, isRTL } = useLanguage();
  const [overrideShowDesign, setOverrideShowDesign] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !shop) return null;

  const subStatus: SubscriptionStatus =
    shop.subscription_status ||
    (shop.status === 'on_hold' ? 'maintenance' : !shop.is_active ? 'suspended' : 'active');

  const isInactive = subStatus !== 'active';

  const cfg = shop.config || {
    shop_id: shop.id,
    subdomain_slug: shop.shop_name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    logo_url: '',
    primary_color: '#0f766e',
    secondary_color: '#134e4a',
    background_image_url: '/src/assets/images/optical_storefront_showcase_1790185462812.jpg',
  };

  const tierInfo = SUBSCRIPTION_TIERS[shop.tier] || SUBSCRIPTION_TIERS.bronze;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs"
    >
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh] pb-safe">
        {/* Browser Mockup Top Bar */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-slate-100 border-b border-slate-200 shrink-0 gap-2">
          <div className="flex items-center gap-2 shrink-0">
            {/* Dedicated Top Cancel / Go Back Button */}
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-200/80 border border-slate-300 rounded-xl transition-colors shadow-2xs min-h-[44px]"
              title={t('cancelAndGoBack')}
            >
              <ArrowLeft className={`w-4 h-4 shrink-0 ${isRTL ? 'rotate-180' : ''}`} />
              <span className="hidden sm:inline">{t('cancelAndGoBack')}</span>
              <span className="sm:hidden">{t('cancelBtn')}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0 max-w-sm mx-1 sm:mx-2">
            <div className="flex items-center gap-1 px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 text-[11px] sm:text-xs font-mono text-slate-700 w-full truncate dir-ltr">
              <span className="text-slate-400 hidden sm:inline">https://</span>
              <span className="font-semibold text-slate-900 truncate">{cfg.subdomain_slug || 'shop'}</span>
              <span className="text-slate-500 hidden sm:inline">.envisioneyewear.store</span>
            </div>

            {subStatus === 'maintenance' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 whitespace-nowrap shrink-0">
                <Wrench className="w-3 h-3 text-amber-700" />
                <span className="hidden sm:inline">{t('statusMaintenance')}</span>
              </span>
            )}

            {subStatus === 'suspended' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 whitespace-nowrap shrink-0">
                <ShieldAlert className="w-3 h-3 text-rose-600" />
                <span className="hidden sm:inline">{t('statusSuspended')}</span>
              </span>
            )}

            {subStatus === 'active' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 whitespace-nowrap shrink-0">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span className="hidden sm:inline">{t('statusActive')}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isInactive && (
              <button
                type="button"
                onClick={() => setOverrideShowDesign(!overrideShowDesign)}
                className="text-[11px] font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 min-h-[40px] flex items-center"
              >
                {overrideShowDesign ? t('viewSuspendedPortal') : t('viewOriginalStorefront')}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label={t('closePreview')}
              className="text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Storefront Content */}
        <div className="flex-1 overflow-y-auto">
          {/* CASE 1: Diplomatic Maintenance Mode Screen */}
          {subStatus === 'maintenance' && !overrideShowDesign ? (
            <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center bg-gradient-to-b from-amber-50/40 via-white to-slate-50 min-h-[440px]">
              {/* Diplomatic Agent Shield Notice */}
              <div className="max-w-md w-full mb-6 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-left rtl:text-right flex items-start gap-2.5 shadow-2xs">
                <Wrench className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[11px] text-amber-900 leading-relaxed">
                  <span className="font-bold block mb-0.5">{t('statusMaintenance')} (Diplomatic Mode)</span>
                  <span className="text-amber-800">{t('maintenanceAgentNotice')}</span>
                </div>
              </div>

              <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4 shadow-xs border border-amber-200">
                <Wrench className="w-8 h-8" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('stationMaintenanceTitle')}</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 max-w-lg mb-2">
                {t('stationMaintenanceTitle')}
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 max-w-lg leading-relaxed mb-6">
                {t('stationMaintenanceDesc')}
              </p>

              {/* Boutique summary card */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs max-w-md w-full text-left rtl:text-right space-y-2.5 mb-6">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{t('colOpticalShop')}:</span>
                  <span className="font-bold text-slate-900">{shop.shop_name}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{t('colLocation')}:</span>
                  <span className="text-slate-700">{shop.location}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{t('owner')}:</span>
                  <span className="font-mono text-slate-700">{shop.owner_email}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                  <span className="text-slate-400">{t('colCurrentTier')}:</span>
                  <span className="font-mono text-slate-700">
                    {tierInfo.name} ({getShopMonthlyAmount(shop) > 0 ? `${getShopMonthlyAmount(shop)} ${getAgentCurrency(undefined, shop).symbol}/mo` : `— ${getAgentCurrency(undefined, shop).symbol}/mo`})
                  </span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 w-full max-w-md">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors shadow-2xs flex items-center justify-center gap-1.5 min-h-[44px]"
                >
                  <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                  <span>{t('cancelAndGoBack')}</span>
                </button>
                {onOpenRecordPayment && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenRecordPayment(shop);
                    }}
                    className="px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5 min-h-[44px]"
                  >
                    <DollarSign className="w-4 h-4 text-emerald-300" />
                    <span>{t('collectAndReactivate')}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOverrideShowDesign(true)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 min-h-[44px]"
                >
                  <Eye className="w-4 h-4 text-slate-500" />
                  <span>{t('viewOriginalStorefront')}</span>
                </button>
              </div>
            </div>
          ) : subStatus === 'suspended' && !overrideShowDesign ? (
            /* CASE 2: Fully Suspended Screen */
            <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center bg-slate-50 min-h-[440px]">
              <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mb-4 shadow-xs border border-rose-200">
                <ShieldAlert className="w-8 h-8" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200 mb-3">
                <PauseCircle className="w-3.5 h-3.5" />
                <span>{t('statusSuspended')}</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 max-w-lg mb-2">
                {t('storefrontSuspendedNotice')}
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 max-w-md leading-relaxed mb-6">
                {t('storefrontSuspendedDesc')}
              </p>

              {/* Boutique summary pill */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs max-w-md w-full text-left rtl:text-right space-y-2 mb-6">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{t('colOpticalShop')}:</span>
                  <span className="font-bold text-slate-900">{shop.shop_name}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{t('holdReasonTitle')}:</span>
                  <span className="font-semibold text-rose-700">
                    {shop.hold_reason || t('reasonUnpaidCurrent')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{t('colCurrentTier')}:</span>
                  <span className="font-mono text-slate-700">
                    {tierInfo.name} ({getShopMonthlyAmount(shop) > 0 ? `${getShopMonthlyAmount(shop)} ${getAgentCurrency(undefined, shop).symbol}/mo` : `— ${getAgentCurrency(undefined, shop).symbol}/mo`})
                  </span>
                </div>
              </div>

              {/* Agent Quick Actions */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 w-full max-w-md">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors shadow-2xs flex items-center justify-center gap-1.5 min-h-[44px]"
                >
                  <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                  <span>{t('cancelAndGoBack')}</span>
                </button>
                {onOpenRecordPayment && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenRecordPayment(shop);
                    }}
                    className="px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5 min-h-[44px]"
                  >
                    <DollarSign className="w-4 h-4 text-emerald-300" />
                    <span>{t('collectAndReactivate')}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOverrideShowDesign(true)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 min-h-[44px]"
                >
                  <Eye className="w-4 h-4 text-slate-500" />
                  <span>{t('viewOriginalStorefront')}</span>
                </button>
              </div>
            </div>
          ) : (
            /* CASE 3: Active Storefront (or Agent Previewing Design) */
            <>
              {/* If shop is in maintenance/suspended but viewing underlying design: banner warning */}
              {isInactive && overrideShowDesign && (
                <div
                  className={`px-4 py-2 text-white text-xs font-medium flex items-center justify-between ${
                    subStatus === 'maintenance' ? 'bg-amber-600' : 'bg-rose-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {subStatus === 'maintenance'
                        ? (isRTL
                            ? 'وضع الصيانة الدبلوماسي نشط: يرى الزوار صفحة الصيانة المجدولة دون إحراج المتجر.'
                            : 'Diplomatic Maintenance Active: Public visitors currently see the scheduled maintenance screen.')
                        : (isRTL
                            ? 'ملاحظة: هذا المتجر معلق حالياً. الزوار يرون صفحة تعليق الخدمة حتى يتم تحصيل الاشتراك.'
                            : 'Notice: Storefront suspended offline. Visitors see the service suspended screen until payment is cleared.')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOverrideShowDesign(false)}
                    className="underline text-white font-semibold text-[11px]"
                  >
                    {t('viewSuspendedPortal')}
                  </button>
                </div>
              )}

              {/* Hero Banner with Custom Colors & Background */}
              <div
                className="relative p-8 text-white"
                style={{
                  backgroundColor: cfg.primary_color,
                  backgroundImage: cfg.background_image_url
                    ? `linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.85)), url(${cfg.background_image_url})`
                    : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="max-w-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-14 h-14 rounded-xl bg-white p-1.5 shadow-md flex items-center justify-center overflow-hidden shrink-0 border"
                      style={{ borderColor: cfg.secondary_color }}
                    >
                      {cfg.logo_url ? (
                        <img
                          src={cfg.logo_url}
                          alt={shop.shop_name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover rounded"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <Glasses className="w-8 h-8 text-slate-800" />
                      )}
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-white/80">
                        {tierInfo.name} Boutique Partner
                      </span>
                      <h1 className="text-2xl font-bold tracking-tight">{shop.shop_name}</h1>
                    </div>
                  </div>

                  <p className="text-xs text-white/90 leading-relaxed mb-5 max-w-md">
                    {isRTL
                      ? 'مرحباً بكم في بوابتنا الرقمية المتطورة. استكشف أحدث الإطارات الطبية والنظارات الشمسية، واحجز موعد فحص النظر التفاعلي فوراً.'
                      : 'Experience our curated collection of luxury eyewear and precision lenses. Book your digital vision exam and try frames virtually.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-950 bg-white hover:bg-slate-100 transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>{isRTL ? 'تجربة النظارات الافتراضية' : 'Virtual Frame Try-On'}</span>
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-white/20 hover:bg-white/30 backdrop-blur-xs transition-colors border border-white/20"
                    >
                      {isRTL ? 'حجز فحص نظر' : 'Book Exam Appointment'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Storefront Feature Grid */}
              <div className="p-6 bg-slate-50 border-t border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                      style={{ backgroundColor: `${cfg.primary_color}20`, color: cfg.primary_color }}
                    >
                      <Glasses className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 mb-1">
                      {isRTL ? 'كتالوج الإطارات 2026' : 'Curated 2026 Catalog'}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {isRTL ? 'أحدث موديلات الإطارات العالمية' : 'Designer sunglasses & titanium optical frames'}
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                      style={{ backgroundColor: `${cfg.primary_color}20`, color: cfg.primary_color }}
                    >
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 mb-1">
                      {isRTL ? 'فحوصات بصرية معتمدة' : 'Certified Optometry'}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {isRTL ? 'فريق أخصائيي بصريات معتمد' : 'Digital corneal mapping and precision eye tests'}
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                      style={{ backgroundColor: `${cfg.primary_color}20`, color: cfg.primary_color }}
                    >
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 mb-1">
                      {isRTL ? 'ضمان العدسات الأصلي' : 'Authentic Lens Warranty'}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {isRTL ? 'حماية من الأشعة الزرقاء والخدوش' : 'Blue-cut and anti-reflective premium coating'}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                    {t('featuredEyewear')}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { name: 'Titanium Rimless', type: 'Ultra-light 8.2g', price: '145 JOD' },
                      { name: 'Tortoise Acetate', type: 'Vintage Classic', price: '95 JOD' },
                      { name: 'Polarized Aviator', type: 'Anti-Glare UV400', price: '120 JOD' },
                    ].map((item, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                        <div className="h-20 bg-slate-100 rounded flex items-center justify-center text-slate-400 mb-2">
                          <Glasses className="w-8 h-8 opacity-40" />
                        </div>
                        <span className="text-xs font-bold text-slate-800 block truncate">{item.name}</span>
                        <span className="text-[10px] text-slate-500 block">{item.type}</span>
                        <span className="text-xs font-mono font-semibold text-slate-900 mt-1 block">
                          {item.price}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      {t('visitHours')}
                    </span>
                    <span className="text-xs text-slate-500 mt-0.5 block">
                      {t('openDailyHours')} • {shop.location}
                    </span>
                  </div>
                  <div className="text-right rtl:text-left">
                    <span className="text-[11px] text-slate-400 block font-mono dir-ltr">
                      {cfg.subdomain_slug}.envisioneyewear.store
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700">
                      {t('customerFacingBadge')}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors shadow-2xs text-center min-h-[48px]"
          >
            <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
            <span>{t('cancelAndGoBack')}</span>
          </button>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {onOpenRecordPayment && isInactive && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRecordPayment(shop);
                }}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5 text-center min-h-[48px]"
              >
                <DollarSign className="w-4 h-4 text-emerald-200 shrink-0" />
                <span>{t('collectAndReactivate')}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-xs text-center min-h-[48px]"
            >
              {t('closePreview')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
