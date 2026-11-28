import type { Session } from '@supabase/supabase-js';
import { Loader2, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BranchSidebar } from './components/BranchSidebar';
import { ClosingBriefReport } from './components/ClosingBriefReport';
import { ClosingDashboard } from './components/ClosingDashboard';
import { ClosingPlannerForm } from './components/ClosingPlannerForm';
import { CreditMemoReport } from './components/CreditMemoReport';
import { EarlyWarningDashboard } from './components/EarlyWarningDashboard';
import { EarlyWarningInputForm } from './components/EarlyWarningInputForm';
import { EarlyWarningMemoReport } from './components/EarlyWarningMemoReport';
import { ForensicRedFlagsBox } from './components/ForensicRedFlagsBox';
import { IntroSplashScreen } from './components/IntroSplashScreen';
import { LoanInputForm } from './components/LoanInputForm';
import { LoginGate } from './components/LoginGate';
import { MetricsDashboard } from './components/MetricsDashboard';
import { PresetToolbar } from './components/PresetToolbar';
import { RecoveryDashboard } from './components/RecoveryDashboard';
import { RecoveryInputForm } from './components/RecoveryInputForm';
import { RecoveryMemoReport } from './components/RecoveryMemoReport';
import { SubscriptionGate } from './components/SubscriptionGate';
import { SuperAdminPanel } from './components/SuperAdminPanel';
import { TopBar } from './components/TopBar';
import {
  clearPreviewSupabaseConfig,
  getSupabaseClient,
  getSupabaseConfigStatus,
  savePreviewSupabaseConfig,
  type SupabaseConfigStatus,
} from './lib/supabase';
import type {
  ClosingPlannerInput,
  ClosingStrategyBrief,
  CreditAnalystMemo,
  EarlyWarningInput,
  EarlyWarningMemo,
  LoanApplicationInput,
  RecoveryCaseInput,
  RecoveryMemo,
  WorkspaceMode,
} from './types/credit';
import type {
  CreditCaseMemoPayload,
  CreditCaseRecord,
  PaymentChannel,
  SubscriptionStatus,
  SupabaseOrganization,
  UserProfileWithOrg,
} from './types/tenant';
import type { ClosingPreset } from './utils/closing';
import {
  CLOSING_PRESETS,
  EMPTY_CLOSING_INPUT,
  calculateClosingMetrics,
} from './utils/closing';
import type { EarlyWarningPreset } from './utils/earlyWarning';
import {
  EARLY_WARNING_PRESETS,
  EMPTY_EARLY_WARNING_INPUT,
  calculateEarlyWarningMetrics,
} from './utils/earlyWarning';
import type { SamplePreset } from './utils/finance';
import {
  EMPTY_LOAN_INPUT,
  SAMPLE_PRESETS,
  calculateBankingMetrics,
  formatBDT,
} from './utils/finance';
import type { RecoveryPreset } from './utils/recovery';
import {
  EMPTY_RECOVERY_INPUT,
  RECOVERY_PRESETS,
  calculateRecoveryMetrics,
} from './utils/recovery';
import {
  createClientOrganization,
  deleteCreditCase,
  ensureOwnerSandboxOrganization,
  fetchAllOrganizations,
  fetchBranchCreditCases,
  fetchUserProfileWithOrg,
  updateOrganizationSubscription,
  upsertCreditCase,
  type CreateOrganizationPayload,
  type UpsertCreditCasePayload,
} from './utils/supabaseDb';

const INTRO_STORAGE_KEY = 'nbci_show_intro_on_startup';
const OWNER_SANDBOX_BRANCH_CODE = 'NBCI-SANDBOX';

function readShowIntroPreference(): boolean {
  try {
    const raw = window.localStorage.getItem(INTRO_STORAGE_KEY);
    if (raw === 'false') return false;
    return true;
  } catch {
    return true;
  }
}

