import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Building2,
  MapPin,
  Mail,
  CheckCircle2,
  ArrowRight,
  Glasses,
  Users,
  UserPlus,
  Trash2,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Phone,
  FileCheck,
  Clock,
  Navigation,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  ExternalLink,
  Lock,
  ArrowLeft,
  CheckCircle,
  ShoppingBag,
  Coins,
  Headphones,
  Rocket,
  RefreshCw,
} from 'lucide-react';
import {
  SubscriptionTier,
  ShopWithConfig,
  StaffRole,
  StaffProvisionInput,
  StaffCredentialResult,
  OnboardShopResponse,
  Agent,
} from '../types/database';
import { portalService } from '../lib/supabase';
import { CloudinaryImageUploader } from './CloudinaryImageUploader';
import { OnboardingHelpDrawer } from './OnboardingHelpDrawer';
import { useFocusedField } from '../hooks/useFocusedField';
import { useLanguage } from '../lib/i18n';
import { useAgent } from '../context/AgentContext';
import {
  calculateShopTierPricing,
  PricingResult,
  JodRates,
} from '../utils/pricingCalculator';

interface OnboardShopFormProps {
  agentId: string;
  agentName?: string;
  agent?: Agent | null;
  onShopOnboarded: (newShop: ShopWithConfig) => void;
  onCancel: () => void;
  onOpenCloudinaryConfig?: () => void;
  onSubmitOnboard: (
    shopData: {
      shop_name: string;
      location: string;
      owner_email: string;
      tier: SubscriptionTier;
      agent_id: string;
      country_code?: string;
      currency_code?: string;
      currency_symbol?: string;
      tier_1_price?: number;
      tier_2_price?: number;
      tier_3_price?: number;
      tier_4_price?: number;
    },
    configData: {
      subdomain_slug: string;
      logo_url: string;
      primary_color: string;
      secondary_color: string;
      background_image_url: string;
      bg_image_url?: string;
      config_json?: any;
    },
    staffData: StaffProvisionInput[]
  ) => Promise<OnboardShopResponse>;
}

export type StitchTierKey = 'starter' | 'pro' | 'enterprise';

interface StitchTierInfo {
  id: StitchTierKey;
  dbTier: SubscriptionTier;
  name: string;
  features: string[];
  recommended?: boolean;
}

const STITCH_TIERS: Record<StitchTierKey, StitchTierInfo> = {
  starter: {
    id: 'starter',
    dbTier: 'silver',
    name: 'Starter Studio',
    features: [
      '1 Physical Boutique Hub',
      'Up to 3 Staff Credentials',
      'Basic Eyewear Catalog',
    ],
  },
  pro: {
    id: 'pro',
    dbTier: 'gold',
    name: 'Professional Clinic',
    recommended: true,
    features: [
      '3 Branches & Dispensaries',
      'Up to 10 Staff Credentials',
      'Advanced Rx & Lens Matrix',
      'Cloudinary CDN High-Res SKUs',
    ],
  },
  enterprise: {
    id: 'enterprise',
    dbTier: 'platinum',
    name: 'Enterprise Elite',
    features: [
      'Unlimited Franchise Branches',
      'Unlimited Staff Accounts',
      'Custom ERP / WhatsApp Webhook',
    ],
  },
};

export interface HarmoniousColorPalette {
  name: string;
  nameAr: string;
  primary: string;
  secondary: string;
  description: string;
  descriptionAr: string;
}

export const HARMONIOUS_COLOR_SUGGESTIONS: HarmoniousColorPalette[] = [
  {
    name: 'Emerald Health',
    nameAr: 'زمرد طبي متقدم',
    primary: '#065f46',
    secondary: '#10b981',
    description: 'Clinical trust & calming clarity',
    descriptionAr: 'ثقة سريرية ونقاء مريح',
  },
  {
    name: 'Sapphire Royal',
    nameAr: 'ياقوت أزرق ملكي',
    primary: '#1e3a8a',
    secondary: '#0284c7',
    description: 'Executive precision & modern optics',
    descriptionAr: 'دقة تنفيذية وبصريات حديثة',
  },
  {
    name: 'Indigo Radiance',
    nameAr: 'إنديجو نقي',
    primary: '#4338ca',
    secondary: '#006c4a',
    description: 'Balanced contrast & high technology',
    descriptionAr: 'تباين متوازن وتكنولوجيا متقدمة',
  },
  {
    name: 'Amethyst Luxury',
    nameAr: 'جمشت بوتيك فاخر',
    primary: '#581c87',
    secondary: '#a855f7',
    description: 'High-fashion frames & premium boutique',
    descriptionAr: 'إطارات هوت كوتور وبوتيك راقي',
  },
  {
    name: 'Havana Tortoise',
    nameAr: 'هافانا وتيتانيوم دافئ',
    primary: '#92400e',
    secondary: '#f59e0b',
    description: 'Warm artisan & classic craftsmanship',
    descriptionAr: 'دفء الحرفية والنظارات الكلاسيكية',
  },
  {
    name: 'Rose Gold Couture',
    nameAr: 'ذهب وردي أنيق',
    primary: '#9f1239',
    secondary: '#fb7185',
    description: 'Designer aesthetics & subtle refinement',
    descriptionAr: 'تصاميم نسائية وعصرية راقية',
  },
  {
    name: 'Obsidian Minimal',
    nameAr: 'أوبسيديان مينيمال',
    primary: '#0f172a',
    secondary: '#475569',
    description: 'Architectural monochrome simplicity',
    descriptionAr: 'بساطة معمارية عصرية',
  },
  {
    name: 'Nordic Sage',
    nameAr: 'ميرمية نورديك مهدئة',
    primary: '#166534',
    secondary: '#84cc16',
    description: 'Organic wellness & lens protection',
    descriptionAr: 'راحة بصرية وحماية فائقة للعين',
  },
];

const STAFF_ROLE_OPTIONS: Array<{
  value: StaffRole;
  labelEn: string;
  labelAr: string;
}> = [
  { value: 'optometrist', labelEn: 'Lead Optometrist', labelAr: 'أخصائي بصريات رئيسي' },
  { value: 'shop_owner', labelEn: 'Store Manager / Owner', labelAr: 'مدير المتجر / المالك' },
  { value: 'optician', labelEn: 'Optical Dispenser / Cashier', labelAr: 'فني بصريات / أمين الصندوق' },
  { value: 'marketer', labelEn: 'Digital Marketer', labelAr: 'مسؤول تسويق رقمي' },
];

export const COUNTRY_DIAL_CODES: Record<
  string,
  { dialCode: string; placeholder: string; flag: string; countryNameEn: string; countryNameAr: string }
> = {
  JO: { dialCode: '+962', placeholder: '+962 7 9000 0000', flag: '🇯🇴', countryNameEn: 'Jordan', countryNameAr: 'الأردن' },
  SA: { dialCode: '+966', placeholder: '+966 5 0000 0000', flag: '🇸🇦', countryNameEn: 'Saudi Arabia', countryNameAr: 'المملكة العربية السعودية' },
  AE: { dialCode: '+971', placeholder: '+971 50 000 0000', flag: '🇦🇪', countryNameEn: 'United Arab Emirates', countryNameAr: 'الإمارات العربية المتحدة' },
  KW: { dialCode: '+965', placeholder: '+965 9000 0000', flag: '🇰🇼', countryNameEn: 'Kuwait', countryNameAr: 'الكويت' },
  QA: { dialCode: '+974', placeholder: '+974 3000 0000', flag: '🇶🇦', countryNameEn: 'Qatar', countryNameAr: 'قطر' },
  BH: { dialCode: '+973', placeholder: '+973 3000 0000', flag: '🇧🇭', countryNameEn: 'Bahrain', countryNameAr: 'البحرين' },
  OM: { dialCode: '+968', placeholder: '+968 9000 0000', flag: '🇴🇲', countryNameEn: 'Oman', countryNameAr: 'عُمان' },
  EG: { dialCode: '+20', placeholder: '+20 10 0000 0000', flag: '🇪🇬', countryNameEn: 'Egypt', countryNameAr: 'مصر' },
  IQ: { dialCode: '+964', placeholder: '+964 770 000 0000', flag: '🇮🇶', countryNameEn: 'Iraq', countryNameAr: 'العراق' },
  LB: { dialCode: '+961', placeholder: '+961 70 000 000', flag: '🇱🇧', countryNameEn: 'Lebanon', countryNameAr: 'لبنان' },
  PS: { dialCode: '+970', placeholder: '+970 59 000 0000', flag: '🇵🇸', countryNameEn: 'Palestine', countryNameAr: 'فلسطين' },
  TR: { dialCode: '+90', placeholder: '+90 500 000 0000', flag: '🇹🇷', countryNameEn: 'Turkey', countryNameAr: 'تركيا' },
  US: { dialCode: '+1', placeholder: '+1 (555) 000-0000', flag: '🇺🇸', countryNameEn: 'United States', countryNameAr: 'الولايات المتحدة' },
  CA: { dialCode: '+1', placeholder: '+1 (555) 000-0000', flag: '🇨🇦', countryNameEn: 'Canada', countryNameAr: 'كندا' },
  GB: { dialCode: '+44', placeholder: '+44 7000 000000', flag: '🇬🇧', countryNameEn: 'United Kingdom', countryNameAr: 'المملكة المتحدة' },
  UK: { dialCode: '+44', placeholder: '+44 7000 000000', flag: '🇬🇧', countryNameEn: 'United Kingdom', countryNameAr: 'المملكة المتحدة' },
  DE: { dialCode: '+49', placeholder: '+49 150 0000000', flag: '🇩🇪', countryNameEn: 'Germany', countryNameAr: 'ألمانيا' },
  FR: { dialCode: '+33', placeholder: '+33 6 00 00 00 00', flag: '🇫🇷', countryNameEn: 'France', countryNameAr: 'فرنسا' },
  IT: { dialCode: '+39', placeholder: '+39 300 000 0000', flag: '🇮🇹', countryNameEn: 'Italy', countryNameAr: 'إيطاليا' },
  ES: { dialCode: '+34', placeholder: '+34 600 00 00 00', flag: '🇪🇸', countryNameEn: 'Spain', countryNameAr: 'إسبانيا' },
  NL: { dialCode: '+31', placeholder: '+31 6 00000000', flag: '🇳🇱', countryNameEn: 'Netherlands', countryNameAr: 'هولندا' },
  CH: { dialCode: '+41', placeholder: '+41 78 000 00 00', flag: '🇨🇭', countryNameEn: 'Switzerland', countryNameAr: 'سويسرا' },
  AU: { dialCode: '+61', placeholder: '+61 400 000 000', flag: '🇦🇺', countryNameEn: 'Australia', countryNameAr: 'أستراليا' },
  NZ: { dialCode: '+64', placeholder: '+64 20 000 0000', flag: '🇳🇿', countryNameEn: 'New Zealand', countryNameAr: 'نيوزيلندا' },
  SE: { dialCode: '+46', placeholder: '+46 70 000 0000', flag: '🇸🇪', countryNameEn: 'Sweden', countryNameAr: 'السويد' },
  NO: { dialCode: '+47', placeholder: '+47 900 00 000', flag: '🇳🇴', countryNameEn: 'Norway', countryNameAr: 'النرويج' },
  DK: { dialCode: '+45', placeholder: '+45 20 00 00 00', flag: '🇩🇰', countryNameEn: 'Denmark', countryNameAr: 'الدنمارك' },
  FI: { dialCode: '+358', placeholder: '+358 40 000 0000', flag: '🇫🇮', countryNameEn: 'Finland', countryNameAr: 'فنلندا' },
  PL: { dialCode: '+48', placeholder: '+48 500 000 000', flag: '🇵🇱', countryNameEn: 'Poland', countryNameAr: 'بولندا' },
  IE: { dialCode: '+353', placeholder: '+353 83 000 0000', flag: '🇮🇪', countryNameEn: 'Ireland', countryNameAr: 'أيرلندا' },
  BE: { dialCode: '+32', placeholder: '+32 470 00 00 00', flag: '🇧🇪', countryNameEn: 'Belgium', countryNameAr: 'بلجيكا' },
  AT: { dialCode: '+43', placeholder: '+43 650 0000000', flag: '🇦🇹', countryNameEn: 'Austria', countryNameAr: 'النمسا' },
  PT: { dialCode: '+351', placeholder: '+351 910 000 000', flag: '🇵🇹', countryNameEn: 'Portugal', countryNameAr: 'البرتغال' },
  GR: { dialCode: '+30', placeholder: '+30 690 000 0000', flag: '🇬🇷', countryNameEn: 'Greece', countryNameAr: 'اليونان' },
};

export function resolveAgentCountryDialCode(agent?: Agent | null): {
  dialCode: string;
  placeholder: string;
  flag: string;
  countryCode: string;
  countryNameEn: string;
  countryNameAr: string;
} {
  const code = (agent?.country_code || agent?.primary_country_code || '').toUpperCase().trim();
  if (code && COUNTRY_DIAL_CODES[code]) {
    return { ...COUNTRY_DIAL_CODES[code], countryCode: code };
  }

  // Check agent's phone number prefix if available
  const phone = agent?.phone_number || agent?.phone || '';
  if (phone) {
    const match = phone.match(/^(\+\d{1,4})/);
    if (match) {
      const prefix = match[1];
      const entry = Object.entries(COUNTRY_DIAL_CODES).find(([_, v]) => v.dialCode === prefix);
      if (entry) {
        return { ...entry[1], countryCode: entry[0] };
      }
      return {
        dialCode: prefix,
        placeholder: `${prefix} 0000 0000`,
        flag: '🌐',
        countryCode: code || 'INTL',
        countryNameEn: 'International',
        countryNameAr: 'دولي',
      };
    }
  }

  // Check territory hints
  const territory = (agent?.territory || '').toLowerCase();
  if (territory.includes('amman') || territory.includes('zarqa') || territory.includes('aqaba') || territory.includes('jordan')) {
    return { ...COUNTRY_DIAL_CODES.JO, countryCode: 'JO' };
  }
  if (territory.includes('riyadh') || territory.includes('jeddah') || territory.includes('saudi')) {
    return { ...COUNTRY_DIAL_CODES.SA, countryCode: 'SA' };
  }
  if (territory.includes('dubai') || territory.includes('abu dhabi') || territory.includes('uae') || territory.includes('emirates')) {
    return { ...COUNTRY_DIAL_CODES.AE, countryCode: 'AE' };
  }
  if (territory.includes('kuwait')) {
    return { ...COUNTRY_DIAL_CODES.KW, countryCode: 'KW' };
  }

  return { ...COUNTRY_DIAL_CODES.JO, countryCode: 'JO' };
}

