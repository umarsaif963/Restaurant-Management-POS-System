import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Check,
  ChefHat,
  CreditCard,
  LayoutGrid,
  MonitorPlay,
  ShieldCheck,
  Sparkles,
  Timer,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { Reveal } from '@/components/marketing/Reveal';
import { SectionHeading } from '@/components/marketing/SectionHeading';
import { CtaBand } from '@/components/marketing/CtaBand';
import {
  CartChip,
  KdsPreview,
  OrderToast,
  PosPreview,
  ReportsPreview,
  StatChip,
} from '@/components/marketing/Previews';

const CAPABILITIES = [
  'Point of sale',
  'Kitchen display',
  'Tables & reservations',
  'Inventory & recipes',
  'Suppliers & purchasing',
  'Reports & analytics',
  'Roles & audit trail',
];

const MODULES = [
  {
    icon: UtensilsCrossed,
    title: 'Point of sale',
    description:
      'Ring up orders, split bills, take card or cash payments and print receipts without leaving the counter.',
  },
  {
    icon: ChefHat,
    title: 'Kitchen display',
    description:
      'Tickets flow from the till straight to the kitchen screen, with live status updates for every station.',
  },
  {
    icon: LayoutGrid,
    title: 'Floor & tables',
    description:
      'Map your room, track occupancy and keep reservations and seating in sync with the order flow.',
  },
  {
    icon: Boxes,
    title: 'Inventory & recipes',
    description:
      'Recipes deduct ingredients automatically, so stock levels and theoretical usage always agree.',
  },
  {
    icon: CreditCard,
    title: 'Suppliers & purchasing',
    description:
      'Raise purchase orders, record deliveries and keep the cost of every ingredient under control.',
  },
  {
    icon: BarChart3,
    title: 'Reports & analytics',
    description:
      'Know which dishes sell, when you are busiest and what your margins really are - per venue.',
  },
];

const SHOWCASE = [
  {
    eyebrow: 'At the counter',
    title: 'Take the order once. It runs itself from there.',
    body: 'The POS screen is built for the rush: big touch targets, instant search across the menu, dine-in, takeaway and delivery on the same ticket, and payment in two taps. Every completed order is printed or fired to the kitchen automatically.',
    points: [
      'Split, merge and void with a full audit trail',
      'Card, cash and other payments recorded per order',
      'Receipts print for the guest and the kitchen',
    ],
    preview: <PosPreview />,
  },
  {
    eyebrow: 'In the kitchen',
    title: 'Tickets land on the pass before the server turns around.',
    body: 'The kitchen display shows every open ticket with its elapsed time, so the expo knows what is cooking, what is ready and what is about to go late - without anyone shouting across the line.',
    points: [
      'Live ticket board grouped by status',
      'Elapsed timers flag slow tickets in ember',
      'Works on any screen already in the kitchen',
    ],
    preview: <KdsPreview />,
  },
  {
    eyebrow: 'After service',
    title: 'Close the day knowing exactly what happened.',
    body: 'Sales by hour, payment mix, best sellers and table turn - computed for your venue only. Reports update as orders are taken, so the morning-after conversation starts from facts instead of guesses.',
    points: [
      'Net sales, covers and average ticket at a glance',
      'Best sellers and payment mix per venue',
      'Never mixed with another restaurant\u2019s numbers',
    ],
    preview: <ReportsPreview />,
  },
];

const STEPS = [
  {
    number: '01',
    title: 'Create your workspace',
    body: 'Register your restaurant and get your owner account, settings and workspace in a single step.',
  },
  {
    number: '02',
    title: 'Load your menu',
    body: 'Add categories, dishes, prices and recipes once. Everything downstream - POS, kitchen, inventory - reads from the same menu.',
  },
  {
    number: '03',
    title: 'Open service',
    body: 'Take orders on the counter, fire them to the kitchen, and watch the day come together on the dashboard.',
  },
];

