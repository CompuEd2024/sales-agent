import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Building2,
  MapPin,
  Mail,
  Sliders,
  DollarSign,
  Palette,
  ExternalLink,
  Search,
  CheckCircle2,
  Eye,
  AlertTriangle,
  PauseCircle,
  PlayCircle,
  Clock,
  Calendar,
  Globe,
  Wrench,
  ShieldAlert,
  Info,
  HelpCircle,
  ChevronDown,
  Users,
  Copy,
  Check,
  X,
  ShieldCheck,
  Pencil,
  Trash2,
  Plus,
  Phone,
  User,
  Briefcase,
  Loader2,
  KeyRound,
  EyeOff,
  Activity,
  StickyNote,
  CalendarClock,
  TrendingUp,
  MessageCircle,
  QrCode,
} from 'lucide-react';
import {
  ShopWithConfig,
  SUBSCRIPTION_TIERS,
  SubscriptionStatus,
  StaffCredentialResult,
  StaffRole,
  Agent,
  getAgentCurrency,
  getTierPrice,
  getShopMonthlyAmount,
  isShopAtRisk,
  getDaysSinceLastActivity,
  getShopLastActivityAt,
  ShopNote,
  getLocalTodayISODate,
  isShopUpgradeOpportunity,
  buildUpgradeWhatsAppPayload,
  ShopSubscriptionLedger,
} from '../types/database';
import { useLanguage } from '../lib/i18n';
import { portalService } from '../lib/supabase';
import { resolveAgentCountryDialCode } from './OnboardShopForm';
import { useAgent } from '../context/AgentContext';
import { useToast } from './Toast';
import { ShareStorefrontModal } from './ShareStorefrontModal';
import { WhatsAppTemplatesModal } from './WhatsAppTemplatesModal';

interface ShopsDirectoryProps {
  shops: ShopWithConfig[];
  ledger?: ShopSubscriptionLedger[];
  currentAgent?: Agent | null;
  onOpenChangeTier: (shop: ShopWithConfig) => void;
  onOpenConfigureBranding: (shop: ShopWithConfig) => void;
  onOpenRecordPayment: (shop: ShopWithConfig) => void;
  onOpenLivePreview: (shop: ShopWithConfig) => void;
  onOpenHoldModal: (shop: ShopWithConfig) => void;
  onToggleActive?: (shopId: string, currentStatus: boolean) => void;
  onUpdateSubscriptionStatus: (
    shopId: string,
    newStatus: SubscriptionStatus,
    reason?: string
  ) => Promise<boolean>;
  onUpdateShopStaff?: (shopId: string, staff: StaffCredentialResult[]) => void;
  notes?: ShopNote[];
  onAddShopNote?: (
    shopId: string,
    payload: { note: string; follow_up_date?: string | null }
  ) => Promise<boolean>;
  onToggleNoteDone?: (noteId: string, done: boolean) => Promise<boolean>;
  onDeleteNote?: (noteId: string) => Promise<boolean>;
  onNavigateToOnboard: () => void;
  externalFilter?: {
    tier?: string;
    status?: 'all' | 'active' | 'maintenance' | 'suspended' | 'at_risk';
    nonce: number;
  } | null;
}

