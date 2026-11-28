import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import type { RecoveryCaseInput, RecoveryMetrics } from '../types/credit';
import {
  formatBDT,
  formatBDTScaleHint,
  formatPct,
} from '../utils/finance';

interface RecoveryDashboardProps {
  input: RecoveryCaseInput;
  metrics: RecoveryMetrics;
  hasInputs: boolean;
}

function getFeasibilityStyle(status: RecoveryMetrics['feasibilityStatus']) {
  switch (status) {
    case 'Cash-Flow Viable Recovery':
      return {
        box: 'border-emerald-500/35 bg-emerald-950/25 print:border-[#059669]/30 print:bg-white',
        titleText: 'text-[#34D399] print:text-[#059669]',
        Icon: CheckCircle2,
      };
    case 'Asset-Backed / Structured Exit':
      return {
        box: 'border-amber-500/35 bg-amber-950/25 print:border-[#D97706]/35 print:bg-white',
        titleText: 'text-amber-400 print:text-[#D97706]',
        Icon: AlertTriangle,
      };
    case 'Legal & Enforcement Priority':
      return {
        box: 'border-red-500/40 bg-red-950/25 print:border-[#DC2626]/35 print:bg-white',
        titleText: 'text-red-400 print:text-[#DC2626]',
        Icon: ShieldAlert,
      };
  }
}

