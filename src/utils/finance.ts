import type {
  BusinessCategory,
  CalculatedMetrics,
  CibStatus,
  CollateralCategory,
  CollateralLiquidityRisk,
  DisbursementControl,
  FacilityType,
  ForensicAlertItem,
  IcrrsGrade,
  LegalStructure,
  LoanApplicationInput,
  SectorSpecificData,
  StressScenarioSpec,
} from '../types/credit';

export const BUSINESS_CATEGORIES: BusinessCategory[] = [
  'Real Estate & Land Developer',
  'LGED / Public Works Construction Contractor',
  'Dealers & Brand Distributors (FMCG/Cement/Rod/Fertilizer)',
  'Bus / Truck / Commercial Transport',
  'Brick Manufacturing (Ita Bhati)',
  'Agro-Trading / Rice Mill / Cold Storage',
  'Poultry / Dairy / Fisheries Farm',
  'Clinic / Diagnostic Center / Hospital / Pharmacy',
  'Importer',
  'Exporter (RMG / Jute / Agro / Leather)',
  'Garments / Textile / Light Engineering Factory',
  'Hotel / Resort / Restaurant / Bakery',
  'Local Wholesale & Retail Shop (Hardware/Cloth/Grocery/Electronics)',
  'Online / E-Commerce / F-Commerce',
  'IT / Software / Educational Institution / Service Business',
];

export const LEGAL_STRUCTURES: LegalStructure[] = [
  'Proprietorship',
  'Partnership',
  'Pvt. Ltd. Company',
];

export const CIB_STATUSES: CibStatus[] = [
  'Clean',
  'Regular-SMA',
  'Rescheduled Once',
  'Multiple Rescheduled',
  'Classified',
];

export const FACILITY_TYPES: FacilityType[] = [
  'Term Loan',
  'Project Finance',
  'Working Capital CC-Hypo',
  'Overdraft',
  'LC-LTR',
];

export const DISBURSEMENT_CONTROLS: DisbursementControl[] = [
  'Tranche Release Linked to Engineer/Site Inspection',
  'Direct Pay Order to Supplier',
  'Direct Account Credit',
];

export const COLLATERAL_CATEGORIES: CollateralCategory[] = [
  'Registered Project Land + Tripartite Agreement',
  'City Registered Land/Building',
  'Semi-Urban/Rural Land',
  'FDR/Cash',
  'Hypothecation Only',
];

export const COLLATERAL_LIQUIDITY_RISKS: CollateralLiquidityRisk[] = [
  'Clean Mutation & Easy Sale',
  'Minor Mutation Pending',
  'Agricultural/Low-Lying/Hard to Auction',
];

export function formatBDT(amount: number, showSign = false): string {
  if (!Number.isFinite(amount)) {
    return '৳ 0';
  }
  const rounded = Math.round(amount);
  const absFormatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(Math.abs(rounded));

  if (rounded < 0) {
    return `-৳ ${absFormatted}`;
  }
  if (showSign && rounded > 0) {
    return `+৳ ${absFormatted}`;
  }
  return `৳ ${absFormatted}`;
}

export function formatBDTScaleHint(amount: number): string {
  if (!Number.isFinite(amount) || amount === 0) {
    return '';
  }
  const abs = Math.abs(amount);
  const prefix = amount < 0 ? '-' : '';
  if (abs >= 10_000_000) {
    return `${prefix}${(abs / 10_000_000).toFixed(2)} Crore`;
  }
  if (abs >= 100_000) {
    return `${prefix}${(abs / 100_000).toFixed(2)} Lakh`;
  }
  return '';
}

export function formatPct(value: number, decimals = 1): string {
  if (!Number.isFinite(value)) {
    return '0.0%';
  }
  return `${value.toFixed(decimals)}%`;
}

export function formatDscr(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return 'N/A';
  }
  return `${value.toFixed(2)}x`;
}

export function calculateMonthlyEmi(
  principal: number,
  annualInterestRatePct: number,
  amortizationMonths: number,
): number {
  if (principal <= 0 || amortizationMonths <= 0) {
    return 0;
  }
  const monthlyRate = annualInterestRatePct / 100 / 12;
  if (monthlyRate <= 0) {
    return principal / amortizationMonths;
  }
  const factor = Math.pow(1 + monthlyRate, amortizationMonths);
  return (principal * monthlyRate * factor) / (factor - 1);
}

export function calculateMaxPrincipalFromEmi(
  monthlyEmi: number,
  annualInterestRatePct: number,
  amortizationMonths: number,
): number {
  if (monthlyEmi <= 0 || amortizationMonths <= 0) {
    return 0;
  }
  const monthlyRate = annualInterestRatePct / 100 / 12;
  if (monthlyRate <= 0) {
    return monthlyEmi * amortizationMonths;
  }
  const factor = Math.pow(1 + monthlyRate, amortizationMonths);
  return (monthlyEmi * (factor - 1)) / (monthlyRate * factor);
}

function getSectorInherentRiskPenalty(category: BusinessCategory): number {
  switch (category) {
    case 'Clinic / Diagnostic Center / Hospital / Pharmacy':
    case 'IT / Software / Educational Institution / Service Business':
      return 0; // lowest sector risk
    case 'Dealers & Brand Distributors (FMCG/Cement/Rod/Fertilizer)':
    case 'Agro-Trading / Rice Mill / Cold Storage':
    case 'Garments / Textile / Light Engineering Factory':
    case 'Exporter (RMG / Jute / Agro / Leather)':
      return 1;
    case 'Local Wholesale & Retail Shop (Hardware/Cloth/Grocery/Electronics)':
    case 'Importer':
    case 'Hotel / Resort / Restaurant / Bakery':
    case 'Bus / Truck / Commercial Transport':
      return 2;
    case 'LGED / Public Works Construction Contractor':
    case 'Poultry / Dairy / Fisheries Farm':
    case 'Online / E-Commerce / F-Commerce':
    case 'Brick Manufacturing (Ita Bhati)':
    case 'Real Estate & Land Developer':
      return 3; // high cyclicality / regulatory / biological / execution risk
  }
}

