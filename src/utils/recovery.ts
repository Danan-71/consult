import type {
  ClassificationStage,
  CollateralRealizabilityRating,
  RecoveryCaseInput,
  RecoveryMetrics,
} from '../types/credit';

export const CLASSIFICATION_STAGES: ClassificationStage[] = [
  'SMA (Special Mention Account: 2–3 mo overdue)',
  'Sub-Standard (SS: 3–6 mo overdue)',
  'Doubtful (DF: 6–12 mo overdue)',
  'Bad / Loss (BL: 12+ mo overdue)',
  'Written-Off / Artha Rin Suit Filed',
];

export const COLLATERAL_REALIZABILITY_RATINGS: CollateralRealizabilityRating[] = [
  'High - Liquid Urban Property / FDR',
  'Moderate - Semi-Urban / Auction Friction',
  'Low - Disputed / Rural / Unsecured',
];

export function calculateRecoveryMetrics(
  input: RecoveryCaseInput,
): RecoveryMetrics {
  const outstanding = Math.max(0, input.totalOutstandingAmount || 0);
  const overdue = Math.max(0, input.overdueAmount || 0);
  const inflow = Math.max(0, input.monthlyCashInflow || 0);
  const expenses = Math.max(0, input.essentialMonthlyExpenses || 0);
  const collateralVal = Math.max(0, input.collateralRealizableValue || 0);

  const monthlyNetCashForRecovery = inflow - expenses;
  const cashFlowViable = monthlyNetCashForRecovery > 0;

  const monthsToRecoverOverdue =
    cashFlowViable && overdue > 0
      ? overdue / monthlyNetCashForRecovery
      : null;
  const monthsToRecoverOutstanding =
    cashFlowViable && outstanding > 0
      ? outstanding / monthlyNetCashForRecovery
      : null;

  const collateralCoverageVsOutstandingPct =
    outstanding > 0 ? (collateralVal / outstanding) * 100 : null;
  const collateralCoverageVsOverduePct =
    overdue > 0 ? (collateralVal / overdue) * 100 : null;

  const overdueShareOfOutstandingPct =
    outstanding > 0 ? Math.min(100, (overdue / outstanding) * 100) : 0;

  const activeRedFlagCount = Object.values(input.redFlags).filter(Boolean).length;

  let feasibilityStatus: RecoveryMetrics['feasibilityStatus'];
  if (
    !cashFlowViable ||
    input.redFlags.uncooperativeBorrower ||
    input.redFlags.businessShutdownOrPartialClosure ||
    (monthsToRecoverOutstanding !== null && monthsToRecoverOutstanding > 60)
  ) {
    feasibilityStatus = 'Legal & Enforcement Priority';
  } else if (
    monthsToRecoverOutstanding !== null &&
    monthsToRecoverOutstanding <= 36 &&
    !input.redFlags.suspectedFundDiversion
  ) {
    feasibilityStatus = 'Cash-Flow Viable Recovery';
  } else {
    feasibilityStatus = 'Asset-Backed / Structured Exit';
  }

  return {
    monthlyNetCashForRecovery,
    cashFlowViable,
    monthsToRecoverOverdue,
    monthsToRecoverOutstanding,
    collateralCoverageVsOutstandingPct,
    collateralCoverageVsOverduePct,
    overdueShareOfOutstandingPct,
    activeRedFlagCount,
    feasibilityStatus,
  };
}

export const EMPTY_RECOVERY_INPUT: RecoveryCaseInput = {
  caseReference: '',
  sector: 'Local Wholesale & Retail Shop (Hardware/Cloth/Grocery/Electronics)',
  totalOutstandingAmount: 0,
  overdueAmount: 0,
  monthsOverdue: 4,
  classificationStage: 'Sub-Standard (SS: 3–6 mo overdue)',
  monthlyCashInflow: 0,
  essentialMonthlyExpenses: 0,
  collateralDescription: '',
  collateralRealizableValue: 0,
  collateralRealizability: 'Moderate - Semi-Urban / Auction Friction',
  guarantorAssessment: '',
  redFlags: {
    suspectedFundDiversion: false,
    businessShutdownOrPartialClosure: false,
    uncooperativeBorrower: false,
    multipleDebtOverlap: false,
    ni138ChequeDishonorPending: false,
    collateralEncumbranceOrMutationDefect: false,
  },
  caseBackgroundNotes: '',
};

export interface RecoveryPreset {
  id: string;
  buttonLabel: string;
  data: RecoveryCaseInput;
}

