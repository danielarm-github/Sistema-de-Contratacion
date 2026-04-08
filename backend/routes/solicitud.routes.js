const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Obtener todas las solicitudes
router.get("/", (req, res) => {
    db.query("SELECT * FROM solicitud_contratacion", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

// Obtener una solicitud por ID
router.get("/:id", (req, res) => {
    const id = req.params.id;
    db.query("SELECT * FROM solicitud_contratacion WHERE id_solicitud = ?", [id], (err, result) => {
        if (err) return res.status(500).json(err);
        if (result.length === 0) return res.status(404).json({ mensaje: "Solicitud no encontrada" });
        res.json(result[0]);
    });
});

// ✅ APROBAR solicitud (debe ir ANTES de la ruta PUT /:id)
router.put("/aprobar/:id", (req, res) => {
    const id = req.params.id;
    db.query("UPDATE solicitud_contratacion SET estado = 'aprobada' WHERE id_solicitud = ?", [id], (err, result) => {
        if (err) return res.status(500).json(err);
        if (result.affectedRows === 0) return res.status(404).json({ mensaje: "Solicitud no encontrada" });
        res.json({ mensaje: "Solicitud aprobada correctamente" });
    });
});

// Actualizar solicitud (PUT genérico)
router.put("/:id", (req, res) => {
    const id = req.params.id;
    const {
        fecha_solicitud,
        asignatura,
        carrera,
        horas_semanales,
        centro_trabajo,
        estado,
        facultad,
        id_profesor,
        id_departamento,
        id_usuario
    } = req.body;
    const sql = `
        UPDATE solicitud_contratacion SET
            fecha_solicitud = ?,
            asignatura = ?,
            carrera = ?,
            horas_semanales = ?,
            centro_trabajo = ?,
            estado = ?,
            facultad = ?,
            id_profesor = ?,
            id_departamento = ?,
            id_usuario = ?
        WHERE id_solicitud = ?
    `;
    db.query(sql, [
        fecha_solicitud, asignatura, carrera, horas_semanales,
        centro_trabajo, estado, facultad, id_profesor,
        id_departamento, id_usuario, id
    ], (err, result) => {
        if (err) return res.status(500).json(err);
        if (result.affectedRows === 0) return res.status(404).json({ mensaje: "Solicitud no encontrada" });
        res.json({ mensaje: "Solicitud actualizada" });
    });
});

// Eliminar solicitud
router.delete("/:id", (req, res) => {
    const id = req.params.id;
    db.query("DELETE FROM solicitud_contratacion WHERE id_solicitud = ?", [id], (err, result) => {
        if (err) return res.status(500).json(err);
        if (result.affectedRows === 0) return res.status(404).json({ mensaje: "Solicitud no encontrada" });
        res.json({ mensaje: "Solicitud eliminada" });
    });
});

module.exports = router;