export function ShopsDirectory({
  shops,
  ledger = [],
  currentAgent,
  onOpenChangeTier,
  onOpenConfigureBranding,
  onOpenRecordPayment,
  onOpenLivePreview,
  onOpenHoldModal,
  onUpdateSubscriptionStatus,
  onUpdateShopStaff,
  notes = [],
  onAddShopNote,
  onToggleNoteDone,
  onDeleteNote,
  onNavigateToOnboard,
  externalFilter,
}: ShopsDirectoryProps) {
  const { t, isRTL, language } = useLanguage();
  const { showToast } = useToast();
  const { currentAgent: contextAgent } = useAgent();
  const effectiveAgent = currentAgent || contextAgent;
  const agentDialInfo = resolveAgentCountryDialCode(effectiveAgent);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'maintenance' | 'suspended' | 'at_risk' | 'upgrade_opportunity'>('all');

  useEffect(() => {
    if (!externalFilter) return;
    if (externalFilter.tier !== undefined) {
      setTierFilter(externalFilter.tier);
    }
    if (externalFilter.status !== undefined) {
      setStatusFilter(externalFilter.status);
    }
  }, [externalFilter]);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [updatingShopId, setUpdatingShopId] = useState<string | null>(null);
  const [hoveredTooltipShopId, setHoveredTooltipShopId] = useState<string | null>(null);
  const [selectedShopForStaff, setSelectedShopForStaff] = useState<ShopWithConfig | null>(null);
  const [staffCredentialsList, setStaffCredentialsList] = useState<StaffCredentialResult[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [copiedStaffIdx, setCopiedStaffIdx] = useState<number | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Notes & follow-ups per shop
  const [noteDrafts, setNoteDrafts] = useState<Record<string, { note: string; follow_up_date: string }>>({});
  const [savingNoteShopId, setSavingNoteShopId] = useState<string | null>(null);
  const [busyNoteId, setBusyNoteId] = useState<string | null>(null);
  const [expandedNotesShops, setExpandedNotesShops] = useState<Record<string, boolean>>({});
  const [selectedShopForNotes, setSelectedShopForNotes] = useState<ShopWithConfig | null>(null);
  const [selectedShopForShare, setSelectedShopForShare] = useState<ShopWithConfig | null>(null);
  const [selectedShopForTemplates, setSelectedShopForTemplates] = useState<ShopWithConfig | null>(null);
  const todayStr = getLocalTodayISODate();

  const handleCopyText = (text: string, fieldKey: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => {
      setCopiedField((prev) => (prev === fieldKey ? null : prev));
    }, 2000);
  };

  // Staff Editing & Addition State
  const [editingStaffIdx, setEditingStaffIdx] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{
    full_name: string;
    role: StaffRole;
    email: string;
    phone_number: string;
  }>({
    full_name: '',
    role: 'optometrist',
    email: '',
    phone_number: '',
  });

  const [isAddingNewStaff, setIsAddingNewStaff] = useState(false);
  const [newStaffForm, setNewStaffForm] = useState<{
    full_name: string;
    role: StaffRole;
    email: string;
    phone_number: string;
  }>({
    full_name: '',
    role: 'optometrist',
    email: '',
    phone_number: `${agentDialInfo.dialCode} `,
  });

  const [isSavingStaff, setIsSavingStaff] = useState(false);
  const [staffStatusMsg, setStaffStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Quick Officer Modals (accessible directly from each shop card & staff modal)
  const [officerEditTarget, setOfficerEditTarget] = useState<{
    shop: ShopWithConfig;
    officer: StaffCredentialResult;
  } | null>(null);
  const [officerEditForm, setOfficerEditForm] = useState<{
    full_name: string;
    role: StaffRole;
    email: string;
  }>({
    full_name: '',
    role: 'optometrist',
    email: '',
  });
  const [officerEditSaving, setOfficerEditSaving] = useState(false);
  const [officerEditError, setOfficerEditError] = useState<string | null>(null);

  const [officerRemoveTarget, setOfficerRemoveTarget] = useState<{
    shop: ShopWithConfig;
    officer: StaffCredentialResult;
  } | null>(null);
  const [officerRemoveDeleting, setOfficerRemoveDeleting] = useState(false);

  const [officerPasswordTarget, setOfficerPasswordTarget] = useState<{
    shop: ShopWithConfig;
    officer: StaffCredentialResult;
  } | null>(null);
  const [officerNewPassword, setOfficerNewPassword] = useState('');
  const [showOfficerPassword, setShowOfficerPassword] = useState(false);
  const [officerPasswordSaving, setOfficerPasswordSaving] = useState(false);
  const [officerPasswordError, setOfficerPasswordError] = useState<string | null>(null);

  // Email verification state
  const [newStaffEmailCheck, setNewStaffEmailCheck] = useState<{
    isChecking: boolean;
    error: string | null;
    isAvailable: boolean;
  }>({
    isChecking: false,
    error: null,
    isAvailable: false,
  });

  const [editStaffEmailCheck, setEditStaffEmailCheck] = useState<{
    isChecking: boolean;
    error: string | null;
    isAvailable: boolean;
  }>({
    isChecking: false,
    error: null,
    isAvailable: true,
  });

  const checkNewEmailTimerRef = useRef<any>(null);
  const checkEditEmailTimerRef = useRef<any>(null);

  // Helper to search across all previously stored or unverified local rosters across all shops
  const findStaffInAllStoredRosters = useCallback((targetEmail: string, currentShopId?: string): { full_name?: string } | null => {
    try {
      const storedRostersRaw = localStorage.getItem('optic_portal_staff_roster');
      if (storedRostersRaw) {
        const parsedRosters = JSON.parse(storedRostersRaw);
        for (const sId of Object.keys(parsedRosters)) {
          // If currentShopId is given, we still check other shops, and let staffCredentialsList check the current shop
          const roster = parsedRosters[sId];
          if (Array.isArray(roster)) {
            const match = roster.find(
              (st: any) => st.email && String(st.email).trim().toLowerCase() === targetEmail.trim().toLowerCase()
            );
            if (match && sId !== currentShopId) return match;
          }
        }
      }
    } catch {}
    return null;
  }, []);

  const verifyNewStaffEmailAsync = useCallback(
    async (emailToVerify: string) => {
      const cleanEmail = emailToVerify.trim().toLowerCase();
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

      if (!cleanEmail) {
        setNewStaffEmailCheck({ isChecking: false, error: null, isAvailable: false });
        return;
      }

      if (!emailRegex.test(cleanEmail)) {
        setNewStaffEmailCheck({
          isChecking: false,
          error: isRTL ? 'صيغة البريد الإلكتروني غير صحيحة (مثال: name@domain.com).' : 'Invalid email syntax format (e.g. name@domain.com).',
          isAvailable: false,
        });
        return;
      }

      // Check 1: Duplicate against current shop's roster
      const duplicateInCurrentRoster = staffCredentialsList.some(
        (s) => s.email && s.email.trim().toLowerCase() === cleanEmail
      );
      if (duplicateInCurrentRoster) {
        setNewStaffEmailCheck({
          isChecking: false,
          error: isRTL
            ? `البريد الإلكتروني (${cleanEmail}) مسجل بالفعل لموظف آخر في هذا المتجر.`
            : `Duplicate email: "${cleanEmail}" is already assigned to a staff member in this boutique roster.`,
          isAvailable: false,
        });
        return;
      }

      // Check 2: Duplicate against current shop's owner email
      if (
        selectedShopForStaff?.owner_email &&
        selectedShopForStaff.owner_email.trim().toLowerCase() === cleanEmail
      ) {
        setNewStaffEmailCheck({
          isChecking: false,
          error: isRTL
            ? `البريد الإلكتروني (${cleanEmail}) يطابق بريد مالك المتجر. يجب تخصيص بريد إلكتروني مستقل لكل موظف.`
            : `Duplicate email: "${cleanEmail}" matches the boutique owner's email. Staff accounts must have a distinct email.`,
          isAvailable: false,
        });
        return;
      }

      // Check 3: Duplicate against any previously stored or unverified staff across all shops in local storage
      const matchStoredStaff = findStaffInAllStoredRosters(cleanEmail, selectedShopForStaff?.id);
      if (matchStoredStaff) {
        setNewStaffEmailCheck({
          isChecking: false,
          error: isRTL
            ? `هذا البريد الإلكتروني مسجل مسبقاً لموظف (${matchStoredStaff.full_name || 'موظف'}) مخزن في النظام.`
            : `This email is already associated with previously stored staff member (${matchStoredStaff.full_name || 'Staff'}).`,
          isAvailable: false,
        });
        return;
      }

      // Check 4: Query Database / Supabase Users via checkFieldAvailability
      setNewStaffEmailCheck({ isChecking: true, error: null, isAvailable: false });

      try {
        const res = await portalService.checkFieldAvailability('email', cleanEmail, {
          excludeShopId: selectedShopForStaff?.id,
        });

        if (!res.available) {
          setNewStaffEmailCheck({
            isChecking: false,
            error: isRTL
              ? (res.messageAr || `هذا البريد الإلكتروني مسجل بالفعل في مستخدمي Supabase (${cleanEmail}). يرجى اختيار بريد مختلف.`)
              : (res.message || `This email is already registered in Supabase users (${cleanEmail}). Please choose a different email.`),
            isAvailable: false,
          });
        } else {
          setNewStaffEmailCheck({ isChecking: false, error: null, isAvailable: true });
        }
      } catch (err) {
        console.warn('Email availability check notice:', err);
        setNewStaffEmailCheck({ isChecking: false, error: null, isAvailable: true });
      }
    },
    [isRTL, staffCredentialsList, selectedShopForStaff, findStaffInAllStoredRosters]
  );

  const handleNewStaffEmailChange = (val: string) => {
    setNewStaffForm((prev) => ({ ...prev, email: val }));
    setNewStaffEmailCheck({ isChecking: false, error: null, isAvailable: false });

    if (checkNewEmailTimerRef.current) {
      clearTimeout(checkNewEmailTimerRef.current);
    }

    if (val.trim().includes('@')) {
      checkNewEmailTimerRef.current = setTimeout(() => {
        verifyNewStaffEmailAsync(val);
      }, 400);
    }
  };

  const handleNewStaffEmailBlur = () => {
    if (checkNewEmailTimerRef.current) {
      clearTimeout(checkNewEmailTimerRef.current);
    }
    if (newStaffForm.email.trim()) {
      verifyNewStaffEmailAsync(newStaffForm.email);
    }
  };

  const verifyEditStaffEmailAsync = useCallback(
    async (emailToVerify: string, currentIndex: number | null) => {
      const cleanEmail = emailToVerify.trim().toLowerCase();
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

      if (!cleanEmail) {
        setEditStaffEmailCheck({ isChecking: false, error: null, isAvailable: false });
        return;
      }

      if (!emailRegex.test(cleanEmail)) {
        setEditStaffEmailCheck({
          isChecking: false,
          error: isRTL ? 'صيغة البريد الإلكتروني غير صحيحة.' : 'Invalid email syntax format.',
          isAvailable: false,
        });
        return;
      }

      // Check against current shop's roster (excluding this staff member)
      const duplicateInCurrentRoster = staffCredentialsList.some(
        (s, idx) => idx !== currentIndex && s.email && s.email.trim().toLowerCase() === cleanEmail
      );
      if (duplicateInCurrentRoster) {
        setEditStaffEmailCheck({
          isChecking: false,
          error: isRTL
            ? `البريد الإلكتروني (${cleanEmail}) مسجل بالفعل لموظف آخر في هذا المتجر.`
            : `Duplicate email: "${cleanEmail}" is already assigned to another staff member.`,
          isAvailable: false,
        });
        return;
      }

      // Check against shop owner email
      if (
        selectedShopForStaff?.owner_email &&
        selectedShopForStaff.owner_email.trim().toLowerCase() === cleanEmail
      ) {
        setEditStaffEmailCheck({
          isChecking: false,
          error: isRTL
            ? `البريد الإلكتروني يطابق بريد مالك المتجر. يجب تخصيص بريد مستقل للموظف.`
            : `Email matches the boutique owner's email.`,
          isAvailable: false,
        });
        return;
      }

      // Check against other stored rosters
      const matchStoredStaff = findStaffInAllStoredRosters(cleanEmail, selectedShopForStaff?.id);
      if (matchStoredStaff) {
        setEditStaffEmailCheck({
          isChecking: false,
          error: isRTL
            ? `هذا البريد الإلكتروني مسجل مسبقاً لموظف (${matchStoredStaff.full_name || 'موظف'}) مخزن في النظام.`
            : `This email is already associated with previously stored staff member (${matchStoredStaff.full_name || 'Staff'}).`,
          isAvailable: false,
        });
        return;
      }

      // Query database
      setEditStaffEmailCheck({ isChecking: true, error: null, isAvailable: false });
      try {
        const res = await portalService.checkFieldAvailability('email', cleanEmail, {
          excludeShopId: selectedShopForStaff?.id,
        });
        if (!res.available) {
          setEditStaffEmailCheck({
            isChecking: false,
            error: isRTL
              ? (res.messageAr || `هذا البريد مسجل في قاعدة البيانات (${cleanEmail}).`)
              : (res.message || `This email is already registered in the database (${cleanEmail}).`),
            isAvailable: false,
          });
        } else {
          setEditStaffEmailCheck({ isChecking: false, error: null, isAvailable: true });
        }
      } catch {
        setEditStaffEmailCheck({ isChecking: false, error: null, isAvailable: true });
      }
    },
    [isRTL, staffCredentialsList, selectedShopForStaff, findStaffInAllStoredRosters]
  );

  const handleEditStaffEmailChange = (val: string) => {
    setEditForm((prev) => ({ ...prev, email: val }));
    setEditStaffEmailCheck({ isChecking: false, error: null, isAvailable: false });

    if (checkEditEmailTimerRef.current) {
      clearTimeout(checkEditEmailTimerRef.current);
    }

    if (val.trim().includes('@')) {
      checkEditEmailTimerRef.current = setTimeout(() => {
        verifyEditStaffEmailAsync(val, editingStaffIdx);
      }, 400);
    }
  };

  const handleEditStaffEmailBlur = () => {
    if (checkEditEmailTimerRef.current) {
      clearTimeout(checkEditEmailTimerRef.current);
    }
    if (editForm.email.trim()) {
      verifyEditStaffEmailAsync(editForm.email, editingStaffIdx);
    }
  };

  const handleOpenStaffModal = async (shop: ShopWithConfig) => {
    setSelectedShopForStaff(shop);
    setIsLoadingStaff(true);
    setEditingStaffIdx(null);
    setIsAddingNewStaff(false);
    setStaffStatusMsg(null);
    setNewStaffEmailCheck({ isChecking: false, error: null, isAvailable: false });
    setEditStaffEmailCheck({ isChecking: false, error: null, isAvailable: true });
    try {
      const creds = await portalService.getShopStaffCredentials(shop.id, shop);
      setStaffCredentialsList(creds);
    } catch {
      setStaffCredentialsList([]);
    } finally {
      setIsLoadingStaff(false);
    }
  };

  const startEditStaff = (idx: number, cred: StaffCredentialResult) => {
    setEditingStaffIdx(idx);
    setIsAddingNewStaff(false);
    setEditStaffEmailCheck({ isChecking: false, error: null, isAvailable: true });
    setEditForm({
      full_name: cred.full_name || '',
      role: cred.role || 'optometrist',
      email: cred.email || '',
      phone_number: cred.phone_number || '',
    });
    setStaffStatusMsg(null);
  };

  const handleSaveStaffEdit = async () => {
    if (!selectedShopForStaff || editingStaffIdx === null) return;
    const current = staffCredentialsList[editingStaffIdx];
    if (!current) return;

    const cleanName = editForm.full_name.trim();
    const cleanEmail = editForm.email.trim().toLowerCase();

    if (!cleanName) {
      setStaffStatusMsg({ text: isRTL ? 'يرجى إدخال اسم الموظف' : 'Staff member name is required', type: 'error' });
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setStaffStatusMsg({ text: isRTL ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Valid email is required', type: 'error' });
      return;
    }

    // Check duplicate email against other staff in roster
    const duplicateEmail = staffCredentialsList.some(
      (s, idx) => idx !== editingStaffIdx && s.email.trim().toLowerCase() === cleanEmail
    );
    if (duplicateEmail) {
      setStaffStatusMsg({
        text: isRTL
          ? `البريد الإلكتروني (${cleanEmail}) مسجل بالفعل لموظف آخر في هذا المتجر.`
          : `Email "${cleanEmail}" is already assigned to another staff member.`,
        type: 'error',
      });
      return;
    }

    // Check duplicate name against other staff in roster
    const duplicateName = staffCredentialsList.some(
      (s, idx) => idx !== editingStaffIdx && s.full_name.trim().toLowerCase() === cleanName.toLowerCase()
    );
    if (duplicateName) {
      setStaffStatusMsg({
        text: isRTL
          ? `الاسم (${cleanName}) مستخدم بالفعل لموظف آخر في هذا المتجر.`
          : `A staff member with the name "${cleanName}" already exists.`,
        type: 'error',
      });
      return;
    }

    setIsSavingStaff(true);
    setStaffStatusMsg(null);
    try {
      await portalService.updateShopStaffCredential(selectedShopForStaff.id, {
        id: current.id,
        userId: current.userId,
        full_name: cleanName,
        role: editForm.role,
        email: cleanEmail,
        phone_number: editForm.phone_number.trim() || undefined,
      });

      const updated = [...staffCredentialsList];
      updated[editingStaffIdx] = {
        ...current,
        full_name: cleanName,
        role: editForm.role,
        email: cleanEmail,
        phone_number: editForm.phone_number.trim() || undefined,
      };
      setStaffCredentialsList(updated);
      onUpdateShopStaff?.(selectedShopForStaff.id, updated);
      setEditingStaffIdx(null);
      const successMsg = isRTL ? 'تم حفظ التعديلات بنجاح' : 'Officer details updated successfully.';
      setStaffStatusMsg({
        text: successMsg,
        type: 'success',
      });
      showToast(t('toastOfficerUpdated'), successMsg, 'success');
      setTimeout(() => setStaffStatusMsg(null), 3500);
    } catch (err: any) {
      console.error('Error updating staff member:', err);
      const errMsg = err?.message || (isRTL ? 'حدث خطأ أثناء حفظ التعديل' : 'Failed to update officer credentials.');
      setStaffStatusMsg({
        text: errMsg,
        type: 'error',
      });
      showToast(t('toastOfficerActionFailed'), errMsg, 'error');
    } finally {
      setIsSavingStaff(false);
    }
  };

  const handleCreateNewStaff = async () => {
    if (!selectedShopForStaff) return;
    const cleanName = newStaffForm.full_name.trim();
    const cleanEmail = newStaffForm.email.trim().toLowerCase();

    if (!cleanName) {
      setStaffStatusMsg({ text: isRTL ? 'يرجى إدخال اسم الموظف' : 'Staff member name is required', type: 'error' });
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setStaffStatusMsg({ text: isRTL ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Valid email is required', type: 'error' });
      return;
    }

    // 1. Check duplicate email against current shop roster
    const duplicateEmailInRoster = staffCredentialsList.some(
      (s) => s.email.trim().toLowerCase() === cleanEmail
    );
    if (duplicateEmailInRoster) {
      setStaffStatusMsg({
        text: isRTL
          ? `البريد الإلكتروني (${cleanEmail}) مسجل بالفعل لموظف آخر في هذا المتجر.`
          : `Email "${cleanEmail}" is already assigned to a staff member in this shop.`,
        type: 'error',
      });
      return;
    }

    // 2. Check if email matches shop owner email
    if (selectedShopForStaff.owner_email && selectedShopForStaff.owner_email.trim().toLowerCase() === cleanEmail) {
      setStaffStatusMsg({
        text: isRTL
          ? `البريد الإلكتروني (${cleanEmail}) مطابق لبريد مالك المتجر. يرجى استخدام بريد إلكتروني مختلف للموظف.`
          : `Email "${cleanEmail}" is the shop owner's email. Please use a unique email for each staff member.`,
        type: 'error',
      });
      return;
    }

    // 3. Check duplicate name in current shop roster
    const duplicateNameInRoster = staffCredentialsList.some(
      (s) => s.full_name.trim().toLowerCase() === cleanName.toLowerCase()
    );
    if (duplicateNameInRoster) {
      setStaffStatusMsg({
        text: isRTL
          ? `الاسم (${cleanName}) مستخدم بالفعل لموظف في هذا المتجر. يرجى تمييز الاسم.`
          : `A staff member with the name "${cleanName}" already exists in this shop. Please provide a distinct name.`,
        type: 'error',
      });
      return;
    }

    setIsSavingStaff(true);
    setStaffStatusMsg(null);

    // 4. Pre-check email uniqueness against Supabase users via checkFieldAvailability
    try {
      const avail = await portalService.checkFieldAvailability('email', cleanEmail, {
        excludeShopId: selectedShopForStaff.id,
      });
      if (!avail.available) {
        setIsSavingStaff(false);
        setStaffStatusMsg({
          text: isRTL
            ? avail.messageAr || `هذا البريد الإلكتروني مسجل مسبقاً في قاعدة البيانات (${cleanEmail}). يرجى اختيار بريد آخر.`
            : avail.message || `This email (${cleanEmail}) is already registered in the database. Please choose a different email.`,
          type: 'error',
        });
        return;
      }
    } catch (checkErr) {
      console.warn('Email availability pre-check warning:', checkErr);
    }

    try {
      const rawPhone = newStaffForm.phone_number.trim();
      const isJustDial = rawPhone === agentDialInfo.dialCode.trim() || rawPhone === agentDialInfo.dialCode;
      const cleanPhone = isJustDial ? undefined : (rawPhone || undefined);

      const created = await portalService.addShopStaffCredential(selectedShopForStaff.id, {
        full_name: cleanName,
        role: newStaffForm.role,
        email: cleanEmail,
        phone_number: cleanPhone,
      });

      const updatedList = [...staffCredentialsList, created];
      setStaffCredentialsList(updatedList);
      onUpdateShopStaff?.(selectedShopForStaff.id, updatedList);
      setIsAddingNewStaff(false);
      setNewStaffForm({
        full_name: '',
        role: 'optometrist',
        email: '',
        phone_number: `${agentDialInfo.dialCode} `,
      });
      setStaffStatusMsg({
        text: isRTL ? 'تمت إضافة الموظف الجديد بنجاح' : 'New staff member added successfully',
        type: 'success',
      });
      setTimeout(() => setStaffStatusMsg(null), 3500);
    } catch (err: any) {
      console.error('Error adding staff member:', err);
      setStaffStatusMsg({
        text: err?.message || (isRTL ? 'حدث خطأ أثناء إضافة الموظف' : 'Failed to add staff member'),
        type: 'error',
      });
    } finally {
      setIsSavingStaff(false);
    }
  };

  // Officer Quick Modal Openers & Handlers (for both Shop Card and Staff Modal)
  const openOfficerEditModal = (shop: ShopWithConfig, officer: StaffCredentialResult) => {
    setOfficerEditTarget({ shop, officer });
    setOfficerEditForm({
      full_name: officer.full_name || '',
      role: officer.role || 'optometrist',
      email: officer.email || '',
    });
    setOfficerEditError(null);
  };

  const handleConfirmOfficerEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!officerEditTarget) return;

    const { shop, officer } = officerEditTarget;
    const cleanName = officerEditForm.full_name.trim();
    const cleanEmail = officerEditForm.email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!cleanName) {
      setOfficerEditError(isRTL ? 'يرجى إدخال الاسم الكامل للمسؤول.' : 'Officer full name is required.');
      return;
    }
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setOfficerEditError(isRTL ? 'يرجى إدخال بريد إلكتروني صحيح.' : 'Please enter a valid email address.');
      return;
    }

    setOfficerEditSaving(true);
    setOfficerEditError(null);
    try {
      await portalService.updateShopStaffCredential(shop.id, {
        id: officer.id,
        userId: officer.userId,
        full_name: cleanName,
        role: officerEditForm.role,
        email: cleanEmail,
      });

      const matchOfficer = (s: StaffCredentialResult) =>
        (officer.userId && s.userId === officer.userId) ||
        (officer.id && s.id === officer.id) ||
        s.email === officer.email;

      const updatedShopStaff = (shop.staff || []).map((s) =>
        matchOfficer(s)
          ? { ...s, full_name: cleanName, role: officerEditForm.role, email: cleanEmail }
          : s
      );
      onUpdateShopStaff?.(shop.id, updatedShopStaff);

      if (selectedShopForStaff?.id === shop.id) {
        setStaffCredentialsList((prev) =>
          prev.map((s) =>
            matchOfficer(s)
              ? { ...s, full_name: cleanName, role: officerEditForm.role, email: cleanEmail }
              : s
          )
        );
      }

      setOfficerEditTarget(null);
      showToast(
        t('toastOfficerUpdated'),
        isRTL
          ? `تم تحديث بيانات ${cleanName} بنجاح.`
          : `${cleanName}'s details were updated successfully.`,
        'success'
      );
    } catch (err: any) {
      const msg = err?.message || (isRTL ? 'فشل تحديث بيانات المسؤول.' : 'Failed to update officer.');
      setOfficerEditError(msg);
      showToast(t('toastOfficerActionFailed'), msg, 'error');
    } finally {
      setOfficerEditSaving(false);
    }
  };

  const openOfficerRemoveModal = (shop: ShopWithConfig, officer: StaffCredentialResult) => {
    setOfficerRemoveTarget({ shop, officer });
  };

  const handleConfirmOfficerRemove = async () => {
    if (!officerRemoveTarget) return;
    const { shop, officer } = officerRemoveTarget;
    const identifier = officer.userId || officer.id || officer.email;

    setOfficerRemoveDeleting(true);
    try {
      await portalService.deleteShopStaffCredential(shop.id, identifier);

      const isNotRemovedOfficer = (s: StaffCredentialResult) => {
        if (officer.userId && s.userId) return s.userId !== officer.userId;
        if (officer.id && s.id) return s.id !== officer.id;
        return s.email !== officer.email;
      };

      const updatedShopStaff = (shop.staff || []).filter(isNotRemovedOfficer);
      onUpdateShopStaff?.(shop.id, updatedShopStaff);

      if (selectedShopForStaff?.id === shop.id) {
        setStaffCredentialsList((prev) => prev.filter(isNotRemovedOfficer));
        setEditingStaffIdx(null);
      }

      setOfficerRemoveTarget(null);
      showToast(
        t('toastOfficerRemoved'),
        isRTL
          ? `تم حذف حساب ${officer.full_name} نهائياً.`
          : `${officer.full_name} has been removed from ${shop.shop_name}.`,
        'success'
      );
    } catch (err: any) {
      const msg = err?.message || (isRTL ? 'فشل حذف المسؤول.' : 'Failed to remove officer.');
      showToast(t('toastOfficerActionFailed'), msg, 'error');
    } finally {
      setOfficerRemoveDeleting(false);
    }
  };

  const openOfficerPasswordModal = (shop: ShopWithConfig, officer: StaffCredentialResult) => {
    setOfficerPasswordTarget({ shop, officer });
    setOfficerNewPassword('');
    setShowOfficerPassword(false);
    setOfficerPasswordError(null);
  };

  const handleConfirmOfficerPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!officerPasswordTarget) return;
    const { officer } = officerPasswordTarget;
    const pwd = officerNewPassword.trim();

    if (pwd.length < 8) {
      setOfficerPasswordError(t('passwordMinError'));
      return;
    }

    setOfficerPasswordSaving(true);
    setOfficerPasswordError(null);
    try {
      await portalService.changeShopStaffPassword(officer.userId || officer.id || '', pwd);
      setOfficerPasswordTarget(null);
      setOfficerNewPassword('');
      showToast(
        t('toastPasswordUpdated'),
        isRTL
          ? `تم تحديث كلمة مرور ${officer.full_name} بنجاح.`
          : `Password updated for ${officer.full_name}.`,
        'success'
      );
    } catch (err: any) {
      const msg = err?.message || (isRTL ? 'فشل تغيير كلمة المرور.' : 'Failed to update password.');
      setOfficerPasswordError(msg);
      showToast(t('toastOfficerActionFailed'), msg, 'error');
    } finally {
      setOfficerPasswordSaving(false);
    }
  };

  const getOfficerRoleBadge = (role: StaffRole | string) => {
    switch (role) {
      case 'optometrist':
        return { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', label: isRTL ? 'أخصائي بصريات' : 'Optometrist' };
      case 'optician':
        return { bg: 'bg-cyan-50 text-cyan-800 border-cyan-200', label: isRTL ? 'فني نظارات' : 'Optician' };
      case 'shop_owner':
        return { bg: 'bg-indigo-50 text-indigo-800 border-indigo-200', label: isRTL ? 'مالك المتجر' : 'Shop Owner' };
      case 'marketer':
        return { bg: 'bg-purple-50 text-purple-800 border-purple-200', label: isRTL ? 'مسؤول تسويق' : 'Marketer' };
      default:
        return { bg: 'bg-slate-100 text-slate-800 border-slate-200', label: isRTL ? 'موظف' : String(role || 'Staff') };
    }
  };

  const getShopSubscriptionStatus = (shop: ShopWithConfig): SubscriptionStatus => {
    if (shop.subscription_status) return shop.subscription_status;
    if (shop.status === 'on_hold') return 'maintenance';
    if (!shop.is_active) return 'suspended';
    return 'active';
  };

  const activeCount = shops.filter((s) => getShopSubscriptionStatus(s) === 'active').length;
  const maintenanceCount = shops.filter((s) => getShopSubscriptionStatus(s) === 'maintenance').length;
  const suspendedCount = shops.filter((s) => getShopSubscriptionStatus(s) === 'suspended').length;
  const atRiskCount = shops.filter((s) => isShopAtRisk(s)).length;
  const upgradeOpportunityCount = shops.filter((s) => isShopUpgradeOpportunity(s)).length;
  const overdueTotalCount = maintenanceCount + suspendedCount;

  const formatLastActivity = (shop: ShopWithConfig) => {
    const lastAct = getShopLastActivityAt(shop);
    const daysSince = getDaysSinceLastActivity(shop);
    if (!lastAct) {
      return {
        dateText: t('noActivityRecorded'),
        relativeText: null as string | null,
        daysSince,
      };
    }
    const dateObj = new Date(lastAct);
    if (Number.isNaN(dateObj.getTime())) {
      return {
        dateText: t('noActivityRecorded'),
        relativeText: null as string | null,
        daysSince,
      };
    }
    const dateText = dateObj.toLocaleDateString(isRTL ? 'ar-JO' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    let relativeText: string | null = null;
    if (daysSince === 0) {
      relativeText = t('todayLabel');
    } else if (daysSince === 1) {
      relativeText = t('yesterdayLabel');
    } else if (daysSince != null) {
      relativeText = isRTL ? `منذ ${daysSince} يوم` : `${daysSince}d ago`;
    }
    return { dateText, relativeText, daysSince };
  };

  const getNotesForShop = (shopId: string): ShopNote[] => {
    return notes
      .filter((n) => n.shop_id === shopId)
      .sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        if (a.follow_up_date && b.follow_up_date) {
          return a.follow_up_date.localeCompare(b.follow_up_date);
        }
        if (a.follow_up_date) return -1;
        if (b.follow_up_date) return 1;
        return String(b.created_at || '').localeCompare(String(a.created_at || ''));
      });
  };

  const handleSubmitShopNote = async (e: React.FormEvent, shopId: string) => {
    e.preventDefault();
    if (!onAddShopNote || savingNoteShopId === shopId) return;
    const draft = noteDrafts[shopId] || { note: '', follow_up_date: '' };
    const cleanText = draft.note.trim();
    if (!cleanText) return;

    setSavingNoteShopId(shopId);
    try {
      const ok = await onAddShopNote(shopId, {
        note: cleanText,
        follow_up_date: draft.follow_up_date ? draft.follow_up_date.slice(0, 10) : null,
      });
      if (ok) {
        setNoteDrafts((prev) => ({
          ...prev,
          [shopId]: { note: '', follow_up_date: '' },
        }));
      }
    } finally {
      setSavingNoteShopId(null);
    }
  };

  const handleToggleShopNote = async (noteId: string, nextDone: boolean) => {
    if (!onToggleNoteDone || busyNoteId === noteId) return;
    setBusyNoteId(noteId);
    try {
      await onToggleNoteDone(noteId, nextDone);
    } finally {
      setBusyNoteId(null);
    }
  };

  const handleDeleteShopNoteItem = async (noteId: string) => {
    if (!onDeleteNote || busyNoteId === noteId) return;
    setBusyNoteId(noteId);
    try {
      await onDeleteNote(noteId);
    } finally {
      setBusyNoteId(null);
    }
  };

  const renderShopNotesContent = (shop: ShopWithConfig, inModal = false) => {
    const shopNotes = getNotesForShop(shop.id);
    const openCount = shopNotes.filter((n) => !n.done).length;
    const isExpanded = inModal || Boolean(expandedNotesShops[shop.id]);
    const visibleNotes = isExpanded ? shopNotes : shopNotes.slice(0, 3);
    const draft = noteDrafts[shop.id] || { note: '', follow_up_date: '' };
    const isSaving = savingNoteShopId === shop.id;

    return (
      <div className={inModal ? 'space-y-4' : 'pt-3 border-t border-slate-100 space-y-2.5'}>
        {!inModal && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <StickyNote className="w-3.5 h-3.5 text-amber-600" />
              <span>{t('notesAndFollowUpsTitle')}</span>
            </span>
            <span className="text-[11px] font-mono font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full tabular-nums">
              {openCount > 0 ? `${openCount} / ${shopNotes.length}` : shopNotes.length}
            </span>
          </div>
        )}

        {/* Add Note Form */}
        <form onSubmit={(e) => handleSubmitShopNote(e, shop.id)} className="space-y-2">
          <input
            type="text"
            value={draft.note}
            onChange={(e) =>
              setNoteDrafts((prev) => ({
                ...prev,
                [shop.id]: {
                  note: e.target.value,
                  follow_up_date: prev[shop.id]?.follow_up_date || '',
                },
              }))
            }
            placeholder={t('addNotePlaceholder')}
            className="w-full min-h-[44px] px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 placeholder:text-slate-400"
          />

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <input
                type="date"
                value={draft.follow_up_date}
                aria-label={t('followUpDateOptional')}
                title={t('followUpDateOptional')}
                onChange={(e) =>
                  setNoteDrafts((prev) => ({
                    ...prev,
                    [shop.id]: {
                      note: prev[shop.id]?.note || '',
                      follow_up_date: e.target.value,
                    },
                  }))
                }
                className="w-full min-h-[44px] px-3 py-1.5 text-xs font-mono text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 dir-ltr"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving || !draft.note.trim()}
              className="min-h-[48px] px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm sm:text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              ) : (
                <Plus className="w-4 h-4 shrink-0" />
              )}
              <span>{t('addNoteBtn')}</span>
            </button>
          </div>
        </form>

        {/* Notes List */}
        {shopNotes.length === 0 ? (
          <p className="text-[11px] text-slate-400 italic py-2 px-3 bg-slate-50 rounded-lg border border-dashed border-slate-200">
            {t('noNotesForShop')}
          </p>
        ) : (
          <div className="space-y-1.5">
            {visibleNotes.map((item) => {
              const due = item.follow_up_date ? String(item.follow_up_date).slice(0, 10) : null;
              const isOverdue = Boolean(!item.done && due && due < todayStr);
              const isDueToday = Boolean(!item.done && due && due === todayStr);
              const isBusy = busyNoteId === item.id;

              return (
                <div
                  key={item.id}
                  className={`p-2.5 rounded-xl border flex items-start gap-2 transition-colors ${
                    item.done
                      ? 'bg-slate-50/70 border-slate-200/70 opacity-75'
                      : isOverdue
                      ? 'bg-rose-50/50 border-rose-200'
                      : isDueToday
                      ? 'bg-amber-50/50 border-amber-200'
                      : 'bg-slate-50/90 border-slate-200/80'
                  }`}
                >
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleToggleShopNote(item.id, !item.done)}
                    aria-label={item.done ? t('completedLabel') : t('markDoneBtn')}
                    title={item.done ? t('completedLabel') : t('markDoneBtn')}
                    className={`min-h-[44px] min-w-[44px] rounded-xl border flex items-center justify-center shrink-0 transition-colors ${
                      item.done
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-white border-slate-300 text-transparent hover:border-emerald-500 hover:text-emerald-600'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                  </button>

                  <div className="min-w-0 flex-1 space-y-1 pt-0.5">
                    <p
                      className={`text-xs break-words leading-relaxed ${
                        item.done ? 'line-through text-slate-500' : 'text-slate-800 font-medium'
                      }`}
                    >
                      {item.note}
                    </p>
                    <div className="flex items-center flex-wrap gap-1.5 text-[10px]">
                      {due && (
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono font-semibold border tabular-nums ${
                            item.done
                              ? 'bg-slate-100 text-slate-500 border-slate-200'
                              : isOverdue
                              ? 'bg-rose-100 text-rose-800 border-rose-200'
                              : isDueToday
                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                              : 'bg-white text-slate-600 border-slate-200'
                          }`}
                        >
                          <CalendarClock className="w-3 h-3 shrink-0" />
                          <span>
                            {t('followUpLabel')} {due}
                            {isDueToday
                              ? ` · ${t('dueTodayBadge')}`
                              : isOverdue
                              ? ` · ${t('overdueBadge')}`
                              : ''}
                          </span>
                        </span>
                      )}
                      {item.created_at && (
                        <span className="text-slate-400 font-mono tabular-nums">
                          {new Date(item.created_at).toLocaleDateString(isRTL ? 'ar-JO' : 'en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleDeleteShopNoteItem(item.id)}
                    aria-label={t('officerRemoveBtn')}
                    title={t('officerRemoveBtn')}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 disabled:opacity-40"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}

            {!inModal && shopNotes.length > 3 && (
              <button
                type="button"
                onClick={() =>
                  setExpandedNotesShops((prev) => ({
                    ...prev,
                    [shop.id]: !prev[shop.id],
                  }))
                }
                className="w-full min-h-[44px] py-2 text-xs font-semibold text-[#4338ca] hover:bg-indigo-50 rounded-xl transition-colors"
              >
                {isExpanded
                  ? t('showFewerNotes')
                  : `${t('showAllNotes')} (${shopNotes.length})`}
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const filteredShops = shops.filter((shop) => {
    const matchesSearch =
      shop.shop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.owner_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (shop.config?.subdomain_slug && shop.config.subdomain_slug.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTier = tierFilter === 'all' || shop.tier === tierFilter;
    const currentStatus = getShopSubscriptionStatus(shop);
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'at_risk'
        ? isShopAtRisk(shop)
        : statusFilter === 'upgrade_opportunity'
        ? isShopUpgradeOpportunity(shop)
        : currentStatus === statusFilter;

    return matchesSearch && matchesTier && matchesStatus;
  });

  const handleQuickStatusChange = async (shop: ShopWithConfig, newStatus: SubscriptionStatus) => {
    if (newStatus === getShopSubscriptionStatus(shop)) return;

    // If changing to maintenance or suspended and needs detailed reason, agent can use the modal or quick set
    setUpdatingShopId(shop.id);
    const defaultReason =
      newStatus === 'maintenance'
        ? 'Late monthly subscription payment - diplomatic pause'
        : newStatus === 'suspended'
        ? 'Shop locked due to overdue subscription payment'
        : undefined;

    await onUpdateSubscriptionStatus(shop.id, newStatus, defaultReason);
    setUpdatingShopId(null);
  };

  return (
    <div className="space-y-6">
      {/* Diplomatic, At-Risk & Upgrade Opportunity Advisory Alerts */}
      {(overdueTotalCount > 0 || atRiskCount > 0 || upgradeOpportunityCount > 0) && (
        <div className="flex flex-col sm:flex-row sm:items-center flex-wrap gap-2">
          {overdueTotalCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex-1 min-w-[220px]">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {isRTL
                  ? `يوجد ${maintenanceCount} متجر في وضع الصيانة الدبلوماسي و ${suspendedCount} متجر معلق لعدم السداد.`
                  : `${maintenanceCount} boutique(s) in diplomatic maintenance, ${suspendedCount} suspended offline.`}
              </span>
            </div>
          )}

          {upgradeOpportunityCount > 0 && (
            <button
              type="button"
              onClick={() =>
                setStatusFilter(
                  statusFilter === 'upgrade_opportunity' ? 'all' : 'upgrade_opportunity'
                )
              }
              className={`min-h-[48px] flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-colors text-start ${
                statusFilter === 'upgrade_opportunity'
                  ? 'bg-indigo-600 border-indigo-700 text-white'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-900 hover:bg-indigo-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <TrendingUp
                  className={`w-4 h-4 shrink-0 ${
                    statusFilter === 'upgrade_opportunity' ? 'text-indigo-100' : 'text-indigo-600'
                  }`}
                />
                <span className="tabular-nums">
                  {isRTL
                    ? `${upgradeOpportunityCount} متجر برونزي/فضي مؤهل للترقية`
                    : `${upgradeOpportunityCount} Bronze/Silver shop(s) ready for Upgrade opportunity`}
                </span>
              </span>
              <span
                className={`text-[11px] underline shrink-0 ${
                  statusFilter === 'upgrade_opportunity' ? 'text-white' : 'text-indigo-700'
                }`}
              >
                {statusFilter === 'upgrade_opportunity'
                  ? isRTL
                    ? 'عرض الكل'
                    : 'Show all'
                  : isRTL
                  ? 'تصفية'
                  : 'Filter'}
              </span>
            </button>
          )}

          {atRiskCount > 0 && (
            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'at_risk' ? 'all' : 'at_risk')}
              className={`min-h-[48px] flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-colors text-start ${
                statusFilter === 'at_risk'
                  ? 'bg-rose-600 border-rose-700 text-white'
                  : 'bg-rose-50 border-rose-200 text-rose-900 hover:bg-rose-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <AlertTriangle className={`w-4 h-4 shrink-0 ${statusFilter === 'at_risk' ? 'text-rose-100' : 'text-rose-600'}`} />
                <span className="tabular-nums">
                  {isRTL
                    ? `${atRiskCount} متجر معرض للخطر (بدون نشاط منذ 3 أشهر أو أكثر)`
                    : `${atRiskCount} shop(s) flagged At risk (no activity in 3+ months)`}
                </span>
              </span>
              <span className={`text-[11px] underline shrink-0 ${statusFilter === 'at_risk' ? 'text-white' : 'text-rose-700'}`}>
                {statusFilter === 'at_risk' ? (isRTL ? 'عرض الكل' : 'Show all') : (isRTL ? 'تصفية' : 'Filter')}
              </span>
            </button>
          )}
        </div>
      )}

      {/* Search & Filter Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1 lg:max-w-md">
          <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={t('searchShopsPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full min-h-[44px] pl-9 rtl:pl-4 rtl:pr-9 pr-4 py-2.5 text-sm sm:text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 bg-slate-50/50"
          />
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:flex-wrap">
          {/* Status Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5 text-xs text-slate-500 font-medium">
            <span className="text-[11px] sm:text-xs">{isRTL ? 'الحالة:' : 'Status:'}</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full sm:w-auto min-h-[44px] px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-slate-800"
            >
              <option value="all">
                {t('allStatuses')} ({shops.length})
              </option>
              <option value="active">
                {t('statusActive')} ({activeCount})
              </option>
              <option value="maintenance">
                {t('statusMaintenance')} ({maintenanceCount})
              </option>
              <option value="suspended">
                {t('statusSuspended')} ({suspendedCount})
              </option>
              <option value="upgrade_opportunity">
                {t('upgradeOpportunityOnly')} ({upgradeOpportunityCount})
              </option>
              <option value="at_risk">
                {t('atRiskOnly')} ({atRiskCount})
              </option>
            </select>
          </div>

          {/* Tier Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5 text-xs text-slate-500 font-medium">
            <span className="text-[11px] sm:text-xs">{t('tierFilter')}</span>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="w-full sm:w-auto min-h-[44px] px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-slate-800"
            >
              <option value="all">
                {t('allTiers')} ({shops.length})
              </option>
              <option value="bronze">Bronze ($20 / 20 JOD)</option>
              <option value="silver">Silver ($60 / 60 JOD)</option>
              <option value="gold">Gold ($120 / 120 JOD)</option>
              <option value="platinum">Platinum ($200 / 200 JOD)</option>
            </select>
          </div>

          {/* View mode toggle */}
          <div className="col-span-2 sm:col-span-1 grid grid-cols-2 sm:flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`min-h-[46px] sm:min-h-[40px] px-4 py-2 text-sm sm:text-xs font-semibold rounded-lg transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('cardsView')}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`min-h-[46px] sm:min-h-[40px] px-4 py-2 text-sm sm:text-xs font-semibold rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('tableView')}
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredShops.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-2xs">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-900">{t('noShopsFound')}</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm || tierFilter !== 'all' || statusFilter !== 'all'
              ? isRTL
                ? 'جرّب تغيير كلمات البحث أو إزالة تصفية الباقة والحالة.'
                : 'Try changing your search keywords or clear status/tier filters.'
              : t('noShopsFoundDesc')}
          </p>
          <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5">
            {statusFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className="min-h-[48px] px-5 py-2.5 text-sm sm:text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                {t('allStatuses')}
              </button>
            )}
            <button
              type="button"
              onClick={onNavigateToOnboard}
              className="min-h-[52px] px-6 py-3 text-sm sm:text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors"
            >
              {t('onboardFirstBtn')}
            </button>
          </div>
        </div>
      )}

      {/* Cards View */}
      {viewMode === 'cards' && filteredShops.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredShops.map((shop) => {
            const tierDetails = SUBSCRIPTION_TIERS[shop.tier] || SUBSCRIPTION_TIERS.bronze;
            const primaryColor = shop.config?.primary_color || '#0284c7';
            const secondaryColor = shop.config?.secondary_color || '#0f172a';
            const slug = shop.config?.subdomain_slug || 'shop';
            const currentStatus = getShopSubscriptionStatus(shop);
            const isUpdating = updatingShopId === shop.id;
            const currency = getAgentCurrency(currentAgent, shop);
            const monthlyAmount = getShopMonthlyAmount(shop, currentAgent);
            const agentShare = Number((monthlyAmount * 0.5).toFixed(2));
            const platformShare = Number((monthlyAmount * 0.5).toFixed(2));
            const formattedCreated = shop.created_at
              ? new Date(shop.created_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : null;
            const formattedLastPayment = shop.last_payment_date
              ? new Date(shop.last_payment_date).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : null;
            const shopPhone = shop.owner_phone || (shop.config as any)?.phone || '';
            const atRisk = isShopAtRisk(shop);
            const upgradeOpportunity = isShopUpgradeOpportunity(shop);
            const upgradeWa = upgradeOpportunity
              ? buildUpgradeWhatsAppPayload({
                  shop,
                  agent: effectiveAgent,
                  language,
                  defaultDialCode: agentDialInfo.dialCode,
                })
              : null;
            const activityInfo = formatLastActivity(shop);
            const tryOnSessions30d = shop.usage_30d?.try_on_sessions ?? 0;
            const recsMade30d = shop.usage_30d?.recommendations_made ?? 0;

            return (
              <div
                key={shop.id}
                className={`bg-white rounded-xl border transition-all overflow-hidden flex flex-col justify-between ${
                  currentStatus === 'maintenance'
                    ? 'border-amber-300 shadow-sm ring-1 ring-amber-200'
                    : currentStatus === 'suspended'
                    ? 'border-rose-300 shadow-sm ring-1 ring-rose-200'
                    : 'border-slate-200 shadow-xs hover:shadow-md'
                }`}
              >
                {/* 1. Status Banner across top of card */}
                {currentStatus === 'active' && (
                  <div className="px-4 py-2 bg-emerald-50/90 border-b border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
                    <div className="flex items-center gap-1.5 font-bold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{t('statusActive')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {formattedCreated && (
                        <span className="text-[10px] text-emerald-700 font-mono hidden sm:inline flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-emerald-600" />
                          <span>{formattedCreated}</span>
                        </span>
                      )}
                      <span className="text-[10px] text-emerald-800 font-mono font-bold bg-white/90 px-2 py-0.5 rounded border border-emerald-300">
                        {currency.code} ({currency.symbol})
                      </span>
                    </div>
                  </div>
                )}

                {currentStatus === 'maintenance' && (
                  <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center justify-between text-xs text-amber-900">
                    <div className="flex items-center gap-1.5 font-bold text-[11px]">
                      <Wrench className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{t('statusMaintenance')} ({isRTL ? 'الوضع الدبلوماسي' : 'Diplomatic Mode'})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {shop.hold_date && (
                        <span className="text-[10px] text-amber-700 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {new Date(shop.hold_date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                      <span className="text-[10px] text-amber-800 font-mono font-bold bg-white/90 px-2 py-0.5 rounded border border-amber-300">
                        {currency.code}
                      </span>
                    </div>
                  </div>
                )}

                {currentStatus === 'suspended' && (
                  <div className="px-4 py-2 bg-rose-50 border-b border-rose-200 flex items-center justify-between text-xs text-rose-900">
                    <div className="flex items-center gap-1.5 font-bold text-[11px]">
                      <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{t('statusSuspended')} ({isRTL ? 'الواجهة متوقفة' : 'Storefront Paused'})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {shop.hold_date && (
                        <span className="text-[10px] text-rose-700 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {new Date(shop.hold_date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                      <span className="text-[10px] text-rose-800 font-mono font-bold bg-white/90 px-2 py-0.5 rounded border border-rose-300">
                        {currency.code}
                      </span>
                    </div>
                  </div>
                )}

                {/* 2. Card Content Area */}
                <div className="p-4 sm:p-5 space-y-3.5">
                  {/* Shop Header & Tier Pill */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {/* Logo or Initials */}
                      <div
                        className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs"
                        style={{ borderTop: `3px solid ${primaryColor}` }}
                      >
                        {shop.config?.logo_url ? (
                          <img
                            src={shop.config.logo_url}
                            alt={shop.shop_name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-sm font-bold text-slate-700">
                            {shop.shop_name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Name & Location & Date */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center flex-wrap gap-2">
                          <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug break-words">
                            {shop.shop_name}
                          </h3>
                          {atRisk && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-300 tabular-nums shrink-0"
                              title={t('atRiskInactivityDesc')}
                            >
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span>
                                {t('atRiskFlag')}
                                {activityInfo.daysSince != null
                                  ? isRTL
                                    ? ` · خامل ${activityInfo.daysSince} ي`
                                    : ` · ${activityInfo.daysSince}d inactive`
                                  : ''}
                              </span>
                            </span>
                          )}
                          {upgradeOpportunity && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-300 shrink-0"
                              title={t('highUsageUpgradeHint')}
                            >
                              <TrendingUp className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span>{t('upgradeOpportunityFlag')}</span>
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-0.5">
                          <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{shop.location}</span>
                          </span>
                          {formattedCreated && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                              <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{formattedCreated}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Tier Badge & Price */}
                    <div className="flex flex-col items-end rtl:items-start gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onOpenChangeTier(shop)}
                        className={`min-h-[44px] inline-flex items-center justify-center px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap shadow-2xs hover:shadow-xs border ${tierDetails.borderColor || 'border-slate-300'} ${tierDetails.badgeBg} hover:opacity-90 transition-all select-none`}
                        title={isRTL ? 'انقر لتعديل باقة الاشتراك' : 'Click to change subscription tier'}
                      >
                        <span>{tierDetails.name}</span>
                        <span className="text-[10px] opacity-75 ml-1 rtl:ml-0 rtl:mr-1">({t('changeTier')})</span>
                      </button>
                      <span
                        className="text-xs font-mono font-bold text-slate-800 tabular-nums whitespace-nowrap inline-flex items-center gap-1"
                        title={isRTL ? 'قيمة الاشتراك الشهري' : 'Monthly subscription price'}
                      >
                        {monthlyAmount > 0
                          ? `${monthlyAmount} ${currency.symbol} / ${isRTL ? 'شهر' : 'mo'}`
                          : `— ${currency.symbol}`}
                      </span>
                    </div>
                  </div>

                  {/* 3. 50/50 Revenue Split Highlight Bar */}
                  <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200/80 flex items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-slate-600 font-medium truncate">
                        {isRTL ? 'عمولة الوكيل (50%):' : 'Agent Cut (50%):'}
                      </span>
                      <span className="font-mono font-bold text-emerald-700 whitespace-nowrap tabular-nums">
                        +{agentShare.toFixed(2)} {currency.symbol}
                      </span>
                    </div>
                    <div className="text-slate-400 text-[10px] hidden sm:inline">|</div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 whitespace-nowrap">
                      <span>{isRTL ? 'حصة المنصة:' : 'Platform:'}</span>
                      <span className="font-mono font-semibold text-slate-700 tabular-nums">
                        {platformShare.toFixed(2)} {currency.symbol}
                      </span>
                    </div>
                  </div>

                  {/* 3b. Usage (Last 30 Days) */}
                  <div
                    className={`rounded-xl p-3 border space-y-2 ${
                      atRisk
                        ? 'bg-rose-50/50 border-rose-200'
                        : 'bg-slate-50/80 border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Activity className={`w-3.5 h-3.5 shrink-0 ${atRisk ? 'text-rose-600' : 'text-sky-600'}`} />
                        <span>{t('usageLast30Days')}</span>
                      </span>
                      {atRisk && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 shrink-0">
                          <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                          <span>{t('atRiskInactivityDesc')}</span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white rounded-lg p-2 border border-slate-200/80 min-w-0">
                        <div className="text-[10px] font-medium text-slate-500 leading-tight">
                          {t('tryOnSessions')}
                        </div>
                        <div className="mt-1 text-sm sm:text-base font-bold text-slate-900 font-mono tabular-nums">
                          {tryOnSessions30d.toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-2 border border-slate-200/80 min-w-0">
                        <div className="text-[10px] font-medium text-slate-500 leading-tight">
                          {t('recommendationsMade')}
                        </div>
                        <div className="mt-1 text-sm sm:text-base font-bold text-slate-900 font-mono tabular-nums">
                          {recsMade30d.toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-2 border border-slate-200/80 min-w-0">
                        <div className="text-[10px] font-medium text-slate-500 leading-tight">
                          {t('lastActivityDate')}
                        </div>
                        <div
                          className={`mt-1 text-[11px] sm:text-xs font-bold leading-snug tabular-nums ${
                            atRisk ? 'text-rose-700' : 'text-slate-900'
                          }`}
                        >
                          {activityInfo.dateText}
                        </div>
                        {activityInfo.relativeText && (
                          <div
                            className={`text-[10px] font-mono tabular-nums ${
                              atRisk ? 'text-rose-600 font-semibold' : 'text-slate-400'
                            }`}
                          >
                            {activityInfo.relativeText}
                          </div>
                        )}
                      </div>
                    </div>

                    {upgradeOpportunity && upgradeWa && (
                      <div className="pt-2 border-t border-indigo-200/70 bg-indigo-50/70 -mx-1 px-2.5 py-2.5 rounded-lg space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                          <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span>
                              {t('upgradeToNextTierPrefix')} {upgradeWa.nextTierName}
                            </span>
                          </span>
                          <span className="font-mono font-bold text-indigo-800 bg-white px-2 py-0.5 rounded border border-indigo-200 tabular-nums">
                            {upgradeWa.nextTierPrice} {upgradeWa.currencySymbol}
                            {t('perMonthShort')}
                          </span>
                        </div>
                        <p className="text-[11px] text-indigo-800/90 leading-snug">
                          {upgradeWa.benefits.slice(0, 3).join(' · ')}
                        </p>
                        <a
                          href={upgradeWa.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full min-h-[50px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm sm:text-xs font-bold inline-flex items-center justify-center gap-2 shadow-2xs transition-colors"
                        >
                          <MessageCircle className="w-4 h-4 shrink-0" />
                          <span>
                            {t('whatsappOwnerUpgradeBtn')} ({upgradeWa.nextTierName} · {upgradeWa.nextTierPrice}{' '}
                            {upgradeWa.currencySymbol})
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 opacity-80 shrink-0" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* 4. Boutique Information & Contact Details */}
                  <div className="space-y-1.5 py-2 border-y border-slate-100 text-xs">
                    {/* Owner Email with 1-click Copy */}
                    <div className="flex items-center justify-between gap-2 min-h-[40px]">
                      <span className="text-slate-400 flex items-center gap-1.5 shrink-0">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{t('owner')}</span>
                      </span>
                      <div className="flex items-center gap-1 min-w-0">
                        <a
                          href={`mailto:${shop.owner_email}`}
                          className="min-h-[44px] inline-flex items-center font-mono text-slate-700 hover:text-slate-900 truncate hover:underline dir-ltr text-right rtl:text-left"
                          title={shop.owner_email}
                        >
                          <span className="truncate">{shop.owner_email}</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopyText(shop.owner_email, `email-${shop.id}`)}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                          title={isRTL ? 'نسخ البريد الإلكتروني' : 'Copy email'}
                        >
                          {copiedField === `email-${shop.id}` ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Subdomain URL with Direct Preview & Copy */}
                    <div className="flex items-center justify-between gap-2 min-h-[40px]">
                      <span className="text-slate-400 flex items-center gap-1.5 shrink-0">
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                        <span>{t('portalSubdomain')}</span>
                      </span>
                      <div className="flex items-center gap-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => onOpenLivePreview(shop)}
                          className="min-h-[44px] font-mono text-sky-700 hover:text-sky-900 hover:underline flex items-center gap-1 truncate dir-ltr text-right rtl:text-left font-medium"
                          title={isRTL ? 'معاينة الواجهة الرقمية' : 'Preview Live Storefront'}
                        >
                          <span className="truncate">{slug}.envisioneyewear.store</span>
                          <ExternalLink className="w-3.5 h-3.5 shrink-0 text-sky-600" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyText(`https://${slug}.envisioneyewear.store`, `slug-${shop.id}`)
                          }
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                          title={isRTL ? 'نسخ الرابط' : 'Copy URL'}
                        >
                          {copiedField === `slug-${shop.id}` ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedShopForShare(shop)}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-sky-600 hover:text-sky-800 hover:bg-sky-50 rounded-lg transition-colors shrink-0"
                          title={t('shareStorefrontBtn')}
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Phone Number if Available */}
                    {shopPhone && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400 flex items-center gap-1.5 shrink-0">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{isRTL ? 'رقم الهاتف:' : 'Phone / Contact:'}</span>
                        </span>
                        <a
                          href={`tel:${shopPhone}`}
                          className="min-h-[40px] inline-flex items-center font-mono text-slate-700 hover:text-slate-900 dir-ltr text-right rtl:text-left truncate font-medium"
                        >
                          {shopPhone}
                        </a>
                      </div>
                    )}

                    {/* Brand Colors Swatches */}
                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <span className="text-slate-400 flex items-center gap-1.5 shrink-0">
                        <Palette className="w-3.5 h-3.5 text-slate-400" />
                        <span>{t('brandingColors')}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <div
                          className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-[10px] font-mono"
                          title={isRTL ? 'اللون الأساسي' : 'Primary Theme Color'}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0 inline-block"
                            style={{ backgroundColor: primaryColor }}
                          />
                          <span className="text-slate-600">{primaryColor}</span>
                        </div>
                        <div
                          className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-[10px] font-mono"
                          title={isRTL ? 'اللون الثانوي' : 'Secondary Theme Color'}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0 inline-block"
                            style={{ backgroundColor: secondaryColor }}
                          />
                          <span className="text-slate-600">{secondaryColor}</span>
                        </div>
                      </div>
                    </div>

                    {/* Last Payment Date if Available */}
                    {formattedLastPayment && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400 flex items-center gap-1.5 shrink-0">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{isRTL ? 'آخر دفعة مسجلة:' : 'Last Payment:'}</span>
                        </span>
                        <span className="font-mono text-slate-700 text-[11px]">
                          {formattedLastPayment}
                        </span>
                      </div>
                    )}

                    {/* Hold Reason Alert if Present */}
                    {shop.hold_reason && (
                      <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-1.5 mt-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold block text-[11px]">
                            {isRTL ? 'سبب الإيقاف المؤقت:' : 'Reason for Hold / Suspension:'}
                          </span>
                          <span className="text-[11px] text-amber-800 break-words">{shop.hold_reason}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 5. Diplomatic Subscription Status & Controls */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-slate-700 text-xs">
                          {t('subscriptionStatus')}
                        </span>
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onMouseEnter={() => setHoveredTooltipShopId(shop.id)}
                            onMouseLeave={() => setHoveredTooltipShopId(null)}
                            onClick={() =>
                              setHoveredTooltipShopId(hoveredTooltipShopId === shop.id ? null : shop.id)
                            }
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-amber-600 transition-colors rounded-full"
                            title={t('diplomaticAdviceTooltip')}
                          >
                            <HelpCircle className="w-4 h-4" />
                          </button>

                          {hoveredTooltipShopId === shop.id && (
                            <div className="absolute z-30 bottom-full left-0 rtl:left-auto rtl:right-0 mb-2 w-64 p-3 bg-slate-900 text-white text-[11px] rounded-lg shadow-xl leading-relaxed border border-slate-700">
                              <p className="font-semibold text-amber-300 mb-1 flex items-center gap-1">
                                <Info className="w-3.5 h-3.5 text-amber-400" />
                                <span>{t('diplomaticAdviceHeader')}</span>
                              </p>
                              <p>{t('diplomaticAdviceTooltip')}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status indicator badge */}
                      {currentStatus === 'active' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{t('statusActive')}</span>
                        </span>
                      )}
                      {currentStatus === 'maintenance' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
                          <Wrench className="w-3.5 h-3.5 text-amber-600" />
                          <span>{t('statusMaintenance')}</span>
                        </span>
                      )}
                      {currentStatus === 'suspended' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-300">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                          <span>{t('statusSuspended')}</span>
                        </span>
                      )}
                    </div>

                    {/* Quick status selector & Hold modal button */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <select
                        disabled={isUpdating}
                        value={currentStatus}
                        onChange={(e) =>
                          handleQuickStatusChange(shop, e.target.value as SubscriptionStatus)
                        }
                        className={`flex-1 min-h-[48px] px-3.5 py-2.5 text-sm sm:text-xs font-semibold rounded-xl border focus:outline-none transition-colors ${
                          currentStatus === 'maintenance'
                            ? 'bg-amber-50 border-amber-300 text-amber-900 focus:border-amber-500'
                            : currentStatus === 'suspended'
                            ? 'bg-rose-50 border-rose-300 text-rose-900 focus:border-rose-500'
                            : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-slate-900'
                        }`}
                      >
                        <option value="active">{t('statusActive')}</option>
                        <option value="maintenance">{t('statusMaintenance')} ({isRTL ? 'دبلوماسي' : 'Diplomatic'})</option>
                        <option value="suspended">{t('statusSuspended')} ({isRTL ? 'إيقاف كامل' : 'Suspended'})</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => onOpenHoldModal(shop)}
                        className={`min-h-[48px] px-4 py-2.5 text-sm sm:text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 border shadow-2xs whitespace-nowrap ${
                          currentStatus === 'active'
                            ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border-amber-300'
                            : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-300'
                        }`}
                        title={currentStatus === 'active' ? t('putOnHold') : t('reactivateShop')}
                      >
                        {currentStatus === 'active' ? (
                          <>
                            <Wrench className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>{t('diplomaticHoldShort')}</span>
                          </>
                        ) : (
                          <>
                            <PlayCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{t('reactivateShop')}</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* 5b. Shop Officers List */}
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{t('shopOfficersTitle')}</span>
                        </span>
                        <span className="text-[11px] font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {shop.staff ? shop.staff.length : 0}
                        </span>
                      </div>

                      {!shop.staff || shop.staff.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic py-2 px-3 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                          {t('noOfficersRecorded')}
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {shop.staff.map((officer, idx) => {
                            const roleBadge = getOfficerRoleBadge(officer.role);
                            const hasUserId = Boolean(officer.userId || officer.id);
                            return (
                              <div
                                key={officer.userId || officer.id || officer.email || idx}
                                className="p-2.5 sm:p-3 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-2"
                              >
                                <div className="flex items-start justify-between gap-2 min-w-0">
                                  <div className="min-w-0 space-y-0.5">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-xs font-bold text-slate-900 truncate">
                                        {officer.full_name}
                                      </span>
                                      <span
                                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${roleBadge.bg} shrink-0`}
                                      >
                                        {roleBadge.label}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500 min-w-0">
                                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                      <span className="truncate dir-ltr">{officer.email}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-3 sm:flex sm:items-center gap-2 pt-1.5 border-t border-slate-200/60">
                                  <button
                                    type="button"
                                    disabled={!hasUserId}
                                    onClick={() => openOfficerEditModal(shop, officer)}
                                    className="min-h-[48px] sm:min-h-[40px] px-3 py-2 text-xs font-semibold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                                    title={t('officerEditBtn')}
                                  >
                                    <Pencil className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate">{t('officerEditBtn')}</span>
                                  </button>

                                  <button
                                    type="button"
                                    disabled={!hasUserId}
                                    onClick={() => openOfficerRemoveModal(shop, officer)}
                                    className="min-h-[48px] sm:min-h-[40px] px-3 py-2 text-xs font-semibold text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                                    title={t('officerRemoveBtn')}
                                  >
                                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate">{t('officerRemoveBtn')}</span>
                                  </button>

                                  <button
                                    type="button"
                                    disabled={!hasUserId}
                                    onClick={() => openOfficerPasswordModal(shop, officer)}
                                    className="min-h-[48px] sm:min-h-[40px] px-3 py-2 text-xs font-semibold text-amber-800 bg-white hover:bg-amber-50 border border-amber-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                                    title={t('officerChangePasswordBtn')}
                                  >
                                    <KeyRound className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate">{t('officerChangePasswordBtn')}</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* 5c. Notes & Follow-ups */}
                    {renderShopNotesContent(shop, false)}
                  </div>
                </div>

                {/* 6. Card Action Buttons (Organized, Visible, Responsive) */}
                <div className="p-3.5 sm:p-4 bg-slate-50/80 border-t border-slate-200/80 space-y-2.5">
                  {/* Hero Action: Record Payment / Reactivate Store */}
                  <button
                    type="button"
                    onClick={() => onOpenRecordPayment(shop)}
                    className="w-full min-h-[54px] py-3 px-4 text-sm sm:text-xs font-bold rounded-xl transition-all flex items-center justify-between shadow-xs bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white"
                    title={t('recordPayment')}
                  >
                    <span className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-200 shrink-0" />
                      <span>
                        {currentStatus !== 'active'
                          ? (isRTL ? 'تحصيل الرسوم وإعادة التفعيل' : 'Collect Fee & Reactivate')
                          : (isRTL ? 'تسجيل دفعة الاشتراك (تقاسم 50/50)' : 'Record Payment (50/50 Split)')}
                      </span>
                    </span>
                    <span className="font-mono text-emerald-100 font-bold bg-emerald-700/60 px-2.5 py-1 rounded text-xs tabular-nums">
                      {monthlyAmount > 0 ? `${monthlyAmount} ${currency.symbol}` : currency.symbol}
                    </span>
                  </button>

                  {/* Secondary Actions Grid: 4 Equal Prominent Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {/* Staff Accounts Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenStaffModal(shop)}
                      className="min-h-[48px] px-3 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 hover:text-indigo-700 border border-slate-200 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs"
                      title={isRTL ? 'حسابات الموظفين والاعتمادات' : 'Staff Accounts & Credentials'}
                    >
                      <Users className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="truncate">{isRTL ? 'الموظفون' : 'Staff'}</span>
                    </button>

                    {/* Live Preview Button */}
                    <button
                      type="button"
                      onClick={() => onOpenLivePreview(shop)}
                      className="min-h-[48px] px-3 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 hover:text-sky-700 border border-slate-200 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs"
                      title={t('previewPortal')}
                    >
                      <Eye className="w-4 h-4 text-sky-600 shrink-0" />
                      <span className="truncate">{isRTL ? 'معاينة' : 'Preview'}</span>
                    </button>

                    {/* Change Tier Button */}
                    <button
                      type="button"
                      onClick={() => onOpenChangeTier(shop)}
                      className="min-h-[48px] px-3 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 hover:text-amber-700 border border-slate-200 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs"
                      title={t('changeTier')}
                    >
                      <Sliders className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="truncate">{t('changeTier')}</span>
                    </button>

                    {/* Configure Branding Button */}
                    <button
                      type="button"
                      onClick={() => onOpenConfigureBranding(shop)}
                      className="min-h-[48px] px-3 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 hover:text-purple-700 border border-slate-200 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs"
                      title={t('branding')}
                    >
                      <Palette className="w-4 h-4 text-purple-600 shrink-0" />
                      <span className="truncate">{t('branding')}</span>
                    </button>
                  </div>

                  {/* Share Storefront & WhatsApp Templates Row */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedShopForShare(shop)}
                      className="min-h-[48px] px-3.5 py-2.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                      title={t('shareStorefrontBtn')}
                    >
                      <QrCode className="w-4 h-4 text-sky-600 shrink-0" />
                      <span className="truncate">{t('shareStorefrontBtn')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedShopForTemplates(shop)}
                      className="min-h-[48px] px-3.5 py-2.5 text-xs font-semibold text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                      title={t('messageTemplatesBtn')}
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">{t('messageTemplatesBtn')}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View (Mobile Cards on <md, Table on >=md) */}
      {viewMode === 'table' && filteredShops.length > 0 && (
        <div className="space-y-3 md:space-y-0">
          {/* Mobile Compact Cards for Table View (< md) */}
          <div className="md:hidden space-y-3">
            {filteredShops.map((shop) => {
              const tierDetails = SUBSCRIPTION_TIERS[shop.tier] || SUBSCRIPTION_TIERS.bronze;
              const slug = shop.config?.subdomain_slug || 'shop';
              const currentStatus = getShopSubscriptionStatus(shop);
              const isUpdating = updatingShopId === shop.id;
              const currency = getAgentCurrency(currentAgent, shop);
              const monthlyAmount = getShopMonthlyAmount(shop, currentAgent);
              const atRisk = isShopAtRisk(shop);
              const upgradeOpportunity = isShopUpgradeOpportunity(shop);
              const upgradeWa = upgradeOpportunity
                ? buildUpgradeWhatsAppPayload({
                    shop,
                    agent: effectiveAgent,
                    language,
                    defaultDialCode: agentDialInfo.dialCode,
                  })
                : null;
              const activityInfo = formatLastActivity(shop);
              const tryOnSessions30d = shop.usage_30d?.try_on_sessions ?? 0;
              const recsMade30d = shop.usage_30d?.recommendations_made ?? 0;

              return (
                <div
                  key={shop.id}
                  className={`bg-white rounded-xl border p-4 space-y-3 shadow-2xs ${
                    currentStatus === 'maintenance'
                      ? 'border-amber-300 bg-amber-50/20'
                      : currentStatus === 'suspended'
                      ? 'border-rose-300 bg-rose-50/20'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full mt-1 shrink-0"
                        style={{ backgroundColor: shop.config?.primary_color || '#0284c7' }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center flex-wrap gap-1.5">
                          <h3 className="text-sm font-bold text-slate-900 truncate">{shop.shop_name}</h3>
                          {atRisk && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-300 shrink-0">
                              <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                              <span>{t('atRiskFlag')}</span>
                            </span>
                          )}
                          {upgradeOpportunity && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-300 shrink-0">
                              <TrendingUp className="w-3 h-3 text-indigo-600 shrink-0" />
                              <span>{t('upgradeOpportunityFlag')}</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate">{shop.location}</p>
                        <p className="text-[11px] font-mono text-slate-500 truncate dir-ltr mt-0.5">
                          {shop.owner_email}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenChangeTier(shop)}
                      className={`min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-bold uppercase shrink-0 border border-black/10 ${tierDetails.badgeBg}`}
                    >
                      {tierDetails.name} • {monthlyAmount > 0 ? `${monthlyAmount} ${currency.symbol}` : currency.symbol}
                    </button>
                  </div>

                  {/* Mobile 30-day usage strip */}
                  <div
                    className={`grid grid-cols-3 gap-1.5 rounded-lg p-2 border ${
                      atRisk ? 'bg-rose-50/50 border-rose-200' : 'bg-slate-50 border-slate-200/80'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-[10px] text-slate-500 truncate">{t('tryOnSessions')}</div>
                      <div className="text-xs font-bold font-mono text-slate-900 tabular-nums">
                        {tryOnSessions30d.toLocaleString()}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] text-slate-500 truncate">{t('recommendationsMade')}</div>
                      <div className="text-xs font-bold font-mono text-slate-900 tabular-nums">
                        {recsMade30d.toLocaleString()}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] text-slate-500 truncate">{t('lastActivityDate')}</div>
                      <div className={`text-[11px] font-bold truncate tabular-nums ${atRisk ? 'text-rose-700' : 'text-slate-900'}`}>
                        {activityInfo.dateText}
                      </div>
                    </div>
                  </div>

                  {upgradeOpportunity && upgradeWa && (
                    <a
                      href={upgradeWa.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-between gap-2 transition-colors"
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <MessageCircle className="w-4 h-4 shrink-0" />
                        <span className="truncate">{t('whatsappOwnerUpgradeBtn')}</span>
                      </span>
                      <span className="font-mono text-[11px] bg-emerald-700/70 px-2 py-0.5 rounded shrink-0 tabular-nums">
                        {upgradeWa.nextTierName} · {upgradeWa.nextTierPrice} {upgradeWa.currencySymbol}
                      </span>
                    </a>
                  )}

                  {currentStatus !== 'active' && shop.hold_reason && (
                    <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                      {shop.hold_reason}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => onOpenLivePreview(shop)}
                      className="min-h-[44px] text-xs font-mono text-sky-700 hover:underline flex items-center gap-1 truncate dir-ltr"
                    >
                      <span className="truncate">{slug}.envisioneyewear.store</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </button>

                    <select
                      disabled={isUpdating}
                      value={currentStatus}
                      onChange={(e) =>
                        handleQuickStatusChange(shop, e.target.value as SubscriptionStatus)
                      }
                      className={`min-h-[46px] px-3 py-2 rounded-xl text-xs font-semibold border focus:outline-none shrink-0 ${
                        currentStatus === 'maintenance'
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : currentStatus === 'suspended'
                          ? 'bg-rose-100 text-rose-900 border-rose-300'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      <option value="active">{t('statusActive')}</option>
                      <option value="maintenance">{t('statusMaintenance')}</option>
                      <option value="suspended">{t('statusSuspended')}</option>
                    </select>
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onOpenRecordPayment(shop)}
                      className="w-full min-h-[52px] px-4 py-2.5 text-sm sm:text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <DollarSign className="w-4 h-4 text-emerald-200" />
                      <span>{t('recordPayment')}</span>
                    </button>

                    <div className="grid grid-cols-4 gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenLivePreview(shop)}
                        className="min-h-[52px] flex flex-col items-center justify-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl"
                      >
                        <Eye className="w-4 h-4 text-sky-600" />
                        <span>{isRTL ? 'معاينة' : 'Preview'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenStaffModal(shop)}
                        className="min-h-[52px] flex flex-col items-center justify-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl"
                      >
                        <Users className="w-4 h-4 text-indigo-600" />
                        <span>{isRTL ? 'الموظفون' : 'Staff'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenHoldModal(shop)}
                        className="min-h-[52px] flex flex-col items-center justify-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl"
                      >
                        <Wrench className="w-4 h-4 text-amber-600" />
                        <span>{t('manageStatusModalBtn')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenChangeTier(shop)}
                        className="min-h-[52px] flex flex-col items-center justify-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl"
                      >
                        <Sliders className="w-4 h-4 text-slate-600" />
                        <span>{t('changeTier')}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedShopForNotes(shop)}
                        className="min-h-[48px] px-2 py-2 text-xs font-semibold text-amber-900 bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200 rounded-xl transition-colors flex items-center justify-center gap-1"
                      >
                        <StickyNote className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="truncate">{t('notesAndFollowUpsTitle').split(' ')[0]}</span>
                        <span className="font-mono text-[10px] font-bold px-1 rounded bg-white border border-amber-200 tabular-nums shrink-0">
                          {getNotesForShop(shop.id).length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedShopForShare(shop)}
                        className="min-h-[48px] px-2 py-2 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1"
                      >
                        <QrCode className="w-4 h-4 text-sky-600 shrink-0" />
                        <span className="truncate">{t('shareStorefrontBtn')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedShopForTemplates(shop)}
                        className="min-h-[48px] px-2 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200 rounded-xl transition-colors flex items-center justify-center gap-1"
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate">{t('messageTemplatesBtn')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table (>= md) */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left rtl:text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-4 py-3">{t('colOpticalShop')}</th>
                    <th className="px-4 py-3">{t('colLocation')}</th>
                    <th className="px-4 py-3">{t('colOwnerEmail')}</th>
                    <th className="px-4 py-3">{t('colUsage30d')}</th>
                    <th className="px-4 py-3">{t('colCurrentTier')}</th>
                    <th className="px-4 py-3">{t('colSubdomain')}</th>
                    <th className="px-4 py-3 text-center">{t('colStatus')}</th>
                    <th className="px-4 py-3 text-right rtl:text-left">{t('colQuickActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredShops.map((shop) => {
                    const tierDetails = SUBSCRIPTION_TIERS[shop.tier] || SUBSCRIPTION_TIERS.bronze;
                    const slug = shop.config?.subdomain_slug || 'shop';
                    const currentStatus = getShopSubscriptionStatus(shop);
                    const isUpdating = updatingShopId === shop.id;
                    const atRisk = isShopAtRisk(shop);
                    const upgradeOpportunity = isShopUpgradeOpportunity(shop);
                    const upgradeWa = upgradeOpportunity
                      ? buildUpgradeWhatsAppPayload({
                          shop,
                          agent: effectiveAgent,
                          language,
                          defaultDialCode: agentDialInfo.dialCode,
                        })
                      : null;
                    const activityInfo = formatLastActivity(shop);
                    const tryOnSessions30d = shop.usage_30d?.try_on_sessions ?? 0;
                    const recsMade30d = shop.usage_30d?.recommendations_made ?? 0;

                    return (
                      <tr
                        key={shop.id}
                        className={`transition-colors ${
                          currentStatus === 'maintenance'
                            ? 'bg-amber-50/40 hover:bg-amber-50/70'
                            : currentStatus === 'suspended'
                            ? 'bg-rose-50/40 hover:bg-rose-50/70'
                            : 'hover:bg-slate-50/60'
                        }`}
                      >
                        <td className="px-4 py-3.5 font-semibold text-slate-900 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: shop.config?.primary_color || '#0284c7' }}
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span>{shop.shop_name}</span>
                                {atRisk && (
                                  <span
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-300 tabular-nums"
                                    title={t('atRiskInactivityDesc')}
                                  >
                                    <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                                    <span>{t('atRiskFlag')}</span>
                                  </span>
                                )}
                                {upgradeOpportunity && (
                                  <span
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-300"
                                    title={t('highUsageUpgradeHint')}
                                  >
                                    <TrendingUp className="w-3 h-3 text-indigo-600 shrink-0" />
                                    <span>{t('upgradeOpportunityFlag')}</span>
                                  </span>
                                )}
                              </div>
                              {currentStatus !== 'active' && shop.hold_reason && (
                                <p className="text-[10px] text-amber-700 font-normal">
                                  {shop.hold_reason}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">{shop.location}</td>
                        <td className="px-4 py-3.5 font-mono text-slate-600 whitespace-nowrap dir-ltr text-left rtl:text-right">
                          {shop.owner_email}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="space-y-0.5 text-[11px] tabular-nums">
                            <div className="flex items-center gap-2 font-mono text-slate-800 font-semibold">
                              <span>
                                {isRTL ? 'تجربة:' : 'Try-ons:'} {tryOnSessions30d.toLocaleString()}
                              </span>
                              <span className="text-slate-300">|</span>
                              <span>
                                {isRTL ? 'توصيات:' : 'Recs:'} {recsMade30d.toLocaleString()}
                              </span>
                            </div>
                            <div className={`text-[10px] ${atRisk ? 'text-rose-700 font-semibold' : 'text-slate-500'}`}>
                              {isRTL ? 'آخر نشاط:' : 'Last:'} {activityInfo.dateText}
                              {activityInfo.relativeText ? ` (${activityInfo.relativeText})` : ''}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase ${tierDetails.badgeBg}`}
                          >
                            {tierDetails.name} ({getShopMonthlyAmount(shop, currentAgent) > 0 ? `${getShopMonthlyAmount(shop, currentAgent)} ${getAgentCurrency(currentAgent, shop).symbol}` : `— ${getAgentCurrency(currentAgent, shop).symbol}`})
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-600 whitespace-nowrap dir-ltr text-left rtl:text-right">
                          <button
                            type="button"
                            onClick={() => onOpenLivePreview(shop)}
                            className="hover:underline text-sky-700 flex items-center gap-1"
                          >
                            <span>{slug}.envisioneyewear.store</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </button>
                        </td>
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <select
                              disabled={isUpdating}
                              value={currentStatus}
                              onChange={(e) =>
                                handleQuickStatusChange(shop, e.target.value as SubscriptionStatus)
                              }
                              className={`min-h-[38px] px-2.5 py-1 rounded text-[11px] font-semibold border focus:outline-none transition-colors ${
                                currentStatus === 'maintenance'
                                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                                  : currentStatus === 'suspended'
                                  ? 'bg-rose-100 text-rose-900 border-rose-300'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              }`}
                            >
                              <option value="active">{t('statusActive')}</option>
                              <option value="maintenance">{t('statusMaintenance')}</option>
                              <option value="suspended">{t('statusSuspended')}</option>
                            </select>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right rtl:text-left whitespace-nowrap">
                          <div className="flex items-center justify-end rtl:justify-start gap-1.5">
                            {upgradeOpportunity && upgradeWa && (
                              <a
                                href={upgradeWa.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1.5 text-xs font-semibold rounded transition-colors inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap"
                                title={`${t('whatsappOwnerUpgradeBtn')} (${upgradeWa.nextTierName} · ${upgradeWa.nextTierPrice} ${upgradeWa.currencySymbol})`}
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{t('whatsappUpgradeShort')}</span>
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => onOpenLivePreview(shop)}
                              className="p-2 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-200"
                              title={t('previewPortal')}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedShopForShare(shop)}
                              className="p-2 text-slate-500 hover:text-sky-700 rounded hover:bg-sky-50"
                              title={t('shareStorefrontBtn')}
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedShopForTemplates(shop)}
                              className="p-2 text-slate-500 hover:text-emerald-700 rounded hover:bg-emerald-50"
                              title={t('messageTemplatesBtn')}
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedShopForNotes(shop)}
                              className="p-2 text-slate-500 hover:text-amber-700 rounded hover:bg-amber-50 relative"
                              title={t('notesAndFollowUpsTitle')}
                            >
                              <StickyNote className="w-4 h-4" />
                              {getNotesForShop(shop.id).filter((n) => !n.done).length > 0 && (
                                <span className="absolute -top-0.5 -end-0.5 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-white text-[9px] font-mono font-bold flex items-center justify-center tabular-nums">
                                  {getNotesForShop(shop.id).filter((n) => !n.done).length}
                                </span>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenStaffModal(shop)}
                              className="p-2 text-slate-500 hover:text-[#2a14b4] rounded hover:bg-slate-200"
                              title={isRTL ? 'حسابات الموظفين والاعتمادات' : 'Staff Accounts & Credentials'}
                            >
                              <Users className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenHoldModal(shop)}
                              className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                            >
                              {t('manageStatusModalBtn')}
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenChangeTier(shop)}
                              className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                            >
                              {t('changeTier')}
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenRecordPayment(shop)}
                              className="px-3 py-1.5 text-xs font-semibold rounded transition-colors flex items-center gap-1 shadow-2xs whitespace-nowrap bg-emerald-600 hover:bg-emerald-700 text-white"
                              title={t('recordPayment')}
                            >
                              <DollarSign className="w-3 h-3 text-emerald-200" />
                              <span>{t('recordPayment')}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* Staff Accounts & Credentials Modal */}
      {selectedShopForStaff && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full sm:my-8 overflow-hidden max-h-[92vh] flex flex-col pb-safe">
            {/* Header */}
            <div className="px-4 py-3.5 sm:p-5 bg-gradient-to-r from-[#2a14b4] to-[#4338ca] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold truncate">
                    {isRTL ? 'حسابات وموظفي المتجر' : 'Shop Staff & Credentials'}
                  </h3>
                  <p className="text-xs text-white/80 mt-0.5 truncate">
                    {selectedShopForStaff.shop_name} • {selectedShopForStaff.location}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedShopForStaff(null)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              {/* Roster Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-500 hidden sm:inline">
                    Table: <strong className="text-slate-800">public.shop_staff_credentials</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-semibold font-mono text-xs">
                    {staffCredentialsList.length} {isRTL ? 'حسابات' : 'Accounts'}
                  </span>
                </div>

                {!isAddingNewStaff && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNewStaff(true);
                      setEditingStaffIdx(null);
                      setNewStaffForm({
                        full_name: '',
                        role: 'optometrist',
                        email: selectedShopForStaff?.owner_email
                          ? `staff@${selectedShopForStaff.config?.subdomain_slug || 'shop'}.envisioneyewear.store`
                          : '',
                        phone_number: `${agentDialInfo.dialCode} `,
                      });
                    }}
                    className="min-h-[44px] px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isRTL ? 'إضافة موظف' : 'Add Staff Member'}</span>
                  </button>
                )}
              </div>

              {/* Status notification toast */}
              {staffStatusMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150 ${
                    staffStatusMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {staffStatusMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{staffStatusMsg.text}</span>
                </div>
              )}

              {/* Add New Staff Card */}
              {isAddingNewStaff && (
                <div className="p-4 rounded-xl border-2 border-indigo-500 bg-indigo-50/20 shadow-md space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-1.5 border-b border-indigo-100">
                    <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-indigo-600" />
                      {isRTL ? 'إضافة موظف جديد للمتجر' : 'Add New Staff Member'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingNewStaff(false)}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Full Name */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        {isRTL ? 'الاسم الكامل' : 'Full Name'} *
                      </label>
                      <input
                        type="text"
                        value={newStaffForm.full_name}
                        onChange={(e) => setNewStaffForm({ ...newStaffForm, full_name: e.target.value })}
                        placeholder={isRTL ? 'مثال: د. رامي خوري' : 'e.g. Dr. Rami Khoury'}
                        className="w-full min-h-[44px] px-3 py-2 text-sm sm:text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 shadow-2xs"
                        autoFocus
                      />
                    </div>

                    {/* Role */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        {isRTL ? 'الدور الوظيفي' : 'Role'} *
                      </label>
                      <select
                        value={newStaffForm.role}
                        onChange={(e) => setNewStaffForm({ ...newStaffForm, role: e.target.value as StaffRole })}
                        className="w-full min-h-[44px] px-3 py-2 text-sm sm:text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 shadow-2xs"
                      >
                        <option value="optometrist">{isRTL ? 'أخصائي بصريات (Optometrist)' : 'Optometrist'}</option>
                        <option value="optician">{isRTL ? 'فني نظارات (Optician)' : 'Optician'}</option>
                        <option value="shop_owner">{isRTL ? 'مالك المتجر (Shop Owner)' : 'Shop Owner'}</option>
                        <option value="marketer">{isRTL ? 'مسؤول تسويق (Marketer)' : 'Marketer'}</option>
                      </select>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center justify-between">
                        <span>{isRTL ? 'البريد الإلكتروني' : 'Email Address'} *</span>
                        {newStaffEmailCheck.isChecking && (
                          <span className="text-[10px] font-normal text-indigo-600 flex items-center gap-1">
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                            {isRTL ? 'جاري التحقق...' : 'Checking...'}
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={newStaffForm.email}
                          onChange={(e) => handleNewStaffEmailChange(e.target.value)}
                          onBlur={handleNewStaffEmailBlur}
                          placeholder="staff@opticportal.io"
                          className={`w-full min-h-[44px] px-3 py-2 pe-9 text-sm sm:text-xs font-mono text-slate-900 bg-white border rounded-xl focus:outline-none transition-colors shadow-2xs dir-ltr ${
                            newStaffEmailCheck.error
                              ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-200'
                              : newStaffEmailCheck.isAvailable && newStaffForm.email.trim()
                              ? 'border-emerald-500 focus:border-emerald-600 ring-1 ring-emerald-100'
                              : 'border-slate-300 focus:border-indigo-600'
                          }`}
                        />
                        <div className="absolute inset-y-0 end-0 pe-2.5 flex items-center pointer-events-none">
                          {newStaffEmailCheck.isChecking ? (
                            <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                          ) : newStaffEmailCheck.error ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                          ) : newStaffEmailCheck.isAvailable && newStaffForm.email.trim() ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          ) : null}
                        </div>
                      </div>
                      {newStaffEmailCheck.error && (
                        <p className="mt-1 text-[11px] text-rose-600 font-medium flex items-start gap-1 leading-tight">
                          <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0 mt-0.5" />
                          <span>{newStaffEmailCheck.error}</span>
                        </p>
                      )}
                      {newStaffEmailCheck.isAvailable && newStaffForm.email.trim() && !newStaffEmailCheck.isChecking && (
                        <p className="mt-1 text-[11px] text-emerald-600 font-medium flex items-center gap-1 leading-tight">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span>{isRTL ? 'البريد الإلكتروني متاح وغير مكرر في قاعدة البيانات أو سجلات الموظفين' : 'Email is unique and available across all staff records & database'}</span>
                        </p>
                      )}
                    </div>

                    {/* Phone Number */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                          {isRTL ? 'رقم الهاتف' : 'Phone Number'}
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setNewStaffForm((prev) => ({
                              ...prev,
                              phone_number: `${agentDialInfo.dialCode} `,
                            }));
                          }}
                          title={
                            isRTL
                              ? `إدراج رمز دولة الوكيل (${agentDialInfo.countryNameAr})`
                              : `Insert agent country code (${agentDialInfo.countryNameEn})`
                          }
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-1 rounded-lg transition-colors dir-ltr font-mono cursor-pointer"
                        >
                          <span>{agentDialInfo.flag}</span>
                          <span>{agentDialInfo.dialCode}</span>
                          <span className="text-[9px] text-indigo-500 font-sans">
                            ({isRTL ? 'اقتراح' : 'Suggest'})
                          </span>
                        </button>
                      </div>
                      <input
                        type="tel"
                        value={newStaffForm.phone_number}
                        onChange={(e) => setNewStaffForm({ ...newStaffForm, phone_number: e.target.value })}
                        onFocus={() => {
                          if (!newStaffForm.phone_number || !newStaffForm.phone_number.trim()) {
                            setNewStaffForm((prev) => ({
                              ...prev,
                              phone_number: `${agentDialInfo.dialCode} `,
                            }));
                          }
                        }}
                        placeholder={agentDialInfo.placeholder}
                        className="w-full min-h-[44px] px-3 py-2 text-sm sm:text-xs font-mono text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 shadow-2xs dir-ltr"
                      />
                      <p className="mt-1 text-[10px] text-slate-500 flex items-center gap-1">
                        <span>{agentDialInfo.flag}</span>
                        <span>
                          {isRTL
                            ? `الرمز المقترح لدولة الوكيل: ${agentDialInfo.dialCode} (${agentDialInfo.countryNameAr})`
                            : `Agent country code suggestion: ${agentDialInfo.dialCode} (${agentDialInfo.countryNameEn})`}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2 pt-2 border-t border-indigo-100">
                    <button
                      type="button"
                      onClick={() => setIsAddingNewStaff(false)}
                      className="min-h-[44px] px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
                    >
                      {isRTL ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateNewStaff}
                      disabled={
                        isSavingStaff ||
                        newStaffEmailCheck.isChecking ||
                        Boolean(newStaffEmailCheck.error) ||
                        !newStaffForm.full_name.trim() ||
                        !newStaffForm.email.trim()
                      }
                      className="min-h-[44px] px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isSavingStaff ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : isRTL ? 'حفظ وإضافة' : 'Save & Add Staff'}</span>
                    </button>
                  </div>
                </div>
              )}

              {isLoadingStaff ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <span>{isRTL ? 'جاري جلب بيانات الموظفين...' : 'Loading shop staff roster...'}</span>
                </div>
              ) : staffCredentialsList.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 p-6">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">
                    {isRTL ? 'لا توجد بيانات موظفين محفوظة لهذا المتجر بعد.' : 'No staff credentials recorded for this boutique yet.'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto mb-3">
                    {isRTL
                      ? 'يمكنك إضافة موظفين جدد الآن وتعديل أسمائهم وأدوارهم وأرقام هواتفهم.'
                      : 'You can add staff members now and customize their names, roles, emails, and phone numbers.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNewStaff(true);
                      setEditingStaffIdx(null);
                      setNewStaffForm({
                        full_name: '',
                        role: 'optometrist',
                        email: selectedShopForStaff?.owner_email
                          ? `staff@${selectedShopForStaff.config?.subdomain_slug || 'shop'}.envisioneyewear.store`
                          : '',
                        phone_number: `${agentDialInfo.dialCode} `,
                      });
                    }}
                    className="min-h-[44px] px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isRTL ? 'إضافة أول موظف' : 'Add First Staff Member'}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {staffCredentialsList.map((cred, idx) => {
                    const isCopied = copiedStaffIdx === idx;
                    const isEditingThis = editingStaffIdx === idx;

                    // Role color styling
                    const roleBadge =
                      cred.role === 'optometrist'
                        ? { bg: 'bg-emerald-50 text-emerald-800 border-emerald-300', label: isRTL ? 'أخصائي بصريات' : 'Optometrist' }
                        : cred.role === 'optician'
                        ? { bg: 'bg-cyan-50 text-cyan-800 border-cyan-300', label: isRTL ? 'فني نظارات' : 'Optician' }
                        : cred.role === 'shop_owner'
                        ? { bg: 'bg-indigo-50 text-indigo-800 border-indigo-300', label: isRTL ? 'مالك المتجر' : 'Shop Owner' }
                        : cred.role === 'marketer'
                        ? { bg: 'bg-purple-50 text-purple-800 border-purple-300', label: isRTL ? 'مسؤول تسويق' : 'Marketer' }
                        : { bg: 'bg-slate-100 text-slate-800 border-slate-300', label: isRTL ? 'موظف مبيعات' : 'Store Staff' };

                    if (isEditingThis) {
                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-xl border-2 border-indigo-500 bg-indigo-50/20 shadow-md space-y-3 animate-in fade-in duration-150"
                        >
                          <div className="flex items-center justify-between pb-1.5 border-b border-indigo-100">
                            <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                              <Pencil className="w-3.5 h-3.5 text-indigo-600" />
                              {isRTL ? 'تعديل بيانات الموظف' : 'Edit Staff Credentials'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {cred.userId ? `ID: ${cred.userId.substring(0, 8)}...` : ''}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Full Name */}
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                                {isRTL ? 'الاسم الكامل' : 'Full Name'} *
                              </label>
                              <input
                                type="text"
                                value={editForm.full_name}
                                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                                className="w-full min-h-[44px] px-3 py-2 text-sm sm:text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 shadow-2xs"
                                autoFocus
                              />
                            </div>

                            {/* Role */}
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                                {isRTL ? 'الدور الوظيفي' : 'Role'} *
                              </label>
                              <select
                                value={editForm.role}
                                onChange={(e) => setEditForm({ ...editForm, role: e.target.value as StaffRole })}
                                className="w-full min-h-[44px] px-3 py-2 text-sm sm:text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 shadow-2xs"
                              >
                                <option value="optometrist">{isRTL ? 'أخصائي بصريات (Optometrist)' : 'Optometrist'}</option>
                                <option value="optician">{isRTL ? 'فني نظارات (Optician)' : 'Optician'}</option>
                                <option value="shop_owner">{isRTL ? 'مالك المتجر (Shop Owner)' : 'Shop Owner'}</option>
                                <option value="marketer">{isRTL ? 'مسؤول تسويق (Marketer)' : 'Marketer'}</option>
                              </select>
                            </div>

                            {/* Email */}
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center justify-between">
                                <span>{isRTL ? 'البريد الإلكتروني' : 'Email Address'} *</span>
                                {editStaffEmailCheck.isChecking && (
                                  <span className="text-[10px] font-normal text-indigo-600 flex items-center gap-1">
                                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                    {isRTL ? 'جاري التحقق...' : 'Checking...'}
                                  </span>
                                )}
                              </label>
                              <div className="relative">
                                <input
                                  type="email"
                                  value={editForm.email}
                                  onChange={(e) => handleEditStaffEmailChange(e.target.value)}
                                  onBlur={handleEditStaffEmailBlur}
                                  className={`w-full min-h-[44px] px-3 py-2 pe-9 text-sm sm:text-xs font-mono text-slate-900 bg-white border rounded-xl focus:outline-none transition-colors shadow-2xs dir-ltr ${
                                    editStaffEmailCheck.error
                                      ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-200'
                                      : editStaffEmailCheck.isAvailable && editForm.email.trim()
                                      ? 'border-emerald-500 focus:border-emerald-600 ring-1 ring-emerald-100'
                                      : 'border-slate-300 focus:border-indigo-600'
                                  }`}
                                />
                                <div className="absolute inset-y-0 end-0 pe-2.5 flex items-center pointer-events-none">
                                  {editStaffEmailCheck.isChecking ? (
                                    <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                                  ) : editStaffEmailCheck.error ? (
                                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                                  ) : editStaffEmailCheck.isAvailable && editForm.email.trim() ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : null}
                                </div>
                              </div>
                              {editStaffEmailCheck.error && (
                                <p className="mt-1 text-[11px] text-rose-600 font-medium flex items-start gap-1 leading-tight">
                                  <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0 mt-0.5" />
                                  <span>{editStaffEmailCheck.error}</span>
                                </p>
                              )}
                              {editStaffEmailCheck.isAvailable && editForm.email.trim() && !editStaffEmailCheck.isChecking && (
                                <p className="mt-1 text-[11px] text-emerald-600 font-medium flex items-center gap-1 leading-tight">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                                  <span>{isRTL ? 'البريد الإلكتروني متاح وغير مكرر' : 'Email is unique and available'}</span>
                                </p>
                              )}
                            </div>

                            {/* Phone Number */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                  {isRTL ? 'رقم الهاتف' : 'Phone Number'}
                                </label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditForm((prev) => ({
                                      ...prev,
                                      phone_number: `${agentDialInfo.dialCode} `,
                                    }));
                                  }}
                                  title={
                                    isRTL
                                      ? `إدراج رمز دولة الوكيل (${agentDialInfo.countryNameAr})`
                                      : `Insert agent country code (${agentDialInfo.countryNameEn})`
                                  }
                                  className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-1 rounded-lg transition-colors dir-ltr font-mono cursor-pointer"
                                >
                                  <span>{agentDialInfo.flag}</span>
                                  <span>{agentDialInfo.dialCode}</span>
                                  <span className="text-[9px] text-indigo-500 font-sans">
                                    ({isRTL ? 'اقتراح' : 'Suggest'})
                                  </span>
                                </button>
                              </div>
                              <input
                                type="tel"
                                value={editForm.phone_number}
                                onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                                onFocus={() => {
                                  if (!editForm.phone_number || !editForm.phone_number.trim()) {
                                    setEditForm((prev) => ({
                                      ...prev,
                                      phone_number: `${agentDialInfo.dialCode} `,
                                    }));
                                  }
                                }}
                                placeholder={agentDialInfo.placeholder}
                                className="w-full min-h-[44px] px-3 py-2 text-sm sm:text-xs font-mono text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 shadow-2xs dir-ltr"
                              />
                              <p className="mt-1 text-[10px] text-slate-500 flex items-center gap-1">
                                <span>{agentDialInfo.flag}</span>
                                <span>
                                  {isRTL
                                    ? `الرمز المقترح لدولة الوكيل: ${agentDialInfo.dialCode} (${agentDialInfo.countryNameAr})`
                                    : `Agent country code suggestion: ${agentDialInfo.dialCode} (${agentDialInfo.countryNameEn})`}
                                </span>
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2 pt-2 border-t border-indigo-100">
                            <button
                              type="button"
                              onClick={() => setEditingStaffIdx(null)}
                              className="min-h-[44px] px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
                            >
                              {isRTL ? 'إلغاء' : 'Cancel'}
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveStaffEdit}
                              disabled={
                                isSavingStaff ||
                                editStaffEmailCheck.isChecking ||
                                Boolean(editStaffEmailCheck.error) ||
                                !editForm.full_name.trim() ||
                                !editForm.email.trim()
                              }
                              className="min-h-[44px] px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{isSavingStaff ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : isRTL ? 'حفظ التعديل' : 'Save Changes'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 transition-colors shadow-2xs space-y-2.5"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {cred.full_name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <span className="text-xs font-bold text-slate-900 truncate">{cred.full_name}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleBadge.bg} font-mono shrink-0`}>
                              {roleBadge.label}
                            </span>
                          </div>

                          {/* Quick Edit, Change Password & Delete Actions */}
                          <div className="grid grid-cols-3 sm:flex sm:items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => startEditStaff(idx, cred)}
                              className="min-h-[44px] sm:min-h-[36px] px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors flex items-center justify-center gap-1 shadow-2xs"
                              title={t('officerEditBtn')}
                            >
                              <Pencil className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{t('officerEditBtn')}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => openOfficerPasswordModal(selectedShopForStaff, cred)}
                              className="min-h-[44px] sm:min-h-[36px] px-2.5 py-1.5 text-xs font-semibold text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors flex items-center justify-center gap-1 shadow-2xs"
                              title={t('officerChangePasswordBtn')}
                            >
                              <KeyRound className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{t('officerChangePasswordBtn')}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => openOfficerRemoveModal(selectedShopForStaff, cred)}
                              className="min-h-[44px] sm:min-h-[36px] px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors flex items-center justify-center gap-1 shadow-2xs"
                              title={t('officerRemoveBtn')}
                            >
                              <Trash2 className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{t('officerRemoveBtn')}</span>
                            </button>
                          </div>
                        </div>

                        {/* Email row with copy */}
                        <div className="flex items-center justify-between px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-100 text-xs font-mono">
                          <div className="flex items-center gap-1.5 truncate mr-2 min-w-0">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="text-slate-700 truncate dir-ltr">{cred.email}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(cred.email);
                              setCopiedStaffIdx(idx);
                              setTimeout(() => setCopiedStaffIdx(null), 2000);
                            }}
                            className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-indigo-600 rounded-lg transition-colors shrink-0"
                            title={isRTL ? 'نسخ البريد الإلكتروني' : 'Copy email address'}
                          >
                            {isCopied ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                        {/* Phone number and user ID row */}
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 px-1">
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="text-slate-400">{isRTL ? 'الهاتف:' : 'Tel:'}</span>
                            <span className="text-slate-800 font-semibold dir-ltr">
                              {cred.phone_number || (isRTL ? 'غير محدد' : 'Not provided')}
                            </span>
                          </div>

                          {cred.userId && (
                            <span className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">
                              ID: {cred.userId.substring(0, 8)}...
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedShopForStaff(null)}
                  className="w-full sm:w-auto min-h-[48px] px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-white transition-colors"
                >
                  {isRTL ? 'إغلاق' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. Edit Officer Modal */}
      {officerEditTarget && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => !officerEditSaving && setOfficerEditTarget(null)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden pb-safe"
            onClick={(e) => e.stopPropagation()}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <div className="px-4 sm:px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
                  <Pencil className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{t('editOfficerTitle')}</h3>
                  <p className="text-[11px] text-slate-500 truncate">{t('editOfficerSubtitle')}</p>
                </div>
              </div>
              <button
                type="button"
                disabled={officerEditSaving}
                onClick={() => setOfficerEditTarget(null)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-xl transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmOfficerEdit} className="p-4 sm:p-5 space-y-3.5">
              {officerEditError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{officerEditError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {isRTL ? 'الاسم الكامل' : 'Full Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={officerEditForm.full_name}
                  onChange={(e) => setOfficerEditForm((prev) => ({ ...prev, full_name: e.target.value }))}
                  className="w-full min-h-[44px] px-3 py-2 text-sm sm:text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {isRTL ? 'الدور الوظيفي' : 'Role'} *
                </label>
                <select
                  value={officerEditForm.role}
                  onChange={(e) =>
                    setOfficerEditForm((prev) => ({ ...prev, role: e.target.value as StaffRole }))
                  }
                  className="w-full min-h-[44px] px-3 py-2 text-sm sm:text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600"
                >
                  <option value="optometrist">{isRTL ? 'أخصائي بصريات (Optometrist)' : 'Optometrist'}</option>
                  <option value="optician">{isRTL ? 'فني نظارات (Optician)' : 'Optician'}</option>
                  <option value="shop_owner">{isRTL ? 'مالك المتجر (Shop Owner)' : 'Shop Owner'}</option>
                  <option value="marketer">{isRTL ? 'مسؤول تسويق (Marketer)' : 'Marketer'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {isRTL ? 'البريد الإلكتروني' : 'Email Address'} *
                </label>
                <input
                  type="email"
                  required
                  value={officerEditForm.email}
                  onChange={(e) => setOfficerEditForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full min-h-[44px] px-3 py-2 text-sm sm:text-xs font-mono text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 dir-ltr"
                />
              </div>

              <div className="pt-2 grid grid-cols-3 sm:flex sm:items-center sm:justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={officerEditSaving}
                  onClick={() => setOfficerEditTarget(null)}
                  className="col-span-1 min-h-[48px] px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={officerEditSaving}
                  className="col-span-2 min-h-[48px] px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {officerEditSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>{isRTL ? 'حفظ التغييرات' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Remove Officer Confirmation Modal */}
      {officerRemoveTarget && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => !officerRemoveDeleting && setOfficerRemoveTarget(null)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden pb-safe"
            onClick={(e) => e.stopPropagation()}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <div className="px-4 sm:px-5 py-3.5 bg-rose-50 border-b border-rose-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4 text-rose-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-rose-950 truncate">{t('removeOfficerTitle')}</h3>
                  <p className="text-[11px] text-rose-700 truncate">{officerRemoveTarget.shop.shop_name}</p>
                </div>
              </div>
              <button
                type="button"
                disabled={officerRemoveDeleting}
                onClick={() => setOfficerRemoveTarget(null)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-rose-400 hover:text-rose-700 hover:bg-rose-100 rounded-xl transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              <p className="text-xs text-slate-700 leading-relaxed">{t('removeOfficerConfirmDesc')}</p>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-900">
                    {officerRemoveTarget.officer.full_name}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      getOfficerRoleBadge(officerRemoveTarget.officer.role).bg
                    }`}
                  >
                    {getOfficerRoleBadge(officerRemoveTarget.officer.role).label}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-slate-500 dir-ltr">
                  {officerRemoveTarget.officer.email}
                </p>
              </div>

              <div className="pt-2 grid grid-cols-3 sm:flex sm:items-center sm:justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={officerRemoveDeleting}
                  onClick={() => setOfficerRemoveTarget(null)}
                  className="col-span-1 min-h-[48px] px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={officerRemoveDeleting}
                  onClick={handleConfirmOfficerRemove}
                  className="col-span-2 min-h-[48px] px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {officerRemoveDeleting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>{t('confirmRemoveBtn')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Change Officer Password Modal */}
      {officerPasswordTarget && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => !officerPasswordSaving && setOfficerPasswordTarget(null)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden pb-safe"
            onClick={(e) => e.stopPropagation()}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <div className="px-4 sm:px-5 py-3.5 bg-amber-50 border-b border-amber-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                  <KeyRound className="w-4 h-4 text-amber-700" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-amber-950 truncate">{t('changePasswordTitle')}</h3>
                  <p className="text-[11px] text-amber-800 truncate">
                    {officerPasswordTarget.officer.full_name} ({officerPasswordTarget.officer.email})
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={officerPasswordSaving}
                onClick={() => setOfficerPasswordTarget(null)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-amber-600 hover:text-amber-900 hover:bg-amber-100 rounded-xl transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmOfficerPassword} className="p-4 sm:p-5 space-y-4">
              {officerPasswordError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{officerPasswordError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t('newPasswordLabel')} *
                </label>
                <div className="relative">
                  <input
                    type={showOfficerPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={officerNewPassword}
                    onChange={(e) => {
                      setOfficerNewPassword(e.target.value);
                      if (officerPasswordError) setOfficerPasswordError(null);
                    }}
                    placeholder="••••••••"
                    className="w-full min-h-[44px] px-3 py-2 pe-12 text-sm sm:text-xs font-mono text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-amber-600 dir-ltr"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowOfficerPassword((prev) => !prev)}
                    className="absolute inset-y-0 end-0 min-w-[44px] px-3 flex items-center justify-center text-slate-400 hover:text-slate-700"
                    tabIndex={-1}
                  >
                    {showOfficerPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2 grid grid-cols-3 sm:flex sm:items-center sm:justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={officerPasswordSaving}
                  onClick={() => setOfficerPasswordTarget(null)}
                  className="col-span-1 min-h-[48px] px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={officerPasswordSaving || officerNewPassword.trim().length < 8}
                  className="col-span-2 min-h-[48px] px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {officerPasswordSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <KeyRound className="w-3.5 h-3.5" />
                  )}
                  <span>{t('updatePasswordBtn')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shop Notes & Follow-ups Modal (for Table View quick access) */}
      {selectedShopForNotes && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full sm:my-8 overflow-hidden max-h-[90vh] flex flex-col pb-safe">
            <div className="px-4 py-3.5 sm:p-5 bg-amber-50 border-b border-amber-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <StickyNote className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    {t('notesAndFollowUpsTitle')}
                  </h3>
                  <p className="text-xs text-slate-600 truncate">
                    {selectedShopForNotes.shop_name} • {selectedShopForNotes.location}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedShopForNotes(null)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-amber-100 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-5 overflow-y-auto">
              {renderShopNotesContent(selectedShopForNotes, true)}
            </div>
          </div>
        </div>
      )}

      <ShareStorefrontModal
        shop={selectedShopForShare}
        currentAgent={effectiveAgent}
        isOpen={Boolean(selectedShopForShare)}
        onClose={() => setSelectedShopForShare(null)}
      />

      <WhatsAppTemplatesModal
        shop={selectedShopForTemplates}
        ledger={ledger}
        currentAgent={effectiveAgent}
        isOpen={Boolean(selectedShopForTemplates)}
        onClose={() => setSelectedShopForTemplates(null)}
      />
    </div>
  );
}
