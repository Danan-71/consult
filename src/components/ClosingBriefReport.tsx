import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  Flame,
  Printer,
  ShieldAlert,
  Wrench,
} from 'lucide-react';
import type {
  ClosingPlannerInput,
  ClosingPostureStatus,
  ClosingStrategyBrief,
} from '../types/credit';
import { formatBDT } from '../utils/finance';

interface ClosingBriefReportProps {
  input: ClosingPlannerInput;
  brief: ClosingStrategyBrief | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onPrint: () => void;
  onLoadDefaultPreset: () => void;
}

function getPostureStyle(status: ClosingPostureStatus) {
  switch (status) {
    case 'ON TRACK':
      return {
        box: 'border-emerald-500/35 bg-emerald-950/25 print:border-[#059669]/30 print:bg-white',
        title: 'text-white print:text-[#0B192C]',
        label: 'text-[#34D399] print:text-[#059669]',
        Icon: CheckCircle2,
      };
    case 'SELECTIVE PUSH REQUIRED':
      return {
        box: 'border-amber-500/35 bg-amber-950/25 print:border-[#D97706]/35 print:bg-white',
        title: 'text-white print:text-[#0B192C]',
        label: 'text-amber-400 print:text-[#D97706]',
        Icon: AlertTriangle,
      };
    case 'CLOSING RUSH RISK — CREDIT DISCIPLINE ALERT':
      return {
        box: 'border-red-500/40 bg-red-950/25 print:border-[#DC2626]/35 print:bg-white',
        title: 'text-white print:text-[#0B192C]',
        label: 'text-red-400 print:text-[#DC2626]',
        Icon: AlertOctagon,
      };
  }
}

