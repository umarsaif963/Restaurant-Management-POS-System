import { NavLink } from 'react-router-dom';
import { X, UtensilsCrossed } from 'lucide-react';
import type { Permission } from '@restaurant/shared';
import { APP_NAME, NAV_SECTIONS, type NavSection } from '@/constants/routes';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { closeSidebar } from '@/store/slices/uiSlice';
import { useRestaurantIcon } from '@/hooks/useRestaurantIcon';

const ENV_LABEL = import.meta.env.DEV ? 'Development' : 'Production';

function isAllowed(
  required: Permission[] | undefined,
  granted: readonly Permission[] | undefined,
): boolean {
  if (!required || required.length === 0) return true;
  if (!granted) return false;
  return required.some((permission) => granted.includes(permission));
}

function visibleSections(granted?: readonly Permission[]): NavSection[] {
  return NAV_SECTIONS.filter((section) => isAllowed(section.permissions, granted))
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => isAllowed(item.permissions, granted)),
    }))
    .filter((section) => section.items.length > 0);
}

export function Sidebar() {
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector((state) => state.ui.sidebarOpen);
  const currentUser = useAppSelector((state) => state.auth.user);
  const sections = visibleSections(currentUser?.permissions);
  const restaurantIcon = useRestaurantIcon(currentUser?.restaurantId);
  const restaurantName = currentUser?.restaurantName?.trim() || APP_NAME;

  const handleNavigate = () => {
    dispatch(closeSidebar());
  };

  return (
    <>
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => dispatch(closeSidebar())}
          className="fixed inset-0 z-30 bg-slate-950/50 md:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col border-r border-slate-800/80 bg-slate-950 text-slate-200 transition-transform md:static md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800/80 px-4">
          <div className="flex min-w-0 items-center gap-3">
            {restaurantIcon ? (
              <span className="flex h-9 w-9 shrink-0 items-center overflow-hidden rounded-xl bg-white ring-1 ring-white/10">
                <img
                  src={restaurantIcon}
                  alt=""
                  className="h-full w-full object-cover"
                  aria-hidden="true"
                />
              </span>
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-lg shadow-brand-900/50 ring-1 ring-white/10">
                <UtensilsCrossed className="h-4 w-4" />
              </span>
            )}
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-bold tracking-tight text-white" title={restaurantName}>
                {restaurantName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => dispatch(closeSidebar())}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white md:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-7 overflow-y-auto px-3 py-5">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                {section.title}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={handleNavigate}
                      className={({ isActive }) =>
                        `group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition ${
                          isActive
                            ? 'bg-white/[0.08] text-white'
                            : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className={`absolute -left-3 h-5 w-[3px] rounded-r-full bg-brand-400 transition-opacity ${
                              isActive ? 'opacity-100' : 'opacity-0'
                            }`}
                            aria-hidden="true"
                          />
                          <item.icon
                            className={`h-4 w-4 shrink-0 transition ${
                              isActive ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-slate-800/80 px-4 py-3.5">
          <p className="flex items-center gap-2 text-[11px] text-slate-500">
            <span
              className={`h-1.5 w-1.5 rounded-full ${import.meta.env.DEV ? 'bg-amber-400' : 'bg-emerald-400'}`}
              aria-hidden="true"
            />
            <span>
              Environment: <span className="font-semibold text-slate-300">{ENV_LABEL}</span>
            </span>
          </p>
        </div>
      </aside>
    </>
  );
}