export function getSectorStressScenario(
  category: BusinessCategory,
): StressScenarioSpec {
  switch (category) {
    case 'Brick Manufacturing (Ita Bhati)':
      return {
        revenueShockPct: -15,
        costShockPct: 25,
        label: '+25% COGS/Fuel / -15% Sales',
        rationale:
          'Brick Kiln shock: +25% COGS/fuel spike and -15% sales from early rain wastage',
      };
    case 'LGED / Public Works Construction Contractor':
      return {
        revenueShockPct: -35,
        costShockPct: 0,
        label: '-35% Cash Inflow',
        rationale:
          'LGED Contractor shock: -35% realized monthly cash inflow from govt. bill delay & 10% retention lockup',
      };
    case 'Real Estate & Land Developer':
      return {
        revenueShockPct: -30,
        costShockPct: 20,
        label: '+20% Cost / -30% Inflow',
        rationale:
          'Real Estate shock: -30% flat installment inflow and +20% construction cost escalation',
      };
    case 'Dealers & Brand Distributors (FMCG/Cement/Rod/Fertilizer)':
      return {
        revenueShockPct: -20,
        costShockPct: 10,
        label: '+10% COGS / -20% Collection',
        rationale:
          'Brand Distributor shock: -20% cash collection (retailer baki freeze) and +10% COGS compression',
      };
    default:
      return {
        revenueShockPct: -15,
        costShockPct: 15,
        label: '+15% Cost / -15% Rev',
        rationale:
          'Baseline institutional shock: +15% input cost inflation & -15% sales/collection delay',
      };
  }
}

