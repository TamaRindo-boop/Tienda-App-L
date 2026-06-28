// proveedores.js
let proveedores = [];
let compras = [];
let proveedorEditando = null;

// Cargar datos al iniciar
async function cargarProveedores() {
    try {
        const proveedoresGuardados = localStorage.getItem("proveedores");
        if (proveedoresGuardados) {
            proveedores = JSON.parse(proveedoresGuardados);
        } else {
            proveedores = [];
            localStorage.setItem("proveedores", JSON.stringify(proveedores));
        }
        
        const comprasGuardadas = localStorage.getItem("compras");
        if (comprasGuardadas) {
            compras = JSON.parse(comprasGuardadas);
        } else {
            compras = [];
        }
        
        renderizarProveedores(proveedores);
        actualizarEstadisticas();
        
    } catch (error) {
        console.error("Error al cargar datos:", error);
        document.getElementById('tablaProveedores').innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error al cargar los datos</p>
                    <span>${error.message}</span>
                </td>
            </tr>
        `;
    }
}

// Renderizar proveedores
function renderizarProveedores(datos) {
    const tbody = document.getElementById('tablaProveedores');
    
    if (!datos || datos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <i class="fas fa-building"></i>
                    <p>No hay proveedores registrados</p>
                    <span>Haz clic en "Nuevo Proveedor" para comenzar</span>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = datos.map(prov => {
        const estadoClass = prov.estado.toLowerCase();
        const toggleIcon = prov.estado === 'Activo' ? 'fa-pause' : 'fa-play';
        const toggleTitle = prov.estado === 'Activo' ? 'Desactivar' : 'Activar';
        const toggleClass = prov.estado === 'Activo' ? '' : 'inactivo';
        
        return `
            <tr>
                <td>#${prov.id}</td>
                <td><strong>${prov.nombre}</strong></td>
                <td>${prov.contacto || 'N/A'}</td>
                <td>${prov.telefono || 'N/A'}</td>
                <td>${prov.email || 'N/A'}</td>
                <td>${prov.direccion || 'N/A'}</td>
                <td><span class="badge ${estadoClass}">${prov.estado}</span></td>
                <td>
                    <button onclick="verDetalleProveedor(${prov.id})" class="btn-accion btn-ver" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="editarProveedor(${prov.id})" class="btn-accion btn-editar" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="toggleEstadoProveedor(${prov.id})" class="btn-accion btn-toggle ${toggleClass}" title="${toggleTitle}">
                        <i class="fas ${toggleIcon}"></i>
                    </button>
                    <button onclick="eliminarProveedor(${prov.id})" class="btn-accion btn-eliminar" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Filtrar proveedores por estado
function filtrarProveedores(estado, boton) {
    document.querySelectorAll('.filtro-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (boton) boton.classList.add('active');

    let filtrados;
    if (estado === 'Todos') {
        filtrados = proveedores;
    } else {
        filtrados = proveedores.filter(p => p.estado === estado);
    }
    
    renderizarProveedores(filtrados);
}

// Abrir modal para nuevo proveedor
function abrirModalProveedor() {
    proveedorEditando = null;
    document.getElementById('modalTitulo').textContent = 'Nuevo Proveedor';
    document.getElementById('nombre-proveedor').value = '';
    document.getElementById('contacto-proveedor').value = '';
    document.getElementById('telefono-proveedor').value = '';
    document.getElementById('email-proveedor').value = '';
    document.getElementById('direccion-proveedor').value = '';
    document.getElementById('notas-proveedor').value = '';
    document.getElementById('modal-proveedor').style.display = 'flex';
}

// Cerrar modal
function cerrarModalProveedor() {
    document.getElementById('modal-proveedor').style.display = 'none';
}

// Guardar proveedor
function guardarProveedor() {
    const nombre = document.getElementById('nombre-proveedor').value.trim();
    const contacto = document.getElementById('contacto-proveedor').value.trim();
    const telefono = document.getElementById('telefono-proveedor').value.trim();
    const email = document.getElementById('email-proveedor').value.trim();
    const direccion = document.getElementById('direccion-proveedor').value.trim();
    const notas = document.getElementById('notas-proveedor').value.trim();

    if (!nombre) {
        alert('❌ Por favor ingresa el nombre del proveedor');
        return;
    }

    if (proveedorEditando) {
        // Editar proveedor existente
        const index = proveedores.findIndex(p => p.id === proveedorEditando);
        if (index !== -1) {
            proveedores[index] = {
                ...proveedores[index],
                nombre: nombre,
                contacto: contacto,
                telefono: telefono,
                email: email,
                direccion: direccion,
                notas: notas
            };
        }
    } else {
        // Nuevo proveedor
        const nuevoProveedor = {
            id: Date.now(),
            nombre: nombre,
            contacto: contacto,
            telefono: telefono,
            email: email,
            direccion: direccion,
            notas: notas,
            estado: 'Activo',
            fechaRegistro: new Date().toISOString()
        };
        proveedores.unshift(nuevoProveedor);
    }

    localStorage.setItem('proveedores', JSON.stringify(proveedores));
    renderizarProveedores(proveedores);
    actualizarEstadisticas();
    cerrarModalProveedor();
    alert(proveedorEditando ? '✅ Proveedor actualizado' : '✅ Proveedor registrado');
}

// Editar proveedor
function editarProveedor(id) {
    const proveedor = proveedores.find(p => p.id === id);
    if (!proveedor) return;
    
    proveedorEditando = id;
    document.getElementById('modalTitulo').textContent = 'Editar Proveedor';
    document.getElementById('nombre-proveedor').value = proveedor.nombre || '';
    document.getElementById('contacto-proveedor').value = proveedor.contacto || '';
    document.getElementById('telefono-proveedor').value = proveedor.telefono || '';
    document.getElementById('email-proveedor').value = proveedor.email || '';
    document.getElementById('direccion-proveedor').value = proveedor.direccion || '';
    document.getElementById('notas-proveedor').value = proveedor.notas || '';
    document.getElementById('modal-proveedor').style.display = 'flex';
}

// Ver detalles del proveedor
function verDetalleProveedor(id) {
    const proveedor = proveedores.find(p => p.id === id);
    if (!proveedor) return;
    
    const comprasProveedor = compras.filter(c => c.proveedor === proveedor.nombre);
    const totalCompras = comprasProveedor.length;
    const totalGastado = comprasProveedor
        .filter(c => c.estado === 'Completada')
        .reduce((sum, c) => sum + (c.cantidad * c.precioUnitario), 0);
    
    const fechaRegistro = new Date(proveedor.fechaRegistro);
    const fechaFormateada = fechaRegistro.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const contenido = document.getElementById('detalles-contenido-proveedor');
    contenido.innerHTML = `
        <div class="detail-item">
            <span class="detail-label">ID</span>
            <span class="detail-value">#${proveedor.id}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Nombre</span>
            <span class="detail-value">${proveedor.nombre}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Contacto</span>
            <span class="detail-value">${proveedor.contacto || 'N/A'}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Teléfono</span>
            <span class="detail-value">${proveedor.telefono || 'N/A'}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Email</span>
            <span class="detail-value">${proveedor.email || 'N/A'}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Dirección</span>
            <span class="detail-value">${proveedor.direccion || 'N/A'}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Estado</span>
            <span class="detail-value"><span class="badge ${proveedor.estado.toLowerCase()}">${proveedor.estado}</span></span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Fecha Registro</span>
            <span class="detail-value">${fechaFormateada}</span>
        </div>
        <div style="margin-top:15px;padding-top:15px;border-top:2px solid #f1f5f9;">
            <p style="font-weight:600;margin-bottom:10px;">📊 Estadísticas de Compras</p>
            <div class="detail-item">
                <span class="detail-label">Compras realizadas</span>
                <span class="detail-value">${totalCompras}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Total gastado</span>
                <span class="detail-value total">$${totalGastado.toFixed(2)}</span>
            </div>
        </div>
        ${proveedor.notas ? `
            <div class="detail-item">
                <span class="detail-label">Notas</span>
                <span class="detail-value">${proveedor.notas}</span>
            </div>
        ` : ''}
    `;
    
    document.getElementById('modal-detalles-proveedor').style.display = 'flex';
}

// Cerrar modal detalles
function cerrarModalDetallesProveedor() {
    document.getElementById('modal-detalles-proveedor').style.display = 'none';
}

// Cambiar estado del proveedor (Activo/Inactivo)
function toggleEstadoProveedor(id) {
    const proveedor = proveedores.find(p => p.id === id);
    if (!proveedor) return;
    
    const nuevoEstado = proveedor.estado === 'Activo' ? 'Inactivo' : 'Activo';
    const mensaje = nuevoEstado === 'Activo' ? 
        `¿Activar el proveedor "${proveedor.nombre}"?` : 
        `¿Desactivar el proveedor "${proveedor.nombre}"? Los proveedores inactivos no aparecerán en las compras.`;
    
    if (!confirm(mensaje)) return;
    
    proveedor.estado = nuevoEstado;
    localStorage.setItem('proveedores', JSON.stringify(proveedores));
    
    // Mantener el filtro actual
    const filtroActivo = document.querySelector('.filtro-btn.active');
    if (filtroActivo) {
        const estadoFiltro = filtroActivo.textContent.trim();
        if (estadoFiltro === 'Todos' || estadoFiltro === 'Todos') {
            renderizarProveedores(proveedores);
        } else if (estadoFiltro === 'Activos') {
            renderizarProveedores(proveedores.filter(p => p.estado === 'Activo'));
        } else if (estadoFiltro === 'Inactivos') {
            renderizarProveedores(proveedores.filter(p => p.estado === 'Inactivo'));
        }
    } else {
        renderizarProveedores(proveedores);
    }
    
    actualizarEstadisticas();
    alert(`✅ Proveedor ${nuevoEstado.toLowerCase()}`);
}

// Eliminar proveedor
function eliminarProveedor(id) {
    const proveedor = proveedores.find(p => p.id === id);
    if (!proveedor) return;
    
    if (!confirm(`⚠️ ¿Estás seguro de eliminar al proveedor "${proveedor.nombre}"?`)) return;
    
    proveedores = proveedores.filter(p => p.id !== id);
    localStorage.setItem('proveedores', JSON.stringify(proveedores));
    renderizarProveedores(proveedores);
    actualizarEstadisticas();
    alert('🗑️ Proveedor eliminado');
}

// Actualizar estadísticas
function actualizarEstadisticas() {
    const total = proveedores.length;
    const activos = proveedores.filter(p => p.estado === 'Activo').length;
    const inactivos = proveedores.filter(p => p.estado === 'Inactivo').length;
    
    const totalGastado = compras
        .filter(c => c.estado === 'Completada')
        .reduce((sum, c) => sum + (c.cantidad * c.precioUnitario), 0);
    
    document.getElementById('total-proveedores').textContent = total;
    document.getElementById('proveedores-activos').textContent = activos;
    document.getElementById('proveedores-inactivos').textContent = inactivos;
    document.getElementById('total-gastado-proveedores').textContent = `$${totalGastado.toFixed(2)}`;
}

// Buscar proveedores
function buscarProveedores() {
    const busqueda = document.getElementById('buscarProveedor').value.toLowerCase().trim();
    
    if (!busqueda) {
        renderizarProveedores(proveedores);
        return;
    }
    
    const filtrados = proveedores.filter(p => 
        p.nombre.toLowerCase().includes(busqueda) ||
        p.contacto.toLowerCase().includes(busqueda) ||
        p.email.toLowerCase().includes(busqueda) ||
        p.telefono.includes(busqueda)
    );
    
    renderizarProveedores(filtrados);
}

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    cargarProveedores();
    
    const buscador = document.getElementById('buscarProveedor');
    if (buscador) {
        buscador.addEventListener('input', buscarProveedores);
    }
});

// Hacer funciones globales
window.abrirModalProveedor = abrirModalProveedor;
window.cerrarModalProveedor = cerrarModalProveedor;
window.guardarProveedor = guardarProveedor;
window.filtrarProveedores = filtrarProveedores;
window.verDetalleProveedor = verDetalleProveedor;
window.cerrarModalDetallesProveedor = cerrarModalDetallesProveedor;
window.editarProveedor = editarProveedor;
window.toggleEstadoProveedor = toggleEstadoProveedor;
window.eliminarProveedor = eliminarProveedor;
window.buscarProveedores = buscarProveedores;