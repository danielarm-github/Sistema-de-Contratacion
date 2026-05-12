import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { CreateTeachingCategoryDto, UpdateTeachingCategoryDto } from "../types/teachingCategory.types";

const prisma = new PrismaClient();

export const createTeachingCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name }: CreateTeachingCategoryDto = req.body;
    if (!name) { res.status(400).json({ error: "El nombre es requerido" }); return; }
    const teachingCategory = await prisma.teachingCategory.create({ data: { name } });
    res.status(201).json({ message: "Categoría docente creada exitosamente", data: teachingCategory });
  } catch (error) {
    console.error("Error al crear categoría docente:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const getAllTeachingCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const teachingCategories = await prisma.teachingCategory.findMany({ orderBy: { name: 'asc' } });
    res.json(teachingCategories);
  } catch (error) {
    console.error("Error al obtener categorías docentes:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const getTeachingCategoryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const teachingCategory = await prisma.teachingCategory.findUnique({ where: { id: Number(id) }, include: { professors: true } });
    if (!teachingCategory) { res.status(404).json({ error: "Categoría docente no encontrada" }); return; }
    res.json(teachingCategory);
  } catch (error) {
    console.error("Error al obtener categoría docente:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const updateTeachingCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData: UpdateTeachingCategoryDto = req.body;
    const teachingCategory = await prisma.teachingCategory.findUnique({ where: { id: Number(id) } });
    if (!teachingCategory) { res.status(404).json({ error: "Categoría docente no encontrada" }); return; }
    const updatedTeachingCategory = await prisma.teachingCategory.update({ where: { id: Number(id) }, data: updateData });
    res.json({ message: "Categoría docente actualizada exitosamente", data: updatedTeachingCategory });
  } catch (error) {
    console.error("Error al actualizar categoría docente:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const deleteTeachingCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const teachingCategory = await prisma.teachingCategory.findUnique({ where: { id: Number(id) }, include: { professors: true } });
    if (!teachingCategory) { res.status(404).json({ error: "Categoría docente no encontrada" }); return; }
    if (teachingCategory.professors.length > 0) {
      res.status(400).json({ error: "No se puede eliminar la categoría docente porque tiene profesores asociados" });
      return;
    }
    await prisma.teachingCategory.delete({ where: { id: Number(id) } });
    res.json({ message: "Categoría docente eliminada exitosamente" });
  } catch (error) {
    console.error("Error al eliminar categoría docente:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
