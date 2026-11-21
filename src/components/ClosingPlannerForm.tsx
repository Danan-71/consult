import { AlertCircle, Loader2, Plus, Target, Trash2 } from 'lucide-react';
import type {
  ClosingCategoryTarget,
  ClosingPipelineItem,
  ClosingPlannerInput,
  PipelineCostOrRiskGrade,
  PipelineItemType,
  PipelineStage,
} from '../types/credit';
import {
  PIPELINE_GRADES_BY_TYPE,
  PIPELINE_ITEM_TYPES,
  PIPELINE_STAGES,
  createPipelineItem,
  getDefaultGradeForType,
} from '../utils/closing';
import { formatBDT, formatBDTScaleHint } from '../utils/finance';

interface ClosingPlannerFormProps {
  input: ClosingPlannerInput;
  onChange: (updated: ClosingPlannerInput) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  validationError: string | null;
}

const inputBaseClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-[#0B192C] placeholder:text-slate-400 focus:border-[#0B192C] focus:outline-none focus:ring-1 focus:ring-[#0B192C]';
const bdtInputClass =
  'w-full rounded-lg border border-slate-300 bg-white pl-7 pr-2.5 py-1.5 font-mono text-xs sm:text-sm text-[#0B192C] tabular-nums placeholder:text-slate-400 focus:border-[#0B192C] focus:outline-none focus:ring-1 focus:ring-[#0B192C]';
const labelClass = 'block text-xs font-semibold text-slate-700 mb-1';

function TargetPairRow({
  title,
  idPrefix,
  pair,
  onChange,
}: {
  title: string;
  idPrefix: string;
  pair: ClosingCategoryTarget;
  onChange: (updated: ClosingCategoryTarget) => void;
}) {
  const achievedHint = formatBDTScaleHint(pair.achievedBdt);
  const targetHint = formatBDTScaleHint(pair.targetBdt);

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold text-slate-900">{title}</span>
        {pair.targetBdt > 0 && (
          <span className="font-mono text-[11px] text-slate-500 tabular-nums">
            {((pair.achievedBdt / pair.targetBdt) * 100).toFixed(1)}% achieved
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <div className="flex items-baseline justify-between gap-1 mb-1">
            <label
              htmlFor={`${idPrefix}-achieved`}
              className="text-[11px] font-medium text-slate-600"
            >
              Achieved (৳)
            </label>
            {achievedHint && (
              <span className="font-mono text-[10px] text-slate-500 tabular-nums">
                {achievedHint}
              </span>
            )}
          </div>
          <div className="relative">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-500"
            >
              ৳
            </span>
            <input
              id={`${idPrefix}-achieved`}
              type="number"
              min={0}
              step={100000}
              value={pair.achievedBdt === 0 ? '' : pair.achievedBdt}
              placeholder="0"
              onChange={(e) => {
                const val = Number(e.target.value);
                onChange({
                  ...pair,
                  achievedBdt: Number.isFinite(val) && val >= 0 ? val : 0,
                });
              }}
              className={bdtInputClass}
            />
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-1 mb-1">
            <label
              htmlFor={`${idPrefix}-target`}
              className="text-[11px] font-medium text-slate-600"
            >
              Closing Target (৳)
            </label>
            {targetHint && (
              <span className="font-mono text-[10px] text-slate-500 tabular-nums">
                {targetHint}
              </span>
            )}
          </div>
          <div className="relative">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-500"
            >
              ৳
            </span>
            <input
              id={`${idPrefix}-target`}
              type="number"
              min={0}
              step={100000}
              value={pair.targetBdt === 0 ? '' : pair.targetBdt}
              placeholder="0"
              onChange={(e) => {
                const val = Number(e.target.value);
                onChange({
                  ...pair,
                  targetBdt: Number.isFinite(val) && val >= 0 ? val : 0,
                });
              }}
              className={bdtInputClass}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ClosingPlannerForm({
  input,
  onChange,
  onAnalyze,
  isAnalyzing,
  validationError,
}: ClosingPlannerFormProps) {
  const updatePipelineItem = (
    id: string,
    patch: Partial<ClosingPipelineItem>,
  ) => {
    onChange({
      ...input,
      pipelineItems: input.pipelineItems.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    });
  };

  const handleAddPipelineItem = (defaultType: PipelineItemType = 'Quality Loan') => {
    const nextIdx = input.pipelineItems.length + 1;
    onChange({
      ...input,
      pipelineItems: [
        ...input.pipelineItems,
        createPipelineItem(nextIdx, defaultType),
      ],
    });
  };

  const handleRemovePipelineItem = (id: string) => {
    onChange({
      ...input,
      pipelineItems: input.pipelineItems.filter((item) => item.id !== id),
    });
  };

  return (
    <section
      id="section-closing-form"
      aria-label="Branch Closing Assistant"
      className="rounded-xl border border-[#E2E8F0] bg-white ncg-card overflow-hidden"
    >
      <div className="border-b border-[#E2E8F0] bg-slate-50 px-5 py-3.5">
        <h2 className="font-display text-sm font-semibold text-[#0B192C]">
          Branch Closing Assistant — Targets &amp; Pipeline
        </h2>
        <p className="text-xs text-slate-600 mt-0.5">
          Anonymized pipeline &amp; bottleneck tracker (no PII) for daily closing execution
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onAnalyze();
        }}
        className="p-5 space-y-5"
      >
        {/* Block 1: Closing Cutoff & Targets */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-100 pb-1.5">
            01. Closing Horizon &amp; Category Targets (BDT)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label htmlFor="closing-period" className={labelClass}>
                Branch / Closing Cutoff Label
              </label>
              <input
                id="closing-period"
                type="text"
                value={input.branchOrPeriodLabel}
                placeholder="e.g., Half-Yearly Closing (June 30) — Cumilla Branch"
                onChange={(e) =>
                  onChange({ ...input, branchOrPeriodLabel: e.target.value })
                }
                className={inputBaseClass}
              />
            </div>

            <div>
              <label htmlFor="closing-days-left" className={labelClass}>
                Days Left to Closing *
              </label>
              <input
                id="closing-days-left"
                type="number"
                min={1}
                max={365}
                value={input.daysLeftToClosing}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onChange({
                    ...input,
                    daysLeftToClosing:
                      Number.isFinite(val) && val >= 0 ? Math.round(val) : 0,
                  });
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <TargetPairRow
            title="Deposits Mobilization (CASA / Term)"
            idPrefix="closing-dep"
            pair={input.deposits}
            onChange={(deposits) => onChange({ ...input, deposits })}
          />

          <TargetPairRow
            title="Quality Loans & Advances"
            idPrefix="closing-loan"
            pair={input.loans}
            onChange={(loans) => onChange({ ...input, loans })}
          />

          <TargetPairRow
            title="NPL Cash Recovery / Reduction"
            idPrefix="closing-npl"
            pair={input.nplRecovery}
            onChange={(nplRecovery) => onChange({ ...input, nplRecovery })}
          />
        </div>

        {/* Block 2: Anonymized Pipeline & Bottleneck Tracker */}
        <div id="section-closing-pipeline" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              02. Pipeline &amp; Bottleneck Tracker ({input.pipelineItems.length})
            </h3>
            <button
              type="button"
              onClick={() => handleAddPipelineItem('Quality Loan')}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer"
            >
              <Plus className="h-3 w-3" aria-hidden="true" />
              <span>Add Case Item</span>
            </button>
          </div>

          <div className="space-y-3">
            {input.pipelineItems.map((item, idx) => {
              const weightedVal =
                (Math.max(0, item.amountBdt || 0) *
                  Math.min(100, Math.max(0, item.probabilityPct || 0))) /
                100;
              const isWeakProfile =
                (item.type === 'Quality Loan' &&
                  (item.costOrRiskGrade === 'High-Risk / Sub-Par Loan' ||
                    item.costOrRiskGrade === 'ICRRS Marginal (Moderate Risk)')) ||
                (item.type === 'Deposit' &&
                  item.costOrRiskGrade === 'High-Cost Bulk Deposit');
              const isStalledStage =
                item.stage === 'Docs Pending' || item.stage === 'Under Review';
              const gradeOptions = PIPELINE_GRADES_BY_TYPE[item.type];

              return (
                <div
                  key={item.id}
                  className={`rounded-lg border p-3 space-y-2.5 transition-colors ${
                    isWeakProfile
                      ? 'border-[#DC2626]/35 bg-red-50/40'
                      : isStalledStage
                        ? 'border-[#D97706]/35 bg-amber-50/35'
                        : 'border-[#E2E8F0] bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-semibold text-slate-500">
                      CASE #{String(idx + 1).padStart(2, '0')} · Weighted:{' '}
                      <span className="text-slate-900">{formatBDT(weightedVal)}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePipelineItem(item.id)}
                      aria-label={`Remove ${item.code || 'pipeline item'}`}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-red-700 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Remove</span>
                    </button>
                  </div>

                  {/* Row 1: Case Code + Bucket */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-7">
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Anonymized Case Code (No PII)
                      </label>
                      <input
                        type="text"
                        value={item.code}
                        placeholder="e.g., LN-04 (Agro Processing)"
                        onChange={(e) =>
                          updatePipelineItem(item.id, { code: e.target.value })
                        }
                        className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-5">
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Bucket
                      </label>
                      <select
                        value={item.type}
                        onChange={(e) => {
                          const nextType = e.target.value as PipelineItemType;
                          updatePipelineItem(item.id, {
                            type: nextType,
                            costOrRiskGrade: getDefaultGradeForType(nextType),
                          });
                        }}
                        className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                      >
                        {PIPELINE_ITEM_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row 2: Amount + Est. Cost / Risk Grade + Prob % */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Amount (৳)
                      </label>
                      <div className="relative">
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 font-mono text-[11px] text-slate-500"
                        >
                          ৳
                        </span>
                        <input
                          type="number"
                          min={0}
                          step={50000}
                          value={item.amountBdt === 0 ? '' : item.amountBdt}
                          placeholder="0"
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            updatePipelineItem(item.id, {
                              amountBdt:
                                Number.isFinite(val) && val >= 0 ? val : 0,
                            });
                          }}
                          className="w-full rounded-md border border-slate-300 bg-white pl-6 pr-2 py-1.5 font-mono text-xs text-slate-900 tabular-nums focus:border-slate-900 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-5">
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Risk / Cost Profile
                      </label>
                      <select
                        value={item.costOrRiskGrade}
                        onChange={(e) =>
                          updatePipelineItem(item.id, {
                            costOrRiskGrade: e.target
                              .value as PipelineCostOrRiskGrade,
                          })
                        }
                        className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                      >
                        {gradeOptions.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Prob. (%)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={5}
                        value={item.probabilityPct}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          updatePipelineItem(item.id, {
                            probabilityPct: Number.isFinite(val)
                              ? Math.min(100, Math.max(0, val))
                              : 0,
                          });
                        }}
                        className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-900 tabular-nums focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Row 3: Current Stage + Target Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-6">
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Current Stage
                      </label>
                      <select
                        value={item.stage}
                        onChange={(e) =>
                          updatePipelineItem(item.id, {
                            stage: e.target.value as PipelineStage,
                          })
                        }
                        className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                      >
                        {PIPELINE_STAGES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-6">
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Target Date
                      </label>
                      <input
                        type="date"
                        value={item.targetDate}
                        onChange={(e) =>
                          updatePipelineItem(item.id, {
                            targetDate: e.target.value,
                          })
                        }
                        className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Row 4: Blocking Issue / Next Step */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Blocking Issue / Next Step
                    </label>
                    <input
                      type="text"
                      value={item.blockingIssueNextStep}
                      placeholder="e.g., Awaiting RJSC charge search; follow up with RM before 3 PM"
                      onChange={(e) =>
                        updatePipelineItem(item.id, {
                          blockingIssueNextStep: e.target.value,
                        })
                      }
                      className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
              );
            })}
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
              <span>Generating Branch Closing Playbook...</span>
            </>
          ) : (
            <>
              <Target className="h-4 w-4" aria-hidden="true" />
              <span>Generate Branch Closing Playbook</span>
            </>
          )}
        </button>
      </form>
    </section>
  );
}