export function calculateBankingMetrics(
  input: LoanApplicationInput,
): CalculatedMetrics {
  const revenue = Math.max(0, input.monthlyRevenue || 0);
  const directCost = Math.max(0, input.directCost || 0);
  const fixed = Math.max(0, input.fixedExpenses || 0);
  const variable = Math.max(0, input.variableExpenses || 0);
  const drawings = Math.max(0, input.ownerMonthlyDrawings || 0);
  const existingBankDebt = Math.max(0, input.existingBankMonthlyEmi || 0);
  const informalDebt = Math.max(0, input.informalMonthlyDebt || 0);
  const totalExistingMonthlyDebt = existingBankDebt + informalDebt;

  const grossProfit = revenue - directCost;
  const grossMarginPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

  const operatingProfit = grossProfit - fixed - variable;
  const netOperatingMarginPct =
    revenue > 0 ? (operatingProfit / revenue) * 100 : 0;

  const cashAvailableForDebt = operatingProfit - drawings;
  const currentNetProfit = cashAvailableForDebt - totalExistingMonthlyDebt;

  // Bank Statement Truth & Window-Dressing Check
  const annualTurnover = Math.max(0, input.annualBankCreditTurnover || 0);
  const avgMonthlyBankDeposit = annualTurnover / 12;
  const bankTurnoverRatioPct =
    revenue > 0 ? (avgMonthlyBankDeposit / revenue) * 100 : 0;
  const bankTruthRedAlert = revenue > 0 && bankTurnoverRatioPct < 50;

  const last2MonthsTotal = Math.max(0, input.last2MonthsBankCreditTotal || 0);
  const last2MonthsAvgDeposit = last2MonthsTotal / 2;
  const earlier10MonthsTotal = Math.max(0, annualTurnover - last2MonthsTotal);
  const earlier10MonthsAvgDeposit = earlier10MonthsTotal / 10;

  let windowDressingSpikeRatio: number | null = null;
  if (last2MonthsTotal > 0 && annualTurnover > 0) {
    if (earlier10MonthsAvgDeposit > 0) {
      windowDressingSpikeRatio =
        last2MonthsAvgDeposit / earlier10MonthsAvgDeposit;
    } else {
      windowDressingSpikeRatio = 99.9;
    }
  }
  const windowDressingAlert =
    windowDressingSpikeRatio !== null && windowDressingSpikeRatio > 2.2;

  // Cash Conversion Cycle (CCC)
  const inventoryVal = Math.max(0, input.inventoryWipValue || 0);
  const dailyDirectCost = directCost > 0 ? directCost / 30 : 0;
  const inventoryDays = dailyDirectCost > 0 ? inventoryVal / dailyDirectCost : 0;
  const receivableDays = Math.max(0, input.receivableDays || 0);
  const payableDays = Math.max(0, input.payableDays || 0);
  const cccDays = inventoryDays + receivableDays - payableDays;
  const cccWarning = cccDays > 75;

  // Facility & EMI
  const requestedLoan = Math.max(0, input.requestedLoanAmount || 0);
  const ratePct = Math.max(0, input.annualInterestRate || 0);
  const tenure = Math.max(1, input.loanTenureMonths || 1);
  const grace = Math.min(
    Math.max(0, input.gracePeriodMonths || 0),
    Math.max(0, tenure - 1),
  );
  const amortizationMonths = Math.max(1, tenure - grace);

  const estimatedMonthlyEmi = calculateMonthlyEmi(
    requestedLoan,
    ratePct,
    amortizationMonths,
  );
  const gracePeriodMonthlyInterest = requestedLoan * (ratePct / 100 / 12);
  const totalPostLoanMonthlyDebt = totalExistingMonthlyDebt + estimatedMonthlyEmi;

  const currentDscr =
    totalExistingMonthlyDebt > 0
      ? cashAvailableForDebt / totalExistingMonthlyDebt
      : null;
  const postLoanDscr =
    totalPostLoanMonthlyDebt > 0
      ? cashAvailableForDebt / totalPostLoanMonthlyDebt
      : null;
  const postLoanNetCashFlow = cashAvailableForDebt - totalPostLoanMonthlyDebt;

  const equity = Math.max(0, input.ownerEquityNetWorth || 0);
  const facilityToEquityRatio = equity > 0 ? requestedLoan / equity : null;

  const totalRepayment =
    gracePeriodMonthlyInterest * grace +
    estimatedMonthlyEmi * amortizationMonths;
  const totalInterestPayable = Math.max(0, totalRepayment - requestedLoan);

  // Collateral Forced Sale Coverage
  const forcedSaleValue = Math.max(0, input.forcedSaleValue || 0);
  const ltvOnFsvPct =
    forcedSaleValue > 0 ? (requestedLoan / forcedSaleValue) * 100 : null;
  const fsvCoveragePct =
    requestedLoan > 0 ? (forcedSaleValue / requestedLoan) * 100 : null;

  // Sector-Specific Stress Test
  const stressScenario = getSectorStressScenario(input.businessCategory);
  const stressedRevenue = revenue * (1 + stressScenario.revenueShockPct / 100);
  const stressedDirectCost = directCost * (1 + stressScenario.costShockPct / 100);
  const stressedOperatingProfit =
    stressedRevenue - stressedDirectCost - fixed - variable;
  const stressedCashAvailableForDebt = stressedOperatingProfit - drawings;
  const stressedNetCashFlow =
    stressedCashAvailableForDebt - totalPostLoanMonthlyDebt;
  const stressedPostLoanDscr =
    totalPostLoanMonthlyDebt > 0
      ? stressedCashAvailableForDebt / totalPostLoanMonthlyDebt
      : null;
  const stressCoversEmi =
    stressedCashAvailableForDebt >= totalPostLoanMonthlyDebt &&
    totalPostLoanMonthlyDebt > 0;
  const sectorStressBreach =
    revenue > 0 &&
    totalPostLoanMonthlyDebt > 0 &&
    stressedPostLoanDscr !== null &&
    stressedPostLoanDscr < 1.1;

  // Working Capital & Safe Limit-Sizing Calculator (Minimum Safe Stressed DSCR = 1.25x)
  const minSafeStressedDscrTarget = 1.25;
  const maxTotalSafeMonthlyDebtBdt =
    stressedCashAvailableForDebt > 0
      ? stressedCashAvailableForDebt / minSafeStressedDscrTarget
      : 0;
  const maxSafeNewMonthlyEmiBdt = Math.max(
    0,
    maxTotalSafeMonthlyDebtBdt - totalExistingMonthlyDebt,
  );
  const recommendedSafeLoanLimitBdt = Math.max(
    0,
    Math.round(
      calculateMaxPrincipalFromEmi(
        maxSafeNewMonthlyEmiBdt,
        ratePct,
        amortizationMonths,
      ),
    ),
  );
  const overLeveragedRequestAlert =
    requestedLoan > 0 && requestedLoan > recommendedSafeLoanLimitBdt;
  const overLeveragedReductionBdt = overLeveragedRequestAlert
    ? requestedLoan - recommendedSafeLoanLimitBdt
    : 0;
  const safeLimitHeadroomBdt = Math.max(
    0,
    recommendedSafeLoanLimitBdt - requestedLoan,
  );

  // --- ICRRS-Style Credit Score (60% Quantitative + 40% Qualitative) ---
  // QUANTITATIVE (max 60 pts):
  // 1. DSCR & Stress Resilience (max 25)
  let dscrAndStressPts = 0;
  if (postLoanDscr !== null) {
    if (postLoanDscr >= 1.75) dscrAndStressPts += 17;
    else if (postLoanDscr >= 1.5) dscrAndStressPts += 14;
    else if (postLoanDscr >= 1.25) dscrAndStressPts += 10;
    else if (postLoanDscr >= 1.0) dscrAndStressPts += 5;
  }
  if (stressCoversEmi) dscrAndStressPts += 8;
  else if (stressedPostLoanDscr !== null && stressedPostLoanDscr >= 0.85) {
    dscrAndStressPts += 3;
  }

  // 2. Bank Turnover Match (max 15)
  let bankTurnoverPts = 0;
  if (revenue > 0) {
    if (bankTurnoverRatioPct >= 85) bankTurnoverPts = 15;
    else if (bankTurnoverRatioPct >= 70) bankTurnoverPts = 11;
    else if (bankTurnoverRatioPct >= 50) bankTurnoverPts = 7;
    else bankTurnoverPts = 0;
  }

  // 3. Leverage / Facility-to-Equity (max 10)
  let leveragePts = 0;
  if (facilityToEquityRatio !== null) {
    if (facilityToEquityRatio <= 0.75) leveragePts = 10;
    else if (facilityToEquityRatio <= 1.25) leveragePts = 8;
    else if (facilityToEquityRatio <= 2.0) leveragePts = 5;
    else if (facilityToEquityRatio <= 3.0) leveragePts = 2;
  }

  // 4. Cash Conversion Cycle (max 10)
  let cashCyclePts = 0;
  if (cccDays <= 35) cashCyclePts = 10;
  else if (cccDays <= 60) cashCyclePts = 8;
  else if (cccDays <= 75) cashCyclePts = 6;
  else if (cccDays <= 110) cashCyclePts = 3;
  else cashCyclePts = 1;

  const quantitativeScore =
    dscrAndStressPts + bankTurnoverPts + leveragePts + cashCyclePts; // / 60
  const quantitativePct = (quantitativeScore / 60) * 100;

  // QUALITATIVE (max 40 pts):
  // 1. CIB & Integrity (max 15)
  let cibIntegrityPts = 0;
  switch (input.cibStatus) {
    case 'Clean':
      cibIntegrityPts = 15;
      break;
    case 'Regular-SMA':
      cibIntegrityPts = 9;
      break;
    case 'Rescheduled Once':
      cibIntegrityPts = 4;
      break;
    case 'Multiple Rescheduled':
      cibIntegrityPts = 1;
      break;
    case 'Classified':
      cibIntegrityPts = 0;
      break;
  }

  // 2. Experience, Succession & KYC Compliance (max 10)
  let managementCompliancePts = 0;
  if (input.sectorExperienceYears >= 7) managementCompliancePts += 4;
  else if (input.sectorExperienceYears >= 4) managementCompliancePts += 2;
  else managementCompliancePts += 1;

  if (input.successionBackup === 'Active Partner/Next-Gen') {
    managementCompliancePts += 2;
  }
  if (input.compliance.validTradeLicense) managementCompliancePts += 1;
  if (input.compliance.updatedTinBin) managementCompliancePts += 1;
  if (input.compliance.siteAndStockVerified) managementCompliancePts += 1;
  if (input.compliance.zeroLegalOrNi138Cases) managementCompliancePts += 1;

  // 3. Sector Risk & Pricing Power (max 7)
  let sectorInflationPts = 4 - getSectorInherentRiskPenalty(input.businessCategory);
  if (input.pricingPower === 'High') sectorInflationPts += 3;
  else if (input.pricingPower === 'Medium') sectorInflationPts += 2;
  else sectorInflationPts += 0;
  sectorInflationPts = Math.max(0, Math.min(7, sectorInflationPts));

  // 4. Collateral Liquidity & FSV Cover (max 8)
  let collateralLiquidityPts = 0;
  if (fsvCoveragePct !== null) {
    if (fsvCoveragePct >= 130) collateralLiquidityPts += 5;
    else if (fsvCoveragePct >= 100) collateralLiquidityPts += 3;
    else if (fsvCoveragePct >= 70) collateralLiquidityPts += 1;
  }
  if (input.collateralType === 'FDR/Cash') {
    collateralLiquidityPts += 3;
  } else if (input.collateralLiquidityRisk === 'Clean Mutation & Easy Sale') {
    collateralLiquidityPts += 3;
  } else if (input.collateralLiquidityRisk === 'Minor Mutation Pending') {
    collateralLiquidityPts += 1;
  }

  const qualitativeScore =
    cibIntegrityPts +
    managementCompliancePts +
    sectorInflationPts +
    collateralLiquidityPts; // / 40
  const qualitativePct = (qualitativeScore / 40) * 100;

  const icrrsScore = Math.min(100, Math.max(0, quantitativeScore + qualitativeScore));

  // Bangladesh Bank ICRRS Override Rules:
  // 1. Quantitative Score < 30 / 60 (< 50% of Quantitative Pillar weight)
  // 2. CIB Status === 'Classified'
  const bbOverrideTriggered = quantitativeScore < 30 || quantitativePct < 50;
  const cibClassifiedOverrideTriggered = input.cibStatus === 'Classified';
  const isAutoDowngraded =
    bbOverrideTriggered || cibClassifiedOverrideTriggered;

  let autoDowngradeReason: string | null = null;
  if (bbOverrideTriggered && cibClassifiedOverrideTriggered) {
    autoDowngradeReason = `Quantitative score ${quantitativeScore}/60 (<30 floor) AND CIB Status is Classified`;
  } else if (bbOverrideTriggered) {
    autoDowngradeReason = `Quantitative score ${quantitativeScore}/60 is below Bangladesh Bank's 30/60 (50%) minimum floor`;
  } else if (cibClassifiedOverrideTriggered) {
    autoDowngradeReason = 'Bangladesh Bank CIB Status is Classified';
  }

  let icrrsGrade: IcrrsGrade;
  if (isAutoDowngraded) {
    icrrsGrade = 'UNACCEPTABLE (Auto-Downgraded)';
  } else if (icrrsScore < 60) {
    icrrsGrade = 'Unacceptable (<60)';
  } else if (icrrsScore >= 80) {
    icrrsGrade = 'Excellent (80+)';
  } else if (icrrsScore >= 70) {
    icrrsGrade = 'Good (70–79)';
  } else {
    icrrsGrade = 'Marginal (60–69)';
  }

  // Deterministic Forensic Red Flags & Early Risk Triggers (6 Core Checks)
  const forensicAlerts: ForensicAlertItem[] = [];

  // 1. ICRRS Quantitative Floor Breach (Crimson alert)
  if ((bbOverrideTriggered && revenue > 0) || cibClassifiedOverrideTriggered) {
    const reasons: string[] = [];
    if (bbOverrideTriggered && revenue > 0) {
      reasons.push(
        `Quantitative score is ${quantitativeScore}/60 (${quantitativePct.toFixed(0)}%, below Bangladesh Bank's 30/60 minimum floor)`,
      );
    }
    if (cibClassifiedOverrideTriggered) {
      reasons.push('Bangladesh Bank CIB status is Classified');
    }
    forensicAlerts.push({
      id: 'icrrs-floor-breach',
      code: 'TRIGGER 01 · ICRRS FLOOR',
      severity: 'Critical',
      tone: 'crimson',
      title: 'ICRRS Quantitative Floor Breach',
      metricSummary: `Quant ${quantitativeScore}/60 · CIB ${input.cibStatus} → UNACCEPTABLE (Auto-Downgraded)`,
      detail: `${reasons.join(' and ')}. Overall ICRRS grade automatically forced to UNACCEPTABLE (Auto-Downgraded).`,
    });
  }

  // 2. Bank Statement vs. Declared Sales Gap (Crimson/Amber alert)
  if (bankTruthRedAlert) {
    const isSevereGap = bankTurnoverRatioPct < 45;
    forensicAlerts.push({
      id: 'bank-sales-gap',
      code: 'TRIGGER 02 · BANK TRUTH GAP',
      severity: isSevereGap ? 'Critical' : 'High',
      tone: isSevereGap ? 'crimson' : 'amber',
      title: 'Bank Statement vs. Declared Sales Gap',
      metricSummary: `${bankTurnoverRatioPct.toFixed(1)}% Covered (${formatBDT(avgMonthlyBankDeposit)}/mo vs ${formatBDT(revenue)}/mo)`,
      detail: `Average monthly bank credits (${formatBDT(avgMonthlyBankDeposit)}/mo) cover only ${bankTurnoverRatioPct.toFixed(1)}% of declared monthly sales (${formatBDT(revenue)}/mo), falling below the 50% verification threshold (potential inflated turnover or off-book cash diversion).`,
    });
  }

  // 3. Window-Dressing Spike (Crimson alert)
  if (windowDressingAlert && windowDressingSpikeRatio !== null) {
    const ratioLabel =
      windowDressingSpikeRatio >= 90
        ? '>10.0x'
        : `${windowDressingSpikeRatio.toFixed(2)}x`;
    forensicAlerts.push({
      id: 'window-dressing-spike',
      code: 'TRIGGER 03 · WINDOW DRESSING',
      severity: 'Critical',
      tone: 'crimson',
      title: 'Window-Dressing Spike',
      metricSummary: `${ratioLabel} Pre-Loan Surge (>2.20x Threshold)`,
      detail: `Last 2 months' average bank deposits (${formatBDT(last2MonthsAvgDeposit)}/mo) jumped ${ratioLabel} compared to the earlier 10 months' average (${formatBDT(earlier10MonthsAvgDeposit)}/mo) right before loan application, signaling potential circular deposits or artificial statement padding.`,
    });
  }

  // 4. Cash Trap / Slow Cash Conversion (Amber alert)
  if (cccWarning) {
    forensicAlerts.push({
      id: 'cash-trap-ccc',
      code: 'TRIGGER 04 · CASH TRAP (CCC)',
      severity: 'High',
      tone: 'amber',
      title: 'Cash Trap / Slow Cash Conversion',
      metricSummary: `CCC ${Math.round(cccDays)} Days (>75d Limit)`,
      detail: `Cash Conversion Cycle is ${Math.round(cccDays)} days (Inventory ${Math.round(inventoryDays)}d + Receivables ${input.receivableDays}d − Payables ${input.payableDays}d), exceeding the 75-day ceiling and locking up cash too long relative to monthly debt service.`,
    });
  }

  // 5. Over-Leveraged Loan Request (Amber/Crimson alert)
  if (overLeveragedRequestAlert && revenue > 0) {
    const severeOverage =
      recommendedSafeLoanLimitBdt === 0 ||
      overLeveragedReductionBdt > recommendedSafeLoanLimitBdt * 0.25;
    forensicAlerts.push({
      id: 'over-leveraged-request',
      code: 'TRIGGER 05 · SAFE LIMIT BREACH',
      severity: severeOverage ? 'Critical' : 'High',
      tone: severeOverage ? 'crimson' : 'amber',
      title: 'Over-Leveraged Loan Request',
      metricSummary: `Overage: +${formatBDT(overLeveragedReductionBdt)} (Safe Cap: ${formatBDT(recommendedSafeLoanLimitBdt)})`,
      detail: `Requested loan of ${formatBDT(requestedLoan)} exceeds the NBCI Recommended Safe Loan Limit of ${formatBDT(recommendedSafeLoanLimitBdt)} (at 1.25x Stressed DSCR) by an exact overage of ${formatBDT(overLeveragedReductionBdt)}.`,
    });
  }

  // 6. Sector Stress Breach (Crimson/Amber alert: Stressed DSCR < 1.10x)
  if (sectorStressBreach) {
    const severeStress =
      stressedPostLoanDscr !== null && stressedPostLoanDscr < 1.0;
    forensicAlerts.push({
      id: 'sector-stress-breach',
      code: 'TRIGGER 06 · SECTOR STRESS',
      severity: severeStress ? 'Critical' : 'High',
      tone: severeStress ? 'crimson' : 'amber',
      title: 'Sector Stress Breach',
      metricSummary: `Stressed DSCR ${formatDscr(stressedPostLoanDscr)} (<1.10x Floor)`,
      detail: `Under active sector shock (${stressScenario.label} — ${stressScenario.rationale}), Stressed DSCR drops to ${formatDscr(stressedPostLoanDscr)} (below 1.10x resilience floor) with stressed net cash flow of ${formatBDT(stressedNetCashFlow, true)}/mo.`,
    });
  }

  const redFlagAlerts = forensicAlerts.map(
    (a) => `[${a.tone.toUpperCase()}] ${a.title} (${a.metricSummary}): ${a.detail}`,
  );

  return {
    grossProfit,
    grossMarginPct,
    operatingProfit,
    netOperatingMarginPct,
    cashAvailableForDebt,
    currentNetProfit,
    avgMonthlyBankDeposit,
    bankTurnoverRatioPct,
    bankTruthRedAlert,
    last2MonthsAvgDeposit,
    earlier10MonthsAvgDeposit,
    windowDressingSpikeRatio,
    windowDressingAlert,
    inventoryDays,
    cccDays,
    cccWarning,
    totalExistingMonthlyDebt,
    estimatedMonthlyEmi,
    gracePeriodMonthlyInterest,
    amortizationMonths,
    totalPostLoanMonthlyDebt,
    currentDscr,
    postLoanDscr,
    postLoanNetCashFlow,
    facilityToEquityRatio,
    totalInterestPayable,
    ltvOnFsvPct,
    fsvCoveragePct,
    stressScenario,
    stressedRevenue,
    stressedDirectCost,
    stressedOperatingProfit,
    stressedCashAvailableForDebt,
    stressedNetCashFlow,
    stressedPostLoanDscr,
    stressCoversEmi,
    sectorStressBreach,
    minSafeStressedDscrTarget,
    maxTotalSafeMonthlyDebtBdt,
    maxSafeNewMonthlyEmiBdt,
    recommendedSafeLoanLimitBdt,
    overLeveragedRequestAlert,
    overLeveragedReductionBdt,
    safeLimitHeadroomBdt,
    icrrsScore,
    icrrsGrade,
    icrrsBreakdown: {
      quantitativeScore,
      qualitativeScore,
      quantitativePct,
      qualitativePct,
      bbOverrideTriggered,
      cibClassifiedOverrideTriggered,
      autoDowngradeReason,
      dscrAndStressPts,
      bankTurnoverPts,
      leveragePts,
      cashCyclePts,
      cibIntegrityPts,
      managementCompliancePts,
      sectorInflationPts,
      collateralLiquidityPts,
    },
    redFlagAlerts,
    forensicAlerts,
  };
}

