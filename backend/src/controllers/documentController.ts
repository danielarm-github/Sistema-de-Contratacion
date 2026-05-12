import { Request, Response } from "express";
import { PrismaClient, DocumentStatusEnum } from "@prisma/client";
import {
  CreateDocumentDto,
  UpdateDocumentStatusDto,
} from "../types/document.types";

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role_id: number;
  };
}

// Crear documento (independiente, sin asociar a solicitud aún)
export const createDocument = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { type, request_id }: CreateDocumentDto = req.body;
    let file_path = req.body.file_path;

    console.log(req.body);
    console.log(req.file);

    if (req.file) {
      file_path = `documents/${req.file.filename}`;
    }

    if (!type) {
      res.status(400).json({ error: "El tipo de documento es requerido" });
      return;
    }

    if (!request_id) {
      res.status(400).json({ error: "La solicitud es requerida" });
      return;
    }

    // Validar que la solicitud exista
    const request = await prisma.request.findUnique({
      where: { id: parseInt(request_id) },
    });

    if (!request) {
      res.status(404).json({ error: "Solicitud no encontrada" });
      return;
    }

    const document = await prisma.document.create({
      data: {
        request_id: parseInt(request_id),
        type,
        file_path,
        status: DocumentStatusEnum.PENDING,
      },
    });

    res.status(201).json({
      message: "Documento creado exitosamente",
      data: document,
    });
  } catch (error) {
    console.error("Error al crear documento:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener todos los documentos
export const getAllDocuments = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const documents = await prisma.document.findMany({
      include: {
        request: {
          include: {
            professor: true,
            department: true,
          },
        },
      },
      orderBy: {
        id: "desc",
      },
    });

    res.json(documents);
  } catch (error) {
    console.error("Error al obtener documentos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener documento por ID
export const getDocumentById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id: Number(id) },
      include: {
        request: {
          include: {
            professor: true,
            department: true,
          },
        },
      },
    });

    if (!document) {
      res.status(404).json({ error: "Documento no encontrado" });
      return;
    }

    res.json(document);
  } catch (error) {
    console.error("Error al obtener documento:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Actualizar estado del documento
export const updateDocumentStatus = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status }: UpdateDocumentStatusDto = req.body;

    const validStatuses = Object.values(DocumentStatusEnum);

    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: "Estado no válido para documento" });
      return;
    }

    const document = await prisma.document.findUnique({
      where: { id: Number(id) },
    });

    if (!document) {
      res.status(404).json({ error: "Documento no encontrado" });
      return;
    }

    const updatedDocument = await prisma.document.update({
      where: { id: Number(id) },
      data: { status },
    });

    // Si el documento está asociado a una solicitud, registrar en el historial
    if (document.request_id) {
      await prisma.history.create({
        data: {
          request_id: document.request_id,
          user_id: req.user?.id || 1,
          action: `DOCUMENTO_ACTUALIZADO: ${document.type} - ${document.status} → ${status}`,
          date: new Date(),
        },
      });
    }

    res.json({
      message: "Estado del documento actualizado exitosamente",
      data: updatedDocument,
    });
  } catch (error) {
    console.error("Error al actualizar estado del documento:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Eliminar documento
export const deleteDocument = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id: Number(id) },
    });

    if (!document) {
      res.status(404).json({ error: "Documento no encontrado" });
      return;
    }

    if (document.request_id) {
      res.status(400).json({
        error:
          "No se puede eliminar un documento que ya está asociado a una solicitud",
      });
      return;
    }

    await prisma.document.delete({
      where: { id: Number(id) },
    });

    res.json({ message: "Documento eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar documento:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ── Re-subida de documento firmado (RECTOR o RRHH) ───────────────────────────
export const uploadSignedDocument = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id: Number(id) },
    });

    if (!document) {
      res.status(404).json({ error: "Documento no encontrado" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: "No se proporcionó ningún archivo" });
      return;
    }

    const file_path = `documents/${req.file.filename}`;

    const updated = await prisma.document.update({
      where: { id: Number(id) },
      data: {
        file_path,
        status: DocumentStatusEnum.VERIFIED,
      },
    });

    // Registrar en historial si está asociado a una solicitud
    if (document.request_id) {
      await prisma.history.create({
        data: {
          request_id: document.request_id,
          user_id: req.user?.id || 1,
          action: `DOCUMENTO_FIRMADO_SUBIDO: ${document.type}`,
          date: new Date(),
        },
      });

      // Notificar al creador de la solicitud via Observer
      const request = await prisma.request.findUnique({
        where: { id: document.request_id },
        select: { created_by: true, id: true },
      });

      if (request) {
        const { notificationEmitter } =
          await import("../lib/notificationObserver");
        notificationEmitter.publish({
          type: "DOCUMENT_UPLOADED",
          userId: request.created_by,
          message: `El documento "${document.type}" de tu solicitud #${request.id} ha sido firmado y vuelto a subir.`,
          payload: { requestId: request.id, documentId: document.id },
        });
      }
    }

    res.json({
      message: "Documento firmado subido exitosamente",
      data: updated,
    });
  } catch (error) {
    console.error("Error al subir documento firmado:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
