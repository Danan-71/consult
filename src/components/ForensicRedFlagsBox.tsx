import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import type { CalculatedMetrics, LoanApplicationInput } from '../types/credit';
import { formatBDT } from '../utils/finance';

interface ForensicRedFlagsBoxProps {
  input: LoanApplicationInput;
  metrics: CalculatedMetrics;
  hasInputs: boolean;
}

export function ForensicRedFlagsBox({
  input,
  metrics,
  hasInputs,
}: ForensicRedFlagsBoxProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isExpanded, setIsExpanded] = useState(true);

  if (!hasInputs) {
    return null;
  }

  const alerts = metrics.forensicAlerts;
  const crimsonCount = alerts.filter((a) => a.tone === 'crimson').length;
  const amberCount = alerts.filter((a) => a.tone === 'amber').length;

  // Strictly anonymized case profile (zero PII / owner names)
  const anonymizedCaseLine = `Anonymized Case · ${input.legalStructure} · ${input.businessCategory} · ${input.districtCity || 'Bangladesh'} · Req: ${formatBDT(input.requestedLoanAmount)}`;

  if (alerts.length === 0) {
    return (
      <section
        id="section-red-flags"
        aria-label="Forensic Red Flags and Early Risk Triggers"
        className="rounded-xl border border-emerald-500/35 bg-emerald-950/20 p-5 space-y-3 ncg-card print-avoid-break print:bg-white print:border-slate-300"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <ShieldCheck
              className="h-5 w-5 text-[#34D399] shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <div className="text-[11px] font-medium text-neutral-400">
                Forensic Red Flags &amp; Early Risk Triggers
              </div>
              <h3 className="font-display text-sm font-bold text-[#34D399]">
                No Critical Forensic Red Flags Triggered
              </h3>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-[#34D399] tabular-nums">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>0 / 6 Alerts Active</span>
          </div>
        </div>

        <p className="font-mono text-[11px] text-neutral-400 tabular-nums">
          {anonymizedCaseLine}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 border-t border-emerald-500/20 pt-3 text-[11px] text-neutral-300 font-mono tabular-nums">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#34D399] shrink-0" aria-hidden="true" />
            <span>ICRRS Floor: {metrics.icrrsBreakdown.quantitativeScore}/60 (&ge;30)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#34D399] shrink-0" aria-hidden="true" />
            <span>Bank Credits: {metrics.bankTurnoverRatioPct.toFixed(1)}% (&ge;50%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#34D399] shrink-0" aria-hidden="true" />
            <span>
              2m Deposit Velocity:{' '}
              {metrics.windowDressingSpikeRatio !== null
                ? `${metrics.windowDressingSpikeRatio.toFixed(2)}x`
                : 'Steady'}{' '}
              (&le;2.20x)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#34D399] shrink-0" aria-hidden="true" />
            <span>Cash Cycle (CCC): {Math.round(metrics.cccDays)}d (&le;75d)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#34D399] shrink-0" aria-hidden="true" />
            <span>Safe Limit Cap: {formatBDT(metrics.recommendedSafeLoanLimitBdt)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#34D399] shrink-0" aria-hidden="true" />
            <span>
              Stressed DSCR:{' '}
              {metrics.stressedPostLoanDscr !== null
                ? `${metrics.stressedPostLoanDscr.toFixed(2)}x`
                : 'N/A'}{' '}
              (&ge;1.10x)
            </span>
          </div>
        </div>
      </section>
    );
  }

  const hasCrimson = crimsonCount > 0;

  return (
    <section
      id="section-red-flags"
      role="region"
      aria-label="Forensic Red Flags and Early Risk Triggers"
      className={`rounded-xl border overflow-hidden ncg-card print-avoid-break bg-[#0D0D0D] print:bg-white print:border-slate-300 ${
        hasCrimson
          ? 'border-red-500/35'
          : 'border-amber-500/35'
      }`}
    >
      <button
        type="button"
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded((prev) => !prev)}
        className={`w-full border-b px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 text-left transition-colors cursor-pointer print:bg-slate-100 ${
          hasCrimson
            ? 'border-red-500/25 bg-red-950/35 hover:bg-red-950/45'
            : 'border-amber-500/25 bg-amber-950/30 hover:bg-amber-950/40'
        }`}
      >
        <div className="flex items-start gap-2.5">
          {hasCrimson ? (
            <AlertOctagon
              className="h-4.5 w-4.5 text-red-400 shrink-0 mt-0.5"
              aria-hidden="true"
            />
          ) : (
            <AlertTriangle
              className="h-4.5 w-4.5 text-amber-400 shrink-0 mt-0.5"
              aria-hidden="true"
            />
          )}
          <div>
            <h3 className="font-display text-sm font-bold text-white print:text-slate-900">
              Forensic Red Flags &amp; Early Risk Triggers ({alerts.length} Active)
            </h3>
            <p className="font-mono text-[11px] text-neutral-400 mt-0.5 tabular-nums">
              {anonymizedCaseLine}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span
            className={`font-mono text-[11px] font-semibold tabular-nums ${
              hasCrimson ? 'text-red-400' : 'text-amber-400'
            }`}
          >
            {crimsonCount > 0 ? `${crimsonCount} Crimson` : ''}
            {crimsonCount > 0 && amberCount > 0 ? ' · ' : ''}
            {amberCount > 0 ? `${amberCount} Amber` : ''}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-200 print:hidden">
            <span>{isExpanded ? 'Collapse' : 'Inspect'}</span>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : 'rotate-0'
              }`}
              aria-hidden="true"
            />
          </span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="forensic-alerts-body"
            initial={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0.12 : 0.25,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="overflow-hidden print:!block print:!h-auto print:!opacity-100"
          >
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 bg-[#0D0D0D] print:bg-white">
              {alerts.map((alert) => {
                const isCrimson = alert.tone === 'crimson';
                return (
                  <div
                    key={alert.id}
                    className={`rounded-lg border p-3.5 space-y-1.5 print:bg-white ${
                      isCrimson
                        ? 'border-red-500/35 bg-red-950/20'
                        : 'border-amber-500/35 bg-amber-950/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
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
                          className={`font-mono text-[10px] font-semibold tracking-wide ${
                            isCrimson ? 'text-red-400' : 'text-amber-400'
                          }`}
                        >
                          {isCrimson ? 'Crimson Alert' : 'Amber Alert'} · {alert.code}
                        </span>
                      </div>
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

                    <p className="text-[11px] leading-relaxed text-neutral-300 print:text-slate-700">
                      {alert.detail}
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