export const DEFAULT_SECTOR_DATA: SectorSpecificData = {
  realEstateLandType: 'Joint Venture with Registered Power of Attorney',
  realEstateApprovedPlan: 'Yes',
  realEstateTotalProjectCost: 48000000,
  realEstateFlatsPreSoldPct: 45,
  realEstatePhysicalCompletionPct: 35,
  realEstateMonthsToHandover: 18,

  contractorActiveWorkOrderValue: 22000000,
  contractorWorkCompletedPct: 40,
  contractorGovtBillDelayMonths: 5,
  contractorRetentionMoneyLocked: 1850000,

  dealerPrincipalBrand: 'BSRM / LafargeHolcim / Fresh',
  dealerMonthlyTarget: 6500000,
  dealerUncollectedBaki: 2400000,
  dealerMarginAndBonusPct: 6.5,

  transportVehicleCount: 6,
  transportDailyNetTripCollection: 38000,
  transportInsurancePermitValid: 'Yes',
  transportAvgVehicleAgeYears: 4,

  brickOperatingMonthsPerYear: 6,
  brickAdvanceDadanSoilCoalPaid: 5200000,
  brickEnvDcLicenseValid: 'Yes',
  brickUnbakedRainRisk: 'High',

  agroStockValue: 4500000,
  agroPriceVolatility: 'Medium',
  agroPowerReliability: 'Good',
  agroMoistureSpoilageRisk: 'Medium',

  farmFlockHerdPondValue: 3800000,
  farmBiosecurityProtocol: 'Basic',
  farmFeedCostPctOfRevenue: 68,
  farmDiseaseHistory: 'None',

  clinicDoctorDependency: 'Medium',
  clinicMedicalEquipmentValue: 14500000,
  clinicDailyPatientCount: 165,
  clinicDghsLicenseValid: 'Yes',

  importerImportedInventoryPct: 90,
  importerLcMarginPaidPct: 25,
  importerFxExposure: 'High',
  importerPortClearanceDays: 18,

  exporterConfirmedLcValue: 18000000,
  exporterSingleBuyerSharePct: 45,
  exporterShipmentLeadTimeDays: 45,
  exporterComplianceStatus: 'Fully Compliant',

  factoryCapacityUtilizationPct: 78,
  factoryWorkerCount: 120,
  factoryUtilityStability: 'Good',
  factoryOrderBacklogMonths: 4,

  hospitalityMonthsOpen: 36,
  hospitalityRentToSalesPct: 16,
  hospitalityOccupancyTurnoverPct: 68,
  hospitalityFoodWastagePct: 6,

  retailSeasonalPeakDependency: 'Medium',
  retailDeadStockPct: 8,
  retailAvgBakiDays: 25,
  retailShopOwnership: 'Rented',

  onlineMonthlyAdSpend: 180000,
  onlineReturnCancellationPct: 14,
  onlineCodSettlementDays: 8,
  onlineRepeatCustomerRatePct: 28,

  serviceRecurringRevenuePct: 65,
  serviceKeyPersonDependency: 'Medium',
  serviceReceivableCollectionDays: 30,
};

