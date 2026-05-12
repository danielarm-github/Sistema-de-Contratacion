import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import * as documentController from "../controllers/documentController";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";

const router = Router();

const UPLOADS_DIR = path.join(process.cwd(), "uploads", "documents");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Crear documento y subir archivo — JEFE
router.post(
  "/",
  roleMiddleware(["JEFE"]),
  upload.single("file"),
  documentController.createDocument,
);

// Leer documentos — todos los roles
router.get("/", documentController.getAllDocuments);
router.get("/:id", documentController.getDocumentById);

// Re-subida de documento firmado — RECTOR o RRHH
router.patch(
  "/:id/upload",
  roleMiddleware(["RECTOR", "RRHH"]),
  upload.single("file"),
  documentController.uploadSignedDocument,
);

// Actualizar estado del documento — RECTOR o RRHH
router.patch(
  "/:id/status",
  roleMiddleware(["RECTOR", "RRHH"]),
  documentController.updateDocumentStatus,
);

// Eliminar documento — JEFE
router.delete(
  "/:id",
  roleMiddleware(["JEFE"]),
  documentController.deleteDocument,
);

export default router;
