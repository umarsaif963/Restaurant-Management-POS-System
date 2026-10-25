import { useState } from 'react';
import { Building2, RotateCw, Users, ReceiptText, CalendarClock } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import type { PlatformRestaurantProfile, RestaurantStatus, SubscriptionPlan } from '@restaurant/shared';
import { RESTAURANT_STATUSES, SUBSCRIPTION_PLANS } from '@restaurant/shared';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import {
  useGetPlatformStatsQuery,
  useListPlatformRestaurantsQuery,
  useUpdatePlatformRestaurantMutation,
} from '@/store/api/platformApi';
import { useToast } from '@/hooks/useToast';
import { formatDateTime } from '@/utils/format';

const STATUS_BADGE: Record<RestaurantStatus, 'green' | 'amber' | 'red'> = {
  ACTIVE: 'green',
  PENDING: 'amber',
  SUSPENDED: 'red',
};

const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  STARTER: 'Starter',
  PROFESSIONAL: 'Professional',
  ENTERPRISE: 'Enterprise',
};

export function PlatformRestaurantsPage() {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const { data: stats, isFetching: statsFetching } = useGetPlatformStatsQuery();
  const { data: restaurants, isError, isFetching, refetch } = useListPlatformRestaurantsQuery(
    search ? { search } : undefined,
  );
  const [updateRestaurant, { isLoading: updating }] = useUpdatePlatformRestaurantMutation();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function changeStatus(
    restaurant: PlatformRestaurantProfile,
    status: RestaurantStatus,
  ) {
    setPendingId(restaurant.id);
    try {
      await updateRestaurant({ id: restaurant.id, data: { status } }).unwrap();
      toast.success('Restaurant updated', `${restaurant.name} is now ${status.toLowerCase()}.`);
    } catch {
      toast.error('Could not update restaurant', 'The operation failed. Please try again.');
    } finally {
      setPendingId(null);
    }
  }

  async function changePlan(restaurant: PlatformRestaurantProfile, plan: SubscriptionPlan) {
    setPendingId(restaurant.id);
    try {
      await updateRestaurant({ id: restaurant.id, data: { plan } }).unwrap();
      toast.success('Plan updated', `${restaurant.name} moved to the ${plan} plan.`);
    } catch {
      toast.error('Could not update plan', 'The operation failed. Please try again.');
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Restaurants"
        description="Every venue registered on the platform."
        actions={
          <button type="button" className="btn-secondary" onClick={() => refetch()}>
            <RotateCw className="h-4 w-4" />
            Refresh
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Building2 className="h-4 w-4" />}
          label="Restaurants"
          value={stats?.totalRestaurants}
          loading={statsFetching}
        />
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label="Active venues"
          value={stats?.activeRestaurants}
          loading={statsFetching}
        />
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label="Employees"
          value={stats?.totalUsers}
          loading={statsFetching}
        />
        <StatCard
          icon={<ReceiptText className="h-4 w-4" />}
          label="Orders"
          value={stats?.totalOrders}
          loading={statsFetching}
        />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {isError ? (
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            <p className="text-sm text-slate-500">Could not load restaurants.</p>
            <button type="button" className="btn-secondary" onClick={() => refetch()}>
              <RotateCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        ) : isFetching && !restaurants ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        ) : restaurants && restaurants.length > 0 ? (
          <div className="scroll-x">
            <table className="w-full min-w-[840px] text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 sm:px-4 py-3 font-semibold">Restaurant</th>
                  <th className="px-3 sm:px-4 py-3 font-semibold">Owner</th>
                  <th className="px-3 sm:px-4 py-3 font-semibold">Status</th>
                  <th className="px-3 sm:px-4 py-3 font-semibold">Plan</th>
                  <th className="px-3 sm:px-4 py-3 font-semibold">Team</th>
                  <th className="px-3 sm:px-4 py-3 font-semibold">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {restaurants.map((restaurant) => (
                  <tr key={restaurant.id} className="transition hover:bg-slate-50">
                    <td className="px-3 sm:px-4 py-3">
                      <p className="font-medium text-slate-800">{restaurant.name}</p>
                      <p className="text-xs text-slate-500">{restaurant.email ?? restaurant.slug}</p>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-slate-600">
                      <p>{restaurant.ownerName ?? '—'}</p>
                      <p className="text-xs text-slate-500">{restaurant.ownerEmail ?? ''}</p>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <Badge variant={STATUS_BADGE[restaurant.status]}>
                        {restaurant.status.charAt(0) + restaurant.status.slice(1).toLowerCase()}
                      </Badge>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <select
                        className="input w-auto py-1 text-xs"
                        value={restaurant.plan}
                        disabled={updating && pendingId === restaurant.id}
                        onChange={(event) =>
                          changePlan(restaurant, event.target.value as SubscriptionPlan)
                        }
                        aria-label={`Plan for ${restaurant.name}`}
                      >
                        {SUBSCRIPTION_PLANS.map((plan) => (
                          <option key={plan} value={plan}>
                            {PLAN_LABELS[plan]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-slate-600">
                      {restaurant.employeeCount} staff · {restaurant.orderCount} orders
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                        {formatDateTime(restaurant.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={<Building2 className="h-6 w-6" />}
            title={search ? 'No restaurants match your search' : 'No restaurants yet'}
            description={
              search
                ? `Nothing on the platform matches “${search}”.`
                : 'Venues appear here as soon as somebody signs up.'
            }
          />
        )}
        {isFetching && restaurants && (
          <div className="flex justify-center border-t border-slate-100 py-3">
            <Spinner className="h-4 w-4 text-slate-400" />
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800">Account status</h2>
        <p className="mt-1 text-xs text-slate-500">
          Suspending a venue signs every employee out immediately and blocks further sign-ins.
        </p>
        <ul className="mt-3 space-y-2">
          {(restaurants ?? []).map((restaurant) => (
            <li
              key={restaurant.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2"
            >
              <span className="text-sm text-slate-700">{restaurant.name}</span>
              <div className="flex gap-2">
                {RESTAURANT_STATUSES.map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                      restaurant.status === status
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    disabled={updating && pendingId === restaurant.id}
                    onClick={() => changeStatus(restaurant, status)}
                  >
                    {status.charAt(0) + status.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value?: number;
  loading?: boolean;
}

function StatCard({ icon, label, value, loading }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500">
        {icon}
        {label}
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-7 w-16" />
      ) : (
        <p className="mt-1 text-2xl font-bold tracking-tight text-slate-800">{value ?? 0}</p>
      )}
    </div>
  );
}
