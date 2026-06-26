let datosVentas = [];
let datosCompras = [];
let datosProductos = [];
let tabActual = 'ventas';

document.addEventListener("DOMContentLoaded", () => {
    inicializarReportes();
});

async function inicializarReportes() {
    try {
        // Carga simultánea de todas las entidades para cruce de métricas
        datosVentas = await window.api.obtenerVentas();
        datosCompras = await window.api.obtenerCompras();
        datosProductos = await window.api.obtenerProductos();

        calcularTarjetasStats();
        cambiarTab('ventas', document.querySelector(".tab-btn"));
    } catch (error) {
        console.error("Error inicializando reporte integral:", error);
    }
}

// Calcula las tarjetas de estado globales (KPIs) de la zona superior
function calcularTarjetasStats() {
    const totalVentas = datosVentas.reduce((sum, v) => sum + v.total, 0);
    // Solo compras concretadas generan egreso real
    const totalCompras = datosCompras.filter(c => c.estado === 'Completada').reduce((sum, c) => sum + (c.cantidad * c.precio_unitario_compra), 0);
    const totalStockProductos = datosProductos.reduce((sum, p) => sum + p.cantidad, 0);
    
    // Ganancia Real Estimada = Total Ventas - Costo de Ventas (Egresos Completados)
    const ganancia = totalVentas - totalCompras;

    document.getElementById("total-ventas-reporte").textContent = `$${totalVentas.toFixed(2)}`;
    document.getElementById("total-compras-reporte").textContent = `$${totalCompras.toFixed(2)}`;
    document.getElementById("total-productos-reporte").textContent = totalStockProductos;
    
    const txtGanancia = document.getElementById("ganancia-reporte");
    txtGanancia.textContent = `$${ganancia.toFixed(2)}`;
    txtGanancia.style.color = ganancia >= 0 ? "#16a34a" : "#dc2626";
}

// Control de navegación entre Pestañas de Reportes (Ventas, Compras, Inventarios, Productos)
function cambiarTab(tab, boton) {
    tabActual = tab;
    const botones = document.querySelectorAll(".tab-btn");
    botones.forEach(b => b.classList.remove("active"));
    boton.classList.add("active");

    renderizarContenidoReporte();
}

// Filtrar registros en base a rango de fechas si se definieron
function obtenerDatosFiltradosPorFecha(listado, campoFecha) {
    const inicioInput = document.getElementById("fecha-inicio").value;
    const finInput = document.getElementById("fecha-fin").value;

    if (!inicioInput && !finInput) return listado;

    return listado.filter(item => {
        const fechaItem = new Date(item[campoFecha]).setHours(0,0,0,0);
        let pasaInicio = true;
        let pasaFin = true;

        if (inicioInput) {
            pasaInicio = fechaItem >= new Date(inicioInput).setHours(0,0,0,0);
        }
        if (finInput) {
            pasaFin = fechaItem <= new Date(finInput).setHours(0,0,0,0);
        }
        return pasaInicio && pasaFin;
    });
}

function aplicarFiltroFecha() {
    renderizarContenidoReporte();
}

function limpiarFiltroFecha() {
    document.getElementById("fecha-inicio").value = "";
    document.getElementById("fecha-fin").value = "";
    renderizarContenidoReporte();
}

