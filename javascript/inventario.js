// inventario.js - 100% SQLite
let movimientos = [];
let productos = [];

async function cargarMovimientos() {
    try {
        const [resM, resP] = await Promise.all([
            window.electronAPI.obtenerMovimientos(),
            window.electronAPI.obtenerProductos()
        ]);
        
        if (resM.ok) movimientos = resM.data;
        else console.error('Error cargando movimientos:', resM.error);
        
        if (resP.ok) productos = resP.data;
        else console.error('Error cargando productos:', resP.error);
        
        renderizarMovimientos(movimientos);
        actualizarEstadisticas();
    } catch (error) {
        console.error('Error en cargarMovimientos:', error);
        document.getElementById('tablaMovimientos').innerHTML = `
            <tr><td colspan="7" style="text-align:center;padding:30px;color:#ef4444;">
                ❌ Error al cargar los datos
            </td></tr>
        `;
    }
}

function renderizarMovimientos(datos) {
    const tbody = document.getElementById('tablaMovimientos');
    
    if (!datos || datos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:30px;color:#94a3b8;">
                    📭 No hay movimientos registrados
                </td>
            </tr>
        `;
        return;
    }

    const iconos = { Entrada: '📥', Salida: '📤', Ajuste: '⚙️' };
    
    tbody.innerHTML = datos.map(m => {
        const fecha = new Date(m.fecha);
        const fechaFormateada = fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `
            <tr>
                <td>${fechaFormateada}</td>
                <td>
                    <span class="badge ${m.tipo.toLowerCase()}">${iconos[m.tipo] || ''} ${m.tipo}</span>
                </td>
                <td>${m.producto_nombre}</td>
                <td>${m.referencia || 'N/A'}</td>
                <td>${m.cantidad}</td>
                <td>${m.usuario || 'Administrador'}</td>
                <td>
                    <button onclick="eliminarMovimiento(${m.id})" class="btn-accion btn-eliminar" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function filtrar(tipo, boton) {
    document.querySelectorAll('.filtros button').forEach(b => b.classList.remove('activo'));
    if (boton) boton.classList.add('activo');
    
    const filtrados = tipo === 'Todos' ? movimientos : movimientos.filter(m => m.tipo === tipo);
    renderizarMovimientos(filtrados);
}

function abrirModal() {
    const sel = document.getElementById('producto');
    sel.innerHTML = '<option value="">Seleccionar producto...</option>';
    
    if (productos && productos.length > 0) {
        productos.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = `${p.nombre} — Stock: ${p.cantidad}`;
            sel.appendChild(option);
        });
    }
    
    document.getElementById('tipo').value = 'Entrada';
    document.getElementById('cantidad').value = '';
    document.getElementById('referencia').value = '';
    document.getElementById('modal').style.display = 'flex';
}

function cerrarModal() {
    document.getElementById('modal').style.display = 'none';
}

async function guardarMovimiento() {
    const productoId = parseInt(document.getElementById('producto').value);
    const tipo = document.getElementById('tipo').value;
    const cantidad = parseInt(document.getElementById('cantidad').value);
    const referencia = document.getElementById('referencia').value.trim();

    if (!productoId) {
        alert('❌ Por favor selecciona un producto');
        return;
    }
    
    if (!cantidad || cantidad < 1) {
        alert('❌ Por favor ingresa una cantidad válida');
        return;
    }

    const res = await window.electronAPI.guardarMovimiento({ 
        productoId, 
        tipo, 
        cantidad, 
        referencia 
    });
    
    if (res.ok) {
        await cargarMovimientos();
        cerrarModal();
        alert('✅ Movimiento registrado correctamente');
    } else {
        alert('❌ ' + res.error);
    }
}

async function eliminarMovimiento(id) {
    if (!confirm('⚠️ ¿Estás seguro de eliminar este movimiento?')) return;
    
    const res = await window.electronAPI.eliminarMovimiento({ id });
    if (res.ok) {
        await cargarMovimientos();
        alert('🗑️ Movimiento eliminado');
    } else {
        alert('❌ ' + res.error);
    }
}

function actualizarEstadisticas() {
    const total = movimientos.length;
    const entradas = movimientos.filter(m => m.tipo === 'Entrada').length;
    const salidas = movimientos.filter(m => m.tipo === 'Salida').length;
    const ajustes = movimientos.filter(m => m.tipo === 'Ajuste').length;
    
    const el = document.querySelector('.inventario-header p');
    if (el) {
        el.textContent = `📊 ${total} movimientos | ${entradas} entradas | ${salidas} salidas | ${ajustes} ajustes`;
    }
}

function buscarMovimientos() {
    const busqueda = document.getElementById('buscarMovimiento').value.toLowerCase().trim();
    
    if (!busqueda) {
        renderizarMovimientos(movimientos);
        return;
    }
    
    const filtrados = movimientos.filter(m => 
        m.producto_nombre.toLowerCase().includes(busqueda) ||
        (m.referencia || '').toLowerCase().includes(busqueda) ||
        m.tipo.toLowerCase().includes(busqueda)
    );
    
    renderizarMovimientos(filtrados);
}

document.addEventListener('DOMContentLoaded', function() {
    cargarMovimientos();
    
    const buscador = document.getElementById('buscarMovimiento');
    if (buscador) {
        buscador.addEventListener('input', buscarMovimientos);
    }
    
    const modal = document.getElementById('modal');
    if (modal) {
        modal.addEventListener('click', function(event) {
            if (event.target === this) {
                cerrarModal();
            }
        });
    }
});

// Hacer funciones globales
window.abrirModal = abrirModal;
window.cerrarModal = cerrarModal;
window.guardarMovimiento = guardarMovimiento;
window.filtrar = filtrar;
window.eliminarMovimiento = eliminarMovimiento;
window.buscarMovimientos = buscarMovimientos;