export const EMPTY_LOAN_INPUT: LoanApplicationInput = {
  businessName: '',
  ownerMdName: '',
  districtCity: '',
  yearsInOperation: 4,
  legalStructure: 'Proprietorship',
  businessCategory: 'Real Estate & Land Developer',
  sectorData: { ...DEFAULT_SECTOR_DATA },
  businessModelDescription: '',

  cibStatus: 'Clean',
  ownerAge: 44,
  sectorExperienceYears: 6,
  successionBackup: 'Active Partner/Next-Gen',
  compliance: {
    validTradeLicense: true,
    updatedTinBin: true,
    siteAndStockVerified: true,
    zeroLegalOrNi138Cases: true,
  },

  monthlyRevenue: 0,
  annualBankCreditTurnover: 0,
  last2MonthsBankCreditTotal: 0,
  directCost: 0,
  fixedExpenses: 0,
  variableExpenses: 0,
  ownerMonthlyDrawings: 0,

  inventoryWipValue: 0,
  receivableDays: 30,
  payableDays: 15,
  pricingPower: 'Medium',
  inputCostInflationSensitivity: 'Medium',
  inflationNotes: '',

  ownerEquityNetWorth: 0,
  existingBankMonthlyEmi: 0,
  informalMonthlyDebt: 0,

  facilityType: 'Term Loan',
  requestedLoanAmount: 0,
  annualInterestRate: 13.5,
  loanTenureMonths: 36,
  gracePeriodMonths: 0,
  executionPlan: '',
  disbursementControl: 'Direct Pay Order to Supplier',

  collateralType: 'City Registered Land/Building',
  collateralMarketValue: 0,
  forcedSaleValue: 0,
  collateralLiquidityRisk: 'Clean Mutation & Easy Sale',
  collateralNotes: '',
};

