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
    <div className="app-shell relative flex h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-brand-50/60">
      <div
        className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-brand-400/10 blur-3xl"
        aria-hidden="true"
      />
      <Sidebar />
      <div className="relative flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
      <Toaster />
      <RealtimeSync />
    </div>
  );
}