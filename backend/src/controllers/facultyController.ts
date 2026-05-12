import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { CreateFacultyDto, UpdateFacultyDto } from "../types/faculty.types";

const prisma = new PrismaClient();

export const createFaculty = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name }: CreateFacultyDto = req.body;
    if (!name) { res.status(400).json({ error: "El nombre es requerido" }); return; }
    const faculty = await prisma.faculty.create({ data: { name } });
    res.status(201).json({ message: "Facultad creada exitosamente", data: faculty });
  } catch (error) {
    console.error("Error al crear facultad:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const getAllFaculties = async (req: Request, res: Response): Promise<void> => {
  try {
    const faculties = await prisma.faculty.findMany({ include: { departments: true }, orderBy: { name: 'asc' } });
    res.json(faculties);
  } catch (error) {
    console.error("Error al obtener facultades:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const getFacultyById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const faculty = await prisma.faculty.findUnique({ where: { id: Number(id) }, include: { departments: true } });
    if (!faculty) { res.status(404).json({ error: "Facultad no encontrada" }); return; }
    res.json(faculty);
  } catch (error) {
    console.error("Error al obtener facultad:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const updateFaculty = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData: UpdateFacultyDto = req.body;
    const faculty = await prisma.faculty.findUnique({ where: { id: Number(id) } });
    if (!faculty) { res.status(404).json({ error: "Facultad no encontrada" }); return; }
    const updatedFaculty = await prisma.faculty.update({ where: { id: Number(id) }, data: updateData });
    res.json({ message: "Facultad actualizada exitosamente", data: updatedFaculty });
  } catch (error) {
    console.error("Error al actualizar facultad:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const deleteFaculty = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const faculty = await prisma.faculty.findUnique({ where: { id: Number(id) }, include: { departments: true } });
    if (!faculty) { res.status(404).json({ error: "Facultad no encontrada" }); return; }
    if (faculty.departments.length > 0) {
      res.status(400).json({ error: "No se puede eliminar la facultad porque tiene departamentos asociados" });
      return;
    }
    await prisma.faculty.delete({ where: { id: Number(id) } });
    res.json({ message: "Facultad eliminada exitosamente" });
  } catch (error) {
    console.error("Error al eliminar facultad:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
