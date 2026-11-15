import express, { type Request, type Response, type NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Module-level singletons for Supabase clients (created once at startup)
let adminClientInstance: SupabaseClient | null = null;
let adminClientChecked = false;

export function getSupabaseAdminClient(): SupabaseClient | null {
  if (!adminClientChecked) {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (url && serviceKey && url.startsWith('http')) {
      try {
        adminClientInstance = createClient(url, serviceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        });
      } catch (err) {
        console.error('Failed to initialize Supabase Admin client:', err);
      }
    }
    adminClientChecked = true;
  }
  return adminClientInstance;
}

let anonClientInstance: SupabaseClient | null = null;
let anonClientChecked = false;

export function getSupabaseAnonClient(): SupabaseClient | null {
  if (!anonClientChecked) {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

    if (url && anonKey && url.startsWith('http')) {
      try {
        anonClientInstance = createClient(url, anonKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        });
      } catch (err) {
        console.error('Failed to initialize Supabase Anon client:', err);
      }
    }
    anonClientChecked = true;
  }
  return anonClientInstance;
}

// Multi-Agent Presets for Demo / Testing Scenarios
const DEMO_AGENTS = [
  {
    id: 'a0123456-789a-bcde-f012-3456789abcde',
    full_name: 'Tariq Al-Mansoor',
    email: 'tariq.agent@opticportal.io',
    phone_number: '+962 7 9855 2410',
    territory: 'Amman Central & West',
  },
  {
    id: 'a0222222-789a-bcde-f012-3456789abcde',
    full_name: 'Layla Nader',
    email: 'layla.optics@opticportal.io',
    phone_number: '+962 7 8765 4321',
    territory: 'Abdoun & Zarqa District',
  },
  {
    id: 'a0333333-789a-bcde-f012-3456789abcde',
    full_name: 'Zaid Haddad',
    email: 'zaid.vision@opticportal.io',
    phone_number: '+962 7 7654 3210',
    territory: 'Aqaba Coastal & South',
  },
];

function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(str || ''));
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Express middleware: authenticate caller using JWT and verify agent or admin role
export async function requireAgent(req: Request, res: Response, next: NextFunction) {
  const adminClient = getSupabaseAdminClient();
  if (!adminClient) {
    return res.status(503).json({
      success: false,
      error: 'SUPABASE_SERVICE_ROLE_KEY not set',
    });
  }

  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const jwt = (typeof authHeader === 'string' && authHeader.startsWith('Bearer '))
    ? authHeader.substring(7).trim()
    : '';

  if (!jwt) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Missing or invalid Bearer token.',
    });
  }

  const { data: authData, error: authError } = await adminClient.auth.getUser(jwt);
  if (authError || !authData?.user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid access token.',
    });
  }

  const user = authData.user;

  // Look up caller profile in public.profiles
  const { data: profile } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  // Look up caller in public.agents where auth_user_id = user.id or id = user.id
  let { data: agentRow } = await adminClient
    .from('agents')
    .select('*')
    .or(`auth_user_id.eq.${user.id},id.eq.${user.id}`)
    .eq('is_active', true)
    .maybeSingle();

  // If not yet linked by auth_user_id, match active agent by email (case-insensitive)
  if (!agentRow && user.email) {
    const { data: byEmail } = await adminClient
      .from('agents')
      .select('*')
      .ilike('email', user.email.trim().toLowerCase())
      .eq('is_active', true)
      .maybeSingle();

    if (byEmail) {
      if (!byEmail.auth_user_id) {
        await adminClient
          .from('agents')
          .update({ auth_user_id: user.id })
          .eq('id', byEmail.id);
      }
      agentRow = { ...byEmail, auth_user_id: byEmail.auth_user_id || user.id };
    }
  }

  if (!agentRow || agentRow.is_active !== true) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Access restricted to active registered agents.',
    });
  }

  (req as any).user = user;
  (req as any).profile = profile;
  (req as any).agentId = agentRow.id;
  (req as any).agentRecord = agentRow;

  next();
}

// Helper to provision staff in auth.users / profiles and guarantee saving to public.shop_staff_credentials
// Real schema notes: profiles uses created_by_user_id (not created_by) and whatsapp_number (no phone_number column)
// shop_staff_credentials.created_by and user_id are NOT NULL, and user_id references profiles(id)
async function provisionAndSaveStaffCredential(
  adminClient: SupabaseClient,
  shopId: string,
  agentId: string,
  createdByUserId: string,
  member: {
    email: string;
    password?: string;
    full_name?: string;
    role?: string;
    phone_number?: string;
    phone?: string;
  }
): Promise<{
  userId: string;
  email: string;
  password?: string;
  full_name: string;
  role: string;
  phone_number?: string | null;
  status: 'created';
}> {
  const allowedRoles = ['shop_owner', 'optometrist', 'optician', 'marketer'];
  if (!member.role || !allowedRoles.includes(member.role)) {
    const err: any = new Error(`Invalid role "${member.role}". Allowed roles: ${allowedRoles.join(', ')}`);
    err.step = 'validation_role';
    throw err;
  }
  const role = member.role;
  const email = String(member.email || '').trim().toLowerCase();
  if (!email) {
    const err: any = new Error('Staff email is required');
    err.step = 'validation_email';
    throw err;
  }
  const fullName = String(member.full_name || '').trim() || 'Staff Member';
  const password = String(member.password || '').trim();
  if (!password || password.length < 8) {
    const err: any = new Error(`Password required (min 8 chars) for staff "${email}"`);
    err.step = 'validation_password';
    throw err;
  }
  const phoneNumber = member.phone_number || member.phone || null;

  // 1. Create user in auth.users using adminClient
  const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      shop_id: shopId,
      role,
      created_by: agentId,
      full_name: fullName,
    },
  });

  if (createError || !userData?.user?.id) {
    const err: any = new Error(createError?.message || 'Supabase Auth user creation failed');
    err.hint = 'Supabase Auth rejected the new user - check the message and Supabase Auth logs';
    err.step = 'auth_createUser';
    throw err;
  }

  const userId = userData.user.id;

  // 2. Existing database triggers may already have created the profile row for this user:
  // UPSERT profiles (onConflict id) with { id, email, full_name, role, shop_id, whatsapp_number: phone, created_by_user_id: createdByUserId }
  const profilePayload = {
    id: userId,
    email,
    full_name: fullName,
    role,
    shop_id: shopId,
    whatsapp_number: phoneNumber,
    created_by_user_id: createdByUserId,
  };

  const { error: profErr } = await adminClient
    .from('profiles')
    .upsert([profilePayload], { onConflict: 'id' });

  if (profErr) {
    const err: any = new Error(`Failed to upsert profile for staff "${email}": ${profErr.message}`);
    err.step = 'profiles_upsert';
    err.createdUserId = userId;
    throw err;
  }

  // 3. Look for an existing shop_staff_credentials row with this shop_id + email: if found UPDATE it, else INSERT
  const { data: existingCred, error: credCheckErr } = await adminClient
    .from('shop_staff_credentials')
    .select('id')
    .eq('shop_id', shopId)
    .eq('email', email)
    .maybeSingle();

  if (credCheckErr) {
    const err: any = new Error(`Failed to check staff credentials for "${email}": ${credCheckErr.message}`);
    err.step = 'staff_credentials_check';
    err.createdUserId = userId;
    throw err;
  }

  const credPayload = {
    shop_id: shopId,
    created_by: agentId,
    user_id: userId,
    email,
    role,
    full_name: fullName,
    phone_number: phoneNumber,
  };

  if (existingCred?.id) {
    const { error: updateCredErr } = await adminClient
      .from('shop_staff_credentials')
      .update(credPayload)
      .eq('id', existingCred.id);

    if (updateCredErr) {
      const err: any = new Error(`Failed to update staff credentials for "${email}": ${updateCredErr.message}`);
      err.step = 'staff_credentials_update';
      err.createdUserId = userId;
      throw err;
    }
  } else {
    const { error: insertCredErr } = await adminClient
      .from('shop_staff_credentials')
      .insert([credPayload]);

    if (insertCredErr) {
      const err: any = new Error(`Failed to insert staff credentials for "${email}": ${insertCredErr.message}`);
      err.step = 'staff_credentials_insert';
      err.createdUserId = userId;
      throw err;
    }
  }

  return {
    userId,
    email,
    password,
    full_name: fullName,
    role,
    phone_number: phoneNumber,
    status: 'created',
  };
}

