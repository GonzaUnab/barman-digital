// database.js - VERSIÓN 100% CORREGIDA
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'barman.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Error al conectar a la base de datos:', err.message);
    else console.log('✅ Conectado a la base de datos SQLite.');
});

db.serialize(() => {
    // Tabla de tragos (SIN la coma sobrante en 'imagen')
    db.run(`CREATE TABLE IF NOT EXISTS tragos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT,
        vaso TEXT,
        preparacion TEXT,
        historia TEXT,
        imagen TEXT
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

    db.run(`CREATE TABLE IF NOT EXISTS traducciones (
        ingles TEXT PRIMARY KEY,
        espanol TEXT NOT NULL
    )`);

    // Cargar traducciones comunes (solo si la tabla está vacía)
    db.get("SELECT COUNT(*) as count FROM traducciones", (err, row) => {
        if (row.count === 0) {
            console.log("🌎 Cargando traducciones de ingredientes...");
            
            const traducciones = [
                ['Vodka', 'Vodka'], ['Rum', 'Ron'], ['White rum', 'Ron blanco'],
                ['Dark rum', 'Ron oscuro'], ['Light rum', 'Ron claro'], ['Gin', 'Ginebra'],
                ['Tequila', 'Tequila'], ['Whiskey', 'Whisky'], ['Bourbon', 'Bourbon'],
                ['Brandy', 'Brandy'], ['Cognac', 'Coñac'], ['Triple sec', 'Triple sec'],
                ['Kahlua', 'Licor de café'], ['Amaretto', 'Amaretto'], ['Campari', 'Campari'],
                ['Aperol', 'Aperol'], ['Vermouth', 'Vermut'], ['Sweet Vermouth', 'Vermut dulce'],
                ['Dry Vermouth', 'Vermut seco'], ['Lime', 'Lima'], ['Lime juice', 'Jugo de lima'],
                ['Lemon', 'Limón'], ['Lemon juice', 'Jugo de limón'], ['Orange', 'Naranja'],
                ['Orange juice', 'Jugo de naranja'], ['Grapefruit juice', 'Jugo de pomelo'],
                ['Pineapple juice', 'Jugo de piña'], ['Cranberry juice', 'Jugo de arándano'],
                ['Tomato juice', 'Jugo de tomate'], ['Mint', 'Menta'], ['Mint leaves', 'Hojas de menta'],
                ['Strawberries', 'Frutillas'], ['Strawberry', 'Frutilla'], ['Blueberries', 'Arándanos'],
                ['Raspberries', 'Frambuesas'], ['Banana', 'Banana'], ['Apple', 'Manzana'],
                ['Cherry', 'Cereza'], ['Maraschino cherry', 'Cereza marrasquino'], ['Olive', 'Aceituna'],
                ['Coconut', 'Coco'], ['Coconut cream', 'Crema de coco'], ['Coconut milk', 'Leche de coco'],
                ['Pineapple', 'Piña'], ['Mango', 'Mango'], ['Passion fruit', 'Fruta de la pasión'],
                ['Sugar', 'Azúcar'], ['Sugar Syrup', 'Almíbar'], ['Simple syrup', 'Almíbar simple'],
                ['Honey', 'Miel'], ['Agave syrup', 'Jarabe de agave'], ['Grenadine', 'Granadina'],
                ['Soda water', 'Agua con gas'], ['Soda', 'Soda'], ['Club soda', 'Agua soda'],
                ['Tonic water', 'Agua tónica'], ['Cola', 'Cola'], ['Ginger ale', 'Ginger ale'],
                ['Ginger beer', 'Cerveza de jengibre'], ['Beer', 'Cerveza'], ['Champagne', 'Champán'],
                ['Prosecco', 'Prosecco'], ['Wine', 'Vino'], ['Red wine', 'Vino tinto'],
                ['White wine', 'Vino blanco'], ['Milk', 'Leche'], ['Cream', 'Crema'],
                ['Heavy cream', 'Crema espesa'], ['Half-and-half', 'Crema ligera'],
                ['Egg white', 'Clara de huevo'], ['Egg', 'Huevo'], ['Angostura bitters', 'Amargo de Angostura'],
                ['Bitters', 'Amargos'], ['Cinnamon', 'Canela'], ['Nutmeg', 'Nuez moscada'],
                ['Vanilla', 'Vainilla'], ['Basil', 'Albahaca'], ['Rosemary', 'Romero'],
                ['Thyme', 'Tomillo'], ['Ginger', 'Jengibre'], ['Jalapeño', 'Jalapeño'],
                ['Water', 'Agua'], ['Ice', 'Hielo'], ['Salt', 'Sal'], ['Coffee', 'Café'],
                ['Espresso', 'Espresso'], ['Chocolate', 'Chocolate'], ['Cocoa powder', 'Cacao en polvo'],
                ['Peanut butter', 'Manteca de maní'], ['Tabasco sauce', 'Salsa Tabasco'],
                ['Worcestershire sauce', 'Salsa Worcestershire']
            ];
            
            const stmt = db.prepare("INSERT OR IGNORE INTO traducciones (ingles, espanol) VALUES (?, ?)");
            traducciones.forEach(([ingles, espanol]) => {
                stmt.run(ingles, espanol);
            });
            stmt.finalize();
            
            console.log(`✅ ${traducciones.length} traducciones cargadas.`);
        }
    });
});

module.exports = db;