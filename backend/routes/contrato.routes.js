const express = require("express");
const router = express.Router();
const db = require("../config/db");

// obtener contratos
router.get("/", (req, res) => {
    db.query("SELECT * FROM contrato", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

// crear contrato
router.post("/", (req, res) => {

    const { fecha_inicio, fecha_fin, salario, tipo_contrato, id_solicitud } = req.body;

    const sql = `
        INSERT INTO contrato
        (fecha_inicio, fecha_fin, salario, tipo_contrato, id_solicitud)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(sql, [fecha_inicio, fecha_fin, salario, tipo_contrato, id_solicitud], (err, result) => {

        if (err) return res.status(500).json(err);

        res.json(result);
    });

});

router.put("/:id", (req,res)=>{

const {fecha_inicio, fecha_fin, salario, tipo_contrato} = req.body;

const sql = `
UPDATE contrato
SET fecha_inicio=?, fecha_fin=?, salario=?, tipo_contrato=?
WHERE id_contrato=?
`;

db.query(sql,[fecha_inicio,fecha_fin,salario,tipo_contrato,req.params.id],
(err,result)=>{
if(err) return res.status(500).json(err);
res.json(result);
});

});

router.delete("/:id",(req,res)=>{

const sql="DELETE FROM contrato WHERE id_contrato=?";

db.query(sql,[req.params.id],(err,result)=>{
if(err) return res.status(500).json(err);
res.json(result);
});

});

router.get("/:id", (req, res) => {
    const id = req.params.id;
    db.query("SELECT * FROM contrato WHERE id_contrato = ?", [id], (err, result) => {
        if (err) return res.status(500).json(err);
        if (result.length === 0) return res.status(404).json({ mensaje: "Contrato no encontrado" });
        res.json(result[0]);
    });
});

module.exports = router;