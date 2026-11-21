export type BusinessCategory =
  | 'Real Estate & Land Developer'
  | 'LGED / Public Works Construction Contractor'
  | 'Dealers & Brand Distributors (FMCG/Cement/Rod/Fertilizer)'
  | 'Bus / Truck / Commercial Transport'
  | 'Brick Manufacturing (Ita Bhati)'
  | 'Agro-Trading / Rice Mill / Cold Storage'
  | 'Poultry / Dairy / Fisheries Farm'
  | 'Clinic / Diagnostic Center / Hospital / Pharmacy'
  | 'Importer'
  | 'Exporter (RMG / Jute / Agro / Leather)'
  | 'Garments / Textile / Light Engineering Factory'
  | 'Hotel / Resort / Restaurant / Bakery'
  | 'Local Wholesale & Retail Shop (Hardware/Cloth/Grocery/Electronics)'
  | 'Online / E-Commerce / F-Commerce'
  | 'IT / Software / Educational Institution / Service Business';

export type LegalStructure =
  | 'Proprietorship'
  | 'Partnership'
  | 'Pvt. Ltd. Company';

export type CibStatus =
  | 'Clean'
  | 'Regular-SMA'
  | 'Rescheduled Once'
  | 'Multiple Rescheduled'
  | 'Classified';

export type SuccessionBackup = 'Active Partner/Next-Gen' | 'Sole Owner Only';

export type PricingPowerLevel = 'Low' | 'Medium' | 'High';
export type ExposureLevel = 'Low' | 'Medium' | 'High';
export type YesNo = 'Yes' | 'No';

export type FacilityType =
  | 'Term Loan'
  | 'Project Finance'
  | 'Working Capital CC-Hypo'
  | 'Overdraft'
  | 'LC-LTR';

export type DisbursementControl =
  | 'Tranche Release Linked to Engineer/Site Inspection'
  | 'Direct Pay Order to Supplier'
  | 'Direct Account Credit';

export type CollateralCategory =
  | 'Registered Project Land + Tripartite Agreement'
  | 'City Registered Land/Building'
  | 'Semi-Urban/Rural Land'
  | 'FDR/Cash'
  | 'Hypothecation Only';

export type CollateralLiquidityRisk =
  | 'Clean Mutation & Easy Sale'
  | 'Minor Mutation Pending'
  | 'Agricultural/Low-Lying/Hard to Auction';

export interface ComplianceChecklist {
  validTradeLicense: boolean;
  updatedTinBin: boolean;
  siteAndStockVerified: boolean;
  zeroLegalOrNi138Cases: boolean;
}

export interface SectorSpecificData {
  // 1. Real Estate & Land Developer
  realEstateLandType:
    | 'Own Land'
    | 'Joint Venture with Registered Power of Attorney'
    | 'JV Unregistered';
  realEstateApprovedPlan: YesNo;
  realEstateTotalProjectCost: number;
  realEstateFlatsPreSoldPct: number;
  realEstatePhysicalCompletionPct: number;
  realEstateMonthsToHandover: number;

  // 2. LGED / Public Works Construction Contractor
  contractorActiveWorkOrderValue: number;
  contractorWorkCompletedPct: number;
  contractorGovtBillDelayMonths: number;
  contractorRetentionMoneyLocked: number;

  // 3. Dealers & Brand Distributors
  dealerPrincipalBrand: string;
  dealerMonthlyTarget: number;
  dealerUncollectedBaki: number;
  dealerMarginAndBonusPct: number;

  // 4. Bus / Truck / Commercial Transport
  transportVehicleCount: number;
  transportDailyNetTripCollection: number;
  transportInsurancePermitValid: YesNo;
  transportAvgVehicleAgeYears: number;

  // 5. Brick Manufacturing (Ita Bhati)
  brickOperatingMonthsPerYear: number;
  brickAdvanceDadanSoilCoalPaid: number;
  brickEnvDcLicenseValid: YesNo;
  brickUnbakedRainRisk: ExposureLevel;

  // 6. Agro-Trading / Rice Mill / Cold Storage
  agroStockValue: number;
  agroPriceVolatility: ExposureLevel;
  agroPowerReliability: 'Good' | 'Poor';
  agroMoistureSpoilageRisk: ExposureLevel;

