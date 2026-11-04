// script.js

function cambiarTab(tipo) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.busqueda-activa').forEach(el => {
        el.classList.remove('busqueda-activa');
        el.classList.add('busqueda-inactiva');
    });

    if (tipo === 'nombre') {
        document.querySelectorAll('.tab')[0].classList.add('active');
        document.getElementById('busqueda-nombre').classList.replace('busqueda-inactiva', 'busqueda-activa');
    } else if (tipo === 'ingredientes') {
        document.querySelectorAll('.tab')[1].classList.add('active');
        document.getElementById('busqueda-ingredientes').classList.replace('busqueda-inactiva', 'busqueda-activa');
    } else {
        document.querySelectorAll('.tab')[2].classList.add('active');
        document.getElementById('busqueda-admin').classList.replace('busqueda-inactiva', 'busqueda-activa');
    }
    document.getElementById('resultados').innerHTML = '';
}

async function buscarPorNombre() {
    const nombre = document.getElementById('nombre-trago').value.trim();
    if (!nombre) return mostrarMensaje('Ingresá un nombre', 'error');
    
    mostrarMensaje('Buscando...', 'vacio');
    try {
        const res = await fetch(`http://localhost:3000/api/buscar?nombre=${encodeURIComponent(nombre)}`);
        const data = await res.json();
        if (data.resultados.length === 0) return mostrarMensaje(`No encontramos "${nombre}"`, 'vacio');
        mostrarResultados(data.resultados);
    } catch (e) {
        mostrarMensaje('Error de conexión', 'error');
    }
}

async function buscarTragos() {
    const ingredientes = document.getElementById('ingredientes').value.trim();
    if (!ingredientes) return mostrarMensaje('Ingresá al menos un ingrediente', 'error');
    
    mostrarMensaje('Buscando...', 'vacio');
    try {
        const res = await fetch(`http://localhost:3000/api/recomendar?ingredientes=${encodeURIComponent(ingredientes)}`);
        const data = await res.json();
        mostrarResultados(data.recomendaciones);
    } catch (e) {
        mostrarMensaje('Error de conexión', 'error');
    }
}

// Función unificada para mostrar tarjetas CON IMAGEN
function mostrarResultados(tragos) {
    const contenedor = document.getElementById('resultados');
    if (tragos.length === 0) return contenedor.innerHTML = '<div class="mensaje-vacio">Sin resultados.</div>';
    
    contenedor.innerHTML = tragos.map(trago => `
        <div class="trago-card">
            <img src="${trago.imagen}" alt="${trago.nombre}" class="trago-img" onerror="this.src='https://via.placeholder.com/300x300?text=Sin+Imagen'">
            <h3>${trago.nombre}</h3>
            <div class="trago-info"><strong>Vaso:</strong> <p>${trago.vaso}</p></div>
            <div class="trago-info"><strong>Preparación:</strong> <p>${trago.preparacion}</p></div>
            <div class="trago-info"><strong>Tipo:</strong> <p>${trago.historia}</p></div>
            ${trago.ingredientes_coincidentes ? `<div class="coincidencias">✅ ${trago.ingredientes_coincidentes} ingrediente(s) coincidente(s)</div>` : ''}
            <button onclick="cargarParaEditar(${trago.id}, '${trago.nombre}', '${trago.vaso}', '${trago.preparacion.replace(/'/g, "\\'")}', '${trago.historia}', '${trago.imagen}')" style="margin-top:15px; background:#404040; font-size:0.9em;">✏️ Editar este trago</button>
        </div>
    `).join('');
}

// 🆕 Funciones de Administración
async function guardarTrago() {
    const id = document.getElementById('admin-id').value;
    const nombre = document.getElementById('admin-nombre').value.trim();
    const vaso = document.getElementById('admin-vaso').value.trim();
    const ingredientes = document.getElementById('admin-ingredientes').value.trim();
    const preparacion = document.getElementById('admin-preparacion').value.trim();
    const historia = document.getElementById('admin-historia').value.trim();
    const imagen = document.getElementById('admin-imagen').value.trim() || 'https://via.placeholder.com/300x300?text=Sin+Imagen';

    if (!nombre) return mostrarMensaje('El nombre es obligatorio', 'error');

    const url = id ? `http://localhost:3000/api/tragos/${id}` : 'http://localhost:3000/api/tragos';
    const method = id ? 'PUT' : 'POST';
    const body = id ? { nombre, vaso, preparacion, historia, imagen } : { nombre, vaso, preparacion, historia, imagen, ingredientes };

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        mostrarMensaje(id ? '✅ Trago actualizado' : '✅ Trago agregado con éxito', 'vacio');
        limpiarFormulario();
    } catch (e) {
        mostrarMensaje('Error al guardar', 'error');
    }
}

function cargarParaEditar(id, nombre, vaso, preparacion, historia, imagen) {
    cambiarTab('admin');
    document.getElementById('admin-id').value = id;
    document.getElementById('admin-nombre').value = nombre;
    document.getElementById('admin-vaso').value = vaso;
    document.getElementById('admin-preparacion').value = preparacion;
    document.getElementById('admin-historia').value = historia;
    document.getElementById('admin-imagen').value = imagen;
    document.getElementById('btn-guardar').innerText = '💾 Actualizar Trago';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function limpiarFormulario() {
    document.getElementById('admin-id').value = '';
    document.getElementById('admin-nombre').value = '';
    document.getElementById('admin-vaso').value = '';
    document.getElementById('admin-ingredientes').value = '';
    document.getElementById('admin-preparacion').value = '';
    document.getElementById('admin-historia').value = '';
    document.getElementById('admin-imagen').value = '';
    document.getElementById('btn-guardar').innerText = '💾 Guardar Trago';
}

function mostrarMensaje(mensaje, tipo) {
    document.getElementById('resultados').innerHTML = `<div class="mensaje-${tipo}">${mensaje}</div>`;
}

// Listeners para Enter
document.getElementById('nombre-trago').addEventListener('keypress', e => e.key === 'Enter' && buscarPorNombre());
document.getElementById('ingredientes').addEventListener('keypress', e => e.key === 'Enter' && buscarTragos());