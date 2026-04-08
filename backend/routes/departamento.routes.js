const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Obtener todos los departamentos
router.get("/", (req, res) => {
    db.query("SELECT * FROM departamento", (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
});

// Crear un nuevo departamento
router.post("/", (req, res) => {
    const { nombre } = req.body;
    if (!nombre || nombre.trim() === "") {
        return res.status(400).json({ error: "El nombre es obligatorio" });
    }
    db.query("INSERT INTO departamento (nombre) VALUES (?)", [nombre], (err, result) => {
        if (err) {
            // Si el nombre ya existe (duplicado) o error de BD
            return res.status(500).json({ error: err.message });
        }
        res.json({ mensaje: "Departamento creado", id: result.insertId });
    });
});

// Actualizar un departamento (necesario para la edición desde el frontend)
router.put("/:id", (req, res) => {
    const id = req.params.id;
    const { nombre } = req.body;
    if (!nombre || nombre.trim() === "") {
        return res.status(400).json({ error: "El nombre es obligatorio" });
    }
    db.query("UPDATE departamento SET nombre = ? WHERE id_departamento = ?", [nombre, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: "Departamento no encontrado" });
        res.json({ mensaje: "Departamento actualizado" });
    });
});

// Eliminar un departamento
router.delete("/:id", (req, res) => {
    const id = req.params.id;
    db.query("DELETE FROM departamento WHERE id_departamento = ?", [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: "Departamento no encontrado" });
        res.json({ mensaje: "Departamento eliminado" });
    });
});

module.exports = router;