  // 7. Poultry / Dairy / Fisheries Farm
  farmFlockHerdPondValue: number;
  farmBiosecurityProtocol: 'Strong' | 'Basic' | 'Weak';
  farmFeedCostPctOfRevenue: number;
  farmDiseaseHistory: 'None' | 'Minor Seasonal' | 'Recent Outbreak';

  // 8. Clinic / Diagnostic Center / Hospital / Pharmacy
  clinicDoctorDependency: ExposureLevel;
  clinicMedicalEquipmentValue: number;
  clinicDailyPatientCount: number;
  clinicDghsLicenseValid: YesNo;

  // 9. Importer
  importerImportedInventoryPct: number;
  importerLcMarginPaidPct: number;
  importerFxExposure: ExposureLevel;
  importerPortClearanceDays: number;

  // 10. Exporter (RMG / Jute / Agro / Leather)
  exporterConfirmedLcValue: number;
  exporterSingleBuyerSharePct: number;
  exporterShipmentLeadTimeDays: number;
  exporterComplianceStatus: 'Fully Compliant' | 'Partial' | 'Non-Compliant';

  // 11. Garments / Textile / Light Engineering Factory
  factoryCapacityUtilizationPct: number;
  factoryWorkerCount: number;
  factoryUtilityStability: 'Good' | 'Disrupted';
  factoryOrderBacklogMonths: number;

  // 12. Hotel / Resort / Restaurant / Bakery
  hospitalityMonthsOpen: number;
  hospitalityRentToSalesPct: number;
  hospitalityOccupancyTurnoverPct: number;
  hospitalityFoodWastagePct: number;

  // 13. Local Wholesale & Retail Shop
  retailSeasonalPeakDependency: ExposureLevel;
  retailDeadStockPct: number;
  retailAvgBakiDays: number;
  retailShopOwnership: 'Owned' | 'Rented';

  // 14. Online / E-Commerce / F-Commerce
  onlineMonthlyAdSpend: number;
  onlineReturnCancellationPct: number;
  onlineCodSettlementDays: number;
  onlineRepeatCustomerRatePct: number;

  // 15. IT / Software / Educational Institution / Service Business
  serviceRecurringRevenuePct: number;
  serviceKeyPersonDependency: ExposureLevel;
  serviceReceivableCollectionDays: number;
}

export interface LoanApplicationInput {
  // Tab 1: Business Sector & Profile
  businessName: string;
  ownerMdName: string;
  districtCity: string;
  yearsInOperation: number;
  legalStructure: LegalStructure;
  businessCategory: BusinessCategory;
  sectorData: SectorSpecificData;
  businessModelDescription: string;

  // Tab 2: KYC, CIB & Management Integrity
  cibStatus: CibStatus;
  ownerAge: number;
  sectorExperienceYears: number;
  successionBackup: SuccessionBackup;
  compliance: ComplianceChecklist;

  // Tab 3: Forensic Cash, Project Budget & Profit Verification
  monthlyRevenue: number;
  annualBankCreditTurnover: number;
  last2MonthsBankCreditTotal: number;
  directCost: number;
  fixedExpenses: number;
  variableExpenses: number;
  ownerMonthlyDrawings: number;

  // Tab 4: Working Capital & Inflation Sensitivity
  inventoryWipValue: number;
  receivableDays: number;
  payableDays: number;
  pricingPower: PricingPowerLevel;
  inputCostInflationSensitivity: ExposureLevel;
  inflationNotes: string;

  // Tab 5: Capital Structure & Existing Liabilities
  ownerEquityNetWorth: number;
  existingBankMonthlyEmi: number;
  informalMonthlyDebt: number;

  // Tab 6: Requested Loan, Investment Execution & Collateral
  facilityType: FacilityType;
  requestedLoanAmount: number;
  annualInterestRate: number;
  loanTenureMonths: number;
  gracePeriodMonths: number;
  executionPlan: string;
  disbursementControl: DisbursementControl;

  collateralType: CollateralCategory;
  collateralMarketValue: number;
  forcedSaleValue: number;
  collateralLiquidityRisk: CollateralLiquidityRisk;
  collateralNotes: string;
}

export type IcrrsGrade =
  | 'Excellent (80+)'
  | 'Good (70–79)'
  | 'Marginal (60–69)'
  | 'Unacceptable (<60)'
  | 'UNACCEPTABLE (Auto-Downgraded)';

