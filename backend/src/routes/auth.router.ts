import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jwt-simple';
import prisma from '../lib/prisma';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersafesecret23489y23';

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.profile.findUnique({ where: { email } });

    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.encode({ id: user.id }, JWT_SECRET);
    return res.json({ data: { user, session: { access_token: token } } });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, full_name, role } = req.body;

    const existing = await prisma.profile.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'El email ya está registrado' });

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.profile.create({
      data: { email, password: hash, full_name, role: role || 'JEFE' },
    });

    const token = jwt.encode({ id: user.id }, JWT_SECRET);
    return res.json({ data: { user, session: { access_token: token } } });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/me
router.get('/me', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No autorizado' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No autorizado' });

  try {
    const payload = jwt.decode(token, JWT_SECRET);
    const user = await prisma.profile.findUnique({ where: { id: payload.id } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    return res.json({ data: { user, session: { access_token: token } } });
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
});

export default router;
