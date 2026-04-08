const db = require('../config/db');

// Obtener todos los usuarios (sin mostrar la contraseña)
exports.obtenerUsuarios = (req, res) => {
    db.query('SELECT id_usuario, nombre, email FROM usuario', (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
};

// Obtener un usuario por ID
exports.obtenerUsuarioPorId = (req, res) => {
    const id = req.params.id;
    db.query('SELECT id_usuario, nombre, email FROM usuario WHERE id_usuario = ?', [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        if (result.length === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }
        res.json(result[0]);
    });
};

// Crear usuario (contraseña en texto plano)
exports.crearUsuario = (req, res) => {
    const { nombre, email, password } = req.body;
    if (!nombre || !email || !password) {
        return res.status(400).json({ mensaje: 'Nombre, email y contraseña son requeridos' });
    }
    // Verificar si el email ya existe
    db.query('SELECT id_usuario FROM usuario WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        if (results.length > 0) {
            return res.status(400).json({ mensaje: 'El email ya está registrado' });
        }
        // Guardar la contraseña tal cual (texto plano)
        db.query('INSERT INTO usuario (nombre, email, password) VALUES (?, ?, ?)', [nombre, email, password], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: err.message });
            }
            res.json({ mensaje: 'Usuario creado', id: result.insertId });
        });
    });
};

// Actualizar usuario (sin bcrypt)
exports.actualizarUsuario = (req, res) => {
    const id = req.params.id;
    const { nombre, email, password } = req.body;
    if (!nombre || !email) {
        return res.status(400).json({ mensaje: 'Nombre y email son requeridos' });
    }
    // Verificar si el email ya existe (excluyendo el propio usuario)
    db.query('SELECT id_usuario FROM usuario WHERE email = ? AND id_usuario != ?', [email, id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        if (results.length > 0) {
            return res.status(400).json({ mensaje: 'El email ya está registrado por otro usuario' });
        }
        // Construir la consulta dinámicamente si se incluye contraseña
        if (password && password.trim() !== '') {
            db.query('UPDATE usuario SET nombre = ?, email = ?, password = ? WHERE id_usuario = ?', [nombre, email, password, id], (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: err.message });
                }
                if (result.affectedRows === 0) {
                    return res.status(404).json({ mensaje: 'Usuario no encontrado' });
                }
                res.json({ mensaje: 'Usuario actualizado' });
            });
        } else {
            db.query('UPDATE usuario SET nombre = ?, email = ? WHERE id_usuario = ?', [nombre, email, id], (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: err.message });
                }
                if (result.affectedRows === 0) {
                    return res.status(404).json({ mensaje: 'Usuario no encontrado' });
                }
                res.json({ mensaje: 'Usuario actualizado' });
            });
        }
    });
};

// Eliminar usuario
exports.eliminarUsuario = (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM usuario WHERE id_usuario = ?', [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }
        res.json({ mensaje: 'Usuario eliminado' });
    });
};