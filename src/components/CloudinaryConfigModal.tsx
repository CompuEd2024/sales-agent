import React, { useState } from 'react';
import { X, Cloud, Key, Check, Info } from 'lucide-react';
import { getCloudinaryConfig, setCloudinaryConfig } from '../lib/cloudinary';
import { useLanguage } from '../lib/i18n';
import { useToast } from './Toast';

interface CloudinaryConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function CloudinaryConfigModal({
  isOpen,
  onClose,
  onSaved,
}: CloudinaryConfigModalProps) {
  const { t, isRTL } = useLanguage();
  const { showToast } = useToast();
  const current = getCloudinaryConfig();

  const [cloudName, setCloudName] = useState(current.cloudName);
  const [uploadPreset, setUploadPreset] = useState(current.uploadPreset);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setCloudinaryConfig(cloudName, uploadPreset);
    showToast(
      isRTL ? 'تم حفظ إعدادات Cloudinary' : 'Cloudinary Settings Saved',
      isRTL
        ? 'تم تحديث اسم السحابة وإعداد الرفع بنجاح'
        : 'Cloud name and unsigned upload preset updated successfully.',
      'success'
    );
    if (onSaved) onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-slate-200 max-w-md w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 pb-safe">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
              <Cloud className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 truncate">
                {t('cloudinarySettings')}
              </h3>
              <p className="text-[11px] text-slate-500 truncate">
                {isRTL
                  ? 'لرفع الشعارات وصور المتاجر إلى حسابك الخاص في Cloudinary'
                  : 'Host shop logos & storefront banners on your Cloudinary account'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('cancelBtn')}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          <div className="p-3 bg-sky-50/60 border border-sky-200/70 rounded-xl text-xs text-sky-800 flex items-start gap-2">
            <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <span>
              {isRTL
                ? 'تأكد من إنشاء "Unsigned Upload Preset" في لوحة تحكم Cloudinary (Settings > Upload > Upload Presets) لتمكين الرفع المباشر.'
                : 'Ensure your Cloudinary Upload Preset is configured as "Unsigned" in your Cloudinary console (Settings > Upload > Upload Presets).'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              {t('cloudName')}
            </label>
            <input
              type="text"
              required
              value={cloudName}
              onChange={(e) => setCloudName(e.target.value)}
              placeholder="e.g. your-cloud-name"
              className="w-full px-3 py-2.5 text-sm sm:text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-slate-900 font-mono min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              {t('uploadPreset')}
            </label>
            <input
              type="text"
              required
              value={uploadPreset}
              onChange={(e) => setUploadPreset(e.target.value)}
              placeholder="e.g. opticportal_unsigned"
              className="w-full px-3 py-2.5 text-sm sm:text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-slate-900 font-mono min-h-[44px]"
            />
          </div>

          <div className="pt-3 grid grid-cols-3 sm:flex sm:items-center sm:justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="col-span-1 sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 sm:bg-transparent hover:bg-slate-200 sm:hover:bg-slate-100 rounded-xl transition-colors text-center min-h-[48px]"
            >
              {t('cancelBtn')}
            </button>
            <button
              type="submit"
              className="col-span-2 sm:w-auto px-5 py-2.5 text-sm sm:text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-center gap-1.5 min-h-[48px]"
            >
              <Check className="w-4 h-4" />
              <span>{isRTL ? 'حفظ الإعدادات' : 'Save Cloudinary'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
