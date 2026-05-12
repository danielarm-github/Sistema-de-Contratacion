import { Router } from 'express';
import * as notificationController from '../controllers/notificationController';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Todas las rutas de notificaciones requieren autenticación.
// El controlador se asegura de que cada usuario solo acceda a las suyas.
router.use(authMiddleware);

// Rutas específicas ANTES de las paramétricas (evita colisión /:id)
router.get('/me/all',    notificationController.getMyNotifications);
router.patch('/me/read', notificationController.markAllAsRead);

// CRUD general (con ownership check en el controlador)
router.post('/',         notificationController.createNotification);
router.get('/:id',       notificationController.getNotificationById);
router.put('/:id',       notificationController.updateNotification);
router.delete('/:id',    notificationController.deleteNotification);

export default router;
