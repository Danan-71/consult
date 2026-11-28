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
  WorkspaceMode,
} from './credit';

export type SubscriptionStatus = 'pending' | 'active' | 'suspended';

export type PaymentChannel = 'BEFTN' | 'RTGS' | 'Cheque';

export type UserRole = 'branch_officer' | 'bank_admin' | 'super_admin';

export interface SupabaseOrganization {
  id: string;
  name: string;
  short_code: string | null;
  branch_seat_limit: number;
  payment_channel: PaymentChannel | string;
  payment_reference: string;
  subscription_status: SubscriptionStatus;
  is_owner_sandbox: boolean;
  created_at: string;
}

export interface UserProfileWithOrg {
  id: string;
  email: string;
  role: UserRole;
  organization_id: string | null;
  branch_code: string;
  officer_title: string;
  organization: SupabaseOrganization | null;
}

export type CreditCaseInputPayload =
  | LoanApplicationInput
  | EarlyWarningInput
  | RecoveryCaseInput
  | ClosingPlannerInput;

export type CreditCaseMetricsPayload =
  | CalculatedMetrics
  | EarlyWarningMetrics
  | RecoveryMetrics
  | ClosingMetrics;

export type CreditCaseMemoPayload =
  | CreditAnalystMemo
  | EarlyWarningMemo
  | RecoveryMemo
  | ClosingStrategyBrief;

export interface CreditCaseRecord {
  id: string;
  organization_id: string;
  branch_code: string;
  created_by: string | null;
  case_code: string;
  module: WorkspaceMode;
  sector: string;
  headline_amount_bdt: number;
  risk_score: number | null;
  risk_grade: string;
  input_payload: CreditCaseInputPayload;
  metrics_payload: CreditCaseMetricsPayload;
  ai_memo_payload: CreditCaseMemoPayload | null;
  created_at: string;
  updated_at: string;
}
