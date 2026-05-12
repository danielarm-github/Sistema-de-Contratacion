import { Request, Response } from "express";
import prisma from "../lib/prisma";
import bcrypt from "bcryptjs";
import { CreateUserDto, UpdateUserDto } from "../types/user.types";

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role_id }: CreateUserDto = req.body;
    
    if (!email || !role_id) {
      res.status(400).json({ error: "El email y role_id son requeridos" });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: "El email ya está registrado" });
      return;
    }

    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role_id,
      },
      include: { role: true },
    });

    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({ message: "Usuario creado exitosamente", data: userWithoutPassword });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      include: { role: true },
      orderBy: { name: 'asc' },
    });
    
    const usersWithoutPassword = users.map(user => {
      const { password, ...rest } = user;
      return rest;
    });

    res.json(usersWithoutPassword);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      include: { role: true },
    });

    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData: UpdateUserDto = req.body;

    const user = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await prisma.user.findUnique({ where: { email: updateData.email } });
      if (existingUser) {
        res.status(400).json({ error: "El email ya está registrado por otro usuario" });
        return;
      }
    }

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: updateData,
      include: { role: true },
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    res.json({ message: "Usuario actualizado exitosamente", data: userWithoutPassword });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    await prisma.user.delete({ where: { id: Number(id) } });
    res.json({ message: "Usuario eliminado exitosamente" });
  } catch (error: any) {
    console.error("Error al eliminar usuario:", error);
    if (error.code === 'P2003') {
      res.status(400).json({ error: "No se puede eliminar el usuario porque tiene registros asociados" });
      return;
    }
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
