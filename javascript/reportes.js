// reportes.js
let datosVentas      = [];
let datosCompras     = [];
let datosProductos   = [];
let datosMovimientos = [];
let tabActual        = 'ventas';

document.addEventListener('DOMContentLoaded', () => {
    inicializarReportes();
    document.getElementById('buscarReporte')?.addEventListener('input', renderizarContenidoReporte);
});

async function inicializarReportes() {
    try {
        const [resV, resC, resP, resM] = await Promise.all([
            window.electronAPI.obtenerVentas(),
            window.electronAPI.obtenerCompras(),
            window.electronAPI.obtenerProductos(),
            window.electronAPI.obtenerMovimientos()
        ]);

        if (resV.ok) datosVentas      = resV.data;
        if (resC.ok) datosCompras     = resC.data;
        if (resP.ok) datosProductos   = resP.data;
        if (resM.ok) datosMovimientos = resM.data;

        calcularTarjetasStats();

        // Activar tab ventas por defecto
        const btnInicial = document.querySelector('.tab-btn');
        cambiarTab('ventas', btnInicial);

    } catch (err) {
        console.error('Error inicializando reportes:', err);
    }
}

// ── KPIs superiores ──────────────────────────────────────────
function calcularTarjetasStats() {
    const totalVentas = datosVentas
        .filter(v => v.estado === 'Pagado')
        .reduce((s, v) => s + v.total, 0);

    const totalCompras = datosCompras
        .filter(c => c.estado === 'Completada')
        .reduce((s, c) => s + (c.cantidad * c.precio_unitario), 0);

    const totalProductos = datosProductos.length;
    const ganancia       = totalVentas - totalCompras;

    document.getElementById('total-ventas-reporte').textContent  = `$${totalVentas.toFixed(2)}`;
    document.getElementById('total-compras-reporte').textContent = `$${totalCompras.toFixed(2)}`;
    document.getElementById('total-productos-reporte').textContent = totalProductos;

    const elGanancia = document.getElementById('ganancia-reporte');
    elGanancia.textContent  = `$${ganancia.toFixed(2)}`;
    elGanancia.style.color  = ganancia >= 0 ? '#16a34a' : '#dc2626';
}

// ── Navegación de pestañas ───────────────────────────────────
function cambiarTab(tab, boton) {
    tabActual = tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    if (boton) boton.classList.add('active');
    renderizarContenidoReporte();
}

// ── Filtro por fecha ─────────────────────────────────────────
function filtrarPorFecha(lista) {
    const desde = document.getElementById('fecha-inicio').value;
    const hasta = document.getElementById('fecha-fin').value;
    if (!desde && !hasta) return lista;

    return lista.filter(item => {
        const f = new Date(item.fecha).setHours(0, 0, 0, 0);
        const ok_desde = desde ? f >= new Date(desde).setHours(0, 0, 0, 0) : true;
        const ok_hasta = hasta ? f <= new Date(hasta).setHours(0, 0, 0, 0) : true;
        return ok_desde && ok_hasta;
    });
}

function aplicarFiltroFecha()  { renderizarContenidoReporte(); }
function limpiarFiltroFecha()  {
    document.getElementById('fecha-inicio').value = '';
    document.getElementById('fecha-fin').value    = '';
    renderizarContenidoReporte();
}

// ── Render principal ─────────────────────────────────────────
function renderizarContenidoReporte() {
    const contenedor = document.getElementById('contenido-reporte');
    if (!contenedor) return;

    const busqueda = document.getElementById('buscarReporte')?.value.toLowerCase().trim() || '';

    switch (tabActual) {
        case 'ventas':      renderVentas(contenedor, busqueda);      break;
        case 'compras':     renderCompras(contenedor, busqueda);     break;
        case 'inventario':  renderInventario(contenedor, busqueda);  break;
        case 'productos':   renderProductos(contenedor, busqueda);   break;
    }
}

