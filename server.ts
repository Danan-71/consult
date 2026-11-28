import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type } from '@google/genai';
import type { Request, Response } from 'express';
import type {
  CalculatedMetrics,
  ClosingMetrics,
  ClosingPlannerInput,
  ClosingStrategyBrief,
  CreditAnalystMemo,
  EarlyWarningInput,
  EarlyWarningMemo,
  EarlyWarningMetrics,
  LoanApplicationInput,
  RecoveryCaseInput,
  RecoveryMemo,
  RecoveryMetrics,
} from './src/types/credit.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolvePort(): number {
  const portFlagIdx = process.argv.findIndex(
    (arg) => arg === '--port' || arg === '-p',
  );
  if (portFlagIdx !== -1 && process.argv[portFlagIdx + 1]) {
    const cliPort = Number(process.argv[portFlagIdx + 1]);
    if (Number.isInteger(cliPort) && cliPort > 0) {
      return cliPort;
    }
  }
  const portEqualsArg = process.argv.find((arg) => arg.startsWith('--port='));
  if (portEqualsArg) {
    const cliPort = Number(portEqualsArg.split('=')[1]);
    if (Number.isInteger(cliPort) && cliPort > 0) {
      return cliPort;
    }
  }
  return Number(process.env.PORT) || 3000;
}

const PORT = resolvePort();

function formatBdtForPrompt(value: number): string {
  const rounded = Math.round(value || 0);
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(Math.abs(rounded));
  return rounded < 0 ? `-BDT ${formatted}` : `BDT ${formatted}`;
}

function createAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'GEMINI_API_KEY is not configured. Add your Gemini API key in Settings > Secrets.',
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function verifySupabaseBearer(
  req: Request,
  res: Response,
): Promise<boolean> {
  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim() || '';

  if (!token || token.split('.').length !== 3) {
    res.status(401).json({
      error: 'Authentication required. Sign in with your NBCI Supabase account.',
    });
    return false;
  }

  const supabaseUrl = (
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ''
  )
    .trim()
    .replace(/\/+$/, '');
  const supabaseAnonKey = (
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  ).trim();

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const verifyResp = await fetch(`${supabaseUrl}/auth/v1/user`, {
        method: 'GET',
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${token}`,
        },
      });
      if (!verifyResp.ok) {
        res.status(401).json({
          error: 'Invalid or expired Supabase session. Please sign in again.',
        });
        return false;
      }
    } catch (verifyErr) {
      console.error('Supabase session verification error:', verifyErr);
      res.status(502).json({
        error: 'Unable to verify authentication session with Supabase.',
      });
      return false;
    }
  }

  return true;
}

function formatSectorSpecificContext(input: LoanApplicationInput): string {
  const s = input.sectorData;
  switch (input.businessCategory) {
    case 'Real Estate & Land Developer':
      return `SECTOR-SPECIFIC DRIVERS (Real Estate & Land Developer):
- Land Title / Arrangement: ${s.realEstateLandType}
- Municipal / City Corp / RAJUK Approved Plan?: ${s.realEstateApprovedPlan}
- Total Project Cost: ${formatBdtForPrompt(s.realEstateTotalProjectCost)} | % Flats Pre-Sold: ${s.realEstateFlatsPreSoldPct}%
- Current Physical Construction Completion: ${s.realEstatePhysicalCompletionPct}% | Months to Handover: ${s.realEstateMonthsToHandover} months`;

    case 'LGED / Public Works Construction Contractor':
      return `SECTOR-SPECIFIC DRIVERS (LGED / Public Works Construction Contractor):
- Active Work Order Value: ${formatBdtForPrompt(s.contractorActiveWorkOrderValue)}
- Physical Work Completed: ${s.contractorWorkCompletedPct}%
- Average Govt. Bill Delay: ${s.contractorGovtBillDelayMonths} months
- Retention Money Locked: ${formatBdtForPrompt(s.contractorRetentionMoneyLocked)}`;

    case 'Dealers & Brand Distributors (FMCG/Cement/Rod/Fertilizer)':
      return `SECTOR-SPECIFIC DRIVERS (Dealers & Brand Distributors):
- Principal Brand Name: ${s.dealerPrincipalBrand || 'Not specified'}
- Monthly Company Sales Target: ${formatBdtForPrompt(s.dealerMonthlyTarget)}
- Uncollected Retailer Baki: ${formatBdtForPrompt(s.dealerUncollectedBaki)}
- Dealer Margin + Target Bonus: ${s.dealerMarginAndBonusPct}%`;

    case 'Bus / Truck / Commercial Transport':
      return `SECTOR-SPECIFIC DRIVERS (Bus / Truck / Commercial Transport):
- Number of Vehicles: ${s.transportVehicleCount}
- Average Daily Net Trip Collection: ${formatBdtForPrompt(s.transportDailyNetTripCollection)}
- Comprehensive Insurance & Route Permit Valid?: ${s.transportInsurancePermitValid}
- Average Vehicle Age: ${s.transportAvgVehicleAgeYears} years`;

    case 'Brick Manufacturing (Ita Bhati)':
      return `SECTOR-SPECIFIC DRIVERS (Brick Manufacturing / Ita Bhati):
- Operating Months/Year: ${s.brickOperatingMonthsPerYear} months
- Advance Labor (Dadan) & Soil/Coal Paid: ${formatBdtForPrompt(s.brickAdvanceDadanSoilCoalPaid)}
- Environment & DC License Valid?: ${s.brickEnvDcLicenseValid}
- Unbaked Stock Rain Risk Exposure: ${s.brickUnbakedRainRisk}`;

    case 'Agro-Trading / Rice Mill / Cold Storage':
      return `SECTOR-SPECIFIC DRIVERS (Agro-Trading / Rice Mill / Cold Storage):
- Current Godown / Cold-Storage Stock Value: ${formatBdtForPrompt(s.agroStockValue)}
- Seasonal Price Volatility: ${s.agroPriceVolatility}
- Backup Generator / Power Reliability: ${s.agroPowerReliability}
- Moisture / Spoilage Risk: ${s.agroMoistureSpoilageRisk}`;

    case 'Poultry / Dairy / Fisheries Farm':
      return `SECTOR-SPECIFIC DRIVERS (Poultry / Dairy / Fisheries Farm):
- Active Flock / Herd / Pond Value: ${formatBdtForPrompt(s.farmFlockHerdPondValue)}
- Biosecurity & Vaccination Protocol: ${s.farmBiosecurityProtocol}
- Feed Cost % of Revenue: ${s.farmFeedCostPctOfRevenue}%
- Disease History: ${s.farmDiseaseHistory}`;

    case 'Clinic / Diagnostic Center / Hospital / Pharmacy':
      return `SECTOR-SPECIFIC DRIVERS (Clinic / Diagnostic Center / Hospital / Pharmacy):
- Specialist Doctor Dependency: ${s.clinicDoctorDependency}
- Medical Equipment Value: ${formatBdtForPrompt(s.clinicMedicalEquipmentValue)}
- Daily Average Patient Count: ${s.clinicDailyPatientCount} patients/day
- DGHS License Valid?: ${s.clinicDghsLicenseValid}`;

    case 'Importer':
      return `SECTOR-SPECIFIC DRIVERS (Importer):
- % of Inventory Imported: ${s.importerImportedInventoryPct}%
- LC Margin Paid: ${s.importerLcMarginPaidPct}%
- Foreign Exchange (USD/BDT) Exposure Level: ${s.importerFxExposure}
- Port / Customs Clearance Days: ${s.importerPortClearanceDays} days`;

    case 'Exporter (RMG / Jute / Agro / Leather)':
      return `SECTOR-SPECIFIC DRIVERS (Exporter):
- Confirmed Export LC / Order Value: ${formatBdtForPrompt(s.exporterConfirmedLcValue)}
- Single Buyer Concentration: ${s.exporterSingleBuyerSharePct}%
- Shipment Lead Time: ${s.exporterShipmentLeadTimeDays} days
- Factory Compliance Status: ${s.exporterComplianceStatus}`;

    case 'Garments / Textile / Light Engineering Factory':
      return `SECTOR-SPECIFIC DRIVERS (Garments / Textile / Light Engineering Factory):
- Monthly Production Capacity Utilization: ${s.factoryCapacityUtilizationPct}%
- Number of Workers: ${s.factoryWorkerCount}
- Gas / Electricity Supply Stability: ${s.factoryUtilityStability}
- Order Backlog: ${s.factoryOrderBacklogMonths} months`;

    case 'Hotel / Resort / Restaurant / Bakery':
      return `SECTOR-SPECIFIC DRIVERS (Hotel / Resort / Restaurant / Bakery):
- Months Open at Location: ${s.hospitalityMonthsOpen} months
- Monthly Rent-to-Sales Ratio: ${s.hospitalityRentToSalesPct}%
- Occupancy / Table Turnover Rate: ${s.hospitalityOccupancyTurnoverPct}%
- Food Wastage: ${s.hospitalityFoodWastagePct}%`;

    case 'Local Wholesale & Retail Shop (Hardware/Cloth/Grocery/Electronics)':
      return `SECTOR-SPECIFIC DRIVERS (Local Wholesale & Retail Shop):
- Seasonal Peak Dependency: ${s.retailSeasonalPeakDependency}
- Dead / Slow-Moving Stock: ${s.retailDeadStockPct}%
- Average Customer Baki Days: ${s.retailAvgBakiDays} days
- Shop Ownership: ${s.retailShopOwnership}`;

    case 'Online / E-Commerce / F-Commerce':
      return `SECTOR-SPECIFIC DRIVERS (Online / E-Commerce / F-Commerce):
- Monthly Digital Ad Spend: ${formatBdtForPrompt(s.onlineMonthlyAdSpend)}
- Courier Return / Cancellation Rate: ${s.onlineReturnCancellationPct}%
- COD Settlement Days: ${s.onlineCodSettlementDays} days
- Repeat Customer Rate: ${s.onlineRepeatCustomerRatePct}%`;

    case 'IT / Software / Educational Institution / Service Business':
      return `SECTOR-SPECIFIC DRIVERS (IT / Software / Educational Institution / Service Business):
- Monthly Recurring Contract Revenue: ${s.serviceRecurringRevenuePct}%
- Key-Person Dependency: ${s.serviceKeyPersonDependency}
- Receivable Collection Days: ${s.serviceReceivableCollectionDays} days`;
  }
}

const CREDIT_MEMO_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    executiveVerdict: {
      type: Type.OBJECT,
      properties: {
        verdict: {
          type: Type.STRING,
          enum: [
            'APPROVE',
            'CONDITIONAL APPROVAL',
            'REDUCE LOAN AMOUNT',
            'DECLINE',
          ],
        },
        recommendedSafeLimitBdt: {
          type: Type.NUMBER,
          description:
            'Recommended safe loan limit in BDT anchored on the deterministic NBCI Safe Limit-Sizing Calculator (1.25x Stressed DSCR floor; 0 if DECLINE or CIB Classified).',
        },
        summaryRationale: {
          type: Type.STRING,
          description:
            '3-4 sentence authoritative Credit Committee verdict citing the ICRRS Score, every triggered Forensic Red Flag (or confirming No Critical Forensic Red Flags Triggered), DSCR, Bank Turnover Truth Check, NBCI 1.25x Stressed Safe Loan Limit vs. Requested Loan, and FSV cover.',
        },
      },
      required: ['verdict', 'recommendedSafeLimitBdt', 'summaryRationale'],
    },
    businessAndProjectMechanics: {
      type: Type.OBJECT,
      properties: {
        summary: {
          type: Type.STRING,
          description:
            'Deep breakdown of how this specific Bangladesh business or project actually generates cash, manages milestones, and handles seasonality.',
        },
        cashFlowTrapsAndSeasonality: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description:
            '3 specific working capital traps, CCC bottlenecks (>75d Cash Trap if triggered), or seasonal risks grounded in the sector inputs.',
        },
        sectorSpecificAssessment: {
          type: Type.STRING,
          description:
            'Detailed analysis of the 4 dynamic sector-specific indicators entered for this borrower.',
        },
      },
      required: [
        'summary',
        'cashFlowTrapsAndSeasonality',
        'sectorSpecificAssessment',
      ],
    },
    forensicRealityCheck: {
      type: Type.OBJECT,
      properties: {
        summary: {
          type: Type.STRING,
          description:
            'Blunt forensic review explicitly naming and analyzing EVERY triggered Forensic Red Flag & Early Risk Trigger (ICRRS Quantitative Floor Breach, Bank Statement vs. Declared Sales Gap, Window-Dressing Spike, Cash Trap / Slow Cash Conversion, Over-Leveraged Loan Request, Sector Stress Breach) — or confirming No Critical Forensic Red Flags Triggered — alongside CIB history and statutory compliance.',
        },
        bankTurnoverAndSkinInGame: {
          type: Type.STRING,
          description:
            'Evaluation of bank turnover match %, Window-Dressing 2-month deposit spike vs earlier 10-month avg, owner equity skin-in-the-game, owner drawings, and informal/Mohajan debt pressure.',
        },
        fundDiversionAndIntegrityRisks: {
          type: Type.STRING,
          description:
            'Assessment of cross-project fund diversion risks, NI Act Section 138 exposure, succession backup, and governance integrity.',
        },
      },
      required: [
        'summary',
        'bankTurnoverAndSkinInGame',
        'fundDiversionAndIntegrityRisks',
      ],
    },
    inflationAndShockSimulation: {
      type: Type.OBJECT,
      properties: {
        summary: {
          type: Type.STRING,
          description:
            'Exact impact of the sector-specific stress shock multipliers (e.g. Brick Kiln +25%/-15%, LGED -35% inflow, Real Estate +20%/-30%, Brand Distributor +10%/-20%, or baseline +15%/-15%) on borrower cash flow.',
        },
        marginAndEmiImpact: {
          type: Type.STRING,
          description:
            'Quantitative comparison of Base DSCR vs Stressed DSCR and stressed net cash deficit/cushion in BDT.',
        },
        costPassThroughAssessment: {
          type: Type.STRING,
          description:
            'Analysis of stated Pricing Power and input cost sensitivity (e.g., fixed-price pre-sold flats or fixed LGED tenders).',
        },
      },
      required: [
        'summary',
        'marginAndEmiImpact',
        'costPassThroughAssessment',
      ],
    },
    postLoanGrowthAndRepaymentRealism: {
      type: Type.OBJECT,
      properties: {
        summary: {
          type: Type.STRING,
          description:
            'Skeptical evaluation of whether the investment/project finishes on time and generates real cash after the grace period to service the EMI.',
        },
        postGraceCashFlowReality: {
          type: Type.STRING,
          description:
            'Assessment of grace period interest burden vs full post-grace EMI serviceability using verified cash flows.',
        },
        timelineAndExecutionRisks: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description:
            '2-3 realistic cost-overrun, construction delay, licensing, or buyer-collection delay risks.',
        },
      },
      required: [
        'summary',
        'postGraceCashFlowReality',
        'timelineAndExecutionRisks',
      ],
    },
    topFiveNplTriggers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: 'Concise sector-specific NPL trigger headline.',
          },
          severity: {
            type: Type.STRING,
            enum: ['Critical', 'High', 'Moderate'],
          },
          mechanism: {
            type: Type.STRING,
            description:
              'Concrete way this exact type of business defaults in Bangladesh.',
          },
        },
        required: ['title', 'severity', 'mechanism'],
      },
      description: 'Exactly 5 sector-specific Non-Performing Loan (NPL) triggers.',
    },
    branchManagerProtectionCovenants: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          covenant: {
            type: Type.STRING,
            description:
              'Mandatory legal, disbursement, or monitoring safeguard.',
          },
          enforcementMechanism: {
            type: Type.STRING,
            description:
              'Concrete operational execution to protect the branch manager retirement clearance (e.g., escrow account, engineer inspection tranche, Pay Order, registered POA).',
          },
        },
        required: ['covenant', 'enforcementMechanism'],
      },
      description:
        'Exactly 5 mandatory branch manager protection covenants.',
    },
  },
  required: [
    'executiveVerdict',
    'businessAndProjectMechanics',
    'forensicRealityCheck',
    'inflationAndShockSimulation',
    'postLoanGrowthAndRepaymentRealism',
    'topFiveNplTriggers',
    'branchManagerProtectionCovenants',
  ],
};

function buildPrompt(
  input: LoanApplicationInput,
  metrics: CalculatedMetrics,
): string {
  const currentDscrLabel =
    metrics.currentDscr === null
      ? 'Debt-Free'
      : `${metrics.currentDscr.toFixed(2)}x`;
  const postDscrLabel =
    metrics.postLoanDscr === null ? 'N/A' : `${metrics.postLoanDscr.toFixed(2)}x`;
  const stressedDscrLabel =
    metrics.stressedPostLoanDscr === null
      ? 'N/A'
      : `${metrics.stressedPostLoanDscr.toFixed(2)}x`;
  const fsvCoverageLabel =
    metrics.fsvCoveragePct === null
      ? 'Unsecured (0% FSV)'
      : `${metrics.fsvCoveragePct.toFixed(1)}%`;
  const equityRatioLabel =
    metrics.facilityToEquityRatio === null
      ? 'N/A (Zero stated equity)'
      : `${metrics.facilityToEquityRatio.toFixed(2)}x`;

  return `Act as a strict, conservative Chief Credit Risk Officer at Northern Banking Credit Intelligence (NBCI), advising a bank branch manager in Bangladesh under Bangladesh Bank ICRRS & CRM guidelines. Your top priority is preventing NPLs and protecting the branch manager's audit & retirement clearance.

TAB 1 — BUSINESS SECTOR & PROFILE
- Business Name: ${input.businessName} (${input.legalStructure})
- Owner / MD Name: ${input.ownerMdName || 'Not specified'}
- District / City: ${input.districtCity || 'Not specified'} | Years in Operation: ${input.yearsInOperation} years
- Business Sector: ${input.businessCategory}
- Business / Project Description: ${input.businessModelDescription}

${formatSectorSpecificContext(input)}

TAB 2 — KYC, CIB & MANAGEMENT INTEGRITY
- Bangladesh Bank CIB Status: ${input.cibStatus}
- Owner Age: ${input.ownerAge} yrs | Sector Experience: ${input.sectorExperienceYears} yrs | Succession Backup: ${input.successionBackup}
- Verifications: Trade License (${input.compliance.validTradeLicense ? 'Valid' : 'MISSING'}), TIN/BIN (${input.compliance.updatedTinBin ? 'Updated' : 'MISSING'}), Physical Site & Stock Verified (${input.compliance.siteAndStockVerified ? 'Yes' : 'NO'}), Zero Pending Legal / NI Act Sec 138 Cases (${input.compliance.zeroLegalOrNi138Cases ? 'Clean' : 'DISPUTES PENDING'})

TAB 3 — FORENSIC CASH, PROJECT BUDGET & PROFIT VERIFICATION (MONTHLY BDT)
- Declared Average Monthly Revenue / Project Inflow: ${formatBdtForPrompt(input.monthlyRevenue)}
- Last 12 Months Bank Credit Turnover: ${formatBdtForPrompt(input.annualBankCreditTurnover)} (Monthly Avg ${formatBdtForPrompt(metrics.avgMonthlyBankDeposit)} = ${metrics.bankTurnoverRatioPct.toFixed(1)}% of declared sales | Turnover Variance: ${(metrics.bankTurnoverRatioPct - 100) >= 0 ? '+' : ''}${(metrics.bankTurnoverRatioPct - 100).toFixed(1)}%${metrics.bankTruthRedAlert ? ' — RED ALERT: BELOW 50%' : ''})
- Last 2 Months Bank Deposits: ${formatBdtForPrompt(input.last2MonthsBankCreditTotal)} (Avg ${formatBdtForPrompt(metrics.last2MonthsAvgDeposit)}/mo vs. Earlier 10m Avg ${formatBdtForPrompt(metrics.earlier10MonthsAvgDeposit)}/mo${metrics.windowDressingAlert && metrics.windowDressingSpikeRatio !== null ? ` — WINDOW DRESSING ALERT: ${metrics.windowDressingSpikeRatio.toFixed(2)}x SPIKE (>2.2x)` : ''})
- Direct Cost (COGS / Materials / Fuel / Feed): ${formatBdtForPrompt(input.directCost)} (${metrics.grossMarginPct.toFixed(1)}% Gross Margin)
- Fixed OpEx: ${formatBdtForPrompt(input.fixedExpenses)} | Variable OpEx: ${formatBdtForPrompt(input.variableExpenses)}
- Operating Profit: ${formatBdtForPrompt(metrics.operatingProfit)} | Less Owner Drawings: ${formatBdtForPrompt(input.ownerMonthlyDrawings)}
- Net Cash Available for Debt Service: ${formatBdtForPrompt(metrics.cashAvailableForDebt)}

TAB 4 — WORKING CAPITAL & INFLATION SENSITIVITY
- Inventory / WIP Value: ${formatBdtForPrompt(input.inventoryWipValue)} (~${Math.round(metrics.inventoryDays)} Inventory Days)
- Receivable Days: ${input.receivableDays}d | Payable Days: ${input.payableDays}d | Cash Conversion Cycle (CCC): ${Math.round(metrics.cccDays)} days
- Pricing Power During Inflation: ${input.pricingPower} | Input Cost / Rod-Cement / Fuel / USD Sensitivity: ${input.inputCostInflationSensitivity}
- Inflation Notes: ${input.inflationNotes || 'None'}

TAB 5 — CAPITAL STRUCTURE & EXISTING LIABILITIES
- Owner Equity / Net Worth Invested: ${formatBdtForPrompt(input.ownerEquityNetWorth)} (Requested Loan / Equity: ${equityRatioLabel})
- Existing Bank EMIs: ${formatBdtForPrompt(input.existingBankMonthlyEmi)}/mo | Informal / NGO / Mohajan Debt: ${formatBdtForPrompt(input.informalMonthlyDebt)}/mo

TAB 6 — REQUESTED LOAN, EXECUTION & COLLATERAL
- Facility Type: ${input.facilityType} | Requested Loan: ${formatBdtForPrompt(input.requestedLoanAmount)}
- Interest Rate: ${input.annualInterestRate}% p.a. | Tenure: ${input.loanTenureMonths} months (Grace: ${input.gracePeriodMonths} months; Amortization: ${metrics.amortizationMonths} months)
- Grace Period Monthly Interest: ${formatBdtForPrompt(metrics.gracePeriodMonthlyInterest)}/mo | Post-Grace EMI: ${formatBdtForPrompt(metrics.estimatedMonthlyEmi)}/mo
- Total Post-Loan Monthly Debt Service: ${formatBdtForPrompt(metrics.totalPostLoanMonthlyDebt)}/mo
- Disbursement Control: ${input.disbursementControl}
- Investment / Construction Execution Plan: ${input.executionPlan}
- Collateral Type: ${input.collateralType} | Market Value: ${formatBdtForPrompt(input.collateralMarketValue)} | Forced Sale Value (FSV): ${formatBdtForPrompt(input.forcedSaleValue)}
- FSV Coverage: ${fsvCoverageLabel} | Legal/Auction Liquidity: ${input.collateralLiquidityRisk}
- Collateral Notes: ${input.collateralNotes || 'None'}

AUTOMATED ICRRS SCORECARD & SECTOR-SPECIFIC STRESS SIMULATION
- Composite ICRRS Score: ${metrics.icrrsScore}/100 — Grade: ${metrics.icrrsGrade}
- 60% Quantitative Score: ${metrics.icrrsBreakdown.quantitativeScore}/60 (${metrics.icrrsBreakdown.quantitativePct.toFixed(0)}%) | 40% Qualitative Score: ${metrics.icrrsBreakdown.qualitativeScore}/40 (${metrics.icrrsBreakdown.qualitativePct.toFixed(0)}%)
- Deterministic Auto-Downgrade Triggered?: ${metrics.icrrsBreakdown.autoDowngradeReason ? `YES — ${metrics.icrrsBreakdown.autoDowngradeReason} (Rating Forced to UNACCEPTABLE (Auto-Downgraded))` : 'NO'}
- Base DSCR: ${postDscrLabel} (Prior DSCR: ${currentDscrLabel}) | Post-Loan Net Cash Flow: ${formatBdtForPrompt(metrics.postLoanNetCashFlow)}/mo
- Active Stress Scenario (${metrics.stressScenario.label} — ${metrics.stressScenario.rationale}):
  - Stressed Net Cash Flow: ${formatBdtForPrompt(metrics.stressedNetCashFlow)}/mo | Stressed DSCR: ${stressedDscrLabel} | Sector Stress Breach (<1.10x)?: ${metrics.sectorStressBreach ? 'YES — TRIGGERED' : 'NO'} | Survives 1.00x EMI?: ${metrics.stressCoversEmi ? 'YES' : 'NO'}
- WORKING CAPITAL & SAFE LIMIT-SIZING CALCULATOR (1.25x Stressed DSCR Floor):
  - Cash Conversion Cycle (CCC): ${Math.round(metrics.cccDays)} days (Inv ${Math.round(metrics.inventoryDays)}d + Rec ${input.receivableDays}d - Pay ${input.payableDays}d)${metrics.cccWarning ? ' — CASH TRAP (>75 DAYS) TRIGGERED' : ''}
  - Max Safe Total Monthly Debt at 1.25x Stressed DSCR: ${formatBdtForPrompt(metrics.maxTotalSafeMonthlyDebtBdt)}/mo | Max Safe New EMI: ${formatBdtForPrompt(metrics.maxSafeNewMonthlyEmiBdt)}/mo
  - NBCI Recommended Safe Loan Limit: ${formatBdtForPrompt(metrics.recommendedSafeLoanLimitBdt)} vs. Requested Loan: ${formatBdtForPrompt(input.requestedLoanAmount)}
  - Over-Leveraged Request Alert?: ${metrics.overLeveragedRequestAlert ? `YES — Reduce proposed loan by ${formatBdtForPrompt(metrics.overLeveragedReductionBdt)}` : `NO — Within 1.25x stress limit (Headroom: ${formatBdtForPrompt(metrics.safeLimitHeadroomBdt)})`}
- FORENSIC RED FLAGS & EARLY RISK TRIGGERS (${(metrics.forensicAlerts || []).length} Triggered):
${
  metrics.forensicAlerts && metrics.forensicAlerts.length > 0
    ? metrics.forensicAlerts
        .map(
          (a) =>
            `  * [${a.tone.toUpperCase()} ALERT] ${a.title} (${a.metricSummary}): ${a.detail}`,
        )
        .join('\n')
    : metrics.redFlagAlerts.length > 0
      ? metrics.redFlagAlerts.map((a) => `  * ${a}`).join('\n')
      : '  * No Critical Forensic Red Flags Triggered (all 6 quantitative & forensic checks passed)'
}

STRICT UNDERWRITING MANDATE:
1. Reference the exact BDT numbers, ICRRS 60/40 scores, bank deposit truth ratio, Window-Dressing spike check (last 2m vs earlier 10m), CCC days, DSCR, sector-specific stress multipliers (1.10x Stressed DSCR Sector Stress Breach check), NBCI 1.25x Stressed Safe Loan Limit vs. Requested Loan, and FSV coverage.
2. MANDATORY FORENSIC ALERT CITATION: You MUST explicitly name and address EVERY SINGLE triggered alert listed under FORENSIC RED FLAGS & EARLY RISK TRIGGERS inside the Credit Committee Memo (in executiveVerdict.summaryRationale, forensicRealityCheck, and inflationAndShockSimulation as applicable). Do not omit any triggered alert. If 0 alerts are triggered, explicitly confirm "No Critical Forensic Red Flags Triggered".
3. If Requested Loan exceeds NBCI Recommended Safe Loan Limit, explicitly state the Over-Leveraged Request reduction needed (${formatBdtForPrompt(metrics.overLeveragedReductionBdt)}) and align recommendedSafeLimitBdt at or below ${formatBdtForPrompt(metrics.recommendedSafeLoanLimitBdt)} (or 0 if DECLINE / CIB Classified).
4. If Rating is UNACCEPTABLE (Auto-Downgraded) (Quant <30/60 or CIB Classified), or Window-Dressing Spike is active, or Bank Statement vs. Declared Sales Gap < 50% with weak FSV, do NOT issue "APPROVE"—use "DECLINE" (mandatory if CIB Classified), "REDUCE LOAN AMOUNT", or "CONDITIONAL APPROVAL" with a concrete safe limit in BDT.
5. Produce exactly 5 sector-specific NPL triggers and exactly 5 concrete Branch Manager Protection Covenants tailored to this sector (e.g., escrow accounts, engineer inspection tranches, registered POA, Pay Order to brand/supplier, DGHS/DC/RAJUK license perfection).`;
}

const RECOVERY_MEMO_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    rootCauseOfDefault: {
      type: Type.OBJECT,
      properties: {
        summary: {
          type: Type.STRING,
          description:
            'Authoritative branch/head-office synthesis explaining why the facility became overdue or classified.',
        },
        primaryDrivers: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description:
            '3–4 concrete operational, macro/sector, cash-cycle, or behavioral drivers behind the default.',
        },
        diversionAndConductAssessment: {
          type: Type.STRING,
          description:
            'Candid assessment of borrower cooperation, suspected fund diversion, multiple debt overlap, or NI Act Sec 138 indicators.',
        },
      },
      required: ['summary', 'primaryDrivers', 'diversionAndConductAssessment'],
    },
    cashAndAssetRecoveryRealism: {
      type: Type.OBJECT,
      properties: {
        summary: {
          type: Type.STRING,
          description:
            'Unvarnished verdict on how realistic full recovery is from ongoing business cash flows vs. forced collateral liquidation.',
        },
        cashCapacityAnalysis: {
          type: Type.STRING,
          description:
            'Quantitative review citing monthly cash inflow, essential expenses, net recovery capacity in BDT, and months to clear overdue/outstanding.',
        },
        collateralAndGuarantorReality: {
          type: Type.STRING,
          description:
            'Assessment of collateral realizable value, coverage %, legal/mutation friction, Artha Rin Adalat auction timelines, and guarantor enforceability.',
        },
      },
      required: [
        'summary',
        'cashCapacityAnalysis',
        'collateralAndGuarantorReality',
      ],
    },
    recommendedRecoveryTrack: {
      type: Type.OBJECT,
      properties: {
        track: {
          type: Type.STRING,
          enum: [
            'Structured Repayment Proposal',
            'Negotiated Exit / Settlement',
            'Legal / Enforcement Escalation',
          ],
        },
        headOfficeApprovalNotice: {
          type: Type.STRING,
          description:
            'Explicit governance notice stating that any restructuring, rescheduling, interest waiver, or negotiated exit settlement requires formal Head Office Credit/Recovery Committee and Bangladesh Bank regulatory policy approval.',
        },
        rationaleAndProposedTerms: {
          type: Type.STRING,
          description:
            'Concrete track rationale and realistic proposed terms (e.g., down payment %, monthly installment target in BDT, grace/step-up rules, or Artha Rin / NI Act 138 legal filing posture).',
        },
      },
      required: [
        'track',
        'headOfficeApprovalNotice',
        'rationaleAndProposedTerms',
      ],
    },
    actionPlan30_60_90: {
      type: Type.OBJECT,
      properties: {
        days30: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description:
            '3 concrete branch-level actions within Days 1–30 (e.g., formal notice, site stock audit, guarantor call, bank account freeze/lien check).',
        },
        days60: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description:
            '3 concrete actions within Days 31–60 (e.g., Head Office Recovery Memo submission, down-payment collection, valuation update, legal notice).',
        },
        days90: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description:
            '3 concrete actions within Days 61–90 (e.g., approved restructuring execution, Artha Rin Adalat / Sec 138 suit filing if milestone missed, auction preparation).',
        },
      },
      required: ['days30', 'days60', 'days90'],
    },
    headOfficeRisksAndTriggers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          riskTitle: {
            type: Type.STRING,
            description: 'Concise head-office risk or red flag headline.',
          },
          escalationTrigger: {
            type: Type.STRING,
            description:
              'Specific threshold or event (missed installment days, asset stripping, borrower non-appearance) that immediately triggers escalation to Head Office SAMD / Legal.',
          },
        },
        required: ['riskTitle', 'escalationTrigger'],
      },
      description:
        '4–5 key risks and hard escalation triggers for Head Office reporting.',
    },
  },
  required: [
    'rootCauseOfDefault',
    'cashAndAssetRecoveryRealism',
    'recommendedRecoveryTrack',
    'actionPlan30_60_90',
    'headOfficeRisksAndTriggers',
  ],
};

function buildRecoveryPrompt(
  input: RecoveryCaseInput,
  metrics: RecoveryMetrics,
): string {
  const redFlagList: string[] = [];
  if (input.redFlags.suspectedFundDiversion) {
    redFlagList.push('Suspected Fund Diversion outside business');
  }
  if (input.redFlags.businessShutdownOrPartialClosure) {
    redFlagList.push('Business Shutdown or Partial Closure');
  }
  if (input.redFlags.uncooperativeBorrower) {
    redFlagList.push('Uncooperative / Evasive Borrower');
  }
  if (input.redFlags.multipleDebtOverlap) {
    redFlagList.push('Multiple Bank / Informal Debt Overlap');
  }
  if (input.redFlags.ni138ChequeDishonorPending) {
    redFlagList.push('NI Act Section 138 Cheque Dishonor / Legal Pending');
  }
  if (input.redFlags.collateralEncumbranceOrMutationDefect) {
    redFlagList.push('Collateral Encumbrance / Mutation / Title Defect');
  }

  const overduePaybackLabel =
    metrics.monthsToRecoverOverdue === null
      ? 'Not viable (Zero/Negative monthly net cash)'
      : `${metrics.monthsToRecoverOverdue.toFixed(1)} months`;

  const outstandingPaybackLabel =
    metrics.monthsToRecoverOutstanding === null
      ? 'Not viable (Zero/Negative monthly net cash)'
      : `${metrics.monthsToRecoverOutstanding.toFixed(1)} months`;

  const coverageOutstandingLabel =
    metrics.collateralCoverageVsOutstandingPct === null
      ? 'N/A'
      : `${metrics.collateralCoverageVsOutstandingPct.toFixed(1)}%`;

  const coverageOverdueLabel =
    metrics.collateralCoverageVsOverduePct === null
      ? 'N/A'
      : `${metrics.collateralCoverageVsOverduePct.toFixed(1)}%`;

  return `Act as a senior Special Asset Management Division (SAMD) & Credit Recovery Officer at Northern Banking Credit Intelligence (NBCI), advising a bank branch manager and Head Office Recovery Committee in Bangladesh under Bangladesh Bank BRPD classification, rescheduling, and Artha Rin Adalat guidelines.

ANONYMIZED CASE PROFILE
- Case Reference: ${input.caseReference}
- Sector: ${input.sector}
- Classification Stage: ${input.classificationStage}
- Months Overdue: ${input.monthsOverdue} months
- Total Outstanding Balance: ${formatBdtForPrompt(input.totalOutstandingAmount)}
- Overdue Amount: ${formatBdtForPrompt(input.overdueAmount)} (${metrics.overdueShareOfOutstandingPct.toFixed(1)}% of outstanding)

CURRENT CASH CAPACITY & RECOVERY MATH (MONTHLY BDT)
- Current Monthly Business Cash Inflow: ${formatBdtForPrompt(input.monthlyCashInflow)}
- Essential Monthly Operating & Survival Expenses: ${formatBdtForPrompt(input.essentialMonthlyExpenses)}
- Monthly Net Cash Available for Recovery: ${formatBdtForPrompt(metrics.monthlyNetCashForRecovery)}
- Months to Recover Overdue at Current Capacity: ${overduePaybackLabel}
- Months to Recover Total Outstanding at Current Capacity: ${outstandingPaybackLabel}
- Algorithmic Feasibility Signal: ${metrics.feasibilityStatus}

COLLATERAL & GUARANTOR REALIZABILITY
- Collateral Description: ${input.collateralDescription || 'None specified'}
- Estimated Realizable Value: ${formatBdtForPrompt(input.collateralRealizableValue)}
- Realizability Rating: ${input.collateralRealizability}
- Collateral Coverage vs. Total Outstanding: ${coverageOutstandingLabel}
- Collateral Coverage vs. Overdue Amount: ${coverageOverdueLabel}
- Guarantor Assessment: ${input.guarantorAssessment || 'No details provided'}

RED FLAGS IDENTIFIED (${redFlagList.length})
${redFlagList.length > 0 ? redFlagList.map((flag) => `- ${flag}`).join('\n') : '- None selected'}

CASE BACKGROUND NOTES
${input.caseBackgroundNotes || 'None provided'}

STRICT RECOVERY MANDATE:
1. Reference the exact BDT figures, monthly net cash recovery capacity, payback months, collateral coverage %, and classification stage.
2. Recommend exactly one track from: "Structured Repayment Proposal", "Negotiated Exit / Settlement", or "Legal / Enforcement Escalation".
3. In recommendedRecoveryTrack.headOfficeApprovalNotice, explicitly state that any rescheduling, restructuring, interest/penal waiver, or negotiated exit settlement requires formal Head Office credit/recovery committee approval and strict compliance with Bangladesh Bank regulatory policy (BRPD circulars).
4. Make the 30/60/90-day branch action steps operational and specific to Bangladesh banking practice (e.g., physical stock verification, joint inspection with Legal/Panel Lawyer, Artha Rin Adalat Sec 12/33 notice, NI Act Sec 138 filing, down-payment deposit verification).
5. Provide 4–5 sharp Head Office Risks & Hard Escalation Triggers with unambiguous breach thresholds.`;
}

const CLOSING_BRIEF_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    executiveClosingPosture: {
      type: Type.OBJECT,
      properties: {
        status: {
          type: Type.STRING,
          enum: [
            'ON TRACK',
            'SELECTIVE PUSH REQUIRED',
            'CLOSING RUSH RISK — CREDIT DISCIPLINE ALERT',
          ],
        },
        summary: {
          type: Type.STRING,
          description:
            '2–3 sentence executive synthesis referencing days left, weighted expected achievement vs. target, daily closing pace in BDT/day, action queue balance, and credit/cost quality.',
        },
      },
      required: ['status', 'summary'],
    },
    morningHuddlePriorities: {
      type: Type.OBJECT,
      properties: {
        headline: {
          type: Type.STRING,
          description:
            '1 crisp morning huddle focus directive for the Branch Manager and front-office team today.',
        },
        topActions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              itemCode: {
                type: Type.STRING,
                description: 'Anonymized Case Code from pipeline.',
              },
              bucket: {
                type: Type.STRING,
                enum: ['Deposit', 'Quality Loan', 'NPL Recovery'],
              },
              ownerRole: {
                type: Type.STRING,
                description:
                  'Bank branch role responsible (e.g., Branch Manager, Senior RM, Credit Officer, SAMD Officer). Never invent personal names.',
              },
              huddleDirective: {
                type: Type.STRING,
                description:
                  'Concrete same-day execution step prioritizing Act Today high-impact, low-risk / low-cost deals.',
              },
              targetCutoffNote: {
                type: Type.STRING,
                description:
                  'Target date urgency and weighted BDT contribution.',
              },
            },
            required: [
              'itemCode',
              'bucket',
              'ownerRole',
              'huddleDirective',
              'targetCutoffNote',
            ],
          },
          description:
            '3–5 Morning Huddle priority items ranked by closing readiness, urgency, and quality.',
        },
      },
      required: ['headline', 'topActions'],
    },
    stalledItemUnblockingActions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          itemCode: {
            type: Type.STRING,
            description: 'Anonymized Case Code of stalled/bottlenecked or watch item.',
          },
          currentStage: {
            type: Type.STRING,
            description: 'Pipeline stage (e.g., Docs Pending, Under Review, Follow-Up Due).',
          },
          bottleneckSummary: {
            type: Type.STRING,
            description: 'Specific blocker or risk/margin friction stalling conversion.',
          },
          specificUnblockingStep: {
            type: Type.STRING,
            description:
              'Practical follow-up or documentation/collateral/ALCO unblocking action.',
          },
          dueWindow: {
            type: Type.STRING,
            description: 'Execution deadline window (e.g., Within 24h, By Nov 24 / Before Cutoff).',
          },
        },
        required: [
          'itemCode',
          'currentStage',
          'bottleneckSummary',
          'specificUnblockingStep',
          'dueWindow',
        ],
      },
      description:
        'Specific follow-up / unblocking actions for every stalled item in Unblock Bottlenecks and Watch Risk / Margin.',
    },
    nplRecoveryPushBeforeCutoff: {
      type: Type.OBJECT,
      properties: {
        summary: {
          type: Type.STRING,
          description:
            'Realistic assessment of pre-cutoff NPL cash recovery & regularization potential.',
        },
        tacticalSteps: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description:
            '3 concrete branch recovery pushes (e.g., SMA/SS interest servicing drive, down-payment cutoff collection, guarantor engagement) executable before closing.',
        },
      },
      required: ['summary', 'tacticalSteps'],
    },
    policyAndCreditQualityGuardrails: {
      type: Type.OBJECT,
      properties: {
        closingRushAssessment: {
          type: Type.STRING,
          description:
            'Direct commentary on whether Closing Rush Warning, Watch Risk/Margin items, or High-Cost Bulk Deposit reliance threatens future NPLs or branch NIM.',
        },
        guardrails: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description:
            '3–4 non-negotiable policy & credit-quality guardrails preventing sub-par rush lending, incomplete security docs, artificial year-end window dressing, or spread erosion.',
        },
      },
      required: ['closingRushAssessment', 'guardrails'],
    },
    closingActionSheetRows: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          caseCode: {
            type: Type.STRING,
            description: 'Anonymized Case Code (NO personal names or PII).',
          },
          bucket: {
            type: Type.STRING,
            enum: ['Deposit', 'Quality Loan', 'NPL Recovery'],
          },
          amountBdt: {
            type: Type.NUMBER,
            description: 'Gross item amount in BDT.',
          },
          stage: {
            type: Type.STRING,
          },
          priorityGroup: {
            type: Type.STRING,
            enum: ['Act Today', 'Unblock Bottlenecks', 'Watch Risk / Margin'],
          },
          assignedAction: {
            type: Type.STRING,
            description: 'Crisp single-line closing or risk-hold action for printable Action Sheet.',
          },
          ownerRole: {
            type: Type.STRING,
            description: 'Branch role only (no individual names/PII).',
          },
          targetDate: {
            type: Type.STRING,
            description: 'Target date (YYYY-MM-DD).',
          },
        },
        required: [
          'caseCode',
          'bucket',
          'amountBdt',
          'stage',
          'priorityGroup',
          'assignedAction',
          'ownerRole',
          'targetDate',
        ],
      },
      description:
        'Complete anonymized Closing Action Sheet rows covering all active pipeline items in prioritized order.',
    },
  },
  required: [
    'executiveClosingPosture',
    'morningHuddlePriorities',
    'stalledItemUnblockingActions',
    'nplRecoveryPushBeforeCutoff',
    'policyAndCreditQualityGuardrails',
    'closingActionSheetRows',
  ],
};

function buildClosingPrompt(
  input: ClosingPlannerInput,
  metrics: ClosingMetrics,
): string {
  const formatQueueLines = (
    items: ClosingMetrics['allPrioritizedItems'],
    label: string,
  ) => {
    if (!items || items.length === 0) return `${label}: None`;
    return `${label} (${items.length}):\n` + items
      .map((p) => {
        const it = p.item;
        return `  - ${it.code || 'Unnamed'} | Bucket: ${it.type} | Gross: ${formatBdtForPrompt(it.amountBdt)} | Prob: ${it.probabilityPct}% | Weighted: ${formatBdtForPrompt(p.weightedAmountBdt)} | Stage: ${it.stage} | Target Date: ${it.targetDate || 'Unspecified'} | Grade/Cost: ${it.costOrRiskGrade} | Priority Score: ${p.priorityScore}/100 | Blocker/Next Step: ${it.blockingIssueNextStep || 'None specified'} | Queue Note: ${p.queueReason}`;
      })
      .join('\n');
  };

  return `Act as a senior Branch Performance, Treasury & Credit Risk Strategist at Northern Banking Credit Intelligence (NBCI), serving as the AI Branch Closing Assistant for a commercial bank branch manager in Bangladesh ahead of closing cutoff.

CLOSING HORIZON & BRANCH CONTEXT
- Branch / Closing Period: ${input.branchOrPeriodLabel || 'Branch Closing Plan'}
- Days Left to Closing Cutoff: ${input.daysLeftToClosing} days

CATEGORY TARGETS VS. WEIGHTED PROJECTIONS (BDT)
1. Deposits Mobilization:
   - Achieved: ${formatBdtForPrompt(metrics.deposits.achievedBdt)} / Target: ${formatBdtForPrompt(metrics.deposits.targetBdt)}
   - Weighted Pipeline: ${formatBdtForPrompt(metrics.deposits.weightedPipelineBdt)} | Weighted Expected: ${formatBdtForPrompt(metrics.deposits.weightedExpectedAchievementBdt)}
   - Remaining Gap: ${formatBdtForPrompt(metrics.deposits.remainingGapBdt)} | Required Daily Pace: ${formatBdtForPrompt(metrics.deposits.requiredDailyPaceBdt)}/day
2. Quality Loans & Advances:
   - Achieved: ${formatBdtForPrompt(metrics.loans.achievedBdt)} / Target: ${formatBdtForPrompt(metrics.loans.targetBdt)}
   - Weighted Pipeline: ${formatBdtForPrompt(metrics.loans.weightedPipelineBdt)} | Weighted Expected: ${formatBdtForPrompt(metrics.loans.weightedExpectedAchievementBdt)}
   - Remaining Gap: ${formatBdtForPrompt(metrics.loans.remainingGapBdt)} | Required Daily Pace: ${formatBdtForPrompt(metrics.loans.requiredDailyPaceBdt)}/day
3. NPL Cash Recovery / Reduction:
   - Achieved: ${formatBdtForPrompt(metrics.nplRecovery.achievedBdt)} / Target: ${formatBdtForPrompt(metrics.nplRecovery.targetBdt)}
   - Weighted Pipeline: ${formatBdtForPrompt(metrics.nplRecovery.weightedPipelineBdt)} | Weighted Expected: ${formatBdtForPrompt(metrics.nplRecovery.weightedExpectedAchievementBdt)}
   - Remaining Gap: ${formatBdtForPrompt(metrics.nplRecovery.remainingGapBdt)} | Required Daily Pace: ${formatBdtForPrompt(metrics.nplRecovery.requiredDailyPaceBdt)}/day

TOTAL BRANCH CLOSING ROLLUP
- Total Weighted Expected Achievement: ${formatBdtForPrompt(metrics.totalWeightedExpectedAchievementBdt)} vs. Target ${formatBdtForPrompt(metrics.totalTargetBdt)}
- Total Remaining Gap to Target: ${formatBdtForPrompt(metrics.totalRemainingGapBdt)}
- Total Required Daily Pace: ${formatBdtForPrompt(metrics.totalRequiredDailyPaceBdt)}/day
- Closing Rush Warning Active?: ${metrics.closingRushWarning ? `YES — ${metrics.closingRushReason}` : 'NO'}
- High-Cost Bulk Deposit Warning?: ${metrics.highCostDepositWarning ? `YES — ${formatBdtForPrompt(metrics.highCostDepositWeightedBdt)} weighted in high-cost bulk deposits` : 'NO'}

SMART PRIORITIZATION & ACTION QUEUE (DETERMINISTIC)
${formatQueueLines(metrics.actTodayQueue, 'QUEUE 1 — ACT TODAY (High Impact / Near Closing)')}

${formatQueueLines(metrics.unblockBottlenecksQueue, 'QUEUE 2 — UNBLOCK BOTTLENECKS (Docs Pending / Under Review / Low-Prob Follow-Up)')}

${formatQueueLines(metrics.watchRiskMarginQueue, 'QUEUE 3 — WATCH RISK / MARGIN (Weak Credit Grade or High-Cost Bulk Deposit)')}

BRANCH CLOSING PLAYBOOK MANDATE:
1. STRICT ANONYMITY (NO PII): Refer strictly to Case Codes (e.g., DEP-01, LN-04) and branch roles (e.g., Branch Manager, Credit Officer, Relationship Officer, SAMD Officer). Never invent personal borrower names, phone numbers, or NIDs.
2. Morning Huddle Priorities: Focus on "Act Today" high-probability, low-risk / low-cost deals and imminent target-date items so the branch captures fast, clean volume first.
3. Specific Follow-Up / Unblocking Actions: Provide tailored, practical unblocking steps for every stalled item in "Unblock Bottlenecks" (referencing their exact stage and blocking issue) and risk-mitigation or hold steps for items in "Watch Risk / Margin".
4. Policy & Credit-Quality Guardrails: Explicitly prevent closing-rush sanctioning of High-Risk / Sub-Par loans, incomplete documentation waivers, or excessive high-cost bulk deposits that erode NIM or create post-closing NPLs.
5. Closing Action Sheet: Include one clean, concise row per pipeline item matching its deterministic priorityGroup ("Act Today", "Unblock Bottlenecks", or "Watch Risk / Margin").`;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/analyze-loan', async (req: Request, res: Response) => {
    try {
      if (!(await verifySupabaseBearer(req, res))) return;

      const body = req.body as {
        input?: LoanApplicationInput;
        metrics?: CalculatedMetrics;
      };

      if (!body?.input || !body?.metrics) {
        res.status(400).json({
          error: 'Missing loan application input or financial metrics payload.',
        });
        return;
      }

      const { input, metrics } = body;

      if (!input.businessName?.trim()) {
        res.status(400).json({ error: 'Business Name is required.' });
        return;
      }
      if (!input.monthlyRevenue || input.monthlyRevenue <= 0) {
        res
          .status(400)
          .json({ error: 'Declared Monthly Revenue must be greater than zero.' });
        return;
      }
      if (!input.requestedLoanAmount || input.requestedLoanAmount <= 0) {
        res
          .status(400)
          .json({ error: 'Requested Loan Amount must be greater than zero.' });
        return;
      }

      const ai = createAiClient();
      const prompt = buildPrompt(input, metrics);

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'You are the Chief Credit Underwriter at Northern Banking Credit Intelligence (NBCI), advising commercial bank branch managers in Bangladesh under Bangladesh Bank ICRRS and CRM standards. Your tone is rigorous, forensic, and protective against NPLs. Output strictly valid JSON matching the schema.',
          responseMimeType: 'application/json',
          responseSchema: CREDIT_MEMO_SCHEMA,
        },
      });

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        res.status(502).json({
          error: 'Gemini returned an empty response. Please try again.',
        });
        return;
      }

      const parsed = JSON.parse(rawText) as Omit<
        CreditAnalystMemo,
        'generatedAtIso'
      >;

      const memo: CreditAnalystMemo = {
        ...parsed,
        topFiveNplTriggers: (parsed.topFiveNplTriggers || []).slice(0, 5),
        branchManagerProtectionCovenants: (
          parsed.branchManagerProtectionCovenants || []
        ).slice(0, 5),
        generatedAtIso: new Date().toISOString(),
      };

      res.json({ memo });
    } catch (err: unknown) {
      console.error('Error in /api/analyze-loan:', err);
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to generate credit underwriting memo.';

      if (
        message.includes('API_KEY_INVALID') ||
        message.includes('PERMISSION_DENIED') ||
        message.includes('GEMINI_API_KEY is not configured')
      ) {
        res.status(401).json({
          error:
            'Gemini API key error. Please verify your GEMINI_API_KEY in Settings > Secrets.',
        });
        return;
      }

      if (message.includes('RESOURCE_EXHAUSTED') || message.includes('429')) {
        res.status(429).json({
          error:
            'Gemini API rate limit reached. Please wait a moment and try again.',
        });
        return;
      }

      res.status(500).json({ error: message });
    }
  });

  app.post('/api/analyze-recovery', async (req: Request, res: Response) => {
    try {
      if (!(await verifySupabaseBearer(req, res))) return;

      const body = req.body as {
        input?: RecoveryCaseInput;
        metrics?: RecoveryMetrics;
      };

      if (!body?.input || !body?.metrics) {
        res.status(400).json({
          error: 'Missing recovery case input or calculated metrics payload.',
        });
        return;
      }

      const { input, metrics } = body;

      if (!input.caseReference?.trim()) {
        res.status(400).json({
          error: 'Anonymized Borrower / Case Reference is required.',
        });
        return;
      }
      if (!input.totalOutstandingAmount || input.totalOutstandingAmount <= 0) {
        res.status(400).json({
          error: 'Total Outstanding Balance must be greater than zero.',
        });
        return;
      }

      const ai = createAiClient();
      const prompt = buildRecoveryPrompt(input, metrics);

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'You are the Head of Special Asset Management & Credit Recovery at Northern Banking Credit Intelligence (NBCI), advising commercial bank branch managers and Head Office Recovery Committees in Bangladesh. Your analysis is realistic, skeptical of unverified repayment promises, grounded in Bangladesh Bank BRPD recovery policy and Artha Rin Adalat enforcement, and output strictly as valid JSON matching the schema.',
          responseMimeType: 'application/json',
          responseSchema: RECOVERY_MEMO_SCHEMA,
        },
      });

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        res.status(502).json({
          error: 'Gemini returned an empty response. Please try again.',
        });
        return;
      }

      const parsed = JSON.parse(rawText) as Omit<
        RecoveryMemo,
        'generatedAtIso'
      >;

      const memo: RecoveryMemo = {
        ...parsed,
        generatedAtIso: new Date().toISOString(),
      };

      res.json({ memo });
    } catch (err: unknown) {
      console.error('Error in /api/analyze-recovery:', err);
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to generate recovery & resolution memo.';

      if (
        message.includes('API_KEY_INVALID') ||
        message.includes('PERMISSION_DENIED') ||
        message.includes('GEMINI_API_KEY is not configured')
      ) {
        res.status(401).json({
          error:
            'Gemini API key error. Please verify your GEMINI_API_KEY in Settings > Secrets.',
        });
        return;
      }

      if (message.includes('RESOURCE_EXHAUSTED') || message.includes('429')) {
        res.status(429).json({
          error:
            'Gemini API rate limit reached. Please wait a moment and try again.',
        });
        return;
      }

      res.status(500).json({ error: message });
    }
  });

  app.post('/api/analyze-closing', async (req: Request, res: Response) => {
    try {
      if (!(await verifySupabaseBearer(req, res))) return;

      const body = req.body as {
        input?: ClosingPlannerInput;
        metrics?: ClosingMetrics;
      };

      if (!body?.input || !body?.metrics) {
        res.status(400).json({
          error: 'Missing closing planner input or calculated metrics payload.',
        });
        return;
      }

      const { input, metrics } = body;

      if (!input.daysLeftToClosing || input.daysLeftToClosing <= 0) {
        res.status(400).json({
          error: 'Days Left to Closing must be at least 1 day.',
        });
        return;
      }

      if (metrics.totalTargetBdt <= 0) {
        res.status(400).json({
          error: 'At least one closing target (Deposits, Loans, or NPL Recovery) must exceed ৳ 0.',
        });
        return;
      }

      const ai = createAiClient();
      const prompt = buildClosingPrompt(input, metrics);

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'You are the Head of Branch Strategy & Credit Risk Governance at Northern Banking Credit Intelligence (NBCI), advising commercial bank branch managers in Bangladesh ahead of closing cutoffs. Balance target achievement with strict ICRRS asset quality, CASA profitability, and anti-window-dressing discipline. Output strictly valid JSON matching the schema.',
          responseMimeType: 'application/json',
          responseSchema: CLOSING_BRIEF_SCHEMA,
        },
      });

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        res.status(502).json({
          error: 'Gemini returned an empty response. Please try again.',
        });
        return;
      }

      const parsed = JSON.parse(rawText) as Omit<
        ClosingStrategyBrief,
        'generatedAtIso'
      >;

      const brief: ClosingStrategyBrief = {
        ...parsed,
        generatedAtIso: new Date().toISOString(),
      };

      res.json({ brief });
    } catch (err: unknown) {
      console.error('Error in /api/analyze-closing:', err);
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to generate closing strategy brief.';

      if (
        message.includes('API_KEY_INVALID') ||
        message.includes('PERMISSION_DENIED') ||
        message.includes('GEMINI_API_KEY is not configured')
      ) {
        res.status(401).json({
          error:
            'Gemini API key error. Please verify your GEMINI_API_KEY in Settings > Secrets.',
        });
        return;
      }

      if (message.includes('RESOURCE_EXHAUSTED') || message.includes('429')) {
        res.status(429).json({
          error:
            'Gemini API rate limit reached. Please wait a moment and try again.',
        });
        return;
      }

      res.status(500).json({ error: message });
    }
  });

  const EARLY_WARNING_MEMO_SCHEMA = {
    type: Type.OBJECT,
    properties: {
      riskPostureAndTrajectory: {
        type: Type.OBJECT,
        properties: {
          signalLevel: {
            type: Type.STRING,
            enum: ['NORMAL', 'WATCH', 'CRITICAL'],
          },
          summary: {
            type: Type.STRING,
            description:
              'Concise 2-3 sentence assessment of current post-sanction account conduct, cash diversion exposure, and DPD risk.',
          },
          classificationCountdownNote: {
            type: Type.STRING,
            description:
              'Explicit Bangladesh Bank BRPD classification countdown citing current DPD and days remaining before 90-day Sub-Standard provisioning.',
          },
        },
        required: ['signalLevel', 'summary', 'classificationCountdownNote'],
      },
      cashConductAndDiversionFindings: {
        type: Type.OBJECT,
        properties: {
          routingBehaviorAnalysis: {
            type: Type.STRING,
            description:
              'Evaluation of monthly bank credits routed through the lending branch vs projected sales in BDT and %.',
          },
          utilizationAndCollateralControl: {
            type: Type.STRING,
            description:
              'Evaluation of sanctioned limit utilization %, stock cover % vs required hypothecation value, and covenant breaches.',
          },
        },
        required: [
          'routingBehaviorAnalysis',
          'utilizationAndCollateralControl',
        ],
      },
      containmentActions14Day: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            action: {
              type: Type.STRING,
              description:
                'Specific branch containment action (strictly anonymized, no personal names or PII).',
            },
            ownerRole: {
              type: Type.STRING,
              description:
                'Bank role (Branch Manager, Credit Officer, Relationship Manager, Inspection Officer).',
            },
            deadlineWindow: {
              type: Type.STRING,
              description: 'Execution deadline (e.g., Within 48 Hours, Day 5, Day 14).',
            },
          },
          required: ['action', 'ownerRole', 'deadlineWindow'],
        },
        description: '3 to 5 prioritized 14-day containment steps.',
      },
      escalationAndFreezeTriggers: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description:
          '3 to 4 hard limit-freeze, DP-hold, or SAMD escalation triggers with exact BDT/DPD thresholds.',
      },
    },
    required: [
      'riskPostureAndTrajectory',
      'cashConductAndDiversionFindings',
      'containmentActions14Day',
      'escalationAndFreezeTriggers',
    ],
  };

  function buildEarlyWarningPrompt(
    input: EarlyWarningInput,
    metrics: EarlyWarningMetrics,
  ): string {
    return `Act as a senior Post-Sanction Credit Monitoring & Early Warning Officer at Northern Banking Credit Intelligence (NBCI) in Bangladesh under Bangladesh Bank CRM & BRPD guidelines.

ANONYMIZED SANCTIONED FACILITY PROFILE (STRICT ZERO-PII):
- Anonymized Case ID: ${input.caseCode}
- Sector: ${input.sector} | Facility Type: ${input.facilityType}
- Sanctioned Limit: ${formatBdtForPrompt(input.sanctionedLimitBdt)}
- Current Outstanding: ${formatBdtForPrompt(input.currentOutstandingBdt)} (${metrics.utilizationPct.toFixed(1)}% utilization)
- Monthly Installment / Interest Due: ${formatBdtForPrompt(input.monthlyInstallmentDueBdt)}

POST-SANCTION CONDUCT & EARLY WARNING METRICS:
- Projected Monthly Sales: ${formatBdtForPrompt(input.projectedMonthlySalesBdt)}
- Actual Monthly Bank Credits Routed in Lending Branch: ${formatBdtForPrompt(input.currentMonthlyBankRoutingBdt)} (${metrics.routingCompliancePct.toFixed(1)}% routing compliance${metrics.routingLeakageAlert ? ' — ALERT: BELOW 60% ROUTING' : ''})
- Current Days Past Due (DPD): ${input.daysPastDue} days (${metrics.daysBeforeSubStandard} days buffer before 90-day Sub-Standard classification)
- Required Stock / Collateral Cover: ${formatBdtForPrompt(input.requiredStockCoverBdt)} vs Verified Physical Cover: ${formatBdtForPrompt(input.verifiedStockCoverBdt)} (${metrics.stockCoveragePct.toFixed(1)}%)
- Covenant Checks: Stock Statement On-Time (${input.covenants.quarterlyStockStatementOnTime ? 'YES' : 'BREACH'}), Exclusive Branch Routing (${input.covenants.exclusiveRoutingToLendingBranch ? 'YES' : 'BREACH'}), Insurance & Licenses (${input.covenants.insuranceAndLicensesActive ? 'YES' : 'BREACH'}), Zero Cheque Returns/Irregular Transfers (${input.covenants.zeroChequeReturnOrIrregularTransfers ? 'YES' : 'BREACH'})
- EWS Risk Score: ${metrics.ewsRiskScore}/100 (${metrics.signalLevel})
- Triggered EWS Alerts (${metrics.alerts.length}):
${metrics.alerts.length > 0 ? metrics.alerts.map((a) => `  * [${a.tone.toUpperCase()}] ${a.title} (${a.metricSummary}): ${a.detail}`).join('\n') : '  * None active'}
- Field Officer Notes: ${input.fieldOfficerNotes || 'None provided'}

MANDATE:
1. Keep output strictly Zero-PII (use ${input.caseCode} and bank roles only—never invent borrower names, NIDs, phones, or account numbers).
2. Cite exact BDT figures, routing %, DPD countdown, utilization %, and stock cover %.
3. Provide 3-5 concrete 14-day containment steps and 3-4 hard Drawing Power (DP) freeze / SAMD escalation triggers.`;
  }

  app.post('/api/analyze-early-warning', async (req: Request, res: Response) => {
    try {
      if (!(await verifySupabaseBearer(req, res))) return;

      const body = req.body as {
        input?: EarlyWarningInput;
        metrics?: EarlyWarningMetrics;
      };

      if (!body?.input || !body?.metrics) {
        res.status(400).json({
          error: 'Missing Early Warning case input or metrics payload.',
        });
        return;
      }

      const { input, metrics } = body;

      if (!input.caseCode?.trim()) {
        res.status(400).json({
          error: 'Anonymized Case ID is required for Early Warning analysis.',
        });
        return;
      }

      if (!input.sanctionedLimitBdt || input.sanctionedLimitBdt <= 0) {
        res.status(400).json({
          error: 'Sanctioned Limit must be greater than zero.',
        });
        return;
      }

      const ai = createAiClient();
      const prompt = buildEarlyWarningPrompt(input, metrics);

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'You are the Head of Post-Sanction Credit Monitoring at Northern Banking Credit Intelligence (NBCI) in Bangladesh. Output strictly valid JSON matching the schema with Zero-PII.',
          responseMimeType: 'application/json',
          responseSchema: EARLY_WARNING_MEMO_SCHEMA,
        },
      });

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        res.status(502).json({
          error: 'Gemini returned an empty response. Please try again.',
        });
        return;
      }

      const parsed = JSON.parse(rawText) as Omit<
        EarlyWarningMemo,
        'generatedAtIso'
      >;

      const memo: EarlyWarningMemo = {
        ...parsed,
        generatedAtIso: new Date().toISOString(),
      };

      res.json({ memo });
    } catch (err: unknown) {
      console.error('Error in /api/analyze-early-warning:', err);
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to generate early warning intervention brief.';

      if (
        message.includes('API_KEY_INVALID') ||
        message.includes('PERMISSION_DENIED') ||
        message.includes('GEMINI_API_KEY is not configured')
      ) {
        res.status(401).json({
          error:
            'Gemini API key error. Please verify your GEMINI_API_KEY in Settings > Secrets.',
        });
        return;
      }

      if (message.includes('RESOURCE_EXHAUSTED') || message.includes('429')) {
        res.status(429).json({
          error:
            'Gemini API rate limit reached. Please wait a moment and try again.',
        });
        return;
      }

      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    let viteMiddlewares: express.RequestHandler | null = null;
    let viteInitError: unknown = null;

    const viteReadyPromise = (async () => {
      const { createServer: createViteServer } = await import('vite');
      const disableHmr = process.env.DISABLE_HMR === 'true';
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          ...(disableHmr ? { hmr: false } : {}),
        },
        appType: 'spa',
      });
      viteMiddlewares = vite.middlewares;
    })().catch((err) => {
      viteInitError = err;
      console.error('Failed to initialize Vite middleware:', err);
    });

    app.use((req: Request, res: Response, next) => {
      if (viteMiddlewares) {
        viteMiddlewares(req, res, next);
        return;
      }
      viteReadyPromise
        .then(() => {
          if (viteInitError) {
            res.status(500).send('Vite dev middleware failed to initialize.');
            return;
          }
          if (viteMiddlewares) {
            viteMiddlewares(req, res, next);
            return;
          }
          next();
        })
        .catch(next);
    });
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req: Request, res: Response) => {
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Production build not found. Run npm run build.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `Northern Banking Credit Intelligence Suite listening on http://0.0.0.0:${PORT}`,
    );
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
