import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { CreateDepartmentDto, UpdateDepartmentDto } from "../types/department.types";

const prisma = new PrismaClient();

export const createDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, faculty_id }: CreateDepartmentDto = req.body;
    if (!name) { res.status(400).json({ error: "El nombre es requerido" }); return; }
    if (!faculty_id) { res.status(400).json({ error: "El ID de la facultad es requerido" }); return; }
    
    const faculty = await prisma.faculty.findUnique({ where: { id: faculty_id } });
    if (!faculty) { res.status(404).json({ error: "Facultad no encontrada" }); return; }
    
    const department = await prisma.department.create({ data: { name, faculty_id } });
    res.status(201).json({ message: "Departamento creado exitosamente", data: department });
  } catch (error) {
    console.error("Error al crear departamento:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const getAllDepartments = async (req: Request, res: Response): Promise<void> => {
  try {
    const departments = await prisma.department.findMany({ include: { faculty: true }, orderBy: { name: 'asc' } });
    res.json(departments);
  } catch (error) {
    console.error("Error al obtener departamentos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const getDepartmentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const department = await prisma.department.findUnique({ where: { id: Number(id) }, include: { faculty: true, requests: true } });
    if (!department) { res.status(404).json({ error: "Departamento no encontrado" }); return; }
    res.json(department);
  } catch (error) {
    console.error("Error al obtener departamento:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const updateDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData: UpdateDepartmentDto = req.body;
    const department = await prisma.department.findUnique({ where: { id: Number(id) } });
    if (!department) { res.status(404).json({ error: "Departamento no encontrado" }); return; }
    
    if (updateData.faculty_id) {
      const faculty = await prisma.faculty.findUnique({ where: { id: updateData.faculty_id } });
      if (!faculty) { res.status(404).json({ error: "Facultad no encontrada" }); return; }
    }
    
    const updatedDepartment = await prisma.department.update({ where: { id: Number(id) }, data: updateData });
    res.json({ message: "Departamento actualizado exitosamente", data: updatedDepartment });
  } catch (error) {
    console.error("Error al actualizar departamento:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const deleteDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const department = await prisma.department.findUnique({ where: { id: Number(id) }, include: { requests: true } });
    if (!department) { res.status(404).json({ error: "Departamento no encontrado" }); return; }
    if (department.requests.length > 0) {
      res.status(400).json({ error: "No se puede eliminar el departamento porque tiene solicitudes asociadas" });
      return;
    }
    await prisma.department.delete({ where: { id: Number(id) } });
    res.json({ message: "Departamento eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar departamento:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
