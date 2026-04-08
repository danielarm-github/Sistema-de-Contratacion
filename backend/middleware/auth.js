const jwt = require('jsonwebtoken');
const SECRET_KEY = 'miClaveSecretaParaJWT2026';

const verificarToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ mensaje: 'Token no proporcionado' });
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ mensaje: 'Formato de token inválido' });
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.usuario = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ mensaje: 'Token inválido o expirado' });
    }
};

const generarToken = (usuario) => {
    return jwt.sign(
        { id: usuario.id_usuario, email: usuario.email, nombre: usuario.nombre },
        SECRET_KEY,
        { expiresIn: '8h' }
    );
};

module.exports = { verificarToken, generarToken };