import { Router } from "express";
import * as scientificDegreeController from "../controllers/scientificDegreeController";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";

const router = Router();

router.use(authMiddleware);

// Lectura — todos los roles
router.get("/", scientificDegreeController.getAllScientificDegrees);
router.get("/:id", scientificDegreeController.getScientificDegreeById);

// Escritura — solo RRHH
router.post("/", roleMiddleware(["RRHH"]), scientificDegreeController.createScientificDegree);
router.put("/:id", roleMiddleware(["RRHH"]), scientificDegreeController.updateScientificDegree);
router.delete("/:id", roleMiddleware(["RRHH"]), scientificDegreeController.deleteScientificDegree);

export default router;
