import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, RefreshCw, X, Image as ImageIcon, Settings2, ExternalLink } from 'lucide-react';
import { uploadImageToCloudinary } from '../lib/cloudinary';
import { useLanguage } from '../lib/i18n';

interface CloudinaryImageUploaderProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  aspectHint?: 'square' | 'wide';
  placeholder?: string;
  onOpenCloudinaryConfig?: () => void;
  onUploadingChange?: (uploading: boolean) => void;
  helpKey?: string;
}

export function CloudinaryImageUploader({
  label,
  value,
  onChange,
  aspectHint = 'square',
  placeholder = '',
  onOpenCloudinaryConfig,
  onUploadingChange,
  helpKey,
}: CloudinaryImageUploaderProps) {
  const { t, isRTL } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    isCloudinary?: boolean;
    error?: string;
  } | null>(null);
  const [showManualUrl, setShowManualUrl] = useState(false);

  const handleFile = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      setUploadStatus({
        isCloudinary: false,
        error: isRTL ? 'يرجى اختيار ملف صورة صالح (PNG, JPG, SVG, WebP)' : 'Please select a valid image file (PNG, JPG, SVG, WebP)',
      });
      return;
    }

    setIsUploading(true);
    onUploadingChange?.(true);
    setUploadStatus(null);

    try {
      const result = await uploadImageToCloudinary(file);
      if (result.success && result.url) {
        onChange(result.url);
        setUploadStatus({
          isCloudinary: result.isCloudinary,
          error: result.error,
        });
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      setUploadStatus({
        isCloudinary: false,
        error: err.message || 'Failed to upload image.',
      });
    } finally {
      setIsUploading(false);
      onUploadingChange?.(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const isCloudinaryUrl = Boolean(value && value.includes('cloudinary.com'));

  return (
    <div className="space-y-2" data-help-key={helpKey}>
      {/* Label and Actions */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
          {label}
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowManualUrl(!showManualUrl)}
            className="text-xs text-sky-700 hover:text-sky-900 underline transition-colors min-h-[40px] px-2 flex items-center"
          >
            {showManualUrl
              ? (isRTL ? 'إخفاء الرابط اليدوي' : 'Hide manual URL')
              : (isRTL ? 'إدخال رابط يدوي' : 'Manual URL')}
          </button>
        </div>
      </div>

      {/* Upload Zone / Preview */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
          dragActive
            ? 'border-slate-900 bg-slate-100/80 scale-[0.99]'
            : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
        } ${isUploading ? 'opacity-70 pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleInputChange}
        />

        {value ? (
          <div className="flex items-center gap-3 text-left">
            {/* Image Thumbnail */}
            <div
              className={`rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center ${
                aspectHint === 'wide' ? 'w-24 h-14' : 'w-14 h-14'
              }`}
            >
              <img
                src={value}
                alt="Uploaded asset"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                {isCloudinaryUrl ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Cloudinary CDN
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded">
                    <ImageIcon className="w-3 h-3 text-slate-600" />
                    {isRTL ? 'صورة جاهزة' : 'Image Ready'}
                  </span>
                )}
                <span className="text-[11px] text-slate-500">
                  {isRTL ? 'انقر لتغيير الصورة' : 'Click to replace file'}
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-600 truncate mt-1 dir-ltr text-left">
                {value}
              </p>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
                setUploadStatus(null);
              }}
              title={t('removeImage')}
              aria-label={t('removeImage')}
              className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="py-3 flex flex-col items-center justify-center gap-1.5">
            {isUploading ? (
              <>
                <RefreshCw className="w-6 h-6 text-slate-700 animate-spin" />
                <span className="text-xs font-semibold text-slate-800 mt-1">
                  {t('uploadingImage')}
                </span>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 mb-1">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-slate-800">
                  {t('clickToUpload')}
                </div>
                <div className="text-[11px] text-slate-500">
                  {t('formatsNote')} • {aspectHint === 'wide' ? '16:9 / 2:1 Recommended' : '1:1 Square'}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Notice/Status message */}
      {uploadStatus?.error && (
        <div className="p-2 text-[11px] rounded bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <span>{uploadStatus.error}</span>
        </div>
      )}

      {/* Manual URL input toggle */}
      {showManualUrl && (
        <div className="pt-1">
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || 'https://res.cloudinary.com/... or image link'}
            className="w-full px-3 py-2.5 text-sm sm:text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:border-slate-900 bg-white min-h-[44px]"
          />
        </div>
      )}
    </div>
  );
}
