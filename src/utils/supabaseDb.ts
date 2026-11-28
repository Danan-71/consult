import type { SupabaseClient } from '@supabase/supabase-js';
import type { WorkspaceMode } from '../types/credit';
import type {
  CreditCaseInputPayload,
  CreditCaseMemoPayload,
  CreditCaseMetricsPayload,
  CreditCaseRecord,
  PaymentChannel,
  SubscriptionStatus,
  SupabaseOrganization,
  UserProfileWithOrg,
  UserRole,
} from '../types/tenant';

interface RawUserProfileRow {
  id: string;
  email: string;
  role: string;
  organization_id: string | null;
  branch_code: string | null;
  officer_title: string | null;
  organizations: SupabaseOrganization | SupabaseOrganization[] | null;
}

function normalizeSubscriptionStatus(raw: unknown): SubscriptionStatus {
  const val = String(raw || '').toLowerCase();
  if (val === 'active') return 'active';
  if (val === 'suspended' || val === 'expired') return 'suspended';
  return 'pending';
}

function normalizeUserRole(raw: unknown): UserRole {
  const val = String(raw || '').toLowerCase();
  if (val === 'super_admin') return 'super_admin';
  if (val === 'bank_admin') return 'bank_admin';
  return 'branch_officer';
}

function normalizeOrg(raw: SupabaseOrganization): SupabaseOrganization {
  return {
    id: raw.id,
    name: raw.name,
    short_code: raw.short_code ?? null,
    branch_seat_limit: Number(raw.branch_seat_limit) || 1,
    payment_channel: raw.payment_channel || 'BEFTN',
    payment_reference: raw.payment_reference || '',
    subscription_status: normalizeSubscriptionStatus(raw.subscription_status),
    is_owner_sandbox: Boolean(raw.is_owner_sandbox),
    created_at: raw.created_at || new Date().toISOString(),
  };
}

export async function fetchUserProfileWithOrg(
  supabase: SupabaseClient,
  userId: string,
  fallbackEmail: string,
): Promise<UserProfileWithOrg> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select(
      'id, email, role, organization_id, branch_code, officer_title, organizations(*)',
    )
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Unable to load user profile from public.user_profiles: ${error.message}`,
    );
  }

  if (!data) {
    throw new Error(
      `No matching row found in public.user_profiles for ${fallbackEmail}. Ensure this Auth user has a provisioned profile record.`,
    );
  }

  const row = data as unknown as RawUserProfileRow;
  const rawOrg = Array.isArray(row.organizations)
    ? row.organizations[0] ?? null
    : row.organizations ?? null;

  return {
    id: row.id,
    email: row.email || fallbackEmail,
    role: normalizeUserRole(row.role),
    organization_id: row.organization_id,
    branch_code: row.branch_code || 'MAIN-01',
    officer_title: row.officer_title || 'Branch Credit Officer',
    organization: rawOrg ? normalizeOrg(rawOrg) : null,
  };
}

export async function fetchAllOrganizations(
  supabase: SupabaseClient,
): Promise<SupabaseOrganization[]> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(
      `Failed to fetch public.organizations: ${error.message}`,
    );
  }

  return ((data || []) as SupabaseOrganization[]).map(normalizeOrg);
}

export interface CreateOrganizationPayload {
  name: string;
  short_code: string;
  branch_seat_limit: number;
  payment_channel: PaymentChannel;
  payment_reference: string;
  subscription_status: SubscriptionStatus;
}

export async function createClientOrganization(
  supabase: SupabaseClient,
  payload: CreateOrganizationPayload,
): Promise<SupabaseOrganization> {
  const { data, error } = await supabase
    .from('organizations')
    .insert({
      name: payload.name.trim(),
      short_code: payload.short_code.trim().toUpperCase() || null,
      branch_seat_limit: Math.max(1, Math.round(payload.branch_seat_limit)),
      payment_channel: payload.payment_channel,
      payment_reference: payload.payment_reference.trim(),
      subscription_status: payload.subscription_status,
      is_owner_sandbox: false,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to register organization: ${error.message}`);
  }

  return normalizeOrg(data as SupabaseOrganization);
}

