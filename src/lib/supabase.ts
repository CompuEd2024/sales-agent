import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import {
  Agent,
  Shop,
  ShopConfig,
  ShopSubscriptionLedger,
  ShopWithConfig,
  ShopCurrencyPricing,
  SubscriptionTier,
  SubscriptionStatus,
  StaffRole,
  StaffProvisionInput,
  StaffCredentialResult,
  OnboardShopResponse,
  ShopNote,
  getLocalTodayISODate,
} from '../types/database';

const LOCAL_STORAGE_KEY_URL = 'opticportal_supabase_url';
const LOCAL_STORAGE_KEY_ANON = 'opticportal_supabase_anon';
const LOCAL_STORAGE_KEY_STATE = 'opticportal_local_data_v2';
const LOCAL_STORAGE_KEY_ACTIVE_AGENT_ID = 'opticportal_active_agent_id';

// Multi-Agent Presets for Demo / Testing Scenarios
export const DEMO_AGENTS: Agent[] = [
  {
    id: 'a0123456-789a-bcde-f012-3456789abcde',
    full_name: 'Tariq Al-Mansoor',
    email: 'tariq.agent@opticportal.io',
    auth_user_id: 'u0123456-789a-bcde-f012-3456789abcde',
    avatar_url: '/src/assets/images/agent_portrait_avatar_1790185451855.jpg',
    phone_number: '+962 7 9855 2410',
    territory: 'Amman Central & West',
    role: 'Senior Sales Agent',
    country_code: 'JO',
    primary_country_code: 'JO',
    currency_code: 'JOD',
    primary_currency_code: 'JOD',
    currency_symbol: 'JOD',
    tier_bronze: 20,
    tier_silver: 60,
    tier_gold: 120,
    tier_platinum: 200,
    is_active: true,
  },
  {
    id: 'a0222222-789a-bcde-f012-3456789abcde',
    full_name: 'Layla Nader',
    email: 'layla.optics@opticportal.io',
    auth_user_id: 'u0222222-789a-bcde-f012-3456789abcde',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=240&q=80',
    phone_number: '+962 7 8765 4321',
    territory: 'Abdoun & Zarqa District',
    role: 'Field Sales Representative',
    country_code: 'US',
    primary_country_code: 'US',
    currency_code: 'USD',
    primary_currency_code: 'USD',
    currency_symbol: '$',
    tier_bronze: 29,
    tier_silver: 89,
    tier_gold: 179,
    tier_platinum: 299,
    is_active: true,
  },
  {
    id: 'a0333333-789a-bcde-f012-3456789abcde',
    full_name: 'Zaid Haddad',
    email: 'zaid.vision@opticportal.io',
    auth_user_id: 'u0333333-789a-bcde-f012-3456789abcde',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80',
    phone_number: '+962 7 7654 3210',
    territory: 'Aqaba Coastal & South',
    role: 'Boutique Accounts Specialist',
    country_code: 'AE',
    primary_country_code: 'AE',
    currency_code: 'AED',
    primary_currency_code: 'AED',
    currency_symbol: 'AED',
    tier_bronze: 100,
    tier_silver: 300,
    tier_gold: 600,
    tier_platinum: 1000,
    is_active: true,
  },
];

export const DEFAULT_DEMO_AGENT = DEMO_AGENTS[0];

// Known database entries from public.shop_currency_pricing table
export const KNOWN_CURRENCY_PRICING: ShopCurrencyPricing[] = [
  {
    id: 'acb16fe1-22ae-4455-ba88-a99046460733',
    shop_id: 'c679992a-8929-488b-a4f7-676343f92449',
    country_code: 'KW',
    currency_code: 'KWD',
    currency_symbol: 'KD',
    tier_1_price: 10.0,
    tier_2_price: 30.0,
    tier_3_price: 50.0,
    tier_4_price: 90,
    created_at: '2026-10-04T10:06:23.96811+00',
    updated_at: '2026-10-06T06:00:49.362869+00',
  },
];

const daysAgoIso = (days: number): string =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

// Initial realistic optical shops strictly attributed to different agents
export const INITIAL_SHOPS: ShopWithConfig[] = [
  // Al Salam luxury eyewear boutique (Kuwait, 90 KD for Platinum tier from shop_currency_pricing)
  {
    id: 'c679992a-8929-488b-a4f7-676343f92449',
    shop_name: 'Al Salam luxury eyewear boutique',
    location: 'Salhiya Complex, Kuwait City',
    owner_email: 'alsalam.optics@alsalam-eyewear.kw',
    tier: 'platinum',
    agent_id: DEMO_AGENTS[0].id,
    is_active: true,
    subscription_status: 'active',
    status: 'active',
    monthly_price: 90,
    amount_paid: 90,
    country_code: 'KW',
    currency_code: 'KWD',
    currency_symbol: 'KD',
    last_activity_at: daysAgoIso(1),
    usage_30d: {
      try_on_sessions: 214,
      recommendations_made: 68,
      last_activity_at: daysAgoIso(1),
    },
    pricing: {
      id: 'acb16fe1-22ae-4455-ba88-a99046460733',
      shop_id: 'c679992a-8929-488b-a4f7-676343f92449',
      country_code: 'KW',
      currency_code: 'KWD',
      currency_symbol: 'KD',
      tier_1_price: 10.0,
      tier_2_price: 30.0,
      tier_3_price: 50.0,
      tier_4_price: 90,
      created_at: '2026-10-04T10:06:23.96811+00',
      updated_at: '2026-10-06T06:00:49.362869+00',
    },
    created_at: '2026-10-04T10:06:23.968Z',
    config: {
      shop_id: 'c679992a-8929-488b-a4f7-676343f92449',
      subdomain_slug: 'alsalam-eyewear',
      logo_url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=240&q=80',
      primary_color: '#0284c7',
      secondary_color: '#0f172a',
      background_image_url: '/src/assets/images/optical_storefront_showcase_1790185462812.jpg',
      updated_at: '2026-10-06T06:00:49.362Z',
    },
  },

  // Tariq's shops (4 shops)
  {
    id: 's1111111-2222-3333-4444-555555555551',
    shop_name: 'Amman Grand Optics',
    location: '7th Circle, Zahran St, Amman',
    owner_email: 'dr.faris@ammangrandoptics.com',
    tier: 'platinum',
    agent_id: DEMO_AGENTS[0].id,
    is_active: true,
    subscription_status: 'active',
    status: 'active',
    monthly_price: 200,
    amount_paid: 200,
    last_activity_at: daysAgoIso(2),
    usage_30d: {
      try_on_sessions: 148,
      recommendations_made: 42,
      last_activity_at: daysAgoIso(2),
    },
    created_at: '2026-01-10T09:00:00Z',
    config: {
      shop_id: 's1111111-2222-3333-4444-555555555551',
      subdomain_slug: 'amman-grand-optics',
      logo_url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=240&q=80',
      primary_color: '#0f766e',
      secondary_color: '#134e4a',
      background_image_url: '/src/assets/images/optical_storefront_showcase_1790185462812.jpg',
      updated_at: '2026-01-10T09:00:00Z',
    },
  },
  {
    id: 's1111111-2222-3333-4444-555555555552',
    shop_name: 'Royal Vision Eyewear',
    location: 'Mecca Mall Gate 3, Amman',
    owner_email: 'dana.k@royalvision.jo',
    tier: 'gold',
    agent_id: DEMO_AGENTS[0].id,
    is_active: true,
    subscription_status: 'active',
    status: 'active',
    monthly_price: 120,
    amount_paid: 120,
    last_activity_at: daysAgoIso(4),
    usage_30d: {
      try_on_sessions: 96,
      recommendations_made: 29,
      last_activity_at: daysAgoIso(4),
    },
    created_at: '2026-02-01T11:30:00Z',
    config: {
      shop_id: 's1111111-2222-3333-4444-555555555552',
      subdomain_slug: 'royal-vision',
      logo_url: 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=240&q=80',
      primary_color: '#2563eb',
      secondary_color: '#1e3a8a',
      background_image_url: '/src/assets/images/optical_storefront_showcase_1790185462812.jpg',
      updated_at: '2026-02-01T11:30:00Z',
    },
  },
  {
    id: 's1111111-2222-3333-4444-555555555553',
    shop_name: 'City Eye Optical Center',
    location: 'Rainbow Street, Jabal Amman',
    owner_email: 'omar@cityeyeoptical.com',
    tier: 'silver',
    agent_id: DEMO_AGENTS[0].id,
    is_active: true,
    subscription_status: 'maintenance',
    status: 'on_hold',
    hold_reason: 'Monthly subscription payment overdue - diplomatic scheduled maintenance active',
    hold_date: '2026-03-10T10:00:00Z',
    monthly_price: 60,
    amount_paid: 60,
    last_activity_at: daysAgoIso(98),
    usage_30d: {
      try_on_sessions: 0,
      recommendations_made: 0,
      last_activity_at: daysAgoIso(98),
    },
    created_at: '2026-02-15T14:15:00Z',
    config: {
      shop_id: 's1111111-2222-3333-4444-555555555553',
      subdomain_slug: 'city-eye-amman',
      logo_url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=240&q=80',
      primary_color: '#7c3aed',
      secondary_color: '#4c1d95',
      background_image_url: '/src/assets/images/optical_storefront_showcase_1790185462812.jpg',
      updated_at: '2026-02-15T14:15:00Z',
    },
  },
  {
    id: 's1111111-2222-3333-4444-555555555554',
    shop_name: 'ClearSight Optics Irbid',
    location: 'University Street, Irbid',
    owner_email: 'nour.h@clearsight.jo',
    tier: 'bronze',
    agent_id: DEMO_AGENTS[0].id,
    is_active: false,
    subscription_status: 'suspended',
    status: 'suspended',
    hold_reason: 'Monthly subscription payment unpaid for March 2026 (> 20 days overdue)',
    hold_date: '2026-03-01T08:45:00Z',
    monthly_price: 20,
    amount_paid: 20,
    last_activity_at: daysAgoIso(105),
    usage_30d: {
      try_on_sessions: 0,
      recommendations_made: 0,
      last_activity_at: daysAgoIso(105),
    },
    created_at: '2026-03-01T08:45:00Z',
    config: {
      shop_id: 's1111111-2222-3333-4444-555555555554',
      subdomain_slug: 'clearsight-irbid',
      logo_url: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=240&q=80',
      primary_color: '#d97706',
      secondary_color: '#78350f',
      background_image_url: '/src/assets/images/optical_storefront_showcase_1790185462812.jpg',
      updated_at: '2026-03-01T08:45:00Z',
    },
  },
  {
    id: 's1111111-2222-3333-4444-555555555555',
    shop_name: 'Shmeisani Modern Optics',
    location: 'Al Sharif Nasser Bin Jamil St, Amman',
    owner_email: 'owner@shmeisanioptics.jo',
    owner_phone: '+962 7 9541 8820',
    tier: 'bronze',
    agent_id: DEMO_AGENTS[0].id,
    is_active: true,
    subscription_status: 'active',
    status: 'active',
    monthly_price: 20,
    amount_paid: 20,
    last_activity_at: daysAgoIso(1),
    usage_30d: {
      try_on_sessions: 74,
      recommendations_made: 23,
      last_activity_at: daysAgoIso(1),
    },
    created_at: '2026-05-12T10:15:00Z',
    config: {
      shop_id: 's1111111-2222-3333-4444-555555555555',
      subdomain_slug: 'shmeisani-optics',
      logo_url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=240&q=80',
      primary_color: '#0d9488',
      secondary_color: '#134e4a',
      background_image_url: '/src/assets/images/optical_storefront_showcase_1790185462812.jpg',
      updated_at: '2026-05-12T10:15:00Z',
    },
  },

  // Layla's shops (2 shops)
  {
    id: 's2222222-2222-3333-4444-555555555551',
    shop_name: 'Abdoun Elite Eyewear',
    location: 'Abdoun Circle, South Amman',
    owner_email: 'boutique@abdounelite.com',
    tier: 'gold',
    agent_id: DEMO_AGENTS[1].id,
    is_active: true,
    subscription_status: 'active',
    status: 'active',
    monthly_price: 179,
    amount_paid: 179,
    last_activity_at: daysAgoIso(3),
    usage_30d: {
      try_on_sessions: 112,
      recommendations_made: 34,
      last_activity_at: daysAgoIso(3),
    },
    created_at: '2026-02-10T10:00:00Z',
    config: {
      shop_id: 's2222222-2222-3333-4444-555555555551',
      subdomain_slug: 'abdoun-elite',
      logo_url: 'https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=240&q=80',
      primary_color: '#e11d48',
      secondary_color: '#881337',
      background_image_url: '/src/assets/images/optical_storefront_showcase_1790185462812.jpg',
      updated_at: '2026-02-10T10:00:00Z',
    },
  },
  {
    id: 's2222222-2222-3333-4444-555555555552',
    shop_name: 'Zarqa Modern Vision Clinic',
    location: 'King Hussein St, Zarqa',
    owner_email: 'contact@zarqavision.jo',
    tier: 'silver',
    agent_id: DEMO_AGENTS[1].id,
    is_active: true,
    subscription_status: 'maintenance',
    status: 'on_hold',
    hold_reason: 'Late payment diplomatic pause pending receipt',
    hold_date: '2026-03-14T11:00:00Z',
    monthly_price: 89,
    amount_paid: 89,
    last_activity_at: daysAgoIso(16),
    usage_30d: {
      try_on_sessions: 7,
      recommendations_made: 2,
      last_activity_at: daysAgoIso(16),
    },
    created_at: '2026-02-18T14:30:00Z',
    config: {
      shop_id: 's2222222-2222-3333-4444-555555555552',
      subdomain_slug: 'zarqa-vision',
      logo_url: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?auto=format&fit=crop&w=240&q=80',
      primary_color: '#0284c7',
      secondary_color: '#0369a1',
      background_image_url: '/src/assets/images/optical_storefront_showcase_1790185462812.jpg',
      updated_at: '2026-02-18T14:30:00Z',
    },
  },

  // Zaid's shop (1 shop)
  {
    id: 's3333333-2222-3333-4444-555555555551',
    shop_name: 'Aqaba Marina Optics',
    location: 'Ayla Marina Village, Aqaba',
    owner_email: 'info@aqabamarinaoptics.com',
    tier: 'platinum',
    agent_id: DEMO_AGENTS[2].id,
    is_active: true,
    subscription_status: 'active',
    status: 'active',
    monthly_price: 1000,
    amount_paid: 1000,
    last_activity_at: daysAgoIso(1),
    usage_30d: {
      try_on_sessions: 185,
      recommendations_made: 54,
      last_activity_at: daysAgoIso(1),
    },
    created_at: '2026-02-22T08:00:00Z',
    config: {
      shop_id: 's3333333-2222-3333-4444-555555555551',
      subdomain_slug: 'aqaba-marina',
      logo_url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=240&q=80',
      primary_color: '#0891b2',
      secondary_color: '#164e63',
      background_image_url: '/src/assets/images/optical_storefront_showcase_1790185462812.jpg',
      updated_at: '2026-02-22T08:00:00Z',
    },
  },
];

