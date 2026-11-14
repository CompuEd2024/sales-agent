import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ar';

export interface Translations {
  [key: string]: {
    en: string;
    ar: string;
  };
}

export const DICTIONARY: Translations = {
  // Brand & Global
  appName: { en: 'OpticPortal', ar: 'بوابة البصريات' },
  agentTerminal: { en: 'Agent Terminal', ar: 'منصة وكيل المبيعات' },
  salesAgent: { en: 'Sales Agent', ar: 'وكيل مبيعات' },
  seniorSalesAgent: { en: 'Senior Sales Representative', ar: 'ممثل مبيعات أول' },
  activeShops: { en: 'Active Optical Shops', ar: 'متاجر البصريات النشطة' },
  shopsCountSuffix: { en: 'shops', ar: 'متاجر' },
  thisMonthCommission: { en: 'This Month Commission (50%)', ar: 'عمولة هذا الشهر (50%)' },
  supabaseLive: { en: 'Supabase Live', ar: 'سوبابيس متصل' },
  demoDb: { en: 'Demo DB', ar: 'قاعدة بيانات تجريبية' },
  logOut: { en: 'Log Out', ar: 'تسجيل الخروج' },
  switchLanguage: { en: 'العربية', ar: 'English' },

  // Navigation Tabs
  tabShops: { en: 'Shops Directory', ar: 'دليل محلات البصريات' },
  tabOnboard: { en: 'Onboard New Shop', ar: 'تسجيل متجر جديد' },
  tabLedger: { en: 'Financial Ledger', ar: 'السجل المالي والعمولات' },

  // Page Headers
  headerShopsTitle: { en: 'Optical Shops Directory', ar: 'دليل محلات البصريات' },
  headerShopsSubtitle: {
    en: 'Managing assigned Optical Shops',
    ar: 'إدارة محلات البصريات المخصصة',
  },
  headerOnboardTitle: { en: 'Onboard New Optical Boutique', ar: 'تسجيل متجر بصريات جديد' },
  headerOnboardSubtitle: {
    en: 'Register shop credentials, configure custom digital branding, and assign monthly subscription tier',
    ar: 'تسجيل بيانات المتجر، ورفع الهوية البصرية، وتعيين باقة الاشتراك الشهري بنسبة عمولة 50%',
  },
  headerLedgerTitle: { en: 'Subscription Commission Ledger (50/50)', ar: 'السجل المالي لعمولات الاشتراكات (50/50)' },
  headerLedgerSubtitle: {
    en: 'Automated 50/50 sales agent revenue split tracking & payment history',
    ar: 'التتبع الآلي لتقاسم الإيرادات بنسبة 50/50 بين الوكيل والمنصة وسجل التحصيلات',
  },

  // Directory Page
  searchShopsPlaceholder: {
    en: 'Search optical shops by name, city, email or slug...',
    ar: 'ابحث عن المتاجر بالاسم، المدينة، البريد أو الرابط...',
  },
  tierFilter: { en: 'Tier:', ar: 'الباقة:' },
  allTiers: { en: 'All Tiers', ar: 'كافة الباقات' },
  cardsView: { en: 'Cards', ar: 'بطاقات' },
  tableView: { en: 'Table', ar: 'جدول' },
  noShopsFound: { en: 'No optical shops found', ar: 'لم يتم العثور على أي متجر' },
  noShopsFoundDesc: {
    en: 'You have not onboarded any optical shops yet. Start by onboarding your first client.',
    ar: 'لم تقم بتسجيل أي متجر بصريات حتى الآن. ابدأ الآن بتسجيل أول عميل.',
  },
  onboardFirstBtn: { en: '+ Onboard First Shop', ar: '+ تسجيل أول متجر' },
  tierSuffix: { en: 'Tier', ar: 'باقة' },
  owner: { en: 'Owner:', ar: 'المالك:' },
  portalSubdomain: { en: 'Portal Subdomain:', ar: 'النطاق الفرعي للمتجر:' },
  brandingColors: { en: 'Branding Colors:', ar: 'ألوان الهوية:' },
  status: { en: 'Status:', ar: 'الحالة:' },
  activeSubscription: { en: 'Active Subscription', ar: 'اشتراك نشط' },
  inactivePaused: { en: 'Inactive / Paused', ar: 'متوقف مؤقتاً' },
  previewPortal: { en: 'Preview Shop Live Portal', ar: 'معاينة متجر العميل' },
  changeTier: { en: 'Change Tier', ar: 'تغيير الباقة' },
  branding: { en: 'Branding', ar: 'الهوية والتصميم' },
  recordPayment: { en: 'Record Payment', ar: 'تسجيل دفعة' },
  recordPaymentAndChangeStatus: {
    en: 'Record Payment and Change Status',
    ar: 'تسجيل دفعة وتغيير الحالة',
  },
  recordFee: { en: 'Record Subscription Fee', ar: 'تسجيل دفعة اشتراك' },
  backToDirectory: { en: '← Back to Directory', ar: '← العودة إلى الدليل' },

  // Table Columns
  colOpticalShop: { en: 'Optical Shop', ar: 'متجر البصريات' },
  colLocation: { en: 'Location', ar: 'الموقع' },
  colOwnerEmail: { en: 'Owner Email', ar: 'بريد المالك' },
  colCurrentTier: { en: 'Current Tier', ar: 'الباقة الحالية' },
  colSubdomain: { en: 'Subdomain', ar: 'النطاق الفرعي' },
  colStatus: { en: 'Status', ar: 'الحالة' },
  colQuickActions: { en: 'Quick Actions', ar: 'إجراءات سريعة' },

  // Onboard Form
  step1Title: { en: 'Boutique Credentials & Location', ar: 'بيانات المتجر والموقع' },
  shopName: { en: 'Shop Name', ar: 'اسم متجر البصريات' },
  locationCity: { en: 'Location / City', ar: 'الموقع / المدينة' },
  ownerEmail: { en: 'Owner Email Address', ar: 'البريد الإلكتروني للمالك' },
  subdomainSlug: { en: 'Subdomain Slug', ar: 'الاسم الفرعي للرابط (Slug)' },
  step2Title: { en: 'Initial Subscription Tier', ar: 'باقة الاشتراك الابتدائية' },
  step2Subtitle: {
    en: 'You earn 50% commission automatically on each billing cycle',
    ar: 'تحصل على عمولة 50% تلقائياً مع كل عملية سداد شهرية',
  },
  agentCut50: { en: 'Agent Cut: ', ar: 'نصيب الوكيل: ' },
  step3Title: { en: 'Primary & Secondary Brand Colors & Visual Identity', ar: 'ألوان الهوية ورفع الشعار وصورة المعرض' },
  primaryColor: { en: 'Primary Theme Color', ar: 'اللون الأساسي' },
  secondaryColor: { en: 'Secondary Theme Color', ar: 'اللون الثانوي' },
  recommendedPalettes: { en: 'Recommended Optical Palettes:', ar: 'لوحات ألوان بصرية مقترحة:' },
  logoCloudinaryLabel: { en: 'Shop Logo', ar: 'شعار المتجر' },
  bannerCloudinaryLabel: { en: 'Storefront Banner Background', ar: 'صورة واجهة المتجر' },
  uploadToCloudinaryBtn: { en: 'Upload Image', ar: 'رفع الصورة' },
  orManualUrl: { en: 'Or paste image URL directly:', ar: 'أو الصق رابط الصورة مباشرة:' },
  cancelBtn: { en: 'Cancel', ar: 'إلغاء' },
  cancelAndGoBack: { en: 'Cancel & Go Back', ar: 'إلغاء والعودة' },
  closePreview: { en: 'Close Preview', ar: 'إغلاق المعاينة' },
  submitOnboardBtn: { en: 'Create Shop & Provision Branding', ar: 'إنشاء المتجر وحفظ الهوية' },
  submittingOnboard: { en: 'Onboarding Shop & Provisioning...', ar: 'جاري إنشاء المتجر وحفظ الهوية...' },
  cloudinarySuccessBadge: { en: 'Image Uploaded Successfully', ar: 'تم رفع وحفظ الصورة بنجاح' },

  // Ledger Page
  totalCollected: { en: 'Total Collected (All-Time)', ar: 'إجمالي المحصل (كافة الأوقات)' },
  grossSubscriptionsDesc: { en: 'Gross optical shop subscriptions recorded', ar: 'إجمالي مدفوعات اشتراكات المتاجر' },
  yourCommission: { en: 'Your Commission (50%)', ar: 'عمولتك كوكيل (50%)' },
  automatedSplitDesc: { en: 'Automated 50/50 sales agent commission payout', ar: 'تقاسم فوري للإيراد بنسبة 50% للوكيل' },
  platformShare: { en: 'Platform Share (50%)', ar: 'حصة المنصة (50%)' },
  platformShareDesc: { en: 'Infrastructure, hosting & platform royalty', ar: 'تكاليف الخوادم والبنية التحتية والتشغيل' },
  thisMonthCommissionBox: { en: 'This Month Commission', ar: 'عمولة الشهر الحالي' },
  subscriptionPaymentsThisMonth: { en: 'subscription payments this month', ar: 'دفعات اشتراك تم تسجيلها هذا الشهر' },
  searchLedger: { en: 'Search ledger entries...', ar: 'البحث في القيود المالية...' },
  filterByShop: { en: 'Filter by Shop:', ar: 'تصفية حسب المتجر:' },
  allBoutiques: { en: 'All Optical Boutiques', ar: 'كافة متاجر البصريات' },
  exportCsv: { en: 'Export CSV', ar: 'تصدير كملف CSV' },
  colLoggedDate: { en: 'Logged Date', ar: 'تاريخ القيد' },
  colBillingPeriod: { en: 'Billing Period', ar: 'فترة الاشتراك' },
  colPaymentMonth: { en: 'Payment For Month', ar: 'الدفعة عن شهر' },
  colAmountPaid: { en: 'Amount Paid', ar: 'المبلغ المدفوع' },
  colAgentCommission50: { en: 'Agent Commission (50%)', ar: 'عمولة الوكيل (50%)' },
  colPlatformShare50: { en: 'Platform Share (50%)', ar: 'حصة المنصة (50%)' },
  statusCleared: { en: 'Cleared (50/50)', ar: 'تمت التسوية (50/50)' },
  noPaymentRecords: { en: 'No payment records found', ar: 'لا توجد سجلات دفعات' },
  noPaymentRecordsDesc: {
    en: 'No matching subscription billing records found for the selected filters. Click "Record Payment" to log a fee collected by you.',
    ar: 'لم يتم العثور على قيود دفع للشهر أو المتجر المحدد. انقر على "تسجيل دفعة" لإضافة اشتراك قمت بتحصيله والحصول على عمولتك 50%.',
  },
  monthChoice: { en: 'Month Filter:', ar: 'تصفية حسب الشهر:' },
  allMonths: { en: 'All Months (All-Time)', ar: 'كافة الأشهر (السجل الشامل)' },
  chooseAnyMonth: { en: 'Choose Month:', ar: 'اختر الشهر:' },
  customMonthPicker: { en: 'Pick Month', ar: 'تحديد شهر' },
  monthlyLedgerTitle: { en: 'Monthly Commission Ledger', ar: 'سجل العمولات الشهري' },
  viewingMonthlyLedgerFor: { en: 'Viewing Monthly Ledger for:', ar: 'استعراض السجل الشهري لشهر:' },
  recordPaymentForMonth: { en: 'Record Payment for', ar: 'تسجيل دفعة لشهر' },
  allMonthsLedger: { en: 'All-Time Ledger', ar: 'السجل الشامل لكافة الأوقات' },
  quickMonths: { en: 'Quick Month Choice:', ar: 'اختيار شهر سريع:' },
  paymentForMonth: { en: 'Payment For Month', ar: 'الدفعة عن شهر' },
  selectPaymentMonth: { en: 'Subscription Month Being Paid', ar: 'شهر الاشتراك المسدد' },
  collectionNotice: {
    en: 'Agent collects subscription fees directly from shops and remits platform share to the app.',
    ar: 'يقوم وكيل المبيعات بتحصيل اشتراكات المتاجر مباشرة وتوريد حصة المنصة للتطبيق.',
  },
  collectedByAgentBadge: { en: 'Collected by Agent & Remitted', ar: 'حصّلها الوكيل وورّدها للمنصة' },
  collectionMethod: { en: 'Collection Method', ar: 'طريقة التحصيل' },
  methodCash: { en: 'Cash in Person', ar: 'نقداً باليد' },
  methodCliq: { en: 'CliQ / Direct Transfer', ar: 'تحويل CliQ / بنكي' },
  methodBank: { en: 'Bank Deposit', ar: 'إيداع بنكي' },
  methodPos: { en: 'POS / Terminal', ar: 'بطاقة / نقطة بيع' },
  selectedMonthHeader: { en: 'Showing Month:', ar: 'عرض سجل شهر:' },
  selectedMonthCommission: { en: 'Selected Month Commission (50%)', ar: 'عمولة الوكيل (50%) للشهر المحدد' },
  selectedMonthCollected: { en: 'Selected Month Gross Collected', ar: 'إجمالي التحصيل للشهر المحدد' },
  selectedMonthPlatform: { en: 'Selected Month Platform Share', ar: 'حصة المنصة للشهر المحدد' },
  paymentsRecordedCount: { en: 'payments cleared for this month', ar: 'دفعات مسجلة ومسواة لهذا الشهر' },
  currentViewingTag: { en: 'Filtered by Collection Month', ar: 'مفلتر حسب شهر الاشتراك' },

  // Modals: Change Tier
  changeTierTitle: { en: 'Change Subscription Tier', ar: 'تعديل باقة الاشتراك' },
  changeTierSubtitle: { en: 'Update plan and monthly revenue share for', ar: 'تحديث خطة الاشتراك والعمولة الشهرية لـ' },
  currentActivePlan: { en: 'Current Active Plan', ar: 'الخطة الحالية النشطة' },
  selectNewTier: { en: 'Select New Subscription Tier', ar: 'اختر باقة الاشتراك الجديدة' },
  updatingTier: { en: 'Updating Tier...', ar: 'جاري تحديث الباقة...' },
  updateTierBtn: { en: 'Update Subscription Tier', ar: 'تأكيد ترقية/تعديل الباقة' },

  // Modals: Configure Branding
  brandingModalTitle: { en: 'Configure Shop Branding', ar: 'تخصيص الهوية البصرية للمتجر' },
  brandingModalSubtitle: { en: 'Customize web portal presence for', ar: 'تخصيص الواجهة الرقمية وألوان متجر' },
  livePortalPreview: { en: 'Live Customer Portal Preview', ar: 'معاينة فورية لواجهة العملاء' },
  exploreEyewear: { en: 'Explore Designer Eyewear', ar: 'تصفح تشكيلة النظارات والعدسات' },
  logoImageUpload: { en: 'Shop Logo', ar: 'شعار المتجر' },
  backgroundStorefrontUpload: { en: 'Background Storefront Image', ar: 'صورة خلفية واجهة المتجر' },
  savingBranding: { en: 'Saving Branding...', ar: 'جاري حفظ الهوية...' },
  saveBrandingBtn: { en: 'Save Branding Config', ar: 'حفظ إعدادات الهوية' },

  // Modals: Record Payment
  recordPaymentTitle: { en: 'Record Subscription Payment', ar: 'تسجيل دفعة اشتراك جديدة' },
  selectBoutique: { en: 'Select Optical Boutique', ar: 'اختر متجر البصريات' },
  amountPaidJod: { en: 'Amount Paid (JOD)', ar: 'المبلغ المدفوع (دينار أردني)' },
  billingStartDate: { en: 'Billing Period Start Date', ar: 'تاريخ بداية فترة الفوترة' },
  billingEndDate: { en: 'Billing Period End Date', ar: 'تاريخ نهاية فترة الفوترة' },
  splitHeader: { en: 'Automated 50/50 Revenue Split Calculation', ar: 'الحساب الفوري لتقاسم الإيراد بنسبة 50/50' },
  yourCommissionSplit: { en: 'Your Commission (50%)', ar: 'عمولتك كوكيل (50%)' },
  platformSplit: { en: 'Platform Share (50%)', ar: 'حصة المنصة (50%)' },
  recordingPaymentBtn: { en: 'Recording Payment...', ar: 'جاري تسجيل الدفعة...' },
  recordPaymentSubmitBtn: { en: 'Record Payment & Split Revenue', ar: 'تسجيل الدفعة وتقسيم الإيراد' },

  // Modals: Live Preview
  livePreviewTitle: { en: 'Customer Portal Live Preview', ar: 'معاينة واجهة المتجر الحية للعملاء' },
  simulatingAt: { en: 'Simulating live storefront at', ar: 'محاكاة المتجر المباشر على النطاق' },
  customerFacingBadge: { en: 'Customer-Facing Live View', ar: 'واجهة العميل الحية' },
  bookEyeExam: { en: 'Book Eye Examination', ar: 'حجز موعد فحص نظر' },
  virtualTryOn: { en: 'Virtual Frame Try-On', ar: 'تجربة الإطارات الافتراضية' },
  featuredFrames: { en: 'Featured Optical Frames & Lenses', ar: 'أحدث موديلات النظارات والعدسات' },
  visitHours: { en: 'Visit Boutique & Hours', ar: 'موقع المتجر وساعات العمل' },
  openDailyHours: { en: 'Open Daily 10:00 AM – 10:00 PM', ar: 'يومياً من 10:00 صباحاً حتى 10:00 مساءً' },
  scheduleConsultation: { en: 'Schedule an optometrist consultation or contact lenses fitting.', ar: 'احجز استشارة مع أخصائي البصريات أو فحص عدسات لاصقة.' },

  // Cloudinary Settings Modal & Uploader
  cloudinarySettings: { en: 'Cloudinary Storage Settings', ar: 'إعدادات سحابة Cloudinary' },
  cloudName: { en: 'Cloud Name', ar: 'اسم السحابة (Cloud Name)' },
  uploadPreset: { en: 'Upload Preset (Unsigned)', ar: 'إعداد الرفع غير الموقع (Upload Preset)' },
  clickToUpload: { en: 'Click or drop image here to upload', ar: 'انقر أو اسحب صورة هنا لرفعها' },
  uploadingImage: { en: 'Uploading to Cloudinary CDN...', ar: 'جاري الرفع إلى سحابة Cloudinary...' },
  changeImage: { en: 'Change Image', ar: 'تغيير الصورة' },
  removeImage: { en: 'Remove', ar: 'إزالة' },
  cloudinaryTip: {
    en: 'Images are uploaded directly to Cloudinary CDN and linked automatically to Supabase.',
    ar: 'يتم رفع الصور مباشرة إلى سحابة Cloudinary وحفظ روابطها تلقائياً في سوبابيس.',
  },

  // Auth View
  agentLoginTitle: { en: 'OpticPortal Agent Terminal', ar: 'بوابة وكلاء مبيعات البصريات' },
  agentLoginSubtitle: {
    en: 'Sales agent portal for optical shop onboarding, branding, and 50/50 commission management',
    ar: 'منصة وكلاء المبيعات لتسجيل المتاجر وتخصيص الهوية ومتابعة العمولات بنسبة 50/50',
  },
  authMode: { en: 'Auth:', ar: 'المصادقة:' },
  configureDbBtn: { en: 'Configure DB', ar: 'إعدادات قاعدة البيانات' },
  emailAddress: { en: 'Agent Email Address', ar: 'البريد الإلكتروني للوكيل' },
  passwordField: { en: 'Password', ar: 'كلمة المرور' },
  signInBtn: { en: 'Sign In as Agent', ar: 'تسجيل دخول الوكيل' },
  agentNotRecognizedError: {
    en: 'Agent not recognized. You are not registered as an agent, so you cannot enter the app.',
    ar: 'الوكيل غير معروف. أنت غير مسجل كوكيل مبيعات، لذا لا يمكنك الدخول إلى التطبيق.',
  },
  quickDemoLogin: { en: 'Quick Agent Sign-In', ar: 'تسجيل دخول تجريبي سريع بنقرة واحدة' },
  continueAsTariq: { en: 'Continue as Tariq (Senior Sales Agent)', ar: 'المتابعة بحساب طارق (وكيل مبيعات أول)' },

  // Supabase Config Modal
  dbSettingsTitle: { en: 'Supabase Database Connection', ar: 'إعداد الاتصال بقاعدة بيانات سوبابيس' },
  supabaseUrlLabel: { en: 'Supabase Project URL', ar: 'رابط مشروع سوبابيس (URL)' },
  supabaseKeyLabel: { en: 'Supabase Anon Public API Key', ar: 'مفتاح Anon العام لمشروع سوبابيس' },
  sqlSetupGuide: { en: 'SQL Schema & Supabase Setup Guide', ar: 'مخطط SQL ودليل تثبيت الجداول' },
  copySql: { en: 'Copy SQL Schema', ar: 'نسخ استعلامات SQL' },
  sqlCopied: { en: 'SQL Copied!', ar: 'تم نسخ SQL بنجاح!' },
  saveDbCreds: { en: 'Save Credentials & Test Connection', ar: 'حفظ البيانات واختبار الاتصال' },
  resetLocalDemo: { en: 'Switch to Local Demo Mode', ar: 'التبديل إلى الوضع التجريبي المحلي' },

  // Toast Titles
  toastWelcomeBack: { en: 'Welcome Back', ar: 'أهلاً بعودتك' },
  toastLoginFailed: { en: 'Login Failed', ar: 'فشل تسجيل الدخول' },
  toastDemoSession: { en: 'Demo Agent Session', ar: 'جلسة الوكيل التجريبي' },
  toastTierUpdated: { en: 'Subscription Tier Updated', ar: 'تم تحديث باقة الاشتراك' },
  toastBrandingSaved: { en: 'Branding Saved', ar: 'تم حفظ الهوية البصرية' },
  toastStatusChanged: { en: 'Status Changed', ar: 'تم تغيير حالة المتجر' },
  toastShopOnboarded: { en: 'Boutique Onboarded Successfully!', ar: 'تم تسجيل متجر البصريات بنجاح!' },
  toastPaymentRecorded: { en: 'Payment Recorded Successfully', ar: 'تم تسجيل الدفعة واحتساب العمولة بنجاح' },
  toastSignedOut: { en: 'Signed Out', ar: 'تم تسجيل الخروج' },

  // Diplomatic Subscription Status & Controls
  statusActive: { en: 'Active (Normal)', ar: 'نشط (طبيعي)' },
  statusMaintenance: { en: 'Maintenance (Diplomatic Pause)', ar: 'صيانة (إيقاف دبلوماسي)' },
  statusSuspended: { en: 'Suspended (Offline)', ar: 'معلّق (غير متاح)' },
  maintenanceTooltip: {
    en: "Use 'Maintenance' mode for late payments. This presents a neutral maintenance message on the customer app to encourage the shop owner to settle their bill without public embarrassment.",
    ar: "استخدم وضع 'الصيانة' في حال تأخر السداد. يظهر هذا للعملاء رسالة صيانة محايدة تشجع صاحب المتجر على تسوية اشتراكه دون أي إحراج تجاري أمام زبائنه.",
  },
  stationMaintenanceTitle: { en: 'Station Updating & Scheduled Maintenance', ar: 'محطة التحديث والصيانة الدورية المجدولة' },
  stationMaintenanceDesc: {
    en: 'Our boutique digital frame catalog and booking terminal are currently undergoing scheduled system updates and catalog optimization. Online services will resume shortly.',
    ar: 'تخضع البوابة الرقمية لكتالوج الإطارات ونظام حجز الفحوصات حالياً لتحديثات فنية مجدولة وتحسين للأنظمة. ستستأنف الخدمات الرقمية في أقرب وقت.',
  },
  maintenanceAgentNotice: {
    en: 'Diplomatic Maintenance Active: Visitors see a neutral routine maintenance notice. The shop owner can settle their invoice with you to restore the boutique immediately.',
    ar: 'وضع الصيانة الدبلوماسية مفعّل: يرى الزوار إشعار صيانة دورية أنيق ومحايد لحماية مكانة المتجر ريثما يسدد المالك الرسوم المستحقة.',
  },
  subscriptionStatusCol: { en: 'Subscription Status', ar: 'حالة الاشتراك' },
  changeStatusBtn: { en: 'Change Status', ar: 'تغيير الحالة' },
  selectStatusPlaceholder: { en: 'Select Status...', ar: 'اختر الحالة...' },
  statusUpdatedToast: { en: 'Subscription Status Updated', ar: 'تم تحديث حالة الاشتراك بنجاح' },
  statusActiveDesc: { en: 'Normal operation. Storefront, virtual try-on, and catalog active.', ar: 'تشغيل طبيعي. البوابة والكتالوج وحجز المواعيد تعمل بشكل كامل.' },
  statusMaintenanceDesc: { en: 'Diplomatic pause. Shows neutral "Scheduled Maintenance" screen without embarrassment.', ar: 'إيقاف دبلوماسي. يعرض شاشة صيانة محايدة لحث المالك على السداد دون إحراجه.' },
  statusSuspendedDesc: { en: 'Completely locks access and shows suspended screen.', ar: 'إيقاف كلي. يحجب المتجر تماماً ويعرض إشعار تعليق الخدمة.' },

  // Hold & Suspension System
  statusFilter: { en: 'Status Filter', ar: 'تصفية الحالة' },
  allStatuses: { en: 'All Statuses', ar: 'كافة الحالات' },
  activeOnly: { en: 'Active', ar: 'النشطة' },
  maintenanceOnly: { en: 'Maintenance (Diplomatic)', ar: 'وضع الصيانة الدبلوماسي' },
  onHoldOnly: { en: 'Overdue / On Hold', ar: 'المتوقفة أو المتأخرة' },
  putOnHold: { en: 'Put On Hold', ar: 'إيقاف مؤقت' },
  stopShopBtn: { en: 'Stop / Put On Hold', ar: 'إيقاف المتجر' },
  reactivateShop: { en: 'Reactivate', ar: 'إعادة تفعيل' },
  shopOnHoldBadge: { en: 'On Hold (Unpaid)', ar: 'متوقف (اشتراك غير مسدد)' },
  shopActiveBadge: { en: 'Active', ar: 'نشط ومسدد' },
  holdReasonTitle: { en: 'Reason for Hold / Suspension', ar: 'سبب إيقاف المتجر' },
  reasonUnpaidCurrent: { en: 'Monthly subscription unpaid (Current Month)', ar: 'اشتراك شهري غير مسدد (الشهر الحالي)' },
  reasonOverdue15: { en: 'Payment overdue > 15 days', ar: 'تأخر السداد لأكثر من 15 يوماً' },
  reasonOwnerRequest: { en: 'Shop owner requested temporary hold', ar: 'طلب المالك تعليق الخدمة مؤقتاً' },
  reasonCustom: { en: 'Other custom note / reason', ar: 'ملاحظة أو سبب آخر' },
  holdNoticeExplainer: {
    en: 'Putting a shop on hold suspends their public digital catalog and booking portal. Customers will see a service pending notice until the monthly subscription is collected.',
    ar: 'إيقاف المتجر يؤدي إلى تعطيل الواجهة العامة وحجز المواعيد مؤقتاً، وسيرى الزوار إشعاراً بتعليق الخدمة لحين تسوية الاشتراك الشهري مع الوكيل.',
  },
  confirmPutOnHold: { en: 'Confirm Put On Hold', ar: 'تأكيد إيقاف المتجر' },
  confirmReactivate: { en: 'Confirm Reactivation', ar: 'تأكيد إعادة التفعيل' },
  collectAndReactivate: { en: 'Collect Payment & Reactivate', ar: 'تحصيل الاشتراك وتفعيل المتجر فوراً' },
  storefrontSuspendedNotice: { en: 'Service Temporarily Suspended - Subscription Payment Pending', ar: 'تم تعليق الخدمة مؤقتاً - بانتظار سداد الاشتراك الشهري' },
  storefrontSuspendedDesc: {
    en: 'This optical boutique storefront is currently on hold pending subscription settlement. If you are the owner, please settle your monthly fee with your OpticPortal representative to restore access immediately.',
    ar: 'خدمات هذا المتجر معلقة مؤقتاً لحين سداد الاشتراك الشهري. إذا كنت صاحب المتجر، يرجى التواصل مع مندوب OpticPortal لتسوية الرسوم واستعادة الخدمة فوراً.',
  },
  viewSuspendedPortal: { en: 'View Suspended Notice', ar: 'معاينة شاشة الإيقاف' },
  viewOriginalStorefront: { en: 'Preview Storefront Design', ar: 'معاينة تصميم المتجر' },
  customHoldReasonLabel: { en: 'Specific reason or note for hold:', ar: 'تفاصيل أو ملاحظات إضافية للإيقاف:' },
  holdDateLabel: { en: 'On Hold Since:', ar: 'متوقف منذ:' },
  unpaidNoticeWarning: { en: 'Overdue Subscription', ar: 'اشتراك متأخر' },

  // Shop Officers Management
  shopOfficersTitle: { en: 'Shop Officers', ar: 'مسؤولو المتجر' },
  noOfficersRecorded: { en: 'No officers recorded for this shop yet.', ar: 'لا يوجد مسؤولون مسجلون لهذا المتجر بعد.' },
  officerEditBtn: { en: 'Edit', ar: 'تعديل' },
  officerRemoveBtn: { en: 'Remove', ar: 'حذف' },
  officerChangePasswordBtn: { en: 'Change password', ar: 'تغيير كلمة المرور' },
  editOfficerTitle: { en: 'Edit Officer', ar: 'تعديل بيانات المسؤول' },
  editOfficerSubtitle: { en: 'Update full name, role, and email address', ar: 'تحديث الاسم الكامل والدور الوظيفي والبريد الإلكتروني' },
  removeOfficerTitle: { en: 'Are you sure?', ar: 'هل أنت متأكد؟' },
  removeOfficerConfirmDesc: {
    en: 'This will permanently delete this officer\'s login account and remove them from the shop.',
    ar: 'سيؤدي هذا الإجراء إلى حذف حساب الدخول الخاص بهذا المسؤول نهائياً وإزالته من المتجر.',
  },
  confirmRemoveBtn: { en: 'Yes, Remove Officer', ar: 'نعم، حذف المسؤول' },
  changePasswordTitle: { en: 'Change Officer Password', ar: 'تغيير كلمة مرور المسؤول' },
  newPasswordLabel: { en: 'New Password (min 8 characters)', ar: 'كلمة المرور الجديدة (8 أحرف على الأقل)' },
  passwordMinError: { en: 'Password must be at least 8 characters.', ar: 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.' },
  updatePasswordBtn: { en: 'Update Password', ar: 'تحديث كلمة المرور' },
  toastOfficerUpdated: { en: 'Officer Updated', ar: 'تم تحديث بيانات المسؤول' },
  toastOfficerRemoved: { en: 'Officer Removed', ar: 'تم حذف المسؤول' },
  toastPasswordUpdated: { en: 'Password Updated', ar: 'تم تحديث كلمة المرور' },
  toastOfficerActionFailed: { en: 'Action Failed', ar: 'فشلت العملية' },

  // Previous Payments History Modal
  viewPreviousPayments: { en: 'Previous Payments', ar: 'الدفعات السابقة' },
  previousPaymentsTitle: { en: 'Previous Subscription Payments', ar: 'سجل دفعات الاشتراك السابقة' },
  searchPaymentsPlaceholder: {
    en: 'Search letters, digits, amount, type, date, period, status...',
    ar: 'ابحث بأي حروف أو أرقام: المبلغ، النوع، التاريخ، الفترة، الحالة...',
  },
  thisShopTab: { en: 'This Shop', ar: 'هذا المتجر' },
  allShopsTab: { en: 'All Shops', ar: 'كل المتاجر' },
  paymentAmountLabel: { en: 'Amount', ar: 'المبلغ' },
  collectionTypeLabel: { en: 'Collection Type', ar: 'نوع التحصيل' },
  collectionDateLabel: { en: 'Date of Collection', ar: 'تاريخ التحصيل' },
  bankTransferDateLabel: { en: 'Bank Transfer Date', ar: 'تاريخ التحويل للبنك' },
  billingPeriodLabel: { en: 'Billing Period', ar: 'فترة الفوترة' },
  shopStatusNowLabel: { en: 'Shop Status Now', ar: 'حالة المتجر الآن' },
  pendingBankTransfer: { en: 'Pending bank transfer', ar: 'بانتظار التحويل للبنك' },
  transferredStatus: { en: 'Transferred', ar: 'تم التحويل' },
  verifiedStatus: { en: 'Verified by admin', ar: 'معتمد من الإدارة' },
  noPreviousPayments: { en: 'No previous payments recorded yet', ar: 'لا توجد دفعات سابقة مسجلة بعد' },
  noMatchingPayments: { en: 'No payment records match your search', ar: 'لا توجد دفعات مطابقة لبحثك' },
  clearSearch: { en: 'Clear Search', ar: 'مسح البحث' },
  backToRecordPayment: { en: 'Back to Record Payment', ar: 'العودة لتسجيل الدفعة' },

  // 30-Day Shop Usage & At-Risk Flagging
  usageLast30Days: { en: 'Usage (Last 30 Days)', ar: 'الاستخدام (آخر 30 يوماً)' },
  tryOnSessions: { en: 'Try-on sessions', ar: 'جلسات التجربة الافتراضية' },
  recommendationsMade: { en: 'Recommendations made', ar: 'التوصيات المقدمة' },
  lastActivityDate: { en: 'Last activity date', ar: 'تاريخ آخر نشاط' },
  noActivityRecorded: { en: 'No activity recorded', ar: 'لا يوجد نشاط مسجل' },
  atRiskFlag: { en: 'At risk', ar: 'معرض للخطر' },
  atRiskInactivityDesc: { en: 'No activity in 3+ months', ar: 'لا يوجد نشاط منذ 3 أشهر أو أكثر' },
  atRiskOnly: { en: 'At risk (3+ months inactive)', ar: 'معرض للخطر (خامل 3+ أشهر)' },
  colUsage30d: { en: 'Usage (30d)', ar: 'الاستخدام (30 يوم)' },
  todayLabel: { en: 'Today', ar: 'اليوم' },
  yesterdayLabel: { en: 'Yesterday', ar: 'أمس' },

  // Home Dashboard
  dashboardTitle: { en: 'Agent Performance Overview', ar: 'نظرة عامة على أداء الوكيل' },
  commissionEarnedThisMonth: { en: 'Commission Earned (This Month)', ar: 'العمولة المكتسبة (هذا الشهر)' },
  expectedCommissionUnpaid: { en: 'Expected Commission (Unpaid)', ar: 'العمولة المتوقعة (غير المسددة)' },
  shopsByTierTitle: { en: 'Shops by Tier', ar: 'المتاجر حسب الباقة' },
  shopsByStatusTitle: { en: 'Shops by Status', ar: 'المتاجر حسب الحالة' },
  monthlyCollections6mTitle: { en: 'Monthly Collections (Last 6 Months)', ar: 'التحصيلات الشهرية (آخر 6 أشهر)' },
  monthlyCollections6mSubtitle: {
    en: 'Gross subscription fees collected with 50% agent commission split',
    ar: 'إجمالي رسوم الاشتراكات المحصلة مع حصة الوكيل (50%)',
  },
  paidShopsSummary: { en: 'paid shops', ar: 'متاجر مسددة' },
  unpaidShopsSummary: { en: 'unpaid shops remaining', ar: 'متاجر غير مسددة متبقية' },
  allShopsPaidThisMonth: { en: 'All shops settled for this month', ar: 'تم تحصيل اشتراكات كافة المتاجر لهذا الشهر' },
  total6mCollected: { en: '6-Month Total', ar: 'إجمالي 6 أشهر' },
  viewFullLedger: { en: 'View Full Ledger', ar: 'عرض السجل المالي' },
  collectUnpaidBtn: { en: 'Record Payment', ar: 'تسجيل دفعة' },
  totalShopsCount: { en: 'Total', ar: 'الإجمالي' },
  paymentsWord: { en: 'payments', ar: 'دفعات' },
  grossCollectedShort: { en: 'collected', ar: 'محصل' },

  // Notes & Follow-ups
  notesAndFollowUpsTitle: { en: 'Notes & follow-ups', ar: 'الملاحظات والمتابعات' },
  followUpsDueTodayTitle: { en: 'Follow-ups due today', ar: 'المتابعات المستحقة اليوم' },
  addNotePlaceholder: {
    en: 'Add a note (e.g. "promised to pay Thursday")...',
    ar: 'أضف ملاحظة (مثال: وعد بالدفع يوم الخميس)...',
  },
  followUpDateOptional: { en: 'Follow-up date (optional)', ar: 'تاريخ المتابعة (اختياري)' },
  addNoteBtn: { en: 'Add Note', ar: 'إضافة ملاحظة' },
  noNotesForShop: { en: 'No notes or follow-ups yet.', ar: 'لا توجد ملاحظات أو متابعات بعد.' },
  noFollowUpsDueToday: {
    en: 'No follow-ups due today. You are all caught up.',
    ar: 'لا توجد متابعات مستحقة اليوم. تم إنجاز جميع المتابعات.',
  },
  markDoneBtn: { en: 'Mark Done', ar: 'تم التنفيذ' },
  completedLabel: { en: 'Done', ar: 'منجز' },
  dueTodayBadge: { en: 'Due today', ar: 'مستحق اليوم' },
  overdueBadge: { en: 'Overdue', ar: 'متأخر' },
  followUpLabel: { en: 'Follow-up:', ar: 'متابعة:' },
  toastNoteAdded: { en: 'Note Saved', ar: 'تم حفظ الملاحظة' },
  toastNoteUpdated: { en: 'Follow-up Updated', ar: 'تم تحديث المتابعة' },
  toastNoteDeleted: { en: 'Note Deleted', ar: 'تم حذف الملاحظة' },
  toastNoteFailed: { en: 'Note Action Failed', ar: 'فشلت عملية الملاحظة' },
  showAllNotes: { en: 'Show all', ar: 'عرض الكل' },
  showFewerNotes: { en: 'Show fewer', ar: 'عرض أقل' },

  // Upgrade Opportunity & WhatsApp Outreach
  upgradeOpportunityFlag: { en: 'Upgrade opportunity', ar: 'فرصة ترقية' },
  upgradeOpportunityOnly: { en: 'Upgrade opportunity (High usage)', ar: 'فرصة ترقية (استخدام مرتفع)' },
  upgradeToNextTierPrefix: { en: 'Next tier:', ar: 'الباقة التالية:' },
  whatsappOwnerUpgradeBtn: { en: 'WhatsApp Owner to Upgrade', ar: 'مراسلة المالك عبر واتساب للترقية' },
  whatsappUpgradeShort: { en: 'WhatsApp Upgrade', ar: 'واتساب للترقية' },
  perMonthShort: { en: '/mo', ar: '/شهرياً' },
  highUsageUpgradeHint: {
    en: 'High 30-day usage — ready for the next tier',
    ar: 'استخدام مرتفع خلال 30 يوماً — جاهز للباقة التالية',
  },

  // Share Storefront & QR Code
  shareStorefrontBtn: { en: 'Share storefront', ar: 'مشاركة واجهة المتجر' },
  shareStorefrontTitle: { en: 'Share Shop Storefront', ar: 'مشاركة رابط واجهة المتجر' },
  shareStorefrontSubtitle: {
    en: 'Share this boutique link or QR code with the shop owner and customers.',
    ar: 'شارك رابط المتجر أو رمز الاستجابة السريعة (QR) مع مالك المتجر والعملاء.',
  },
  storefrontLinkLabel: { en: 'Storefront Link', ar: 'رابط واجهة المتجر' },
  copyLinkBtn: { en: 'Copy Link', ar: 'نسخ الرابط' },
  copiedBtn: { en: 'Copied!', ar: 'تم النسخ!' },
  downloadQrBtn: { en: 'Download QR', ar: 'تحميل رمز QR' },
  shareOnWhatsAppBtn: { en: 'Share on WhatsApp', ar: 'مشاركة عبر واتساب' },
  sendToOwnerWhatsAppBtn: { en: 'Send to Owner on WhatsApp', ar: 'إرسال لمالك المتجر عبر واتساب' },
  qrScanHint: {
    en: 'Scan with any phone camera to open the live storefront',
    ar: 'امسح الرمز بكاميرا أي هاتف لفتح واجهة المتجر مباشرة',
  },
  toastQrDownloaded: { en: 'QR Code Downloaded', ar: 'تم تحميل رمز QR بنجاح' },

  // WhatsApp Message Templates
  messageTemplatesBtn: { en: 'Message templates', ar: 'قوالب الرسائل' },
  messageTemplatesTitle: { en: 'WhatsApp Message Templates', ar: 'قوالب رسائل واتساب' },
  messageTemplatesSubtitle: {
    en: 'Auto-filled with shop name, billing month, and subscription amount.',
    ar: 'تتم تعبئة اسم المتجر وشهر الفوترة والمبلغ تلقائياً.',
  },
  tplWelcome: { en: 'Welcome', ar: 'ترحيب' },
  tplPaymentReminder: { en: 'Payment Reminder', ar: 'تذكير بالدفع' },
  tplOverdueWarning: { en: 'Overdue Warning', ar: 'تنبيه تأخير' },
  tplThankYouReceipt: { en: 'Thank You & Receipt', ar: 'شكر وإيصال دفع' },
  templateLanguageLabel: { en: 'Message Language', ar: 'لغة الرسالة' },
  billingMonthShort: { en: 'Month', ar: 'الشهر' },
  amountShortLabel: { en: 'Amount', ar: 'المبلغ' },
  messagePreviewLabel: { en: 'Ready-to-Send WhatsApp Message', ar: 'معاينة نص رسالة واتساب' },
  openWhatsAppWithTextBtn: { en: 'Open WhatsApp with Message', ar: 'فتح واتساب بالرسالة جاهزة' },
  copyMessageBtn: { en: 'Copy Message', ar: 'نسخ الرسالة' },
  resetTemplateBtn: { en: 'Reset Template', ar: 'إعادة ضبط النص' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY_LANG = 'opticportal_language';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_LANG);
    return saved === 'ar' || saved === 'en' ? saved : 'en';
  });

  const isRTL = language === 'ar';

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY_LANG, lang);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  }, [language, isRTL]);

  const t = (key: string): string => {
    const item = DICTIONARY[key];
    if (!item) {
      return key;
    }
    return item[language] || item.en || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        isRTL,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export function formatMonthName(yearMonth: string, language: 'en' | 'ar'): string {
  if (!yearMonth) return '';
  const parts = yearMonth.split('-');
  if (parts.length < 2) return yearMonth;
  const yearStr = parts[0];
  const monthNum = parseInt(parts[1], 10);
  const MONTHS_EN = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const MONTHS_AR = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  const idx = monthNum - 1;
  if (idx < 0 || idx > 11) return yearMonth;
  const monthName = language === 'ar' ? MONTHS_AR[idx] : MONTHS_EN[idx];
  return `${monthName} ${yearStr}`;
}

