import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { APP_NAME, NAV_SECTIONS } from '@/constants/routes';
import { useAppDispatch } from '@/store/hooks';
import { toggleSidebar } from '@/store/slices/uiSlice';
import { Badge } from '@/components/ui/Badge';

const ENV_LABEL = import.meta.env.DEV ? 'Development' : 'Production';

export function Topbar() {
  const dispatch = useAppDispatch();
  const location = useLocation();

  const activeItem = NAV_SECTIONS.flatMap((section) => section.items).find((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to),
  );

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => dispatch(toggleSidebar())}
          className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 md:hidden"
          aria-label="Toggle navigation"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-sm font-semibold text-slate-800 md:text-base">
            {activeItem?.label ?? APP_NAME}
          </h2>
          <p className="hidden text-xs text-slate-500 sm:block">Restaurant Management &amp; POS</p>
        </div>
      </div>

      <Badge variant={import.meta.env.DEV ? 'blue' : 'green'}>{ENV_LABEL}</Badge>
    </header>
  );
}