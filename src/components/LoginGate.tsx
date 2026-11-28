import {
  AlertCircle,
  Check,
  ChevronDown,
  Copy,
  Database,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Settings2,
  ShieldCheck,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useState, type FormEvent } from 'react';
import {
  REQUIRED_SUPABASE_SQL,
  getSupabaseClient,
  isValidSupabaseUrl,
  type SupabaseConfigStatus,
} from '../lib/supabase';
import { NbciBrandMark } from './NbciBrandMark';

interface LoginGateProps {
  configStatus: SupabaseConfigStatus;
  onSavePreviewConfig: (url: string, anonKey: string) => void;
  onClearPreviewConfig: () => void;
  profileError?: string | null;
  onSignOutProfileError?: () => void;
}

export function LoginGate({
  configStatus,
  onSavePreviewConfig,
  onClearPreviewConfig,
  profileError,
  onSignOutProfileError,
}: LoginGateProps) {
  const prefersReducedMotion = useReducedMotion();

  // Supabase Preview Setup Panel State
  const [showSetupForm, setShowSetupForm] = useState(!configStatus.isConfigured);
  const [supabaseUrl, setSupabaseUrl] = useState(configStatus.url);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(configStatus.anonKey);
  const [configError, setConfigError] = useState<string | null>(null);
  const [showSqlSchema, setShowSqlSchema] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Real Supabase Auth Email & Password State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSaveSupabaseConfig = (e: FormEvent) => {
    e.preventDefault();
    const trimmedUrl = supabaseUrl.trim();
    const trimmedKey = supabaseAnonKey.trim();

    if (!trimmedUrl || !isValidSupabaseUrl(trimmedUrl)) {
      setConfigError(
        'Enter a valid Supabase Project URL starting with https:// (e.g., https://xyzcompany.supabase.co).',
      );
      return;
    }
    if (!trimmedKey || trimmedKey.length < 20) {
      setConfigError('Enter a valid Supabase Anon / Publishable Key.');
      return;
    }

    setConfigError(null);
    onSavePreviewConfig(trimmedUrl, trimmedKey);
    setShowSetupForm(false);
  };

  const handleCopySql = () => {
    try {
      void navigator.clipboard.writeText(REQUIRED_SUPABASE_SQL);
      setCopiedSql(true);
      window.setTimeout(() => setCopiedSql(false), 1800);
    } catch {
      // Ignore clipboard errors
    }
  };

  const handleSignInSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setAuthError('Enter both email and password to sign in.');
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setAuthError(
        'Supabase client is not configured yet. Connect your Supabase URL and Anon Key below.',
      );
      setShowSetupForm(true);
      return;
    }

    setAuthError(null);
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        setAuthError(error.message || 'Authentication failed.');
      }
    } catch (err: unknown) {
      setAuthError(
        err instanceof Error
          ? err.message
          : 'Unable to reach Supabase Auth. Verify your project URL and key.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-neutral-100 flex flex-col justify-between px-4 py-8 sm:px-6">
      {/* Subtle top institutional hairline */}
      <div className="mx-auto w-full max-w-5xl flex items-center justify-between text-xs text-neutral-400">
        <div className="inline-flex items-center gap-2 font-medium text-white">
          <span className="flex h-6 w-6 items-center justify-center rounded-md border border-[#262626] bg-[#0D0D0D] text-white">
            <NbciBrandMark className="h-3.5 w-3.5 text-white" />
          </span>
          <span>NBCI Multi-Tenant Portal</span>
        </div>
        <div className="inline-flex items-center gap-1.5 font-medium text-neutral-400">
          <ShieldCheck className="h-3.5 w-3.5 text-[#10B981]" aria-hidden="true" />
          <span>Zero-PII Anonymized Architecture</span>
        </div>
      </div>

      {/* Centered Claude-Style Institutional Sign-In Card */}
      <motion.main
        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: prefersReducedMotion ? 0.12 : 0.28,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="mx-auto my-6 w-full max-w-[500px]"
      >
        <div className="rounded-2xl border border-[#262626] bg-[#0D0D0D] p-7 sm:p-8 ncg-card">
          {/* Logo + Title + Subtitle */}
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[#262626] bg-[#141414] text-white">
              <NbciBrandMark className="h-7 w-7 text-white" />
            </div>

            <h1
              className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white"
              style={{ textWrap: 'balance' }}
            >
              Northern Banking Credit Intelligence (NBCI)
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-neutral-400">
              Commercial Credit &amp; Branch Risk Workspace (BDT / ৳)
            </p>
          </div>

          {/* Profile Error Banner (if signed into Supabase Auth but missing public.user_profiles row) */}
          {profileError && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-red-500/35 bg-red-950/30 p-3.5 text-xs text-red-400 space-y-2"
            >
              <div className="flex items-start gap-2 font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{profileError}</span>
              </div>
              {onSignOutProfileError && (
                <button
                  type="button"
                  onClick={onSignOutProfileError}
                  className="rounded-md border border-red-500/35 bg-[#141414] px-2.5 py-1 text-[11px] font-semibold text-red-400 hover:bg-red-950/40 cursor-pointer"
                >
                  Sign Out &amp; Switch Account
                </button>
              )}
            </div>
          )}

          {/* Mode A: Supabase Preview Connection Setup Panel */}
          {!configStatus.isConfigured || showSetupForm ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-[#262626] bg-[#141414] p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Database className="h-4 w-4 text-[#10B981]" aria-hidden="true" />
                  <span>Supabase Project Connection Required</span>
                </div>
                <p className="text-xs leading-relaxed text-neutral-400">
                  {configStatus.source === 'env'
                    ? 'Environment variables are active. You can also test a temporary preview project below.'
                    : 'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are not set in environment variables yet. Paste your Supabase URL & Anon Key below to connect immediately in preview mode.'}
                </p>
              </div>

              <form onSubmit={handleSaveSupabaseConfig} className="space-y-3.5">
                {configError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-lg border border-red-500/35 bg-red-950/30 px-3 py-2 text-xs text-red-400"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{configError}</span>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="nbci-supabase-url"
                    className="block text-xs font-semibold text-neutral-200 mb-1"
                  >
                    Supabase Project URL
                  </label>
                  <input
                    id="nbci-supabase-url"
                    type="url"
                    value={supabaseUrl}
                    onChange={(e) => {
                      setSupabaseUrl(e.target.value);
                      if (configError) setConfigError(null);
                    }}
                    placeholder="https://your-project-ref.supabase.co"
                    className="w-full rounded-lg border border-[#262626] bg-[#141414] px-3.5 py-2 font-mono text-xs text-white placeholder:text-neutral-500 focus:border-[#525252] focus:bg-[#171717] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="nbci-supabase-key"
                    className="block text-xs font-semibold text-neutral-200 mb-1"
                  >
                    Supabase Anon Public Key
                  </label>
                  <input
                    id="nbci-supabase-key"
                    type="password"
                    value={supabaseAnonKey}
                    onChange={(e) => {
                      setSupabaseAnonKey(e.target.value);
                      if (configError) setConfigError(null);
                    }}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    className="w-full rounded-lg border border-[#262626] bg-[#141414] px-3.5 py-2 font-mono text-xs text-white placeholder:text-neutral-500 focus:border-[#525252] focus:bg-[#171717] focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-black transition-colors hover:bg-neutral-200 cursor-pointer"
                  >
                    <Database className="h-3.5 w-3.5 text-[#059669]" aria-hidden="true" />
                    <span>Connect Supabase</span>
                  </button>

                  {configStatus.isConfigured && (
                    <button
                      type="button"
                      onClick={() => setShowSetupForm(false)}
                      className="rounded-lg border border-[#262626] bg-[#141414] px-3.5 py-2.5 text-xs font-medium text-neutral-300 hover:bg-[#1C1C1C] hover:text-white cursor-pointer"
                    >
                      Back to Sign In
                    </button>
                  )}
                </div>
              </form>
            </div>
          ) : (
            /* Mode B: Real Supabase Email & Password Sign-In */
            <form onSubmit={handleSignInSubmit} className="mt-6 space-y-4">
              {authError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-red-500/35 bg-red-950/30 px-3 py-2.5 text-xs text-red-400"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{authError}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="nbci-email"
                  className="block text-xs font-semibold text-neutral-200 mb-1.5"
                >
                  Work Email Address
                </label>
                <input
                  id="nbci-email"
                  type="email"
                  autoComplete="username"
                  disabled={isSubmitting}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (authError) setAuthError(null);
                  }}
                  placeholder="officer@bank.com"
                  className="w-full rounded-lg border border-[#262626] bg-[#141414] px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-[#525252] focus:bg-[#171717] focus:outline-none transition-colors disabled:opacity-60"
                />
              </div>

              <div>
                <label
                  htmlFor="nbci-password"
                  className="block text-xs font-semibold text-neutral-200 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="nbci-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    disabled={isSubmitting}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (authError) setAuthError(null);
                    }}
                    placeholder="Enter your password"
                    className="w-full rounded-lg border border-[#262626] bg-[#141414] px-3.5 py-2.5 pr-10 text-sm text-white placeholder:text-neutral-500 focus:border-[#525252] focus:bg-[#171717] focus:outline-none transition-colors disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black transition-all duration-200 hover:bg-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#10B981] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2
                      className="h-4 w-4 animate-spin text-[#059669]"
                      aria-hidden="true"
                    />
                    <span>Signing In…</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 text-[#059669]" aria-hidden="true" />
                    <span>Sign In to Workspace</span>
                  </>
                )}
              </button>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#262626] text-[11px] text-neutral-400">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#10B981]" aria-hidden="true" />
                  <span>
                    Connected ({configStatus.source === 'env' ? 'Env Config' : 'Preview Session'})
                  </span>
                </span>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowSetupForm(true)}
                    className="inline-flex items-center gap-1 font-medium text-neutral-300 hover:text-white cursor-pointer"
                  >
                    <Settings2 className="h-3 w-3" aria-hidden="true" />
                    <span>Configure Supabase</span>
                  </button>
                  {configStatus.source === 'preview' && (
                    <button
                      type="button"
                      onClick={() => {
                        onClearPreviewConfig();
                        setSupabaseUrl('');
                        setSupabaseAnonKey('');
                        setShowSetupForm(true);
                      }}
                      className="font-medium text-red-400 hover:underline cursor-pointer"
                    >
                      Disconnect
                    </button>
                  )}
                </div>
              </div>
            </form>
          )}

          {/* Collapsible Supabase Schema & RLS SQL Reference */}
          <div className="mt-5 pt-4 border-t border-[#262626]">
            <button
              type="button"
              onClick={() => setShowSqlSchema((prev) => !prev)}
              className="w-full flex items-center justify-between text-xs font-medium text-neutral-400 hover:text-white cursor-pointer"
            >
              <span>Required Supabase Tables &amp; RLS SQL Reference</span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${
                  showSqlSchema ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>

            {showSqlSchema && (
              <div className="mt-3 rounded-xl border border-[#262626] bg-[#141414] p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-neutral-200">
                    public.organizations · user_profiles · credit_cases
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="inline-flex items-center gap-1 rounded border border-[#262626] bg-[#0D0D0D] px-2 py-1 text-[11px] font-medium text-neutral-200 hover:bg-[#1C1C1C] cursor-pointer"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="h-3 w-3 text-[#10B981]" aria-hidden="true" />
                        <span className="text-[#10B981]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" aria-hidden="true" />
                        <span>Copy SQL</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="max-h-48 overflow-auto rounded-lg border border-[#262626] bg-[#000000] p-3 font-mono text-[10px] leading-relaxed text-neutral-300">
                  {REQUIRED_SUPABASE_SQL}
                </pre>
              </div>
            )}
          </div>
        </div>
      </motion.main>

      {/* Quiet Zero-PII Footer */}
      <footer className="mx-auto w-full max-w-5xl text-center text-[11px] text-neutral-500">
        Strict Zero-PII Governance · Anonymized Case IDs Only (No Borrower Names, NIDs, Phones, or Account Numbers)
      </footer>
    </div>
  );
}
