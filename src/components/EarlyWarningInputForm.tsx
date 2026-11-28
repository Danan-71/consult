import { Activity, AlertCircle, ShieldAlert } from 'lucide-react';
import type {
  BusinessCategory,
  EarlyWarningInput,
  FacilityType,
} from '../types/credit';
import { BUSINESS_CATEGORIES } from '../utils/finance';

interface EarlyWarningInputFormProps {
  input: EarlyWarningInput;
  onChange: (updated: EarlyWarningInput) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  validationError: string | null;
}

const FACILITY_TYPES: FacilityType[] = [
  'Working Capital CC-Hypo',
  'Term Loan',
  'Overdraft',
  'LC-LTR',
  'Project Finance',
];

export function EarlyWarningInputForm({
  input,
  onChange,
  onAnalyze,
  isAnalyzing,
  validationError,
}: EarlyWarningInputFormProps) {
  const updateNum = (field: keyof EarlyWarningInput, raw: string) => {
    const val = Number(raw);
    onChange({
      ...input,
      [field]: Number.isFinite(val) && val >= 0 ? val : 0,
    });
  };

  return (
    <section
      id="section-ews-form"
      aria-label="Post-Sanction Early Warning Intake"
      className="rounded-xl border border-[#262626] bg-[#0D0D0D] overflow-hidden ncg-card"
    >
      <div className="border-b border-[#262626] bg-[#141414] px-5 py-4 text-white">
        <div className="flex items-center gap-2">
          <Activity className="h-4.5 w-4.5 text-[#10B981]" aria-hidden="true" />
          <h2 className="font-display text-sm font-bold text-white">
            Post-Sanction Early Warning Intake (Zero-PII)
          </h2>
        </div>
        <p className="mt-1 text-[11px] text-neutral-400">
          Monitor live credit routing, DPD slippage, limit utilization, and hypothecated stock cover using anonymized Case IDs only.
        </p>
      </div>

      <div className="p-5 space-y-5">
        {validationError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-500/35 bg-red-950/30 px-3.5 py-2.5 text-xs text-red-400"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Section 1: Anonymized Case Metadata */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-white">
            01. Anonymized Sanctioned Account Reference
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                Anonymized Case ID *
              </label>
              <input
                type="text"
                value={input.caseCode}
                onChange={(e) =>
                  onChange({ ...input, caseCode: e.target.value })
                }
                placeholder="EWS-MYM01-409"
                className="w-full rounded-lg border border-[#262626] bg-[#141414] px-3 py-2 font-mono text-xs text-white placeholder:text-neutral-500 focus:border-[#525252] focus:bg-[#171717] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                Sanctioned Facility Type
              </label>
              <select
                value={input.facilityType}
                onChange={(e) =>
                  onChange({
                    ...input,
                    facilityType: e.target.value as FacilityType,
                  })
                }
                className="w-full rounded-lg border border-[#262626] bg-[#141414] px-3 py-2 text-xs text-white focus:border-[#525252] focus:bg-[#171717] focus:outline-none"
              >
                {FACILITY_TYPES.map((t) => (
                  <option key={t} value={t} className="bg-[#141414] text-white">
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
              Business Sector
            </label>
            <select
              value={input.sector}
              onChange={(e) =>
                onChange({
                  ...input,
                  sector: e.target.value as BusinessCategory,
                })
              }
              className="w-full rounded-lg border border-[#262626] bg-[#141414] px-3 py-2 text-xs text-white focus:border-[#525252] focus:bg-[#171717] focus:outline-none"
            >
              {BUSINESS_CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-[#141414] text-white">
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Section 2: Limit, Outstanding & Conduct Numbers */}
        <div className="space-y-3 border-t border-[#262626] pt-4">
          <h3 className="text-xs font-bold text-white">
            02. Exposure, Routing &amp; Delinquency Telemetry (৳)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                Sanctioned Limit (৳) *
              </label>
              <input
                type="number"
                min={0}
                value={input.sanctionedLimitBdt || ''}
                onChange={(e) => updateNum('sanctionedLimitBdt', e.target.value)}
                placeholder="15000000"
                className="w-full rounded-lg border border-[#262626] bg-[#141414] px-3 py-2 font-mono text-xs text-white placeholder:text-neutral-500 tabular-nums focus:border-[#525252] focus:bg-[#171717] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                Current Outstanding Balance (৳) *
              </label>
              <input
                type="number"
                min={0}
                value={input.currentOutstandingBdt || ''}
                onChange={(e) =>
                  updateNum('currentOutstandingBdt', e.target.value)
                }
                placeholder="14750000"
                className="w-full rounded-lg border border-[#262626] bg-[#141414] px-3 py-2 font-mono text-xs text-white placeholder:text-neutral-500 tabular-nums focus:border-[#525252] focus:bg-[#171717] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                Monthly Installment / Interest Due (৳)
              </label>
              <input
                type="number"
                min={0}
                value={input.monthlyInstallmentDueBdt || ''}
                onChange={(e) =>
                  updateNum('monthlyInstallmentDueBdt', e.target.value)
                }
                placeholder="215000"
                className="w-full rounded-lg border border-[#262626] bg-[#141414] px-3 py-2 font-mono text-xs text-white placeholder:text-neutral-500 tabular-nums focus:border-[#525252] focus:bg-[#171717] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                Current Days Past Due (DPD)
              </label>
              <input
                type="number"
                min={0}
                max={365}
                value={input.daysPastDue}
                onChange={(e) => updateNum('daysPastDue', e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-[#262626] bg-[#141414] px-3 py-2 font-mono text-xs text-white placeholder:text-neutral-500 tabular-nums focus:border-[#525252] focus:bg-[#171717] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                Projected Monthly Sales (৳)
              </label>
              <input
                type="number"
                min={0}
                value={input.projectedMonthlySalesBdt || ''}
                onChange={(e) =>
                  updateNum('projectedMonthlySalesBdt', e.target.value)
                }
                placeholder="12000000"
                className="w-full rounded-lg border border-[#262626] bg-[#141414] px-3 py-2 font-mono text-xs text-white placeholder:text-neutral-500 tabular-nums focus:border-[#525252] focus:bg-[#171717] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                Actual Monthly Credits in Branch (৳)
              </label>
              <input
                type="number"
                min={0}
                value={input.currentMonthlyBankRoutingBdt || ''}
                onChange={(e) =>
                  updateNum('currentMonthlyBankRoutingBdt', e.target.value)
                }
                placeholder="4600000"
                className="w-full rounded-lg border border-[#262626] bg-[#141414] px-3 py-2 font-mono text-xs text-white placeholder:text-neutral-500 tabular-nums focus:border-[#525252] focus:bg-[#171717] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                Required Stock / Collateral Cover (৳)
              </label>
              <input
                type="number"
                min={0}
                value={input.requiredStockCoverBdt || ''}
                onChange={(e) =>
                  updateNum('requiredStockCoverBdt', e.target.value)
                }
                placeholder="18750000"
                className="w-full rounded-lg border border-[#262626] bg-[#141414] px-3 py-2 font-mono text-xs text-white placeholder:text-neutral-500 tabular-nums focus:border-[#525252] focus:bg-[#171717] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                Latest Physical Verified Stock / Cover (৳)
              </label>
              <input
                type="number"
                min={0}
                value={input.verifiedStockCoverBdt || ''}
                onChange={(e) =>
                  updateNum('verifiedStockCoverBdt', e.target.value)
                }
                placeholder="12900000"
                className="w-full rounded-lg border border-[#262626] bg-[#141414] px-3 py-2 font-mono text-xs text-white placeholder:text-neutral-500 tabular-nums focus:border-[#525252] focus:bg-[#171717] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Post-Sanction Covenant & Conduct Compliance */}
        <div className="space-y-2.5 border-t border-[#262626] pt-4">
          <h3 className="text-xs font-bold text-white">
            03. Post-Sanction Covenant Compliance Checklist
          </h3>

          {(
            [
              {
                key: 'quarterlyStockStatementOnTime',
                label: 'Quarterly stock / receivable statement submitted on schedule',
              },
              {
                key: 'exclusiveRoutingToLendingBranch',
                label: 'Primary sales proceeds routed through lending branch account',
              },
              {
                key: 'insuranceAndLicensesActive',
                label: 'Comprehensive asset insurance & statutory licenses valid',
              },
              {
                key: 'zeroChequeReturnOrIrregularTransfers',
                label: 'Zero outward/inward cheque dishonors or suspicious inter-account transfers',
              },
            ] as const
          ).map((item) => (
            <label
              key={item.key}
              className="flex items-start gap-2.5 rounded-lg border border-[#262626] bg-[#141414] px-3 py-2 text-xs text-neutral-300 cursor-pointer hover:border-[#404040] hover:bg-[#1A1A1A] transition-colors"
            >
              <input
                type="checkbox"
                checked={input.covenants[item.key]}
                onChange={(e) =>
                  onChange({
                    ...input,
                    covenants: {
                      ...input.covenants,
                      [item.key]: e.target.checked,
                    },
                  })
                }
                className="mt-0.5 h-3.5 w-3.5 rounded border-[#404040] bg-[#0D0D0D] accent-[#10B981] cursor-pointer"
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>

        {/* Section 4: Field Inspection Notes (Anonymized) */}
        <div className="space-y-1.5 border-t border-[#262626] pt-4">
          <label className="block text-xs font-bold text-white">
            04. Anonymized Field Officer Inspection Notes
          </label>
          <textarea
            rows={3}
            value={input.fieldOfficerNotes}
            onChange={(e) =>
              onChange({ ...input, fieldOfficerNotes: e.target.value })
            }
            placeholder="Summarize godown/plant inspection, cash routing findings, or buyer payment delays (strictly no personal names, NIDs, or phones)..."
            className="w-full rounded-lg border border-[#262626] bg-[#141414] px-3 py-2 text-xs text-white placeholder:text-neutral-500 focus:border-[#525252] focus:bg-[#171717] focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-bold text-black transition-all duration-200 hover:bg-neutral-200 disabled:opacity-60 cursor-pointer"
        >
          <ShieldAlert className="h-4 w-4 text-[#059669]" aria-hidden="true" />
          <span>
            {isAnalyzing
              ? 'Generating Early Warning Containment Brief...'
              : 'Generate AI Early Warning Intervention Brief'}
          </span>
        </button>
      </div>
    </section>
  );
}
