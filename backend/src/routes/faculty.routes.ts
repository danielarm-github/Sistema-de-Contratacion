import { Router } from "express";
import * as facultyController from "../controllers/facultyController";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";

const router = Router();

router.use(authMiddleware);

// Lectura — todos los roles (para seleccionar en formularios)
router.get("/", facultyController.getAllFaculties);
router.get("/:id", facultyController.getFacultyById);

// Escritura — solo RRHH (administración de catálogos)
router.post("/", roleMiddleware(["RRHH"]), facultyController.createFaculty);
router.put("/:id", roleMiddleware(["RRHH"]), facultyController.updateFaculty);
router.delete("/:id", roleMiddleware(["RRHH"]), facultyController.deleteFaculty);

export default router;
