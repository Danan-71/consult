import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Printer,
  Scale,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import type {
  CalculatedMetrics,
  CreditAnalystMemo,
  CreditCommitteeVerdict,
  LoanApplicationInput,
  SectorNplTrigger,
} from '../types/credit';
import { formatBDT, formatBDTScaleHint } from '../utils/finance';

interface CreditMemoReportProps {
  input: LoanApplicationInput;
  metrics: CalculatedMetrics;
  memo: CreditAnalystMemo | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onPrint: () => void;
  onLoadDefaultPreset: () => void;
}

function getVerdictStyle(verdict: CreditCommitteeVerdict) {
  switch (verdict) {
    case 'APPROVE':
      return {
        container: 'border-emerald-500/35 bg-emerald-950/25 print:bg-white print:border-slate-300',
        text: 'text-neutral-200 print:text-slate-900',
        label: 'text-[#34D399]',
        Icon: CheckCircle2,
      };
    case 'CONDITIONAL APPROVAL':
      return {
        container: 'border-amber-500/35 bg-amber-950/25 print:bg-white print:border-slate-300',
        text: 'text-neutral-200 print:text-slate-900',
        label: 'text-amber-400',
        Icon: AlertTriangle,
      };
    case 'REDUCE LOAN AMOUNT':
      return {
        container: 'border-amber-500/35 bg-amber-950/25 print:bg-white print:border-slate-300',
        text: 'text-neutral-200 print:text-slate-900',
        label: 'text-amber-400',
        Icon: Scale,
      };
    case 'DECLINE':
      return {
        container: 'border-red-500/35 bg-red-950/25 print:bg-white print:border-slate-300',
        text: 'text-neutral-200 print:text-slate-900',
        label: 'text-red-400',
        Icon: XCircle,
      };
  }
}

function getSeverityTextClass(severity: SectorNplTrigger['severity']): string {
  switch (severity) {
    case 'Critical':
      return 'text-red-400 font-semibold';
    case 'High':
      return 'text-amber-400 font-semibold';
    case 'Moderate':
      return 'text-neutral-300 font-medium';
  }
}

