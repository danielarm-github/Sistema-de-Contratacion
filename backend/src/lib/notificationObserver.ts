/**
 * Módulo Observer para el sistema de notificaciones.
 *
 * Implementa el patrón Observer sobre Node.js EventEmitter.
 * Los "observadores" (listeners) se suscriben a eventos de dominio
 * (REQUEST_CREATED, REQUEST_STATUS_CHANGED, …) y:
 *  1. Persisten la notificación en la base de datos.
 *  2. La entregan en tiempo real vía Socket.IO al usuario destinatario
 *     (si está conectado); si no lo está, el mensaje ya quedó guardado en BD.
 *
 * Uso desde cualquier controlador:
 *
 *   import { notificationEmitter } from '../lib/notificationObserver';
 *
 *   notificationEmitter.publish({
 *     type: 'REQUEST_STATUS_CHANGED',
 *     userId: 5,
 *     message: 'Tu solicitud #3 fue aprobada.',
 *     payload: { requestId: 3, previousStatus: 'PENDING', newStatus: 'APPROVED' },
 *   });
 */

import EventEmitter from 'events';
import prisma from './prisma';
import { socketManager } from './socketManager';
import type { NotificationEvent, NotificationEventType } from '../types/notification.types';

// ────────────────────────────────────────────────────────────────────────────
// Interfaz Observer (contrato que deben cumplir los suscriptores)
// ────────────────────────────────────────────────────────────────────────────
export interface NotificationObserver {
  handle(event: NotificationEvent): Promise<void>;
}

// ────────────────────────────────────────────────────────────────────────────
// Sujeto observable (EventEmitter tipado)
// ────────────────────────────────────────────────────────────────────────────
class NotificationEventEmitter extends EventEmitter {
  /** Suscribir un observador a un evento concreto */
  subscribe(eventType: NotificationEventType, observer: NotificationObserver): void {
    this.on(eventType, (event: NotificationEvent) => {
      observer.handle(event).catch((err) =>
        console.error(`[NotificationObserver] Error en handler de "${eventType}":`, err),
      );
    });
    console.log(`[NotificationObserver] Suscriptor registrado para el evento: "${eventType}"`);
  }

  /** Publicar / disparar un evento para todos los suscriptores */
  publish(event: NotificationEvent): void {
    this.emit(event.type, event);
  }
}

export const notificationEmitter = new NotificationEventEmitter();

// ────────────────────────────────────────────────────────────────────────────
// Observador concreto: persiste en BD Y entrega en tiempo real vía Socket.IO
// ────────────────────────────────────────────────────────────────────────────
class PersistNotificationObserver implements NotificationObserver {
  async handle(event: NotificationEvent): Promise<void> {
    // 1. Persistir en base de datos (fuente de verdad)
    const notification = await prisma.notification.create({
      data: {
        user_id: event.userId,
        message: event.message,
        read: false,
        sent_date: new Date(),
      },
    });

    console.log(
      `[NotificationObserver] Notificación persistida → usuario ${event.userId}: "${event.message}"`,
    );

    // 2. Entregar en tiempo real via Socket.IO (fire-and-forget)
    //    Si el usuario no está conectado, socketManager.sendToUser() lo ignora
    //    silenciosamente; la notificación ya está guardada en BD.
    socketManager.sendToUser(event.userId, 'notification:new', {
      id: notification.id,
      message: notification.message,
      read: notification.read,
      sent_date: notification.sent_date,
      type: event.type,
      payload: event.payload ?? null,
    });
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Registro de suscriptores para cada tipo de evento del dominio
// ────────────────────────────────────────────────────────────────────────────
const persistObserver = new PersistNotificationObserver();

const OBSERVED_EVENTS: NotificationEventType[] = [
  'REQUEST_CREATED',
  'REQUEST_STATUS_CHANGED',
  'REQUEST_DELETED',
  'DOCUMENT_UPLOADED',
  'CONTRACT_GENERATED',
];

OBSERVED_EVENTS.forEach((eventType) => {
  notificationEmitter.subscribe(eventType, persistObserver);
});

