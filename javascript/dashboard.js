// ============================================
// DASHBOARD - LÓGICA COMPLETA
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    if (window.electronAPI) {
        cargarDashboardCompleto();
    } else {
        console.warn('⚠️ electronAPI no disponible — usando datos de ejemplo');
        cargarDatosEjemplo();
    }
});

// ---------- Carga real con electronAPI ----------
async function cargarDashboardCompleto() {
    try {
        // 1. Obtener datos
        const [resProd, resVen] = await Promise.all([
            window.electronAPI.obtenerProductos(),
            window.electronAPI.obtenerVentas()
        ]);

        const productos = resProd.ok ? resProd.data : [];
        const ventas = resVen.ok ? resVen.data : [];

        // 2. Procesar métricas
        const metrics = procesarMetricas(productos, ventas);
        
        // 3. Renderizar todo
        renderizarMetricas(metrics);
        renderizarVentasRecientes(ventas);
        renderizarProductosPopulares(ventas, productos);
        renderizarStockCritico(productos);

    } catch (error) {
        console.error('❌ Error al cargar dashboard:', error);
        cargarDatosEjemplo();
    }
}

// ---------- Procesar métricas ----------
function procesarMetricas(productos, ventas) {
    const hoy = new Date().toDateString();
    const mesActual = new Date().getMonth();
    const añoActual = new Date().getFullYear();

    // Ventas pagadas
    const pagadas = ventas.filter(v => v.estado === 'Pagado');

    // Ventas de hoy
    const ventasHoy = pagadas.filter(v => new Date(v.fecha).toDateString() === hoy);
    const totalHoy = ventasHoy.reduce((sum, v) => sum + v.total, 0);

    // Ventas del mes
    const ventasMes = pagadas.filter(v => {
        const d = new Date(v.fecha);
        return d.getMonth() === mesActual && d.getFullYear() === añoActual;
    });
    const totalMes = ventasMes.reduce((sum, v) => sum + v.total, 0);

    // Stock bajo
    const stockBajo = productos.filter(p => p.cantidad <= 5 && p.cantidad > 0).length;

    return {
        totalProductos: productos.length,
        ventasHoy: totalHoy,
        cantidadVentasHoy: ventasHoy.length,
        stockBajo: stockBajo,
        ingresosMes: totalMes
    };
}

// ---------- Renderizar métricas ----------
function renderizarMetricas(metrics) {
    const grid = document.getElementById('metricas-grid');
    
    const metricasHTML = `
        <div class="metric-card">
            <div class="label"><i class="fas fa-box"></i> Productos</div>
            <div class="value">${metrics.totalProductos}</div>
            <div class="sub">en catálogo</div>
        </div>
        <div class="metric-card">
            <div class="label"><i class="fas fa-dollar-sign"></i> Ventas hoy</div>
            <div class="value">$${metrics.ventasHoy.toFixed(2)}</div>
            <div class="sub">${metrics.cantidadVentasHoy} transacciones</div>
        </div>
        <div class="metric-card">
            <div class="label"><i class="fas fa-exclamation-triangle"></i> Stock bajo</div>
            <div class="value">${metrics.stockBajo}</div>
            <div class="sub">productos con ≤ 5 unidades</div>
        </div>
        <div class="metric-card">
            <div class="label"><i class="fas fa-tag"></i> Ingresos (mes)</div>
            <div class="value">$${metrics.ingresosMes.toFixed(2)}</div>
            <div class="sub">este mes</div>
        </div>
    `;
    
    grid.innerHTML = metricasHTML;
}