// ── Tab Ventas ───────────────────────────────────────────────
function renderVentas(contenedor, busqueda) {
    let datos = filtrarPorFecha(datosVentas);
    if (busqueda) {
        datos = datos.filter(v =>
            v.producto_nombre.toLowerCase().includes(busqueda) ||
            v.estado.toLowerCase().includes(busqueda)
        );
    }

    if (!datos.length) {
        contenedor.innerHTML = vacio('fa-shopping-cart', 'Sin ventas en este rango');
        return;
    }

    const total = datos.filter(v => v.estado === 'Pagado').reduce((s, v) => s + v.total, 0);

    contenedor.innerHTML = `
        <table class="tabla-reportes">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Fecha</th>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio Unit.</th>
                    <th>Total</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
                ${datos.map(v => `
                    <tr>
                        <td>#${v.id}</td>
                        <td>${new Date(v.fecha).toLocaleString('es-MX')}</td>
                        <td>${v.producto_nombre}</td>
                        <td>${v.cantidad}</td>
                        <td>$${v.precio_unitario.toFixed(2)}</td>
                        <td><strong>$${v.total.toFixed(2)}</strong></td>
                        <td>
                            <span class="badge ${v.estado === 'Pagado' ? 'entrada' : 'salida'}">
                                ${v.estado}
                            </span>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
            <tfoot>
                <tr style="background:#f8fafc;font-weight:700;">
                    <td colspan="5" style="padding:14px 16px;text-align:right;">Total cobrado:</td>
                    <td style="padding:14px 16px;">$${total.toFixed(2)}</td>
                    <td></td>
                </tr>
            </tfoot>
        </table>`;
}

// ── Tab Compras ──────────────────────────────────────────────
function renderCompras(contenedor, busqueda) {
    let datos = filtrarPorFecha(datosCompras);
    if (busqueda) {
        datos = datos.filter(c =>
            c.producto_nombre.toLowerCase().includes(busqueda) ||
            c.estado.toLowerCase().includes(busqueda)
        );
    }

    if (!datos.length) {
        contenedor.innerHTML = vacio('fa-truck', 'Sin compras en este rango');
        return;
    }

    const totalCompletadas = datos
        .filter(c => c.estado === 'Completada')
        .reduce((s, c) => s + c.cantidad * c.precio_unitario, 0);

    const badgeClass = { Pendiente: 'ajuste', Completada: 'entrada', Cancelada: 'salida' };

    contenedor.innerHTML = `
        <table class="tabla-reportes">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Fecha</th>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio Unit.</th>
                    <th>Total</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
                ${datos.map(c => `
                    <tr>
                        <td>#${c.id}</td>
                        <td>${new Date(c.fecha).toLocaleString('es-MX')}</td>
                        <td>${c.producto_nombre}</td>
                        <td>${c.cantidad}</td>
                        <td>$${c.precio_unitario.toFixed(2)}</td>
                        <td><strong>$${(c.cantidad * c.precio_unitario).toFixed(2)}</strong></td>
                        <td>
                            <span class="badge ${badgeClass[c.estado] || ''}">
                                ${c.estado}
                            </span>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
            <tfoot>
                <tr style="background:#f8fafc;font-weight:700;">
                    <td colspan="5" style="padding:14px 16px;text-align:right;">Total completadas:</td>
                    <td style="padding:14px 16px;">$${totalCompletadas.toFixed(2)}</td>
                    <td></td>
                </tr>
            </tfoot>
        </table>`;
}

// ── Tab Inventario ───────────────────────────────────────────
function renderInventario(contenedor, busqueda) {
    let datos = filtrarPorFecha(datosMovimientos);
    if (busqueda) {
        datos = datos.filter(m =>
            m.producto_nombre.toLowerCase().includes(busqueda) ||
            m.tipo.toLowerCase().includes(busqueda) ||
            (m.referencia || '').toLowerCase().includes(busqueda)
        );
    }

    if (!datos.length) {
        contenedor.innerHTML = vacio('fa-warehouse', 'Sin movimientos en este rango');
        return;
    }

    const icono = { Entrada: '📥', Salida: '📤', Ajuste: '⚙️' };

    contenedor.innerHTML = `
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
                ${datos.map(m => `
                    <tr>
                        <td>${new Date(m.fecha).toLocaleString('es-MX')}</td>
                        <td>
                            <span class="badge ${m.tipo.toLowerCase()}">
                                ${icono[m.tipo] || ''} ${m.tipo}
                            </span>
                        </td>
                        <td>${m.producto_nombre}</td>
                        <td>${m.referencia || 'N/A'}</td>
                        <td>${m.cantidad}</td>
                        <td>${m.usuario}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
}

// ── Tab Productos ────────────────────────────────────────────
function renderProductos(contenedor, busqueda) {
    let datos = [...datosProductos];
    if (busqueda) {
        datos = datos.filter(p => p.nombre.toLowerCase().includes(busqueda));
    }

    if (!datos.length) {
        contenedor.innerHTML = vacio('fa-box', 'Sin productos registrados');
        return;
    }

    contenedor.innerHTML = `
        <table class="tabla-reportes">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Producto</th>
                    <th>Stock</th>
                    <th>Precio Compra</th>
                    <th>Precio Venta</th>
                    <th>Margen</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
                ${datos.map(p => {
                    const margen  = p.precio_venta - p.precio_compra;
                    const pct     = p.precio_compra > 0 ? ((margen / p.precio_compra) * 100).toFixed(1) : '0.0';
                    const estado  = p.cantidad === 0 ? 'Agotado' : p.cantidad <= 5 ? 'Stock bajo' : 'OK';
                    const estCls  = p.cantidad === 0 ? 'salida' : p.cantidad <= 5 ? 'ajuste' : 'entrada';
                    return `
                    <tr>
                        <td>#${p.id}</td>
                        <td><strong>${p.nombre}</strong></td>
                        <td>${p.cantidad}</td>
                        <td>$${p.precio_compra.toFixed(2)}</td>
                        <td>$${p.precio_venta.toFixed(2)}</td>
                        <td>$${margen.toFixed(2)} <span style="color:#6b7280;font-size:12px;">(${pct}%)</span></td>
                        <td><span class="badge ${estCls}">${estado}</span></td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>`;
}

// ── Empty state helper ───────────────────────────────────────
function vacio(icon, msg) {
    return `
        <div class="empty-state">
            <i class="fas ${icon}"></i>
            <p>${msg}</p>
        </div>`;
}

// ── Exportar PDF (HTML al escritorio) ───────────────────────
async function generarReportePDF() {
    const tabla  = document.getElementById('contenido-reporte').innerHTML;
    const titulo = { ventas: 'Ventas', compras: 'Compras', inventario: 'Inventario', productos: 'Productos' }[tabActual];
    const res    = await window.electronAPI.exportarPDF({ contenido: `<h2>${titulo}</h2>${tabla}` });
    if (res.ok) alert(`✅ Reporte guardado en el escritorio:\n${res.ruta}`);
    else        alert('❌ Error al exportar: ' + res.error);
}

// ── Exportar CSV al escritorio ───────────────────────────────
async function generarReporteExcel() {
    let filas = [], columnas = [], nombre = 'Reporte';

    if (tabActual === 'ventas') {
        filas    = filtrarPorFecha(datosVentas);
        columnas = ['id', 'fecha', 'producto_nombre', 'cantidad', 'precio_unitario', 'total', 'estado'];
        nombre   = 'Ventas-Tiendita';
    } else if (tabActual === 'compras') {
        filas    = filtrarPorFecha(datosCompras);
        columnas = ['id', 'fecha', 'producto_nombre', 'cantidad', 'precio_unitario', 'estado'];
        nombre   = 'Compras-Tiendita';
    } else if (tabActual === 'inventario') {
        filas    = filtrarPorFecha(datosMovimientos);
        columnas = ['id', 'fecha', 'tipo', 'producto_nombre', 'referencia', 'cantidad', 'usuario'];
        nombre   = 'Inventario-Tiendita';
    } else if (tabActual === 'productos') {
        filas    = datosProductos;
        columnas = ['id', 'nombre', 'precio_compra', 'precio_venta', 'cantidad'];
        nombre   = 'Productos-Tiendita';
    }

    const res = await window.electronAPI.exportarCSV({ filas, columnas, nombre });
    if (res.ok) alert(`✅ CSV guardado en el escritorio:\n${res.ruta}`);
    else        alert('❌ Error al exportar: ' + res.error);
}

// ── Globals ──────────────────────────────────────────────────
window.cambiarTab         = cambiarTab;
window.aplicarFiltroFecha = aplicarFiltroFecha;
window.limpiarFiltroFecha = limpiarFiltroFecha;
window.generarReportePDF  = generarReportePDF;
window.generarReporteExcel = generarReporteExcel;