// Renderiza dinámicamente tablas completas según la pestaña activa
function renderizarContenidoReporte() {
    const contenedor = document.getElementById("contenido-reporte");
    if (!contenedor) return;

    if (tabActual === 'ventas') {
        const filtradas = obtenerDatosFiltradosPorFecha(datosVentas, 'fecha');
        let html = `
            <table class="tabla-productos">
                <thead>
                    <tr><th>ID Venta</th><th>Fecha</th><th>Cliente</th><th>Producto</th><th>Cantidad</th><th>Total</th></tr>
                </thead>
                <tbody>
        `;
        if (filtradas.length === 0) html += `<tr><td colspan="6" style="text-align:center;">No hay registros en el rango.</td></tr>`;
        filtradas.forEach(v => {
            html += `<tr><td>#VT-${v.id_venta}</td><td>${new Date(v.fecha).toLocaleDateString()}</td><td>${v.cliente}</td><td>${v.nombre_producto}</td><td>${v.cantidad}</td><td>$${v.total.toFixed(2)}</td></tr>`;
        });
        html += `</tbody></table>`;
        contenedor.innerHTML = html;

    } else if (tabActual === 'compras') {
        const filtradas = obtenerDatosFiltradosPorFecha(datosCompras, 'fecha');
        let html = `
            <table class="tabla-productos">
                <thead>
                    <tr><th>ID Compra</th><th>Fecha</th><th>Proveedor</th><th>Producto</th><th>Cantidad</th><th>Total</th><th>Estado</th></tr>
                </thead>
                <tbody>
        `;
        if (filtradas.length === 0) html += `<tr><td colspan="7" style="text-align:center;">No hay registros en el rango.</td></tr>`;
        filtradas.forEach(c => {
            const tot = (c.cantidad * c.precio_unitario_compra).toFixed(2);
            html += `<tr><td>#CP-${c.id_compra}</td><td>${new Date(c.fecha).toLocaleDateString()}</td><td>${c.proveedor}</td><td>${c.nombre_producto}</td><td>${c.cantidad}</td><td>$${tot}</td><td>${c.estado}</td></tr>`;
        });
        html += `</tbody></table>`;
        contenedor.innerHTML = html;

    } else if (tabActual === 'productos') {
        let html = `
            <table class="tabla-productos">
                <thead>
                    <tr><th>ID</th><th>Nombre Producto</th><th>Precio Compra</th><th>Precio Venta</th><th>Stock actual</th><th>Margen Ganancia</th></tr>
                </thead>
                <tbody>
        `;
        datosProductos.forEach(p => {
            const margen = (p.precio_venta - p.precio_compra).toFixed(2);
            html += `<tr><td>${p.id}</td><td><strong>${p.nombre}</strong></td><td>$${p.precio_compra.toFixed(2)}</td><td>$${p.precio_venta.toFixed(2)}</td><td>${p.cantidad}</td><td>$${margen}</td></tr>`;
        });
        html += `</tbody></table>`;
        contenedor.innerHTML = html;
        
    } else if (tabActual === 'inventario') {
        // Traer asíncronamente el historial completo de movimientos para auditoría en reportes
        window.api.obtenerMovimientos().then(movs => {
            const filtradas = obtenerDatosFiltradosPorFecha(movs, 'fecha');
            let html = `
                <table class="tabla-productos">
                    <thead>
                        <tr><th>Fecha</th><th>Tipo</th><th>Producto</th><th>Referencia</th><th>Cantidad</th><th>Operador</th></tr>
                    </thead>
                    <tbody>
            `;
            if (filtradas.length === 0) html += `<tr><td colspan="6" style="text-align:center;">No hay movimientos en el rango.</td></tr>`;
            filtradas.forEach(m => {
                html += `<tr><td>${new Date(m.fecha).toLocaleString()}</td><td>${m.tipo_movimiento}</td><td>${m.nombre_producto}</td><td>${m.referencia || '-'}</td><td>${m.cantidad}</td><td>${m.usuario || 'Admin'}</td></tr>`;
            });
            html += `</tbody></table>`;
            contenedor.innerHTML = html;
        });
    }
}

// Funciones para interactuar con librerías externas o PDF de Electron (ahora enviando al escritorio)
async function generarReportePDF() {
    const tabla = document.getElementById('contenido-reporte').innerHTML;
    const titulo = { ventas: 'Ventas', compras: 'Compras', inventario: 'Inventario', productos: 'Productos' }[tabActual];
    
    const contenido = `<h2>${titulo}</h2>${tabla}`;
    const res = await window.electronAPI.exportarPDF({ contenido });
    
    if (res.ok) alert(`✅ Reporte guardado en el escritorio:\n${res.ruta}`);
    else alert('❌ Error al exportar: ' + res.error);
}

async function generarReporteExcel() {
    let filas = [];
    let columnas = [];
    let nombre = 'Reporte';

    if (tabActual === 'ventas') {
        columnas = ['id', 'fecha', 'cliente', 'producto_nombre', 'cantidad', 'precio_unitario', 'total', 'metodo_pago', 'estado'];
        filas    = filtrarPorFecha(ventas);
        nombre   = 'Ventas-Tiendita';
    } else if (tabActual === 'compras') {
        columnas = ['id', 'fecha', 'producto_nombre', 'cantidad', 'precio_unitario', 'estado'];
        filas    = filtrarPorFecha(compras);
        nombre   = 'Compras-Tiendita';
    } else if (tabActual === 'inventario') {
        columnas = ['id', 'fecha', 'tipo', 'producto_nombre', 'referencia', 'cantidad', 'usuario'];
        filas    = movimientos;
        nombre   = 'Inventario-Tiendita';
    } else if (tabActual === 'productos') {
        columnas = ['id', 'nombre', 'precio_compra', 'precio_venta', 'cantidad'];
        filas    = productos;
        nombre   = 'Productos-Tiendita';
    }

    const res = await window.electronAPI.exportarCSV({ filas, columnas, nombre });
    if (res.ok) alert(`✅ CSV guardado en el escritorio:\n${res.ruta}`);
    else alert('❌ Error al exportar: ' + res.error);
}