import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useCallback, useMemo, useState } from 'react';
import { ClosingBriefReport } from './components/ClosingBriefReport';
import { ClosingDashboard } from './components/ClosingDashboard';
import { ClosingPlannerForm } from './components/ClosingPlannerForm';
import { CreditMemoReport } from './components/CreditMemoReport';
import { ForensicRedFlagsBox } from './components/ForensicRedFlagsBox';
import { IntroSplashScreen } from './components/IntroSplashScreen';
import { LoanInputForm } from './components/LoanInputForm';
import { MetricsDashboard } from './components/MetricsDashboard';
import { PresetToolbar } from './components/PresetToolbar';
import { RecoveryDashboard } from './components/RecoveryDashboard';
import { RecoveryInputForm } from './components/RecoveryInputForm';
import { RecoveryMemoReport } from './components/RecoveryMemoReport';
import { TopBar } from './components/TopBar';
import type {
  ClosingPlannerInput,
  ClosingStrategyBrief,
  CreditAnalystMemo,
  LoanApplicationInput,
  RecoveryCaseInput,
  RecoveryMemo,
  WorkspaceMode,
} from './types/credit';
import type { ClosingPreset } from './utils/closing';
import {
  CLOSING_PRESETS,
  EMPTY_CLOSING_INPUT,
  calculateClosingMetrics,
} from './utils/closing';
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

