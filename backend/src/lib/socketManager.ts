/**
 * SocketManager — Singleton que gestiona el servidor Socket.IO.
 *
 * Responsabilidades:
 *  - Inicializar Socket.IO sobre el servidor HTTP de Express.
 *  - Autenticar la conexión usando el JWT del handshake.
 *  - Mantener el mapa userId → Set<socketId> para soportar
 *    múltiples pestañas/dispositivos por usuario.
 *  - Exponer `sendToUser()` para que el Observer entregue
 *    notificaciones en tiempo real al usuario correcto.
 *
 * Uso:
 *   // En index.ts
 *   const httpServer = http.createServer(app);
 *   socketManager.init(httpServer);
 *
 *   // En cualquier servicio/observer
 *   import { socketManager } from './socketManager';
 *   socketManager.sendToUser(userId, 'notification:new', payload);
 */

import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jwt-simple';

const JWT_SECRET = process.env.JWT_SECRET || 'supersafesecret23489y23';

class SocketManager {
  private io: SocketIOServer | null = null;

  /** userId → conjunto de socketIds activos (multi-tab/multi-device) */
  private userSockets = new Map<number, Set<string>>();

  // ────────────────────────────────────────────────────────────────────────────
  // Inicialización
  // ────────────────────────────────────────────────────────────────────────────
  init(httpServer: HttpServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',           // Ajusta al origen del frontend en producción
        methods: ['GET', 'POST'],
      },
    });

    // ── Middleware de autenticación Socket.IO ──────────────────────────────
    this.io.use((socket, next) => {
      const token =
        socket.handshake.auth?.token as string | undefined ||
        (socket.handshake.headers.authorization ?? '').replace('Bearer ', '');

      if (!token) {
        return next(new Error('No autorizado — token faltante'));
      }

      try {
        const payload = jwt.decode(token, JWT_SECRET) as { id: number };
        if (!payload?.id) throw new Error('Payload inválido');
        // Almacenamos el userId en el objeto socket para usarlo en los eventos
        (socket as any).userId = Number(payload.id);
        next();
      } catch {
        next(new Error('No autorizado — token inválido'));
      }
    });

    // ── Gestión de conexiones ──────────────────────────────────────────────
    this.io.on('connection', (socket: Socket) => {
      const userId: number = (socket as any).userId;

      // Registrar socket del usuario
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(socket.id);

      console.log(
        `[SocketManager] Usuario ${userId} conectado (socket: ${socket.id}). Sockets activos: ${this.userSockets.get(userId)!.size}`,
      );

      // El cliente entra a su sala personal para facilitar el targeting
      socket.join(`user:${userId}`);

      // ── Evento: cliente marca una notificación como leída ──────────────
      socket.on('notification:read', (notificationId: number) => {
        console.log(
          `[SocketManager] Usuario ${userId} marcó notificación ${notificationId} como leída`,
        );
        // Aquí podrías persistir el cambio via Prisma si lo deseas
      });

      // ── Desconexión ────────────────────────────────────────────────────
      socket.on('disconnect', () => {
        this.userSockets.get(userId)?.delete(socket.id);
        if (this.userSockets.get(userId)?.size === 0) {
          this.userSockets.delete(userId);
        }
        console.log(`[SocketManager] Usuario ${userId} desconectado (socket: ${socket.id})`);
      });
    });

    console.log('[SocketManager] Servidor Socket.IO inicializado');
  }

  // ────────────────────────────────────────────────────────────────────────────
  // API pública
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Envía un evento a todos los sockets activos de un usuario.
   * Si el usuario no está conectado, el mensaje se descarta silenciosamente
   * (ya fue persistido en BD por el Observer).
   */
  sendToUser(userId: number, event: string, payload: unknown): void {
    if (!this.io) {
      console.warn('[SocketManager] io no inicializado — no se puede enviar al usuario', userId);
      return;
    }
    // Emitir a la sala personal del usuario (cubre todos sus sockets activos)
    this.io.to(`user:${userId}`).emit(event, payload);
    console.log(`[SocketManager] Evento "${event}" enviado al usuario ${userId}`);
  }

  /** Indica si hay al menos un socket activo para el usuario */
  isOnline(userId: number): boolean {
    return (this.userSockets.get(userId)?.size ?? 0) > 0;
  }

  getIO(): SocketIOServer | null {
    return this.io;
  }
}

// Exportamos la instancia singleton
export const socketManager = new SocketManager();
