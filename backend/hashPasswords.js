const db = require('./config/db');
const bcrypt = require('bcryptjs');

async function actualizar() {
    try {
        const users = await new Promise((resolve, reject) => {
            db.query('SELECT id_usuario, password FROM usuario', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        for (const user of users) {
            // Si la contraseña NO empieza con $2a$ (no es hash bcrypt)
            if (!user.password.startsWith('$2a$')) {
                const hashed = await bcrypt.hash(user.password, 10);
                await new Promise((resolve, reject) => {
                    db.query('UPDATE usuario SET password = ? WHERE id_usuario = ?', [hashed, user.id_usuario], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
                console.log(`✅ Usuario ID ${user.id_usuario} actualizado (contraseña hasheada)`);
            } else {
                console.log(`⏭️ Usuario ID ${user.id_usuario} ya tiene hash correcto`);
            }
        }
        console.log('🎉 Proceso completado. Ahora puedes iniciar sesión.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}
actualizar();