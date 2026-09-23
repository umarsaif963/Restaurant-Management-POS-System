import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import settingsRoutes from './settings.routes.js';
import tableRoutes from './table.routes.js';
import customerRoutes from './customer.routes.js';
import menuRoutes from './menu.routes.js';
import orderRoutes from './order.routes.js';
import kitchenRoutes from './kitchen.routes.js';
import paymentRoutes from './payment.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/settings', settingsRoutes);
router.use('/tables', tableRoutes);
router.use('/customers', customerRoutes);
router.use('/menu', menuRoutes);
router.use('/orders', orderRoutes);
router.use('/orders', paymentRoutes);
router.use('/kitchen-orders', kitchenRoutes);

export default router;