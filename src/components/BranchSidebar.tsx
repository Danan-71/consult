import {
  Activity,
  FolderOpen,
  LayoutDashboard,
  Loader2,
  LogOut,
  Plus,
  Scale,
  ShieldCheck,
  Target,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import type { WorkspaceMode } from '../types/credit';
import type {
  CreditCaseRecord,
  SupabaseOrganization,
  UserProfileWithOrg,
} from '../types/tenant';
import { formatBDT } from '../utils/finance';
import { NbciBrandMark } from './NbciBrandMark';

interface BranchSidebarProps {
  userProfile: UserProfileWithOrg;
  organization: SupabaseOrganization;
  branchCode: string;
  mode: WorkspaceMode;
  onSelectMode: (mode: WorkspaceMode) => void;
  branchCases: CreditCaseRecord[];
  isLoadingCases: boolean;
  activeCaseId: string | null;
  onSelectSavedCase: (savedCase: CreditCaseRecord) => void;
  onNewCase: () => void;
  onDeleteCase: (caseId: string) => void;
  onSignOut: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const MODULE_ITEMS: {
  id: WorkspaceMode;
  label: string;
  subtitle: string;
  icon: typeof ShieldCheck;
}[] = [
  {
    id: 'underwriting',
    label: 'Pre-Loan Business Analysis',
    subtitle: 'ICRRS, Stressed DSCR & Safe Limit',
    icon: ShieldCheck,
  },
  {
    id: 'early-warning',
    label: 'Early Warning Monitor',
    subtitle: 'Routing, DPD & Stock Cover',
    icon: Activity,
  },
  {
    id: 'recovery',
    label: 'NPL Recovery & Resolution',
    subtitle: 'SAMD Cash Realism & 30/60/90d',
    icon: Scale,
  },
  {
    id: 'closing',
    label: 'Branch Closing Assistant',
    subtitle: 'Cutoff Targets & Action Queue',
    icon: Target,
  },
];

export function BranchSidebar({
  userProfile,
  organization,
  branchCode,
  mode,
  onSelectMode,
  branchCases,
  isLoadingCases,
  activeCaseId,
  onSelectSavedCase,
  onNewCase,
  onDeleteCase,
  onSignOut,
  mobileOpen,
  onCloseMobile,
}: BranchSidebarProps) {
  const isSandbox = organization.is_owner_sandbox;

  const sidebarContent = (
    <aside
      aria-label="Branch workspace sidebar"
      className="flex h-full w-[276px] flex-col bg-[#0D0D0D] text-neutral-100 border-r border-[#262626] select-none"
    >
      {/* Top: Bank Name, Branch Code & Active Branch License Emerald Status Pill */}
      <div className="border-b border-[#262626] px-4 py-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#141414] border border-[#262626] shrink-0 text-white">
              <NbciBrandMark className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="font-display text-xs font-bold text-white truncate">
                NBCI Credit Suite
              </div>
              <div className="text-[11px] text-neutral-400 truncate">
                {organization.name}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="lg:hidden rounded p-1 text-neutral-400 hover:bg-[#171717] hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="rounded-xl bg-[#141414] border border-[#262626] px-3 py-2.5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs font-bold text-white">
              {branchCode}
            </span>
            <span className="font-mono text-[10.5px] text-neutral-400 tabular-nums">
              {organization.short_code || 'NBCI'} · {organization.branch_seat_limit} seats
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#10B981]/15 border border-[#10B981]/35 px-2.5 py-0.5 text-[11px] font-semibold text-[#34D399]">
            {isSandbox ? (
              <LayoutDashboard className="h-3 w-3 shrink-0" aria-hidden="true" />
            ) : (
              <ShieldCheck className="h-3 w-3 shrink-0" aria-hidden="true" />
            )}
            <span>
              {isSandbox ? 'Owner Prototype Sandbox' : 'Active Branch License'}
            </span>
          </div>
        </div>
      </div>

      {/* Middle Scrollable Region: 4 Core Modules + Branch-Scoped Anonymized Cases */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* 4 Core Module Navigation Tabs */}
        <div>
          <div className="px-2 mb-2 text-[11px] font-semibold text-neutral-400">
            Risk &amp; Credit Modules
          </div>
          <nav aria-label="Core NBCI Modules" className="space-y-1">
            {MODULE_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = mode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectMode(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-[#171717] text-white border border-[#404040] shadow-xs'
                      : 'text-neutral-300 border border-transparent hover:bg-[#141414] hover:text-white'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 mt-0.5 ${
                      isActive ? 'text-[#10B981]' : 'text-neutral-400'
                    }`}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold leading-snug">
                      {item.label}
                    </div>
                    <div className="text-[10.5px] text-neutral-400 truncate mt-0.5">
                      {item.subtitle}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Saved Anonymized Cases List (Scoped Strictly to Active Branch in Supabase) */}
        <div className="space-y-2.5">
          <div className="px-2 flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-neutral-400">
              {branchCode} Vault ({branchCases.length})
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              onNewCase();
              onCloseMobile();
            }}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#10B981] px-3 py-2 text-xs font-bold text-black transition-colors hover:bg-emerald-400 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>+ New Anonymized Case</span>
          </button>

          {isLoadingCases ? (
            <div className="rounded-lg border border-[#262626] bg-[#141414] px-3 py-3 text-[11px] text-neutral-300 flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#10B981]" aria-hidden="true" />
              <span>Syncing cases from Supabase…</span>
            </div>
          ) : branchCases.length === 0 ? (
            <div className="rounded-lg border border-[#262626] bg-[#141414] px-3 py-3 text-[11px] text-neutral-400">
              No saved anonymized cases in {branchCode} yet. Run an analysis or click &ldquo;Save Case to Supabase&rdquo;.
            </div>
          ) : (
            <ul className="space-y-1.5" aria-label="Branch saved anonymized cases">
              {branchCases.map((c) => {
                const isSelected = activeCaseId === c.id;
                return (
                  <li key={c.id} className="group relative">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectSavedCase(c);
                        onCloseMobile();
                      }}
                      className={`w-full rounded-xl border px-3 py-2.5 pr-8 text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'border-[#10B981]/50 bg-[#171717] text-white'
                          : 'border-[#262626] bg-[#141414] text-neutral-200 hover:bg-[#1A1A1A] hover:border-[#404040]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-mono text-[11px] font-bold text-white truncate">
                          {c.case_code}
                        </span>
                        <FolderOpen
                          className={`h-3 w-3 shrink-0 ${
                            isSelected ? 'text-[#10B981]' : 'text-neutral-500'
                          }`}
                          aria-hidden="true"
                        />
                      </div>
                      <div className="mt-0.5 text-[10.5px] text-neutral-300 truncate">
                        {c.sector || c.module}
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-1 font-mono text-[10px] text-neutral-400 tabular-nums">
                        <span>{formatBDT(c.headline_amount_bdt)}</span>
                        <span className="truncate text-[#34D399]">
                          {c.risk_grade || (c.risk_score !== null ? `${c.risk_score}/100` : 'Saved')}
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      title={`Delete ${c.case_code}`}
                      aria-label={`Delete ${c.case_code}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCase(c.id);
                      }}
                      className="absolute right-2 top-2.5 rounded p-1 text-neutral-400 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-[#262626] hover:text-red-400 transition-opacity cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Bottom: User Profile & Sign Out */}
      <div className="border-t border-[#262626] p-3 bg-[#000000]">
        <div className="flex items-center gap-2.5 px-1.5 pb-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#262626] bg-[#141414] text-[#10B981] shrink-0">
            <UserCheck className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-white truncate">
              {isSandbox ? 'Owner · App Sandbox' : userProfile.officer_title}
            </div>
            <div className="font-mono text-[10.5px] text-neutral-400 truncate">
              {userProfile.email}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onSignOut}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-[#262626] bg-[#141414] px-3 py-2 text-xs font-semibold text-neutral-100 transition-colors hover:bg-[#1C1C1C] hover:border-[#404040] cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5 text-neutral-300" aria-hidden="true" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <div className="hidden lg:block lg:sticky lg:top-0 lg:h-screen shrink-0 print:hidden">
        {sidebarContent}
      </div>

      {/* Mobile Slide-Over Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden print:hidden">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
