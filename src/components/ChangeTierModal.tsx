import React, { useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { ShopWithConfig, SubscriptionTier, SUBSCRIPTION_TIERS, getShopMonthlyAmount, getAgentCurrency } from '../types/database';
import { useLanguage } from '../lib/i18n';

interface ChangeTierModalProps {
  shop: ShopWithConfig | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedTier: SubscriptionTier) => void;
  onUpdateTier: (shopId: string, tier: SubscriptionTier) => Promise<boolean>;
}

export function ChangeTierModal({
  shop,
  isOpen,
  onClose,
  onSuccess,
  onUpdateTier,
}: ChangeTierModalProps) {
  const { t, isRTL } = useLanguage();

  if (!isOpen || !shop) return null;

  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>(shop.tier);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTier === shop.tier) {
      onClose();
      return;
    }
    setIsSubmitting(true);
    const ok = await onUpdateTier(shop.id, selectedTier);
    setIsSubmitting(false);
    if (ok) {
      onSuccess(selectedTier);
      onClose();
    }
  };

  const currentDetails = SUBSCRIPTION_TIERS[shop.tier];
  const targetDetails = SUBSCRIPTION_TIERS[selectedTier];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col pb-safe">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 shrink-0">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-slate-900 truncate">{t('changeTierTitle')}</h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate">{shop.shop_name}</p>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              {t('selectNewTier')}
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {(Object.keys(SUBSCRIPTION_TIERS) as SubscriptionTier[]).map((tierKey) => {
                const tier = SUBSCRIPTION_TIERS[tierKey];
                const isSelected = selectedTier === tierKey;
                const isCurrent = shop.tier === tierKey;

                return (
                  <button
                    type="button"
                    key={tierKey}
                    onClick={() => setSelectedTier(tierKey)}
                    className={`min-h-[72px] text-left rtl:text-right p-3 rounded-xl border transition-all relative ${
                      isSelected
                        ? 'border-slate-900 bg-slate-50/70 ring-1 ring-slate-900'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-sm font-semibold text-slate-900 capitalize">
                        {tier.name}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {isRTL ? 'الحالية' : 'Current'}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-slate-600 tabular-nums">
                      {tier.monthlyPriceJod} {t('jod')} <span className="text-slate-400">(${tier.monthlyPriceUsd})</span> {t('perMonth')}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Revenue Split Comparison Box */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span>{isRTL ? 'الخطة الحالية:' : 'Current Plan:'}</span>
              <span className="font-semibold text-slate-800 capitalize tabular-nums">
                {currentDetails.name} ({getShopMonthlyAmount(shop) > 0 ? `${getShopMonthlyAmount(shop)} ${getAgentCurrency(undefined, shop).symbol}` : `— ${getAgentCurrency(undefined, shop).symbol}`})
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>{isRTL ? 'الخطة المختارة:' : 'Selected Plan:'}</span>
              <span className="font-semibold text-slate-900 capitalize tabular-nums">
                {targetDetails.name} ({targetDetails.monthlyPriceJod} {t('jod')})
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between font-semibold">
              <span className="text-emerald-700">{isRTL ? 'عمولة الوكيل الجديدة (50%):' : 'New Agent Commission (50%):'}</span>
              <span className="font-mono text-emerald-800 tabular-nums">
                {(targetDetails.monthlyPriceJod * 0.5).toFixed(2)} {t('jod')} {t('perMonth')}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-3 sm:flex items-center justify-end gap-2.5 sm:gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="col-span-1 sm:w-auto min-h-[48px] px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-center"
            >
              {t('cancelBtn')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedTier === shop.tier}
              className="col-span-2 sm:w-auto min-h-[48px] px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl transition-colors flex items-center justify-center gap-1.5 text-center"
            >
              <span>{isSubmitting ? t('updatingTier') : t('updateTierBtn')}</span>
              <ArrowRight className={`w-3.5 h-3.5 ${isRTL ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
