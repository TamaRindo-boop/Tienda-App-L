const modal    = document.getElementById('modal-producto');
const tbody    = document.getElementById('tabla-body');
const buscador = document.getElementById('buscador');

let todosLosProductos = [];

// ── Cargar menú ──────────────────────────────────────────────
fetch('menu.html')
    .then(r => r.text())
    .then(html => {
        document.getElementById('menu-container').innerHTML = html;

        const links = document.querySelectorAll('.sidebar nav a');
        links.forEach(a => a.classList.remove('active'));
        const linkProductos = [...links].find(a => a.href.includes('productos.html'));
        if (linkProductos) linkProductos.classList.add('active');

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
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:red;">Error: ${res.error}</td></tr>`;
        return;
    }
    todosLosProductos = res.data;
    renderTabla(todosLosProductos);
}

function renderTabla(lista) {
    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;color:#94a3b8;">Sin productos registrados.</td></tr>`;
        return;
    }
    tbody.innerHTML = lista.map(p => `
        <tr>
            <td>${p.id}</td>
            <td>${p.nombre}</td>
            <td>$${p.precio_compra.toFixed(2)}</td>
            <td>$${p.precio_venta.toFixed(2)}</td>
            <td>
                <div style="display:flex;align-items:center;gap:6px;">
                    <button onclick="cambiarCantidad(${p.id}, ${p.cantidad}, -1)"
                        style="width:26px;height:26px;cursor:pointer;border:1px solid #ccc;border-radius:4px;background:white;font-size:14px;">-</button>
                    <span id="cant-${p.id}" style="min-width:24px;text-align:center;">${p.cantidad}</span>
                    <button onclick="cambiarCantidad(${p.id}, ${p.cantidad}, 1)"
                        style="width:26px;height:26px;cursor:pointer;border:1px solid #ccc;border-radius:4px;background:white;font-size:14px;">+</button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function cambiarCantidad(id, cantidadActual, delta) {
    const nueva = cantidadActual + delta;
    if (nueva < 0) return;

    const res = await window.electronAPI.actualizarCantidad({ id, cantidad: nueva });
    if (res.ok) {
        // Actualiza en memoria y en pantalla sin recargar todo
        const prod = todosLosProductos.find(p => p.id === id);
        if (prod) prod.cantidad = nueva;
        const span = document.getElementById(`cant-${id}`);
        if (span) span.textContent = nueva;
        // Actualiza también los botones con la nueva cantidad
        const btns = span.parentElement.querySelectorAll('button');
        btns[0].setAttribute('onclick', `cambiarCantidad(${id}, ${nueva}, -1)`);
        btns[1].setAttribute('onclick', `cambiarCantidad(${id}, ${nueva}, 1)`);
    }
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
    document.getElementById('prod-msg').style.display = 'none';
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
        msg.textContent   = `Guardado (ID: ${res.id})`;
        msg.style.color   = 'green';
        msg.style.display = 'block';
        setTimeout(() => {
            modal.style.display = 'none';
            cargarProductos();
        }, 900);
    } else {
        msg.textContent   = 'Error: ' + res.error;
        msg.style.color   = 'red';
        msg.style.display = 'block';
    }
});

// ── Init ─────────────────────────────────────────────────────
cargarProductos();