export function RecoveryDashboard({
  input,
  metrics,
  hasInputs,
}: RecoveryDashboardProps) {
  if (!hasInputs) {
    return (
      <section
        id="section-recovery-metrics"
        className="rounded-xl border border-[#262626] bg-[#0D0D0D] ncg-card p-6"
      >
        <h2 className="font-display text-base font-semibold text-white">
          Recovery Cash Capacity &amp; Collateral Coverage Engine
        </h2>
        <p className="mt-1.5 text-sm text-neutral-400">
          Select one of the 3 anonymized recovery presets above—or enter a classified
          borrower&apos;s arrears, current monthly cash inflows, essential expenses, and
          collateral realizable value—to compute net recovery capacity, months to recover,
          and security coverage (%).
        </p>
      </section>
    );
  }

  const feasibilityStyle = getFeasibilityStyle(metrics.feasibilityStatus);
  const FeasibilityIcon = feasibilityStyle.Icon;

  const overdueMonthsLabel =
    metrics.monthsToRecoverOverdue === null
      ? 'Not Viable'
      : `${metrics.monthsToRecoverOverdue.toFixed(1)} mo`;

  const outstandingMonthsLabel =
    metrics.monthsToRecoverOutstanding === null
      ? 'Not Viable'
      : `${metrics.monthsToRecoverOutstanding.toFixed(1)} mo`;

  const coverageOutstandingLabel =
    metrics.collateralCoverageVsOutstandingPct === null
      ? 'N/A'
      : formatPct(metrics.collateralCoverageVsOutstandingPct, 1);

  const coverageOverdueLabel =
    metrics.collateralCoverageVsOverduePct === null
      ? 'N/A'
      : formatPct(metrics.collateralCoverageVsOverduePct, 1);

  const outstandingScale = formatBDTScaleHint(input.totalOutstandingAmount);
  const netCashScale = formatBDTScaleHint(metrics.monthlyNetCashForRecovery);

  return (
    <section id="section-recovery-metrics" className="space-y-4">
      {/* Header strip */}
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="font-display text-base font-semibold text-white print:text-slate-900">
            Recovery Capacity &amp; Collateral Coverage Metrics
          </h2>
          <p className="text-xs text-neutral-400 print:text-slate-500 mt-0.5">
            {input.caseReference || 'Anonymized Case'} · {input.sector} ·{' '}
            {input.classificationStage}
          </p>
        </div>
        <div className="font-mono text-xs text-neutral-300 print:text-slate-700 tabular-nums">
          Outstanding: {formatBDT(input.totalOutstandingAmount)}
          {outstandingScale ? ` (${outstandingScale})` : ''}
        </div>
      </div>

      {/* Feasibility Posture Summary Banner */}
      <div className={`rounded-xl border ncg-card p-5 print-avoid-break ${feasibilityStyle.box}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-medium text-neutral-400 print:text-slate-600">
              Preliminary Recovery Feasibility Signal
            </div>
            <div className="flex items-center gap-2">
              <FeasibilityIcon
                className={`h-5 w-5 shrink-0 ${feasibilityStyle.titleText}`}
                aria-hidden="true"
              />
              <span
                className={`font-display text-lg font-bold ${feasibilityStyle.titleText}`}
              >
                {metrics.feasibilityStatus}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-right">
            <div>
              <div className="text-[11px] font-medium text-neutral-400 print:text-slate-500">
                Overdue Share
              </div>
              <div className="font-mono text-sm font-bold text-white print:text-slate-900 tabular-nums">
                {formatPct(metrics.overdueShareOfOutstandingPct, 1)}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-neutral-400 print:text-slate-500">
                Months Overdue
              </div>
              <div className="font-mono text-sm font-bold text-white print:text-slate-900 tabular-nums">
                {input.monthsOverdue} mo
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-neutral-400 print:text-slate-500">
                Red Flags
              </div>
              <div
                className={`font-mono text-sm font-bold tabular-nums ${
                  metrics.activeRedFlagCount > 0
                    ? 'text-red-400 print:text-[#DC2626]'
                    : 'text-[#34D399] print:text-[#059669]'
                }`}
              >
                {metrics.activeRedFlagCount} / 6
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Core Calculated Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 print-avoid-break">
        {/* Card 1: Monthly Net Cash Available for Recovery */}
        <div className="rounded-xl border border-[#262626] bg-[#0D0D0D] print:border-slate-300 print:bg-white ncg-card-interactive p-4 space-y-1.5">
          <div className="text-xs font-medium text-neutral-400 print:text-slate-500">
            Monthly Net Cash for Recovery
          </div>
          <div
            className={`font-mono text-xl font-bold tabular-nums ${
              metrics.cashFlowViable
                ? 'text-[#34D399] print:text-[#059669]'
                : 'text-red-400 print:text-[#DC2626]'
            }`}
          >
            {formatBDT(metrics.monthlyNetCashForRecovery)}
            <span className="text-xs font-normal text-neutral-400 print:text-slate-500">/mo</span>
          </div>
          <div className="text-[11px] text-neutral-400 print:text-slate-500">
            {netCashScale
              ? `${netCashScale}/mo surplus after survival OpEx`
              : metrics.cashFlowViable
                ? 'Monthly surplus above essential OpEx'
                : 'Cash deficit — business cannot service EMIs'}
          </div>
        </div>

        {/* Card 2: Months to Recover at Current Capacity */}
        <div className="rounded-xl border border-[#262626] bg-[#0D0D0D] print:border-slate-300 print:bg-white ncg-card-interactive p-4 space-y-1.5">
          <div className="flex items-center justify-between gap-1 text-xs font-medium text-neutral-400 print:text-slate-500">
            <span>Months to Recover (Capacity)</span>
            <Clock className="h-3.5 w-3.5 text-neutral-500" aria-hidden="true" />
          </div>
          <div className="font-mono text-xl font-bold text-white print:text-slate-900 tabular-nums">
            {outstandingMonthsLabel}
          </div>
          <div className="text-[11px] text-neutral-400 print:text-slate-600 font-mono tabular-nums">
            Overdue only: <span className="font-semibold text-neutral-200 print:text-slate-900">{overdueMonthsLabel}</span>
          </div>
        </div>

        {/* Card 3: Collateral Coverage vs. Outstanding */}
        <div className="rounded-xl border border-[#262626] bg-[#0D0D0D] print:border-slate-300 print:bg-white ncg-card-interactive p-4 space-y-1.5">
          <div className="text-xs font-medium text-neutral-400 print:text-slate-500">
            Collateral Coverage vs. Outstanding
          </div>
          <div
            className={`font-mono text-xl font-bold tabular-nums ${
              metrics.collateralCoverageVsOutstandingPct !== null &&
              metrics.collateralCoverageVsOutstandingPct >= 100
                ? 'text-[#34D399] print:text-[#059669]'
                : metrics.collateralCoverageVsOutstandingPct !== null &&
                    metrics.collateralCoverageVsOutstandingPct >= 65
                  ? 'text-amber-400 print:text-[#D97706]'
                  : 'text-red-400 print:text-[#DC2626]'
            }`}
          >
            {coverageOutstandingLabel}
          </div>
          <div className="text-[11px] text-neutral-400 print:text-slate-600 font-mono tabular-nums">
            vs. Overdue: <span className="font-semibold text-neutral-200 print:text-slate-900">{coverageOverdueLabel}</span>
          </div>
        </div>
      </div>

      {/* Recovery Cash Flow & Security Ledger Table */}
      <div
        id="section-recovery-cashflow"
        className="rounded-xl border border-[#262626] bg-[#0D0D0D] print:border-slate-300 print:bg-white ncg-card overflow-hidden print-avoid-break"
      >
        <div className="border-b border-[#262626] bg-[#141414] print:border-slate-200 print:bg-slate-50 px-5 py-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-sm font-semibold text-white print:text-slate-900">
            Cash Flow &amp; Asset Coverage Breakdown
          </h3>
          <span className="text-xs text-neutral-400 print:text-slate-500">
            Realizability: {input.collateralRealizability}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#262626] bg-[#141414] text-neutral-400 print:border-slate-200 print:bg-slate-50 print:text-slate-600">
              <tr>
                <th className="px-5 py-2.5 font-semibold">Recovery Parameter</th>
                <th className="px-5 py-2.5 font-semibold text-right">
                  Computed Figure (BDT / Ratio)
                </th>
                <th className="px-5 py-2.5 font-semibold">Operational Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626] text-neutral-300 print:divide-slate-200 print:text-slate-700">
              <tr className="hover:bg-[#141414] print:hover:bg-transparent">
                <td className="px-5 py-2.5 font-medium text-white print:text-slate-900">
                  Total Outstanding Balance
                </td>
                <td className="px-5 py-2.5 text-right font-mono font-semibold text-white print:text-slate-900 tabular-nums">
                  {formatBDT(input.totalOutstandingAmount)}
                </td>
                <td className="px-5 py-2.5 text-neutral-400 print:text-slate-500 font-mono tabular-nums">
                  Overdue arrears: {formatBDT(input.overdueAmount)} ({formatPct(metrics.overdueShareOfOutstandingPct, 1)})
                </td>
              </tr>
              <tr className="hover:bg-[#141414] print:hover:bg-transparent">
                <td className="px-5 py-2.5 font-medium text-white print:text-slate-900">
                  Monthly Business Cash Inflow
                </td>
                <td className="px-5 py-2.5 text-right font-mono font-semibold text-white print:text-slate-900 tabular-nums">
                  {formatBDT(input.monthlyCashInflow)}
                </td>
                <td className="px-5 py-2.5 text-neutral-400 print:text-slate-500">
                  Less essential operating survival OpEx (<span className="font-mono tabular-nums">{formatBDT(input.essentialMonthlyExpenses)}</span>)
                </td>
              </tr>
              <tr className="hover:bg-[#141414] print:hover:bg-transparent">
                <td className="px-5 py-2.5 font-medium text-white print:text-slate-900">
                  Monthly Net Cash Available for Recovery
                </td>
                <td
                  className={`px-5 py-2.5 text-right font-mono font-bold tabular-nums ${
                    metrics.cashFlowViable
                      ? 'text-[#34D399] print:text-[#059669]'
                      : 'text-red-400 print:text-[#DC2626]'
                  }`}
                >
                  {formatBDT(metrics.monthlyNetCashForRecovery, true)}
                </td>
                <td className="px-5 py-2.5 text-neutral-400 print:text-slate-500">
                  {metrics.cashFlowViable
                    ? 'Maximum theoretical monthly debt service before haircuts'
                    : 'Negative surplus — restructuring infeasible without external capital'}
                </td>
              </tr>
              <tr className="hover:bg-[#141414] print:hover:bg-transparent">
                <td className="px-5 py-2.5 font-medium text-white print:text-slate-900">
                  Estimated Collateral Realizable Value
                </td>
                <td className="px-5 py-2.5 text-right font-mono font-semibold text-white print:text-slate-900 tabular-nums">
                  {formatBDT(input.collateralRealizableValue)}
                </td>
                <td className="px-5 py-2.5 text-neutral-400 print:text-slate-500">
                  Covers {coverageOutstandingLabel} of total outstanding ({coverageOverdueLabel} of overdue)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
