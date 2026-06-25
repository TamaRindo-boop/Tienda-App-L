// inventario.js
let movimientos = [];
let productos = [];

// Cargar datos al iniciar
async function cargarMovimientos() {
    try {
        // Cargar productos desde SQLite
        const res = await window.electronAPI.obtenerProductos();
        if (res && res.ok) {
            productos = res.data;
        }
        
        // Cargar movimientos desde localStorage
        const movimientosGuardados = localStorage.getItem("movimientos");
        if (movimientosGuardados) {
            movimientos = JSON.parse(movimientosGuardados);
        } else {
            movimientos = [];
            localStorage.setItem("movimientos", JSON.stringify(movimientos));
        }
        
        renderizarMovimientos(movimientos);
        actualizarEstadisticas();
        
    } catch (error) {
        console.error("Error al cargar datos:", error);
        document.getElementById('tablaMovimientos').innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:30px;color:#ef4444;">
                    ❌ Error al cargar los datos
                </td>
            </tr>
        `;
    }
}

// Renderizar movimientos en la tabla
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

    tbody.innerHTML = datos.map(mov => {
        const tipoClass = mov.tipo.toLowerCase();
        const icono = mov.tipo === 'Entrada' ? '📥' : 
                     mov.tipo === 'Salida' ? '📤' : '⚙️';
        
        const fecha = new Date(mov.fecha);
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
                    <span class="badge ${tipoClass}">${icono} ${mov.tipo}</span>
                </td>
                <td>${mov.producto}</td>
                <td>${mov.referencia || 'N/A'}</td>
                <td>${mov.cantidad}</td>
                <td>${mov.usuario || 'Administrador'}</td>
                <td>
                    <button onclick="verMovimiento(${mov.id})" class="btn-accion btn-ver" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="eliminarMovimiento(${mov.id})" class="btn-accion btn-eliminar" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Filtrar movimientos por tipo
function filtrar(tipo, boton) {
    document.querySelectorAll('.filtros button').forEach(btn => {
        btn.classList.remove('activo');
    });
    boton.classList.add('activo');

    let filtrados;
    if (tipo === 'Todos') {
        filtrados = movimientos;
    } else {
        filtrados = movimientos.filter(m => m.tipo === tipo);
    }
    
    renderizarMovimientos(filtrados);
}

// Abrir modal para nuevo movimiento
function abrirModal() {
    const selectProducto = document.getElementById('producto');
    if (selectProducto) {
        selectProducto.innerHTML = '<option value="">Seleccionar producto...</option>';
        if (productos && productos.length > 0) {
            productos.forEach(prod => {
                const option = document.createElement('option');
                option.value = prod.id;
                option.textContent = `${prod.nombre} - Stock: ${prod.cantidad}`;
                selectProducto.appendChild(option);
            });
        }
    }
    
    document.getElementById('modal').style.display = 'flex';
    document.getElementById('modalTitulo').textContent = 'Nuevo Movimiento';
    
    document.getElementById('tipo').value = 'Entrada';
    document.getElementById('cantidad').value = '';
    document.getElementById('referencia').value = '';
}

// Cerrar modal
function cerrarModal() {
    document.getElementById('modal').style.display = 'none';
}

// Guardar nuevo movimiento
async function guardarMovimiento() {
    const productoId = document.getElementById('producto').value;
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

    const producto = productos.find(p => p.id == productoId);
    if (!producto) {
        alert('❌ Producto no encontrado');
        return;
    }

    if (tipo === 'Salida' && producto.cantidad < cantidad) {
        alert(`❌ Stock insuficiente. Disponible: ${producto.cantidad}`);
        return;
    }

    const nuevoMovimiento = {
        id: Date.now(),
        fecha: new Date().toISOString(),
        tipo: tipo,
        producto: producto.nombre,
        productoId: producto.id,
        referencia: referencia || `REF-${Date.now().toString().slice(-6)}`,
        cantidad: cantidad,
        usuario: 'Administrador'
    };

    let nuevoStock = producto.cantidad;
    if (tipo === 'Entrada') {
        nuevoStock += cantidad;
    } else if (tipo === 'Salida') {
        nuevoStock -= cantidad;
    }

    movimientos.unshift(nuevoMovimiento);
    localStorage.setItem('movimientos', JSON.stringify(movimientos));

    if (tipo !== 'Ajuste') {
        try {
            if (window.electronAPI && window.electronAPI.actualizarProducto) {
                await window.electronAPI.actualizarProducto({
                    id: producto.id,
                    cantidad: nuevoStock
                });
            }
            
            const index = productos.findIndex(p => p.id == producto.id);
            if (index !== -1) {
                productos[index].cantidad = nuevoStock;
            }
        } catch (error) {
            console.error('Error al actualizar stock:', error);
        }
    }

    const filtroActivo = document.querySelector('.filtros .activo');
    if (filtroActivo) {
        const tipoFiltro = filtroActivo.textContent.trim().replace(/[📋📥📤⚙️]/g, '').trim();
        const filtrados = tipoFiltro === 'Todos' ? movimientos : 
                         movimientos.filter(m => m.tipo === tipoFiltro);
        renderizarMovimientos(filtrados);
    } else {
        renderizarMovimientos(movimientos);
    }

    actualizarEstadisticas();
    cerrarModal();
    alert('✅ Movimiento registrado correctamente');
}

// Ver detalles de un movimiento
function verMovimiento(id) {
    const movimiento = movimientos.find(m => m.id === id);
    if (!movimiento) {
        alert('❌ Movimiento no encontrado');
        return;
    }

    const fecha = new Date(movimiento.fecha);
    const fechaFormateada = fecha.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    alert(`📋 DETALLES DEL MOVIMIENTO\n\n` +
          `📅 Fecha: ${fechaFormateada}\n` +
          `🔄 Tipo: ${movimiento.tipo}\n` +
          `📦 Producto: ${movimiento.producto}\n` +
          `🏷️ Referencia: ${movimiento.referencia || 'N/A'}\n` +
          `🔢 Cantidad: ${movimiento.cantidad}\n` +
          `👤 Usuario: ${movimiento.usuario || 'Administrador'}`);
}

// Eliminar movimiento
function eliminarMovimiento(id) {
    if (!confirm('⚠️ ¿Estás seguro de eliminar este movimiento?')) return;
    
    movimientos = movimientos.filter(m => m.id !== id);
    localStorage.setItem('movimientos', JSON.stringify(movimientos));
    
    renderizarMovimientos(movimientos);
    actualizarEstadisticas();
    alert('🗑️ Movimiento eliminado');
}

// Actualizar estadísticas
function actualizarEstadisticas() {
    const total = movimientos.length;
    const entradas = movimientos.filter(m => m.tipo === 'Entrada').length;
    const salidas = movimientos.filter(m => m.tipo === 'Salida').length;
    const ajustes = movimientos.filter(m => m.tipo === 'Ajuste').length;
    
    const totalElement = document.querySelector('.inventario-header p');
    if (totalElement) {
        totalElement.textContent = `📊 ${total} movimientos | ${entradas} entradas | ${salidas} salidas | ${ajustes} ajustes`;
    }
}

// Buscar movimientos
function buscarMovimientos() {
    const busqueda = document.getElementById('buscarMovimiento').value.toLowerCase().trim();
    
    if (!busqueda) {
        renderizarMovimientos(movimientos);
        return;
    }
    
    const filtrados = movimientos.filter(m => 
        m.producto.toLowerCase().includes(busqueda) ||
        m.referencia.toLowerCase().includes(busqueda) ||
        m.tipo.toLowerCase().includes(busqueda) ||
        (m.usuario && m.usuario.toLowerCase().includes(busqueda))
    );
    
    renderizarMovimientos(filtrados);
}

// Inicializar
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
window.verMovimiento = verMovimiento;
window.eliminarMovimiento = eliminarMovimiento;
window.buscarMovimientos = buscarMovimientos;