export interface StressScenarioSpec {
  revenueShockPct: number;
  costShockPct: number;
  label: string;
  rationale: string;
}

export interface ForensicAlertItem {
  id: string;
  code: string;
  severity: 'Critical' | 'High' | 'Moderate';
  title: string;
  detail: string;
}

export interface IcrrsBreakdown {
  quantitativeScore: number; // max 60
  qualitativeScore: number; // max 40
  quantitativePct: number;
  qualitativePct: number;
  bbOverrideTriggered: boolean;
  cibClassifiedOverrideTriggered: boolean;
  autoDowngradeReason: string | null;
  // Quantitative sub-scores
  dscrAndStressPts: number; // max 25
  bankTurnoverPts: number; // max 15
  leveragePts: number; // max 10
  cashCyclePts: number; // max 10
  // Qualitative sub-scores
  cibIntegrityPts: number; // max 15
  managementCompliancePts: number; // max 10
  sectorInflationPts: number; // max 7
  collateralLiquidityPts: number; // max 8
}

export interface CalculatedMetrics {
  grossProfit: number;
  grossMarginPct: number;
  operatingProfit: number;
  netOperatingMarginPct: number;
  cashAvailableForDebt: number;
  currentNetProfit: number;

  // Bank Statement Truth & Window-Dressing Check
  avgMonthlyBankDeposit: number;
  bankTurnoverRatioPct: number;
  bankTruthRedAlert: boolean;
  last2MonthsAvgDeposit: number;
  earlier10MonthsAvgDeposit: number;
  windowDressingSpikeRatio: number | null;
  windowDressingAlert: boolean;

  // Cash Conversion Cycle
  inventoryDays: number;
  cccDays: number;
  cccWarning: boolean;

  // Debt Service & Leverage
  totalExistingMonthlyDebt: number;
  estimatedMonthlyEmi: number;
  gracePeriodMonthlyInterest: number;
  amortizationMonths: number;
  totalPostLoanMonthlyDebt: number;
  currentDscr: number | null;
  postLoanDscr: number | null;
  postLoanNetCashFlow: number;
  facilityToEquityRatio: number | null;
  totalInterestPayable: number;

  // Collateral
  ltvOnFsvPct: number | null;
  fsvCoveragePct: number | null;

  // Sector-Specific Stress Test & Safe Limit-Sizing (1.25x Stressed DSCR)
  stressScenario: StressScenarioSpec;
  stressedRevenue: number;
  stressedDirectCost: number;
  stressedOperatingProfit: number;
  stressedCashAvailableForDebt: number;
  stressedNetCashFlow: number;
  stressedPostLoanDscr: number | null;
  stressCoversEmi: boolean;
  minSafeStressedDscrTarget: number;
  maxTotalSafeMonthlyDebtBdt: number;
  maxSafeNewMonthlyEmiBdt: number;
  recommendedSafeLoanLimitBdt: number;
  overLeveragedRequestAlert: boolean;
  overLeveragedReductionBdt: number;
  safeLimitHeadroomBdt: number;

  // ICRRS Composite Score (60% Quant / 40% Qual)
  icrrsScore: number;
  icrrsGrade: IcrrsGrade;
  icrrsBreakdown: IcrrsBreakdown;
  redFlagAlerts: string[];
  forensicAlerts: ForensicAlertItem[];
}

export type CreditCommitteeVerdict =
  | 'APPROVE'
  | 'CONDITIONAL APPROVAL'
  | 'REDUCE LOAN AMOUNT'
  | 'DECLINE';

export interface SectorNplTrigger {
  title: string;
  severity: 'Critical' | 'High' | 'Moderate';
  mechanism: string;
}

export interface ProtectionCovenant {
  covenant: string;
  enforcementMechanism: string;
}

