/**
 * Middleware de control de acceso por rol.
 *
 * Uso:
 *   import { roleMiddleware } from '../middleware/role.middleware';
 *
 *   // Solo RRHH puede acceder
 *   router.post('/', authMiddleware, roleMiddleware(['RRHH']), handler);
 *
 *   // RECTOR o RRHH pueden acceder
 *   router.get('/', authMiddleware, roleMiddleware(['RECTOR', 'RRHH']), handler);
 *
 * IMPORTANTE: debe usarse DESPUÉS de authMiddleware, ya que depende de req.user.
 */

import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthRequest).user;

    if (!user) {
      res.status(401).json({ error: 'No autorizado — usuario no autenticado' });
      return;
    }

    const userRole = (user as any).role?.name as string | undefined;

    if (!userRole || !allowedRoles.includes(userRole)) {
      res.status(403).json({
        error: `Acceso denegado. Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}`,
      });
      return;
    }

    next();
  };
};
