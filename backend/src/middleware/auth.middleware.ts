import { Request, Response, NextFunction } from 'express';
import jwt from 'jwt-simple';
import prisma from '../lib/prisma';
import { User } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'supersafesecret23489y23';

/**
 * Extend Express Request to include user
 */
export interface AuthRequest extends Request {
  user?: User & { role?: { id: number; name: string } };
}

// Usar Request (no AuthRequest) como tipo del parámetro para que
// sea asignable a RequestHandler y compatible con router.use().
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ data: null, error: { message: 'No autorizado - Token faltante' } });
    return;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    res.status(401).json({ data: null, error: { message: 'No autorizado - Formato de token inválido' } });
    return;
  }

  try {
    const payload = jwt.decode(token, JWT_SECRET);
    if (!payload.id) {
      res.status(401).json({ data: null, error: { message: 'No autorizado - Token inválido' } });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(payload.id) },
      include: { role: true },
    });

    if (!user) {
      res.status(404).json({ data: null, error: { message: 'Usuario no encontrado' } });
      return;
    }

    // Castear el request para adjuntar el usuario autenticado
    (req as AuthRequest).user = user;
    next();
  } catch (error: any) {
    res.status(401).json({ data: null, error: { message: 'Token inválido o expirado' } });
  }
};

