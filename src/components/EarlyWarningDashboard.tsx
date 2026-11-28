import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import type { EarlyWarningInput, EarlyWarningMetrics } from '../types/credit';
import { formatBDT } from '../utils/finance';

interface EarlyWarningDashboardProps {
  input: EarlyWarningInput;
  metrics: EarlyWarningMetrics;
  hasInputs: boolean;
}

export function EarlyWarningDashboard({
  input,
  metrics,
  hasInputs,
}: EarlyWarningDashboardProps) {
  if (!hasInputs) {
    return (
      <section
        id="section-ews-metrics"
        className="rounded-xl border border-[#262626] bg-[#0D0D0D] p-8 text-center ncg-card"
      >
        <Activity
          className="mx-auto h-8 w-8 text-neutral-400"
          aria-hidden="true"
        />
        <h3 className="mt-3 font-display text-sm font-bold text-white">
          Post-Sanction Early Warning Monitor Ready
        </h3>
        <p className="mt-1 text-xs text-neutral-400 max-w-md mx-auto">
          Enter an anonymized sanctioned account ID and current cash routing / DPD telemetry on the left, or load an EWS preset above.
        </p>
      </section>
    );
  }

  const signalStyles =
    metrics.signalLevel === 'CRITICAL'
      ? {
          border: 'border-red-500/35',
          bg: 'bg-red-950/25',
          text: 'text-red-400',
          label: 'CRITICAL — Immediate Containment Required',
        }
      : metrics.signalLevel === 'WATCH'
        ? {
            border: 'border-amber-500/35',
            bg: 'bg-amber-950/25',
            text: 'text-amber-400',
            label: 'WATCH — Early Deterioration Signals',
          }
        : {
            border: 'border-emerald-500/35',
            bg: 'bg-emerald-950/25',
            text: 'text-[#34D399]',
            label: 'NORMAL — Satisfactory Post-Sanction Conduct',
          };

  return (
    <div className="space-y-6">
      {/* Signal Posture + 4 Deterministic Telemetry Tiles */}
      <section
        id="section-ews-metrics"
        aria-label="Early Warning Signal Scorecard"
        className="rounded-xl border border-[#262626] bg-[#0D0D0D] p-5 space-y-4 ncg-card print:bg-white print:border-slate-300"
      >
        <div
          className={`rounded-xl border ${signalStyles.border} ${signalStyles.bg} p-4 flex flex-wrap items-center justify-between gap-4 print:bg-white`}
        >
          <div>
            <div className="font-mono text-[11px] text-neutral-400">
              {input.caseCode || 'UNSPECIFIED CASE'} · {input.facilityType}
            </div>
            <h3 className={`mt-0.5 font-display text-base font-bold ${signalStyles.text}`}>
              {signalStyles.label}
            </h3>
          </div>

          <div className="text-right">
            <div className="text-[11px] font-medium text-neutral-400">
              EWS Distress Score
            </div>
            <div className={`font-mono text-2xl font-bold tabular-nums ${signalStyles.text}`}>
              {metrics.ewsRiskScore} / 100
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-lg border border-[#262626] bg-[#141414] p-3.5 print:bg-white print:border-slate-200">
            <div className="text-[11px] font-medium text-neutral-400">
              Branch Cash Routing
            </div>
            <div
              className={`mt-1 font-mono text-lg font-bold tabular-nums ${
                metrics.routingLeakageAlert ? 'text-red-400' : 'text-[#34D399]'
              }`}
            >
              {metrics.routingCompliancePct.toFixed(1)}%
            </div>
            <div className="mt-0.5 font-mono text-[10.5px] text-neutral-400 tabular-nums">
              {formatBDT(input.currentMonthlyBankRoutingBdt)} / mo
            </div>
          </div>

          <div className="rounded-lg border border-[#262626] bg-[#141414] p-3.5 print:bg-white print:border-slate-200">
            <div className="text-[11px] font-medium text-neutral-400">
              Days Past Due (DPD)
            </div>
            <div
              className={`mt-1 font-mono text-lg font-bold tabular-nums ${
                metrics.dpdAlertSeverity === 'critical'
                  ? 'text-red-400'
                  : metrics.dpdAlertSeverity === 'watch'
                    ? 'text-amber-400'
                    : 'text-[#34D399]'
              }`}
            >
              {input.daysPastDue} days
            </div>
            <div className="mt-0.5 font-mono text-[10.5px] text-neutral-400 tabular-nums">
              {metrics.daysBeforeSubStandard}d buffer to 90d SS
            </div>
          </div>

          <div className="rounded-lg border border-[#262626] bg-[#141414] p-3.5 print:bg-white print:border-slate-200">
            <div className="text-[11px] font-medium text-neutral-400">
              Limit Utilization
            </div>
            <div
              className={`mt-1 font-mono text-lg font-bold tabular-nums ${
                metrics.overUtilizedAlert ? 'text-amber-400' : 'text-white print:text-slate-900'
              }`}
            >
              {metrics.utilizationPct.toFixed(1)}%
            </div>
            <div className="mt-0.5 font-mono text-[10.5px] text-neutral-400 tabular-nums">
              O/S {formatBDT(input.currentOutstandingBdt)}
            </div>
          </div>

          <div className="rounded-lg border border-[#262626] bg-[#141414] p-3.5 print:bg-white print:border-slate-200">
            <div className="text-[11px] font-medium text-neutral-400">
              Verified Stock Cover
            </div>
            <div
              className={`mt-1 font-mono text-lg font-bold tabular-nums ${
                metrics.stockErosionAlert ? 'text-red-400' : 'text-[#34D399]'
              }`}
            >
              {metrics.stockCoveragePct.toFixed(1)}%
            </div>
            <div className="mt-0.5 font-mono text-[10.5px] text-neutral-400 tabular-nums">
              {formatBDT(input.verifiedStockCoverBdt)} verified
            </div>
          </div>
        </div>
      </section>

      {/* Triggered Post-Sanction Early Warning Signals */}
      <section
        id="section-ews-triggers"
        aria-label="Triggered Post-Sanction Early Warning Signals"
        className="rounded-xl border border-[#262626] bg-[#0D0D0D] p-5 space-y-3 ncg-card print:bg-white print:border-slate-300"
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-sm font-bold text-white print:text-slate-900">
            Automated Post-Sanction Early Warning Triggers ({metrics.alerts.length} Active)
          </h3>
          <span className="font-mono text-[11px] text-neutral-400 tabular-nums">
            {metrics.covenantBreachCount} covenant breach{metrics.covenantBreachCount === 1 ? '' : 'es'}
          </span>
        </div>

        {metrics.alerts.length === 0 ? (
          <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/35 bg-emerald-950/25 px-4 py-3 text-xs font-semibold text-[#34D399]">
            <ShieldCheck className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
            <span>
              No Early Warning Triggers Active — Routing, DPD, Limit Utilization, and Stock Cover are all within policy.
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {metrics.alerts.map((alert) => {
              const isCrimson = alert.tone === 'crimson';
              return (
                <div
                  key={alert.id}
                  className={`rounded-lg border p-3.5 space-y-1 print:bg-white ${
                    isCrimson
                      ? 'border-red-500/35 bg-red-950/20'
                      : 'border-amber-500/35 bg-amber-950/20'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {isCrimson ? (
                      <AlertOctagon
                        className="h-3.5 w-3.5 text-red-400 shrink-0"
                        aria-hidden="true"
                      />
                    ) : (
                      <AlertTriangle
                        className="h-3.5 w-3.5 text-amber-400 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                    <span
                      className={`font-mono text-[10px] font-semibold ${
                        isCrimson ? 'text-red-400' : 'text-amber-400'
                      }`}
                    >
                      {isCrimson ? 'Crimson EWS' : 'Amber EWS'} · {alert.code}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white print:text-slate-900">
                    {alert.title}
                  </div>
                  <div
                    className={`font-mono text-[11px] font-semibold tabular-nums ${
                      isCrimson ? 'text-red-400' : 'text-amber-400'
                    }`}
                  >
                    {alert.metricSummary}
                  </div>
                  <p className="text-[11px] text-neutral-300 print:text-slate-700 leading-relaxed">
                    {alert.detail}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 border-t border-[#262626] pt-3 text-[11px] text-neutral-400">
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#34D399]" aria-hidden="true" />
            <span>Zero-PII Case Tracking</span>
          </span>
          <span className="font-mono tabular-nums">
            Installment Due: {formatBDT(input.monthlyInstallmentDueBdt)}/mo
          </span>
          <span className="font-mono tabular-nums">
            Sanctioned Limit: {formatBDT(input.sanctionedLimitBdt)}
          </span>
        </div>
      </section>
    </div>
  );
}
