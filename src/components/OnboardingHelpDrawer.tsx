import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Sparkles,
  HelpCircle,
  X,
  Search,
  Copy,
  Check,
  ChevronRight,
  Lightbulb,
  CheckCircle2,
  Building2,
  CreditCard,
  Palette,
  Users,
  Pin,
  PinOff,
  CornerDownRight,
  BookOpen,
  ArrowRight,
  FileCheck,
  Phone,
  Mail,
  MapPin,
  Clock,
  Globe,
  Navigation,
  User,
  AtSign,
  Shield,
  Key,
  Image,
  ImagePlus,
  GripVertical,
} from 'lucide-react';
import {
  ONBOARDING_HELP_DICTIONARY,
  ONBOARDING_HELP_CATEGORIES,
  FieldHelpItem,
} from '../data/onboardingHelpDictionary';
import { useLanguage } from '../lib/i18n';

interface OnboardingHelpDrawerProps {
  activeFieldKey: string | null;
  lastFocusedKey: string | null;
  activeHelpItem: FieldHelpItem | null;
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  onSelectField: (key: string) => void;
}

// Icon mapper for dynamic category & item icons
function renderFieldIcon(iconName: string, className: string = 'w-4 h-4') {
  switch (iconName) {
    case 'Building2':
      return <Building2 className={className} />;
    case 'FileCheck':
      return <FileCheck className={className} />;
    case 'Phone':
      return <Phone className={className} />;
    case 'Mail':
      return <Mail className={className} />;
    case 'MapPin':
      return <MapPin className={className} />;
    case 'Clock':
      return <Clock className={className} />;
    case 'Globe':
      return <Globe className={className} />;
    case 'Navigation':
      return <Navigation className={className} />;
    case 'CreditCard':
      return <CreditCard className={className} />;
    case 'Palette':
      return <Palette className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'Image':
      return <Image className={className} />;
    case 'ImagePlus':
      return <ImagePlus className={className} />;
    case 'User':
      return <User className={className} />;
    case 'AtSign':
      return <AtSign className={className} />;
    case 'Shield':
      return <Shield className={className} />;
    case 'Key':
      return <Key className={className} />;
    case 'Users':
      return <Users className={className} />;
    default:
      return <HelpCircle className={className} />;
  }
}

