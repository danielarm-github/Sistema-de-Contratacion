import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import PDFDocument from "pdfkit";
import prisma from "../lib/prisma";
import { notificationEmitter } from "../lib/notificationObserver";
import { AuthRequest } from "../middleware/auth.middleware";
import { ContractStatusEnum, RequestStatusEnum } from "@prisma/client";
import { CreateContractDto, UpdateContractStatusDto } from "../types/contract.types";

const getAuthUser = (req: Request) => (req as AuthRequest).user;

const CONTRACTS_DIR = path.join(process.cwd(), "uploads", "contracts");
if (!fs.existsSync(CONTRACTS_DIR)) fs.mkdirSync(CONTRACTS_DIR, { recursive: true });

// ────────────────────────────────────────────────────────────────────────────
// Helper: generar el PDF del contrato y guardarlo en disco
// ────────────────────────────────────────────────────────────────────────────
async function generateContractPDF(requestId: number): Promise<string> {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: {
      professor: {
        include: { scientific_degree: true, teaching_category: true, work_center: true },
      },
      department: { include: { faculty: true } },
      creator: { select: { name: true, email: true } },
    },
  });

  if (!request) throw new Error("Solicitud no encontrada para generar contrato");

  const dir = path.join(CONTRACTS_DIR, String(requestId));
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filename = `contrato_${requestId}_${Date.now()}.pdf`;
  const filePath = path.join(dir, filename);
  const relativePath = `contracts/${requestId}/${filename}`;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 60, size: "A4" });
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // ── Encabezado ──
    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .text("CONTRATO DE TRABAJO", { align: "center" })
      .moveDown(0.5);

    doc
      .fontSize(11)
      .font("Helvetica")
      .text(`Fecha de generación: ${new Date().toLocaleDateString("es-ES", { dateStyle: "long" })}`, { align: "center" })
      .moveDown(1.5);

    doc.moveTo(60, doc.y).lineTo(535, doc.y).stroke().moveDown(1);

    // ── Datos de la institución ──
    doc.fontSize(13).font("Helvetica-Bold").text("Datos de la Institución").moveDown(0.5);
    doc.fontSize(11).font("Helvetica");
    doc.text(`Facultad: ${request.department.faculty.name}`);
    doc.text(`Departamento: ${request.department.name}`).moveDown(1);

    // ── Datos del contratado ──
    doc.fontSize(13).font("Helvetica-Bold").text("Datos del Contratado").moveDown(0.5);
    doc.fontSize(11).font("Helvetica");
    doc.text(`Nombre completo: ${request.professor.name}`);
    if (request.professor.ci) doc.text(`Carné de identidad: ${request.professor.ci}`);
    if (request.professor.address) doc.text(`Dirección: ${request.professor.address}`);
    if (request.professor.phone) doc.text(`Teléfono: ${request.professor.phone}`);
    if (request.professor.scientific_degree)
      doc.text(`Grado científico: ${request.professor.scientific_degree.name}`);
    if (request.professor.teaching_category)
      doc.text(`Categoría docente: ${request.professor.teaching_category.name}`);
    if (request.professor.work_center)
      doc.text(`Centro de trabajo actual: ${request.professor.work_center.name}`);
    doc.text(`Jubilado: ${request.professor.is_retired ? "Sí" : "No"}`).moveDown(1);

    // ── Condiciones del contrato ──
    doc.fontSize(13).font("Helvetica-Bold").text("Condiciones del Contrato").moveDown(0.5);
    doc.fontSize(11).font("Helvetica");
    doc.text(`Solicitud N°: ${request.id}`);
    doc.text(`Fecha de la solicitud: ${new Date(request.date).toLocaleDateString("es-ES")}`);
    doc.text(`Estado de la solicitud: ${request.status}`).moveDown(2);

    // ── Firmas ──
    doc.moveTo(60, doc.y).lineTo(535, doc.y).stroke().moveDown(1.5);
    doc.fontSize(11).font("Helvetica");

    const y = doc.y;
    doc.text("___________________________", 80, y);
    doc.text("___________________________", 330, y);
    doc.moveDown(0.5);
    doc.text("Firma del Contratado", 90, doc.y);
    doc.text("Firma de RRHH", 345, doc.y);

    doc.end();

    stream.on("finish", () => resolve(relativePath));
    stream.on("error", reject);
  });
}

