// reportes.js
let ventas = [];
let compras = [];
let productos = [];
let movimientos = [];
let tabActual = 'ventas';

// Cargar datos al iniciar
async function cargarReportes() {
    try {
        // Cargar ventas
        const ventasGuardadas = localStorage.getItem("ventas");
        if (ventasGuardadas) {
            ventas = JSON.parse(ventasGuardadas);
        } else {
            ventas = [];
        }
        
        // Cargar compras
        const comprasGuardadas = localStorage.getItem("compras");
        if (comprasGuardadas) {
            compras = JSON.parse(comprasGuardadas);
        } else {
            compras = [];
        }
        
        // Cargar productos
        if (window.electronAPI && window.electronAPI.obtenerProductos) {
            const res = await window.electronAPI.obtenerProductos();
            if (res && res.ok) {
                productos = res.data;
            }
        } else {
            const productosGuardados = localStorage.getItem("productos");
            if (productosGuardados) {
                productos = JSON.parse(productosGuardados);
            } else {
                productos = [];
            }
        }
        
        // Cargar movimientos de inventario
        const movimientosGuardados = localStorage.getItem("movimientos");
        if (movimientosGuardados) {
            movimientos = JSON.parse(movimientosGuardados);
        } else {
            movimientos = [];
        }
        
        // Actualizar estadísticas
        actualizarEstadisticas();
        
        // Mostrar tab por defecto
        mostrarTabVentas();
        
    } catch (error) {
        console.error("Error al cargar datos:", error);
        document.getElementById('contenido-reporte').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al cargar los datos</p>
                <span>${error.message}</span>
            </div>
        `;
    }
}

// Actualizar estadísticas
function actualizarEstadisticas() {
    // Total ventas
    const totalVentas = ventas
        .filter(v => v.estado === 'Pagado')
        .reduce((sum, v) => sum + v.total, 0);
    
    // Total compras completadas
    const totalCompras = compras
        .filter(c => c.estado === 'Completada')
        .reduce((sum, c) => sum + (c.cantidad * c.precioUnitario), 0);
    
    // Total productos
    const totalProductos = productos.length;
    
    // Ganancia estimada (ventas - compras)
    const ganancia = totalVentas - totalCompras;
    
    document.getElementById('total-ventas-reporte').textContent = `$${totalVentas.toFixed(2)}`;
    document.getElementById('total-compras-reporte').textContent = `$${totalCompras.toFixed(2)}`;
    document.getElementById('total-productos-reporte').textContent = totalProductos;
    document.getElementById('ganancia-reporte').textContent = `$${ganancia.toFixed(2)}`;
}

// Cambiar pestaña
function cambiarTab(tab, boton) {
    tabActual = tab;
    
    // Actualizar botones
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (boton) boton.classList.add('active');
    
    // Mostrar contenido según pestaña
    switch(tab) {
        case 'ventas':
            mostrarTabVentas();
            break;
        case 'compras':
            mostrarTabCompras();
            break;
        case 'inventario':
            mostrarTabInventario();
            break;
        case 'productos':
            mostrarTabProductos();
            break;
    }
}

// Mostrar reporte de ventas
function mostrarTabVentas() {
    const container = document.getElementById('contenido-reporte');
    
    if (ventas.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shopping-cart"></i>
                <p>No hay ventas registradas</p>
                <span>Las ventas aparecerán aquí cuando se registren</span>
            </div>
        `;
        return;
    }
    
    let html = `
        <table class="tabla-reportes">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Total</th>
                    <th>Método</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    const ventasFiltradas = aplicarFiltroFechaVentas(ventas);
    
    ventasFiltradas.forEach(v => {
        const fecha = new Date(v.fecha);
        const fechaFormateada = fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        html += `
            <tr>
                <td>#${v.id}</td>
                <td>${fechaFormateada}</td>
                <td>${v.cliente}</td>
                <td>${v.producto}</td>
                <td>${v.cantidad}</td>
                <td><strong>$${v.total.toFixed(2)}</strong></td>
                <td>${v.metodoPago}</td>
                <td><span class="badge ${v.estado === 'Pagado' ? 'venta' : 'cancelada'}">${v.estado}</span></td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
            <tfoot>
                <tr style="background:#f8fafc;font-weight:bold;">
                    <td colspan="5" style="text-align:right;">Total:</td>
                    <td>$${ventasFiltradas.reduce((sum, v) => sum + v.total, 0).toFixed(2)}</td>
                    <td colspan="2"></td>
                </tr>
            </tfoot>
        </table>
    `;
    
    container.innerHTML = html;
}

// Mostrar reporte de compras
function mostrarTabCompras() {
    const container = document.getElementById('contenido-reporte');
    
    if (compras.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-truck"></i>
                <p>No hay compras registradas</p>
                <span>Las compras aparecerán aquí cuando se registren</span>
            </div>
        `;
        return;
    }
    
    let html = `
        <table class="tabla-reportes">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Fecha</th>
                    <th>Proveedor</th>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Total</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    const comprasFiltradas = aplicarFiltroFechaCompras(compras);
    
    comprasFiltradas.forEach(c => {
        const fecha = new Date(c.fecha);
        const fechaFormateada = fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const total = c.cantidad * c.precioUnitario;
        
        html += `
            <tr>
                <td>#${c.id}</td>
                <td>${fechaFormateada}</td>
                <td>${c.proveedor}</td>
                <td>${c.producto}</td>
                <td>${c.cantidad}</td>
                <td><strong>$${total.toFixed(2)}</strong></td>
                <td><span class="badge ${c.estado.toLowerCase()}">${c.estado}</span></td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
            <tfoot>
                <tr style="background:#f8fafc;font-weight:bold;">
                    <td colspan="5" style="text-align:right;">Total:</td>
                    <td>$${comprasFiltradas.reduce((sum, c) => sum + (c.cantidad * c.precioUnitario), 0).toFixed(2)}</td>
                    <td></td>
                </tr>
            </tfoot>
        </table>
    `;
    
    container.innerHTML = html;
}

// Mostrar reporte de inventario
function mostrarTabInventario() {
    const container = document.getElementById('contenido-reporte');
    
    if (movimientos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-warehouse"></i>
                <p>No hay movimientos de inventario</p>
                <span>Los movimientos aparecerán aquí cuando se registren</span>
            </div>
        `;
        return;
    }
    
    let html = `
        <table class="tabla-reportes">
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Producto</th>
                    <th>Referencia</th>
                    <th>Cantidad</th>
                    <th>Usuario</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    movimientos.forEach(m => {
        const fecha = new Date(m.fecha);
        const fechaFormateada = fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const tipoClass = m.tipo.toLowerCase();
        
        html += `
            <tr>
                <td>${fechaFormateada}</td>
                <td><span class="badge ${tipoClass}">${m.tipo}</span></td>
                <td>${m.producto}</td>
                <td>${m.referencia || 'N/A'}</td>
                <td>${m.cantidad}</td>
                <td>${m.usuario || 'Administrador'}</td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// Mostrar reporte de productos
