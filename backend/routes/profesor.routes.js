const express = require("express");
const router = express.Router();

const controller = require("../controllers/profesor.controller");

router.get("/", controller.obtenerProfesores);
router.get("/:id",controller.obtenerProfesorPorId); //nueva
router.post("/", controller.crearProfesor);
router.put("/:id", controller.actualizarProfesor);
router.delete("/:id", controller.eliminarProfesor);

module.exports = router;