// ── CREATE — generar contrato (RRHH) ─────────────────────────────────────────
export const createContract = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getAuthUser(req);
    const { request_id }: CreateContractDto = req.body;

    if (!request_id) { res.status(400).json({ error: "El request_id es requerido" }); return; }

    const request = await prisma.request.findUnique({
      where: { id: request_id },
      include: { contract: true },
    });

    if (!request) { res.status(404).json({ error: "Solicitud no encontrada" }); return; }

    if (request.status !== RequestStatusEnum.IN_REVIEW) {
      res.status(400).json({
        error: `Solo se pueden generar contratos para solicitudes en estado IN_REVIEW. Estado actual: ${request.status}`,
      });
      return;
    }

    if (request.contract) {
      res.status(400).json({ error: "Esta solicitud ya tiene un contrato generado" });
      return;
    }

    // Generar el PDF
    const documentPath = await generateContractPDF(request_id);

    // Crear el contrato en BD
    const contract = await prisma.contract.create({
      data: {
        request_id,
        generation_date: new Date(),
        document_path: documentPath,
        status: ContractStatusEnum.GENERATED,
      },
      include: { request: { include: { professor: true, department: true } } },
    });

    // Actualizar estado de la solicitud a APPROVED (RRHH ha generado el contrato)
    await prisma.request.update({
      where: { id: request_id },
      data: { status: RequestStatusEnum.APPROVED },
    });

    // Registrar en historial
    await prisma.history.create({
      data: {
        request_id,
        user_id: user?.id || 1,
        action: "CONTRATO_GENERADO",
        date: new Date(),
      },
    });

    // Notificar al JEFE (creador de la solicitud)
    notificationEmitter.publish({
      type: "CONTRACT_GENERATED",
      userId: request.created_by,
      message: `Se ha generado el contrato para tu solicitud #${request_id}. RRHH lo está procesando.`,
      payload: { requestId: request_id, contractId: contract.id },
    });

    res.status(201).json({ message: "Contrato generado exitosamente", data: contract });
  } catch (error) {
    console.error("Error al generar contrato:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ── READ ALL ──────────────────────────────────────────────────────────────────
export const getAllContracts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status) where.status = status;

    const contracts = await prisma.contract.findMany({
      where,
      include: {
        request: {
          include: {
            professor: { include: { scientific_degree: true, teaching_category: true } },
            department: { include: { faculty: true } },
            creator: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { generation_date: "desc" },
    });

    res.json(contracts);
  } catch (error) {
    console.error("Error al obtener contratos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ── READ BY ID ────────────────────────────────────────────────────────────────
export const getContractById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const contract = await prisma.contract.findUnique({
      where: { id: Number(id) },
      include: {
        request: {
          include: {
            professor: { include: { scientific_degree: true, teaching_category: true } },
            department: { include: { faculty: true } },
            documents: true,
            creator: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!contract) { res.status(404).json({ error: "Contrato no encontrado" }); return; }

    res.json(contract);
  } catch (error) {
    console.error("Error al obtener contrato:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ── DOWNLOAD PDF ──────────────────────────────────────────────────────────────
export const downloadContract = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const contract = await prisma.contract.findUnique({ where: { id: Number(id) } });
    if (!contract) { res.status(404).json({ error: "Contrato no encontrado" }); return; }
    if (!contract.document_path) { res.status(404).json({ error: "El archivo del contrato no está disponible" }); return; }

    const absolutePath = path.join(process.cwd(), "uploads", contract.document_path);
    if (!fs.existsSync(absolutePath)) {
      res.status(404).json({ error: "El archivo PDF no se encontró en el servidor" });
      return;
    }

    res.download(absolutePath, path.basename(absolutePath));
  } catch (error) {
    console.error("Error al descargar contrato:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ── UPLOAD SIGNED CONTRACT (RRHH sube el contrato firmado) ───────────────────
export const uploadSignedContract = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getAuthUser(req);
    const { id } = req.params;

    const contract = await prisma.contract.findUnique({
      where: { id: Number(id) },
      include: { request: { select: { id: true, created_by: true } } },
    });

    if (!contract) { res.status(404).json({ error: "Contrato no encontrado" }); return; }

    if (!req.file) { res.status(400).json({ error: "No se proporcionó ningún archivo" }); return; }

    const relativePath = `contracts/${contract.request_id}/${req.file.filename}`;

    // Actualizar contrato con el archivo firmado y cambiar estado a SIGNED
    const updated = await prisma.contract.update({
      where: { id: Number(id) },
      data: {
        document_path: relativePath,
        status: ContractStatusEnum.SIGNED,
      },
    });

    // Cambiar estado de la solicitud a COMPLETED (contrato firmado y subido)
    await prisma.request.update({
      where: { id: contract.request_id },
      data: { status: RequestStatusEnum.COMPLETED },
    });

    // Registrar en historial
    await prisma.history.create({
      data: {
        request_id: contract.request_id,
        user_id: user?.id || 1,
        action: "CONTRATO_FIRMADO_SUBIDO",
        date: new Date(),
      },
    });

    // Notificar al JEFE — proceso completado
    notificationEmitter.publish({
      type: "CONTRACT_GENERATED",
      userId: contract.request.created_by,
      message: `¡Proceso completado! Tu contrato de la solicitud #${contract.request_id} ha sido firmado y está listo.`,
      payload: { requestId: contract.request_id, contractId: contract.id },
    });

    res.json({ message: "Contrato firmado subido exitosamente. Proceso de contratación completado.", data: updated });
  } catch (error) {
    console.error("Error al subir contrato firmado:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ── UPDATE STATUS ─────────────────────────────────────────────────────────────
export const updateContractStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status }: UpdateContractStatusDto = req.body;

    const contract = await prisma.contract.findUnique({ where: { id: Number(id) } });
    if (!contract) { res.status(404).json({ error: "Contrato no encontrado" }); return; }

    const updated = await prisma.contract.update({
      where: { id: Number(id) },
      data: { status },
      include: { request: { include: { professor: true, department: true } } },
    });

    res.json({ message: "Estado del contrato actualizado exitosamente", data: updated });
  } catch (error) {
    console.error("Error al actualizar estado del contrato:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