export function OnboardingHelpDrawer({
  activeFieldKey,
  lastFocusedKey,
  activeHelpItem,
  isOpen,
  onClose,
  onToggle,
  onSelectField,
}: OnboardingHelpDrawerProps) {
  const { t, isRTL } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedExample, setCopiedExample] = useState<string | null>(null);
  const [isPinned, setIsPinned] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);

  // Floating button draggable position state
  const [position, setPosition] = useState<{ x: number; y: number } | null>(() => {
    try {
      const saved = localStorage.getItem('opticportal_help_button_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
          return parsed;
        }
      }
    } catch {}
    return null;
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{
    startPointerX: number;
    startPointerY: number;
    startPosX: number;
    startPosY: number;
    hasMoved: boolean;
  } | null>(null);
  const justDraggedRef = useRef(false);
  const asideRef = useRef<HTMLElement>(null);

  // Keep button within screen bounds on window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        if (!prev) return null;
        const asideEl = asideRef.current;
        const width = asideEl ? asideEl.offsetWidth : 180;
        const height = asideEl ? asideEl.offsetHeight : 52;
        const maxX = Math.max(10, window.innerWidth - width - 10);
        const maxY = Math.max(10, window.innerHeight - height - 10);
        return {
          x: Math.min(Math.max(10, prev.x), maxX),
          y: Math.min(Math.max(10, prev.y), maxY),
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    const asideEl = asideRef.current;
    if (!asideEl) return;

    const rect = asideEl.getBoundingClientRect();
    dragStartRef.current = {
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      startPosX: rect.left,
      startPosY: rect.top,
      hasMoved: false,
    };
    justDraggedRef.current = false;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragStartRef.current) return;

    const deltaX = e.clientX - dragStartRef.current.startPointerX;
    const deltaY = e.clientY - dragStartRef.current.startPointerY;
    const distance = Math.hypot(deltaX, deltaY);

    if (!dragStartRef.current.hasMoved && distance > 4) {
      dragStartRef.current.hasMoved = true;
      justDraggedRef.current = true;
      setIsDragging(true);
    }

    if (dragStartRef.current.hasMoved) {
      const asideEl = asideRef.current;
      const width = asideEl ? asideEl.offsetWidth : 180;
      const height = asideEl ? asideEl.offsetHeight : 52;
      const maxX = Math.max(10, window.innerWidth - width - 10);
      const maxY = Math.max(10, window.innerHeight - height - 10);

      const nextX = Math.min(Math.max(10, dragStartRef.current.startPosX + deltaX), maxX);
      const nextY = Math.min(Math.max(10, dragStartRef.current.startPosY + deltaY), maxY);

      setPosition({ x: nextX, y: nextY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragStartRef.current) return;
    const wasMoved = dragStartRef.current.hasMoved;
    dragStartRef.current = null;
    setIsDragging(false);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    if (wasMoved) {
      justDraggedRef.current = true;
      setPosition((latestPos) => {
        if (latestPos) {
          try {
            localStorage.setItem('opticportal_help_button_pos', JSON.stringify(latestPos));
          } catch {}
        }
        return latestPos;
      });
      setTimeout(() => {
        justDraggedRef.current = false;
      }, 100);
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLButtonElement>) => {
    dragStartRef.current = null;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    if (justDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      justDraggedRef.current = false;
      return;
    }
    onToggle();
  };

  // Filter dictionary items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return Object.values(ONBOARDING_HELP_DICTIONARY).filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.titleAr.includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.descriptionAr.includes(q) ||
        item.key.toLowerCase().includes(q) ||
        item.examples.some((ex) => ex.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  const handleCopyExample = (exampleText: string) => {
    navigator.clipboard.writeText(exampleText);
    setCopiedExample(exampleText);
    setTimeout(() => setCopiedExample(null), 2000);
  };

  const handleInsertExample = (exampleText: string, fieldKey: string) => {
    // Attempt to set value directly into target input
    const el = document.querySelector(`[data-help-key="${fieldKey}"]`) as HTMLInputElement;
    if (el) {
      el.focus();
      // Set native value and dispatch react-compatible input events
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set;
      if (nativeSetter) {
        nativeSetter.call(el, exampleText);
      } else {
        el.value = exampleText;
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      handleCopyExample(exampleText);
    }
  };

  const currentItem = activeHelpItem || (lastFocusedKey ? ONBOARDING_HELP_DICTIONARY[lastFocusedKey] : null);

  return (
    <>
      {/* 1. FLOATING ACTION BUTTON (ALWAYS VISIBLE & DRAGGABLE) */}
      <aside
        ref={asideRef}
        aria-label="Floating Help Control"
        className={`fixed z-40 flex items-center gap-2 select-none touch-none ${
          isDragging ? '' : 'transition-[box-shadow,border-color] duration-150'
        } ${
          position
            ? ''
            : `bottom-36 md:bottom-6 ${isRTL ? 'left-4 md:left-6' : 'right-4 md:right-6'}`
        }`}
        style={
          position
            ? {
                left: `${position.x}px`,
                top: `${position.y}px`,
                bottom: 'auto',
                right: 'auto',
              }
            : undefined
        }
      >
        <button
          type="button"
          onClick={handleButtonClick}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onMouseDown={(e) => {
            // Prevent button click from stealing focus from the active form input
            e.preventDefault();
          }}
          className={`group min-h-[48px] flex items-center gap-2.5 px-3.5 py-2.5 rounded-full shadow-lg border transition-all duration-200 select-none cursor-grab active:cursor-grabbing ${
            isDragging
              ? 'scale-105 shadow-2xl ring-2 ring-emerald-500/70 border-emerald-400 bg-slate-900 text-white cursor-grabbing'
              : 'hover:scale-105 active:scale-95'
          } ${
            isOpen
              ? 'bg-slate-900 text-white border-slate-700 ring-2 ring-emerald-500/50'
              : 'bg-white text-slate-900 border-slate-200 hover:border-slate-400 hover:shadow-xl'
          }`}
          title={
            isRTL
              ? 'مساعد الحقول والتوجيهات (اسحب في أي مكان لتحريك الزر • انقر للفتح أو F1)'
              : 'Help Me: Live Field Guidance (Drag anywhere to move • Click to open or F1)'
          }
        >
          <GripVertical className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 shrink-0 cursor-grab active:cursor-grabbing -mr-1 rtl:-ml-1 opacity-70 group-hover:opacity-100 transition-opacity" />

          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
              isOpen || isDragging
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-900 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          </div>

          <div className="flex flex-col text-left rtl:text-right">
            <span className="text-xs font-bold leading-tight flex items-center gap-1.5">
              <span>{isRTL ? 'مساعد الإدخال' : 'Help Me'}</span>
              <span className="hidden sm:inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 group-hover:bg-slate-200 border border-slate-200">
                F1
              </span>
            </span>
            <span className="text-[10px] text-slate-500 font-medium leading-tight truncate max-w-[120px] sm:max-w-[130px]">
              {activeFieldKey
                ? `${isRTL ? 'نشط: ' : 'Active: '}${
                    isRTL
                      ? ONBOARDING_HELP_DICTIONARY[activeFieldKey]?.titleAr || activeFieldKey
                      : ONBOARDING_HELP_DICTIONARY[activeFieldKey]?.title || activeFieldKey
                  }`
                : isRTL
                ? 'دليل وتوجيهات الحقول'
                : 'Click input for guide'}
            </span>
          </div>

          {activeFieldKey && (
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          )}
        </button>
      </aside>

      {/* 2. DOCKED CONTEXTUAL SLIDE-OVER DRAWER (NON-BLOCKING) */}
      {isOpen && (
        <aside
          aria-label="Contextual Help Drawer"
          className={`fixed z-50 top-16 bottom-20 md:top-20 md:bottom-6 ${
            isRTL ? 'left-3 md:left-6' : 'right-3 md:right-6'
          } w-[380px] sm:w-[420px] max-w-[calc(100vw-1.5rem)] sm:max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200`}
          style={{ maxHeight: 'calc(100vh - 9rem)' }}
          onMouseDown={(e) => {
            // Allow clicking inside drawer buttons/inputs, but avoid taking away cursor focus when clicking purely background elements
            const target = e.target as HTMLElement;
            if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
              // Non-blocking interaction
            }
          }}
        >
          {/* Drawer Top Navigation Bar */}
          <div className="p-4 border-b border-slate-100 bg-linear-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    {isRTL ? 'المساعد الذكي للوكيل' : 'Agent Assistant'}
                  </h3>
                  {activeFieldKey ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{isRTL ? 'الحقل النشط' : 'Live Focus'}</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">
                      {isRTL ? 'دليل الحقول' : 'Directory'}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-300 truncate">
                  {currentItem
                    ? isRTL
                      ? currentItem.titleAr
                      : currentItem.title
                    : isRTL
                    ? 'اختر أي حقل لعرض إرشاداته'
                    : 'Select any input in the form'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setShowCatalog((prev) => !prev)}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  showCatalog
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
                title={isRTL ? 'فهرس الحقول' : 'All Fields Catalog'}
              >
                <BookOpen className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsPinned((prev) => !prev)}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  isPinned
                    ? 'bg-slate-700 text-emerald-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
                title={isPinned ? 'Unpin' : 'Keep Pinned'}
              >
                {isPinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                title="Close Drawer (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Search Bar */}
          <div className="p-3 border-b border-slate-100 bg-slate-50/70">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 pl-2.5 rtl:pl-0 rtl:pr-2.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isRTL
                    ? 'ابحث عن أي حقل (مثال: الشعار، كلمة المرور، العمولة...)'
                    : 'Search help topics (e.g. logo, password, tier)...'
                }
                className="w-full pl-8 rtl:pl-3 rtl:pr-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 pr-2.5 rtl:pr-0 rtl:pl-2.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Drawer Body Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
            {/* 2A. SEARCH RESULTS OVERLAY */}
            {searchQuery.trim() ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                  <span>
                    {isRTL
                      ? `نتائج البحث (${filteredItems.length}):`
                      : `Search Results (${filteredItems.length}):`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-slate-700 hover:underline"
                  >
                    {isRTL ? 'إلغاء' : 'Clear'}
                  </button>
                </div>

                {filteredItems.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>{isRTL ? 'لا توجد نتائج مطابقة لبحثك' : 'No matching help topics found'}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredItems.map((item) => (
                      <button
                        type="button"
                        key={item.key}
                        onClick={() => {
                          onSelectField(item.key);
                          setSearchQuery('');
                          setShowCatalog(false);
                        }}
                        className="w-full text-left rtl:text-right p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-900 hover:bg-slate-50 transition-all flex items-start gap-3 shadow-2xs"
                      >
                        <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                          {renderFieldIcon(item.iconName)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-slate-900">
                              {isRTL ? item.titleAr : item.title}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {isRTL ? item.categoryLabelAr : item.categoryLabel}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                            {isRTL ? item.descriptionAr : item.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : showCatalog ? (
              /* 2B. ALL FIELDS CATALOG OVERVIEW */
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    {isRTL ? 'فهرس حقول التسجيل' : 'Onboarding Form Directory'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowCatalog(false)}
                    className="text-[11px] text-emerald-700 font-semibold hover:underline"
                  >
                    {isRTL ? 'العودة للحقل النشط' : 'Back to Active Field'}
                  </button>
                </div>

                <div className="space-y-4">
                  {ONBOARDING_HELP_CATEGORIES.map((cat) => (
                    <div key={cat.id} className="space-y-2">
                      <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                        <span className="w-5 h-5 rounded bg-slate-100 text-slate-700 flex items-center justify-center text-[11px]">
                          {renderFieldIcon(cat.iconName, 'w-3 h-3')}
                        </span>
                        <span>{isRTL ? cat.titleAr : cat.title}</span>
                      </div>

                      <div className="grid grid-cols-1 gap-1.5 pl-6 rtl:pl-0 rtl:pr-6">
                        {cat.keys.map((key) => {
                          const item = ONBOARDING_HELP_DICTIONARY[key];
                          if (!item) return null;
                          const isCurrent = currentItem?.key === key;

                          return (
                            <button
                              type="button"
                              key={key}
                              onClick={() => {
                                onSelectField(key);
                                setShowCatalog(false);
                              }}
                              className={`text-left rtl:text-right px-3 py-2 rounded-lg border text-xs transition-all flex items-center justify-between ${
                                isCurrent
                                  ? 'border-slate-900 bg-slate-50 font-bold text-slate-900'
                                  : 'border-slate-100 hover:border-slate-300 bg-white text-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                <span className="truncate">
                                  {isRTL ? item.titleAr : item.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 shrink-0">
                                {item.required && (
                                  <span className="text-rose-500 font-bold">*</span>
                                )}
                                <ChevronRight className={`w-3 h-3 ${isRTL ? 'rotate-180' : ''}`} />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : currentItem ? (
              /* 2C. CONTEXT-AWARE FIELD GUIDE */
              <div className="space-y-5 animate-in fade-in duration-150">
                {/* Field Hero Banner */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-2xs">
                        {renderFieldIcon(currentItem.iconName)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">
                          {isRTL ? currentItem.titleAr : currentItem.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                          <span>{isRTL ? currentItem.categoryLabelAr : currentItem.categoryLabel}</span>
                          {currentItem.required ? (
                            <span className="text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded font-semibold">
                              {isRTL ? 'إلزامي' : 'Mandatory'}
                            </span>
                          ) : (
                            <span className="text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                              {isRTL ? 'اختياري' : 'Optional'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectField(currentItem.key)}
                      className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-md border border-emerald-200 transition-colors flex items-center gap-1 shrink-0"
                      title="Focus on this field in the form"
                    >
                      <CornerDownRight className="w-3 h-3" />
                      <span>{isRTL ? 'التركيز' : 'Focus'}</span>
                    </button>
                  </div>

                  <p className="text-slate-600 text-xs leading-relaxed pt-1">
                    {isRTL ? currentItem.descriptionAr : currentItem.description}
                  </p>
                </div>

                {/* Instructions & Format Requirements */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isRTL ? 'قواعد وصيغة الإدخال الموصى بها:' : 'Formatting & Input Guidance:'}</span>
                  </div>

                  <p className="text-slate-600 text-xs leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                    {isRTL ? currentItem.instructionsAr : currentItem.instructions}
                  </p>

                  {currentItem.formattingRules && currentItem.formattingRules.length > 0 && (
                    <ul className="space-y-1.5 pt-1">
                      {(isRTL ? currentItem.formattingRulesAr : currentItem.formattingRules).map(
                        (rule, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-900 mt-1.5 shrink-0" />
                            <span>{rule}</span>
                          </li>
                        )
                      )}
                    </ul>
                  )}
                </div>

                {/* Concrete Examples */}
                {currentItem.examples && currentItem.examples.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        {isRTL ? 'أمثلة عملية واقعية:' : 'Practical Examples:'}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {currentItem.examples.map((example, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors flex items-center justify-between gap-2 shadow-2xs group"
                        >
                          <span className="font-mono text-slate-800 text-[11px] truncate dir-ltr text-left">
                            {example}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Tips for Sales Agents */}
                {currentItem.quickTips && currentItem.quickTips.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-amber-900 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                      <span>{isRTL ? 'نصيحة للمندوب والوكيل:' : 'Agent Pro-Tip:'}</span>
                    </div>
                    <ul className="space-y-1 text-[11px] text-amber-950">
                      {(isRTL ? currentItem.quickTipsAr : currentItem.quickTips).map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-amber-500 font-bold">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              /* 2D. IDLE / FALLBACK GENERAL OVERVIEW */
              <div className="text-center py-6 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center mx-auto shadow-2xs">
                  <BookOpen className="w-6 h-6 text-slate-700" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {isRTL ? 'مرحباً بك في دليل تسجيل المتاجر' : 'Shop Onboarding Assistant'}
                  </h4>
                  <p className="text-slate-500 text-xs max-w-xs mx-auto mt-1">
                    {isRTL
                      ? 'انقر على أي حقل في النموذج لتظهر لك التوجيهات والأمثلة الخاصة به فوراً، أو اختر أحد الحقول من الفهرس أدناه.'
                      : 'Click into any input on the form to view real-time guidance and examples, or browse the directory below.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCatalog(true)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors inline-flex items-center gap-2"
                >
                  <span>{isRTL ? 'استعراض كافة الحقول' : 'Browse All Fields'}</span>
                  <ArrowRight className={`w-3.5 h-3.5 ${isRTL ? 'rotate-180' : ''}`} />
                </button>
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{isRTL ? 'التوجيه المباشر نشط' : 'Live Guidance Active'}</span>
            </div>

            <button
              type="button"
              onClick={() => setShowCatalog((prev) => !prev)}
              className="text-slate-700 hover:text-slate-900 font-semibold hover:underline"
            >
              {showCatalog
                ? isRTL
                  ? 'إغلاق الفهرس'
                  : 'Close Directory'
                : isRTL
                ? 'فهرس الحقول (16)'
                : 'Browse All Fields (16)'}
            </button>
          </div>
        </aside>
      )}
    </>
  );
}