export function CreditMemoReport({
  input,
  metrics,
  memo,
  isLoading,
  error,
  onRetry,
  onPrint,
  onLoadDefaultPreset,
}: CreditMemoReportProps) {
  if (isLoading) {
    return (
      <section
        id="section-memo"
        aria-busy="true"
        className="rounded-xl border border-[#262626] bg-[#0D0D0D] ncg-card p-6 space-y-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#262626] pb-4">
          <div className="space-y-2">
            <div className="text-xs font-semibold text-white">
              Synthesizing NBCI Credit Committee Memo...
            </div>
            <div className="h-3 w-72 rounded ncg-shimmer" />
          </div>
          <div className="h-8 w-36 rounded-lg ncg-shimmer" />
        </div>

        <div className="rounded-lg border border-[#262626] p-4 space-y-2.5">
          <div className="h-4 w-56 rounded ncg-shimmer" />
          <div className="h-3.5 w-full rounded ncg-shimmer" />
          <div className="h-3.5 w-5/6 rounded ncg-shimmer" />
        </div>

        {[1, 2, 3, 4, 5, 6].map((idx) => (
          <div key={idx} className="space-y-2.5 pt-2">
            <div className="h-4 w-60 rounded ncg-shimmer" />
            <div className="h-3.5 w-full rounded ncg-shimmer" />
            <div className="h-3.5 w-11/12 rounded ncg-shimmer" />
          </div>
        ))}
      </section>
    );
  }

  if (error) {
    return (
      <section
        id="section-memo"
        role="alert"
        className="rounded-xl border border-red-500/35 bg-[#0D0D0D] ncg-card p-6 space-y-4"
      >
        <div className="flex items-start gap-3">
          <AlertCircle
            className="h-5 w-5 text-red-400 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <h3 className="font-display text-sm font-semibold text-white">
              NBCI Credit Underwriting Analysis Failed
            </h3>
            <p className="text-sm text-red-400">{error}</p>
          </div>
        </div>
        <div>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg border border-[#262626] bg-[#141414] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1C1C1C] cursor-pointer"
          >
            Retry Underwriting Analysis
          </button>
        </div>
      </section>
    );
  }

  if (!memo) {
    return (
      <section
        id="section-memo"
        className="rounded-xl border border-[#262626] bg-[#0D0D0D] ncg-card p-8 text-center space-y-4"
      >
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg border border-[#262626] bg-[#141414] text-white">
          <FileText className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="mx-auto max-w-lg space-y-1.5">
          <h3 className="font-display text-base font-semibold text-white">
            Northern Banking Credit Intelligence — Official Credit Memo
          </h3>
          <p className="text-sm leading-relaxed text-neutral-400">
            Select one of the 5 sample presets above or complete the 6-tab wizard,
            then click{' '}
            <strong className="font-semibold text-white">
              Run Underwriting &amp; Risk Analysis
            </strong>{' '}
            to generate the 7-part ICRRS Credit Committee Memo with recommended safe
            loan limit, forensic reality check, and branch manager protection covenants.
          </p>
        </div>
        {!input.businessName && (
          <div className="pt-1">
            <button
              type="button"
              onClick={onLoadDefaultPreset}
              className="rounded-lg border border-[#262626] bg-[#141414] px-4 py-2 text-xs font-semibold text-white hover:border-[#404040] hover:bg-[#1C1C1C] cursor-pointer transition-colors"
            >
              Load Sample: Real Estate Developer
            </button>
          </div>
        )}
      </section>
    );
  }

  const verdictStyle = getVerdictStyle(memo.executiveVerdict.verdict);
  const VerdictIcon = verdictStyle.Icon;
  const formattedDate = new Date(memo.generatedAtIso).toLocaleDateString(
    'en-GB',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  );
  const safeLimitScale = formatBDTScaleHint(
    memo.executiveVerdict.recommendedSafeLimitBdt,
  );

  return (
    <article
      id="section-memo"
      className="rounded-xl border border-[#262626] bg-[#0D0D0D] ncg-card print:border-slate-300 print:bg-white"
    >
      {/* Memo Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#262626] print:border-slate-200 px-6 py-4">
        <div>
          <h2 className="font-display text-base font-semibold text-white print:text-slate-900">
            Northern Banking Credit Intelligence · Official Credit Underwriting Memo
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            {input.businessName} · {input.businessCategory} · {input.districtCity || 'Bangladesh'} ·{' '}
            Prepared {formattedDate}
          </p>
        </div>
        <button
          type="button"
          onClick={onPrint}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-semibold text-black transition-colors hover:bg-neutral-200 print:hidden whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Printer className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Print / Save Official Credit Memo (PDF)</span>
        </button>
      </div>

      <div className="p-6 space-y-7">
        {/* 1. Executive Verdict & Recommended Limit */}
        <section className="space-y-2.5 print-avoid-break">
          <div
            className={`rounded-xl border p-5 space-y-3 ${verdictStyle.container}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <VerdictIcon
                  className={`h-5 w-5 shrink-0 ${verdictStyle.label}`}
                  aria-hidden="true"
                />
                <span
                  className={`font-display text-base font-bold ${verdictStyle.label}`}
                >
                  01. Executive Verdict: {memo.executiveVerdict.verdict}
                </span>
              </div>

              <div className="font-mono text-xs font-semibold text-white print:text-slate-900 tabular-nums">
                Recommended Safe Limit:{' '}
                {formatBDT(memo.executiveVerdict.recommendedSafeLimitBdt)}
                {safeLimitScale ? ` (${safeLimitScale})` : ''}
              </div>
            </div>
            <p className={`text-sm leading-relaxed ${verdictStyle.text}`}>
              {memo.executiveVerdict.summaryRationale}
            </p>

            {/* Deterministic Safe Limit-Sizing Comparison (1.25x Stressed DSCR) */}
            <div className="border-t border-[#262626] print:border-slate-200 pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <div className="text-[11px] text-neutral-400">
                  Requested Loan Amount
                </div>
                <div className="font-mono font-semibold text-white print:text-slate-900 tabular-nums">
                  {formatBDT(input.requestedLoanAmount)}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-neutral-400">
                  NBCI Safe Limit (1.25x Stressed DSCR · CCC {Math.round(metrics.cccDays)}d)
                </div>
                <div className="font-mono font-semibold text-white print:text-slate-900 tabular-nums">
                  {formatBDT(metrics.recommendedSafeLoanLimitBdt)}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-neutral-400">
                  {metrics.overLeveragedRequestAlert
                    ? 'Over-Leveraged Request Alert'
                    : 'Safe Limit Headroom'}
                </div>
                <div
                  className={`font-mono font-bold tabular-nums ${
                    metrics.overLeveragedRequestAlert
                      ? 'text-red-400'
                      : 'text-[#34D399]'
                  }`}
                >
                  {metrics.overLeveragedRequestAlert
                    ? `Reduce by ${formatBDT(metrics.overLeveragedReductionBdt)}`
                    : `+${formatBDT(metrics.safeLimitHeadroomBdt)} within cap`}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. How This Specific Business/Project Operates */}
        <section className="space-y-3 print-avoid-break">
          <h3 className="font-display text-sm font-semibold text-white print:text-slate-900 border-b border-[#262626] print:border-slate-200 pb-2">
            02. How This Specific Business / Project Operates
          </h3>
          <p className="text-sm leading-relaxed text-neutral-300 print:text-slate-700">
            {memo.businessAndProjectMechanics.summary}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="rounded-lg border border-[#262626] bg-[#141414] print:bg-slate-50 print:border-slate-200 p-4 space-y-2">
              <h4 className="text-xs font-semibold text-white print:text-slate-900">
                Cash-Flow Traps &amp; Seasonality
              </h4>
              <ul className="space-y-1.5 text-xs leading-relaxed text-neutral-300 print:text-slate-700 list-disc pl-4">
                {memo.businessAndProjectMechanics.cashFlowTrapsAndSeasonality.map(
                  (item, i) => (
                    <li key={i}>{item}</li>
                  ),
                )}
              </ul>
            </div>
            <div className="rounded-lg border border-[#262626] bg-[#141414] print:bg-slate-50 print:border-slate-200 p-4 space-y-1.5">
              <h4 className="text-xs font-semibold text-white print:text-slate-900">
                Sector-Specific Mechanics
              </h4>
              <p className="text-xs leading-relaxed text-neutral-300 print:text-slate-700">
                {memo.businessAndProjectMechanics.sectorSpecificAssessment}
              </p>
            </div>
          </div>
        </section>

        {/* 3. Forensic Reality Check */}
        <section className="space-y-3 print-avoid-break">
          <h3 className="font-display text-sm font-semibold text-white print:text-slate-900 border-b border-[#262626] print:border-slate-200 pb-2">
            03. Forensic Reality Check (Bank Turnover, Equity &amp; Diversion)
          </h3>
          <p className="text-sm leading-relaxed text-neutral-300 print:text-slate-700">
            {memo.forensicRealityCheck.summary}
          </p>

          {/* Deterministic Cross-Reference of Every Triggered Forensic Alert */}
          <div className="rounded-lg border border-[#262626] bg-[#141414] p-3.5 space-y-2 print:bg-white print:border-slate-200">
            <div className="text-[11px] font-semibold text-white print:text-slate-900">
              Forensic Red Flags &amp; Early Risk Triggers Referenced in Memo (
              {metrics.forensicAlerts.length})
            </div>
            {metrics.forensicAlerts.length === 0 ? (
              <div className="flex items-center gap-1.5 text-xs font-medium text-[#34D399]">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>No Critical Forensic Red Flags Triggered across all 6 checks.</span>
              </div>
            ) : (
              <ul className="space-y-1.5 text-xs">
                {metrics.forensicAlerts.map((alert) => {
                  const isCrimson = alert.tone === 'crimson';
                  return (
                    <li
                      key={alert.id}
                      className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 border-t border-[#262626] print:border-slate-200 pt-1.5 first:border-t-0 first:pt-0"
                    >
                      <span
                        className={`font-semibold ${
                          isCrimson ? 'text-red-400' : 'text-amber-400'
                        }`}
                      >
                        [{isCrimson ? 'Crimson' : 'Amber'}] {alert.title}
                      </span>
                      <span className="font-mono text-[11px] text-neutral-300 print:text-slate-700 tabular-nums">
                        {alert.metricSummary}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="rounded-lg border border-[#262626] bg-[#141414] print:bg-slate-50 print:border-slate-200 p-4 space-y-1.5">
              <h4 className="text-xs font-semibold text-white print:text-slate-900">
                Bank Statement Truth &amp; Skin in the Game
              </h4>
              <p className="text-xs leading-relaxed text-neutral-300 print:text-slate-700">
                {memo.forensicRealityCheck.bankTurnoverAndSkinInGame}
              </p>
            </div>
            <div className="rounded-lg border border-[#262626] bg-[#141414] print:bg-slate-50 print:border-slate-200 p-4 space-y-1.5">
              <h4 className="text-xs font-semibold text-white print:text-slate-900">
                Fund Diversion, CIB &amp; NI Act Integrity
              </h4>
              <p className="text-xs leading-relaxed text-neutral-300 print:text-slate-700">
                {memo.forensicRealityCheck.fundDiversionAndIntegrityRisks}
              </p>
            </div>
          </div>
        </section>

        {/* 4. Inflation & Sector Shock Simulation */}
        <section className="space-y-3 print-avoid-break">
          <h3 className="font-display text-sm font-semibold text-white print:text-slate-900 border-b border-[#262626] print:border-slate-200 pb-2">
            04. Inflation &amp; Sector Shock Simulation
          </h3>
          <p className="text-sm leading-relaxed text-neutral-300 print:text-slate-700">
            {memo.inflationAndShockSimulation.summary}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="rounded-lg border border-[#262626] bg-[#141414] print:bg-slate-50 print:border-slate-200 p-4 space-y-1.5">
              <h4 className="text-xs font-semibold text-white print:text-slate-900">
                Margin Compression &amp; Stressed EMI Impact
              </h4>
              <p className="text-xs leading-relaxed text-neutral-300 print:text-slate-700">
                {memo.inflationAndShockSimulation.marginAndEmiImpact}
              </p>
            </div>
            <div className="rounded-lg border border-[#262626] bg-[#141414] print:bg-slate-50 print:border-slate-200 p-4 space-y-1.5">
              <h4 className="text-xs font-semibold text-white print:text-slate-900">
                Cost Pass-Through &amp; Fixed Contract Exposure
              </h4>
              <p className="text-xs leading-relaxed text-neutral-300 print:text-slate-700">
                {memo.inflationAndShockSimulation.costPassThroughAssessment}
              </p>
            </div>
          </div>
        </section>

        {/* 5. Post-Loan Growth & Repayment Realism */}
        <section className="space-y-3 print-avoid-break">
          <h3 className="font-display text-sm font-semibold text-white print:text-slate-900 border-b border-[#262626] print:border-slate-200 pb-2">
            05. Post-Loan Growth &amp; Repayment Realism
          </h3>
          <p className="text-sm leading-relaxed text-neutral-300 print:text-slate-700">
            {memo.postLoanGrowthAndRepaymentRealism.summary}
          </p>
          <div className="rounded-lg border border-[#262626] bg-[#141414] print:bg-slate-50 print:border-slate-200 p-4 space-y-1.5">
            <h4 className="text-xs font-semibold text-white print:text-slate-900">
              Post-Grace EMI Serviceability
            </h4>
            <p className="text-xs leading-relaxed text-neutral-300 print:text-slate-700">
              {memo.postLoanGrowthAndRepaymentRealism.postGraceCashFlowReality}
            </p>
          </div>
          <div className="space-y-1.5 pt-1">
            <h4 className="text-xs font-semibold text-white print:text-slate-900">
              Project Completion, Licensing &amp; Ramp-Up Risks
            </h4>
            <ul className="space-y-1.5 text-xs leading-relaxed text-neutral-300 print:text-slate-700 list-disc pl-4">
              {memo.postLoanGrowthAndRepaymentRealism.timelineAndExecutionRisks.map(
                (risk, i) => (
                  <li key={i}>{risk}</li>
                ),
              )}
            </ul>
          </div>
        </section>

        {/* 6. Top 5 Sector-Specific Default (NPL) Triggers */}
        <section className="space-y-3 print-avoid-break">
          <h3 className="font-display text-sm font-semibold text-white print:text-slate-900 border-b border-[#262626] print:border-slate-200 pb-2">
            06. Top 5 Sector-Specific Default (NPL) Triggers
          </h3>
          <div className="overflow-x-auto rounded-lg border border-[#262626] print:border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#262626] bg-[#141414] text-neutral-400 print:bg-slate-50 print:text-slate-600 print:border-slate-200">
                  <th className="py-2.5 px-3.5 font-medium w-8">#</th>
                  <th className="py-2.5 px-3.5 font-medium w-48">NPL Trigger</th>
                  <th className="py-2.5 px-3.5 font-medium w-24">Severity</th>
                  <th className="py-2.5 px-3.5 font-medium">
                    Default Mechanism in Bangladesh
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626] print:divide-slate-200">
                {memo.topFiveNplTriggers.map((trigger, idx) => (
                  <tr key={idx} className="align-top hover:bg-[#141414]">
                    <td className="py-2.5 px-3.5 font-mono text-neutral-400 tabular-nums">
                      0{idx + 1}
                    </td>
                    <td className="py-2.5 px-3.5 font-semibold text-white print:text-slate-900">
                      {trigger.title}
                    </td>
                    <td
                      className={`py-2.5 px-3.5 whitespace-nowrap ${getSeverityTextClass(
                        trigger.severity,
                      )}`}
                    >
                      {trigger.severity}
                    </td>
                    <td className="py-2.5 px-3.5 leading-relaxed text-neutral-300 print:text-slate-700">
                      {trigger.mechanism}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 7. Branch Manager Protection Covenants */}
        <section className="space-y-3 print-avoid-break">
          <div className="flex items-center justify-between border-b border-[#262626] print:border-slate-200 pb-2">
            <h3 className="font-display text-sm font-semibold text-white print:text-slate-900">
              07. Branch Manager Protection Covenants (5 Mandatory Safeguards)
            </h3>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-300">
              <ShieldCheck
                className="h-3.5 w-3.5 text-[#34D399]"
                aria-hidden="true"
              />
              <span>Audit &amp; Retirement Clearance Controls</span>
            </span>
          </div>

          <div className="divide-y divide-[#262626] print:divide-slate-200 rounded-lg border border-[#262626] print:border-slate-200 bg-[#141414] print:bg-white">
            {memo.branchManagerProtectionCovenants.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4"
              >
                <div className="md:col-span-5 flex items-baseline gap-2">
                  <span className="font-mono text-xs text-neutral-500 tabular-nums">
                    {String(idx + 1).padStart(2, '0')}.
                  </span>
                  <span className="text-xs font-semibold text-white print:text-slate-900">
                    {item.covenant}
                  </span>
                </div>
                <p className="md:col-span-7 text-xs leading-relaxed text-neutral-300 print:text-slate-700">
                  {item.enforcementMechanism}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Print-only NBCI Sign-Off Block */}
        <footer className="hidden print:grid grid-cols-2 gap-12 pt-10 mt-8 border-t border-slate-300 text-xs text-slate-700 print-avoid-break">
          <div className="space-y-8">
            <div className="border-b border-slate-400 pb-1">
              Appraised By (Branch Credit Officer / NBCI Analyst)
            </div>
            <div>Name, Designation &amp; Date:</div>
          </div>
          <div className="space-y-8">
            <div className="border-b border-slate-400 pb-1">
              Approved / Forwarded By (Branch Manager)
            </div>
            <div>Name, Branch Seal &amp; Date:</div>
          </div>
        </footer>
      </div>
    </article>
  );
}
