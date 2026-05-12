import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { CreateScientificDegreeDto, UpdateScientificDegreeDto } from "../types/scientificDegree.types";

const prisma = new PrismaClient();

export const createScientificDegree = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name }: CreateScientificDegreeDto = req.body;
    if (!name) { res.status(400).json({ error: "El nombre es requerido" }); return; }
    const scientificDegree = await prisma.scientificDegree.create({ data: { name } });
    res.status(201).json({ message: "Grado científico creado exitosamente", data: scientificDegree });
  } catch (error) {
    console.error("Error al crear grado científico:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const getAllScientificDegrees = async (req: Request, res: Response): Promise<void> => {
  try {
    const scientificDegrees = await prisma.scientificDegree.findMany({ orderBy: { name: 'asc' } });
    res.json(scientificDegrees);
  } catch (error) {
    console.error("Error al obtener grados científicos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const getScientificDegreeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const scientificDegree = await prisma.scientificDegree.findUnique({ where: { id: Number(id) }, include: { professors: true } });
    if (!scientificDegree) { res.status(404).json({ error: "Grado científico no encontrado" }); return; }
    res.json(scientificDegree);
  } catch (error) {
    console.error("Error al obtener grado científico:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const updateScientificDegree = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData: UpdateScientificDegreeDto = req.body;
    const scientificDegree = await prisma.scientificDegree.findUnique({ where: { id: Number(id) } });
    if (!scientificDegree) { res.status(404).json({ error: "Grado científico no encontrado" }); return; }
    const updatedScientificDegree = await prisma.scientificDegree.update({ where: { id: Number(id) }, data: updateData });
    res.json({ message: "Grado científico actualizado exitosamente", data: updatedScientificDegree });
  } catch (error) {
    console.error("Error al actualizar grado científico:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const deleteScientificDegree = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const scientificDegree = await prisma.scientificDegree.findUnique({ where: { id: Number(id) }, include: { professors: true } });
    if (!scientificDegree) { res.status(404).json({ error: "Grado científico no encontrado" }); return; }
    if (scientificDegree.professors.length > 0) {
      res.status(400).json({ error: "No se puede eliminar el grado científico porque tiene profesores asociados" });
      return;
    }
    await prisma.scientificDegree.delete({ where: { id: Number(id) } });
    res.json({ message: "Grado científico eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar grado científico:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
