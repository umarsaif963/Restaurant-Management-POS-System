import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Check,
  ChefHat,
  CreditCard,
  LayoutGrid,
  ReceiptText,
  ScrollText,
  ShieldCheck,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { Reveal } from '@/components/marketing/Reveal';
import { SectionHeading } from '@/components/marketing/SectionHeading';
import { CtaBand } from '@/components/marketing/CtaBand';
import { KdsPreview } from '@/components/marketing/Previews';

interface Feature {
  icon: typeof UtensilsCrossed;
  title: string;
  description: string;
  details: string[];
}

const FEATURES: Feature[] = [
  {
    icon: UtensilsCrossed,
    title: 'Point of sale & orders',
    description:
      'A fast counter screen with dine-in, takeaway and delivery on the same ticket.',
    details: [
      'Instant search across categories and dishes',
      'Split, merge, void and reprint with a paper trail',
      'Card, cash and other payments recorded per order',
    ],
  },
  {
    icon: ChefHat,
    title: 'Kitchen & KDS',
    description:
      'Orders become kitchen tickets automatically and appear on the kitchen display the moment they are taken.',
    details: [
      'Live ticket board with elapsed timers',
      'Status per ticket: cooking, ready, served',
      'Dedicated kitchen printing for the pass',
    ],
  },
  {
    icon: LayoutGrid,
    title: 'Tables & reservations',
    description:
      'Sections, tables and a reservation book sharing one floor plan, so a seated guest always has a table.',
    details: ['Floor occupancy at a glance', 'Reservation book per venue', 'Walk-ins and bookings side by side'],
  },
  {
    icon: Users,
    title: 'Customers & staff',
    description:
      'Guest history with every visit and spend, and employee accounts with exactly the access their job needs.',
    details: ['Customer records per venue', 'Employees, roles and invitations', 'Immediate sign-out on deactivation'],
  },
  {
    icon: Boxes,
    title: 'Inventory & recipes',
    description:
      'Define a recipe once - every sold dish deducts its ingredients and updates stock levels automatically.',
    details: ['Recipe-driven stock movements', 'Theoretical vs actual usage', 'Low-stock visibility before service'],
  },
  {
    icon: CreditCard,
    title: 'Suppliers & purchasing',
    description:
      'Track who supplies what, raise purchase orders, book deliveries in and see the true cost of every ingredient.',
    details: ['Supplier catalogue per venue', 'Purchase orders and deliveries', 'Ingredient cost tracking'],
  },
  {
    icon: BarChart3,
    title: 'Reports & dashboard',
    description:
      'Sales, payment mix, best sellers and busy hours - computed for your venue, never across venues.',
    details: ['Sales by hour, day and channel', 'Best sellers and payment mix', 'End-of-day numbers you can trust'],
  },
  {
    icon: ShieldCheck,
    title: 'Roles & audit trail',
    description:
      'Custom roles with explicit permissions, and an audit log of every request that reached the API.',
    details: ['Built-in roles or your own', 'Permission checked per request', 'Who did what, when, and how long it took'],
  },
];

/** Module map mirroring the real workspace navigation. */
const WORKSPACE_MAP = [
  {
    group: 'Operations',
    items: ['Point of Sale', 'Orders', 'Kitchen', 'Kitchen Display', 'Menu', 'Tables', 'Reservations', 'Customers'],
  },
  {
    group: 'Back office',
    items: ['Inventory', 'Recipes', 'Suppliers', 'Purchases'],
  },
  {
    group: 'Insights',
    items: ['Dashboard', 'Reports', 'Audit Logs'],
  },
  {
    group: 'Administration',
    items: ['Employees', 'Roles', 'Settings', 'My Profile'],
  },
];

