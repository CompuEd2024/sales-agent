import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  PauseCircle,
  PlayCircle,
  DollarSign,
  ShieldAlert,
  Building2,
  CheckCircle2,
  Clock,
  Wrench,
  Info,
  HelpCircle,
} from 'lucide-react';
import { ShopWithConfig, SUBSCRIPTION_TIERS, SubscriptionStatus, getShopMonthlyAmount, getAgentCurrency } from '../types/database';
import { useLanguage } from '../lib/i18n';

interface HoldShopModalProps {
  shop: ShopWithConfig | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSubscriptionStatus: (
    shopId: string,
    newStatus: SubscriptionStatus,
    reason?: string
  ) => Promise<boolean>;
  onOpenRecordPayment: (shop: ShopWithConfig) => void;
}

export function HoldShopModal({
  shop,
  isOpen,
  onClose,
  onUpdateSubscriptionStatus,
  onOpenRecordPayment,
}: HoldShopModalProps) {
  const { t, isRTL } = useLanguage();

  const currentStatus: SubscriptionStatus = shop?.subscription_status
    ? shop.subscription_status
    : !shop?.is_active
    ? 'suspended'
    : shop?.status === 'on_hold'
    ? 'maintenance'
    : 'active';

  const [targetStatus, setTargetStatus] = useState<SubscriptionStatus>('maintenance');
  const [selectedReason, setSelectedReason] = useState<string>('unpaid_current');
  const [customReason, setCustomReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (shop) {
      const initStatus: SubscriptionStatus = shop.subscription_status
        ? shop.subscription_status
        : !shop.is_active
        ? 'suspended'
        : shop.status === 'on_hold'
        ? 'maintenance'
        : 'active';
      // If currently active, default target to diplomatic maintenance
      setTargetStatus(initStatus === 'active' ? 'maintenance' : initStatus);
    }
  }, [shop]);

  if (!isOpen || !shop) return null;

  const tierDetails = SUBSCRIPTION_TIERS[shop.tier] || SUBSCRIPTION_TIERS.bronze;

  const getResolvedReason = (): string => {
    if (targetStatus === 'active') return '';
    switch (selectedReason) {
      case 'unpaid_current':
        return t('reasonUnpaidCurrent');
      case 'overdue_15':
        return t('reasonOverdue15');
      case 'owner_request':
        return t('reasonOwnerRequest');
      case 'custom':
        return customReason.trim() || t('reasonUnpaidCurrent');
      default:
        return t('reasonUnpaidCurrent');
    }
  };

  const handleApplyStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const reason = getResolvedReason();
    const success = await onUpdateSubscriptionStatus(shop.id, targetStatus, reason);
    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  const handleCollectAndReactivate = () => {
    onClose();
    onOpenRecordPayment(shop);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 pb-safe">
        {/* Header */}
        <div
          className={`flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b shrink-0 ${
            targetStatus === 'maintenance'
              ? 'bg-amber-50/70 border-amber-200'
              : targetStatus === 'suspended'
              ? 'bg-rose-50/70 border-rose-200'
              : 'bg-emerald-50/70 border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                targetStatus === 'maintenance'
                  ? 'bg-amber-100 text-amber-700 border border-amber-200'
                  : targetStatus === 'suspended'
                  ? 'bg-rose-100 text-rose-700 border border-rose-200'
                  : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              }`}
            >
              {targetStatus === 'maintenance' ? (
                <Wrench className="w-5 h-5" />
              ) : targetStatus === 'suspended' ? (
                <ShieldAlert className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {isRTL
                  ? 'إدارة اشتراك المتجر والحالة الدبلوماسية'
                  : 'Diplomatic Subscription Status Control'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                {shop.shop_name} • {shop.location}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('cancel')}
            className="text-slate-400 hover:text-slate-700 hover:bg-black/5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">

        {/* Shop Info Card */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="text-xs">
              <span className="font-semibold text-slate-900">{shop.shop_name}</span>
              <span className="text-slate-400 mx-1.5">•</span>
              <span className="font-mono text-slate-500">{shop.owner_email}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase ${tierDetails.badgeBg}`}
            >
              {tierDetails.name} ({getShopMonthlyAmount(shop) > 0 ? `${getShopMonthlyAmount(shop)} ${getAgentCurrency(undefined, shop).symbol}/mo` : `— ${getAgentCurrency(undefined, shop).symbol}/mo`})
            </span>
          </div>
        </div>

        {/* Diplomatic Helper Tooltip Banner */}
        <div className="p-4 bg-amber-50/70 border-b border-amber-200/80 flex items-start gap-3">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <p className="font-semibold text-amber-950 mb-0.5">
              {isRTL ? 'إرشاد الوكيل للتعامل الدبلوماسي:' : 'Agent Diplomatic Protocol:'}
            </p>
            <p className="text-amber-800">
              {t('diplomaticAdviceTooltip')}
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleApplyStatusChange} className="p-4 sm:p-5 space-y-5">
          {/* Status Selection Pill Cards */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              {t('statusSelectorLabel')}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Option 1: Active */}
              <button
                type="button"
                onClick={() => setTargetStatus('active')}
                className={`p-3.5 rounded-xl border text-left rtl:text-right transition-all flex flex-col justify-between min-h-[68px] ${
                  targetStatus === 'active'
                    ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{t('statusActive')}</span>
                  </div>
                  {targetStatus === 'active' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  {t('statusActiveDesc')}
                </p>
              </button>

              {/* Option 2: Maintenance (Diplomatic Pause) */}
              <button
                type="button"
                onClick={() => setTargetStatus('maintenance')}
                className={`p-3.5 rounded-xl border text-left rtl:text-right transition-all flex flex-col justify-between min-h-[68px] ${
                  targetStatus === 'maintenance'
                    ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-500/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                    <Wrench className="w-4 h-4 text-amber-600" />
                    <span>{t('statusMaintenance')}</span>
                  </div>
                  {targetStatus === 'maintenance' && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  {t('statusMaintenanceDesc')}
                </p>
              </button>

              {/* Option 3: Suspended */}
              <button
                type="button"
                onClick={() => setTargetStatus('suspended')}
                className={`p-3.5 rounded-xl border text-left rtl:text-right transition-all flex flex-col justify-between min-h-[68px] ${
                  targetStatus === 'suspended'
                    ? 'border-rose-500 bg-rose-50/80 ring-2 ring-rose-500/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>{t('statusSuspended')}</span>
                  </div>
                  {targetStatus === 'suspended' && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  {t('statusSuspendedDesc')}
                </p>
              </button>
            </div>
          </div>

          {/* Reason Section (When moving to Maintenance or Suspended) */}
          {targetStatus !== 'active' && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                {t('holdReasonTitle')}
              </label>

              <div className="space-y-2">
                {[
                  { id: 'unpaid_current', label: t('reasonUnpaidCurrent') },
                  { id: 'overdue_15', label: t('reasonOverdue15') },
                  { id: 'owner_request', label: t('reasonOwnerRequest') },
                  { id: 'custom', label: t('reasonCustom') },
                ].map((reason) => (
                  <label
                    key={reason.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-colors min-h-[44px] ${
                      selectedReason === reason.id
                        ? 'bg-slate-50 border-slate-900 text-slate-900 font-medium'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="holdReason"
                      value={reason.id}
                      checked={selectedReason === reason.id}
                      onChange={() => setSelectedReason(reason.id)}
                      className="text-slate-900 focus:ring-slate-900 h-4 w-4 shrink-0"
                    />
                    <span>{reason.label}</span>
                  </label>
                ))}
              </div>

              {selectedReason === 'custom' && (
                <div className="pt-1">
                  <input
                    type="text"
                    placeholder={t('customReasonPlaceholder')}
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm sm:text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 min-h-[44px]"
                    autoFocus
                  />
                </div>
              )}
            </div>
          )}

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={handleCollectAndReactivate}
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 min-h-[48px]"
            >
              <DollarSign className="w-4 h-4 shrink-0" />
              <span className="truncate">{t('collectAndReactivate')}</span>
            </button>

            <div className="grid grid-cols-3 sm:flex sm:items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="col-span-1 sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-center min-h-[48px]"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`col-span-2 sm:w-auto px-4 py-2.5 text-sm sm:text-xs font-semibold text-white rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 min-h-[48px] ${
                  targetStatus === 'maintenance'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : targetStatus === 'suspended'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isSubmitting ? (
                  <span>...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{t('applyStatusChangeBtn')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