export function HomePage() {
  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Hero                                                                */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-brand-100/70 via-bone-50 to-bone-50"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-40 top-40 h-96 w-96 rounded-full bg-ember-200/40 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-0 pt-14 sm:px-6 lg:px-8 lg:pt-20">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-8">
            <Reveal className="lg:col-span-6 xl:col-span-6">
              <span className="eyebrow">
                <Sparkles className="h-3.5 w-3.5" />
                Multi-tenant by design
              </span>
              <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.04] tracking-[-0.025em] text-ink-950 sm:text-5xl lg:text-[3.5rem]">
                The restaurant platform that runs{' '}
                <span className="relative whitespace-nowrap text-brand-600">
                  every venue
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 220 12"
                    preserveAspectRatio="none"
                    className="absolute -bottom-2 left-0 h-3 w-full text-ember-400"
                  >
                    <path
                      d="M2 9C60 3 160 2 218 7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>{' '}
                in one place.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-700/80">
                Point of sale, kitchen, inventory, purchasing and staff management - with strict
                separation between restaurants, so nobody ever sees another venue&apos;s numbers.
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
                  to="/features"
                  className="btn btn-lg w-full border border-slate-300/80 bg-white text-ink-800 shadow-sm hover:border-slate-400 hover:bg-bone-100 sm:w-auto"
                >
                  Explore the features
                </Link>
              </div>

              <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-700/75">
                {['No credit card', 'No setup fee', 'Ready in minutes'].map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-brand-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>

            {/* Photo composition with floating product chips */}
            <Reveal delay={120} className="lg:col-span-6 xl:col-span-6">
              <div className="relative mx-auto max-w-xl lg:max-w-none">
                <div className="relative overflow-hidden rounded-3xl shadow-stage ring-1 ring-slate-900/10">
                  <img
                    src="/img/bistro-interior.webp"
                    alt="Warm bistro dining room ready for evening service"
                    width={1200}
                    height={900}
                    decoding="async"
                    className="aspect-[4/3] w-full object-cover"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-ink-950/10 to-transparent"
                  />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-300">
                      Tonight&rsquo;s service
                    </p>
                    <p className="mt-1 font-display text-lg font-medium text-white">
                      86 covers seated &middot; 3 tickets on the pass
                    </p>
                  </div>
                </div>

                <StatChip
                  icon={<Timer className="h-4 w-4" />}
                  label="Avg ticket time"
                  value="6m 12s"
                  className="absolute -left-3 -top-5 hidden sm:flex lg:-left-8"
                />
                <OrderToast className="absolute -bottom-12 -right-2 hidden sm:flex lg:-right-6" />
                <CartChip className="absolute -bottom-12 left-6 hidden lg:flex" />
              </div>
            </Reveal>
          </div>

          {/* Product-first preview */}
          <Reveal delay={100} className="relative z-10 mt-14 lg:mt-16">
            <PosPreview className="mx-auto max-w-5xl" />
            <p className="mt-3 text-center text-xs text-ink-700/50">
              Illustrative preview of the counter screen - your venue, your menu, your prices.
            </p>
          </Reveal>
        </div>

        {/* Capability strip */}
        <div className="relative mt-16 border-y border-slate-200/70 bg-white/70 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-3 px-4 py-5 sm:px-6 lg:px-8">
            {CAPABILITIES.map((capability) => (
              <span
                key={capability}
                className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-ink-700/60"
              >
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                {capability}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Product showcase (alternating previews)                             */}
      {/* ------------------------------------------------------------------ */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <Reveal>
          <SectionHeading
            eyebrow="One connected system"
            title="From the first order of the morning to the end-of-day report."
            lede="Every module reads the same menu, the same orders and the same permission model - so the story never changes between the counter, the kitchen and the office."
            align="center"
          />
        </Reveal>

        <div className="mt-16 space-y-20 lg:space-y-28">
          {SHOWCASE.map((block, index) => (
            <div
              key={block.eyebrow}
              className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14"
            >
              <Reveal
                className={
                  index % 2 === 1 ? 'lg:order-2 lg:col-span-1' : 'lg:col-span-1'
                }
              >
                <p className="eyebrow">{block.eyebrow}</p>
                <h3 className="mt-4 font-display text-2xl font-semibold leading-[1.12] tracking-[-0.02em] text-ink-950 sm:text-3xl lg:text-[2rem]">
                  {block.title}
                </h3>
                <p className="mt-4 text-base leading-relaxed text-ink-700/75">{block.body}</p>
                <ul className="mt-6 space-y-3">
                  {block.points.map((point) => (
                    <li
                      key={point}
                      className="flex items-start gap-3 text-sm text-ink-700/85"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                        <Check className="h-3 w-3" />
                      </span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/features"
                  className="group mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-600"
                >
                  See all features
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Reveal>

              <Reveal
                delay={120}
                className={index % 2 === 1 ? 'lg:order-1 lg:col-span-1' : 'lg:col-span-1'}
              >
                {block.preview}
              </Reveal>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Imagery / atmosphere band                                           */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative overflow-hidden border-y border-slate-200/70 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <Reveal>
            <SectionHeading
              eyebrow="Built for service"
              title="Software that keeps up with the rhythm of the room."
              lede="Lunch rush, Friday night, private dining, the morning stock take - the product is shaped around how restaurants actually work, not around how spreadsheets do."
              align="center"
            />
          </Reveal>

          <div className="mt-12 grid gap-4 md:grid-cols-12">
            <Reveal className="md:col-span-7">
              <figure className="relative overflow-hidden rounded-3xl shadow-stage-sm ring-1 ring-slate-900/5">
                <img
                  src="/img/dining-room.webp"
                  alt="Busy restaurant dining room during service"
                  width={1400}
                  height={933}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[16/10] w-full object-cover"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/85 to-transparent p-6">
                  <p className="font-display text-xl font-medium text-white">
                    The floor, the pass and the office - one source of truth.
                  </p>
                </figcaption>
              </figure>
            </Reveal>

            <div className="grid gap-4 md:col-span-5">
              <Reveal delay={80}>
                <figure className="relative overflow-hidden rounded-3xl shadow-stage-sm ring-1 ring-slate-900/5">
                  <img
                    src="/img/kitchen-prep.webp"
                    alt="Cook chopping vegetables during kitchen prep"
                    width={900}
                    height={600}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[3/2] w-full object-cover"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/85 to-transparent p-5">
                    <p className="text-sm font-medium text-white">
                      Recipes cost every plate before service starts.
                    </p>
                  </figcaption>
                </figure>
              </Reveal>
              <Reveal delay={160}>
                <figure className="relative overflow-hidden rounded-3xl shadow-stage-sm ring-1 ring-slate-900/5">
                  <img
                    src="/img/payment-counter.webp"
                    alt="Guest paying at the restaurant counter"
                    width={900}
                    height={600}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[3/2] w-full object-cover"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/85 to-transparent p-5">
                    <p className="text-sm font-medium text-white">
                      Card or cash, split or single - closed in two taps.
                    </p>
                  </figcaption>
                </figure>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Modules grid                                                        */}
      {/* ------------------------------------------------------------------ */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <Reveal>
          <SectionHeading
            eyebrow="Everything a service needs"
            title="Six modules. One workspace. No integration tax."
            lede="Buy the whole product, not a bundle of add-ons. Each module is included in every plan and shares the same data model."
          />
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((module, index) => {
            const Icon = module.icon;
            return (
              <Reveal key={module.title} delay={index * 60} as="article">
                <div className="group relative h-full overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-stage-sm">
                  <div
                    aria-hidden="true"
                    className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-brand-50 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  />
                  <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-ink-950 text-brand-300 shadow-sm transition-colors group-hover:bg-brand-600 group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="relative mt-5 text-base font-bold tracking-tight text-ink-950">
                    {module.title}
                  </h3>
                  <p className="relative mt-2 text-sm leading-relaxed text-ink-700/75">
                    {module.description}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* How it works                                                        */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-y border-slate-200/70 bg-bone-100">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <Reveal>
            <SectionHeading
              eyebrow="Get started"
              title="Open on the platform in an afternoon."
              lede="No implementation project, no data-entry marathon. Registering creates your restaurant, its settings and your owner account in one go."
              align="center"
            />
          </Reveal>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <Reveal key={step.number} delay={index * 90} as="article">
                <div className="relative h-full rounded-3xl border border-slate-200/80 bg-white p-7 shadow-card">
                  <span className="font-display text-4xl font-semibold text-brand-200">
                    {step.number}
                  </span>
                  <h3 className="mt-4 text-lg font-bold tracking-tight text-ink-950">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-700/75">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={150} className="mt-12 text-center">
            <Link
              to="/register"
              className="btn btn-lg group bg-ink-950 text-white shadow-pop hover:bg-ink-800"
            >
              Start with your venue
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Access control / trust band                                         */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative overflow-hidden bg-ink-950">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-500/15 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-28">
          <Reveal>
            <p className="eyebrow-dark">
              <ShieldCheck className="h-3.5 w-3.5" />
              Access control
            </p>
            <h2 className="mt-5 font-display text-3xl font-semibold leading-[1.1] tracking-[-0.02em] text-white sm:text-4xl">
              Access control you can actually reason about.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-slate-300/85 sm:text-lg">
              Job roles give everybody the right default. Custom roles let you hand out exactly the
              capabilities a colleague needs - nothing more, nothing less.
            </p>
            <div className="mt-8">
              <Link
                to="/features"
                className="group inline-flex items-center gap-1.5 text-sm font-semibold text-brand-400 hover:text-brand-300"
              >
                How permissions work
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <ul className="space-y-4">
              {[
                {
                  icon: ShieldCheck,
                  title: 'Permission-checked requests',
                  body: 'Every request is checked against the permission the signed-in employee actually holds - not against a role name.',
                },
                {
                  icon: LayoutGrid,
                  title: 'Venue-scoped data',
                  body: 'Data is scoped to the restaurant of the signed-in account. A query cannot reach another venue\u2019s rows.',
                },
                {
                  icon: Users,
                  title: 'Instant off-boarding',
                  body: 'Deactivating an employee signs them out everywhere immediately, and every action lands in the audit log.',
                },
                {
                  icon: MonitorPlay,
                  title: 'Full audit trail',
                  body: 'An audit log records every request that reached the API: who, what, when and how long it took.',
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <li
                    key={item.title}
                    className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-brand-400/40 hover:bg-white/[0.06]"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white">{item.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-400">{item.body}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Closing CTA                                                         */}
      {/* ------------------------------------------------------------------ */}
      <CtaBand
        title="Run your whole service on one platform."
        lede="Registering creates your restaurant, its settings and your owner account in a single step. No card, no sales call, no setup fee."
        secondaryLabel="Talk to us first"
        secondaryTo="/contact"
      />
    </>
  );
}
