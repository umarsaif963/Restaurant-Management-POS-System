import { Reveal } from '@/components/marketing/Reveal';

interface LegalSection {
  heading: string;
  body: string[];
}

export interface LegalPageProps {
  title: string;
  intro: string;
  sections: LegalSection[];
}

export function LegalPage({ title, intro, sections }: LegalPageProps) {
  return (
    <>
      <section className="relative overflow-hidden border-b border-slate-200/70">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,var(--tw-gradient-stops))] from-brand-100/50 via-bone-50 to-bone-50"
        />
        <div className="relative mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:py-20">
          <Reveal>
            <p className="eyebrow">Legal</p>
            <h1 className="mt-4 font-display text-3xl font-semibold leading-[1.1] tracking-[-0.02em] text-ink-950 sm:text-4xl">
              {title}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-ink-700/75 sm:text-lg">{intro}</p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <div className="space-y-10">
          {sections.map((section, index) => (
            <Reveal key={section.heading} delay={index * 40}>
              <article className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card sm:p-8">
                <h2 className="font-display text-xl font-semibold tracking-tight text-ink-950">
                  {section.heading}
                </h2>
                <div className="mt-4 space-y-4">
                  {section.body.map((paragraph) => (
                    <p key={paragraph} className="text-sm leading-relaxed text-ink-700/80 sm:text-base">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
