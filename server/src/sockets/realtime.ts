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

/**
 * In-process domain event bus (module 8).
 *
 * Services publish after committed mutations; the socket layer bridges the
 * bus to every connected client. Keeping the bus separate from Socket.IO
 * means services don't need a reference to `io` and nothing is emitted when
 * a transaction rolls back.
 */
const bus = new EventEmitter();

function publish(channel: string, payload: unknown): void {
  bus.emit(channel, payload);
}

/** Forwards every known channel to all connected sockets. */
export function bridgeToSocket(io: Server): void {
  for (const channel of Object.values(SOCKET_EVENTS)) {
    bus.on(channel, (payload) => io.emit(channel, payload));
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