// ---------- Renderizar ventas recientes ----------
function renderizarVentasRecientes(ventas) {
    const pagadas = ventas.filter(v => v.estado === 'Pagado');
    const recientes = pagadas
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .slice(0, 5);

    const tbody = document.getElementById('ventas-recientes-body');
    
    if (recientes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="empty-text">Sin ventas recientes</td></tr>`;
        return;
    }

    tbody.innerHTML = recientes.map(v => `
        <tr>
            <td>${v.cliente || 'Cliente'}</td>
            <td><strong>$${v.total.toFixed(2)}</strong></td>
            <td><span class="badge-estado ${v.estado === 'Pendiente' ? 'pendiente' : ''}">${v.estado || 'Pagado'}</span></td>
        </tr>
    `).join('');
}

// ---------- Renderizar productos populares ----------
function renderizarProductosPopulares(ventas, productos) {
    const pagadas = ventas.filter(v => v.estado === 'Pagado');
    const ventasConItems = pagadas.filter(v => v.items && v.items.length > 0);
    
    // Contar frecuencia de productos
    const freq = {};
    ventasConItems.forEach(v => {
        v.items.forEach(item => {
            const key = item.id || item.nombre;
            if (key) {
                freq[key] = (freq[key] || 0) + (item.cantidad || 1);
            }
        });
    });

    // Obtener top 5
    const populares = Object.keys(freq).length > 0
        ? Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5)
        : productos.slice(0, 5).map(p => [p.nombre || p.id, Math.floor(Math.random() * 20) + 1]);

    const lista = document.getElementById('populares-lista');
    
    if (populares.length === 0) {
        lista.innerHTML = `<div class="empty-text">Sin datos aún</div>`;
        return;
    }

    lista.innerHTML = populares.map(([nombre, ventasCount]) => `
        <div class="popular-item">
            <span class="nombre">${nombre}</span>
            <span class="ventas">${ventasCount} ventas</span>
        </div>
    `).join('');
}

// ---------- Renderizar stock crítico ----------
function renderizarStockCritico(productos) {
    const criticos = productos
        .filter(p => p.cantidad <= 3 && p.cantidad > 0)
        .slice(0, 6);

    const div = document.getElementById('stock-critico-lista');
    
    if (criticos.length === 0) {
        div.innerHTML = `<div class="empty-text">✅ Todos los productos tienen stock suficiente</div>`;
        return;
    }

    div.innerHTML = criticos.map(p => `
        <div class="popular-item">
            <span class="nombre">${p.nombre || p.id}</span>
            <span class="ventas danger">${p.cantidad} unidades</span>
        </div>
    `).join('');
}

// ---------- DATOS DE EJEMPLO (FALLBACK) ----------
function cargarDatosEjemplo() {
    const productos = [
        { id: 1, nombre: 'Arroz 1kg', cantidad: 12 },
        { id: 2, nombre: 'Frijoles 500g', cantidad: 4 },
        { id: 3, nombre: 'Aceite 1L', cantidad: 2 },
        { id: 4, nombre: 'Azúcar 1kg', cantidad: 8 },
        { id: 5, nombre: 'Leche 1L', cantidad: 6 },
    ];

    const ventas = [
        { cliente: 'María López', total: 45.50, estado: 'Pagado', fecha: new Date().toISOString(), items: [{ nombre: 'Arroz 1kg', cantidad: 2 }] },
        { cliente: 'Juan Pérez', total: 120.00, estado: 'Pagado', fecha: new Date().toISOString(), items: [{ nombre: 'Aceite 1L', cantidad: 1 }] },
        { cliente: 'Ana Gómez', total: 28.00, estado: 'Pendiente', fecha: new Date(Date.now() - 86400000).toISOString(), items: [{ nombre: 'Frijoles 500g', cantidad: 1 }] },
    ];

    const metrics = procesarMetricas(productos, ventas);
    renderizarMetricas(metrics);
    renderizarVentasRecientes(ventas);
    renderizarProductosPopulares(ventas, productos);
    renderizarStockCritico(productos);
}

// ---------- NAVEGACIÓN ----------
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('ver-todas-ventas')?.addEventListener('click', (e) => {
        e.preventDefault();
        // Redirigir a la página de ventas
        window.location.href = 'ventas.html';
    });

    document.getElementById('ver-todos-productos')?.addEventListener('click', (e) => {
        e.preventDefault();
        // Redirigir a la página de productos
        window.location.href = 'productos.html';
    });
});