import { Router } from "express";
import * as requestController from "../controllers/requestController";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Crear solicitud — solo JEFE DE ÁREA
router.post("/", roleMiddleware(["JEFE"]), requestController.createRequest);

// Leer solicitudes — todos los roles autenticados
router.get("/", requestController.getAllRequests);
router.get("/:id", requestController.getRequestById);

// Cambiar estado — RECTOR (→ IN_REVIEW / REJECTED) y RRHH (→ APPROVED / COMPLETED)
router.patch("/:id/status", roleMiddleware(["RECTOR", "RRHH"]), requestController.updateRequestStatus);

// Agregar documentos a solicitud — JEFE
router.post("/:id/documents", roleMiddleware(["JEFE"]), requestController.addDocumentsToRequest);

// Eliminar solicitud — solo JEFE (y solo en estados PENDING/CANCELLED)
router.delete("/:id", roleMiddleware(["JEFE"]), requestController.deleteRequest);

export default router;
