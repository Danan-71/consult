import type {
  ActionQueueGroup,
  ClosingCategoryMetrics,
  ClosingCategoryTarget,
  ClosingMetrics,
  ClosingPipelineItem,
  ClosingPlannerInput,
  PipelineCostOrRiskGrade,
  PipelineItemType,
  PipelineStage,
  PrioritizedPipelineItem,
} from '../types/credit';
import { formatBDT } from './finance';

export const PIPELINE_ITEM_TYPES: PipelineItemType[] = [
  'Deposit',
  'Quality Loan',
  'NPL Recovery',
];

export const PIPELINE_STAGES: PipelineStage[] = [
  'Ready to Close',
  'Follow-Up Due',
  'Under Review',
  'Docs Pending',
];

export const PIPELINE_GRADES_BY_TYPE: Record<
  PipelineItemType,
  PipelineCostOrRiskGrade[]
> = {
  Deposit: [
    'Low-Cost CASA / Fee-Free',
    'Standard FDR / Term Deposit',
    'High-Cost Bulk Deposit',
  ],
  'Quality Loan': [
    'ICRRS Excellent / Good (Low Risk)',
    'ICRRS Marginal (Moderate Risk)',
    'High-Risk / Sub-Par Loan',
  ],
  'NPL Recovery': [
    'Verified Cash / Settlement',
    'Low-Cost CASA / Fee-Free',
  ],
};

export function getDefaultGradeForType(
  type: PipelineItemType,
): PipelineCostOrRiskGrade {
  switch (type) {
    case 'Deposit':
      return 'Low-Cost CASA / Fee-Free';
    case 'Quality Loan':
      return 'ICRRS Excellent / Good (Low Risk)';
    case 'NPL Recovery':
      return 'Verified Cash / Settlement';
  }
}

