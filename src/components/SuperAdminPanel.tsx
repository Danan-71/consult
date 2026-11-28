import {
  AlertCircle,
  Building2,
  Check,
  Clock,
  KeyRound,
  LayoutDashboard,
  Loader2,
  Lock,
  LogOut,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type {
  PaymentChannel,
  SubscriptionStatus,
  SupabaseOrganization,
  UserProfileWithOrg,
} from '../types/tenant';
import type { CreateOrganizationPayload } from '../utils/supabaseDb';

interface SuperAdminPanelProps {
  adminProfile: UserProfileWithOrg;
  organizations: SupabaseOrganization[];
  isLoadingOrgs: boolean;
  orgsError: string | null;
  onRefreshOrgs: () => Promise<void>;
  onCreateOrg: (payload: CreateOrganizationPayload) => Promise<void>;
  onUpdateOrg: (
    orgId: string,
    patch: {
      subscription_status?: SubscriptionStatus;
      branch_seat_limit?: number;
      payment_reference?: string;
      payment_channel?: PaymentChannel;
    },
  ) => Promise<void>;
  onSignOut: () => void;
  onSwitchToSandbox: () => void;
}

interface RowDraft {
  branch_seat_limit: number;
  payment_reference: string;
}

export function SuperAdminPanel({
  adminProfile,
  organizations,
  isLoadingOrgs,
  orgsError,
  onRefreshOrgs,
  onCreateOrg,
  onUpdateOrg,
  onSignOut,
  onSwitchToSandbox,
}: SuperAdminPanelProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form state for registering a new bank in public.organizations
  const [bankName, setBankName] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [seatLimit, setSeatLimit] = useState(5);
  const [paymentChannel, setPaymentChannel] = useState<PaymentChannel>('RTGS');
  const [paymentReference, setPaymentReference] = useState('');
  const [initialStatus, setInitialStatus] =
    useState<SubscriptionStatus>('active');
  const [isCreating, setIsCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Per-row editing & saving state
  const [rowDrafts, setRowDrafts] = useState<Record<string, RowDraft>>({});
  const [savingOrgId, setSavingOrgId] = useState<string | null>(null);
  const [savedOrgId, setSavedOrgId] = useState<string | null>(null);
  const [rowActionError, setRowActionError] = useState<string | null>(null);

  const clientOrgs = organizations.filter((o) => !o.is_owner_sandbox);
  const activeClientCount = clientOrgs.filter(
    (o) => o.subscription_status === 'active',
  ).length;
  const pendingOrSuspendedCount = clientOrgs.length - activeClientCount;
  const totalBranchSeats = clientOrgs.reduce(
    (acc, org) => acc + org.branch_seat_limit,
    0,
  );

  const handleBankNameChange = (value: string) => {
    setBankName(value);
    if (!shortCode.trim()) {
      const derived = value
        .split(/\s+/)
        .filter(
          (w) =>
            w.length > 0 &&
            !['PLC', 'LTD', 'LIMITED', 'BANK'].includes(w.toUpperCase()),
        )
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 4);
      if (derived) {
        setShortCode(derived);
      }
    }
  };

  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!bankName.trim()) {
      setFormError('Bank Organization Name is required.');
      return;
    }
    if (seatLimit < 1) {
      setFormError('Branch seat limit must be at least 1.');
      return;
    }

    setFormError(null);
    setIsCreating(true);
    try {
      await onCreateOrg({
        name: bankName.trim(),
        short_code: shortCode.trim() || bankName.slice(0, 3).toUpperCase(),
        branch_seat_limit: seatLimit,
        payment_channel: paymentChannel,
        payment_reference: paymentReference.trim(),
        subscription_status: initialStatus,
      });
      setBankName('');
      setShortCode('');
      setPaymentReference('');
      setShowCreateForm(false);
    } catch (err: unknown) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'Unable to register client bank organization.',
      );
    } finally {
      setIsCreating(false);
    }
  };

  const getDraft = (org: SupabaseOrganization): RowDraft =>
    rowDrafts[org.id] || {
      branch_seat_limit: org.branch_seat_limit,
      payment_reference: org.payment_reference,
    };

  const updateDraft = (
    org: SupabaseOrganization,
    patch: Partial<RowDraft>,
  ) => {
    const current = getDraft(org);
    setRowDrafts((prev) => ({
      ...prev,
      [org.id]: { ...current, ...patch },
    }));
  };

  const handleStatusChange = async (
    orgId: string,
    nextStatus: SubscriptionStatus,
  ) => {
    setSavingOrgId(orgId);
    setRowActionError(null);
    try {
      await onUpdateOrg(orgId, { subscription_status: nextStatus });
      setSavedOrgId(orgId);
      window.setTimeout(() => {
        setSavedOrgId((prev) => (prev === orgId ? null : prev));
      }, 1500);
    } catch (err: unknown) {
      setRowActionError(
        err instanceof Error ? err.message : 'Failed to update subscription status.',
      );
    } finally {
      setSavingOrgId(null);
    }
  };

  const handleSaveSeatAndRef = async (org: SupabaseOrganization) => {
    const draft = getDraft(org);
    setSavingOrgId(org.id);
    setRowActionError(null);
    try {
      await onUpdateOrg(org.id, {
        branch_seat_limit: Math.max(1, Math.round(draft.branch_seat_limit || 1)),
        payment_reference: draft.payment_reference.trim(),
      });
      setRowDrafts((prev) => {
        const next = { ...prev };
        delete next[org.id];
        return next;
      });
      setSavedOrgId(org.id);
      window.setTimeout(() => {
        setSavedOrgId((prev) => (prev === org.id ? null : prev));
      }, 1500);
    } catch (err: unknown) {
      setRowActionError(
        err instanceof Error
          ? err.message
          : 'Failed to save branch seat limit / payment reference.',
      );
    } finally {
      setSavingOrgId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-neutral-100">
      {/* Dark Charcoal Super Admin Header */}
      <header className="sticky top-0 z-30 border-b border-[#262626] bg-[#0D0D0D]/95 backdrop-blur-sm text-white">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 sm:px-6 py-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#141414] border border-[#262626] shrink-0">
              <KeyRound className="h-4.5 w-4.5 text-[#10B981]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="font-display text-base font-bold tracking-tight text-white truncate">
                Northern Banking Credit Intelligence (NBCI)
              </div>
              <div className="text-[11px] text-neutral-400 truncate">
                Super Admin License Console · {adminProfile.email}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Owner Mode Switcher Pill */}
            <div
              role="group"
              aria-label="Owner View Switcher"
              className="inline-flex items-center rounded-full border border-[#262626] bg-[#141414] p-0.5"
            >
              <button
                type="button"
                aria-pressed="true"
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-black whitespace-nowrap cursor-default"
              >
                <KeyRound className="h-3 w-3 text-[#059669]" aria-hidden="true" />
                <span>Subscription &amp; License Manager</span>
              </button>
              <button
                type="button"
                aria-pressed="false"
                onClick={onSwitchToSandbox}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium text-neutral-400 transition-colors hover:text-white whitespace-nowrap cursor-pointer"
              >
                <LayoutDashboard className="h-3 w-3 text-[#10B981]" aria-hidden="true" />
                <span>Owner App Sandbox</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => void onRefreshOrgs()}
              disabled={isLoadingOrgs}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#262626] bg-[#141414] px-3 py-2 text-xs font-medium text-neutral-200 transition-colors hover:border-[#404040] hover:bg-[#1C1C1C] hover:text-white disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isLoadingOrgs ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCreateForm((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#10B981] px-3.5 py-2 text-xs font-semibold text-black transition-colors hover:bg-emerald-400 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Register Client Bank</span>
            </button>

            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#262626] bg-[#141414] px-3.5 py-2 text-xs font-medium text-neutral-200 transition-colors hover:border-[#404040] hover:bg-[#1C1C1C] hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 sm:px-6 py-6 space-y-6">
        {/* Error Banner */}
        {(orgsError || rowActionError) && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-red-500/35 bg-red-950/30 px-4 py-3 text-xs text-red-400"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{orgsError || rowActionError}</span>
          </div>
        )}

        {/* 4 Summary KPI Cards */}
        <section
          aria-label="Subscription portfolio metrics"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div className="rounded-xl border border-[#262626] bg-[#0D0D0D] p-4 ncg-card">
            <div className="text-xs font-medium text-neutral-400">
              Client Bank Organizations
            </div>
            <div className="mt-1.5 font-mono text-2xl font-bold text-white tabular-nums">
              {clientOrgs.length}
            </div>
            <div className="mt-1 text-[11px] text-neutral-400 font-mono tabular-nums">
              {activeClientCount} Active · {pendingOrSuspendedCount} Pending / Suspended
            </div>
          </div>

          <div className="rounded-xl border border-[#262626] bg-[#0D0D0D] p-4 ncg-card">
            <div className="text-xs font-medium text-neutral-400">
              Total Subscribed Branch Seats
            </div>
            <div className="mt-1.5 font-mono text-2xl font-bold text-white tabular-nums">
              {totalBranchSeats}
            </div>
            <div className="mt-1 text-[11px] text-neutral-400">
              Backed by Supabase public.organizations
            </div>
          </div>

          <div className="rounded-xl border border-[#262626] bg-[#0D0D0D] p-4 ncg-card">
            <div className="text-xs font-medium text-neutral-400">
              Owner Sandbox Isolation
            </div>
            <div className="mt-1.5 text-sm font-bold text-[#34D399] flex items-center gap-1.5">
              <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Dedicated Sandbox Org</span>
            </div>
            <div className="mt-1 text-[11px] text-neutral-400">
              Owner testing never touches live bank data
            </div>
          </div>

          <div className="rounded-xl border border-[#262626] bg-[#0D0D0D] p-4 ncg-card">
            <div className="text-xs font-medium text-neutral-400">
              Data Confidentiality Policy
            </div>
            <div className="mt-1.5 text-sm font-bold text-white flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-[#10B981] shrink-0" aria-hidden="true" />
              <span>Tenant Isolated • Locked</span>
            </div>
            <div className="mt-1 text-[11px] text-neutral-400">
              Zero-PII cases enforced via Postgres RLS
            </div>
          </div>
        </section>

        {/* "+ Register Client Bank" Form */}
        {showCreateForm && (
          <section
            aria-label="Register new client bank organization"
            className="rounded-xl border border-[#262626] bg-[#0D0D0D] p-6 ncg-card"
          >
            <div className="flex items-center justify-between gap-4 border-b border-[#262626] pb-4 mb-5">
              <div>
                <h2 className="font-display text-base font-bold text-white">
                  Register Client Bank Organization
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Creates a new tenant row in public.organizations with configurable branch seat limit and subscription status.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="text-xs font-medium text-neutral-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={(e) => void handleCreateSubmit(e)} className="space-y-4">
              {formError && (
                <div className="rounded-lg border border-red-500/35 bg-red-950/30 px-3 py-2 text-xs text-red-400">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-200 mb-1">
                    Bank Organization Name *
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => handleBankNameChange(e.target.value)}
                    placeholder="e.g., Northern Commercial Bank PLC"
                    className="w-full rounded-lg border border-[#262626] bg-[#141414] px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-[#525252] focus:bg-[#171717] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-200 mb-1">
                    Short Code
                  </label>
                  <input
                    type="text"
                    maxLength={8}
                    value={shortCode}
                    onChange={(e) => setShortCode(e.target.value.toUpperCase())}
                    placeholder="NCB"
                    className="w-full rounded-lg border border-[#262626] bg-[#141414] px-3 py-2 font-mono text-sm uppercase text-white placeholder:text-neutral-500 focus:border-[#525252] focus:bg-[#171717] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-200 mb-1">
                    Branch Seat Limit *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={seatLimit}
                    onChange={(e) =>
                      setSeatLimit(Math.max(1, Number(e.target.value) || 1))
                    }
                    className="w-full rounded-lg border border-[#262626] bg-[#141414] px-3 py-2 font-mono text-sm text-white tabular-nums focus:border-[#525252] focus:bg-[#171717] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-200 mb-1">
                    Payment Channel
                  </label>
                  <select
                    value={paymentChannel}
                    onChange={(e) =>
                      setPaymentChannel(e.target.value as PaymentChannel)
                    }
                    className="w-full rounded-lg border border-[#262626] bg-[#141414] px-3 py-2 text-sm text-white focus:border-[#525252] focus:bg-[#171717] focus:outline-none"
                  >
                    <option value="RTGS">RTGS</option>
                    <option value="BEFTN">BEFTN</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-200 mb-1">
                    Payment / Invoice Ref
                  </label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="BEFTN-2026-88412"
                    className="w-full rounded-lg border border-[#262626] bg-[#141414] px-3 py-2 font-mono text-sm text-white placeholder:text-neutral-500 focus:border-[#525252] focus:bg-[#171717] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-200 mb-1">
                    Initial Subscription Status
                  </label>
                  <select
                    value={initialStatus}
                    onChange={(e) =>
                      setInitialStatus(e.target.value as SubscriptionStatus)
                    }
                    className="w-full rounded-lg border border-[#262626] bg-[#141414] px-3 py-2 text-sm text-white focus:border-[#525252] focus:bg-[#171717] focus:outline-none"
                  >
                    <option value="active">active</option>
                    <option value="pending">pending</option>
                    <option value="suspended">suspended</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-[#262626]">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-xs font-semibold text-black transition-colors hover:bg-neutral-200 disabled:opacity-60 cursor-pointer"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#059669]" aria-hidden="true" />
                      <span>Saving to Supabase…</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5 text-[#059669]" aria-hidden="true" />
                      <span>Create Client Bank Row</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Onboarded Bank Organizations & Subscriptions Table */}
        <section
          aria-label="Onboarded Bank Organizations"
          className="rounded-xl border border-[#262626] bg-[#0D0D0D] overflow-hidden ncg-card"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#262626] px-5 py-4">
            <div>
              <h2 className="font-display text-base font-bold text-white">
                Client Bank Organizations &amp; Branch Seat Licenses
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Live data from public.organizations. Changes take effect immediately on branch sign-in and session checks.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs text-neutral-400 font-mono tabular-nums">
              <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{organizations.length} Total Organizations</span>
            </div>
          </div>

          {isLoadingOrgs && organizations.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-white" aria-hidden="true" />
              <span>Loading organizations from Supabase…</span>
            </div>
          ) : organizations.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-400">
              No organizations found in <span className="font-mono text-neutral-200">public.organizations</span> yet. Click &ldquo;Register Client Bank&rdquo; above to add one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#262626] bg-[#141414] text-[11px] font-semibold text-neutral-400">
                    <th className="py-3 px-4">Bank Organization</th>
                    <th className="py-3 px-4">Data Confidentiality</th>
                    <th className="py-3 px-4">Branch Seat Limit</th>
                    <th className="py-3 px-4">Payment Channel &amp; Reference</th>
                    <th className="py-3 px-4">Subscription Status</th>
                    <th className="py-3 px-4 text-right">License Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262626] text-xs">
                  {organizations.map((org) => {
                    const draft = getDraft(org);
                    const isDirty =
                      draft.branch_seat_limit !== org.branch_seat_limit ||
                      draft.payment_reference !== org.payment_reference;
                    const isSavingRow = savingOrgId === org.id;
                    const isSavedRow = savedOrgId === org.id;

                    const status = org.subscription_status;

                    return (
                      <tr
                        key={org.id}
                        className="hover:bg-[#141414] transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white">{org.name}</div>
                          <div className="font-mono text-[11px] text-neutral-400">
                            {org.short_code || 'NBCI'} · {org.id.slice(0, 8)}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {org.is_owner_sandbox ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/50 border border-emerald-500/35 px-2.5 py-0.5 text-[11px] font-semibold text-[#34D399] whitespace-nowrap">
                              <LayoutDashboard className="h-3 w-3 shrink-0" aria-hidden="true" />
                              <span>Owner Prototype Sandbox</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-neutral-300 whitespace-nowrap">
                              <Lock className="h-3 w-3 text-neutral-400 shrink-0" aria-hidden="true" />
                              <span>Tenant Isolated • Live Case Data Locked</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="inline-flex items-center gap-1.5">
                            <input
                              type="number"
                              min={1}
                              max={500}
                              aria-label={`Branch seat limit for ${org.name}`}
                              value={draft.branch_seat_limit}
                              onChange={(e) =>
                                updateDraft(org, {
                                  branch_seat_limit: Math.max(
                                    1,
                                    Number(e.target.value) || 1,
                                  ),
                                })
                              }
                              className="w-20 rounded-md border border-[#262626] bg-[#141414] px-2 py-1 font-mono text-xs text-white tabular-nums focus:border-[#525252] focus:bg-[#171717] focus:outline-none"
                            />
                            <span className="text-[11px] text-neutral-400">seats</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-semibold text-neutral-300 shrink-0">
                              {org.payment_channel}
                            </span>
                            <input
                              type="text"
                              aria-label={`Payment reference for ${org.name}`}
                              value={draft.payment_reference}
                              onChange={(e) =>
                                updateDraft(org, {
                                  payment_reference: e.target.value,
                                })
                              }
                              placeholder="BEFTN / RTGS ref"
                              className="w-40 rounded-md border border-[#262626] bg-[#141414] px-2 py-1 font-mono text-[11px] text-white placeholder:text-neutral-500 focus:border-[#525252] focus:bg-[#171717] focus:outline-none"
                            />
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 font-semibold whitespace-nowrap ${
                              status === 'active'
                                ? 'text-[#34D399]'
                                : status === 'suspended'
                                  ? 'text-red-400'
                                  : 'text-amber-400'
                            }`}
                          >
                            {status === 'active' ? (
                              <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            ) : status === 'suspended' ? (
                              <ShieldAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            ) : (
                              <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            )}
                            <span className="capitalize">{status}</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex flex-wrap items-center justify-end gap-2">
                            {isDirty && (
                              <button
                                type="button"
                                disabled={isSavingRow}
                                onClick={() => void handleSaveSeatAndRef(org)}
                                className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-[11px] font-semibold text-black hover:bg-neutral-200 disabled:opacity-50 cursor-pointer"
                              >
                                Save Edits
                              </button>
                            )}

                            {isSavedRow && !isDirty && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#34D399]">
                                <Check className="h-3 w-3" aria-hidden="true" />
                                Saved
                              </span>
                            )}

                            <div
                              role="group"
                              aria-label={`Subscription state for ${org.name}`}
                              className="inline-flex rounded-lg border border-[#262626] bg-[#141414] p-0.5"
                            >
                              {(['pending', 'active', 'suspended'] as SubscriptionStatus[]).map(
                                (option) => {
                                  const selected = org.subscription_status === option;
                                  return (
                                    <button
                                      key={option}
                                      type="button"
                                      disabled={isSavingRow || (org.is_owner_sandbox && option !== 'active')}
                                      onClick={() => void handleStatusChange(org.id, option)}
                                      className={`rounded-md px-2 py-1 text-[11px] font-semibold capitalize transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                                        selected
                                          ? option === 'active'
                                            ? 'bg-[#059669] text-white'
                                            : option === 'suspended'
                                              ? 'bg-[#DC2626] text-white'
                                              : 'bg-[#D97706] text-white'
                                          : 'text-neutral-400 hover:bg-[#1C1C1C] hover:text-white'
                                      }`}
                                    >
                                      {option}
                                    </button>
                                  );
                                },
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Note on Provisioning Bank Officers via Supabase Auth */}
        <section className="rounded-xl border border-[#262626] bg-[#0D0D0D] p-4 text-xs text-neutral-400 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="font-semibold text-white">Branch Officer Onboarding:</span>{' '}
            Create Auth accounts in Supabase Authentication and map each user in{' '}
            <span className="font-mono text-neutral-200">public.user_profiles</span> to an{' '}
            <span className="font-mono text-neutral-200">organization_id</span> and{' '}
            <span className="font-mono text-neutral-200">branch_code</span>.
          </div>
          <span className="font-mono text-[11px] text-neutral-400">
            Active Session Role: {adminProfile.role}
          </span>
        </section>
      </main>
    </div>
  );
}