async function startServer() {
  const adminClient = getSupabaseAdminClient();
  if (!adminClient) {
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.error('CRITICAL: Supabase service-role client could not be created.');
    console.error('SUPABASE_SERVICE_ROLE_KEY is missing or invalid in the environment.');
    console.error('All agent-authenticated endpoints and server writes will return 503.');
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
  }

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // In-memory cache for live exchange rates (valid for 6 hours)
  interface RatesCache {
    rates: Record<string, number>;
    fetchedAt: string;
  }

  let ratesCache: RatesCache | null = null;
  const RATES_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

  async function getJodRates(): Promise<{
    base: string;
    rates: Record<string, number>;
    fetchedAt: string;
    source: 'live' | 'stale' | 'unavailable';
    attribution: string;
    attributionUrl: string;
  }> {
    const now = Date.now();
    const attribution = 'Rates By Exchange Rate API';
    const attributionUrl = 'https://www.exchangerate-api.com';

    // Serve fresh in-memory cache if younger than 6 hours
    if (ratesCache && now - new Date(ratesCache.fetchedAt).getTime() < RATES_CACHE_TTL_MS) {
      console.log(`[rates] live, ${ratesCache.fetchedAt}`);
      return {
        base: 'JOD',
        rates: ratesCache.rates,
        fetchedAt: ratesCache.fetchedAt,
        source: 'live',
        attribution,
        attributionUrl,
      };
    }

    const apiKey = (process.env.EXCHANGE_RATE_API_KEY || '').trim();
    // Keyed endpoint first (if a key exists), then the free keyless endpoint as a backup.
    const urls: string[] = [];
    if (apiKey) urls.push(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/JOD`);
    urls.push('https://open.er-api.com/v6/latest/JOD');

    for (const url of urls) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const label = url.includes('open.er-api.com') ? 'open.er-api.com' : 'v6 keyed';
      try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        const data: any = await res.json().catch(() => null);

        // The keyed v6 endpoint returns "conversion_rates"; the open endpoint returns "rates".
        const rates = data && (data.conversion_rates || data.rates);

        if (res.ok && data && data.result === 'success' && rates && typeof rates === 'object') {
          const fetchedAt = new Date().toISOString();
          ratesCache = { rates, fetchedAt };
          console.log(`[rates] live via ${label}, ${fetchedAt}`);
          return {
            base: 'JOD',
            rates,
            fetchedAt,
            source: 'live',
            attribution,
            attributionUrl,
          };
        }
        console.warn(
          `[rates] ${label} failed: http ${res.status}, result=${data?.result}, error-type=${data?.['error-type']}`
        );
      } catch (err: any) {
        clearTimeout(timeoutId);
        console.warn(`[rates] ${label} fetch failed or timed out:`, err?.message || err);
      }
    }

    // If refresh failed but we have a previous cache, serve as stale
    if (ratesCache) {
      console.log(`[rates] stale, ${ratesCache.fetchedAt}`);
      return {
        base: 'JOD',
        rates: ratesCache.rates,
        fetchedAt: ratesCache.fetchedAt,
        source: 'stale',
        attribution,
        attributionUrl,
      };
    }

    // No cache available: return unavailable fallback (never throw 500)
    const fetchedAt = new Date().toISOString();
    console.log(`[rates] unavailable, ${fetchedAt}`);
    return {
      base: 'JOD',
      rates: {},
      fetchedAt,
      source: 'unavailable',
      attribution,
      attributionUrl,
    };
  }

  // Live Exchange Rates Endpoint (1 JOD in all currencies)
  app.get('/api/rates', async (_req: Request, res: Response) => {
    try {
      const data = await getJodRates();
      return res.status(200).json(data);
    } catch (err) {
      return res.status(200).json({
        base: 'JOD',
        rates: {},
        fetchedAt: new Date().toISOString(),
        source: 'unavailable',
        attribution: 'Rates By Exchange Rate API',
        attributionUrl: 'https://www.exchangerate-api.com',
      });
    }
  });

  // Database Pre-Check & Uniqueness Validation Endpoint
  app.post('/api/check-availability', async (req: Request, res: Response) => {
    try {
      const { field, value, excludeShopId } = req.body || {};
      const trimmed = String(value || '').trim();

      if (!field || !trimmed) {
        return res.status(400).json({
          available: false,
          error: 'Field name and non-empty value are required for pre-check.',
          code: 'MISSING_PARAMS',
        });
      }

      const adminClient = getSupabaseAdminClient() || getSupabaseAnonClient();

      if (field === 'email') {
        const normalized = trimmed.toLowerCase();
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(normalized)) {
          return res.status(200).json({
            available: false,
            field: 'email',
            reason: 'invalid_format',
            message: 'Invalid email syntax format.',
            messageAr: 'صيغة البريد الإلكتروني غير صالحة.',
          });
        }

        const conflictMessageEn = 'This email is already registered in Supabase users. Please choose a different email.';
        const conflictMessageAr = 'هذا البريد الإلكتروني مسجل بالفعل في مستخدمي Supabase. يرجى اختيار بريد إلكتروني مختلف.';

        // 1. Check against DEMO_AGENTS
        const demoAgentMatch = DEMO_AGENTS.find((a) => a.email.toLowerCase() === normalized);
        if (demoAgentMatch) {
          return res.status(200).json({
            available: false,
            field: 'email',
            reason: 'already_registered',
            message: conflictMessageEn,
            messageAr: conflictMessageAr,
          });
        }

        if (adminClient) {
          // 2. Query Supabase Auth Users directly via auth.admin.listUsers() if service role is active
          try {
            if ((adminClient as any).auth?.admin?.listUsers) {
              const { data: authList, error: authListErr } = await (adminClient as any).auth.admin.listUsers();
              if (!authListErr && authList?.users && Array.isArray(authList.users)) {
                const existingAuthUser = authList.users.find(
                  (u: any) => u.email && u.email.toLowerCase() === normalized
                );
                if (existingAuthUser) {
                  return res.status(200).json({
                    available: false,
                    field: 'email',
                    reason: 'already_registered',
                    message: conflictMessageEn,
                    messageAr: conflictMessageAr,
                  });
                }
              }
            }
          } catch (authErr) {
            console.warn('[check-availability] Supabase auth.admin.listUsers check note:', authErr);
          }

          // 3. Check public.profiles table (which mirrors Supabase auth users)
          try {
            const { data: profData } = await adminClient
              .from('profiles')
              .select('id, email, role')
              .eq('email', normalized)
              .maybeSingle();

            if (profData?.id) {
              return res.status(200).json({
                available: false,
                field: 'email',
                reason: 'already_registered',
                message: conflictMessageEn,
                messageAr: conflictMessageAr,
              });
            }
          } catch (e) { }

          // 4. Check agents table
          try {
            const { data: agentData } = await adminClient
              .from('agents')
              .select('id, full_name')
              .eq('email', normalized)
              .maybeSingle();

            if (agentData?.id) {
              return res.status(200).json({
                available: false,
                field: 'email',
                reason: 'already_registered',
                message: conflictMessageEn,
                messageAr: conflictMessageAr,
              });
            }
          } catch (e) { }

          // 5. Check shops table (owner_email)
          try {
            let shopQuery = adminClient
              .from('shops')
              .select('id, shop_name')
              .eq('owner_email', normalized);

            if (excludeShopId && isValidUUID(excludeShopId)) {
              shopQuery = shopQuery.neq('id', excludeShopId);
            }

            const { data: shopData } = await shopQuery.maybeSingle();
            if (shopData?.id) {
              return res.status(200).json({
                available: false,
                field: 'email',
                reason: 'already_registered',
                message: conflictMessageEn,
                messageAr: conflictMessageAr,
              });
            }
          } catch (e) { }

          // 6. Check shop_staff_credentials table
          try {
            const { data: staffData } = await adminClient
              .from('shop_staff_credentials')
              .select('id, full_name, role')
              .eq('email', normalized)
              .maybeSingle();

            if (staffData?.id) {
              return res.status(200).json({
                available: false,
                field: 'email',
                reason: 'already_registered',
                message: conflictMessageEn,
                messageAr: conflictMessageAr,
              });
            }
          } catch (e) { }
        }

        return res.status(200).json({
          available: true,
          field: 'email',
          message: 'Email is available for registration.',
          messageAr: 'البريد الإلكتروني متاح للتسجيل.',
        });
      }

      if (field === 'subdomain') {
        // Normalize: lowercase, strip invalid chars, clean consecutive hyphens
        const normalized = trimmed
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');

        if (!normalized || normalized.length < 3) {
          return res.status(200).json({
            available: false,
            field: 'subdomain',
            reason: 'invalid_format',
            message: 'Subdomain must be at least 3 alphanumeric characters.',
          });
        }

        if (normalized.length > 40) {
          return res.status(200).json({
            available: false,
            field: 'subdomain',
            reason: 'invalid_format',
            message: 'Subdomain must not exceed 40 characters.',
          });
        }

        // Check reserved subdomains
        const reserved = ['admin', 'api', 'app', 'auth', 'portal', 'mail', 'staging', 'test', 'www', 'root'];
        if (reserved.includes(normalized)) {
          return res.status(200).json({
            available: false,
            field: 'subdomain',
            reason: 'reserved',
            message: `Subdomain '${normalized}' is reserved by the platform.`,
          });
        }

        if (adminClient) {
          try {
            let configQuery = adminClient
              .from('shop_configs')
              .select('shop_id, subdomain_slug')
              .eq('subdomain_slug', normalized);

            if (excludeShopId && isValidUUID(excludeShopId)) {
              configQuery = configQuery.neq('shop_id', excludeShopId);
            }

            const { data: configData } = await configQuery.maybeSingle();
            if (configData?.shop_id) {
              return res.status(200).json({
                available: false,
                field: 'subdomain',
                reason: 'conflict',
                normalized,
                message: `Subdomain '${normalized}' is already taken.`,
              });
            }
          } catch (e) { }
        }

        return res.status(200).json({
          available: true,
          field: 'subdomain',
          normalized,
          message: `Subdomain '${normalized}' is completely available.`,
        });
      }

      if (field === 'shop_name') {
        const normalized = trimmed;
        if (normalized.length < 3) {
          return res.status(200).json({
            available: false,
            field: 'shop_name',
            reason: 'invalid_format',
            message: 'Shop name must be at least 3 characters.',
          });
        }

        // Check against seeded demo shops list (case-insensitive trimming)
        const DEMO_EXISTING_SHOPS = [
          'Amman Grand Optics',
          'Royal Vision Eyewear',
          'City Eye Optical Center',
          'ClearSight Optics Irbid',
          'Abdoun Elite Eyewear',
          'Zarqa Modern Optics',
          'Aqaba Marine Vision',
          'Petra Optics Dispensary',
        ];
        const demoShopMatch = DEMO_EXISTING_SHOPS.find(
          (s) => s.trim().toLowerCase() === normalized.toLowerCase()
        );
        if (demoShopMatch) {
          return res.status(200).json({
            available: false,
            field: 'shop_name',
            reason: 'conflict',
            message: 'This optical shop name is already registered in the database. Please choose a different name or edit the existing shop.',
            messageAr: 'اسم مركز البصريات هذا مسجل بالفعل في قاعدة البيانات. يرجى اختيار اسم مختلف أو تعديل المتجر الحالي.',
          });
        }

        if (adminClient) {
          try {
            let query = adminClient
              .from('shops')
              .select('id, shop_name')
              .ilike('shop_name', normalized);

            if (excludeShopId && isValidUUID(excludeShopId)) {
              query = query.neq('id', excludeShopId);
            }

            const { data: existingShop } = await query.maybeSingle();
            if (existingShop?.id) {
              return res.status(200).json({
                available: false,
                field: 'shop_name',
                reason: 'conflict',
                message: 'This optical shop name is already registered in the database. Please choose a different name or edit the existing shop.',
                messageAr: 'اسم مركز البصريات هذا مسجل بالفعل في قاعدة البيانات. يرجى اختيار اسم مختلف أو تعديل المتجر الحالي.',
              });
            }
          } catch (e) { }
        }

        return res.status(200).json({
          available: true,
          field: 'shop_name',
          message: 'Shop name is available.',
        });
      }

      if (field === 'phone') {
        const normalizedDigits = trimmed.replace(/[^\d+]/g, '');
        if (normalizedDigits.length < 7) {
          return res.status(200).json({
            available: false,
            field: 'phone',
            reason: 'invalid_format',
            message: 'Phone number must have at least 7 digits.',
          });
        }

        const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
        if (!phoneRegex.test(trimmed)) {
          return res.status(200).json({
            available: false,
            field: 'phone',
            reason: 'invalid_format',
            message: 'Invalid phone number format (e.g. +962 7 9855 2410).',
          });
        }

        // Check demo agents
        const demoPhoneMatch = DEMO_AGENTS.find(
          (a) => a.phone_number.replace(/[^\d+]/g, '') === normalizedDigits
        );
        if (demoPhoneMatch) {
          return res.status(200).json({
            available: false,
            field: 'phone',
            reason: 'conflict',
            message: `Phone number is already associated with agent (${demoPhoneMatch.full_name}).`,
          });
        }

        if (adminClient) {
          // 1. Check agents
          try {
            const { data: agentPhone } = await adminClient
              .from('agents')
              .select('id, full_name')
              .or(`phone_number.eq.${trimmed},phone_number.eq.${normalizedDigits}`)
              .maybeSingle();

            if (agentPhone?.id) {
              return res.status(200).json({
                available: false,
                field: 'phone',
                reason: 'conflict',
                message: `This phone number is already registered to agent (${agentPhone.full_name || 'Agent'}).`,
              });
            }
          } catch (e) { }

          // 2. Check shops (owner_phone)
          try {
            let shopPhoneQuery = adminClient
              .from('shops')
              .select('id, shop_name')
              .or(`owner_phone.eq.${trimmed},owner_phone.eq.${normalizedDigits}`);

            if (excludeShopId && isValidUUID(excludeShopId)) {
              shopPhoneQuery = shopPhoneQuery.neq('id', excludeShopId);
            }

            const { data: shopPhone } = await shopPhoneQuery.maybeSingle();
            if (shopPhone?.id) {
              return res.status(200).json({
                available: false,
                field: 'phone',
                reason: 'conflict',
                message: `This phone number is already associated with shop "${shopPhone.shop_name}".`,
              });
            }
          } catch (e) { }

          // 3. Check shop_staff_credentials
          try {
            const { data: staffPhone } = await adminClient
              .from('shop_staff_credentials')
              .select('id, full_name')
              .or(`phone_number.eq.${trimmed},phone_number.eq.${normalizedDigits}`)
              .maybeSingle();

            if (staffPhone?.id) {
              return res.status(200).json({
                available: false,
                field: 'phone',
                reason: 'conflict',
                message: `This phone number is already linked to staff account (${staffPhone.full_name}).`,
              });
            }
          } catch (e) { }
        }

        return res.status(200).json({
          available: true,
          field: 'phone',
          message: 'Phone number is available.',
        });
      }

      return res.status(400).json({
        available: false,
        error: `Unsupported pre-check field: "${field}".`,
      });
    } catch (err: any) {
      console.error('[check-availability error]', err);
      return res.status(500).json({
        available: false,
        error: err.message || 'Availability check failed.',
        code: 'CHECK_ERROR',
      });
    }
  });

  // 1. API Route: Onboard Shop + Provision Staff Credentials
  app.post('/api/agent/onboard-shop', requireAgent, async (req: Request, res: Response) => {
    const adminClient = getSupabaseAdminClient()!; // Guaranteed non-null by requireAgent
    const agentId = (req as any).agentId;
    const callerUser = (req as any).user;

    let createdShopId: string | null = null;
    let createdPricingShopId: string | null = null;
    let createdConfigShopId: string | null = null;
    const createdUserIds: string[] = [];
    const warnings: string[] = [];

    try {
      const { shop: shopInput, config: configInput, staff = [] } = req.body || {};

      // a. Validate inputs
      if (!shopInput) {
        const err: any = new Error('Validation failed: Missing "shop" object in request body.');
        err.step = 'validation';
        err.status = 400;
        throw err;
      }

      if (!shopInput.shop_name || !String(shopInput.shop_name).trim()) {
        const err: any = new Error('Validation failed: Required field "shop_name" is missing.');
        err.step = 'validation';
        err.status = 400;
        throw err;
      }

      const rawTier = String(shopInput.tier || '').trim().toLowerCase();
      const allowedTiers = ['bronze', 'silver', 'gold', 'platinum'];
      if (!allowedTiers.includes(rawTier)) {
        const err: any = new Error(`Validation failed: Invalid tier "${shopInput.tier}". Allowed tiers: ${allowedTiers.join(', ')}.`);
        err.step = 'validation_tier';
        err.status = 400;
        throw err;
      }

      if (!configInput || !configInput.subdomain_slug || !String(configInput.subdomain_slug).trim()) {
        const err: any = new Error('Validation failed: Subdomain endpoint is required in config.');
        err.step = 'validation_config';
        err.status = 400;
        throw err;
      }

      const cleanSlug = String(configInput.subdomain_slug)
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      if (!cleanSlug || cleanSlug.length < 3) {
        const err: any = new Error('Validation failed: Subdomain must be at least 3 alphanumeric characters.');
        err.step = 'validation_subdomain';
        err.status = 400;
        throw err;
      }

      // Check subdomain not already in shop_configs
      const { data: existingSub, error: subErr } = await adminClient
        .from('shop_configs')
        .select('shop_id')
        .eq('subdomain_slug', cleanSlug)
        .maybeSingle();

      if (subErr) {
        const err: any = new Error(`Database error checking subdomain availability: ${subErr.message}`);
        err.step = 'validation_subdomain_db';
        err.code = subErr.code;
        throw err;
      }
      if (existingSub) {
        const err: any = new Error(`Conflict: Subdomain '${cleanSlug}' is already taken.`);
        err.step = 'validation_subdomain_conflict';
        err.status = 409;
        throw err;
      }

      // Validate staff roster
      if (!Array.isArray(staff) || staff.length === 0) {
        const err: any = new Error('Validation failed: At least one staff member is required.');
        err.step = 'validation_staff_empty';
        err.status = 400;
        throw err;
      }

      const allowedRoles = ['shop_owner', 'optometrist', 'optician', 'marketer'];
      const seenEmails = new Set<string>();
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

      for (let i = 0; i < staff.length; i++) {
        const member = staff[i];
        const email = String(member?.email || '').trim().toLowerCase();
        if (!email || !emailRegex.test(email)) {
          const err: any = new Error(`Validation failed: Staff member #${i + 1} has an invalid email format ("${member?.email || ''}").`);
          err.step = 'validation_staff_email';
          err.status = 400;
          throw err;
        }

        if (seenEmails.has(email)) {
          const err: any = new Error(`Validation failed: Duplicate staff email detected: "${email}".`);
          err.step = 'validation_staff_duplicate_email';
          err.status = 400;
          throw err;
        }
        seenEmails.add(email);

        if (!member.role || !allowedRoles.includes(member.role)) {
          const err: any = new Error(`Validation failed: Staff member "${email}" has an invalid role "${member?.role}". Allowed: ${allowedRoles.join(', ')}.`);
          err.step = 'validation_staff_role';
          err.status = 400;
          throw err;
        }

        const pwd = String(member.password || '').trim();
        if (!pwd || pwd.length < 8) {
          const err: any = new Error(`Validation failed: Password required (min 8 chars) for staff "${email}".`);
          err.step = 'validation_staff_password';
          err.status = 400;
          throw err;
        }
      }

      // Check staff emails not already in profiles
      const staffEmailList = Array.from(seenEmails);
      const { data: existingProfiles, error: profLookupErr } = await adminClient
        .from('profiles')
        .select('email')
        .in('email', staffEmailList);

      if (profLookupErr) {
        const err: any = new Error(`Database error checking user profiles: ${profLookupErr.message}`);
        err.step = 'validation_profiles_db';
        err.code = profLookupErr.code;
        throw err;
      }

      if (existingProfiles && existingProfiles.length > 0) {
        const conflictEmail = existingProfiles[0].email;
        const err: any = new Error(`Conflict: Email '${conflictEmail}' is already registered in user profiles.`);
        err.step = 'validation_profile_conflict';
        err.status = 409;
        throw err;
      }

      // b. Insert into shops (agent_id = req.agentId, ignore agent_id from body)
      // Real schema note: shops has NO monthly_price column; do NOT include monthly_price
      const shopPayload: Record<string, any> = {
        shop_name: String(shopInput.shop_name || '').trim(),
        location: String(shopInput.location || '').trim(),
        owner_email: String(shopInput.owner_email || '').trim().toLowerCase(),
        tier: rawTier,
        agent_id: agentId, // ignore agent_id from body!
        is_active: shopInput.is_active !== undefined ? Boolean(shopInput.is_active) : true,
        country_code: String(shopInput.country_code || 'JO').trim().toUpperCase(),
        currency_code: String(shopInput.currency_code || 'JOD').trim().toUpperCase(),
        currency_symbol: String(shopInput.currency_symbol || shopInput.currency_code || 'JOD').trim(),
        subscription_status: String(shopInput.subscription_status || 'active').trim(),
      };
      if (shopInput.owner_phone) {
        shopPayload.owner_phone = String(shopInput.owner_phone).trim();
      }

      const { data: insertedShop, error: shopErr } = await adminClient
        .from('shops')
        .insert([shopPayload])
        .select()
        .single();

      if (shopErr || !insertedShop) {
        const err: any = new Error(`Failed to insert shop: ${shopErr?.message || 'Database error'}`);
        err.step = 'insert_shop';
        err.code = shopErr?.code;
        err.hint = shopErr?.hint;
        throw err;
      }

      createdShopId = insertedShop.id;

      // c. Upsert shop_currency_pricing (onConflict shop_id)
      const pricingPayload = {
        shop_id: createdShopId,
        country_code: String(shopInput.country_code || 'JO').trim().toUpperCase(),
        currency_code: String(shopInput.currency_code || 'JOD').trim().toUpperCase(),
        currency_symbol: String(shopInput.currency_symbol || shopInput.currency_code || 'JOD').trim(),
        tier_1_price: Number(shopInput.tier_1_price ?? 20),
        tier_2_price: Number(shopInput.tier_2_price ?? 60),
        tier_3_price: Number(shopInput.tier_3_price ?? 120),
        tier_4_price: Number(shopInput.tier_4_price ?? 200),
      };

      const { error: pricingErr } = await adminClient
        .from('shop_currency_pricing')
        .upsert([pricingPayload], { onConflict: 'shop_id' });

      if (pricingErr) {
        const err: any = new Error(`Failed to upsert shop_currency_pricing: ${pricingErr.message}`);
        err.step = 'upsert_pricing';
        err.code = pricingErr.code;
        err.hint = pricingErr.hint;
        throw err;
      }

      createdPricingShopId = createdShopId;

      // d. Upsert shop_configs (onConflict shop_id) with logo_url: configInput.logo_url || '' (column is NOT NULL, never send null)
      const configPayload = {
        shop_id: createdShopId,
        subdomain_slug: cleanSlug,
        primary_color: configInput.primary_color || '#0f766e',
        secondary_color: configInput.secondary_color || '#134e4a',
        logo_url: configInput.logo_url || '', // column is NOT NULL, never send null!
        background_image_url: configInput.background_image_url || null,
        updated_at: new Date().toISOString(),
      };

      const { error: configErr } = await adminClient
        .from('shop_configs')
        .upsert([configPayload], { onConflict: 'shop_id' });

      if (configErr) {
        const err: any = new Error(`Failed to upsert shop_configs: ${configErr.message}`);
        err.step = 'upsert_config';
        err.code = configErr.code;
        err.hint = configErr.hint;
        throw err;
      }

      createdConfigShopId = createdShopId;

      // e. For each staff: provision user and credential
      const credentialsResults: any[] = [];
      let shopOwnerAuthUserId: string | null = null;

      for (const member of staff) {
        const res = await provisionAndSaveStaffCredential(
          adminClient,
          createdShopId!,
          agentId,
          callerUser.id,
          member
        );
        createdUserIds.push(res.userId);
        credentialsResults.push(res);
        if (member.role === 'shop_owner' && !shopOwnerAuthUserId) {
          shopOwnerAuthUserId = res.userId;
        }
      }

      // f. Set shops.auth_user_id to the shop_owner staff user's id (failure = warning only)
      if (shopOwnerAuthUserId) {
        const { error: linkErr } = await adminClient
          .from('shops')
          .update({ auth_user_id: shopOwnerAuthUserId })
          .eq('id', createdShopId);

        if (linkErr) {
          warnings.push(`Warning: Could not link shop_owner auth_user_id: ${linkErr.message}`);
        }
      }

      // g. Read back shops, shop_configs, shop_currency_pricing and shop_staff_credentials rows for this shop; if any is missing or staff count is lower than submitted, throw.
      const { data: readShop, error: readShopErr } = await adminClient
        .from('shops')
        .select('*')
        .eq('id', createdShopId)
        .maybeSingle();

      if (readShopErr || !readShop) {
        const err: any = new Error(`Failed to read back shops record: ${readShopErr?.message || 'Row missing'}`);
        err.step = 'read_back_shop';
        throw err;
      }

      const { data: readConfig, error: readConfigErr } = await adminClient
        .from('shop_configs')
        .select('*')
        .eq('shop_id', createdShopId)
        .maybeSingle();

      if (readConfigErr || !readConfig) {
        const err: any = new Error(`Failed to read back shop_configs record: ${readConfigErr?.message || 'Row missing'}`);
        err.step = 'read_back_config';
        throw err;
      }

      const { data: readPricing, error: readPricingErr } = await adminClient
        .from('shop_currency_pricing')
        .select('*')
        .eq('shop_id', createdShopId)
        .maybeSingle();

      if (readPricingErr || !readPricing) {
        const err: any = new Error(`Failed to read back shop_currency_pricing record: ${readPricingErr?.message || 'Row missing'}`);
        err.step = 'read_back_pricing';
        throw err;
      }

      const { data: readStaff, error: readStaffErr } = await adminClient
        .from('shop_staff_credentials')
        .select('*')
        .eq('shop_id', createdShopId);

      if (readStaffErr) {
        const err: any = new Error(`Failed to read back shop_staff_credentials: ${readStaffErr.message}`);
        err.step = 'read_back_staff';
        throw err;
      }

      if (!readStaff || readStaff.length < staff.length) {
        const err: any = new Error(`Read back staff credentials count (${readStaff?.length || 0}) is less than submitted count (${staff.length}).`);
        err.step = 'read_back_staff_count';
        throw err;
      }

      // Choose monthly_price by tier: bronze=tier_1_price, silver=tier_2, gold=tier_3, platinum=tier_4
      let monthlyPrice = 0;
      if (readShop.tier === 'bronze') monthlyPrice = Number(readPricing.tier_1_price ?? 20);
      else if (readShop.tier === 'silver') monthlyPrice = Number(readPricing.tier_2_price ?? 60);
      else if (readShop.tier === 'gold') monthlyPrice = Number(readPricing.tier_3_price ?? 120);
      else if (readShop.tier === 'platinum') monthlyPrice = Number(readPricing.tier_4_price ?? 200);

      const finalShop = {
        ...readShop,
        config: readConfig,
        pricing: readPricing,
        monthly_price: monthlyPrice,
        staff: readStaff || [],
      };

      return res.status(200).json({
        success: true,
        shop: finalShop,
        credentials: credentialsResults,
        warnings,
      });
    } catch (err: any) {
      console.error('[server.ts] Error in /api/agent/onboard-shop, initiating rollback:', err);

      // Rollback in this exact order:
      // 1. set shops.auth_user_id null
      if (createdShopId) {
        try {
          await adminClient.from('shops').update({ auth_user_id: null }).eq('id', createdShopId);
        } catch (e) {
          console.warn('[Rollback] set shops.auth_user_id null warning:', e);
        }

        // 2. delete shop_staff_credentials by shop_id
        try {
          await adminClient.from('shop_staff_credentials').delete().eq('shop_id', createdShopId);
        } catch (e) {
          console.warn('[Rollback] delete shop_staff_credentials warning:', e);
        }
      }

      // 3. delete created profiles
      for (const uid of createdUserIds) {
        try {
          await adminClient.from('profiles').delete().eq('id', uid);
        } catch (e) {
          console.warn(`[Rollback] delete profile ${uid} warning:`, e);
        }
      }

      // 4. delete created auth users (auth.admin.deleteUser)
      for (const uid of createdUserIds) {
        try {
          await adminClient.auth.admin.deleteUser(uid);
        } catch (e) {
          console.warn(`[Rollback] delete auth user ${uid} warning:`, e);
        }
      }

      // 5. delete shop_configs
      if (createdConfigShopId) {
        try {
          await adminClient.from('shop_configs').delete().eq('shop_id', createdConfigShopId);
        } catch (e) {
          console.warn('[Rollback] delete shop_configs warning:', e);
        }
      }

      // 6. delete shop_currency_pricing
      if (createdPricingShopId) {
        try {
          await adminClient.from('shop_currency_pricing').delete().eq('shop_id', createdPricingShopId);
        } catch (e) {
          console.warn('[Rollback] delete shop_currency_pricing warning:', e);
        }
      }

      // 7. then the shop
      if (createdShopId) {
        try {
          await adminClient.from('shops').delete().eq('id', createdShopId);
        } catch (e) {
          console.warn('[Rollback] delete shop warning:', e);
        }
      }

      return res.status(err.status || 422).json({
        success: false,
        error: err.message || 'Failed to onboard shop.',
        step: err.step || 'unknown',
        code: err.code || 'ONBOARD_ERROR',
        hint: err.hint || null,
        rolledBack: true,
      });
    }
  });

  // 2. API Route: Create Credentials for existing shop
  app.post('/api/agent/create-credentials', requireAgent, async (req: Request, res: Response) => {
    const adminClient = getSupabaseAdminClient();
    if (!adminClient) {
      return res.status(503).json({
        success: false,
        error: 'SUPABASE_SERVICE_ROLE_KEY not set',
      });
    }

    const profile = (req as any).profile;
    const agentId = (req as any).agentId;
    const user = (req as any).user;

    const createdUserIds: string[] = [];

    try {
      const { shop_id, staff = [] } = req.body || {};

      if (!shop_id || !Array.isArray(staff) || staff.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed: shop_id and an array of staff users are required.',
        });
      }

      // Validate passwords for all staff members: min 8 chars
      for (const member of staff) {
        const pwd = String(member.password || '').trim();
        if (!pwd || pwd.length < 8) {
          return res.status(400).json({
            success: false,
            error: 'password required (min 8 chars)',
            member: member.email || member.full_name || 'unknown',
          });
        }
      }

      // Verify that the given shop_id belongs to that agent (public.shops.agent_id) unless caller is admin
      if (profile?.role !== 'admin') {
        const { data: shopRecord, error: shopErr } = await adminClient
          .from('shops')
          .select('id, agent_id')
          .eq('id', shop_id)
          .maybeSingle();

        if (shopErr || !shopRecord) {
          return res.status(404).json({
            success: false,
            error: 'Shop not found.',
          });
        }

        if (shopRecord.agent_id !== agentId) {
          return res.status(403).json({
            success: false,
            error: 'Forbidden: You do not have permission to manage credentials for this shop.',
          });
        }
      }

      const credentialsResults: any[] = [];

      for (const member of staff) {
        if (!member.email) continue;
        const res = await provisionAndSaveStaffCredential(
          adminClient,
          shop_id,
          agentId,
          user.id,
          member
        );
        createdUserIds.push(res.userId);
        credentialsResults.push(res);
      }

      return res.status(200).json({
        success: true,
        credentials: credentialsResults,
      });
    } catch (err: any) {
      console.error('[server.ts] Error in /api/agent/create-credentials, cleaning up created logins:', err);

      // Delete any logins it created if a later member fails
      for (const uid of createdUserIds) {
        try {
          await adminClient.from('shop_staff_credentials').delete().eq('user_id', uid);
        } catch { }
        try {
          await adminClient.from('profiles').delete().eq('id', uid);
        } catch { }
        try {
          await adminClient.auth.admin.deleteUser(uid);
        } catch { }
      }

      return res.status(err.status || 422).json({
        success: false,
        error: err.message || 'Failed to provision staff credentials.',
        hint: err.hint || null,
        code: err.code || 'CREDENTIALS_FAILED',
      });
    }
  });

  // 3. API Route: Get shops for agent (bypasses RLS via service-role client)
  app.get('/api/agent/shops', requireAgent, async (req: Request, res: Response) => {
    const adminClient = getSupabaseAdminClient();
    if (!adminClient) {
      return res.status(503).json({
        success: false,
        error: 'SUPABASE_SERVICE_ROLE_KEY not set',
      });
    }

    const profile = (req as any).profile;
    const agentId = (req as any).agentId;

    try {
      let shopsQuery = adminClient.from('shops').select('*');
      if (profile?.role !== 'admin') {
        shopsQuery = shopsQuery.eq('agent_id', agentId);
      }

      const { data: shops, error: shopsErr } = await shopsQuery.order('created_at', { ascending: false });
      if (shopsErr) {
        return res.status(500).json({
          success: false,
          error: `Failed to load shops: ${shopsErr.message}`,
        });
      }

      if (!shops || shops.length === 0) {
        return res.status(200).json({
          success: true,
          shops: [],
        });
      }

      const shopIds = shops.map((s: any) => s.id);

      // Fetch shop_configs for these shops
      const { data: configs, error: configsErr } = await adminClient
        .from('shop_configs')
        .select('*')
        .in('shop_id', shopIds);

      if (configsErr) {
        return res.status(500).json({
          success: false,
          error: `Failed to load shop configs: ${configsErr.message}`,
        });
      }

      // Fetch shop_currency_pricing for these shops
      const { data: pricing, error: pricingErr } = await adminClient
        .from('shop_currency_pricing')
        .select('*')
        .in('shop_id', shopIds);

      if (pricingErr) {
        return res.status(500).json({
          success: false,
          error: `Failed to load shop pricing: ${pricingErr.message}`,
        });
      }

      // Fetch agents for agent_ids
      const agentIds = Array.from(new Set(shops.map((s: any) => s.agent_id).filter(Boolean)));
      let agents: any[] = [];
      if (agentIds.length > 0) {
        const { data: agentsData, error: agentsErr } = await adminClient
          .from('agents')
          .select('*')
          .in('id', agentIds);

        if (agentsErr) {
          return res.status(500).json({
            success: false,
            error: `Failed to load agents: ${agentsErr.message}`,
          });
        }
        agents = agentsData || [];
      }

      const configsMap = new Map((configs || []).map((c: any) => [c.shop_id, c]));
      const pricingMap = new Map((pricing || []).map((p: any) => [p.shop_id, p]));
      const agentsMap = new Map((agents || []).map((a: any) => [a.id, a]));

      // Fetch latest payments from shop_subscriptions_ledger for these shops
      const ledgerMap = new Map<string, any>();
      try {
        const { data: ledgerRows } = await adminClient
          .from('shop_subscriptions_ledger')
          .select('shop_id, amount_paid, payment_month, billing_period_end, created_at')
          .in('shop_id', shopIds)
          .order('created_at', { ascending: false });

        if (ledgerRows) {
          for (const row of ledgerRows) {
            if (!ledgerMap.has(row.shop_id)) {
              ledgerMap.set(row.shop_id, row);
            }
          }
        }
      } catch (lErr) {
        console.warn('[server.ts] Notice: ledger fetch warning:', lErr);
      }

      // Fetch shop_staff_credentials for these shops
      const staffMap = new Map<string, any[]>();
      try {
        const { data: staffRows } = await adminClient
          .from('shop_staff_credentials')
          .select('*')
          .in('shop_id', shopIds)
          .order('created_at', { ascending: true });

        if (staffRows) {
          for (const row of staffRows) {
            const list = staffMap.get(row.shop_id) || [];
            list.push(row);
            staffMap.set(row.shop_id, list);
          }
        }
      } catch (stErr) {
        console.warn('[server.ts] Notice: staff fetch warning:', stErr);
      }

      // Aggregate last 30 days usage metrics & latest activity date across shops
      const thirtyDaysAgoMs = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const usageMap = new Map<
        string,
        { try_on_sessions: number; recommendations_made: number; last_activity_at: string | null }
      >();

      const ensureUsage = (shopId: string) => {
        let entry = usageMap.get(shopId);
        if (!entry) {
          entry = { try_on_sessions: 0, recommendations_made: 0, last_activity_at: null };
          usageMap.set(shopId, entry);
        }
        return entry;
      };

      const recordTimestamp = (shopId: string, ts?: string | null) => {
        if (!ts) return;
        const parsedMs = new Date(ts).getTime();
        if (Number.isNaN(parsedMs)) return;
        const entry = ensureUsage(shopId);
        if (!entry.last_activity_at || parsedMs > new Date(entry.last_activity_at).getTime()) {
          entry.last_activity_at = ts;
        }
      };

      for (const s of shops) {
        const cfg = configsMap.get(s.id);
        const cfgJson = cfg?.config_json && typeof cfg.config_json === 'object' ? cfg.config_json : null;
        const entry = ensureUsage(s.id);
        const directTryOns = s.try_on_sessions_30d ?? cfgJson?.try_on_sessions_30d;
        const directRecs = s.recommendations_30d ?? cfgJson?.recommendations_30d;
        if (directTryOns != null && !Number.isNaN(Number(directTryOns))) {
          entry.try_on_sessions = Number(directTryOns);
        }
        if (directRecs != null && !Number.isNaN(Number(directRecs))) {
          entry.recommendations_made = Number(directRecs);
        }
        recordTimestamp(s.id, s.last_activity_at || s.last_active_at || cfgJson?.last_activity_at || null);
      }

      const tryOnTables = ['try_on_sessions', 'tryon_sessions'];
      for (const tbl of tryOnTables) {
        try {
          const { data: tryOnRows, error: tryOnErr } = await adminClient
            .from(tbl)
            .select('shop_id, created_at')
            .in('shop_id', shopIds);

          if (!tryOnErr && Array.isArray(tryOnRows)) {
            for (const row of tryOnRows) {
              if (!row.shop_id) continue;
              const entry = ensureUsage(row.shop_id);
              const createdMs = row.created_at ? new Date(row.created_at).getTime() : NaN;
              if (!Number.isNaN(createdMs) && createdMs >= thirtyDaysAgoMs) {
                entry.try_on_sessions += 1;
              }
              recordTimestamp(row.shop_id, row.created_at);
            }
            break;
          }
        } catch {
          // Table may not exist on older schemas; continue gracefully
        }
      }

      const recTables = ['recommendations', 'frame_recommendations'];
      for (const tbl of recTables) {
        try {
          const { data: recRows, error: recErr } = await adminClient
            .from(tbl)
            .select('shop_id, created_at')
            .in('shop_id', shopIds);

          if (!recErr && Array.isArray(recRows)) {
            for (const row of recRows) {
              if (!row.shop_id) continue;
              const entry = ensureUsage(row.shop_id);
              const createdMs = row.created_at ? new Date(row.created_at).getTime() : NaN;
              if (!Number.isNaN(createdMs) && createdMs >= thirtyDaysAgoMs) {
                entry.recommendations_made += 1;
              }
              recordTimestamp(row.shop_id, row.created_at);
            }
            break;
          }
        } catch {
          // Table may not exist on older schemas; continue gracefully
        }
      }

      const now = new Date();
      const combinedShops = shops.map((s: any) => {
        const latestPayment = ledgerMap.get(s.id);
        let unpaidMonths = 0;

        if (latestPayment) {
          const lMonth = latestPayment.payment_month || latestPayment.billing_period_end?.slice(0, 7) || latestPayment.created_at?.slice(0, 7);
          if (lMonth) {
            const [y, m] = lMonth.split('-').map(Number);
            unpaidMonths = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m);
          }
        } else if (s.created_at) {
          const cDate = new Date(s.created_at);
          unpaidMonths = (now.getFullYear() - cDate.getFullYear()) * 12 + (now.getMonth() - cDate.getMonth());
        }

        // If unpaid for 3 or more months and no payment was made recently, shop is stopped for non-payment
        const isStoppedFor3Months = unpaidMonths >= 3 && (!s.last_payment_date || new Date(s.last_payment_date) < new Date(now.getFullYear(), now.getMonth() - 2, 1));
        const effectiveSubStatus = isStoppedFor3Months ? 'suspended' : (s.subscription_status || (s.is_active ? 'active' : 'suspended'));
        const effectiveIsActive = isStoppedFor3Months ? false : (s.is_active ?? true);
        const effectiveHoldReason = isStoppedFor3Months
          ? (s.hold_reason || `Subscription stopped: payment unpaid for ${unpaidMonths} months`)
          : s.hold_reason;
        const usage30d = ensureUsage(s.id);

        return {
          ...s,
          is_active: effectiveIsActive,
          subscription_status: effectiveSubStatus,
          status: effectiveSubStatus,
          hold_reason: effectiveHoldReason,
          unpaid_months: unpaidMonths,
          is_stopped_for_non_payment: isStoppedFor3Months,
          last_payment_month: latestPayment?.payment_month || null,
          last_activity_at: usage30d.last_activity_at,
          usage_30d: usage30d,
          shop_configs: configsMap.get(s.id) || null,
          shop_currency_pricing: pricingMap.get(s.id) || null,
          agents: agentsMap.get(s.agent_id) || null,
          staff: staffMap.get(s.id) || [],
        };
      });

      return res.status(200).json({
        success: true,
        shops: combinedShops,
      });
    } catch (err: any) {
      console.error('[server.ts] Error in GET /api/agent/shops:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to retrieve shops.',
      });
    }
  });

  // 4. API Route: Get staff for shop (bypasses RLS via service-role client)
  app.get('/api/agent/shops/:shopId/staff', requireAgent, async (req: Request, res: Response) => {
    const adminClient = getSupabaseAdminClient();
    if (!adminClient) {
      return res.status(503).json({
        success: false,
        error: 'SUPABASE_SERVICE_ROLE_KEY not set',
      });
    }

    const profile = (req as any).profile;
    const agentId = (req as any).agentId;
    const { shopId } = req.params;

    try {
      const { data: shop, error: shopErr } = await adminClient
        .from('shops')
        .select('id, agent_id')
        .eq('id', shopId)
        .maybeSingle();

      if (shopErr) {
        return res.status(500).json({
          success: false,
          error: `Failed to query shop: ${shopErr.message}`,
        });
      }

      if (!shop) {
        return res.status(404).json({
          success: false,
          error: 'Shop not found.',
        });
      }

      if (profile?.role !== 'admin' && shop.agent_id !== agentId) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You do not have permission to view staff for this shop.',
        });
      }

      const { data: staff, error: staffErr } = await adminClient
        .from('shop_staff_credentials')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: true });

      if (staffErr) {
        return res.status(500).json({
          success: false,
          error: `Failed to load staff credentials: ${staffErr.message}`,
        });
      }

      return res.status(200).json({
        success: true,
        staff: staff || [],
      });
    } catch (err: any) {
      console.error('[server.ts] Error in GET /api/agent/shops/:shopId/staff:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to retrieve staff credentials.',
      });
    }
  });

  // Helper: Verify that an officer (by user_id) belongs to a shop owned by the logged-in agent
  async function verifyOfficerShopOwnership(
    adminClient: SupabaseClient,
    userId: string,
    agentId: string
  ): Promise<
    | { ok: true; staffRows: any[]; shopRows: any[] }
    | { ok: false; status: number; error: string }
  > {
    if (!isValidUUID(userId)) {
      return { ok: false, status: 400, error: 'Invalid officer userId.' };
    }

    const { data: staffRows, error: staffErr } = await adminClient
      .from('shop_staff_credentials')
      .select('*')
      .eq('user_id', userId);

    if (staffErr) {
      return { ok: false, status: 500, error: `Failed to look up officer: ${staffErr.message}` };
    }

    if (!staffRows || staffRows.length === 0) {
      return { ok: false, status: 404, error: 'Officer not found in shop_staff_credentials.' };
    }

    const shopIds = Array.from(new Set(staffRows.map((r: any) => r.shop_id).filter(Boolean)));
    if (shopIds.length === 0) {
      return { ok: false, status: 404, error: 'Officer has no associated shop.' };
    }

    const { data: shopRows, error: shopErr } = await adminClient
      .from('shops')
      .select('id, agent_id, auth_user_id')
      .in('id', shopIds);

    if (shopErr) {
      return { ok: false, status: 500, error: `Failed to verify shop ownership: ${shopErr.message}` };
    }

    if (!shopRows || shopRows.length === 0) {
      return { ok: false, status: 404, error: 'Associated shop not found.' };
    }

    const unauthorized = shopRows.find((s: any) => s.agent_id !== agentId);
    if (unauthorized) {
      return {
        ok: false,
        status: 403,
        error: 'Forbidden: You do not have permission to manage officers for this shop.',
      };
    }

    return { ok: true, staffRows, shopRows };
  }

  // 4b. API Route: Update officer (auth email, profiles, and shop_staff_credentials)
  app.put('/api/agent/staff/:userId', requireAgent, async (req: Request, res: Response) => {
    const adminClient = getSupabaseAdminClient();
    if (!adminClient) {
      return res.status(503).json({
        success: false,
        error: 'SUPABASE_SERVICE_ROLE_KEY not set',
      });
    }

    const agentId = (req as any).agentId;
    const { userId } = req.params;
    const { full_name, role, email, phone_number } = req.body || {};

    const cleanName = String(full_name || '').trim();
    const cleanRole = String(role || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const allowedRoles = ['shop_owner', 'optometrist', 'optician', 'marketer'];
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!cleanName) {
      return res.status(400).json({ success: false, error: 'Officer full name is required.' });
    }
    if (!allowedRoles.includes(cleanRole)) {
      return res.status(400).json({
        success: false,
        error: `Invalid role "${cleanRole}". Allowed roles: ${allowedRoles.join(', ')}.`,
      });
    }
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, error: 'A valid email address is required.' });
    }

    try {
      const check = await verifyOfficerShopOwnership(adminClient, userId, agentId);
      if (!check.ok) {
        return res.status(check.status).json({ success: false, error: check.error });
      }

      // 1. Update auth user (email + metadata)
      let existingMeta: Record<string, any> = {};
      try {
        const { data: authLookup } = await adminClient.auth.admin.getUserById(userId);
        existingMeta = authLookup?.user?.user_metadata || {};
      } catch { }

      const { error: authUpdateErr } = await adminClient.auth.admin.updateUserById(userId, {
        email: cleanEmail,
        email_confirm: true,
        user_metadata: {
          ...existingMeta,
          full_name: cleanName,
          role: cleanRole,
        },
      });

      if (authUpdateErr) {
        const isConflict =
          authUpdateErr.message?.toLowerCase().includes('already') ||
          authUpdateErr.message?.toLowerCase().includes('exists') ||
          authUpdateErr.status === 422;
        return res.status(isConflict ? 409 : 400).json({
          success: false,
          error: `Failed to update auth user: ${authUpdateErr.message}`,
        });
      }

      // 2. Update public.profiles
      const profileUpdate: Record<string, any> = {
        full_name: cleanName,
        role: cleanRole,
        email: cleanEmail,
      };
      if (phone_number !== undefined) {
        profileUpdate.whatsapp_number = phone_number ? String(phone_number).trim() : null;
      }

      const { error: profileErr } = await adminClient
        .from('profiles')
        .update(profileUpdate)
        .eq('id', userId);

      if (profileErr) {
        return res.status(500).json({
          success: false,
          error: `Failed to update profile: ${profileErr.message}`,
        });
      }

      // 3. Update public.shop_staff_credentials
      const credUpdate: Record<string, any> = {
        full_name: cleanName,
        role: cleanRole,
        email: cleanEmail,
      };
      if (phone_number !== undefined) {
        credUpdate.phone_number = phone_number ? String(phone_number).trim() : null;
      }

      const { data: updatedCreds, error: credErr } = await adminClient
        .from('shop_staff_credentials')
        .update(credUpdate)
        .eq('user_id', userId)
        .select('*');

      if (credErr) {
        return res.status(500).json({
          success: false,
          error: `Failed to update shop_staff_credentials: ${credErr.message}`,
        });
      }

      return res.status(200).json({
        success: true,
        staff: updatedCreds?.[0] || null,
      });
    } catch (err: any) {
      console.error('[server.ts] Error in PUT /api/agent/staff/:userId:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to update officer.',
      });
    }
  });

  // 4c. API Route: Delete officer (auth user, profile, and shop_staff_credentials row)
  app.delete('/api/agent/staff/:userId', requireAgent, async (req: Request, res: Response) => {
    const adminClient = getSupabaseAdminClient();
    if (!adminClient) {
      return res.status(503).json({
        success: false,
        error: 'SUPABASE_SERVICE_ROLE_KEY not set',
      });
    }

    const agentId = (req as any).agentId;
    const { userId } = req.params;

    try {
      const check = await verifyOfficerShopOwnership(adminClient, userId, agentId);
      if (!check.ok) {
        return res.status(check.status).json({ success: false, error: check.error });
      }

      // 1. Clear shops.auth_user_id if it points to this officer
      for (const shopRow of check.shopRows) {
        if (shopRow.auth_user_id === userId) {
          const { error: unlinkErr } = await adminClient
            .from('shops')
            .update({ auth_user_id: null })
            .eq('id', shopRow.id);
          if (unlinkErr) {
            return res.status(500).json({
              success: false,
              error: `Failed to unlink shop auth_user_id: ${unlinkErr.message}`,
            });
          }
        }
      }

      // 2. Delete from public.shop_staff_credentials
      const { error: credDelErr } = await adminClient
        .from('shop_staff_credentials')
        .delete()
        .eq('user_id', userId);

      if (credDelErr) {
        return res.status(500).json({
          success: false,
          error: `Failed to delete staff credential row: ${credDelErr.message}`,
        });
      }

      // 3. Delete from public.profiles
      const { error: profDelErr } = await adminClient
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profDelErr) {
        console.warn('[server.ts] Warning deleting profile for officer:', profDelErr.message);
      }

      // 4. Delete Supabase Auth user
      const { error: authDelErr } = await adminClient.auth.admin.deleteUser(userId);
      if (authDelErr && !authDelErr.message?.toLowerCase().includes('not found')) {
        return res.status(500).json({
          success: false,
          error: `Failed to delete auth user: ${authDelErr.message}`,
        });
      }

      return res.status(200).json({
        success: true,
        deletedUserId: userId,
      });
    } catch (err: any) {
      console.error('[server.ts] Error in DELETE /api/agent/staff/:userId:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to delete officer.',
      });
    }
  });

  // 4d. API Route: Change officer password via auth.admin.updateUserById
  app.post('/api/agent/staff/:userId/password', requireAgent, async (req: Request, res: Response) => {
    const adminClient = getSupabaseAdminClient();
    if (!adminClient) {
      return res.status(503).json({
        success: false,
        error: 'SUPABASE_SERVICE_ROLE_KEY not set',
      });
    }

    const agentId = (req as any).agentId;
    const { userId } = req.params;
    const rawPassword = String(req.body?.password || '').trim();

    if (!rawPassword || rawPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters.',
      });
    }

    try {
      const check = await verifyOfficerShopOwnership(adminClient, userId, agentId);
      if (!check.ok) {
        return res.status(check.status).json({ success: false, error: check.error });
      }

      const { error: pwdErr } = await adminClient.auth.admin.updateUserById(userId, {
        password: rawPassword,
      });

      if (pwdErr) {
        return res.status(400).json({
          success: false,
          error: `Failed to update password: ${pwdErr.message}`,
        });
      }

      return res.status(200).json({
        success: true,
      });
    } catch (err: any) {
      console.error('[server.ts] Error in POST /api/agent/staff/:userId/password:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to update officer password.',
      });
    }
  });

  // 5. API Route: Record payment & resume subscription
  app.post('/api/agent/record-payment', requireAgent, async (req: Request, res: Response) => {
    const adminClient = getSupabaseAdminClient();
    if (!adminClient) {
      return res.status(503).json({ success: false, error: 'SUPABASE_SERVICE_ROLE_KEY not set' });
    }

    const agentId = (req as any).agentId;
    const profile = (req as any).profile;
    const {
      shop_id,
      amount_paid,
      billing_period_start,
      billing_period_end,
      payment_month,
      collection_method,
      notes,
    } = req.body;

    if (!shop_id || !amount_paid) {
      return res.status(400).json({ success: false, error: 'shop_id and amount_paid are required.' });
    }

    try {
      // 1. Verify shop exists and agent has access
      const { data: shop, error: shopErr } = await adminClient
        .from('shops')
        .select('*')
        .eq('id', shop_id)
        .maybeSingle();

      if (shopErr || !shop) {
        return res.status(404).json({ success: false, error: 'Shop not found' });
      }

      if (profile?.role !== 'admin' && shop.agent_id !== agentId) {
        return res.status(403).json({ success: false, error: 'Forbidden: You do not manage this shop' });
      }

      const numAmount = Number(amount_paid);
      const agentCommission = Number((numAmount * 0.5).toFixed(2));
      const platformShare = Number((numAmount * 0.5).toFixed(2));
      const nowIso = new Date().toISOString();

      const ledgerPayload: any = {
        shop_id,
        agent_id: agentId,
        amount_paid: numAmount,
        agent_commission: agentCommission,
        platform_share: platformShare,
        billing_period_start: billing_period_start || nowIso.slice(0, 10),
        billing_period_end: billing_period_end || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        payment_month: payment_month || nowIso.slice(0, 7),
        collection_method: collection_method || 'cash',
        collected_by_agent: true,
        notes: notes || 'Subscription payment recorded (50/50 split applied)',
      };

      const { data: ledgerEntry, error: ledgerErr } = await adminClient
        .from('shop_subscriptions_ledger')
        .insert([ledgerPayload])
        .select('*')
        .single();

      if (ledgerErr) {
        console.error('[server.ts] Error inserting into shop_subscriptions_ledger:', ledgerErr);
        return res.status(500).json({ success: false, error: ledgerErr.message });
      }

      // Also insert into shop_payments
      try {
        await adminClient.from('shop_payments').insert([
          {
            shop_id,
            agent_id: agentId,
            amount: numAmount,
            payment_date: nowIso,
            notes: notes || `Subscription payment for ${ledgerPayload.payment_month}`,
          },
        ]);
      } catch (pErr) {
        console.warn('Notice: shop_payments insert warning:', pErr);
      }

      // RESUME SUBSCRIPTION: paying for 1 month immediately resumes the shop's active status!
      const { data: updatedShop, error: updateErr } = await adminClient
        .from('shops')
        .update({
          is_active: true,
          subscription_status: 'active',
          status: 'active',
          hold_reason: null,
          hold_date: null,
          last_payment_date: nowIso,
        })
        .eq('id', shop_id)
        .select('*')
        .single();

      if (updateErr) {
        console.warn('[server.ts] Warning updating shop status on payment:', updateErr);
      }

      return res.status(200).json({
        success: true,
        ledgerEntry,
        shop: updatedShop || {
          ...shop,
          is_active: true,
          subscription_status: 'active',
          status: 'active',
          hold_reason: null,
          hold_date: null,
          last_payment_date: nowIso,
        },
      });
    } catch (err: any) {
      console.error('[server.ts] Error in POST /api/agent/record-payment:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 6. API Route: Update subscription status
  app.post('/api/agent/shops/:shopId/subscription-status', requireAgent, async (req: Request, res: Response) => {
    const adminClient = getSupabaseAdminClient();
    if (!adminClient) {
      return res.status(503).json({ success: false, error: 'SUPABASE_SERVICE_ROLE_KEY not set' });
    }

    const agentId = (req as any).agentId;
    const profile = (req as any).profile;
    const { shopId } = req.params;
    const { newStatus, reason } = req.body;

    if (!newStatus || !['active', 'maintenance', 'suspended'].includes(newStatus)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    try {
      const { data: shop, error: shopErr } = await adminClient
        .from('shops')
        .select('id, agent_id')
        .eq('id', shopId)
        .maybeSingle();

      if (shopErr || !shop) {
        return res.status(404).json({ success: false, error: 'Shop not found' });
      }

      if (profile?.role !== 'admin' && shop.agent_id !== agentId) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }

      const isActive = newStatus === 'active';
      const nowIso = new Date().toISOString();

      const { data: updatedShop, error: updateErr } = await adminClient
        .from('shops')
        .update({
          subscription_status: newStatus,
          status: newStatus,
          is_active: isActive,
          hold_reason: isActive ? null : (reason || 'Subscription status updated'),
          hold_date: isActive ? null : nowIso,
        })
        .eq('id', shopId)
        .select('*')
        .single();

      if (updateErr) {
        return res.status(500).json({ success: false, error: updateErr.message });
      }

      return res.status(200).json({ success: true, shop: updatedShop });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 7. API Routes: Shop Notes & Follow-ups (shop_notes table)
  app.get('/api/agent/notes', requireAgent, async (req: Request, res: Response) => {
    const adminClient = getSupabaseAdminClient();
    if (!adminClient) {
      return res.status(503).json({ success: false, error: 'SUPABASE_SERVICE_ROLE_KEY not set' });
    }

    const agentId = (req as any).agentId;
    const profile = (req as any).profile;

    try {
      let query = adminClient
        .from('shop_notes')
        .select('*, shops(id, shop_name, location)')
        .order('created_at', { ascending: false });

      if (profile?.role !== 'admin') {
        query = query.eq('agent_id', agentId);
      }

      const { data: notes, error } = await query;

      if (error) {
        // Gracefully handle missing shop_notes table on older schemas
        const msg = String(error.message || '').toLowerCase();
        if (error.code === '42P01' || msg.includes('does not exist') || msg.includes('schema cache')) {
          return res.status(200).json({ success: true, notes: [], tableMissing: true });
        }
        return res.status(500).json({ success: false, error: error.message });
      }

      const normalized = (notes || []).map((n: any) => ({
        ...n,
        shop: Array.isArray(n.shops) ? n.shops[0] : n.shops,
      }));

      return res.status(200).json({ success: true, notes: normalized });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/agent/shops/:shopId/notes', requireAgent, async (req: Request, res: Response) => {
    const adminClient = getSupabaseAdminClient();
    if (!adminClient) {
      return res.status(503).json({ success: false, error: 'SUPABASE_SERVICE_ROLE_KEY not set' });
    }

    const agentId = (req as any).agentId;
    const profile = (req as any).profile;
    const { shopId } = req.params;
    const rawNote = String(req.body?.note || '').trim();
    const rawFollowUp = req.body?.follow_up_date ? String(req.body.follow_up_date).trim().slice(0, 10) : null;

    if (!rawNote) {
      return res.status(400).json({ success: false, error: 'Note text is required.' });
    }

    if (rawFollowUp && !/^\d{4}-\d{2}-\d{2}$/.test(rawFollowUp)) {
      return res.status(400).json({ success: false, error: 'follow_up_date must be YYYY-MM-DD.' });
    }

    try {
      const { data: shop, error: shopErr } = await adminClient
        .from('shops')
        .select('id, agent_id, shop_name, location')
        .eq('id', shopId)
        .maybeSingle();

      if (shopErr || !shop) {
        return res.status(404).json({ success: false, error: 'Shop not found.' });
      }

      if (profile?.role !== 'admin' && shop.agent_id !== agentId) {
        return res.status(403).json({ success: false, error: 'Forbidden: You do not manage this shop.' });
      }

      const { data: created, error: insertErr } = await adminClient
        .from('shop_notes')
        .insert([
          {
            shop_id: shopId,
            agent_id: agentId,
            note: rawNote,
            follow_up_date: rawFollowUp,
            done: false,
          },
        ])
        .select('*')
        .single();

      if (insertErr) {
        return res.status(500).json({ success: false, error: insertErr.message });
      }

      return res.status(201).json({
        success: true,
        note: {
          ...created,
          shop: { id: shop.id, shop_name: shop.shop_name, location: shop.location },
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.patch('/api/agent/notes/:noteId', requireAgent, async (req: Request, res: Response) => {
    const adminClient = getSupabaseAdminClient();
    if (!adminClient) {
      return res.status(503).json({ success: false, error: 'SUPABASE_SERVICE_ROLE_KEY not set' });
    }

    const agentId = (req as any).agentId;
    const profile = (req as any).profile;
    const { noteId } = req.params;
    const { done, note, follow_up_date } = req.body || {};

    try {
      const { data: existing, error: fetchErr } = await adminClient
        .from('shop_notes')
        .select('*')
        .eq('id', noteId)
        .maybeSingle();

      if (fetchErr || !existing) {
        return res.status(404).json({ success: false, error: 'Note not found.' });
      }

      if (profile?.role !== 'admin' && existing.agent_id !== agentId) {
        return res.status(403).json({ success: false, error: 'Forbidden: You do not own this note.' });
      }

      const updates: Record<string, any> = {};
      if (typeof done === 'boolean') updates.done = done;
      if (note !== undefined) {
        const cleanNote = String(note).trim();
        if (!cleanNote) {
          return res.status(400).json({ success: false, error: 'Note text cannot be empty.' });
        }
        updates.note = cleanNote;
      }
      if (follow_up_date !== undefined) {
        updates.follow_up_date = follow_up_date ? String(follow_up_date).trim().slice(0, 10) : null;
      }

      const { data: updated, error: updateErr } = await adminClient
        .from('shop_notes')
        .update(updates)
        .eq('id', noteId)
        .select('*, shops(id, shop_name, location)')
        .single();

      if (updateErr) {
        return res.status(500).json({ success: false, error: updateErr.message });
      }

      return res.status(200).json({
        success: true,
        note: {
          ...updated,
          shop: Array.isArray((updated as any).shops) ? (updated as any).shops[0] : (updated as any).shops,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/agent/notes/:noteId', requireAgent, async (req: Request, res: Response) => {
    const adminClient = getSupabaseAdminClient();
    if (!adminClient) {
      return res.status(503).json({ success: false, error: 'SUPABASE_SERVICE_ROLE_KEY not set' });
    }

    const agentId = (req as any).agentId;
    const profile = (req as any).profile;
    const { noteId } = req.params;

    try {
      const { data: existing, error: fetchErr } = await adminClient
        .from('shop_notes')
        .select('id, agent_id')
        .eq('id', noteId)
        .maybeSingle();

      if (fetchErr || !existing) {
        return res.status(404).json({ success: false, error: 'Note not found.' });
      }

      if (profile?.role !== 'admin' && existing.agent_id !== agentId) {
        return res.status(403).json({ success: false, error: 'Forbidden: You do not own this note.' });
      }

      const { error: delErr } = await adminClient
        .from('shop_notes')
        .delete()
        .eq('id', noteId);

      if (delErr) {
        return res.status(500).json({ success: false, error: delErr.message });
      }

      return res.status(200).json({ success: true, deletedId: noteId });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Strict API 404 handler: ensure API endpoints NEVER return HTML error pages or index.html
  app.all('/api/*', (req: Request, res: Response) => {
    return res.status(404).json({
      success: false,
      error: `API endpoint '${req.method} ${req.path}' not found.`,
      code: 'API_NOT_FOUND',
    });
  });

  // API Error handler middleware: catches uncaught errors on any /api route and guarantees clean JSON
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      console.error('[Express API Exception]', err);
      return res.status(err.status || 500).json({
        success: false,
        error: err.message || 'An internal API error occurred.',
        code: err.code || 'INTERNAL_SERVER_ERROR',
        details: err.details || null,
      });
    }
    next(err);
  });

  // Vite Integration: In Dev, mount vite.middlewares; in Prod, serve dist/
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  // Seed demo agents into Supabase public.agents on startup if client available
  const startupDbClient = getSupabaseAdminClient() || getSupabaseAnonClient();
  if (startupDbClient) {
    (async () => {
      try {
        for (const demo of DEMO_AGENTS) {
          const { data: existing } = await startupDbClient
            .from('agents')
            .select('id')
            .eq('id', demo.id)
            .maybeSingle();

          if (!existing) {
            await startupDbClient.from('agents').insert([
              {
                id: demo.id,
                full_name: demo.full_name,
                email: demo.email,
                phone_number: demo.phone_number,
                is_active: true,
              },
            ]);
            console.log(`[Seed] Seeded demo agent ${demo.full_name} (${demo.id})`);
          }
        }
      } catch (seedErr: any) {
        console.warn('[Seed] Supabase agent auto-seed note:', seedErr.message);
      }
    })();
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OpticPortal server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();