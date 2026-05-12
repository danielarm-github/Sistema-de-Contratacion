import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jwt-simple";
import prisma from "../lib/prisma";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersafesecret23489y23";

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user || !user.password)
      return res.status(401).json({ error: "Credenciales inválidas" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ error: "Credenciales inválidas" });

    const token = jwt.encode({ id: user.id }, JWT_SECRET);
    return res.json({ data: { user, session: { access_token: token } } });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password, full_name, name, role_id } = req.body;
    const userName = name || full_name;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      return res.status(400).json({ error: "El email ya está registrado" });

    let assignedRoleId = role_id;
    if (!assignedRoleId) {
      const defaultRole = await prisma.role.findFirst({
        where: { name: "JEFE" },
      });
      if (defaultRole) {
        assignedRoleId = defaultRole.id;
      } else {
        return res
          .status(400)
          .json({
            error: "Rol no proporcionado y rol JEFE por defecto no encontrado",
          });
      }
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hash, name: userName, role_id: assignedRoleId },
      include: { role: true },
    });

    const token = jwt.encode({ id: user.id }, JWT_SECRET);
    return res.json({ data: { user, session: { access_token: token } } });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/me
router.get("/me", async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No autorizado" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No autorizado" });

  try {
    const payload = jwt.decode(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: Number(payload.id) },
      include: { role: true },
    });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    return res.json({ data: { user } });
  } catch {
    return res.status(401).json({ error: "Token inválido" });
  }
});

export default router;
