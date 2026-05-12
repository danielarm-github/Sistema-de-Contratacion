// controllers/professorController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import {
  CreateProfessorDto,
  UpdateProfessorDto,
} from "../types/professor.types";

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role_id: number;
  };
}

// Crear profesor
export const createProfessor = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const {
      name,
      ci,
      address,
      phone,
      is_retired,
      work_center_id,
      scientific_degree_id,
      teaching_category_id,
    }: CreateProfessorDto = req.body;

    // Validar campos requeridos
    if (!name) {
      res.status(400).json({ error: "El nombre del profesor es requerido" });
      return;
    }

    if (!work_center_id || !teaching_category_id) {
      res.status(400).json({
        error:
          "El profesor debe tener un centro de trabajo, categoría docente y grado científico",
      });
      return;
    }

    if (is_retired === undefined) {
      res.status(400).json({ error: "El campo is_retired es requerido" });
      return;
    }

    // Validar grado científico si se proporcionó
    if (scientific_degree_id) {
      const scientificDegree = await prisma.scientificDegree.findUnique({
        where: { id: scientific_degree_id },
      });
      if (!scientificDegree) {
        res.status(404).json({ error: "Grado científico no encontrado" });
        return;
      }
    }

    // Validar categoría docente si se proporcionó
    if (teaching_category_id) {
      const teachingCategory = await prisma.teachingCategory.findUnique({
        where: { id: teaching_category_id },
      });
      if (!teachingCategory) {
        res.status(404).json({ error: "Categoría docente no encontrada" });
        return;
      }
    }

    // Validar centro de trabajo si se proporcionó
    if (work_center_id) {
      const workCenter = await prisma.workCenter.findUnique({
        where: { id: work_center_id },
      });
      if (!workCenter) {
        res.status(404).json({ error: "Centro de trabajo no encontrado" });
        return;
      }
    }

    // Crear el profesor
    const professor = await prisma.professor.create({
      data: {
        name,
        ci,
        address,
        phone,
        is_retired,
        work_center_id,
        scientific_degree_id,
        teaching_category_id,
      },
      include: {
        work_center: true,
        scientific_degree: true,
        teaching_category: true,
      },
    });

    res.status(201).json({
      message: "Profesor creado exitosamente",
      data: professor,
    });
  } catch (error) {
    console.error("Error al crear profesor:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener todos los profesores
export const getAllProfessors = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const professors = await prisma.professor.findMany({
      include: {
        work_center: true,
        scientific_degree: true,
        teaching_category: true,
        requests: {
          include: {
            department: true,
            requestStatus: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    res.json(professors);
  } catch (error) {
    console.error("Error al obtener profesores:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener profesor por ID
export const getProfessorById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    const professor = await prisma.professor.findUnique({
      where: { id: Number(id) },
      include: {
        work_center: true,
        scientific_degree: true,
        teaching_category: true,
        requests: {
          include: {
            department: {
              include: {
                faculty: true,
              },
            },
            documents: true,
            contract: true,
          },
        },
      },
    });

    if (!professor) {
      res.status(404).json({ error: "Profesor no encontrado" });
      return;
    }

    res.json(professor);
  } catch (error) {
    console.error("Error al obtener profesor:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Actualizar profesor
export const updateProfessor = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData: UpdateProfessorDto = req.body;

    const existingProfessor = await prisma.professor.findUnique({
      where: { id: Number(id) },
    });

    if (!existingProfessor) {
      res.status(404).json({ error: "Profesor no encontrado" });
      return;
    }

    // Validar grado científico si se proporcionó
    if (updateData.scientific_degree_id) {
      const scientificDegree = await prisma.scientificDegree.findUnique({
        where: { id: updateData.scientific_degree_id },
      });
      if (!scientificDegree) {
        res.status(404).json({ error: "Grado científico no encontrado" });
        return;
      }
    }

    // Validar categoría docente si se proporcionó
    if (updateData.teaching_category_id) {
      const teachingCategory = await prisma.teachingCategory.findUnique({
        where: { id: updateData.teaching_category_id },
      });
      if (!teachingCategory) {
        res.status(404).json({ error: "Categoría docente no encontrada" });
        return;
      }
    }

    const updatedProfessor = await prisma.professor.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        work_center: true,
        scientific_degree: true,
        teaching_category: true,
      },
    });

    res.json({
      message: "Profesor actualizado exitosamente",
      data: updatedProfessor,
    });
  } catch (error) {
    console.error("Error al actualizar profesor:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Eliminar profesor (solo si no tiene solicitudes asociadas)
export const deleteProfessor = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    const professor = await prisma.professor.findUnique({
      where: { id: Number(id) },
      include: {
        requests: true,
      },
    });

    if (!professor) {
      res.status(404).json({ error: "Profesor no encontrado" });
      return;
    }

    if (professor.requests.length > 0) {
      res.status(400).json({
        error:
          "No se puede eliminar el profesor porque tiene solicitudes asociadas",
      });
      return;
    }

    await prisma.professor.delete({
      where: { id: Number(id) },
    });

    res.json({ message: "Profesor eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar profesor:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
