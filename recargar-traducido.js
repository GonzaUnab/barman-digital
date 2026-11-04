// recargar-traducido.js - VERSIÓN CON SERIALIZE
const axios = require('axios');
const db = require('./database');

const API_BASE = 'https://www.thecocktaildb.com/api/json/v1/1';

function traducirIngrediente(nombreIngles) {
    return new Promise((resolve) => {
        db.get(`SELECT espanol FROM traducciones WHERE ingles = ?`, [nombreIngles], (err, row) => {
            resolve(row ? row.espanol : nombreIngles);
        });
    });
}

function traducirTexto(texto) {
    if (!texto) return 'No disponible';
    const reemplazos = {
        'shake': 'agitar', 'stir': 'revolver', 'pour': 'verter', 'add': 'agregar',
        'fill': 'llenar', 'garnish': 'decorar', 'serve': 'servir', 'glass': 'vaso',
        'ice': 'hielo', 'shaker': 'coctelera', 'strain': 'colar', 'top up': 'completar',
        'with': 'con', 'and': 'y', 'the': '', 'to': 'a', 'in': 'en', 'of': 'de', 'for': 'para'
    };
    let resultado = texto.toLowerCase();
    for (const [ingles, espanol] of Object.entries(reemplazos)) {
        resultado = resultado.replace(new RegExp(`\\b${ingles}\\b`, 'gi'), espanol);
    }
    return resultado.charAt(0).toUpperCase() + resultado.slice(1);
}

async function recargarConTraducciones() {
    console.log('🔄 Iniciando recarga con traducciones al español...\n');
    
    try {
        // LIMPIAR BASE DE DATOS DE FORMA SEGURA
        console.log('🗑️ Limpiando base de datos...');
        
        await new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run("DELETE FROM tragos_ingredientes", (err) => {
                    if (err) console.error('Error borrando tragos_ingredientes:', err);
                });
                db.run("DELETE FROM ingredientes", (err) => {
                    if (err) console.error('Error borrando ingredientes:', err);
                });
                db.run("DELETE FROM tragos", (err) => {
                    if (err) console.error('Error borrando tragos:', err);
                });
                db.run("SELECT 1", [], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        });
        
        console.log('✅ Base de datos limpiada.\n');
        
        // DESCARGAR TRAGOS
        const letras = 'abcdefghijklmnopqrstuvwxyz'.split('');
        let todosLosTragos = [];
        
        console.log('📋 Descargando tragos de TheCocktailDB...');
        
        for (const letra of letras) {
            try {
                const response = await axios.get(`${API_BASE}/search.php?f=${letra}`);
                if (response.data.drinks) {
                    todosLosTragos = todosLosTragos.concat(response.data.drinks);
                }
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                // Continuar si hay error
            }
        }
        
        console.log(`✅ ${todosLosTragos.length} tragos descargados.\n`);
        console.log('🌎 Guardando tragos...\n');
        
        // INSERTAR TRAGOS
        let procesados = 0;
        
        for (const trago of todosLosTragos) {
            const preparacionTraducida = traducirTexto(trago.strInstructions);
            const imagenUrl = trago.strDrinkThumb || 'https://via.placeholder.com/300x300?text=Sin+Imagen';
            
            await new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO tragos (nombre, vaso, preparacion, historia, imagen) VALUES (?, ?, ?, ?, ?)`,
                    [
                        trago.strDrink,
                        trago.strGlass || 'Vario',
                        preparacionTraducida,
                        trago.strAlcoholic === 'Alcoholic' ? 'Alcohólico' : 'Sin alcohol',
                        imagenUrl
                    ],
                    function(err) {
                        if (err) {
                            console.error('Error insertando trago:', err.message);
                            reject(err);
                        } else {
                            resolve(this.lastID);
                        }
                    }
                );
            }).then(async (tragoId) => {
                // INSERTAR INGREDIENTES
                for (let i = 1; i <= 15; i++) {
                    const ingredienteIngles = trago[`strIngredient${i}`];
                    if (ingredienteIngles && ingredienteIngles.trim() !== '') {
                        const ingredienteEspanol = await traducirIngrediente(ingredienteIngles.trim());
                        
                        await new Promise((resolve) => {
                            db.run(
                                `INSERT OR IGNORE INTO ingredientes (nombre) VALUES (?)`,
                                [ingredienteEspanol],
                                () => {
                                    db.get(
                                        `SELECT id FROM ingredientes WHERE nombre = ?`,
                                        [ingredienteEspanol],
                                        (err, row) => {
                                            if (row) {
                                                db.run(
                                                    `INSERT OR IGNORE INTO tragos_ingredientes (trago_id, ingrediente_id) VALUES (?, ?)`,
                                                    [tragoId, row.id],
                                                    () => resolve()
                                                );
                                            } else {
                                                resolve();
                                            }
                                        }
                                    );
                                }
                            );
                        });
                    }
                }
            }).catch(err => {
                console.error('Error procesando trago:', err.message);
            });
            
            procesados++;
            if (procesados % 50 === 0) {
                console.log(`⏳ Progreso: ${procesados}/${todosLosTragos.length}`);
            }
        }
        
        console.log('\n========================================');
        console.log('✅ ¡RECARGA COMPLETADA!');
        console.log(`📊 Tragos cargados: ${procesados}`);
        console.log('🌎 Ingredientes traducidos al español');
        console.log('📸 Imágenes incluidas');
        console.log('========================================\n');
        console.log('💡 Ahora ejecutá "node server.js" y probá tu app.');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error fatal:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

recargarConTraducciones();