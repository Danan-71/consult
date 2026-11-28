import {
  AlertCircle,
  AlertTriangle,
  Building2,
  CheckCircle2,
  FileText,
  Gavel,
  Handshake,
  Printer,
  ShieldAlert,
} from 'lucide-react';
import type {
  RecommendedRecoveryTrack,
  RecoveryCaseInput,
  RecoveryMemo,
} from '../types/credit';
import { formatBDT } from '../utils/finance';

interface RecoveryMemoReportProps {
  input: RecoveryCaseInput;
  memo: RecoveryMemo | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onPrint: () => void;
  onLoadDefaultPreset: () => void;
}

function getTrackStyle(track: RecommendedRecoveryTrack) {
  switch (track) {
    case 'Structured Repayment Proposal':
      return {
        box: 'border-emerald-500/35 bg-emerald-950/25 print:border-[#059669]/30 print:bg-white',
        title: 'text-white print:text-[#0B192C]',
        label: 'text-[#34D399] print:text-[#059669]',
        Icon: CheckCircle2,
      };
    case 'Negotiated Exit / Settlement':
      return {
        box: 'border-amber-500/35 bg-amber-950/25 print:border-[#D97706]/35 print:bg-white',
        title: 'text-white print:text-[#0B192C]',
        label: 'text-amber-400 print:text-[#D97706]',
        Icon: Handshake,
      };
    case 'Legal / Enforcement Escalation':
      return {
        box: 'border-red-500/40 bg-red-950/25 print:border-[#DC2626]/35 print:bg-white',
        title: 'text-white print:text-[#0B192C]',
        label: 'text-red-400 print:text-[#DC2626]',
        Icon: Gavel,
      };
  }
}