// Initial realistic subscription payments ledger (with automatic 50/50 commission split and collection tracking)
export const INITIAL_LEDGER: ShopSubscriptionLedger[] = [
  // Tariq's ledger (March 2026)
  {
    id: 'led-001',
    shop_id: 's1111111-2222-3333-4444-555555555551',
    agent_id: DEMO_AGENTS[0].id,
    amount_paid: 200,
    agent_commission: 100,
    platform_share: 100,
    billing_period_start: '2026-03-01',
    billing_period_end: '2026-03-31',
    payment_month: '2026-03',
    collection_method: 'cash',
    collected_by_agent: true,
    notes: 'Collected cash at Abdali boutique visit and submitted',
    remittance_status: 'remitted_by_agent',
    remitted_at: '2026-03-02T14:30:00Z',
    created_at: '2026-03-01T10:00:00Z',
  },
  {
    id: 'led-002',
    shop_id: 's1111111-2222-3333-4444-555555555552',
    agent_id: DEMO_AGENTS[0].id,
    amount_paid: 120,
    agent_commission: 60,
    platform_share: 60,
    billing_period_start: '2026-03-01',
    billing_period_end: '2026-03-31',
    payment_month: '2026-03',
    collection_method: 'cliq',
    collected_by_agent: true,
    notes: 'Direct CliQ payment to agent mobile, remitted to app',
    remittance_status: 'verified_by_admin',
    remitted_at: '2026-03-03T09:15:00Z',
    verified_at: '2026-03-04T11:00:00Z',
    created_at: '2026-03-02T11:20:00Z',
  },
  {
    id: 'led-003',
    shop_id: 's1111111-2222-3333-4444-555555555553',
    agent_id: DEMO_AGENTS[0].id,
    amount_paid: 60,
    agent_commission: 30,
    platform_share: 30,
    billing_period_start: '2026-03-01',
    billing_period_end: '2026-03-31',
    payment_month: '2026-03',
    collection_method: 'cash',
    collected_by_agent: true,
    notes: 'Monthly in-store cash collection',
    remittance_status: 'pending_remittance',
    created_at: '2026-03-05T14:40:00Z',
  },

  // Tariq's ledger (February 2026)
  {
    id: 'led-004',
    shop_id: 's1111111-2222-3333-4444-555555555551',
    agent_id: DEMO_AGENTS[0].id,
    amount_paid: 200,
    agent_commission: 100,
    platform_share: 100,
    billing_period_start: '2026-02-01',
    billing_period_end: '2026-02-28',
    payment_month: '2026-02',
    collection_method: 'cash',
    collected_by_agent: true,
    notes: 'Cash subscription collected during February inspection',
    remittance_status: 'verified_by_admin',
    remitted_at: '2026-02-02T16:10:00Z',
    created_at: '2026-02-01T09:15:00Z',
  },
  {
    id: 'led-005',
    shop_id: 's1111111-2222-3333-4444-555555555552',
    agent_id: DEMO_AGENTS[0].id,
    amount_paid: 120,
    agent_commission: 60,
    platform_share: 60,
    billing_period_start: '2026-02-01',
    billing_period_end: '2026-02-28',
    payment_month: '2026-02',
    collection_method: 'bank_transfer',
    collected_by_agent: true,
    notes: 'Bank transfer received by agent, platform cut forwarded',
    remittance_status: 'remitted_by_agent',
    remitted_at: '2026-02-03T10:45:00Z',
    created_at: '2026-02-02T13:00:00Z',
  },

  // Tariq's ledger (January 2026)
  {
    id: 'led-004-jan',
    shop_id: 's1111111-2222-3333-4444-555555555551',
    agent_id: DEMO_AGENTS[0].id,
    amount_paid: 200,
    agent_commission: 100,
    platform_share: 100,
    billing_period_start: '2026-01-01',
    billing_period_end: '2026-01-31',
    payment_month: '2026-01',
    collection_method: 'cash',
    collected_by_agent: true,
    notes: 'Initial launch subscription collection',
    remittance_status: 'verified_by_admin',
    remitted_at: '2026-01-06T12:00:00Z',
    created_at: '2026-01-05T10:00:00Z',
  },

  // Layla's ledger (March 2026)
  {
    id: 'led-006',
    shop_id: 's2222222-2222-3333-4444-555555555551',
    agent_id: DEMO_AGENTS[1].id,
    amount_paid: 120,
    agent_commission: 60,
    platform_share: 60,
    billing_period_start: '2026-03-01',
    billing_period_end: '2026-03-31',
    payment_month: '2026-03',
    collection_method: 'cliq',
    collected_by_agent: true,
    notes: 'Collected via CliQ from Abdoun owner',
    created_at: '2026-03-03T11:00:00Z',
  },
  {
    id: 'led-007',
    shop_id: 's2222222-2222-3333-4444-555555555552',
    agent_id: DEMO_AGENTS[1].id,
    amount_paid: 60,
    agent_commission: 30,
    platform_share: 30,
    billing_period_start: '2026-03-01',
    billing_period_end: '2026-03-31',
    payment_month: '2026-03',
    collection_method: 'cash',
    collected_by_agent: true,
    notes: 'Cash picked up at Zarqa branch',
    created_at: '2026-03-04T15:30:00Z',
  },

  // Layla's ledger (February 2026)
  {
    id: 'led-007-feb',
    shop_id: 's2222222-2222-3333-4444-555555555551',
    agent_id: DEMO_AGENTS[1].id,
    amount_paid: 120,
    agent_commission: 60,
    platform_share: 60,
    billing_period_start: '2026-02-01',
    billing_period_end: '2026-02-28',
    payment_month: '2026-02',
    collection_method: 'cash',
    collected_by_agent: true,
    notes: 'February renewal collected in cash',
    created_at: '2026-02-15T12:00:00Z',
  },

  // Zaid's ledger (March 2026)
  {
    id: 'led-008',
    shop_id: 's3333333-2222-3333-4444-555555555551',
    agent_id: DEMO_AGENTS[2].id,
    amount_paid: 200,
    agent_commission: 100,
    platform_share: 100,
    billing_period_start: '2026-03-01',
    billing_period_end: '2026-03-31',
    payment_month: '2026-03',
    collection_method: 'bank_transfer',
    collected_by_agent: true,
    notes: 'Marina boutique transferred to agent account, remitted',
    created_at: '2026-03-06T09:20:00Z',
  },
  ...(() => {
    const now = new Date();
    const mkPeriod = (monthsAgo: number) => {
      const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const ym = `${y}-${String(m).padStart(2, '0')}`;
      const lastDay = new Date(y, m, 0).getDate();
      return {
        ym,
        start: `${ym}-01`,
        end: `${ym}-${String(lastDay).padStart(2, '0')}`,
        created: `${ym}-05T11:00:00Z`,
      };
    };

    const entries: ShopSubscriptionLedger[] = [];
    // Recent 6 months for Tariq (leaving Royal Vision, City Eye & ClearSight unpaid in current month 0)
    [5, 4, 3, 2, 1, 0].forEach((offset) => {
      const p = mkPeriod(offset);
      // Amman Grand Optics (200 JOD)
      entries.push({
        id: `led-6m-amman-${offset}`,
        shop_id: 's1111111-2222-3333-4444-555555555551',
        agent_id: DEMO_AGENTS[0].id,
        amount_paid: 200,
        agent_commission: 100,
        platform_share: 100,
        billing_period_start: p.start,
        billing_period_end: p.end,
        payment_month: p.ym,
        collection_method: offset % 2 === 0 ? 'cash' : 'cliq',
        collected_by_agent: true,
        notes: `Monthly subscription collected for ${p.ym}`,
        remittance_status: offset === 0 ? 'remitted_by_agent' : 'verified_by_admin',
        remitted_at: p.created,
        created_at: p.created,
      });

      // Al Salam luxury eyewear boutique (90 KD) paid every month
      entries.push({
        id: `led-6m-alsalam-${offset}`,
        shop_id: 'c679992a-8929-488b-a4f7-676343f92449',
        agent_id: DEMO_AGENTS[0].id,
        amount_paid: 90,
        agent_commission: 45,
        platform_share: 45,
        local_currency_code: 'KD',
        billing_period_start: p.start,
        billing_period_end: p.end,
        payment_month: p.ym,
        collection_method: 'knet',
        collected_by_agent: true,
        notes: `Kuwait boutique monthly KNET collection (${p.ym})`,
        remittance_status: offset === 0 ? 'pending_remittance' : 'verified_by_admin',
        created_at: p.created,
      });

      // Royal Vision Eyewear (120 JOD) paid in months 5..1, unpaid in month 0
      if (offset > 0) {
        entries.push({
          id: `led-6m-royal-${offset}`,
          shop_id: 's1111111-2222-3333-4444-555555555552',
          agent_id: DEMO_AGENTS[0].id,
          amount_paid: 120,
          agent_commission: 60,
          platform_share: 60,
          billing_period_start: p.start,
          billing_period_end: p.end,
          payment_month: p.ym,
          collection_method: 'cliq',
          collected_by_agent: true,
          notes: `CliQ subscription collected for ${p.ym}`,
          remittance_status: 'verified_by_admin',
          remitted_at: p.created,
          created_at: p.created,
        });
      }

      // City Eye Optical Center (60 JOD) paid only 4 & 5 months ago
      if (offset >= 4) {
        entries.push({
          id: `led-6m-city-${offset}`,
          shop_id: 's1111111-2222-3333-4444-555555555553',
          agent_id: DEMO_AGENTS[0].id,
          amount_paid: 60,
          agent_commission: 30,
          platform_share: 30,
          billing_period_start: p.start,
          billing_period_end: p.end,
          payment_month: p.ym,
          collection_method: 'cash',
          collected_by_agent: true,
          notes: `Cash collected for ${p.ym}`,
          remittance_status: 'verified_by_admin',
          remitted_at: p.created,
          created_at: p.created,
        });
      }
    });

    return entries;
  })(),
];

export function getSupabaseCredentials(): {
  url: string;
  anonKey: string;
  isConfigured: boolean;
} {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envAnon = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const localUrl = localStorage.getItem(LOCAL_STORAGE_KEY_URL) || '';
  const localAnon = localStorage.getItem(LOCAL_STORAGE_KEY_ANON) || '';

  const url = localUrl || envUrl;
  const anonKey = localAnon || envAnon;

  return {
    url,
    anonKey,
    isConfigured: Boolean(url && anonKey && url.startsWith('http')),
  };
}

export function saveSupabaseCredentials(url: string, anonKey: string) {
  if (url && anonKey) {
    localStorage.setItem(LOCAL_STORAGE_KEY_URL, url.trim());
    localStorage.setItem(LOCAL_STORAGE_KEY_ANON, anonKey.trim());
  } else {
    localStorage.removeItem(LOCAL_STORAGE_KEY_URL);
    localStorage.removeItem(LOCAL_STORAGE_KEY_ANON);
  }
}

let cachedClient: SupabaseClient | null = null;
let lastUrl = '';
let lastKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getSupabaseCredentials();
  if (!isConfigured) return null;

  if (cachedClient && lastUrl === url && lastKey === anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    lastUrl = url;
    lastKey = anonKey;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

// Initial realistic shop notes & follow-ups for demo mode (including items due today)
export const INITIAL_SHOP_NOTES: ShopNote[] = (() => {
  const todayStr = getLocalTodayISODate();
  const futureDate = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);
  const futureStr = getLocalTodayISODate(futureDate);
  const yesterdayDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const yesterdayStr = getLocalTodayISODate(yesterdayDate);

  return [
    {
      id: 'note-demo-1',
      shop_id: 's1111111-2222-3333-4444-555555555552', // Royal Vision Eyewear
      agent_id: DEMO_AGENTS[0].id,
      note: 'Promised to pay monthly subscription today via CliQ',
      follow_up_date: todayStr,
      done: false,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'note-demo-2',
      shop_id: 's1111111-2222-3333-4444-555555555553', // City Eye Optical Center
      agent_id: DEMO_AGENTS[0].id,
      note: 'Call Omar to confirm maintenance pause and collect overdue fee',
      follow_up_date: todayStr,
      done: false,
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'note-demo-3',
      shop_id: 's1111111-2222-3333-4444-555555555551', // Amman Grand Optics
      agent_id: DEMO_AGENTS[0].id,
      note: 'Check if extra optometrist account is needed for new branch',
      follow_up_date: futureStr,
      done: false,
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'note-demo-4',
      shop_id: 'c679992a-8929-488b-a4f7-676343f92449', // Al Salam luxury eyewear boutique
      agent_id: DEMO_AGENTS[0].id,
      note: 'Confirmed KNET payment receipt and updated branding assets',
      follow_up_date: yesterdayStr,
      done: true,
      created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
})();

// Local mock storage manager for multi-agent support
interface LocalState {
  agents: Agent[];
  activeAgentId: string;
  shops: ShopWithConfig[];
  ledger: ShopSubscriptionLedger[];
  pricing?: ShopCurrencyPricing[];
  notes?: ShopNote[];
}

function getLocalData(): LocalState {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY_STATE);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.agents && parsed.shops && parsed.ledger) {
        // Ensure known custom pricing is merged
        parsed.pricing = parsed.pricing || [];
        for (const kp of KNOWN_CURRENCY_PRICING) {
          if (!parsed.pricing.some((p: any) => p.shop_id === kp.shop_id)) {
            parsed.pricing.push(kp);
          }
        }
        // Ensure initial shops are present and have accurate pricing & 30d usage
        for (const initShop of INITIAL_SHOPS) {
          const existing = parsed.shops.find((s: ShopWithConfig) => s.id === initShop.id);
          if (!existing) {
            parsed.shops.unshift(initShop);
          } else {
            if (initShop.pricing) {
              existing.pricing = initShop.pricing;
              existing.monthly_price = initShop.monthly_price;
              existing.amount_paid = initShop.amount_paid;
              existing.country_code = initShop.country_code;
              existing.currency_code = initShop.currency_code;
              existing.currency_symbol = initShop.currency_symbol;
              existing.tier = initShop.tier;
            }
            if (!existing.usage_30d && initShop.usage_30d) {
              existing.usage_30d = initShop.usage_30d;
            }
            if (existing.last_activity_at === undefined && initShop.last_activity_at !== undefined) {
              existing.last_activity_at = initShop.last_activity_at;
            }
            if (!existing.owner_phone && initShop.owner_phone) {
              existing.owner_phone = initShop.owner_phone;
            }
          }
        }
        // Backfill recent 6-month demo ledger records if upgrading from older localStorage cache
        if (!parsed.ledger.some((l: any) => String(l.id || '').startsWith('led-6m-'))) {
          const recentSeed = INITIAL_LEDGER.filter((l) => String(l.id).startsWith('led-6m-'));
          parsed.ledger = [...recentSeed, ...parsed.ledger];
        }
        if (!Array.isArray(parsed.notes)) {
          parsed.notes = INITIAL_SHOP_NOTES;
        }
        return parsed;
      }
    } catch {
      // fallback
    }
  }

  const activeAgentId = localStorage.getItem(LOCAL_STORAGE_KEY_ACTIVE_AGENT_ID) || DEMO_AGENTS[0].id;
  const initial: LocalState = {
    agents: DEMO_AGENTS,
    activeAgentId,
    shops: INITIAL_SHOPS,
    ledger: INITIAL_LEDGER,
    pricing: KNOWN_CURRENCY_PRICING,
    notes: INITIAL_SHOP_NOTES,
  };
  localStorage.setItem(LOCAL_STORAGE_KEY_STATE, JSON.stringify(initial));
  return initial;
}

