import { NavLink } from 'react-router-dom';
import { X, UtensilsCrossed } from 'lucide-react';
import { APP_NAME, APP_VERSION, NAV_SECTIONS } from '@/constants/routes';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { closeSidebar } from '@/store/slices/uiSlice';

const ENV_LABEL = import.meta.env.DEV ? 'Development' : 'Production';

export function Sidebar() {
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector((state) => state.ui.sidebarOpen);

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
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <UtensilsCrossed className="h-4 w-4" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold text-white">{APP_NAME}</p>
              <p className="text-[11px] text-slate-400">v{APP_VERSION}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => dispatch(closeSidebar())}
            className="rounded p-1 text-slate-400 transition hover:bg-slate-800 hover:text-white md:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
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
                        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                          isActive
                            ? 'bg-brand-600/20 text-brand-300'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-800 px-5 py-4">
          <p className="text-xs text-slate-500">
            Environment: <span className="font-medium text-slate-300">{ENV_LABEL}</span>
          </p>
        </div>
      </aside>
    </>
  );
}