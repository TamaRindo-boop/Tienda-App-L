let ventas = [];
let productos = [];

// 1. Agregamos async aquí para poder esperar por la base de datos
async function cargarDatos() {
    // Cargar ventas desde localStorage (Por ahora se quedan aquí)
    const ventasGuardadas = localStorage.getItem("ventas");
    if (ventasGuardadas) {
        ventas = JSON.parse(ventasGuardadas);
    } else {
        ventas = [];
        localStorage.setItem("ventas", JSON.stringify(ventas));
    }

    // Corregido: Llamamos correctamente al puente de Electron usando await
    try {
        const res = await window.electronAPI.obtenerProductos();
        if (res && res.ok) {
            productos = res.data;
        }
    } catch (error) {
        console.error("Error al cargar productos desde SQLite:", error);
    }
    
    // Ahora sí ejecutamos el render seguro de que ya tenemos los datos
    renderizarVentas();
    actualizarResumen();
}

function abrirModalVenta() {
    const selectProducto = document.getElementById("producto-select");
    selectProducto.innerHTML = '<option value="">Seleccionar producto...</option>';
    
    productos.forEach(prod => {
        selectProducto.innerHTML += `<option value="${prod.id}" data-precio="${prod.precio_venta}" data-stock="${prod.cantidad}">${prod.nombre} - Stock: ${prod.cantidad} - $${prod.precio_venta}</option>`;
    });

    document.getElementById("cliente").value = "";
    document.getElementById("cantidad-venta").value = "1";
    document.getElementById("precio-unitario").value = "";
    document.getElementById("subtotal").value = "";
    document.getElementById("metodo-pago").value = "Efectivo";
    
    document.getElementById("modal-venta").style.display = "flex";
    
    const cantidadInput = document.getElementById("cantidad-venta");
    const productoSelect = document.getElementById("producto-select");
    
    const calcularSubtotal = () => {
        const selectedOption = productoSelect.options[productoSelect.selectedIndex];
        const precio = selectedOption ? parseFloat(selectedOption.dataset.precio) : 0;
        const cantidad = parseInt(cantidadInput.value) || 0;
        const subtotal = precio * cantidad;
        
        document.getElementById("precio-unitario").value = precio ? `$${precio.toFixed(2)}` : "";
        document.getElementById("subtotal").value = subtotal ? `$${subtotal.toFixed(2)}` : "";
    };
    
    productoSelect.onchange = calcularSubtotal;
    cantidadInput.oninput = calcularSubtotal;
}

function cerrarModalVenta() {
    document.getElementById("modal-venta").style.display = "none";
}

// 2. Volvemos esta función async para cuando conectes la actualización del stock a la DB
async function guardarVenta() {
    const cliente = document.getElementById("cliente").value.trim();
    const productoSelect = document.getElementById("producto-select");
    const productoId = productoSelect.value;
    const productoNombre = productoSelect.options[productoSelect.selectedIndex]?.text.split(" - ")[0];
    const cantidad = parseInt(document.getElementById("cantidad-venta").value);
    const precioUnitario = parseFloat(document.getElementById("precio-unitario").value.replace("$", ""));
    const metodoPago = document.getElementById("metodo-pago").value;

    if (!cliente) {
        alert("❌ Ingrese el nombre del cliente");
        return;
    }
    if (!productoId) {
        alert("❌ Seleccione un producto");
        return;
    }
    if (!cantidad || cantidad <= 0) {
        alert("❌ Ingrese una cantidad válida");
        return;
    }

    const producto = productos.find(p => p.id == productoId);
    if (!producto || producto.cantidad < cantidad) {
        alert(`❌ Stock insuficiente. Disponible: ${producto?.cantidad || 0}`);
        return;
    }

    const total = precioUnitario * cantidad;
    
    const nuevaVenta = {
        id: Date.now(),
        fecha: new Date().toLocaleString(),
        cliente: cliente,
        productoId: productoId,
        producto: productoNombre,
        cantidad: cantidad,
        precioUnitario: precioUnitario,
        total: total,
        metodoPago: metodoPago,
        estado: "Pagado"
    };
    
    ventas.unshift(nuevaVenta);
    
    // Descuento local para la sesión actual
    producto.cantidad -= cantidad;
    const indexProducto = productos.findIndex(p => p.id == productoId);
    productos[indexProducto] = producto;

    // 💡 NOTA: Aquí deberías mandar el nuevo stock a SQLite a través de tu IPC, ejemplo:
    // await window.electronAPI.actualizarStock(productoId, producto.cantidad);
    
    localStorage.setItem("ventas", JSON.stringify(ventas));
    
    renderizarVentas();
    actualizarResumen();
    cerrarModalVenta();
    alert("✅ Venta registrada correctamente");
}