export function offsetIsoDate(daysFromToday: number): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + daysFromToday);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function computeDaysUntilDate(isoDate: string): number | null {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  const [y, m, d] = isoDate.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function createPipelineItem(
  index: number,
  type: PipelineItemType = 'Deposit',
): ClosingPipelineItem {
  const prefix =
    type === 'Deposit' ? 'DEP' : type === 'Quality Loan' ? 'LN' : 'NPL';
  return {
    id: `pipe-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    code: `${prefix}-${String(index).padStart(2, '0')}`,
    type,
    amountBdt: 0,
    costOrRiskGrade: getDefaultGradeForType(type),
    probabilityPct: 70,
    stage: 'Follow-Up Due',
    targetDate: offsetIsoDate(3),
    blockingIssueNextStep: '',
  };
}

function buildCategoryMetrics(
  label: string,
  type: PipelineItemType,
  targetPair: ClosingCategoryTarget,
  items: ClosingPipelineItem[],
  daysLeft: number,
): ClosingCategoryMetrics {
  const achievedBdt = Math.max(0, targetPair.achievedBdt || 0);
  const targetBdt = Math.max(0, targetPair.targetBdt || 0);
  const rawGapBdt = Math.max(0, targetBdt - achievedBdt);

  const weightedPipelineBdt = items
    .filter((item) => item.type === type)
    .reduce((sum, item) => {
      const amt = Math.max(0, item.amountBdt || 0);
      const prob = Math.min(100, Math.max(0, item.probabilityPct || 0));
      return sum + (amt * prob) / 100;
    }, 0);

  const weightedExpectedAchievementBdt = achievedBdt + weightedPipelineBdt;
  const remainingGapBdt = Math.max(
    0,
    targetBdt - weightedExpectedAchievementBdt,
  );
  const projectedSurplusOrShortfallBdt =
    weightedExpectedAchievementBdt - targetBdt;

  const effectiveDays = Math.max(1, daysLeft || 1);
  const requiredDailyPaceBdt =
    remainingGapBdt > 0 ? remainingGapBdt / effectiveDays : 0;

  const attainmentPct = targetBdt > 0 ? (achievedBdt / targetBdt) * 100 : 100;
  const projectedAttainmentPct =
    targetBdt > 0 ? (weightedExpectedAchievementBdt / targetBdt) * 100 : 100;

  return {
    label,
    type,
    achievedBdt,
    targetBdt,
    rawGapBdt,
    weightedPipelineBdt,
    weightedExpectedAchievementBdt,
    remainingGapBdt,
    projectedSurplusOrShortfallBdt,
    requiredDailyPaceBdt,
    attainmentPct,
    projectedAttainmentPct,
  };
}

function assessRiskOrMarginProfile(item: ClosingPipelineItem): {
  flagged: boolean;
  reason: string | null;
} {
  if (
    item.type === 'Quality Loan' &&
    item.costOrRiskGrade === 'High-Risk / Sub-Par Loan'
  ) {
    return {
      flagged: true,
      reason:
        'High-Risk / Sub-Par Loan — closing rush sanction elevates future NPL risk.',
    };
  }
  if (
    item.type === 'Quality Loan' &&
    item.costOrRiskGrade === 'ICRRS Marginal (Moderate Risk)'
  ) {
    return {
      flagged: true,
      reason:
        'ICRRS Marginal (Moderate Risk) — requires tight covenants, collateral cover, and spread check.',
    };
  }
  if (
    item.type === 'Deposit' &&
    item.costOrRiskGrade === 'High-Cost Bulk Deposit'
  ) {
    return {
      flagged: true,
      reason:
        'High-Cost Bulk Deposit — dilutes CASA mix and compresses post-closing branch NIM.',
    };
  }
  return { flagged: false, reason: null };
}

function scoreAndGroupPipelineItems(
  items: ClosingPipelineItem[],
  maxWeightedAmount: number,
): {
  actTodayQueue: PrioritizedPipelineItem[];
  unblockBottlenecksQueue: PrioritizedPipelineItem[];
  watchRiskMarginQueue: PrioritizedPipelineItem[];
  allPrioritizedItems: PrioritizedPipelineItem[];
} {
  const prioritized: PrioritizedPipelineItem[] = items.map((item) => {
    const amount = Math.max(0, item.amountBdt || 0);
    const prob = Math.min(100, Math.max(0, item.probabilityPct || 0));
    const weightedAmountBdt = (amount * prob) / 100;
    const daysToTargetDate = computeDaysUntilDate(item.targetDate);
    const riskCheck = assessRiskOrMarginProfile(item);

    // Stage readiness score (0-30)
    const stageScore =
      item.stage === 'Ready to Close'
        ? 30
        : item.stage === 'Follow-Up Due'
          ? 20
          : item.stage === 'Under Review'
            ? 12
            : 6; // Docs Pending

    // Target date urgency score (0-25)
    let urgencyScore = 8;
    if (daysToTargetDate !== null) {
      if (daysToTargetDate <= 1) urgencyScore = 25;
      else if (daysToTargetDate <= 3) urgencyScore = 21;
      else if (daysToTargetDate <= 6) urgencyScore = 15;
      else urgencyScore = 8;
    }

    // Weighted BDT impact relative to largest item in pipeline (0-30)
    const impactScore =
      maxWeightedAmount > 0
        ? Math.min(30, (weightedAmountBdt / maxWeightedAmount) * 30)
        : 0;

    // Quality & bucket boost (0-15)
    let qualityScore = 10;
    if (item.type === 'NPL Recovery') {
      qualityScore = 15;
    } else if (
      item.costOrRiskGrade === 'Low-Cost CASA / Fee-Free' ||
      item.costOrRiskGrade === 'ICRRS Excellent / Good (Low Risk)' ||
      item.costOrRiskGrade === 'Verified Cash / Settlement'
    ) {
      qualityScore = 14;
    } else if (riskCheck.flagged) {
      qualityScore = 2;
    }

    const priorityScore = Math.round(
      stageScore + urgencyScore + impactScore + qualityScore,
    );

    // Determine deterministic Action Queue Group
    let queueGroup: ActionQueueGroup;
    let queueReason: string;

    if (riskCheck.flagged) {
      queueGroup = 'Watch Risk / Margin';
      queueReason =
        riskCheck.reason ||
        'Weak risk or deposit margin profile requires credit/ALCO scrutiny before closing.';
    } else if (
      item.stage === 'Docs Pending' ||
      item.stage === 'Under Review' ||
      (item.stage === 'Follow-Up Due' && prob < 60)
    ) {
      queueGroup = 'Unblock Bottlenecks';
      queueReason =
        item.stage === 'Docs Pending'
          ? 'Missing borrower/security docs blocking sanction or closing execution.'
          : item.stage === 'Under Review'
            ? 'Pending Credit/Branch review sign-off before disbursement or settlement.'
            : `Low conversion confidence (${prob}%) — needs direct manager follow-up to unblock.`;
    } else {
      queueGroup = 'Act Today';
      queueReason =
        item.stage === 'Ready to Close'
          ? `Ready to close (${prob}% prob.) with strong risk/cost quality — book immediately.`
          : daysToTargetDate !== null && daysToTargetDate <= 2
            ? `Target date within ${Math.max(0, daysToTargetDate)} day(s) — high-impact near-closing follow-up.`
            : `High-impact clean pipeline (${prob}% prob.) ready for daily follow-up.`;
    }

    return {
      item,
      weightedAmountBdt,
      daysToTargetDate,
      priorityScore,
      queueGroup,
      queueReason,
      weakRiskOrMarginFlag: riskCheck.flagged,
      weakRiskOrMarginReason: riskCheck.reason,
    };
  });

  const sortDesc = (a: PrioritizedPipelineItem, b: PrioritizedPipelineItem) => {
    if (b.priorityScore !== a.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }
    return b.weightedAmountBdt - a.weightedAmountBdt;
  };

  const actTodayQueue = prioritized
    .filter((p) => p.queueGroup === 'Act Today')
    .sort(sortDesc);
  const unblockBottlenecksQueue = prioritized
    .filter((p) => p.queueGroup === 'Unblock Bottlenecks')
    .sort(sortDesc);
  const watchRiskMarginQueue = prioritized
    .filter((p) => p.queueGroup === 'Watch Risk / Margin')
    .sort(sortDesc);

  const allPrioritizedItems = [
    ...actTodayQueue,
    ...unblockBottlenecksQueue,
    ...watchRiskMarginQueue,
  ];

  return {
    actTodayQueue,
    unblockBottlenecksQueue,
    watchRiskMarginQueue,
    allPrioritizedItems,
  };
}

export function calculateClosingMetrics(
  input: ClosingPlannerInput,
): ClosingMetrics {
  const daysLeft = Math.max(0, input.daysLeftToClosing || 0);
  const items = input.pipelineItems || [];

  const deposits = buildCategoryMetrics(
    'Deposits Mobilization',
    'Deposit',
    input.deposits,
    items,
    daysLeft,
  );
  const loans = buildCategoryMetrics(
    'Quality Loans & Advances',
    'Quality Loan',
    input.loans,
    items,
    daysLeft,
  );
  const nplRecovery = buildCategoryMetrics(
    'NPL Cash Recovery / Reduction',
    'NPL Recovery',
    input.nplRecovery,
    items,
    daysLeft,
  );

  const totalAchievedBdt =
    deposits.achievedBdt + loans.achievedBdt + nplRecovery.achievedBdt;
  const totalTargetBdt =
    deposits.targetBdt + loans.targetBdt + nplRecovery.targetBdt;
  const totalRawGapBdt = Math.max(0, totalTargetBdt - totalAchievedBdt);
  const totalWeightedPipelineBdt =
    deposits.weightedPipelineBdt +
    loans.weightedPipelineBdt +
    nplRecovery.weightedPipelineBdt;
  const totalWeightedExpectedAchievementBdt =
    totalAchievedBdt + totalWeightedPipelineBdt;
  const totalRemainingGapBdt =
    deposits.remainingGapBdt +
    loans.remainingGapBdt +
    nplRecovery.remainingGapBdt;

  const effectiveDays = Math.max(1, daysLeft || 1);
  const totalRequiredDailyPaceBdt =
    totalRemainingGapBdt > 0 ? totalRemainingGapBdt / effectiveDays : 0;

  // Analyze Loan & Deposit Quality Mix for Closing Rush Warning
  let highRiskSubParLoanPipelineBdt = 0;
  let highRiskSubParLoanWeightedBdt = 0;
  let marginalLoanWeightedBdt = 0;
  let lowRiskLoanWeightedBdt = 0;
  let highCostDepositWeightedBdt = 0;
  let maxWeightedAmount = 0;

  for (const item of items) {
    const amt = Math.max(0, item.amountBdt || 0);
    const weighted =
      (amt * Math.min(100, Math.max(0, item.probabilityPct || 0))) / 100;
    if (weighted > maxWeightedAmount) {
      maxWeightedAmount = weighted;
    }

    if (item.type === 'Quality Loan') {
      if (item.costOrRiskGrade === 'High-Risk / Sub-Par Loan') {
        highRiskSubParLoanPipelineBdt += amt;
        highRiskSubParLoanWeightedBdt += weighted;
      } else if (item.costOrRiskGrade === 'ICRRS Marginal (Moderate Risk)') {
        marginalLoanWeightedBdt += weighted;
      } else {
        lowRiskLoanWeightedBdt += weighted;
      }
    } else if (
      item.type === 'Deposit' &&
      item.costOrRiskGrade === 'High-Cost Bulk Deposit'
    ) {
      highCostDepositWeightedBdt += weighted;
    }
  }

  const combinedRiskyLoansWeighted =
    highRiskSubParLoanWeightedBdt + marginalLoanWeightedBdt;
  const loanGapReliesOnRiskyLoans =
    loans.rawGapBdt > 0 &&
    combinedRiskyLoansWeighted > 0 &&
    lowRiskLoanWeightedBdt < loans.rawGapBdt;

  const closingRushWarning =
    highRiskSubParLoanWeightedBdt > 0 || loanGapReliesOnRiskyLoans;

  let closingRushReason: string | null = null;
  if (highRiskSubParLoanWeightedBdt > 0 && loanGapReliesOnRiskyLoans) {
    closingRushReason = `High-Risk / Sub-Par loans (${formatBDT(highRiskSubParLoanWeightedBdt)} weighted) and Marginal ICRRS loans (${formatBDT(marginalLoanWeightedBdt)} weighted) are being relied upon because low-risk pipeline (${formatBDT(lowRiskLoanWeightedBdt)}) falls short of the ${formatBDT(loans.rawGapBdt)} loan gap.`;
  } else if (highRiskSubParLoanWeightedBdt > 0) {
    closingRushReason = `Pipeline includes ${formatBDT(highRiskSubParLoanWeightedBdt)} weighted (${formatBDT(highRiskSubParLoanPipelineBdt)} gross) in High-Risk / Sub-Par loans to hit closing volume.`;
  } else if (loanGapReliesOnRiskyLoans) {
    closingRushReason = `Low-risk Excellent/Good loan pipeline (${formatBDT(lowRiskLoanWeightedBdt)}) covers only part of the ${formatBDT(loans.rawGapBdt)} loan gap, forcing reliance on ${formatBDT(marginalLoanWeightedBdt)} in Marginal ICRRS deals.`;
  }

  const highCostDepositWarning =
    deposits.weightedPipelineBdt > 0 &&
    highCostDepositWeightedBdt / deposits.weightedPipelineBdt >= 0.4;

  const queues = scoreAndGroupPipelineItems(items, maxWeightedAmount);

  return {
    deposits,
    loans,
    nplRecovery,
    totalAchievedBdt,
    totalTargetBdt,
    totalRawGapBdt,
    totalWeightedPipelineBdt,
    totalWeightedExpectedAchievementBdt,
    totalRemainingGapBdt,
    totalRequiredDailyPaceBdt,
    highRiskSubParLoanPipelineBdt,
    highRiskSubParLoanWeightedBdt,
    marginalLoanWeightedBdt,
    highCostDepositWeightedBdt,
    closingRushWarning,
    closingRushReason,
    highCostDepositWarning,
    ...queues,
  };
}

export const EMPTY_CLOSING_INPUT: ClosingPlannerInput = {
  branchOrPeriodLabel: '',
  daysLeftToClosing: 15,
  deposits: { achievedBdt: 0, targetBdt: 0 },
  loans: { achievedBdt: 0, targetBdt: 0 },
  nplRecovery: { achievedBdt: 0, targetBdt: 0 },
  pipelineItems: [
    createPipelineItem(1, 'Deposit'),
    createPipelineItem(2, 'Quality Loan'),
    createPipelineItem(3, 'NPL Recovery'),
  ],
};

export interface ClosingPreset {
  id: string;
  buttonLabel: string;
  data: ClosingPlannerInput;
}

export const CLOSING_PRESETS: ClosingPreset[] = [
  {
    id: 'closing-balanced',
    buttonLabel: 'Closing: Half-Yearly Balanced Push',
    data: {
      branchOrPeriodLabel: 'Half-Yearly Closing (June 30) — Cumilla Branch',
      daysLeftToClosing: 18,
      deposits: {
        achievedBdt: 385000000, // 38.50 Cr
        targetBdt: 420000000, // 42.00 Cr
      },
      loans: {
        achievedBdt: 182000000, // 18.20 Cr
        targetBdt: 205000000, // 20.50 Cr
      },
      nplRecovery: {
        achievedBdt: 11500000, // 1.15 Cr
        targetBdt: 16000000, // 1.60 Cr
      },
      pipelineItems: [
        {
          id: 'cb-1',
          code: 'DEP-01 (Institutional Salary & Trust CASA)',
          type: 'Deposit',
          amountBdt: 22000000,
          costOrRiskGrade: 'Low-Cost CASA / Fee-Free',
          probabilityPct: 90,
          stage: 'Ready to Close',
          targetDate: offsetIsoDate(1),
          blockingIssueNextStep:
            'Board mandate signed; collect opening cheque & activate payroll batch today.',
        },
        {
          id: 'cb-2',
          code: 'LN-01 (Medical Diagnostic CT Term Loan)',
          type: 'Quality Loan',
          amountBdt: 14000000,
          costOrRiskGrade: 'ICRRS Excellent / Good (Low Risk)',
          probabilityPct: 85,
          stage: 'Ready to Close',
          targetDate: offsetIsoDate(2),
          blockingIssueNextStep:
            'Charge docs executed; issue vendor pay-order directly upon 25% equity receipt.',
        },
        {
          id: 'cb-3',
          code: 'NPL-01 (SS Textile Trader Down Payment)',
          type: 'NPL Recovery',
          amountBdt: 3800000,
          costOrRiskGrade: 'Verified Cash / Settlement',
          probabilityPct: 80,
          stage: 'Follow-Up Due',
          targetDate: offsetIsoDate(2),
          blockingIssueNextStep:
            'Pay-order promised by 3 PM; RM & Manager joint visit before clearing cutoff.',
        },
        {
          id: 'cb-4',
          code: 'LN-02 (FMCG Brand Distributor CC-Hypo)',
          type: 'Quality Loan',
          amountBdt: 11000000,
          costOrRiskGrade: 'ICRRS Excellent / Good (Low Risk)',
          probabilityPct: 75,
          stage: 'Docs Pending',
          targetDate: offsetIsoDate(5),
          blockingIssueNextStep:
            'Awaiting updated RJSC charge search & godown stock verification certificate.',
        },
        {
          id: 'cb-5',
          code: 'NPL-02 (SMA Cold Storage Regularization)',
          type: 'NPL Recovery',
          amountBdt: 1500000,
          costOrRiskGrade: 'Verified Cash / Settlement',
          probabilityPct: 70,
          stage: 'Under Review',
          targetDate: offsetIsoDate(4),
          blockingIssueNextStep:
            'Awaiting Zonal Credit waiver memo on penal interest for lump-sum adjustment.',
        },
        {
          id: 'cb-6',
          code: 'DEP-02 (Expat Remittance Family FDRs)',
          type: 'Deposit',
          amountBdt: 16000000,
          costOrRiskGrade: 'Standard FDR / Term Deposit',
          probabilityPct: 75,
          stage: 'Follow-Up Due',
          targetDate: offsetIsoDate(6),
          blockingIssueNextStep:
            'Confirm BEFTN inward remittance & complete nominee KYC attestation.',
        },
      ],
    },
  },
  {
    id: 'closing-rush-risk',
    buttonLabel: 'Closing: Year-End High-Risk Rush',
    data: {
      branchOrPeriodLabel: 'Annual Closing (Dec 31) — Jamalpur Branch',
      daysLeftToClosing: 11,
      deposits: {
        achievedBdt: 245000000, // 24.50 Cr
        targetBdt: 295000000, // 29.50 Cr
      },
      loans: {
        achievedBdt: 148000000, // 14.80 Cr
        targetBdt: 180000000, // 18.00 Cr
      },
      nplRecovery: {
        achievedBdt: 6200000, // 62 Lakh
        targetBdt: 14500000, // 1.45 Cr
      },
      pipelineItems: [
        {
          id: 'cr-1',
          code: 'LN-06 (Verified Agro Rice Mill Expansion)',
          type: 'Quality Loan',
          amountBdt: 8500000,
          costOrRiskGrade: 'ICRRS Excellent / Good (Low Risk)',
          probabilityPct: 85,
          stage: 'Ready to Close',
          targetDate: offsetIsoDate(1),
          blockingIssueNextStep:
            'Sanction issued; finalize mortgage mutation verification and disburse Tranche 1.',
        },
        {
          id: 'cr-2',
          code: 'DEP-08 (Upazila Parishad Contractor Pool)',
          type: 'Deposit',
          amountBdt: 12000000,
          costOrRiskGrade: 'Low-Cost CASA / Fee-Free',
          probabilityPct: 70,
          stage: 'Follow-Up Due',
          targetDate: offsetIsoDate(2),
          blockingIssueNextStep:
            'Escalate collection of retention-release escrow cheques with branch officer.',
        },
        {
          id: 'cr-3',
          code: 'NPL-03 (Doubtful Contractor Partial Recovery)',
          type: 'NPL Recovery',
          amountBdt: 4500000,
          costOrRiskGrade: 'Verified Cash / Settlement',
          probabilityPct: 60,
          stage: 'Docs Pending',
          targetDate: offsetIsoDate(3),
          blockingIssueNextStep:
            'Stalled on third-party guarantor deed & pending LGED bill assignment letter.',
        },
        {
          id: 'cr-4',
          code: 'DEP-07 (High-Rate Corporate Short-Term FDR)',
          type: 'Deposit',
          amountBdt: 34000000,
          costOrRiskGrade: 'High-Cost Bulk Deposit',
          probabilityPct: 80,
          stage: 'Under Review',
          targetDate: offsetIsoDate(4),
          blockingIssueNextStep:
            'Demanding +1.25% special rate above card; requires Treasury ALCO approval & CASA bundling.',
        },
        {
          id: 'cr-5',
          code: 'LN-04 (Unverified Brick Kiln CC Rush Proposal)',
          type: 'Quality Loan',
          amountBdt: 16500000,
          costOrRiskGrade: 'High-Risk / Sub-Par Loan',
          probabilityPct: 75,
          stage: 'Under Review',
          targetDate: offsetIsoDate(3),
          blockingIssueNextStep:
            'DoE environmental clearance expired; ICRRS Quant <30/60 — DO NOT rush sanction.',
        },
        {
          id: 'cr-6',
          code: 'LN-05 (Delayed LGED Contractor Top-Up)',
          type: 'Quality Loan',
          amountBdt: 11000000,
          costOrRiskGrade: 'ICRRS Marginal (Moderate Risk)',
          probabilityPct: 65,
          stage: 'Docs Pending',
          targetDate: offsetIsoDate(5),
          blockingIssueNextStep:
            'Pending XEN bill confirmation & 100% FSV collateral top-up before committee sign-off.',
        },
      ],
    },
  },
];
