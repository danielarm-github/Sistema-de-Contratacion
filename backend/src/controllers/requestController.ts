// controllers/requestController.ts
import { Request, Response } from "express";
import { PrismaClient, RequestStatusEnum } from "@prisma/client";
import {
  CreateRequestDto,
  UpdateRequestStatusDto,
} from "../types/request.types";
import { notificationEmitter } from "../lib/notificationObserver";
import { AuthRequest } from "../middleware/auth.middleware";

const prisma = new PrismaClient();

// Helper para acceder al usuario autenticado
const getAuthUser = (req: Request) => (req as AuthRequest).user;

// ────────────────────────────────────────────────────────────────────────────
// Mapa de transiciones válidas de estado
// ────────────────────────────────────────────────────────────────────────────
const VALID_TRANSITIONS: Record<RequestStatusEnum, RequestStatusEnum[]> = {
  [RequestStatusEnum.PENDING]: [
    RequestStatusEnum.IN_REVIEW,
    RequestStatusEnum.CANCELLED,
  ],
  [RequestStatusEnum.IN_REVIEW]: [
    RequestStatusEnum.APPROVED,
    RequestStatusEnum.REJECTED,
    RequestStatusEnum.CANCELLED,
  ],
  [RequestStatusEnum.APPROVED]: [RequestStatusEnum.COMPLETED],
  [RequestStatusEnum.REJECTED]: [],
  [RequestStatusEnum.COMPLETED]: [],
  [RequestStatusEnum.CANCELLED]: [],
};

// Mensajes de notificación al JEFE según transición
function buildNotificationMessage(
  requestId: number,
  from: RequestStatusEnum,
  to: RequestStatusEnum,
): string {
  const map: Partial<Record<RequestStatusEnum, string>> = {
    [RequestStatusEnum.IN_REVIEW]: `Tu solicitud #${requestId} fue revisada por el Rector y pasó a RRHH para su aprobación final.`,
    [RequestStatusEnum.APPROVED]: `Tu solicitud #${requestId} fue aprobada por RRHH. Se está generando tu contrato.`,
    [RequestStatusEnum.REJECTED]: `Tu solicitud #${requestId} fue rechazada (estado anterior: ${from}). Revisa los documentos y vuelve a intentarlo.`,
    [RequestStatusEnum.COMPLETED]: `¡Proceso completado! Tu contrato de la solicitud #${requestId} está listo y firmado.`,
    [RequestStatusEnum.CANCELLED]: `Tu solicitud #${requestId} fue cancelada.`,
  };
  return map[to] ?? `El estado de tu solicitud #${requestId} cambió a ${to}.`;
}

