import { Clock, LogOut, ShieldAlert } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import type { UserProfileWithOrg } from '../types/tenant';
import { NbciBrandMark } from './NbciBrandMark';

interface SubscriptionGateProps {
  userProfile: UserProfileWithOrg;
  onSignOut: () => void;
}

export function SubscriptionGate({
  userProfile,
  onSignOut,
}: SubscriptionGateProps) {
  const prefersReducedMotion = useReducedMotion();
  const organization = userProfile.organization;
  const status = organization?.subscription_status || 'pending';
  const isSuspended = status === 'suspended';

  const statusLabel =
    status === 'suspended'
      ? 'Suspended'
      : status === 'pending'
        ? 'Pending Activation'
        : 'Inactive';

  return (
    <div className="min-h-screen bg-[#000000] text-neutral-100 flex flex-col justify-between px-4 py-8 sm:px-6">
      {/* Quiet Top Bar */}
      <div className="mx-auto w-full max-w-5xl flex items-center justify-between text-xs text-neutral-400">
        <div className="inline-flex items-center gap-2 font-semibold text-white">
          <span className="flex h-6 w-6 items-center justify-center rounded-md border border-[#262626] bg-[#0D0D0D] text-white">
            <NbciBrandMark className="h-3.5 w-3.5 text-white" />
          </span>
          <span>Northern Banking Credit Intelligence (NBCI)</span>
        </div>
        <span className="font-mono text-[11px] text-neutral-400">
          {organization?.short_code || 'NBCI'} · {userProfile.branch_code}
        </span>
      </div>

      {/* Centered Subscription Gate Notice */}
      <motion.main
        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: prefersReducedMotion ? 0.12 : 0.25,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="mx-auto my-8 w-full max-w-lg"
      >
        <div className="rounded-2xl border border-[#262626] bg-[#0D0D0D] p-8 ncg-card">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl shrink-0 ${
                isSuspended
                  ? 'bg-red-950/35 text-red-400 border border-red-500/35'
                  : 'bg-amber-950/35 text-amber-400 border border-amber-500/35'
              }`}
            >
              {isSuspended ? (
                <ShieldAlert className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Clock className="h-5 w-5" aria-hidden="true" />
              )}
            </div>
            <div>
              <div
                className={`text-xs font-semibold ${
                  isSuspended ? 'text-red-400' : 'text-amber-400'
                }`}
              >
                Subscription Status: {statusLabel}
              </div>
              <h1 className="font-display text-xl font-bold text-white">
                Branch License Inactive
              </h1>
            </div>
          </div>

          <p className="mt-5 text-sm leading-relaxed text-neutral-300">
            Branch License Inactive — Your bank&apos;s per-branch subscription is awaiting activation. Contact your Head Office administrator.
          </p>

          {/* Clean Institutional License Summary */}
          <dl className="mt-6 grid grid-cols-2 gap-3 rounded-xl border border-[#262626] bg-[#141414] p-4 text-xs">
            <div>
              <dt className="text-neutral-400">Bank Organization</dt>
              <dd className="mt-0.5 font-semibold text-white">
                {organization?.name || 'Unassigned Organization'}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-400">Assigned Branch</dt>
              <dd className="mt-0.5 font-mono font-semibold text-white">
                {userProfile.branch_code || 'Unassigned'}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-400">Subscribed Seat Limit</dt>
              <dd className="mt-0.5 font-mono font-semibold text-white tabular-nums">
                {organization?.branch_seat_limit ?? 0} branches
              </dd>
            </div>
            <div>
              <dt className="text-neutral-400">Billing Reference</dt>
              <dd className="mt-0.5 font-mono font-semibold text-white tabular-nums">
                {organization
                  ? `${organization.payment_channel} · ${organization.payment_reference || 'Pending'}`
                  : 'Awaiting Assignment'}
              </dd>
            </div>
          </dl>

          <div className="mt-4 rounded-lg border border-[#262626] bg-[#141414] px-3.5 py-2.5 text-xs text-neutral-300">
            Signed in as <span className="font-mono font-semibold text-white">{userProfile.email}</span> ({userProfile.role})
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onSignOut}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-neutral-200 cursor-pointer"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </motion.main>

      <footer className="mx-auto w-full max-w-5xl text-center text-[11px] text-neutral-500">
        Northern Banking Credit Intelligence (NBCI) · Per-Branch Commercial Licensing
      </footer>
    </div>
  );
}
