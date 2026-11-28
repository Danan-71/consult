import {
  Activity,
  AlertCircle,
  Printer,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import type { EarlyWarningInput, EarlyWarningMemo } from '../types/credit';

interface EarlyWarningMemoReportProps {
  input: EarlyWarningInput;
  memo: EarlyWarningMemo | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onPrint: () => void;
  onLoadDefaultPreset: () => void;
}

export function EarlyWarningMemoReport({
  input,
  memo,
  isLoading,
  error,
  onRetry,
  onPrint,
  onLoadDefaultPreset,
}: EarlyWarningMemoReportProps) {
  if (isLoading) {
    return (
      <section
        id="section-ews-memo"
        aria-label="Generating Early Warning Intervention Brief"
        className="rounded-xl border border-[#262626] bg-[#0D0D0D] p-6 space-y-4 ncg-card"
      >
        <div className="flex items-center justify-between">
          <div className="h-5 w-64 rounded ncg-shimmer" />
          <div className="h-4 w-28 rounded ncg-shimmer" />
        </div>
        <div className="h-20 w-full rounded-lg ncg-shimmer" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="h-28 rounded-lg ncg-shimmer" />
          <div className="h-28 rounded-lg ncg-shimmer" />
        </div>
        <div className="h-32 w-full rounded-lg ncg-shimmer" />
      </section>
    );
  }

  if (error) {
    return (
      <section
        id="section-ews-memo"
        className="rounded-xl border border-red-500/35 bg-red-950/25 p-6 space-y-3 ncg-card"
      >
        <div className="flex items-start gap-2.5">
          <AlertCircle
            className="h-5 w-5 text-red-400 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div>
            <h3 className="font-display text-sm font-bold text-white">
              Unable to Generate Early Warning Brief
            </h3>
            <p className="mt-1 text-xs text-red-300">{error}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-semibold text-black hover:bg-neutral-200 cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Retry EWS Brief</span>
        </button>
      </section>
    );
  }

  if (!memo) {
    return (
      <section
        id="section-ews-memo"
        className="rounded-xl border border-[#262626] bg-[#0D0D0D] p-8 text-center space-y-3 ncg-card print:hidden"
      >
        <Activity
          className="mx-auto h-8 w-8 text-neutral-400"
          aria-hidden="true"
        />
        <h3 className="font-display text-sm font-bold text-white">
          AI Post-Sanction Intervention Brief
        </h3>
        <p className="text-xs text-neutral-400 max-w-lg mx-auto leading-relaxed">
          Click &ldquo;Generate AI Early Warning Intervention Brief&rdquo; on the left to produce a 14-day branch manager containment plan, routing diversion audit, and limit-freeze triggers.
        </p>
        {!input.caseCode && (
          <button
            type="button"
            onClick={onLoadDefaultPreset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#262626] bg-[#141414] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#1C1C1C] cursor-pointer"
          >
            <span>Load Sample EWS Case</span>
          </button>
        )}
      </section>
    );
  }

  const levelColor =
    memo.riskPostureAndTrajectory.signalLevel === 'CRITICAL'
      ? 'text-red-400 bg-red-950/35 border-red-500/35'
      : memo.riskPostureAndTrajectory.signalLevel === 'WATCH'
        ? 'text-amber-400 bg-amber-950/35 border-amber-500/35'
        : 'text-[#34D399] bg-emerald-950/35 border-emerald-500/35';

  return (
    <section
      id="section-ews-memo"
      aria-label="Post-Sanction Early Warning Intervention Brief"
      className="rounded-xl border border-[#262626] bg-[#0D0D0D] overflow-hidden ncg-card print:bg-white print:border-slate-300"
    >
      <div className="border-b border-[#262626] bg-[#141414] print:bg-white print:border-slate-200 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold text-neutral-400">
            Northern Banking Credit Intelligence · Post-Sanction Early Warning Brief
          </div>
          <h3 className="font-display text-base font-bold text-white print:text-slate-900">
            Case {input.caseCode} — Containment &amp; Conduct Brief
          </h3>
        </div>

        <div className="flex items-center gap-2.5">
          <span
            className={`rounded-md border px-2.5 py-1 font-mono text-xs font-bold ${levelColor}`}
          >
            {memo.riskPostureAndTrajectory.signalLevel}
          </span>
          <button
            type="button"
            onClick={onPrint}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#262626] bg-[#141414] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1C1C1C] print:hidden cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Print Brief</span>
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5 text-xs text-neutral-300 print:text-slate-700 leading-relaxed">
        {/* 01. Risk Posture & Trajectory */}
        <div className="space-y-2">
          <h4 className="font-display text-xs font-bold text-white print:text-slate-900">
            01. Post-Sanction Risk Posture &amp; Classification Trajectory
          </h4>
          <p>{memo.riskPostureAndTrajectory.summary}</p>
          <p className="rounded-lg border border-[#262626] bg-[#141414] print:bg-slate-50 print:border-slate-200 px-3.5 py-2.5 font-mono text-[11px] text-neutral-100 print:text-slate-900">
            {memo.riskPostureAndTrajectory.classificationCountdownNote}
          </p>
        </div>

        {/* 02. Cash Conduct & Diversion Findings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[#262626] print:border-slate-200 pt-4">
          <div className="space-y-1.5">
            <h4 className="font-display text-xs font-bold text-white print:text-slate-900">
              02. Account Routing &amp; Diversion Audit
            </h4>
            <p>{memo.cashConductAndDiversionFindings.routingBehaviorAnalysis}</p>
          </div>
          <div className="space-y-1.5">
            <h4 className="font-display text-xs font-bold text-white print:text-slate-900">
              03. Limit Utilization &amp; Security Control
            </h4>
            <p>{memo.cashConductAndDiversionFindings.utilizationAndCollateralControl}</p>
          </div>
        </div>

        {/* 04. 14-Day Containment Action Queue */}
        <div className="space-y-2.5 border-t border-[#262626] print:border-slate-200 pt-4">
          <h4 className="font-display text-xs font-bold text-white print:text-slate-900">
            04. 14-Day Branch Containment Actions (Zero-PII Roles)
          </h4>
          <div className="overflow-x-auto rounded-lg border border-[#262626] print:border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#262626] bg-[#141414] text-[11px] font-semibold text-neutral-400 print:bg-slate-50 print:text-slate-600 print:border-slate-200">
                  <th className="py-2 px-3">Action Step</th>
                  <th className="py-2 px-3">Responsible Role</th>
                  <th className="py-2 px-3 text-right">Window</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626] print:divide-slate-200">
                {memo.containmentActions14Day.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#141414]">
                    <td className="py-2.5 px-3 text-neutral-200 print:text-slate-800">{row.action}</td>
                    <td className="py-2.5 px-3 font-semibold text-white print:text-slate-900 whitespace-nowrap">
                      {row.ownerRole}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[11px] text-neutral-400 whitespace-nowrap tabular-nums">
                      {row.deadlineWindow}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 05. Escalation & Limit Freeze Triggers */}
        <div className="space-y-2 border-t border-[#262626] print:border-slate-200 pt-4">
          <h4 className="font-display text-xs font-bold text-white print:text-slate-900 flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-red-400" aria-hidden="true" />
            <span>05. Mandatory Limit Freeze &amp; SAMD Escalation Triggers</span>
          </h4>
          <ul className="space-y-1.5 list-disc pl-5">
            {memo.escalationAndFreezeTriggers.map((trigger, i) => (
              <li key={i}>{trigger}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
