// cargar-datos.js
const axios = require('axios');
const db = require('./database');

// URL base de la API
const API_BASE = 'https://www.thecocktaildb.com/api/json/v1/1';

async function cargarTodosLosTragos() {
    console.log('🔄 Iniciando carga de tragos desde TheCocktailDB...\n');
    
    try {
        // 1. Obtener la lista completa de todos los tragos (por letra)
        const letras = 'abcdefghijklmnopqrstuvwxyz'.split('');
        let todosLosNombres = [];
        
        console.log('📋 Obteniendo lista de todos los tragos...');
        
        for (const letra of letras) {
            try {
                const response = await axios.get(`${API_BASE}/search.php?f=${letra}`);
                if (response.data.drinks) {
                    todosLosNombres = todosLosNombres.concat(response.data.drinks);
                }
                // Pequeña pausa para no saturar la API
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                // Si una letra no tiene tragos, continuamos
            }
        }
        
        console.log(`✅ Se encontraron ${todosLosNombres.length} tragos para descargar.\n`);
        
        // 2. Procesar cada trago
        let cargados = 0;
        let errores = 0;
        
        // Usamos una transacción para que sea mucho más rápido
        db.serialize(() => {
            db.run("BEGIN TRANSACTION");
            
            todosLosNombres.forEach((trago, index) => {
                try {
                    // Insertar el trago (si ya existe, lo ignora)
                    db.run(
                        `INSERT OR IGNORE INTO tragos (nombre, vaso, preparacion, historia) 
                         VALUES (?, ?, ?, ?)`,
                        [
                            trago.strDrink,
                            trago.strGlass || 'Vario',
                            trago.strInstructions || 'Sin preparación disponible',
                            trago.strAlcoholic || 'Desconocido'
                        ],
                        function(err) {
                            if (err) {
                                errores++;
                                return;
                            }
                            
                            const tragoId = this.lastID;
                            
                            // Si se insertó (no era duplicado), procesamos ingredientes
                            if (tragoId > 0) {
                                // Extraer ingredientes (la API los guarda en strIngredient1, strIngredient2, etc.)
                                const ingredientes = [];
                                for (let i = 1; i <= 15; i++) {
                                    const ingrediente = trago[`strIngredient${i}`];
                                    if (ingrediente && ingrediente.trim() !== '') {
                                        ingredientes.push(ingrediente.trim());
                                    }
                                }
                                
                                // Insertar cada ingrediente y relacionarlo con el trago
                                ingredientes.forEach(ingredienteNombre => {
                                    // Insertar ingrediente (si ya existe, usa el existente)
                                    db.run(
                                        `INSERT OR IGNORE INTO ingredientes (nombre) VALUES (?)`,
                                        [ingredienteNombre],
                                        function(err) {
                                            // Obtener el ID del ingrediente (nuevo o existente)
                                            db.get(
                                                `SELECT id FROM ingredientes WHERE nombre = ?`,
                                                [ingredienteNombre],
                                                (err, row) => {
                                                    if (row) {
                                                        // Crear la relación trago-ingrediente
                                                        db.run(
                                                            `INSERT OR IGNORE INTO tragos_ingredientes 
                                                             (trago_id, ingrediente_id) VALUES (?, ?)`,
                                                            [tragoId, row.id]
                                                        );
                                                    }
                                                }
                                            );
                                        }
                                    );
                                });
                                
                                cargados++;
                            }
                        }
                    );
                    
                    // Mostrar progreso cada 50 tragos
                    if ((index + 1) % 50 === 0) {
                        console.log(`⏳ Progreso: ${index + 1}/${todosLosNombres.length}`);
                    }
                } catch (error) {
                    errores++;
                }
            });
            
            // Cerrar la transacción después de un tiempo prudencial
            setTimeout(() => {
                db.run("COMMIT", (err) => {
                    if (err) {
                        console.error('❌ Error al confirmar la transacción:', err);
                    } else {
                        console.log('\n========================================');
                        console.log('✅ ¡CARGA COMPLETADA!');
                        console.log(`📊 Tragos nuevos cargados: ${cargados}`);
                        console.log(`⚠️ Errores/Duplicados: ${errores}`);
                        console.log('========================================\n');
                        console.log('💡 Ahora podés ejecutar "node server.js" y probar tu app.');
                        process.exit(0);
                    }
                });
            }, 5000);
        });
        
    } catch (error) {
        console.error('❌ Error fatal:', error.message);
        process.exit(1);
    }
}

// Ejecutar la función
cargarTodosLosTragos();