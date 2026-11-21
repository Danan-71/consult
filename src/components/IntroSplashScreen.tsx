import { ShieldCheck } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useEffect } from 'react';

interface IntroSplashScreenProps {
  onDismiss: () => void;
  showIntroOnStartup: boolean;
  onToggleShowOnStartup: (next: boolean) => void;
}

const EASE_APPLE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function IntroSplashScreen({
  onDismiss,
  showIntroOnStartup,
  onToggleShowOnStartup,
}: IntroSplashScreenProps) {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const autoTimer = window.setTimeout(() => {
      onDismiss();
    }, 1850);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(autoTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onDismiss]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Northern Consulting Group Launch Screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: prefersReducedMotion ? 0.15 : 0.35, ease: 'easeOut' }}
      className="fixed inset-0 z-50 flex flex-col justify-between bg-[#0B192C] text-slate-100 select-none print:hidden"
      style={{
        backgroundImage:
          'radial-gradient(ellipse 75% 60% at 50% 42%, rgba(28, 56, 94, 0.45) 0%, rgba(11, 25, 44, 1) 72%)',
      }}
    >
      {/* Top quiet hairline accent bar (1.8s progress indicator via scaleX transform) */}
      <div className="h-[2px] w-full bg-white/5 overflow-hidden">
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{
            duration: prefersReducedMotion ? 0.2 : 1.8,
            ease: 'linear',
          }}
          style={{ transformOrigin: 'left center' }}
          className="h-full w-full bg-emerald-400/70"
        />
      </div>

      {/* Center Stage: Geometric Emblem + Wordmark + Tagline + Zero-PII Indicator */}
      <motion.div
        initial={
          prefersReducedMotion
            ? { opacity: 0 }
            : { opacity: 0, scale: 0.96, y: 10 }
        }
        animate={
          prefersReducedMotion
            ? { opacity: 1 }
            : { opacity: 1, scale: 1, y: 0 }
        }
        transition={{
          duration: prefersReducedMotion ? 0.2 : 1.4,
          ease: EASE_APPLE,
        }}
        className="mx-auto flex max-w-2xl flex-col items-center px-6 text-center"
      >
        {/* Minimal Geometric Institutional Emblem */}
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: prefersReducedMotion ? 0.15 : 1.1,
            ease: EASE_APPLE,
          }}
          className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.03]"
        >
          <svg
            width="36"
            height="36"
            viewBox="0 0 36 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Outer architectural frame */}
            <rect
              x="5"
              y="5"
              width="26"
              height="26"
              rx="3"
              stroke="#E2E8F0"
              strokeWidth="1.4"
              strokeOpacity="0.9"
            />
            {/* Diagonal precision ledger axis */}
            <path
              d="M11 25V11L25 25V11"
              stroke="#F8FAFC"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Subtle meridian emerald benchmark */}
            <line
              x1="5"
              y1="18"
              x2="31"
              y2="18"
              stroke="#34D399"
              strokeWidth="1.1"
              strokeOpacity="0.75"
            />
          </svg>
        </motion.div>

        {/* Wordmark */}
        <h1
          className="font-display text-3xl sm:text-4xl md:text-[2.65rem] font-semibold tracking-tight text-white leading-tight"
          style={{ textWrap: 'balance' }}
        >
          Northern Consulting Group
        </h1>

        {/* Tagline */}
        <motion.p
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: prefersReducedMotion ? 0.15 : 1.0,
            delay: prefersReducedMotion ? 0 : 0.25,
            ease: EASE_APPLE,
          }}
          className="mt-3.5 max-w-xl text-sm sm:text-base font-normal leading-relaxed text-slate-300"
          style={{ textWrap: 'balance' }}
        >
          Deterministic Credit Risk, Recovery &amp; Branch Closing Intelligence (৳)
        </motion.p>

        {/* Subtle Hairline Divider */}
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{
            duration: prefersReducedMotion ? 0.15 : 0.9,
            delay: prefersReducedMotion ? 0 : 0.4,
            ease: EASE_APPLE,
          }}
          className="my-6 h-px w-24 bg-white/15"
        />

        {/* Subtle Zero-PII Anonymized Analysis Indicator (unboxed, restrained) */}
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: prefersReducedMotion ? 0.15 : 0.8,
            delay: prefersReducedMotion ? 0 : 0.5,
            ease: EASE_APPLE,
          }}
          className="inline-flex items-center gap-2 text-xs font-medium tracking-wide text-slate-400"
        >
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400/85 shrink-0" aria-hidden="true" />
          <span>Zero-PII Anonymized Analysis</span>
        </motion.div>
      </motion.div>

      {/* Bottom Controls: Startup Preference (left) & Skip Intro Button (right) */}
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-6 py-6 sm:px-8">
        <label className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">
          <input
            type="checkbox"
            checked={showIntroOnStartup}
            onChange={(e) => onToggleShowOnStartup(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-white/25 bg-white/5 accent-emerald-500 cursor-pointer"
          />
          <span>Show intro on startup</span>
        </label>

        <button
          type="button"
          onClick={onDismiss}
          autoFocus
          className="inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/[0.06] px-4 py-2 text-xs font-medium text-slate-100 transition-colors hover:bg-white/[0.12] hover:border-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 whitespace-nowrap shrink-0 cursor-pointer"
        >
          Skip Intro →
        </button>
      </div>
    </motion.div>
  );
}