function csvEscape(value: string | number): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function ClosingBriefReport({
  input,
  brief,
  isLoading,
  error,
  onRetry,
  onPrint,
  onLoadDefaultPreset,
}: ClosingBriefReportProps) {
  const handleDownloadCsv = () => {
    if (!brief) return;
    const headers = [
      'Case Code (Anonymized)',
      'Bucket',
      'Amount (BDT)',
      'Stage',
      'Priority Queue',
      'Assigned Action',
      'Owner Role',
      'Target Date',
    ];
    const rows = (brief.closingActionSheetRows || []).map((row) =>
      [
        csvEscape(row.caseCode),
        csvEscape(row.bucket),
        csvEscape(row.amountBdt),
        csvEscape(row.stage),
        csvEscape(row.priorityGroup),
        csvEscape(row.assignedAction),
        csvEscape(row.ownerRole),
        csvEscape(row.targetDate),
      ].join(','),
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const slug = (input.branchOrPeriodLabel || 'branch-closing')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    link.href = url;
    link.download = `nbci-closing-action-sheet-${slug || 'branch'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <section
        id="section-closing-brief"
        aria-busy="true"
        className="rounded-xl border border-[#262626] bg-[#0D0D0D] ncg-card p-6 space-y-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#262626] pb-4">
          <div className="space-y-2">
            <div className="text-xs font-semibold text-white">
              Synthesizing Branch Closing Playbook &amp; Action Sheet...
            </div>
            <div className="h-3 w-72 rounded ncg-shimmer" />
          </div>
          <div className="h-8 w-36 rounded-lg ncg-shimmer" />
        </div>
        {[1, 2, 3, 4, 5].map((idx) => (
          <div key={idx} className="space-y-2.5 pt-2">
            <div className="h-4 w-64 rounded ncg-shimmer" />
            <div className="h-3.5 w-full rounded ncg-shimmer" />
            <div className="h-3.5 w-5/6 rounded ncg-shimmer" />
          </div>
        ))}
      </section>
    );
  }

  if (error) {
    return (
      <section
        id="section-closing-brief"
        role="alert"
        className="rounded-xl border border-red-500/40 bg-[#0D0D0D] ncg-card p-6 space-y-4"
      >
        <div className="flex items-start gap-3">
          <AlertCircle
            className="h-5 w-5 text-red-400 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <h3 className="font-display text-sm font-semibold text-white">
              Branch Closing Playbook Generation Failed
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
            Retry Branch Closing Playbook
          </button>
        </div>
      </section>
    );
  }

  if (!brief) {
    return (
      <section
        id="section-closing-brief"
        className="rounded-xl border border-[#262626] bg-[#0D0D0D] ncg-card p-8 text-center space-y-4"
      >
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg border border-[#262626] bg-[#141414] text-white">
          <FileText className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="mx-auto max-w-lg space-y-1.5">
          <h3 className="font-display text-base font-semibold text-white">
            Northern Banking Credit Intelligence — Branch Closing Playbook
          </h3>
          <p className="text-sm leading-relaxed text-neutral-400">
            Load one of the closing presets above or enter your branch targets and
            anonymized pipeline cases on the left, then click{' '}
            <span className="font-semibold text-white">
              Generate Branch Closing Playbook
            </span>{' '}
            to produce Morning Huddle priorities, stalled-item unblocking steps,
            credit-quality guardrails, and an exportable Action Sheet.
          </p>
        </div>
        <div>
          <button
            type="button"
            onClick={onLoadDefaultPreset}
            className="inline-flex items-center gap-2 rounded-lg border border-[#262626] bg-[#141414] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1C1C1C] cursor-pointer transition-colors"
          >
            Load Sample: Half-Yearly Balanced Push
          </button>
        </div>
      </section>
    );
  }

  const postureStyle = getPostureStyle(brief.executiveClosingPosture.status);
  const PostureIcon = postureStyle.Icon;

  return (
    <article
      id="section-closing-brief"
      className="rounded-xl border border-[#262626] bg-[#0D0D0D] ncg-card overflow-hidden print:border-slate-300 print:bg-white"
    >
      {/* Header */}
      <div className="border-b border-[#262626] bg-[#141414] print:border-slate-200 print:bg-slate-50 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-semibold text-white print:text-slate-900">
            NBCI Branch Closing Playbook —{' '}
            {input.branchOrPeriodLabel || 'Branch Closing Plan'}
          </h2>
          <p className="text-xs text-neutral-400 print:text-slate-500 mt-0.5">
            {input.daysLeftToClosing} Days Left · Anonymized (No PII) · Generated{' '}
            {new Date(brief.generatedAtIso).toLocaleString('en-GB', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#262626] bg-[#1A1A1A] px-3 py-2 text-xs font-semibold text-white hover:bg-[#242424] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Export Action Sheet (CSV)</span>
          </button>
          <button
            type="button"
            onClick={onPrint}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-semibold text-black hover:bg-neutral-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Print Playbook &amp; Action Sheet (PDF)</span>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* 1. Executive Closing Posture */}
        <section
          className={`rounded-xl border p-5 space-y-2 print-avoid-break ${postureStyle.box}`}
        >
          <div className="flex items-center gap-2">
            <PostureIcon
              className={`h-5 w-5 shrink-0 ${postureStyle.label}`}
              aria-hidden="true"
            />
            <div>
              <div
                className={`text-[11px] font-semibold uppercase tracking-wide ${postureStyle.label}`}
              >
                01. Closing Cutoff Posture
              </div>
              <h3 className={`font-display text-base font-bold ${postureStyle.title}`}>
                {brief.executiveClosingPosture.status}
              </h3>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-neutral-200 print:text-slate-800">
            {brief.executiveClosingPosture.summary}
          </p>
        </section>

        {/* 2. Morning Huddle Priorities */}
        <section className="space-y-3 print-avoid-break">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#262626] print:border-slate-200 pb-1.5">
            <h3 className="font-display text-sm font-semibold text-white print:text-slate-900">
              02. Morning Huddle Priorities (Same-Day Branch Execution)
            </h3>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#34D399] print:text-[#059669]">
              <Flame className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Act Today Focus</span>
            </span>
          </div>

          <div className="rounded-lg border border-emerald-500/35 bg-emerald-950/25 print:border-[#059669]/25 print:bg-white p-3 text-xs font-medium text-neutral-100 print:text-[#0B192C]">
            {brief.morningHuddlePriorities.headline}
          </div>

          <div className="divide-y divide-[#262626] rounded-lg border border-[#262626] print:divide-slate-200 print:border-slate-200">
            {brief.morningHuddlePriorities.topActions.map((act, idx) => (
              <div
                key={idx}
                className="p-3.5 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-start"
              >
                <div className="md:col-span-4 space-y-0.5">
                  <div className="font-mono text-[10px] font-bold uppercase text-neutral-400 print:text-slate-500">
                    {act.bucket} · {act.ownerRole}
                  </div>
                  <div className="text-xs font-semibold text-white print:text-[#0B192C]">
                    {act.itemCode}
                  </div>
                </div>
                <div className="md:col-span-8 space-y-1">
                  <p className="text-xs font-medium text-neutral-200 print:text-slate-800 leading-relaxed">
                    {act.huddleDirective}
                  </p>
                  <p className="text-[11px] text-neutral-400 print:text-slate-500 leading-relaxed">
                    {act.targetCutoffNote}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Specific Follow-Up / Unblocking Actions per Stalled Item */}
        <section className="space-y-3 print-avoid-break">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#262626] print:border-slate-200 pb-1.5">
            <h3 className="font-display text-sm font-semibold text-white print:text-slate-900">
              03. Specific Follow-Up &amp; Unblocking Actions (Stalled / Watch Items)
            </h3>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 print:text-[#D97706]">
              <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Bottleneck Resolution</span>
            </span>
          </div>

          {brief.stalledItemUnblockingActions.length === 0 ? (
            <p className="text-xs text-neutral-400 print:text-slate-600">
              No stalled bottlenecks flagged; maintain routine daily closing check-ins.
            </p>
          ) : (
            <div className="divide-y divide-[#262626] rounded-lg border border-[#262626] print:divide-slate-200 print:border-slate-200">
              {brief.stalledItemUnblockingActions.map((stalled, idx) => (
                <div
                  key={idx}
                  className="p-3.5 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-start"
                >
                  <div className="md:col-span-4 space-y-0.5">
                    <div className="font-mono text-[10px] font-bold uppercase text-amber-400 print:text-[#D97706]">
                      {stalled.currentStage} · {stalled.dueWindow}
                    </div>
                    <div className="text-xs font-semibold text-white print:text-[#0B192C]">
                      {stalled.itemCode}
                    </div>
                    <p className="text-[11px] text-neutral-400 print:text-slate-500 leading-relaxed">
                      Blocker: {stalled.bottleneckSummary}
                    </p>
                  </div>
                  <div className="md:col-span-8">
                    <p className="text-xs font-medium text-neutral-200 print:text-slate-800 leading-relaxed">
                      <span className="font-semibold text-white print:text-[#0B192C]">
                        Unblocking Action:{' '}
                      </span>
                      {stalled.specificUnblockingStep}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 4. Pre-Cutoff NPL Cash Recovery Push */}
        <section className="space-y-2.5 print-avoid-break">
          <h3 className="font-display text-sm font-semibold text-white print:text-slate-900 border-b border-[#262626] print:border-slate-200 pb-1.5">
            04. Pre-Cutoff NPL Cash Recovery &amp; Regularization Push
          </h3>
          <p className="text-xs leading-relaxed text-neutral-300 print:text-slate-700">
            {brief.nplRecoveryPushBeforeCutoff.summary}
          </p>
          <ul className="space-y-1.5 pl-1">
            {brief.nplRecoveryPushBeforeCutoff.tacticalSteps.map((step, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-xs text-neutral-300 print:text-slate-700"
              >
                <span className="font-mono text-neutral-500 print:text-slate-400 tabular-nums mt-0.5">
                  {String(idx + 1).padStart(2, '0')}.
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 5. Policy & Credit-Quality Guardrails */}
        <section className="space-y-2.5 print-avoid-break">
          <div className="flex items-center justify-between border-b border-[#262626] print:border-slate-200 pb-1.5">
            <h3 className="font-display text-sm font-semibold text-white print:text-slate-900">
              05. Policy &amp; Credit-Quality Guardrails (No Closing-Rush NPLs)
            </h3>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400 print:text-slate-600">
              <ShieldAlert
                className="h-3.5 w-3.5 text-white print:text-slate-800"
                aria-hidden="true"
              />
              <span>Anti-Rush &amp; Margin Protection</span>
            </span>
          </div>

          <div className="rounded-lg border border-[#262626] bg-[#141414] print:border-slate-200 print:bg-slate-50 p-3 text-xs leading-relaxed text-neutral-300 print:text-slate-700">
            <span className="font-semibold text-white print:text-slate-900">
              Closing Rush &amp; Spread Risk:{' '}
            </span>
            {brief.policyAndCreditQualityGuardrails.closingRushAssessment}
          </div>

          <ul className="space-y-1.5 pl-1">
            {brief.policyAndCreditQualityGuardrails.guardrails.map((g, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-xs text-neutral-300 print:text-slate-700"
              >
                <span className="font-mono text-neutral-500 print:text-slate-400 tabular-nums mt-0.5">
                  •
                </span>
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 6. Printable / Exportable Anonymized Closing Action Sheet */}
        <section className="space-y-3 print-avoid-break">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#262626] print:border-slate-200 pb-1.5">
            <h3 className="font-display text-sm font-semibold text-white print:text-slate-900">
              06. Printable Closing Action Sheet (Anonymized — No PII)
            </h3>
            <span className="text-[11px] text-neutral-400 print:text-slate-500">
              For Branch Morning Huddle &amp; End-of-Day Sign-Off
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[#262626] print:border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#262626] bg-[#141414] text-neutral-400 print:border-slate-200 print:bg-slate-50 print:text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-semibold w-10 text-center">Done</th>
                  <th className="px-3 py-2 font-semibold">Case Code</th>
                  <th className="px-3 py-2 font-semibold">Bucket / Stage</th>
                  <th className="px-3 py-2 font-semibold text-right">Amount (৳)</th>
                  <th className="px-3 py-2 font-semibold">Action Queue</th>
                  <th className="px-3 py-2 font-semibold">Assigned Execution Step</th>
                  <th className="px-3 py-2 font-semibold">Owner / Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626] text-neutral-300 print:divide-slate-200 print:text-slate-700">
                {brief.closingActionSheetRows.map((row, idx) => (
                  <tr key={idx} className="align-top hover:bg-[#141414] print:hover:bg-transparent">
                    <td className="px-3 py-2.5 text-center font-mono text-neutral-500 print:text-slate-400">
                      [ ]
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-white print:text-slate-900">
                      {row.caseCode}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-neutral-200 print:text-slate-800">{row.bucket}</div>
                      <div className="text-[11px] text-neutral-400 print:text-slate-500">{row.stage}</div>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-semibold text-white print:text-slate-900 tabular-nums whitespace-nowrap">
                      {formatBDT(row.amountBdt)}
                    </td>
                    <td
                      className={`px-3 py-2.5 font-semibold whitespace-nowrap ${
                        row.priorityGroup === 'Act Today'
                          ? 'text-[#34D399] print:text-[#059669]'
                          : row.priorityGroup === 'Unblock Bottlenecks'
                            ? 'text-amber-400 print:text-[#D97706]'
                            : 'text-red-400 print:text-[#DC2626]'
                      }`}
                    >
                      {row.priorityGroup}
                    </td>
                    <td className="px-3 py-2.5 leading-relaxed text-neutral-300 print:text-slate-700">
                      {row.assignedAction}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="font-medium text-neutral-200 print:text-slate-800">{row.ownerRole}</div>
                      <div className="font-mono text-[11px] text-neutral-400 print:text-slate-500 tabular-nums">
                        {row.targetDate || 'Before Cutoff'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Print-only NBCI Sign-Off Block */}
        <footer className="hidden print:grid grid-cols-2 gap-12 pt-10 mt-8 border-t border-slate-300 text-xs text-slate-700 print-avoid-break">
          <div className="space-y-8">
            <div className="border-b border-slate-400 pb-1">
              Prepared By (Branch Manager / Operations Lead)
            </div>
            <div>Name, Branch Seal &amp; Date:</div>
          </div>
          <div className="space-y-8">
            <div className="border-b border-slate-400 pb-1">
              Reviewed By (Regional / Zonal Head)
            </div>
            <div>Name, Designation &amp; Date:</div>
          </div>
        </footer>
      </div>
    </article>
  );
}
