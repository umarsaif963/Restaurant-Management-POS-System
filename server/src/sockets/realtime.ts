import { EventEmitter } from 'node:events';
import type { Server } from 'socket.io';
import {
  SOCKET_EVENTS,
  type CustomerUpdatedPayload,
  type InventoryUpdatedPayload,
  type KitchenCreatedPayload,
  type KitchenUpdatedPayload,
  type OrderUpdatedPayload,
  type TableUpdatedPayload,
} from '@restaurant/shared';
import { currentTenantId } from '../config/tenant-context.js';

/**
 * In-process domain event bus (module 8).
 *
 * Services publish after committed mutations; the socket layer bridges the
 * bus to the connected clients. Keeping the bus separate from Socket.IO
 * means services don't need a reference to `io` and nothing is emitted when
 * a transaction rolls back.
 *
 * Every event carries the restaurant it happened in. The socket layer only
 * forwards it to the clients of that restaurant, so one venue's tickets and
 * orders never appear on another venue's screen.
 */
const bus = new EventEmitter();

interface BusEvent {
  payload: unknown;
  restaurantId: string | null;
}

function publish(channel: string, payload: unknown): void {
  const event: BusEvent = { payload, restaurantId: currentTenantId() };
  bus.emit(channel, event);
}

/**
 * The room a client of the given restaurant listens on.
 */
export function restaurantRoom(restaurantId: string): string {
  return `restaurant:${restaurantId}`;
}

/** Forwards every known channel to the clients of the restaurant it happened in. */
export function bridgeToSocket(io: Server): void {
  for (const channel of Object.values(SOCKET_EVENTS)) {
    bus.on(channel, (event: BusEvent) => {
      if (event.restaurantId) {
        io.to(restaurantRoom(event.restaurantId)).emit(channel, event.payload);
        return;
      }
      // Events raised outside a restaurant (platform maintenance) go to
      // everyone; they never carry tenant data.
      io.emit(channel, event.payload);
    });
  }
}

export const realtime = {
  orderUpdated(payload: OrderUpdatedPayload): void {
    publish(SOCKET_EVENTS.orderUpdated, payload);
  },
  kitchenCreated(payload: KitchenCreatedPayload): void {
    publish(SOCKET_EVENTS.kitchenCreated, payload);
  },
  kitchenUpdated(payload: KitchenUpdatedPayload): void {
    publish(SOCKET_EVENTS.kitchenUpdated, payload);
  },
  tableUpdated(payload: TableUpdatedPayload = {}): void {
    publish(SOCKET_EVENTS.tableUpdated, payload);
  },
  customerUpdated(payload: CustomerUpdatedPayload = {}): void {
    publish(SOCKET_EVENTS.customerUpdated, payload);
  },
  inventoryUpdated(payload: InventoryUpdatedPayload = {}): void {
    publish(SOCKET_EVENTS.inventoryUpdated, payload);
  },
};
