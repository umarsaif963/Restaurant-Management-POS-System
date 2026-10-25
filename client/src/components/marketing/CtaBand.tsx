import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface CtaBandProps {
  title: string;
  lede?: string;
  primaryLabel?: string;
  primaryTo?: string;
  secondaryLabel?: string;
  secondaryTo?: string;
}

/**
 * Closing conversion band on dark ink, reused at the bottom of every page.
 */
export function CtaBand({
  title,
  lede,
  primaryLabel = 'Create your workspace',
  primaryTo = '/register',
  secondaryLabel,
  secondaryTo = '/contact',
}: CtaBandProps) {
  return (
    <section className="relative overflow-hidden bg-ink-950">
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-40%] h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-brand-500/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[-30%] right-[-10%] h-80 w-80 rounded-full bg-ember-500/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:py-24">
        <p className="eyebrow-dark">Start free</p>
        <h2 className="mt-5 font-display text-3xl font-semibold leading-[1.1] tracking-[-0.02em] text-white sm:text-4xl lg:text-5xl">
          {title}
        </h2>
        {lede ? (
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-300/90 sm:text-lg">
            {lede}
          </p>
        ) : null}

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to={primaryTo}
            className="btn btn-lg group w-full bg-brand-500 text-white shadow-brand-glow hover:bg-brand-400 sm:w-auto"
          >
            {primaryLabel}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          {secondaryLabel ? (
            <Link
              to={secondaryTo}
              className="btn btn-lg w-full border border-white/20 bg-white/5 text-white hover:border-white/40 hover:bg-white/10 sm:w-auto"
            >
              {secondaryLabel}
            </Link>
          ) : null}
        </div>

        <p className="mt-6 text-sm text-slate-400">
          No credit card required &middot; Your workspace is ready in minutes
        </p>
      </div>
    </section>
  );
}
