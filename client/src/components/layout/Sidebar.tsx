import { NavLink } from 'react-router-dom';
import { X, UtensilsCrossed } from 'lucide-react';
import type { UserRole } from '@restaurant/shared';
import { APP_NAME, APP_VERSION, NAV_SECTIONS, type NavSection } from '@/constants/routes';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { closeSidebar } from '@/store/slices/uiSlice';

const ENV_LABEL = import.meta.env.DEV ? 'Development' : 'Production';

function visibleSections(userRoles?: UserRole[]): NavSection[] {
  return NAV_SECTIONS.filter(
    (section) => !section.roles || section.roles.some((role) => userRoles?.includes(role)),
  )
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.roles || item.roles.some((role) => userRoles?.includes(role)),
      ),
    }))
    .filter((section) => section.items.length > 0);
}

export function Sidebar() {
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector((state) => state.ui.sidebarOpen);
  const currentUser = useAppSelector((state) => state.auth.user);
  const sections = visibleSections(currentUser ? [currentUser.role] : undefined);

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
          className="fixed inset-0 z-30 bg-slate-900/50 md:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-800 bg-slate-900 text-slate-200 transition-transform md:static md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-800/70 px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-900/40">
              <UtensilsCrossed className="h-4 w-4" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-tight text-white">{APP_NAME}</p>
              <p className="text-[11px] text-slate-400">v{APP_VERSION}</p>
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

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                {section.title}
              </p>
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={handleNavigate}
                      className={({ isActive }) =>
                        `group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                          isActive
                            ? 'bg-white/[0.07] text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]'
                            : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-100'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className={`absolute left-0 h-5 w-1 rounded-r-full bg-brand-400 transition-opacity ${
                              isActive ? 'opacity-100' : 'opacity-0'
                            }`}
                            aria-hidden="true"
                          />
                          <item.icon
                            className={`h-4 w-4 shrink-0 transition ${
                              isActive ? 'text-brand-300' : 'text-slate-400 group-hover:text-brand-300'
                            }`}
                          />
                          {item.label}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-800/70 px-5 py-4">
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <span
              className={`h-1.5 w-1.5 rounded-full ${import.meta.env.DEV ? 'bg-amber-400' : 'bg-emerald-400'}`}
              aria-hidden="true"
            />
            <span>
              Environment: <span className="font-medium text-slate-300">{ENV_LABEL}</span>
            </span>
          </p>
        </div>
      </aside>
    </>
  );
}