// compras.js
let compras = [];
let productos = [];

// Cargar datos al iniciar
async function cargarCompras() {
    try {
        // Cargar productos desde SQLite (si existe) o desde localStorage
        if (window.electronAPI && window.electronAPI.obtenerProductos) {
            const res = await window.electronAPI.obtenerProductos();
            if (res && res.ok) {
                productos = res.data;
            } else {
                // Si no hay conexión con SQLite, intentar cargar desde localStorage
                const productosGuardados = localStorage.getItem("productos");
                if (productosGuardados) {
                    productos = JSON.parse(productosGuardados);
                } else {
                    productos = [];
                }
            }
        } else {
            // Si no hay electronAPI, cargar desde localStorage
            const productosGuardados = localStorage.getItem("productos");
            if (productosGuardados) {
                productos = JSON.parse(productosGuardados);
            } else {
                productos = [];
            }
        }
        
        // Cargar compras desde localStorage
        const comprasGuardadas = localStorage.getItem("compras");
        if (comprasGuardadas) {
            compras = JSON.parse(comprasGuardadas);
        } else {
            compras = [];
            localStorage.setItem("compras", JSON.stringify(compras));
        }
        
        renderizarCompras(compras);
        
    } catch (error) {
        console.error("Error al cargar datos:", error);
        document.getElementById('tablaCompras').innerHTML = `
            <tr>
                <td colspan="9" style="text-align:center;padding:30px;color:#ef4444;">
                    ❌ Error al cargar los datos
                </td>
            </tr>
        `;
    }
}