function generateStaffPassword(): string {
  const words = ['Optic', 'Vision', 'Focus', 'Iris', 'Crown', 'Apex'];
  const symbols = ['!', '@', '#', '$'];
  const word = words[Math.floor(Math.random() * words.length)];
  const symbol = symbols[Math.floor(Math.random() * symbols.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `#${word}${num}${symbol}`;
}

export function OnboardShopForm({
  agentId,
  agentName = 'Kareem Mansour (AG-8842)',
  agent,
  onShopOnboarded,
  onCancel,
  onOpenCloudinaryConfig,
  onSubmitOnboard,
}: OnboardShopFormProps) {
  const { t, isRTL } = useLanguage();
  const { currentAgent } = useAgent();
  const activeAgent = agent || currentAgent;
  const agentDialInfo = resolveAgentCountryDialCode(activeAgent);

  // Context-aware Focused Field Tracking for "Help Me"
  const {
    activeFieldKey,
    lastFocusedKey,
    activeHelpItem,
    isHelpOpen,
    setIsHelpOpen,
    toggleHelp,
    selectFieldForHelp,
  } = useFocusedField('shop_name');

  // Active step in the 4-stage stepper
  const [activeStep, setActiveStep] = useState<number>(1);

  // Field validation and real-time database pre-check states
  interface FieldValidationState {
    formatError: string | null;
    dbError: string | null;
    isChecking: boolean;
    isAvailable: boolean;
    successMessage?: string | null;
  }

  const [shopNameValidation, setShopNameValidation] = useState<FieldValidationState>({
    formatError: null,
    dbError: null,
    isChecking: false,
    isAvailable: false,
  });
  const [isCheckingShopName, setIsCheckingShopName] = useState<boolean>(false);
  const [isShopNameTaken, setIsShopNameTaken] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [ownerNameError, setOwnerNameError] = useState<string | null>(null);

  const [subdomainValidation, setSubdomainValidation] = useState<FieldValidationState>({
    formatError: null,
    dbError: null,
    isChecking: false,
    isAvailable: false,
  });

  const [ownerEmailValidation, setOwnerEmailValidation] = useState<FieldValidationState>({
    formatError: null,
    dbError: null,
    isChecking: false,
    isAvailable: false,
  });

  const [phoneValidation, setPhoneValidation] = useState<FieldValidationState>({
    formatError: null,
    dbError: null,
    isChecking: false,
    isAvailable: false,
  });

  interface StaffFieldValidation {
    nameError: string | null;
    emailFormatError: string | null;
    emailDbError: string | null;
    isCheckingEmail: boolean;
    isEmailAvailable: boolean;
    passwordError: string | null;
    phoneFormatError: string | null;
    phoneDbError: string | null;
    isCheckingPhone: boolean;
  }

  const [staffValidations, setStaffValidations] = useState<Record<string, StaffFieldValidation>>({});
  const checkTimersRef = useRef<Record<string, any>>({});
  const emailDbStatusCacheRef = useRef<Record<string, { available: boolean; message?: string; messageAr?: string }>>({});

  // SECTION 1: Boutique Identity
  const [shopName, setShopName] = useState('');
  const [location, setLocation] = useState('');
  const [subdomainSlug, setSubdomainSlug] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [sendInviteEmail, setSendInviteEmail] = useState(true);

  // Extended Details (Collapsible in Section 1)
  const [licenseNumber, setLicenseNumber] = useState('');
  const [primaryPhone, setPrimaryPhone] = useState('');
  const [physicalAddress, setPhysicalAddress] = useState('');
  const [operatingHours, setOperatingHours] = useState('');
  const [showExtendedDetails, setShowExtendedDetails] = useState(false);

  // SECTION 2: Tier & Commission
  const [selectedTierKey, setSelectedTierKey] = useState<StitchTierKey>('pro');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  // SECTION 3: Branding & Cloudinary Assets
  const [primaryColor, setPrimaryColor] = useState('#4338ca');
  const [secondaryColor, setSecondaryColor] = useState('#006c4a');
  const [logoUrl, setLogoUrl] = useState('');
  const [bgImageUrl, setBgImageUrl] = useState(
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDddWBxDKmG1hKmxsxdTzTNAh11ykiZlck4fSHrHk69ANEJLQp0febKhG9Eesu6xeByqyknyydSHtfMSgzrzRquTN9HJ4yYpqK4wKkX313XjMtOLx1VY6AEqcTu-ASnYHFkIJhYf_ZZDOfzxcl4bxvXfl3fLCw0riJnOkG9dAOGluzE2MCFImwXMlHIY4JLKncwlbEoMlgxCjs2wHO9xOIIbtI3MkAaCC19zejxc6BfrprBm9B4T_5L'
  );
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const [isBgUploading, setIsBgUploading] = useState(false);

  // SECTION 4: Staff Credentials
  const [staffList, setStaffList] = useState<StaffProvisionInput[]>([
    {
      id: 'staff-1',
      full_name: '',
      role: 'optometrist',
      email: '',
      password: generateStaffPassword(),
      phone_number: `${agentDialInfo.dialCode} `,
    },
  ]);
  const [showStaffPasswords, setShowStaffPasswords] = useState<Record<string, boolean>>({});
  const [forcePasswordReset, setForcePasswordReset] = useState(true);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Auto-sync staff phone numbers with active agent's country dial code
  useEffect(() => {
    if (!agentDialInfo?.dialCode) return;
    setStaffList((prev) =>
      prev.map((staff) => {
        const val = (staff.phone_number || '').trim();
        const isJustPrefix =
          !val ||
          Object.values(COUNTRY_DIAL_CODES).some(
            (c) => val === c.dialCode || val === `${c.dialCode} `
          );
        if (isJustPrefix) {
          return { ...staff, phone_number: `${agentDialInfo.dialCode} ` };
        }
        return staff;
      })
    );
  }, [agentDialInfo.dialCode]);

  // Submission & Success Modal State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [provisionedModalData, setProvisionedModalData] = useState<{
    shop: ShopWithConfig;
    credentials: StaffCredentialResult[];
  } | null>(null);

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Live rates state with reload function
  const [ratesData, setRatesData] = useState<{
    base?: string;
    rates: JodRates;
    fetchedAt: string;
    source: string;
    attribution: string;
    attributionUrl: string;
  } | null>(null);
  const [ratesLoading, setRatesLoading] = useState<boolean>(true);

  const fetchRates = useCallback(async () => {
    setRatesLoading(true);
    try {
      const res = await fetch('/api/rates');
      if (res.ok) {
        const data = await res.json();
        setRatesData(data);
      } else {
        setRatesData(null);
      }
    } catch (e) {
      console.warn('[OnboardForm] Failed to fetch live exchange rates:', e);
      setRatesData(null);
    } finally {
      setRatesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const agentCountry = activeAgent?.country_code || activeAgent?.primary_country_code;
  const pricingResult: PricingResult = calculateShopTierPricing(agentCountry, ratesData?.rates);

  useEffect(() => {
    console.log('[OnboardForm] pricing', activeAgent?.country_code, pricingResult);
  }, [activeAgent?.country_code, pricingResult]);

  const currencySymbol = pricingResult.ok ? pricingResult.pricing.currency_symbol : '';

  const getTierMonthly = (tierKey: StitchTierKey): number => {
    if (!pricingResult.ok) return 0;
    if (tierKey === 'starter') return pricingResult.pricing.tier_2_price;
    if (tierKey === 'pro') return pricingResult.pricing.tier_3_price;
    if (tierKey === 'enterprise') return pricingResult.pricing.tier_4_price;
    return 0;
  };

  // Calculations for Commission Projection
  const currentTierInfo = STITCH_TIERS[selectedTierKey];
  const currentMonthlyPrice = getTierMonthly(selectedTierKey);
  const effectiveBasePrice = pricingResult.ok
    ? (billingCycle === 'annual' ? Number((currentMonthlyPrice * 10 / 12).toFixed(2)) : currentMonthlyPrice)
    : 0;
  const agentCommission = effectiveBasePrice * 0.5;

  // Real-Time Pre-Check Execution Logic
  const verifyShopNameAsync = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      setIsCheckingShopName(false);
      setIsShopNameTaken(false);
      setShopNameValidation({
        formatError: isRTL ? 'اسم المتجر مطلوب.' : 'Shop name is required.',
        dbError: null,
        isChecking: false,
        isAvailable: false,
      });
      return;
    }

    if (trimmed.length < 3) {
      setIsCheckingShopName(false);
      setIsShopNameTaken(false);
      setShopNameValidation({
        formatError: isRTL ? 'يجب أن يتكون اسم المتجر من 3 أحرف على الأقل.' : 'Shop name must be at least 3 characters.',
        dbError: null,
        isChecking: false,
        isAvailable: false,
      });
      return;
    }

    setIsCheckingShopName(true);
    setIsShopNameTaken(false);
    setShopNameValidation(prev => ({ ...prev, formatError: null, isChecking: true, dbError: null }));

    try {
      const res = await portalService.checkFieldAvailability('shop_name', trimmed);
      setIsCheckingShopName(false);
      if (res.available) {
        setIsShopNameTaken(false);
        setShopNameValidation({
          formatError: null,
          dbError: null,
          isChecking: false,
          isAvailable: true,
          successMessage: isRTL ? 'اسم المتجر متاح ومميز' : 'Optical boutique name is unique and available',
        });
      } else {
        setIsShopNameTaken(true);
        const warningMsg = isRTL
          ? ((res as any).messageAr || 'اسم مركز البصريات هذا مسجل بالفعل في قاعدة البيانات. يرجى اختيار اسم مختلف أو تعديل المتجر الحالي.')
          : (res.message || 'This optical shop name is already registered in the database. Please choose a different name or edit the existing shop.');
        setShopNameValidation({
          formatError: null,
          dbError: warningMsg,
          isChecking: false,
          isAvailable: false,
        });
      }
    } catch {
      setIsCheckingShopName(false);
      setIsShopNameTaken(false);
      setShopNameValidation(prev => ({ ...prev, isChecking: false, isAvailable: true }));
    }
  }, [isRTL]);

  const verifySubdomainAsync = useCallback(async (slug: string) => {
    const clean = slug.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!clean || clean.length < 3) {
      setSubdomainValidation({
        formatError: isRTL ? 'يجب أن يتكون الرابط من 3 أحرف أو أرقام على الأقل.' : 'Subdomain must be at least 3 alphanumeric characters.',
        dbError: null,
        isChecking: false,
        isAvailable: false,
      });
      return;
    }

    if (clean.length > 40) {
      setSubdomainValidation({
        formatError: isRTL ? 'يجب ألا يتجاوز الرابط 40 حرفاً.' : 'Subdomain cannot exceed 40 characters.',
        dbError: null,
        isChecking: false,
        isAvailable: false,
      });
      return;
    }

    setSubdomainValidation(prev => ({ ...prev, formatError: null, isChecking: true, dbError: null }));
    try {
      const res = await portalService.checkFieldAvailability('subdomain', clean);
      if (res.available) {
        setSubdomainValidation({
          formatError: null,
          dbError: null,
          isChecking: false,
          isAvailable: true,
          successMessage: isRTL ? `الرابط https://${clean}.envisioneyewear.store متاح بالكامل` : `Subdomain endpoint '${clean}' is completely available`,
        });
      } else {
        setSubdomainValidation({
          formatError: null,
          dbError: res.message || (isRTL ? `الرابط '${clean}' محجوز لمتجر آخر` : `Subdomain '${clean}' is already taken`),
          isChecking: false,
          isAvailable: false,
        });
      }
    } catch {
      setSubdomainValidation(prev => ({ ...prev, isChecking: false, isAvailable: true }));
    }
  }, [isRTL]);

  interface EmailDbStatus {
    available: boolean;
    message?: string;
    messageAr?: string;
  }

  const queryEmailInDb = useCallback(async (email: string): Promise<EmailDbStatus> => {
    const norm = email.trim().toLowerCase();
    if (emailDbStatusCacheRef.current[norm]) {
      return emailDbStatusCacheRef.current[norm];
    }
    try {
      const res = await portalService.checkFieldAvailability('email', norm);
      const mapped: EmailDbStatus = {
        available: res.available,
        message: res.message,
        messageAr: (res as any).messageAr,
      };
      emailDbStatusCacheRef.current[norm] = mapped;
      return mapped;
    } catch {
      const fallback: EmailDbStatus = { available: true };
      emailDbStatusCacheRef.current[norm] = fallback;
      return fallback;
    }
  }, []);

  // Centralized real-time cross-evaluation:
  // Step 1: Ensure email is checked in database users.
  // Step 2: Ensure owner email and staff emails (optometrist, etc.) are strictly distinct and non-overlapping.
  const evaluateEmailRoster = useCallback(
    (targetOwnerEmail: string, targetStaffList: StaffProvisionInput[]) => {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      const normOwner = targetOwnerEmail.trim().toLowerCase();

      // 1. Evaluate Owner Email
      if (!normOwner) {
        setOwnerEmailValidation({
          formatError: isRTL ? 'البريد الإلكتروني للمالك مطلوب.' : 'Owner email address is required.',
          dbError: null,
          isChecking: false,
          isAvailable: false,
        });
      } else if (!emailRegex.test(normOwner)) {
        setOwnerEmailValidation({
          formatError: isRTL ? 'صيغة البريد الإلكتروني غير صحيحة (مثال: name@domain.com).' : 'Invalid email syntax (e.g. name@domain.com).',
          dbError: null,
          isChecking: false,
          isAvailable: false,
        });
      } else {
        const cachedDb = emailDbStatusCacheRef.current[normOwner];
        if (cachedDb && !cachedDb.available) {
          const errorText = isRTL
            ? ((cachedDb as any).messageAr || cachedDb.message || 'هذا البريد الإلكتروني مسجل بالفعل في مستخدمي Supabase. يرجى اختيار بريد إلكتروني مختلف.')
            : (cachedDb.message || 'This email is already registered in Supabase users. Please choose a different email.');
          setOwnerEmailValidation({
            formatError: null,
            dbError: errorText,
            isChecking: false,
            isAvailable: false,
          });
        } else if (cachedDb && cachedDb.available) {
          // After verifying not in database users: check if matching any staff member (optometrist, etc.)
          const matchingStaff = targetStaffList.find((s) => s.email && s.email.trim().toLowerCase() === normOwner);
          if (matchingStaff) {
            const roleObj = STAFF_ROLE_OPTIONS.find((o) => o.value === matchingStaff.role);
            const roleName = isRTL ? (roleObj?.labelAr || 'أخصائي بصريات') : (roleObj?.labelEn || 'Optometrist / Staff');
            const staffName = matchingStaff.full_name?.trim() ? ` (${matchingStaff.full_name.trim()})` : '';
            const conflictMsg = isRTL
              ? `هذا البريد يطابق البريد الإلكتروني المدخل لأحد موظفي المتجر (${roleName}${staffName}). يجب أن يمتلك المالك بريداً مستقلاً عن طاقم العمل.`
              : `Duplicate email detected: This email matches the email of staff member (${roleName}${staffName}). Boutique owner and staff must have distinct email accounts.`;
            setOwnerEmailValidation({
              formatError: conflictMsg,
              dbError: null,
              isChecking: false,
              isAvailable: false,
            });
          } else {
            setOwnerEmailValidation({
              formatError: null,
              dbError: null,
              isChecking: false,
              isAvailable: true,
              successMessage: isRTL ? 'البريد متاح وغير مسجل مسبقاً' : 'Email is available for registration',
            });
          }
        }
      }

      // 2. Evaluate Each Staff Member Email
      setStaffValidations((prev) => {
        const nextVal = { ...prev };
        targetStaffList.forEach((staff, index) => {
          const staffKey = staff.id || `staff-${index}`;
          const currentStaffVal = nextVal[staffKey] || {
            nameError: null,
            passwordError: null,
            phoneFormatError: null,
            phoneDbError: null,
            isCheckingPhone: false,
          };
          const normStaff = (staff.email || '').trim().toLowerCase();

          if (!normStaff) {
            nextVal[staffKey] = {
              ...currentStaffVal,
              emailFormatError: isRTL ? 'البريد الإلكتروني للموظف مطلوب.' : 'Staff email is required.',
              emailDbError: null,
              isCheckingEmail: false,
              isEmailAvailable: false,
            };
          } else if (!emailRegex.test(normStaff)) {
            nextVal[staffKey] = {
              ...currentStaffVal,
              emailFormatError: isRTL ? 'صيغة البريد غير صحيحة.' : 'Invalid email syntax format.',
              emailDbError: null,
              isCheckingEmail: false,
              isEmailAvailable: false,
            };
          } else {
            const cachedDb = emailDbStatusCacheRef.current[normStaff];
            if (cachedDb && !cachedDb.available) {
              const errorText = isRTL
                ? ((cachedDb as any).messageAr || cachedDb.message || 'هذا البريد الإلكتروني مسجل بالفعل في مستخدمي Supabase. يرجى اختيار بريد إلكتروني مختلف.')
                : (cachedDb.message || 'This email is already registered in Supabase users. Please choose a different email.');
              nextVal[staffKey] = {
                ...currentStaffVal,
                emailFormatError: null,
                emailDbError: errorText,
                isCheckingEmail: false,
                isEmailAvailable: false,
              };
            } else if (cachedDb && cachedDb.available) {
              // After verifying not in database users:
              // Check 1: Does it match the Owner Email in Section 1?
              if (normOwner && normOwner === normStaff) {
                const staffRoleObj = STAFF_ROLE_OPTIONS.find((o) => o.value === staff.role);
                const currentStaffRole = isRTL ? (staffRoleObj?.labelAr || 'أخصائي البصريات') : (staffRoleObj?.labelEn || 'Lead Optometrist');
                const conflictMsg = isRTL
                  ? `هذا البريد يطابق البريد الإلكتروني لمالك المتجر في القسم 1. يجب أن يكون لـ (${currentStaffRole}) بريد إلكتروني مستقل عن بريد المالك.`
                  : `Duplicate email detected: This email matches the boutique owner's email address from Section 1. Staff (${currentStaffRole}) and owner must have distinct email accounts.`;
                nextVal[staffKey] = {
                  ...currentStaffVal,
                  emailFormatError: conflictMsg,
                  emailDbError: null,
                  isCheckingEmail: false,
                  isEmailAvailable: false,
                };
              } else {
                // Check 2: Does it match any other staff member?
                const duplicateOther = targetStaffList.find(
                  (s, idx) => idx !== index && s.email && s.email.trim().toLowerCase() === normStaff
                );
                if (duplicateOther) {
                  const otherRoleObj = STAFF_ROLE_OPTIONS.find((o) => o.value === duplicateOther.role);
                  const otherRole = isRTL ? (otherRoleObj?.labelAr || 'موظف آخر') : (otherRoleObj?.labelEn || 'Another staff member');
                  const otherName = duplicateOther.full_name?.trim() ? ` (${duplicateOther.full_name.trim()})` : '';
                  const conflictMsg = isRTL
                    ? `تم إدخال هذا البريد الإلكتروني لموظف آخر (${otherRole}${otherName}). يجب أن يمتلك كل موظف بريد دخول فريد.`
                    : `Duplicate email detected: This email is already assigned to another staff member (${otherRole}${otherName}). Each staff member must have a unique login email.`;
                  nextVal[staffKey] = {
                    ...currentStaffVal,
                    emailFormatError: conflictMsg,
                    emailDbError: null,
                    isCheckingEmail: false,
                    isEmailAvailable: false,
                  };
                } else {
                  nextVal[staffKey] = {
                    ...currentStaffVal,
                    emailFormatError: null,
                    emailDbError: null,
                    isCheckingEmail: false,
                    isEmailAvailable: true,
                  };
                }
              }
            }
          }
        });
        return nextVal;
      });
    },
    [isRTL]
  );

  const verifyOwnerEmailAsync = useCallback(
    async (email: string, currentStaff?: StaffProvisionInput[]) => {
      const trimmed = email.trim().toLowerCase();
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      const roster = currentStaff || staffList;

      if (!trimmed) {
        setOwnerEmailValidation({
          formatError: isRTL ? 'البريد الإلكتروني مطلوب.' : 'Owner email address is required.',
          dbError: null,
          isChecking: false,
          isAvailable: false,
        });
        evaluateEmailRoster('', roster);
        return;
      }

      if (!emailRegex.test(trimmed)) {
        setOwnerEmailValidation({
          formatError: isRTL ? 'صيغة البريد الإلكتروني غير صحيحة (مثال: name@domain.com).' : 'Invalid email syntax (e.g. name@domain.com).',
          dbError: null,
          isChecking: false,
          isAvailable: false,
        });
        return;
      }

      // Step 1: Check database users first!
      setOwnerEmailValidation((prev) => ({ ...prev, formatError: null, isChecking: true, dbError: null }));
      try {
        const res = await queryEmailInDb(trimmed);
        if (!res.available) {
          const errorText = isRTL
            ? (res.messageAr || res.message || 'هذا البريد الإلكتروني مسجل بالفعل في مستخدمي Supabase. يرجى اختيار بريد إلكتروني مختلف.')
            : (res.message || 'This email is already registered in Supabase users. Please choose a different email.');
          setOwnerEmailValidation({
            formatError: null,
            dbError: errorText,
            isChecking: false,
            isAvailable: false,
          });
          evaluateEmailRoster(trimmed, roster);
          return;
        }

        // Step 2: After verifying email is NOT in database users, cross-check against all staff members
        evaluateEmailRoster(trimmed, roster);
      } catch {
        setOwnerEmailValidation((prev) => ({ ...prev, isChecking: false, isAvailable: true }));
        evaluateEmailRoster(trimmed, roster);
      }
    },
    [isRTL, staffList, queryEmailInDb, evaluateEmailRoster]
  );

  const verifyPhoneAsync = useCallback(async (phone: string) => {
    const trimmed = phone.trim();
    if (!trimmed) {
      setPhoneValidation({
        formatError: null,
        dbError: null,
        isChecking: false,
        isAvailable: true,
      });
      return;
    }

    const digits = trimmed.replace(/[^\d+]/g, '');
    if (digits.length < 7) {
      setPhoneValidation({
        formatError: isRTL ? 'يجب أن يتكون رقم الهاتف من 7 أرقام على الأقل.' : 'Phone number must have at least 7 digits.',
        dbError: null,
        isChecking: false,
        isAvailable: false,
      });
      return;
    }

    const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
    if (!phoneRegex.test(trimmed)) {
      setPhoneValidation({
        formatError: isRTL ? 'صيغة رقم الهاتف غير صالحة (مثال: 4567 9123 7 962+).' : 'Invalid phone format (e.g. +962 7 9123 4567).',
        dbError: null,
        isChecking: false,
        isAvailable: false,
      });
      return;
    }

    setPhoneValidation(prev => ({ ...prev, formatError: null, isChecking: true, dbError: null }));
    try {
      const res = await portalService.checkFieldAvailability('phone', trimmed);
      if (res.available) {
        setPhoneValidation({
          formatError: null,
          dbError: null,
          isChecking: false,
          isAvailable: true,
          successMessage: isRTL ? 'رقم الهاتف متاح وغير مرتبط بحساب آخر' : 'Phone number is available and unlinked',
        });
      } else {
        setPhoneValidation({
          formatError: null,
          dbError: res.message || (isRTL ? 'رقم الهاتف مرتبط بحساب آخر بالفعل.' : 'This phone number is already linked to an existing account.'),
          isChecking: false,
          isAvailable: false,
        });
      }
    } catch {
      setPhoneValidation(prev => ({ ...prev, isChecking: false, isAvailable: true }));
    }
  }, [isRTL]);

  const verifyStaffEmailAsync = useCallback(
    async (index: number, email: string, currentOwner?: string, currentStaff?: StaffProvisionInput[]) => {
      const roster = currentStaff || staffList;
      const targetOwner = currentOwner !== undefined ? currentOwner : ownerEmail;
      const staffMember = roster[index];
      const staffKey = staffMember?.id || `staff-${index}`;
      const trimmed = email.trim().toLowerCase();
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

      if (!trimmed) {
        setStaffValidations((prev) => ({
          ...prev,
          [staffKey]: {
            ...(prev[staffKey] || { nameError: null, passwordError: null, phoneFormatError: null, phoneDbError: null, isCheckingPhone: false }),
            emailFormatError: isRTL ? 'البريد الإلكتروني للموظف مطلوب.' : 'Staff email is required.',
            emailDbError: null,
            isCheckingEmail: false,
            isEmailAvailable: false,
          },
        }));
        evaluateEmailRoster(targetOwner, roster);
        return;
      }

      if (!emailRegex.test(trimmed)) {
        setStaffValidations((prev) => ({
          ...prev,
          [staffKey]: {
            ...(prev[staffKey] || { nameError: null, passwordError: null, phoneFormatError: null, phoneDbError: null, isCheckingPhone: false }),
            emailFormatError: isRTL ? 'صيغة البريد غير صحيحة.' : 'Invalid email syntax format.',
            emailDbError: null,
            isCheckingEmail: false,
            isEmailAvailable: false,
          },
        }));
        return;
      }

      // Step 1: Check database users first!
      setStaffValidations((prev) => ({
        ...prev,
        [staffKey]: {
          ...(prev[staffKey] || { nameError: null, passwordError: null, phoneFormatError: null, phoneDbError: null, isCheckingPhone: false }),
          emailFormatError: null,
          emailDbError: null,
          isCheckingEmail: true,
          isEmailAvailable: false,
        },
      }));

      try {
        const res = await queryEmailInDb(trimmed);
        if (!res.available) {
          const errorText = isRTL
            ? (res.messageAr || res.message || 'هذا البريد الإلكتروني مسجل بالفعل في مستخدمي Supabase. يرجى اختيار بريد إلكتروني مختلف.')
            : (res.message || 'This email is already registered in Supabase users. Please choose a different email.');
          setStaffValidations((prev) => ({
            ...prev,
            [staffKey]: {
              ...(prev[staffKey] || { nameError: null, passwordError: null, phoneFormatError: null, phoneDbError: null, isCheckingPhone: false }),
              emailFormatError: null,
              emailDbError: errorText,
              isCheckingEmail: false,
              isEmailAvailable: false,
            },
          }));
          evaluateEmailRoster(targetOwner, roster);
          return;
        }

        // Step 2: After verifying email is NOT in database users, cross-check against owner and all staff
        evaluateEmailRoster(targetOwner, roster);
      } catch {
        setStaffValidations((prev) => ({
          ...prev,
          [staffKey]: {
            ...(prev[staffKey] || { nameError: null, passwordError: null, phoneFormatError: null, phoneDbError: null, isCheckingPhone: false }),
            isCheckingEmail: false,
            isEmailAvailable: true,
          },
        }));
        evaluateEmailRoster(targetOwner, roster);
      }
    },
    [isRTL, staffList, ownerEmail, queryEmailInDb, evaluateEmailRoster]
  );

  // Field Change Handlers with immediate format validation and debounced DB checks
  const handleShopNameChange = (val: string) => {
    setShopName(val);
    const trimmed = val.trim();
    if (!trimmed) {
      setIsCheckingShopName(false);
      setIsShopNameTaken(false);
      setShopNameValidation({
        formatError: isRTL ? 'اسم المتجر مطلوب.' : 'Shop name is required.',
        dbError: null,
        isChecking: false,
        isAvailable: false,
      });
    } else if (trimmed.length < 3) {
      setIsCheckingShopName(false);
      setIsShopNameTaken(false);
      setShopNameValidation({
        formatError: isRTL ? 'يجب أن يتكون اسم المتجر من 3 أحرف على الأقل.' : 'Shop name must be at least 3 characters.',
        dbError: null,
        isChecking: false,
        isAvailable: false,
      });
    } else {
      setIsCheckingShopName(true);
      setIsShopNameTaken(false);
      setShopNameValidation(prev => ({ ...prev, formatError: null, isChecking: true, dbError: null }));
      if (checkTimersRef.current['shop_name']) {
        clearTimeout(checkTimersRef.current['shop_name']);
      }
      checkTimersRef.current['shop_name'] = setTimeout(() => {
        verifyShopNameAsync(trimmed);
      }, 350);
    }

    // Auto-slugify shop name
    const generated = val
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    setSubdomainSlug(generated);
    if (generated.length >= 3) {
      if (checkTimersRef.current['subdomain']) {
        clearTimeout(checkTimersRef.current['subdomain']);
      }
      setSubdomainValidation(prev => ({ ...prev, formatError: null, isChecking: true, dbError: null }));
      checkTimersRef.current['subdomain'] = setTimeout(() => {
        verifySubdomainAsync(generated);
      }, 400);
    }
  };

  const handleShopNameBlur = () => {
    if (checkTimersRef.current['shop_name']) {
      clearTimeout(checkTimersRef.current['shop_name']);
    }
    const trimmed = shopName.trim();
    if (trimmed.length >= 3) {
      verifyShopNameAsync(trimmed);
    } else if (!trimmed) {
      setIsCheckingShopName(false);
      setIsShopNameTaken(false);
      setShopNameValidation({
        formatError: isRTL ? 'اسم المتجر مطلوب.' : 'Shop name is required.',
        dbError: null,
        isChecking: false,
        isAvailable: false,
      });
    } else {
      setIsCheckingShopName(false);
      setIsShopNameTaken(false);
      setShopNameValidation({
        formatError: isRTL ? 'يجب أن يتكون اسم المتجر من 3 أحرف على الأقل.' : 'Shop name must be at least 3 characters.',
        dbError: null,
        isChecking: false,
        isAvailable: false,
      });
    }
  };

  const handleLocationChange = (val: string) => {
    setLocation(val);
    if (!val.trim()) {
      setLocationError(isRTL ? 'الموقع والمدينة مطلوب.' : 'Physical hub and city location is required.');
    } else if (val.trim().length < 3) {
      setLocationError(isRTL ? 'يرجى إدخال تفاصيل الموقع (3 أحرف على الأقل).' : 'Please enter valid location (at least 3 characters).');
    } else {
      setLocationError(null);
    }
  };

  const handleSubdomainChange = (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSubdomainSlug(clean);

    if (!clean) {
      setSubdomainValidation({
        formatError: isRTL ? 'الرابط المخصص مطلوب.' : 'Subdomain endpoint is required.',
        dbError: null,
        isChecking: false,
        isAvailable: false,
      });
    } else if (clean.length < 3) {
      setSubdomainValidation({
        formatError: isRTL ? 'يجب أن يتكون الرابط من 3 أحرف على الأقل.' : 'Subdomain must be at least 3 characters.',
        dbError: null,
        isChecking: false,
        isAvailable: false,
      });
    } else if (clean.startsWith('-') || clean.endsWith('-')) {
      setSubdomainValidation({
        formatError: isRTL ? 'لا يمكن أن يبدأ الرابط أو ينتهي بفاصلة (-).' : 'Subdomain cannot start or end with a hyphen.',
        dbError: null,
        isChecking: false,
        isAvailable: false,
      });
    } else {
      setSubdomainValidation(prev => ({ ...prev, formatError: null, isChecking: true, dbError: null }));
      if (checkTimersRef.current['subdomain']) {
        clearTimeout(checkTimersRef.current['subdomain']);
      }
      checkTimersRef.current['subdomain'] = setTimeout(() => {
        verifySubdomainAsync(clean);
      }, 450);
    }
  };

  const handleSubdomainBlur = () => {
    if (checkTimersRef.current['subdomain']) {
      clearTimeout(checkTimersRef.current['subdomain']);
    }
    if (subdomainSlug.length >= 3 && !subdomainSlug.startsWith('-') && !subdomainSlug.endsWith('-')) {
      verifySubdomainAsync(subdomainSlug);
    }
  };

  const handleOwnerNameChange = (val: string) => {
    setOwnerName(val);
    if (!val.trim()) {
      setOwnerNameError(isRTL ? 'اسم المالك أو المدير مطلوب.' : 'Owner / principal optician name is required.');
    } else if (val.trim().length < 2) {
      setOwnerNameError(isRTL ? 'يرجى إدخال اسم كامل (حرفين على الأقل).' : 'Please enter full name (at least 2 characters).');
    } else {
      setOwnerNameError(null);
    }
  };

  const handleOwnerEmailChange = (val: string) => {
    setOwnerEmail(val);
    const trimmed = val.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!trimmed) {
      setOwnerEmailValidation({
        formatError: isRTL ? 'البريد الإلكتروني للمالك مطلوب.' : 'Owner email is required.',
        dbError: null,
        isChecking: false,
        isAvailable: false,
      });
      evaluateEmailRoster('', staffList);
    } else if (!emailRegex.test(trimmed)) {
      setOwnerEmailValidation({
        formatError: isRTL ? 'صيغة البريد الإلكتروني غير صحيحة.' : 'Invalid email syntax format.',
        dbError: null,
        isChecking: false,
        isAvailable: false,
      });
    } else {
      setOwnerEmailValidation(prev => ({ ...prev, formatError: null, isChecking: true, dbError: null }));
      if (checkTimersRef.current['owner_email']) {
        clearTimeout(checkTimersRef.current['owner_email']);
      }
      checkTimersRef.current['owner_email'] = setTimeout(() => {
        verifyOwnerEmailAsync(trimmed, staffList);
      }, 400);
    }
  };

  const handleOwnerEmailBlur = () => {
    if (checkTimersRef.current['owner_email']) {
      clearTimeout(checkTimersRef.current['owner_email']);
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (emailRegex.test(ownerEmail.trim().toLowerCase())) {
      verifyOwnerEmailAsync(ownerEmail, staffList);
    }
  };

  const handlePrimaryPhoneChange = (val: string) => {
    setPrimaryPhone(val);
    const trimmed = val.trim();
    if (!trimmed) {
      setPhoneValidation({
        formatError: null,
        dbError: null,
        isChecking: false,
        isAvailable: true,
      });
      return;
    }

    const digits = trimmed.replace(/[^\d+]/g, '');
    if (digits.length < 7) {
      setPhoneValidation({
        formatError: isRTL ? 'يجب أن يتكون رقم الهاتف من 7 أرقام على الأقل.' : 'Phone number must have at least 7 digits.',
        dbError: null,
        isChecking: false,
        isAvailable: false,
      });
    } else {
      setPhoneValidation(prev => ({ ...prev, formatError: null, isChecking: true, dbError: null }));
      if (checkTimersRef.current['primary_phone']) {
        clearTimeout(checkTimersRef.current['primary_phone']);
      }
      checkTimersRef.current['primary_phone'] = setTimeout(() => {
        verifyPhoneAsync(trimmed);
      }, 500);
    }
  };

  const handlePrimaryPhoneBlur = () => {
    if (checkTimersRef.current['primary_phone']) {
      clearTimeout(checkTimersRef.current['primary_phone']);
    }
    if (primaryPhone.trim()) {
      verifyPhoneAsync(primaryPhone);
    }
  };

  // Staff modifier helpers
  const handleAddStaffRow = () => {
    const newId = 'staff-' + Date.now();
    setStaffList((prev) => [
      ...prev,
      {
        id: newId,
        full_name: '',
        role: 'optician',
        email: '',
        password: generateStaffPassword(),
        phone_number: `${agentDialInfo.dialCode} `,
      },
    ]);
  };

  const handleRemoveStaffRow = (index: number) => {
    if (staffList.length <= 1) return;
    const removedMember = staffList[index];
    const key = removedMember?.id || `staff-${index}`;
    const nextList = staffList.filter((_, i) => i !== index);
    setStaffList(nextList);
    setStaffValidations((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
    evaluateEmailRoster(ownerEmail, nextList);
  };

  const handleUpdateStaff = (index: number, field: keyof StaffProvisionInput, value: string) => {
    const staffMember = staffList[index];
    const staffKey = staffMember?.id || `staff-${index}`;

    setStaffList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });

    if (field === 'full_name') {
      const trimmed = value.trim();
      setStaffValidations((prev) => ({
        ...prev,
        [staffKey]: {
          ...(prev[staffKey] || { emailFormatError: null, emailDbError: null, isCheckingEmail: false, isEmailAvailable: false, passwordError: null, phoneFormatError: null, phoneDbError: null, isCheckingPhone: false }),
          nameError: !trimmed
            ? (isRTL ? 'الاسم مطلوب.' : 'Full name is required.')
            : trimmed.length < 2
            ? (isRTL ? 'الاسم قصير جداً (حرفين على الأقل).' : 'Name must be at least 2 characters.')
            : null,
        },
      }));
    } else if (field === 'password') {
      const trimmed = value.trim();
      setStaffValidations((prev) => ({
        ...prev,
        [staffKey]: {
          ...(prev[staffKey] || { nameError: null, emailFormatError: null, emailDbError: null, isCheckingEmail: false, isEmailAvailable: false, phoneFormatError: null, phoneDbError: null, isCheckingPhone: false }),
          passwordError: !trimmed
            ? (isRTL ? 'كلمة المرور مطلوبة.' : 'Password is required.')
            : trimmed.length < 8
            ? (isRTL ? 'يجب أن تتكون كلمة المرور من 8 خانات على الأقل.' : 'Password must be at least 8 characters.')
            : null,
        },
      }));
    } else if (field === 'email') {
      const trimmed = value.trim().toLowerCase();
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

      if (!trimmed) {
        setStaffValidations((prev) => ({
          ...prev,
          [staffKey]: {
            ...(prev[staffKey] || { nameError: null, passwordError: null, phoneFormatError: null, phoneDbError: null, isCheckingPhone: false }),
            emailFormatError: isRTL ? 'البريد الإلكتروني للموظف مطلوب.' : 'Staff email is required.',
            emailDbError: null,
            isCheckingEmail: false,
            isEmailAvailable: false,
          },
        }));
        const updatedStaff = staffList.map((s, i) => (i === index ? { ...s, email: value } : s));
        evaluateEmailRoster(ownerEmail, updatedStaff);
      } else if (!emailRegex.test(trimmed)) {
        setStaffValidations((prev) => ({
          ...prev,
          [staffKey]: {
            ...(prev[staffKey] || { nameError: null, passwordError: null, phoneFormatError: null, phoneDbError: null, isCheckingPhone: false }),
            emailFormatError: isRTL ? 'صيغة البريد غير صحيحة.' : 'Invalid email syntax format.',
            emailDbError: null,
            isCheckingEmail: false,
            isEmailAvailable: false,
          },
        }));
      } else {
        setStaffValidations((prev) => ({
          ...prev,
          [staffKey]: {
            ...(prev[staffKey] || { nameError: null, passwordError: null, phoneFormatError: null, phoneDbError: null, isCheckingPhone: false }),
            emailFormatError: null,
            emailDbError: null,
            isCheckingEmail: true,
            isEmailAvailable: false,
          },
        }));
        const timerId = `staff_email_${staffKey}`;
        if (checkTimersRef.current[timerId]) {
          clearTimeout(checkTimersRef.current[timerId]);
        }
        checkTimersRef.current[timerId] = setTimeout(() => {
          const updatedStaff = staffList.map((s, i) => (i === index ? { ...s, email: value } : s));
          verifyStaffEmailAsync(index, trimmed, ownerEmail, updatedStaff);
        }, 400);
      }
    } else if (field === 'phone_number') {
      const trimmed = value.trim();
      const isJustDialCode =
        !trimmed ||
        trimmed === agentDialInfo.dialCode ||
        trimmed === `${agentDialInfo.dialCode} ` ||
        Object.values(COUNTRY_DIAL_CODES).some((c) => trimmed === c.dialCode || trimmed === `${c.dialCode} `);

      if (isJustDialCode) {
        const timerId = `staff_phone_${staffKey}`;
        if (checkTimersRef.current[timerId]) {
          clearTimeout(checkTimersRef.current[timerId]);
        }
        setStaffValidations((prev) => ({
          ...prev,
          [staffKey]: {
            ...(prev[staffKey] || { nameError: null, emailFormatError: null, emailDbError: null, isCheckingEmail: false, isEmailAvailable: false, passwordError: null }),
            phoneFormatError: null,
            phoneDbError: null,
            isCheckingPhone: false,
          },
        }));
      } else {
        const digits = trimmed.replace(/[^\d+]/g, '');
        if (digits.length < 7) {
          setStaffValidations((prev) => ({
            ...prev,
            [staffKey]: {
              ...(prev[staffKey] || { nameError: null, emailFormatError: null, emailDbError: null, isCheckingEmail: false, isEmailAvailable: false, passwordError: null }),
              phoneFormatError: isRTL ? 'يجب أن يتكون رقم الهاتف من 7 أرقام على الأقل.' : 'Phone must be at least 7 digits.',
              phoneDbError: null,
              isCheckingPhone: false,
            },
          }));
        } else {
          setStaffValidations((prev) => ({
            ...prev,
            [staffKey]: {
              ...(prev[staffKey] || { nameError: null, emailFormatError: null, emailDbError: null, isCheckingEmail: false, isEmailAvailable: false, passwordError: null }),
              phoneFormatError: null,
              phoneDbError: null,
              isCheckingPhone: true,
            },
          }));
          const timerId = `staff_phone_${staffKey}`;
          if (checkTimersRef.current[timerId]) {
            clearTimeout(checkTimersRef.current[timerId]);
          }
          checkTimersRef.current[timerId] = setTimeout(async () => {
            try {
              const res = await portalService.checkFieldAvailability('phone', trimmed);
              setStaffValidations((prev) => ({
                ...prev,
                [staffKey]: {
                  ...(prev[staffKey] || { nameError: null, emailFormatError: null, emailDbError: null, isCheckingEmail: false, isEmailAvailable: false, passwordError: null }),
                  phoneFormatError: null,
                  phoneDbError: res.available ? null : (res.message || (isRTL ? 'رقم الهاتف مرتبط بحساب آخر بالفعل.' : 'Phone already linked to another account.')),
                  isCheckingPhone: false,
                },
              }));
            } catch {
              setStaffValidations((prev) => ({
                ...prev,
                [staffKey]: {
                  ...(prev[staffKey] || { nameError: null, emailFormatError: null, emailDbError: null, isCheckingEmail: false, isEmailAvailable: false, passwordError: null }),
                  isCheckingPhone: false,
                },
              }));
            }
          }, 450);
        }
      }
    }
  };

  const handleStaffBlur = (index: number, field: keyof StaffProvisionInput) => {
    const member = staffList[index];
    if (!member) return;
    const staffKey = member.id || `staff-${index}`;

    if (field === 'email') {
      const timerId = `staff_email_${staffKey}`;
      if (checkTimersRef.current[timerId]) {
        clearTimeout(checkTimersRef.current[timerId]);
      }
      if (member.email.trim()) {
        verifyStaffEmailAsync(index, member.email, ownerEmail, staffList);
      }
    } else if (field === 'phone_number') {
      const timerId = `staff_phone_${staffKey}`;
      if (checkTimersRef.current[timerId]) {
        clearTimeout(checkTimersRef.current[timerId]);
      }
      const trimmed = (member.phone_number || '').trim();
      const isJustDialCode =
        !trimmed ||
        trimmed === agentDialInfo.dialCode ||
        trimmed === `${agentDialInfo.dialCode} ` ||
        Object.values(COUNTRY_DIAL_CODES).some((c) => trimmed === c.dialCode || trimmed === `${c.dialCode} `);

      if (isJustDialCode) {
        setStaffValidations((prev) => ({
          ...prev,
          [staffKey]: {
            ...(prev[staffKey] || { nameError: null, emailFormatError: null, emailDbError: null, isCheckingEmail: false, isEmailAvailable: false, passwordError: null }),
            phoneFormatError: null,
            phoneDbError: null,
            isCheckingPhone: false,
          },
        }));
      } else {
        const digits = trimmed.replace(/[^\d+]/g, '');
        if (digits.length >= 7) {
          portalService
            .checkFieldAvailability('phone', trimmed)
            .then((res) => {
              setStaffValidations((prev) => ({
                ...prev,
                [staffKey]: {
                  ...(prev[staffKey] || { nameError: null, emailFormatError: null, emailDbError: null, isCheckingEmail: false, isEmailAvailable: false, passwordError: null }),
                  phoneFormatError: null,
                  phoneDbError: res.available ? null : (res.message || (isRTL ? 'رقم الهاتف مرتبط بحساب آخر بالفعل.' : 'Phone already linked to another account.')),
                  isCheckingPhone: false,
                },
              }));
            })
            .catch(() => {});
        }
      }
    }
  };

  const handleRegeneratePassword = (index: number) => {
    handleUpdateStaff(index, 'password', generateStaffPassword());
  };

  const handleAutoGenerateAllPasswords = () => {
    setStaffList((prev) =>
      prev.map((s, idx) => {
        const pwd = generateStaffPassword();
        const staffKey = s.id || `staff-${idx}`;
        setStaffValidations((vPrev) => ({
          ...vPrev,
          [staffKey]: {
            ...(vPrev[staffKey] || { nameError: null, emailFormatError: null, emailDbError: null, isCheckingEmail: false, isEmailAvailable: false, phoneFormatError: null, phoneDbError: null, isCheckingPhone: false }),
            passwordError: null,
          },
        }));
        return {
          ...s,
          password: pwd,
        };
      })
    );
  };

  const handleCopyStaffSummary = () => {
    const lines = staffList.map(
      (s, idx) =>
        `${idx + 1}. ${s.full_name || 'Staff Member'} (${s.role})\n   Email: ${s.email}${s.phone_number ? `\n   Phone: ${s.phone_number}` : ''}\n   Temp Pass: ${s.password || '#Optic2025!'}`
    );
    navigator.clipboard.writeText(
      `👓 ${shopName} - Initial Staff Accounts:\n${lines.join('\n\n')}\nPortal: https://${subdomainSlug}.envisioneyewear.store`
    );
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2200);
  };

  // Preset quick fill
  const handleFillDemoIdentity = () => {
    const presetShop = 'Al-Noor Luxury Eyewear';
    const presetLocation = 'Amman - Abdoun Galleria Mall';
    const presetSlug = 'alnoor-optics';
    const presetOwnerName = 'Dr. Tariq Al-Husseini';
    const presetOwnerEmail = 'tariq@alnooroptics.jo';

    setShopName(presetShop);
    setLocation(presetLocation);
    setLocationError(null);
    setSubdomainSlug(presetSlug);
    setOwnerName(presetOwnerName);
    setOwnerNameError(null);
    setOwnerEmail(presetOwnerEmail);
    setPrimaryColor('#4338ca');
    setSecondaryColor('#006c4a');
    setSelectedTierKey('pro');

    const presetStaff: StaffProvisionInput[] = [
      {
        id: 'staff-1',
        full_name: 'Dr. Omar Zaidan',
        role: 'optometrist',
        email: 'omar@alnooroptics.jo',
        password: '#Optic2025!',
        phone_number: '+962 7 9555 1234',
      },
      {
        id: 'staff-2',
        full_name: 'Rania Khasawneh',
        role: 'shop_owner',
        email: 'rania@alnooroptics.jo',
        password: '#Optic2025!',
        phone_number: '+962 7 9666 5678',
      },
      {
        id: 'staff-3',
        full_name: 'Laith Haddad',
        role: 'optician',
        email: 'laith@alnooroptics.jo',
        password: '#Optic2025!',
        phone_number: '+962 7 9777 9012',
      },
    ];

    setStaffList(presetStaff);

    // Run real-time pre-checks immediately for the populated demo preset
    verifyShopNameAsync(presetShop);
    verifySubdomainAsync(presetSlug);
    verifyOwnerEmailAsync(presetOwnerEmail, presetStaff);
    presetStaff.forEach((s, idx) => {
      verifyStaffEmailAsync(idx, s.email);
    });
  };

  // Compute form validity and DB check statuses
  const isCheckingDb =
    isCheckingShopName ||
    shopNameValidation.isChecking ||
    subdomainValidation.isChecking ||
    ownerEmailValidation.isChecking ||
    phoneValidation.isChecking ||
    Object.values(staffValidations).some((s) => s.isCheckingEmail || s.isCheckingPhone);

  const isShopNameValid =
    shopName.trim().length >= 3 &&
    !shopNameValidation.formatError &&
    !shopNameValidation.dbError &&
    !isShopNameTaken &&
    !isCheckingShopName &&
    shopNameValidation.isAvailable;

  const isLocationValid = location.trim().length >= 3 && !locationError;

  const isSubdomainValid =
    subdomainSlug.trim().length >= 3 &&
    !subdomainValidation.formatError &&
    !subdomainValidation.dbError &&
    subdomainValidation.isAvailable;

  const isOwnerNameValid = ownerName.trim().length >= 2 && !ownerNameError;

  const isOwnerEmailValid =
    ownerEmail.trim().length > 0 &&
    !ownerEmailValidation.formatError &&
    !ownerEmailValidation.dbError &&
    ownerEmailValidation.isAvailable;

  const isPhoneValid =
    !primaryPhone.trim() ||
    (!phoneValidation.formatError && !phoneValidation.dbError && phoneValidation.isAvailable);

  const areStaffValid =
    staffList.length > 0 &&
    staffList.every((s, idx) => {
      const key = s.id || `staff-${idx}`;
      const val = staffValidations[key];
      const nameOk = s.full_name.trim().length >= 2 && (!val || !val.nameError);
      const emailOk =
        s.email.trim().length > 0 &&
        Boolean(val && !val.emailFormatError && !val.emailDbError && val.isEmailAvailable);
      const pwdOk = (s.password || '').trim().length >= 8 && (!val || !val.passwordError);
      const trimmedPhone = s.phone_number?.trim() || '';
      const isJustDial =
        !trimmedPhone ||
        trimmedPhone === agentDialInfo.dialCode ||
        trimmedPhone === `${agentDialInfo.dialCode} ` ||
        Object.values(COUNTRY_DIAL_CODES).some((c) => trimmedPhone === c.dialCode || trimmedPhone === `${c.dialCode} `);
      const phoneOk = isJustDial || (!val?.phoneFormatError && !val?.phoneDbError);
      return nameOk && emailOk && pwdOk && phoneOk;
    });

  const isFormValid =
    isShopNameValid &&
    isLocationValid &&
    isSubdomainValid &&
    isOwnerNameValid &&
    isOwnerEmailValid &&
    isPhoneValid &&
    areStaffValid &&
    pricingResult.ok;

  // Scroll to section when stepper capsules are clicked
  const handleGoToStep = (stepNumber: number) => {
    setActiveStep(stepNumber);
    const targetElement = document.getElementById(`wizard-section-${stepNumber}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Primary submission
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (ratesLoading) {
      setErrorMessage(
        isRTL ? 'جاري احتساب الأسعار...' : 'Calculating prices…'
      );
      return;
    }

    if (!pricingResult.ok) {
      setErrorMessage(
        pricingResult.reason === 'unsupported_country'
          ? (isRTL
              ? 'ملف الوكيل الخاص بك لا يحتوي على دولة مدعومة، لذلك لا يمكن احتساب أسعار الاشتراك. يرجى التواصل مع المسؤول.'
              : 'Your agent profile has no supported country, so subscription prices cannot be calculated. Contact the administrator.')
          : (isRTL
              ? 'أسعار الصرف الحية غير متوفرة حالياً. يرجى المحاولة مرة أخرى بعد لحظات.'
              : 'Live exchange rates are currently unavailable. Please try again in a moment.')
      );
      return;
    }

    if (isLogoUploading || isBgUploading) {
      setErrorMessage(
        isRTL
          ? 'يرجى الانتظار حتى يكتمل رفع الصور إلى Cloudinary قبل المتابعة.'
          : 'Please wait for image uploads to Cloudinary to complete before submitting.'
      );
      return;
    }

    if (isCheckingDb) {
      setErrorMessage(
        isRTL
          ? 'جاري التحقق من التوفر في قاعدة البيانات، يرجى الانتظار لحظة...'
          : 'Database availability checks are still in progress. Please wait a moment...'
      );
      return;
    }

    if (!isFormValid) {
      setErrorMessage(
        isRTL
          ? 'يرجى تصحيح الأخطاء والتأكد من استكمال كافة الحقول وتجاوز الفحوصات قبل المتابعة.'
          : 'Please resolve validation errors and ensure all database uniqueness checks pass before submitting.'
      );
      if (!isShopNameValid || !isSubdomainValid || !isLocationValid || !isOwnerEmailValid || !isOwnerNameValid) {
        handleGoToStep(1);
      } else if (!areStaffValid) {
        handleGoToStep(4);
      }
      return;
    }

    if (!shopName.trim() || !subdomainSlug.trim() || !location.trim() || !ownerEmail.trim()) {
      setErrorMessage(
        isRTL
          ? 'يرجى تعبئة جميع بيانات المتجر الأساسية.'
          : 'Please fill in all mandatory shop identity details (Name, Location, Email, Subdomain).'
      );
      handleGoToStep(1);
      return;
    }

    // Validate staff members
    for (let i = 0; i < staffList.length; i++) {
      const s = staffList[i];
      if (!s.full_name.trim() || !s.email.trim()) {
        setErrorMessage(
          isRTL
            ? `يرجى إكمال بيانات الموظف رقم ${i + 1} (الاسم والبريد الإلكتروني).`
            : `Please complete all details for staff member #${i + 1} (Full Name and Login Email).`
        );
        handleGoToStep(4);
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const cleanSlug = subdomainSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    const cleanShopPayload = {
      shop_name: shopName.trim(),
      location: location.trim(),
      owner_email: ownerEmail.trim().toLowerCase(),
      tier: currentTierInfo.dbTier,
      agent_id: agentId,
      ...(pricingResult.ok
        ? {
            country_code: pricingResult.pricing.country_code,
            currency_code: pricingResult.pricing.currency_code,
            currency_symbol: pricingResult.pricing.currency_symbol,
            tier_1_price: pricingResult.pricing.tier_1_price,
            tier_2_price: pricingResult.pricing.tier_2_price,
            tier_3_price: pricingResult.pricing.tier_3_price,
            tier_4_price: pricingResult.pricing.tier_4_price,
          }
        : {}),
    };

    const cleanConfigPayload = {
      subdomain_slug: cleanSlug,
      logo_url: logoUrl.trim(),
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      background_image_url: bgImageUrl.trim(),
      bg_image_url: bgImageUrl.trim(),
      config_json: {
        subdomain_slug: cleanSlug,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        logo_url: logoUrl.trim(),
        bg_image_url: bgImageUrl.trim(),
        owner_name: ownerName.trim(),
        license_number: licenseNumber.trim(),
        primary_phone: primaryPhone.trim(),
        physical_address: physicalAddress.trim(),
        operating_hours: operatingHours.trim(),
        billing_cycle: billingCycle,
        send_invite_email: sendInviteEmail,
        force_password_reset: forcePasswordReset,
      },
    };

    const cleanStaffPayload: StaffProvisionInput[] = staffList.map((s) => {
      const p = (s.phone_number || '').trim();
      const isJustDial =
        !p ||
        p === agentDialInfo.dialCode ||
        p === `${agentDialInfo.dialCode} ` ||
        Object.values(COUNTRY_DIAL_CODES).some((c) => p === c.dialCode || p === `${c.dialCode} `);
      return {
        full_name: s.full_name.trim(),
        email: s.email.trim().toLowerCase(),
        password: (s.password || generateStaffPassword()).trim(),
        phone_number: isJustDial ? '' : p,
        role: s.role,
      };
    });

    const result = await onSubmitOnboard(cleanShopPayload, cleanConfigPayload, cleanStaffPayload);

    setIsSubmitting(false);

    if (result.success && result.shop) {
      if (result.credentials && result.credentials.length > 0) {
        setProvisionedModalData({
          shop: result.shop,
          credentials: result.credentials,
        });
      } else {
        onShopOnboarded(result.shop);
      }
    } else {
      setErrorMessage(
        result.error ||
          (isRTL ? 'فشل تسجيل المتجر. يرجى المحاولة مرة أخرى.' : 'Failed to onboard shop. Please try again.')
      );
    }
  };

  // Keyboard shortcut listener for Alt + Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'Enter') {
        if (!isSubmitting && isFormValid && !isCheckingDb) {
          handleSubmit();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFormValid, isCheckingDb, isSubmitting, handleSubmit]);

  // Copy helpers
  const handleCopySingle = (textToCopy: string, index: number) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAll = () => {
    if (!provisionedModalData) return;
    const { shop, credentials } = provisionedModalData;
    const lines = [
      `👓 *${shop.shop_name}* - OpticPortal Staff Credentials`,
      `📍 Location: ${shop.location}`,
      `🌐 Portal: https://${shop.config?.subdomain_slug || 'shop'}.envisioneyewear.store`,
      `----------------------------------------`,
    ];

    credentials.forEach((c, idx) => {
      lines.push(`${idx + 1}. *${c.full_name}* (${c.role})`);
      lines.push(`   Email: ${c.email}`);
      if (c.password) lines.push(`   Temp Password: ${c.password}`);
      lines.push('');
    });

    lines.push(`Login at: https://${shop.config?.subdomain_slug || 'shop'}.envisioneyewear.store/login`);
    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  return (
    <div className="w-full flex flex-col font-sans">
      {/* ========================================================================= */}
      {/* 1. STEPPER & BREADCRUMB NAVIGATION BAR (Sticky on >= md, static on phones) */}
      {/* ========================================================================= */}
      <div className="md:sticky md:top-16 lg:top-20 z-30 w-full bg-[#faf8ff]/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          {/* Breadcrumb & Back Action */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onCancel}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#eaedff] hover:bg-[#e2e7ff] text-[#464554] hover:text-[#131b2e] text-xs font-semibold transition-all"
            >
              <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
              <span>{isRTL ? 'العودة للقائمة' : 'Back to Directory'}</span>
            </button>
            <span className="text-[#c7c4d7] hidden sm:inline">/</span>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-[#777586] font-semibold hidden sm:inline">
                {isRTL ? 'معالج التسجيل' : 'Onboarding Wizard'}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#2a14b4]/10 text-[#2a14b4] text-[11px] font-mono font-semibold">
                {isRTL ? 'شريك عمولة 50/50' : 'Tier 50/50 Partner'}
              </span>
            </div>
          </div>

          {/* Quick Contextual Agent Status */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[#464554] font-mono text-xs">
              <span className="w-2 h-2 rounded-full bg-[#006c4a]" />
              <span>Supabase Provisioning Engine</span>
              <span className="text-[#777586]">•</span>
              <span className="text-[#2a14b4] font-semibold">{agentName}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e2e7ff] text-[#131b2e] text-xs font-medium">
              <CheckCircle className="w-3.5 h-3.5 text-[#006c4a]" />
              <span>Auto-Binding Active</span>
            </div>
          </div>
        </div>

        {/* Stepper 4-Stage Capsule Track */}
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 pb-2.5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 sm:gap-2 bg-[#f2f3ff] p-1.5 rounded-xl">
            {/* Step 1 */}
            <button
              type="button"
              onClick={() => handleGoToStep(1)}
              className={`min-h-[48px] flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-lg text-left rtl:text-right transition-all ${
                activeStep === 1
                  ? 'bg-white shadow-xs'
                  : 'hover:bg-white/60 text-[#464554]'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                  activeStep === 1
                    ? 'bg-[#2a14b4] text-white shadow-xs'
                    : 'bg-[#eaedff] text-[#464554]'
                }`}
              >
                1
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-bold text-[#131b2e] truncate">
                  {isRTL ? 'هوية المتجر' : 'Boutique Identity'}
                </span>
                <span className="block font-mono text-[10px] text-[#777586] truncate">
                  {isRTL ? 'البيانات والرابط' : 'Credentials & Domain'}
                </span>
              </div>
            </button>

            {/* Step 2 */}
            <button
              type="button"
              onClick={() => handleGoToStep(2)}
              className={`min-h-[48px] flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-lg text-left rtl:text-right transition-all ${
                activeStep === 2
                  ? 'bg-white shadow-xs'
                  : 'hover:bg-white/60 text-[#464554]'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                  activeStep === 2
                    ? 'bg-[#2a14b4] text-white shadow-xs'
                    : 'bg-[#eaedff] text-[#464554]'
                }`}
              >
                2
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-bold text-[#131b2e] truncate">
                  {isRTL ? 'الباقة والعمولة' : 'Tier & Commission'}
                </span>
                <span className="block font-mono text-[10px] text-[#777586] truncate">
                  {isRTL ? '50% عمولة متكررة' : '50% Recurring Split'}
                </span>
              </div>
            </button>

            {/* Step 3 */}
            <button
              type="button"
              onClick={() => handleGoToStep(3)}
              className={`min-h-[48px] flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-lg text-left rtl:text-right transition-all ${
                activeStep === 3
                  ? 'bg-white shadow-xs'
                  : 'hover:bg-white/60 text-[#464554]'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                  activeStep === 3
                    ? 'bg-[#2a14b4] text-white shadow-xs'
                    : 'bg-[#eaedff] text-[#464554]'
                }`}
              >
                3
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-bold text-[#131b2e] truncate">
                  {isRTL ? 'الهوية البصرية' : 'White-Label Branding'}
                </span>
                <span className="block font-mono text-[10px] text-[#777586] truncate">
                  {isRTL ? 'وسائط Cloudinary' : 'Cloudinary Assets'}
                </span>
              </div>
            </button>

            {/* Step 4 */}
            <button
              type="button"
              onClick={() => handleGoToStep(4)}
              className={`min-h-[48px] flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-lg text-left rtl:text-right transition-all ${
                activeStep === 4
                  ? 'bg-white shadow-xs'
                  : 'hover:bg-white/60 text-[#464554]'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                  activeStep === 4
                    ? 'bg-[#2a14b4] text-white shadow-xs'
                    : 'bg-[#eaedff] text-[#464554]'
                }`}
              >
                4
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-bold text-[#131b2e] truncate">
                  {isRTL ? 'حسابات الموظفين' : 'Staff Provisioning'}
                </span>
                <span className="block font-mono text-[10px] text-[#777586] truncate">
                  {isRTL ? 'الصلاحيات والتسليم' : 'Access & Handover'}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN DUAL WORKSPACE: 66% Form Wizard / 34% Real-Time Sticky Preview    */}
      {/* ========================================================================= */}
      <div className="max-w-[1440px] mx-auto w-full px-3 sm:px-6 lg:px-8 py-5 sm:py-8 pb-36 md:pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: 8 of 12 cols (~66%) */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            {/* Top Overview Header with Agent Split Callout Banner */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#2a14b4] via-[#4338ca] to-[#0047be] p-6 sm:p-8 text-white shadow-md">
              <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-white/20 font-mono text-xs text-white mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Direct Agent Contract v4.2</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    {isRTL ? 'تسجيل وتجهيز مركز بصريات' : 'Provision Optical Dispensary'}
                  </h1>
                  <p className="text-xs sm:text-sm text-indigo-100 max-w-xl mt-1 leading-relaxed">
                    {isRTL
                      ? `إطلاق متجر سحابي مخصص، تهيئة مساحات التخزين في Cloudinary، وربط 50% من العمولات المتكررة شهرياً مباشرة بحساب الوكيل (${agentName}).`
                      : `Launch a dedicated cloud storefront, configure Cloudinary CDN media containers, and bind recurring monthly recurring commissions directly to Agent ID ${agentId}.`}
                  </p>
                </div>

                <div className="shrink-0 bg-white/10 backdrop-blur-md rounded-xl p-4 text-center border border-white/10">
                  <span className="text-[11px] uppercase tracking-wider text-indigo-200 block font-semibold">
                    {isRTL ? 'نسبة عمولتك' : 'Your Split Rate'}
                  </span>
                  <span className="text-4xl font-extrabold text-[#85f8c4] block leading-none my-1 font-mono">
                    50%
                  </span>
                  <span className="text-[11px] font-mono text-indigo-200 block">
                    {isRTL
                      ? (currencySymbol ? `إيداع تلقائي (${currencySymbol})` : 'إيداع تلقائي')
                      : (currencySymbol ? `Auto-credited in ${currencySymbol}` : 'Auto-credited')}
                  </span>
                </div>
              </div>
            </div>

            {/* Error Message Notification */}
            {errorMessage && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SECTION 1: Boutique Identity & Subdomain                                  */}
            {/* ========================================================================= */}
            <section
              id="wizard-section-1"
              className="rounded-xl bg-white p-6 sm:p-8 shadow-sm border border-slate-200/80 transition-all space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#e3dfff] text-[#2a14b4] font-bold font-mono flex items-center justify-center text-sm">
                    01
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#131b2e]">
                      {isRTL ? 'بيانات وهوية مركز البصريات' : 'Optical Boutique Identity'}
                    </h2>
                    <p className="text-xs text-[#777586]">
                      {isRTL
                        ? 'تسجيل الاسم القانوني والموقع والرابط المخصص.'
                        : 'Establish legal business details and optical domain endpoint.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Field 1: Shop Name */}
                <div data-help-key="shop_name" className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#131b2e] flex items-center justify-between">
                    <span>
                      {isRTL ? 'الاسم التجاري للمتجر' : 'Boutique Legal Trading Name'}
                    </span>
                    <span className="text-[#ba1a1a] font-mono">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    data-help-key="shop_name"
                    value={shopName}
                    onChange={(e) => handleShopNameChange(e.target.value)}
                    onBlur={handleShopNameBlur}
                    placeholder="e.g. Al-Noor Luxury Eyewear"
                    className={`w-full min-h-[44px] px-3.5 rounded-xl text-sm sm:text-xs border focus:outline-none shadow-sm transition-all ${
                      shopNameValidation.formatError || isShopNameTaken || shopNameValidation.dbError
                        ? 'border-[#ba1a1a] ring-2 ring-[#ba1a1a]/30 bg-rose-50/40 text-[#ba1a1a] focus:ring-2 focus:ring-[#ba1a1a]'
                        : isShopNameValid
                        ? 'border-[#006c4a] ring-1 ring-[#006c4a]/30 bg-emerald-50/20 text-[#131b2e] focus:ring-2 focus:ring-[#006c4a]'
                        : 'border-transparent bg-[#f2f3ff] text-[#131b2e] focus:bg-white focus:ring-2 focus:ring-[#2a14b4]'
                    }`}
                  />
                  {isCheckingShopName ? (
                    <span className="text-[11px] text-[#2a14b4] flex items-center gap-1.5 font-medium animate-pulse mt-0.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#2a14b4] shrink-0" />
                      <span>{isRTL ? 'جاري التحقق من اسم المتجر...' : 'Checking optical shop name availability...'}</span>
                    </span>
                  ) : isShopNameTaken || shopNameValidation.dbError ? (
                    <div className="p-2.5 rounded-lg bg-rose-50/90 border border-rose-200 flex items-start gap-2 mt-1 animate-in fade-in duration-150">
                      <AlertCircle className="w-4 h-4 text-[#ba1a1a] shrink-0 mt-0.5" />
                      <span className="text-[11px] text-[#ba1a1a] font-semibold leading-tight">
                        {shopNameValidation.dbError || (isRTL
                          ? 'اسم مركز البصريات هذا مسجل بالفعل في قاعدة البيانات. يرجى اختيار اسم مختلف أو تعديل المتجر الحالي.'
                          : 'This optical shop name is already registered in the database. Please choose a different name or edit the existing shop.')}
                      </span>
                    </div>
                  ) : shopNameValidation.formatError ? (
                    <span className="text-[11px] text-[#ba1a1a] flex items-center gap-1.5 font-medium mt-0.5">
                      <AlertCircle className="w-3.5 h-3.5 text-[#ba1a1a] shrink-0" />
                      <span>{shopNameValidation.formatError}</span>
                    </span>
                  ) : isShopNameValid ? (
                    <span className="text-[11px] text-[#006c4a] flex items-center gap-1.5 font-medium mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#006c4a] shrink-0" />
                      <span>{shopNameValidation.successMessage || (isRTL ? 'اسم المتجر متاح ومميز' : 'Optical boutique name is unique and available')}</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#777586] mt-0.5">
                      {isRTL
                        ? 'يظهر على الفواتير، تقارير فحص النظر، وبوابة العملاء.'
                        : 'Appears on invoices, diagnostic receipts, and customer portal.'}
                    </span>
                  )}
                </div>

                {/* Field 2: Location */}
                <div data-help-key="city_location" className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#131b2e] flex items-center justify-between">
                    <span>
                      {isRTL ? 'الفرع والمدينة' : 'Physical Hub & City'}
                    </span>
                    <span className="text-[#ba1a1a] font-mono">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    data-help-key="city_location"
                    value={location}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    onBlur={() => handleLocationChange(location)}
                    placeholder="e.g. Amman - Abdoun Galleria Mall"
                    className={`w-full min-h-[44px] px-3.5 rounded-xl bg-[#f2f3ff] text-[#131b2e] text-sm sm:text-xs border focus:bg-white focus:outline-none shadow-sm transition-all ${
                      locationError
                        ? 'border-[#ba1a1a] focus:ring-2 focus:ring-[#ba1a1a] bg-rose-50/20'
                        : location.trim().length >= 3
                        ? 'border-[#006c4a] focus:ring-2 focus:ring-[#006c4a] bg-emerald-50/20'
                        : 'border-transparent focus:ring-2 focus:ring-[#2a14b4]'
                    }`}
                  />
                  {locationError ? (
                    <span className="text-[11px] text-[#ba1a1a] flex items-center gap-1.5 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 text-[#ba1a1a] shrink-0" />
                      <span>{locationError}</span>
                    </span>
                  ) : location.trim().length >= 3 ? (
                    <span className="text-[11px] text-[#006c4a] flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#006c4a] shrink-0" />
                      <span>{isRTL ? 'الموقع معتمد' : 'Location details verified'}</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#777586]">
                      {isRTL
                        ? 'لتحديد نطاق توصيل وتجهيز المخزون المحلي.'
                        : 'For local inventory fulfillment and geolocated stock dispatch.'}
                    </span>
                  )}
                </div>

                {/* Field 3: Subdomain Slug (Full Width) */}
                <div data-help-key="subdomain_slug" className="md:col-span-2 flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#131b2e] flex items-center justify-between">
                    <span>
                      {isRTL ? 'رابط الدخول المباشر (Subdomain)' : 'Dedicated Subdomain Endpoint'}
                    </span>
                    {subdomainValidation.isChecking ? (
                      <span className="text-[#2a14b4] font-mono text-xs font-semibold flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin text-[#2a14b4]" />
                        <span>{isRTL ? 'جاري الفحص...' : 'Checking DNS...'}</span>
                      </span>
                    ) : subdomainValidation.formatError || subdomainValidation.dbError ? (
                      <span className="text-[#ba1a1a] font-mono text-xs font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-[#ba1a1a]" />
                        <span>{isRTL ? 'غير متاح' : 'Unavailable'}</span>
                      </span>
                    ) : subdomainValidation.isAvailable && subdomainSlug.length >= 3 ? (
                      <span className="text-[#006c4a] font-mono text-xs font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#006c4a]" />
                        <span>{isRTL ? 'الرابط متاح' : 'Domain Available'}</span>
                      </span>
                    ) : (
                      <span className="text-[#777586] font-mono text-xs font-medium">
                        {isRTL ? 'فحص تلقائي' : 'Pre-check on typing'}
                      </span>
                    )}
                  </label>
                  <div
                    className={`flex items-center rounded-xl bg-[#f2f3ff] focus-within:bg-white transition-all overflow-hidden shadow-sm dir-ltr border ${
                      subdomainValidation.formatError || subdomainValidation.dbError
                        ? 'border-[#ba1a1a] focus-within:ring-2 focus-within:ring-[#ba1a1a] bg-rose-50/20'
                        : subdomainValidation.isAvailable && subdomainSlug.length >= 3
                        ? 'border-[#006c4a] focus-within:ring-2 focus-within:ring-[#006c4a] bg-emerald-50/20'
                        : 'border-transparent focus-within:ring-2 focus-within:ring-[#2a14b4]'
                    }`}
                  >
                    <span className="pl-3.5 text-[#777586] font-mono text-xs">https://</span>
                    <input
                      type="text"
                      required
                      data-help-key="subdomain_slug"
                      value={subdomainSlug}
                      onChange={(e) => handleSubdomainChange(e.target.value)}
                      onBlur={handleSubdomainBlur}
                      placeholder="alnoor-optics"
                      className="w-full min-h-[44px] px-1 bg-transparent text-[#2a14b4] font-mono text-sm sm:text-xs font-bold focus:outline-none"
                    />
                    <span className="pr-3.5 text-[#777586] font-mono text-[11px] sm:text-xs shrink-0">.envisioneyewear.store</span>
                  </div>
                  {subdomainValidation.isChecking ? (
                    <span className="text-[11px] text-[#2a14b4] flex items-center gap-1.5 font-medium animate-pulse mt-0.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#2a14b4] shrink-0" />
                      <span>{isRTL ? 'جاري التحقق من توفر الرابط في قاعدة البيانات...' : 'Checking subdomain endpoint availability...'}</span>
                    </span>
                  ) : subdomainValidation.formatError || subdomainValidation.dbError ? (
                    <span className="text-[11px] text-[#ba1a1a] flex items-center gap-1.5 font-medium mt-0.5">
                      <AlertCircle className="w-3.5 h-3.5 text-[#ba1a1a] shrink-0" />
                      <span>{subdomainValidation.formatError || subdomainValidation.dbError}</span>
                    </span>
                  ) : subdomainValidation.isAvailable && subdomainSlug.length >= 3 ? (
                    <div className="flex items-center justify-between text-[11px] text-[#006c4a] mt-0.5">
                      <span className="flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#006c4a] shrink-0" />
                        <span>{subdomainValidation.successMessage || (isRTL ? `الرابط https://${subdomainSlug}.envisioneyewear.store متاح بالكامل` : `Subdomain endpoint '${subdomainSlug}' is completely available`)}</span>
                      </span>
                      <span className="font-mono text-[10px] text-[#777586]">DNS TTL: 60s</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[11px] text-[#777586] mt-0.5">
                      <span>
                        {isRTL
                          ? 'يتم توفير شهادة الأمان SSL والتوجيه عبر Cloudflare تلقائياً.'
                          : 'SSL certificate and Cloudflare edge-routing automatically provisioned.'}
                      </span>
                      <span className="font-mono">DNS TTL: 60s</span>
                    </div>
                  )}
                </div>

                {/* Field 4: Owner Name */}
                <div data-help-key="staff_full_name" className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#131b2e] flex items-center justify-between">
                    <span>
                      {isRTL ? 'المالك / أخصائي البصريات المرخص' : 'Licensed Principal Optician / Owner'}
                    </span>
                    <span className="text-[#ba1a1a] font-mono">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => handleOwnerNameChange(e.target.value)}
                    onBlur={() => handleOwnerNameChange(ownerName)}
                    placeholder="Dr. Tariq Al-Husseini"
                    className={`w-full min-h-[44px] px-3.5 rounded-xl bg-[#f2f3ff] text-[#131b2e] text-sm sm:text-xs border focus:bg-white focus:outline-none shadow-sm transition-all ${
                      ownerNameError
                        ? 'border-[#ba1a1a] focus:ring-2 focus:ring-[#ba1a1a] bg-rose-50/20'
                        : ownerName.trim().length >= 2
                        ? 'border-[#006c4a] focus:ring-2 focus:ring-[#006c4a] bg-emerald-50/20'
                        : 'border-transparent focus:ring-2 focus:ring-[#2a14b4]'
                    }`}
                  />
                  {ownerNameError ? (
                    <span className="text-[11px] text-[#ba1a1a] flex items-center gap-1.5 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 text-[#ba1a1a] shrink-0" />
                      <span>{ownerNameError}</span>
                    </span>
                  ) : ownerName.trim().length >= 2 ? (
                    <span className="text-[11px] text-[#006c4a] flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#006c4a] shrink-0" />
                      <span>{isRTL ? 'اسم المالك معتمد' : 'Optician / Owner name verified'}</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#777586]">
                      {isRTL
                        ? 'المدير الإداري المفوض لاعتماد وتوقيع الوصفات.'
                        : 'Designated administrative superuser for dispensary signing.'}
                    </span>
                  )}
                </div>

                {/* Field 5: Owner Email */}
                <div data-help-key="owner_email" className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#131b2e] flex items-center justify-between">
                    <span>{isRTL ? 'البريد الإلكتروني المباشر للمالك' : 'Owner Primary Direct Email'}</span>
                    <span className="text-[#ba1a1a] font-mono">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    data-help-key="owner_email"
                    value={ownerEmail}
                    onChange={(e) => handleOwnerEmailChange(e.target.value)}
                    onBlur={handleOwnerEmailBlur}
                    placeholder="tariq@alnooroptics.jo"
                    className={`w-full min-h-[44px] px-3.5 rounded-xl text-sm sm:text-xs font-mono border focus:outline-none shadow-sm transition-all ${
                      ownerEmailValidation.formatError || ownerEmailValidation.dbError
                        ? 'border-[#ba1a1a] ring-2 ring-[#ba1a1a]/30 bg-rose-50/40 text-[#ba1a1a] focus:ring-2 focus:ring-[#ba1a1a]'
                        : ownerEmailValidation.isAvailable && ownerEmail.trim()
                        ? 'border-[#006c4a] ring-1 ring-[#006c4a]/30 bg-emerald-50/25 text-[#131b2e] focus:ring-2 focus:ring-[#006c4a]'
                        : 'border-transparent bg-[#f2f3ff] text-[#131b2e] focus:bg-white focus:ring-2 focus:ring-[#2a14b4]'
                    }`}
                  />
                  <span className="text-[11px] text-[#777586]">
                    {isRTL
                      ? 'ملاحظة: يجب أن يكون البريد الإلكتروني فريداً لكل متجر بصريات.'
                      : 'Note: The email address should be unique for each shop.'}
                  </span>
                  {ownerEmailValidation.isChecking ? (
                    <span className="text-[11px] text-[#2a14b4] flex items-center gap-1.5 font-medium animate-pulse mt-0.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#2a14b4] shrink-0" />
                      <span>{isRTL ? 'جاري التحقق من بريد المالك...' : 'Checking owner email availability...'}</span>
                    </span>
                  ) : ownerEmailValidation.dbError ? (
                    <div className="p-2.5 rounded-lg bg-rose-50/90 border border-rose-200 flex items-start gap-2 mt-1 animate-in fade-in duration-150">
                      <AlertCircle className="w-4 h-4 text-[#ba1a1a] shrink-0 mt-0.5" />
                      <div className="flex-1 text-xs text-[#ba1a1a] font-semibold leading-relaxed">
                        {ownerEmailValidation.dbError}
                      </div>
                    </div>
                  ) : ownerEmailValidation.formatError ? (
                    <div className="p-2.5 rounded-lg bg-rose-50/90 border border-rose-200 flex items-start gap-2 mt-1 animate-in fade-in duration-150">
                      <AlertCircle className="w-4 h-4 text-[#ba1a1a] shrink-0 mt-0.5" />
                      <div className="flex-1 text-xs text-[#ba1a1a] font-semibold leading-relaxed">
                        {ownerEmailValidation.formatError}
                      </div>
                    </div>
                  ) : ownerEmailValidation.isAvailable && ownerEmail.trim() ? (
                    <span className="text-[11px] text-[#006c4a] flex items-center gap-1.5 font-medium mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#006c4a] shrink-0" />
                      <span>{ownerEmailValidation.successMessage || (isRTL ? 'البريد متاح وغير مسجل مسبقاً' : 'Email is available for registration')}</span>
                    </span>
                  ) : null}
                  <label className="min-h-[44px] flex items-center gap-2.5 mt-1 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={sendInviteEmail}
                      onChange={(e) => setSendInviteEmail(e.target.checked)}
                      className="w-5 h-5 rounded text-[#2a14b4] focus:ring-[#2a14b4] accent-[#2a14b4] shrink-0"
                    />
                    <span className="text-xs text-[#464554] font-medium">
                      {isRTL
                        ? 'إرسال رابط الدعوة وبوابة الدخول تلقائياً إلى بريد المالك'
                        : 'Send automatic onboarding link & portal invitation to owner email'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Extended Details Toggle */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowExtendedDetails(!showExtendedDetails)}
                  className="min-h-[44px] px-2 text-xs text-[#2a14b4] hover:text-[#4338ca] font-semibold inline-flex items-center gap-1.5 transition-colors rounded-lg"
                >
                  <span>
                    {showExtendedDetails
                      ? isRTL
                        ? 'إخفاء تفاصيل السجل والدوام'
                        : 'Hide Registry & Clinic Details'
                      : isRTL
                      ? '+ بيانات السجل التجاري وأوقات الدوام'
                      : '+ Add Commercial Registry & Operating Hours'}
                  </span>
                  {showExtendedDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showExtendedDetails && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-100 animate-in fade-in duration-200">
                    <div data-help-key="license_number">
                      <label className="block text-xs font-semibold text-[#131b2e] mb-1">
                        {isRTL ? 'رقم السجل التجاري / رخصة المزاولة' : 'Commercial Reg / License ID'}
                      </label>
                      <input
                        type="text"
                        data-help-key="license_number"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        placeholder="CR-AMM-2024-8841"
                        className="w-full min-h-[44px] px-3.5 text-sm sm:text-xs bg-[#f2f3ff] text-[#131b2e] border border-transparent rounded-xl font-mono focus:bg-white focus:ring-1 focus:ring-[#2a14b4]"
                      />
                    </div>

                    <div data-help-key="primary_phone" className="flex flex-col gap-1">
                      <label className="block text-xs font-semibold text-[#131b2e]">
                        {isRTL ? 'الهاتف الرئيسي وواتساب المتجر' : 'Primary Phone & WhatsApp'}
                      </label>
                      <input
                        type="tel"
                        data-help-key="primary_phone"
                        value={primaryPhone}
                        onChange={(e) => handlePrimaryPhoneChange(e.target.value)}
                        onBlur={handlePrimaryPhoneBlur}
                        placeholder={agentDialInfo.placeholder}
                        className={`w-full min-h-[44px] px-3.5 text-sm sm:text-xs bg-[#f2f3ff] text-[#131b2e] border rounded-xl font-mono dir-ltr text-left focus:bg-white focus:ring-1 ${
                          phoneValidation.formatError || phoneValidation.dbError
                            ? 'border-[#ba1a1a] focus:ring-[#ba1a1a] bg-rose-50/20'
                            : phoneValidation.isAvailable && primaryPhone.trim()
                            ? 'border-[#006c4a] focus:ring-[#006c4a] bg-emerald-50/20'
                            : 'border-transparent focus:ring-[#2a14b4]'
                        }`}
                      />
                      {phoneValidation.isChecking ? (
                        <span className="text-[10px] text-[#2a14b4] flex items-center gap-1 font-medium animate-pulse">
                          <RefreshCw className="w-3 h-3 animate-spin text-[#2a14b4]" />
                          <span>{isRTL ? 'جاري فحص الهاتف...' : 'Checking phone uniqueness...'}</span>
                        </span>
                      ) : phoneValidation.formatError || phoneValidation.dbError ? (
                        <span className="text-[10px] text-[#ba1a1a] flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3 h-3 text-[#ba1a1a]" />
                          <span>{phoneValidation.formatError || phoneValidation.dbError}</span>
                        </span>
                      ) : phoneValidation.isAvailable && primaryPhone.trim() ? (
                        <span className="text-[10px] text-[#006c4a] flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3 h-3 text-[#006c4a]" />
                          <span>{phoneValidation.successMessage || (isRTL ? 'رقم الهاتف متاح' : 'Phone is available')}</span>
                        </span>
                      ) : null}
                    </div>

                    <div data-help-key="physical_address">
                      <label className="block text-xs font-semibold text-[#131b2e] mb-1">
                        {isRTL ? 'العنوان التفصيلي والشارع' : 'Physical Address / Street'}
                      </label>
                      <input
                        type="text"
                        data-help-key="physical_address"
                        value={physicalAddress}
                        onChange={(e) => setPhysicalAddress(e.target.value)}
                        placeholder="Building 14, Zahran St, 7th Circle"
                        className="w-full min-h-[44px] px-3.5 text-sm sm:text-xs bg-[#f2f3ff] text-[#131b2e] border border-transparent rounded-xl focus:bg-white focus:ring-1 focus:ring-[#2a14b4]"
                      />
                    </div>

                    <div data-help-key="operating_hours">
                      <label className="block text-xs font-semibold text-[#131b2e] mb-1">
                        {isRTL ? 'ساعات العمل وأوقات الفحص' : 'Operating Hours & Schedule'}
                      </label>
                      <input
                        type="text"
                        data-help-key="operating_hours"
                        value={operatingHours}
                        onChange={(e) => setOperatingHours(e.target.value)}
                        placeholder="Sat - Thu: 09:30 AM - 09:30 PM"
                        className="w-full min-h-[44px] px-3.5 text-sm sm:text-xs bg-[#f2f3ff] text-[#131b2e] border border-transparent rounded-xl focus:bg-white focus:ring-1 focus:ring-[#2a14b4]"
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* ========================================================================= */}
            {/* SECTION 2: Subscription Tier & Commission Terms                           */}
            {/* ========================================================================= */}
            <section
              id="wizard-section-2"
              className="rounded-xl bg-white p-5 sm:p-8 shadow-sm border border-slate-200/80 transition-all space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#e3dfff] text-[#2a14b4] font-bold font-mono flex items-center justify-center text-sm shrink-0">
                    02
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#131b2e]">
                      {isRTL ? 'باقة الاشتراك وشروط عمولة الوكيل' : 'Subscription Tier & Commission Terms'}
                    </h2>
                    <p className="text-xs text-[#777586]">
                      {isRTL
                        ? 'تُطبق نسبة عمولة الشريك (50%) بالتساوي على كافة دورات الفوترة.'
                        : 'Partner splits apply equally across all retail billing cycles.'}
                    </p>
                  </div>
                </div>

                {/* Monthly / Annual Billing Toggle */}
                <div className="grid grid-cols-2 sm:flex items-center bg-[#f2f3ff] p-1 rounded-xl w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('monthly')}
                    className={`min-h-[44px] px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                      billingCycle === 'monthly'
                        ? 'bg-white text-[#2a14b4] shadow-xs'
                        : 'text-[#464554] hover:text-[#131b2e]'
                    }`}
                  >
                    {isRTL ? 'شهري' : 'Monthly Plan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle('annual')}
                    className={`min-h-[44px] px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      billingCycle === 'annual'
                        ? 'bg-white text-[#2a14b4] shadow-xs'
                        : 'text-[#464554] hover:text-[#131b2e]'
                    }`}
                  >
                    <span className="truncate">{isRTL ? 'سنوي (10 أشهر)' : 'Annual (10 mo.)'}</span>
                    <span className="px-1.5 py-0.5 bg-[#006c4a] text-white rounded text-[10px] font-mono font-bold shrink-0">
                      2 FREE
                    </span>
                  </button>
                </div>
              </div>

              {/* 3 Tier Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-help-key="subscription_tier">
                {(Object.keys(STITCH_TIERS) as StitchTierKey[]).map((tierKey) => {
                  const tier = STITCH_TIERS[tierKey];
                  const isSelected = selectedTierKey === tierKey;
                  const monthly = getTierMonthly(tierKey);
                  const perMonth = billingCycle === 'annual' ? Number((monthly * 10 / 12).toFixed(2)) : monthly;
                  const yearlyTotal = monthly * 10;
                  const yieldVal = (perMonth * 0.5).toFixed(2);

                  return (
                    <div
                      key={tierKey}
                      onClick={() => setSelectedTierKey(tierKey)}
                      className={`cursor-pointer rounded-xl p-5 transition-all flex flex-col justify-between relative group ${
                        isSelected
                          ? 'bg-[#e3dfff]/20 ring-2 ring-[#2a14b4] shadow-md'
                          : 'bg-[#f2f3ff] hover:bg-[#eaedff] border border-transparent'
                      }`}
                    >
                      {tier.recommended && (
                        <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-[#2a14b4] text-white font-mono text-[10px] font-bold tracking-wide shadow-xs">
                          RECOMMENDED
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-xs uppercase tracking-wider font-bold ${
                              isSelected ? 'text-[#2a14b4]' : 'text-[#777586]'
                            }`}
                          >
                            {tier.name}
                          </span>
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                              isSelected
                                ? 'bg-[#2a14b4] border-[#2a14b4]'
                                : 'bg-[#e2e7ff] border-[#c7c4d7]'
                            }`}
                          >
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>

                        <div className="my-2">
                          {ratesLoading ? (
                            <span className="text-sm font-semibold text-[#777586] block py-1">
                              {isRTL ? 'جاري احتساب الأسعار...' : 'Calculating prices…'}
                            </span>
                          ) : !pricingResult.ok ? (
                            <span className="text-2xl font-bold text-slate-400 block py-1">—</span>
                          ) : (
                            <>
                              <div>
                                <span
                                  className={`text-3xl font-extrabold ${
                                    isSelected ? 'text-[#2a14b4]' : 'text-[#131b2e]'
                                  }`}
                                >
                                  {perMonth}
                                </span>
                                <span className="font-mono text-xs text-[#777586]"> {currencySymbol}/month</span>
                              </div>
                              {billingCycle === 'annual' && (
                                <div className="text-[11px] font-mono text-[#006c4a] mt-0.5 font-medium">
                                  {yearlyTotal} {currencySymbol}
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        <ul className="flex flex-col gap-1.5 text-xs text-[#464554] my-4">
                          {tier.features.map((feat, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <CheckCircle2
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isSelected ? 'text-[#2a14b4]' : 'text-[#006c4a]'
                                }`}
                              />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div
                        className={`mt-2 pt-3 rounded-lg p-3 ${
                          isSelected ? 'bg-white shadow-2xs' : 'bg-white/60'
                        }`}
                      >
                        <span className="text-[11px] text-[#777586] block">
                          {isRTL ? 'عائد الوكيل الشهري (50%)' : 'Agent Monthly Yield (50%)'}
                        </span>
                        {ratesLoading ? (
                          <span className="font-mono text-xs text-slate-400">...</span>
                        ) : !pricingResult.ok ? (
                          <span className="font-mono text-base font-bold text-slate-400">—</span>
                        ) : (
                          <span className="font-mono text-base font-bold text-[#006c4a]">
                            +{yieldVal} {currencySymbol}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Live Rates Attribution Line */}
              {!ratesLoading && pricingResult.ok && ratesData && (
                <div className="pt-1 text-xs text-[#777586] flex items-center justify-between flex-wrap gap-2">
                  <span>
                    1 {ratesData.base || 'J' + 'OD'} = {pricingResult.pricing.rate_used} {pricingResult.pricing.currency_code} • updated{' '}
                    {ratesData.fetchedAt ? new Date(ratesData.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }) : 'recently'} •{' '}
                    <a
                      href={ratesData.attributionUrl || 'https://www.exchangerate-api.com'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#2a14b4] hover:underline inline-flex items-center gap-1 font-semibold"
                    >
                      <span>Rates By Exchange Rate API</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </span>
                </div>
              )}

              {/* Amber Error Notice when !result.ok */}
              {!ratesLoading && !pricingResult.ok && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">
                        {pricingResult.reason === 'unsupported_country'
                          ? (isRTL
                              ? 'ملف الوكيل الخاص بك لا يحتوي على دولة مدعومة، لذلك لا يمكن احتساب أسعار الاشتراك. يرجى التواصل مع المسؤول.'
                              : 'Your agent profile has no supported country, so subscription prices cannot be calculated. Contact the administrator.')
                          : (isRTL
                              ? 'أسعار الصرف الحية غير متوفرة حالياً. يرجى المحاولة مرة أخرى بعد لحظات.'
                              : 'Live exchange rates are currently unavailable. Please try again in a moment.')}
                      </p>
                    </div>
                  </div>
                  {pricingResult.reason === 'rate_unavailable' && (
                    <button
                      type="button"
                      onClick={fetchRates}
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors shrink-0 self-start sm:self-auto flex items-center gap-1.5 shadow-2xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{isRTL ? 'إعادة المحاولة' : 'Retry'}</span>
                    </button>
                  )}
                </div>
              )}

              {/* Commission Split Guarantee Banner */}
              <div className="p-4 rounded-xl bg-[#f2f3ff] border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#82f5c1]/30 text-[#006c4a] flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-[#006c4a]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#131b2e] block">
                      {isRTL ? 'اتفاقية ضمان العائد 50/50' : '50/50 Revenue Assurance Agreement'}
                    </span>
                    <span className="text-[11px] text-[#777586] block">
                      {isRTL
                        ? 'تُقفل العمولات مباشرة في حساب الوكيل بمجرد سداد فاتورة العميل الأولى.'
                        : 'Commissions are locked into your agent account upon first client invoice clearance.'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-mono text-xs text-[#2a14b4] font-bold shadow-2xs self-start sm:self-auto">
                  <span>{isRTL ? 'التحويل القادم: 1 من الشهر' : 'Next Payout: 1st of Month'}</span>
                </div>
              </div>
            </section>

            {/* ========================================================================= */}
            {/* SECTION 3: White-Label Branding & CDN Assets                              */}
            {/* ========================================================================= */}
            <section
              id="wizard-section-3"
              className="rounded-xl bg-white p-6 sm:p-8 shadow-sm border border-slate-200/80 transition-all space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#e3dfff] text-[#2a14b4] font-bold font-mono flex items-center justify-center text-sm">
                    03
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#131b2e]">
                      {isRTL ? 'الهوية البصرية ووسائط CDN' : 'White-Label Branding & CDN Assets'}
                    </h2>
                    <p className="text-xs text-[#777586]">
                      {isRTL
                        ? 'تخصيص ألوان الواجهة ورفع صور وشعارات المعرض عبر Cloudinary.'
                        : 'Configure custom storefront styling and store imagery via Cloudinary.'}
                    </p>
                  </div>
                </div>

                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#006c4a]/10 text-[#006c4a] font-mono text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#006c4a]" />
                  <span>CDN Bucket: opt-amman-prod</span>
                </span>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {/* Cloudinary Logo & Cover Uploader */}
                <div className="flex flex-col gap-4">
                  <span className="text-xs font-bold text-[#131b2e] uppercase tracking-wider block">
                    {isRTL ? 'شعار وصورة المعرض' : 'Dispensary Vector Logo & Banner'}
                  </span>

                  <CloudinaryImageUploader
                    label={t('logoCloudinaryLabel')}
                    value={logoUrl}
                    onChange={setLogoUrl}
                    aspectHint="square"
                    placeholder="https://res.cloudinary.com/... or logo image URL"
                    onOpenCloudinaryConfig={onOpenCloudinaryConfig}
                    onUploadingChange={setIsLogoUploading}
                    helpKey="logo_upload"
                  />

                  {/* Storefront Showroom Cover Cloudinary Uploader & Preview */}
                  <div className="space-y-3" data-help-key="banner_upload">
                    <CloudinaryImageUploader
                      label={isRTL ? 'صورة المعرض وواجهة المتجر لتطبيق العملاء' : 'Customer App Storefront & Showroom Image'}
                      value={bgImageUrl}
                      onChange={setBgImageUrl}
                      aspectHint="wide"
                      placeholder="https://res.cloudinary.com/... or storefront image URL"
                      onOpenCloudinaryConfig={onOpenCloudinaryConfig}
                      onUploadingChange={setIsBgUploading}
                      helpKey="banner_upload"
                    />

                    {/* Storefront Cover Image Preview */}
                    {bgImageUrl && (
                      <div className="rounded-xl overflow-hidden bg-[#f2f3ff] shadow-sm border border-slate-200/80">
                        <div className="relative h-24 w-full">
                          <img
                            src={bgImageUrl}
                            alt="Storefront Cover Preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex items-end p-2.5">
                            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                              <Eye className="w-3.5 h-3.5 text-white" />
                              <span>{isRTL ? 'معاينة صورة المعرض في تطبيق العملاء (مفعل)' : 'Customer App Hero Showcase (Active)'}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* ========================================================================= */}
            {/* SECTION 4: Initial Staff Credentials Provisioning                         */}
            {/* ========================================================================= */}
            <section
              id="wizard-section-4"
              className="rounded-xl bg-white p-6 sm:p-8 shadow-sm border border-slate-200/80 transition-all space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#e3dfff] text-[#2a14b4] font-bold font-mono flex items-center justify-center text-sm">
                    04
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#131b2e]">
                      {isRTL ? 'توليد حسابات موظفي المتجر' : 'Initial Staff Credentials Provisioning'}
                    </h2>
                    <p className="text-xs text-[#777586]">
                      {isRTL
                        ? 'تهيئة أدوار الطاقم وتوليد كلمات مرور مؤقتة آمنة للدخول.'
                        : 'Pre-provision dispensary roles with secure temporary access tokens.'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyStaffSummary}
                    className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#eaedff] hover:bg-[#e2e7ff] text-[#131b2e] text-xs font-semibold transition-colors"
                  >
                    {copiedSummary ? <Check className="w-3.5 h-3.5 text-[#006c4a]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="truncate">{copiedSummary ? (isRTL ? 'تم النسخ!' : 'Copied!') : (isRTL ? 'نسخ الملخص' : 'Copy Summary')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddStaffRow}
                    className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2a14b4] text-white text-xs font-bold hover:bg-[#4338ca] transition-all shadow-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span className="truncate">{isRTL ? 'إضافة عضو' : 'Add Member'}</span>
                  </button>
                </div>
              </div>

              {/* Staff Repeater Container */}
              <div className="flex flex-col gap-3">
                {staffList.map((staff, index) => {
                  const staffKey = staff.id || `staff-${index}`;
                  const val = staffValidations[staffKey];
                  const showPass = showStaffPasswords[staffKey] ?? false;

                  return (
                    <div
                      key={staffKey}
                      className="rounded-xl bg-[#f2f3ff] p-3.5 shadow-sm transition-all space-y-3"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                        {/* Full Name */}
                        <div data-help-key="staff_full_name" className="sm:col-span-3 flex flex-col gap-1">
                          <label className="text-[11px] text-[#777586] font-semibold flex items-center justify-between">
                            <span>{isRTL ? 'الاسم الكامل' : 'Full Name'}</span>
                            <span className="text-[#ba1a1a] font-mono">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            data-help-key="staff_full_name"
                            value={staff.full_name}
                            onChange={(e) => handleUpdateStaff(index, 'full_name', e.target.value)}
                            placeholder={isRTL ? 'اسم الموظف' : 'Staff Name'}
                            className={`w-full min-h-[44px] px-3 rounded-xl bg-white text-[#131b2e] text-sm sm:text-xs border focus:outline-none shadow-sm transition-all ${
                              val?.nameError
                                ? 'border-[#ba1a1a] focus:ring-1 focus:ring-[#ba1a1a] bg-rose-50/20'
                                : staff.full_name.trim().length >= 2
                                ? 'border-[#006c4a] focus:ring-1 focus:ring-[#006c4a]'
                                : 'border-transparent focus:ring-1 focus:ring-[#2a14b4]'
                            }`}
                          />
                          {val?.nameError && (
                            <span className="text-[10px] text-[#ba1a1a] flex items-center gap-1 font-medium">
                              <AlertCircle className="w-3 h-3 text-[#ba1a1a]" />
                              <span>{val.nameError}</span>
                            </span>
                          )}
                        </div>

                        {/* Role & Permissions Dropdown */}
                        <div data-help-key="staff_role" className="sm:col-span-3 flex flex-col gap-1">
                          <label className="text-[11px] text-[#777586] font-semibold">
                            {isRTL ? 'الدور والصلاحيات' : 'Role & Permissions'}
                          </label>
                          <select
                            data-help-key="staff_role"
                            value={staff.role}
                            onChange={(e) => handleUpdateStaff(index, 'role', e.target.value as StaffRole)}
                            className="w-full min-h-[44px] px-3 rounded-xl bg-white text-[#131b2e] text-sm sm:text-xs border border-transparent focus:outline-none focus:ring-1 focus:ring-[#2a14b4] shadow-sm cursor-pointer"
                          >
                            {STAFF_ROLE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {isRTL ? opt.labelAr : opt.labelEn}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Login Identifier / Email */}
                        <div data-help-key="staff_email" className="sm:col-span-3 flex flex-col gap-1">
                          <label className="text-[11px] text-[#777586] font-semibold flex items-center justify-between">
                            <span>{isRTL ? 'البريد الإلكتروني' : 'Login Identifier / Email'}</span>
                            <span className="text-[#ba1a1a] font-mono">*</span>
                          </label>
                          <input
                            type="email"
                            required
                            data-help-key="staff_email"
                            value={staff.email}
                            onChange={(e) => handleUpdateStaff(index, 'email', e.target.value)}
                            onBlur={() => handleStaffBlur(index, 'email')}
                            placeholder="staff@boutique.jo"
                            className={`w-full min-h-[44px] px-3 rounded-xl text-[#131b2e] font-mono text-sm sm:text-xs border focus:outline-none shadow-sm transition-all ${
                              val?.emailFormatError || val?.emailDbError
                                ? 'border-[#ba1a1a] ring-2 ring-[#ba1a1a]/30 bg-rose-50/40 text-[#ba1a1a] focus:ring-2 focus:ring-[#ba1a1a]'
                                : val?.isEmailAvailable
                                ? 'border-[#006c4a] ring-1 ring-[#006c4a]/30 bg-emerald-50/20 focus:ring-2 focus:ring-[#006c4a]'
                                : 'border-transparent bg-white focus:ring-2 focus:ring-[#2a14b4]'
                            }`}
                          />
                          {val?.isCheckingEmail ? (
                            <span className="text-[10px] text-[#2a14b4] flex items-center gap-1 font-medium animate-pulse mt-0.5">
                              <RefreshCw className="w-3 h-3 animate-spin text-[#2a14b4]" />
                              <span>{isRTL ? 'جاري فحص البريد في مستخدمي Supabase...' : 'Checking email in Supabase users...'}</span>
                            </span>
                          ) : val?.emailDbError ? (
                            <div className="p-2 rounded-lg bg-rose-50/90 border border-rose-200 flex items-start gap-1.5 mt-1 animate-in fade-in duration-150">
                              <AlertCircle className="w-3.5 h-3.5 text-[#ba1a1a] shrink-0 mt-0.5" />
                              <span className="text-[10px] text-[#ba1a1a] font-semibold leading-tight">
                                {val.emailDbError}
                              </span>
                            </div>
                          ) : val?.emailFormatError ? (
                            <div className="p-2 rounded-lg bg-rose-50/90 border border-rose-200 flex items-start gap-1.5 mt-1 animate-in fade-in duration-150">
                              <AlertCircle className="w-3.5 h-3.5 text-[#ba1a1a] shrink-0 mt-0.5" />
                              <span className="text-[10px] text-[#ba1a1a] font-semibold leading-tight">
                                {val.emailFormatError}
                              </span>
                            </div>
                          ) : val?.isEmailAvailable ? (
                            <span className="text-[10px] text-[#006c4a] flex items-center gap-1 font-medium mt-0.5">
                              <CheckCircle2 className="w-3 h-3 text-[#006c4a]" />
                              <span>{isRTL ? 'البريد متاح للتسجيل' : 'Email available for registration'}</span>
                            </span>
                          ) : null}
                        </div>

                        {/* Phone Number Field & Action */}
                        <div data-help-key="staff_phone" className="sm:col-span-3 flex flex-col gap-1">
                          <label className="text-[11px] text-[#777586] font-semibold flex items-center justify-between">
                            <span>{isRTL ? 'رقم الهاتف' : 'Phone Number'}</span>
                            <span
                              className="font-mono text-[10px] text-[#2a14b4] bg-[#e3dfff]/70 px-1.5 py-0.5 rounded flex items-center gap-1 font-bold shadow-2xs"
                              title={`Agent Country: ${agentDialInfo.countryNameEn} (${agentDialInfo.dialCode})`}
                            >
                              <span>{agentDialInfo.flag}</span>
                              <span dir="ltr">{agentDialInfo.dialCode}</span>
                            </span>
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="tel"
                              data-help-key="staff_phone"
                              value={staff.phone_number || ''}
                              onChange={(e) => handleUpdateStaff(index, 'phone_number', e.target.value)}
                              onBlur={() => handleStaffBlur(index, 'phone_number')}
                              onFocus={(e) => {
                                if (!e.target.value.trim()) {
                                  handleUpdateStaff(index, 'phone_number', `${agentDialInfo.dialCode} `);
                                }
                              }}
                              placeholder={agentDialInfo.placeholder}
                              className={`w-full min-h-[44px] px-3 rounded-xl bg-white text-[#131b2e] font-mono text-sm sm:text-xs border focus:outline-none shadow-sm transition-all ${
                                val?.phoneFormatError || val?.phoneDbError
                                ? 'border-[#ba1a1a] focus:ring-1 focus:ring-[#ba1a1a] bg-rose-50/20'
                                : staff.phone_number && !val?.phoneFormatError && !val?.phoneDbError && !val?.isCheckingPhone
                                ? 'border-[#006c4a] focus:ring-1 focus:ring-[#006c4a]'
                                : 'border-transparent focus:ring-1 focus:ring-[#2a14b4]'
                              }`}
                            />
                            {staffList.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveStaffRow(index)}
                                className="min-w-[44px] min-h-[44px] shrink-0 rounded-xl text-[#777586] hover:text-[#ba1a1a] hover:bg-rose-50 flex items-center justify-center transition-colors"
                                title={isRTL ? 'حذف العضو' : 'Remove Account'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          {val?.isCheckingPhone ? (
                            <span className="text-[10px] text-[#2a14b4] flex items-center gap-1 font-medium animate-pulse">
                              <RefreshCw className="w-3 h-3 animate-spin text-[#2a14b4]" />
                              <span>{isRTL ? 'جاري فحص الهاتف...' : 'Checking phone...'}</span>
                            </span>
                          ) : val?.phoneFormatError || val?.phoneDbError ? (
                            <span className="text-[10px] text-[#ba1a1a] flex items-center gap-1 font-medium">
                              <AlertCircle className="w-3 h-3 text-[#ba1a1a]" />
                              <span>{val.phoneFormatError || val.phoneDbError}</span>
                            </span>
                          ) : staff.phone_number &&
                            staff.phone_number.trim() !== agentDialInfo.dialCode &&
                            !Object.values(COUNTRY_DIAL_CODES).some(
                              (c) => staff.phone_number?.trim() === c.dialCode || staff.phone_number?.trim() === `${c.dialCode} `
                            ) &&
                            !val?.phoneFormatError &&
                            !val?.phoneDbError ? (
                            <span className="text-[10px] text-[#006c4a] flex items-center gap-1 font-medium">
                              <CheckCircle2 className="w-3 h-3 text-[#006c4a]" />
                              <span>{isRTL ? 'الهاتف متاح' : 'Phone available'}</span>
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Password & Security Row */}
                      <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-[#777586] font-medium flex items-center gap-1">
                            <KeyRound className="w-3 h-3 text-[#2a14b4]" />
                            <span>{isRTL ? 'كلمة المرور:' : 'Temp Password:'}</span>
                          </span>
                          <span className="font-mono text-xs font-semibold px-2 py-1 rounded-lg bg-white border border-slate-200 text-[#131b2e]">
                            {showPass ? staff.password : '••••••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setShowStaffPasswords(prev => ({
                                ...prev,
                                [staffKey]: !showPass,
                              }))
                            }
                            className="min-h-[40px] min-w-[40px] flex items-center justify-center text-[#777586] hover:text-[#131b2e] rounded-lg transition-colors"
                            title={showPass ? (isRTL ? 'إخفاء' : 'Hide') : (isRTL ? 'إظهار' : 'Show')}
                          >
                            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleRegeneratePassword(index)}
                            className="min-h-[40px] px-2.5 text-xs text-[#2a14b4] hover:text-[#4338ca] font-semibold flex items-center gap-1.5 rounded-lg hover:bg-white/60 transition-colors"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>{isRTL ? 'توليد كلمة سر جديدة' : 'Generate New Password'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Password Security Options Footer */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <label className="min-h-[44px] flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={forcePasswordReset}
                    onChange={(e) => setForcePasswordReset(e.target.checked)}
                    className="w-5 h-5 rounded text-[#2a14b4] focus:ring-[#2a14b4] accent-[#2a14b4] shrink-0"
                  />
                  <span className="text-xs text-[#131b2e]">
                    {isRTL
                      ? 'إلزام الموظف بتغيير كلمة المرور عند أول تسجيل دخول'
                      : 'Force mandatory password reset upon staff first login'}
                  </span>
                </label>

                <div className="flex items-center gap-1.5 text-[#777586] font-mono text-[11px]">
                  <Lock className="w-3.5 h-3.5" />
                  <span>256-bit BCrypt token hashing</span>
                </div>
              </div>
            </section>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: Sticky Real-Time Preview & Commission Calculator (4 cols)   */}
          {/* ========================================================================= */}
          <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-36">
            {/* 1. Interactive Live Boutique Customer Portal Mockup Card */}
            <div className="rounded-2xl bg-white shadow-lg overflow-hidden transition-all border border-slate-200/80">
              {/* Card Window Header */}
              <div className="px-4 py-2 bg-[#f2f3ff] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ba1a1a]/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#006c4a]/80" />
                  <span className="ml-2 font-mono text-[11px] text-[#777586] truncate max-w-[150px]">
                    {subdomainSlug ? subdomainSlug + '.envisioneyewear.store' : 'your-shop.envisioneyewear.store'}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#82f5c1] text-[#00714e] font-mono text-[10px] font-bold uppercase">
                  Live Mockup
                </span>
              </div>

              {/* Branded Storefront Frame */}
              <div className="relative bg-[#faf8ff]">
                {/* Hero banner mockup reacting to primary brand accent & uploaded showroom image */}
                <div
                  className="relative h-28 w-full p-4 flex flex-col justify-between text-white transition-colors overflow-hidden"
                  style={{
                    backgroundColor: primaryColor,
                    backgroundImage: bgImageUrl
                      ? `linear-gradient(rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.75)), url(${bgImageUrl})`
                      : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-white/20 flex items-center justify-center backdrop-blur-xs">
                        <Glasses className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-bold text-sm truncate max-w-[170px]">
                        {shopName || (isRTL ? 'اسم متجرك' : 'Your Boutique Name')}
                      </span>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                      <ShoppingBag className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-white/90 font-mono">
                    <span className="truncate max-w-[190px]">
                      {location || (isRTL ? 'الفرع والمدينة' : 'City & Location')}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-white/30 text-white text-[9px] font-bold">
                      OPEN
                    </span>
                  </div>
                </div>

                {/* Mini Storefront Content */}
                <div className="p-4 flex flex-col gap-3 bg-white">
                  {/* Agent Attribution Tag */}
                  <div className="p-2 rounded-lg bg-[#e3dfff]/20 flex items-center justify-between text-[11px]">
                    <span className="text-[#464554] font-mono">Affiliated Regional Partner:</span>
                    <span className="text-[#2a14b4] font-mono font-bold truncate max-w-[150px]">
                      {agentName}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Agent Monthly Commission Breakdown Card */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#131b2e]">
                  {isRTL ? 'توقعات أرباح الوكيل' : 'Commission Projection'}
                </span>
                <Coins className="w-5 h-5 text-[#006c4a]" />
              </div>

              <div className="p-4 rounded-xl bg-[#f2f3ff] flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-[#464554]">
                  <span>{isRTL ? 'اشتراك العميل:' : 'Client Subscription:'}</span>
                  <span className="font-mono font-bold text-[#131b2e]">
                    {effectiveBasePrice.toFixed(2)} {currencySymbol} / mo
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-[#464554]">
                  <span>{isRTL ? 'نسبة عمولة الوكيل:' : 'Agent Split Percentage:'}</span>
                  <span className="font-mono font-bold text-[#2a14b4]">50% Guaranteed</span>
                </div>

                <div className="flex items-center justify-between text-xs text-[#464554]">
                  <span>{isRTL ? 'دورة الفوترة:' : 'Billing Cadence:'}</span>
                  <span className="font-mono text-[#777586]">
                    {billingCycle === 'annual'
                      ? 'Annual Plan (10 Mo Billing)'
                      : 'Monthly Recurring'}
                  </span>
                </div>

                <div className="my-1 border-t border-slate-200" />

                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span className="text-xs font-bold text-[#131b2e] block">
                      {isRTL ? 'عائدك المتكرر شهرياً' : 'Your Recurring Yield'}
                    </span>
                    <span className="font-mono text-[10px] text-[#777586] block">
                      {isRTL ? 'إيداع دوري بحساب الوكيل' : 'Auto-deposited to Arab Bank IBAN'}
                    </span>
                  </div>
                  <span className="text-3xl font-extrabold text-[#006c4a] font-mono">
                    +{agentCommission.toFixed(2)}{' '}
                    <span className="text-sm font-semibold">{currencySymbol}</span>
                  </span>
                </div>
              </div>

              {/* Pre-Flight Provisioning Status Checklist */}
              <div className="flex flex-col gap-2 pt-1">
                <span className="text-[11px] text-[#777586] font-bold uppercase tracking-wider block">
                  {isRTL ? 'جاهزية الربط في النظام' : 'Pre-Flight Provisioning Status'}
                </span>

                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-[#131b2e]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#006c4a]" />
                    <span>Supabase RLS Tenant Isolation</span>
                  </span>
                  <span className="font-mono text-[11px] text-[#006c4a] font-semibold">Active</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-[#131b2e]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#006c4a]" />
                    <span>Cloudinary CDN Assets Sandbox</span>
                  </span>
                  <span className="font-mono text-[11px] text-[#006c4a] font-semibold">Ready</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-[#131b2e]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#006c4a]" />
                    <span>Agent Handshake Scoping</span>
                  </span>
                  <span className="font-mono text-[11px] text-[#2a14b4] font-bold">Bound</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STITCH DESIGN FOOTER                                                      */}
        {/* ========================================================================= */}
        <footer className="w-full bg-[#f2f3ff] py-6 mt-12 mb-16 border-t border-slate-200/80 rounded-xl">
          <div className="w-full px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-[#464554]">
              <span>
                {isRTL
                  ? `© 2025 بوابة شركاء OpticPortal. مرخص للوكيل المعتمد ${agentName}.`
                  : `© 2025 OpticPortal Partner Hub. Licensed to Regional Optical Agent ${agentName}.`}
              </span>
            </div>
            <div className="flex items-center gap-4 font-mono text-[11px]">
              <span className="text-[#006c4a] flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-[#006c4a]"></span>
                {isRTL ? 'محرك عمولات الشريك نشط' : 'Partner Commission Engine Active'}
              </span>
              <span className="text-[#777586]">Sync: Supabase • Media: Cloudinary CDN</span>
            </div>
          </div>
        </footer>
      </div>

      {/* ========================================================================= */}
      {/* 3. FLOATING BOTTOM DOCKED ACTION BAR (Above bottom nav on mobile)         */}
      {/* ========================================================================= */}
      <div className="fixed bottom-16 md:bottom-0 left-0 w-full z-30 bg-[#faf8ff]/95 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
          {/* Summary Pill with Live Validation State (hidden on extra-small screens to keep sticky bar compact) */}
          <div className="hidden md:flex items-center gap-3">
            {isCheckingDb ? (
              <RefreshCw className="w-4 h-4 text-[#2a14b4] animate-spin shrink-0" />
            ) : !isFormValid ? (
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            ) : (
              <div className="w-3 h-3 rounded-full bg-[#006c4a] animate-pulse shrink-0" />
            )}
            <div className="text-left rtl:text-right">
              <span className="text-xs font-bold text-[#131b2e] block leading-tight">
                {isCheckingDb ? (
                  <span className="text-[#2a14b4]">
                    {isRTL ? 'جاري الفحص المباشر في قاعدة البيانات...' : 'Checking Database Availability...'}
                  </span>
                ) : !isFormValid ? (
                  <span className="text-amber-700">
                    {isRTL ? 'بانتظار استكمال متطلبات التسجيل' : 'Validation Required Before Provisioning'}
                  </span>
                ) : (
                  <>
                    {isRTL ? 'جاهز للتسجيل: ' : 'Ready to provision: '}
                    <span className="text-[#2a14b4]">{shopName || 'Optical Boutique'}</span>
                  </>
                )}
              </span>
              <span className="font-mono text-[11px] text-[#777586] block">
                {isCheckingDb ? (
                  isRTL ? 'التحقق من عدم تكرار اسم المتجر، الرابط، أو البريد الإلكتروني...' : 'Validating uniqueness of boutique name, subdomain & email roster...'
                ) : !isFormValid ? (
                  isCheckingShopName
                    ? (isRTL ? 'جاري التحقق من اسم المتجر في قاعدة البيانات...' : 'Verifying optical shop name in database...')
                    : isShopNameTaken
                    ? (isRTL ? 'اسم المتجر مسجل بالفعل في قاعدة البيانات - يرجى اختيار اسم آخر' : 'Optical shop name taken in database - choose a different name')
                    : !isShopNameValid
                    ? (isRTL ? 'اسم المتجر مطلوب وفريد (3 أحرف على الأقل)' : 'Shop name required, min 3 chars & unique')
                    : !isLocationValid
                    ? (isRTL ? 'الموقع الجغرافي والفرع مطلوب' : 'Physical hub & city required')
                    : !isSubdomainValid
                    ? (isRTL ? 'الرابط المخصص محجوز أو غير صالح' : 'Dedicated subdomain endpoint taken or invalid')
                    : !isOwnerEmailValid
                    ? (ownerEmailValidation.dbError
                        ? (isRTL ? 'البريد مسجل في مستخدمي Supabase - يرجى اختيار بريد مختلف' : 'Email registered in Supabase users - choose a different email')
                        : ownerEmailValidation.formatError
                        ? ownerEmailValidation.formatError
                        : (isRTL ? 'بريد المالك غير صالح أو مكرر' : 'Owner email invalid or duplicate'))
                    : !areStaffValid
                    ? (Object.values(staffValidations).some((v) => v.emailDbError)
                        ? (isRTL ? 'بريد موظف مسجل في Supabase - يرجى اختيار بريد مختلف' : 'Staff email registered in Supabase users - choose a different email')
                        : (isRTL ? 'تضارب في بريد موظف - يرجى التأكد من عدم التكرار' : 'Staff email duplicate or conflict detected'))
                    : !pricingResult.ok
                    ? (isRTL ? 'أسعار الصرف غير متوفرة حالياً' : 'Pricing rates unavailable')
                    : (isRTL ? 'يرجى التحقق من استكمال الحقول المطلوبة' : 'Check required fields')
                ) : (
                  <>
                    Plan: {currentTierInfo.name} ({effectiveBasePrice} {currencySymbol}/mo) • Agent Share:{' '}
                    <span className="text-[#006c4a] font-bold">
                      {agentCommission.toFixed(2)} {currencySymbol}/mo
                    </span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 sm:flex items-center gap-2 sm:gap-3 w-full md:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                setCopiedSummary(false);
              }}
              className="hidden sm:inline-flex min-h-[44px] items-center justify-center px-4 py-2 rounded-xl bg-[#f2f3ff] hover:bg-[#eaedff] text-[#464554] text-xs font-semibold transition-colors text-center"
            >
              {isRTL ? 'حفظ كمسودة' : 'Save Draft'}
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="col-span-1 sm:w-auto min-h-[52px] sm:min-h-[48px] px-3 sm:px-4 py-2.5 rounded-xl bg-[#f2f3ff] hover:bg-[#eaedff] text-[#464554] text-sm sm:text-xs font-semibold transition-colors text-center"
            >
              {isRTL ? 'إلغاء' : 'Cancel'}
            </button>

            <button
              type="button"
              disabled={!isFormValid || isCheckingShopName || isShopNameTaken || isCheckingDb || isSubmitting || isLogoUploading || isBgUploading || ratesLoading || !pricingResult.ok}
              onClick={() => handleSubmit()}
              className="col-span-2 sm:w-auto min-h-[52px] sm:min-h-[48px] inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl bg-[#2a14b4] hover:bg-[#4338ca] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm sm:text-xs font-bold shadow-md hover:shadow-lg transition-all text-center"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                  <span className="truncate">{isRTL ? 'جاري التجهيز...' : 'Provisioning...'}</span>
                </>
              ) : isCheckingShopName || isCheckingDb ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                  <span className="truncate">{isRTL ? 'جاري الفحص...' : 'Checking DB...'}</span>
                </>
              ) : isShopNameTaken ? (
                <>
                  <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
                  <span className="truncate">{isRTL ? 'الاسم مسجل' : 'Name Taken'}</span>
                </>
              ) : !isFormValid ? (
                <>
                  <AlertCircle className="w-4 h-4 text-amber-300 shrink-0" />
                  <span className="truncate">{isRTL ? 'استكمل البيانات المطلوبة' : 'Complete Required Fields'}</span>
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 shrink-0" />
                  <span className="truncate">
                    {isRTL
                      ? `إتمام التسجيل (${staffList.length})`
                      : 'Provision Storefront'}
                  </span>
                  <kbd className="hidden md:inline-block ml-1 px-1.5 py-0.5 rounded bg-white/20 text-white font-mono text-[10px]">
                    Alt + Enter
                  </kbd>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. CONTEXT-AWARE HELP DRAWER & FLOATING ACTION BUTTON                      */}
      {/* ========================================================================= */}
      <OnboardingHelpDrawer
        activeFieldKey={activeFieldKey}
        lastFocusedKey={lastFocusedKey}
        activeHelpItem={activeHelpItem}
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        onToggle={toggleHelp}
        onSelectField={selectFieldForHelp}
      />

      {/* ========================================================================= */}
      {/* 5. SUCCESS MODAL: Provisioned Credentials Summary & WhatsApp Sharing       */}
      {/* ========================================================================= */}
      {provisionedModalData && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full sm:my-8 overflow-hidden max-h-[92vh] flex flex-col pb-safe">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-600 to-teal-700 text-white relative shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20 text-emerald-100 text-[10px] font-semibold mb-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                    <span>Onboarded & Auth Trigger Executed</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold">
                    {isRTL ? 'تم إنشاء المتجر وحسابات الموظفين بنجاح!' : 'Boutique & Staff Credentials Provisioned!'}
                  </h3>
                  <p className="text-xs text-emerald-100 mt-0.5 truncate">
                    {provisionedModalData.shop.shop_name} • {provisionedModalData.shop.location}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <span className="text-slate-500 font-medium block">
                    {isRTL ? 'رابط الدخول لبوابة المتجر:' : 'Storefront Portal Link:'}
                  </span>
                  <span className="font-mono font-bold text-slate-900 text-[13px] break-all dir-ltr">
                    https://{provisionedModalData.shop.config?.subdomain_slug || 'shop'}.envisioneyewear.store
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px] shrink-0">
                  {provisionedModalData.shop.tier}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    {isRTL ? 'بيانات دخول الموظفين المنشأة:' : 'Provisioned Staff Credentials:'}
                  </h4>
                  <span className="text-xs text-slate-400">
                    {provisionedModalData.credentials.length} accounts
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                  {provisionedModalData.credentials.map((cred, idx) => {
                    const isCopied = copiedIndex === idx;

                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-2xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{cred.full_name}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-mono">
                              {cred.role}
                            </span>
                          </div>

                          <div>
                            {cred.status === 'created' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Active</span>
                              </span>
                            ) : cred.status === 'already_exists' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                                <span>Existing User</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                                <span>Failed</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                          <div className="flex items-center justify-between px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-slate-500 truncate mr-2">{cred.email}</span>
                            <button
                              type="button"
                              onClick={() => handleCopySingle(cred.email, idx * 10)}
                              className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-lg"
                              title="Copy email"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-slate-700 font-bold truncate mr-2">
                              {cred.password || '••••••••'}
                            </span>
                            {cred.password && (
                              <button
                                type="button"
                                onClick={() => handleCopySingle(cred.password!, idx * 10 + 1)}
                                className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-lg"
                                title="Copy password"
                              >
                                {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={handleCopyAll}
                  className="w-full sm:w-auto min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  {copiedAll ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">All Credentials Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-500" />
                      <span>{isRTL ? 'نسخ كافة البيانات للمشاركة (واتساب/بريد)' : 'Copy All Credentials for WhatsApp'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const shop = provisionedModalData.shop;
                    setProvisionedModalData(null);
                    onShopOnboarded(shop);
                  }}
                  className="w-full sm:w-auto min-h-[48px] px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-white transition-colors shadow-xs flex items-center justify-center gap-2"
                >
                  <span>{isRTL ? 'تم، الانتقال إلى قائمة المتاجر' : 'Done & View in Directory'}</span>
                  <ArrowRight className={`w-3.5 h-3.5 ${isRTL ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
