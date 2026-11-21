import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flame,
  ShieldAlert,
  Wrench,
} from 'lucide-react';
import type {
  ClosingMetrics,
  ClosingPlannerInput,
  PrioritizedPipelineItem,
} from '../types/credit';
import {
  formatBDT,
  formatBDTScaleHint,
  formatPct,
} from '../utils/finance';

interface ClosingDashboardProps {
  input: ClosingPlannerInput;
  metrics: ClosingMetrics;
  hasInputs: boolean;
}

function ActionQueueGroupCard({
  title,
  subtitle,
  items,
  tone,
  emptyLabel,
}: {
  title: string;
  subtitle: string;
  items: PrioritizedPipelineItem[];
  tone: 'act' | 'unblock' | 'watch';
  emptyLabel: string;
}) {
  const styles =
    tone === 'act'
      ? {
          container: 'border-[#059669]/30 bg-white ncg-card',
          header: 'border-[#E2E8F0] bg-emerald-50/60 print:bg-white',
          title: 'text-[#0B192C]',
          Icon: Flame,
          iconColor: 'text-[#059669]',
          countText: 'text-[#059669]',
        }
      : tone === 'unblock'
        ? {
            container: 'border-[#D97706]/35 bg-white ncg-card',
            header: 'border-[#E2E8F0] bg-amber-50/60 print:bg-white',
            title: 'text-[#0B192C]',
            Icon: Wrench,
            iconColor: 'text-[#D97706]',
            countText: 'text-[#D97706]',
          }
        : {
            container: 'border-[#DC2626]/35 bg-white ncg-card',
            header: 'border-[#E2E8F0] bg-red-50/60 print:bg-white',
            title: 'text-[#0B192C]',
            Icon: ShieldAlert,
            iconColor: 'text-[#DC2626]',
            countText: 'text-[#DC2626]',
          };

  const Icon = styles.Icon;
  const groupWeightedTotal = items.reduce(
    (sum, entry) => sum + entry.weightedAmountBdt,
    0,
  );

  return (
    <div className={`rounded-xl border overflow-hidden print-avoid-break ${styles.container}`}>
      <div
        className={`border-b px-4 py-3 flex flex-wrap items-center justify-between gap-2 ${styles.header}`}
      >
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 shrink-0 ${styles.iconColor}`} aria-hidden="true" />
          <div>
            <h4 className={`font-display text-xs font-bold ${styles.title}`}>
              {title} ({items.length})
            </h4>
            <p className="text-[11px] text-slate-600">{subtitle}</p>
          </div>
        </div>
        <div className={`font-mono text-xs font-semibold tabular-nums ${styles.countText}`}>
          Wtd. Value: {formatBDT(groupWeightedTotal)}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="px-4 py-3 text-xs text-slate-500">{emptyLabel}</div>
      ) : (
        <div className="divide-y divide-slate-100">
          {items.map((entry, idx) => {
            const it = entry.item;
            return (
              <div
                key={it.id}
                className="px-4 py-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 hover:bg-slate-50/60"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs">
                    <span className="font-mono text-[11px] font-bold text-slate-400 tabular-nums">
                      #{idx + 1}
                    </span>
                    <span className="font-semibold text-slate-900">
                      {it.code || 'Unnamed Case'}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="font-medium text-slate-700">{it.type}</span>
                    <span className="text-slate-400">·</span>
                    <span className="font-medium text-slate-700">
                      Stage: {it.stage}
                    </span>
                    {it.targetDate && (
                      <>
                        <span className="text-slate-400">·</span>
                        <span className="font-mono text-[11px] text-slate-600 tabular-nums">
                          Target: {it.targetDate}
                          {entry.daysToTargetDate !== null
                            ? entry.daysToTargetDate <= 0
                              ? ' (Due Today/Overdue)'
                              : ` (${entry.daysToTargetDate}d)`
                            : ''}
                        </span>
                      </>
                    )}
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    <span className="font-semibold text-slate-900">
                      {tone === 'unblock'
                        ? 'Blocker / Next Step: '
                        : tone === 'watch'
                          ? 'Risk / Margin Flag: '
                          : 'Execution Step: '}
                    </span>
                    {it.blockingIssueNextStep || entry.queueReason}
                  </p>

                  {(entry.weakRiskOrMarginFlag || it.blockingIssueNextStep) && (
                    <p className="text-[11px] text-slate-500">
                      {entry.weakRiskOrMarginReason
                        ? `${entry.weakRiskOrMarginReason} · Profile: ${it.costOrRiskGrade}`
                        : entry.queueReason}
                    </p>
                  )}
                </div>

                <div className="shrink-0 sm:text-right font-mono tabular-nums space-y-0.5">
                  <div className="text-xs font-bold text-slate-900">
                    {formatBDT(it.amountBdt)}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Wtd: {formatBDT(entry.weightedAmountBdt)} ({it.probabilityPct}%)
                  </div>
                  <div className="text-[10px] font-semibold text-slate-500">
                    Priority Score: {entry.priorityScore}/100
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ClosingDashboard({
  input,
  metrics,
  hasInputs,
}: ClosingDashboardProps) {
  if (!hasInputs) {
    return (
      <section
        id="section-closing-metrics"
        className="rounded-xl border border-[#E2E8F0] bg-white ncg-card p-6"
      >
        <h2 className="font-display text-base font-semibold text-[#0B192C]">
          Branch Closing Assistant &amp; Smart Action Queue
        </h2>
        <p className="mt-1.5 text-sm text-slate-600">
          Load a closing preset above—or enter branch targets, days left to cutoff,
          and anonymized pipeline cases with stage, target date, and blockers—to
          compute Weighted Expected Achievement, Daily Pace (৳/day), and rank items
          into Act Today, Unblock Bottlenecks, and Watch Risk / Margin queues.
        </p>
      </section>
    );
  }

  const expectedScale = formatBDTScaleHint(
    metrics.totalWeightedExpectedAchievementBdt,
  );
  const gapScale = formatBDTScaleHint(metrics.totalRemainingGapBdt);
  const dailyPaceScale = formatBDTScaleHint(metrics.totalRequiredDailyPaceBdt);

  const categories = [metrics.deposits, metrics.loans, metrics.nplRecovery];

  return (
    <section id="section-closing-metrics" className="space-y-4">
      {/* Header strip */}
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="font-display text-base font-semibold text-[#0B192C]">
            Closing Attainment &amp; Weighted Pipeline Math
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {input.branchOrPeriodLabel || 'Branch Closing Plan'} ·{' '}
            <span className="font-mono font-semibold text-slate-700 tabular-nums">
              {input.daysLeftToClosing} days
            </span>{' '}
            remaining to cutoff
          </p>
        </div>
        <div className="font-mono text-xs text-slate-700 tabular-nums">
          Total Target: {formatBDT(metrics.totalTargetBdt)}
        </div>
      </div>

      {/* Closing Rush Warning & High-Cost Deposit Alert */}
      {metrics.closingRushWarning && (
        <div
          role="alert"
          className="rounded-xl border border-[#DC2626]/35 bg-red-50/70 print:bg-white p-4 space-y-1.5 print-avoid-break"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-[#DC2626]">
            <AlertOctagon
              className="h-4 w-4 text-[#DC2626] shrink-0"
              aria-hidden="true"
            />
            <span>CLOSING RUSH WARNING: High-Risk / Low-Grade Loan Reliance</span>
          </div>
          <p className="text-xs leading-relaxed text-[#0B192C]">
            {metrics.closingRushReason}
          </p>
        </div>
      )}

      {metrics.highCostDepositWarning && (
        <div className="rounded-xl border border-[#D97706]/35 bg-amber-50/70 print:bg-white p-3.5 flex items-start gap-2.5 text-xs text-[#0B192C] print-avoid-break">
          <AlertTriangle
            className="h-4 w-4 text-[#D97706] shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div>
            <span className="font-semibold text-[#D97706]">
              Spread &amp; Profitability Caution:{' '}
            </span>
            High-Cost Bulk Deposits account for{' '}
            <span className="font-mono font-semibold tabular-nums">
              {formatBDT(metrics.highCostDepositWeightedBdt)}
            </span>{' '}
            (&ge;40% of weighted deposit pipeline). Prioritize CASA mobilization to
            protect Net Interest Margin after closing.
          </div>
        </div>
      )}

      {/* 4 Core KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 print-avoid-break">
        {/* Card 1: Weighted Expected Achievement */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white ncg-card-interactive p-4 space-y-1.5">
          <div className="text-xs font-medium text-slate-500">
            Weighted Expected Achievement
          </div>
          <div className="font-mono text-lg font-bold text-[#0B192C] tabular-nums">
            {formatBDT(metrics.totalWeightedExpectedAchievementBdt)}
          </div>
          <div className="text-[11px] text-slate-500">
            {expectedScale ? `${expectedScale} · ` : ''}Includes{' '}
            <span className="font-mono tabular-nums">
              {formatBDT(metrics.totalWeightedPipelineBdt)}
            </span>{' '}
            weighted pipeline
          </div>
        </div>

        {/* Card 2: Remaining Gap to Target */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white ncg-card-interactive p-4 space-y-1.5">
          <div className="text-xs font-medium text-slate-500">
            Remaining Gap to Target
          </div>
          <div
            className={`font-mono text-lg font-bold tabular-nums ${
              metrics.totalRemainingGapBdt === 0
                ? 'text-[#059669]'
                : 'text-[#D97706]'
            }`}
          >
            {formatBDT(metrics.totalRemainingGapBdt)}
          </div>
          <div className="text-[11px] text-slate-500">
            {metrics.totalRemainingGapBdt === 0
              ? 'Weighted pipeline covers total branch target'
              : `${gapScale ? `${gapScale} ` : ''}unclosed shortfall across targets`}
          </div>
        </div>

        {/* Card 3: Required Daily Pace */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white ncg-card-interactive p-4 space-y-1.5">
          <div className="flex items-center justify-between gap-1 text-xs font-medium text-slate-500">
            <span>Required Daily Pace</span>
            <Clock className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
          </div>
          <div className="font-mono text-lg font-bold text-[#0B192C] tabular-nums">
            {formatBDT(metrics.totalRequiredDailyPaceBdt)}
            <span className="text-xs font-normal text-slate-500">/day</span>
          </div>
          <div className="text-[11px] text-slate-500">
            {dailyPaceScale ? `${dailyPaceScale}/day over ` : 'Over '}
            {Math.max(1, input.daysLeftToClosing)} remaining days
          </div>
        </div>

        {/* Card 4: Asset Quality Discipline */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white ncg-card-interactive p-4 space-y-1.5">
          <div className="text-xs font-medium text-slate-500">
            Closing Quality Posture
          </div>
          <div className="flex items-center gap-1.5">
            {metrics.closingRushWarning ? (
              <>
                <AlertOctagon
                  className="h-4 w-4 text-[#DC2626] shrink-0"
                  aria-hidden="true"
                />
                <span className="font-display text-sm font-bold text-[#DC2626]">
                  Closing Rush Alert
                </span>
              </>
            ) : (
              <>
                <CheckCircle2
                  className="h-4 w-4 text-[#059669] shrink-0"
                  aria-hidden="true"
                />
                <span className="font-display text-sm font-bold text-[#059669]">
                  Quality Mix Verified
                </span>
              </>
            )}
          </div>
          <div className="text-[11px] text-slate-500 font-mono tabular-nums">
            Watch Queue: {metrics.watchRiskMarginQueue.length} item(s)
          </div>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white ncg-card overflow-hidden print-avoid-break">
        <div className="border-b border-[#E2E8F0] bg-slate-50 px-5 py-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-sm font-semibold text-[#0B192C]">
            Closing Target &amp; Daily Pace Breakdown by Bucket
          </h3>
          <span className="font-mono text-xs text-slate-600 tabular-nums">
            Raw Gap: {formatBDT(metrics.totalRawGapBdt)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-600">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Bucket</th>
                <th className="px-4 py-2.5 font-semibold text-right">Achieved</th>
                <th className="px-4 py-2.5 font-semibold text-right">Target</th>
                <th className="px-4 py-2.5 font-semibold text-right">
                  Wtd. Pipeline
                </th>
                <th className="px-4 py-2.5 font-semibold text-right">
                  Wtd. Expected
                </th>
                <th className="px-4 py-2.5 font-semibold text-right">
                  Remaining Gap
                </th>
                <th className="px-4 py-2.5 font-semibold text-right">
                  Daily Pace
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono tabular-nums text-slate-700">
              {categories.map((cat) => (
                <tr key={cat.type} className="hover:bg-slate-50/60">
                  <td className="px-4 py-2.5 font-sans font-semibold text-slate-900">
                    <div>{cat.label}</div>
                    <div className="text-[11px] font-normal text-slate-500">
                      Proj. Attainment: {formatPct(cat.projectedAttainmentPct, 1)}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {formatBDT(cat.achievedBdt)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-slate-900">
                    {formatBDT(cat.targetBdt)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-700">
                    {formatBDT(cat.weightedPipelineBdt)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-slate-900">
                    {formatBDT(cat.weightedExpectedAchievementBdt)}
                  </td>
                  <td
                    className={`px-4 py-2.5 text-right font-semibold ${
                      cat.remainingGapBdt === 0
                        ? 'text-[#059669]'
                        : 'text-[#D97706]'
                    }`}
                  >
                    {formatBDT(cat.remainingGapBdt)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-[#0B192C]">
                    {formatBDT(cat.requiredDailyPaceBdt)}/d
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-100/80 font-bold text-[#0B192C]">
                <td className="px-4 py-2.5 font-sans">Total Branch Closing</td>
                <td className="px-4 py-2.5 text-right">
                  {formatBDT(metrics.totalAchievedBdt)}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {formatBDT(metrics.totalTargetBdt)}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {formatBDT(metrics.totalWeightedPipelineBdt)}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {formatBDT(metrics.totalWeightedExpectedAchievementBdt)}
                </td>
                <td
                  className={`px-4 py-2.5 text-right ${
                    metrics.totalRemainingGapBdt === 0
                      ? 'text-[#059669]'
                      : 'text-[#D97706]'
                  }`}
                >
                  {formatBDT(metrics.totalRemainingGapBdt)}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {formatBDT(metrics.totalRequiredDailyPaceBdt)}/d
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Smart Prioritization & Action Queue */}
      <div id="section-closing-queue" className="space-y-3.5 pt-1">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h3 className="font-display text-sm font-semibold text-[#0B192C]">
              Smart Prioritization &amp; Daily Action Queue
            </h3>
            <p className="text-[11px] text-slate-500">
              Automatically ranked by closing readiness, target-date urgency, weighted BDT impact &amp; risk/margin profile
            </p>
          </div>
          <div className="font-mono text-[11px] text-slate-600 tabular-nums">
            Act Today: {metrics.actTodayQueue.length} · Unblock:{' '}
            {metrics.unblockBottlenecksQueue.length} · Watch Risk/Margin:{' '}
            {metrics.watchRiskMarginQueue.length}
          </div>
        </div>

        <ActionQueueGroupCard
          title="Act Today (High Impact / Near Closing)"
          subtitle="Clean risk/cost items Ready to Close or high-confidence near-term Follow-Ups"
          items={metrics.actTodayQueue}
          tone="act"
          emptyLabel="No clean Ready-to-Close or high-confidence near-term items in queue."
        />

        <ActionQueueGroupCard
          title="Unblock Bottlenecks"
          subtitle="Stalled Docs Pending, Under Review, or low-probability cases needing immediate branch unblocking"
          items={metrics.unblockBottlenecksQueue}
          tone="unblock"
          emptyLabel="No clean pipeline items currently stalled in documentation or review."
        />

        <ActionQueueGroupCard
          title="Watch Risk / Margin"
          subtitle="Flagged High-Risk / Sub-Par Loans, ICRRS Marginal credits, or High-Cost Bulk Deposits"
          items={metrics.watchRiskMarginQueue}
          tone="watch"
          emptyLabel="No weak risk or high-cost margin items detected in active pipeline."
        />
      </div>
    </section>
  );
}
