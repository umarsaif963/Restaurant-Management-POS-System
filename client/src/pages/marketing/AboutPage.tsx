import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  EyeOff,
  Gauge,
  Handshake,
  ShieldCheck,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';
import { Reveal } from '@/components/marketing/Reveal';
import { SectionHeading } from '@/components/marketing/SectionHeading';
import { CtaBand } from '@/components/marketing/CtaBand';

const BELIEFS = [
  {
    icon: ShieldCheck,
    title: 'Access should be explicit.',
    body: 'A screen exists because somebody decided an employee needs it - not because a role happened to be named a certain way.',
  },
  {
    icon: EyeOff,
    title: 'Data should not leak.',
    body: 'If a query can read another venue\u2019s rows, that is a bug, not a configuration choice.',
  },
  {
    icon: Gauge,
    title: 'Setup should be free.',
    body: 'Creating a venue takes a form, not a two-week implementation project with a consultant attached.',
  },
  {
    icon: Handshake,
    title: 'Billing should be honest.',
    body: 'Plans are billed manually. No auto-renewing traps, no per-terminal surcharges, no surprise line items.',
  },
];

const PRINCIPLES = [
  {
    title: 'Built for the rush',
    body: 'Every screen is judged by whether it survives a full Friday night - big targets, instant search, no modal mazes between the guest and the receipt.',
  },
  {
    title: 'Scoped by construction',
    body: 'Multi-tenancy is not a filter applied at the edge. Every record belongs to a restaurant and every request is resolved against the account that signed in.',
  },
  {
    title: 'Readable by humans',
    body: 'Reports use the words restaurants use - covers, ticket, payment mix, turn - so the morning meeting starts from shared facts.',
  },
];

export function AboutPage() {
  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/* Hero                                                              */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative overflow-hidden border-b border-slate-200/70">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-ember-100/60 via-bone-50 to-bone-50"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <Reveal>
              <span className="eyebrow">
                <Sparkles className="h-3.5 w-3.5" />
                About us
              </span>
              <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.06] tracking-[-0.025em] text-ink-950 sm:text-5xl lg:text-[3.25rem]">
                We build tools for people who work nights.
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-700/80">
                Restaurant software should feel invisible during a rush and trustworthy the
                morning after. That is the bar we build against.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/register"
                  className="btn btn-lg group w-full bg-brand-600 text-white shadow-brand-glow hover:bg-brand-500 sm:w-auto"
                >
                  Create your workspace
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/contact"
                  className="btn btn-lg w-full border border-slate-300/80 bg-white text-ink-800 shadow-sm hover:border-slate-400 hover:bg-bone-100 sm:w-auto"
                >
                  Talk to us
                </Link>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="relative overflow-hidden rounded-3xl shadow-stage ring-1 ring-slate-900/10">
                <img
                  src="/img/table-setting.webp"
                  alt="A plated dish being served at a fine-dining table"
                  width={1200}
                  height={900}
                  decoding="async"
                  className="aspect-[4/3] w-full object-cover"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-ink-950/10 to-transparent"
                />
                <p className="absolute bottom-5 left-5 right-5 font-display text-lg font-medium text-white">
                  The room is the product. Everything else is plumbing.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Why we exist                                                      */}
      {/* ---------------------------------------------------------------- */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <SectionHeading
              eyebrow="Why we exist"
              title="Most restaurant software breaks at the second venue."
              lede="It is built for a single room, so the moment a group opens a second concept the data starts blending, the reports stop agreeing and somebody buys a second subscription to work around it."
            />
            <p className="mt-6 text-base leading-relaxed text-ink-700/75">
              We took the opposite approach: every record belongs to a restaurant, every request is
              scoped to the restaurant of the signed-in account, and the platform operator can look
              across all of them without ever mixing their data. One platform, one workspace per
              venue, no arithmetic between them.
            </p>
            <Link
              to="/features"
              className="group mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-600"
            >
              See how the modules fit together
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Reveal>

          <Reveal delay={120}>
            <figure className="relative overflow-hidden rounded-3xl shadow-stage-sm ring-1 ring-slate-900/5">
              <img
                src="/img/counter-service.webp"
                alt="A guest paying on a tablet counter terminal"
                width={1400}
                height={933}
                loading="lazy"
                decoding="async"
                className="aspect-[4/3] w-full object-cover"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/85 to-transparent p-6">
                <p className="text-sm font-medium text-white">
                  The same counter, the same platform - at every venue in the group.
                </p>
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* What we believe                                                    */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-y border-slate-200/70 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <Reveal>
            <SectionHeading
              eyebrow="What we believe"
              title="Four positions we will not trade away."
              align="center"
            />
          </Reveal>

          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {BELIEFS.map((belief, index) => {
              const Icon = belief.icon;
              return (
                <Reveal key={belief.title} delay={index * 70} as="article">
                  <div className="group h-full rounded-3xl border border-slate-200/80 bg-bone-50 p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:bg-white hover:shadow-stage-sm">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink-950 text-brand-300 shadow-sm transition-colors group-hover:bg-brand-600 group-hover:text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-5 text-lg font-bold tracking-tight text-ink-950">
                      {belief.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-700/75">{belief.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* How we work                                                        */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative overflow-hidden bg-ink-950">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-500/15 blur-3xl"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <p className="eyebrow-dark">How we work</p>
              <h2 className="mt-5 font-display text-3xl font-semibold leading-[1.1] tracking-[-0.02em] text-white sm:text-4xl">
                Quiet software, loud results.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-slate-300/85 sm:text-lg">
                We are engineers and operators who would rather ship one screen that survives
                service than ten that demo well. The product is deliberately conservative: it does
                what a restaurant needs, and it does not hold your data hostage if you leave.
              </p>
              <ul className="mt-8 space-y-3 text-sm text-slate-300/90">
                {[
                  'Your menu, prices, recipes and reports stay yours',
                  'Export and exit whenever you choose',
                  'Human support - you talk to the people who build it',
                ].map((line) => (
                  <li key={line} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                    {line}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={120}>
              <div className="space-y-4">
                {PRINCIPLES.map((principle) => (
                  <div
                    key={principle.title}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-brand-400/40 hover:bg-white/[0.06]"
                  >
                    <p className="flex items-center gap-2 text-sm font-bold text-white">
                      <UtensilsCrossed className="h-4 w-4 text-brand-400" />
                      {principle.title}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">{principle.body}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <CtaBand
        title="Run your venue on it."
        lede="Registering creates your restaurant, its settings and your owner account in a single step."
        secondaryLabel="Ask us anything"
        secondaryTo="/contact"
      />
    </>
  );
}
