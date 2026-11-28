import {
  Activity,
  BookmarkPlus,
  Check,
  FileSpreadsheet,
  Loader2,
  RotateCcw,
  Scale,
  ShieldCheck,
  Target,
} from 'lucide-react';
import type { WorkspaceMode } from '../types/credit';
import type { ClosingPreset } from '../utils/closing';
import type { EarlyWarningPreset } from '../utils/earlyWarning';
import type { SamplePreset } from '../utils/finance';
import { formatBDT } from '../utils/finance';
import type { RecoveryPreset } from '../utils/recovery';

interface PresetToolbarProps {
  mode: WorkspaceMode;
  branchCode: string;
  onModeChange: (mode: WorkspaceMode) => void;
  underwritingPresets: SamplePreset[];
  activeUnderwritingPresetId: string | null;
  onSelectUnderwritingPreset: (preset: SamplePreset) => void;
  earlyWarningPresets: EarlyWarningPreset[];
  activeEarlyWarningPresetId: string | null;
  onSelectEarlyWarningPreset: (preset: EarlyWarningPreset) => void;
  recoveryPresets: RecoveryPreset[];
  activeRecoveryPresetId: string | null;
  onSelectRecoveryPreset: (preset: RecoveryPreset) => void;
  closingPresets: ClosingPreset[];
  activeClosingPresetId: string | null;
  onSelectClosingPreset: (preset: ClosingPreset) => void;
  onSaveCaseToBranch: () => void;
  canSaveCase: boolean;
  isSavingCase: boolean;
  justSavedFeedback: boolean;
  onReset: () => void;
  showIntroOnStartup: boolean;
  onToggleShowIntroOnStartup: (next: boolean) => void;
}

