import { Link } from 'react-router-dom';
import { ArrowRight, Check, HelpCircle, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { useListPlansQuery } from '@/store/api/publicApi';
import { Reveal } from '@/components/marketing/Reveal';
import { SectionHeading } from '@/components/marketing/SectionHeading';
import { CtaBand } from '@/components/marketing/CtaBand';

const INCLUDED_IN_EVERY_PLAN = [
  'The complete point-of-sale and order flow',
  'Kitchen display and ticket printing',
  'Menu, categories and pricing',
  'Employee accounts with roles',
  'Sales reporting for your venue',
  'Guided setup - no implementation fee',
];

const FAQS = [
  {
    question: 'Is there a setup fee or a free trial?',
    answer:
      'No setup fee and no trial countdown. Creating a workspace is free, you load your own menu, and you decide afterwards whether the product fits your service.',
  },
  {
    question: 'How does billing work?',
    answer:
      'Plans are billed manually by our team. There is no automatic charge to your card - we send an invoice, and a change of plan takes effect on the next one.',
  },
  {
    question: 'Can I change or cancel my plan later?',
    answer:
      'Any time. A change of plan takes effect on the next invoice, and you can stop using the service whenever you choose - see the terms of service for the details.',
  },
  {
    question: 'Do you charge per terminal or per order?',
    answer:
      'Neither. A plan covers your whole venue: your team size and the depth of the back office you need determine the tier, not the number of screens or transactions.',
  },
  {
    question: 'Is my restaurant\u2019s data separate?',
    answer:
      'Yes - every record belongs to one restaurant and every request is scoped to the account that signed in. No venue can read another venue\u2019s numbers, including through reports.',
  },
];

export function PricingPage() {
  const { data: plans, isError, isLoading } = useListPlansQuery();

  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/* Hero                                                              */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative overflow-hidden border-b border-slate-200/70">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,var(--tw-gradient-stops))] from-brand-100/60 via-bone-50 to-bone-50"
        />
        <div className="relative mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:py-24">
          <Reveal>
            <span className="eyebrow">
              <Sparkles className="h-3.5 w-3.5" />
              Pricing
            </span>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.06] tracking-[-0.025em] text-ink-950 sm:text-5xl">
              Simple pricing, per restaurant.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-ink-700/80">
              Every plan includes the full product. You only pay for the size of your team and the
              depth of the back office you need - and we bill you manually, never by surprise.
            </p>
            <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-ink-700/75">
              {['No setup fee', 'No per-terminal charges', 'Cancel any time'].map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-brand-600" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Plans                                                             */}
      {/* ---------------------------------------------------------------- */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        {isError ? (
          <div className="mx-auto max-w-xl rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center">
            <p className="font-semibold text-amber-900">The plan catalogue is temporarily unavailable.</p>
            <p className="mt-2 text-sm text-amber-800/80">
              Please try again in a moment - or talk to us directly and we will send you the
              current plans.
            </p>
            <Link to="/contact" className="btn-primary mt-5 inline-flex">
              Contact us
            </Link>
          </div>
        ) : isLoading ? (
          <div className="grid gap-6 lg:grid-cols-3" aria-hidden="true">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="h-96 animate-pulse rounded-3xl border border-slate-200/80 bg-white p-7"
              >
                <div className="h-4 w-24 rounded bg-slate-200" />
                <div className="mt-4 h-8 w-32 rounded bg-slate-200" />
                <div className="mt-6 space-y-3">
                  {[0, 1, 2, 3, 4].map((line) => (
                    <div key={line} className="h-3.5 rounded bg-slate-100" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-3">
            {(plans ?? []).map((plan, index) => {
              const to = plan.id === 'ENTERPRISE' ? '/contact' : '/register';
              return (
                <Reveal key={plan.id} delay={index * 80} as="article">
                  <div
                    className={`relative flex h-full flex-col rounded-3xl border p-7 transition-all duration-300 sm:p-8 ${
                      plan.highlighted
                        ? 'border-transparent bg-ink-950 text-slate-300 shadow-pop lg:-translate-y-3'
                        : 'border-slate-200/80 bg-white shadow-card hover:-translate-y-1 hover:shadow-stage-sm'
                    }`}
                  >
                    {plan.highlighted ? (
                      <span className="absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-brand-500 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-brand-glow">
                        Most popular
                      </span>
                    ) : null}

                    <h2
                      className={`text-lg font-bold tracking-tight ${
                        plan.highlighted ? 'text-white' : 'text-ink-950'
                      }`}
                    >
                      {plan.name}
                    </h2>
                    <p className="mt-4 flex items-end gap-2">
                      <span
                        className={`font-display text-5xl font-semibold leading-none tracking-tight ${
                          plan.highlighted ? 'text-white' : 'text-ink-950'
                        }`}
                      >
                        {plan.priceLabel}
                      </span>
                    </p>
                    <p
                      className={`mt-2 text-xs ${plan.highlighted ? 'text-slate-400' : 'text-slate-500'}`}
                    >
                      {plan.priceNote}
                    </p>
                    <p
                      className={`mt-4 text-sm leading-relaxed ${
                        plan.highlighted ? 'text-slate-300/90' : 'text-ink-700/75'
                      }`}
                    >
                      {plan.description}
                    </p>

                    <ul
                      className={`mt-6 flex-1 space-y-3 border-t pt-6 text-sm ${
                        plan.highlighted ? 'border-white/10' : 'border-slate-100'
                      }`}
                    >
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5">
                          <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                              plan.highlighted
                                ? 'bg-brand-500/20 text-brand-300'
                                : 'bg-brand-100 text-brand-700'
                            }`}
                          >
                            <Check className="h-3 w-3" />
                          </span>
                          <span className={plan.highlighted ? 'text-slate-300' : 'text-ink-700/85'}>
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      to={to}
                      className={`btn mt-7 w-full justify-center ${
                        plan.highlighted
                          ? 'bg-brand-500 text-white shadow-brand-glow hover:bg-brand-400'
                          : 'border border-slate-300/80 bg-white text-ink-800 hover:border-slate-400 hover:bg-bone-100'
                      }`}
                    >
                      {plan.ctaLabel}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </Reveal>
              );
            })}
          </div>
        )}

        <p className="mt-10 text-center text-sm text-ink-700/60">
          Plans are billed manually by our team. No automatic charges, cancel any time.
        </p>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Included in every plan                                            */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-y border-slate-200/70 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
          <Reveal>
            <SectionHeading
              eyebrow="No feature gates on the counter"
              title="The core product is in every plan."
              lede="A small single-location venue runs the same POS, the same kitchen display and the same reporting engine as a group on the Professional plan."
            />
            <Link
              to="/features"
              className="group mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-600"
            >
              Explore all features
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Reveal>

          <Reveal delay={120}>
            <div className="grid gap-3 sm:grid-cols-2">
              {INCLUDED_IN_EVERY_PLAN.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-bone-50 p-4 text-sm text-ink-700/85"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                    <Check className="h-3 w-3" />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* FAQ                                                               */}
      {/* ---------------------------------------------------------------- */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <Reveal>
          <SectionHeading
            eyebrow="Questions"
            title="Before you decide."
            align="center"
          />
        </Reveal>

        <div className="mt-10 space-y-4">
          {FAQS.map((faq, index) => (
            <Reveal key={faq.question} delay={index * 50}>
              <details className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card transition hover:border-brand-300 sm:p-6">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-left text-base font-semibold text-ink-950 [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand-500 transition group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink-700/75">{faq.answer}</p>
              </details>
            </Reveal>
          ))}
        </div>

        <Reveal delay={100} className="mt-10">
          <div className="flex flex-col items-start gap-4 rounded-3xl border border-slate-200/80 bg-bone-100 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm ring-1 ring-slate-200/70">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-ink-950">Running several concepts?</p>
                <p className="mt-0.5 text-sm text-ink-700/75">
                  Enterprise covers unlimited employees, custom roles, guided onboarding and data
                  migration help.
                </p>
              </div>
            </div>
            <Link to="/contact" className="btn-primary w-full shrink-0 justify-center sm:w-auto">
              <Users className="h-4 w-4" />
              Talk to sales
            </Link>
          </div>
        </Reveal>
      </section>

      <CtaBand
        title="Start on the plan that fits today."
        lede="You can move up or down whenever your team changes - a plan change simply takes effect on the next invoice."
        secondaryLabel="Read the features first"
        secondaryTo="/features"
      />
    </>
  );
}
