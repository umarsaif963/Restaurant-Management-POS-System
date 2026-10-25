import { AsyncLocalStorage } from 'node:async_hooks';
import { ApiError } from '../utils/ApiError.js';

/**
 * Per-request database scope.
 *
 * `tenant`   - the caller is signed in to exactly one restaurant. Every query
 *              against a tenant-owned model is filtered by that restaurant.
 * `platform` - the caller is the platform operator and may read across
 *              restaurants. Only platform endpoints may set this scope.
 * `system`   - no tenant is attached to the caller (login, password reset,
 *              public registration). Tenant-owned models may not be touched.
 */
export type RequestScope =
  | { kind: 'tenant'; restaurantId: string }
  | { kind: 'platform' }
  | { kind: 'system' };

const storage = new AsyncLocalStorage<RequestScope>();

/**
 * A promise-like value. Prisma returns its own `PrismaPromise`, which is
 * thenable but not a native promise.
 */
interface Thenable<T> {
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2>;
  catch(onrejected?: ((reason: unknown) => unknown) | null): PromiseLike<unknown>;
  finally(onfinally?: (() => void) | null): PromiseLike<unknown>;
}

function isThenable(value: unknown): value is Thenable<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { then?: unknown }).then === 'function'
  );
}

/**
 * Runs `fn` with the given scope attached to the async context. Everything the
 * callback awaits - including Prisma queries and interactive transactions -
 * observes the scope.
 *
 * Prisma applies a query extension when the returned promise is awaited, not
 * when the model method is called. A promise that leaves the callback and is
 * awaited outside of it would therefore be executed without a scope. The
 * returned value is wrapped so that every continuation re-enters the scope and
 * the tenant filter can never be lost.
 */
export function runWithScope<T>(scope: RequestScope, fn: () => T): T {
  const result = storage.run(scope, fn);
  if (!isThenable(result)) {
    return result;
  }

  const scoped: Thenable<unknown> = {
    then(onfulfilled, onrejected) {
      return storage.run(scope, () => result.then(onfulfilled, onrejected));
    },
    catch(onrejected) {
      return storage.run(scope, () => result.catch(onrejected));
    },
    finally(onfinally) {
      return storage.run(scope, () => result.finally(onfinally));
    },
  };

  return scoped as unknown as T;
}

/** The scope of the current request, if any. */
export function getScope(): RequestScope | undefined {
  return storage.getStore();
}

/**
 * The restaurant the current request belongs to.
 *
 * Throws when the request is not attached to a restaurant, which makes an
 * accidental cross-tenant read fail loudly instead of silently succeeding.
 */
export function requireTenantId(): string {
  const scope = storage.getStore();
  if (!scope || scope.kind !== 'tenant') {
    throw ApiError.forbidden('This operation is not available outside a restaurant workspace');
  }
  return scope.restaurantId;
}

/** The restaurant the current request belongs to, or `null` when unscoped. */
export function currentTenantId(): string | null {
  const scope = storage.getStore();
  return scope && scope.kind === 'tenant' ? scope.restaurantId : null;
}
