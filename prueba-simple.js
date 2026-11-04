// prueba-simple.js - PRUEBA MINIMAL
const db = require('./database');

console.log('🧪 Iniciando prueba simple...\n');

// Solo insertar 1 trago de prueba
db.run(
    `INSERT INTO tragos (nombre, vaso, preparacion, historia, imagen) VALUES (?, ?, ?, ?, ?)`,
    ['Trago de Prueba', 'Vaso Alto', 'Mezclar y servir', 'Alcohólico', 'https://via.placeholder.com/300'],
    function(err) {
        if (err) {
            console.error('❌ Error al insertar:', err.message);
            console.error('Stack:', err.stack);
        } else {
            console.log('✅ ¡Trago insertado con éxito! ID:', this.lastID);
            
            // Verificar que se guardó
            db.get(`SELECT * FROM tragos WHERE id = ?`, [this.lastID], (err, row) => {
                if (err) {
                    console.error('❌ Error al leer:', err.message);
                } else {
                    console.log('✅ Trago leído:', row);
                }
                process.exit(0);
            });
        }
    }
);