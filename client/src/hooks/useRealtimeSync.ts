import { useEffect } from 'react';
import {
  SOCKET_EVENTS,
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
 */
export function useRealtimeSync() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const socket = connectSocket();

    const onOrderUpdated = (payload: OrderUpdatedPayload) => {
      dispatch(apiSlice.util.invalidateTags([{ type: 'Orders', id: payload.orderId }]));
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

    socket.on(SOCKET_EVENTS.orderUpdated, onOrderUpdated);
    socket.on(SOCKET_EVENTS.kitchenCreated, onKitchenCreated);
    socket.on(SOCKET_EVENTS.kitchenUpdated, onKitchenUpdated);
    socket.on(SOCKET_EVENTS.tableUpdated, onTableUpdated);
    socket.on(SOCKET_EVENTS.customerUpdated, onCustomerUpdated);

    return () => {
      socket.off(SOCKET_EVENTS.orderUpdated, onOrderUpdated);
      socket.off(SOCKET_EVENTS.kitchenCreated, onKitchenCreated);
      socket.off(SOCKET_EVENTS.kitchenUpdated, onKitchenUpdated);
      socket.off(SOCKET_EVENTS.tableUpdated, onTableUpdated);
      socket.off(SOCKET_EVENTS.customerUpdated, onCustomerUpdated);
    };
  }, [dispatch]);

  return null;
}