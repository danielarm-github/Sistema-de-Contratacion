export interface CreateNotificationDto {
  user_id: number;
  message: string;
  sent_date?: string | Date;
}

export interface UpdateNotificationDto {
  message?: string;
  read?: boolean;
}

// Eventos disponibles que puede emitir el sistema
export type NotificationEventType =
  | 'REQUEST_CREATED'
  | 'REQUEST_STATUS_CHANGED'
  | 'REQUEST_DELETED'
  | 'DOCUMENT_UPLOADED'
  | 'CONTRACT_GENERATED';

export interface NotificationEvent {
  type: NotificationEventType;
  /** ID del usuario que debe recibir la notificación */
  userId: number;
  /** Mensaje legible por el humano */
  message: string;
  /** Metadata adicional opcional (ej. requestId, status anterior, etc.) */
  payload?: Record<string, unknown>;
}
