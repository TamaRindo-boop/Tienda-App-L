const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Productos
    obtenerProductos:   ()      => ipcRenderer.invoke('obtener-productos'),
    guardarProducto:    (datos) => ipcRenderer.invoke('guardar-producto', datos),
    actualizarCantidad: (datos) => ipcRenderer.invoke('actualizar-cantidad', datos),

    // Ventas
    obtenerVentas:  ()      => ipcRenderer.invoke('obtener-ventas'),
    guardarVenta:   (datos) => ipcRenderer.invoke('guardar-venta', datos),
    anularVenta:    (datos) => ipcRenderer.invoke('anular-venta', datos),

    // Compras
    obtenerCompras:   ()      => ipcRenderer.invoke('obtener-compras'),
    guardarCompra:    (datos) => ipcRenderer.invoke('guardar-compra', datos),
    completarCompra:  (datos) => ipcRenderer.invoke('completar-compra', datos),
    cancelarCompra:   (datos) => ipcRenderer.invoke('cancelar-compra', datos),
    eliminarCompra:   (datos) => ipcRenderer.invoke('eliminar-compra', datos),

    // Movimientos
    obtenerMovimientos: ()      => ipcRenderer.invoke('obtener-movimientos'),
    guardarMovimiento:  (datos) => ipcRenderer.invoke('guardar-movimiento', datos),
    eliminarMovimiento: (datos) => ipcRenderer.invoke('eliminar-movimiento', datos),
    // Exportar
    exportarPDF: (datos) => ipcRenderer.invoke('exportar-pdf', datos),
    exportarCSV: (datos) => ipcRenderer.invoke('exportar-csv', datos),
});
