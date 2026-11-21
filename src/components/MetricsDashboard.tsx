import {
  AlertOctagon,
  AlertTriangle,
  Calculator,
  CheckCircle2,
  Scale,
  ShieldAlert,
  TrendingDown,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import type {
  CalculatedMetrics,
  IcrrsGrade,
  LoanApplicationInput,
} from '../types/credit';
import {
  formatBDT,
  formatBDTScaleHint,
  formatDscr,
  formatPct,
} from '../utils/finance';

interface MetricsDashboardProps {
  input: LoanApplicationInput;
  metrics: CalculatedMetrics;
  hasInputs: boolean;
}

function getGradeStyle(grade: IcrrsGrade) {
  switch (grade) {
    case 'Excellent (80+)':
      return {
        box: 'border-[#059669]/30 bg-emerald-50/50',
        scoreText: 'text-[#059669]',
        labelText: 'text-emerald-900',
        ringStroke: '#059669',
        ringTrack: '#D1FAE5',
      };
    case 'Good (70–79)':
      return {
        box: 'border-[#059669]/25 bg-white',
        scoreText: 'text-[#059669]',
        labelText: 'text-emerald-900',
        ringStroke: '#059669',
        ringTrack: '#D1FAE5',
      };
    case 'Marginal (60–69)':
      return {
        box: 'border-[#D97706]/35 bg-amber-50/55',
        scoreText: 'text-[#D97706]',
        labelText: 'text-amber-900',
        ringStroke: '#D97706',
        ringTrack: '#FEF3C7',
      };
    case 'Unacceptable (<60)':
    case 'UNACCEPTABLE (Auto-Downgraded)':
      return {
        box: 'border-[#DC2626]/35 bg-red-50/60',
        scoreText: 'text-[#DC2626]',
        labelText: 'text-red-900',
        ringStroke: '#DC2626',
        ringTrack: '#FEE2E2',
      };
  }
}

function getDscrStatus(dscr: number | null): {
  label: string;
  toneClass: string;
  icon: 'ok' | 'warn' | 'risk';
} {
  if (dscr === null) {
    return { label: 'No debt service', toneClass: 'text-slate-600', icon: 'ok' };
  }
  if (dscr >= 1.5) {
    return { label: 'Strong >= 1.50x', toneClass: 'text-[#059669]', icon: 'ok' };
  }
  if (dscr >= 1.25) {
    return { label: 'Bankable >= 1.25x', toneClass: 'text-[#059669]', icon: 'ok' };
  }
  if (dscr >= 1.0) {
    return { label: 'Tight 1.00x–1.24x', toneClass: 'text-[#D97706]', icon: 'warn' };
  }
  return { label: 'Deficit < 1.00x', toneClass: 'text-[#DC2626]', icon: 'risk' };
}

function StatusIndicator({
  icon,
  label,
  toneClass,
}: {
  icon: 'ok' | 'warn' | 'risk';
  label: string;
  toneClass: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${toneClass}`}>
      {icon === 'ok' && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
      {icon === 'warn' && <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
      {icon === 'risk' && <ShieldAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
      <span>{label}</span>
    </span>
  );
}

function IcrrsCircularGauge({
  score,
  ringStroke,
  ringTrack,
  scoreText,
}: {
  score: number;
  ringStroke: string;
  ringTrack: string;
  scoreText: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const clamped = Math.min(100, Math.max(0, score));
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
      <svg
        width="96"
        height="96"
        viewBox="0 0 96 96"
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke={ringTrack}
          strokeWidth="7"
        />
        <motion.circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke={ringStroke}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: targetOffset }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.65,
            ease: [0.16, 1, 0.3, 1],
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className={`font-mono text-xl font-bold leading-none tabular-nums ${scoreText}`}>
          {clamped}
        </span>
        <span className="font-mono text-[10px] font-medium text-slate-500 mt-0.5 tabular-nums">
          / 100
        </span>
      </div>
    </div>
  );
}

function StressedDscrLinearGauge({
  stressedDscr,
  minFloor = 1.25,
}: {
  stressedDscr: number | null;
  minFloor?: number;
}) {
  const prefersReducedMotion = useReducedMotion();
  const maxScale = 2.5;
  const effective = stressedDscr === null ? maxScale : Math.max(0, stressedDscr);
  const ratioPct = Math.min(100, (effective / maxScale) * 100);
  const floorPct = Math.min(100, (minFloor / maxScale) * 100);

  const fillColor =
    stressedDscr === null || stressedDscr >= minFloor
      ? '#059669'
      : stressedDscr >= 1.0
        ? '#D97706'
        : '#DC2626';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-medium text-slate-600">
          Stressed DSCR vs. {minFloor.toFixed(2)}x Safe Floor
        </span>
        <span className="font-mono font-semibold tabular-nums text-[#0B192C]">
          {formatDscr(stressedDscr)}
        </span>
      </div>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-200/80">
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: ratioPct / 100 }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.55,
            ease: [0.16, 1, 0.3, 1],
          }}
          style={{ transformOrigin: 'left center', backgroundColor: fillColor }}
          className="h-full w-full rounded-full"
        />
        {/* 1.25x Floor Benchmark Marker */}
        <div
          aria-hidden="true"
          style={{ left: `${floorPct}%` }}
          className="absolute inset-y-0 w-0.5 bg-[#0B192C]"
        />
      </div>
      <div className="flex justify-between font-mono text-[10px] text-slate-400 tabular-nums">
        <span>0.00x</span>
        <span className="text-[#0B192C] font-semibold">
          {minFloor.toFixed(2)}x Floor
        </span>
        <span>2.50x+</span>
      </div>
    </div>
  );
}

export function MetricsDashboard({
  input,
  metrics,
  hasInputs,
}: MetricsDashboardProps) {
  if (!hasInputs) {
    return (
      <section
        id="section-icrrs"
        className="rounded-xl border border-[#E2E8F0] bg-white p-6 ncg-card"
      >
        <h2 className="font-display text-base font-semibold text-[#0B192C]">
          NCG Quantitative ICRRS Engine (60% Quant / 40% Qual)
        </h2>
        <p className="mt-1.5 text-sm text-slate-600">
          Choose one of the 5 sector sample presets above—or fill the 6-Tab Underwriting
          Wizard on the left—to calculate the Bangladesh Bank ICRRS score (0–100), Bank
          Statement Truth Check, Cash Conversion Cycle, Base vs. Stressed DSCR, and FSV
          collateral coverage.
        </p>
      </section>
    );
  }

  const gradeStyle = getGradeStyle(metrics.icrrsGrade);
  const postDscrStatus = getDscrStatus(metrics.postLoanDscr);
  const stressSurvives = metrics.stressCoversEmi;
  const loanScale = formatBDTScaleHint(input.requestedLoanAmount);

  const b = metrics.icrrsBreakdown;

  return (
    <section id="section-icrrs" className="space-y-4">
      {/* Header strip */}
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="font-display text-base font-semibold text-[#0B192C]">
            Quantitative Risk Dashboard &amp; ICRRS Rating
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {input.businessName || 'Applicant'} · {input.legalStructure} ·{' '}
            {input.businessCategory} · CIB: {input.cibStatus}
          </p>
        </div>
        <div className="font-mono text-xs font-medium text-[#0B192C] tabular-nums">
          {input.facilityType}: {formatBDT(input.requestedLoanAmount)}
          {loanScale ? ` (${loanScale})` : ''}
        </div>
      </div>

      {/* ICRRS 60/40 Composite Scorecard with Animated SVG Circular Gauge */}
      <div
        className={`rounded-xl border p-5 ncg-card print-avoid-break print:bg-white print:border-slate-300 ${gradeStyle.box}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <IcrrsCircularGauge
              score={metrics.icrrsScore}
              ringStroke={gradeStyle.ringStroke}
              ringTrack={gradeStyle.ringTrack}
              scoreText={gradeStyle.scoreText}
            />

            <div className="space-y-1">
              <div className="text-xs font-medium text-slate-600">
                Bangladesh Bank ICRRS Score (60% Quantitative + 40% Qualitative)
              </div>
              <div className={`font-display text-base sm:text-lg font-bold ${gradeStyle.labelText}`}>
                {metrics.icrrsGrade}
              </div>
              <div className="font-mono text-xs text-slate-700 tabular-nums">
                Quant: {b.quantitativeScore}/60 ({b.quantitativePct.toFixed(0)}%) · Qual:{' '}
                {b.qualitativeScore}/40 ({b.qualitativePct.toFixed(0)}%)
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 space-y-0.5 text-left sm:text-right font-mono tabular-nums">
            <div className="font-sans text-slate-600 font-medium">
              80+ Excellent · 70–79 Good · 60–69 Marginal · &lt;60 Unacceptable
            </div>
            <div className="font-sans text-slate-500">
              Auto-Downgrade: Quant &lt;30/60 or CIB Classified
            </div>
          </div>
        </div>

        {b.autoDowngradeReason && (
          <div className="mt-3.5 flex items-center gap-2 rounded-lg border border-[#DC2626]/35 bg-red-100/80 px-3 py-2 text-xs font-semibold text-red-950">
            <AlertOctagon className="h-4 w-4 text-[#DC2626] shrink-0" aria-hidden="true" />
            <span>
              UNACCEPTABLE (Auto-Downgraded): {b.autoDowngradeReason}.
            </span>
          </div>
        )}

        {/* 60% Quantitative vs 40% Qualitative Sub-Score Breakdown */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-200/80 pt-3.5">
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-[#0B192C]">
              Quantitative Pillar ({b.quantitativeScore}/60)
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-600">DSCR &amp; Stress</span>
                <span className="font-mono font-semibold tabular-nums">{b.dscrAndStressPts}/25</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Bank Turnover</span>
                <span className="font-mono font-semibold tabular-nums">{b.bankTurnoverPts}/15</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Loan / Equity</span>
                <span className="font-mono font-semibold tabular-nums">{b.leveragePts}/10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Cash Cycle (CCC)</span>
                <span className="font-mono font-semibold tabular-nums">{b.cashCyclePts}/10</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-[#0B192C]">
              Qualitative Pillar ({b.qualitativeScore}/40)
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-600">CIB &amp; Integrity</span>
                <span className="font-mono font-semibold tabular-nums">{b.cibIntegrityPts}/15</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Mgmt &amp; KYC</span>
                <span className="font-mono font-semibold tabular-nums">{b.managementCompliancePts}/10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Sector &amp; Pricing</span>
                <span className="font-mono font-semibold tabular-nums">{b.sectorInflationPts}/7</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Collateral Liquidity</span>
                <span className="font-mono font-semibold tabular-nums">{b.collateralLiquidityPts}/8</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6 Core Banking Metric Cards */}
      <div id="section-metrics" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {/* 1. Bank Statement Truth & Window-Dressing Check */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 ncg-card-interactive flex flex-col justify-between gap-2">
          <div className="text-xs font-medium text-slate-500">
            Bank Statement Truth &amp; Velocity
          </div>
          <div
            className={`font-mono text-2xl font-semibold tabular-nums ${
              metrics.bankTruthRedAlert || metrics.windowDressingAlert
                ? 'text-[#DC2626]'
                : 'text-[#0B192C]'
            }`}
          >
            {formatPct(metrics.bankTurnoverRatioPct)}
          </div>
          <div className="border-t border-slate-100 pt-2 space-y-1">
            <StatusIndicator
              icon={
                metrics.windowDressingAlert || metrics.bankTruthRedAlert
                  ? 'risk'
                  : metrics.bankTurnoverRatioPct >= 75
                  ? 'ok'
                  : 'warn'
              }
              label={
                metrics.windowDressingAlert
                  ? 'WINDOW DRESSING ALERT (>2.2x)'
                  : metrics.bankTruthRedAlert
                  ? 'RED ALERT: < 50% Verified'
                  : metrics.bankTurnoverRatioPct >= 75
                  ? 'Strong Deposit Match'
                  : 'Partial Off-Book Cash'
              }
              toneClass={
                metrics.windowDressingAlert || metrics.bankTruthRedAlert
                  ? 'text-[#DC2626]'
                  : metrics.bankTurnoverRatioPct >= 75
                  ? 'text-[#059669]'
                  : 'text-[#D97706]'
              }
            />
            <div className="font-mono text-[11px] text-slate-500 tabular-nums">
              Bank Avg: {formatBDT(metrics.avgMonthlyBankDeposit)}/mo
              {metrics.windowDressingSpikeRatio !== null
                ? ` · 2m Spike: ${
                    metrics.windowDressingSpikeRatio >= 90
                      ? '>10x'
                      : `${metrics.windowDressingSpikeRatio.toFixed(2)}x`
                  }`
                : ''}
            </div>
          </div>
        </div>

        {/* 2. Cash Conversion Cycle (CCC) */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 ncg-card-interactive flex flex-col justify-between gap-2">
          <div className="text-xs font-medium text-slate-500">
            Cash Conversion Cycle (CCC)
          </div>
          <div
            className={`font-mono text-2xl font-semibold tabular-nums ${
              metrics.cccWarning ? 'text-[#D97706]' : 'text-[#0B192C]'
            }`}
          >
            {Math.round(metrics.cccDays)} Days
          </div>
          <div className="border-t border-slate-100 pt-2 space-y-1">
            <StatusIndicator
              icon={metrics.cccWarning ? 'warn' : 'ok'}
              label={
                metrics.cccWarning
                  ? 'Cash Lockup > 75 Days'
                  : 'Liquid Working Cycle'
              }
              toneClass={metrics.cccWarning ? 'text-[#D97706]' : 'text-[#059669]'}
            />
            <div className="font-mono text-[11px] text-slate-500 tabular-nums">
              Inv {Math.round(metrics.inventoryDays)}d + Rec {input.receivableDays}d − Pay{' '}
              {input.payableDays}d
            </div>
          </div>
        </div>

        {/* 3. Base DSCR & Equity Leverage */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 ncg-card-interactive flex flex-col justify-between gap-2">
          <div className="text-xs font-medium text-slate-500">
            Base Post-Loan DSCR
          </div>
          <div className="flex items-baseline gap-2 font-mono tabular-nums">
            <span className="text-2xl font-semibold text-[#0B192C]">
              {formatDscr(metrics.postLoanDscr)}
            </span>
            <span className="text-xs text-slate-500">
              (Prior: {formatDscr(metrics.currentDscr)})
            </span>
          </div>
          <div className="border-t border-slate-100 pt-2 space-y-1">
            <StatusIndicator
              icon={postDscrStatus.icon}
              label={postDscrStatus.label}
              toneClass={postDscrStatus.toneClass}
            />
            <div className="font-mono text-[11px] text-slate-500 tabular-nums">
              Loan / Equity:{' '}
              {metrics.facilityToEquityRatio !== null
                ? `${metrics.facilityToEquityRatio.toFixed(2)}x`
                : 'N/A'}
            </div>
          </div>
        </div>

        {/* 4. Collateral Forced Sale Coverage */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 ncg-card-interactive flex flex-col justify-between gap-2">
          <div className="text-xs font-medium text-slate-500">
            Forced Sale Coverage (FSV / Loan)
          </div>
          <div className="font-mono text-2xl font-semibold text-[#0B192C] tabular-nums">
            {metrics.fsvCoveragePct !== null
              ? formatPct(metrics.fsvCoveragePct)
              : '0.0%'}
          </div>
          <div className="border-t border-slate-100 pt-2 space-y-1">
            <StatusIndicator
              icon={
                metrics.fsvCoveragePct === null || metrics.fsvCoveragePct < 100
                  ? 'risk'
                  : metrics.fsvCoveragePct >= 125
                  ? 'ok'
                  : 'warn'
              }
              label={
                metrics.fsvCoveragePct === null || metrics.fsvCoveragePct < 100
                  ? 'FSV Shortfall < 100%'
                  : metrics.fsvCoveragePct >= 125
                  ? 'Strong FSV >= 125%'
                  : 'Thin Cover 100%–124%'
              }
              toneClass={
                metrics.fsvCoveragePct === null || metrics.fsvCoveragePct < 100
                  ? 'text-[#DC2626]'
                  : metrics.fsvCoveragePct >= 125
                  ? 'text-[#059669]'
                  : 'text-[#D97706]'
              }
            />
            <div className="font-mono text-[11px] text-slate-500 tabular-nums">
              FSV: {formatBDT(input.forcedSaleValue)}
            </div>
          </div>
        </div>

        {/* 5. Monthly EMI & Total Debt Service */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 ncg-card-interactive flex flex-col justify-between gap-2">
          <div className="text-xs font-medium text-slate-500">
            Post-Grace Monthly EMI
          </div>
          <div className="font-mono text-2xl font-semibold text-[#0B192C] tabular-nums">
            {formatBDT(metrics.estimatedMonthlyEmi)}
          </div>
          <div className="border-t border-slate-100 pt-2 space-y-1 font-mono text-[11px] text-slate-600 tabular-nums">
            <div>Total Debt: {formatBDT(metrics.totalPostLoanMonthlyDebt)} / mo</div>
            <div className="text-slate-500">
              {input.gracePeriodMonths > 0
                ? `Grace (${input.gracePeriodMonths}m): ${formatBDT(metrics.gracePeriodMonthlyInterest)}/mo · Amort: ${metrics.amortizationMonths}m`
                : `${input.annualInterestRate.toFixed(2)}% p.a. · ${input.loanTenureMonths}m`}
            </div>
          </div>
        </div>

        {/* 6. Sector-Specific Stressed DSCR & Cash Flow */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 ncg-card-interactive flex flex-col justify-between gap-2">
          <div className="text-xs font-medium text-slate-500">
            Stressed Cash Flow ({metrics.stressScenario.label})
          </div>
          <div
            className={`font-mono text-2xl font-semibold tabular-nums ${
              stressSurvives ? 'text-[#059669]' : 'text-[#DC2626]'
            }`}
          >
            {formatBDT(metrics.stressedNetCashFlow, true)}
            <span className="text-xs font-normal text-slate-500"> / mo</span>
          </div>
          <div className="border-t border-slate-100 pt-2 space-y-1">
            {stressSurvives ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#059669]">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Survives Shock (Stressed DSCR {formatDscr(metrics.stressedPostLoanDscr)})</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#DC2626]">
                <TrendingDown className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Deficit Under Shock (Stressed DSCR {formatDscr(metrics.stressedPostLoanDscr)})</span>
              </span>
            )}
            <div className="font-mono text-[11px] text-slate-500 tabular-nums">
              Base Surplus: {formatBDT(metrics.postLoanNetCashFlow, true)} / mo
            </div>
          </div>
        </div>
      </div>

      {/* Working Capital & Safe Limit-Sizing Calculator */}
      <div
        id="section-limit-sizing"
        className="rounded-xl border border-[#E2E8F0] bg-white overflow-hidden ncg-card print-avoid-break"
      >
        <div className="border-b border-[#E2E8F0] px-4 py-3 flex flex-wrap items-center justify-between gap-3 bg-[#F8FAFC] print:bg-white">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-[#0B192C] shrink-0" aria-hidden="true" />
            <div>
              <h3 className="font-display text-xs font-semibold text-[#0B192C]">
                Working Capital &amp; Safe Limit-Sizing Calculator
              </h3>
              <p className="text-[11px] text-slate-500">
                Maximum principal serviceable at {metrics.minSafeStressedDscrTarget.toFixed(2)}x minimum safe Stressed DSCR ({metrics.stressScenario.label})
              </p>
            </div>
          </div>
          <div className="font-mono text-[11px] font-medium text-slate-700 tabular-nums">
            Floor DSCR: {metrics.minSafeStressedDscrTarget.toFixed(2)}x · Amort: {metrics.amortizationMonths}m @ {input.annualInterestRate.toFixed(2)}%
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Animated Linear Stressed DSCR Progress Gauge */}
          <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 print:bg-white">
            <StressedDscrLinearGauge
              stressedDscr={metrics.stressedPostLoanDscr}
              minFloor={metrics.minSafeStressedDscrTarget}
            />
          </div>

          {/* Row 1: CCC Formula + 1.25x Stressed Debt Capacity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 space-y-1.5 print:bg-white">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#0B192C]">
                  Cash Conversion Cycle (CCC)
                </span>
                <span
                  className={`font-mono text-sm font-bold tabular-nums ${
                    metrics.cccWarning ? 'text-[#D97706]' : 'text-[#0B192C]'
                  }`}
                >
                  {Math.round(metrics.cccDays)} Days
                </span>
              </div>
              <div className="font-mono text-[11px] text-slate-600 tabular-nums">
                Inventory {Math.round(metrics.inventoryDays)}d + Receivable {input.receivableDays}d − Payable {input.payableDays}d = {Math.round(metrics.cccDays)}d
              </div>
              <div className="text-[11px] text-slate-500">
                {metrics.cccWarning
                  ? 'Extended cycle (>75d): heightened working capital lockup risk under stress.'
                  : 'Standard liquidity cycle (≤75d): supports regular monthly EMI collections.'}
              </div>
            </div>

            <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 space-y-1.5 print:bg-white">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#0B192C]">
                  Safe Monthly Debt Capacity (1.25x Floor)
                </span>
                <span className="font-mono text-sm font-bold text-[#0B192C] tabular-nums">
                  {formatBDT(metrics.maxSafeNewMonthlyEmiBdt)} / mo
                </span>
              </div>
              <div className="font-mono text-[11px] text-slate-600 tabular-nums">
                Stressed Cash {formatBDT(metrics.stressedCashAvailableForDebt)} ÷ 1.25 = {formatBDT(metrics.maxTotalSafeMonthlyDebtBdt)} − Existing {formatBDT(metrics.totalExistingMonthlyDebt)}
              </div>
              <div className="text-[11px] text-slate-500">
                Max new monthly EMI before Stressed DSCR drops below {metrics.minSafeStressedDscrTarget.toFixed(2)}x.
              </div>
            </div>
          </div>

          {/* Row 2: Side-by-Side Requested Loan vs. NCG Recommended Safe Loan Limit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="rounded-lg border border-[#E2E8F0] bg-white p-4 space-y-1">
              <div className="text-xs font-medium text-slate-500">
                Requested Loan Amount (৳)
              </div>
              <div className="font-mono text-xl font-bold text-[#0B192C] tabular-nums">
                {formatBDT(input.requestedLoanAmount)}
              </div>
              <div className="font-mono text-[11px] text-slate-500 tabular-nums">
                {formatBDTScaleHint(input.requestedLoanAmount) || '—'} · Req. EMI: {formatBDT(metrics.estimatedMonthlyEmi)}/mo
              </div>
            </div>

            <div
              className={`rounded-lg border p-4 space-y-1 print:bg-white ${
                metrics.overLeveragedRequestAlert
                  ? 'border-[#DC2626]/35 bg-red-50/50'
                  : 'border-[#059669]/30 bg-emerald-50/50'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-700">
                  NCG Recommended Safe Loan Limit (৳)
                </span>
                <Scale
                  className={`h-3.5 w-3.5 shrink-0 ${
                    metrics.overLeveragedRequestAlert
                      ? 'text-[#DC2626]'
                      : 'text-[#059669]'
                  }`}
                  aria-hidden="true"
                />
              </div>
              <div
                className={`font-mono text-xl font-bold tabular-nums ${
                  metrics.overLeveragedRequestAlert
                    ? 'text-[#DC2626]'
                    : 'text-[#059669]'
                }`}
              >
                {formatBDT(metrics.recommendedSafeLoanLimitBdt)}
              </div>
              <div className="font-mono text-[11px] text-slate-600 tabular-nums">
                {formatBDTScaleHint(metrics.recommendedSafeLoanLimitBdt) || '৳ 0 Capacity'} · Max Safe EMI: {formatBDT(metrics.maxSafeNewMonthlyEmiBdt)}/mo
              </div>
            </div>
          </div>

          {/* Row 3: Over-Leveraged Alert or Safe Headroom Banner */}
          {metrics.overLeveragedRequestAlert ? (
            <div
              role="alert"
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-[#DC2626]/35 bg-red-50 px-4 py-3 text-red-950 print:bg-white"
            >
              <div className="flex items-start gap-2.5">
                <AlertOctagon
                  className="h-4 w-4 text-[#DC2626] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-[#DC2626]">
                    Over-Leveraged Request Alert
                  </div>
                  <p className="text-xs text-red-900 leading-relaxed">
                    Requested loan exceeds safe {metrics.minSafeStressedDscrTarget.toFixed(2)}x Stressed DSCR capacity
                    {metrics.recommendedSafeLoanLimitBdt === 0
                      ? ' (stressed cash flow after existing obligations leaves zero net EMI capacity).'
                      : ` (${formatBDT(metrics.recommendedSafeLoanLimitBdt)} maximum bankable principal).`}
                  </p>
                </div>
              </div>
              <div className="shrink-0 sm:text-right font-mono tabular-nums">
                <div className="text-[11px] font-medium text-[#DC2626]">
                  Exact BDT Reduction Needed
                </div>
                <div className="text-base font-bold text-[#DC2626]">
                  −{formatBDT(metrics.overLeveragedReductionBdt)}
                </div>
                {formatBDTScaleHint(metrics.overLeveragedReductionBdt) && (
                  <div className="text-[11px] text-[#DC2626]">
                    ({formatBDTScaleHint(metrics.overLeveragedReductionBdt)})
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-[#059669]/25 bg-emerald-50/70 px-4 py-2.5 text-emerald-950 print:bg-white">
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-900">
                <CheckCircle2
                  className="h-4 w-4 text-[#059669] shrink-0"
                  aria-hidden="true"
                />
                <span>
                  Within Safe Limit: Requested principal remains serviceable above {metrics.minSafeStressedDscrTarget.toFixed(2)}x Stressed DSCR.
                </span>
              </div>
              <div className="font-mono text-xs font-semibold text-[#059669] tabular-nums shrink-0">
                Safe Headroom: +{formatBDT(metrics.safeLimitHeadroomBdt)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cash-Flow Sensitivity Ledger */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white overflow-hidden ncg-card print-avoid-break">
        <div className="border-b border-[#E2E8F0] px-4 py-3 flex flex-wrap items-center justify-between gap-4 bg-[#F8FAFC] print:bg-white">
          <div>
            <h3 className="font-display text-xs font-semibold text-[#0B192C]">
              Forensic Cash-Flow &amp; Sector Stress Ledger (Monthly BDT)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {metrics.stressScenario.rationale}
            </p>
          </div>
          <span className="font-mono text-[11px] text-slate-600 tabular-nums">
            Gross Margin: {formatPct(metrics.grossMarginPct)} · Operating Margin:{' '}
            {formatPct(metrics.netOperatingMarginPct)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-slate-600 print:bg-slate-50">
                <th className="py-2.5 px-4 font-medium">Cash-Flow Line Item</th>
                <th className="py-2.5 px-4 font-medium text-right">
                  Declared Base
                </th>
                <th className="py-2.5 px-4 font-medium text-right">
                  Stressed ({metrics.stressScenario.label})
                </th>
                <th className="py-2.5 px-4 font-medium text-right">Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
              <tr className="hover:bg-slate-50/70">
                <td className="py-2 px-4 font-sans text-slate-700">
                  Monthly Revenue / Project Inflow ({metrics.stressScenario.revenueShockPct}%)
                </td>
                <td className="py-2 px-4 text-right text-[#0B192C]">
                  {formatBDT(input.monthlyRevenue)}
                </td>
                <td className="py-2 px-4 text-right text-[#0B192C]">
                  {formatBDT(metrics.stressedRevenue)}
                </td>
                <td className="py-2 px-4 text-right text-[#DC2626]">
                  {formatBDT(metrics.stressedRevenue - input.monthlyRevenue, true)}
                </td>
              </tr>
              <tr className="hover:bg-slate-50/70">
                <td className="py-2 px-4 font-sans text-slate-700">
                  Direct Cost / Materials / Fuel (+{metrics.stressScenario.costShockPct}%)
                </td>
                <td className="py-2 px-4 text-right text-[#0B192C]">
                  {formatBDT(input.directCost)}
                </td>
                <td className="py-2 px-4 text-right text-[#0B192C]">
                  {formatBDT(metrics.stressedDirectCost)}
                </td>
                <td className="py-2 px-4 text-right text-[#DC2626]">
                  {formatBDT(metrics.stressedDirectCost - input.directCost, true)}
                </td>
              </tr>
              <tr className="hover:bg-slate-50/70">
                <td className="py-2 px-4 font-sans text-slate-700">
                  Fixed &amp; Variable OpEx
                </td>
                <td className="py-2 px-4 text-right text-[#0B192C]">
                  {formatBDT(input.fixedExpenses + input.variableExpenses)}
                </td>
                <td className="py-2 px-4 text-right text-[#0B192C]">
                  {formatBDT(input.fixedExpenses + input.variableExpenses)}
                </td>
                <td className="py-2 px-4 text-right text-slate-500">৳ 0</td>
              </tr>
              <tr className="hover:bg-slate-50/70">
                <td className="py-2 px-4 font-sans text-slate-700">
                  Less: Owner Personal / Family Drawings
                </td>
                <td className="py-2 px-4 text-right text-slate-700">
                  -{formatBDT(input.ownerMonthlyDrawings)}
                </td>
                <td className="py-2 px-4 text-right text-slate-700">
                  -{formatBDT(input.ownerMonthlyDrawings)}
                </td>
                <td className="py-2 px-4 text-right text-slate-500">৳ 0</td>
              </tr>
              <tr className="bg-slate-50/70 font-semibold">
                <td className="py-2 px-4 font-sans text-[#0B192C]">
                  Net Cash Available for Debt Service
                </td>
                <td className="py-2 px-4 text-right text-[#0B192C]">
                  {formatBDT(metrics.cashAvailableForDebt)}
                </td>
                <td
                  className={`py-2 px-4 text-right ${
                    metrics.stressedCashAvailableForDebt >= 0
                      ? 'text-[#0B192C]'
                      : 'text-[#DC2626]'
                  }`}
                >
                  {formatBDT(metrics.stressedCashAvailableForDebt)}
                </td>
                <td className="py-2 px-4 text-right text-[#DC2626]">
                  {formatBDT(
                    metrics.stressedCashAvailableForDebt -
                      metrics.cashAvailableForDebt,
                    true,
                  )}
                </td>
              </tr>
              <tr className="hover:bg-slate-50/70">
                <td className="py-2 px-4 font-sans text-slate-700">
                  Total Monthly Debt (Bank + Informal + New EMI)
                </td>
                <td className="py-2 px-4 text-right text-[#0B192C]">
                  {formatBDT(metrics.totalPostLoanMonthlyDebt)}
                </td>
                <td className="py-2 px-4 text-right text-[#0B192C]">
                  {formatBDT(metrics.totalPostLoanMonthlyDebt)}
                </td>
                <td className="py-2 px-4 text-right text-slate-500">৳ 0</td>
              </tr>
              <tr className="bg-slate-100/80 font-semibold print:bg-slate-100">
                <td className="py-2.5 px-4 font-sans text-[#0B192C]">
                  Post-Loan Retained Net Cash Flow
                </td>
                <td
                  className={`py-2.5 px-4 text-right ${
                    metrics.postLoanNetCashFlow >= 0
                      ? 'text-[#059669]'
                      : 'text-[#DC2626]'
                  }`}
                >
                  {formatBDT(metrics.postLoanNetCashFlow, true)}
                </td>
                <td
                  className={`py-2.5 px-4 text-right ${
                    metrics.stressedNetCashFlow >= 0
                      ? 'text-[#059669]'
                      : 'text-[#DC2626]'
                  }`}
                >
                  {formatBDT(metrics.stressedNetCashFlow, true)}
                </td>
                <td className="py-2.5 px-4 text-right text-[#DC2626]">
                  {formatBDT(
                    metrics.stressedNetCashFlow - metrics.postLoanNetCashFlow,
                    true,
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
