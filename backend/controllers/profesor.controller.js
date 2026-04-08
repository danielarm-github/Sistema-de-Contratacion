const db = require("../config/db");

exports.obtenerProfesores = (req, res) => {
    db.query("SELECT * FROM profesor", (error, resultados) => {
        if (error) return res.status(500).json(error);
        res.json(resultados);
    });
};

// NUEVA FUNCIÓN: obtener un profesor por su ID
exports.obtenerProfesorPorId = (req, res) => {
    const id = req.params.id;
    db.query("SELECT * FROM profesor WHERE id_profesor = ?", [id], (error, resultado) => {
        if (error) return res.status(500).json(error);
        if (resultado.length === 0) return res.status(404).json({ mensaje: "Profesor no encontrado" });
        res.json(resultado[0]);
    });
};

exports.crearProfesor = (req, res) => {
    const {
        nombre,
        apellidos,
        carnet_identidad,
        fecha_nacimiento,
        sexo,
        direccion,
        telefono,
        email,
        especialidad,
        categoria_docente,
        grado_cientifico,
        graduado_carrera,
        fuente_procedencia,
        nivel_escolaridad,
        id_departamento
    } = req.body;

    const sql = `
        INSERT INTO profesor (
            nombre, apellidos, carnet_identidad, fecha_nacimiento, sexo,
            direccion, telefono, email, especialidad, categoria_docente,
            grado_cientifico, graduado_carrera, fuente_procedencia,
            nivel_escolaridad, id_departamento
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [
        nombre, apellidos, carnet_identidad, fecha_nacimiento, sexo,
        direccion, telefono, email, especialidad, categoria_docente,
        grado_cientifico, graduado_carrera, fuente_procedencia,
        nivel_escolaridad, id_departamento
    ], (error, resultado) => {
        if (error) return res.status(500).json(error);
        res.json(resultado);
    });
};

exports.actualizarProfesor = (req, res) => {
    const id = req.params.id;
    const {
        nombre, apellidos, carnet_identidad, fecha_nacimiento, sexo,
        direccion, telefono, email, especialidad, categoria_docente,
        grado_cientifico, graduado_carrera, fuente_procedencia,
        nivel_escolaridad, id_departamento
    } = req.body;

    const sql = `
        UPDATE profesor SET
            nombre=?, apellidos=?, carnet_identidad=?, fecha_nacimiento=?, sexo=?,
            direccion=?, telefono=?, email=?, especialidad=?, categoria_docente=?,
            grado_cientifico=?, graduado_carrera=?, fuente_procedencia=?,
            nivel_escolaridad=?, id_departamento=?
        WHERE id_profesor=?
    `;

    db.query(sql, [
        nombre, apellidos, carnet_identidad, fecha_nacimiento, sexo,
        direccion, telefono, email, especialidad, categoria_docente,
        grado_cientifico, graduado_carrera, fuente_procedencia,
        nivel_escolaridad, id_departamento, id
    ], (error, resultado) => {
        if (error) return res.status(500).json(error);
        res.json(resultado);
    });
};

exports.eliminarProfesor = (req, res) => {
    const id = req.params.id;
    db.query("DELETE FROM profesor WHERE id_profesor = ?", [id], (error, resultado) => {
        if (error) {
            if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
                return res.status(409).json({ 
                    mensaje: "No se puede eliminar el profesor porque tiene solicitudes o contratos asociados. Primero elimine esas dependencias."
                });
            }
            return res.status(500).json(error);
        }
        res.json(resultado);
    });
};