import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { notificationEmitter } from '../lib/notificationObserver';
import { CreateNotificationDto, UpdateNotificationDto } from '../types/notification.types';
import { AuthRequest } from '../middleware/auth.middleware';

// Helper para acceder al usuario autenticado desde un Request genérico
const getAuthUser = (req: Request) => (req as AuthRequest).user;

// ────────────────────────────────────────────────────────────────────────────
// Helper: verifica que la notificación pertenece al usuario autenticado
// ────────────────────────────────────────────────────────────────────────────
async function findOwnedNotification(id: number, userId: number, res: Response) {
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification) {
    res.status(404).json({ error: 'Notificación no encontrada' });
    return null;
  }
  if (notification.user_id !== userId) {
    res.status(403).json({ error: 'No tienes permiso para acceder a esta notificación' });
    return null;
  }
  return notification;
}

// ── CREATE ────────────────────────────────────────────────────────────────────
export const createNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user_id, message, sent_date }: CreateNotificationDto = req.body;

    if (!user_id) { res.status(400).json({ error: 'El user_id es requerido' }); return; }
    if (!message)  { res.status(400).json({ error: 'El mensaje es requerido' }); return; }

    const userExists = await prisma.user.findUnique({ where: { id: user_id } });
    if (!userExists) { res.status(404).json({ error: 'Usuario no encontrado' }); return; }

    // Usar el Observer: persiste en BD y entrega en tiempo real por socket
    notificationEmitter.publish({
      type: 'REQUEST_CREATED',
      userId: user_id,
      message,
    });

    // Recuperar la notificación recién persistida por el observer
    const notification = await prisma.notification.findFirst({
      where: { user_id, message },
      orderBy: { sent_date: 'desc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    res.status(201).json({ message: 'Notificación creada exitosamente', data: notification });
  } catch (error) {
    console.error('Error al crear notificación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── READ — mis notificaciones (solo las del usuario autenticado) ──────────────
export const getMyNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthUser(req)?.id;
    if (!userId) { res.status(401).json({ error: 'No autorizado' }); return; }

    const { read } = req.query;
    const where: Record<string, unknown> = { user_id: userId };
    if (read !== undefined) where.read = read === 'true';

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { sent_date: 'desc' },
    });

    res.json(notifications);
  } catch (error) {
    console.error('Error al obtener mis notificaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── READ BY ID — solo si pertenece al usuario autenticado ────────────────────
export const getNotificationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthUser(req)?.id;
    if (!userId) { res.status(401).json({ error: 'No autorizado' }); return; }

    const notification = await findOwnedNotification(Number(req.params.id), userId, res);
    if (!notification) return;

    res.json(notification);
  } catch (error) {
    console.error('Error al obtener notificación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── UPDATE — solo si pertenece al usuario autenticado ────────────────────────
export const updateNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthUser(req)?.id;
    if (!userId) { res.status(401).json({ error: 'No autorizado' }); return; }

    const notification = await findOwnedNotification(Number(req.params.id), userId, res);
    if (!notification) return;

    const updateData: UpdateNotificationDto = req.body;

    const updated = await prisma.notification.update({
      where: { id: notification.id },
      data: updateData,
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    res.json({ message: 'Notificación actualizada exitosamente', data: updated });
  } catch (error) {
    console.error('Error al actualizar notificación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── MARK ALL AS READ ──────────────────────────────────────────────────────────
export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthUser(req)?.id;
    if (!userId) { res.status(401).json({ error: 'No autorizado' }); return; }

    const { count } = await prisma.notification.updateMany({
      where: { user_id: userId, read: false },
      data: { read: true },
    });

    res.json({ message: `${count} notificación(es) marcada(s) como leídas` });
  } catch (error) {
    console.error('Error al marcar notificaciones como leídas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── DELETE — solo si pertenece al usuario autenticado ────────────────────────
export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthUser(req)?.id;
    if (!userId) { res.status(401).json({ error: 'No autorizado' }); return; }

    const notification = await findOwnedNotification(Number(req.params.id), userId, res);
    if (!notification) return;

    await prisma.notification.delete({ where: { id: notification.id } });
    res.json({ message: 'Notificación eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