export function RecoveryMemoReport({
  input,
  memo,
  isLoading,
  error,
  onRetry,
  onPrint,
  onLoadDefaultPreset,
}: RecoveryMemoReportProps) {
  if (isLoading) {
    return (
      <section
        id="section-recovery-memo"
        aria-busy="true"
        className="rounded-xl border border-[#262626] bg-[#0D0D0D] ncg-card p-6 space-y-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#262626] pb-4">
          <div className="space-y-2">
            <div className="text-xs font-semibold text-white">
              Synthesizing Head Office Recovery &amp; Resolution Brief...
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
        id="section-recovery-memo"
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
              NBCI Recovery &amp; Resolution Memo Generation Failed
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
            Retry Recovery Memo Analysis
          </button>
        </div>
      </section>
    );
  }

  if (!memo) {
    return (
      <section
        id="section-recovery-memo"
        className="rounded-xl border border-[#262626] bg-[#0D0D0D] ncg-card p-8 text-center space-y-4"
      >
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg border border-[#262626] bg-[#141414] text-white">
          <FileText className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="mx-auto max-w-lg space-y-1.5">
          <h3 className="font-display text-base font-semibold text-white">
            Northern Banking Credit Intelligence — Head Office Recovery &amp; Resolution Memo
          </h3>
          <p className="text-sm leading-relaxed text-neutral-400">
            Load one of the 3 anonymized recovery presets above or enter the overdue
            account details on the left, then click{' '}
            <span className="font-semibold text-white">
              Generate Recovery &amp; Resolution Memo
            </span>{' '}
            to produce a 5-section branch action &amp; Head Office escalation brief.
          </p>
        </div>
        <div>
          <button
            type="button"
            onClick={onLoadDefaultPreset}
            className="inline-flex items-center gap-2 rounded-lg border border-[#262626] bg-[#141414] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1C1C1C] cursor-pointer transition-colors"
          >
            Load Sample Stressed Textile Case (SS)
          </button>
        </div>
      </section>
    );
  }

  const trackStyle = getTrackStyle(memo.recommendedRecoveryTrack.track);
  const TrackIcon = trackStyle.Icon;

  return (
    <article
      id="section-recovery-memo"
      className="rounded-xl border border-[#262626] bg-[#0D0D0D] ncg-card overflow-hidden print:border-slate-300 print:bg-white"
    >
      {/* Memo Header */}
      <div className="border-b border-[#262626] bg-[#141414] print:border-slate-200 print:bg-slate-50 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-semibold text-white print:text-slate-900">
            NBCI Recovery &amp; Resolution Brief — {input.caseReference}
          </h2>
          <p className="text-xs text-neutral-400 print:text-slate-500 mt-0.5">
            {input.classificationStage} · Outstanding:{' '}
            <span className="font-mono tabular-nums">
              {formatBDT(input.totalOutstandingAmount)}
            </span>{' '}
            · Generated{' '}
            {new Date(memo.generatedAtIso).toLocaleString('en-GB', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </p>
        </div>

        <button
          type="button"
          onClick={onPrint}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-semibold text-black hover:bg-neutral-200 transition-colors print:hidden whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Printer className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Print / Export Recovery Brief (PDF)</span>
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Section 3 Highlighted at Top: Recommended Recovery Track + Mandatory Policy Notice */}
        <section
          className={`rounded-xl border p-5 space-y-3 print-avoid-break ${trackStyle.box}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <TrackIcon
                className={`h-5 w-5 shrink-0 ${trackStyle.label}`}
                aria-hidden="true"
              />
              <div>
                <div className={`text-[11px] font-semibold uppercase tracking-wide ${trackStyle.label}`}>
                  03. Recommended Recovery Track
                </div>
                <h3 className={`font-display text-lg font-bold ${trackStyle.title}`}>
                  {memo.recommendedRecoveryTrack.track}
                </h3>
              </div>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-neutral-200 print:text-slate-800">
            {memo.recommendedRecoveryTrack.rationaleAndProposedTerms}
          </p>

          <div className="flex items-start gap-2 rounded-lg border border-[#262626] bg-[#141414] print:border-slate-200 print:bg-white px-3.5 py-2.5 text-xs text-neutral-200 print:text-slate-800">
            <Building2
              className="h-4 w-4 shrink-0 text-white print:text-[#0B192C] mt-0.5"
              aria-hidden="true"
            />
            <div>
              <span className="font-semibold text-white print:text-[#0B192C]">
                Governance &amp; Regulatory Approval Notice:{' '}
              </span>
              <span>{memo.recommendedRecoveryTrack.headOfficeApprovalNotice}</span>
            </div>
          </div>
        </section>

        {/* Section 1: Root Cause of Default */}
        <section className="space-y-2.5 print-avoid-break">
          <h3 className="font-display text-sm font-semibold text-white print:text-slate-900 border-b border-[#262626] print:border-slate-200 pb-1.5">
            01. Root Cause of Default &amp; Borrower Conduct
          </h3>
          <p className="text-xs leading-relaxed text-neutral-300 print:text-slate-700">
            {memo.rootCauseOfDefault.summary}
          </p>

          <ul className="space-y-1.5 pl-1">
            {memo.rootCauseOfDefault.primaryDrivers.map((driver, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-xs text-neutral-300 print:text-slate-700"
              >
                <span className="font-mono text-neutral-500 print:text-slate-400 tabular-nums mt-0.5">
                  {String(idx + 1).padStart(2, '0')}.
                </span>
                <span>{driver}</span>
              </li>
            ))}
          </ul>

          <div className="rounded-lg border border-[#262626] bg-[#141414] print:border-slate-200 print:bg-slate-50 p-3 text-xs leading-relaxed text-neutral-300 print:text-slate-700">
            <span className="font-semibold text-white print:text-slate-900">
              Diversion &amp; Conduct Review:{' '}
            </span>
            {memo.rootCauseOfDefault.diversionAndConductAssessment}
          </div>
        </section>

        {/* Section 2: Cash & Asset Recovery Realism */}
        <section className="space-y-2.5 print-avoid-break">
          <h3 className="font-display text-sm font-semibold text-white print:text-slate-900 border-b border-[#262626] print:border-slate-200 pb-1.5">
            02. Cash &amp; Asset Recovery Realism
          </h3>
          <p className="text-xs leading-relaxed text-neutral-300 print:text-slate-700">
            {memo.cashAndAssetRecoveryRealism.summary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-lg border border-[#262626] bg-[#141414] print:border-slate-200 print:bg-slate-50 p-3.5 space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400 print:text-slate-500">
                Operating Cash Capacity Reality
              </div>
              <p className="text-xs leading-relaxed text-neutral-300 print:text-slate-700">
                {memo.cashAndAssetRecoveryRealism.cashCapacityAnalysis}
              </p>
            </div>
            <div className="rounded-lg border border-[#262626] bg-[#141414] print:border-slate-200 print:bg-slate-50 p-3.5 space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400 print:text-slate-500">
                Collateral Liquidation &amp; Guarantor Enforceability
              </div>
              <p className="text-xs leading-relaxed text-neutral-300 print:text-slate-700">
                {memo.cashAndAssetRecoveryRealism.collateralAndGuarantorReality}
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: 30 / 60 / 90-Day Branch Action Steps */}
        <section className="space-y-3 print-avoid-break">
          <h3 className="font-display text-sm font-semibold text-white print:text-slate-900 border-b border-[#262626] print:border-slate-200 pb-1.5">
            04. 30 / 60 / 90-Day Branch Action Steps
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                windowLabel: 'Days 01–30',
                subtitle: 'Immediate Containment & Audit',
                items: memo.actionPlan30_60_90.days30,
              },
              {
                windowLabel: 'Days 31–60',
                subtitle: 'Head Office & Down-Payment Gate',
                items: memo.actionPlan30_60_90.days60,
              },
              {
                windowLabel: 'Days 61–90',
                subtitle: 'Execution or Legal Escalation',
                items: memo.actionPlan30_60_90.days90,
              },
            ].map((horizon) => (
              <div
                key={horizon.windowLabel}
                className="rounded-lg border border-[#262626] bg-[#141414] print:border-slate-200 print:bg-slate-50 p-3.5 space-y-2"
              >
                <div className="border-b border-[#262626] print:border-slate-200 pb-1.5">
                  <div className="font-mono text-xs font-bold text-white print:text-slate-900">
                    {horizon.windowLabel}
                  </div>
                  <div className="text-[11px] text-neutral-400 print:text-slate-500">
                    {horizon.subtitle}
                  </div>
                </div>
                <ul className="space-y-1.5">
                  {horizon.items.map((step, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-1.5 text-xs text-neutral-300 print:text-slate-700 leading-relaxed"
                    >
                      <span className="font-mono text-[11px] text-neutral-500 print:text-slate-400 mt-0.5">
                        •
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Section 5: Key Risks & Escalation Triggers for Head Office */}
        <section className="space-y-3 print-avoid-break">
          <div className="flex items-center justify-between border-b border-[#262626] print:border-slate-200 pb-1.5">
            <h3 className="font-display text-sm font-semibold text-white print:text-slate-900">
              05. Key Risks &amp; Escalation Triggers for Head Office
            </h3>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400 print:text-slate-600">
              <ShieldAlert
                className="h-3.5 w-3.5 text-amber-400 print:text-[#D97706]"
                aria-hidden="true"
              />
              <span>SAMD &amp; Legal Escalation Thresholds</span>
            </span>
          </div>

          <div className="divide-y divide-[#262626] rounded-lg border border-[#262626] print:divide-slate-200 print:border-slate-200">
            {memo.headOfficeRisksAndTriggers.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4"
              >
                <div className="md:col-span-5 flex items-baseline gap-2">
                  <AlertTriangle
                    className="h-3.5 w-3.5 text-amber-400 print:text-[#D97706] shrink-0 self-center"
                    aria-hidden="true"
                  />
                  <span className="text-xs font-semibold text-white print:text-slate-900">
                    {item.riskTitle}
                  </span>
                </div>
                <p className="md:col-span-7 text-xs leading-relaxed text-neutral-300 print:text-slate-700">
                  {item.escalationTrigger}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Print-only NBCI Sign-Off Block */}
        <footer className="hidden print:grid grid-cols-2 gap-12 pt-10 mt-8 border-t border-slate-300 text-xs text-slate-700 print-avoid-break">
          <div className="space-y-8">
            <div className="border-b border-slate-400 pb-1">
              Prepared By (Branch Recovery Officer / Manager)
            </div>
            <div>Name, Designation, Branch Seal &amp; Date:</div>
          </div>
          <div className="space-y-8">
            <div className="border-b border-slate-400 pb-1">
              Reviewed By (Head Office SAMD / Regional Credit Head)
            </div>
            <div>Name, Approval Authority &amp; Date:</div>
          </div>
        </footer>
      </div>
    </article>
  );
}
