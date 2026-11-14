import React, { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { ShopWithConfig, ShopConfig } from '../types/database';
import { CloudinaryImageUploader } from './CloudinaryImageUploader';
import { useLanguage } from '../lib/i18n';

interface ConfigureBrandingModalProps {
  shop: ShopWithConfig | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedConfig: ShopConfig) => void;
  onOpenCloudinaryConfig?: () => void;
  onUpdateConfig: (shopId: string, config: {
    subdomain_slug: string;
    logo_url: string;
    primary_color: string;
    secondary_color: string;
    background_image_url: string;
  }) => Promise<boolean>;
}

const PRESET_PALETTES = [
  { name: 'Emerald Optics', primary: '#0f766e', secondary: '#134e4a' },
  { name: 'Sapphire Blue', primary: '#2563eb', secondary: '#1e3a8a' },
  { name: 'Amethyst Violet', primary: '#7c3aed', secondary: '#4c1d95' },
  { name: 'Amber Luxury', primary: '#d97706', secondary: '#78350f' },
  { name: 'Rose Titanium', primary: '#e11d48', secondary: '#881337' },
  { name: 'Obsidian Black', primary: '#0f172a', secondary: '#334155' },
];

export function ConfigureBrandingModal({
  shop,
  isOpen,
  onClose,
  onSuccess,
  onOpenCloudinaryConfig,
  onUpdateConfig,
}: ConfigureBrandingModalProps) {
  const { t, isRTL } = useLanguage();

  if (!isOpen || !shop) return null;

  const [slug, setSlug] = useState(shop.config?.subdomain_slug || '');
  const [primaryColor, setPrimaryColor] = useState(shop.config?.primary_color || '#0284c7');
  const [secondaryColor, setSecondaryColor] = useState(shop.config?.secondary_color || '#0f172a');
  const [logoUrl, setLogoUrl] = useState(shop.config?.logo_url || '');
  const [bgImageUrl, setBgImageUrl] = useState(shop.config?.background_image_url || '/src/assets/images/optical_storefront_showcase_1790185462812.jpg');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (shop) {
      setSlug(shop.config?.subdomain_slug || shop.shop_name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'));
      setPrimaryColor(shop.config?.primary_color || '#0284c7');
      setSecondaryColor(shop.config?.secondary_color || '#0f172a');
      setLogoUrl(shop.config?.logo_url || '');
      setBgImageUrl(shop.config?.background_image_url || '/src/assets/images/optical_storefront_showcase_1790185462812.jpg');
    }
  }, [shop]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const cleanedSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
    const updated = {
      subdomain_slug: cleanedSlug,
      logo_url: logoUrl.trim(),
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      background_image_url: bgImageUrl.trim(),
    };
    const ok = await onUpdateConfig(shop.id, updated);
    setIsSubmitting(false);
    if (ok) {
      onSuccess({
        shop_id: shop.id,
        ...updated,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 pb-safe">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 shrink-0">
          <div className="min-w-0 pr-2 rtl:pl-2 rtl:pr-0">
            <h3 className="text-base font-semibold text-slate-900 truncate">{t('brandingModalTitle')}</h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {t('brandingModalSubtitle')} {shop.shop_name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('cancelBtn')}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Live Preview Card */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <div className="flex items-center justify-between mb-3 text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                {t('livePortalPreview')}
              </span>
              <span className="font-mono text-[11px] text-slate-500 dir-ltr">
                https://{slug || 'shop'}.envisioneyewear.store
              </span>
            </div>
            {/* Storefront Mockup Header */}
            <div
              className="rounded-lg p-4 text-white shadow-inner transition-colors duration-200 relative overflow-hidden"
              style={{
                backgroundColor: primaryColor,
                backgroundImage: bgImageUrl ? `linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.75)), url(${bgImageUrl})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg bg-white p-1 shadow-sm flex items-center justify-center overflow-hidden shrink-0"
                  style={{ borderColor: secondaryColor }}
                >
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Shop Logo"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-xs font-bold text-slate-800">
                      {shop.shop_name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm tracking-tight text-white drop-shadow-sm">
                    {shop.shop_name}
                  </h4>
                  <p className="text-xs text-white/80">{shop.location}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <span
                  className="px-2.5 py-1 text-[11px] font-medium rounded text-white shadow-xs"
                  style={{ backgroundColor: secondaryColor }}
                >
                  {t('exploreEyewear')}
                </span>
                <span className="text-[11px] text-white/90">
                  {t('tierLabel')} <span className="capitalize font-semibold">{shop.tier}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Subdomain Slug */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                {t('subdomainSlug')}
              </label>
              <div className="flex items-center rounded-xl border border-slate-300 focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900 bg-white overflow-hidden dir-ltr min-h-[44px]">
                <span className="px-2.5 sm:px-3 py-2.5 text-xs text-slate-400 bg-slate-50 border-r border-slate-200 font-mono shrink-0">
                  https://
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  placeholder="amman-optics"
                  required
                  className="flex-1 min-w-0 px-3 py-2.5 text-sm sm:text-xs font-mono text-slate-900 focus:outline-none min-h-[44px]"
                />
                <span className="px-2.5 sm:px-3 py-2.5 text-[11px] sm:text-xs text-slate-500 bg-slate-50 border-l border-slate-200 font-mono shrink-0">
                  .envisioneyewear.store
                </span>
              </div>
            </div>

            {/* Colors Section */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                {t('primaryColor')}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-11 h-11 p-0.5 rounded-lg border border-slate-300 cursor-pointer bg-white shrink-0"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 px-3 py-2.5 text-sm sm:text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:border-slate-900 dir-ltr min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                {t('secondaryColor')}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-11 h-11 p-0.5 rounded-lg border border-slate-300 cursor-pointer bg-white shrink-0"
                />
                <input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="flex-1 px-3 py-2.5 text-sm sm:text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:border-slate-900 dir-ltr min-h-[44px]"
                />
              </div>
            </div>

            {/* Quick Palettes */}
            <div className="md:col-span-2">
              <span className="text-[11px] font-medium text-slate-500 block mb-1.5">
                {t('recommendedPalettes')}
              </span>
              <div className="flex flex-wrap gap-2">
                {PRESET_PALETTES.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => {
                      setPrimaryColor(p.primary);
                      setSecondaryColor(p.secondary);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white hover:border-slate-400 active:scale-[0.98] transition-all min-h-[44px]"
                  >
                    <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: p.primary }} />
                    <span className="w-3.5 h-3.5 rounded-full shrink-0 -ml-1.5 border border-white" style={{ backgroundColor: p.secondary }} />
                    <span className="text-slate-700 font-medium">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Logo Cloudinary Upload */}
            <div className="md:col-span-2 pt-2">
              <CloudinaryImageUploader
                label={t('logoImageUpload')}
                value={logoUrl}
                onChange={setLogoUrl}
                aspectHint="square"
                placeholder="https://res.cloudinary.com/... or logo image URL"
                onOpenCloudinaryConfig={onOpenCloudinaryConfig}
              />
            </div>

            {/* Background Image Cloudinary Upload */}
            <div className="md:col-span-2 pt-2">
              <CloudinaryImageUploader
                label={t('backgroundStorefrontUpload')}
                value={bgImageUrl}
                onChange={setBgImageUrl}
                aspectHint="wide"
                placeholder="https://res.cloudinary.com/... or storefront image URL"
                onOpenCloudinaryConfig={onOpenCloudinaryConfig}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-3 sm:flex sm:items-center sm:justify-end gap-2.5 sm:gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="col-span-1 sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 sm:bg-transparent hover:bg-slate-200 sm:hover:bg-slate-100 rounded-xl transition-colors text-center min-h-[48px]"
            >
              {t('cancelBtn')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="col-span-2 sm:w-auto px-5 py-2.5 text-sm sm:text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl transition-colors flex items-center justify-center text-center min-h-[48px]"
            >
              <span>{isSubmitting ? t('savingBranding') : t('saveBrandingBtn')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
