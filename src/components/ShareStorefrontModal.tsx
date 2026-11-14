import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import {
  X,
  QrCode,
  Download,
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  Globe,
  Share2,
} from 'lucide-react';
import { ShopWithConfig, Agent, formatPhoneForWhatsApp } from '../types/database';
import { useLanguage } from '../lib/i18n';
import { useToast } from './Toast';
import { resolveAgentCountryDialCode } from './OnboardShopForm';

interface ShareStorefrontModalProps {
  shop: ShopWithConfig | null;
  currentAgent?: Agent | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareStorefrontModal({
  shop,
  currentAgent,
  isOpen,
  onClose,
}: ShareStorefrontModalProps) {
  const { t, isRTL, language } = useLanguage();
  const { showToast } = useToast();

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrLoading, setQrLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const slug = shop?.config?.subdomain_slug || 'shop';
  const storefrontUrl = `https://${slug}.envisioneyewear.store`;
  const primaryColor = shop?.config?.primary_color || '#0f172a';

  useEffect(() => {
    if (!isOpen || !shop) {
      setQrDataUrl('');
      return;
    }

    let cancelled = false;
    setQrLoading(true);
    QRCode.toDataURL(storefrontUrl, {
      width: 512,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (!cancelled) {
          setQrDataUrl(url);
        }
      })
      .catch((err) => {
        console.error('QR generation error:', err);
        if (!cancelled) {
          setQrDataUrl('');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setQrLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, shop, storefrontUrl]);

  const { shareWhatsappUrl, ownerWhatsappUrl, hasOwnerPhone } = useMemo(() => {
    if (!shop) {
      return { shareWhatsappUrl: '#', ownerWhatsappUrl: null as string | null, hasOwnerPhone: false };
    }

    const message =
      language === 'ar'
        ? `تفضل بزيارة الواجهة الرقمية لمتجر ${shop.shop_name} لتجربة الإطارات افتراضياً وتصفح أحدث التشكيلات:\n${storefrontUrl}`
        : `Explore ${shop.shop_name}'s live digital storefront and virtual frame try-on:\n${storefrontUrl}`;

    const encoded = encodeURIComponent(message);
    const dialInfo = resolveAgentCountryDialCode(currentAgent);
    const rawOwnerPhone =
      shop.owner_phone ||
      (shop.config as any)?.phone ||
      shop.staff?.find((s) => s.role === 'shop_owner')?.phone_number ||
      shop.staff?.find((s) => Boolean(s.phone_number))?.phone_number ||
      '';
    const waDigits = formatPhoneForWhatsApp(rawOwnerPhone, dialInfo.dialCode);

    return {
      shareWhatsappUrl: `https://wa.me/?text=${encoded}`,
      ownerWhatsappUrl: waDigits ? `https://wa.me/${waDigits}?text=${encoded}` : null,
      hasOwnerPhone: Boolean(waDigits),
    };
  }, [shop, storefrontUrl, language, currentAgent]);

  if (!isOpen || !shop) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(storefrontUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `${slug}-storefront-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(
      t('toastQrDownloaded'),
      `${slug}-storefront-qr.png`,
      'success'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full sm:my-8 overflow-hidden max-h-[92vh] flex flex-col pb-safe">
        {/* Header */}
        <div className="px-4 py-3.5 sm:p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 border border-white/20"
              style={{ backgroundColor: primaryColor }}
            >
              <Share2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold truncate">{t('shareStorefrontTitle')}</h3>
              <p className="text-xs text-slate-300 mt-0.5 truncate">
                {shop.shop_name} • {shop.location}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            aria-label={isRTL ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">
          <p className="text-xs text-slate-600 leading-relaxed">
            {t('shareStorefrontSubtitle')}
          </p>

          {/* Storefront URL Card */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {t('storefrontLinkLabel')}
            </label>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
              <Globe className="w-4 h-4 text-sky-600 shrink-0 ms-1" />
              <a
                href={storefrontUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-0 text-xs font-mono font-semibold text-sky-700 hover:underline truncate dir-ltr"
              >
                {storefrontUrl}
              </a>
              <button
                type="button"
                onClick={handleCopyLink}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 inline-flex items-center gap-1.5 transition-colors shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">{t('copiedBtn')}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>{t('copyLinkBtn')}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* QR Code Showcase */}
          <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-center w-52 h-52 sm:w-56 sm:h-56">
              {qrLoading || !qrDataUrl ? (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <QrCode className="w-10 h-10 animate-pulse" />
                  <span className="text-[11px] font-medium">
                    {isRTL ? 'جاري إنشاء الرمز...' : 'Generating QR...'}
                  </span>
                </div>
              ) : (
                <img
                  src={qrDataUrl}
                  alt={`${shop.shop_name} QR Code`}
                  className="w-full h-full object-contain"
                />
              )}
            </div>
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-slate-900">{shop.shop_name}</div>
              <p className="text-[11px] text-slate-500">{t('qrScanHint')}</p>
            </div>
          </div>

          {/* Primary Actions: Download QR & Share on WhatsApp */}
          <div className="space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={!qrDataUrl}
                onClick={handleDownloadQr}
                className="min-h-[52px] sm:min-h-[48px] px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm sm:text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>{t('downloadQrBtn')}</span>
              </button>

              <a
                href={shareWhatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[52px] sm:min-h-[48px] px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm sm:text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>{t('shareOnWhatsAppBtn')}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80 shrink-0" />
              </a>
            </div>

            {hasOwnerPhone && ownerWhatsappUrl && (
              <a
                href={ownerWhatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{t('sendToOwnerWhatsAppBtn')}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-75 shrink-0" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
