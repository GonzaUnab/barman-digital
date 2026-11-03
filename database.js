// database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Conectar (o crear) la base de datos local
const dbPath = path.resolve(__dirname, 'barman.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Error al conectar a la base de datos:', err.message);
    else console.log('✅ Conectado a la base de datos SQLite.');
});

// Crear tablas si no existen
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS tragos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT,
        vaso TEXT,
        preparacion TEXT,
        historia TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS ingredientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT UNIQUE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS tragos_ingredientes (
        trago_id INTEGER,
        ingrediente_id INTEGER,
        FOREIGN KEY (trago_id) REFERENCES tragos(id),
        FOREIGN KEY (ingrediente_id) REFERENCES ingredientes(id)
    )`);

    // Insertar datos de ejemplo (solo si la tabla está vacía)
    db.get("SELECT COUNT(*) as count FROM tragos", (err, row) => {
        if (row.count === 0) {
            console.log("🍸 Cargando datos de ejemplo...");
            
            // 1. Mojito
            db.run(`INSERT INTO tragos (nombre, vaso, preparacion, historia) VALUES ('Mojito', 'Vaso Alto', 'Machacar menta y azúcar, agregar ron, hielo y soda.', 'Originario de Cuba, era la bebida favorita de Hemingway.')`);
            // 2. Gin Tonic
            db.run(`INSERT INTO tragos (nombre, vaso, preparacion, historia) VALUES ('Gin Tonic', 'Vaso de Globo', 'Agregar hielo, gin y completar con tónica. Decorar con limón.', 'Creado por médicos británicos para disimular el sabor de la quinina.')`);

            // Ingredientes
            const ingredientes = ['Ron blanco', 'Menta', 'Azúcar', 'Limón', 'Soda', 'Gin', 'Agua Tónica'];
            const stmtIng = db.prepare("INSERT OR IGNORE INTO ingredientes (nombre) VALUES (?)");
            ingredientes.forEach(ing => stmtIng.run(ing));
            stmtIng.finalize();

            // Relacionar Mojito (id 1) con sus ingredientes (ids 1 a 5)
            db.run(`INSERT INTO tragos_ingredientes (trago_id, ingrediente_id) VALUES 
                (1, 1), (1, 2), (1, 3), (1, 4), (1, 5)`);
            
            // Relacionar Gin Tonic (id 2) con sus ingredientes (ids 6, 7, 4)
            db.run(`INSERT INTO tragos_ingredientes (trago_id, ingrediente_id) VALUES 
                (2, 6), (2, 7), (2, 4)`);

            console.log("✅ Datos de ejemplo cargados correctamente.");
        }
    });
});

module.exports = db;