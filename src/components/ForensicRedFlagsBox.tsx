import {
  AlertOctagon,
  AlertTriangle,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import type { CalculatedMetrics } from '../types/credit';

interface ForensicRedFlagsBoxProps {
  metrics: CalculatedMetrics;
  hasInputs: boolean;
}

export function ForensicRedFlagsBox({
  metrics,
  hasInputs,
}: ForensicRedFlagsBoxProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isExpanded, setIsExpanded] = useState(true);

  if (!hasInputs) {
    return null;
  }

  const alerts = metrics.forensicAlerts;

  if (alerts.length === 0) {
    return (
      <section
        id="section-red-flags"
        aria-label="Forensic Red Flags and Triggers"
        className="rounded-xl border border-[#059669]/25 bg-emerald-50/60 p-4 flex items-center justify-between gap-3 ncg-card print-avoid-break print:bg-white print:border-slate-300"
      >
        <div className="flex items-center gap-2.5">
          <ShieldCheck
            className="h-4 w-4 text-[#059669] shrink-0"
            aria-hidden="true"
          />
          <div>
            <h3 className="font-display text-xs font-semibold text-emerald-950">
              Forensic Red Flags &amp; Triggers (0 Active Alerts)
            </h3>
            <p className="text-[11px] text-[#059669] mt-0.5 font-medium">
              Passed BB Quantitative Floor (&ge;30/60), Clean CIB, Bank Truth (&ge;50%), Window-Dressing (&le;2.2x), and Sector Stress ({metrics.stressScenario.label}).
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="section-red-flags"
      role="region"
      aria-label="Forensic Red Flags and Triggers"
      className="rounded-xl border border-[#DC2626]/35 bg-red-50/60 overflow-hidden ncg-card print-avoid-break print:bg-white print:border-slate-300"
    >
      <button
        type="button"
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full border-b border-red-200/80 bg-red-100/60 px-5 py-3 flex flex-wrap items-center justify-between gap-2 text-left transition-colors hover:bg-red-100/80 cursor-pointer print:bg-slate-100"
      >
        <div className="flex items-center gap-2">
          <AlertOctagon
            className="h-4 w-4 text-[#DC2626] shrink-0"
            aria-hidden="true"
          />
          <h3 className="font-display text-sm font-bold text-red-950">
            Forensic Red Flags &amp; Triggers ({alerts.length})
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] font-semibold text-[#DC2626] tabular-nums">
            {metrics.icrrsGrade}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-900 print:hidden">
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
            <div className="divide-y divide-red-200/70">
              {alerts.map((alert) => {
                const isCritical = alert.severity === 'Critical';
                return (
                  <div
                    key={alert.id}
                    className="px-5 py-3 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-start bg-white/60 print:bg-white"
                  >
                    <div className="md:col-span-5 flex items-start gap-2">
                      {isCritical ? (
                        <AlertOctagon
                          className="h-3.5 w-3.5 text-[#DC2626] shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                      ) : (
                        <AlertTriangle
                          className="h-3.5 w-3.5 text-[#D97706] shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                      )}
                      <div>
                        <div
                          className={`font-mono text-[10px] font-bold tracking-wide ${
                            isCritical ? 'text-[#DC2626]' : 'text-[#D97706]'
                          }`}
                        >
                          {alert.code} · {alert.severity.toUpperCase()}
                        </div>
                        <div className="text-xs font-semibold text-[#0B192C] mt-0.5">
                          {alert.title}
                        </div>
                      </div>
                    </div>
                    <p className="md:col-span-7 text-xs leading-relaxed text-slate-800">
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
