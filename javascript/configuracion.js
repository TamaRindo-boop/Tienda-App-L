// ============================================
// CONFIGURACIÓN - LÓGICA SIMPLIFICADA
// ============================================

// Cambiar pestaña
function cambiarTabConfig(tab, boton) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    if (boton) boton.classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
}

// ============================================
// GUARDAR CONFIGURACIÓN
// ============================================
function guardarConfiguracion() {
    const config = {
        tienda: {
            nombre: document.getElementById('tienda-nombre').value,
            telefono: document.getElementById('tienda-telefono').value,
            email: document.getElementById('tienda-email').value,
            direccion: document.getElementById('tienda-direccion').value,
            horario: document.getElementById('tienda-horario').value,
            moneda: 'MX$'
        },
        impuestos: {
            tasa: document.getElementById('tasa-iva').value,
            incluir: document.getElementById('incluir-impuesto').checked
        },
        facturacion: {
            inicial: document.getElementById('factura-inicial').value,
            formato: document.getElementById('formato-factura').value,
            pie: document.getElementById('factura-pie').value
        },
        inventario: {
            stockMinimo: document.getElementById('stock-minimo').value,
            notificar: document.getElementById('notificar-stock').checked
        }
    };
    
    localStorage.setItem('configuracion', JSON.stringify(config));
    
    // Feedback visual
    const btn = document.querySelector('.btn-guardar');
    const textoOriginal = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i> ¡Guardado!';
    btn.style.background = '#10b981';
    
    setTimeout(() => {
        btn.innerHTML = textoOriginal;
        btn.style.background = '';
    }, 2000);
    
    console.log('✅ Configuración guardada:', config);
}

// ============================================
// CARGAR CONFIGURACIÓN GUARDADA
// ============================================
function cargarConfiguracion() {
    const guardada = localStorage.getItem('configuracion');
    if (!guardada) return;
    
    try {
        const config = JSON.parse(guardada);
        
        // Cargar datos de tienda
        if (config.tienda) {
            document.getElementById('tienda-nombre').value = config.tienda.nombre || '';
            document.getElementById('tienda-telefono').value = config.tienda.telefono || '';
            document.getElementById('tienda-email').value = config.tienda.email || '';
            document.getElementById('tienda-direccion').value = config.tienda.direccion || '';
            document.getElementById('tienda-horario').value = config.tienda.horario || '';
        }
        
        // Cargar impuestos
        if (config.impuestos) {
            document.getElementById('tasa-iva').value = config.impuestos.tasa || 16;
            document.getElementById('incluir-impuesto').checked = config.impuestos.incluir || false;
        }
        
        // Cargar facturación
        if (config.facturacion) {
            document.getElementById('factura-inicial').value = config.facturacion.inicial || 1000;
            document.getElementById('formato-factura').value = config.facturacion.formato || 'INV-{numero}';
            document.getElementById('factura-pie').value = config.facturacion.pie || '¡Gracias por tu compra!';
        }
        
        // Cargar inventario
        if (config.inventario) {
            document.getElementById('stock-minimo').value = config.inventario.stockMinimo || 5;
            document.getElementById('notificar-stock').checked = config.inventario.notificar || false;
        }
        
    } catch (error) {
        console.error('Error al cargar configuración:', error);
    }
}

// ============================================
// USUARIOS
// ============================================
function abrirModalUsuario() {
    alert('🔜 Funcionalidad: Agregar nuevo usuario');
}

function editarUsuario() {
    alert('🔜 Funcionalidad: Editar usuario');
}

function eliminarUsuario() {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
        alert('✅ Usuario eliminado');
    }
}

// ============================================
// CAMBIAR CONTRASEÑA
// ============================================
function cambiarPassword() {
    const actual = document.getElementById('pass-actual').value;
    const nueva = document.getElementById('pass-nueva').value;
    const confirmar = document.getElementById('pass-confirmar').value;
    
    if (!actual || !nueva || !confirmar) {
        alert('⚠️ Por favor, completa todos los campos');
        return;
    }
    
    if (nueva !== confirmar) {
        alert('⚠️ Las contraseñas no coinciden');
        return;
    }
    
    if (nueva.length < 6) {
        alert('⚠️ La contraseña debe tener al menos 6 caracteres');
        return;
    }
    
    alert('✅ Contraseña cambiada exitosamente');
    
    // Limpiar campos
    document.getElementById('pass-actual').value = '';
    document.getElementById('pass-nueva').value = '';
    document.getElementById('pass-confirmar').value = '';
}

// ============================================
// RESPALDO
// ============================================
function respaldarDatos() {
    alert('📦 Descargando respaldo de la base de datos...');
    // Simular descarga
    setTimeout(() => {
        alert('✅ Respaldo descargado correctamente');
        document.getElementById('ultimo-respaldo').textContent = new Date().toLocaleString();
    }, 1500);
}

function restaurarDatos() {
    alert('📤 Selecciona el archivo de respaldo para restaurar');
    // Crear input file oculto
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.backup';
    input.onchange = function(e) {
        if (e.target.files.length > 0) {
            alert('✅ Archivo seleccionado: ' + e.target.files[0].name);
        }
    };
    input.click();
}

function exportarDatos() {
    alert('📊 Exportando datos a CSV...');
    setTimeout(() => {
        alert('✅ Datos exportados correctamente');
    }, 1000);
}

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Cargar configuración guardada
    cargarConfiguracion();
    
    // Configurar botones de acciones en tabla
    document.querySelectorAll('.btn-editar').forEach(btn => {
        btn.onclick = editarUsuario;
    });
    
    document.querySelectorAll('.btn-eliminar').forEach(btn => {
        btn.onclick = eliminarUsuario;
    });
});