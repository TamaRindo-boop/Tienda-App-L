const modal    = document.getElementById('modal-producto');
const tbody    = document.getElementById('tabla-body');
const buscador = document.getElementById('buscador');

let todosLosProductos = [];

// ── Cargar tabla ─────────────────────────────────────────────
async function cargarProductos() {
    const res = await window.electronAPI.obtenerProductos();
    if (!res.ok) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:red;">Error: ${res.error}</td></tr>`;
        return;
    }
    todosLosProductos = res.data;
    renderTabla(todosLosProductos);
}

function renderTabla(lista) {
    if (!lista.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:30px;color:#94a3b8;">Sin productos registrados.</td></tr>`;
        return;
    }
    tbody.innerHTML = lista.map(p => {
        const stockStyle = p.cantidad <= 5 ? 'color:#dc2626;font-weight:700;' : '';
        return `
        <tr>
            <td>${p.id}</td>
            <td>${p.nombre}</td>
            <td>$${p.precio_compra.toFixed(2)}</td>
            <td>$${p.precio_venta.toFixed(2)}</td>
            <td style="${stockStyle}">${p.cantidad}</td>
        </tr>`;
    }).join('');
}

// ── Buscador ─────────────────────────────────────────────────
buscador.addEventListener('input', () => {
    const q = buscador.value.toLowerCase();
    renderTabla(todosLosProductos.filter(p => p.nombre.toLowerCase().includes(q)));
});

// ── Modal ────────────────────────────────────────────────────
function abrirModal() {
    document.getElementById('prod-nombre').value        = '';
    document.getElementById('prod-precio-compra').value = '';
    document.getElementById('prod-precio-venta').value  = '';
    document.getElementById('prod-cantidad').value      = '0';
    document.getElementById('prod-msg').style.display   = 'none';
    modal.style.display = 'flex';
}

document.getElementById('btn-nuevo-top').addEventListener('click', abrirModal);
document.getElementById('btn-cancelar').addEventListener('click', () => modal.style.display = 'none');
modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

document.getElementById('btn-mas').addEventListener('click', () => {
    const input = document.getElementById('prod-cantidad');
    input.value = (parseInt(input.value) || 0) + 1;
});

document.getElementById('btn-menos').addEventListener('click', () => {
    const input = document.getElementById('prod-cantidad');
    const val = (parseInt(input.value) || 0) - 1;
    input.value = val < 0 ? 0 : val;
});

document.getElementById('btn-guardar').addEventListener('click', async () => {
    const nombre       = document.getElementById('prod-nombre').value.trim();
    const precioCompra = parseFloat(document.getElementById('prod-precio-compra').value);
    const precioVenta  = parseFloat(document.getElementById('prod-precio-venta').value);
    const cantidad     = parseInt(document.getElementById('prod-cantidad').value);
    const msg          = document.getElementById('prod-msg');

    if (!nombre || isNaN(precioCompra) || isNaN(precioVenta) || isNaN(cantidad)) {
        msg.textContent   = 'Completa todos los campos correctamente.';
        msg.style.color   = 'red';
        msg.style.display = 'block';
        return;
    }

    const res = await window.electronAPI.guardarProducto({ nombre, precioCompra, precioVenta, cantidad });

    if (res.ok) {
        msg.textContent   = `✅ Guardado correctamente`;
        msg.style.color   = 'green';
        msg.style.display = 'block';
        setTimeout(() => {
            modal.style.display = 'none';
            cargarProductos();
        }, 800);
    } else {
        msg.textContent   = 'Error: ' + res.error;
        msg.style.color   = 'red';
        msg.style.display = 'block';
    }
});

// Exponer para que menu.js lo llame con el "+"
window.abrirModal = abrirModal;

// ── Init ─────────────────────────────────────────────────────
cargarProductos();

// Abrir modal si viene desde el menú con ?action=nuevo
if (new URLSearchParams(window.location.search).get('action') === 'nuevo') {
    window.addEventListener('load', abrirModal);
}