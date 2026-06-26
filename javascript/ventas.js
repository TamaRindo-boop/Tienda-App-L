let ventas = [];
let productos = [];

async function cargarDatos() {
    try {
        const [resV, resP] = await Promise.all([
            window.electronAPI.obtenerVentas(),
            window.electronAPI.obtenerProductos()
        ]);
        if (resV.ok) ventas = resV.data;
        if (resP.ok) productos = resP.data;
        renderizarVentas();
        actualizarResumen();
    } catch (err) {
        console.error('Error en cargarDatos:', err);
    }
}

function abrirModalVenta() {
    const sel = document.getElementById('producto-select');
    sel.innerHTML = '<option value="">Seleccionar producto...</option>';
    productos.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.dataset.precio = p.precio_venta;
        opt.dataset.stock  = p.cantidad;
        opt.textContent    = `${p.nombre} — Stock: ${p.cantidad} — $${p.precio_venta.toFixed(2)}`;
        sel.appendChild(opt);
    });

    document.getElementById('cantidad-venta').value  = '1';
    document.getElementById('precio-unitario').value = '';
    document.getElementById('subtotal').value        = '';
    document.getElementById('modal-venta').style.display = 'flex';

    const calcular = () => {
        const opt    = sel.options[sel.selectedIndex];
        const precio = opt ? parseFloat(opt.dataset.precio) || 0 : 0;
        const cant   = parseInt(document.getElementById('cantidad-venta').value) || 0;
        document.getElementById('precio-unitario').value = precio ? `$${precio.toFixed(2)}` : '';
        document.getElementById('subtotal').value        = precio ? `$${(precio * cant).toFixed(2)}` : '';
    };

    sel.onchange = calcular;
    document.getElementById('cantidad-venta').oninput = calcular;
}

function cerrarModalVenta() {
    document.getElementById('modal-venta').style.display = 'none';
}

async function guardarVenta() {
    const sel            = document.getElementById('producto-select');
    const productoId     = parseInt(sel.value);
    const productoNombre = sel.options[sel.selectedIndex]?.text.split('—')[0].trim();
    const cantidad       = parseInt(document.getElementById('cantidad-venta').value);

    if (!productoId)           return alert('❌ Seleccione un producto');
    if (!cantidad || cantidad < 1) return alert('❌ Cantidad inválida');

    // Verificar stock en frontend también
    const prod = productos.find(p => p.id === productoId);
    if (prod && prod.cantidad < cantidad) {
        return alert(`❌ Stock insuficiente (disponible: ${prod.cantidad})`);
    }

    const res = await window.electronAPI.guardarVenta({ productoId, productoNombre, cantidad });

    if (res.ok) {
        await cargarDatos();
        cerrarModalVenta();
        alert('✅ Venta registrada');
    } else {
        alert('❌ ' + res.error);
    }
}

function verDetalleVenta(id) {
    const v = ventas.find(v => v.id === id);
    if (!v) return;
    document.getElementById('detalles-contenido').innerHTML = `
        <p><strong>ID:</strong> #${v.id}</p>
        <p><strong>Fecha:</strong> ${new Date(v.fecha).toLocaleString('es-MX')}</p>
        <p><strong>Producto:</strong> ${v.producto_nombre}</p>
        <p><strong>Cantidad:</strong> ${v.cantidad}</p>
        <p><strong>Precio Unitario:</strong> $${v.precio_unitario.toFixed(2)}</p>
        <p><strong>Total:</strong> $${v.total.toFixed(2)}</p>
        <p><strong>Estado:</strong> ${v.estado}</p>
    `;
    document.getElementById('modal-detalles').style.display = 'flex';
}

function cerrarModalDetalles() {
    document.getElementById('modal-detalles').style.display = 'none';
}

async function anularVenta(id) {
    if (!confirm('⚠️ ¿Anular esta venta?')) return;
    const res = await window.electronAPI.anularVenta({ id });
    if (res.ok) { await cargarDatos(); alert('✅ Venta anulada'); }
    else alert('❌ ' + res.error);
}

function renderizarVentas() {
    const tbody = document.getElementById('tabla-ventas');
    const q     = document.getElementById('buscador-ventas')?.value.toLowerCase() || '';
    const lista = q
        ? ventas.filter(v => v.producto_nombre.toLowerCase().includes(q))
        : ventas;

    if (!lista.length) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:#94a3b8;">🛒 No hay ventas registradas</td></tr>`;
        return;
    }

    tbody.innerHTML = lista.map(v => `
        <tr>
            <td>#${v.id}</td>
            <td>${new Date(v.fecha).toLocaleString('es-MX')}</td>
            <td>${v.producto_nombre}</td>
            <td>${v.cantidad}</td>
            <td>$${v.precio_unitario.toFixed(2)}</td>
            <td>$${v.total.toFixed(2)}</td>
            <td>
                <button class="btn-ver-detalle" onclick="verDetalleVenta(${v.id})"><i class="fas fa-eye"></i></button>
                ${v.estado === 'Pagado'
                    ? `<button class="btn-anular" onclick="anularVenta(${v.id})"><i class="fas fa-ban"></i></button>`
                    : `<span style="color:#dc2626;font-size:12px;font-weight:600;">ANULADO</span>`}
            </td>
        </tr>
    `).join('');
}

function actualizarResumen() {
    const pagadas  = ventas.filter(v => v.estado === 'Pagado');
    const total    = pagadas.reduce((s, v) => s + v.total, 0);
    const hoy      = new Date().toDateString();
    const hoyTotal = pagadas.filter(v => new Date(v.fecha).toDateString() === hoy)
                            .reduce((s, v) => s + v.total, 0);

    document.getElementById('total-ventas').textContent        = `$${total.toFixed(2)}`;
    document.getElementById('total-transacciones').textContent = pagadas.length;
    document.getElementById('ventas-hoy').textContent          = `$${hoyTotal.toFixed(2)}`;
}

document.addEventListener('DOMContentLoaded', () => {
    cargarDatos();
    document.getElementById('btn-nueva-venta')?.addEventListener('click', abrirModalVenta);
    document.getElementById('buscador-ventas')?.addEventListener('input', renderizarVentas);
});

window.onclick = (e) => {
    if (e.target === document.getElementById('modal-venta'))    cerrarModalVenta();
    if (e.target === document.getElementById('modal-detalles')) cerrarModalDetalles();
};

window.abrirModalVenta    = abrirModalVenta;
window.cerrarModalVenta   = cerrarModalVenta;
window.guardarVenta       = guardarVenta;
window.verDetalleVenta    = verDetalleVenta;
window.cerrarModalDetalles = cerrarModalDetalles;
window.anularVenta        = anularVenta;