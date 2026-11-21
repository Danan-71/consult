import { AlertCircle, Loader2, Scale } from 'lucide-react';
import type {
  BusinessCategory,
  ClassificationStage,
  CollateralRealizabilityRating,
  RecoveryCaseInput,
  RecoveryRedFlags,
} from '../types/credit';
import { BUSINESS_CATEGORIES, formatBDTScaleHint } from '../utils/finance';
import {
  CLASSIFICATION_STAGES,
  COLLATERAL_REALIZABILITY_RATINGS,
} from '../utils/recovery';

interface RecoveryInputFormProps {
  input: RecoveryCaseInput;
  onChange: (updated: RecoveryCaseInput) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  validationError: string | null;
}

const inputBaseClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-[#0B192C] placeholder:text-slate-400 focus:border-[#0B192C] focus:outline-none focus:ring-1 focus:ring-[#0B192C]';
const bdtInputClass =
  'w-full rounded-lg border border-slate-300 bg-white pl-7 pr-3 py-2 font-mono text-sm text-[#0B192C] tabular-nums placeholder:text-slate-400 focus:border-[#0B192C] focus:outline-none focus:ring-1 focus:ring-[#0B192C]';
const labelClass = 'block text-xs font-semibold text-slate-700 mb-1';

const RED_FLAG_ITEMS: {
  key: keyof RecoveryRedFlags;
  label: string;
  detail: string;
}[] = [
  {
    key: 'suspectedFundDiversion',
    label: 'Suspected Fund Diversion',
    detail: 'Working capital moved to personal land/unrelated ventures',
  },
  {
    key: 'businessShutdownOrPartialClosure',
    label: 'Business Shutdown / Partial Closure',
    detail: 'Primary shop/factory shuttered or operating below 40% capacity',
  },
  {
    key: 'uncooperativeBorrower',
    label: 'Uncooperative / Evasive Borrower',
    detail: 'Avoids branch calls, recovery visits, or formal restructuring',
  },
  {
    key: 'multipleDebtOverlap',
    label: 'Multiple Debt Overlap',
    detail: 'Concurrent overdue facilities with other banks, NBFIs, or Mohajans',
  },
  {
    key: 'ni138ChequeDishonorPending',
    label: 'NI Act Sec 138 Cheque Dishonor',
    detail: 'Security/post-dated cheques bounced or legal notice issued',
  },
  {
    key: 'collateralEncumbranceOrMutationDefect',
    label: 'Collateral Encumbrance / Title Defect',
    detail: 'Boundary dispute, pending mutation, or third-party possession claim',
  },
];

function BdtNumberField({
  id,
  label,
  value,
  onChange,
  placeholder = '0',
}: {
  id: string;
  label: string;
  value: number;
  onChange: (val: number) => void;
  placeholder?: string;
}) {
  const hint = formatBDTScaleHint(value);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <label htmlFor={id} className="block text-xs font-semibold text-slate-700">
          {label}
        </label>
        {hint && (
          <span className="font-mono text-[11px] font-medium text-[#0B192C]/75 tabular-nums">
            {hint}
          </span>
        )}
      </div>
      <div className="relative">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-500"
        >
          ৳
        </span>
        <input
          id={id}
          type="number"
          min={0}
          step={10000}
          value={value === 0 ? '' : value}
          placeholder={placeholder}
          onChange={(e) => {
            const parsed = Number(e.target.value);
            onChange(Number.isFinite(parsed) && parsed >= 0 ? parsed : 0);
          }}
          className={bdtInputClass}
        />
      </div>
    </div>
  );
}

