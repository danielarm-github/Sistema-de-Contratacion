import { Router } from "express";
import * as professorController from "../controllers/professorController";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();
router.use(authMiddleware);

router.post("/", professorController.createProfessor);
router.get("/", professorController.getAllProfessors);
router.get("/:id", professorController.getProfessorById);
router.put("/:id", professorController.updateProfessor);
router.delete("/:id", professorController.deleteProfessor);

export default router;
