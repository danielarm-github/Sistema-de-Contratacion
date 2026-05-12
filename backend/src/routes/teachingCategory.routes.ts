import { Router } from "express";
import * as teachingCategoryController from "../controllers/teachingCategoryController";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";

const router = Router();

router.use(authMiddleware);

// Lectura — todos los roles
router.get("/", teachingCategoryController.getAllTeachingCategories);
router.get("/:id", teachingCategoryController.getTeachingCategoryById);

// Escritura — solo RRHH
router.post("/", roleMiddleware(["RRHH"]), teachingCategoryController.createTeachingCategory);
router.put("/:id", roleMiddleware(["RRHH"]), teachingCategoryController.updateTeachingCategory);
router.delete("/:id", roleMiddleware(["RRHH"]), teachingCategoryController.deleteTeachingCategory);

export default router;
