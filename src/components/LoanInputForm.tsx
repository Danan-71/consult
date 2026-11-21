import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import type {
  BusinessCategory,
  CibStatus,
  CollateralCategory,
  CollateralLiquidityRisk,
  ComplianceChecklist,
  DisbursementControl,
  ExposureLevel,
  FacilityType,
  LegalStructure,
  LoanApplicationInput,
  PricingPowerLevel,
  SectorSpecificData,
  SuccessionBackup,
  YesNo,
} from '../types/credit';
import {
  BUSINESS_CATEGORIES,
  CIB_STATUSES,
  COLLATERAL_CATEGORIES,
  COLLATERAL_LIQUIDITY_RISKS,
  DISBURSEMENT_CONTROLS,
  FACILITY_TYPES,
  LEGAL_STRUCTURES,
  formatBDT,
  formatBDTScaleHint,
} from '../utils/finance';

interface LoanInputFormProps {
  input: LoanApplicationInput;
  onChange: (updated: LoanApplicationInput) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  validationError: string | null;
}

const WIZARD_TABS = [
  { id: 1, shortLabel: '1. Sector & Profile', title: '1. Business Sector & Profile (15-Sector Engine)' },
  { id: 2, shortLabel: '2. KYC & CIB', title: '2. KYC, CIB & Management Integrity' },
  { id: 3, shortLabel: '3. Cash & Profit', title: '3. Forensic Cash, Project Budget & Profit' },
  { id: 4, shortLabel: '4. CCC & Inflation', title: '4. Working Capital & Inflation Sensitivity' },
  { id: 5, shortLabel: '5. Equity & Debt', title: '5. Capital Structure & Existing Liabilities' },
  { id: 6, shortLabel: '6. Loan & Security', title: '6. Requested Loan, Execution & Collateral' },
] as const;

const PRICING_POWER_OPTIONS: { value: PricingPowerLevel; label: string }[] = [
  { value: 'Low', label: 'Low - Fixed flat/tender contracts / cannot raise prices' },
  { value: 'Medium', label: 'Medium - Can pass 50% of cost hike' },
  { value: 'High', label: 'High - Can pass 100% of cost hike' },
];

const EXPOSURE_LEVELS: ExposureLevel[] = ['Low', 'Medium', 'High'];

function BdtCurrencyInput({
  id,
  label,
  value,
  onChange,
  placeholder = '0',
  helperNote,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (val: number) => void;
  placeholder?: string;
  helperNote?: string;
}) {
  const scaleHint = formatBDTScaleHint(value);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <label htmlFor={id} className="block text-xs font-medium text-slate-700">
          {label}
        </label>
        {value > 0 && (
          <span className="font-mono text-[11px] text-slate-500 tabular-nums whitespace-nowrap">
            {formatBDT(value)}
            {scaleHint ? ` · ${scaleHint}` : ''}
          </span>
        )}
      </div>
      <div className="relative">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 font-mono text-sm font-medium text-slate-500"
        >
          ৳
        </span>
        <input
          id={id}
          type="number"
          min={0}
          step={1000}
          value={value === 0 ? '' : value}
          placeholder={placeholder}
          onChange={(e) => {
            const parsed = Number(e.target.value);
            onChange(Number.isFinite(parsed) && parsed >= 0 ? parsed : 0);
          }}
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 font-mono text-sm text-slate-900 tabular-nums placeholder:text-slate-400 focus:border-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-800/15"
        />
      </div>
      {helperNote && (
        <p className="mt-1 text-[11px] text-slate-500">{helperNote}</p>
      )}
    </div>
  );
}

function NumericField({
  id,
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  suffix,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-medium text-slate-700 mb-1.5"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const parsed = Number(e.target.value);
            onChange(Number.isFinite(parsed) ? parsed : 0);
          }}
          className={`w-full rounded-lg border border-slate-200 bg-white py-2 pl-3 font-mono text-sm text-slate-900 tabular-nums focus:border-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-800/15 ${
            suffix ? 'pr-14' : 'pr-3'
          }`}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-slate-500">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function SelectField<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: T;
  options: readonly T[];
  onChange: (val: T) => void;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-medium text-slate-700 mb-1.5"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-800/15"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

