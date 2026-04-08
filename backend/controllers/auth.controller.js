const db = require('../config/db');
const { generarToken } = require('../middleware/auth');

exports.login = (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ mensaje: 'Email y contraseña son requeridos' });
    }
    db.query('SELECT * FROM usuario WHERE email = ?', [email], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) {
            return res.status(401).json({ mensaje: 'Credenciales inválidas' });
        }
        const usuario = results[0];
        // Comparación en texto plano (temporal)
        if (password !== usuario.password) {
            return res.status(401).json({ mensaje: 'Credenciales inválidas' });
        }
        const token = generarToken(usuario);
        res.json({
            mensaje: 'Login exitoso',
            token,
            usuario: {
                id: usuario.id_usuario,
                nombre: usuario.nombre,
                email: usuario.email
            }
        });
    });
};