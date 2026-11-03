// server.js
const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Endpoint: Obtener todos los tragos
app.get('/api/tragos', (req, res) => {
    db.all("SELECT * FROM tragos", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Endpoint ESTRELLA: Recomendar tragos según los ingredientes que tiene el usuario
// Ejemplo de uso: GET /api/recomendar?ingredientes=Ron,Menta,Azucar,Limón,Soda
app.get('/api/recomendar', (req, res) => {
    const ingredientesUsuario = req.query.ingredientes; // Ej: "Ron,Menta,Limón"
    
    if (!ingredientesUsuario) {
        return res.status(400).json({ error: "Debes enviar el parámetro 'ingredientes'" });
    }

    // Convertimos la cadena en un array y limpiamos espacios
    const listaIngredientes = ingredientesUsuario.split(',').map(i => i.trim());
    
    // Consulta SQL: Busca tragos cuyos ingredientes estén en la lista del usuario.
    // Agrupamos por trago y contamos cuántos ingredientes coinciden.
    const query = `
        SELECT t.id, t.nombre, t.vaso, t.preparacion, t.historia, COUNT(ti.ingrediente_id) as ingredientes_coincidentes
        FROM tragos t
        JOIN tragos_ingredientes ti ON t.id = ti.trago_id
        JOIN ingredientes i ON ti.ingrediente_id = i.id
        WHERE i.nombre IN (${listaIngredientes.map(() => '?').join(',')})
        GROUP BY t.id
        ORDER BY ingredientes_coincidentes DESC
    `;

    db.all(query, listaIngredientes, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Filtramos solo los tragos que se pueden hacer al 100% (opcional, por ahora mostramos todos ordenados por coincidencia)
        res.json({
            ingredientes_buscados: listaIngredientes,
            recomendaciones: rows
        });
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});