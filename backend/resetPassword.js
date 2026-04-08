const db = require('./config/db');

// Cambia estos datos si es necesario
const emailAdmin = 'admin@umcc.cu';   // El email con el que quieres entrar
const nuevaPassword = 'admin123';     // La contraseña que usarás (puede ser cualquier texto)

db.query('UPDATE usuario SET password = ? WHERE email = ?', [nuevaPassword, emailAdmin], (err, result) => {
    if (err) {
        console.error('❌ Error al actualizar:', err);
        process.exit(1);
    }
    if (result.affectedRows === 0) {
        console.log('⚠️ No se encontró un usuario con ese email. Los emails disponibles son:');
        // Mostrar emails de usuarios para que sepas cuál usar
        db.query('SELECT email FROM usuario', (err2, rows) => {
            if (err2) console.error(err2);
            else rows.forEach(row => console.log(`   - ${row.email}`));
            process.exit(1);
        });
    } else {
        console.log(`✅ Contraseña de ${emailAdmin} actualizada a: ${nuevaPassword}`);
        process.exit(0);
    }
});