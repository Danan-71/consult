import type {
  EarlyWarningAlertItem,
  EarlyWarningInput,
  EarlyWarningMetrics,
  EarlyWarningSignalLevel,
} from '../types/credit';
import { formatBDT } from './finance';

export const EMPTY_EARLY_WARNING_INPUT: EarlyWarningInput = {
  caseCode: '',
  sector: 'Local Wholesale & Retail Shop (Hardware/Cloth/Grocery/Electronics)',
  facilityType: 'Working Capital CC-Hypo',
  sanctionedLimitBdt: 0,
  currentOutstandingBdt: 0,
  monthlyInstallmentDueBdt: 0,
  projectedMonthlySalesBdt: 0,
  currentMonthlyBankRoutingBdt: 0,
  daysPastDue: 0,
  requiredStockCoverBdt: 0,
  verifiedStockCoverBdt: 0,
  covenants: {
    quarterlyStockStatementOnTime: true,
    exclusiveRoutingToLendingBranch: true,
    insuranceAndLicensesActive: true,
    zeroChequeReturnOrIrregularTransfers: true,
  },
  fieldOfficerNotes: '',
};

export interface EarlyWarningPreset {
  id: string;
  buttonLabel: string;
  data: EarlyWarningInput;
}

export const EARLY_WARNING_PRESETS: EarlyWarningPreset[] = [
  {
    id: 'ews-routing-diversion',
    buttonLabel: 'EWS-Critical: CC-Hypo Diversion',
    data: {
      caseCode: 'EWS-MYM01-409',
      sector: 'Dealers & Brand Distributors (FMCG/Cement/Rod/Fertilizer)',
      facilityType: 'Working Capital CC-Hypo',
      sanctionedLimitBdt: 15000000,
      currentOutstandingBdt: 14750000,
      monthlyInstallmentDueBdt: 215000,
      projectedMonthlySalesBdt: 12000000,
      currentMonthlyBankRoutingBdt: 4600000,
      daysPastDue: 42,
      requiredStockCoverBdt: 18750000,
      verifiedStockCoverBdt: 12900000,
      covenants: {
        quarterlyStockStatementOnTime: false,
        exclusiveRoutingToLendingBranch: false,
        insuranceAndLicensesActive: true,
        zeroChequeReturnOrIrregularTransfers: false,
      },
      fieldOfficerNotes:
        'Dealer routing majority of secondary retailer collections through a competing private bank CD account while CC-Hypo stays maxed at 98.3% limit.',
    },
  },
  {
    id: 'ews-watch-garments',
    buttonLabel: 'EWS-Watch: Factory Tight Margin',
    data: {
      caseCode: 'EWS-DHK04-218',
      sector: 'Garments / Textile / Light Engineering Factory',
      facilityType: 'Term Loan',
      sanctionedLimitBdt: 22000000,
      currentOutstandingBdt: 18400000,
      monthlyInstallmentDueBdt: 485000,
      projectedMonthlySalesBdt: 9500000,
      currentMonthlyBankRoutingBdt: 6400000,
      daysPastDue: 18,
      requiredStockCoverBdt: 20000000,
      verifiedStockCoverBdt: 19200000,
      covenants: {
        quarterlyStockStatementOnTime: true,
        exclusiveRoutingToLendingBranch: true,
        insuranceAndLicensesActive: true,
        zeroChequeReturnOrIrregularTransfers: true,
      },
      fieldOfficerNotes:
        'Gas pressure drop slowed output by 15 days; buyer LC settlement expected in 10 days. Stock intact and verified at Gazipur unit.',
    },
  },
  {
    id: 'ews-nominal-clinic',
    buttonLabel: 'EWS-Normal: Diagnostic Capex',
    data: {
      caseCode: 'EWS-MYM01-112',
      sector: 'Clinic / Diagnostic Center / Hospital / Pharmacy',
      facilityType: 'Term Loan',
      sanctionedLimitBdt: 4500000,
      currentOutstandingBdt: 3650000,
      monthlyInstallmentDueBdt: 149500,
      projectedMonthlySalesBdt: 2100000,
      currentMonthlyBankRoutingBdt: 1890000,
      daysPastDue: 0,
      requiredStockCoverBdt: 5200000,
      verifiedStockCoverBdt: 6400000,
      covenants: {
        quarterlyStockStatementOnTime: true,
        exclusiveRoutingToLendingBranch: true,
        insuranceAndLicensesActive: true,
        zeroChequeReturnOrIrregularTransfers: true,
      },
      fieldOfficerNotes:
        'All diagnostic daily receipts credited into branch collection account; zero overdue days and valid DGHS & fire insurance.',
    },
  },
];

