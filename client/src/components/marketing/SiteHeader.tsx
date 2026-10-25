import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, UtensilsCrossed, X, ArrowRight } from 'lucide-react';
import { APP_NAME } from '@/constants/routes';

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Features', to: '/features' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

/** Brand mark shared by the navbar, footer and mobile drawer. */
export function BrandMark({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const box = size === 'sm' ? 'h-8 w-8 rounded-lg' : 'h-10 w-10 rounded-xl';
  const icon = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  return (
    <span
      className={`flex ${box} items-center justify-center bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-sm shadow-brand-700/30 ring-1 ring-brand-700/20`}
    >
      <UtensilsCrossed className={icon} />
    </span>
  );
}

/**
 * Sticky public-site navbar: transparent over the hero, glass-blurred once the
 * page scrolls. Fully separate from the authenticated application shell.
 */
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled || open
          ? 'border-b border-slate-200/70 bg-white/85 shadow-lifted backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
        <Link to="/" className="group flex shrink-0 items-center gap-2.5" aria-label={`${APP_NAME} home`}>
          <BrandMark />
          <span className="leading-tight">
            <span className="block text-[15px] font-bold tracking-tight text-ink-950">
              {APP_NAME}
            </span>
            <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
              Restaurant OS
            </span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `relative rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'font-semibold text-ink-950'
                    : 'text-slate-600 hover:text-ink-950'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {link.label}
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-brand-500 transition-transform duration-200 ${
                      isActive ? 'scale-x-100' : 'scale-x-0'
                    }`}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 lg:ml-4 lg:flex">
          <Link to="/login" className="btn-ghost">
            Sign in
          </Link>
          <Link
            to="/register"
            className="btn group bg-ink-950 text-white shadow-sm hover:bg-ink-800 focus:ring-brand-500"
          >
            Get started
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <button
          type="button"
          className="ml-auto rounded-lg p-2 text-slate-700 transition hover:bg-slate-100 lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open ? (
        <div className="max-h-[calc(100dvh-64px)] overflow-y-auto border-t border-slate-200/70 bg-white lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6" aria-label="Mobile">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-3 text-base font-medium transition ${
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-4">
              <Link
                to="/login"
                className="btn-secondary justify-center"
                onClick={() => setOpen(false)}
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="btn justify-center bg-ink-950 text-white hover:bg-ink-800 focus:ring-brand-500"
                onClick={() => setOpen(false)}
              >
                Get started
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