const INTRO_STORAGE_KEY = 'ncg_show_intro_on_startup';

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
      // Ignore storage access errors in restricted frames
    }
  }, []);

  const handleDismissIntro = useCallback(() => {
    setShowIntro(false);
  }, []);

  const handleReplayIntro = useCallback(() => {
    setIntroReplayKey((prev) => prev + 1);
    setShowIntro(true);
  }, []);

  const [mode, setMode] = useState<WorkspaceMode>('underwriting');

  // --- Mode 1: Pre-Loan Underwriting State ---
  const [input, setInput] = useState<LoanApplicationInput>(EMPTY_LOAN_INPUT);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [memo, setMemo] = useState<CreditAnalystMemo | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // --- Mode 2: Defaulted Loan Recovery & Resolution State ---
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

  // --- Mode 3: Closing Target & Pipeline Planner State ---
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
  const recoveryMetrics = useMemo(
    () => calculateRecoveryMetrics(recoveryInput),
    [recoveryInput],
  );
  const closingMetrics = useMemo(
    () => calculateClosingMetrics(closingInput),
    [closingInput],
  );

  const hasUnderwritingInputs =
    input.monthlyRevenue > 0 ||
    input.requestedLoanAmount > 0 ||
    input.businessName.trim().length > 0;

  const hasRecoveryInputs =
    recoveryInput.totalOutstandingAmount > 0 ||
    recoveryInput.overdueAmount > 0 ||
    recoveryInput.caseReference.trim().length > 0;

  const hasClosingInputs =
    closingMetrics.totalTargetBdt > 0 ||
    closingMetrics.totalAchievedBdt > 0 ||
    closingInput.branchOrPeriodLabel.trim().length > 0;

  const canPrint =
    mode === 'underwriting'
      ? hasUnderwritingInputs
      : mode === 'recovery'
        ? hasRecoveryInputs
        : hasClosingInputs;

  const handleNavigate = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelectPreset = (preset: SamplePreset) => {
    setInput(preset.data);
    setActivePresetId(preset.id);
    setValidationError(null);
    setAnalysisError(null);
    setMemo(null);
  };

  const handleSelectRecoveryPreset = (preset: RecoveryPreset) => {
    setRecoveryInput(preset.data);
    setActiveRecoveryPresetId(preset.id);
    setRecoveryValidationError(null);
    setRecoveryError(null);
    setRecoveryMemo(null);
  };

  const handleSelectClosingPreset = (preset: ClosingPreset) => {
    setClosingInput(preset.data);
    setActiveClosingPresetId(preset.id);
    setClosingValidationError(null);
    setClosingError(null);
    setClosingBrief(null);
  };

  const handleReset = () => {
    if (mode === 'underwriting') {
      setInput(EMPTY_LOAN_INPUT);
      setActivePresetId(null);
      setValidationError(null);
      setAnalysisError(null);
      setMemo(null);
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

  const validateUnderwritingInput = (
    data: LoanApplicationInput,
  ): string | null => {
    if (!data.businessName.trim()) {
      return 'Please enter the Business Name in Tab 1 before running underwriting.';
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input, metrics }),
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

      if (window.innerWidth < 1024) {
        setTimeout(() => {
          handleNavigate('section-icrrs');
        }, 80);
      }
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
        headers: {
          'Content-Type': 'application/json',
        },
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

      if (window.innerWidth < 1024) {
        setTimeout(() => {
          handleNavigate('section-recovery-metrics');
        }, 80);
      }
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
        headers: {
          'Content-Type': 'application/json',
        },
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

      if (window.innerWidth < 1024) {
        setTimeout(() => {
          handleNavigate('section-closing-metrics');
        }, 80);
      }
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

  return (
    <div id="top" className="min-h-screen bg-[#F8FAFC] text-[#0B192C]">
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

      <TopBar
        mode={mode}
        onNavigate={handleNavigate}
        onPrint={handlePrint}
        canPrint={canPrint}
        onReplayIntro={handleReplayIntro}
      />

      <PresetToolbar
        mode={mode}
        onModeChange={(nextMode) => {
          setMode(nextMode);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        underwritingPresets={SAMPLE_PRESETS}
        activeUnderwritingPresetId={activePresetId}
        onSelectUnderwritingPreset={handleSelectPreset}
        recoveryPresets={RECOVERY_PRESETS}
        activeRecoveryPresetId={activeRecoveryPresetId}
        onSelectRecoveryPreset={handleSelectRecoveryPreset}
        closingPresets={CLOSING_PRESETS}
        activeClosingPresetId={activeClosingPresetId}
        onSelectClosingPreset={handleSelectClosingPreset}
        onReset={handleReset}
        showIntroOnStartup={showIntroOnStartup}
        onToggleShowIntroOnStartup={handleToggleShowIntroOnStartup}
      />

      <main className="mx-auto max-w-[1440px] px-4 sm:px-6 py-6 print:p-0 print:max-w-none">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={mode}
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{
              duration: prefersReducedMotion ? 0.12 : 0.24,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {mode === 'underwriting' ? (
          <>
            {/* Print-only Northern Consulting Group Underwriting Cover Header */}
            <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
              <div className="flex items-baseline justify-between">
                <div>
                  <h1 className="font-display text-xl font-bold text-slate-900">
                    NORTHERN CONSULTING GROUP · OFFICIAL CREDIT MEMO
                  </h1>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Commercial Credit Risk &amp; Business Underwriting Suite (BDT) · Bangladesh Bank ICRRS
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
                  <span className="font-semibold text-slate-900">Borrower:</span>{' '}
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

            {/* Two-Column Underwriting Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-5 print:hidden">
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

              <div className="lg:col-span-7 space-y-6 print:col-span-12">
                <MetricsDashboard
                  input={input}
                  metrics={metrics}
                  hasInputs={hasUnderwritingInputs}
                />

                <ForensicRedFlagsBox
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
        ) : mode === 'recovery' ? (
          <>
            {/* Print-only Northern Consulting Group Recovery Cover Header */}
            <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
              <div className="flex items-baseline justify-between">
                <div>
                  <h1 className="font-display text-xl font-bold text-slate-900">
                    NORTHERN CONSULTING GROUP · RECOVERY &amp; RESOLUTION BRIEF
                  </h1>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Defaulted Loan Recovery &amp; Head Office SAMD Reporting (BDT) · Bangladesh Bank BRPD
                  </p>
                </div>
                <div className="text-right font-mono text-xs text-slate-700 tabular-nums">
                  <div>Date: {new Date().toLocaleDateString('en-GB')}</div>
                  <div>
                    Outstanding: {formatBDT(recoveryInput.totalOutstandingAmount)}
                  </div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-3 text-xs text-slate-700 border-t border-slate-200 pt-2.5">
                <div>
                  <span className="font-semibold text-slate-900">Case Ref:</span>{' '}
                  {recoveryInput.caseReference || '—'}
                </div>
                <div>
                  <span className="font-semibold text-slate-900">Stage:</span>{' '}
                  {recoveryInput.classificationStage}
                </div>
                <div>
                  <span className="font-semibold text-slate-900">Overdue:</span>{' '}
                  {formatBDT(recoveryInput.overdueAmount)} ({recoveryInput.monthsOverdue} mo)
                </div>
                <div>
                  <span className="font-semibold text-slate-900">Net Cash/Mo:</span>{' '}
                  {formatBDT(recoveryMetrics.monthlyNetCashForRecovery)}
                </div>
              </div>
            </div>

            {/* Two-Column Recovery Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-5 print:hidden">
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

              <div className="lg:col-span-7 space-y-6 print:col-span-12">
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
            {/* Print-only Northern Consulting Group Closing Plan Cover Header */}
            <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
              <div className="flex items-baseline justify-between">
                <div>
                  <h1 className="font-display text-xl font-bold text-slate-900">
                    NORTHERN CONSULTING GROUP · BRANCH CLOSING PLAYBOOK &amp; ACTION SHEET
                  </h1>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Daily Closing Execution Queue, Bottleneck Unblocking &amp; Quality Guardrails (BDT · Anonymized)
                  </p>
                </div>
                <div className="text-right font-mono text-xs text-slate-700 tabular-nums">
                  <div>Date: {new Date().toLocaleDateString('en-GB')}</div>
                  <div>{closingInput.daysLeftToClosing} Days Left</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-3 text-xs text-slate-700 border-t border-slate-200 pt-2.5">
                <div>
                  <span className="font-semibold text-slate-900">Period:</span>{' '}
                  {closingInput.branchOrPeriodLabel || 'Branch Closing'}
                </div>
                <div>
                  <span className="font-semibold text-slate-900">Wtd. Expected:</span>{' '}
                  {formatBDT(closingMetrics.totalWeightedExpectedAchievementBdt)}
                </div>
                <div>
                  <span className="font-semibold text-slate-900">Rem. Gap:</span>{' '}
                  {formatBDT(closingMetrics.totalRemainingGapBdt)}
                </div>
                <div>
                  <span className="font-semibold text-slate-900">Daily Pace:</span>{' '}
                  {formatBDT(closingMetrics.totalRequiredDailyPaceBdt)}/d
                </div>
              </div>
            </div>

            {/* Two-Column Closing Target & Pipeline Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-5 print:hidden">
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

              <div className="lg:col-span-7 space-y-6 print:col-span-12">
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
  );
}

