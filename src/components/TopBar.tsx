import { KeyRound, LayoutDashboard, Menu, Play, Printer } from 'lucide-react';
import type { WorkspaceMode } from '../types/credit';

interface TopBarProps {
  mode: WorkspaceMode;
  branchCode: string;
  bankName: string;
  onNavigate: (sectionId: string) => void;
  onPrint: () => void;
  canPrint: boolean;
  onReplayIntro: () => void;
  onOpenMobileSidebar: () => void;
  isOwnerAccount?: boolean;
  onSwitchToAdmin?: () => void;
}

export function TopBar({
  mode,
  branchCode,
  bankName,
  onNavigate,
  onPrint,
  canPrint,
  onReplayIntro,
  onOpenMobileSidebar,
  isOwnerAccount = false,
  onSwitchToAdmin,
}: TopBarProps) {
  const navItems =
    mode === 'underwriting'
      ? [
          { id: 'section-wizard', label: '6-Tab Wizard' },
          { id: 'section-icrrs', label: 'ICRRS Scorecard' },
          { id: 'section-red-flags', label: 'Forensic Triggers' },
          { id: 'section-memo', label: 'Credit Memo' },
        ]
      : mode === 'early-warning'
        ? [
            { id: 'section-ews-form', label: 'EWS Intake' },
            { id: 'section-ews-metrics', label: 'Distress Score' },
            { id: 'section-ews-triggers', label: 'Routing & DPD' },
            { id: 'section-ews-memo', label: 'Containment Brief' },
          ]
        : mode === 'recovery'
          ? [
              { id: 'section-recovery-form', label: 'Case Intake' },
              { id: 'section-recovery-metrics', label: 'Recovery Metrics' },
              { id: 'section-recovery-cashflow', label: 'Coverage Ledger' },
              { id: 'section-recovery-memo', label: 'Recovery Memo' },
            ]
          : [
              { id: 'section-closing-form', label: 'Closing Targets' },
              { id: 'section-closing-pipeline', label: 'Pipeline & Blockers' },
              { id: 'section-closing-queue', label: 'Action Queue' },
              { id: 'section-closing-brief', label: 'Closing Playbook' },
            ];

  const printLabel =
    mode === 'underwriting'
      ? 'Print / Save Credit Memo (PDF)'
      : mode === 'early-warning'
        ? 'Print Early Warning Brief (PDF)'
        : mode === 'recovery'
          ? 'Print Recovery Brief (PDF)'
          : 'Print Closing Action Sheet (PDF)';

  return (
    <header className="sticky top-0 z-30 border-b border-[#262626] bg-[#0D0D0D]/95 backdrop-blur-sm print:hidden">
      <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            aria-label="Open branch sidebar"
            className="lg:hidden rounded-lg border border-[#262626] bg-[#141414] p-2 text-neutral-200 hover:bg-[#1C1C1C] hover:text-white cursor-pointer shrink-0"
          >
            <Menu className="h-4 w-4" aria-hidden="true" />
          </button>

          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="font-display text-sm sm:text-base font-bold tracking-tight text-white truncate focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {bankName} / {branchCode}
          </a>
        </div>

        <nav
          aria-label="Workspace sections"
          className="hidden 2xl:flex items-center gap-5 text-xs font-medium text-neutral-400"
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className="hover:text-white hover:underline underline-offset-4 transition-colors duration-200 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {isOwnerAccount && onSwitchToAdmin && (
            <div
              role="group"
              aria-label="Owner View Switcher"
              className="inline-flex items-center rounded-full border border-[#262626] bg-[#141414] p-0.5"
            >
              <button
                type="button"
                aria-pressed="false"
                onClick={onSwitchToAdmin}
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-medium text-neutral-400 transition-colors hover:text-white whitespace-nowrap cursor-pointer"
              >
                <KeyRound className="h-3 w-3 text-[#10B981]" aria-hidden="true" />
                <span>Subscription &amp; License Manager</span>
              </button>
              <button
                type="button"
                aria-pressed="true"
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1.5 text-[11px] font-semibold text-black whitespace-nowrap cursor-default"
              >
                <LayoutDashboard className="h-3 w-3 text-[#059669]" aria-hidden="true" />
                <span>Owner App Sandbox</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onReplayIntro}
            title="Replay NBCI Launch Screen"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[#262626] bg-[#141414] px-3 py-2 text-xs font-medium text-neutral-300 transition-all duration-200 ease-out hover:border-[#404040] hover:bg-[#1C1C1C] hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Play className="h-3 w-3" aria-hidden="true" />
            <span>Replay Intro</span>
          </button>

          <button
            type="button"
            onClick={onPrint}
            disabled={!canPrint}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-3.5 py-2 text-xs font-semibold text-black transition-all duration-200 ease-out hover:bg-neutral-200 disabled:cursor-not-allowed disabled:bg-[#1A1A1A] disabled:text-neutral-500 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{printLabel}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
