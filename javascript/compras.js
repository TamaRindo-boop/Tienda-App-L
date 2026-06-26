let compras = [];
let productos = [];

async function cargarCompras() {
    const [resC, resP] = await Promise.all([
        window.electronAPI.obtenerCompras(),
        window.electronAPI.obtenerProductos()
    ]);
    if (resC.ok) compras = resC.data;
    if (resP.ok) productos = resP.data;
    renderizarCompras(compras);
}

function renderizarCompras(datos) {
    const tbody = document.getElementById('tablaCompras');
    if (!datos?.length) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:30px;color:#94a3b8;">📭 Sin compras registradas</td></tr>`;
        return;
    }
    const iconos = { Pendiente: '⏳', Completada: '✅', Cancelada: '❌' };
    tbody.innerHTML = datos.map(c => {
        const total = c.cantidad * c.precio_unitario;
        const fecha = new Date(c.fecha).toLocaleString('es-MX');
        return `
        <tr>
            <td>#${c.id}</td>
            <td>${fecha}</td>
            <td>${c.producto_nombre}</td>
            <td>${c.cantidad}</td>
            <td>$${c.precio_unitario.toFixed(2)}</td>
            <td><strong>$${total.toFixed(2)}</strong></td>
            <td><span class="badge ${c.estado.toLowerCase()}">${iconos[c.estado] || ''} ${c.estado}</span></td>
            <td>
                <button onclick="verDetalleCompra(${c.id})" class="btn-accion btn-ver" title="Ver"><i class="fas fa-eye"></i></button>
                ${c.estado === 'Pendiente' ? `
                    <button onclick="completarCompra(${c.id})" class="btn-accion btn-completar" title="Completar"><i class="fas fa-check"></i></button>
                    <button onclick="cancelarCompra(${c.id})" class="btn-accion btn-cancelar-accion" title="Cancelar"><i class="fas fa-times"></i></button>
                ` : ''}
                <button onclick="eliminarCompra(${c.id})" class="btn-accion btn-eliminar" title="Eliminar"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    }).join('');
}

function filtrarCompras(estado, boton) {
    document.querySelectorAll('.filtros button').forEach(b => b.classList.remove('activo'));
    if (boton) boton.classList.add('activo');
    renderizarCompras(estado === 'Todos' ? compras : compras.filter(c => c.estado === estado));
}

function abrirModalCompra() {
    const sel = document.getElementById('producto-compra');
    sel.innerHTML = '<option value="">Seleccionar producto...</option>';
    productos.forEach(p => {
        const opt = document.createElement('option');
        opt.value           = p.id;
        opt.dataset.precio  = p.precio_compra;
        opt.textContent     = `${p.nombre} — Stock: ${p.cantidad}`;
        sel.appendChild(opt);
    });

    document.getElementById('cantidad-compra').value        = '';
    document.getElementById('precio-compra-display').value  = '';
    document.getElementById('modal-compra').style.display   = 'flex';

    // Autocompletar precio al seleccionar producto
    sel.onchange = () => {
        const opt = sel.options[sel.selectedIndex];
        const precio = opt ? parseFloat(opt.dataset.precio) || 0 : 0;
        document.getElementById('precio-compra-display').value = precio ? `$${precio.toFixed(2)}` : '';
    };
}

function cerrarModalCompra() {
    document.getElementById('modal-compra').style.display = 'none';
}

async function guardarCompra() {
    const productoId = parseInt(document.getElementById('producto-compra').value);
    const cantidad   = parseInt(document.getElementById('cantidad-compra').value);

    if (!productoId)               return alert('❌ Seleccione un producto');
    if (!cantidad || cantidad < 1) return alert('❌ Cantidad inválida');

    const res = await window.electronAPI.guardarCompra({ productoId, cantidad });
    if (res.ok) {
        await cargarCompras();
        cerrarModalCompra();
        alert('✅ Compra registrada');
    } else {
        alert('❌ ' + res.error);
    }
}

async function completarCompra(id) {
    if (!confirm('✅ ¿Confirmar compra? Se sumará al stock.')) return;
    const res = await window.electronAPI.completarCompra({ id });
    if (res.ok) { await cargarCompras(); alert('✅ Stock actualizado'); }
    else alert('❌ ' + res.error);
}

async function cancelarCompra(id) {
    if (!confirm('¿Cancelar esta compra?')) return;
    const res = await window.electronAPI.cancelarCompra({ id });
    if (res.ok) await cargarCompras();
    else alert('❌ ' + res.error);
}

async function eliminarCompra(id) {
    if (!confirm('¿Eliminar esta compra?')) return;
    const res = await window.electronAPI.eliminarCompra({ id });
    if (res.ok) await cargarCompras();
    else alert('❌ ' + res.error);
}

function verDetalleCompra(id) {
    const c = compras.find(c => c.id === id);
    if (!c) return;
    document.getElementById('detalles-contenido-compra').innerHTML = `
        <p><strong>ID:</strong> #${c.id}</p>
        <p><strong>Fecha:</strong> ${new Date(c.fecha).toLocaleString('es-MX')}</p>
        <p><strong>Producto:</strong> ${c.producto_nombre}</p>
        <p><strong>Cantidad:</strong> ${c.cantidad}</p>
        <p><strong>Precio Unitario:</strong> $${c.precio_unitario.toFixed(2)}</p>
        <p><strong>Total:</strong> $${(c.cantidad * c.precio_unitario).toFixed(2)}</p>
        <p><strong>Estado:</strong> ${c.estado}</p>
    `;
    document.getElementById('modal-detalles-compra').style.display = 'flex';
}

function cerrarModalDetallesCompra() {
    document.getElementById('modal-detalles-compra').style.display = 'none';
}

function buscarCompras() {
    const q = document.getElementById('buscarCompra').value.toLowerCase().trim();
    if (!q) return renderizarCompras(compras);
    renderizarCompras(compras.filter(c =>
        c.producto_nombre.toLowerCase().includes(q) ||
        c.estado.toLowerCase().includes(q)
    ));
}

document.addEventListener('DOMContentLoaded', () => {
    cargarCompras();
    document.getElementById('buscarCompra')?.addEventListener('input', buscarCompras);
    document.getElementById('modal-compra')?.addEventListener('click', e => {
        if (e.target.id === 'modal-compra') cerrarModalCompra();
    });
});

window.abrirModalCompra          = abrirModalCompra;
window.cerrarModalCompra         = cerrarModalCompra;
window.guardarCompra             = guardarCompra;
window.filtrarCompras            = filtrarCompras;
window.verDetalleCompra          = verDetalleCompra;
window.cerrarModalDetallesCompra = cerrarModalDetallesCompra;
window.completarCompra           = completarCompra;
window.cancelarCompra            = cancelarCompra;
window.eliminarCompra            = eliminarCompra;