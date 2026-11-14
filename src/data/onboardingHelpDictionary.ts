export interface FieldHelpItem {
  key: string;
  title: string;
  titleAr: string;
  category: 'shop_details' | 'branding' | 'subscription' | 'staff';
  categoryLabel: string;
  categoryLabelAr: string;
  iconName: string;
  required: boolean;
  description: string;
  descriptionAr: string;
  instructions: string;
  instructionsAr: string;
  formattingRules: string[];
  formattingRulesAr: string[];
  examples: string[];
  quickTips: string[];
  quickTipsAr: string[];
}

export const ONBOARDING_HELP_DICTIONARY: Record<string, FieldHelpItem> = {
  shop_name: {
    key: 'shop_name',
    title: 'Shop Commercial Name',
    titleAr: 'الاسم التجاري للمتجر',
    category: 'shop_details',
    categoryLabel: 'Shop Details',
    categoryLabelAr: 'بيانات المتجر',
    iconName: 'Building2',
    required: true,
    description:
      'The official trading or brand name of the optical boutique as recognized by customers and official licensing bodies.',
    descriptionAr:
      'الاسم التجاري الرسمي لمركز البصريات كما يعرفه العملاء والمراجعون وكما هو مدون في رخصة المزاولة.',
    instructions:
      'Enter the full commercial name without abbreviations unless the brand is officially registered that way. Avoid emojis or promotional phrases.',
    instructionsAr:
      'أدخل الاسم التجاري كاملاً دون اختصارات غير رسمية وتجنب الرموز التعبيرية أو الشعارات الترويجية.',
    formattingRules: [
      'Between 3 and 60 characters long',
      'Capitalize initial letters in English (e.g. Amman Optical Center)',
      'Use official Arabic script (e.g. مركز بصريات عمان الحديث)',
    ],
    formattingRulesAr: [
      'يتراوح الطول بين 3 و 60 حرفاً',
      'كتابة الحروف الأولى كبيرة بالإنجليزية',
      'استخدام الاسم العربي المعتمد في السجل التجاري',
    ],
    examples: [
      'Amman Vision Center',
      'مركز الديار للنظارات والبصريات',
      'Royal Elite Optics & Eye Care',
      'مجمع الرؤية المتطورة للعيون',
    ],
    quickTips: [
      'This name will automatically seed the suggested subdomain URL.',
      'Displayed on customer receipts, WhatsApp notifications, and the digital catalog.',
    ],
    quickTipsAr: [
      'يتم استخدام هذا الاسم تلقائياً لاقتراح رابط الدخول (Subdomain).',
      'يظهر الاسم في فواتير العملاء ورسائل الواتساب والكتالوج الإلكتروني.',
    ],
  },

  license_number: {
    key: 'license_number',
    title: 'Commercial Reg / License ID',
    titleAr: 'رقم السجل التجاري / رخصة المزاولة',
    category: 'shop_details',
    categoryLabel: 'Shop Details',
    categoryLabelAr: 'بيانات المتجر',
    iconName: 'FileCheck',
    required: false,
    description:
      'The official government commercial registration number or Optical Center Operating License ID issued by the Ministry of Health or Trade Registry.',
    descriptionAr:
      'رقم السجل التجاري الصادر عن وزارة الصناعة والتجارة أو رقم رخصة مزاولة مهنة البصريات المعتمدة من وزارة الصحة.',
    instructions:
      'Input the official registry number to enable verified boutique badges on the platform and automated tax invoices.',
    instructionsAr:
      'أدخل رقم السجل الرسمي لإظهار شارة المتجر المعتمد في المنصة وتفعيل الفواتير الضريبية المؤتمتة.',
    formattingRules: [
      'Alphanumeric format or numeric registry ID',
      'Format: CR-XXXX-YYYY or national ID number',
      'No spaces or special characters except hyphens',
    ],
    formattingRulesAr: [
      'أرقام أو كود تسلسلي معتمد',
      'الصيغة: CR-XXXX-YYYY أو الرقم الوطني للمنشأة',
      'تجنب الفراغات واستخدم الشرطة للفصل',
    ],
    examples: [
      'CR-AMM-2024-8841',
      'MOH-OPT-90214',
      '1004928172',
      'JO-COMM-33291',
    ],
    quickTips: [
      'Entering this speeds up Jordan Customs and optical brand distribution clearances.',
      'Can be updated later from the boutique admin settings.',
    ],
    quickTipsAr: [
      'إدخال هذا الرقم يسرع اعتماد حسابات الموزعين وتخليص شحنات العدسات.',
      'يمكن تعديله لاحقاً من لوحة تحكم المتجر.',
    ],
  },

  primary_phone: {
    key: 'primary_phone',
    title: 'Primary Phone & WhatsApp',
    titleAr: 'الهاتف الرئيسي وخدمة واتساب',
    category: 'shop_details',
    categoryLabel: 'Shop Details',
    categoryLabelAr: 'بيانات المتجر',
    iconName: 'Phone',
    required: false,
    description:
      'The main front-desk optical clinic telephone or dedicated WhatsApp Business number used to receive customer inquiries and order updates.',
    descriptionAr:
      'رقم هاتف الاستقبال الرئيسي لمركز البصريات أو رقم واتساب للأعمال المخصص لاستقبال طلبات وتأكيدات فحص النظر.',
    instructions:
      'Include the international country calling code (+962 for Jordan, +966 for KSA, +971 for UAE).',
    instructionsAr:
      'يرجى كتابة رمز الاتصال الدولي (+962 للأردن، +966 للسعودية، +971 للإمارات).',
    formattingRules: [
      'E.164 international phone standard',
      'Format: +[country code][phone number]',
      'No letters, parentheses, or dashes in the stored value',
    ],
    formattingRulesAr: [
      'النسق الدولي E.164 للأرقام',
      'الصيغة: +[رمز الدولة][رقم الهاتف]',
      'تجنب الأقواس والشرطات في الحفظ',
    ],
    examples: [
      '+962 7 9123 4567',
      '+962 6 582 9910',
      '+966 50 123 4567',
      '+971 50 987 6543',
    ],
    quickTips: [
      'This number powers the 1-Click WhatsApp customer catalog inquiry button.',
      'Ensure the number has an active WhatsApp Business account.',
    ],
    quickTipsAr: [
      'يستخدم هذا الرقم في زر الاستفسار السريع عبر واتساب في الكتالوج.',
      'تأكد من تفعيل واتساب للأعمال على هذا الرقم.',
    ],
  },

  owner_email: {
    key: 'owner_email',
    title: 'Owner / Billing Email',
    titleAr: 'البريد الإلكتروني للإدارة والفوترة',
    category: 'shop_details',
    categoryLabel: 'Shop Details',
    categoryLabelAr: 'بيانات المتجر',
    iconName: 'Mail',
    required: true,
    description:
      'The primary executive contact email for the boutique owner. Used for monthly subscription invoices, commission notices, and critical security alerts.',
    descriptionAr:
      'البريد الإلكتروني المباشر لمالك المتجر أو الإدارة المالية. يستخدم لإرسال فواتير الاشتراك الشهري وإشعارات الأمان.',
    instructions:
      'Provide an actively monitored business or personal email address belonging to the optical shop owner or general manager.',
    instructionsAr:
      'أدخل بريداً إلكترونياً مفعلًا يتم متابعته بانتظام من قِبل مالك المتجر أو المدير العام.',
    formattingRules: [
      'Standard valid email syntax (username@domain.extension)',
      'Lower-case only (auto-normalized)',
      'Avoid disposable or temporary email domains',
    ],
    formattingRulesAr: [
      'صيغة بريد إلكتروني صحيحة (name@domain.com)',
      'أحرف صغيرة خالية من الفراغات',
      'تجنب البريد المؤقت أو غير الرسمي',
    ],
    examples: [
      'owner@ammanvision.com',
      'dr.faris@opticselite.jo',
      'manager@aldiyaroptics.com',
      'eyecare.jordan@gmail.com',
    ],
    quickTips: [
      'This email will automatically become the login for the default Shop Owner staff account.',
      'Subscription receipts and ledger payout summaries are dispatched here.',
    ],
    quickTipsAr: [
      'يتم ربط هذا البريد تلقائياً بحساب المالك الرئيسي (Shop Owner).',
      'تصل تقارير الفوترة وعمولات المبيعات الشهرية إلى هذا البريد.',
    ],
  },

  physical_address: {
    key: 'physical_address',
    title: 'Physical Address / Street',
    titleAr: 'العنوان التفصيلي / اسم الشارع',
    category: 'shop_details',
    categoryLabel: 'Shop Details',
    categoryLabelAr: 'بيانات المتجر',
    iconName: 'MapPin',
    required: false,
    description:
      'The exact street, building number, and landmark where the physical optical dispensary is situated.',
    descriptionAr:
      'الموقع الجغرافي الدقيق لفرع البصريات شامل اسم الشارع، رقم العمارة، وأقرب معلم معروف.',
    instructions:
      'Specify the street name, building number or floor to help local optical patients locate the branch easily.',
    instructionsAr:
      'حدد اسم الشارع ورقم المجمع أو الطابق لمساعدة المراجعين في الوصول لفرع المركز بسهولة.',
    formattingRules: [
      'Between 10 and 120 characters',
      'Include street name and nearby landmark (e.g. Opposite Istishari Hospital)',
    ],
    formattingRulesAr: [
      'بين 10 و 120 حرفاً',
      'تضمين اسم الشارع وأقرب معلم (مثال: مقابل المستشفى الاستشاري)',
    ],
    examples: [
      'Building 14, Zahran Street, 7th Circle, Floor 1',
      'شارع مكة، مجمع النخبة الطبي، عمارة 42، الطابق الأرضي',
      'Wasfi Al-Tal St, Gardens, Near Jabri Restaurant',
      'شارع المدينة المنورة، بجانب مستشفى ابن الهيثم',
    ],
    quickTips: [
      'Displayed in the boutique header and Google Maps directions link on the catalog.',
    ],
    quickTipsAr: [
      'يظهر العنوان في ترويسة المتجر ورابط خرائط جوجل في الكتالوج.',
    ],
  },

  city_location: {
    key: 'city_location',
    title: 'City & Region / District',
    titleAr: 'المدينة والمنطقة الجغرافية',
    category: 'shop_details',
    categoryLabel: 'Shop Details',
    categoryLabelAr: 'بيانات المتجر',
    iconName: 'Navigation',
    required: true,
    description:
      'The primary city and district where the optical branch is registered for local customer discovery and regional sales analytics.',
    descriptionAr:
      'المدينة والمنطقة التي يتبع لها مركز البصريات لفرز المبيعات جغرافياً وتحديد نطاق التوصيل والخدمة.',
    instructions:
      'Specify City and District clearly (e.g. Amman - Abdoun, Irbid - University St, Zarqa - New Zarqa).',
    instructionsAr:
      'حدد المدينة والحي بوضوح (مثال: عمان - عبدون، إربد - شارع الجامعة، الزرقاء الجديدة).',
    formattingRules: [
      'Format: [City] - [District/Area]',
      'Alphanumeric text without special characters',
    ],
    formattingRulesAr: [
      'الصيغة: [المدينة] - [الحي/المنطقة]',
      'نص واضح بدون رموز خاصة',
    ],
    examples: [
      'Amman - Abdoun',
      'عمان - الصويفية',
      'Irbid - University District',
      'عمان - خلدا وأم السماق',
      'Aqaba - City Center',
    ],
    quickTips: [
      'Used by the agent portal to calculate geographic territory commission splits.',
    ],
    quickTipsAr: [
      'تساعد المنصة في تحديد المنطقة البيعية للوكيل واحتساب عمولات التغطية.',
    ],
  },

  operating_hours: {
    key: 'operating_hours',
    title: 'Operating Hours & Schedule',
    titleAr: 'ساعات العمل وأوقات الفحص',
    category: 'shop_details',
    categoryLabel: 'Shop Details',
    categoryLabelAr: 'بيانات المتجر',
    iconName: 'Clock',
    required: false,
    description:
      'Boutique opening hours and scheduled optometrist examination clinic timings for eye checkup appointments.',
    descriptionAr:
      'مواعيد دوام المتجر واستقبال المراجعين وأوقات تواجد أخصائي البصريات المعتمد للفحص.',
    instructions:
      'State days of operation and daily hours (e.g. Sat-Thu 9:30 AM - 9:30 PM, Fri Closed).',
    instructionsAr:
      'سجل أيام وساعات العمل (مثال: السبت - الخميس من 9:30 ص إلى 9:30 م، الجمعة مغلق).',
    formattingRules: [
      'Readable business hours format',
      'Specify weekend schedule if different',
    ],
    formattingRulesAr: [
      'صيغة مفهومة لأوقات العمل والأيام',
      'توضيح مواعيد عطلة نهاية الأسبوع إن وجدت',
    ],
    examples: [
      'Sat - Thu: 10:00 AM - 10:00 PM (Fri: 4 PM - 9 PM)',
      'السبت - الخميس: 9:30 صباحاً - 9:30 مساءً',
      'Daily: 9:00 AM - 9:00 PM',
      'السبت - الخميس: 10:00 ص - 10:00 م (الجمعة مغلق)',
    ],
    quickTips: [
      'Customers consult this schedule before visiting for eye examinations and lens fittings.',
    ],
    quickTipsAr: [
      'يطلع المراجعون على هذا الجدول لتحديد موعد فحص النظر وتجربة الإطارات.',
    ],
  },

  subdomain_slug: {
    key: 'subdomain_slug',
    title: 'Boutique Subdomain URL',
    titleAr: 'الرابط الفرعي للمتجر (Subdomain)',
    category: 'shop_details',
    categoryLabel: 'Shop Details',
    categoryLabelAr: 'بيانات المتجر',
    iconName: 'Globe',
    required: true,
    description:
      'The unique web address slug that forms the boutique storefront URL (e.g. https://[slug].envisioneyewear.store).',
    descriptionAr:
      'المعرف الرقمي الفريد الذي يشكل عنوان المتجر الإلكتروني المباشر (مثل: https://[slug].envisioneyewear.store).',
    instructions:
      'Use only lowercase English letters, numbers, and hyphens. Spaces and special characters are automatically stripped.',
    instructionsAr:
      'استخدم فقط الحروف الإنجليزية الصغيرة والأرقام والشرطة (-). يتم تلقائياً حذف الفراغات والرموز الخاصة.',
    formattingRules: [
      'Lowercase alphanumeric with single hyphens only',
      'Length between 3 and 30 characters',
      'Must start and end with an alphanumeric character (no leading/trailing hyphen)',
    ],
    formattingRulesAr: [
      'أحرف إنجليزية صغيرة وأرقام وشرطة فقط',
      'الطول بين 3 و 30 حرفاً',
      'يجب أن يبدأ وينتهي بحرف أو رقم (تجنب الشرطة في البداية والنهاية)',
    ],
    examples: [
      'amman-optics',
      'vision-elite-jo',
      'al-diar-eyecare',
      'royal-glasses',
    ],
    quickTips: [
      'Auto-generated when you type the Shop Name, but you can customize it.',
      'This will be printed on QR codes and promotional store stands.',
    ],
    quickTipsAr: [
      'يتم توليده تلقائياً من اسم المتجر مع إمكانية تعديله يدوياً.',
      'سيتم استخدام هذا الرابط في ملصقات رمز الاستجابة السريع (QR Code) للمحل.',
    ],
  },

  subscription_tier: {
    key: 'subscription_tier',
    title: 'Subscription Tier & Commission',
    titleAr: 'باقة الاشتراك وعمولة الوكيل (50%)',
    category: 'subscription',
    categoryLabel: 'Subscription Plan',
    categoryLabelAr: 'خطة الاشتراك',
    iconName: 'CreditCard',
    required: true,
    description:
      'The monthly subscription package chosen by the boutique. Sales Agents receive a recurring 50% commission split on every active payment.',
    descriptionAr:
      'باقة الاشتراك الشهرية المختارة للمتجر. يحصل الوكيل على عمولة مستمرة بنسبة 50% شهرياً عن كل اشتراك فعال.',
    instructions:
      'Select the tier matching the shop catalog scale: Bronze (50 frames / 25 JOD), Silver (150 frames / 49 JOD), Gold (500 frames / 89 JOD - Recommended), or Platinum (Unlimited / 149 JOD).',
    instructionsAr:
      'اختر الباقة المناسبة لحجم كتالوج المحل: برونزية (50 إطاراً)، فضية (150 إطاراً)، ذهبية (500 إطار - الموصى بها)، أو بلاتينية (غير محدود).',
    formattingRules: [
      'One of four standard tiers: bronze, silver, gold, platinum',
      'Agent commission is exactly 50% of the selected plan price',
    ],
    formattingRulesAr: [
      'واحدة من 4 باقات معتمدة: برونزية، فضية، ذهبية، بلاتينية',
      'عمولة الوكيل تساوي 50% بدقة من قيمة الباقة المختارة',
    ],
    examples: [
      'Gold Tier: 89 JOD/mo -> 44.5 JOD Agent Commission (Most Popular)',
      'Silver Tier: 49 JOD/mo -> 24.5 JOD Agent Commission',
      'Platinum Tier: 149 JOD/mo -> 74.5 JOD Agent Commission',
    ],
    quickTips: [
      'Gold tier includes WhatsApp order notifications and AR virtual frame try-on.',
      'Shops can upgrade or downgrade tiers anytime from their billing settings.',
    ],
    quickTipsAr: [
      'الباقة الذهبية تتضمن إشعارات الواتساب وميزة التجربة الافتراضية للعدسات.',
      'يمكن للمتجر ترقية الباقة في أي وقت مع تحديث عمولة الوكيل فوراً.',
    ],
  },

  primary_color: {
    key: 'primary_color',
    title: 'Primary Brand Color',
    titleAr: 'اللون الرئيسي للهوية (Primary Color)',
    category: 'branding',
    categoryLabel: 'Storefront Branding',
    categoryLabelAr: 'الهوية البصرية',
    iconName: 'Palette',
    required: true,
    description:
      'The dominant signature accent color used across buttons, call-to-actions, frame highlights, and badge accents.',
    descriptionAr:
      'اللون الرئيسي المعتمد لهوية المتجر، يُستخدم في أزرار الشراء، إبراز الإطارات المميزة، والروابط النشطة.',
    instructions:
      'Pick a color using the color picker or enter a valid 6-character hex color code (e.g. #0f766e for Emerald Optics).',
    instructionsAr:
      'اختر اللون عبر أداة الألوان أو اكتب كود الـ HEX المكون من 6 خانات (مثال: #0f766e لأخضر الزمرد).',
    formattingRules: [
      'Valid 6-digit Hex code starting with # (e.g. #2563eb)',
      'High contrast against light backgrounds recommended',
    ],
    formattingRulesAr: [
      'كود HEX مكون من 6 خانات يبدأ بـ # (مثال: #2563eb)',
      'يفضل اختيار لون ذو تباين عالٍ على الخلفيات الفاتحة',
    ],
    examples: [
      '#0f766e (Emerald Optics - Modern Clinic)',
      '#2563eb (Royal Sapphire - Luxury Eyewear)',
      '#7c3aed (Amethyst - Fashion Frames)',
      '#0f172a (Obsidian - Sleek Minimalist)',
    ],
    quickTips: [
      'Click any of the 5 quick palette presets to auto-pair primary and secondary colors.',
      'Instantly overwrites database defaults via the backend update pipeline.',
    ],
    quickTipsAr: [
      'يمكنك النقر على أي من النماذج اللونية الجاهزة لاختيار ألوان متناسقة بلمسة واحدة.',
      'يتم تطبيق اللون فوراً وتحديث إعدادات المتجر في قاعدة البيانات.',
    ],
  },

  secondary_color: {
    key: 'secondary_color',
    title: 'Secondary Accent Color',
    titleAr: 'اللون الثانوي (Secondary Color)',
    category: 'branding',
    categoryLabel: 'Storefront Branding',
    categoryLabelAr: 'الهوية البصرية',
    iconName: 'Sparkles',
    required: true,
    description:
      'The complementary contrast color used for top navigation bars, footer sections, dark cards, and subtle hover borders.',
    descriptionAr:
      'اللون الثانوي المكمل للهوية، يُستخدم في شريط التنقل العلوي، التذييل، والبطاقات الداكنة.',
    instructions:
      'Choose a darker or harmonic complement to the primary color to guarantee excellent typographic readability.',
    instructionsAr:
      'اختر درجة داكنة أو مكملة متناسقة مع اللون الرئيسي لضمان وضوح النصوص والقراءة.',
    formattingRules: [
      'Valid 6-digit Hex code starting with #',
      'Should contrast well with white text',
    ],
    formattingRulesAr: [
      'كود HEX صالح من 6 خانات يبدأ بـ #',
      'يجب أن يكون متبايناً ومريحاً للنصوص البيضاء',
    ],
    examples: [
      '#134e4a (Deep Emerald)',
      '#1e3a8a (Deep Royal Blue)',
      '#4c1d95 (Royal Plum)',
      '#334155 (Slate Charcoal)',
    ],
    quickTips: [
      'Pairs best when slightly darker than the primary tone.',
    ],
    quickTipsAr: [
      'النتيجة الأجمل تكون عندما يكون اللون الثانوي أغمق بدرجتين من الرئيسي.',
    ],
  },

  logo_upload: {
    key: 'logo_upload',
    title: 'Boutique Logo (Cloudinary / URL)',
    titleAr: 'شعار المتجر (Cloudinary أو رابط مباشر)',
    category: 'branding',
    categoryLabel: 'Storefront Branding',
    categoryLabelAr: 'الهوية البصرية',
    iconName: 'Image',
    required: false,
    description:
      'The official logo graphic of the optical shop displayed in the storefront navigation, prescription forms, and PDF receipts.',
    descriptionAr:
      'شعار المركز الرسمي الذي يظهر في أعلى المتجر، تقارير فحص النظر، وفواتير المشتريات المطبوعة.',
    instructions:
      'Upload a transparent PNG, SVG, or high-res JPG directly to Cloudinary CDN, or paste an existing HTTPS image link.',
    instructionsAr:
      'ارفع صورة الشعار بخلفية شفافة (PNG / SVG) عبر سحابة Cloudinary، أو ألصق رابط صورة مباشر يبدأ بـ HTTPS.',
    formattingRules: [
      'Square or 1:1 / 4:3 aspect ratio recommended',
      'Transparent background (PNG/WebP/SVG)',
      'Maximum file size: 5 MB',
    ],
    formattingRulesAr: [
      'أبعاد مربعة 1:1 أو مستطيلة 4:3',
      'يفضل خلفية شفافة (PNG أو SVG)',
      'الحد الأقصى لحجم الملف: 5 ميجابايت',
    ],
    examples: [
      'https://res.cloudinary.com/demo/image/upload/v1/optical_logo.png',
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400',
    ],
    quickTips: [
      'The form ensures Cloudinary CDN uploads finish before submitting so no broken images occur.',
      'Can be configured or replaced anytime from the boutique profile.',
    ],
    quickTipsAr: [
      'يقوم النموذج بالتحقق من اكتمال الرفع إلى Cloudinary قبل الإرسال لمنع الروابط المعطلة.',
      'يمكن تغيير الشعار في أي وقت من لوحة تحكم المتجر.',
    ],
  },

  banner_upload: {
    key: 'banner_upload',
    title: 'Storefront Showcase Banner',
    titleAr: 'صورة واجهة المعرض والواجهة الرئيسية',
    category: 'branding',
    categoryLabel: 'Storefront Branding',
    categoryLabelAr: 'الهوية البصرية',
    iconName: 'ImagePlus',
    required: false,
    description:
      'A wide, high-definition photograph of the physical optical dispensary, designer frame displays, or professional testing suite.',
    descriptionAr:
      'صورة عريضة عالية الجودة لمعرض النظارات من الداخل أو واجهة المحل أو عيادة فحص النظر لإضفاء الثقة للزوار.',
    instructions:
      'Select a high-resolution landscape photo (16:9 or 21:9 aspect ratio) showcasing clean modern optical displays.',
    instructionsAr:
      'اختر صورة أفقية عالية الدقة (بنسبة 16:9) تعكس فخامة المركز وتنوع الإطارات والعدسات المعروضة.',
    formattingRules: [
      'Landscape wide ratio (16:9 or 2:1 recommended)',
      'Recommended minimum resolution: 1600x900px',
      'Format: JPG, WebP, or PNG',
    ],
    formattingRulesAr: [
      'أبعاد أفقية عريضة (16:9 أو 2:1)',
      'الدقة المقترحة: 1600 × 900 بكسل على الأقل',
      'الصيغ المدعومة: JPG أو WebP أو PNG',
    ],
    examples: [
      'https://res.cloudinary.com/demo/image/upload/v1/modern_storefront.jpg',
      '/src/assets/images/optical_storefront_showcase_1790185462812.jpg',
    ],
    quickTips: [
      'A curated professional optical storefront mockup is provided by default if none is uploaded.',
    ],
    quickTipsAr: [
      'تتوفر صورة افتراضية فاخرة لمعرض بصريات تم اختيارها مسبقاً في حال عدم الرفع.',
    ],
  },

  staff_full_name: {
    key: 'staff_full_name',
    title: 'Staff Member Full Name',
    titleAr: 'الاسم الكامل للموظف',
    category: 'staff',
    categoryLabel: 'Staff Credentials',
    categoryLabelAr: 'حسابات الموظفين',
    iconName: 'User',
    required: true,
    description:
      'The personal full name of the employee or doctor who will be using this login account to access the optical clinic portal.',
    descriptionAr:
      'الاسم الكامل للموظف أو أخصائي البصريات الذي سيستخدم الحساب لتسجيل الدخول وإدارة الوصفات والطلبات.',
    instructions:
      'Enter first and last name, including professional title (e.g. Dr., Opt., Eng.) if applicable.',
    instructionsAr:
      'اكتب الاسم الأول واسم العائلة، مع اللقب المهني إن وجد (مثل: د. أو أخصائي).',
    formattingRules: [
      'Minimum 3 characters',
      'Letters and spaces only (honorific prefixes allowed)',
    ],
    formattingRulesAr: [
      '3 أحرف كحد أدنى',
      'أحرف وفراغات مع إمكانية إضافة الألقاب المهنية (د. / أخصائي)',
    ],
    examples: [
      'Dr. Faris Al-Khatib (Shop Owner)',
      'Opt. Sarah Al-Majali (Optometrist)',
      'Tareq Mansour (Optician & Dispenser)',
      'Rania Qasem (Marketing Lead)',
    ],
    quickTips: [
      'Displayed on printed eye prescription measurements, lens lab orders, and internal audit logs.',
    ],
    quickTipsAr: [
      'يظهر الاسم في تقارير فحص النظر المطبوعة وفواتير تجهيز العدسات وسجلات التدقيق.',
    ],
  },

  staff_email: {
    key: 'staff_email',
    title: 'Staff Login Email',
    titleAr: 'البريد الإلكتروني لدخول الموظف',
    category: 'staff',
    categoryLabel: 'Staff Credentials',
    categoryLabelAr: 'حسابات الموظفين',
    iconName: 'AtSign',
    required: true,
    description:
      'The unique email address used by this staff member to authenticate into the boutique portal via Supabase Auth.',
    descriptionAr:
      'البريد الإلكتروني الفريد الخاص بالموظف لتسجيل الدخول إلى بوابة المتجر عبر خدمة Supabase Auth.',
    instructions:
      'Enter an email address accessible to the staff member. Each account must have a distinct, non-duplicate email in Supabase.',
    instructionsAr:
      'أدخل بريداً متاحاً للموظف. يجب أن يكون البريد فريداً وغير مكرر في قاعدة بيانات Supabase.',
    formattingRules: [
      'Standard email syntax',
      'Unique per user across the Supabase project',
      'Cannot be modified once the auth user is provisioned without admin reset',
    ],
    formattingRulesAr: [
      'صيغة بريد إلكتروني صحيحة',
      'يجب أن يكون فريداً وغير مسجل مسبقاً',
      'لا يمكن تكراره بين أكثر من موظف في النظام',
    ],
    examples: [
      'doctor@ammanvision.com',
      'sarah.optometry@gmail.com',
      'optician.tareq@ammanvision.com',
      'social@ammanvision.com',
    ],
    quickTips: [
      'The backend checks if this email exists. If already registered, it cleanly notes it without failing onboarding.',
    ],
    quickTipsAr: [
      'يقوم النظام بالتحقق من عدم تكرار البريد في قاعدة البيانات لمنع أخطاء التسجيل.',
    ],
  },

  staff_role: {
    key: 'staff_role',
    title: 'Staff Role & Permissions',
    titleAr: 'الدور الوظيفي وصلاحيات الوصول',
    category: 'staff',
    categoryLabel: 'Staff Credentials',
    categoryLabelAr: 'حسابات الموظفين',
    iconName: 'Shield',
    required: true,
    description:
      'Determines the permission boundary and portal access level granted to the staff member in the optical system.',
    descriptionAr:
      'يحدد مستوى الصلاحيات والصفحات التي يحق للموظف الوصول إليها داخل نظام إدارة البصريات.',
    instructions:
      'Select one of the 4 tailored optical industry roles: Shop Owner, Optometrist, Optician, or Marketer.',
    instructionsAr:
      'اختر أحد الأدوار الأربعة المعتمدة في قطاع البصريات: مالك المتجر، أخصائي بصريات، فني نظارات، أو مسؤول تسويق.',
    formattingRules: [
      'Must be one of: shop_owner, optometrist, optician, marketer',
      'Synced automatically to public.profiles and public.shop_staff_credentials via database trigger',
    ],
    formattingRulesAr: [
      'واحد من 4 أدوار: shop_owner أو optometrist أو optician أو marketer',
      'يتم مزامنته آلياً مع جداول profiles و shop_staff_credentials عبر مشغل قاعدة البيانات',
    ],
    examples: [
      'Shop Owner: Full administration, boutique branding, financial ledger & subscription control',
      'Optometrist: Eye exam records, prescription history, visual acuity & interpupillary distance (IPD)',
      'Optician: Frame catalog inventory, lens edging & order status dispensation',
      'Marketer: Promotional discount vouchers, WhatsApp catalog campaigns & analytics',
    ],
    quickTips: [
      'At least one Shop Owner is required to govern boutique billing and subscription renewals.',
    ],
    quickTipsAr: [
      'يلزم وجود حساب مالك متجر واحد على الأقل لإدارة الفوترة وتجديد الاشتراكات.',
    ],
  },

  staff_password: {
    key: 'staff_password',
    title: 'Staff Temporary Password',
    titleAr: 'كلمة المرور المؤقتة للحساب',
    category: 'staff',
    categoryLabel: 'Staff Credentials',
    categoryLabelAr: 'حسابات الموظفين',
    iconName: 'Key',
    required: true,
    description:
      'The secure initial password assigned to the staff member. Generated credentials can be copied or shared via WhatsApp upon completion.',
    descriptionAr:
      'كلمة المرور الأولية الآمنة المخصصة لدخول الموظف، والتي يمكن نسخها ومشاركتها مع طاقم العمل بضغطة زر بعد الإتمام.',
    instructions:
      'Click the "Generate" button to produce a memorable optical-themed password, or enter a custom secure password.',
    instructionsAr:
      'انقر على زر "توليد" لإنشاء كلمة مرور قوية وسهلة التذكر مستوحاة من مصطلحات البصريات، أو اكتب كلمة مرور خاصة.',
    formattingRules: [
      'Minimum 8 characters (Supabase Auth default constraint)',
      'Must contain a mix of uppercase, lowercase, numbers, and symbols for high security',
    ],
    formattingRulesAr: [
      '8 خانات كحد أدنى (شرط أمان Supabase)',
      'يفضل احتوائها على حروف كبيرة وصغيرة وأرقام ورموز',
    ],
    examples: [
      'Vision#742x9a',
      'Optic!418bk2',
      'Focus%903kr1',
      'Crown$882am5',
    ],
    quickTips: [
      'Click "Auto-Generate All Passwords" at the top of Section 4 to fill every staff password in 1 click.',
      'Staff can change their passwords upon first login via their profile settings.',
    ],
    quickTipsAr: [
      'انقر على "توليد كلمات مرور للجميع" لملء جميع كلمات المرور دفعة واحدة.',
      'يمكن للموظف تغيير كلمة المرور في أي وقت بعد تسجيل دخوله الأول.',
    ],
  },

  staff_phone: {
    key: 'staff_phone',
    title: 'Staff Phone Number',
    titleAr: 'رقم هاتف الموظف',
    category: 'staff',
    categoryLabel: 'Staff Credentials',
    categoryLabelAr: 'حسابات الموظفين',
    iconName: 'Phone',
    required: false,
    description:
      'Direct contact phone number for the staff member for onboarding communication, SMS alerts, and staff roster records.',
    descriptionAr:
      'رقم هاتف الموظف للتواصل المباشر وإرسال إشعارات النظام وتوثيق بيانات الطاقم.',
    instructions:
      'Enter the mobile phone number with international country code (e.g. +962 7 9000 0000).',
    instructionsAr:
      'أدخل رقم الهاتف المحمول متضمناً مفتاح الدولة (مثال: 0000 9000 7 962+).',
    formattingRules: [
      'International format recommended: +[country code][number]',
      'Numeric with optional spaces and leading plus sign',
    ],
    formattingRulesAr: [
      'التنسيق الدولي مفضل: [الرقم][رمز الدولة]+',
      'أرقام مع إمكانية استخدام المسافات وعلامة +',
    ],
    examples: ['+962 7 9855 2410', '+966 50 123 4567'],
    quickTips: [
      'Stored directly in public.shop_staff_credentials.',
      'Enables direct SMS or WhatsApp roster sharing.',
    ],
    quickTipsAr: [
      'يتم حفظه مباشرة في جدول shop_staff_credentials.',
      'يسهل مشاركة بيانات الحساب وتنسيق الدخول عبر واتساب أو الرسائل.',
    ],
  },
};

export const ONBOARDING_HELP_CATEGORIES = [
  {
    id: 'shop_details',
    title: 'Shop Identity & Location',
    titleAr: 'بيانات وهوية المتجر',
    iconName: 'Building2',
    keys: [
      'shop_name',
      'subdomain_slug',
      'owner_email',
      'city_location',
      'physical_address',
      'primary_phone',
      'license_number',
      'operating_hours',
    ],
  },
  {
    id: 'subscription',
    title: 'Subscription & Commissions',
    titleAr: 'باقات الاشتراك والعمولات',
    iconName: 'CreditCard',
    keys: ['subscription_tier'],
  },
  {
    id: 'branding',
    title: 'Branding & Storefront Media',
    titleAr: 'الهوية البصرية والوسائط',
    iconName: 'Palette',
    keys: ['primary_color', 'secondary_color', 'logo_upload', 'banner_upload'],
  },
  {
    id: 'staff',
    title: 'Staff Accounts & RBAC Roles',
    titleAr: 'حسابات الموظفين والصلاحيات',
    iconName: 'Users',
    keys: ['staff_full_name', 'staff_role', 'staff_email', 'staff_phone', 'staff_password'],
  },
];