export interface CreditAnalystMemo {
  executiveVerdict: {
    verdict: CreditCommitteeVerdict;
    recommendedSafeLimitBdt: number;
    summaryRationale: string;
  };
  businessAndProjectMechanics: {
    summary: string;
    cashFlowTrapsAndSeasonality: string[];
    sectorSpecificAssessment: string;
  };
  forensicRealityCheck: {
    summary: string;
    bankTurnoverAndSkinInGame: string;
    fundDiversionAndIntegrityRisks: string;
  };
  inflationAndShockSimulation: {
    summary: string;
    marginAndEmiImpact: string;
    costPassThroughAssessment: string;
  };
  postLoanGrowthAndRepaymentRealism: {
    summary: string;
    postGraceCashFlowReality: string;
    timelineAndExecutionRisks: string[];
  };
  topFiveNplTriggers: SectorNplTrigger[];
  branchManagerProtectionCovenants: ProtectionCovenant[];
  generatedAtIso: string;
}

// --- Defaulted Loan Recovery & Resolution Mode ---

export type WorkspaceMode = 'underwriting' | 'recovery' | 'closing';

export type ClassificationStage =
  | 'SMA (Special Mention Account: 2–3 mo overdue)'
  | 'Sub-Standard (SS: 3–6 mo overdue)'
  | 'Doubtful (DF: 6–12 mo overdue)'
  | 'Bad / Loss (BL: 12+ mo overdue)'
  | 'Written-Off / Artha Rin Suit Filed';

export type CollateralRealizabilityRating =
  | 'High - Liquid Urban Property / FDR'
  | 'Moderate - Semi-Urban / Auction Friction'
  | 'Low - Disputed / Rural / Unsecured';

export interface RecoveryRedFlags {
  suspectedFundDiversion: boolean;
  businessShutdownOrPartialClosure: boolean;
  uncooperativeBorrower: boolean;
  multipleDebtOverlap: boolean;
  ni138ChequeDishonorPending: boolean;
  collateralEncumbranceOrMutationDefect: boolean;
}

export interface RecoveryCaseInput {
  caseReference: string;
  sector: BusinessCategory;
  totalOutstandingAmount: number;
  overdueAmount: number;
  monthsOverdue: number;
  classificationStage: ClassificationStage;
  monthlyCashInflow: number;
  essentialMonthlyExpenses: number;
  collateralDescription: string;
  collateralRealizableValue: number;
  collateralRealizability: CollateralRealizabilityRating;
  guarantorAssessment: string;
  redFlags: RecoveryRedFlags;
  caseBackgroundNotes: string;
}

export interface RecoveryMetrics {
  monthlyNetCashForRecovery: number;
  cashFlowViable: boolean;
  monthsToRecoverOverdue: number | null; // null when net cash <= 0
  monthsToRecoverOutstanding: number | null;
  collateralCoverageVsOutstandingPct: number | null;
  collateralCoverageVsOverduePct: number | null;
  overdueShareOfOutstandingPct: number;
  activeRedFlagCount: number;
  feasibilityStatus:
    | 'Cash-Flow Viable Recovery'
    | 'Asset-Backed / Structured Exit'
    | 'Legal & Enforcement Priority';
}

export type RecommendedRecoveryTrack =
  | 'Structured Repayment Proposal'
  | 'Negotiated Exit / Settlement'
  | 'Legal / Enforcement Escalation';

export interface RecoveryActionPlan {
  days30: string[];
  days60: string[];
  days90: string[];
}

export interface RecoveryMemo {
  rootCauseOfDefault: {
    summary: string;
    primaryDrivers: string[];
    diversionAndConductAssessment: string;
  };
  cashAndAssetRecoveryRealism: {
    summary: string;
    cashCapacityAnalysis: string;
    collateralAndGuarantorReality: string;
  };
  recommendedRecoveryTrack: {
    track: RecommendedRecoveryTrack;
    headOfficeApprovalNotice: string;
    rationaleAndProposedTerms: string;
  };
  actionPlan30_60_90: RecoveryActionPlan;
  headOfficeRisksAndTriggers: {
    riskTitle: string;
    escalationTrigger: string;
  }[];
  generatedAtIso: string;
}

// --- Mode C: Branch Closing Assistant ---

export type PipelineItemType = 'Deposit' | 'Quality Loan' | 'NPL Recovery';

export type PipelineStage =
  | 'Ready to Close'
  | 'Follow-Up Due'
  | 'Under Review'
  | 'Docs Pending';

