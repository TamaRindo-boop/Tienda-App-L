// configuracion.js

// Cambiar pestaña
function cambiarTabConfig(tab, boton) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    if (boton) boton.classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
}

// Guardar configuración
function guardarConfiguracion() {
    // Aquí se guardarían todos los valores en localStorage
    const config = {
        tienda: {
            nombre: document.getElementById('tienda-nombre').value,
            telefono: document.getElementById('tienda-telefono').value,
            email: document.getElementById('tienda-email').value,
            direccion: document.getElementById('tienda-direccion').value,
            horario: document.getElementById('tienda-horario').value
        },
        impuestos: {
            tasa: document.getElementById('tasa-iva').value,
            incluir: document.getElementById('incluir-impuesto').checked,
            redondear: document.getElementById('redondear-precios').checked
        },
        moneda: {
            simbolo: document.getElementById('simbolo-moneda').value,
            posicion: document.getElementById('posicion-moneda').value,
            decimales: document.getElementById('decimales-moneda').value
        }
    };
    
    localStorage.setItem('configuracion', JSON.stringify(config));
    alert('✅ Configuración guardada correctamente');
}

// Cambiar tema
function seleccionarTema(tema, boton) {
    document.querySelectorAll('.theme-option').forEach(btn => btn.classList.remove('active'));
    if (boton) boton.classList.add('active');
    
    if (tema === 'oscuro') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

// Seleccionar color
function seleccionarColor(color, boton) {
    document.querySelectorAll('.color-option').forEach(btn => btn.classList.remove('active'));
    if (boton) boton.classList.add('active');
    
    document.documentElement.style.setProperty('--primary-color', color);
}