export function RecoveryInputForm({
  input,
  onChange,
  onAnalyze,
  isAnalyzing,
  validationError,
}: RecoveryInputFormProps) {
  const updateField = <K extends keyof RecoveryCaseInput>(
    key: K,
    value: RecoveryCaseInput[K],
  ) => {
    onChange({
      ...input,
      [key]: value,
    });
  };

  const toggleRedFlag = (key: keyof RecoveryRedFlags) => {
    onChange({
      ...input,
      redFlags: {
        ...input.redFlags,
        [key]: !input.redFlags[key],
      },
    });
  };

  return (
    <section
      id="section-recovery-form"
      aria-label="Defaulted Loan Recovery Case Intake"
      className="rounded-xl border border-[#E2E8F0] bg-white ncg-card overflow-hidden"
    >
      {/* Header */}
      <div className="border-b border-[#E2E8F0] bg-slate-50 px-5 py-3.5">
        <h2 className="font-display text-sm font-semibold text-[#0B192C]">
          Defaulted Loan Recovery &amp; Resolution Intake
        </h2>
        <p className="text-xs text-slate-600 mt-0.5">
          Anonymized borrower arrears, survival cash flow, collateral realizability &amp; head-office red flags
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onAnalyze();
        }}
        className="p-5 space-y-5"
      >
        {/* Block 1: Anonymized Case & Classification */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-100 pb-1.5">
            01. Case Profile &amp; Bangladesh Bank Classification
          </h3>

          <div>
            <label htmlFor="rec-case-ref" className={labelClass}>
              Borrower / Case Reference (Anonymized) *
            </label>
            <input
              id="rec-case-ref"
              type="text"
              value={input.caseReference}
              placeholder="e.g., NCG-REC-2026-104 (Narsingdi Textile Merchant)"
              onChange={(e) => updateField('caseReference', e.target.value)}
              className={inputBaseClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="rec-sector" className={labelClass}>
                Business Sector
              </label>
              <select
                id="rec-sector"
                value={input.sector}
                onChange={(e) =>
                  updateField('sector', e.target.value as BusinessCategory)
                }
                className={inputBaseClass}
              >
                {BUSINESS_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="rec-classification" className={labelClass}>
                Classification Stage (BRPD)
              </label>
              <select
                id="rec-classification"
                value={input.classificationStage}
                onChange={(e) =>
                  updateField(
                    'classificationStage',
                    e.target.value as ClassificationStage,
                  )
                }
                className={inputBaseClass}
              >
                {CLASSIFICATION_STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <BdtNumberField
              id="rec-outstanding"
              label="Total Outstanding (৳) *"
              value={input.totalOutstandingAmount}
              onChange={(val) => updateField('totalOutstandingAmount', val)}
            />
            <BdtNumberField
              id="rec-overdue"
              label="Overdue Amount (৳)"
              value={input.overdueAmount}
              onChange={(val) => updateField('overdueAmount', val)}
            />
            <div>
              <label htmlFor="rec-months-overdue" className={labelClass}>
                Months Overdue
              </label>
              <input
                id="rec-months-overdue"
                type="number"
                min={0}
                step={0.5}
                value={input.monthsOverdue}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  updateField(
                    'monthsOverdue',
                    Number.isFinite(val) && val >= 0 ? val : 0,
                  );
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-[#0B192C] tabular-nums focus:border-[#0B192C] focus:outline-none focus:ring-1 focus:ring-[#0B192C]"
              />
            </div>
          </div>
        </div>

        {/* Block 2: Current Business Cash Capacity */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-100 pb-1.5">
            02. Current Monthly Cash Flow Capacity (BDT)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <BdtNumberField
              id="rec-inflow"
              label="Current Monthly Cash Inflow (৳)"
              value={input.monthlyCashInflow}
              onChange={(val) => updateField('monthlyCashInflow', val)}
            />
            <BdtNumberField
              id="rec-expenses"
              label="Essential Operating Expenses (৳)"
              value={input.essentialMonthlyExpenses}
              onChange={(val) => updateField('essentialMonthlyExpenses', val)}
            />
          </div>
        </div>

        {/* Block 3: Collateral & Guarantor Realizability */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-100 pb-1.5">
            03. Collateral &amp; Guarantor Realizability Assessment
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <BdtNumberField
              id="rec-collateral-val"
              label="Est. Realizable Value (৳)"
              value={input.collateralRealizableValue}
              onChange={(val) => updateField('collateralRealizableValue', val)}
            />
            <div>
              <label htmlFor="rec-collateral-rating" className={labelClass}>
                Realizability Rating
              </label>
              <select
                id="rec-collateral-rating"
                value={input.collateralRealizability}
                onChange={(e) =>
                  updateField(
                    'collateralRealizability',
                    e.target.value as CollateralRealizabilityRating,
                  )
                }
                className={inputBaseClass}
              >
                {COLLATERAL_REALIZABILITY_RATINGS.map((rating) => (
                  <option key={rating} value={rating}>
                    {rating}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="rec-collateral-desc" className={labelClass}>
              Collateral Description &amp; Mutation / Possession Status
            </label>
            <textarea
              id="rec-collateral-desc"
              rows={2}
              value={input.collateralDescription}
              placeholder="e.g., Registered mortgage on 4.5 decimal shop-cum-godown; check mutation, demarcation & occupant status..."
              onChange={(e) =>
                updateField('collateralDescription', e.target.value)
              }
              className={inputBaseClass}
            />
          </div>

          <div>
            <label htmlFor="rec-guarantor" className={labelClass}>
              Guarantor Net Worth &amp; Responsiveness Assessment
            </label>
            <textarea
              id="rec-guarantor"
              rows={2}
              value={input.guarantorAssessment}
              placeholder="e.g., Guarantor net worth, cooperation level, reachable address, independent cash flow..."
              onChange={(e) =>
                updateField('guarantorAssessment', e.target.value)
              }
              className={inputBaseClass}
            />
          </div>
        </div>

        {/* Block 4: Red Flags & Case Background */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-100 pb-1.5">
            04. Recovery Red Flags &amp; Branch Field Notes
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {RED_FLAG_ITEMS.map((item) => {
              const checked = input.redFlags[item.key];
              return (
                <label
                  key={item.key}
                  className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-xs cursor-pointer transition-colors ${
                    checked
                      ? 'border-[#DC2626]/35 bg-red-50/70 text-[#0B192C]'
                      : 'border-[#E2E8F0] bg-slate-50/50 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleRedFlag(item.key)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-[#DC2626] focus:ring-[#DC2626]"
                  />
                  <span>
                    <span className="block font-semibold">{item.label}</span>
                    <span className="block text-[11px] text-slate-500 leading-snug mt-0.5">
                      {item.detail}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>

          <div>
            <label htmlFor="rec-notes" className={labelClass}>
              Case Background &amp; Default Triggers Observed
            </label>
            <textarea
              id="rec-notes"
              rows={3}
              value={input.caseBackgroundNotes}
              placeholder="Summarize why payments stopped, market/Baki shock, branch visit findings, or borrower settlement offer..."
              onChange={(e) =>
                updateField('caseBackgroundNotes', e.target.value)
              }
              className={inputBaseClass}
            />
          </div>
        </div>

        {validationError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-[#DC2626]/35 bg-red-50 px-3 py-2.5 text-xs text-[#DC2626]"
          >
            <AlertCircle
              className="h-4 w-4 shrink-0 text-[#DC2626] mt-0.5"
              aria-hidden="true"
            />
            <span>{validationError}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isAnalyzing}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#0B192C] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#142B4A] disabled:cursor-not-allowed disabled:bg-[#0B192C]/60 cursor-pointer"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Generating Recovery &amp; Resolution Memo...</span>
            </>
          ) : (
            <>
              <Scale className="h-4 w-4" aria-hidden="true" />
              <span>Generate Recovery &amp; Resolution Memo</span>
            </>
          )}
        </button>
      </form>
    </section>
  );
}