function saveLocalData(data: LocalState) {
  localStorage.setItem(LOCAL_STORAGE_KEY_STATE, JSON.stringify(data));
}

export function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(str || ''));
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const LOCAL_STORAGE_KEY_STAFF_ROSTER = 'optic_portal_staff_roster';

export function getLocalStaffRoster(shopId: string): StaffCredentialResult[] | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_STAFF_ROSTER);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed[shopId] || null;
  } catch {
    return null;
  }
}

export function saveLocalStaffRoster(shopId: string, staff: StaffCredentialResult[]) {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_STAFF_ROSTER);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed[shopId] = staff;
    localStorage.setItem(LOCAL_STORAGE_KEY_STAFF_ROSTER, JSON.stringify(parsed));
  } catch {
    // ignore
  }
}

// Ensures an agent exists in public.agents to prevent foreign key constraint violations (shops_agent_id_fkey)
export async function ensureAgentExists(
  client: SupabaseClient,
  agentId: string,
  agentDetails?: Partial<Agent>
): Promise<string> {
  const targetId = String(agentId || '').trim();
  const demo = DEMO_AGENTS.find(
    (a) => a.id === targetId || (agentDetails?.email && a.email.toLowerCase() === agentDetails.email.toLowerCase())
  );

  // 1. Check if agent exists by ID
  if (isValidUUID(targetId)) {
    try {
      const { data: existingById } = await client
        .from('agents')
        .select('id')
        .eq('id', targetId)
        .maybeSingle();

      if (existingById?.id) {
        return existingById.id;
      }
    } catch (e) {
      console.warn('[ensureAgentExists] Error checking agent by id:', e);
    }
  }

  // 2. Check if agent exists by auth_user_id
  if (isValidUUID(targetId)) {
    try {
      const { data: existingByAuth } = await client
        .from('agents')
        .select('id')
        .eq('auth_user_id', targetId)
        .maybeSingle();

      if (existingByAuth?.id) {
        return existingByAuth.id;
      }
    } catch (e) {
      console.warn('[ensureAgentExists] Error checking agent by auth_user_id:', e);
    }
  }

  // 3. Check if agent exists by email
  const targetEmail = (agentDetails?.email || demo?.email || '').trim().toLowerCase();
  if (targetEmail) {
    try {
      const { data: existingByEmail } = await client
        .from('agents')
        .select('id')
        .eq('email', targetEmail)
        .maybeSingle();

      if (existingByEmail?.id) {
        return existingByEmail.id;
      }
    } catch (e) {
      console.warn('[ensureAgentExists] Error checking agent by email:', e);
    }
  }

  // 4. Create the agent in public.agents with sanitized columns
  const finalId = isValidUUID(targetId) ? targetId : (demo?.id || generateUUID());
  const finalEmail = targetEmail || demo?.email || `agent-${finalId.slice(0, 8)}@opticportal.io`;
  const fullName = (agentDetails?.full_name || demo?.full_name || 'Sales Agent').trim();
  const phone = agentDetails?.phone_number || demo?.phone_number || '+962 7 9855 2410';

  const agentPayload: Record<string, any> = {
    id: finalId,
    full_name: fullName,
    email: finalEmail,
    phone_number: phone,
    is_active: true,
  };

  try {
    const { data: created, error: createErr } = await client
      .from('agents')
      .insert([agentPayload])
      .select('id')
      .maybeSingle();

    if (!createErr && created?.id) {
      return created.id;
    }

    if (createErr) {
      console.warn('[ensureAgentExists] Agent creation note:', createErr.message);
      if (finalEmail) {
        const { data: conflictAgent } = await client
          .from('agents')
          .select('id')
          .eq('email', finalEmail)
          .maybeSingle();
        if (conflictAgent?.id) return conflictAgent.id;
      }
    }
  } catch (err) {
    console.error('[ensureAgentExists] Exception creating agent:', err);
  }

  // 5. Fallback: if any agent already exists in public.agents, use its id to satisfy FK
  try {
    const { data: anyAgent } = await client
      .from('agents')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (anyAgent?.id) {
      return anyAgent.id;
    }
  } catch (e) {
    console.warn('[ensureAgentExists] Fallback check failed:', e);
  }

  return finalId;
}