export interface SamplePreset {
  id: string;
  buttonLabel: string;
  data: LoanApplicationInput;
}

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'real-estate',
    buttonLabel: 'Sample: Real Estate Developer',
    data: {
      businessName: 'Rupayan Crest Developments Ltd.',
      ownerMdName: 'Engr. Tariqul Islam Chowdhury',
      districtCity: 'Uttara Sector 11, Dhaka',
      yearsInOperation: 9,
      legalStructure: 'Pvt. Ltd. Company',
      businessCategory: 'Real Estate & Land Developer',
      sectorData: {
        ...DEFAULT_SECTOR_DATA,
        realEstateLandType: 'Joint Venture with Registered Power of Attorney',
        realEstateApprovedPlan: 'Yes',
        realEstateTotalProjectCost: 62000000,
        realEstateFlatsPreSoldPct: 45,
        realEstatePhysicalCompletionPct: 42,
        realEstateMonthsToHandover: 16,
      },
      businessModelDescription:
        'Mid-size residential G+8 apartment developer building 16 flats (1,550 sq ft each) on a 7-katha JV plot in Uttara under registered Power of Attorney (50:50 landowner sharing). Collections rely on milestone-linked flat buyer installments.',

      cibStatus: 'Clean',
      ownerAge: 49,
      sectorExperienceYears: 11,
      successionBackup: 'Active Partner/Next-Gen',
      compliance: {
        validTradeLicense: true,
        updatedTinBin: true,
        siteAndStockVerified: true,
        zeroLegalOrNi138Cases: true,
      },

      monthlyRevenue: 5200000,
      annualBankCreditTurnover: 54000000, // 86.5% via bank
      last2MonthsBankCreditTotal: 9600000, // 1.08x steady deposits
      directCost: 3580000,
      fixedExpenses: 340000,
      variableExpenses: 220000,
      ownerMonthlyDrawings: 180000,

      inventoryWipValue: 16500000,
      receivableDays: 45,
      payableDays: 30,
      pricingPower: 'Low',
      inputCostInflationSensitivity: 'High',
      inflationNotes:
        '45% of flats are pre-sold on fixed-price deeds; spikes in 72-grade MS rod, cement, and finishing tiles cannot be passed onto pre-sold buyers.',

      ownerEquityNetWorth: 24000000,
      existingBankMonthlyEmi: 210000,
      informalMonthlyDebt: 0,

      facilityType: 'Project Finance',
      requestedLoanAmount: 15000000,
      annualInterestRate: 13.75,
      loanTenureMonths: 36,
      gracePeriodMonths: 6,
      executionPlan:
        'Deploy ৳1,50,00,000 in 3 engineering-verified tranches strictly for structural roof casting (floors 5–8), brick/plaster work, and lift/substation procurement to reach handover within 16 months.',
      disbursementControl: 'Tranche Release Linked to Engineer/Site Inspection',

      collateralType: 'Registered Project Land + Tripartite Agreement',
      collateralMarketValue: 26000000,
      forcedSaleValue: 19500000,
      collateralLiquidityRisk: 'Clean Mutation & Easy Sale',
      collateralNotes:
        'Tripartite mortgage over developer 50% share (8 flats) + RAJUK-approved building plan + assignment of pre-sold flat installment receivables.',
    },
  },
  {
    id: 'brand-distributor',
    buttonLabel: 'Sample: Brand Distributor',
    data: {
      businessName: 'Mymensingh Meghna Enterprise',
      ownerMdName: 'Md. Shahidul Haque Bhuiyan',
      districtCity: 'Choto Bazar, Mymensingh',
      yearsInOperation: 12,
      legalStructure: 'Proprietorship',
      businessCategory:
        'Dealers & Brand Distributors (FMCG/Cement/Rod/Fertilizer)',
      sectorData: {
        ...DEFAULT_SECTOR_DATA,
        dealerPrincipalBrand: 'Fresh / Meghna Group FMCG & Cement',
        dealerMonthlyTarget: 7500000,
        dealerUncollectedBaki: 2950000,
        dealerMarginAndBonusPct: 6.2,
      },
      businessModelDescription:
        'Authorized district distributor for Meghna Group (edible oil, atta, sugar, cement) supplying 320 upazila grocery and hardware retailers. Pays principal company via advance RTGS and extends 15–25 day Baki to sub-dealers.',

      cibStatus: 'Clean',
      ownerAge: 46,
      sectorExperienceYears: 12,
      successionBackup: 'Active Partner/Next-Gen',
      compliance: {
        validTradeLicense: true,
        updatedTinBin: true,
        siteAndStockVerified: true,
        zeroLegalOrNi138Cases: true,
      },

      monthlyRevenue: 7400000,
      annualBankCreditTurnover: 81600000, // 91.9% verified
      last2MonthsBankCreditTotal: 14200000, // 1.05x steady deposits
      directCost: 6780000,
      fixedExpenses: 165000,
      variableExpenses: 135000,
      ownerMonthlyDrawings: 85000,

      inventoryWipValue: 3200000,
      receivableDays: 18,
      payableDays: 6,
      pricingPower: 'Medium',
      inputCostInflationSensitivity: 'Medium',
      inflationNotes:
        'Company MRP resets rapidly, but rising diesel pickup-van delivery costs and seasonal target pressure force higher credit Baki to retailers.',

      ownerEquityNetWorth: 5400000,
      existingBankMonthlyEmi: 65000,
      informalMonthlyDebt: 0,

      facilityType: 'Working Capital CC-Hypo',
      requestedLoanAmount: 3500000,
      annualInterestRate: 13.25,
      loanTenureMonths: 36,
      gracePeriodMonths: 0,
      executionPlan:
        'Utilize ৳35,00,000 solely via direct bank RTGS/Pay Order to principal brand company to qualify for 1.5% monthly volume slab target bonus and eliminate cash-shortage stockouts.',
      disbursementControl: 'Direct Pay Order to Supplier',

      collateralType: 'City Registered Land/Building',
      collateralMarketValue: 5800000,
      forcedSaleValue: 4500000,
      collateralLiquidityRisk: 'Clean Mutation & Easy Sale',
      collateralNotes:
        'Registered mortgage on 5 decimal commercial shop-cum-godown in Mymensingh municipal area with verified CS/SA/RS & mutation.',
    },
  },
  {
    id: 'brick-kiln',
    buttonLabel: 'Sample: Brick Kiln',
    data: {
      businessName: 'Jamuna Eco Zig-Zag Bricks',
      ownerMdName: 'Alhaj Mozammel Hossain',
      districtCity: 'Madhupur, Tangail',
      yearsInOperation: 7,
      legalStructure: 'Partnership',
      businessCategory: 'Brick Manufacturing (Ita Bhati)',
      sectorData: {
        ...DEFAULT_SECTOR_DATA,
        brickOperatingMonthsPerYear: 6,
        brickAdvanceDadanSoilCoalPaid: 6800000,
        brickEnvDcLicenseValid: 'Yes',
        brickUnbakedRainRisk: 'High',
      },
      businessModelDescription:
        'Zig-zag brick kiln operating 6 dry months (Nov–Apr). Disburses heavy pre-season Dadan advances to Sardar labor gangs and stockpiles imported coal and alluvial clay in Oct–Nov before brick firing peaks in Jan–Mar.',

      cibStatus: 'Regular-SMA',
      ownerAge: 53,
      sectorExperienceYears: 10,
      successionBackup: 'Sole Owner Only',
      compliance: {
        validTradeLicense: true,
        updatedTinBin: true,
        siteAndStockVerified: true,
        zeroLegalOrNi138Cases: true,
      },

      monthlyRevenue: 3600000,
      annualBankCreditTurnover: 25200000, // 58.3% bank verified (many cash sales)
      last2MonthsBankCreditTotal: 5200000, // 1.30x seasonal firing ramp
      directCost: 2450000,
      fixedExpenses: 220000,
      variableExpenses: 260000,
      ownerMonthlyDrawings: 140000,

      inventoryWipValue: 6400000,
      receivableDays: 32,
      payableDays: 14,
      pricingPower: 'Medium',
      inputCostInflationSensitivity: 'High',
      inflationNotes:
        'Imported coal prices and diesel tractor transport fluctuate sharply; unseasonal Norwester (Kalboishakhi) rains can destroy 20–30% of sun-dried green bricks.',

      ownerEquityNetWorth: 6200000,
      existingBankMonthlyEmi: 120000,
      informalMonthlyDebt: 40000,

      facilityType: 'Working Capital CC-Hypo',
      requestedLoanAmount: 4000000,
      annualInterestRate: 14.0,
      loanTenureMonths: 24,
      gracePeriodMonths: 4,
      executionPlan:
        'Procure 350 MT imported coal upfront before winter firing cycle (৳28,00,000 via supplier Pay Order) and fund ৳12,00,000 clay/molding operations; repay from peak Feb–May brick sales.',
      disbursementControl: 'Direct Pay Order to Supplier',

      collateralType: 'Semi-Urban/Rural Land',
      collateralMarketValue: 6500000,
      forcedSaleValue: 4200000,
      collateralLiquidityRisk: 'Agricultural/Low-Lying/Hard to Auction',
      collateralNotes:
        '32 decimal kiln-adjacent rural land in Madhupur; lower third-party auction demand if defaulted.',
    },
  },
  {
    id: 'lged-contractor',
    buttonLabel: 'Sample: LGED Contractor',
    data: {
      businessName: 'Brahmaputra Builders & Associates',
      ownerMdName: 'Md.Kamrul Hasan',
      districtCity: 'Jamalpur Sadar',
      yearsInOperation: 11,
      legalStructure: 'Proprietorship',
      businessCategory: 'LGED / Public Works Construction Contractor',
      sectorData: {
        ...DEFAULT_SECTOR_DATA,
        contractorActiveWorkOrderValue: 21500000,
        contractorWorkCompletedPct: 38,
        contractorGovtBillDelayMonths: 5.5,
        contractorRetentionMoneyLocked: 2150000,
      },
      businessModelDescription:
        'Class-1 enlisted contractor executing LGED rural road carpeting and box culverts. Pays site labor weekly in cash while running bills face 4–6 month ministry fund release delays and 10% security retention deductions.',

      cibStatus: 'Rescheduled Once',
      ownerAge: 52,
      sectorExperienceYears: 11,
      successionBackup: 'Sole Owner Only',
      compliance: {
        validTradeLicense: true,
        updatedTinBin: true,
        siteAndStockVerified: true,
        zeroLegalOrNi138Cases: false,
      },

      monthlyRevenue: 3400000,
      annualBankCreditTurnover: 16320000, // 40% -> Red Alert!
      last2MonthsBankCreditTotal: 6000000, // 2.91x spike -> Window Dressing Alert!
      directCost: 2510000,
      fixedExpenses: 195000,
      variableExpenses: 175000,
      ownerMonthlyDrawings: 120000,

      inventoryWipValue: 2200000,
      receivableDays: 140,
      payableDays: 22,
      pricingPower: 'Low',
      inputCostInflationSensitivity: 'High',
      inflationNotes:
        'Fixed government tender rates with zero escalation clause; MS rod, bitumen, and diesel surges erode margin directly.',

      ownerEquityNetWorth: 3100000,
      existingBankMonthlyEmi: 145000,
      informalMonthlyDebt: 55000,

      facilityType: 'Working Capital CC-Hypo',
      requestedLoanAmount: 5000000,
      annualInterestRate: 14.25,
      loanTenureMonths: 36,
      gracePeriodMonths: 3,
      executionPlan:
        'Purchase MS rod, bitumen, and stone chips to achieve 70% physical progress on two LGED road packages before monsoon, expecting running bill realization in 5 months.',
      disbursementControl: 'Tranche Release Linked to Engineer/Site Inspection',

      collateralType: 'Semi-Urban/Rural Land',
      collateralMarketValue: 5900000,
      forcedSaleValue: 4100000,
      collateralLiquidityRisk: 'Minor Mutation Pending',
      collateralNotes:
        '6.5 decimal municipal-fringe plot in Jamalpur; mutation update pending on 1.5 decimal share.',
    },
  },
  {
    id: 'diagnostic-clinic',
    buttonLabel: 'Sample: Diagnostic Clinic',
    data: {
      businessName: 'Padma Square Specialized Diagnostics',
      ownerMdName: 'Dr. Farhana Yasmin & Partners',
      districtCity: 'Laksham Road, Cumilla',
      yearsInOperation: 6,
      legalStructure: 'Partnership',
      businessCategory: 'Clinic / Diagnostic Center / Hospital / Pharmacy',
      sectorData: {
        ...DEFAULT_SECTOR_DATA,
        clinicDoctorDependency: 'Medium',
        clinicMedicalEquipmentValue: 18500000,
        clinicDailyPatientCount: 195,
        clinicDghsLicenseValid: 'Yes',
      },
      businessModelDescription:
        'Established 195-patient/day pathology, 4D ultrasound, digital X-ray, and pharmacy center in Cumilla town with 14 visiting specialist consultants and 100% cash/MFS patient billing at counter.',

      cibStatus: 'Clean',
      ownerAge: 43,
      sectorExperienceYears: 9,
      successionBackup: 'Active Partner/Next-Gen',
      compliance: {
        validTradeLicense: true,
        updatedTinBin: true,
        siteAndStockVerified: true,
        zeroLegalOrNi138Cases: true,
      },

      monthlyRevenue: 4400000,
      annualBankCreditTurnover: 47520000, // 90% deposited in bank
      last2MonthsBankCreditTotal: 8400000, // 1.07x steady deposits
      directCost: 1680000,
      fixedExpenses: 850000,
      variableExpenses: 410000,
      ownerMonthlyDrawings: 160000,

      inventoryWipValue: 1450000,
      receivableDays: 5,
      payableDays: 25,
      pricingPower: 'High',
      inputCostInflationSensitivity: 'Medium',
      inflationNotes:
        'Imported diagnostic reagents and X-ray films track USD/BDT rates, but private diagnostic test tariffs adjust every 6 months with strong patient inelasticity.',

      ownerEquityNetWorth: 13500000,
      existingBankMonthlyEmi: 180000,
      informalMonthlyDebt: 0,

      facilityType: 'Term Loan',
      requestedLoanAmount: 4500000,
      annualInterestRate: 13.0,
      loanTenureMonths: 48,
      gracePeriodMonths: 2,
      executionPlan:
        'Import and install a refurbished Siemens 16-Slice CT Scanner (৳45,00,000 bank finance + ৳15,00,000 owner equity via Direct Pay Order / LC to authorized medical distributor), targeting 12 CT scans/day at ৳3,500 avg fee.',
      disbursementControl: 'Direct Pay Order to Supplier',

      collateralType: 'City Registered Land/Building',
      collateralMarketValue: 10500000,
      forcedSaleValue: 8200000,
      collateralLiquidityRisk: 'Clean Mutation & Easy Sale',
      collateralNotes:
        'Registered mortgage on 4.5 decimal commercial floor space in Cumilla city center plus hypothecation of CT scanner.',
    },
  },
];