function verDetalleVenta(id) {
    // Corregido: Aseguramos la comparación transformando a número
    const venta = ventas.find(v => v.id === Number(id));
    if (!venta) return;
    
    const contenido = document.getElementById("detalles-contenido");
    contenido.innerHTML = `
        <p><strong>ID Venta:</strong> ${venta.id}</p>
        <p><strong>Fecha:</strong> ${venta.fecha}</p>
        <p><strong>Cliente:</strong> ${venta.cliente}</p>
        <p><strong>Producto:</strong> ${venta.producto}</p>
        <p><strong>Cantidad:</strong> ${venta.cantidad}</p>
        <p><strong>Precio Unitario:</strong> $${venta.precioUnitario.toFixed(2)}</p>
        <p><strong>Total:</strong> $${venta.total.toFixed(2)}</p>
        <p><strong>Método de Pago:</strong> ${venta.metodoPago}</p>
        <p><strong>Estado:</strong> ${venta.estado}</p>
    `;
    
    document.getElementById("modal-detalles").style.display = "flex";
}

function cerrarModalDetalles() {
    document.getElementById("modal-detalles").style.display = "none";
}

function anularVenta(id) {
    if (!confirm("¿Anular esta venta? Esto no revertirá el stock automáticamente.")) return;
    
    // Corregido: Forzamos que coincidan los tipos de datos (Number)
    const index = ventas.findIndex(v => v.id === Number(id));
    if (index !== -1) {
        ventas[index].estado = "Anulado";
        localStorage.setItem("ventas", JSON.stringify(ventas));
        renderizarVentas();
        actualizarResumen();
        alert("✅ Venta anulada");
    }
}

function renderizarVentas() {
    const tbody = document.getElementById("tabla-ventas");
    const buscador = document.getElementById("buscador-ventas");
    const busqueda = buscador ? buscador.value.toLowerCase() : "";
    
    let ventasFiltradas = ventas;
    if (busqueda) {
        ventasFiltradas = ventas.filter(v => 
            v.cliente.toLowerCase().includes(busqueda) || 
            v.producto.toLowerCase().includes(busqueda)
        );
    }
    
    if (ventasFiltradas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:30px;color:#94a3b8;">🛒 No hay ventas registradas</td></tr>`;
        return;
    }
    
    tbody.innerHTML = "";
    ventasFiltradas.forEach(venta => {
        // Estilo visual dinámico por si la venta está anulada
        const esAnulada = venta.estado === "Anulado";
        const estiloFila = esAnulada ? 'style="text-decoration: line-through; color: #94a3b8;"' : '';

        tbody.innerHTML += `
            <tr ${estiloFila}>
                <td>${venta.id}</td>
                <td>${venta.fecha}</td>
                <td>${venta.cliente}</td>
                <td>${venta.producto}</td>
                <td>${venta.cantidad}</td>
                <td>$${venta.precioUnitario.toFixed(2)}</td>
                <td>$${venta.total.toFixed(2)}</td>
                <td>${venta.metodoPago}</td>
                <td>
                    <button class="btn-ver-detalle" onclick="verDetalleVenta(${venta.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${!esAnulada ? `
                    <button class="btn-anular" onclick="anularVenta(${venta.id})">
                        <i class="fas fa-ban"></i>
                    </button>` : ''}
                </td>
            </tr>
        `;
    });
}

function actualizarResumen() {
    const totalVentas = ventas.filter(v => v.estado === "Pagado").reduce((sum, v) => sum + v.total, 0);
    const totalTransacciones = ventas.filter(v => v.estado === "Pagado").length;
    
    const hoy = new Date().toLocaleDateString();
    const ventasHoy = ventas.filter(v => {
        const fechaVenta = new Date(v.fecha).toLocaleDateString();
        return fechaVenta === hoy && v.estado === "Pagado";
    }).reduce((sum, v) => sum + v.total, 0);
    
    document.getElementById("total-ventas").textContent = `$${totalVentas.toFixed(2)}`;
    document.getElementById("total-transacciones").textContent = totalTransacciones;
    document.getElementById("ventas-hoy").textContent = `$${ventasHoy.toFixed(2)}`;
}

// Inicializador de eventos en el DOM
document.addEventListener("DOMContentLoaded", () => {
    cargarDatos();
    
    const buscador = document.getElementById("buscador-ventas");
    if (buscador) {
        buscador.addEventListener("input", () => renderizarVentas());
    }
});

window.onclick = function(event) {
    const modalVenta = document.getElementById("modal-venta");
    const modalDetalles = document.getElementById("modal-detalles");
    if (event.target === modalVenta) cerrarModalVenta();
    if (event.target === modalDetalles) cerrarModalDetalles();
}