export function calculateEarlyWarningMetrics(
  input: EarlyWarningInput,
): EarlyWarningMetrics {
  const routingCompliancePct =
    input.projectedMonthlySalesBdt > 0
      ? (input.currentMonthlyBankRoutingBdt / input.projectedMonthlySalesBdt) *
        100
      : 0;
  const routingLeakageAlert =
    input.projectedMonthlySalesBdt > 0 && routingCompliancePct < 60;

  const utilizationPct =
    input.sanctionedLimitBdt > 0
      ? (input.currentOutstandingBdt / input.sanctionedLimitBdt) * 100
      : 0;
  const overUtilizedAlert =
    input.sanctionedLimitBdt > 0 && utilizationPct >= 95;

  const daysPastDue = Math.max(0, input.daysPastDue || 0);
  const daysBeforeSubStandard = Math.max(0, 90 - daysPastDue);
  const dpdAlertSeverity: 'none' | 'watch' | 'critical' =
    daysPastDue >= 30 ? 'critical' : daysPastDue >= 15 ? 'watch' : 'none';

  const stockCoveragePct =
    input.requiredStockCoverBdt > 0
      ? (input.verifiedStockCoverBdt / input.requiredStockCoverBdt) * 100
      : 100;
  const stockErosionAlert =
    input.requiredStockCoverBdt > 0 && stockCoveragePct < 100;

  const covenantBreaches: string[] = [];
  if (!input.covenants.quarterlyStockStatementOnTime) {
    covenantBreaches.push('Quarterly Stock Statement overdue');
  }
  if (!input.covenants.exclusiveRoutingToLendingBranch) {
    covenantBreaches.push('Exclusive sales routing violated');
  }
  if (!input.covenants.insuranceAndLicensesActive) {
    covenantBreaches.push('Insurance / statutory license lapsed');
  }
  if (!input.covenants.zeroChequeReturnOrIrregularTransfers) {
    covenantBreaches.push('Cheque return / irregular transfer logged');
  }

  const alerts: EarlyWarningAlertItem[] = [];

  if (routingLeakageAlert) {
    alerts.push({
      id: 'ews-routing-leakage',
      code: 'EWS-01',
      tone: routingCompliancePct < 45 ? 'crimson' : 'amber',
      title: 'Post-Sanction Cash Routing Diversion',
      metricSummary: `Routed ${routingCompliancePct.toFixed(1)}% (${formatBDT(input.currentMonthlyBankRoutingBdt)} / ${formatBDT(input.projectedMonthlySalesBdt)})`,
      detail:
        'Monthly bank credits at the lending branch dropped below 60% of projected sales, indicating silent account diversion to another bank.',
    });
  }

  if (dpdAlertSeverity !== 'none') {
    alerts.push({
      id: 'ews-dpd-slippage',
      code: 'EWS-02',
      tone: dpdAlertSeverity === 'critical' ? 'crimson' : 'amber',
      title:
        daysPastDue >= 60
          ? 'Imminent Sub-Standard Classification Trigger'
          : daysPastDue >= 30
            ? 'SMA Delinquency Trajectory'
            : 'Early Installment Slippage Watch',
      metricSummary: `${daysPastDue} DPD (${daysBeforeSubStandard}d left to 90d SS)`,
      detail:
        daysPastDue >= 30
          ? 'Facility has crossed 30 Days Past Due and requires immediate branch follow-up to prevent Bangladesh Bank SMA/SS provisioning.'
          : 'Installment is 15–29 days overdue; verify temporary receivable timing gap before SMA threshold.',
    });
  }

  if (overUtilizedAlert) {
    alerts.push({
      id: 'ews-limit-saturation',
      code: 'EWS-03',
      tone: utilizationPct >= 98 ? 'crimson' : 'amber',
      title: 'Sanctioned Limit Saturation / Evergreening Risk',
      metricSummary: `${utilizationPct.toFixed(1)}% Utilized (${formatBDT(input.currentOutstandingBdt)})`,
      detail:
        'Outstanding balance sits at or above 95% of sanctioned limit with minimal downward swing, indicating working capital lock-up.',
    });
  }

  if (stockErosionAlert) {
    alerts.push({
      id: 'ews-stock-erosion',
      code: 'EWS-04',
      tone: stockCoveragePct < 80 ? 'crimson' : 'amber',
      title: 'Hypothecated Stock / Security Cover Shortfall',
      metricSummary: `${stockCoveragePct.toFixed(1)}% Cover (${formatBDT(input.verifiedStockCoverBdt)} vs ${formatBDT(input.requiredStockCoverBdt)})`,
      detail:
        'Physical verified inventory or collateral value is below the sanctioned covenant requirement, weakening recovery security margin.',
    });
  }

  if (covenantBreaches.length > 0) {
    alerts.push({
      id: 'ews-covenant-breach',
      code: 'EWS-05',
      tone: covenantBreaches.length >= 2 ? 'crimson' : 'amber',
      title: 'Post-Sanction Covenant & Conduct Breaches',
      metricSummary: `${covenantBreaches.length} Breach${covenantBreaches.length > 1 ? 'es' : ''} Active`,
      detail: `Active exceptions: ${covenantBreaches.join('; ')}.`,
    });
  }

  // Deterministic EWS Risk Score (0 = safest, 100 = severe early distress)
  let riskScore = 8;
  if (input.projectedMonthlySalesBdt > 0) {
    if (routingCompliancePct < 45) riskScore += 26;
    else if (routingCompliancePct < 60) riskScore += 18;
    else if (routingCompliancePct < 75) riskScore += 8;
  }

  if (daysPastDue >= 60) riskScore += 32;
  else if (daysPastDue >= 30) riskScore += 22;
  else if (daysPastDue >= 15) riskScore += 12;
  else if (daysPastDue > 0) riskScore += 5;

  if (utilizationPct >= 98) riskScore += 15;
  else if (utilizationPct >= 95) riskScore += 10;

  if (input.requiredStockCoverBdt > 0) {
    if (stockCoveragePct < 75) riskScore += 18;
    else if (stockCoveragePct < 100) riskScore += 11;
  }

  riskScore += covenantBreaches.length * 6;
  const ewsRiskScore = Math.min(100, Math.max(0, Math.round(riskScore)));

  const hasCrimson = alerts.some((a) => a.tone === 'crimson');
  const signalLevel: EarlyWarningSignalLevel =
    hasCrimson || ewsRiskScore >= 60
      ? 'CRITICAL'
      : alerts.length > 0 || ewsRiskScore >= 30
        ? 'WATCH'
        : 'NORMAL';

  return {
    routingCompliancePct,
    routingLeakageAlert,
    utilizationPct,
    overUtilizedAlert,
    daysBeforeSubStandard,
    dpdAlertSeverity,
    stockCoveragePct,
    stockErosionAlert,
    covenantBreachCount: covenantBreaches.length,
    ewsRiskScore,
    signalLevel,
    alerts,
  };
}