export const RECOVERY_PRESETS: RecoveryPreset[] = [
  {
    id: 'rec-textile-ss',
    buttonLabel: 'Case: Stressed Textile Trader (SS)',
    data: {
      caseReference: 'NCG-REC-2026-104 (Narsingdi Textile Merchant)',
      sector: 'Local Wholesale & Retail Shop (Hardware/Cloth/Grocery/Electronics)',
      totalOutstandingAmount: 6200000,
      overdueAmount: 1450000,
      monthsOverdue: 4.5,
      classificationStage: 'Sub-Standard (SS: 3–6 mo overdue)',
      monthlyCashInflow: 1450000,
      essentialMonthlyExpenses: 1210000,
      collateralDescription:
        'Registered mortgage on 4.5 decimal semi-urban commercial shop-cum-godown in Madhabdi, Narsingdi.',
      collateralRealizableValue: 5400000,
      collateralRealizability: 'Moderate - Semi-Urban / Auction Friction',
      guarantorAssessment:
        'Two solvent personal guarantors (elder brother owns a local dyeing unit); borrower attends branch calls and expressed willingness to pay partial down payment.',
      redFlags: {
        suspectedFundDiversion: false,
        businessShutdownOrPartialClosure: false,
        uncooperativeBorrower: false,
        multipleDebtOverlap: true,
        ni138ChequeDishonorPending: false,
        collateralEncumbranceOrMutationDefect: false,
      },
      caseBackgroundNotes:
        'CC-Hypo facility slipped to SS after Eid-ul-Fitr credit sales to rural retailers slowed and ৳18 Lakh Baki became stuck. Business remains operational at ~65% volume.',
    },
  },
  {
    id: 'rec-contractor-df',
    buttonLabel: 'Case: Overdue Contractor (DF)',
    data: {
      caseReference: 'NCG-REC-2026-218 (Bogura Civil Contractor)',
      sector: 'LGED / Public Works Construction Contractor',
      totalOutstandingAmount: 9500000,
      overdueAmount: 4200000,
      monthsOverdue: 8,
      classificationStage: 'Doubtful (DF: 6–12 mo overdue)',
      monthlyCashInflow: 620000,
      essentialMonthlyExpenses: 530000,
      collateralDescription:
        'Registered mortgage on 8 decimal semi-urban plot in Sherpur, Bogura + uncollected LGED running bills.',
      collateralRealizableValue: 6800000,
      collateralRealizability: 'Moderate - Semi-Urban / Auction Friction',
      guarantorAssessment:
        'Spouse personal guarantee (no independent income); borrower requesting time until ministry clears pending road bills, though two sub-contractors also claim dues.',
      redFlags: {
        suspectedFundDiversion: true,
        businessShutdownOrPartialClosure: false,
        uncooperativeBorrower: false,
        multipleDebtOverlap: true,
        ni138ChequeDishonorPending: true,
        collateralEncumbranceOrMutationDefect: false,
      },
      caseBackgroundNotes:
        'Portion of working capital appears diverted to purchase personal land outside project scope; two undated security cheques bounced upon presentation.',
    },
  },
  {
    id: 'rec-importer-bl',
    buttonLabel: 'Case: Shutdown Importer (BL)',
    data: {
      caseReference: 'NCG-REC-2026-309 (Chattogram Commodity Importer)',
      sector: 'Importer',
      totalOutstandingAmount: 14500000,
      overdueAmount: 14500000,
      monthsOverdue: 16,
      classificationStage: 'Bad / Loss (BL: 12+ mo overdue)',
      monthlyCashInflow: 180000,
      essentialMonthlyExpenses: 240000,
      collateralDescription:
        'Rural low-lying plot in Sitakunda (disputed boundary) + hypothecation of expired warehouse stock.',
      collateralRealizableValue: 5500000,
      collateralRealizability: 'Low - Disputed / Rural / Unsecured',
      guarantorAssessment:
        'Guarantor unreachable; primary proprietor vacated rented Khatunganj office and responds intermittently via third parties.',
      redFlags: {
        suspectedFundDiversion: true,
        businessShutdownOrPartialClosure: true,
        uncooperativeBorrower: true,
        multipleDebtOverlap: true,
        ni138ChequeDishonorPending: true,
        collateralEncumbranceOrMutationDefect: true,
      },
      caseBackgroundNotes:
        'LTR matured following USD/BDT surge; borrower liquidated pledged goods without depositing sale proceeds into bank account.',
    },
  },
];
