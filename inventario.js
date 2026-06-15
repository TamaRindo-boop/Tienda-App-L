let movimientos = [];
let filtroActual = "Todos";
let editandoIndex = null;

// Cargar datos al iniciar
cargarMovimientos();

function cargarMovimientos() {
    const guardados = localStorage.getItem("movimientos");
    if (guardados) {
        movimientos = JSON.parse(guardados);
    } else {
        // Comenzar con array vacío (sin datos de ejemplo)
        movimientos = [];
        localStorage.setItem("movimientos", JSON.stringify(movimientos));
    }
    renderizar();
}

function abrirModal() {
    editandoIndex = null;
    document.getElementById("modalTitulo").textContent = "Nuevo Movimiento";
    document.getElementById("producto").value = "";
    document.getElementById("cantidad").value = "";
    document.getElementById("referencia").value = "";
    document.getElementById("tipo").value = "Entrada";
    
    const modal = document.getElementById("modal");
    modal.style.display = "flex";
}

function abrirModalEditar(index) {
    let datos = filtroActual === "Todos"
        ? movimientos
        : movimientos.filter(m => m.tipo === filtroActual);

    let movimiento = datos[index];
    let indexReal = movimientos.indexOf(movimiento);

    if (indexReal === -1) return;

    editandoIndex = indexReal;

    document.getElementById("modalTitulo").textContent = "Editar Movimiento";
    document.getElementById("producto").value = movimiento.producto;
    document.getElementById("cantidad").value = movimiento.cantidad;
    document.getElementById("referencia").value = movimiento.referencia;
    document.getElementById("tipo").value = movimiento.tipo;
    
    const modal = document.getElementById("modal");
    modal.style.display = "flex";
}

function cerrarModal() {
    const modal = document.getElementById("modal");
    modal.style.display = "none";
    editandoIndex = null;
}

function guardarMovimiento() {
    let producto = document.getElementById("producto").value.trim();
    let tipo = document.getElementById("tipo").value;
    let cantidad = document.getElementById("cantidad").value.trim();
    let referencia = document.getElementById("referencia").value.trim();

    if (producto === "" || cantidad === "" || referencia === "") {
        alert("❌ Completa todos los campos");
        return;
    }

    if (isNaN(cantidad) || parseInt(cantidad) <= 0) {
        alert("❌ La cantidad debe ser un número positivo");
        return;
    }

    if (editandoIndex !== null) {
        // Editar existente
        movimientos[editandoIndex] = {
            ...movimientos[editandoIndex],
            tipo: tipo,
            producto: producto,
            referencia: referencia,
            cantidad: cantidad
        };
        alert("✅ Movimiento actualizado correctamente");
    } else {
        // Nuevo movimiento
        movimientos.unshift({
            fecha: new Date().toLocaleString(),
            tipo: tipo,
            producto: producto,
            referencia: referencia,
            cantidad: cantidad,
            usuario: "Administrador"
        });
        alert("✅ Movimiento agregado correctamente");
    }

    localStorage.setItem("movimientos", JSON.stringify(movimientos));
    renderizar();
    cerrarModal();
}

function eliminarMovimiento(index) {
    let datos = filtroActual === "Todos"
        ? movimientos
        : movimientos.filter(m => m.tipo === filtroActual);

    let movimiento = datos[index];
    let indexReal = movimientos.indexOf(movimiento);

    if (indexReal === -1) return;

    if (confirm(`¿Eliminar movimiento de "${movimiento.producto}"?`)) {
        movimientos.splice(indexReal, 1);
        localStorage.setItem("movimientos", JSON.stringify(movimientos));
        renderizar();
        alert("✅ Movimiento eliminado");
    }
}

function renderizar() {
    let tabla = document.getElementById("tablaMovimientos");
    tabla.innerHTML = "";

    let datos = filtroActual === "Todos"
        ? movimientos
        : movimientos.filter(m => m.tipo === filtroActual);

    if (datos.length === 0) {
        tabla.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding:30px; color:#94a3b8;">
                    📦 No hay movimientos registrados
                </td>
            </tr>`;
        return;
    }

    datos.forEach((m, index) => {
        let claseTipo = m.tipo === "Entrada" ? "entrada"
                      : m.tipo === "Salida"  ? "salida"
                      : "ajuste";

        let cantidadClase = m.tipo === "Entrada" ? "cantidad-entrada"
                          : m.tipo === "Salida"  ? "cantidad-salida"
                          : "";

        let simbolo = m.tipo === "Entrada" ? "+"
                    : m.tipo === "Salida"  ? "-"
                    : "";

        tabla.innerHTML += `
            <tr>
                <td>${m.fecha}</td>
                <td><span class="tipo ${claseTipo}">${m.tipo}</span></td>
                <td>${m.producto}</td>
                <td>${m.referencia}</td>
                <td class="${cantidadClase}">${simbolo}${m.cantidad}</td>
                <td>${m.usuario}</td>
                <td>
                    <div class="acciones-tabla">
                        <button class="btn-editar" onclick="abrirModalEditar(${index})">
                            <i class="fas fa-pen"></i>
                        </button>
                        <button class="btn-eliminar" onclick="eliminarMovimiento(${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
    });
}

function filtrar(tipo, btn) {
    filtroActual = tipo;
    document.querySelectorAll(".filtros button")
        .forEach(b => b.classList.remove("activo"));
    btn.classList.add("activo");
    renderizar();
}

// Cerrar modal si se hace clic fuera
window.onclick = function(event) {
    const modal = document.getElementById("modal");
    if (event.target === modal) {
        cerrarModal();
    }
}