import type { ReactNode } from 'react';

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  lede?: string;
  align?: 'left' | 'center';
  tone?: 'light' | 'dark';
  className?: string;
}

/** Eyebrow + display heading + lede, used at the top of every major section. */
export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = 'left',
  tone = 'light',
  className = '',
}: SectionHeadingProps) {
  const centered = align === 'center';
  const dark = tone === 'dark';

  return (
    <div className={`${centered ? 'mx-auto max-w-3xl text-center' : 'max-w-2xl'} ${className}`}>
      {eyebrow ? (
        <p className={dark ? 'eyebrow-dark' : 'eyebrow'}>{eyebrow}</p>
      ) : null}
      <h2
        className={`mt-4 font-display text-3xl font-semibold leading-[1.08] tracking-[-0.02em] sm:text-4xl lg:text-[2.75rem] ${
          dark ? 'text-white' : 'text-ink-950'
        }`}
      >
        {title}
      </h2>
      {lede ? (
        <p
          className={`mt-4 text-base leading-relaxed sm:text-lg ${
            dark ? 'text-slate-300/90' : 'text-ink-700/75'
          }`}
        >
          {lede}
        </p>
      ) : null}
    </div>
  );
}
