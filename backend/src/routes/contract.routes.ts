import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import * as contractController from "../controllers/contractController";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";

const router = Router();

// Configuración de multer para subir los contratos firmados
const UPLOADS_DIR = path.join(process.cwd(), "uploads", "contracts");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    // Intentamos extraer el request_id de params, pero si usamos esta config general 
    // lo metemos en la raiz de contracts temporalmente. Lo ideal es renombrarlo en el controlador.
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `signed_${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

router.use(authMiddleware);

// Crear contrato (generar PDF) — RRHH
router.post("/", roleMiddleware(["RRHH"]), contractController.createContract);

// Listar contratos — RECTOR o RRHH
router.get("/", roleMiddleware(["RECTOR", "RRHH"]), contractController.getAllContracts);

// Obtener contrato por ID — Todos los roles (JEFE, RECTOR, RRHH)
router.get("/:id", contractController.getContractById);

// Descargar contrato PDF — Todos los roles
router.get("/:id/download", contractController.downloadContract);

// Subir contrato firmado — RRHH
router.patch("/:id/upload-signed", roleMiddleware(["RRHH"]), upload.single("file"), contractController.uploadSignedContract);

// Actualizar estado del contrato — RRHH
router.patch("/:id/status", roleMiddleware(["RRHH"]), contractController.updateContractStatus);

export default router;
