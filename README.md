# 🍸 El Barman Digital

Una aplicación web full-stack para buscar, descubrir y gestionar recetas de cócteles. Permite buscar tragos por nombre o por los ingredientes que tienes disponibles, y cuenta con un panel de administración para agregar o editar tus propias recetas.

Desarrollada con un diseño moderno (tema oscuro con acentos dorados) y una arquitectura robusta de Backend y Base de Datos relacional.

## 🚀 Características Principales

- 🔍 **Búsqueda Inteligente:** Busca por nombre (parcial e insensible a mayúsculas) o por ingredientes disponibles.
- 🌍 **Datos en Español:** Base de datos local con más de 600 tragos e ingredientes traducidos y adaptados.
- 🛠️ **Panel de Administración (CRUD):** Crea y edita tus propios tragos, gestionando nombre, vaso, preparación, historia e imagen.
- 📸 **Imágenes Integradas:** Visualización de fotos reales de cada preparación.
- 📱 **Diseño Responsivo:** Interfaz limpia, oscura y con detalles dorados, adaptable a distintos dispositivos.

## 🛠️ Stack Tecnológico

- **Backend:** Node.js, Express.js
- **Base de Datos:** SQLite3 (Relacional, embebida)
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Herramientas:** Git, GitHub, Axios (para consumo de APIs)

---

## 🏗️ Arquitectura del Backend y Base de Datos

El proyecto sigue una arquitectura de capas separando la lógica del servidor de la presentación.

### Base de Datos (SQLite)
Se utiliza un modelo relacional optimizado para consultas rápidas. El esquema consta de 4 tablas principales:
1. `tragos`: Almacena la información principal (id, nombre, vaso, preparacion, historia, imagen).
2. `ingredientes`: Lista maestra de ingredientes únicos (id, nombre).
3. `tragos_ingredientes`: Tabla intermedia (relación muchos-a-muchos) que vincula un `trago_id` con un `ingrediente_id`.
4. `traducciones`: Diccionario local (inglés → español) utilizado durante el proceso de carga de datos.

### Backend (Node.js + Express)
Expone una API RESTful con los siguientes endpoints:
- `GET /api/tragos`: Obtiene un listado paginado de tragos.
- `GET /api/buscar?nombre=X`: Búsqueda flexible por nombre usando `LIKE` en SQL.
- `GET /api/recomendar?ingredientes=X,Y`: Consulta compleja con `JOIN` y `COUNT` para ordenar los tragos por cantidad de ingredientes coincidentes.
- `POST /api/tragos`: Crea un nuevo trago y sus relaciones con ingredientes.
- `PUT /api/tragos/:id`: Actualiza los datos de un trago existente.

---

## 🔍 Profundización Técnica

### 1. Integración de APIs y Procesamiento de Datos
Para evitar depender de llamadas a internet en tiempo real y garantizar que los datos estén en español, se implementó un script de migración (`recargar-traducido.js`):
- **Consumo:** Utiliza `axios` para recorrer el alfabeto y descargar todos los registros de *TheCocktailDB*.
- **Limpieza y Traducción:** Antes de guardar, el script consulta la tabla local `traducciones`. Si el ingrediente en inglés (ej: "Lime juice") existe en el diccionario, lo reemplaza por su equivalente en español ("Jugo de lima"). También aplica reglas de reemplazo de texto para traducir instrucciones básicas de preparación.
- **Persistencia:** Los datos limpios y traducidos se insertan en las tablas `tragos`, `ingredientes` y su relación `tragos_ingredientes`.

### 2. Implementación del CRUD
- **Create (Crear):** Al recibir un `POST`, el servidor inserta el trago. Luego, itera sobre el array de ingredientes enviados: inserta cada ingrediente en la tabla `ingredientes` (usando `INSERT OR IGNORE` para evitar duplicados) y crea el vínculo en `tragos_ingredientes`.
- **Read (Leer):** Las consultas `GET` utilizan parámetros (`req.query`) y consultas SQL parametrizadas para prevenir inyecciones SQL, devolviendo los datos en formato JSON.
- **Update (Actualizar):** El endpoint `PUT` recibe el ID en la URL y los nuevos datos en el body, ejecutando un `UPDATE` directo en la tabla `tragos`.

---

## ⚙️ Instalación y Uso Local

1. Clona el repositorio:
   ```bash
   git clone https://github.com/GonzaUnab/barman-digital.git
   cd barman-digital