function mostrarTabProductos() {
    const container = document.getElementById('contenido-reporte');
    
    if (productos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box"></i>
                <p>No hay productos registrados</p>
                <span>Los productos aparecerán aquí cuando se registren</span>
            </div>
        `;
        return;
    }
    
    let html = `
        <table class="tabla-reportes">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Producto</th>
                    <th>Stock</th>
                    <th>Precio Compra</th>
                    <th>Precio Venta</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    productos.forEach(p => {
        const estado = p.cantidad === 0 ? 'Agotado' : 
                      p.cantidad <= 5 ? 'Stock Bajo' : 'Disponible';
        const estadoClass = estado === 'Agotado' ? 'cancelada' : 
                           estado === 'Stock Bajo' ? 'pendiente' : 'completada';
        
        html += `
            <tr>
                <td>#${p.id}</td>
                <td><strong>${p.nombre}</strong></td>
                <td>${p.cantidad}</td>
                <td>$${p.precio_compra?.toFixed(2) || '0.00'}</td>
                <td>$${p.precio_venta?.toFixed(2) || '0.00'}</td>
                <td><span class="badge ${estadoClass}">${estado}</span></td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// Filtros de fecha para ventas
function aplicarFiltroFechaVentas(datos) {
    const fechaInicio = document.getElementById('fecha-inicio').value;
    const fechaFin = document.getElementById('fecha-fin').value;
    
    if (!fechaInicio && !fechaFin) return datos;
    
    return datos.filter(v => {
        const fecha = new Date(v.fecha).toISOString().split('T')[0];
        if (fechaInicio && fechaFin) {
            return fecha >= fechaInicio && fecha <= fechaFin;
        }
        if (fechaInicio) return fecha >= fechaInicio;
        if (fechaFin) return fecha <= fechaFin;
        return true;
    });
}

// Filtros de fecha para compras
function aplicarFiltroFechaCompras(datos) {
    const fechaInicio = document.getElementById('fecha-inicio').value;
    const fechaFin = document.getElementById('fecha-fin').value;
    
    if (!fechaInicio && !fechaFin) return datos;
    
    return datos.filter(c => {
        const fecha = new Date(c.fecha).toISOString().split('T')[0];
        if (fechaInicio && fechaFin) {
            return fecha >= fechaInicio && fecha <= fechaFin;
        }
        if (fechaInicio) return fecha >= fechaInicio;
        if (fechaFin) return fecha <= fechaFin;
        return true;
    });
}

// Aplicar filtro de fecha
function aplicarFiltroFecha() {
    switch(tabActual) {
        case 'ventas':
            mostrarTabVentas();
            break;
        case 'compras':
            mostrarTabCompras();
            break;
        case 'inventario':
            mostrarTabInventario();
            break;
        case 'productos':
            mostrarTabProductos();
            break;
    }
}

// Limpiar filtro de fecha
function limpiarFiltroFecha() {
    document.getElementById('fecha-inicio').value = '';
    document.getElementById('fecha-fin').value = '';
    aplicarFiltroFecha();
}

// Generar PDF (simulado)
function generarReportePDF() {
    alert('📄 Generando reporte PDF...\n\nEsta función descargará un PDF con el reporte actual.');
}

// Generar Excel (simulado)
function generarReporteExcel() {
    alert('📊 Generando reporte Excel...\n\nEsta función descargará un archivo Excel con el reporte actual.');
}

// Buscar en reportes
function buscarReportes() {
    const busqueda = document.getElementById('buscarReporte').value.toLowerCase().trim();
    // La búsqueda se implementa según la pestaña actual
    aplicarFiltroFecha();
}

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    cargarReportes();
    
    const buscador = document.getElementById('buscarReporte');
    if (buscador) {
        buscador.addEventListener('input', buscarReportes);
    }
});

// Hacer funciones globales
window.cambiarTab = cambiarTab;
window.aplicarFiltroFecha = aplicarFiltroFecha;
window.limpiarFiltroFecha = limpiarFiltroFecha;
window.generarReportePDF = generarReportePDF;
window.generarReporteExcel = generarReporteExcel;
window.buscarReportes = buscarReportes;