export default function App() {
  const prefersReducedMotion = useReducedMotion();
  const [showIntroOnStartup, setShowIntroOnStartup] = useState<boolean>(
    readShowIntroPreference,
  );
  const [showIntro, setShowIntro] = useState<boolean>(() =>
    readShowIntroPreference(),
  );
  const [introReplayKey, setIntroReplayKey] = useState<number>(0);

  const handleToggleShowIntroOnStartup = useCallback((next: boolean) => {
    setShowIntroOnStartup(next);
    try {
      window.localStorage.setItem(INTRO_STORAGE_KEY, String(next));
    } catch {
      // Ignore storage errors
    }
  }, []);

  const handleDismissIntro = useCallback(() => {
    setShowIntro(false);
  }, []);

  const handleReplayIntro = useCallback(() => {
    setIntroReplayKey((prev) => prev + 1);
    setShowIntro(true);
  }, []);

  // --- Supabase Client, Session & Profile State ---
  const [configStatus, setConfigStatus] = useState<SupabaseConfigStatus>(() =>
    getSupabaseConfigStatus(),
  );
  const supabase = useMemo(
    () => (configStatus.isConfigured ? getSupabaseClient() : null),
    [configStatus],
  );

  const [session, setSession] = useState<Session | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(
    () => configStatus.isConfigured,
  );
  const [userProfile, setUserProfile] = useState<UserProfileWithOrg | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // --- Owner / Super Admin State ---
  const [ownerViewMode, setOwnerViewMode] = useState<'admin' | 'sandbox'>('admin');
  const [organizations, setOrganizations] = useState<SupabaseOrganization[]>([]);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);
  const [orgsError, setOrgsError] = useState<string | null>(null);
  const [sandboxOrg, setSandboxOrg] = useState<SupabaseOrganization | null>(null);

  // --- Branch / Sandbox Credit Cases State ---
  const [branchCases, setBranchCases] = useState<CreditCaseRecord[]>([]);
  const [isLoadingCases, setIsLoadingCases] = useState(false);
  const [isSavingCase, setIsSavingCase] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [justSavedFeedback, setJustSavedFeedback] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [mode, setMode] = useState<WorkspaceMode>('underwriting');

  // --- Module 1: Pre-Loan Business Analysis State ---
  const [input, setInput] = useState<LoanApplicationInput>(EMPTY_LOAN_INPUT);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [memo, setMemo] = useState<CreditAnalystMemo | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // --- Module 2: Post-Sanction Early Warning Monitor State ---
  const [ewsInput, setEwsInput] = useState<EarlyWarningInput>(
    EMPTY_EARLY_WARNING_INPUT,
  );
  const [activeEwsPresetId, setActiveEwsPresetId] = useState<string | null>(
    null,
  );
  const [ewsMemo, setEwsMemo] = useState<EarlyWarningMemo | null>(null);
  const [isAnalyzingEws, setIsAnalyzingEws] = useState(false);
  const [ewsError, setEwsError] = useState<string | null>(null);
  const [ewsValidationError, setEwsValidationError] = useState<string | null>(
    null,
  );

  // --- Module 3: Defaulted Loan Recovery & Resolution State ---
  const [recoveryInput, setRecoveryInput] =
    useState<RecoveryCaseInput>(EMPTY_RECOVERY_INPUT);
  const [activeRecoveryPresetId, setActiveRecoveryPresetId] = useState<
    string | null
  >(null);
  const [recoveryMemo, setRecoveryMemo] = useState<RecoveryMemo | null>(null);
  const [isAnalyzingRecovery, setIsAnalyzingRecovery] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [recoveryValidationError, setRecoveryValidationError] = useState<
    string | null
  >(null);

  // --- Module 4: Branch Closing Execution Assistant State ---
  const [closingInput, setClosingInput] =
    useState<ClosingPlannerInput>(EMPTY_CLOSING_INPUT);
  const [activeClosingPresetId, setActiveClosingPresetId] = useState<
    string | null
  >(null);
  const [closingBrief, setClosingBrief] = useState<ClosingStrategyBrief | null>(
    null,
  );
  const [isAnalyzingClosing, setIsAnalyzingClosing] = useState(false);
  const [closingError, setClosingError] = useState<string | null>(null);
  const [closingValidationError, setClosingValidationError] = useState<
    string | null
  >(null);

  const metrics = useMemo(() => calculateBankingMetrics(input), [input]);
  const ewsMetrics = useMemo(
    () => calculateEarlyWarningMetrics(ewsInput),
    [ewsInput],
  );
  const recoveryMetrics = useMemo(
    () => calculateRecoveryMetrics(recoveryInput),
    [recoveryInput],
  );
  const closingMetrics = useMemo(
    () => calculateClosingMetrics(closingInput),
    [closingInput],
  );

  const clearAllModuleOutputs = useCallback(() => {
    setInput(EMPTY_LOAN_INPUT);
    setActivePresetId(null);
    setMemo(null);
    setAnalysisError(null);
    setValidationError(null);

    setEwsInput(EMPTY_EARLY_WARNING_INPUT);
    setActiveEwsPresetId(null);
    setEwsMemo(null);
    setEwsError(null);
    setEwsValidationError(null);

    setRecoveryInput(EMPTY_RECOVERY_INPUT);
    setActiveRecoveryPresetId(null);
    setRecoveryMemo(null);
    setRecoveryError(null);
    setRecoveryValidationError(null);

    setClosingInput(EMPTY_CLOSING_INPUT);
    setActiveClosingPresetId(null);
    setClosingBrief(null);
    setClosingError(null);
    setClosingValidationError(null);
  }, []);

  const hydrateCaseIntoWorkspace = useCallback(
    (record: CreditCaseRecord, shouldScroll = true) => {
      clearAllModuleOutputs();
      setActiveCaseId(record.id);
      setMode(record.module);

      if (record.module === 'underwriting') {
        setInput(record.input_payload as LoanApplicationInput);
        setMemo((record.ai_memo_payload as CreditAnalystMemo) || null);
      } else if (record.module === 'early-warning') {
        setEwsInput(record.input_payload as EarlyWarningInput);
        setEwsMemo((record.ai_memo_payload as EarlyWarningMemo) || null);
      } else if (record.module === 'recovery') {
        setRecoveryInput(record.input_payload as RecoveryCaseInput);
        setRecoveryMemo((record.ai_memo_payload as RecoveryMemo) || null);
      } else {
        setClosingInput(record.input_payload as ClosingPlannerInput);
        setClosingBrief((record.ai_memo_payload as ClosingStrategyBrief) || null);
      }

      if (shouldScroll) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [clearAllModuleOutputs],
  );

  // --- Preview Supabase Config Handlers ---
  const handleSavePreviewConfig = useCallback((url: string, anonKey: string) => {
    savePreviewSupabaseConfig(url, anonKey);
    setConfigStatus(getSupabaseConfigStatus());
    setSession(null);
    setUserProfile(null);
    setProfileError(null);
  }, []);

  const handleClearPreviewConfig = useCallback(() => {
    clearPreviewSupabaseConfig();
    setConfigStatus(getSupabaseConfigStatus());
    setSession(null);
    setUserProfile(null);
    setProfileError(null);
    setOrganizations([]);
    setBranchCases([]);
    setSandboxOrg(null);
  }, []);

  // --- Auth Session Subscription ---
  useEffect(() => {
    if (!supabase) {
      setSession(null);
      setIsCheckingAuth(false);
      return;
    }

    let mounted = true;
    setIsCheckingAuth(true);

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setSession(data.session ?? null);
        setIsCheckingAuth(false);
      })
      .catch(() => {
        if (!mounted) return;
        setSession(null);
        setIsCheckingAuth(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession ?? null);
      setIsCheckingAuth(false);
      if (!nextSession) {
        setUserProfile(null);
        setProfileError(null);
        setOrganizations([]);
        setBranchCases([]);
        setSandboxOrg(null);
        setActiveCaseId(null);
        clearAllModuleOutputs();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, clearAllModuleOutputs]);

  // --- Load User Profile Joined With Organization ---
  useEffect(() => {
    if (!supabase || !session?.user) {
      setUserProfile(null);
      setIsLoadingProfile(false);
      return;
    }

    let cancelled = false;
    setIsLoadingProfile(true);
    setProfileError(null);

    fetchUserProfileWithOrg(
      supabase,
      session.user.id,
      session.user.email || '',
    )
      .then((profile) => {
        if (cancelled) return;
        setUserProfile(profile);
        if (profile.role === 'super_admin') {
          setOwnerViewMode('admin');
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setUserProfile(null);
        setProfileError(
          err instanceof Error
            ? err.message
            : 'Unable to verify your NBCI profile.',
        );
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingProfile(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [supabase, session?.user?.id, session?.user?.email]);

  const isOwnerAccount = userProfile?.role === 'super_admin';

  // Effective workspace org & branch code (isolated between client branches and Owner Sandbox)
  const activeWorkspaceOrg: SupabaseOrganization | null = useMemo(() => {
    if (!userProfile) return null;
    if (isOwnerAccount) {
      return ownerViewMode === 'sandbox' ? sandboxOrg : null;
    }
    return userProfile.organization;
  }, [userProfile, isOwnerAccount, ownerViewMode, sandboxOrg]);

  const activeBranchCode = useMemo(() => {
    if (!userProfile) return '';
    if (isOwnerAccount) {
      return OWNER_SANDBOX_BRANCH_CODE;
    }
    return userProfile.branch_code || 'MAIN-01';
  }, [userProfile, isOwnerAccount]);

  // --- Super Admin Organizations Loader ---
  const loadOrganizations = useCallback(async () => {
    if (!supabase || !isOwnerAccount) return;
    setIsLoadingOrgs(true);
    setOrgsError(null);
    try {
      const list = await fetchAllOrganizations(supabase);
      setOrganizations(list);
      const existingSandbox = list.find((o) => o.is_owner_sandbox) || null;
      if (existingSandbox) {
        setSandboxOrg(existingSandbox);
      }
    } catch (err: unknown) {
      setOrgsError(
        err instanceof Error
          ? err.message
          : 'Failed to load organizations from Supabase.',
      );
    } finally {
      setIsLoadingOrgs(false);
    }
  }, [supabase, isOwnerAccount]);

  useEffect(() => {
    if (isOwnerAccount && ownerViewMode === 'admin') {
      void loadOrganizations();
    }
  }, [isOwnerAccount, ownerViewMode, loadOrganizations]);

  // --- Load Branch / Sandbox Credit Cases from Supabase ---
  useEffect(() => {
    if (!supabase || !userProfile) return;

    // Wait for sandbox org creation if super_admin switched to sandbox
    if (isOwnerAccount) {
      if (ownerViewMode !== 'sandbox') return;
      if (!sandboxOrg) {
        let cancelled = false;
        setIsLoadingCases(true);
        ensureOwnerSandboxOrganization(supabase)
          .then((org) => {
            if (!cancelled) {
              setSandboxOrg(org);
            }
          })
          .catch((err: unknown) => {
            if (!cancelled) {
              setSaveError(
                err instanceof Error
                  ? err.message
                  : 'Unable to initialize Owner Prototype Sandbox.',
              );
              setIsLoadingCases(false);
            }
          });
        return () => {
          cancelled = true;
        };
      }
    } else if (
      !userProfile.organization ||
      userProfile.organization.subscription_status !== 'active'
    ) {
      setBranchCases([]);
      return;
    }

    const targetOrg = activeWorkspaceOrg;
    if (!targetOrg) return;

    let cancelled = false;
    setIsLoadingCases(true);
    setSaveError(null);

    fetchBranchCreditCases(supabase, targetOrg.id, activeBranchCode)
      .then((cases) => {
        if (cancelled) return;
        setBranchCases(cases);
        if (cases.length > 0 && !activeCaseId) {
          hydrateCaseIntoWorkspace(cases[0], false);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setSaveError(
          err instanceof Error
            ? err.message
            : 'Unable to load branch cases from Supabase.',
        );
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingCases(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // Intentionally omit activeCaseId & hydrateCaseIntoWorkspace so saving doesn't reload
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    supabase,
    userProfile,
    isOwnerAccount,
    ownerViewMode,
    sandboxOrg,
    activeWorkspaceOrg?.id,
    activeBranchCode,
  ]);

  const handleSignOut = useCallback(async () => {
    setMobileSidebarOpen(false);
    setActiveCaseId(null);
    setSaveError(null);
    clearAllModuleOutputs();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setUserProfile(null);
  }, [supabase, clearAllModuleOutputs]);

  const handleSwitchOwnerView = useCallback(
    async (nextView: 'admin' | 'sandbox') => {
      setOwnerViewMode(nextView);
      setMobileSidebarOpen(false);
      setSaveError(null);
      if (nextView === 'sandbox') {
        clearAllModuleOutputs();
        setActiveCaseId(null);
        if (supabase && !sandboxOrg) {
          try {
            const org = await ensureOwnerSandboxOrganization(supabase);
            setSandboxOrg(org);
          } catch (err: unknown) {
            setSaveError(
              err instanceof Error
                ? err.message
                : 'Unable to initialize Owner Prototype Sandbox.',
            );
          }
        }
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [clearAllModuleOutputs, supabase, sandboxOrg],
  );

  // --- Super Admin Handlers ---
  const handleCreateOrg = useCallback(
    async (payload: CreateOrganizationPayload) => {
      if (!supabase) return;
      const created = await createClientOrganization(supabase, payload);
      setOrganizations((prev) => [created, ...prev]);
    },
    [supabase],
  );

  const handleUpdateOrg = useCallback(
    async (
      orgId: string,
      patch: {
        subscription_status?: SubscriptionStatus;
        branch_seat_limit?: number;
        payment_reference?: string;
        payment_channel?: PaymentChannel;
      },
    ) => {
      if (!supabase) return;
      const updated = await updateOrganizationSubscription(supabase, orgId, patch);
      setOrganizations((prev) =>
        prev.map((org) => (org.id === orgId ? updated : org)),
      );
      if (updated.is_owner_sandbox) {
        setSandboxOrg(updated);
      }
    },
    [supabase],
  );

  // --- Active Module Input Checks ---
  const hasUnderwritingInputs =
    input.monthlyRevenue > 0 ||
    input.requestedLoanAmount > 0 ||
    input.businessName.trim().length > 0;

  const hasEwsInputs =
    ewsInput.sanctionedLimitBdt > 0 ||
    ewsInput.currentOutstandingBdt > 0 ||
    ewsInput.caseCode.trim().length > 0;

  const hasRecoveryInputs =
    recoveryInput.totalOutstandingAmount > 0 ||
    recoveryInput.overdueAmount > 0 ||
    recoveryInput.caseReference.trim().length > 0;

  const hasClosingInputs =
    closingMetrics.totalTargetBdt > 0 ||
    closingMetrics.totalAchievedBdt > 0 ||
    closingInput.branchOrPeriodLabel.trim().length > 0;

  const canSaveCase =
    mode === 'underwriting'
      ? hasUnderwritingInputs
      : mode === 'early-warning'
        ? hasEwsInputs
        : mode === 'recovery'
          ? hasRecoveryInputs
          : hasClosingInputs;

  const canPrint = canSaveCase;

  const persistCurrentCaseToSupabase = useCallback(
    async (overrideMemo?: {
      module: WorkspaceMode;
      memoPayload: CreditCaseMemoPayload | null;
    }) => {
      if (!supabase || !userProfile || !activeWorkspaceOrg) return;

      const targetModule = overrideMemo?.module || mode;
      const branchTag =
        activeBranchCode.replace(/[^A-Z0-9]/gi, '').toUpperCase() || 'BRN';
      let payload: UpsertCreditCasePayload;

      if (targetModule === 'underwriting') {
        const caseCode =
          input.businessName.trim() ||
          `CASE-${branchTag}-${branchCases.length + 101}`;
        payload = {
          id: activeCaseId,
          organization_id: activeWorkspaceOrg.id,
          branch_code: activeBranchCode,
          created_by: userProfile.id,
          case_code: caseCode,
          module: 'underwriting',
          sector: input.businessCategory,
          headline_amount_bdt: input.requestedLoanAmount,
          risk_score: metrics.icrrsScore,
          risk_grade: metrics.icrrsGrade,
          input_payload: {
            ...input,
            ownerMdName: 'Anonymized Signatory',
          },
          metrics_payload: metrics,
          ai_memo_payload:
            overrideMemo?.module === 'underwriting'
              ? overrideMemo.memoPayload
              : memo,
        };
      } else if (targetModule === 'early-warning') {
        const caseCode =
          ewsInput.caseCode.trim() ||
          `EWS-${branchTag}-${branchCases.length + 101}`;
        payload = {
          id: activeCaseId,
          organization_id: activeWorkspaceOrg.id,
          branch_code: activeBranchCode,
          created_by: userProfile.id,
          case_code: caseCode,
          module: 'early-warning',
          sector: ewsInput.sector,
          headline_amount_bdt: ewsInput.currentOutstandingBdt,
          risk_score: ewsMetrics.ewsRiskScore,
          risk_grade: `${ewsMetrics.signalLevel} · ${ewsInput.daysPastDue}d DPD`,
          input_payload: ewsInput,
          metrics_payload: ewsMetrics,
          ai_memo_payload:
            overrideMemo?.module === 'early-warning'
              ? overrideMemo.memoPayload
              : ewsMemo,
        };
      } else if (targetModule === 'recovery') {
        const caseCode =
          recoveryInput.caseReference.trim() ||
          `REC-${branchTag}-${branchCases.length + 101}`;
        payload = {
          id: activeCaseId,
          organization_id: activeWorkspaceOrg.id,
          branch_code: activeBranchCode,
          created_by: userProfile.id,
          case_code: caseCode,
          module: 'recovery',
          sector: recoveryInput.sector,
          headline_amount_bdt: recoveryInput.totalOutstandingAmount,
          risk_score: null,
          risk_grade: `${recoveryInput.classificationStage} · ${recoveryInput.monthsOverdue}m`,
          input_payload: recoveryInput,
          metrics_payload: recoveryMetrics,
          ai_memo_payload:
            overrideMemo?.module === 'recovery'
              ? overrideMemo.memoPayload
              : recoveryMemo,
        };
      } else {
        const caseCode =
          closingInput.branchOrPeriodLabel.trim() ||
          `CLS-${branchTag}-${branchCases.length + 101}`;
        payload = {
          id: activeCaseId,
          organization_id: activeWorkspaceOrg.id,
          branch_code: activeBranchCode,
          created_by: userProfile.id,
          case_code: caseCode,
          module: 'closing',
          sector: 'Branch Closing Cutoff',
          headline_amount_bdt: closingMetrics.totalTargetBdt,
          risk_score: null,
          risk_grade: `${closingInput.daysLeftToClosing}d left`,
          input_payload: closingInput,
          metrics_payload: closingMetrics,
          ai_memo_payload:
            overrideMemo?.module === 'closing'
              ? overrideMemo.memoPayload
              : closingBrief,
        };
      }

      setIsSavingCase(true);
      setSaveError(null);
      try {
        const saved = await upsertCreditCase(supabase, payload);
        setBranchCases((prev) => {
          const exists = prev.some((c) => c.id === saved.id);
          const next = exists
            ? prev.map((c) => (c.id === saved.id ? saved : c))
            : [saved, ...prev];
          return next;
        });
        setActiveCaseId(saved.id);
        setJustSavedFeedback(true);
        window.setTimeout(() => setJustSavedFeedback(false), 1800);
      } catch (err: unknown) {
        setSaveError(
          err instanceof Error
            ? err.message
            : 'Unable to save case to Supabase credit_cases.',
        );
      } finally {
        setIsSavingCase(false);
      }
    },
    [
      supabase,
      userProfile,
      activeWorkspaceOrg,
      activeBranchCode,
      activeCaseId,
      mode,
      branchCases.length,
      input,
      metrics,
      memo,
      ewsInput,
      ewsMetrics,
      ewsMemo,
      recoveryInput,
      recoveryMetrics,
      recoveryMemo,
      closingInput,
      closingMetrics,
      closingBrief,
    ],
  );

  const handleNewCase = useCallback(() => {
    setActiveCaseId(null);
    setSaveError(null);
    const branchSlug =
      activeBranchCode.replace(/[^A-Z0-9]/gi, '').toUpperCase() || 'BRN';
    const seq = String(branchCases.length + 101);
    if (mode === 'underwriting') {
      setInput({
        ...EMPTY_LOAN_INPUT,
        businessName: `CASE-${branchSlug}-${seq}`,
        ownerMdName: 'Anonymized Signatory',
      });
      setActivePresetId(null);
      setMemo(null);
      setValidationError(null);
      setAnalysisError(null);
    } else if (mode === 'early-warning') {
      setEwsInput({
        ...EMPTY_EARLY_WARNING_INPUT,
        caseCode: `EWS-${branchSlug}-${seq}`,
      });
      setActiveEwsPresetId(null);
      setEwsMemo(null);
      setEwsValidationError(null);
      setEwsError(null);
    } else if (mode === 'recovery') {
      setRecoveryInput({
        ...EMPTY_RECOVERY_INPUT,
        caseReference: `REC-${branchSlug}-${seq}`,
      });
      setActiveRecoveryPresetId(null);
      setRecoveryMemo(null);
      setRecoveryValidationError(null);
      setRecoveryError(null);
    } else {
      setClosingInput({
        ...EMPTY_CLOSING_INPUT,
        branchOrPeriodLabel: `${activeBranchCode || 'Branch'} · Closing Plan`,
      });
      setActiveClosingPresetId(null);
      setClosingBrief(null);
      setClosingValidationError(null);
      setClosingError(null);
    }
  }, [activeBranchCode, branchCases.length, mode]);

  const handleDeleteCase = useCallback(
    async (caseId: string) => {
      if (!supabase || !activeWorkspaceOrg) return;
      try {
        await deleteCreditCase(
          supabase,
          caseId,
          activeWorkspaceOrg.id,
          activeBranchCode,
        );
        setBranchCases((prev) => prev.filter((c) => c.id !== caseId));
        if (activeCaseId === caseId) {
          setActiveCaseId(null);
        }
      } catch (err: unknown) {
        setSaveError(
          err instanceof Error
            ? err.message
            : 'Unable to delete case from Supabase.',
        );
      }
    },
    [supabase, activeWorkspaceOrg, activeBranchCode, activeCaseId],
  );

  const handleNavigate = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelectPreset = (preset: SamplePreset) => {
    setInput(preset.data);
    setActivePresetId(preset.id);
    setActiveCaseId(null);
    setValidationError(null);
    setAnalysisError(null);
    setMemo(null);
  };

  const handleSelectEwsPreset = (preset: EarlyWarningPreset) => {
    setEwsInput(preset.data);
    setActiveEwsPresetId(preset.id);
    setActiveCaseId(null);
    setEwsValidationError(null);
    setEwsError(null);
    setEwsMemo(null);
  };

  const handleSelectRecoveryPreset = (preset: RecoveryPreset) => {
    setRecoveryInput(preset.data);
    setActiveRecoveryPresetId(preset.id);
    setActiveCaseId(null);
    setRecoveryValidationError(null);
    setRecoveryError(null);
    setRecoveryMemo(null);
  };

  const handleSelectClosingPreset = (preset: ClosingPreset) => {
    setClosingInput(preset.data);
    setActiveClosingPresetId(preset.id);
    setActiveCaseId(null);
    setClosingValidationError(null);
    setClosingError(null);
    setClosingBrief(null);
  };

  const handleReset = () => {
    setActiveCaseId(null);
    setSaveError(null);
    if (mode === 'underwriting') {
      setInput(EMPTY_LOAN_INPUT);
      setActivePresetId(null);
      setValidationError(null);
      setAnalysisError(null);
      setMemo(null);
    } else if (mode === 'early-warning') {
      setEwsInput(EMPTY_EARLY_WARNING_INPUT);
      setActiveEwsPresetId(null);
      setEwsValidationError(null);
      setEwsError(null);
      setEwsMemo(null);
    } else if (mode === 'recovery') {
      setRecoveryInput(EMPTY_RECOVERY_INPUT);
      setActiveRecoveryPresetId(null);
      setRecoveryValidationError(null);
      setRecoveryError(null);
      setRecoveryMemo(null);
    } else {
      setClosingInput(EMPTY_CLOSING_INPUT);
      setActiveClosingPresetId(null);
      setClosingValidationError(null);
      setClosingError(null);
      setClosingBrief(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // --- Validations & AI Brief Requests ---
  const validateUnderwritingInput = (
    data: LoanApplicationInput,
  ): string | null => {
    if (!data.businessName.trim()) {
      return 'Please enter an anonymized Business / Case Code in Tab 1 before running underwriting.';
    }
    if (!data.businessModelDescription.trim()) {
      return 'Please provide a Business / Project Model Summary in Tab 1.';
    }
    if (data.monthlyRevenue <= 0) {
      return 'Declared Average Monthly Revenue in Tab 3 must be greater than ৳ 0.';
    }
    if (data.requestedLoanAmount <= 0) {
      return 'Requested Loan Amount in Tab 6 must be greater than ৳ 0.';
    }
    if (data.loanTenureMonths <= 0) {
      return 'Loan Tenure must be at least 1 month.';
    }
    if (!data.executionPlan.trim()) {
      return 'Please enter the Detailed Investment / Construction Execution Plan in Tab 6.';
    }
    return null;
  };

  const validateEwsInput = (data: EarlyWarningInput): string | null => {
    if (!data.caseCode.trim()) {
      return 'Please enter an anonymized Case ID before generating an Early Warning brief.';
    }
    if (data.sanctionedLimitBdt <= 0) {
      return 'Sanctioned Limit must be greater than ৳ 0.';
    }
    return null;
  };

  const validateRecoveryInput = (data: RecoveryCaseInput): string | null => {
    if (!data.caseReference.trim()) {
      return 'Please enter an anonymized Borrower / Case Reference before generating a recovery memo.';
    }
    if (data.totalOutstandingAmount <= 0) {
      return 'Total Outstanding Balance must be greater than ৳ 0.';
    }
    if (data.overdueAmount > data.totalOutstandingAmount) {
      return 'Overdue Amount cannot exceed Total Outstanding Balance.';
    }
    return null;
  };

  const validateClosingInput = (data: ClosingPlannerInput): string | null => {
    if (!data.daysLeftToClosing || data.daysLeftToClosing <= 0) {
      return 'Days Left to Closing must be at least 1 day.';
    }
    if (closingMetrics.totalTargetBdt <= 0) {
      return 'Please enter at least one Closing Target (Deposits, Loans, or NPL Recovery) greater than ৳ 0.';
    }
    return null;
  };

  const buildAuthHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }
    return headers;
  };

  const handleAnalyzeUnderwriting = async () => {
    const err = validateUnderwritingInput(input);
    if (err) {
      setValidationError(err);
      return;
    }

    setValidationError(null);
    setAnalysisError(null);
    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/analyze-loan', {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({
          input: { ...input, ownerMdName: 'Anonymized Signatory' },
          metrics,
        }),
      });

      const payload = (await response.json()) as {
        memo?: CreditAnalystMemo;
        error?: string;
      };

      if (!response.ok || !payload.memo) {
        throw new Error(
          payload.error ||
            `Underwriting service returned status ${response.status}.`,
        );
      }

      setMemo(payload.memo);
      await persistCurrentCaseToSupabase({
        module: 'underwriting',
        memoPayload: payload.memo,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to complete underwriting analysis. Please try again.';
      setAnalysisError(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeEws = async () => {
    const err = validateEwsInput(ewsInput);
    if (err) {
      setEwsValidationError(err);
      return;
    }

    setEwsValidationError(null);
    setEwsError(null);
    setIsAnalyzingEws(true);

    try {
      const response = await fetch('/api/analyze-early-warning', {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({ input: ewsInput, metrics: ewsMetrics }),
      });

      const payload = (await response.json()) as {
        memo?: EarlyWarningMemo;
        error?: string;
      };

      if (!response.ok || !payload.memo) {
        throw new Error(
          payload.error ||
            `Early warning service returned status ${response.status}.`,
        );
      }

      setEwsMemo(payload.memo);
      await persistCurrentCaseToSupabase({
        module: 'early-warning',
        memoPayload: payload.memo,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to generate early warning brief. Please try again.';
      setEwsError(message);
    } finally {
      setIsAnalyzingEws(false);
    }
  };

  const handleAnalyzeRecovery = async () => {
    const err = validateRecoveryInput(recoveryInput);
    if (err) {
      setRecoveryValidationError(err);
      return;
    }

    setRecoveryValidationError(null);
    setRecoveryError(null);
    setIsAnalyzingRecovery(true);

    try {
      const response = await fetch('/api/analyze-recovery', {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({
          input: recoveryInput,
          metrics: recoveryMetrics,
        }),
      });

      const payload = (await response.json()) as {
        memo?: RecoveryMemo;
        error?: string;
      };

      if (!response.ok || !payload.memo) {
        throw new Error(
          payload.error ||
            `Recovery analysis service returned status ${response.status}.`,
        );
      }

      setRecoveryMemo(payload.memo);
      await persistCurrentCaseToSupabase({
        module: 'recovery',
        memoPayload: payload.memo,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to generate recovery & resolution memo. Please try again.';
      setRecoveryError(message);
    } finally {
      setIsAnalyzingRecovery(false);
    }
  };

  const handleAnalyzeClosing = async () => {
    const err = validateClosingInput(closingInput);
    if (err) {
      setClosingValidationError(err);
      return;
    }

    setClosingValidationError(null);
    setClosingError(null);
    setIsAnalyzingClosing(true);

    try {
      const response = await fetch('/api/analyze-closing', {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({
          input: closingInput,
          metrics: closingMetrics,
        }),
      });

      const payload = (await response.json()) as {
        brief?: ClosingStrategyBrief;
        error?: string;
      };

      if (!response.ok || !payload.brief) {
        throw new Error(
          payload.error ||
            `Closing planner service returned status ${response.status}.`,
        );
      }

      setClosingBrief(payload.brief);
      await persistCurrentCaseToSupabase({
        module: 'closing',
        memoPayload: payload.brief,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to generate closing strategy brief. Please try again.';
      setClosingError(message);
    } finally {
      setIsAnalyzingClosing(false);
    }
  };

  // --- View Router ---
  let mainContent: React.ReactNode;

  if (isCheckingAuth || (session && isLoadingProfile)) {
    mainContent = (
      <div className="min-h-screen bg-[#000000] text-neutral-100 flex items-center justify-center p-6">
        <div className="flex items-center gap-3 rounded-xl border border-[#262626] bg-[#0D0D0D] px-5 py-4 text-sm font-medium shadow-xs">
          <Loader2 className="h-4 w-4 animate-spin text-[#10B981]" aria-hidden="true" />
          <span>Verifying NBCI Supabase session &amp; branch license…</span>
        </div>
      </div>
    );
  } else if (!configStatus.isConfigured || !session || !userProfile) {
    // View 1: Supabase Preview Setup or Real Auth Sign-In Gate
    mainContent = (
      <LoginGate
        configStatus={configStatus}
        onSavePreviewConfig={handleSavePreviewConfig}
        onClearPreviewConfig={handleClearPreviewConfig}
        profileError={profileError}
        onSignOutProfileError={session ? () => void handleSignOut() : undefined}
      />
    );
  } else if (isOwnerAccount && ownerViewMode === 'admin') {
    // View 4: NBCI Super Admin Subscription & License Manager
    mainContent = (
      <SuperAdminPanel
        adminProfile={userProfile}
        organizations={organizations}
        isLoadingOrgs={isLoadingOrgs}
        orgsError={orgsError}
        onRefreshOrgs={loadOrganizations}
        onCreateOrg={handleCreateOrg}
        onUpdateOrg={handleUpdateOrg}
        onSignOut={() => void handleSignOut()}
        onSwitchToSandbox={() => void handleSwitchOwnerView('sandbox')}
      />
    );
  } else if (
    !isOwnerAccount &&
    (!userProfile.organization ||
      userProfile.organization.subscription_status !== 'active')
  ) {
    // View 3: Real Subscription Status Gate (pending or suspended)
    mainContent = (
      <SubscriptionGate
        userProfile={userProfile}
        onSignOut={() => void handleSignOut()}
      />
    );
  } else if (!activeWorkspaceOrg) {
    mainContent = (
      <div className="min-h-screen bg-[#000000] text-neutral-100 flex items-center justify-center p-6">
        <div className="max-w-md rounded-xl border border-[#262626] bg-[#0D0D0D] p-6 space-y-3 text-center">
          <Loader2 className="h-5 w-5 animate-spin text-[#10B981] mx-auto" aria-hidden="true" />
          <div className="text-sm font-semibold text-white">
            Preparing Owner App Sandbox…
          </div>
          {saveError && (
            <p className="text-xs text-red-400">{saveError}</p>
          )}
        </div>
      </div>
    );
  } else {
    // View 2: Per-Branch Isolated Workspace (or Owner App Sandbox)
    const branchCode = activeBranchCode;

    mainContent = (
      <div id="top" className="min-h-screen bg-[#000000] text-neutral-100 flex print:bg-white print:text-slate-900">
        <BranchSidebar
          userProfile={userProfile}
          organization={activeWorkspaceOrg}
          branchCode={branchCode}
          mode={mode}
          onSelectMode={(nextMode) => {
            setMode(nextMode);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          branchCases={branchCases}
          isLoadingCases={isLoadingCases}
          activeCaseId={activeCaseId}
          onSelectSavedCase={(c) => hydrateCaseIntoWorkspace(c, true)}
          onNewCase={handleNewCase}
          onDeleteCase={(caseId) => void handleDeleteCase(caseId)}
          onSignOut={() => void handleSignOut()}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        <div className="flex-1 min-w-0 flex flex-col">
          <TopBar
            mode={mode}
            branchCode={branchCode}
            bankName={activeWorkspaceOrg.name}
            onNavigate={handleNavigate}
            onPrint={handlePrint}
            canPrint={canPrint}
            onReplayIntro={handleReplayIntro}
            onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
            isOwnerAccount={isOwnerAccount}
            onSwitchToAdmin={() => void handleSwitchOwnerView('admin')}
          />

          <PresetToolbar
            mode={mode}
            branchCode={branchCode}
            onModeChange={(nextMode) => {
              setMode(nextMode);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            underwritingPresets={SAMPLE_PRESETS}
            activeUnderwritingPresetId={activePresetId}
            onSelectUnderwritingPreset={handleSelectPreset}
            earlyWarningPresets={EARLY_WARNING_PRESETS}
            activeEarlyWarningPresetId={activeEwsPresetId}
            onSelectEarlyWarningPreset={handleSelectEwsPreset}
            recoveryPresets={RECOVERY_PRESETS}
            activeRecoveryPresetId={activeRecoveryPresetId}
            onSelectRecoveryPreset={handleSelectRecoveryPreset}
            closingPresets={CLOSING_PRESETS}
            activeClosingPresetId={activeClosingPresetId}
            onSelectClosingPreset={handleSelectClosingPreset}
            onSaveCaseToBranch={() => void persistCurrentCaseToSupabase()}
            canSaveCase={canSaveCase}
            isSavingCase={isSavingCase}
            justSavedFeedback={justSavedFeedback}
            onReset={handleReset}
            showIntroOnStartup={showIntroOnStartup}
            onToggleShowIntroOnStartup={handleToggleShowIntroOnStartup}
          />

          {saveError && (
            <div className="mx-4 sm:mx-6 mt-4 flex items-center justify-between gap-3 rounded-xl border border-red-500/35 bg-red-950/30 px-4 py-2.5 text-xs text-red-400 print:hidden">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{saveError}</span>
              </div>
              <button
                type="button"
                onClick={() => setSaveError(null)}
                className="font-semibold hover:underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          <main className="flex-1 px-4 sm:px-6 py-6 print:p-0">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={mode}
                initial={
                  prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }
                }
                animate={{ opacity: 1, y: 0 }}
                exit={
                  prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }
                }
                transition={{
                  duration: prefersReducedMotion ? 0.12 : 0.22,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {mode === 'underwriting' ? (
                  <>
                    {/* Print-only NBCI Underwriting Cover Header */}
                    <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <h1 className="font-display text-xl font-bold text-slate-900">
                            NORTHERN BANKING CREDIT INTELLIGENCE (NBCI) · CREDIT MEMO
                          </h1>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {activeWorkspaceOrg.name} ({branchCode}) · Bangladesh Bank ICRRS (Zero-PII)
                          </p>
                        </div>
                        <div className="text-right font-mono text-xs text-slate-700 tabular-nums">
                          <div>Date: {new Date().toLocaleDateString('en-GB')}</div>
                          <div>
                            {input.facilityType}: {formatBDT(input.requestedLoanAmount)}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-4 gap-3 text-xs text-slate-700 border-t border-slate-200 pt-2.5">
                        <div>
                          <span className="font-semibold text-slate-900">Case ID:</span>{' '}
                          {input.businessName || '—'} ({input.legalStructure})
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900">Sector:</span>{' '}
                          {input.businessCategory}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900">ICRRS / CIB:</span>{' '}
                          {metrics.icrrsScore}/100 ({input.cibStatus})
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900">FSV Cover:</span>{' '}
                          {formatBDT(input.forcedSaleValue)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                      <div className="xl:col-span-5 print:hidden">
                        <LoanInputForm
                          input={input}
                          onChange={(updated) => {
                            setInput(updated);
                            setActivePresetId(null);
                            if (validationError) setValidationError(null);
                          }}
                          onAnalyze={handleAnalyzeUnderwriting}
                          isAnalyzing={isAnalyzing}
                          validationError={validationError}
                        />
                      </div>

                      <div className="xl:col-span-7 space-y-6 print:col-span-12">
                        <MetricsDashboard
                          input={input}
                          metrics={metrics}
                          hasInputs={hasUnderwritingInputs}
                        />

                        <ForensicRedFlagsBox
                          input={input}
                          metrics={metrics}
                          hasInputs={hasUnderwritingInputs}
                        />

                        <CreditMemoReport
                          input={input}
                          metrics={metrics}
                          memo={memo}
                          isLoading={isAnalyzing}
                          error={analysisError}
                          onRetry={handleAnalyzeUnderwriting}
                          onPrint={handlePrint}
                          onLoadDefaultPreset={() =>
                            handleSelectPreset(SAMPLE_PRESETS[0])
                          }
                        />
                      </div>
                    </div>
                  </>
                ) : mode === 'early-warning' ? (
                  <>
                    {/* Print-only NBCI Early Warning Cover Header */}
                    <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <h1 className="font-display text-xl font-bold text-slate-900">
                            NBCI · POST-SANCTION EARLY WARNING BRIEF
                          </h1>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {activeWorkspaceOrg.name} ({branchCode}) · Zero-PII Branch Monitoring
                          </p>
                        </div>
                        <div className="text-right font-mono text-xs text-slate-700 tabular-nums">
                          <div>Case: {ewsInput.caseCode || '—'}</div>
                          <div>Signal: {ewsMetrics.signalLevel} ({ewsMetrics.ewsRiskScore}/100)</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                      <div className="xl:col-span-5 print:hidden">
                        <EarlyWarningInputForm
                          input={ewsInput}
                          onChange={(updated) => {
                            setEwsInput(updated);
                            setActiveEwsPresetId(null);
                            if (ewsValidationError) setEwsValidationError(null);
                          }}
                          onAnalyze={handleAnalyzeEws}
                          isAnalyzing={isAnalyzingEws}
                          validationError={ewsValidationError}
                        />
                      </div>

                      <div className="xl:col-span-7 space-y-6 print:col-span-12">
                        <EarlyWarningDashboard
                          input={ewsInput}
                          metrics={ewsMetrics}
                          hasInputs={hasEwsInputs}
                        />

                        <EarlyWarningMemoReport
                          input={ewsInput}
                          memo={ewsMemo}
                          isLoading={isAnalyzingEws}
                          error={ewsError}
                          onRetry={handleAnalyzeEws}
                          onPrint={handlePrint}
                          onLoadDefaultPreset={() =>
                            handleSelectEwsPreset(EARLY_WARNING_PRESETS[0])
                          }
                        />
                      </div>
                    </div>
                  </>
                ) : mode === 'recovery' ? (
                  <>
                    <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <h1 className="font-display text-xl font-bold text-slate-900">
                            NBCI · RECOVERY &amp; RESOLUTION BRIEF
                          </h1>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {activeWorkspaceOrg.name} ({branchCode}) · Bangladesh Bank BRPD
                          </p>
                        </div>
                        <div className="text-right font-mono text-xs text-slate-700 tabular-nums">
                          <div>Date: {new Date().toLocaleDateString('en-GB')}</div>
                          <div>
                            Outstanding: {formatBDT(recoveryInput.totalOutstandingAmount)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                      <div className="xl:col-span-5 print:hidden">
                        <RecoveryInputForm
                          input={recoveryInput}
                          onChange={(updated) => {
                            setRecoveryInput(updated);
                            setActiveRecoveryPresetId(null);
                            if (recoveryValidationError) {
                              setRecoveryValidationError(null);
                            }
                          }}
                          onAnalyze={handleAnalyzeRecovery}
                          isAnalyzing={isAnalyzingRecovery}
                          validationError={recoveryValidationError}
                        />
                      </div>

                      <div className="xl:col-span-7 space-y-6 print:col-span-12">
                        <RecoveryDashboard
                          input={recoveryInput}
                          metrics={recoveryMetrics}
                          hasInputs={hasRecoveryInputs}
                        />

                        <RecoveryMemoReport
                          input={recoveryInput}
                          memo={recoveryMemo}
                          isLoading={isAnalyzingRecovery}
                          error={recoveryError}
                          onRetry={handleAnalyzeRecovery}
                          onPrint={handlePrint}
                          onLoadDefaultPreset={() =>
                            handleSelectRecoveryPreset(RECOVERY_PRESETS[0])
                          }
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <h1 className="font-display text-xl font-bold text-slate-900">
                            NBCI · BRANCH CLOSING PLAYBOOK &amp; ACTION SHEET
                          </h1>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {activeWorkspaceOrg.name} ({branchCode}) · Anonymized Execution Plan
                          </p>
                        </div>
                        <div className="text-right font-mono text-xs text-slate-700 tabular-nums">
                          <div>Date: {new Date().toLocaleDateString('en-GB')}</div>
                          <div>{closingInput.daysLeftToClosing} Days Left</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                      <div className="xl:col-span-5 print:hidden">
                        <ClosingPlannerForm
                          input={closingInput}
                          onChange={(updated) => {
                            setClosingInput(updated);
                            setActiveClosingPresetId(null);
                            if (closingValidationError) {
                              setClosingValidationError(null);
                            }
                          }}
                          onAnalyze={handleAnalyzeClosing}
                          isAnalyzing={isAnalyzingClosing}
                          validationError={closingValidationError}
                        />
                      </div>

                      <div className="xl:col-span-7 space-y-6 print:col-span-12">
                        <ClosingDashboard
                          input={closingInput}
                          metrics={closingMetrics}
                          hasInputs={hasClosingInputs}
                        />

                        <ClosingBriefReport
                          input={closingInput}
                          brief={closingBrief}
                          isLoading={isAnalyzingClosing}
                          error={closingError}
                          onRetry={handleAnalyzeClosing}
                          onPrint={handlePrint}
                          onLoadDefaultPreset={() =>
                            handleSelectClosingPreset(CLOSING_PRESETS[0])
                          }
                        />
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {showIntro && (
          <IntroSplashScreen
            key={introReplayKey}
            onDismiss={handleDismissIntro}
            showIntroOnStartup={showIntroOnStartup}
            onToggleShowOnStartup={handleToggleShowIntroOnStartup}
          />
        )}
      </AnimatePresence>
      {mainContent}
    </>
  );
}