// ────────────────────────────────────────────────────────────────────────────
// Crear solicitud — JEFE
// ────────────────────────────────────────────────────────────────────────────
export const createRequest = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = getAuthUser(req);
    const {
      professor_id,
      department_id,
      document_ids = [],
    }: CreateRequestDto = req.body;

    if (!professor_id) {
      res.status(400).json({ error: "El ID del profesor es requerido" });
      return;
    }
    if (!department_id) {
      res.status(400).json({ error: "El ID del departamento es requerido" });
      return;
    }
    if (!user?.id) {
      res.status(401).json({ error: "No autorizado" });
      return;
    }

    const professor = await prisma.professor.findUnique({
      where: { id: professor_id },
    });
    if (!professor) {
      res.status(404).json({ error: "Profesor no encontrado" });
      return;
    }

    const department = await prisma.department.findUnique({
      where: { id: department_id },
    });
    if (!department) {
      res.status(404).json({ error: "Departamento no encontrado" });
      return;
    }

    if (document_ids.length > 0) {
      const documents = await prisma.document.findMany({
        where: { id: { in: document_ids } },
      });
      if (documents.length !== document_ids.length) {
        res.status(404).json({ error: "Uno o más documentos no existen" });
        return;
      }
      const alreadyAssigned = documents.filter(
        (doc) => doc.request_id !== null,
      );
      if (alreadyAssigned.length > 0) {
        res.status(400).json({
          error: "Uno o más documentos ya están asignados a otra solicitud",
          documents: alreadyAssigned.map((d) => ({ id: d.id, type: d.type })),
        });
        return;
      }
    }

    const request = await prisma.$transaction(async (tx) => {
      const newRequest = await tx.request.create({
        data: {
          professor_id,
          department_id,
          created_by: user.id,
          status: RequestStatusEnum.PENDING,
          date: new Date(),
        },
        include: { professor: true, department: true },
      });

      if (document_ids.length > 0) {
        await tx.document.updateMany({
          where: { id: { in: document_ids } },
          data: { request_id: newRequest.id },
        });
      }

      await tx.history.create({
        data: {
          request_id: newRequest.id,
          user_id: user.id,
          action: "SOLICITUD_CREADA",
          date: new Date(),
        },
      });

      return await tx.request.findUnique({
        where: { id: newRequest.id },
        include: {
          professor: {
            include: {
              scientific_degree: true,
              teaching_category: true,
              work_center: true,
            },
          },
          department: { include: { faculty: true } },
          documents: true,
        },
      });
    });

    // Notificar al propio JEFE que su solicitud fue creada
    notificationEmitter.publish({
      type: "REQUEST_CREATED",
      userId: user.id,
      message: `Tu solicitud #${request?.id} ha sido creada exitosamente y está en estado PENDIENTE.`,
      payload: { requestId: request?.id },
    });

    res
      .status(201)
      .json({ message: "Solicitud creada exitosamente", data: request });
  } catch (error) {
    console.error("Error al crear solicitud:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// Actualizar estado — RECTOR / RRHH (con validación de transiciones)
// ────────────────────────────────────────────────────────────────────────────
export const updateRequestStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = getAuthUser(req);
    const { id } = req.params;
    const { status }: UpdateRequestStatusDto = req.body;

    const validStatuses = Object.values(RequestStatusEnum);
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: "Estado no válido" });
      return;
    }

    const existingRequest = await prisma.request.findUnique({
      where: { id: Number(id) },
      include: { creator: true },
    });

    if (!existingRequest) {
      res.status(404).json({ error: "Solicitud no encontrada" });
      return;
    }

    // Validar transición de estado
    const allowedNext = VALID_TRANSITIONS[existingRequest.status];
    if (!allowedNext.includes(status)) {
      res.status(400).json({
        error: `Transición de estado inválida: ${existingRequest.status} → ${status}. Estados permitidos: ${allowedNext.join(", ") || "ninguno"}`,
      });
      return;
    }

    const updatedRequest = await prisma.request.update({
      where: { id: Number(id) },
      data: { status },
      include: {
        professor: {
          include: { scientific_degree: true, teaching_category: true },
        },
        department: { include: { faculty: true } },
        documents: true,
        contract: true,
      },
    });

    await prisma.history.create({
      data: {
        request_id: Number(id),
        user_id: user?.id || 1,
        action: `ESTADO_CAMBIADO: ${existingRequest.status} → ${status}`,
        date: new Date(),
      },
    });

    // Notificar al JEFE (creador real de la solicitud)
    const jefeId = existingRequest.created_by;
    notificationEmitter.publish({
      type: "REQUEST_STATUS_CHANGED",
      userId: jefeId,
      message: buildNotificationMessage(
        Number(id),
        existingRequest.status,
        status,
      ),
      payload: {
        requestId: Number(id),
        previousStatus: existingRequest.status,
        newStatus: status,
      },
    });

    res.json({
      message: "Estado de la solicitud actualizado exitosamente",
      data: updatedRequest,
    });
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// Obtener todas las solicitudes
// ────────────────────────────────────────────────────────────────────────────
export const getAllRequests = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { status, professor_id, department_id, startDate, endDate } =
      req.query;
    const where: any = {};

    if (status) where.status = status;
    if (professor_id) where.professor_id = Number(professor_id);
    if (department_id) where.department_id = Number(department_id);
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const requests = await prisma.request.findMany({
      where,
      include: {
        professor: {
          include: {
            scientific_degree: true,
            teaching_category: true,
            work_center: true,
          },
        },
        department: { include: { faculty: true } },
        documents: true,
        contract: true,
        histories: { orderBy: { date: "desc" }, include: { user: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
      orderBy: { date: "desc" },
    });

    res.json(requests);
  } catch (error) {
    console.error("Error al obtener solicitudes:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// Obtener solicitud por ID
// ────────────────────────────────────────────────────────────────────────────
export const getRequestById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    const request = await prisma.request.findUnique({
      where: { id: Number(id) },
      include: {
        professor: {
          include: {
            scientific_degree: true,
            teaching_category: true,
            work_center: true,
          },
        },
        department: { include: { faculty: true } },
        documents: true,
        contract: true,
        histories: { orderBy: { date: "desc" }, include: { user: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
    });

    if (!request) {
      res.status(404).json({ error: "Solicitud no encontrada" });
      return;
    }

    res.json(request);
  } catch (error) {
    console.error("Error al obtener solicitud:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// Eliminar solicitud — solo PENDING o CANCELLED
// ────────────────────────────────────────────────────────────────────────────
export const deleteRequest = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    const request = await prisma.request.findUnique({
      where: { id: Number(id) },
      include: { contract: true, documents: true },
    });

    if (!request) {
      res.status(404).json({ error: "Solicitud no encontrada" });
      return;
    }

    if (
      request.status !== RequestStatusEnum.PENDING &&
      request.status !== RequestStatusEnum.CANCELLED
    ) {
      res
        .status(400)
        .json({
          error:
            "Solo se pueden eliminar solicitudes en estado PENDING o CANCELLED",
        });
      return;
    }

    if (request.contract) {
      res
        .status(400)
        .json({
          error:
            "No se puede eliminar una solicitud que ya tiene un contrato asociado",
        });
      return;
    }

    await prisma.$transaction([
      prisma.document.deleteMany({ where: { request_id: Number(id) } }),
      prisma.history.deleteMany({ where: { request_id: Number(id) } }),
      prisma.request.delete({ where: { id: Number(id) } }),
    ]);

    res.json({ message: "Solicitud eliminada exitosamente" });
  } catch (error) {
    console.error("Error al eliminar solicitud:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// Agregar documentos a una solicitud existente
// ────────────────────────────────────────────────────────────────────────────
export const addDocumentsToRequest = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = getAuthUser(req);
    const { id } = req.params;
    const { document_ids }: { document_ids: number[] } = req.body;

    if (!document_ids || document_ids.length === 0) {
      res
        .status(400)
        .json({ error: "Debe proporcionar al menos un ID de documento" });
      return;
    }

    const request = await prisma.request.findUnique({
      where: { id: Number(id) },
    });
    if (!request) {
      res.status(404).json({ error: "Solicitud no encontrada" });
      return;
    }

    const documents = await prisma.document.findMany({
      where: { id: { in: document_ids } },
    });
    if (documents.length !== document_ids.length) {
      res.status(404).json({ error: "Uno o más documentos no existen" });
      return;
    }

    const alreadyAssigned = documents.filter((doc) => doc.request_id !== null);
    if (alreadyAssigned.length > 0) {
      res.status(400).json({
        error: "Uno o más documentos ya están asignados a otra solicitud",
        documents: alreadyAssigned.map((d) => ({ id: d.id, type: d.type })),
      });
      return;
    }

    await prisma.document.updateMany({
      where: { id: { in: document_ids } },
      data: { request_id: Number(id) },
    });

    await prisma.history.create({
      data: {
        request_id: Number(id),
        user_id: user?.id || 1,
        action: `DOCUMENTOS_AGREGADOS: ${document_ids.length} documento(s)`,
        date: new Date(),
      },
    });

    const updatedRequest = await prisma.request.findUnique({
      where: { id: Number(id) },
      include: { professor: true, department: true, documents: true },
    });

    res.json({
      message: "Documentos agregados a la solicitud exitosamente",
      data: updatedRequest,
    });
  } catch (error) {
    console.error("Error al agregar documentos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
