import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const PREVIEW_CONFIG_KEY = 'nbci_preview_supabase_config_v1';

interface PreviewSupabaseConfig {
  url: string;
  anonKey: string;
}

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  source: 'env' | 'preview' | 'none';
  url: string;
  anonKey: string;
}

function readEnvSupabaseConfig(): PreviewSupabaseConfig | null {
  const env = import.meta.env as Record<string, string | undefined>;
  const url = (
    env.VITE_SUPABASE_URL ||
    env.NEXT_PUBLIC_SUPABASE_URL ||
    ''
  ).trim();
  const anonKey = (
    env.VITE_SUPABASE_ANON_KEY ||
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  ).trim();

  if (url && anonKey) {
    return { url, anonKey };
  }
  return null;
}

function readPreviewSupabaseConfig(): PreviewSupabaseConfig | null {
  try {
    const raw = window.localStorage.getItem(PREVIEW_CONFIG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PreviewSupabaseConfig>;
    if (
      typeof parsed.url === 'string' &&
      parsed.url.trim() &&
      typeof parsed.anonKey === 'string' &&
      parsed.anonKey.trim()
    ) {
      return { url: parsed.url.trim(), anonKey: parsed.anonKey.trim() };
    }
    return null;
  } catch {
    return null;
  }
}

export function isValidSupabaseUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl.trim());
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  const envCfg = readEnvSupabaseConfig();
  if (envCfg && isValidSupabaseUrl(envCfg.url)) {
    return {
      isConfigured: true,
      source: 'env',
      url: envCfg.url,
      anonKey: envCfg.anonKey,
    };
  }

  const previewCfg = readPreviewSupabaseConfig();
  if (previewCfg && isValidSupabaseUrl(previewCfg.url)) {
    return {
      isConfigured: true,
      source: 'preview',
      url: previewCfg.url,
      anonKey: previewCfg.anonKey,
    };
  }

  return {
    isConfigured: false,
    source: 'none',
    url: '',
    anonKey: '',
  };
}

let cachedClient: SupabaseClient | null = null;
let cachedSignature = '';

export function getSupabaseClient(): SupabaseClient | null {
  const status = getSupabaseConfigStatus();
  if (!status.isConfigured) {
    cachedClient = null;
    cachedSignature = '';
    return null;
  }

  const sig = `${status.url}::${status.anonKey}`;
  if (cachedClient && cachedSignature === sig) {
    return cachedClient;
  }

  cachedClient = createClient(status.url, status.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  cachedSignature = sig;
  return cachedClient;
}

export function savePreviewSupabaseConfig(url: string, anonKey: string): void {
  const cleanUrl = url.trim().replace(/\/+$/, '');
  const cleanKey = anonKey.trim();
  window.localStorage.setItem(
    PREVIEW_CONFIG_KEY,
    JSON.stringify({ url: cleanUrl, anonKey: cleanKey }),
  );
  cachedClient = null;
  cachedSignature = '';
}

export function clearPreviewSupabaseConfig(): void {
  try {
    window.localStorage.removeItem(PREVIEW_CONFIG_KEY);
  } catch {
    // Ignore storage access errors
  }
  cachedClient = null;
  cachedSignature = '';
}

export const REQUIRED_SUPABASE_SQL = `-- NBCI Production Schema (Run in Supabase SQL Editor)
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_code text,
  branch_seat_limit integer not null default 5,
  payment_channel text not null default 'BEFTN',
  payment_reference text not null default '',
  subscription_status text not null default 'pending' check (subscription_status in ('pending', 'active', 'suspended')),
  is_owner_sandbox boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('branch_officer', 'bank_admin', 'super_admin')),
  organization_id uuid references public.organizations(id) on delete set null,
  branch_code text not null default 'MAIN-01',
  officer_title text not null default 'Branch Credit Officer',
  created_at timestamptz not null default now()
);

create table if not exists public.credit_cases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  branch_code text not null,
  created_by uuid references auth.users(id) on delete set null,
  case_code text not null,
  module text not null check (module in ('underwriting', 'early-warning', 'recovery', 'closing')),
  sector text not null default '',
  headline_amount_bdt numeric not null default 0,
  risk_score numeric,
  risk_grade text not null default '',
  input_payload jsonb not null,
  metrics_payload jsonb not null,
  ai_memo_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organizations enable row level security;
alter table public.user_profiles enable row level security;
alter table public.credit_cases enable row level security;

-- Helper to read role without recursive RLS
create or replace function public.nbci_my_role() returns text
language sql stable security definer as $$
  select role from public.user_profiles where id = auth.uid();
$$;

create or replace function public.nbci_my_org() returns uuid
language sql stable security definer as $$
  select organization_id from public.user_profiles where id = auth.uid();
$$;

create or replace function public.nbci_my_branch() returns text
language sql stable security definer as $$
  select branch_code from public.user_profiles where id = auth.uid();
$$;

-- user_profiles: users read their own profile; super_admin can read all
create policy "Read own profile" on public.user_profiles
  for select using (id = auth.uid() or public.nbci_my_role() = 'super_admin');

-- organizations: members read own org; super_admin manages all orgs
create policy "Read own or admin orgs" on public.organizations
  for select using (id = public.nbci_my_org() or public.nbci_my_role() = 'super_admin');
create policy "Super admin manages orgs" on public.organizations
  for all using (public.nbci_my_role() = 'super_admin')
  with check (public.nbci_my_role() = 'super_admin');

-- credit_cases: strict branch + org isolation; super_admin only sees is_owner_sandbox = true
create policy "Strict branch isolation select" on public.credit_cases
  for select using (
    (organization_id = public.nbci_my_org() and branch_code = public.nbci_my_branch())
    or (
      public.nbci_my_role() = 'super_admin'
      and exists (select 1 from public.organizations o where o.id = organization_id and o.is_owner_sandbox = true)
    )
  );
create policy "Strict branch isolation insert/update/delete" on public.credit_cases
  for all using (
    (organization_id = public.nbci_my_org() and branch_code = public.nbci_my_branch())
    or (
      public.nbci_my_role() = 'super_admin'
      and exists (select 1 from public.organizations o where o.id = organization_id and o.is_owner_sandbox = true)
    )
  )
  with check (
    (organization_id = public.nbci_my_org() and branch_code = public.nbci_my_branch())
    or (
      public.nbci_my_role() = 'super_admin'
      and exists (select 1 from public.organizations o where o.id = organization_id and o.is_owner_sandbox = true)
    )
  );
`;
