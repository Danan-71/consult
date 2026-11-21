import { Play, Printer } from 'lucide-react';
import type { WorkspaceMode } from '../types/credit';

interface TopBarProps {
  mode: WorkspaceMode;
  onNavigate: (sectionId: string) => void;
  onPrint: () => void;
  canPrint: boolean;
  onReplayIntro: () => void;
}

export function TopBar({
  mode,
  onNavigate,
  onPrint,
  canPrint,
  onReplayIntro,
}: TopBarProps) {
  const navItems =
    mode === 'underwriting'
      ? [
          { id: 'section-wizard', label: '6-Tab Wizard' },
          { id: 'section-icrrs', label: 'ICRRS Scorecard' },
          { id: 'section-metrics', label: 'Stress Ledger' },
          { id: 'section-memo', label: 'Credit Memo' },
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
      ? 'Print / Save Official Credit Memo (PDF)'
      : mode === 'recovery'
        ? 'Print / Export Recovery Brief (PDF)'
        : 'Print Closing Playbook & Action Sheet (PDF)';

  return (
    <header className="sticky top-0 z-30 border-t-2 border-t-[#0B192C] border-b border-[#E2E8F0] bg-white/95 backdrop-blur-sm shadow-[0_1px_2px_rgba(11,25,44,0.03)] print:hidden">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-6 px-6 py-3.5">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="font-display text-lg font-bold tracking-tight text-[#0B192C] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B192C]"
        >
          Northern Consulting Group
        </a>

        <nav
          aria-label="Workspace sections"
          className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600"
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className="hover:text-[#0B192C] hover:underline underline-offset-4 transition-colors duration-200 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onReplayIntro}
            title="Replay NCG Launch Screen"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-medium text-slate-600 transition-all duration-200 ease-out hover:border-slate-300 hover:bg-slate-50 hover:text-[#0B192C] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Play className="h-3 w-3" aria-hidden="true" />
            <span>Replay Intro</span>
          </button>

          <button
            type="button"
            onClick={onPrint}
            disabled={!canPrint}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0B192C] px-4 py-2 text-xs font-semibold text-white transition-all duration-200 ease-out hover:bg-[#142B4A] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{printLabel}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