export function LoanInputForm({
  input,
  onChange,
  onAnalyze,
  isAnalyzing,
  validationError,
}: LoanInputFormProps) {
  const prefersReducedMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<number>(1);
  const [costEntryMode, setCostEntryMode] = useState<'cogs' | 'margin'>('cogs');

  const updateField = <K extends keyof LoanApplicationInput>(
    key: K,
    value: LoanApplicationInput[K],
  ) => {
    onChange({ ...input, [key]: value });
  };

  const updateSectorField = <K extends keyof SectorSpecificData>(
    key: K,
    value: SectorSpecificData[K],
  ) => {
    onChange({
      ...input,
      sectorData: {
        ...input.sectorData,
        [key]: value,
      },
    });
  };

  const updateCompliance = <K extends keyof ComplianceChecklist>(
    key: K,
    value: boolean,
  ) => {
    onChange({
      ...input,
      compliance: {
        ...input.compliance,
        [key]: value,
      },
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onAnalyze();
  };

  const currentGrossMarginPct =
    input.monthlyRevenue > 0
      ? ((input.monthlyRevenue - input.directCost) / input.monthlyRevenue) * 100
      : 0;

  const avgMonthlyBankDeposit = (input.annualBankCreditTurnover || 0) / 12;
  const bankTurnoverRatioPct =
    input.monthlyRevenue > 0
      ? (avgMonthlyBankDeposit / input.monthlyRevenue) * 100
      : 0;

  const last2MonthsTotal = Math.max(0, input.last2MonthsBankCreditTotal || 0);
  const last2MonthsAvg = last2MonthsTotal / 2;
  const earlier10MonthsAvg =
    Math.max(0, (input.annualBankCreditTurnover || 0) - last2MonthsTotal) / 10;
  const windowDressingRatio =
    last2MonthsTotal > 0 && (input.annualBankCreditTurnover || 0) > 0
      ? earlier10MonthsAvg > 0
        ? last2MonthsAvg / earlier10MonthsAvg
        : 99.9
      : null;
  const windowDressingAlert =
    windowDressingRatio !== null && windowDressingRatio > 2.2;

  const dailyDirectCost = input.directCost > 0 ? input.directCost / 30 : 0;
  const inventoryDays =
    dailyDirectCost > 0 ? input.inventoryWipValue / dailyDirectCost : 0;
  const cccDays = inventoryDays + input.receivableDays - input.payableDays;

  const renderDynamicSectorFields = () => {
    const s = input.sectorData;

    switch (input.businessCategory) {
      case 'Real Estate & Land Developer':
        return (
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SelectField
                id="realEstateLandType"
                label="Land Type"
                value={s.realEstateLandType}
                options={[
                  'Own Land',
                  'Joint Venture with Registered Power of Attorney',
                  'JV Unregistered',
                ]}
                onChange={(v) => updateSectorField('realEstateLandType', v)}
              />
              <SelectField<YesNo>
                id="realEstateApprovedPlan"
                label="RAJUK / City Corp Approved Plan?"
                value={s.realEstateApprovedPlan}
                options={['Yes', 'No']}
                onChange={(v) => updateSectorField('realEstateApprovedPlan', v)}
              />
            </div>
            <BdtCurrencyInput
              id="realEstateTotalProjectCost"
              label="Total Project Cost (৳)"
              value={s.realEstateTotalProjectCost}
              onChange={(v) =>
                updateSectorField('realEstateTotalProjectCost', v)
              }
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <NumericField
                id="realEstateFlatsPreSoldPct"
                label="Flats Pre-Sold"
                value={s.realEstateFlatsPreSoldPct}
                max={100}
                onChange={(v) =>
                  updateSectorField(
                    'realEstateFlatsPreSoldPct',
                    Math.min(100, Math.max(0, v)),
                  )
                }
                suffix="%"
              />
              <NumericField
                id="realEstatePhysicalCompletionPct"
                label="Physical Done"
                value={s.realEstatePhysicalCompletionPct}
                max={100}
                onChange={(v) =>
                  updateSectorField(
                    'realEstatePhysicalCompletionPct',
                    Math.min(100, Math.max(0, v)),
                  )
                }
                suffix="%"
              />
              <NumericField
                id="realEstateMonthsToHandover"
                label="To Handover"
                value={s.realEstateMonthsToHandover}
                onChange={(v) =>
                  updateSectorField(
                    'realEstateMonthsToHandover',
                    Math.max(0, v),
                  )
                }
                suffix="mo"
              />
            </div>
          </div>
        );

      case 'LGED / Public Works Construction Contractor':
        return (
          <div className="space-y-3 pt-2">
            <BdtCurrencyInput
              id="contractorActiveWorkOrderValue"
              label="Active Work Order Value (৳)"
              value={s.contractorActiveWorkOrderValue}
              onChange={(v) =>
                updateSectorField('contractorActiveWorkOrderValue', v)
              }
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <NumericField
                id="contractorWorkCompletedPct"
                label="% Physical Work Completed"
                value={s.contractorWorkCompletedPct}
                max={100}
                onChange={(v) =>
                  updateSectorField(
                    'contractorWorkCompletedPct',
                    Math.min(100, Math.max(0, v)),
                  )
                }
                suffix="%"
              />
              <NumericField
                id="contractorGovtBillDelayMonths"
                label="Avg. Govt. Bill Delay"
                value={s.contractorGovtBillDelayMonths}
                step={0.5}
                onChange={(v) =>
                  updateSectorField(
                    'contractorGovtBillDelayMonths',
                    Math.max(0, v),
                  )
                }
                suffix="mo"
              />
            </div>
            <BdtCurrencyInput
              id="contractorRetentionMoneyLocked"
              label="Retention Money Locked (৳)"
              value={s.contractorRetentionMoneyLocked}
              onChange={(v) =>
                updateSectorField('contractorRetentionMoneyLocked', v)
              }
            />
          </div>
        );

      case 'Dealers & Brand Distributors (FMCG/Cement/Rod/Fertilizer)':
        return (
          <div className="space-y-3 pt-2">
            <div>
              <label
                htmlFor="dealerPrincipalBrand"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Principal Brand Name
              </label>
              <input
                id="dealerPrincipalBrand"
                type="text"
                value={s.dealerPrincipalBrand}
                onChange={(e) =>
                  updateSectorField('dealerPrincipalBrand', e.target.value)
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-800/15"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <BdtCurrencyInput
                id="dealerMonthlyTarget"
                label="Monthly Sales Target (৳)"
                value={s.dealerMonthlyTarget}
                onChange={(v) => updateSectorField('dealerMonthlyTarget', v)}
              />
              <BdtCurrencyInput
                id="dealerUncollectedBaki"
                label="Uncollected Retailer Baki (৳)"
                value={s.dealerUncollectedBaki}
                onChange={(v) => updateSectorField('dealerUncollectedBaki', v)}
              />
            </div>
            <NumericField
              id="dealerMarginAndBonusPct"
              label="Dealer Margin + Target Bonus (%)"
              value={s.dealerMarginAndBonusPct}
              step={0.1}
              max={50}
              onChange={(v) =>
                updateSectorField('dealerMarginAndBonusPct', Math.max(0, v))
              }
              suffix="%"
            />
          </div>
        );

      case 'Bus / Truck / Commercial Transport':
        return (
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <NumericField
                id="transportVehicleCount"
                label="Number of Vehicles"
                value={s.transportVehicleCount}
                min={1}
                onChange={(v) =>
                  updateSectorField('transportVehicleCount', Math.max(1, v))
                }
                suffix="units"
              />
              <NumericField
                id="transportAvgVehicleAgeYears"
                label="Avg. Vehicle Age"
                value={s.transportAvgVehicleAgeYears}
                onChange={(v) =>
                  updateSectorField(
                    'transportAvgVehicleAgeYears',
                    Math.max(0, v),
                  )
                }
                suffix="yrs"
              />
            </div>
            <BdtCurrencyInput
              id="transportDailyNetTripCollection"
              label="Average Daily Net Trip Collection (৳)"
              value={s.transportDailyNetTripCollection}
              onChange={(v) =>
                updateSectorField('transportDailyNetTripCollection', v)
              }
            />
            <SelectField<YesNo>
              id="transportInsurancePermitValid"
              label="Comprehensive Insurance & Route Permit Valid?"
              value={s.transportInsurancePermitValid}
              options={['Yes', 'No']}
              onChange={(v) =>
                updateSectorField('transportInsurancePermitValid', v)
              }
            />
          </div>
        );

      case 'Brick Manufacturing (Ita Bhati)':
        return (
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <NumericField
                id="brickOperatingMonthsPerYear"
                label="Operating Months / Year"
                value={s.brickOperatingMonthsPerYear}
                min={1}
                max={12}
                onChange={(v) =>
                  updateSectorField(
                    'brickOperatingMonthsPerYear',
                    Math.min(12, Math.max(1, v)),
                  )
                }
                suffix="mo/yr"
              />
              <SelectField<YesNo>
                id="brickEnvDcLicenseValid"
                label="Environment & DC License Valid?"
                value={s.brickEnvDcLicenseValid}
                options={['Yes', 'No']}
                onChange={(v) =>
                  updateSectorField('brickEnvDcLicenseValid', v)
                }
              />
            </div>
            <BdtCurrencyInput
              id="brickAdvanceDadanSoilCoalPaid"
              label="Advance Labor (Dadan) & Soil/Coal Paid (৳)"
              value={s.brickAdvanceDadanSoilCoalPaid}
              onChange={(v) =>
                updateSectorField('brickAdvanceDadanSoilCoalPaid', v)
              }
            />
            <SelectField
              id="brickUnbakedRainRisk"
              label="Unbaked Stock Rain Risk Exposure"
              value={s.brickUnbakedRainRisk}
              options={EXPOSURE_LEVELS}
              onChange={(v) => updateSectorField('brickUnbakedRainRisk', v)}
            />
          </div>
        );

      case 'Agro-Trading / Rice Mill / Cold Storage':
        return (
          <div className="space-y-3 pt-2">
            <BdtCurrencyInput
              id="agroStockValue"
              label="Current Godown / Cold-Storage Stock Value (৳)"
              value={s.agroStockValue}
              onChange={(v) => updateSectorField('agroStockValue', v)}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <SelectField
                id="agroPriceVolatility"
                label="Price Volatility"
                value={s.agroPriceVolatility}
                options={EXPOSURE_LEVELS}
                onChange={(v) => updateSectorField('agroPriceVolatility', v)}
              />
              <SelectField
                id="agroPowerReliability"
                label="Backup Power"
                value={s.agroPowerReliability}
                options={['Good', 'Poor']}
                onChange={(v) => updateSectorField('agroPowerReliability', v)}
              />
              <SelectField
                id="agroMoistureSpoilageRisk"
                label="Spoilage Risk"
                value={s.agroMoistureSpoilageRisk}
                options={EXPOSURE_LEVELS}
                onChange={(v) =>
                  updateSectorField('agroMoistureSpoilageRisk', v)
                }
              />
            </div>
          </div>
        );

      case 'Poultry / Dairy / Fisheries Farm':
        return (
          <div className="space-y-3 pt-2">
            <BdtCurrencyInput
              id="farmFlockHerdPondValue"
              label="Active Flock / Herd / Pond Value (৳)"
              value={s.farmFlockHerdPondValue}
              onChange={(v) => updateSectorField('farmFlockHerdPondValue', v)}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <SelectField
                id="farmBiosecurityProtocol"
                label="Biosecurity"
                value={s.farmBiosecurityProtocol}
                options={['Strong', 'Basic', 'Weak']}
                onChange={(v) =>
                  updateSectorField('farmBiosecurityProtocol', v)
                }
              />
              <NumericField
                id="farmFeedCostPctOfRevenue"
                label="Feed Cost % Rev"
                value={s.farmFeedCostPctOfRevenue}
                max={100}
                onChange={(v) =>
                  updateSectorField(
                    'farmFeedCostPctOfRevenue',
                    Math.min(100, Math.max(0, v)),
                  )
                }
                suffix="%"
              />
              <SelectField
                id="farmDiseaseHistory"
                label="Disease History"
                value={s.farmDiseaseHistory}
                options={['None', 'Minor Seasonal', 'Recent Outbreak']}
                onChange={(v) => updateSectorField('farmDiseaseHistory', v)}
              />
            </div>
          </div>
        );

      case 'Clinic / Diagnostic Center / Hospital / Pharmacy':
        return (
          <div className="space-y-3 pt-2">
            <BdtCurrencyInput
              id="clinicMedicalEquipmentValue"
              label="Medical Equipment Value (৳)"
              value={s.clinicMedicalEquipmentValue}
              onChange={(v) =>
                updateSectorField('clinicMedicalEquipmentValue', v)
              }
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <SelectField
                id="clinicDoctorDependency"
                label="Doctor Dependency"
                value={s.clinicDoctorDependency}
                options={EXPOSURE_LEVELS}
                onChange={(v) => updateSectorField('clinicDoctorDependency', v)}
              />
              <NumericField
                id="clinicDailyPatientCount"
                label="Daily Patients"
                value={s.clinicDailyPatientCount}
                onChange={(v) =>
                  updateSectorField('clinicDailyPatientCount', Math.max(0, v))
                }
                suffix="/day"
              />
              <SelectField<YesNo>
                id="clinicDghsLicenseValid"
                label="DGHS License?"
                value={s.clinicDghsLicenseValid}
                options={['Yes', 'No']}
                onChange={(v) => updateSectorField('clinicDghsLicenseValid', v)}
              />
            </div>
          </div>
        );

      case 'Importer':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <NumericField
              id="importerImportedInventoryPct"
              label="% Inventory Imported"
              value={s.importerImportedInventoryPct}
              max={100}
              onChange={(v) =>
                updateSectorField(
                  'importerImportedInventoryPct',
                  Math.min(100, Math.max(0, v)),
                )
              }
              suffix="%"
            />
            <NumericField
              id="importerLcMarginPaidPct"
              label="LC Margin Paid (%)"
              value={s.importerLcMarginPaidPct}
              max={100}
              onChange={(v) =>
                updateSectorField(
                  'importerLcMarginPaidPct',
                  Math.min(100, Math.max(0, v)),
                )
              }
              suffix="%"
            />
            <SelectField
              id="importerFxExposure"
              label="USD / BDT FX Exposure"
              value={s.importerFxExposure}
              options={EXPOSURE_LEVELS}
              onChange={(v) => updateSectorField('importerFxExposure', v)}
            />
            <NumericField
              id="importerPortClearanceDays"
              label="Port/Customs Clearance"
              value={s.importerPortClearanceDays}
              onChange={(v) =>
                updateSectorField('importerPortClearanceDays', Math.max(0, v))
              }
              suffix="days"
            />
          </div>
        );

      case 'Exporter (RMG / Jute / Agro / Leather)':
        return (
          <div className="space-y-3 pt-2">
            <BdtCurrencyInput
              id="exporterConfirmedLcValue"
              label="Confirmed Export LC / Order Value (৳)"
              value={s.exporterConfirmedLcValue}
              onChange={(v) => updateSectorField('exporterConfirmedLcValue', v)}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <NumericField
                id="exporterSingleBuyerSharePct"
                label="Top Buyer %"
                value={s.exporterSingleBuyerSharePct}
                max={100}
                onChange={(v) =>
                  updateSectorField(
                    'exporterSingleBuyerSharePct',
                    Math.min(100, Math.max(0, v)),
                  )
                }
                suffix="%"
              />
              <NumericField
                id="exporterShipmentLeadTimeDays"
                label="Lead Time"
                value={s.exporterShipmentLeadTimeDays}
                onChange={(v) =>
                  updateSectorField(
                    'exporterShipmentLeadTimeDays',
                    Math.max(0, v),
                  )
                }
                suffix="days"
              />
              <SelectField
                id="exporterComplianceStatus"
                label="Compliance"
                value={s.exporterComplianceStatus}
                options={['Fully Compliant', 'Partial', 'Non-Compliant']}
                onChange={(v) =>
                  updateSectorField('exporterComplianceStatus', v)
                }
              />
            </div>
          </div>
        );

      case 'Garments / Textile / Light Engineering Factory':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <NumericField
              id="factoryCapacityUtilizationPct"
              label="Capacity Utilization (%)"
              value={s.factoryCapacityUtilizationPct}
              max={100}
              onChange={(v) =>
                updateSectorField(
                  'factoryCapacityUtilizationPct',
                  Math.min(100, Math.max(0, v)),
                )
              }
              suffix="%"
            />
            <NumericField
              id="factoryWorkerCount"
              label="Number of Workers"
              value={s.factoryWorkerCount}
              onChange={(v) =>
                updateSectorField('factoryWorkerCount', Math.max(0, v))
              }
              suffix="staff"
            />
            <SelectField
              id="factoryUtilityStability"
              label="Gas / Power Supply"
              value={s.factoryUtilityStability}
              options={['Good', 'Disrupted']}
              onChange={(v) => updateSectorField('factoryUtilityStability', v)}
            />
            <NumericField
              id="factoryOrderBacklogMonths"
              label="Order Backlog"
              value={s.factoryOrderBacklogMonths}
              step={0.5}
              onChange={(v) =>
                updateSectorField('factoryOrderBacklogMonths', Math.max(0, v))
              }
              suffix="mo"
            />
          </div>
        );

      case 'Hotel / Resort / Restaurant / Bakery':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <NumericField
              id="hospitalityMonthsOpen"
              label="Months Open at Location"
              value={s.hospitalityMonthsOpen}
              onChange={(v) =>
                updateSectorField('hospitalityMonthsOpen', Math.max(0, v))
              }
              suffix="mo"
            />
            <NumericField
              id="hospitalityRentToSalesPct"
              label="Rent-to-Sales Ratio (%)"
              value={s.hospitalityRentToSalesPct}
              max={100}
              onChange={(v) =>
                updateSectorField(
                  'hospitalityRentToSalesPct',
                  Math.min(100, Math.max(0, v)),
                )
              }
              suffix="%"
            />
            <NumericField
              id="hospitalityOccupancyTurnoverPct"
              label="Occupancy / Table Turnover"
              value={s.hospitalityOccupancyTurnoverPct}
              max={100}
              onChange={(v) =>
                updateSectorField(
                  'hospitalityOccupancyTurnoverPct',
                  Math.min(100, Math.max(0, v)),
                )
              }
              suffix="%"
            />
            <NumericField
              id="hospitalityFoodWastagePct"
              label="Food Wastage (%)"
              value={s.hospitalityFoodWastagePct}
              max={100}
              onChange={(v) =>
                updateSectorField(
                  'hospitalityFoodWastagePct',
                  Math.min(100, Math.max(0, v)),
                )
              }
              suffix="%"
            />
          </div>
        );

      case 'Local Wholesale & Retail Shop (Hardware/Cloth/Grocery/Electronics)':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <SelectField
              id="retailSeasonalPeakDependency"
              label="Seasonal Peak Dependency"
              value={s.retailSeasonalPeakDependency}
              options={EXPOSURE_LEVELS}
              onChange={(v) =>
                updateSectorField('retailSeasonalPeakDependency', v)
              }
            />
            <NumericField
              id="retailDeadStockPct"
              label="Dead / Slow-Moving Stock"
              value={s.retailDeadStockPct}
              max={100}
              onChange={(v) =>
                updateSectorField(
                  'retailDeadStockPct',
                  Math.min(100, Math.max(0, v)),
                )
              }
              suffix="%"
            />
            <NumericField
              id="retailAvgBakiDays"
              label="Avg. Customer Baki Days"
              value={s.retailAvgBakiDays}
              onChange={(v) =>
                updateSectorField('retailAvgBakiDays', Math.max(0, v))
              }
              suffix="days"
            />
            <SelectField
              id="retailShopOwnership"
              label="Shop Ownership"
              value={s.retailShopOwnership}
              options={['Owned', 'Rented']}
              onChange={(v) => updateSectorField('retailShopOwnership', v)}
            />
          </div>
        );

      case 'Online / E-Commerce / F-Commerce':
        return (
          <div className="space-y-3 pt-2">
            <BdtCurrencyInput
              id="onlineMonthlyAdSpend"
              label="Monthly Digital Ad Spend (৳)"
              value={s.onlineMonthlyAdSpend}
              onChange={(v) => updateSectorField('onlineMonthlyAdSpend', v)}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <NumericField
                id="onlineReturnCancellationPct"
                label="Return / RTO"
                value={s.onlineReturnCancellationPct}
                max={100}
                onChange={(v) =>
                  updateSectorField(
                    'onlineReturnCancellationPct',
                    Math.min(100, Math.max(0, v)),
                  )
                }
                suffix="%"
              />
              <NumericField
                id="onlineCodSettlementDays"
                label="COD Days"
                value={s.onlineCodSettlementDays}
                onChange={(v) =>
                  updateSectorField('onlineCodSettlementDays', Math.max(0, v))
                }
                suffix="days"
              />
              <NumericField
                id="onlineRepeatCustomerRatePct"
                label="Repeat Rate"
                value={s.onlineRepeatCustomerRatePct}
                max={100}
                onChange={(v) =>
                  updateSectorField(
                    'onlineRepeatCustomerRatePct',
                    Math.min(100, Math.max(0, v)),
                  )
                }
                suffix="%"
              />
            </div>
          </div>
        );

      case 'IT / Software / Educational Institution / Service Business':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
            <NumericField
              id="serviceRecurringRevenuePct"
              label="Recurring Rev"
              value={s.serviceRecurringRevenuePct}
              max={100}
              onChange={(v) =>
                updateSectorField(
                  'serviceRecurringRevenuePct',
                  Math.min(100, Math.max(0, v)),
                )
              }
              suffix="%"
            />
            <SelectField
              id="serviceKeyPersonDependency"
              label="Key-Person Risk"
              value={s.serviceKeyPersonDependency}
              options={EXPOSURE_LEVELS}
              onChange={(v) =>
                updateSectorField('serviceKeyPersonDependency', v)
              }
            />
            <NumericField
              id="serviceReceivableCollectionDays"
              label="Collection Days"
              value={s.serviceReceivableCollectionDays}
              onChange={(v) =>
                updateSectorField(
                  'serviceReceivableCollectionDays',
                  Math.max(0, v),
                )
              }
              suffix="days"
            />
          </div>
        );
    }
  };

  const currentTabInfo = WIZARD_TABS.find((t) => t.id === activeTab)!;

  return (
    <form
      id="section-wizard"
      onSubmit={handleSubmit}
      className="rounded-xl border border-[#E2E8F0] bg-white ncg-card print:hidden"
    >
      {/* Wizard Header */}
      <div className="border-b border-[#E2E8F0] px-5 py-4">
        <div className="flex items-baseline justify-between gap-2">
          <h1 className="font-display text-base font-semibold text-[#0B192C]">
            NCG 6-Tab ICRRS Underwriting Wizard
          </h1>
          <span className="font-mono text-xs text-slate-500 tabular-nums">
            Tab {activeTab} / 6
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          15-sector dynamic appraisal &amp; forensic verification
        </p>

        {/* 6-Tab Stepper Navigation */}
        <div
          role="tablist"
          aria-label="Underwriting Tabs"
          className="mt-3.5 grid grid-cols-2 sm:grid-cols-3 gap-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-1"
        >
          {WIZARD_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition-all duration-200 ease-out whitespace-nowrap truncate cursor-pointer ${
                  isActive
                    ? 'bg-[#0B192C] text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-white hover:text-[#0B192C]'
                }`}
              >
                {tab.shortLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Tab Content */}
      <div className="p-5 space-y-4">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -8 }}
            transition={{
              duration: prefersReducedMotion ? 0.12 : 0.22,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="space-y-4"
          >
        <div className="border-b border-slate-100 pb-2.5">
          <h2 className="font-display text-sm font-semibold text-[#0B192C]">
            {currentTabInfo.title}
          </h2>
        </div>

        {/* TAB 1: Business Sector & Profile */}
        {activeTab === 1 && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="businessName"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  Business Name
                </label>
                <input
                  id="businessName"
                  type="text"
                  required
                  value={input.businessName}
                  onChange={(e) => updateField('businessName', e.target.value)}
                  placeholder="e.g., Rupayan Crest Developments Ltd."
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-800/15"
                />
              </div>

              <div>
                <label
                  htmlFor="ownerMdName"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  Owner / MD Name
                </label>
                <input
                  id="ownerMdName"
                  type="text"
                  value={input.ownerMdName}
                  onChange={(e) => updateField('ownerMdName', e.target.value)}
                  placeholder="e.g., Engr. Tariqul Islam"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-800/15"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label
                  htmlFor="districtCity"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  District / City
                </label>
                <input
                  id="districtCity"
                  type="text"
                  value={input.districtCity}
                  onChange={(e) => updateField('districtCity', e.target.value)}
                  placeholder="e.g., Dhaka / Mymensingh"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-800/15"
                />
              </div>

              <SelectField
                id="legalStructure"
                label="Legal Structure"
                value={input.legalStructure}
                options={LEGAL_STRUCTURES}
                onChange={(v) => updateField('legalStructure', v)}
              />

              <NumericField
                id="yearsInOperation"
                label="Years Operating"
                value={input.yearsInOperation}
                step={0.5}
                onChange={(v) => updateField('yearsInOperation', Math.max(0, v))}
                suffix="yrs"
              />
            </div>

            <div>
              <label
                htmlFor="businessCategory"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Business Sector (15 Sectors)
              </label>
              <select
                id="businessCategory"
                value={input.businessCategory}
                onChange={(e) =>
                  updateField(
                    'businessCategory',
                    e.target.value as BusinessCategory,
                  )
                }
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 focus:border-emerald-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800/15"
              >
                {BUSINESS_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5">
              <div className="text-[11px] font-semibold text-slate-700">
                Sector-Specific Risk Fields · {input.businessCategory}
              </div>
              {renderDynamicSectorFields()}
            </div>

            <div>
              <label
                htmlFor="businessModelDescription"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Business / Project Model Summary
              </label>
              <textarea
                id="businessModelDescription"
                rows={3}
                value={input.businessModelDescription}
                onChange={(e) =>
                  updateField('businessModelDescription', e.target.value)
                }
                placeholder="Explain operations, suppliers, customer collection terms, and seasonality..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-800/15"
              />
            </div>
          </div>
        )}

        {/* TAB 2: KYC, CIB & Management Integrity */}
        {activeTab === 2 && (
          <div className="space-y-3.5">
            <SelectField<CibStatus>
              id="cibStatus"
              label="Bangladesh Bank CIB Status"
              value={input.cibStatus}
              options={CIB_STATUSES}
              onChange={(v) => updateField('cibStatus', v)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <NumericField
                id="ownerAge"
                label="Owner's Age"
                value={input.ownerAge}
                min={18}
                max={95}
                onChange={(v) => updateField('ownerAge', Math.max(18, v))}
                suffix="yrs"
              />
              <NumericField
                id="sectorExperienceYears"
                label="Sector Experience"
                value={input.sectorExperienceYears}
                onChange={(v) =>
                  updateField('sectorExperienceYears', Math.max(0, v))
                }
                suffix="yrs"
              />
              <SelectField<SuccessionBackup>
                id="successionBackup"
                label="Succession Backup"
                value={input.successionBackup}
                options={['Active Partner/Next-Gen', 'Sole Owner Only']}
                onChange={(v) => updateField('successionBackup', v)}
              />
            </div>

            <div className="rounded-lg border border-slate-200 p-4 space-y-2.5">
              <div className="text-xs font-semibold text-slate-900">
                Mandatory Verification &amp; Legal Clearance Checklist
              </div>
              <div className="space-y-2.5 pt-1 text-xs text-slate-700">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={input.compliance.validTradeLicense}
                    onChange={(e) =>
                      updateCompliance('validTradeLicense', e.target.checked)
                    }
                    className="h-4 w-4 rounded border-slate-300 text-emerald-800 focus:ring-emerald-800"
                  />
                  <span>Valid Trade License (Current FY Renewed)</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={input.compliance.updatedTinBin}
                    onChange={(e) =>
                      updateCompliance('updatedTinBin', e.target.checked)
                    }
                    className="h-4 w-4 rounded border-slate-300 text-emerald-800 focus:ring-emerald-800"
                  />
                  <span>Updated Tax / e-TIN &amp; VAT / BIN Return</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={input.compliance.siteAndStockVerified}
                    onChange={(e) =>
                      updateCompliance('siteAndStockVerified', e.target.checked)
                    }
                    className="h-4 w-4 rounded border-slate-300 text-emerald-800 focus:ring-emerald-800"
                  />
                  <span>Physical Site &amp; Stock Verified by Branch Manager</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={input.compliance.zeroLegalOrNi138Cases}
                    onChange={(e) =>
                      updateCompliance('zeroLegalOrNi138Cases', e.target.checked)
                    }
                    className="h-4 w-4 rounded border-slate-300 text-emerald-800 focus:ring-emerald-800"
                  />
                  <span>
                    Zero Pending Legal / NI Act Section 138 Cheque Dishonor Cases
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Forensic Cash, Project Budget & Profit Verification */}
        {activeTab === 3 && (
          <div className="space-y-3.5">
            <BdtCurrencyInput
              id="monthlyRevenue"
              label="Declared Average Monthly Revenue / Project Inflow (৳)"
              value={input.monthlyRevenue}
              onChange={(v) => updateField('monthlyRevenue', v)}
              placeholder="5200000"
            />

            <BdtCurrencyInput
              id="annualBankCreditTurnover"
              label="Last 12 Months Bank Statement Credit Turnover (৳)"
              value={input.annualBankCreditTurnover}
              onChange={(v) => updateField('annualBankCreditTurnover', v)}
              placeholder="54000000"
              helperNote="Sum of 12-month credit deposits across business bank accounts"
            />

            <BdtCurrencyInput
              id="last2MonthsBankCreditTotal"
              label="Last 2 Months Total Bank Credits (Window-Dressing Check) (৳)"
              value={input.last2MonthsBankCreditTotal}
              onChange={(v) => updateField('last2MonthsBankCreditTotal', v)}
              placeholder="9600000"
              helperNote="Flags WINDOW DRESSING ALERT if last 2m avg jumps >2.2x vs. earlier 10m avg"
            />

            {(input.monthlyRevenue > 0 || windowDressingRatio !== null) && (
              <div className="space-y-1.5">
                {input.monthlyRevenue > 0 && (
                  <div
                    className={`rounded-lg border px-3.5 py-2 text-xs flex items-center justify-between gap-2 ${
                      bankTurnoverRatioPct < 50
                        ? 'border-red-200 bg-red-50 text-red-900'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      {bankTurnoverRatioPct < 50 && (
                        <AlertTriangle
                          className="h-3.5 w-3.5 text-red-700 shrink-0"
                          aria-hidden="true"
                        />
                      )}
                      <span>Bank Statement Truth Check (50% Floor)</span>
                    </span>
                    <span className="font-mono font-semibold tabular-nums">
                      {bankTurnoverRatioPct.toFixed(1)}% (
                      {formatBDT(avgMonthlyBankDeposit)}/mo)
                    </span>
                  </div>
                )}

                {windowDressingRatio !== null && (
                  <div
                    className={`rounded-lg border px-3.5 py-2 text-xs flex items-center justify-between gap-2 ${
                      windowDressingAlert
                        ? 'border-red-300 bg-red-50 text-red-950'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      {windowDressingAlert && (
                        <AlertTriangle
                          className="h-3.5 w-3.5 text-red-700 shrink-0"
                          aria-hidden="true"
                        />
                      )}
                      <span>
                        {windowDressingAlert
                          ? 'WINDOW DRESSING ALERT (>2.2x Spike)'
                          : 'Deposit Velocity Check (Last 2m vs Prior 10m)'}
                      </span>
                    </span>
                    <span className="font-mono font-semibold tabular-nums">
                      {windowDressingRatio >= 90
                        ? '>10.0x'
                        : `${windowDressingRatio.toFixed(2)}x`}{' '}
                      ({formatBDT(last2MonthsAvg)}/mo vs {formatBDT(earlier10MonthsAvg)}/mo)
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-700">
                  Direct Cost / Gross Margin Input
                </span>
                <div className="inline-flex rounded-md bg-slate-100 p-0.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setCostEntryMode('cogs')}
                    className={`rounded px-2 py-1 font-medium cursor-pointer ${
                      costEntryMode === 'cogs'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600'
                    }`}
                  >
                    Direct Cost (৳/mo)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCostEntryMode('margin')}
                    className={`rounded px-2 py-1 font-medium cursor-pointer ${
                      costEntryMode === 'margin'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600'
                    }`}
                  >
                    Gross Margin (%)
                  </button>
                </div>
              </div>

              {costEntryMode === 'cogs' ? (
                <BdtCurrencyInput
                  id="directCost"
                  label="Direct Cost of Goods / Materials / Fuel / Feed (৳/month)"
                  value={input.directCost}
                  onChange={(v) => updateField('directCost', v)}
                  placeholder="3580000"
                  helperNote={
                    input.monthlyRevenue > 0
                      ? `Implied Gross Margin: ${currentGrossMarginPct.toFixed(1)}%`
                      : undefined
                  }
                />
              ) : (
                <NumericField
                  id="grossMarginInput"
                  label="Gross Profit Margin (%)"
                  value={Number(currentGrossMarginPct.toFixed(1))}
                  min={0}
                  max={100}
                  step={0.5}
                  onChange={(pct) => {
                    const clamped = Math.min(100, Math.max(0, pct));
                    updateField(
                      'directCost',
                      Math.round(input.monthlyRevenue * (1 - clamped / 100)),
                    );
                  }}
                  suffix="%"
                />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <BdtCurrencyInput
                id="fixedExpenses"
                label="Fixed Operating Expenses (৳/month)"
                value={input.fixedExpenses}
                onChange={(v) => updateField('fixedExpenses', v)}
                helperNote="Rent, base salaries, utilities"
              />
              <BdtCurrencyInput
                id="variableExpenses"
                label="Variable Expenses (৳/month)"
                value={input.variableExpenses}
                onChange={(v) => updateField('variableExpenses', v)}
                helperNote="Transport, packaging, marketing, maintenance"
              />
            </div>

            <BdtCurrencyInput
              id="ownerMonthlyDrawings"
              label="Owner's Monthly Personal / Family Drawings (৳/month)"
              value={input.ownerMonthlyDrawings}
              onChange={(v) => updateField('ownerMonthlyDrawings', v)}
              helperNote="Deducted from business operating profit before EMI service"
            />
          </div>
        )}

        {/* TAB 4: Working Capital & Inflation Sensitivity */}
        {activeTab === 4 && (
          <div className="space-y-3.5">
            <BdtCurrencyInput
              id="inventoryWipValue"
              label="Current Inventory / Work-in-Progress Value (৳)"
              value={input.inventoryWipValue}
              onChange={(v) => updateField('inventoryWipValue', v)}
              helperNote={
                dailyDirectCost > 0
                  ? `Implied Inventory Holding: ${Math.round(inventoryDays)} days`
                  : undefined
              }
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <NumericField
                id="receivableDays"
                label="Receivable (Baki / Installment) Days"
                value={input.receivableDays}
                onChange={(v) =>
                  updateField('receivableDays', Math.max(0, Math.round(v)))
                }
                suffix="days"
              />
              <NumericField
                id="payableDays"
                label="Supplier Payable Days"
                value={input.payableDays}
                onChange={(v) =>
                  updateField('payableDays', Math.max(0, Math.round(v)))
                }
                suffix="days"
              />
            </div>

            <div
              className={`rounded-lg border px-3.5 py-2.5 text-xs flex items-center justify-between gap-2 ${
                cccDays > 75
                  ? 'border-amber-300 bg-amber-50 text-amber-950'
                  : 'border-slate-200 bg-slate-50 text-slate-700'
              }`}
            >
              <span className="font-medium">
                Cash Conversion Cycle (Inv + Rec − Pay)
              </span>
              <span className="font-mono font-semibold tabular-nums">
                {Math.round(cccDays)} days
                {cccDays > 75 ? ' (>75d Lockup)' : ''}
              </span>
            </div>

            <div>
              <label
                htmlFor="pricingPower"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Pricing Power During Inflation
              </label>
              <select
                id="pricingPower"
                value={input.pricingPower}
                onChange={(e) =>
                  updateField(
                    'pricingPower',
                    e.target.value as PricingPowerLevel,
                  )
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-800/15"
              >
                {PRICING_POWER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <SelectField
              id="inputCostInflationSensitivity"
              label="Input Cost / Rod-Cement / Fuel / USD Inflation Sensitivity"
              value={input.inputCostInflationSensitivity}
              options={EXPOSURE_LEVELS}
              onChange={(v) =>
                updateField('inputCostInflationSensitivity', v)
              }
            />

            <div>
              <label
                htmlFor="inflationNotes"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Inflation &amp; Cost Vulnerability Notes
              </label>
              <textarea
                id="inflationNotes"
                rows={2}
                value={input.inflationNotes}
                onChange={(e) => updateField('inflationNotes', e.target.value)}
                placeholder="Note fixed pre-sale flat contracts, coal/USD exposure, or feed/diesel sensitivity..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-800/15"
              />
            </div>
          </div>
        )}

        {/* TAB 5: Capital Structure & Existing Liabilities */}
        {activeTab === 5 && (
          <div className="space-y-3.5">
            <BdtCurrencyInput
              id="ownerEquityNetWorth"
              label="Owner's Own Equity / Net Worth Invested (৳)"
              value={input.ownerEquityNetWorth}
              onChange={(v) => updateField('ownerEquityNetWorth', v)}
              helperNote="Skin-in-the-game capital invested in business or project"
            />

            <BdtCurrencyInput
              id="existingBankMonthlyEmi"
              label="Existing Bank Loan EMIs (৳/month)"
              value={input.existingBankMonthlyEmi}
              onChange={(v) => updateField('existingBankMonthlyEmi', v)}
            />

            <BdtCurrencyInput
              id="informalMonthlyDebt"
              label="Informal / NGO / Mohajan Monthly Debt Obligations (৳/month)"
              value={input.informalMonthlyDebt}
              onChange={(v) => updateField('informalMonthlyDebt', v)}
              helperNote="Unrecorded private borrowing, Dadan/Mohajan, or NGO installments"
            />

            {input.ownerEquityNetWorth > 0 && input.requestedLoanAmount > 0 && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs flex items-center justify-between">
                <span className="text-slate-600">
                  Requested Loan / Owner Equity Ratio
                </span>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {(
                    input.requestedLoanAmount / input.ownerEquityNetWorth
                  ).toFixed(2)}
                  x
                </span>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: Requested Loan, Investment Execution & Collateral */}
        {activeTab === 6 && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SelectField<FacilityType>
                id="facilityType"
                label="Facility Type"
                value={input.facilityType}
                options={FACILITY_TYPES}
                onChange={(v) => updateField('facilityType', v)}
              />
              <SelectField<DisbursementControl>
                id="disbursementControl"
                label="Disbursement Control"
                value={input.disbursementControl}
                options={DISBURSEMENT_CONTROLS}
                onChange={(v) => updateField('disbursementControl', v)}
              />
            </div>

            <BdtCurrencyInput
              id="requestedLoanAmount"
              label="Requested Loan Amount (৳)"
              value={input.requestedLoanAmount}
              onChange={(v) => updateField('requestedLoanAmount', v)}
            />

            <div className="grid grid-cols-3 gap-2.5">
              <NumericField
                id="annualInterestRate"
                label="Rate (% p.a.)"
                value={input.annualInterestRate}
                max={40}
                step={0.25}
                onChange={(v) =>
                  updateField('annualInterestRate', Math.max(0, v))
                }
                suffix="%"
              />
              <NumericField
                id="loanTenureMonths"
                label="Tenure"
                value={input.loanTenureMonths}
                min={1}
                max={240}
                onChange={(v) =>
                  updateField('loanTenureMonths', Math.max(1, Math.round(v)))
                }
                suffix="mo"
              />
              <NumericField
                id="gracePeriodMonths"
                label="Grace Period"
                value={input.gracePeriodMonths}
                min={0}
                max={Math.max(0, input.loanTenureMonths - 1)}
                onChange={(v) =>
                  updateField(
                    'gracePeriodMonths',
                    Math.min(
                      Math.max(0, Math.round(v)),
                      Math.max(0, input.loanTenureMonths - 1),
                    ),
                  )
                }
                suffix="mo"
              />
            </div>

            <div>
              <label
                htmlFor="executionPlan"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Detailed Investment / Construction Execution Plan
              </label>
              <textarea
                id="executionPlan"
                rows={2}
                value={input.executionPlan}
                onChange={(e) => updateField('executionPlan', e.target.value)}
                placeholder="How loan proceeds will be spent and timeline to generate repayment cash..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-800/15"
              />
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-3">
              <SelectField<CollateralCategory>
                id="collateralType"
                label="Primary Collateral Type"
                value={input.collateralType}
                options={COLLATERAL_CATEGORIES}
                onChange={(v) => updateField('collateralType', v)}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <BdtCurrencyInput
                  id="collateralMarketValue"
                  label="Market Value (৳)"
                  value={input.collateralMarketValue}
                  onChange={(v) => updateField('collateralMarketValue', v)}
                />
                <BdtCurrencyInput
                  id="forcedSaleValue"
                  label="Forced Sale Value (FSV) (৳)"
                  value={input.forcedSaleValue}
                  onChange={(v) => updateField('forcedSaleValue', v)}
                />
              </div>

              <SelectField<CollateralLiquidityRisk>
                id="collateralLiquidityRisk"
                label="Legal &amp; Auction Liquidity Status"
                value={input.collateralLiquidityRisk}
                options={COLLATERAL_LIQUIDITY_RISKS}
                onChange={(v) => updateField('collateralLiquidityRisk', v)}
              />

              <div>
                <label
                  htmlFor="collateralNotes"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  Collateral Legal &amp; Mortgage Notes
                </label>
                <input
                  id="collateralNotes"
                  type="text"
                  value={input.collateralNotes}
                  onChange={(e) =>
                    updateField('collateralNotes', e.target.value)
                  }
                  placeholder="Mutation, Power of Attorney, tripartite agreement, or lien details..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-800/15"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 6 ends above */}
          </motion.div>
        </AnimatePresence>

        {/* Tab Stepper Previous / Next Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            type="button"
            disabled={activeTab === 1}
            onClick={() => setActiveTab((prev) => Math.max(1, prev - 1))}
            className="inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#0B192C] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Previous</span>
          </button>

          <button
            type="button"
            disabled={activeTab === 6}
            onClick={() => setActiveTab((prev) => Math.min(6, prev + 1))}
            className="inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#0B192C] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Form Footer CTA */}
      <div className="border-t border-[#E2E8F0] bg-[#F8FAFC] p-5 space-y-3 rounded-b-xl">
        {validationError && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-[#DC2626]"
          >
            {validationError}
          </p>
        )}

        <button
          type="submit"
          disabled={isAnalyzing}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#0B192C] px-5 py-3 text-sm font-semibold text-white transition-all duration-200 ease-out hover:bg-[#142B4A] disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
        >
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          <span>
            {isAnalyzing
              ? 'Running Underwriting & Risk Analysis...'
              : 'Run Underwriting & Risk Analysis'}
          </span>
        </button>
      </div>
    </form>
  );
}
