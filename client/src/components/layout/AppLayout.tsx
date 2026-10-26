import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Toaster } from '@/components/ui/Toaster';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

function RealtimeSync() {
  useRealtimeSync();
  return null;
}

export function AppLayout() {
  return (
    <div className="app-shell relative flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="relative flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1600px] px-4 py-5 md:px-6 md:py-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
      <Toaster />
      <RealtimeSync />
    </div>
  );
}
