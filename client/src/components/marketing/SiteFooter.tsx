import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { APP_NAME } from '@/constants/routes';
import { BrandMark } from './SiteHeader';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Features', to: '/features' },
      { label: 'Pricing', to: '/pricing' },
      { label: 'Get started', to: '/register' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', to: '/about' },
      { label: 'Contact', to: '/contact' },
      { label: 'Sign in', to: '/login' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', to: '/privacy' },
      { label: 'Terms', to: '/terms' },
    ],
  },
];

/** Dark ink footer of the public site. */
export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-white/5 bg-ink-950 text-slate-400">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-64 w-[640px] -translate-x-1/2 rounded-full bg-brand-500/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Link to="/" className="group flex w-fit items-center gap-2.5">
              <BrandMark />
              <span className="leading-tight">
                <span className="block text-[15px] font-bold tracking-tight text-white">
                  {APP_NAME}
                </span>
                <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
                  Restaurant OS
                </span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              Point of sale, kitchen display, tables, inventory, purchasing, analytics and staff
              management - one workspace per restaurant, with strict separation between venues.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="btn bg-brand-500 text-white shadow-brand-glow hover:bg-brand-400"
              >
                Create your workspace
              </Link>
              <Link
                to="/pricing"
                className="btn border border-white/15 bg-white/5 text-white hover:border-white/30 hover:bg-white/10"
              >
                See pricing
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {column.title}
                </p>
                <ul className="mt-4 space-y-2.5 text-sm">
                  {column.links.map((link) => (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className="group inline-flex items-center gap-1 text-slate-400 transition hover:text-white"
                      >
                        {link.label}
                        <ArrowUpRight className="h-3 w-3 -translate-x-0.5 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-xs sm:flex-row sm:items-center">
          <p>
            &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <p className="text-slate-500">Built for service. Designed for speed.</p>
        </div>
      </div>
    </footer>
  );
}