// Renderizar compras en la tabla
function renderizarCompras(datos) {
    const tbody = document.getElementById('tablaCompras');
    
    if (!datos || datos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align:center;padding:30px;color:#94a3b8;">
                    📭 No hay compras registradas
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = datos.map(compra => {
        const estadoClass = compra.estado.toLowerCase();
        const fecha = new Date(compra.fecha);
        const fechaFormateada = fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const total = compra.cantidad * compra.precioUnitario;
        
        const iconos = {
            'Pendiente': '⏳',
            'Completada': '✅',
            'Cancelada': '❌'
        };
        
        return `
            <tr>
                <td>#${compra.id}</td>
                <td>${fechaFormateada}</td>
                <td>${compra.proveedor}</td>
                <td>${compra.producto}</td>
                <td>${compra.cantidad}</td>
                <td>$${compra.precioUnitario.toFixed(2)}</td>
                <td><strong>$${total.toFixed(2)}</strong></td>
                <td>
                    <span class="badge ${estadoClass}">${iconos[compra.estado] || ''} ${compra.estado}</span>
                </td>
                <td>
                    <button onclick="verDetalleCompra(${compra.id})" class="btn-accion btn-ver" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${compra.estado === 'Pendiente' ? `
                        <button onclick="completarCompra(${compra.id})" class="btn-accion btn-completar" title="Completar">
                            <i class="fas fa-check"></i>
                        </button>
                        <button onclick="cancelarCompra(${compra.id})" class="btn-accion btn-cancelar-accion" title="Cancelar">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                    <button onclick="eliminarCompra(${compra.id})" class="btn-accion btn-eliminar" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Filtrar compras por estado
function filtrarCompras(estado, boton) {
    document.querySelectorAll('.filtros button').forEach(btn => {
        btn.classList.remove('activo');
    });
    if (boton) boton.classList.add('activo');

    let filtrados;
    if (estado === 'Todos') {
        filtrados = compras;
    } else {
        filtrados = compras.filter(c => c.estado === estado);
    }
    
    renderizarCompras(filtrados);
}

// Abrir modal para nueva compra
function abrirModalCompra() {
    const selectProducto = document.getElementById('producto-compra');
    if (selectProducto) {
        selectProducto.innerHTML = '<option value="">Seleccionar producto...</option>';
        if (productos && productos.length > 0) {
            productos.forEach(prod => {
                const option = document.createElement('option');
                option.value = prod.id;
                option.textContent = `${prod.nombre} - Stock: ${prod.cantidad}`;
                selectProducto.appendChild(option);
            });
        }
    }
    
    document.getElementById('modal-compra').style.display = 'flex';
    document.getElementById('proveedor').value = '';
    document.getElementById('cantidad-compra').value = '';
    document.getElementById('precio-unitario-compra').value = '';
}

// Cerrar modal de compra
function cerrarModalCompra() {
    document.getElementById('modal-compra').style.display = 'none';
}

// Guardar nueva compra
async function guardarCompra() {
    const proveedor = document.getElementById('proveedor').value;
    const productoId = document.getElementById('producto-compra').value;
    const cantidad = parseInt(document.getElementById('cantidad-compra').value);
    const precioUnitario = parseFloat(document.getElementById('precio-unitario-compra').value);

    // Validaciones
    if (!proveedor) {
        alert('❌ Por favor selecciona un proveedor');
        return;
    }
    if (!productoId) {
        alert('❌ Por favor selecciona un producto');
        return;
    }
    if (!cantidad || cantidad < 1) {
        alert('❌ Por favor ingresa una cantidad válida');
        return;
    }
    if (!precioUnitario || precioUnitario <= 0) {
        alert('❌ Por favor ingresa un precio unitario válido');
        return;
    }

    const producto = productos.find(p => p.id == productoId);
    if (!producto) {
        alert('❌ Producto no encontrado');
        return;
    }

    const nuevaCompra = {
        id: Date.now(),
        fecha: new Date().toISOString(),
        proveedor: proveedor,
        productoId: producto.id,
        producto: producto.nombre,
        cantidad: cantidad,
        precioUnitario: precioUnitario,
        notas: '',
        estado: 'Pendiente'
    };

    compras.unshift(nuevaCompra);
    localStorage.setItem('compras', JSON.stringify(compras));

    renderizarCompras(compras);
    cerrarModalCompra();
    alert('✅ Compra registrada correctamente');
}

// Completar compra (agrega al stock)
async function completarCompra(id) {
    if (!confirm('✅ ¿Confirmar esta compra? Se agregará al stock.')) return;
    
    const compra = compras.find(c => c.id === id);
    if (!compra) return;
    
    compra.estado = 'Completada';
    localStorage.setItem('compras', JSON.stringify(compras));
    
    // Actualizar stock del producto
    const producto = productos.find(p => p.id == compra.productoId);
    if (producto) {
        producto.cantidad = (producto.cantidad || 0) + compra.cantidad;
        
        // Si hay conexión con SQLite, actualizar también allí
        try {
            if (window.electronAPI && window.electronAPI.actualizarProducto) {
                await window.electronAPI.actualizarProducto({
                    id: producto.id,
                    cantidad: producto.cantidad
                });
            }
        } catch (error) {
            console.error('Error al actualizar stock:', error);
        }
        
        // Guardar productos actualizados en localStorage
        localStorage.setItem('productos', JSON.stringify(productos));
    }
    
    renderizarCompras(compras);
    alert('✅ Compra completada y stock actualizado');
}

// Cancelar compra
function cancelarCompra(id) {
    if (!confirm('⚠️ ¿Cancelar esta compra?')) return;
    
    const compra = compras.find(c => c.id === id);
    if (!compra) return;
    
    compra.estado = 'Cancelada';
    localStorage.setItem('compras', JSON.stringify(compras));
    
    renderizarCompras(compras);
    alert('❌ Compra cancelada');
}

// Ver detalles de compra
function verDetalleCompra(id) {
    const compra = compras.find(c => c.id === id);
    if (!compra) return;
    
    const fecha = new Date(compra.fecha);
    const fechaFormateada = fecha.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const total = compra.cantidad * compra.precioUnitario;
    
    const contenido = document.getElementById('detalles-contenido-compra');
    contenido.innerHTML = `
        <p><strong>ID Compra:</strong> #${compra.id}</p>
        <p><strong>Fecha:</strong> ${fechaFormateada}</p>
        <p><strong>Proveedor:</strong> ${compra.proveedor}</p>
        <p><strong>Producto:</strong> ${compra.producto}</p>
        <p><strong>Cantidad:</strong> ${compra.cantidad}</p>
        <p><strong>Precio Unitario:</strong> $${compra.precioUnitario.toFixed(2)}</p>
        <p><strong>Total:</strong> $${total.toFixed(2)}</p>
        <p><strong>Estado:</strong> ${compra.estado}</p>
        ${compra.notas ? `<p><strong>Notas:</strong> ${compra.notas}</p>` : ''}
    `;
    
    document.getElementById('modal-detalles-compra').style.display = 'flex';
}

// Cerrar modal de detalles
function cerrarModalDetallesCompra() {
    document.getElementById('modal-detalles-compra').style.display = 'none';
}

// Eliminar compra
function eliminarCompra(id) {
    if (!confirm('⚠️ ¿Estás seguro de eliminar esta compra?')) return;
    
    compras = compras.filter(c => c.id !== id);
    localStorage.setItem('compras', JSON.stringify(compras));
    
    renderizarCompras(compras);
    alert('🗑️ Compra eliminada');
}

// Buscar compras
function buscarCompras() {
    const busqueda = document.getElementById('buscarCompra').value.toLowerCase().trim();
    
    if (!busqueda) {
        renderizarCompras(compras);
        return;
    }
    
    const filtrados = compras.filter(c => 
        c.proveedor.toLowerCase().includes(busqueda) ||
        c.producto.toLowerCase().includes(busqueda) ||
        c.estado.toLowerCase().includes(busqueda)
    );
    
    renderizarCompras(filtrados);
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    cargarCompras();
    
    const buscador = document.getElementById('buscarCompra');
    if (buscador) {
        buscador.addEventListener('input', buscarCompras);
    }
});

// Hacer funciones globales
window.abrirModalCompra = abrirModalCompra;
window.cerrarModalCompra = cerrarModalCompra;
window.guardarCompra = guardarCompra;
window.filtrarCompras = filtrarCompras;
window.verDetalleCompra = verDetalleCompra;
window.cerrarModalDetallesCompra = cerrarModalDetallesCompra;
window.completarCompra = completarCompra;
window.cancelarCompra = cancelarCompra;
window.eliminarCompra = eliminarCompra;
window.buscarCompras = buscarCompras;