export async function updateOrganizationSubscription(
  supabase: SupabaseClient,
  orgId: string,
  patch: {
    subscription_status?: SubscriptionStatus;
    branch_seat_limit?: number;
    payment_reference?: string;
    payment_channel?: PaymentChannel;
  },
): Promise<SupabaseOrganization> {
  const { data, error } = await supabase
    .from('organizations')
    .update(patch)
    .eq('id', orgId)
    .select('*')
    .single();

  if (error) {
    throw new Error(
      `Failed to update organization subscription: ${error.message}`,
    );
  }

  return normalizeOrg(data as SupabaseOrganization);
}

export async function ensureOwnerSandboxOrganization(
  supabase: SupabaseClient,
): Promise<SupabaseOrganization> {
  const { data: existing, error: fetchError } = await supabase
    .from('organizations')
    .select('*')
    .eq('is_owner_sandbox', true)
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    throw new Error(
      `Unable to query Owner Sandbox organization: ${fetchError.message}`,
    );
  }

  if (existing) {
    return normalizeOrg(existing as SupabaseOrganization);
  }

  const { data: created, error: createError } = await supabase
    .from('organizations')
    .insert({
      name: 'NBCI Owner Prototype Sandbox',
      short_code: 'SANDBOX',
      branch_seat_limit: 5,
      payment_channel: 'RTGS',
      payment_reference: 'OWNER-SANDBOX',
      subscription_status: 'active',
      is_owner_sandbox: true,
    })
    .select('*')
    .single();

  if (createError) {
    throw new Error(
      `Unable to provision NBCI Owner Prototype Sandbox organization: ${createError.message}`,
    );
  }

  return normalizeOrg(created as SupabaseOrganization);
}

export async function fetchBranchCreditCases(
  supabase: SupabaseClient,
  organizationId: string,
  branchCode: string,
): Promise<CreditCaseRecord[]> {
  const { data, error } = await supabase
    .from('credit_cases')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('branch_code', branchCode)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load credit_cases: ${error.message}`);
  }

  return (data || []) as CreditCaseRecord[];
}

export interface UpsertCreditCasePayload {
  id?: string | null;
  organization_id: string;
  branch_code: string;
  created_by: string;
  case_code: string;
  module: WorkspaceMode;
  sector: string;
  headline_amount_bdt: number;
  risk_score: number | null;
  risk_grade: string;
  input_payload: CreditCaseInputPayload;
  metrics_payload: CreditCaseMetricsPayload;
  ai_memo_payload: CreditCaseMemoPayload | null;
}

export async function upsertCreditCase(
  supabase: SupabaseClient,
  payload: UpsertCreditCasePayload,
): Promise<CreditCaseRecord> {
  const nowIso = new Date().toISOString();

  if (payload.id) {
    const { data, error } = await supabase
      .from('credit_cases')
      .update({
        case_code: payload.case_code,
        module: payload.module,
        sector: payload.sector,
        headline_amount_bdt: payload.headline_amount_bdt,
        risk_score: payload.risk_score,
        risk_grade: payload.risk_grade,
        input_payload: payload.input_payload,
        metrics_payload: payload.metrics_payload,
        ai_memo_payload: payload.ai_memo_payload,
        updated_at: nowIso,
      })
      .eq('id', payload.id)
      .eq('organization_id', payload.organization_id)
      .eq('branch_code', payload.branch_code)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to update case in credit_cases: ${error.message}`);
    }

    return data as CreditCaseRecord;
  }

  const { data, error } = await supabase
    .from('credit_cases')
    .insert({
      organization_id: payload.organization_id,
      branch_code: payload.branch_code,
      created_by: payload.created_by,
      case_code: payload.case_code,
      module: payload.module,
      sector: payload.sector,
      headline_amount_bdt: payload.headline_amount_bdt,
      risk_score: payload.risk_score,
      risk_grade: payload.risk_grade,
      input_payload: payload.input_payload,
      metrics_payload: payload.metrics_payload,
      ai_memo_payload: payload.ai_memo_payload,
      updated_at: nowIso,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to save case to credit_cases: ${error.message}`);
  }

  return data as CreditCaseRecord;
}

export async function deleteCreditCase(
  supabase: SupabaseClient,
  caseId: string,
  organizationId: string,
  branchCode: string,
): Promise<void> {
  const { error } = await supabase
    .from('credit_cases')
    .delete()
    .eq('id', caseId)
    .eq('organization_id', organizationId)
    .eq('branch_code', branchCode);

  if (error) {
    throw new Error(`Failed to delete case from credit_cases: ${error.message}`);
  }
}
