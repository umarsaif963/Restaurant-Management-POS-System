import { useEffect } from 'react';
import {
  SOCKET_EVENTS,
  type InventoryUpdatedPayload,
  type KitchenCreatedPayload,
  type KitchenUpdatedPayload,
  type OrderUpdatedPayload,
  type TableUpdatedPayload,
} from '@restaurant/shared';
import { connectSocket } from '@/services/socket';
import { apiSlice } from '@/store/api/apiSlice';
import { useAppDispatch } from '@/store/hooks';

/**
 * Bridges server Socket.IO domain events (module 8) into RTK Query tag
 * invalidations. Subscribed queries (orders, kitchen display, tables,
 * customers) refetch as soon as an event arrives, keeping every open view in
 * sync without polling. Mounted once inside the authenticated layout.
 *
 * Payments (module 9): any order mutation also invalidates the Payments
 * tag so the collect-payment history stays live.
 */
export function useRealtimeSync() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const socket = connectSocket();

    const onOrderUpdated = (payload: OrderUpdatedPayload) => {
      dispatch(
        apiSlice.util.invalidateTags([
          { type: 'Orders', id: payload.orderId },
          { type: 'Payments', id: payload.orderId },
        ]),
      );
    };
    const onKitchenCreated = (_payload: KitchenCreatedPayload) => {
      dispatch(apiSlice.util.invalidateTags(['KitchenOrders']));
    };
    const onKitchenUpdated = (_payload: KitchenUpdatedPayload) => {
      dispatch(apiSlice.util.invalidateTags(['KitchenOrders']));
    };
    const onTableUpdated = (payload: TableUpdatedPayload) => {
      dispatch(
        apiSlice.util.invalidateTags([
          'Tables',
          ...(payload.tableId ? ([{ type: 'Tables', id: payload.tableId }] as const) : []),
        ]),
      );
    };
    const onCustomerUpdated = () => {
      dispatch(apiSlice.util.invalidateTags(['Customers']));
    };
    // Order-level stock movements (consume/reverse) refresh the inventory
    // views and the analytics low-stock widget without polling (module 4).
    const onInventoryUpdated = (_payload: InventoryUpdatedPayload) => {
      dispatch(apiSlice.util.invalidateTags(['InventoryItems', 'InventoryTransactions']));
    };

    socket.on(SOCKET_EVENTS.orderUpdated, onOrderUpdated);
    socket.on(SOCKET_EVENTS.kitchenCreated, onKitchenCreated);
    socket.on(SOCKET_EVENTS.kitchenUpdated, onKitchenUpdated);
    socket.on(SOCKET_EVENTS.tableUpdated, onTableUpdated);
    socket.on(SOCKET_EVENTS.customerUpdated, onCustomerUpdated);
    socket.on(SOCKET_EVENTS.inventoryUpdated, onInventoryUpdated);

    return () => {
      socket.off(SOCKET_EVENTS.orderUpdated, onOrderUpdated);
      socket.off(SOCKET_EVENTS.kitchenCreated, onKitchenCreated);
      socket.off(SOCKET_EVENTS.kitchenUpdated, onKitchenUpdated);
      socket.off(SOCKET_EVENTS.tableUpdated, onTableUpdated);
      socket.off(SOCKET_EVENTS.customerUpdated, onCustomerUpdated);
      socket.off(SOCKET_EVENTS.inventoryUpdated, onInventoryUpdated);
    };
  }, [dispatch]);

  return null;
}