export function PresetToolbar({
  mode,
  branchCode,
  onModeChange,
  underwritingPresets,
  activeUnderwritingPresetId,
  onSelectUnderwritingPreset,
  earlyWarningPresets,
  activeEarlyWarningPresetId,
  onSelectEarlyWarningPreset,
  recoveryPresets,
  activeRecoveryPresetId,
  onSelectRecoveryPreset,
  closingPresets,
  activeClosingPresetId,
  onSelectClosingPreset,
  onSaveCaseToBranch,
  canSaveCase,
  isSavingCase,
  justSavedFeedback,
  onReset,
  showIntroOnStartup,
  onToggleShowIntroOnStartup,
}: PresetToolbarProps) {
  return (
    <div className="border-b border-[#262626] bg-[#0D0D0D] print:hidden">
      <div className="px-4 sm:px-6 py-3 space-y-2.5">
        {/* Top Row: Active Module Subtitle + 4-Module Quick Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#262626] pb-2.5">
          <div>
            <p className="text-xs font-semibold text-white">
              Northern Banking Credit Intelligence (NBCI) · {branchCode}
            </p>
            <span className="text-[11px] text-neutral-400">
              {mode === 'underwriting'
                ? 'Pre-Loan Business Analysis — Risk Score, Stressed DSCR, Bank Turnover vs. Sales & Safe Limit (৳)'
                : mode === 'early-warning'
                  ? 'Post-Sanction Early Warning Monitor — Branch Routing Discipline, DPD Slippage & Stock Cover'
                  : mode === 'recovery'
                    ? 'Defaulted Loan Recovery & Resolution — Cash Recovery Realism & Head Office SAMD Reporting'
                    : 'Branch Closing Execution Assistant — Daily Action Queue, Bottleneck Unblocking & Quality Guardrails'}
            </span>
          </div>

          <div
            role="tablist"
            aria-label="Operational Mode Switcher"
            className="inline-flex flex-wrap rounded-lg border border-[#262626] bg-[#141414] p-1 gap-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'underwriting'}
              onClick={() => onModeChange('underwriting')}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all duration-200 ease-out whitespace-nowrap cursor-pointer ${
                mode === 'underwriting'
                  ? 'bg-white text-black shadow-xs'
                  : 'text-neutral-300 hover:bg-[#1C1C1C] hover:text-white'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Pre-Loan Analysis</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={mode === 'early-warning'}
              onClick={() => onModeChange('early-warning')}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all duration-200 ease-out whitespace-nowrap cursor-pointer ${
                mode === 'early-warning'
                  ? 'bg-white text-black shadow-xs'
                  : 'text-neutral-300 hover:bg-[#1C1C1C] hover:text-white'
              }`}
            >
              <Activity className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Early Warning</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={mode === 'recovery'}
              onClick={() => onModeChange('recovery')}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all duration-200 ease-out whitespace-nowrap cursor-pointer ${
                mode === 'recovery'
                  ? 'bg-white text-black shadow-xs'
                  : 'text-neutral-300 hover:bg-[#1C1C1C] hover:text-white'
              }`}
            >
              <Scale className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Loan Recovery</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={mode === 'closing'}
              onClick={() => onModeChange('closing')}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all duration-200 ease-out whitespace-nowrap cursor-pointer ${
                mode === 'closing'
                  ? 'bg-white text-black shadow-xs'
                  : 'text-neutral-300 hover:bg-[#1C1C1C] hover:text-white'
              }`}
            >
              <Target className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Branch Closing</span>
            </button>
          </div>
        </div>

        {/* Bottom Row: Presets + Save to Branch Vault + Clear Form */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-neutral-400 mr-0.5 whitespace-nowrap">
              {mode === 'underwriting'
                ? 'Sample Cases:'
                : mode === 'early-warning'
                  ? 'EWS Samples:'
                  : mode === 'recovery'
                    ? 'Recovery Samples:'
                    : 'Closing Samples:'}
            </span>

            {mode === 'underwriting' &&
              underwritingPresets.map((preset) => {
                const isActive = activeUnderwritingPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onSelectUnderwritingPreset(preset)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all duration-200 ease-out whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'border-white/55 bg-[#1F1F1F] text-white font-semibold shadow-xs'
                        : 'border-[#262626] bg-[#141414] text-neutral-300 hover:border-[#404040] hover:bg-[#1A1A1A] hover:text-white'
                    }`}
                  >
                    <FileSpreadsheet
                      className="h-3.5 w-3.5 shrink-0 text-[#34D399]"
                      aria-hidden="true"
                    />
                    <span>{preset.buttonLabel}</span>
                    <span className="font-mono text-[11px] text-neutral-400 tabular-nums">
                      ({formatBDT(preset.data.requestedLoanAmount)})
                    </span>
                  </button>
                );
              })}

            {mode === 'early-warning' &&
              earlyWarningPresets.map((preset) => {
                const isActive = activeEarlyWarningPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onSelectEarlyWarningPreset(preset)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all duration-200 ease-out whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'border-white/55 bg-[#1F1F1F] text-white font-semibold shadow-xs'
                        : 'border-[#262626] bg-[#141414] text-neutral-300 hover:border-[#404040] hover:bg-[#1A1A1A] hover:text-white'
                    }`}
                  >
                    <FileSpreadsheet
                      className="h-3.5 w-3.5 shrink-0 text-[#10B981]"
                      aria-hidden="true"
                    />
                    <span>{preset.buttonLabel}</span>
                    <span className="font-mono text-[11px] text-neutral-400 tabular-nums">
                      ({preset.data.daysPastDue}d DPD)
                    </span>
                  </button>
                );
              })}

            {mode === 'recovery' &&
              recoveryPresets.map((preset) => {
                const isActive = activeRecoveryPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onSelectRecoveryPreset(preset)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all duration-200 ease-out whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'border-white/55 bg-[#1F1F1F] text-white font-semibold shadow-xs'
                        : 'border-[#262626] bg-[#141414] text-neutral-300 hover:border-[#404040] hover:bg-[#1A1A1A] hover:text-white'
                    }`}
                  >
                    <FileSpreadsheet
                      className="h-3.5 w-3.5 shrink-0 text-[#FBBF24]"
                      aria-hidden="true"
                    />
                    <span>{preset.buttonLabel}</span>
                    <span className="font-mono text-[11px] text-neutral-400 tabular-nums">
                      ({formatBDT(preset.data.totalOutstandingAmount)})
                    </span>
                  </button>
                );
              })}

            {mode === 'closing' &&
              closingPresets.map((preset) => {
                const isActive = activeClosingPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onSelectClosingPreset(preset)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all duration-200 ease-out whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'border-white/55 bg-[#1F1F1F] text-white font-semibold shadow-xs'
                        : 'border-[#262626] bg-[#141414] text-neutral-300 hover:border-[#404040] hover:bg-[#1A1A1A] hover:text-white'
                    }`}
                  >
                    <FileSpreadsheet
                      className="h-3.5 w-3.5 shrink-0 text-white"
                      aria-hidden="true"
                    />
                    <span>{preset.buttonLabel}</span>
                    <span className="font-mono text-[11px] text-neutral-400 tabular-nums">
                      ({preset.data.daysLeftToClosing}d left)
                    </span>
                  </button>
                );
              })}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              role="switch"
              aria-checked={showIntroOnStartup}
              onClick={() => onToggleShowIntroOnStartup(!showIntroOnStartup)}
              className="hidden sm:inline-flex items-center gap-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span
                aria-hidden="true"
                className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors duration-200 ${
                  showIntroOnStartup ? 'bg-white' : 'bg-[#262626]'
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full transition-transform duration-200 ${
                    showIntroOnStartup
                      ? 'translate-x-3.5 bg-black'
                      : 'translate-x-0.5 bg-neutral-300'
                  }`}
                />
              </span>
              <span>Intro</span>
            </button>

            <button
              type="button"
              onClick={onSaveCaseToBranch}
              disabled={!canSaveCase || isSavingCase}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/35 px-3 py-1.5 text-xs font-semibold text-[#34D399] transition-colors hover:bg-emerald-950/55 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isSavingCase ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  <span>Saving to Supabase…</span>
                </>
              ) : justSavedFeedback ? (
                <>
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Saved to Supabase</span>
                </>
              ) : (
                <>
                  <BookmarkPlus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Save Case to Supabase</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#262626] bg-[#141414] px-3 py-1.5 text-xs font-medium text-neutral-300 transition-all duration-200 hover:border-[#404040] hover:bg-[#1C1C1C] hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Clear Form</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
