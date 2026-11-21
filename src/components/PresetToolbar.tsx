import {
  FileSpreadsheet,
  RotateCcw,
  Scale,
  ShieldCheck,
  Target,
} from 'lucide-react';
import type { WorkspaceMode } from '../types/credit';
import type { ClosingPreset } from '../utils/closing';
import type { SamplePreset } from '../utils/finance';
import { formatBDT } from '../utils/finance';
import type { RecoveryPreset } from '../utils/recovery';

interface PresetToolbarProps {
  mode: WorkspaceMode;
  onModeChange: (mode: WorkspaceMode) => void;
  underwritingPresets: SamplePreset[];
  activeUnderwritingPresetId: string | null;
  onSelectUnderwritingPreset: (preset: SamplePreset) => void;
  recoveryPresets: RecoveryPreset[];
  activeRecoveryPresetId: string | null;
  onSelectRecoveryPreset: (preset: RecoveryPreset) => void;
  closingPresets: ClosingPreset[];
  activeClosingPresetId: string | null;
  onSelectClosingPreset: (preset: ClosingPreset) => void;
  onReset: () => void;
  showIntroOnStartup: boolean;
  onToggleShowIntroOnStartup: (next: boolean) => void;
}

export function PresetToolbar({
  mode,
  onModeChange,
  underwritingPresets,
  activeUnderwritingPresetId,
  onSelectUnderwritingPreset,
  recoveryPresets,
  activeRecoveryPresetId,
  onSelectRecoveryPreset,
  closingPresets,
  activeClosingPresetId,
  onSelectClosingPreset,
  onReset,
  showIntroOnStartup,
  onToggleShowIntroOnStartup,
}: PresetToolbarProps) {
  return (
    <div className="border-b border-[#E2E8F0] bg-white print:hidden">
      <div className="mx-auto max-w-[1440px] px-6 py-3 space-y-2.5">
        {/* Top Row: Suite Subtitle + 3-Way Segmented Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
          <div>
            <p className="text-xs font-semibold text-[#0B192C]">
              Commercial Credit Risk &amp; Business Underwriting Suite (BDT)
            </p>
            <span className="text-[11px] text-slate-500">
              {mode === 'underwriting'
                ? 'Bangladesh Bank ICRRS (60% Quantitative / 40% Qualitative) & CRM Framework'
                : mode === 'recovery'
                  ? 'Bangladesh Bank BRPD Classification, Cash Recovery Realism & Head Office SAMD Reporting'
                  : 'Branch Closing Assistant — Daily Action Queue, Bottleneck Unblocking & Quality Guardrails'}
            </span>
          </div>

          <div
            role="tablist"
            aria-label="Operational Mode Switcher"
            className="inline-flex flex-wrap rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-1 gap-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'underwriting'}
              onClick={() => onModeChange('underwriting')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all duration-200 ease-out whitespace-nowrap cursor-pointer ${
                mode === 'underwriting'
                  ? 'bg-[#0B192C] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-white hover:text-[#0B192C]'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Pre-Loan Underwriting</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={mode === 'recovery'}
              onClick={() => onModeChange('recovery')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all duration-200 ease-out whitespace-nowrap cursor-pointer ${
                mode === 'recovery'
                  ? 'bg-[#0B192C] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-white hover:text-[#0B192C]'
              }`}
            >
              <Scale className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Defaulted Loan Recovery &amp; Resolution</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={mode === 'closing'}
              onClick={() => onModeChange('closing')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all duration-200 ease-out whitespace-nowrap cursor-pointer ${
                mode === 'closing'
                  ? 'bg-[#0B192C] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-white hover:text-[#0B192C]'
              }`}
            >
              <Target className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Branch Closing Assistant</span>
            </button>
          </div>
        </div>

        {/* Bottom Row: Mode-Specific Presets & Clear Form */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500 mr-0.5 whitespace-nowrap">
              {mode === 'underwriting'
                ? 'Underwriting Presets:'
                : mode === 'recovery'
                  ? 'Recovery Case Presets:'
                  : 'Closing Plan Presets:'}
            </span>

            {mode === 'underwriting' &&
              underwritingPresets.map((preset) => {
                const isActive = activeUnderwritingPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onSelectUnderwritingPreset(preset)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-xs whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'border-[#0B192C] bg-[#0B192C]/[0.05] text-[#0B192C] font-semibold shadow-xs'
                        : 'border-[#E2E8F0] bg-[#F8FAFC] text-slate-700 hover:border-slate-300 hover:bg-white hover:text-[#0B192C]'
                    }`}
                  >
                    <FileSpreadsheet
                      className="h-3.5 w-3.5 shrink-0 text-[#059669]"
                      aria-hidden="true"
                    />
                    <span>{preset.buttonLabel}</span>
                    <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                      ({formatBDT(preset.data.requestedLoanAmount)})
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
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-xs whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'border-[#0B192C] bg-[#0B192C]/[0.05] text-[#0B192C] font-semibold shadow-xs'
                        : 'border-[#E2E8F0] bg-[#F8FAFC] text-slate-700 hover:border-slate-300 hover:bg-white hover:text-[#0B192C]'
                    }`}
                  >
                    <FileSpreadsheet
                      className="h-3.5 w-3.5 shrink-0 text-[#D97706]"
                      aria-hidden="true"
                    />
                    <span>{preset.buttonLabel}</span>
                    <span className="font-mono text-[11px] text-slate-500 tabular-nums">
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
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-xs whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'border-[#0B192C] bg-[#0B192C]/[0.05] text-[#0B192C] font-semibold shadow-xs'
                        : 'border-[#E2E8F0] bg-[#F8FAFC] text-slate-700 hover:border-slate-300 hover:bg-white hover:text-[#0B192C]'
                    }`}
                  >
                    <FileSpreadsheet
                      className="h-3.5 w-3.5 shrink-0 text-[#0B192C]"
                      aria-hidden="true"
                    />
                    <span>{preset.buttonLabel}</span>
                    <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                      ({preset.data.daysLeftToClosing}d left)
                    </span>
                  </button>
                );
              })}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              role="switch"
              aria-checked={showIntroOnStartup}
              onClick={() => onToggleShowIntroOnStartup(!showIntroOnStartup)}
              className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-[#0B192C] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span
                aria-hidden="true"
                className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors duration-200 ${
                  showIntroOnStartup ? 'bg-[#0B192C]' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ${
                    showIntroOnStartup ? 'translate-x-3.5' : 'translate-x-0.5'
                  }`}
                />
              </span>
              <span>Show intro on startup</span>
            </button>

            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-[#0B192C] whitespace-nowrap shrink-0 cursor-pointer"
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