// Unified Service API: Scoped dynamically by Agent ID
export const portalService = {
  // Retrieve list of demo agents
  getDemoAgents(): Agent[] {
    const local = getLocalData();
    return local.agents || DEMO_AGENTS;
  },

  // Query all available agents from Supabase or fallback to demo agents
  async getAgentsList(): Promise<Agent[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('agents')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((a: any) => ({
            id: a.id,
            full_name: a.full_name || 'Sales Agent',
            email: a.email || '',
            phone_number: a.phone_number || '',
            territory: a.territory || 'Assigned Territory',
            avatar_url: a.avatar_url || '/src/assets/images/agent_portrait_avatar_1790185451855.jpg',
            role: 'Sales Agent',
            auth_user_id: a.auth_user_id || undefined,
            is_active: a.is_active ?? true,
            country_code: a.country_code || a.primary_country_code || 'JO',
            primary_country_code: a.primary_country_code || a.country_code || 'JO',
            currency_code: a.currency_code || a.primary_currency_code || 'JOD',
            primary_currency_code: a.primary_currency_code || a.currency_code || 'JOD',
            currency_symbol: a.currency_symbol || (a.currency_code === 'USD' ? '$' : a.currency_code) || 'JOD',
            tier_bronze: Number(a.tier_bronze ?? 20),
            tier_silver: Number(a.tier_silver ?? 60),
            tier_gold: Number(a.tier_gold ?? 120),
            tier_platinum: Number(a.tier_platinum ?? 200),
          }));
        }
      } catch (e) {
        console.warn('Failed to query agents list from Supabase:', e);
      }
    }

    return this.getDemoAgents();
  },

  // Ensure demo agents are seeded into Supabase public.agents
  async seedDemoAgents(): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    for (const demo of DEMO_AGENTS) {
      try {
        const { data: existing } = await supabase
          .from('agents')
          .select('id')
          .or(`id.eq.${demo.id},email.eq.${demo.email}`)
          .maybeSingle();

        if (!existing) {
          await supabase.from('agents').insert([
            {
              id: demo.id,
              full_name: demo.full_name,
              email: demo.email,
              phone_number: demo.phone_number,
              is_active: true,
            },
          ]);
        }
      } catch (e) {
        // silent note
      }
    }
  },

  // Set active demo agent
  setActiveDemoAgent(agentId: string): Agent {
    const local = getLocalData();
    const found = local.agents.find((a) => a.id === agentId) || local.agents[0] || DEFAULT_DEMO_AGENT;
    local.activeAgentId = found.id;
    saveLocalData(local);
    localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVE_AGENT_ID, found.id);
    return found;
  },

  // Authentication & Dynamic Agent Resolution:
  // Queries public.agents using auth_user_id or email (case-insensitive) with is_active = true.
  // Does not auto-create agents or modify profiles.
  async fetchAgentByAuthUser(authUser: User): Promise<Agent | null> {
    const supabase = getSupabaseClient();
    if (!supabase || !authUser) return null;

    try {
      // 1. Look up existing active agent row by auth_user_id
      const { data: byAuthUser, error: authErr } = await supabase
        .from('agents')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!authErr && byAuthUser) {
        return byAuthUser as Agent;
      }

      // 2. Look up existing active agent row by email (case-insensitive)
      const normalizedEmail = authUser.email?.trim().toLowerCase();
      if (normalizedEmail) {
        const { data: byEmail, error: emailErr } = await supabase
          .from('agents')
          .select('*')
          .ilike('email', normalizedEmail)
          .eq('is_active', true)
          .maybeSingle();

        if (!emailErr && byEmail) {
          // If auth_user_id is empty, link it by updating auth_user_id
          if (!byEmail.auth_user_id) {
            try {
              const { data: updated } = await supabase
                .from('agents')
                .update({ auth_user_id: authUser.id })
                .eq('id', byEmail.id)
                .select('*')
                .maybeSingle();

              if (updated) {
                return updated as Agent;
              }
            } catch (linkErr) {
              console.warn('Failed to link auth_user_id on agent row:', linkErr);
            }
          }
          return byEmail as Agent;
        }
      }
    } catch (err) {
      console.warn('Error fetching agent by auth user:', err);
    }

    return null;
  },

  // Authentication: Check current session
  async getSessionAgent(): Promise<Agent | null> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const agent = await this.fetchAgentByAuthUser(user);
          if (agent) return agent;
          await supabase.auth.signOut();
          return null;
        }
        return null;
      } catch (err) {
        console.warn('Supabase auth check failed:', err);
        return null;
      }
    }

    const local = getLocalData();
    const active = local.agents.find((a) => a.id === local.activeAgentId) || local.agents[0] || DEFAULT_DEMO_AGENT;
    return active;
  },

  async loginAgent(
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; errorCode?: string; agent?: Agent }> {
    const AGENT_NOT_RECOGNIZED_MESSAGE =
      'Agent not recognized. You are not registered as an agent, so you cannot enter the app.';

    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };
      if (data.user) {
        const agent = await this.fetchAgentByAuthUser(data.user);
        if (!agent) {
          await supabase.auth.signOut();
          return {
            success: false,
            errorCode: 'AGENT_NOT_RECOGNIZED',
            error: AGENT_NOT_RECOGNIZED_MESSAGE,
          };
        }
        return {
          success: true,
          agent,
        };
      }
      return {
        success: false,
        errorCode: 'AGENT_NOT_RECOGNIZED',
        error: AGENT_NOT_RECOGNIZED_MESSAGE,
      };
    }

    // Local / Demo Mode Login: match existing active agent by email (case-insensitive)
    const local = getLocalData();
    const normalizedEmail = email.trim().toLowerCase();
    const matched = local.agents.find(
      (a) => a.email.toLowerCase() === normalizedEmail && a.is_active !== false
    );
    if (!matched) {
      return {
        success: false,
        errorCode: 'AGENT_NOT_RECOGNIZED',
        error: AGENT_NOT_RECOGNIZED_MESSAGE,
      };
    }
    local.activeAgentId = matched.id;
    saveLocalData(local);
    localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVE_AGENT_ID, matched.id);

    return { success: true, agent: matched };
  },

  async logout(): Promise<void> {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY_ACTIVE_AGENT_ID);
    } catch {}
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error('Logout error:', e);
      }
    }
  },

  // B. Scoped Data Queries:
  // Fetch Shops explicitly filtered by agent_id with shop_configs, pricing, and table-resolved amounts
  async getShops(agentId: string): Promise<ShopWithConfig[]> {
    if (!agentId) return [];

    const creds = getSupabaseCredentials();
    const supabase = getSupabaseClient();
    const isConfigured = Boolean(creds.url && creds.anonKey && supabase);

    if (isConfigured && supabase) {
      try {
        let accessToken = '';
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          accessToken = sessionData?.session?.access_token || '';
        } catch {}

        const resp = await fetch('/api/agent/shops', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        const resJson = await resp.json().catch(() => null);
        if (resp.ok && resJson?.success && Array.isArray(resJson.shops)) {
          return resJson.shops.map((s: any) => {
            const rawConfig = s.shop_configs;
            const cfg = Array.isArray(rawConfig) ? rawConfig[0] : rawConfig;
            const config = cfg
              ? {
                  ...cfg,
                  background_image_url: cfg.background_image_url || cfg.bg_image_url || '',
                  bg_image_url: cfg.bg_image_url || cfg.background_image_url || '',
                }
              : undefined;

            const customPricing = s.shop_currency_pricing;
            const targetAgent = s.agents;
            let tablePrice: number | undefined;

            if (customPricing) {
              const p = customPricing;
              if (s.tier === 'platinum') {
                const val = p.tier_4_price ?? p.tier_platinum_price ?? p.platinum;
                if (val != null && !isNaN(Number(val)) && Number(val) > 0) tablePrice = Number(val);
              } else if (s.tier === 'gold') {
                const val = p.tier_3_price ?? p.tier_gold_price ?? p.gold;
                if (val != null && !isNaN(Number(val)) && Number(val) > 0) tablePrice = Number(val);
              } else if (s.tier === 'silver') {
                const val = p.tier_2_price ?? p.tier_silver_price ?? p.silver;
                if (val != null && !isNaN(Number(val)) && Number(val) > 0) tablePrice = Number(val);
              } else if (s.tier === 'bronze') {
                const val = p.tier_1_price ?? p.tier_bronze_price ?? p.bronze;
                if (val != null && !isNaN(Number(val)) && Number(val) > 0) tablePrice = Number(val);
              }
            }

            if (tablePrice === undefined) {
              if (s.monthly_price != null && !isNaN(Number(s.monthly_price)) && Number(s.monthly_price) > 0) {
                tablePrice = Number(s.monthly_price);
              } else if (s.amount_paid != null && !isNaN(Number(s.amount_paid)) && Number(s.amount_paid) > 0) {
                tablePrice = Number(s.amount_paid);
              }
            }

            if (tablePrice === undefined && targetAgent) {
              if (s.tier === 'bronze' && targetAgent.tier_bronze != null) tablePrice = Number(targetAgent.tier_bronze);
              else if (s.tier === 'silver' && targetAgent.tier_silver != null) tablePrice = Number(targetAgent.tier_silver);
              else if (s.tier === 'gold' && targetAgent.tier_gold != null) tablePrice = Number(targetAgent.tier_gold);
              else if (s.tier === 'platinum' && targetAgent.tier_platinum != null) tablePrice = Number(targetAgent.tier_platinum);
            }

            let subStatus: SubscriptionStatus = 'active';
            const rawSub = String(s.subscription_status || '').toLowerCase();
            const rawStatus = String(s.status || '').toLowerCase();
            if (rawSub === 'maintenance' || rawStatus === 'maintenance' || rawStatus === 'on_hold') {
              subStatus = 'maintenance';
            } else if (rawSub === 'suspended' || rawStatus === 'suspended' || s.is_active === false) {
              subStatus = 'suspended';
            } else {
              subStatus = 'active';
            }

            return {
              id: s.id,
              shop_name: s.shop_name,
              location: s.location,
              owner_email: s.owner_email,
              tier: s.tier,
              agent_id: s.agent_id,
              is_active: s.is_active ?? (subStatus !== 'suspended'),
              subscription_status: subStatus,
              status: subStatus,
              hold_reason: s.hold_reason,
              hold_date: s.hold_date,
              created_at: s.created_at,
              auth_user_id: s.auth_user_id,
              owner_phone: s.owner_phone,
              country_code: customPricing?.country_code || s.country_code || targetAgent?.country_code || 'JO',
              currency_code: customPricing?.currency_code || s.currency_code || targetAgent?.currency_code || 'JOD',
              currency_symbol: customPricing?.currency_symbol || s.currency_symbol || targetAgent?.currency_symbol || (s.currency_code === 'USD' ? '$' : 'JOD'),
              grace_period_days: s.grace_period_days,
              auto_stop_enabled: s.auto_stop_enabled,
              config: config || undefined,
              monthly_price: tablePrice,
              amount_paid: tablePrice ?? (s.amount_paid != null ? Number(s.amount_paid) : undefined),
              pricing: customPricing || undefined,
              agent: targetAgent || undefined,
              last_activity_at: s.last_activity_at ?? s.usage_30d?.last_activity_at ?? null,
              usage_30d: s.usage_30d ?? {
                try_on_sessions: Number(s.try_on_sessions_30d ?? 0),
                recommendations_made: Number(s.recommendations_30d ?? 0),
                last_activity_at: s.last_activity_at ?? null,
              },
              staff: Array.isArray(s.staff)
                ? s.staff.map((d: any) => ({
                    id: d.id,
                    userId: d.user_id || d.userId,
                    email: d.email,
                    role: d.role,
                    full_name: d.full_name,
                    phone_number: d.phone_number || undefined,
                    status: 'created' as const,
                  }))
                : [],
            };
          });
        }
      } catch (apiErr) {
        console.warn('Failed to fetch /api/agent/shops, running direct client fallback:', apiErr);
      }
    }

    if (supabase) {
      try {
        // Query shops with shop_configs
        const { data: shopsData, error: shopsErr } = await supabase
          .from('shops')
          .select('*, shop_configs(*)')
          .eq('agent_id', agentId)
          .order('created_at', { ascending: false });

        // Query agent pricing rates directly from public.agents table
        const agentsMap: Record<string, Agent> = {};
        let agentData: any = null;
        try {
          const { data: allAgents } = await supabase.from('agents').select('*');
          if (allAgents) {
            for (const a of allAgents) {
              agentsMap[a.id] = a;
              if (a.id === agentId || a.auth_user_id === agentId) {
                agentData = a;
              }
            }
          }
        } catch {}

        if (!agentData) {
          try {
            const { data: aRow } = await supabase.from('agents').select('*').eq('id', agentId).maybeSingle();
            if (aRow) agentData = aRow;
          } catch {}
        }

        // Query latest actual subscription payment amounts from public.shop_subscriptions_ledger table
        const shopLedgerAmounts: Record<string, number> = {};
        try {
          const { data: ledgerRows } = await supabase
            .from('shop_subscriptions_ledger')
            .select('shop_id, amount_paid, amount_paid_local, created_at')
            .order('created_at', { ascending: false });

          if (ledgerRows) {
            for (const row of ledgerRows) {
              if (row.shop_id && shopLedgerAmounts[row.shop_id] === undefined) {
                const amt = row.amount_paid_local ?? row.amount_paid;
                if (amt != null && !isNaN(Number(amt)) && Number(amt) > 0) {
                  shopLedgerAmounts[row.shop_id] = Number(amt);
                }
              }
            }
          }
        } catch {}

        // Query revenue records from public.ad_revenue_ledger table
        const shopAdRevenueMap: Record<string, number> = {};
        try {
          const { data: adRows } = await supabase
            .from('ad_revenue_ledger')
            .select('shop_id, shop_revenue, total_revenue, created_at')
            .order('created_at', { ascending: false });

          if (adRows) {
            for (const row of adRows) {
              if (row.shop_id && shopAdRevenueMap[row.shop_id] === undefined) {
                const rev = row.shop_revenue ?? row.total_revenue;
                if (rev != null && !isNaN(Number(rev)) && Number(rev) > 0) {
                  shopAdRevenueMap[row.shop_id] = Number(rev);
                }
              }
            }
          }
        } catch {}

        // Query payments from public.shop_payments table
        const shopPaymentAmounts: Record<string, number> = {};
        try {
          const { data: paymentRows } = await supabase
            .from('shop_payments')
            .select('shop_id, amount, created_at')
            .order('created_at', { ascending: false });

          if (paymentRows) {
            for (const row of paymentRows) {
              if (row.shop_id && shopPaymentAmounts[row.shop_id] === undefined && row.amount != null) {
                if (!isNaN(Number(row.amount)) && Number(row.amount) > 0) {
                  shopPaymentAmounts[row.shop_id] = Number(row.amount);
                }
              }
            }
          }
        } catch {}

        // Query custom shop pricing from public.shop_currency_pricing table
        const currencyPricingMap: Record<string, any> = {};
        // Seed known pricing entries first so that defined rates are always present:
        for (const kp of KNOWN_CURRENCY_PRICING) {
          currencyPricingMap[kp.shop_id] = kp;
          currencyPricingMap[String(kp.shop_id).trim().toLowerCase()] = kp;
        }

        try {
          const { data: pricingRows } = await supabase
            .from('shop_currency_pricing')
            .select('*');

          if (pricingRows) {
            for (const p of pricingRows) {
              if (p.shop_id) {
                currencyPricingMap[p.shop_id] = p;
                currencyPricingMap[String(p.shop_id).trim().toLowerCase()] = p;
              }
            }
          }
        } catch (pErr) {
          console.warn('Full shop_currency_pricing query error:', pErr);
        }

        // Also explicitly query shop_currency_pricing matching the retrieved shops to ensure no RLS or pagination miss:
        if (shopsData && shopsData.length > 0) {
          try {
            const sIds = shopsData.map((x: any) => x.id).filter(Boolean);
            const { data: matchedPricing } = await supabase
              .from('shop_currency_pricing')
              .select('*')
              .in('shop_id', sIds);
            if (matchedPricing) {
              for (const p of matchedPricing) {
                if (p.shop_id) {
                  currencyPricingMap[p.shop_id] = p;
                  currencyPricingMap[String(p.shop_id).trim().toLowerCase()] = p;
                }
              }
            }
          } catch {}
        }

        if (!shopsErr && shopsData) {
          const sIds = shopsData.map((x: any) => x.id).filter(Boolean);
          const thirtyDaysAgoMs = Date.now() - 30 * 24 * 60 * 60 * 1000;
          const fallbackUsageMap: Record<
            string,
            { try_on_sessions: number; recommendations_made: number; last_activity_at: string | null }
          > = {};
          const getUsageBucket = (id: string) => {
            if (!fallbackUsageMap[id]) {
              fallbackUsageMap[id] = { try_on_sessions: 0, recommendations_made: 0, last_activity_at: null };
            }
            return fallbackUsageMap[id];
          };
          const recordTs = (id: string, ts?: string | null) => {
            if (!ts) return;
            const ms = new Date(ts).getTime();
            if (Number.isNaN(ms)) return;
            const bucket = getUsageBucket(id);
            if (!bucket.last_activity_at || ms > new Date(bucket.last_activity_at).getTime()) {
              bucket.last_activity_at = ts;
            }
          };

          if (sIds.length > 0) {
            for (const tbl of ['try_on_sessions', 'tryon_sessions']) {
              try {
                const { data: tryRows, error: tryErr } = await supabase
                  .from(tbl)
                  .select('shop_id, created_at')
                  .in('shop_id', sIds);
                if (!tryErr && Array.isArray(tryRows)) {
                  for (const row of tryRows) {
                    if (!row.shop_id) continue;
                    const ms = row.created_at ? new Date(row.created_at).getTime() : NaN;
                    if (!Number.isNaN(ms) && ms >= thirtyDaysAgoMs) {
                      getUsageBucket(row.shop_id).try_on_sessions += 1;
                    }
                    recordTs(row.shop_id, row.created_at);
                  }
                  break;
                }
              } catch {}
            }

            for (const tbl of ['recommendations', 'frame_recommendations']) {
              try {
                const { data: recRows, error: recErr } = await supabase
                  .from(tbl)
                  .select('shop_id, created_at')
                  .in('shop_id', sIds);
                if (!recErr && Array.isArray(recRows)) {
                  for (const row of recRows) {
                    if (!row.shop_id) continue;
                    const ms = row.created_at ? new Date(row.created_at).getTime() : NaN;
                    if (!Number.isNaN(ms) && ms >= thirtyDaysAgoMs) {
                      getUsageBucket(row.shop_id).recommendations_made += 1;
                    }
                    recordTs(row.shop_id, row.created_at);
                  }
                  break;
                }
              } catch {}
            }
          }

          return shopsData.map((s: any) => {
            const rawConfig = s.shop_configs;
            const cfg = Array.isArray(rawConfig) ? rawConfig[0] : rawConfig;
            const config = cfg
              ? {
                  ...cfg,
                  background_image_url: cfg.background_image_url || cfg.bg_image_url || '',
                  bg_image_url: cfg.bg_image_url || cfg.background_image_url || '',
                }
              : undefined;

            // Resolve custom pricing strictly from public.shop_currency_pricing table first:
            const sIdKey = String(s.id || '').trim().toLowerCase();
            const customPricing = currencyPricingMap[s.id] || currencyPricingMap[sIdKey] || s.pricing;
            const targetAgent = agentsMap[s.agent_id] || agentData;
            let tablePrice: number | undefined;

            // PRIORITY 1: Custom boutique pricing from public.shop_currency_pricing table
            // This is the dedicated per-shop pricing table in the database and MUST take precedence over generic agent/tier rates.
            if (customPricing) {
              const p = customPricing;
              if (s.tier === 'platinum') {
                const val = p.tier_4_price ?? p.tier_platinum_price ?? p.platinum;
                if (val != null && !isNaN(Number(val)) && Number(val) > 0) tablePrice = Number(val);
              } else if (s.tier === 'gold') {
                const val = p.tier_3_price ?? p.tier_gold_price ?? p.gold;
                if (val != null && !isNaN(Number(val)) && Number(val) > 0) tablePrice = Number(val);
              } else if (s.tier === 'silver') {
                const val = p.tier_2_price ?? p.tier_silver_price ?? p.silver;
                if (val != null && !isNaN(Number(val)) && Number(val) > 0) tablePrice = Number(val);
              } else if (s.tier === 'bronze') {
                const val = p.tier_1_price ?? p.tier_bronze_price ?? p.bronze;
                if (val != null && !isNaN(Number(val)) && Number(val) > 0) tablePrice = Number(val);
              }
            }

            // PRIORITY 2: Direct column in public.shops table row
            if (tablePrice === undefined) {
              if (s.monthly_price != null && !isNaN(Number(s.monthly_price)) && Number(s.monthly_price) > 0) {
                tablePrice = Number(s.monthly_price);
              } else if (s.amount_paid != null && !isNaN(Number(s.amount_paid)) && Number(s.amount_paid) > 0) {
                tablePrice = Number(s.amount_paid);
              } else if (s.tier_price != null && !isNaN(Number(s.tier_price)) && Number(s.tier_price) > 0) {
                tablePrice = Number(s.tier_price);
              } else if (s.price != null && !isNaN(Number(s.price)) && Number(s.price) > 0) {
                tablePrice = Number(s.price);
              } else if (s.subscription_price != null && !isNaN(Number(s.subscription_price)) && Number(s.subscription_price) > 0) {
                tablePrice = Number(s.subscription_price);
              } else if (s.amount != null && !isNaN(Number(s.amount)) && Number(s.amount) > 0) {
                tablePrice = Number(s.amount);
              } else if (s.fee != null && !isNaN(Number(s.fee)) && Number(s.fee) > 0) {
                tablePrice = Number(s.fee);
              }
            }

            // PRIORITY 3: From public.shop_subscriptions_ledger table
            if (tablePrice === undefined && shopLedgerAmounts[s.id] !== undefined) {
              tablePrice = shopLedgerAmounts[s.id];
            }
            // PRIORITY 4: From public.ad_revenue_ledger table
            if (tablePrice === undefined && shopAdRevenueMap[s.id] !== undefined) {
              tablePrice = shopAdRevenueMap[s.id];
            }
            // PRIORITY 5: From public.shop_payments table
            if (tablePrice === undefined && shopPaymentAmounts[s.id] !== undefined) {
              tablePrice = shopPaymentAmounts[s.id];
            }
            // PRIORITY 6: From public.agents table columns
            if (tablePrice === undefined && targetAgent) {
              if (s.tier === 'bronze' && targetAgent.tier_bronze != null) tablePrice = Number(targetAgent.tier_bronze);
              else if (s.tier === 'silver' && targetAgent.tier_silver != null) tablePrice = Number(targetAgent.tier_silver);
              else if (s.tier === 'gold' && targetAgent.tier_gold != null) tablePrice = Number(targetAgent.tier_gold);
              else if (s.tier === 'platinum' && targetAgent.tier_platinum != null) tablePrice = Number(targetAgent.tier_platinum);
            }

            let subStatus: SubscriptionStatus = 'active';
            const rawSub = String(s.subscription_status || '').toLowerCase();
            const rawStatus = String(s.status || '').toLowerCase();
            if (rawSub === 'maintenance' || rawStatus === 'maintenance' || rawStatus === 'on_hold') {
              subStatus = 'maintenance';
            } else if (rawSub === 'suspended' || rawStatus === 'suspended' || s.is_active === false) {
              subStatus = 'suspended';
            } else {
              subStatus = 'active';
            }

            recordTs(s.id, s.last_activity_at || s.last_active_at || cfg?.config_json?.last_activity_at || null);
            const usageBucket = getUsageBucket(s.id);
            if (usageBucket.try_on_sessions === 0 && s.try_on_sessions_30d != null) {
              usageBucket.try_on_sessions = Number(s.try_on_sessions_30d) || 0;
            }
            if (usageBucket.recommendations_made === 0 && s.recommendations_30d != null) {
              usageBucket.recommendations_made = Number(s.recommendations_30d) || 0;
            }

            return {
              id: s.id,
              shop_name: s.shop_name,
              location: s.location,
              owner_email: s.owner_email,
              tier: s.tier,
              agent_id: s.agent_id,
              is_active: s.is_active ?? (subStatus !== 'suspended'),
              subscription_status: subStatus,
              status: subStatus,
              hold_reason: s.hold_reason,
              hold_date: s.hold_date,
              created_at: s.created_at,
              last_activity_at: usageBucket.last_activity_at,
              usage_30d: usageBucket,
              auth_user_id: s.auth_user_id,
              owner_phone: s.owner_phone,
              country_code: customPricing?.country_code || s.country_code || agentData?.country_code || 'JO',
              currency_code: customPricing?.currency_code || s.currency_code || agentData?.currency_code || 'JOD',
              currency_symbol: customPricing?.currency_symbol || s.currency_symbol || agentData?.currency_symbol || (s.currency_code === 'USD' ? '$' : 'JOD'),
              grace_period_days: s.grace_period_days,
              auto_stop_enabled: s.auto_stop_enabled,
              config: config || undefined,
              monthly_price: tablePrice,
              amount_paid: shopLedgerAmounts[s.id] ?? tablePrice ?? (s.amount_paid != null ? Number(s.amount_paid) : undefined),
              pricing: customPricing || undefined,
              agent: targetAgent || undefined,
            };
          });
        }
      } catch (err) {
        console.warn('Supabase getShops error, falling back to scoped local data:', err);
      }
    }

    // Scoped local storage: strictly return shops belonging to agentId with table-resolved amounts
    const local = getLocalData();
    const agentObj = (local.agents || []).find((a: Agent) => a.id === agentId) || DEFAULT_DEMO_AGENT;
    return (local.shops || [])
      .filter((s: ShopWithConfig) => s.agent_id === agentId)
      .map((s: ShopWithConfig) => {
        const shopLedger = (local.ledger || []).find((l: ShopSubscriptionLedger) => l.shop_id === s.id);
        const shopIdKey = String(s.id || '').trim().toLowerCase();
        const customPricing =
          s.pricing ||
          (local.pricing || []).find((p: any) => p.shop_id === s.id || String(p.shop_id).trim().toLowerCase() === shopIdKey) ||
          KNOWN_CURRENCY_PRICING.find((p) => p.shop_id === s.id || String(p.shop_id).trim().toLowerCase() === shopIdKey);

        let resolvedPrice: number | undefined;

        // PRIORITY 1: Custom shop pricing from shop_currency_pricing
        if (customPricing) {
          if (s.tier === 'platinum') {
            const p4 = customPricing.tier_4_price ?? (customPricing as any).tier_platinum_price;
            if (p4 != null && !isNaN(Number(p4)) && Number(p4) > 0) resolvedPrice = Number(p4);
          } else if (s.tier === 'gold') {
            const p3 = customPricing.tier_3_price ?? (customPricing as any).tier_gold_price;
            if (p3 != null && !isNaN(Number(p3)) && Number(p3) > 0) resolvedPrice = Number(p3);
          } else if (s.tier === 'silver') {
            const p2 = customPricing.tier_2_price ?? (customPricing as any).tier_silver_price;
            if (p2 != null && !isNaN(Number(p2)) && Number(p2) > 0) resolvedPrice = Number(p2);
          } else if (s.tier === 'bronze') {
            const p1 = customPricing.tier_1_price ?? (customPricing as any).tier_bronze_price;
            if (p1 != null && !isNaN(Number(p1)) && Number(p1) > 0) resolvedPrice = Number(p1);
          }
        }

        if (resolvedPrice === undefined && s.monthly_price !== undefined) {
          resolvedPrice = s.monthly_price;
        }
        if (resolvedPrice === undefined && shopLedger && shopLedger.amount_paid != null) {
          resolvedPrice = Number(shopLedger.amount_paid);
        }
        if (resolvedPrice === undefined && agentObj) {
          if (s.tier === 'bronze' && agentObj.tier_bronze != null) resolvedPrice = Number(agentObj.tier_bronze);
          else if (s.tier === 'silver' && agentObj.tier_silver != null) resolvedPrice = Number(agentObj.tier_silver);
          else if (s.tier === 'gold' && agentObj.tier_gold != null) resolvedPrice = Number(agentObj.tier_gold);
          else if (s.tier === 'platinum' && agentObj.tier_platinum != null) resolvedPrice = Number(agentObj.tier_platinum);
        }
        return {
          ...s,
          monthly_price: resolvedPrice,
          amount_paid: shopLedger ? Number(shopLedger.amount_paid) : (resolvedPrice ?? s.amount_paid),
          pricing: customPricing || s.pricing || undefined,
          agent: agentObj,
          country_code: customPricing?.country_code || s.country_code || agentObj.country_code || 'JO',
          currency_code: customPricing?.currency_code || s.currency_code || agentObj.currency_code || 'JOD',
          currency_symbol: customPricing?.currency_symbol || s.currency_symbol || agentObj.currency_symbol || 'JOD',
          last_activity_at: s.usage_30d?.last_activity_at ?? s.last_activity_at ?? null,
          usage_30d: s.usage_30d ?? {
            try_on_sessions: 0,
            recommendations_made: 0,
            last_activity_at: s.last_activity_at ?? null,
          },
          staff: getLocalStaffRoster(s.id) || s.staff || [],
        };
      });
  },

  // B. Scoped Data Queries:
  // Fetch Financial Ledger explicitly filtered by agent_id
  async getLedger(agentId: string): Promise<ShopSubscriptionLedger[]> {
    if (!agentId) return [];

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        // Query scoped strictly by agent_id:
        // const { data: ledger } = await supabase.from('shop_subscriptions_ledger').select('*, shops(shop_name)').eq('agent_id', currentAgent.id).order('created_at', { ascending: false });
        const { data, error } = await supabase
          .from('shop_subscriptions_ledger')
          .select(`
            *,
            shops (
              shop_name,
              location,
              tier,
              currency_code,
              currency_symbol
            )
          `)
          .eq('agent_id', agentId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((item: any) => ({
            ...item,
            amount_paid: Number(item.amount_paid_local ?? item.amount_paid ?? 0),
            agent_commission: Number(item.agent_commission ?? (Number(item.amount_paid_local ?? item.amount_paid ?? 0) * 0.5)),
            platform_share: Number(item.platform_share ?? (Number(item.amount_paid_local ?? item.amount_paid ?? 0) * 0.5)),
            shop: Array.isArray(item.shops) ? item.shops[0] : item.shops,
          }));
        }
      } catch (err) {
        console.warn('Supabase getLedger failed, falling back to scoped local data:', err);
      }
    }

    // Scoped local storage: strictly return ledger entries belonging to agentId
    const local = getLocalData();
    const shopsMap = new Map<string, ShopWithConfig>(local.shops.map((s) => [s.id, s]));
    return (local.ledger || [])
      .filter((entry: ShopSubscriptionLedger) => entry.agent_id === agentId)
      .map((entry: ShopSubscriptionLedger) => {
        const shop = shopsMap.get(entry.shop_id);
        return {
          ...entry,
          shop: shop ? { shop_name: shop.shop_name, location: shop.location, tier: shop.tier } : entry.shop,
        };
      });
  },

  // Query staff credentials for a specific shop
  async getShopStaffCredentials(shopId: string, shopFallback?: ShopWithConfig): Promise<StaffCredentialResult[]> {
    const creds = getSupabaseCredentials();
    const supabase = getSupabaseClient();
    const isConfigured = Boolean(creds.url && creds.anonKey && supabase);

    if (isConfigured && supabase) {
      let accessToken = '';
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        accessToken = sessionData?.session?.access_token || '';
      } catch {}

      const resp = await fetch(`/api/agent/shops/${encodeURIComponent(shopId)}/staff`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const resJson = await resp.json().catch(() => null);
      if (!resp.ok || !resJson?.success) {
        throw new Error(resJson?.error || `Failed to load staff credentials (${resp.status})`);
      }

      return (resJson.staff || []).map((d: any) => ({
        id: d.id,
        userId: d.user_id,
        email: d.email,
        role: d.role,
        full_name: d.full_name,
        phone_number: d.phone_number || undefined,
        status: 'created' as const,
      }));
    }

    // Local cached roster check
    const cached = getLocalStaffRoster(shopId);
    if (cached && cached.length > 0) {
      return cached;
    }

    // Generate realistic initial optical staff roster if none exists yet
    const defaults: StaffCredentialResult[] = [
      {
        id: `staff-${shopId}-1`,
        userId: `usr-${shopId}-1`,
        full_name: shopFallback ? `${shopFallback.shop_name} Chief Optometrist` : 'Dr. Ahmad Al-Majali',
        role: 'optometrist',
        email: shopFallback?.owner_email ? `optometry@${shopFallback.config?.subdomain_slug || 'shop'}.opticportal.io` : 'dr.ahmad@opticportal.io',
        phone_number: '+962 7 9123 4567',
        status: 'created',
      },
      {
        id: `staff-${shopId}-2`,
        userId: `usr-${shopId}-2`,
        full_name: shopFallback ? `${shopFallback.shop_name} Senior Optician` : 'Rania Haddad',
        role: 'optician',
        email: shopFallback?.owner_email ? `optician@${shopFallback.config?.subdomain_slug || 'shop'}.opticportal.io` : 'rania@opticportal.io',
        phone_number: '+962 7 9234 5678',
        status: 'created',
      },
      {
        id: `staff-${shopId}-3`,
        userId: `usr-${shopId}-3`,
        full_name: shopFallback?.owner_email ? `${shopFallback.shop_name} Managing Owner` : 'Omar Qasem',
        role: 'shop_owner',
        email: shopFallback?.owner_email || 'owner@opticportal.io',
        phone_number: '+962 7 9345 6789',
        status: 'created',
      },
    ];
    saveLocalStaffRoster(shopId, defaults);
    return defaults;
  },

  // Update staff credentials (name, role, email, optional phone number) via server endpoint
  async updateShopStaffCredential(
    shopId: string,
    credential: {
      id?: string;
      userId?: string;
      full_name: string;
      role: StaffRole;
      email: string;
      phone_number?: string;
    }
  ): Promise<StaffCredentialResult | boolean> {
    const creds = getSupabaseCredentials();
    const supabase = getSupabaseClient();
    const isConfigured = Boolean(creds.url && creds.anonKey && supabase);

    if (isConfigured && supabase) {
      const targetUserId = credential.userId;
      if (!targetUserId || !isValidUUID(targetUserId)) {
        throw new Error('Cannot update officer: missing valid user ID.');
      }

      let accessToken = '';
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        accessToken = sessionData?.session?.access_token || '';
      } catch {}

      const resp = await fetch(`/api/agent/staff/${encodeURIComponent(targetUserId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          full_name: credential.full_name,
          role: credential.role,
          email: credential.email,
          ...(credential.phone_number !== undefined ? { phone_number: credential.phone_number } : {}),
        }),
      });

      const resJson = await resp.json().catch(() => null);
      if (!resp.ok || !resJson?.success) {
        throw new Error(resJson?.error || `Failed to update officer (${resp.status})`);
      }

      if (resJson.staff) {
        return {
          id: resJson.staff.id,
          userId: resJson.staff.user_id || targetUserId,
          email: resJson.staff.email,
          role: resJson.staff.role,
          full_name: resJson.staff.full_name,
          phone_number: resJson.staff.phone_number || undefined,
          status: 'created',
        };
      }
      return true;
    }

    // Demo mode only
    const list = getLocalStaffRoster(shopId) || [];
    const updated = list.map((s) => {
      const match =
        (credential.id && s.id === credential.id) ||
        (credential.userId && s.userId === credential.userId) ||
        s.email === credential.email;
      if (match) {
        return {
          ...s,
          full_name: credential.full_name,
          role: credential.role,
          email: credential.email,
          phone_number: credential.phone_number,
        };
      }
      return s;
    });
    saveLocalStaffRoster(shopId, updated);
    return true;
  },

  // Add a new staff member to the boutique roster
  async addShopStaffCredential(
    shopId: string,
    credential: {
      full_name: string;
      role: StaffRole;
      email: string;
      password?: string;
      phone_number?: string;
    }
  ): Promise<StaffCredentialResult> {
    const supabase = getSupabaseClient();
    if (supabase) {
      let accessToken = '';
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        accessToken = sessionData?.session?.access_token || '';
      } catch {}

      const tempPassword = credential.password && credential.password.length >= 8
        ? credential.password
        : `#Optic${Math.floor(1000 + Math.random() * 9000)}!`;

      const resp = await fetch('/api/agent/create-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          shop_id: shopId,
          staff: [
            {
              full_name: credential.full_name,
              role: credential.role,
              email: credential.email,
              password: tempPassword,
              phone_number: credential.phone_number,
            },
          ],
        }),
      });

      const resJson = await resp.json().catch(() => null);
      if (!resp.ok || !resJson?.success || !resJson?.credentials?.[0]) {
        throw new Error(resJson?.error || `Failed to create staff credentials (${resp.status})`);
      }

      return resJson.credentials[0];
    }

    // Demo mode only
    const newStaff: StaffCredentialResult = {
      id: generateUUID(),
      userId: generateUUID(),
      full_name: credential.full_name,
      role: credential.role,
      email: credential.email,
      phone_number: credential.phone_number,
      status: 'created',
    };
    const list = getLocalStaffRoster(shopId) || [];
    list.push(newStaff);
    saveLocalStaffRoster(shopId, list);
    return newStaff;
  },

  // Remove an officer (auth user + staff credential row) via server endpoint
  async deleteShopStaffCredential(shopId: string, userIdOrIdentifier: string): Promise<boolean> {
    const creds = getSupabaseCredentials();
    const supabase = getSupabaseClient();
    const isConfigured = Boolean(creds.url && creds.anonKey && supabase);

    if (isConfigured && supabase) {
      if (!isValidUUID(userIdOrIdentifier)) {
        throw new Error('Cannot remove officer: missing valid user ID.');
      }

      let accessToken = '';
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        accessToken = sessionData?.session?.access_token || '';
      } catch {}

      const resp = await fetch(`/api/agent/staff/${encodeURIComponent(userIdOrIdentifier)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const resJson = await resp.json().catch(() => null);
      if (!resp.ok || !resJson?.success) {
        throw new Error(resJson?.error || `Failed to delete officer (${resp.status})`);
      }
      return true;
    }

    const list = getLocalStaffRoster(shopId) || [];
    const filtered = list.filter(
      (s) => s.userId !== userIdOrIdentifier && s.id !== userIdOrIdentifier && s.email !== userIdOrIdentifier
    );
    saveLocalStaffRoster(shopId, filtered);
    return true;
  },

  // Change an officer's password via server endpoint (auth.admin.updateUserById)
  async changeShopStaffPassword(userId: string, password: string): Promise<boolean> {
    const creds = getSupabaseCredentials();
    const supabase = getSupabaseClient();
    const isConfigured = Boolean(creds.url && creds.anonKey && supabase);

    if (isConfigured && supabase) {
      if (!isValidUUID(userId)) {
        throw new Error('Cannot update password: missing valid user ID.');
      }

      let accessToken = '';
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        accessToken = sessionData?.session?.access_token || '';
      } catch {}

      const resp = await fetch(`/api/agent/staff/${encodeURIComponent(userId)}/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ password }),
      });

      const resJson = await resp.json().catch(() => null);
      if (!resp.ok || !resJson?.success) {
        throw new Error(resJson?.error || `Failed to change officer password (${resp.status})`);
      }
      return true;
    }

    return true;
  },

  // Real-Time Database Pre-Flight Check for Form Uniqueness
  async checkFieldAvailability(
    field: 'email' | 'subdomain' | 'shop_name' | 'phone',
    value: string,
    options?: { excludeShopId?: string }
  ): Promise<{
    available: boolean;
    field: string;
    message?: string;
    reason?: 'conflict' | 'invalid_format' | 'reserved' | 'server_error' | 'already_registered';
    normalized?: string;
    messageAr?: string;
  }> {
    const trimmed = String(value || '').trim();
    if (!trimmed) {
      return { available: false, field, reason: 'invalid_format', message: 'Value cannot be empty' };
    }

    // Normalizations
    let normalized = trimmed;
    if (field === 'email') {
      normalized = trimmed.toLowerCase();
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(normalized)) {
        return { available: false, field, reason: 'invalid_format', message: 'Invalid email syntax format' };
      }
    } else if (field === 'subdomain') {
      normalized = trimmed
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      if (normalized.length < 3) {
        return { available: false, field, reason: 'invalid_format', message: 'Subdomain must be at least 3 characters' };
      }
    } else if (field === 'shop_name') {
      if (normalized.length < 3) {
        return { available: false, field, reason: 'invalid_format', message: 'Shop name must be at least 3 characters' };
      }
    } else if (field === 'phone') {
      const digitsOnly = trimmed.replace(/[^\d+]/g, '');
      if (digitsOnly.length < 7) {
        return { available: false, field, reason: 'invalid_format', message: 'Phone number must have at least 7 digits' };
      }
    }

    // 1. Try calling the backend /api/check-availability endpoint first
    try {
      const resp = await fetch('/api/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field,
          value: normalized,
          excludeShopId: options?.excludeShopId,
        }),
      });

      const rawText = await resp.text();
      let resData: any = null;
      try {
        resData = JSON.parse(rawText);
      } catch {
        // Not JSON
      }

      if (resData && typeof resData.available === 'boolean') {
        return resData;
      }
    } catch (e) {
      console.warn('API /api/check-availability error, running direct client fallback check:', e);
    }

    // 2. Client-side database check using Supabase Client if configured
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        if (field === 'email') {
          const conflictMsg = 'This email is already registered in Supabase users. Please choose a different email.';
          const conflictMsgAr = 'هذا البريد الإلكتروني مسجل بالفعل في مستخدمي Supabase. يرجى اختيار بريد إلكتروني مختلف.';

          // Check profiles table (mirrors Supabase auth users)
          const { data: pData } = await supabase.from('profiles').select('id, email').eq('email', normalized).maybeSingle();
          if (pData?.id) {
            return { available: false, field, reason: 'already_registered', message: conflictMsg, messageAr: conflictMsgAr };
          }

          // Check agents table
          const { data: aData } = await supabase.from('agents').select('id, full_name').eq('email', normalized).maybeSingle();
          if (aData?.id) {
            return { available: false, field, reason: 'already_registered', message: conflictMsg, messageAr: conflictMsgAr };
          }

          // Check shops table
          let sQuery = supabase.from('shops').select('id, shop_name').eq('owner_email', normalized);
          if (options?.excludeShopId && isValidUUID(options.excludeShopId)) {
            sQuery = sQuery.neq('id', options.excludeShopId);
          }
          const { data: sData } = await sQuery.maybeSingle();
          if (sData?.id) {
            return { available: false, field, reason: 'already_registered', message: conflictMsg, messageAr: conflictMsgAr };
          }

          // Check staff table
          const { data: stData } = await supabase.from('shop_staff_credentials').select('id, full_name').eq('email', normalized).maybeSingle();
          if (stData?.id) {
            return { available: false, field, reason: 'already_registered', message: conflictMsg, messageAr: conflictMsgAr };
          }

          return { available: true, field, message: 'Email is available for registration' };
        }

        if (field === 'subdomain') {
          let cQuery = supabase.from('shop_configs').select('shop_id').eq('subdomain_slug', normalized);
          if (options?.excludeShopId && isValidUUID(options.excludeShopId)) {
            cQuery = cQuery.neq('shop_id', options.excludeShopId);
          }
          const { data: cData } = await cQuery.maybeSingle();
          if (cData?.shop_id) {
            return { available: false, field, reason: 'conflict', normalized, message: `Subdomain '${normalized}' is already taken` };
          }
          return { available: true, field, normalized, message: `Subdomain '${normalized}' is available` };
        }

        if (field === 'shop_name') {
          let query = supabase.from('shops').select('id, shop_name').ilike('shop_name', normalized);
          if (options?.excludeShopId && isValidUUID(options.excludeShopId)) {
            query = query.neq('id', options.excludeShopId);
          }
          const { data: existShop } = await query.maybeSingle();
          if (existShop?.id) {
            return {
              available: false,
              field: 'shop_name',
              reason: 'conflict',
              message: 'This optical shop name is already registered in the database. Please choose a different name or edit the existing shop.',
              messageAr: 'اسم مركز البصريات هذا مسجل بالفعل في قاعدة البيانات. يرجى اختيار اسم مختلف أو تعديل المتجر الحالي.',
            };
          }
          return { available: true, field, message: 'Optical shop name is available' };
        }

        if (field === 'phone') {
          const digits = trimmed.replace(/[^\d+]/g, '');
          const { data: aPhone } = await supabase.from('agents').select('id, full_name').or(`phone_number.eq.${trimmed},phone_number.eq.${digits}`).maybeSingle();
          if (aPhone?.id) {
            return { available: false, field, reason: 'conflict', message: `Phone number is associated with agent (${aPhone.full_name})` };
          }

          let sPhoneQuery = supabase.from('shops').select('id, shop_name').or(`owner_phone.eq.${trimmed},owner_phone.eq.${digits}`);
          if (options?.excludeShopId && isValidUUID(options.excludeShopId)) {
            sPhoneQuery = sPhoneQuery.neq('id', options.excludeShopId);
          }
          const { data: sPhone } = await sPhoneQuery.maybeSingle();
          if (sPhone?.id) {
            return { available: false, field, reason: 'conflict', message: `Phone number is already associated with shop "${sPhone.shop_name}"` };
          }

          const { data: stPhone } = await supabase.from('shop_staff_credentials').select('id, full_name').or(`phone_number.eq.${trimmed},phone_number.eq.${digits}`).maybeSingle();
          if (stPhone?.id) {
            return { available: false, field, reason: 'conflict', message: `Phone number is already linked to staff (${stPhone.full_name})` };
          }
          return { available: true, field, message: 'Phone number is available' };
        }
      } catch (err) {
        console.warn('Supabase client check error, falling back to local storage:', err);
      }
    }

    // 3. Local Mock State check (for demo / offline testing)
    const local = getLocalData();
    if (field === 'email') {
      const conflictMsg = 'This email is already registered in Supabase users. Please choose a different email.';
      const conflictMsgAr = 'هذا البريد الإلكتروني مسجل بالفعل في مستخدمي Supabase. يرجى اختيار بريد إلكتروني مختلف.';

      const matchAgent = (local.agents || DEMO_AGENTS).find((a) => a.email.toLowerCase() === normalized);
      if (matchAgent) {
        return { available: false, field, reason: 'already_registered', message: conflictMsg, messageAr: conflictMsgAr };
      }
      const matchShop = (local.shops || INITIAL_SHOPS).find(
        (s) => s.owner_email.toLowerCase() === normalized && (!options?.excludeShopId || s.id !== options.excludeShopId)
      );
      if (matchShop) {
        return { available: false, field, reason: 'already_registered', message: conflictMsg, messageAr: conflictMsgAr };
      }

      // Check all staff previously stored or unverified in local rosters across shops
      try {
        const storedRostersRaw = localStorage.getItem('optic_portal_staff_roster');
        if (storedRostersRaw) {
          const parsedRosters = JSON.parse(storedRostersRaw);
          for (const sId of Object.keys(parsedRosters)) {
            const roster = parsedRosters[sId];
            if (Array.isArray(roster)) {
              const matchStaff = roster.find((st: any) => st.email && String(st.email).trim().toLowerCase() === normalized);
              if (matchStaff) {
                return {
                  available: false,
                  field: 'email',
                  reason: 'already_registered',
                  message: `This email is already associated with staff member (${matchStaff.full_name || 'Staff'}).`,
                  messageAr: `هذا البريد مسجل مسبقاً لموظف (${matchStaff.full_name || 'موظف'}).`,
                };
              }
            }
          }
        }
      } catch {}

      return { available: true, field, message: 'Email is available' };
    }

    if (field === 'subdomain') {
      const matchSlug = (local.shops || INITIAL_SHOPS).find(
        (s) => s.config?.subdomain_slug?.toLowerCase() === normalized && (!options?.excludeShopId || s.id !== options.excludeShopId)
      );
      if (matchSlug) {
        return { available: false, field, reason: 'conflict', normalized, message: `Subdomain '${normalized}' is already taken` };
      }
      return { available: true, field, normalized, message: `Subdomain '${normalized}' is available` };
    }

    if (field === 'shop_name') {
      const matchName = (local.shops || INITIAL_SHOPS).find(
        (s) => s.shop_name.trim().toLowerCase() === normalized.trim().toLowerCase() && (!options?.excludeShopId || s.id !== options.excludeShopId)
      );
      if (matchName) {
        return {
          available: false,
          field: 'shop_name',
          reason: 'conflict',
          message: 'This optical shop name is already registered in the database. Please choose a different name or edit the existing shop.',
          messageAr: 'اسم مركز البصريات هذا مسجل بالفعل في قاعدة البيانات. يرجى اختيار اسم مختلف أو تعديل المتجر الحالي.',
        };
      }
      return { available: true, field, message: 'Shop name is available' };
    }

    if (field === 'phone') {
      const digits = trimmed.replace(/[^\d+]/g, '');
      const matchAgentPhone = (local.agents || DEMO_AGENTS).find(
        (a) => a.phone_number?.replace(/[^\d+]/g, '') === digits
      );
      if (matchAgentPhone) {
        return { available: false, field, reason: 'conflict', message: `Phone number is associated with agent (${matchAgentPhone.full_name})` };
      }
      return { available: true, field, message: 'Phone number is available' };
    }

    return { available: true, field };
  },

  // C1. Onboarding New Shop Form Action + Staff Provisioning:
  // Calls /api/agent/onboard-shop backend route to create shop and provision staff credentials via supabase.auth.admin.createUser
  async onboardShopWithStaff(
    shopInput: {
      shop_name: string;
      location: string;
      owner_email: string;
      tier: SubscriptionTier;
      agent_id: string;
      status?: string;
      subscription_status?: SubscriptionStatus;
      is_active?: boolean;
      [key: string]: any;
    },
    configInput: {
      subdomain_slug: string;
      logo_url: string;
      primary_color: string;
      secondary_color: string;
      background_image_url: string;
      bg_image_url?: string;
      config_json?: any;
    },
    staff: StaffProvisionInput[] = []
  ): Promise<OnboardShopResponse> {
    if (!shopInput.agent_id) {
      return { success: false, error: 'Agent ID is missing. Please ensure you are logged in.' };
    }

    const creds = getSupabaseCredentials();
    const supabase = getSupabaseClient();
    const isConfigured = Boolean(creds.url && creds.anonKey && supabase);

    if (isConfigured && supabase) {
      let accessToken = '';
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        accessToken = sessionData?.session?.access_token || '';
      } catch (err: any) {
        console.warn('Failed to retrieve session access token:', err);
      }

      let resp: Response;
      try {
        resp = await fetch('/api/agent/onboard-shop', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            shop: shopInput,
            config: configInput,
            staff,
          }),
        });
      } catch (netErr: any) {
        return {
          success: false,
          error: `Network error connecting to backend: ${netErr?.message || netErr}`,
        };
      }

      let resJson: any = null;
      try {
        resJson = await resp.json();
      } catch {
        return {
          success: false,
          error: `Server returned non-JSON response (HTTP ${resp.status}). Hint: Verify backend server logs.`,
        };
      }

      if (!resp.ok || !resJson?.success) {
        const error = resJson?.error || `Request failed (${resp.status})`;
        const hint = resJson?.hint ? ` Hint: ${resJson.hint}` : '';
        return {
          success: false,
          error: `${error}${hint}`,
        };
      }

      // On success, cache returned shop locally and return it
      const local = getLocalData();
      local.shops = [resJson.shop, ...(local.shops || []).filter((s) => s.id !== resJson.shop.id)];
      saveLocalData(local);

      const mappedShop = resJson.shop
        ? {
            ...resJson.shop,
            staff: Array.isArray(resJson.shop.staff)
              ? resJson.shop.staff.map((d: any) => ({
                  id: d.id,
                  userId: d.user_id || d.userId,
                  email: d.email,
                  role: d.role,
                  full_name: d.full_name,
                  phone_number: d.phone_number || undefined,
                  status: 'created' as const,
                }))
              : resJson.credentials || [],
          }
        : resJson.shop;

      return {
        success: true,
        shop: mappedShop,
        credentials: resJson.credentials,
        warnings: resJson.warnings,
      };
    }

    // Keep old local path only when Supabase is not configured at all (demo mode)
    const generatedShopId = generateUUID();
    const createdShop: ShopWithConfig = {
      id: generatedShopId,
      shop_name: shopInput.shop_name,
      location: shopInput.location,
      owner_email: shopInput.owner_email,
      tier: shopInput.tier,
      agent_id: shopInput.agent_id,
      is_active: shopInput.is_active !== undefined ? shopInput.is_active : true,
      subscription_status: (shopInput.subscription_status as SubscriptionStatus) || 'active',
      status: shopInput.status || 'active',
      created_at: new Date().toISOString(),
      config: {
        shop_id: generatedShopId,
        subdomain_slug: configInput.subdomain_slug,
        logo_url: configInput.logo_url || '',
        primary_color: configInput.primary_color || '#1e293b',
        secondary_color: configInput.secondary_color || '#64748b',
        background_image_url: configInput.background_image_url || '',
        bg_image_url: configInput.background_image_url || '',
        updated_at: new Date().toISOString(),
      },
    };

    const local = getLocalData();
    local.shops = [createdShop, ...(local.shops || []).filter((s) => s.id !== generatedShopId)];
    saveLocalData(local);

    const generatedCredentials: StaffCredentialResult[] = staff.map((s) => ({
      userId: 'usr-' + Math.random().toString(36).substring(2, 9),
      email: s.email,
      password: s.password,
      full_name: s.full_name,
      role: s.role,
      status: 'created',
    }));

    saveLocalStaffRoster(generatedShopId, generatedCredentials);

    return {
      success: true,
      shop: { ...createdShop, staff: generatedCredentials },
      credentials: generatedCredentials,
    };
  },

  // C. Onboarding New Shop Form Action:
  // Explicitly injects agent_id: currentAgent.id into public.shops and creates default entry in public.shop_configs
  async onboardShop(
    shopInput: {
      shop_name: string;
      location: string;
      owner_email: string;
      tier: SubscriptionTier;
      agent_id: string;
      status?: string;
      subscription_status?: SubscriptionStatus;
      is_active?: boolean;
      agent?: Partial<Agent>;
      [key: string]: any;
    },
    configInput: {
      subdomain_slug: string;
      logo_url: string;
      primary_color: string;
      secondary_color: string;
      background_image_url: string;
    }
  ): Promise<{ success: boolean; error?: string; shop?: ShopWithConfig }> {
    if (!shopInput.agent_id) {
      return { success: false, error: 'Agent ID is missing. Please ensure you are logged in.' };
    }

    const supabase = getSupabaseClient();
    const generatedShopId = generateUUID();

    if (supabase) {
      try {
        // Guarantee that agent exists in public.agents to prevent foreign key violation on shops_agent_id_fkey
        const resolvedAgentId = await ensureAgentExists(
          supabase,
          shopInput.agent_id,
          (shopInput as any).agent
        );

        // Clean up payload before calling Supabase:
        // Ensure payload sanitization strips out status, hold_reason, hold_date, and any non-column properties
        // before inserting into the shops table. Strictly valid columns only:
        // (shop_name, location, owner_email, tier, agent_id, is_active, subscription_status)
        const { status: _status, hold_reason: _holdReason, hold_date: _holdDate, agent: _agent, ...cleanShopInput } = shopInput as any;

        const baseShopPayload = {
          shop_name: String(cleanShopInput.shop_name || '').trim(),
          location: String(cleanShopInput.location || '').trim(),
          owner_email: String(cleanShopInput.owner_email || '').trim().toLowerCase(),
          tier: cleanShopInput.tier,
          agent_id: resolvedAgentId,
          is_active: cleanShopInput.is_active !== undefined ? Boolean(cleanShopInput.is_active) : true,
          country_code: cleanShopInput.country_code || 'JO',
          currency_code: cleanShopInput.currency_code || 'JOD',
          currency_symbol: cleanShopInput.currency_symbol || cleanShopInput.currency_code || 'JOD',
          owner_phone: cleanShopInput.owner_phone || null,
        };

        const shopInsertWithStatus = {
          ...baseShopPayload,
          subscription_status: cleanShopInput.subscription_status || 'active',
        };

        // 1. Insert into public.shops with sanitized valid columns
        let newShop: any = null;
        let { data: insertedShop, error: shopErr } = await supabase
          .from('shops')
          .insert([shopInsertWithStatus])
          .select()
          .single();

        // If table schema does not include subscription_status, retry with standard schema columns
        if (shopErr && (shopErr.code === '42703' || shopErr.message?.includes('subscription_status') || shopErr.message?.includes('column') || (shopErr as any).status === 400)) {
          const retry = await supabase
            .from('shops')
            .insert([baseShopPayload])
            .select()
            .single();
          insertedShop = retry.data;
          shopErr = retry.error;
        }

        // Ultimate safeguard: if FK constraint fails on agent_id, retry with any available agent in public.agents
        if (shopErr && (shopErr.code === '23503' || shopErr.message?.includes('violates foreign key constraint "shops_agent_id_fkey"'))) {
          console.warn('[supabase.ts] FK constraint error on agent_id, finding fallback agent in public.agents...');
          const { data: fallbackAgent } = await supabase
            .from('agents')
            .select('id')
            .limit(1)
            .maybeSingle();

          if (fallbackAgent?.id) {
            const retryRes = await supabase
              .from('shops')
              .insert([{ ...shopInsertWithStatus, agent_id: fallbackAgent.id }])
              .select()
              .single();
            insertedShop = retryRes.data;
            shopErr = retryRes.error;
          }
        }

        const isRlsError = shopErr && (
          shopErr.code === '42501' ||
          shopErr.message?.toLowerCase().includes('row-level security') ||
          shopErr.message?.toLowerCase().includes('violates row-level security policy')
        );

        if (shopErr) {
          if (isRlsError) {
            console.warn('[supabase.ts] Supabase "shops" table has restrictive Row-Level Security (42501). Falling back to persistent local storage with full credentials and configuration.');
          } else {
            console.warn('[supabase.ts] Notice: Could not insert shop into Supabase (' + (shopErr.message || shopErr.code) + '). Storing in persistent local storage.');
          }
          // Do not fail: proceed to local persistent fallback below!
        } else {
          newShop = insertedShop;

          // Try adding pricing into public.shop_currency_pricing
          try {
            await supabase.from('shop_currency_pricing').insert([
              {
                shop_id: newShop.id,
                country_code: cleanShopInput.country_code || 'JO',
                currency_code: cleanShopInput.currency_code || 'JOD',
                currency_symbol: cleanShopInput.currency_symbol || cleanShopInput.currency_code || 'JOD',
                tier_1_price: cleanShopInput.tier_1_price ?? 20,
                tier_2_price: cleanShopInput.tier_2_price ?? 60,
                tier_3_price: cleanShopInput.tier_3_price ?? 120,
                tier_4_price: cleanShopInput.tier_4_price ?? 200,
              },
            ]);
          } catch {
            // graceful fallback if table not available
          }

          // STEP 2 - UPDATE OR UPSERT SHOP CONFIG:
          // A Postgres trigger on public.shops auto-creates a default row in public.shop_configs upon shop creation.
          // We target public.shop_configs matching shop_id: newShop.id.
          // We first run an explicit .update() to overwrite the trigger's initial default values with the custom form data.
          const configPayload: Record<string, any> = {
            subdomain_slug: configInput.subdomain_slug,
            primary_color: configInput.primary_color,
            secondary_color: configInput.secondary_color,
            logo_url: configInput.logo_url || null,
            background_image_url: configInput.background_image_url || null,
            updated_at: new Date().toISOString(),
          };

          let newConfig: any = null;
          let configError: any = null;

          try {
            // 2a. Attempt explicit UPDATE to overwrite trigger's auto-created default row
            let updateRes = await supabase
              .from('shop_configs')
              .update(configPayload)
              .eq('shop_id', newShop.id)
              .select()
              .maybeSingle();

            // Handle possible column naming variance (background_image_url vs bg_image_url)
            if (updateRes.error && (updateRes.error.code === '42703' || updateRes.error.message?.includes('background_image_url'))) {
              const altPayload: Record<string, any> = {
                ...configPayload,
                bg_image_url: configInput.background_image_url || null,
              };
              delete altPayload.background_image_url;
              updateRes = await supabase
                .from('shop_configs')
                .update(altPayload)
                .eq('shop_id', newShop.id)
                .select()
                .maybeSingle();
            }

            if (updateRes.error) {
              const isRls = updateRes.error.code === '42501' || updateRes.error.message?.toLowerCase().includes('row-level security');
              if (isRls) {
                console.warn('[supabase.ts] shop_configs update restricted by RLS (42501). Using configured values in local cache.');
              } else {
                console.warn('[supabase.ts] Notice: Failed to update shop_configs:', updateRes.error.message || updateRes.error);
              }
              configError = updateRes.error;
            } else if (updateRes.data) {
              newConfig = updateRes.data;
            }

            // 2b. If update did not find an existing row (i.e. trigger didn't exist or didn't fire), perform upsert
            if (!newConfig) {
              let upsertRes = await supabase
                .from('shop_configs')
                .upsert(
                  [
                    {
                      shop_id: newShop.id,
                      ...configPayload,
                    },
                  ],
                  { onConflict: 'shop_id' }
                )
                .select()
                .maybeSingle();

              if (upsertRes.error && (upsertRes.error.code === '42703' || upsertRes.error.message?.includes('background_image_url'))) {
                const altPayload: Record<string, any> = {
                  ...configPayload,
                  bg_image_url: configInput.background_image_url || null,
                };
                delete altPayload.background_image_url;
                upsertRes = await supabase
                  .from('shop_configs')
                  .upsert(
                    [
                      {
                        shop_id: newShop.id,
                        ...altPayload,
                      },
                    ],
                    { onConflict: 'shop_id' }
                  )
                  .select()
                  .maybeSingle();
              }

              if (upsertRes.error) {
                const isRls = upsertRes.error.code === '42501' || upsertRes.error.message?.toLowerCase().includes('row-level security');
                if (isRls) {
                  console.warn('[supabase.ts] shop_configs upsert restricted by RLS (42501). Using configured values in local cache.');
                } else {
                  console.warn('[supabase.ts] Notice: Failed to create/upsert shop_configs:', upsertRes.error.message || upsertRes.error);
                }
                configError = upsertRes.error;
              } else if (upsertRes.data) {
                newConfig = upsertRes.data;
              }
            }
          } catch (err: any) {
            console.warn('[supabase.ts] Notice: Failed to save shop_configs:', err.message || err);
            configError = err;
          }

          if (configError && !newConfig) {
            console.warn('[supabase.ts] shop_configs write operation deferred to local storage due to database permissions.');
          }

          const finalConfig: ShopConfig = {
            shop_id: newShop.id,
            subdomain_slug: newConfig?.subdomain_slug || configInput.subdomain_slug,
            logo_url: newConfig?.logo_url ?? configInput.logo_url,
            primary_color: newConfig?.primary_color || configInput.primary_color,
            secondary_color: newConfig?.secondary_color || configInput.secondary_color,
            background_image_url: newConfig?.background_image_url || newConfig?.bg_image_url || configInput.background_image_url,
            bg_image_url: newConfig?.bg_image_url || newConfig?.background_image_url || configInput.background_image_url,
            updated_at: newConfig?.updated_at || new Date().toISOString(),
          };

          const createdShop: ShopWithConfig = {
            ...newShop,
            status: newShop.status || newShop.subscription_status || 'active',
            config: finalConfig,
          };

          const local = getLocalData();
          local.shops = [createdShop, ...(local.shops || []).filter((s) => s.id !== newShop.id)];
          saveLocalData(local);

          return {
            success: true,
            shop: createdShop,
          };
        }
      } catch (err: any) {
        console.warn('[supabase.ts] Supabase onboardShop encountered an issue, falling back to local storage:', err.message || err);
        // Fall through to local fallback below
      }
    }

    // Local fallback with explicit agent_id scoping
    const local = getLocalData();
    const createdShop: ShopWithConfig = {
      id: generatedShopId,
      shop_name: shopInput.shop_name,
      location: shopInput.location,
      owner_email: shopInput.owner_email,
      tier: shopInput.tier,
      agent_id: shopInput.agent_id,
      is_active: true,
      subscription_status: 'active',
      status: 'active',
      created_at: new Date().toISOString(),
      config: {
        shop_id: generatedShopId,
        subdomain_slug: configInput.subdomain_slug,
        logo_url: configInput.logo_url,
        primary_color: configInput.primary_color,
        secondary_color: configInput.secondary_color,
        background_image_url: configInput.background_image_url,
        updated_at: new Date().toISOString(),
      },
    };

    local.shops = [createdShop, ...local.shops];
    saveLocalData(local);

    return { success: true, shop: createdShop };
  },

  // D. Recording Subscription Payment Action:
  // Calculates 50/50 split in JavaScript before submitting:
  // agent_commission = amount_paid * 0.5
  // platform_share = amount_paid * 0.5
  async recordPayment(payment: {
    shop_id: string;
    agent_id: string;
    amount_paid: number;
    billing_period_start: string;
    billing_period_end: string;
    payment_month?: string;
    collection_method?: string;
    notes?: string;
    amount_paid_local?: number;
    local_currency_code?: string;
  }): Promise<{ success: boolean; ledgerEntry?: ShopSubscriptionLedger; error?: string }> {
    if (!payment.agent_id) {
      return { success: false, error: 'Agent ID is missing. Cannot record payment.' };
    }

    const amountPaid = Number(payment.amount_paid);
    if (isNaN(amountPaid) || amountPaid <= 0) {
      return { success: false, error: 'Payment amount must be a positive number.' };
    }

    // Strictly compute 50/50 split in JavaScript before inserting
    const agentCommission = Number((amountPaid * 0.5).toFixed(2));
    const platformShare = Number((amountPaid * 0.5).toFixed(2));
    const paymentMonth = payment.payment_month || (payment.billing_period_start ? payment.billing_period_start.slice(0, 7) : new Date().toISOString().slice(0, 7));

    const supabase = getSupabaseClient();
    const resolvedAgentId = supabase
      ? await ensureAgentExists(supabase, payment.agent_id)
      : payment.agent_id;

    const payload: any = {
      shop_id: payment.shop_id,
      agent_id: resolvedAgentId,
      amount_paid: amountPaid,
      agent_commission: agentCommission,
      platform_share: platformShare,
      billing_period_start: payment.billing_period_start,
      billing_period_end: payment.billing_period_end,
      payment_month: paymentMonth,
      collection_method: payment.collection_method || 'cash',
      collected_by_agent: true,
      notes: payment.notes || '',
      amount_paid_local: payment.amount_paid_local ?? amountPaid,
      local_currency_code: payment.local_currency_code || 'JOD',
    };

    if (supabase) {
      try {
        let insertRes = await supabase
          .from('shop_subscriptions_ledger')
          .insert([payload])
          .select(`
            *,
            shops (
              shop_name,
              location,
              tier,
              currency_code,
              currency_symbol
            )
          `)
          .single();

        // Also insert into public.shop_payments
        try {
          await supabase.from('shop_payments').insert([
            {
              shop_id: payment.shop_id,
              agent_id: resolvedAgentId,
              amount: amountPaid,
              payment_date: new Date().toISOString(),
              notes: payment.notes || `Subscription payment for ${paymentMonth} (${payment.collection_method || 'cash'})`,
            },
          ]);
        } catch {
          // graceful fallback
        }

        // If extended columns do not exist in live Supabase table, retry with standard columns
        if (insertRes.error && insertRes.error.message?.includes('column')) {
          const minimalPayload = {
            shop_id: payment.shop_id,
            agent_id: resolvedAgentId,
            amount_paid: amountPaid,
            agent_commission: agentCommission,
            platform_share: platformShare,
            billing_period_start: payment.billing_period_start,
            billing_period_end: payment.billing_period_end,
          };
          insertRes = await supabase
            .from('shop_subscriptions_ledger')
            .insert([minimalPayload])
            .select(`
              *,
              shops (
                shop_name,
                location,
                tier
              )
            `)
            .single();
        }

        // Safeguard: if FK constraint fails on agent_id
        if (insertRes.error && (insertRes.error.code === '23503' || insertRes.error.message?.includes('agent_id'))) {
          const { data: fallbackAgent } = await supabase.from('agents').select('id').limit(1).maybeSingle();
          if (fallbackAgent?.id) {
            insertRes = await supabase
              .from('shop_subscriptions_ledger')
              .insert([{ ...payload, agent_id: fallbackAgent.id }])
              .select(`*, shops (shop_name, location, tier)`)
              .single();
          }
        }

        if (!insertRes.error && insertRes.data) {
          // If shop was in maintenance or suspended, auto-reinstate to active
          try {
            await supabase
              .from('shops')
              .update({
                status: 'active',
                subscription_status: 'active',
                is_active: true,
                hold_reason: null,
                hold_date: null,
              })
              .eq('id', payment.shop_id);
          } catch (e) {
            console.warn('Auto reinstate shop status error:', e);
          }

          return {
            success: true,
            ledgerEntry: {
              ...insertRes.data,
              payment_month: insertRes.data.payment_month || paymentMonth,
              collection_method: insertRes.data.collection_method || payload.collection_method,
              collected_by_agent: true,
              shop: Array.isArray(insertRes.data.shops) ? insertRes.data.shops[0] : insertRes.data.shops,
            },
          };
        }
      } catch (err: any) {
        console.warn('Supabase recordPayment failed, saving locally:', err);
      }
    }

    // Local fallback
    const local = getLocalData();
    const shop = local.shops.find((s: ShopWithConfig) => s.id === payment.shop_id);
    
    // If shop was in maintenance or suspended or on hold, automatically reactivate it upon payment recording!
    if (shop && (!shop.is_active || shop.subscription_status !== 'active' || shop.status === 'on_hold')) {
      shop.is_active = true;
      shop.subscription_status = 'active';
      shop.status = 'active';
      shop.hold_reason = undefined;
      shop.hold_date = undefined;
    }

    const newRecord: ShopSubscriptionLedger = {
      id: 'led-' + Date.now(),
      ...payload,
      created_at: new Date().toISOString(),
      shop: shop
        ? {
            shop_name: shop.shop_name,
            location: shop.location,
            tier: shop.tier,
          }
        : undefined,
    };

    local.ledger = [newRecord, ...(local.ledger || [])];
    saveLocalData(local);

    return { success: true, ledgerEntry: newRecord };
  },

  // Update shop tier
  async updateShopTier(shopId: string, tier: SubscriptionTier): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.from('shops').update({ tier }).eq('id', shopId);
        if (!error) return { success: true };
      } catch (err: any) {
        console.warn('Supabase updateShopTier failed, applying locally:', err);
      }
    }

    const local = getLocalData();
    local.shops = local.shops.map((s: ShopWithConfig) => (s.id === shopId ? { ...s, tier } : s));
    saveLocalData(local);
    return { success: true };
  },

  // Update shop config branding
  async updateShopConfig(
    shopId: string,
    config: {
      subdomain_slug: string;
      logo_url: string;
      primary_color: string;
      secondary_color: string;
      background_image_url: string;
    }
  ): Promise<{ success: boolean; error?: string; config?: ShopConfig }> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const payload: Record<string, any> = {
          subdomain_slug: config.subdomain_slug,
          logo_url: config.logo_url || null,
          primary_color: config.primary_color,
          secondary_color: config.secondary_color,
          background_image_url: config.background_image_url || null,
          updated_at: new Date().toISOString(),
        };

        let { data, error } = await supabase
          .from('shop_configs')
          .update(payload)
          .eq('shop_id', shopId)
          .select()
          .maybeSingle();

        if (error && (error.code === '42703' || error.message?.includes('background_image_url'))) {
          const altPayload: Record<string, any> = {
            ...payload,
            bg_image_url: config.background_image_url || null,
          };
          delete altPayload.background_image_url;
          const retry = await supabase
            .from('shop_configs')
            .update(altPayload)
            .eq('shop_id', shopId)
            .select()
            .maybeSingle();
          data = retry.data;
          error = retry.error;
        }

        if (!data && !error) {
          const upsertRes = await supabase
            .from('shop_configs')
            .upsert([{ shop_id: shopId, ...payload }], { onConflict: 'shop_id' })
            .select()
            .maybeSingle();
          data = upsertRes.data;
          error = upsertRes.error;
        }

        if (error) {
          const isRls = error.code === '42501' || error.message?.toLowerCase().includes('row-level security');
          if (isRls) {
            console.warn('[supabase.ts] updateShopConfig restricted by RLS (42501), updating local cache.');
          } else {
            console.warn('[supabase.ts] Supabase updateShopConfig notice:', error.message || error);
          }
        }

        if (!error && data) {
          return {
            success: true,
            config: {
              ...data,
              background_image_url: data.background_image_url || data.bg_image_url || config.background_image_url,
            },
          };
        }
      } catch (err: any) {
        console.warn('Supabase updateShopConfig notice, applying locally:', err?.message || err);
      }
    }

    const local = getLocalData();
    const updatedConfig: ShopConfig = {
      shop_id: shopId,
      ...config,
      updated_at: new Date().toISOString(),
    };
    local.shops = local.shops.map((s: ShopWithConfig) => (s.id === shopId ? { ...s, config: updatedConfig } : s));
    saveLocalData(local);
    return { success: true, config: updatedConfig };
  },

  // D. Diplomatic Subscription Control UI (Key Feature)
  // When an agent changes the status dropdown/toggle, update shops.subscription_status in Supabase:
  // const updateStatus = async (shopId, newStatus) => {
  //   const { error } = await supabase.from('shops').update({ subscription_status: newStatus }).eq('id', shopId);
  // };
  async updateShopSubscriptionStatus(
    shopId: string,
    newStatus: SubscriptionStatus,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    const isActive = newStatus === 'active';
    const nowIso = new Date().toISOString();
    const defaultReason =
      newStatus === 'maintenance'
        ? 'Scheduled routine maintenance & late payment review'
        : newStatus === 'suspended'
        ? 'Shop locked due to overdue subscription payment'
        : undefined;

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        // Update both status ('maintenance' | 'active' | 'suspended') and subscription_status
        const fullPayload: Record<string, any> = {
          status: newStatus,
          subscription_status: newStatus,
          is_active: isActive,
          hold_reason: newStatus === 'active' ? null : (reason || defaultReason),
          hold_date: newStatus === 'active' ? null : nowIso,
        };

        let { error } = await supabase
          .from('shops')
          .update(fullPayload)
          .eq('id', shopId);

        // If error due to missing columns in user's Supabase schema, retry with fallback column combinations
        if (error && (error.code === '42703' || error.message?.includes('column'))) {
          // Fallback 1: status + is_active
          const retry1 = await supabase
            .from('shops')
            .update({
              status: newStatus,
              is_active: isActive,
            })
            .eq('id', shopId);

          if (!retry1.error) {
            error = null;
          } else {
            // Fallback 2: subscription_status + is_active
            const retry2 = await supabase
              .from('shops')
              .update({
                subscription_status: newStatus,
                is_active: isActive,
              })
              .eq('id', shopId);

            if (!retry2.error) {
              error = null;
            } else {
              // Fallback 3: status only
              const retry3 = await supabase
                .from('shops')
                .update({ status: newStatus })
                .eq('id', shopId);

              if (!retry3.error) {
                error = null;
              } else {
                // Fallback 4: subscription_status only
                const retry4 = await supabase
                  .from('shops')
                  .update({ subscription_status: newStatus })
                  .eq('id', shopId);

                if (!retry4.error) {
                  error = null;
                }
              }
            }
          }
        }

        if (!error) {
          const local = getLocalData();
          local.shops = local.shops.map((s: ShopWithConfig) =>
            s.id === shopId
              ? {
                  ...s,
                  subscription_status: newStatus,
                  is_active: isActive,
                  status: newStatus,
                  hold_reason: newStatus === 'active' ? undefined : (reason || defaultReason),
                  hold_date: newStatus === 'active' ? undefined : nowIso,
                }
              : s
          );
          saveLocalData(local);
          return { success: true };
        } else {
          console.warn('[updateShopSubscriptionStatus] Supabase error:', error);
        }
      } catch (err: any) {
        console.warn('Supabase updateShopSubscriptionStatus failed, applying locally:', err);
      }
    }

    const local = getLocalData();
    local.shops = local.shops.map((s: ShopWithConfig) =>
      s.id === shopId
        ? {
            ...s,
            subscription_status: newStatus,
            is_active: isActive,
            status: newStatus,
            hold_reason: newStatus === 'active' ? undefined : (reason || defaultReason),
            hold_date: newStatus === 'active' ? undefined : nowIso,
          }
        : s
    );
    saveLocalData(local);
    return { success: true };
  },

  // Update shop hold / suspension status (backward compatibility)
  async updateShopHoldStatus(
    shopId: string,
    onHold: boolean,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    const newStatus: SubscriptionStatus = onHold ? 'maintenance' : 'active';
    return this.updateShopSubscriptionStatus(shopId, newStatus, reason);
  },

  // Toggle active status (backward compatibility)
  async toggleShopActive(shopId: string, isActive: boolean): Promise<boolean> {
    const newStatus: SubscriptionStatus = isActive ? 'active' : 'maintenance';
    const res = await this.updateShopSubscriptionStatus(
      shopId,
      newStatus,
      !isActive ? 'Monthly subscription payment overdue / put on diplomatic maintenance by agent' : undefined
    );
    return res.success;
  },

  // E. Shop Notes & Follow-ups (shop_notes table)
  async getShopNotes(agentId: string): Promise<ShopNote[]> {
    if (!agentId) return [];

    const creds = getSupabaseCredentials();
    const supabase = getSupabaseClient();
    const isConfigured = Boolean(creds.url && creds.anonKey && supabase);

    if (isConfigured && supabase) {
      try {
        let accessToken = '';
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          accessToken = sessionData?.session?.access_token || '';
        } catch {}

        if (accessToken) {
          const resp = await fetch('/api/agent/notes', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
          });
          const resJson = await resp.json().catch(() => null);
          if (resp.ok && resJson?.success && Array.isArray(resJson.notes)) {
            if (resJson.tableMissing) {
              // If table hasn't been created in Supabase yet, return local notes if any
              const local = getLocalData();
              const shopsMap = new Map(local.shops.map((s) => [s.id, s]));
              return (local.notes || [])
                .filter((n) => n.agent_id === agentId)
                .map((n) => ({
                  ...n,
                  shop: shopsMap.get(n.shop_id)
                    ? { id: n.shop_id, shop_name: shopsMap.get(n.shop_id)!.shop_name, location: shopsMap.get(n.shop_id)!.location }
                    : n.shop,
                }));
            }
            return resJson.notes;
          }
        }
      } catch (err) {
        console.warn('[supabase.ts] Failed /api/agent/notes, trying direct client:', err);
      }

      try {
        const { data, error } = await supabase
          .from('shop_notes')
          .select('*, shops(id, shop_name, location)')
          .eq('agent_id', agentId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((n: any) => ({
            ...n,
            shop: Array.isArray(n.shops) ? n.shops[0] : n.shops,
          }));
        }
      } catch (err) {
        console.warn('[supabase.ts] Direct shop_notes query fallback notice:', err);
      }
    }

    const local = getLocalData();
    const shopsMap = new Map<string, ShopWithConfig>(local.shops.map((s) => [s.id, s]));
    return (local.notes || [])
      .filter((n: ShopNote) => n.agent_id === agentId)
      .map((n: ShopNote) => {
        const shop = shopsMap.get(n.shop_id);
        return {
          ...n,
          shop: shop ? { id: shop.id, shop_name: shop.shop_name, location: shop.location } : n.shop,
        };
      });
  },

  async addShopNote(
    shopId: string,
    agentId: string,
    payload: { note: string; follow_up_date?: string | null }
  ): Promise<{ success: boolean; note?: ShopNote; error?: string }> {
    const cleanNote = String(payload.note || '').trim();
    const cleanDate = payload.follow_up_date ? String(payload.follow_up_date).trim().slice(0, 10) : null;
    if (!cleanNote) {
      return { success: false, error: 'Note text is required.' };
    }

    const creds = getSupabaseCredentials();
    const supabase = getSupabaseClient();
    const isConfigured = Boolean(creds.url && creds.anonKey && supabase);

    if (isConfigured && supabase) {
      try {
        let accessToken = '';
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          accessToken = sessionData?.session?.access_token || '';
        } catch {}

        if (accessToken) {
          const resp = await fetch(`/api/agent/shops/${encodeURIComponent(shopId)}/notes`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              note: cleanNote,
              follow_up_date: cleanDate,
            }),
          });
          const resJson = await resp.json().catch(() => null);
          if (resp.ok && resJson?.success && resJson.note) {
            return { success: true, note: resJson.note };
          }
          if (resp.status !== 503 && resJson?.error && !String(resJson.error).toLowerCase().includes('does not exist') && !String(resJson.error).toLowerCase().includes('schema cache')) {
            return { success: false, error: resJson.error };
          }
        }
      } catch (err: any) {
        console.warn('[supabase.ts] POST /api/agent/shops/:shopId/notes notice:', err);
      }

      try {
        const { data, error } = await supabase
          .from('shop_notes')
          .insert([
            {
              shop_id: shopId,
              agent_id: agentId,
              note: cleanNote,
              follow_up_date: cleanDate,
              done: false,
            },
          ])
          .select('*, shops(id, shop_name, location)')
          .single();

        if (!error && data) {
          return {
            success: true,
            note: {
              ...data,
              shop: Array.isArray((data as any).shops) ? (data as any).shops[0] : (data as any).shops,
            },
          };
        }
      } catch (err: any) {
        console.warn('[supabase.ts] Direct insert shop_notes notice:', err);
      }
    }

    const local = getLocalData();
    const shop = local.shops.find((s) => s.id === shopId);
    const created: ShopNote = {
      id: generateUUID(),
      shop_id: shopId,
      agent_id: agentId,
      note: cleanNote,
      follow_up_date: cleanDate,
      done: false,
      created_at: new Date().toISOString(),
      shop: shop ? { id: shop.id, shop_name: shop.shop_name, location: shop.location } : undefined,
    };
    local.notes = [created, ...(local.notes || [])];
    saveLocalData(local);
    return { success: true, note: created };
  },

  async updateShopNote(
    noteId: string,
    updates: { done?: boolean; note?: string; follow_up_date?: string | null }
  ): Promise<{ success: boolean; note?: ShopNote; error?: string }> {
    const creds = getSupabaseCredentials();
    const supabase = getSupabaseClient();
    const isConfigured = Boolean(creds.url && creds.anonKey && supabase);

    if (isConfigured && supabase) {
      try {
        let accessToken = '';
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          accessToken = sessionData?.session?.access_token || '';
        } catch {}

        if (accessToken) {
          const resp = await fetch(`/api/agent/notes/${encodeURIComponent(noteId)}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify(updates),
          });
          const resJson = await resp.json().catch(() => null);
          if (resp.ok && resJson?.success && resJson.note) {
            return { success: true, note: resJson.note };
          }
          if (resp.status !== 503 && resp.status !== 404 && resJson?.error && !String(resJson.error).toLowerCase().includes('does not exist') && !String(resJson.error).toLowerCase().includes('schema cache')) {
            return { success: false, error: resJson.error };
          }
        }
      } catch {}

      try {
        const { data, error } = await supabase
          .from('shop_notes')
          .update(updates)
          .eq('id', noteId)
          .select('*, shops(id, shop_name, location)')
          .single();

        if (!error && data) {
          return {
            success: true,
            note: {
              ...data,
              shop: Array.isArray((data as any).shops) ? (data as any).shops[0] : (data as any).shops,
            },
          };
        }
      } catch {}
    }

    const local = getLocalData();
    let updatedNote: ShopNote | undefined;
    local.notes = (local.notes || []).map((n) => {
      if (n.id !== noteId) return n;
      updatedNote = { ...n, ...updates };
      return updatedNote;
    });
    saveLocalData(local);
    return updatedNote
      ? { success: true, note: updatedNote }
      : { success: false, error: 'Note not found.' };
  },

  async deleteShopNote(noteId: string): Promise<{ success: boolean; error?: string }> {
    const creds = getSupabaseCredentials();
    const supabase = getSupabaseClient();
    const isConfigured = Boolean(creds.url && creds.anonKey && supabase);

    if (isConfigured && supabase) {
      try {
        let accessToken = '';
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          accessToken = sessionData?.session?.access_token || '';
        } catch {}

        if (accessToken) {
          const resp = await fetch(`/api/agent/notes/${encodeURIComponent(noteId)}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
          });
          const resJson = await resp.json().catch(() => null);
          if (resp.ok && resJson?.success) {
            return { success: true };
          }
          if (resp.status !== 503 && resp.status !== 404 && resJson?.error && !String(resJson.error).toLowerCase().includes('does not exist') && !String(resJson.error).toLowerCase().includes('schema cache')) {
            return { success: false, error: resJson.error };
          }
        }
      } catch {}

      try {
        const { error } = await supabase.from('shop_notes').delete().eq('id', noteId);
        if (!error) return { success: true };
      } catch {}
    }

    const local = getLocalData();
    local.notes = (local.notes || []).filter((n) => n.id !== noteId);
    saveLocalData(local);
    return { success: true };
  },
};
