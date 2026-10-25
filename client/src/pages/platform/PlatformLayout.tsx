import { Building2, LogOut, Search } from 'lucide-react';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { PLATFORM_NAME } from '@/constants/routes';
import { useLogoutMutation } from '@/store/api/authApi';

/**
 * Shell of the platform console. It is deliberately separate from the
 * restaurant workspace: the operator never operates a venue from here.
 */
export function PlatformLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [logout, { isLoading }] = useLogoutMutation();
  // The search term lives in the URL so the list below can pick it up without
  // the shell and the page having to share state.
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') ?? '';

  function handleSearch(value: string) {
    const next = new URLSearchParams(searchParams);
    if (value.trim()) {
      next.set('search', value);
    } else {
      next.delete('search');
    }
    setSearchParams(next, { replace: true });
  }

  async function handleLogout() {
    try {
      await logout().unwrap();
    } catch {
      // The server already cleared the cookies.
    }
    navigate('/', { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-800 bg-slate-900 text-slate-200">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
              <Building2 className="h-4 w-4" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-tight text-white">{PLATFORM_NAME}</p>
              <p className="text-[11px] text-slate-400">Cross-tenant operations</p>
            </div>
          </div>

          <div className="relative ml-auto w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              className="input pl-9"
              placeholder="Search restaurants…"
              value={search}
              onChange={(event) => handleSearch(event.target.value)}
              aria-label="Search restaurants"
            />
          </div>

          <nav className="flex items-center gap-2">
            <NavLink to="/platform" end className="btn-secondary">
              Restaurants
            </NavLink>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleLogout}
              disabled={isLoading}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