export function FeaturesPage() {
  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/* Hero                                                              */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative overflow-hidden border-b border-slate-200/70">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,var(--tw-gradient-stops))] from-brand-100/60 via-bone-50 to-bone-50"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <Reveal>
              <span className="eyebrow">Features</span>
              <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.06] tracking-[-0.025em] text-ink-950 sm:text-5xl lg:text-[3.25rem]">
                Every module the service touches - already connected.
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-700/80">
                From the first order of the morning to the end-of-day report, every screen shares
                the same data and the same permission model. Nothing to wire together, nothing to
                reconcile.
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
                  to="/pricing"
                  className="btn btn-lg w-full border border-slate-300/80 bg-white text-ink-800 shadow-sm hover:border-slate-400 hover:bg-bone-100 sm:w-auto"
                >
                  See pricing
                </Link>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="relative overflow-hidden rounded-3xl shadow-stage ring-1 ring-slate-900/10">                  <img
                    src="/img/bartender.webp"
                    alt="Cook plating dishes under the heat lamps at the pass"
                  width={1200}
                  height={900}
                  decoding="async"
                  className="aspect-[4/3] w-full object-cover"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-ink-950/75 via-ink-950/15 to-transparent"
                />
                <div className="absolute bottom-5 left-5 right-5 flex flex-wrap gap-2">
                  {['POS', 'Kitchen', 'Inventory', 'Reports'].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Feature grid                                                      */}
      {/* ---------------------------------------------------------------- */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <Reveal>
          <SectionHeading
            eyebrow="The whole product"
            title="Eight capabilities, one data model."
            lede="Every plan includes the full product. What changes between plans is the size of your team and the depth of the back office you need."
            align="center"
          />
        </Reveal>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Reveal key={feature.title} delay={(index % 2) * 70} as="article">
                <div className="group relative h-full overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-stage-sm">
                  <div className="flex items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ink-950 text-brand-300 shadow-sm transition-colors group-hover:bg-brand-600 group-hover:text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold tracking-tight text-ink-950">
                        {feature.title}
                      </h2>
                      <p className="mt-1.5 text-sm leading-relaxed text-ink-700/75">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                  <ul className="mt-5 space-y-2 border-t border-slate-100 pt-5">
                    {feature.details.map((detail) => (
                      <li
                        key={detail}
                        className="flex items-start gap-2.5 text-sm text-ink-700/80"
                      >
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Workspace map + KDS preview                                        */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-y border-slate-200/70 bg-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
          <Reveal>
            <SectionHeading
              eyebrow="Inside the workspace"
              title="A navigation your team already understands."
              lede="The workspace is grouped the way restaurants think: the floor and the pass under Operations, costing and stock under Back office, numbers under Insights, and people under Administration."
            />
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {WORKSPACE_MAP.map((section) => (
                <div
                  key={section.group}
                  className="rounded-2xl border border-slate-200/80 bg-bone-50 p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    {section.group}
                  </p>
                  <ul className="mt-3 space-y-1.5">
                    {section.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2 text-sm text-ink-700/85"
                      >
                        <ReceiptText className="h-3.5 w-3.5 text-brand-600" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={120} className="lg:sticky lg:top-24">
            <KdsPreview />
            <p className="mt-3 text-center text-xs text-ink-700/50">
              Illustrative preview of the kitchen display.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Permissions dark band                                             */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative overflow-hidden bg-ink-950">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-32 bottom-0 h-96 w-96 rounded-full bg-brand-500/15 blur-3xl"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <p className="eyebrow-dark">
                <ScrollText className="h-3.5 w-3.5" />
                Roles & permissions
              </p>
              <h2 className="mt-5 font-display text-3xl font-semibold leading-[1.1] tracking-[-0.02em] text-white sm:text-4xl">
                Give every colleague exactly the access they need.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-slate-300/85 sm:text-lg">
                Built-in job roles cover the common cases. Custom roles let you compose explicit
                capabilities - a bartender who can take payments but never see reports, a stock
                manager who owns inventory and nothing else.
              </p>
              <ul className="mt-8 space-y-3 text-sm text-slate-300/90">
                {[
                  'Permissions are checked server-side on every request',
                  'Changes to a role take effect on the next request',
                  'Audit log records who did what, and when',
                ].map((line) => (
                  <li key={line} className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                    {line}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={120}>
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-pop backdrop-blur sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Example &middot; custom role
                </p>
                <p className="mt-2 text-lg font-bold text-white">Floor manager</p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {[
                    { label: 'POS_USE', on: true },
                    { label: 'ORDERS_READ', on: true },
                    { label: 'KITCHEN_READ', on: true },
                    { label: 'TABLES_READ', on: true },
                    { label: 'REPORTS_VIEW', on: false },
                    { label: 'SETTINGS_READ', on: false },
                    { label: 'EMPLOYEES_READ', on: false },
                    { label: 'AUDIT_LOGS_VIEW', on: false },
                  ].map((permission) => (
                    <div
                      key={permission.label}
                      className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                        permission.on
                          ? 'border-brand-400/40 bg-brand-500/10 text-brand-300'
                          : 'border-white/10 bg-white/[0.03] text-slate-500'
                      }`}
                    >
                      <span className="truncate">{permission.label}</span>
                      {permission.on ? (
                        <Check className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-600" />
                      )}
                    </div>
                  ))}
                </div>
                <p className="mt-5 text-xs leading-relaxed text-slate-500">
                  Illustrative example. Custom roles are composed in the workspace and enforced on
                  every request the moment they are saved.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Closing CTA                                                       */}
      {/* ---------------------------------------------------------------- */}
      <CtaBand
        title="See it on your own data."
        lede="Create a workspace and explore the whole product - no card, no sales call, no setup fee."
        secondaryLabel="Compare the plans"
        secondaryTo="/pricing"
      />
    </>
  );
}