export type PipelineCostOrRiskGrade =
  | 'Low-Cost CASA / Fee-Free'
  | 'Standard FDR / Term Deposit'
  | 'High-Cost Bulk Deposit'
  | 'ICRRS Excellent / Good (Low Risk)'
  | 'ICRRS Marginal (Moderate Risk)'
  | 'High-Risk / Sub-Par Loan'
  | 'Verified Cash / Settlement';

export interface ClosingPipelineItem {
  id: string;
  code: string;
  type: PipelineItemType;
  amountBdt: number;
  costOrRiskGrade: PipelineCostOrRiskGrade;
  probabilityPct: number;
  stage: PipelineStage;
  targetDate: string;
  blockingIssueNextStep: string;
}

export interface ClosingCategoryTarget {
  achievedBdt: number;
  targetBdt: number;
}

export interface ClosingPlannerInput {
  branchOrPeriodLabel: string;
  daysLeftToClosing: number;
  deposits: ClosingCategoryTarget;
  loans: ClosingCategoryTarget;
  nplRecovery: ClosingCategoryTarget;
  pipelineItems: ClosingPipelineItem[];
}

export interface ClosingCategoryMetrics {
  label: string;
  type: PipelineItemType;
  achievedBdt: number;
  targetBdt: number;
  rawGapBdt: number;
  weightedPipelineBdt: number;
  weightedExpectedAchievementBdt: number;
  remainingGapBdt: number;
  projectedSurplusOrShortfallBdt: number;
  requiredDailyPaceBdt: number;
  attainmentPct: number;
  projectedAttainmentPct: number;
}

export type ActionQueueGroup =
  | 'Act Today'
  | 'Unblock Bottlenecks'
  | 'Watch Risk / Margin';

export interface PrioritizedPipelineItem {
  item: ClosingPipelineItem;
  weightedAmountBdt: number;
  daysToTargetDate: number | null;
  priorityScore: number;
  queueGroup: ActionQueueGroup;
  queueReason: string;
  weakRiskOrMarginFlag: boolean;
  weakRiskOrMarginReason: string | null;
}

export interface ClosingMetrics {
  deposits: ClosingCategoryMetrics;
  loans: ClosingCategoryMetrics;
  nplRecovery: ClosingCategoryMetrics;
  totalAchievedBdt: number;
  totalTargetBdt: number;
  totalRawGapBdt: number;
  totalWeightedPipelineBdt: number;
  totalWeightedExpectedAchievementBdt: number;
  totalRemainingGapBdt: number;
  totalRequiredDailyPaceBdt: number;
  highRiskSubParLoanPipelineBdt: number;
  highRiskSubParLoanWeightedBdt: number;
  marginalLoanWeightedBdt: number;
  highCostDepositWeightedBdt: number;
  closingRushWarning: boolean;
  closingRushReason: string | null;
  highCostDepositWarning: boolean;
  actTodayQueue: PrioritizedPipelineItem[];
  unblockBottlenecksQueue: PrioritizedPipelineItem[];
  watchRiskMarginQueue: PrioritizedPipelineItem[];
  allPrioritizedItems: PrioritizedPipelineItem[];
}

export type ClosingPostureStatus =
  | 'ON TRACK'
  | 'SELECTIVE PUSH REQUIRED'
  | 'CLOSING RUSH RISK — CREDIT DISCIPLINE ALERT';

export interface ClosingStrategyBrief {
  executiveClosingPosture: {
    status: ClosingPostureStatus;
    summary: string;
  };
  morningHuddlePriorities: {
    headline: string;
    topActions: {
      itemCode: string;
      bucket: PipelineItemType;
      ownerRole: string;
      huddleDirective: string;
      targetCutoffNote: string;
    }[];
  };
  stalledItemUnblockingActions: {
    itemCode: string;
    currentStage: string;
    bottleneckSummary: string;
    specificUnblockingStep: string;
    dueWindow: string;
  }[];
  nplRecoveryPushBeforeCutoff: {
    summary: string;
    tacticalSteps: string[];
  };
  policyAndCreditQualityGuardrails: {
    closingRushAssessment: string;
    guardrails: string[];
  };
  closingActionSheetRows: {
    caseCode: string;
    bucket: PipelineItemType;
    amountBdt: number;
    stage: string;
    priorityGroup: ActionQueueGroup;
    assignedAction: string;
    ownerRole: string;
    targetDate: string;
  }[];
  generatedAtIso: string;
}

