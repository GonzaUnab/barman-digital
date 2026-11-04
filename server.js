// server.js
console.log("🔥🔥🔥 Servidor actualizado con Imágenes y CRUD 🔥🔥🔥");

const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// 1. Obtener todos los tragos (con imagen)
app.get('/api/tragos', (req, res) => {
    db.all("SELECT id, nombre, vaso, preparacion, historia, imagen FROM tragos LIMIT 100", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 2. Recomendar por ingredientes (con imagen)
app.get('/api/recomendar', (req, res) => {
    const ingredientesUsuario = req.query.ingredientes;
    if (!ingredientesUsuario) return res.status(400).json({ error: "Faltan ingredientes" });
    
    const listaIngredientes = ingredientesUsuario.split(',').map(i => i.trim());
    const query = `
        SELECT t.id, t.nombre, t.vaso, t.preparacion, t.historia, t.imagen, COUNT(ti.ingrediente_id) as ingredientes_coincidentes
        FROM tragos t 
        JOIN tragos_ingredientes ti ON t.id = ti.trago_id 
        JOIN ingredientes i ON ti.ingrediente_id = i.id
        WHERE i.nombre IN (${listaIngredientes.map(() => '?').join(',')})
        GROUP BY t.id ORDER BY ingredientes_coincidentes DESC
    `;
    
    db.all(query, listaIngredientes, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ ingredientes_buscados: listaIngredientes, recomendaciones: rows });
    });
});

// 3. Buscar por nombre (con imagen)
app.get('/api/buscar', (req, res) => {
    const nombre = req.query.nombre;
    if (!nombre) return res.status(400).json({ error: "Falta el nombre" });
    
    const query = `SELECT id, nombre, vaso, preparacion, historia, imagen FROM tragos WHERE LOWER(nombre) LIKE LOWER(?) ORDER BY nombre LIMIT 20`;
    
    db.all(query, [`%${nombre}%`], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ termino_buscado: nombre, resultados: rows, total: rows.length });
    });
});

// 🆕 4. AGREGAR un nuevo trago
app.post('/api/tragos', (req, res) => {
    const { nombre, vaso, preparacion, historia, imagen, ingredientes } = req.body;
    
    db.run(
        `INSERT INTO tragos (nombre, vaso, preparacion, historia, imagen) VALUES (?, ?, ?, ?, ?)`,
        [nombre, vaso, preparacion, historia, imagen],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            const tragoId = this.lastID;
            
            // Procesar ingredientes si vienen
            if (ingredientes) {
                const listaIng = ingredientes.split(',').map(i => i.trim());
                listaIng.forEach(ing => {
                    db.run(`INSERT OR IGNORE INTO ingredientes (nombre) VALUES (?)`, [ing], function() {
                        db.get(`SELECT id FROM ingredientes WHERE nombre = ?`, [ing], (err, row) => {
                            if (row) {
                                db.run(`INSERT INTO tragos_ingredientes (trago_id, ingrediente_id) VALUES (?, ?)`, [tragoId, row.id]);
                            }
                        });
                    });
                });
            }
            res.json({ message: "Trago agregado con éxito", id: tragoId });
        }
    );
});

// 🆕 5. EDITAR un trago existente
app.put('/api/tragos/:id', (req, res) => {
    const { id } = req.params;
    const { nombre, vaso, preparacion, historia, imagen } = req.body;
    
    db.run(
        `UPDATE tragos SET nombre = ?, vaso = ?, preparacion = ?, historia = ?, imagen = ? WHERE id = ?`,
        [nombre, vaso, preparacion, historia, imagen, id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Trago actualizado con éxito", cambios: this.changes });
        }
    );
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});