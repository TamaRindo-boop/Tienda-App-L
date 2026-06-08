const modal  = document.getElementById('modal-producto');
const tbody  = document.getElementById('tabla-body');
const buscador = document.getElementById('buscador');

let todosLosProductos = [];

// ── Cargar menú ──────────────────────────────────────────────
fetch('menu.html')
    .then(r => r.text())
    .then(html => {
        document.getElementById('menu-container').innerHTML = html;

        // Marcar Productos como activo
        const links = document.querySelectorAll('.sidebar nav a');
        links.forEach(a => a.classList.remove('active'));
        const linkProductos = [...links].find(a => a.href.includes('productos.html'));
        if (linkProductos) linkProductos.classList.add('active');

        // Botón + del menú
        const btnMenu = document.getElementById('btn-nuevo-producto');
        if (btnMenu) btnMenu.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            abrirModal();
        });
    });

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
    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:30px;color:#94a3b8;">Sin productos registrados.</td></tr>`;
        return;
    }
    tbody.innerHTML = lista.map(p => `
        <tr>
            <td>${p.id}</td>
            <td>${p.nombre}</td>
            <td>$${p.precio_compra.toFixed(2)}</td>
            <td>$${p.precio_venta.toFixed(2)}</td>
            <td>${p.cantidad}</td>
        </tr>
    `).join('');
}

// ── Buscador ─────────────────────────────────────────────────
buscador.addEventListener('input', () => {
    const q = buscador.value.toLowerCase();
    const filtrados = todosLosProductos.filter(p => p.nombre.toLowerCase().includes(q));
    renderTabla(filtrados);
});

// ── Modal ────────────────────────────────────────────────────
function abrirModal() {
    ['prod-nombre','prod-precio-compra','prod-precio-venta','prod-cantidad']
        .forEach(id => document.getElementById(id).value = '');
    const msg = document.getElementById('prod-msg');
    msg.style.display = 'none';
    modal.style.display = 'flex';
}

document.getElementById('btn-nuevo-top').addEventListener('click', abrirModal);
document.getElementById('btn-cancelar').addEventListener('click', () => modal.style.display = 'none');
modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

document.getElementById('btn-guardar').addEventListener('click', async () => {
    const nombre       = document.getElementById('prod-nombre').value.trim();
    const precioCompra = parseFloat(document.getElementById('prod-precio-compra').value);
    const precioVenta  = parseFloat(document.getElementById('prod-precio-venta').value);
    const cantidad     = parseInt(document.getElementById('prod-cantidad').value);
    const msg          = document.getElementById('prod-msg');

    if (!nombre || isNaN(precioCompra) || isNaN(precioVenta) || isNaN(cantidad)) {
        msg.textContent    = 'Completa todos los campos correctamente.';
        msg.style.color    = 'red';
        msg.style.display  = 'block';
        return;
    }

    const res = await window.electronAPI.guardarProducto({ nombre, precioCompra, precioVenta, cantidad });

    if (res.ok) {
        msg.textContent   = `Guardado (ID: ${res.id})`;
        msg.style.color   = 'green';
        msg.style.display = 'block';
        setTimeout(() => {
            modal.style.display = 'none';
            cargarProductos(); // refresca la tabla
        }, 900);
    } else {
        msg.textContent   = 'Error: ' + res.error;
        msg.style.color   = 'red';
        msg.style.display = 'block';
    }
});

// ── Init ─────────────────────────────────────────────────────
cargarProductos();