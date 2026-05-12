import { Router } from "express";
import * as departmentController from "../controllers/departmentController";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";

const router = Router();

router.use(authMiddleware);

// Lectura — todos los roles
router.get("/", departmentController.getAllDepartments);
router.get("/:id", departmentController.getDepartmentById);

// Escritura — solo RRHH
router.post("/", roleMiddleware(["RRHH"]), departmentController.createDepartment);
router.put("/:id", roleMiddleware(["RRHH"]), departmentController.updateDepartment);
router.delete("/:id", roleMiddleware(["RRHH"]), departmentController.deleteDepartment);

export default router;
