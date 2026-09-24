import { useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react';
import { APP_NAME, NAV_SECTIONS } from '@/constants/routes';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleSidebar } from '@/store/slices/uiSlice';
import { useLogoutMutation } from '@/store/api/authApi';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { ROLE_LABELS } from '@/constants/user';

const ENV_LABEL = import.meta.env.DEV ? 'Development' : 'Production';

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function Topbar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector((state) => state.auth.user);
  const [logout, { isLoading: loggingOut }] = useLogoutMutation();

  const activeItem = NAV_SECTIONS.flatMap((section) => section.items).find((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to),
  );

  async function handleLogout() {
    try {
      await logout().unwrap();
    } catch {
      // local state is cleared regardless so the user can sign back in
    }
    navigate('/login', { replace: true });
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/70 bg-white/85 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => dispatch(toggleSidebar())}
          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:bg-slate-50 md:hidden"
          aria-label="Toggle navigation"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-slate-900 md:text-base">
            {activeItem?.label ?? APP_NAME}
          </h2>
          <p className="hidden text-xs text-slate-500 sm:block">Restaurant Management &amp; POS</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant={import.meta.env.DEV ? 'blue' : 'green'}>{ENV_LABEL}</Badge>
        {user && (
          <div className="hidden items-center gap-2.5 sm:flex">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-semibold text-white shadow-sm shadow-brand-600/30">
              {initials(user.name)}
            </span>
            <div className="leading-tight">
              <p className="text-sm font-medium text-slate-800">{user.name}</p>
              <p className="text-[11px] text-slate-500">{ROLE_LABELS[user.role]}</p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-800"
          title="Sign out"
          disabled={loggingOut}
        >
          {loggingOut ? <Spinner className="h-4 w-4" /> : <LogOut className="h-4 w-4" />}
          <span className="hidden md:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}