import { Router } from 'express';
import healthRoutes from './health.routes.js';
import publicRoutes from './public.routes.js';
import authRoutes from './auth.routes.js';
import contactRoutes from './contact.routes.js';
import employeeRoutes from './employee.routes.js';
import roleRoutes from './role.routes.js';
import platformRoutes from './platform.routes.js';
import settingsRoutes from './settings.routes.js';
import tableRoutes from './table.routes.js';
import customerRoutes from './customer.routes.js';
import menuRoutes from './menu.routes.js';
import orderRoutes from './order.routes.js';
import kitchenRoutes from './kitchen.routes.js';
import paymentRoutes from './payment.routes.js';
import inventoryRoutes from './inventory.routes.js';
import recipeRoutes from './recipe.routes.js';
import supplierRoutes from './supplier.routes.js';
import purchaseRoutes from './purchase.routes.js';
import reservationRoutes from './reservation.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import analyticsRoutes from './analytics.routes.js';
import auditRoutes from './audit.routes.js';

const router = Router();

// Endpoints reachable without an account.
router.use('/health', healthRoutes);
router.use('/public', publicRoutes);

router.use('/auth', authRoutes);
router.use('/contact-messages', contactRoutes);
router.use('/employees', employeeRoutes);
router.use('/roles', roleRoutes);
router.use('/platform', platformRoutes);
router.use('/settings', settingsRoutes);
router.use('/tables', tableRoutes);
router.use('/customers', customerRoutes);
router.use('/menu', menuRoutes);
router.use('/orders', orderRoutes);
router.use('/orders', paymentRoutes);
router.use('/kitchen-orders', kitchenRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/recipes', recipeRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/reservations', reservationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/audit-logs', auditRoutes);

export default router;
